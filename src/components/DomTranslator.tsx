import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { translateBatch } from "@/lib/translate.functions";

/**
 * DomTranslator walks the rendered DOM and translates visible text nodes
 * to the active language via Google Translate. English and Swedish are
 * served from the static i18n dictionaries and skipped here.
 *
 * Medical terminology stays in English by skipping any element marked
 * with the `data-no-translate` attribute. Form inputs (medications,
 * diagnoses, vaccines etc.) are also skipped — they are user-entered or
 * autocompleted clinical terms.
 */
export function DomTranslator() {
  const { langCode } = useI18n();
  const translateFn = useServerFn(translateBatch);
  const cacheRef = useRef<Map<string, Map<string, string>>>(new Map());
  const originalRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const target = langCode;
    if (target === "en" || target === "sv") {
      // Restore originals when switching back.
      restoreAll(originalRef.current);
      return;
    }

    if (!cacheRef.current.has(target)) cacheRef.current.set(target, new Map());
    const cache = cacheRef.current.get(target)!;

    const SKIP_TAGS = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "CODE",
      "PRE",
      "TEXTAREA",
      "INPUT",
      "SELECT",
      "OPTION",
    ]);

    function shouldSkip(node: Node | null): boolean {
      let el: Element | null =
        node && node.nodeType === Node.ELEMENT_NODE
          ? (node as Element)
          : node?.parentElement ?? null;
      while (el) {
        if (SKIP_TAGS.has(el.tagName)) return true;
        if (el.hasAttribute("data-no-translate")) return true;
        if (el.getAttribute("translate") === "no") return true;
        if (el.getAttribute("contenteditable") === "true") return true;
        el = el.parentElement;
      }
      return false;
    }

    function collect(root: Node, out: Text[]) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const text = n.nodeValue?.trim() ?? "";
          if (!text) return NodeFilter.FILTER_REJECT;
          if (text.length < 2) return NodeFilter.FILTER_REJECT;
          if (!/[A-Za-z]/.test(text)) return NodeFilter.FILTER_REJECT;
          if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let n: Node | null;
      while ((n = walker.nextNode())) out.push(n as Text);
    }

    function apply(nodes: Text[]) {
      const pending: string[] = [];
      const pendingNodes: Text[] = [];
      const pendingKeys: string[] = [];
      for (const n of nodes) {
        const raw = n.nodeValue ?? "";
        const key = raw.trim();
        if (!key) continue;
        if (!originalRef.current.has(n)) originalRef.current.set(n, raw);
        const cached = cache.get(key);
        if (cached !== undefined) {
          if (n.nodeValue !== cached) n.nodeValue = preserveWhitespace(raw, cached);
          continue;
        }
        if (inFlightRef.current.has(`${target}:${key}`)) continue;
        pending.push(key);
        pendingNodes.push(n);
        pendingKeys.push(key);
        inFlightRef.current.add(`${target}:${key}`);
      }
      if (pending.length === 0) return;

      // Batch up to 64 per request to stay well under provider limits.
      const BATCH = 64;
      for (let i = 0; i < pending.length; i += BATCH) {
        const slice = pending.slice(i, i + BATCH);
        const sliceNodes = pendingNodes.slice(i, i + BATCH);
        const sliceKeys = pendingKeys.slice(i, i + BATCH);
        translateFn({ data: { target, texts: slice } })
          .then((res) => {
            if (!res || !res.translations) return;
            res.translations.forEach((t, idx) => {
              const k = sliceKeys[idx];
              cache.set(k, t);
              inFlightRef.current.delete(`${target}:${k}`);
              const node = sliceNodes[idx];
              if (node.isConnected && originalRef.current.get(node)?.trim() === k) {
                node.nodeValue = preserveWhitespace(originalRef.current.get(node) ?? t, t);
              }
            });
          })
          .catch(() => {
            sliceKeys.forEach((k) => inFlightRef.current.delete(`${target}:${k}`));
          });
      }
    }

    function run() {
      const nodes: Text[] = [];
      collect(document.body, nodes);
      apply(nodes);
    }

    run();
    const observer = new MutationObserver((mutations) => {
      const nodes: Text[] = [];
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          if (!shouldSkip(m.target)) nodes.push(m.target as Text);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              if (!shouldSkip(n)) nodes.push(n as Text);
            } else if (n.nodeType === Node.ELEMENT_NODE) {
              collect(n, nodes);
            }
          });
        }
      }
      if (nodes.length) apply(nodes);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [langCode, translateFn]);

  return null;
}

function preserveWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function restoreAll(map: WeakMap<Text, string>) {
  // WeakMap is not iterable; walk the DOM and restore any tracked nodes.
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    const orig = map.get(t);
    if (orig !== undefined && t.nodeValue !== orig) t.nodeValue = orig;
  }
}
