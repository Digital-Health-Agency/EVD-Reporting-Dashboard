const DATASET_PATHS = new Set([
  "lab-results",
  "screenings",
  "cases",
  "outcomes",
  "contacts",
  "signals",
]);
const PAGING_PARAMS = new Set(["page", "limit", "pageSize"]);
const D15_FILENAME = /^evd-[a-z0-9]+(?:-[a-z0-9]+)*_(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})_exported-(\d{4}-\d{2}-\d{2})\.csv$/;

function isIsoCalendarDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf())
    && parsed.toISOString().slice(0, 10) === value;
}

function nativeAttachmentNavigation(url) {
  if (typeof document === "undefined") {
    throw new Error("Native download navigation is unavailable");
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.hidden = true;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
  }
}

export function linelistExportFilename(contentDisposition) {
  if (
    typeof contentDisposition !== "string"
    || contentDisposition.trim() === ""
    || /[\r\n]/.test(contentDisposition)
  ) {
    return null;
  }

  const parts = contentDisposition.split(";");
  if (parts.shift()?.trim().toLowerCase() !== "attachment") return null;

  let filename = null;
  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator < 1) return null;

    const name = part.slice(0, separator).trim().toLowerCase();
    if (name !== "filename") continue;
    if (filename !== null) return null;

    const rawValue = part.slice(separator + 1).trim();
    if (rawValue.startsWith('"')) {
      if (!rawValue.endsWith('"') || rawValue.length < 3) return null;
      filename = rawValue.slice(1, -1);
    } else {
      filename = rawValue;
    }
  }

  if (
    !filename
    || /[\\/"\r\n]/.test(filename)
    || filename.trim() !== filename
  ) {
    return null;
  }

  const match = D15_FILENAME.exec(filename);
  if (!match || !match.slice(1).every(isIsoCalendarDate)) return null;
  return filename;
}

export function exportLinelist(path, params = {}, options = {}) {
  if (!DATASET_PATHS.has(path)) {
    throw new TypeError("Invalid linelist export dataset");
  }

  const navigateImpl = options.navigateImpl ?? nativeAttachmentNavigation;
  if (typeof navigateImpl !== "function") {
    throw new TypeError("Linelist export navigator must be a function");
  }

  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (
      PAGING_PARAMS.has(key)
      || value === undefined
      || value === null
      || value === ""
    ) {
      return;
    }
    search.set(key, String(value));
  });

  const query = search.toString();
  const url = `/api/operational/linelist/${path}/export${query ? `?${query}` : ""}`;
  navigateImpl(url);
}
