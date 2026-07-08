// ClickHouse connection helper for the live adapter.
//
// Uses the official @clickhouse/client (Node). All connection settings come
// from the environment - nothing is hardcoded. This is the ONLY place that
// opens a connection to the warehouse; SQL itself lives in the live adapter.

import { createClient } from "@clickhouse/client";

let client;

/** Lazily create a singleton client from env vars. */
function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.CLICKHOUSE_HOST || "http://localhost:8123",
      username: process.env.CLICKHOUSE_USER || "default",
      password: process.env.CLICKHOUSE_PASSWORD || "",
      database: process.env.CLICKHOUSE_DB || "marts",
      // Keep reads cheap and predictable for a dashboard.
      clickhouse_settings: { max_execution_time: 15 },
    });
  }
  return client;
}

/** True when the minimum config needed to reach ClickHouse is present. */
export function isConfigured() {
  return Boolean(process.env.CLICKHOUSE_HOST && process.env.CLICKHOUSE_USER);
}

/**
 * Run a read-only SQL statement and return the parsed rows.
 * Parameters are bound via ClickHouse query params ({name:Type}) - never string
 * concatenation - so values from the API layer can't be injected into SQL.
 *
 * @param {string} sql
 * @param {Object} [query_params]  values for {name:Type} placeholders.
 * @returns {Promise<Array<Object>>}
 */
export async function query(sql, query_params = {}) {
  const resultSet = await getClient().query({
    query: sql,
    query_params,
    format: "JSONEachRow",
  });
  return resultSet.json();
}
