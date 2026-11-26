"use client";

/*
 * Points-of-entry screening map for the operational POE tab.
 *
 * OpenStreetMap tiles showing Kenya only (everything outside the border is
 * masked, and the view cannot leave Kenya), the Kenya outline in teal,
 * and 3D pushpins coloured by Air / Sea / Land (styling ported from the Uhai
 * screening platform's "Entry Points by Type" map). Each pin is one POE from
 * the tab's breakdown; clicking it opens that POE's screening linelist.
 *
 * Leaflet touches `window`, so this module must only be loaded on the client
 * (see the next/dynamic import in OperationalWorkspace).
 */

import { useMemo } from "react";
import L from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Rectangle,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fmt } from "@/lib/format";
import { KENYA_BOUNDS, POE_TYPES } from "@/lib/poe-locations";
import { KenyaMask, LockToKenya, useKenyaBorder } from "@/components/operational/KenyaOnly";

// OpenStreetMap standard tiles. The OSM tile policy requires the credit line
// to stay visible, so the attribution control is kept on.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const MAX_ZOOM = 13;

const KENYA_COLOR = "#0d9488";

export const POE_TYPE_COLORS = {
  Air: "#64748b",
  Sea: "#2563eb",
  Land: "#d97706",
};

const KENYA_CENTER = [0.0236, 37.9062];

function buildPushpinIcon(type) {
  return L.divIcon({
    className: "poe-pushpin-wrap",
    html: `<div class="poe-pushpin poe-pushpin--${type.toLowerCase()}"><div class="poe-pushpin__head"></div><div class="poe-pushpin__needle"></div></div>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

// Light fill so OpenStreetMap roads and towns stay readable under it.
const KENYA_STYLE = {
  fillColor: KENYA_COLOR,
  fillOpacity: 0.1,
  color: KENYA_COLOR,
  weight: 2.5,
  opacity: 1,
};

function onKenyaFeature(_feature, layer) {
  layer.bindTooltip(
    `<strong>Kenya</strong><br/><span style="opacity:.8">Points of entry</span>`,
    { sticky: true, className: "poe-map-tip", direction: "top" },
  );
}

/**
 * @param markers  buildPoeMarkers output; a marker with a `linelist` entry
 *                 opens it on click
 * @param onSelect called with that linelist entry when a pin is clicked
 */
export default function PoeScreeningMap({ markers = [], onSelect }) {
  const border = useKenyaBorder();

  const icons = useMemo(
    () => Object.fromEntries(POE_TYPES.map((type) => [type, buildPushpinIcon(type)])),
    [],
  );

  return (
    <div className="poe-map">
      <MapContainer
        center={KENYA_CENTER}
        zoom={6}
        maxZoom={MAX_ZOOM}
        zoomSnap={0.25}
        className="poe-map__canvas"
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={MAX_ZOOM} />
        <LockToKenya />
        <KenyaMask border={border} />

        {border ? (
          <GeoJSON data={border} style={KENYA_STYLE} onEachFeature={onKenyaFeature} />
        ) : (
          <Rectangle
            bounds={KENYA_BOUNDS}
            pathOptions={{
              color: KENYA_COLOR,
              weight: 2,
              fillColor: KENYA_COLOR,
              fillOpacity: 0.08,
              dashArray: "4 4",
            }}
          />
        )}

        {markers.map((marker) => {
          const clickable = Boolean(onSelect && marker.linelist);
          return (
            <Marker
              key={marker.name}
              position={[marker.lat, marker.lng]}
              icon={icons[marker.type]}
              title={`${marker.name}: ${fmt(marker.screened)} screened`}
              keyboard={clickable}
              eventHandlers={clickable ? { click: () => onSelect(marker.linelist) } : undefined}
            >
              <Tooltip direction="top" offset={[0, -28]} opacity={1} className="poe-map-tip">
                <strong>{marker.name}</strong>
                <br />
                Type: {marker.type}
                <br />
                Screened: {fmt(marker.screened)}
                {marker.rows?.length > 1 ? (
                  <>
                    <br />
                    Also reported as:{" "}
                    {marker.rows.slice(1).map((row) => row.name).join(", ")}
                  </>
                ) : null}
                {clickable ? (
                  <>
                    <br />
                    <span className="poe-map-tip__hint">Click to view linelist</span>
                  </>
                ) : null}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="poe-map__legend" aria-label="Map legend">
        <span className="poe-map__legend-title">Entry type</span>
        <ul>
          {POE_TYPES.map((type) => (
            <li key={type}>
              <span className="poe-map__swatch" style={{ background: POE_TYPE_COLORS[type] }} />
              {type}
            </li>
          ))}
          <li>
            <span className="poe-map__swatch" style={{ background: KENYA_COLOR }} />
            Kenya
          </li>
        </ul>
      </div>
    </div>
  );
}
