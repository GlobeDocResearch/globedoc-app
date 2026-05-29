// Travel vaccine database keyed by country.
// Marks: K = required for entry, R = recommended, V = consider for longer stays, "-" = not applicable
export type Mark = "K" | "R" | "V" | "-";

export type VaccineKey =
  | "hepA"
  | "hepB"
  | "typhoid"
  | "yellowFeverReq"
  | "yellowFeverRec"
  | "japEnc"
  | "cholera"
  | "meningococcal"
  | "rabies"
  | "tbe"
  | "malaria"
  | "polio";

export const VACCINE_LABELS: Record<VaccineKey, string> = {
  hepA: "Hepatitis A",
  hepB: "Hepatitis B",
  typhoid: "Typhoid",
  yellowFeverReq: "Yellow Fever (required for entry)",
  yellowFeverRec: "Yellow Fever (recommended)",
  japEnc: "Japanese Encephalitis",
  cholera: "Cholera",
  meningococcal: "Meningococcal",
  rabies: "Rabies",
  tbe: "Tick-borne Encephalitis",
  malaria: "Malaria",
  polio: "Polio",
};

export const VACCINE_ORDER: VaccineKey[] = [
  "yellowFeverReq",
  "yellowFeverRec",
  "hepA",
  "hepB",
  "typhoid",
  "japEnc",
  "cholera",
  "meningococcal",
  "rabies",
  "tbe",
  "malaria",
  "polio",
];

export type TripLength = "short" | "mid" | "long";

export const TRIP_LENGTHS: { id: TripLength; label: string }[] = [
  { id: "short", label: "Up to 3 weeks" },
  { id: "mid", label: "3 weeks – 3 months" },
  { id: "long", label: "3+ months" },
];

export function marksForTrip(trip: TripLength): Mark[] {
  if (trip === "short") return ["K", "R"];
  return ["K", "R", "V"];
}

export const COUNTRY_VACCINE_DATA: Record<string, Record<VaccineKey, Mark>> = {
  "Thailand": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"R", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Indonesia": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "India": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Vietnam": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"R", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Japan": { hepA:"-", hepB:"-", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"-", meningococcal:"-", rabies:"-", tbe:"V", malaria:"-", polio:"-" },
  "China": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"V", meningococcal:"-", rabies:"V", tbe:"R", malaria:"V", polio:"R" },
  "Philippines": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"R", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"R" },
  "Cambodia": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"R", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Laos": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"R", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Myanmar": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"R", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Nepal": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"V", meningococcal:"-", rabies:"R", tbe:"-", malaria:"V", polio:"R" },
  "Sri Lanka": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Malaysia": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"R" },
  "Singapore": { hepA:"-", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Maldives": { hepA:"R", hepB:"R", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "South Korea": { hepA:"-", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"V", cholera:"-", meningococcal:"-", rabies:"-", tbe:"V", malaria:"-", polio:"-" },
  "Mongolia": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"R", malaria:"-", polio:"-" },
  "Turkey": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"R" },
  "Israel": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Jordan": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"-", malaria:"-", polio:"-" },
  "UAE": { hepA:"R", hepB:"R", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Saudi Arabia": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"K", rabies:"V", tbe:"-", malaria:"-", polio:"-" },
  "Iran": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"R" },
  "Egypt": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"-" },
  "Morocco": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"-", malaria:"-", polio:"-" },
  "Tunisia": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"-", malaria:"-", polio:"-" },
  "Kenya": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Tanzania": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Uganda": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"R", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Ethiopia": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"R", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Nigeria": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"R", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Ghana": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "South Africa": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"-" },
  "Zambia": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"K", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Zimbabwe": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Mozambique": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"V", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Madagascar": { hepA:"R", hepB:"R", typhoid:"R", yellowFeverReq:"-", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "USA": { hepA:"-", hepB:"-", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Canada": { hepA:"-", hepB:"-", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Mexico": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"-" },
  "Cuba": { hepA:"R", hepB:"R", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Haiti": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"R", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"-" },
  "Brazil": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Peru": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Colombia": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"R", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"R", polio:"R" },
  "Argentina": { hepA:"R", hepB:"R", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"V", japEnc:"-", cholera:"V", meningococcal:"-", rabies:"V", tbe:"-", malaria:"V", polio:"-" },
  "Chile": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Australia": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "New Zealand": { hepA:"-", hepB:"-", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "France": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Spain": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Italy": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"V", malaria:"-", polio:"-" },
  "Greece": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Portugal": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"-", malaria:"-", polio:"-" },
  "Croatia": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"V", malaria:"-", polio:"-" },
  "Poland": { hepA:"V", hepB:"V", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"R", malaria:"-", polio:"-" },
  "Germany": { hepA:"V", hepB:"-", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"V", malaria:"-", polio:"-" },
  "Austria": { hepA:"V", hepB:"-", typhoid:"-", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"-", tbe:"R", malaria:"-", polio:"-" },
  "Russia": { hepA:"R", hepB:"V", typhoid:"V", yellowFeverReq:"-", yellowFeverRec:"-", japEnc:"-", cholera:"-", meningococcal:"-", rabies:"V", tbe:"R", malaria:"-", polio:"-" },
};

export type RecommendedVaccine = { key: VaccineKey; label: string; mark: Mark };

export function recommendedFor(country: string, trip: TripLength): RecommendedVaccine[] {
  const data = COUNTRY_VACCINE_DATA[country];
  if (!data) return [];
  const allowed = marksForTrip(trip);
  return VACCINE_ORDER
    .filter((k) => allowed.includes(data[k]))
    .map((k) => ({ key: k, label: VACCINE_LABELS[k], mark: data[k] }));
}

// Match a user-recorded vaccine name to a recommended vaccine name.
export function userHasVaccine(recommended: string, userVaccines: string[]): boolean {
  const r = recommended.toLowerCase();
  const tokens = r
    .replace(/\(.*?\)/g, "")
    .split(/[ ,/-]+/)
    .filter((t) => t.length >= 3);
  return userVaccines.some((u) => {
    const ul = u.toLowerCase();
    if (ul.includes(r.split(" ")[0])) return true;
    return tokens.some((t) => ul.includes(t));
  });
}
