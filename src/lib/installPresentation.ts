export type InstallDevice = "ios" | "android" | "desktop";

export function getInstallDevice(userAgent: string, platform: string, touchPoints: number): InstallDevice {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

export function isInstalledApp(standaloneDisplay: boolean, iosStandalone: boolean): boolean {
  return standaloneDisplay || iosStandalone;
}