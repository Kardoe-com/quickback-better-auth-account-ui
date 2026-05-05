import './styles.css';

export { default as AuthApp } from './App';
export { default as authClient } from './auth/authClient';
export { appConfig, createAppConfig, setAppConfig } from './config/app';
export type { AppConfig, AppConfigOverrides, AuthRouteMode } from './config/app';

export {
  getApiBase,
  setApiBase,
  getAppUrl,
  setAppUrl,
  getAccountUrl,
  setAccountUrl,
  getCmsUrl,
  setCmsUrl,
  getAuthApiUrl,
  getDataApiUrl,
  getStorageApiUrl,
  getBroadcastWsUrl,
  getBroadcastTicketUrl,
} from './config/runtime';
export { RealtimeProvider, useRealtime, useRealtimeStatus } from './providers/RealtimeProvider';
export type { RealtimeMessage } from './providers/RealtimeProvider';
