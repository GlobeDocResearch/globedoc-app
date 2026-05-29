// Simple destination -> recommended vaccines map.
// "common" applies to most destinations; per-country list adds region-specific recs.
export const COMMON_RECOMMENDED = [
  "MMR (Measles, Mumps, Rubella)",
  "Tdap (Tetanus, Diphtheria, Pertussis)",
  "Polio",
  "Influenza",
  "COVID-19",
];

export const COUNTRY_VACCINES: Record<string, string[]> = {
  // Africa
  "Kenya": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Cholera", "Rabies", "Meningococcal"],
  "Tanzania": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Rabies"],
  "South Africa": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Nigeria": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Meningococcal", "Rabies"],
  "Ethiopia": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Meningococcal", "Rabies"],
  "Egypt": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Morocco": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Ghana": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Meningococcal"],
  "Uganda": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Rabies"],
  // Asia
  "India": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies", "Cholera"],
  "Thailand": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "Vietnam": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "Cambodia": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "Indonesia": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "Philippines": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "China": ["Hepatitis A", "Hepatitis B", "Typhoid", "Japanese Encephalitis", "Rabies"],
  "Japan": ["Hepatitis B", "Japanese Encephalitis"],
  "Nepal": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "Sri Lanka": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Rabies"],
  "Pakistan": ["Typhoid", "Hepatitis A", "Hepatitis B", "Polio (booster)", "Rabies"],
  "Bangladesh": ["Typhoid", "Hepatitis A", "Hepatitis B", "Japanese Encephalitis", "Cholera"],
  // South America
  "Brazil": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Rabies"],
  "Peru": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Rabies"],
  "Colombia": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B"],
  "Bolivia": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B", "Rabies"],
  "Ecuador": ["Yellow Fever", "Typhoid", "Hepatitis A", "Hepatitis B"],
  "Argentina": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Chile": ["Hepatitis A", "Hepatitis B"],
  // Central America / Caribbean
  "Mexico": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Guatemala": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Cuba": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Haiti": ["Hepatitis A", "Hepatitis B", "Typhoid", "Cholera"],
  // Middle East
  "Saudi Arabia": ["Meningococcal (ACWY)", "Hepatitis A", "Hepatitis B"],
  "United Arab Emirates": ["Hepatitis A", "Hepatitis B"],
  "Iran": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  "Israel": ["Hepatitis A", "Hepatitis B"],
  "Turkey": ["Hepatitis A", "Hepatitis B", "Typhoid"],
  // Europe / N.America / Oceania — mostly routine only
  "United States": [],
  "United Kingdom": [],
  "France": [],
  "Germany": [],
  "Spain": [],
  "Italy": [],
  "Sweden": [],
  "Norway": [],
  "Denmark": [],
  "Finland": [],
  "Netherlands": [],
  "Australia": [],
  "New Zealand": [],
  "Canada": [],
};

export function recommendedFor(country: string): string[] {
  const extra = COUNTRY_VACCINES[country] ?? [];
  // de-dupe while preserving order
  const seen = new Set<string>();
  return [...COMMON_RECOMMENDED, ...extra].filter((v) => {
    const k = v.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
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
