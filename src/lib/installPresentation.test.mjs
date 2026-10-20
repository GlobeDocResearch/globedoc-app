import { describe, expect, test } from "bun:test";
import { getInstallDevice, isInstalledApp } from "./installPresentation.ts";

describe("entry installation presentation", () => {
  test("iPhone and iPad receive Safari home screen instructions", () => {
    expect(getInstallDevice("Mozilla/5.0 (iPhone)", "iPhone", 5)).toBe("ios");
    expect(getInstallDevice("Mozilla/5.0 (Macintosh)", "MacIntel", 5)).toBe("ios");
  });
  test("Android receives Chrome installation instructions", () => {
    expect(getInstallDevice("Mozilla/5.0 (Linux; Android 14)", "Linux", 5)).toBe("android");
  });
  test("desktop receives phone guidance", () => {
    expect(getInstallDevice("Mozilla/5.0 (Macintosh)", "MacIntel", 0)).toBe("desktop");
  });
  test("installation section is hidden for installed apps on either platform", () => {
    expect(isInstalledApp(true, false)).toBe(true);
    expect(isInstalledApp(false, true)).toBe(true);
    expect(isInstalledApp(false, false)).toBe(false);
  });
});