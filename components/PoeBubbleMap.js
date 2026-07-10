"use client";

import { useMemo, useState } from "react";
import { fmt } from "@/lib/format";

// Kenya outline + projected point-of-entry coordinates were generated from a
// simplified national boundary (johan/world.geo.json) using one shared
// equirectangular projection, so bubbles align to the map. viewBox is fixed;
// the SVG scales responsively.
const VIEW_W = 520;
const VIEW_H = 657;
const KENYA_PATH =
  "M452.7,407.3 L489.3,458.3 L446.0,483.0 L430.8,508.7 L407.6,513.3 L398.9,556.8 " +
  "L379.0,581.8 L366.9,622.9 L342.1,643.3 L253.4,581.5 L249.1,545.7 L25.1,419.8 " +
  "L14.6,413.0 L14.0,347.5 L31.7,322.4 L62.1,281.5 L84.6,236.5 L57.4,165.5 " +
  "L50.2,134.5 L20.9,91.6 L58.9,54.7 L100.8,14.0 L132.9,24.4 L132.9,59.1 " +
  "L154.0,79.4 L197.0,79.4 L275.2,131.9 L294.8,132.5 L309.2,130.8 L322.9,137.9 " +
  "L364.1,142.8 L382.4,117.0 L438.9,91.2 L463.8,112.1 L506.0,112.1 L452.0,182.2 " +
  "L452.7,407.3 Z";

// The full set of points of entry, with projected coordinates and type. The map
// always shows ALL of these; live screening data is merged in by name match.
// labelSide controls which side the name label sits so they don't collide.
const POES = [
  { name: "JKIA (Nairobi)", match: ["jkia", "nairobi"], type: "Airport", x: 201.5, y: 435.8, labelSide: "right" },
  { name: "Mombasa", match: ["mombasa"], type: "Seaport / Airport", x: 370.9, y: 604.1, labelSide: "right" },
  { name: "Moyale", match: ["moyale"], type: "Land border", x: 333.2, y: 136.9, labelSide: "right" },
  { name: "Busia", match: ["busia"], type: "Land border", x: 27.5, y: 325.8, labelSide: "right" },
  { name: "Malaba", match: ["malaba"], type: "Land border", x: 36.8, y: 315.0, labelSide: "left" },
  { name: "Namanga", match: ["namanga"], type: "Land border", x: 193.1, y: 511.6, labelSide: "right" },
  { name: "Isebania", match: ["isebania", "sirare"], type: "Land border", x: 50.2, y: 431.3, labelSide: "left" },
  { name: "Lunga Lunga", match: ["lunga lunga"], type: "Land border", x: 336.8, y: 635.8, labelSide: "right" },
  { name: "Taveta", match: ["taveta"], type: "Land border", x: 247.9, y: 564.1, labelSide: "left" },
  { name: "Lokichogio", match: ["lokichogio", "lokichoggio"], type: "Land border", x: 42.1, y: 94.4, labelSide: "right" },
  { name: "Wajir", match: ["wajir"], type: "Airport", x: 394.9, y: 246.3, labelSide: "right" },
  { name: "Kisumu", match: ["kisumu"], type: "Airport", x: 65.6, y: 359.6, labelSide: "left" },
  { name: "Eldoret", match: ["eldoret"], type: "Airport", x: 97.1, y: 329.3, labelSide: "left" },
];

export const POE_COUNT = POES.length;

// Sequential teal scale by screening volume (light = low, dark = high).
const SCALE = ["#cfe8e3", "#86c8bd", "#3a9e90", "#0e6e63"];
function colorFor(frac) {
  if (frac >= 0.66) return SCALE[3];
  if (frac >= 0.33) return SCALE[2];
  if (frac >= 0.12) return SCALE[1];
  return SCALE[0];
}

const R_MIN = 9;
const R_MAX = 34;

