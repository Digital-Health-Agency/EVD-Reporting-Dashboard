import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicAssetUrl = new URL("../public/images/evd-public-hero.webp", import.meta.url);
const operationalAssetUrl = new URL("../public/images/evd-operational-hero.webp", import.meta.url);

function assertWebpAsset(asset) {
  assert.equal(asset.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(asset.subarray(8, 12).toString("ascii"), "WEBP");
  assert.ok(asset.byteLength > 0);
  assert.ok(asset.byteLength < 200 * 1024);
}

function ruleBody(styles, selector) {
  const marker = `\n${selector} {`;
  const start = styles.indexOf(marker);
  assert.notEqual(start, -1, `Missing ${selector} rule`);
  const bodyStart = start + marker.length;
  const end = styles.indexOf("}", bodyStart);
  assert.notEqual(end, -1, `Unclosed ${selector} rule`);
  return styles.slice(bodyStart, end);
}

test("dashboard heroes use distinct generated WebP backgrounds with accessible scrims", async () => {
  const [styles, publicAsset, operationalAsset] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(publicAssetUrl),
    readFile(operationalAssetUrl),
  ]);

  const publicHero = ruleBody(styles, ".public-hero");
  const publicScrim = ruleBody(styles, ".public-hero::before");
  const publicCopy = ruleBody(styles, ".public-hero__copy");
  const operationalHero = ruleBody(styles, ".ops-hero");
  const operationalScrim = ruleBody(styles, ".ops-hero::before");
  const operationalCopy = ruleBody(styles, ".ops-hero__copy");

  assert.match(publicHero, /background-color: var\(--color-navy\);/);
  assert.match(publicHero, /background-image: url\("\/images\/evd-public-hero\.webp"\);/);
  assert.match(publicHero, /background-repeat: no-repeat;/);
  assert.match(publicHero, /background-size: cover;/);
  assert.match(publicScrim, /background: rgba\(/);

  assert.match(operationalHero, /background-color: var\(--color-navy\);/);
  assert.match(operationalHero, /background-image: url\("\/images\/evd-operational-hero\.webp"\);/);
  assert.match(operationalHero, /background-repeat: no-repeat;/);
  assert.match(operationalHero, /background-size: cover;/);
  assert.match(operationalScrim, /background: rgba\(/);

  for (const [name, copy] of [
    ["public", publicCopy],
    ["operational", operationalCopy],
  ]) {
    assert.match(copy, /max-width: 1240px;/, `${name} hero copy keeps the shared maximum width`);
    assert.match(copy, /width: 100%;/, `${name} hero copy fills the centered container`);
    assert.match(copy, /margin: 0 auto;/, `${name} hero copy remains centered`);
    assert.match(
      copy,
      /padding: clamp\(32px, 5vw, 48px\) 24px;/,
      `${name} hero copy keeps the shared desktop gutter`,
    );
  }
  assert.match(
    styles,
    /\.public-hero__copy,\s*\.ops-hero__copy\s*\{ padding: 24px 16px; \}/,
    "both hero copy containers share the compact 16px gutter",
  );

  assertWebpAsset(publicAsset);
  assertWebpAsset(operationalAsset);
});
