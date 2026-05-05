import { appConfig } from './app';

type RuntimeConfig = {
  apiBase: string | null;
  appUrl: string | null;
  accountUrl: string | null;
  cmsUrl: string | null;
};

function getEnv(): Record<string, string | undefined> | undefined {
  return (import.meta as any)?.env as Record<string, string | undefined> | undefined;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveBaseUrl(): string | null {
  const env = getEnv();
  const base =
    (globalThis as any).__QUICKBACK_URL__ ||
    env?.VITE_QUICKBACK_URL ||
    null;
  return base ? stripTrailingSlash(base) : null;
}

function resolveApiBase(): string {
  const env = getEnv();
  const apiUrl =
    (globalThis as any).__QUICKBACK_API_URL__ ||
    env?.VITE_QUICKBACK_API_URL ||
    resolveBaseUrl();
  if (!apiUrl) {
    throw new Error(
      'VITE_QUICKBACK_URL or VITE_QUICKBACK_API_URL environment variable is required. Set one in your .env file.',
    );
  }
  return apiUrl;
}

function resolveAppUrl(): string | null {
  const env = getEnv();
  return (
    (globalThis as any).__QUICKBACK_APP_URL__ ||
    env?.VITE_QUICKBACK_APP_URL ||
    null
  );
}

function resolveAccountUrl(): string | null {
  const env = getEnv();
  const explicit =
    (globalThis as any).__QUICKBACK_ACCOUNT_URL__ ||
    env?.VITE_QUICKBACK_ACCOUNT_URL;
  if (explicit) return explicit;
  const base = resolveBaseUrl();
  return base ? `${base}/account` : null;
}

function resolveCmsUrl(): string | null {
  const env = getEnv();
  const explicit =
    (globalThis as any).__QUICKBACK_CMS_URL__ ||
    env?.VITE_QUICKBACK_CMS_URL;
  if (explicit) return explicit;
  const base = resolveBaseUrl();
  return base ? `${base}/cms` : null;
}

// Lazy initialization - don't resolve at module load time
const runtimeConfig: RuntimeConfig = {
  apiBase: null,
  appUrl: null,
  accountUrl: null,
  cmsUrl: null,
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

export function setAccountUrl(url: string | null) {
  runtimeConfig.accountUrl = url;
}

export function getAccountUrl() {
  if (runtimeConfig.accountUrl === null) {
    runtimeConfig.accountUrl = resolveAccountUrl();
  }
  return runtimeConfig.accountUrl;
}

export function setCmsUrl(url: string | null) {
  runtimeConfig.cmsUrl = url;
}

export function getCmsUrl() {
  if (runtimeConfig.cmsUrl === null) {
    runtimeConfig.cmsUrl = resolveCmsUrl();
  }
  return runtimeConfig.cmsUrl;
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

/** Build the WebSocket URL for broadcast subscriptions */
export function getBroadcastWsUrl(): string {
  const base = getApiBase().replace(/^http/, 'ws');
  const broadcastPath = appConfig.routes.api.broadcast || '/broadcast/v1';
  return `${base}${broadcastPath}/websocket`;
}

/** Build the URL for fetching a ws-ticket */
export function getBroadcastTicketUrl(): string {
  const broadcastPath = appConfig.routes.api.broadcast || '/broadcast/v1';
  return `${getApiBase()}${broadcastPath}/ws-ticket`;
}
