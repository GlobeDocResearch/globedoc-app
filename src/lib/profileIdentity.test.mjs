import { test, expect } from "bun:test";
import { normalizeProfileIdentity, genderIdentityDisplay, GENDER_IDENTITY_OPTIONS } from "./profileIdentity.ts";
import { GENERATED_INTERFACE_LABELS } from "./interfaceLabels.generated.ts";

test("identity and pronouns are optional", () => {
  expect(normalizeProfileIdentity({})).toEqual({ gender_identity: null, gender_identity_description: null, pronouns: null });
});
test("pronouns allow 30 characters but reject 31", () => {
  expect(normalizeProfileIdentity({ pronouns: "x".repeat(30) }).pronouns).toHaveLength(30);
  expect(() => normalizeProfileIdentity({ pronouns: "x".repeat(31) })).toThrow();
});
test("self-description is shown only for the self-describe option", () => {
  expect(genderIdentityDisplay({ gender_identity: "Prefer to self-describe", gender_identity_description: "My identity" })).toBe("My identity");
  expect(normalizeProfileIdentity({ gender_identity: "Woman", gender_identity_description: "Old answer" }).gender_identity_description).toBeNull();
});
test("only the requested gender identity choices are accepted", () => {
  expect(GENDER_IDENTITY_OPTIONS).toEqual(["Woman", "Man", "Non-binary", "Prefer to self-describe", "Prefer not to say"]);
  expect(() => normalizeProfileIdentity({ gender_identity: "Invalid" })).toThrow();
});
test("identity answers never enter the translation allowlist", () => {
  for (const answer of GENDER_IDENTITY_OPTIONS) expect(GENERATED_INTERFACE_LABELS).not.toContain(answer);
});