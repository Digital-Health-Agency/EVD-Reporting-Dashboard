import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("root layout renders the shared official footer", async () => {
  const [layout, footer] = await Promise.all([
    readFile(new URL("../app/layout.js", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteFooter.js", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /import SiteFooter from "@\/components\/SiteFooter";/);
  assert.match(layout, /<SiteFooter \/>/);
  assert.match(footer, /<footer className="site-footer"/);
  assert.match(footer, /Ministry of Health, Kenya/);
  assert.match(footer, /Digital Health Agency/);
  assert.match(footer, /Dial 147/);
  assert.match(footer, /helpdesk@dha\.go\.ke/);
});
