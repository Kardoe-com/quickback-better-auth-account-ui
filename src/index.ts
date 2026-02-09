import './styles.css';

export { default as AuthApp } from './App';
export { default as authClient } from './auth/authClient';
export { appConfig, createAppConfig, setAppConfig } from './config/app';
export type { AppConfig, AppConfigOverrides, AuthRouteMode } from './config/app';
export * from './config/routes';
export { getApiBase, setApiBase, getAuthApiUrl, getDataApiUrl, getStorageApiUrl } from './config/runtime';
