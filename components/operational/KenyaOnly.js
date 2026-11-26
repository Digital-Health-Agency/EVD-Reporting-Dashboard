"use client";

/*
 * Shared "Kenya only" pieces for the operational maps (POE map and county
 * map): an opaque mask over everything outside Kenya's border, and a view
 * locked to Kenya (no panning or zooming out to neighbouring countries).
 *
 * Leaflet-only module: load it from client components behind next/dynamic.
 */

import { useEffect, useState } from "react";
import { Pane, Polygon, useMap } from "react-leaflet";
import { KENYA_BOUNDS } from "@/lib/poe-locations";

// Kenya outline extracted from datasets/geo-countries (the source Uhai fetches).
const KENYA_BORDER_URL = "/kenya-border.geojson";

// Matches the map panel background, so outside Kenya reads as empty page.
export const MASK_COLOR = "#f4f6f9";

// Allow a little slack past the border when panning a zoomed-in map.
const PAN_LIMIT = [
  [KENYA_BOUNDS[0][0] - 0.6, KENYA_BOUNDS[0][1] - 0.6],
  [KENYA_BOUNDS[1][0] + 0.6, KENYA_BOUNDS[1][1] + 0.6],
];

// Covers the whole visible world; Kenya is cut out of it as holes.
const WORLD_RING = [
  [-89, -179],
  [-89, 179],
  [89, 179],
  [89, -179],
];

let cachedBorder = null;
let borderPromise = null;

function loadKenyaBorder() {
  if (cachedBorder) return Promise.resolve(cachedBorder);
  if (!borderPromise) {
    borderPromise = fetch(KENYA_BORDER_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((geo) => {
        cachedBorder = geo;
        return geo;
      })
      .catch(() => {
        borderPromise = null;
        return null;
      });
  }
  return borderPromise;
}

export function useKenyaBorder() {
  const [border, setBorder] = useState(cachedBorder);
  useEffect(() => {
    let alive = true;
    loadKenyaBorder().then((geo) => {
      if (alive && geo) setBorder(geo);
    });
    return () => {
      alive = false;
    };
  }, []);
  return border;
}

/** Outer rings of Kenya's polygons as Leaflet [lat, lng] rings. */
function kenyaRings(border) {
  const rings = [];
  for (const feature of border?.features ?? []) {
    const geometry = feature.geometry;
    const polygons =
      geometry?.type === "Polygon"
        ? [geometry.coordinates]
        : geometry?.type === "MultiPolygon"
          ? geometry.coordinates
          : [];
    for (const polygon of polygons) {
      rings.push(polygon[0].map(([lng, lat]) => [lat, lng]));
    }
  }
  return rings;
}

/**
 * Opaque mask over everything outside Kenya. Sits above the basemap tiles
 * (z 200) and below data layers (overlay pane z 400, markers z 600).
 */
export function KenyaMask({ border }) {
  const rings = kenyaRings(border);
  if (rings.length === 0) return null;
  return (
    <Pane name="kenya-mask" style={{ zIndex: 350 }}>
      <Polygon
        positions={[WORLD_RING, ...rings]}
        interactive={false}
        pathOptions={{
          stroke: false,
          fillColor: MASK_COLOR,
          fillOpacity: 1,
        }}
      />
      {rings.map((ring, index) => (
        <Polygon
          key={index}
          positions={ring}
          interactive={false}
          pathOptions={{ color: "#64748b", weight: 1.5, fill: false }}
        />
      ))}
    </Pane>
  );
}

/**
 * Fit Kenya to the map and make that the furthest zoom-out, so the view
 * never shows the region around it. Re-fits when the map is resized.
 */
export function LockToKenya({ padding = 8 }) {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(PAN_LIMIT);
    map.options.maxBoundsViscosity = 1;
    const fit = () => {
      map.invalidateSize({ animate: false });
      map.setMinZoom(0);
      map.fitBounds(KENYA_BOUNDS, { padding: [padding, padding], animate: false });
      map.setMinZoom(map.getZoom());
    };
    fit();
    const timer = window.setTimeout(fit, 300);
    window.addEventListener("resize", fit);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", fit);
    };
  }, [map, padding]);
  return null;
}
