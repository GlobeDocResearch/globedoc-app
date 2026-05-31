// National childhood vaccination programmes — age-at-vaccination logic.
//
// Each rule = { name, desc, ageGiven (years, earliest dose), start, end?, sex? }
// A vaccine is "likely received" if (birthYear + ageGiven) falls within
// [start, end ?? 9999]. ALL rules for the country are returned regardless;
// the caller uses `likely` to decide between filled (purple) and outlined
// (unfilled but tappable) chip states.

export type Programme = {
  name: string;
  descEn: string;
  descSv: string;
  start: number;
  end?: number;
};

export type EligibleVaccine = {
  name: string;
  descEn: string;
  descSv: string;
  likely: boolean;
};

type Rule = {
  name: string;
  desc: { en: string; sv: string };
  ageGiven: number;
  start: number;
  end?: number;
  sex?: "male" | "female";
};

const D = {
  bcg: { en: "Tuberculosis", sv: "Tuberkulos" },
  smallpox: { en: "Smallpox", sv: "Smittkoppor" },
  diph: { en: "Diphtheria", sv: "Difteri" },
  tet: { en: "Tetanus", sv: "Stelkramp" },
  pert: { en: "Whooping cough", sv: "Kikhosta" },
  polio: { en: "Inactivated polio vaccine", sv: "Inaktiverat poliovaccin" },
  measles: { en: "Measles", sv: "Mässling" },
  mmr: { en: "Measles, mumps & rubella", sv: "Mässling, påssjuka & röda hund" },
  hib: { en: "Haemophilus influenzae type b", sv: "Haemophilus influenzae typ b" },
  pcv: { en: "Pneumococcal disease", sv: "Pneumokocksjukdom" },
  hpv: { en: "Human papillomavirus", sv: "Humant papillomvirus" },
  rota: { en: "Rotavirus", sv: "Rotavirus" },
  hepb: { en: "Hepatitis B", sv: "Hepatit B" },
  hepa: { en: "Hepatitis A", sv: "Hepatit A" },
  vari: { en: "Chickenpox", sv: "Vattkoppor" },
  menc: { en: "Meningococcal C", sv: "Meningokock C" },
  menacwy: { en: "Meningococcal ACWY", sv: "Meningokock ACWY" },
};

const R = (
  name: string,
  desc: { en: string; sv: string },
  ageGiven: number,
  start: number,
  end?: number,
  sex?: "male" | "female",
): Rule => ({ name, desc, ageGiven, start, end, sex });

