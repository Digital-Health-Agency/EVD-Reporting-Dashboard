"use client";

/*
 * Kenya county map for the operational Summary tab: OpenStreetMap tiles
 * (Kenya only; outside the border is masked) with
 * the 47 counties shaded by the selected indicator (yellow → red heat scale,
 * zero in neutral grey). Hovering a county shows its count; clicking one with
 * a linelist opens it.
 *
 * Leaflet touches `window`, so this module must only be loaded on the client
 * (see the next/dynamic import in OperationalWorkspace).
 */

import { useEffect, useMemo, useRef } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fmt } from "@/lib/format";
import { countyColor, countyKey } from "@/lib/kenya-counties";
import { KenyaMask, LockToKenya, useKenyaBorder } from "@/components/operational/KenyaOnly";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * @param geo        county FeatureCollection
 * @param byCounty   Map countyKey → joined row (see joinCountyRows)
 * @param indicator  { key, label }
 * @param classes    countyClasses output for the selected indicator
 * @param linelistFor  (row) => linelist entry or null
 * @param onSelect   called with the linelist entry when a county is clicked
 * @param highlight  countyKey of the county hovered in the side list
 */
export default function CountyChoroplethMap({
  geo,
  byCounty,
  indicator,
  classes,
  linelistFor,
  onSelect,
  highlight,
}) {
  const layerRef = useRef(null);
  const border = useKenyaBorder();

  // Re-key the GeoJSON layer when the data changes: react-leaflet does not
  // restyle or rebind an existing GeoJSON layer.
  const layerKey = useMemo(
    () => `${indicator.key}:${[...byCounty.values()].map((row) => `${row.name}=${row[indicator.key]}`).join("|")}`,
    [byCounty, indicator.key],
  );

  function styleFor(feature) {
    const row = byCounty.get(countyKey(feature.properties.name));
    const value = row?.[indicator.key] || 0;
    return {
      fillColor: countyColor(value, classes),
      fillOpacity: value > 0 ? 0.9 : 0.35,
      color: "#ffffff",
      weight: 1.2,
      opacity: 1,
    };
  }

  function onEachFeature(feature, layer) {
    const row = byCounty.get(countyKey(feature.properties.name));
    const value = row?.[indicator.key] || 0;
    const entry = value > 0 && row ? linelistFor(row) : null;
    layer.bindTooltip(
      `<strong>${escapeHtml(feature.properties.name)}</strong><br/>` +
        `${escapeHtml(indicator.label)}: ${fmt(value)}` +
        (entry ? `<br/><span class="poe-map-tip__hint">Click to view linelist</span>` : ""),
      { sticky: true, className: "poe-map-tip", direction: "top" },
    );
    layer.on({
      mouseover: () => layer.setStyle({ weight: 3, color: "#0f1f35" }),
      mouseout: () => layer.setStyle(styleFor(feature)),
      click: () => {
        if (entry) onSelect(entry);
      },
    });
  }

  // Outline the county hovered in the side list.
  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.eachLayer((layer) => {
      const key = countyKey(layer.feature?.properties?.name);
      layer.setStyle(
        key === highlight ? { weight: 3, color: "#0f1f35" } : styleFor(layer.feature),
      );
      if (key === highlight) layer.bringToFront();
    });
    // styleFor reads the same inputs as layerKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, layerKey]);

  return (
    <div className="poe-map county-map">
      <MapContainer
        center={[0.2, 37.9]}
        zoom={6}
        maxZoom={11}
        zoomSnap={0.25}
        className="poe-map__canvas"
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={11} />
        <LockToKenya />
        <KenyaMask border={border} />
        {geo ? (
          <GeoJSON
            key={layerKey}
            ref={layerRef}
            data={geo}
            style={styleFor}
            onEachFeature={onEachFeature}
          />
        ) : null}
      </MapContainer>

      <div className="poe-map__legend county-map__legend" aria-label={`${indicator.label} scale`}>
        <span className="poe-map__legend-title">{indicator.label}</span>
        <ul>
          <li>
            <span className="county-map__swatch" style={{ background: countyColor(0, classes) }} />
            0
          </li>
          {classes.map((entry) => (
            <li key={entry.from}>
              <span className="county-map__swatch" style={{ background: entry.color }} />
              {entry.from === entry.to ? fmt(entry.from) : `${fmt(entry.from)}–${fmt(entry.to)}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
