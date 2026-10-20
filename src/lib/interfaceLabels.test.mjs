import { test, expect } from "bun:test";
import { GENERATED_INTERFACE_LABELS as L } from "./interfaceLabels.generated.ts";
test("fixed interface labels are translatable", () => {
  expect(L).toContain("Try again");
  expect(L).toContain("Reason for visit");
});
test("clinical catalog terms are never in the list", () => {
  for (const s of ["Magnesium", "Psyllium husk", "Codeine (nausea)", "CBD oil"]) expect(L).not.toContain(s);
});