const RULES: Record<string, Rule[]> = {
  Sweden: [
    R("Smallpox", D.smallpox, 1, 1940, 1976),
    R("BCG", D.bcg, 0, 1940, 1975),
    R("Diphtheria", D.diph, 1, 1940),
    R("Tetanus", D.tet, 1, 1940),
    R("Pertussis (1953–1979)", D.pert, 1, 1953, 1979),
    R("Pertussis (1996+)", D.pert, 1, 1996),
    R("Polio (IPV)", D.polio, 1, 1957),
    R("Measles (single)", D.measles, 2, 1971, 1982),
    R("MMR", D.mmr, 2, 1982),
    R("Hib", D.hib, 1, 1998),
    R("Pneumococcal (PCV)", D.pcv, 1, 2009),
    R("Hepatitis B", D.hepb, 1, 2016),
    R("HPV (girls)", D.hpv, 11, 2010, undefined, "female"),
    R("HPV (boys)", D.hpv, 11, 2020, undefined, "male"),
    R("Rotavirus", D.rota, 0, 2014),
  ],
  "United Kingdom": [
    R("Smallpox", D.smallpox, 1, 1940, 1971),
    R("BCG", D.bcg, 13, 1953, 2005),
    R("Diphtheria", D.diph, 0, 1940),
    R("Tetanus", D.tet, 0, 1961),
    R("Pertussis (1957–1974)", D.pert, 0, 1957, 1974),
    R("Pertussis (1990+)", D.pert, 0, 1990),
    R("Polio (IPV)", D.polio, 0, 1956),
    R("Measles (single)", D.measles, 1, 1968, 1988),
    R("MMR", D.mmr, 1, 1988),
    R("Hib", D.hib, 0, 1992),
    R("MenC", D.menc, 0, 1999),
    R("Pneumococcal (PCV)", D.pcv, 0, 2006),
    R("Hepatitis B", D.hepb, 0, 2017),
    R("HPV (girls)", D.hpv, 12, 2008, undefined, "female"),
    R("HPV (boys)", D.hpv, 12, 2019, undefined, "male"),
    R("Rotavirus", D.rota, 0, 2013),
  ],
  "United States": [
    R("Smallpox", D.smallpox, 1, 1940, 1972),
    R("Diphtheria", D.diph, 0, 1945),
    R("Tetanus", D.tet, 0, 1945),
    R("Pertussis", D.pert, 0, 1948),
    R("Polio (IPV)", D.polio, 0, 1955),
    R("Measles (single)", D.measles, 1, 1963, 1971),
    R("MMR", D.mmr, 1, 1971),
    R("Hib", D.hib, 0, 1985),
    R("Hepatitis B", D.hepb, 0, 1991),
    R("Varicella", D.vari, 1, 1995),
    R("Hepatitis A", D.hepa, 1, 1996),
    R("Pneumococcal (PCV)", D.pcv, 0, 2000),
    R("MenACWY", D.menacwy, 11, 2005),
    R("Rotavirus", D.rota, 0, 2006),
    R("HPV (girls)", D.hpv, 11, 2006, undefined, "female"),
    R("HPV (boys)", D.hpv, 11, 2011, undefined, "male"),
  ],
  Germany: [
    R("Smallpox", D.smallpox, 1, 1940, 1976),
    R("Diphtheria", D.diph, 0, 1945),
    R("Tetanus", D.tet, 0, 1960),
    R("Pertussis", D.pert, 0, 1960),
    R("Polio (IPV)", D.polio, 0, 1962),
    R("Measles (single)", D.measles, 1, 1967, 1980),
    R("MMR", D.mmr, 1, 1980),
    R("Hib", D.hib, 0, 1990),
    R("Hepatitis B", D.hepb, 0, 1995),
    R("Varicella", D.vari, 1, 2004),
    R("Pneumococcal (PCV)", D.pcv, 0, 2006),
    R("HPV (girls)", D.hpv, 9, 2007, undefined, "female"),
    R("HPV (boys)", D.hpv, 9, 2018, undefined, "male"),
    R("Rotavirus", D.rota, 0, 2013),
  ],
  France: [
    R("Smallpox", D.smallpox, 1, 1940, 1979),
    R("BCG", D.bcg, 0, 1940, 2007),
    R("Diphtheria", D.diph, 0, 1938),
    R("Tetanus", D.tet, 0, 1945),
    R("Pertussis", D.pert, 0, 1959),
    R("Polio (IPV)", D.polio, 0, 1958),
    R("Measles (single)", D.measles, 1, 1968, 1983),
    R("MMR", D.mmr, 1, 1983),
    R("Hib", D.hib, 0, 1992),
    R("Hepatitis B", D.hepb, 0, 1994),
    R("Varicella", D.vari, 1, 2004),
    R("Pneumococcal (PCV)", D.pcv, 0, 2006),
    R("HPV (girls)", D.hpv, 11, 2007, undefined, "female"),
    R("HPV (boys)", D.hpv, 11, 2021, undefined, "male"),
    R("Rotavirus", D.rota, 0, 2015),
  ],
  Australia: [
    R("Smallpox", D.smallpox, 1, 1940, 1980),
    R("Diphtheria", D.diph, 0, 1950),
    R("Tetanus", D.tet, 0, 1950),
    R("Pertussis", D.pert, 0, 1953),
    R("Polio (IPV)", D.polio, 0, 1956),
    R("Measles (single)", D.measles, 1, 1966, 1982),
    R("MMR", D.mmr, 1, 1982),
    R("Hepatitis B", D.hepb, 0, 1990),
    R("Hib", D.hib, 0, 1993),
    R("Varicella", D.vari, 1, 2005),
    R("Pneumococcal (PCV)", D.pcv, 0, 2005),
    R("HPV (girls)", D.hpv, 12, 2007, undefined, "female"),
    R("Rotavirus", D.rota, 0, 2007),
    R("HPV (boys)", D.hpv, 12, 2013, undefined, "male"),
    R("MenACWY", D.menacwy, 1, 2016),
  ],
  Canada: [
    R("Smallpox", D.smallpox, 1, 1940, 1972),
    R("Pertussis", D.pert, 0, 1943),
    R("Diphtheria", D.diph, 0, 1945),
    R("Tetanus", D.tet, 0, 1945),
    R("Polio (IPV)", D.polio, 0, 1955),
    R("Measles (single)", D.measles, 1, 1963, 1983),
    R("MMR", D.mmr, 1, 1983),
    R("Hib", D.hib, 0, 1985),
    R("Hepatitis B", D.hepb, 9, 1992),
    R("Varicella", D.vari, 1, 2000),
    R("MenC", D.menc, 0, 2001),
    R("Pneumococcal (PCV)", D.pcv, 0, 2002),
    R("HPV (girls)", D.hpv, 9, 2007, undefined, "female"),
    R("Rotavirus", D.rota, 0, 2011),
    R("HPV (boys)", D.hpv, 9, 2012, undefined, "male"),
  ],
  Norway: [
    R("Smallpox", D.smallpox, 1, 1940, 1976),
    R("BCG", D.bcg, 14, 1947, 1995),
    R("Diphtheria", D.diph, 1, 1952),
    R("Tetanus", D.tet, 1, 1952),
    R("Pertussis (1952–1979)", D.pert, 1, 1952, 1979),
    R("Pertussis (1998+)", D.pert, 1, 1998),
    R("Polio (IPV)", D.polio, 1, 1957),
    R("MMR", D.mmr, 2, 1983),
    R("Hib", D.hib, 1, 1992),
    R("Hepatitis B", D.hepb, 1, 2006),
    R("Pneumococcal (PCV)", D.pcv, 1, 2006),
    R("HPV (girls)", D.hpv, 11, 2009, undefined, "female"),
    R("Rotavirus", D.rota, 0, 2014),
    R("HPV (boys)", D.hpv, 11, 2018, undefined, "male"),
  ],
  Denmark: [
    R("Smallpox", D.smallpox, 1, 1940, 1976),
    R("Diphtheria", D.diph, 1, 1943),
    R("Tetanus", D.tet, 1, 1943),
    R("Pertussis (1943–1985)", D.pert, 1, 1943, 1985),
    R("Pertussis (1997+)", D.pert, 1, 1997),
    R("BCG", D.bcg, 7, 1948, 1986),
    R("Polio (IPV)", D.polio, 1, 1955),
    R("Measles (single)", D.measles, 2, 1969, 1987),
    R("MMR", D.mmr, 2, 1987),
    R("Hib", D.hib, 1, 1993),
    R("Pneumococcal (PCV)", D.pcv, 1, 2007),
    R("Hepatitis B", D.hepb, 1, 2009),
    R("HPV (girls)", D.hpv, 12, 2009, undefined, "female"),
    R("Rotavirus", D.rota, 0, 2012),
    R("HPV (boys)", D.hpv, 12, 2019, undefined, "male"),
  ],
  Finland: [
    R("BCG", D.bcg, 0, 1941, 2006),
    R("Diphtheria", D.diph, 1, 1943),
    R("Tetanus", D.tet, 1, 1943),
    R("Pertussis", D.pert, 1, 1952),
    R("Polio (IPV)", D.polio, 1, 1957),
    R("Smallpox", D.smallpox, 1, 1940, 1980),
    R("Measles (single)", D.measles, 2, 1975, 1982),
    R("MMR", D.mmr, 2, 1982),
    R("Hib", D.hib, 0, 1986),
    R("Hepatitis B", D.hepb, 1, 2005),
    R("Rotavirus", D.rota, 0, 2009),
    R("Pneumococcal (PCV)", D.pcv, 1, 2010),
    R("HPV (girls)", D.hpv, 11, 2013, undefined, "female"),
    R("Varicella", D.vari, 1, 2017),
    R("HPV (boys)", D.hpv, 11, 2020, undefined, "male"),
  ],
};

