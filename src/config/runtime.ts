import { appConfig } from './app';

type RuntimeConfig = {
  apiBase: string | null;
  appUrl: string | null;
};

function resolveApiBase(): string {
  const env = (import.meta as any)?.env as Record<string, string | undefined> | undefined;
  const apiUrl = (globalThis as any).__QUICKBACK_API_URL__ || env?.VITE_API_URL;
  if (!apiUrl) {
    throw new Error('VITE_API_URL environment variable is required. Set it in your .env file.');
  }
  return apiUrl;
}

function resolveAppUrl(): string | null {
  const env = (import.meta as any)?.env as Record<string, string | undefined> | undefined;
  return (
    (globalThis as any).__QUICKBACK_APP_URL__ ||
    env?.VITE_APP_URL ||
    null
  );
}

// Lazy initialization - don't resolve at module load time
const runtimeConfig: RuntimeConfig = {
  apiBase: null,
  appUrl: null,
};

export function setApiBase(url: string) {
  if (url && typeof url === 'string') {
    runtimeConfig.apiBase = url;
  }
}

export function getApiBase() {
  // Lazy resolve on first access
  if (runtimeConfig.apiBase === null) {
    runtimeConfig.apiBase = resolveApiBase();
  }
  return runtimeConfig.apiBase;
}

export function setAppUrl(url: string | null) {
  runtimeConfig.appUrl = url;
}

export function getAppUrl() {
  // Lazy resolve on first access
  if (runtimeConfig.appUrl === null) {
    runtimeConfig.appUrl = resolveAppUrl();
  }
  return runtimeConfig.appUrl;
}

/** Build a full auth API URL: baseURL + auth basePath + endpoint */
export function getAuthApiUrl(endpoint: string): string {
  return `${getApiBase()}${appConfig.routes.api.auth}${endpoint}`;
}

/** Build a full data API URL: baseURL + data prefix + path. Throws if data path not configured. */
export function getDataApiUrl(path: string): string {
  if (!appConfig.routes.api.data) {
    throw new Error('Data API path not configured. Set authRoute to "quickback" or configure routes.api.data.');
  }
  return `${getApiBase()}${appConfig.routes.api.data}${path}`;
}

/** Build a full storage API URL: baseURL + storage prefix + path. Throws if storage path not configured. */
export function getStorageApiUrl(path: string): string {
  if (!appConfig.routes.api.storage) {
    throw new Error('Storage API path not configured. Set authRoute to "quickback" or configure routes.api.storage.');
  }
  return `${getApiBase()}${appConfig.routes.api.storage}${path}`;
}
