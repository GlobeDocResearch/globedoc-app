/**
 * Generates src/lib/interfaceLabels.generated.ts: fixed English UI text written
 * in the app's own screens (JSX text, labels, placeholders, titles, toasts).
 * Clinical catalog terms (medications, conditions, vaccines, countries, ICD)
 * are removed so record content can never match. Run: bun scripts/extract-interface-labels.ts
 */
import ts from "typescript";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GENDER_IDENTITY_OPTIONS } from "../src/lib/profileIdentity";

const SCAN = ["src/routes", "src/components"];
const SKIP = [/\/api\//, /\/lovable\//, /\.test\./];
const CATALOGS = ["medications", "medicalConditions", "childhoodVaccines", "travelVaccines", "countries", "icd11", "icd11Local", "rxnorm", "boosterIntervals"]
  .map((f) => `src/lib/${f}.ts`);

function walk(d: string, out: string[]) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f) && !SKIP.some((r) => r.test(p))) out.push(p);
  }
  return out;
}
function literals(file: string, onlyUi: boolean, sink: (s: string) => void) {
  const src = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (n: ts.Node) => {
    if (ts.isJsxText(n)) sink(n.text);
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (!onlyUi) sink(n.text);
      else if (isUiString(n)) sink(n.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(src);
}
// Option lists (arrays) hold selectable clinical values that become record content: never included.
function insideArray(n: ts.Node): boolean {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isArrayLiteralExpression(p)) return true;
    if (ts.isFunctionLike(p) || ts.isSourceFile(p)) return false;
  }
  return false;
}
const UI_ATTRS = /^(placeholder|title|aria-label|label|alt|description|helperText|emptyText)$/;
const UI_PROPS = /^(title|label|description|placeholder|message|error|hint|help|subtitle|heading|cta|empty\w*|\w*(Label|Title|Text|Hint|Error|Message))$/;
const UI_CALLS = /^(toast(\.\w+)?|setError|setMessage|new Error|alert|confirm)$/;
function isUiString(n: ts.Node): boolean {
  const p = n.parent;
  if (!p) return false;
  if (ts.isJsxAttribute(p)) return UI_ATTRS.test(p.name.getText());
  if (ts.isJsxExpression(p)) return ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent);
  if (insideArray(n)) return false;
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
    const callee = (ts.isNewExpression(p) ? "new " : "") + p.expression.getText();
    return UI_CALLS.test(callee);
  }
  if (ts.isPropertyAssignment(p) && p.initializer === n) {
    // local per-page dictionaries (e.g. const T = { en: {...} }) and UI-named fields
    return UI_PROPS.test(p.name.getText().replace(/["']/g, "")) || /^(en|sv|copy|strings|text|t|T|labels|COPY|STRINGS|TEXT)$/.test(objectOwner(p));
  }
  if (ts.isConditionalExpression(p) || ts.isBinaryExpression(p)) return isUiString(p);
  return false;
}
function objectOwner(p: ts.Node): string {
  for (let q = p.parent; q; q = q.parent) {
    if (ts.isPropertyAssignment(q) || ts.isVariableDeclaration(q)) return q.name.getText();
    if (ts.isFunctionLike(q)) return "";
  }
  return "";
}
// Dictionary keys that feed answer choices or describe a patient's saved state.
const answerKeys = new Set<string>();
const answerPrefixes = new Set<string>();
const uiKeys = new Set<string>();
function keyOf(n: ts.Node): { key?: string; prefix?: string } {
  // t("key"), t.key, T.key, t[`pre_${x}`]
  if (ts.isCallExpression(n) && /^(t|tr|T|L)$/.test(n.expression.getText()) && n.arguments[0]) {
    const a = n.arguments[0];
    if (ts.isStringLiteral(a)) return { key: a.text };
    if (ts.isTemplateExpression(a)) return { prefix: a.head.text };
  }
  if (ts.isPropertyAccessExpression(n) && /^(t|T|L|tr|copy|labels)$/.test(n.expression.getText())) return { key: n.name.text };
  if (ts.isElementAccessExpression(n) && /^(t|T|L|tr)$/.test(n.expression.getText()) && ts.isTemplateExpression(n.argumentExpression)) return { prefix: n.argumentExpression.head.text };
  return {};
}
function inAnswerContext(n: ts.Node): boolean {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isArrayLiteralExpression(p) || ts.isReturnStatement(p) && !ts.isJsxElement(p.expression ?? p)) return true;
    if (ts.isObjectLiteralExpression(p)) return true;
    if (ts.isConditionalExpression(p) || (ts.isBinaryExpression(p) && /\|\||\?\?/.test(p.operatorToken.getText()))) return true;
    if (ts.isJsxExpression(p) || ts.isJsxAttribute(p) || ts.isFunctionLike(p) || ts.isSourceFile(p)) return false;
  }
  return false;
}
function scanAnswers(file: string, sink: (s: string) => void) {
  const src = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (n: ts.Node) => {
    const k = keyOf(n);
    if (k.prefix !== undefined) answerPrefixes.add(k.prefix);
    else if (k.key && inAnswerContext(n)) answerKeys.add(k.key);
    else if (k.key) uiKeys.add(k.key);
    // Fallbacks shown in place of a saved value, e.g. {record.x || "Parent"}
    if ((ts.isStringLiteral(n)) && n.parent && ts.isBinaryExpression(n.parent) && /\|\||\?\?/.test(n.parent.operatorToken.getText())) sink(n.text);
    // Literals directly in arrays/objects of option-like shape
    if (ts.isStringLiteral(n) && n.parent && ts.isPropertyAssignment(n.parent) && /^(l|label|name|text|value|v)$/.test(n.parent.name.getText()) && insideArray(n)) sink(n.text);
    ts.forEachChild(n, visit);
  };
  visit(src);
}
function dictEntries(file: string, onEntry: (key: string, value: string) => void) {
  const src = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (n: ts.Node) => {
    if (ts.isPropertyAssignment(n) && (ts.isStringLiteral(n.initializer) || ts.isNoSubstitutionTemplateLiteral(n.initializer)))
      onEntry(n.name.getText().replace(/["']/g, ""), n.initializer.text);
    ts.forEachChild(n, visit);
  };
  visit(src);
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const clinical = new Set<string>();
for (const f of CATALOGS) { try { literals(f, false, (s) => clinical.add(norm(s).toLowerCase())); } catch {} }

const FILES = SCAN.flatMap((d) => walk(d, []));
const answers = new Set<string>(GENDER_IDENTITY_OPTIONS);
for (const f of FILES) scanAnswers(f, (s) => answers.add(norm(s)));
// Keys sharing a family prefix with answer keys (e.g. ex_*) are treated as answers unless used directly as UI text.
const answerFamilies = new Set([...answerKeys].filter((k) => k.includes("_")).map((k) => k.split("_")[0] + "_"));
for (const f of FILES) dictEntries(f, (key, value) => {
  const family = key.includes("_") && answerFamilies.has(key.split("_")[0] + "_") && !uiKeys.has(key);
  if (family || answerKeys.has(key) || [...answerPrefixes].some((p) => p && key.startsWith(p))) answers.add(norm(value));
});
const labels = new Set<string>();
for (const f of FILES) {
  literals(f, true, (raw) => {
    const s = norm(raw);
    if (s.length < 2 || s.length > 300 || !/[A-Za-z]{2}/.test(s)) return;
    if (!/[A-Z]/.test(s[0]) && !/\s/.test(s)) return; // drop identifiers/keys
    if (/^[\w-]+(:[\w-]+)*(\s+[\w:/\[\]().#%-]+)*$/.test(s) && /[-:\[]/.test(s)) return; // class-like
    if (/^(https?:|\/|#|@|mailto:)/.test(s) || /[{}<>=]/.test(s) || /^[\w.-]+@[\w.-]+$/.test(s)) return;
    if (/^[A-Z][a-z]+([A-Z][a-z]+)+$/.test(s)) return; // component names
    if (/[åäöÅÄÖ]/.test(s)) return; // Swedish comes from built-in translations
    if (answers.has(s)) return; // can appear as a patient's saved answer
    if (clinical.has(s.toLowerCase())) return;
    labels.add(s);
  });
}
const sorted = [...labels].sort();
writeFileSync("src/lib/interfaceLabels.generated.ts",
  `// Generated by scripts/extract-interface-labels.ts — fixed UI labels only. Do not edit.\nexport const GENERATED_INTERFACE_LABELS: readonly string[] = ${JSON.stringify(sorted, null, 0).replace(/","/g, '",\n"')};\n`);
console.log(sorted.length, "labels");