export default function PoeBubbleMap({ byPoe = [] }) {
  const [hover, setHover] = useState(null);

  const { points, maxScreened, withData } = useMemo(() => {
    const live = byPoe.filter((p) => !p.unknown);
    const findLive = (poe) =>
      live.find((d) => {
        const k = (d.name || "").toLowerCase();
        return poe.match.some((m) => k.includes(m));
      });
    const max = live.reduce((m, p) => Math.max(m, p.screened || 0), 0) || 1;

    const points = POES.map((poe) => {
      const d = findLive(poe);
      const screened = d ? d.screened || 0 : 0;
      const has = Boolean(d) && screened > 0;
      const frac = screened / max;
      return {
        ...poe,
        screened,
        uniqueTravellers: d ? d.uniqueTravelers ?? null : null,
        has,
        r: has ? R_MIN + Math.sqrt(frac) * (R_MAX - R_MIN) : 5.5,
        fill: has ? colorFor(frac) : "#ffffff",
      };
    });
    // Big bubbles drawn first; small/no-data markers on top stay hoverable.
    points.sort((a, b) => b.r - a.r);
    return { points, maxScreened: max, withData: points.filter((p) => p.has).length };
  }, [byPoe]);

  const active = hover != null ? points[hover] : null;

  return (
    <div className="poe-map">
      <div className="poe-map__canvas">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          height="100%"
          role="img"
          aria-label="Screening volume by point of entry across Kenya"
          onMouseLeave={() => setHover(null)}
        >
          <path d={KENYA_PATH} fill="#eef4f3" stroke="#cdd9d6" strokeWidth={1.2} />

          {points.map((p, i) => {
            let labelLeft = p.labelSide === "left";
            let lx = labelLeft ? p.x - p.r - 6 : p.x + p.r + 6;
            if (lx < 8) {
              labelLeft = false;
              lx = p.x + p.r + 6;
            }
            if (lx > VIEW_W - 8) {
              labelLeft = true;
              lx = p.x - p.r - 6;
            }
            return (
              <g key={p.name}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hover === i ? p.r + 2 : p.r}
                  fill={p.fill}
                  fillOpacity={p.has ? 0.85 : 1}
                  stroke={p.has ? "#0b574e" : "#9bb0aa"}
                  strokeWidth={hover === i ? 2 : p.has ? 1 : 1.4}
                  strokeDasharray={p.has ? undefined : "2 2"}
                  style={{ cursor: "pointer", transition: "r 0.1s ease" }}
                  onMouseEnter={() => setHover(i)}
                />
                <text
                  x={lx}
                  y={p.y + 3.5}
                  fontSize={10.5}
                  fontWeight={hover === i ? 700 : 600}
                  fill="#3a4a44"
                  textAnchor={labelLeft ? "end" : "start"}
                  style={{ pointerEvents: "none" }}
                >
                  {p.name}
                </text>
              </g>
            );
          })}

          {active ? <Tooltip p={active} /> : null}
        </svg>
      </div>

      <div className="poe-map__side">
        <div className="poe-map__legend">
          <span className="poe-map__legend-title">Screening volume</span>
          <span className="poe-map__swatch"><i style={{ background: SCALE[0] }} />Low</span>
          <span className="poe-map__swatch"><i style={{ background: SCALE[2] }} />Medium</span>
          <span className="poe-map__swatch"><i style={{ background: SCALE[3] }} />High</span>
          <span className="poe-map__legend-note">Bubble size = screening records.</span>
          <span className="poe-map__swatch poe-map__swatch--empty">
            <i style={{ background: "#fff", borderStyle: "dashed", borderColor: "#9bb0aa" }} />
            Awaiting screening data
          </span>
        </div>

        <div className="poe-map__summary">
          <div>
            <div className="poe-map__summary-num">{POE_COUNT}</div>
            <div className="poe-map__summary-label">Points of entry</div>
          </div>
          <div>
            <div className="poe-map__summary-num">{withData}</div>
            <div className="poe-map__summary-label">Reporting screening</div>
          </div>
          <div>
            <div className="poe-map__summary-num">{fmt(maxScreened === 1 && !withData ? 0 : maxScreened)}</div>
            <div className="poe-map__summary-label">Peak volume (one POE)</div>
          </div>
        </div>

        <p className="poe-map__hint">Hover a point of entry to see its screening details.</p>
      </div>
    </div>
  );
}

// SVG-native tooltip so it always aligns with the bubble regardless of scaling.
function Tooltip({ p }) {
  const lines = p.has
    ? [`Screening records: ${fmt(p.screened)}`, `Unique travellers: ${fmt(p.uniqueTravellers)}`, p.type]
    : ["No screening data yet", p.type];
  const w = Math.max(p.name.length, ...lines.map((l) => l.length)) * 6.6 + 22;
  const h = 18 + lines.length * 15 + 8;
  let x = p.x - w / 2;
  let y = p.y - p.r - h - 6;
  x = Math.max(6, Math.min(x, VIEW_W - w - 6));
  if (y < 6) y = p.y + p.r + 6;
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={h} rx={7} fill="#0f1923" opacity={0.96} />
      <text x={x + 11} y={y + 19} fill="#fff" fontSize={12} fontWeight="700">{p.name}</text>
      {lines.map((l, i) => (
        <text key={i} x={x + 11} y={y + 36 + i * 15} fill="#cfe0dc" fontSize={11}>{l}</text>
      ))}
    </g>
  );
}
