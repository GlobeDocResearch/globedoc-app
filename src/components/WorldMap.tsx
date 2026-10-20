import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import topoData from "world-atlas/countries-110m.json";
import countries from "world-countries";

export type MapLocation = {
  id: string;
  city?: string | null;
  country?: string | null;
};

const WIDTH = 800;
const HEIGHT = 380;

// Build a country lookup keyed by lowercased name variants → [lng, lat]
const COUNTRY_INDEX: Record<string, [number, number]> = (() => {
  const idx: Record<string, [number, number]> = {};
  for (const c of countries as any[]) {
    const [lat, lng] = c.latlng ?? [];
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const coord: [number, number] = [lng, lat];
    const keys = new Set<string>();
    keys.add(c.name.common);
    keys.add(c.name.official);
    if (c.cca2) keys.add(c.cca2);
    if (c.cca3) keys.add(c.cca3);
    for (const alt of c.altSpellings ?? []) keys.add(alt);
    for (const t of Object.values(c.translations ?? {}) as any[]) {
      if (t?.common) keys.add(t.common);
      if (t?.official) keys.add(t.official);
    }
    for (const k of keys) {
      if (!k) continue;
      idx[String(k).trim().toLowerCase()] = coord;
    }
  }
  return idx;
})();

function lookupCountry(name?: string | null): [number, number] | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return COUNTRY_INDEX[key] ?? null;
}

export default function WorldMap({ locations }: { locations: MapLocation[] }) {
  const { paths, points } = useMemo(() => {
    const geo = feature(
      topoData as any,
      (topoData as any).objects.countries,
    ) as unknown as FeatureCollection<Geometry>;

    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], geo);
    const path = geoPath(projection);

    const paths = geo.features
      .map((f) => path(f))
      .filter((d): d is string => !!d);

    const points: { id: string; cx: number; cy: number }[] = [];
    for (const loc of locations) {
      const coord = lookupCountry(loc.country);
      if (!coord) continue;
      const xy = projection(coord);
      if (!xy) continue;
      points.push({ id: loc.id, cx: xy[0], cy: xy[1] });
    }
    return { paths, points };
  }, [locations]);

  return (
    <div className="h-full overflow-hidden rounded-2xl bg-white p-0 ring-1 ring-gray-100">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="World map of your record locations"
      >
        <rect width={WIDTH} height={HEIGHT} fill="#FFFFFF" />
        <g>
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#EEF1F5"
              stroke="#E2E6EC"
              strokeWidth={0.4}
            />
          ))}
        </g>
        <g>
          {points.map((p) => (
            <g key={p.id} transform={`translate(${p.cx} ${p.cy})`}>
              <circle r={10} className="map-dot-pulse workspace-map-dot" />
              <circle r={4} className="workspace-map-dot" />
              <circle r={4} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
