import assert from "node:assert/strict";
import test from "node:test";

import { resolveApiProxyUrl } from "../lib/api-proxy-config.js";

test("API proxy URL prefers server-only deployment env over legacy public env", () => {
  assert.equal(
    resolveApiProxyUrl({
      SERVER_URL: "http://evd-server:4000",
      NEXT_PUBLIC_SERVER_URL: "https://api.dl.nphl.go.ke",
    }),
    "http://evd-server:4000",
  );
});

test("API proxy URL falls back to the legacy public env for existing deployments", () => {
  assert.equal(
    resolveApiProxyUrl({
      NEXT_PUBLIC_SERVER_URL: "https://api.dl.nphl.go.ke/",
    }),
    "https://api.dl.nphl.go.ke",
  );
});

test("API proxy URL throws a deployment hint when no upstream is configured", () => {
  assert.throws(
    () => resolveApiProxyUrl({}),
    /SERVER_URL is required/,
  );
});
