/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QUICKBACK_URL?: string;
  readonly VITE_QUICKBACK_API_URL: string;
  readonly VITE_QUICKBACK_APP_URL: string;
  readonly VITE_QUICKBACK_ACCOUNT_URL?: string;
  readonly VITE_QUICKBACK_CMS_URL?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
