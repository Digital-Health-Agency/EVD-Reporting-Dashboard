import { APP_ID_HEADER, EVD_APP_ID } from "./app-id";

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function normalizeEndpoint(endpoint) {
  return endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
}

function appendParams(url, params) {
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

async function parseError(response) {
  const body = await response.json().catch(() => ({
    message: "An unexpected error occurred",
  }));
  const message =
    typeof body?.message === "string"
      ? body.message
      : `Request failed with status ${response.status}`;
  return new ApiError(message, response.status, body);
}

async function request(endpoint, options = {}) {
  const { params, ...fetchOptions } = options;
  const isFormData = fetchOptions.body instanceof FormData;
  const response = await fetch(appendParams(normalizeEndpoint(endpoint), params), {
    ...fetchOptions,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      [APP_ID_HEADER]: EVD_APP_ID,
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) return undefined;
  return response.json();
}

export const api = {
  get: (endpoint, params) => request(endpoint, { method: "GET", params }),
  post: (endpoint, data) =>
    request(endpoint, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  patch: (endpoint, data) =>
    request(endpoint, {
      method: "PATCH",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
  upload: (endpoint, formData) =>
    request(endpoint, {
      method: "POST",
      body: formData,
      headers: {},
    }),
};
