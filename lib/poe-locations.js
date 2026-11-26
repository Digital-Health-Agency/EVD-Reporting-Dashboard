/**
 * Kenya points of entry with coordinates and transport mode.
 *
 * Coordinates come from the Uhai screening platform's entry_points seed
 * (backend/app/seeds/data/entry_points.json). Names follow the warehouse's
 * `uhai_point_of_entry_name` macro, which is what gold.report_screening
 * exposes as reporting_point_of_entry. Aliases cover the raw Uhai codes,
 * Uhai titles and common short forms used by ADAM traveller records.
 */
export const POE_LOCATIONS = [
  { name: "Jomo Kenyatta International Airport", type: "Air", lat: -1.3192, lng: 36.9278, aliases: ["jkia", "jomo kenyatta", "nairobi airport"] },
  { name: "Wilson International Airport", type: "Air", lat: -1.3216, lng: 36.8148, aliases: ["wap", "wilson airport", "wilson"] },
  { name: "Moi International Airport", type: "Air", lat: -4.0348, lng: 39.5942, aliases: ["mia", "moi intl airport", "mombasa airport"] },
  { name: "Eldoret International Airport", type: "Air", lat: 0.4044, lng: 35.2389, aliases: ["eia_eldoret", "eldoret intl airport", "eldoret airport", "eldoret"] },
  { name: "Kisumu International Airport", type: "Air", lat: -0.0861, lng: 34.7289, aliases: ["kia_kisumu", "kisumu intl airport", "kisumu airport"] },
  { name: "Isiolo International Airport", type: "Air", lat: 0.3506, lng: 37.5844, aliases: ["isiolo_airport", "isiolo airport", "isiolo"] },
  { name: "Wajir Airport", type: "Air", lat: 1.7386, lng: 40.0968, aliases: ["wajir_airport", "wajir"] },
  { name: "Malindi Airport", type: "Air", lat: -3.2286, lng: 40.1017, aliases: ["malindi_airport"] },
  { name: "Manda Airport", type: "Air", lat: -2.2528, lng: 40.9128, aliases: ["manda_airport", "manda"] },
  { name: "Ukunda Airport", type: "Air", lat: -4.2933, lng: 39.5711, aliases: ["ukunda", "diani airport"] },
  { name: "Lokichoggio Airport", type: "Air", lat: 4.2044, lng: 34.3487, aliases: ["lokichogio_airport", "lokichogio", "lokichoggio"] },

  { name: "Kilindini Sea Port", type: "Sea", lat: -4.05, lng: 39.65, aliases: ["kilindini", "mombasa port", "mombasa seaport"] },
  { name: "Old Seaport", type: "Sea", lat: -4.0631, lng: 39.6669, aliases: ["old_port", "old port mombasa", "old port"] },
  { name: "Lamu Sea Port", type: "Sea", lat: -2.2696, lng: 40.9006, aliases: ["lamu_port", "lamu port", "lamu"] },
  { name: "Malindi Port", type: "Sea", lat: -3.2175, lng: 40.1191, aliases: ["malindi_port"] },
  { name: "Shimoni Sea Port", type: "Sea", lat: -4.6472, lng: 39.3811, aliases: ["shimoni"] },
  { name: "Vanga", type: "Sea", lat: -4.6167, lng: 39.2167, aliases: [] },
  { name: "Kisumu Pier", type: "Sea", lat: -0.1022, lng: 34.7617, aliases: ["kisumu_pier"] },
  { name: "Mbita", type: "Sea", lat: -0.4264, lng: 34.2042, aliases: ["mbita point"] },
  { name: "Muhuru-bay", type: "Sea", lat: -1.05, lng: 34.1333, aliases: ["muhuru_bay", "muhuru bay", "muhuru bay pier"] },

  { name: "Busia OSBP", type: "Land", lat: 0.46, lng: 34.12, aliases: ["busia", "busia border"] },
  { name: "Malaba OSBP", type: "Land", lat: 0.6347, lng: 34.2756, aliases: ["malaba", "malaba border"] },
  { name: "Lwakhakha Border Post", type: "Land", lat: 0.7333, lng: 34.6167, aliases: ["lwakhakha", "lwakhakha border"] },
  { name: "Suam Border Post", type: "Land", lat: 1.15, lng: 34.85, aliases: ["suam", "suam border"] },
  { name: "Isebania OSBP", type: "Land", lat: -1.2333, lng: 34.4833, aliases: ["isebania", "isebania border"] },
  { name: "Namanga OSBP", type: "Land", lat: -2.55, lng: 36.7833, aliases: ["namanga", "namanga border"] },
  { name: "Taveta OSBP", type: "Land", lat: -3.3997, lng: 37.6836, aliases: ["taveta", "taveta border"] },
  { name: "Lunga-lunga OSBP", type: "Land", lat: -4.5667, lng: 39.1167, aliases: ["lungalunga", "lunga lunga", "lunga-lunga"] },
  { name: "Moyale OSBP", type: "Land", lat: 3.527, lng: 39.056, aliases: ["moyale", "moyale border"] },
  { name: "Nadapal Border Post", type: "Land", lat: 4.4167, lng: 34.9333, aliases: ["nadapal", "nadapal border"] },
  { name: "Mandera Border", type: "Land", lat: 3.9366, lng: 41.8552, aliases: ["mandera"] },
  { name: "Liboi Border", type: "Land", lat: 0.35, lng: 40.8667, aliases: ["liboi"] },
  { name: "Kiunga Border", type: "Land", lat: -1.7167, lng: 41.4833, aliases: ["kiunga"] },
  { name: "Loitokitok Border", type: "Land", lat: -2.9167, lng: 37.5167, aliases: ["loitoktok", "loitokitok", "illasit", "illasit border"] },
  { name: "Sand River Gate", type: "Land", lat: -1.5833, lng: 35.05, aliases: ["sand_river_gate", "sand river"] },
  { name: "Ngomeni Border", type: "Land", lat: -3.45, lng: 37.75, aliases: ["ngomeni_border", "ngomeni"] },
  // Uhai "Kilindini Land": land-side screening at the Mombasa port gates, kept
  // apart from the sea port so the two Uhai channels stay separate pins.
  { name: "Kilindini Land", type: "Land", lat: -4.0583, lng: 39.6386, aliases: [] },
  // Uhai "Garissa": no seed coordinates; placed at Garissa town.
  { name: "Garissa", type: "Land", lat: -0.4532, lng: 39.6461, aliases: [] },
  { name: "Naivasha ICD", type: "Land", lat: -0.7167, lng: 36.4333, aliases: ["naivasha"] },
];

