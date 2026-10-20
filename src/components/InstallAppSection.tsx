import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInstallDevice, isInstalledApp, type InstallDevice } from "@/lib/installPresentation";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PLATFORM_LABELS = {
  ios: { title: "iPhone / iPad · Safari", steps: "Share → “Add to Home Screen”" },
  android: { title: "Android · Chrome", steps: "Menu ⋮ → “Install app” or “Add to Home screen”" },
} as const;

const INSTALL_STEPS: Record<"ios" | "android", Array<"ios" | "android">> = {
  ios: ["ios", "android"],
  android: ["android", "ios"],
};

export function InstallAppSection() {
  const [device, setDevice] = useState<InstallDevice | null>(null);
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [prompting, setPrompting] = useState(false);

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as Navigator & { standalone?: boolean };
    const updateInstalled = () => setInstalled(isInstalledApp(display.matches, nav.standalone === true));
    updateInstalled();
    setDevice(getInstallDevice(nav.userAgent, nav.platform, nav.maxTouchPoints));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", updateInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", updateInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    setPrompting(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      setPrompt(null);
      setPrompting(false);
    }
  };

  if (!device || installed) return null;

  return (
    <section aria-labelledby="install-heading" className="mt-9 w-full max-w-md border-t border-border pt-6 text-left">
      <h2 id="install-heading" className="flex items-center gap-2.5 text-xl font-semibold text-auth-heading">
        <Smartphone aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
        Use GlobeDoc as an app
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        GlobeDoc can be installed on your phone like an app. It updates automatically, so you always have the latest version. No app store needed.
      </p>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        {device === "desktop" ? (
          <p>On your phone, open this page to install GlobeDoc as an app.</p>
        ) : (
          INSTALL_STEPS[device].map((platform) => (
            <p key={platform}>
              <strong className="font-medium text-foreground">{PLATFORM_LABELS[platform].title}</strong>
              <br />
              {PLATFORM_LABELS[platform].steps}
            </p>
          ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {prompt && <Button variant="plain" onClick={install} disabled={prompting} className="bg-auth-action text-auth-header-foreground hover:opacity-90"><Download />Install app</Button>}
      </div>
    </section>
  );
}