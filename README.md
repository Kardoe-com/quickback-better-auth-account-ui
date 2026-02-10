# Quickback Better Auth Account UI

A ready-to-deploy account management frontend for any [Better Auth](https://www.better-auth.com/) backend. Includes authentication (login, signup, password reset), organization management, device authorization (CLI login), passkeys, and optional Stripe billing.

Built with React, Vite, Tailwind CSS, and deployable to Cloudflare Workers.

## Quick Start (Standalone)

Clone the repo and own the source — edit anything you want:

```bash
npx degit Kardoe-com/quickback-better-auth-account-ui my-account-app
cd my-account-app
npm install
npm run dev
```

## Library Usage

Install as a dependency and get updates via `npm update`:

```bash
npm install quickback-better-auth-account-ui
```

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthApp, setAppConfig } from 'quickback-better-auth-account-ui';
import 'quickback-better-auth-account-ui/styles.css';

setAppConfig({
  authRoute: 'quickback',
  name: 'My App',
  companyName: 'My Company',
  tagline: 'My tagline',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthApp />
    </BrowserRouter>
  </React.StrictMode>
);
```

The Cloudflare Worker entry is also available:

```ts
export { default } from 'quickback-better-auth-account-ui/worker';
```

## Configure

Copy the example env file and fill in your values:

```bash
cp .env.example .env.development
```

```bash
# Your Better Auth API backend
VITE_API_URL=http://localhost:3000

# This frontend's URL
VITE_APP_URL=http://localhost:5173

# Optional: Stripe publishable key (if using billing plugin)
VITE_STRIPE_PUBLISHABLE_KEY=
```

## Develop

```bash
npm run dev        # Vite dev server
npm run build      # SPA build → dist/client/
npm run build:lib  # Library build → dist/ (for npm publishing)
npm run typecheck
```

## Deploy to Cloudflare

1. Update `wrangler.toml` with your Worker name (and optionally a custom domain)
2. Set secrets in the Cloudflare dashboard or via `wrangler secret put`
3. Deploy:

```bash
npx wrangler deploy
```

## Auth Route Modes

The app supports three routing approaches, configured via `VITE_AUTH_ROUTE`:

| Mode | Auth path | Data path | Use when |
|------|-----------|-----------|----------|
| `better-auth` | `/api/auth` | `/api/auth` | Standalone Better Auth backend |
| `quickback` (default) | `/auth/v1` | `/api/v1` | Quickback-generated backend |
| custom | Set explicitly in `src/config/runtime.ts` | — | Non-standard routing |

## Feature Flags

Toggle features via environment variables to match your backend's plugin configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_SIGNUP` | `true` | Show signup page |
| `VITE_ENABLE_ORGANIZATIONS` | `true` | Organization management |
| `VITE_ENABLE_PASSKEYS` | `true` | WebAuthn passkey support |
| `VITE_ENABLE_EMAIL_OTP` | `false` | Email one-time passwords |

## Backend Requirements

Your Better Auth backend should have these plugins enabled (matching the features you use):

- `organization` — multi-tenant management
- `admin` — user dashboard
- `apiKey` — API key generation
- `@better-auth/passkey` — WebAuthn
- `emailOTP` — one-time passwords
- `deviceAuthorization` — CLI device auth flow

### CORS

Your backend must include this frontend's origin in its trusted origins / CORS configuration.

## Project Structure

```
├── src/
│   ├── main.tsx              # App entry point
│   ├── App.tsx               # Router & routes
│   ├── worker.ts             # Cloudflare Worker entry
│   ├── auth/                 # Better Auth client setup
│   ├── config/               # Runtime config, feature flags, routes
│   ├── pages/                # Page components
│   ├── components/           # Shared UI components
│   ├── layouts/              # Auth & public layouts
│   └── lib/                  # API client, utilities
├── .env.example              # Environment template
├── wrangler.toml             # Cloudflare Worker config
├── vite.config.ts            # Vite build config
└── tailwind.config.ts        # Tailwind CSS config
```

## Notes

- Accept-invitation links use `/accept-invitation/:id` and will redirect through login/signup if needed.
- Anonymous upgrade uses `POST /api/auth/upgrade-anonymous` on your API.

## License

MIT
