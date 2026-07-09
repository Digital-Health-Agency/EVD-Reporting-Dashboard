export function resolveApiProxyUrl(env = process.env) {
  const rawUrl = env.SERVER_URL || env.NEXT_PUBLIC_SERVER_URL;

  if (!rawUrl?.trim()) {
    throw new Error(
      [
        "SERVER_URL is required for the dashboard API proxy.",
        "Set it to the API URL reachable from the dashboard container,",
        "for example http://server:4000.",
        "NEXT_PUBLIC_SERVER_URL is still accepted as a legacy fallback.",
      ].join(" "),
    );
  }

  return rawUrl.trim().replace(/\/+$/, "");
}