export const POE_TYPES = ["Air", "Sea", "Land"];

/** Approximate Kenya bounding box, used to frame the map. */
export const KENYA_BOUNDS = [
  [-4.7, 33.9],
  [5.0, 42.0],
];

export function normalizePoeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const EXACT_INDEX = new Map();
for (const location of POE_LOCATIONS) {
  for (const key of [location.name, ...location.aliases]) {
    const normalized = normalizePoeName(key);
    if (normalized && !EXACT_INDEX.has(normalized)) {
      EXACT_INDEX.set(normalized, location);
    }
  }
}

// Longest keys first so "kisumu pier" wins over "kisumu" style partials.
const PARTIAL_KEYS = [...EXACT_INDEX.keys()]
  .filter((key) => key.length >= 4)
  .sort((a, b) => b.length - a.length);

/**
 * Resolve a reported point-of-entry name to a known location.
 * Returns null when the name cannot be placed, so callers never pin an
 * unknown POE at an arbitrary point (e.g. the centre of Kenya).
 */
export function resolvePoeLocation(name) {
  const normalized = normalizePoeName(name);
  if (!normalized || normalized === "not recorded" || normalized === "unknown") {
    return null;
  }

  const exact = EXACT_INDEX.get(normalized);
  if (exact) return exact;

  const partial = PARTIAL_KEYS.find(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
  return partial ? EXACT_INDEX.get(partial) : null;
}

/**
 * Turn POE breakdown rows ({ name, filterValue, screened }) into map markers.
 *
 * A marker keeps the name the data uses (so pin, table and filter all say the
 * same thing) and the breakdown rows behind it, so a pin can open the same
 * linelist as its table row. Rows that resolve to the same location share one
 * pin; its name is the busiest row's name.
 */
export function buildPoeMarkers(rows) {
  const markers = new Map();
  const unmapped = [];

  for (const row of Array.isArray(rows) ? rows : []) {
    const screened = Number(row?.screened) || 0;
    const location = resolvePoeLocation(row?.name);
    if (!location) {
      if (screened > 0) unmapped.push({ name: String(row?.name ?? ""), screened });
      continue;
    }
    const current = markers.get(location.name) || {
      name: String(row.name),
      type: location.type,
      lat: location.lat,
      lng: location.lng,
      screened: 0,
      rows: [],
    };
    current.screened += screened;
    current.rows.push(row);
    current.rows.sort((a, b) => (Number(b?.screened) || 0) - (Number(a?.screened) || 0));
    current.name = String(current.rows[0].name);
    markers.set(location.name, current);
  }

  return {
    markers: [...markers.values()].sort((a, b) => b.screened - a.screened),
    unmapped,
  };
}
