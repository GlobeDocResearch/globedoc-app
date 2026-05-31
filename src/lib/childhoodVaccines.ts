// National childhood vaccination programmes (historical eligibility windows).
// `start` = first year vaccine was part of the routine programme.
// `end` (optional, inclusive) = last year it was part of it.

export type Programme = {
  name: string;
  descEn: string;
  descSv: string;
  start: number;
  end?: number;
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
  vari: { en: "Chickenpox", sv: "Vattkoppor" },
  menc: { en: "Meningococcal C", sv: "Meningokock C" },
  menacwy: { en: "Meningococcal ACWY", sv: "Meningokock ACWY" },
};

const P = (
  name: string,
  d: { en: string; sv: string },
  start: number,
  end?: number,
): Programme => ({ name, descEn: d.en, descSv: d.sv, start, end });

export const PROGRAMMES: Record<string, Programme[]> = {
  Sweden: [
    P("BCG", D.bcg, 1940, 1975),
    P("Smallpox", D.smallpox, 1940, 1976),
    P("Diphtheria", D.diph, 1940),
    P("Tetanus", D.tet, 1940),
    P("Pertussis (1953–1979)", D.pert, 1953, 1979),
    P("Pertussis (1996+)", D.pert, 1996),
    P("Polio (IPV)", D.polio, 1957),
    P("Measles (single)", D.measles, 1971, 1982),
    P("MMR", D.mmr, 1982),
    P("Hib", D.hib, 1998),
    P("Pneumococcal (PCV)", D.pcv, 2009),
    P("HPV (girls)", D.hpv, 2010),
    P("HPV (boys)", D.hpv, 2020),
    P("Rotavirus", D.rota, 2014),
    P("Hepatitis B", D.hepb, 2016),
  ],
  "United Kingdom": [
    P("Smallpox", D.smallpox, 1940, 1971),
    P("Diphtheria", D.diph, 1940),
    P("Tetanus", D.tet, 1961),
    P("Pertussis (1957–1974)", D.pert, 1957, 1974),
    P("Pertussis (1990+)", D.pert, 1990),
    P("Polio (IPV)", D.polio, 1956),
    P("Measles (single)", D.measles, 1968, 1988),
    P("MMR", D.mmr, 1988),
    P("Hib", D.hib, 1992),
    P("MenC", D.menc, 1999),
    P("Pneumococcal (PCV)", D.pcv, 2006),
    P("HPV (girls)", D.hpv, 2008),
    P("HPV (boys)", D.hpv, 2019),
    P("Rotavirus", D.rota, 2013),
    P("Hepatitis B", D.hepb, 2017),
  ],
  "United States": [
    P("Smallpox", D.smallpox, 1940, 1972),
    P("Diphtheria", D.diph, 1945),
    P("Tetanus", D.tet, 1945),
    P("Pertussis", D.pert, 1948),
    P("Polio (IPV)", D.polio, 1955),
    P("Measles (single)", D.measles, 1963, 1971),
    P("MMR", D.mmr, 1971),
    P("Hib", D.hib, 1985),
    P("Hepatitis B", D.hepb, 1991),
    P("Pneumococcal (PCV)", D.pcv, 2000),
    P("Varicella", D.vari, 1995),
    P("HPV (girls)", D.hpv, 2006),
    P("HPV (boys)", D.hpv, 2011),
    P("Rotavirus", D.rota, 2006),
    P("MenACWY", D.menacwy, 2005),
  ],
  Germany: [
    P("Smallpox", D.smallpox, 1940, 1976),
    P("Diphtheria", D.diph, 1945),
    P("Tetanus", D.tet, 1960),
    P("Pertussis", D.pert, 1960),
    P("Polio (IPV)", D.polio, 1962),
    P("Measles (single)", D.measles, 1967, 1980),
    P("MMR", D.mmr, 1980),
    P("Hib", D.hib, 1990),
    P("Hepatitis B", D.hepb, 1995),
    P("Pneumococcal (PCV)", D.pcv, 2006),
    P("HPV (girls)", D.hpv, 2007),
    P("HPV (boys)", D.hpv, 2018),
    P("Rotavirus", D.rota, 2013),
    P("Varicella", D.vari, 2004),
  ],
  France: [
    P("Smallpox", D.smallpox, 1940, 1979),
    P("Diphtheria", D.diph, 1938),
    P("Tetanus", D.tet, 1945),
    P("Pertussis", D.pert, 1959),
    P("Polio (IPV)", D.polio, 1958),
    P("BCG", D.bcg, 1940, 2007),
    P("Measles (single)", D.measles, 1968, 1983),
    P("MMR", D.mmr, 1983),
    P("Hib", D.hib, 1992),
    P("Hepatitis B", D.hepb, 1994),
    P("Pneumococcal (PCV)", D.pcv, 2006),
    P("HPV (girls)", D.hpv, 2007),
    P("HPV (boys)", D.hpv, 2021),
    P("Rotavirus", D.rota, 2015),
    P("Varicella", D.vari, 2004),
  ],
  Australia: [
    P("Smallpox", D.smallpox, 1940, 1980),
    P("Diphtheria", D.diph, 1950),
    P("Tetanus", D.tet, 1950),
    P("Pertussis", D.pert, 1953),
    P("Polio (IPV)", D.polio, 1956),
    P("Measles (single)", D.measles, 1966, 1982),
    P("MMR", D.mmr, 1982),
    P("Hib", D.hib, 1993),
    P("Hepatitis B", D.hepb, 1990),
    P("Pneumococcal (PCV)", D.pcv, 2005),
    P("HPV (girls)", D.hpv, 2007),
    P("HPV (boys)", D.hpv, 2013),
    P("Rotavirus", D.rota, 2007),
    P("Varicella", D.vari, 2005),
    P("MenACWY", D.menacwy, 2016),
  ],
  Canada: [
    P("Smallpox", D.smallpox, 1940, 1972),
    P("Diphtheria", D.diph, 1945),
    P("Tetanus", D.tet, 1945),
    P("Pertussis", D.pert, 1943),
    P("Polio (IPV)", D.polio, 1955),
    P("Measles (single)", D.measles, 1963, 1983),
    P("MMR", D.mmr, 1983),
    P("Hib", D.hib, 1985),
    P("Hepatitis B", D.hepb, 1992),
    P("Pneumococcal (PCV)", D.pcv, 2002),
    P("Varicella", D.vari, 2000),
    P("HPV (girls)", D.hpv, 2007),
    P("HPV (boys)", D.hpv, 2012),
    P("Rotavirus", D.rota, 2011),
    P("MenC", D.menc, 2001),
  ],
  Norway: [
    P("BCG", D.bcg, 1947, 1995),
    P("Smallpox", D.smallpox, 1940, 1976),
    P("Diphtheria", D.diph, 1952),
    P("Tetanus", D.tet, 1952),
    P("Pertussis (1952–1979)", D.pert, 1952, 1979),
    P("Pertussis (1998+)", D.pert, 1998),
    P("Polio (IPV)", D.polio, 1957),
    P("MMR", D.mmr, 1983),
    P("Hib", D.hib, 1992),
    P("Hepatitis B", D.hepb, 2006),
    P("Pneumococcal (PCV)", D.pcv, 2006),
    P("HPV (girls)", D.hpv, 2009),
    P("HPV (boys)", D.hpv, 2018),
    P("Rotavirus", D.rota, 2014),
  ],
  Denmark: [
    P("BCG", D.bcg, 1948, 1986),
    P("Smallpox", D.smallpox, 1940, 1976),
    P("Diphtheria", D.diph, 1943),
    P("Tetanus", D.tet, 1943),
    P("Pertussis (1943–1985)", D.pert, 1943, 1985),
    P("Pertussis (1997+)", D.pert, 1997),
    P("Polio (IPV)", D.polio, 1955),
    P("Measles (single)", D.measles, 1969, 1987),
    P("MMR", D.mmr, 1987),
    P("Hib", D.hib, 1993),
    P("Hepatitis B", D.hepb, 2009),
    P("Pneumococcal (PCV)", D.pcv, 2007),
    P("HPV (girls)", D.hpv, 2009),
    P("HPV (boys)", D.hpv, 2019),
    P("Rotavirus", D.rota, 2012),
  ],
  Finland: [
    P("BCG", D.bcg, 1941, 2006),
    P("Smallpox", D.smallpox, 1940, 1980),
    P("Diphtheria", D.diph, 1943),
    P("Tetanus", D.tet, 1943),
    P("Pertussis", D.pert, 1952),
    P("Polio (IPV)", D.polio, 1957),
    P("Measles (single)", D.measles, 1975, 1982),
    P("MMR", D.mmr, 1982),
    P("Hib", D.hib, 1986),
    P("Hepatitis B", D.hepb, 2005),
    P("Pneumococcal (PCV)", D.pcv, 2010),
    P("HPV (girls)", D.hpv, 2013),
    P("HPV (boys)", D.hpv, 2020),
    P("Rotavirus", D.rota, 2009),
    P("Varicella", D.vari, 2017),
  ],
};

// Generic WHO-style fallback for unsupported countries — broad core EPI list.
export const WHO_GENERIC: Programme[] = [
  P("BCG", D.bcg, 1950),
  P("Diphtheria", D.diph, 1950),
  P("Tetanus", D.tet, 1950),
  P("Pertussis", D.pert, 1950),
  P("Polio (IPV)", D.polio, 1960),
  P("MMR", D.mmr, 1985),
  P("Hib", D.hib, 1995),
  P("Hepatitis B", D.hepb, 2000),
  P("Pneumococcal (PCV)", D.pcv, 2010),
  P("Rotavirus", D.rota, 2010),
  P("HPV", D.hpv, 2010),
];

export function isSupportedCountry(country?: string | null): boolean {
  return !!country && country in PROGRAMMES;
}

// Return vaccines that were part of the programme at any point while the
// patient was aged 0–18.
export function programmeForCountryAndYear(
  country: string | null | undefined,
  birthYear: number,
): Programme[] {
  const list = (country && PROGRAMMES[country]) || WHO_GENERIC;
  const lo = birthYear;
  const hi = birthYear + 18;
  return list.filter((p) => p.start <= hi && (p.end ?? 9999) >= lo);
}
