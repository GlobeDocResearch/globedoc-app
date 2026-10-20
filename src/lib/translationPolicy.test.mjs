import { test, expect } from "bun:test";
import { isPublicEntryPath, usesMachineTranslation } from "./translationPolicy.ts";
test("patient records pages are not public entry pages", () => {
  for (const p of ["/records", "/health-pass/allergies", "/pro/patients", "/home", "/connect"]) expect(isPublicEntryPath(p)).toBe(false);
});
test("start and sign-in pages are public entry pages", () => {
  for (const p of ["/", "/signin", "/patient", "/pro"]) expect(isPublicEntryPath(p)).toBe(true);
});
test("English and Swedish never use machine translation", () => {
  expect(usesMachineTranslation("en")).toBe(false);
  expect(usesMachineTranslation("sv")).toBe(false);
  expect(usesMachineTranslation("fr")).toBe(true);
});