// WHO Essentials — shown as unfilled chips for unsupported countries.
const WHO_ESSENTIALS: { name: string; desc: { en: string; sv: string } }[] = [
  { name: "BCG", desc: D.bcg },
  { name: "Polio (IPV)", desc: D.polio },
  { name: "DTP", desc: { en: "Diphtheria, tetanus, pertussis", sv: "Difteri, stelkramp, kikhosta" } },
  { name: "MMR", desc: D.mmr },
  { name: "Hepatitis B", desc: D.hepb },
  { name: "Hib", desc: D.hib },
  { name: "Pneumococcal (PCV)", desc: D.pcv },
  { name: "Rotavirus", desc: D.rota },
  { name: "HPV", desc: D.hpv },
];

export function isSupportedCountry(country?: string | null): boolean {
  return !!country && country in RULES;
}

// Main API: returns all programme vaccines for the country with `likely`
// computed from age-at-vaccination logic. For unsupported countries, returns
// WHO Essentials all marked `likely: false`.
export function eligibleProgrammeFor(
  country: string | null | undefined,
  birthYear: number | null,
  sex?: string | null,
): EligibleVaccine[] {
  const normalizedSex = sex === "male" || sex === "female" ? sex : null;
  const rules = country && RULES[country];
  if (!rules) {
    return WHO_ESSENTIALS.map((v) => ({
      name: v.name,
      descEn: v.desc.en,
      descSv: v.desc.sv,
      likely: false,
    }));
  }
  return rules
    .filter((r) => !(r.sex && normalizedSex && r.sex !== normalizedSex))
    .map((r) => {
      const likely =
        birthYear !== null &&
        birthYear + r.ageGiven >= r.start &&
        birthYear + r.ageGiven <= (r.end ?? 9999);
      return {
        name: r.name,
        descEn: r.desc.en,
        descSv: r.desc.sv,
        likely,
      };
    });
}

// Back-compat exports kept for any other importers.
export const PROGRAMMES: Record<string, Programme[]> = Object.fromEntries(
  Object.entries(RULES).map(([k, rs]) => [
    k,
    rs.map((r) => ({
      name: r.name,
      descEn: r.desc.en,
      descSv: r.desc.sv,
      start: r.start,
      end: r.end,
    })),
  ]),
);

export const WHO_GENERIC: Programme[] = WHO_ESSENTIALS.map((v) => ({
  name: v.name,
  descEn: v.desc.en,
  descSv: v.desc.sv,
  start: 1950,
}));

export function programmeForCountryAndYear(
  country: string | null | undefined,
  birthYear: number,
): Programme[] {
  const list = (country && PROGRAMMES[country]) || WHO_GENERIC;
  return list.filter((p) => p.start <= birthYear + 18 && (p.end ?? 9999) >= birthYear);
}

export function swedenProgrammeForYear(
  birthYear: number,
  sex?: string | null,
): Programme[] {
  return eligibleProgrammeFor("Sweden", birthYear, sex)
    .filter((v) => v.likely)
    .map((v) => ({ name: v.name, descEn: v.descEn, descSv: v.descSv, start: 0 }));
}
