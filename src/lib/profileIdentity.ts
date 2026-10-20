export const GENDER_IDENTITY_OPTIONS = [
  "Woman", "Man", "Non-binary", "Prefer to self-describe", "Prefer not to say",
] as const;
export const PRONOUNS_MAX_LENGTH = 30;
export const IDENTITY_DESCRIPTION_MAX_LENGTH = 100;

export type ProfileIdentity = {
  gender_identity?: string | null;
  gender_identity_description?: string | null;
  pronouns?: string | null;
};

export function normalizeProfileIdentity(value: ProfileIdentity) {
  const identity = value.gender_identity || null;
  if (identity && !GENDER_IDENTITY_OPTIONS.some((option) => option === identity)) {
    throw new Error("Please select a gender identity option.");
  }
  const description = identity === "Prefer to self-describe" ? value.gender_identity_description?.trim() || null : null;
  const pronouns = value.pronouns?.trim() || null;
  if (pronouns && Array.from(pronouns).length > PRONOUNS_MAX_LENGTH) throw new Error("Pronouns must be 30 characters or fewer.");
  if (description && Array.from(description).length > IDENTITY_DESCRIPTION_MAX_LENGTH) throw new Error("Gender description must be 100 characters or fewer.");
  return { gender_identity: identity, gender_identity_description: description, pronouns };
}

export function genderIdentityDisplay(value: ProfileIdentity): string | null {
  if (value.gender_identity === "Prefer to self-describe") return value.gender_identity_description?.trim() || null;
  return value.gender_identity || null;
}