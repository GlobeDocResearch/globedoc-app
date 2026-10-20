import { genderIdentityDisplay, type ProfileIdentity } from "@/lib/profileIdentity";

export function PatientIdentity({ patient }: { patient: ProfileIdentity }) {
  const gender = genderIdentityDisplay(patient);
  const pronouns = patient.pronouns?.trim();
  if (!gender && !pronouns) return null;
  return (
    <span data-no-translate translate="no" className="text-sm font-normal text-muted-foreground break-words">
      {gender && <span>{gender}</span>}
      {gender && pronouns && " · "}
      {pronouns && <span>{pronouns}</span>}
    </span>
  );
}