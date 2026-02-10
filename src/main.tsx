import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './app/globals.css';

// Quickback ASCII logo
console.log(`
     ..######
   .########.
  ##########
 ###########
###########
###########
       ###########
       ###########
      ###########
      ##########
     .########.
     ######..

  Account UI
`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// ─────────────────────────────────────────────────────────────────────
// LIBRARY MODE — If you installed this as an npm package instead of
// cloning the template, replace everything above with the following:
//
//   import React from 'react';
//   import ReactDOM from 'react-dom/client';
//   import { BrowserRouter } from 'react-router-dom';
//
//   (globalThis as any).__QUICKBACK_API_URL__ = import.meta.env.VITE_API_URL;
//   (globalThis as any).__QUICKBACK_APP_URL__ = import.meta.env.VITE_APP_URL;
//
//   Promise.all([
//     import('quickback-better-auth-account-ui'),
//     import('quickback-better-auth-account-ui/styles.css'),
//   ]).then(([{ AuthApp, setAppConfig }]) => {
//     setAppConfig({
//       authRoute: 'quickback',  // or 'better-auth'
//
//       // App identity
//       name: 'My App',
//       tagline: 'Welcome to My App',
//       description: 'Account management for My App',
//       companyName: 'My Company Inc.',
//
//       // URLs
//       urls: {
//         base: 'https://account.example.com',
//         app: 'https://app.example.com',
//         tenantPattern: '/organizations/{slug}',
//         support: 'https://example.com/support',
//         privacy: 'https://example.com/privacy',
//         terms: 'https://example.com/terms',
//       },
//
//       // Branding
//       branding: { primaryColor: '#1e293b' },
//
//       // Labels
//       labels: {
//         terms: 'Terms of Service',
//         privacy: 'Privacy Policy',
//         support: 'Support',
//         company: 'My Company Inc.',
//         organizations: 'Organizations',
//       },
//
//       // Email
//       email: {
//         fromEmail: 'noreply@example.com',
//         fromName: 'My App',
//         replyTo: 'support@example.com',
//         supportEmail: 'support@example.com',
//         region: 'us-east-1',
//         rateLimit: { maxEmailsPerHour: 100, maxEmailsPerDay: 500 },
//       },
//
//       // Features
//       features: {
//         signup: true,
//         organizations: true,
//         admin: true,
//         passkeys: true,
//         emailOTP: true,
//         magicLink: true,
//         socialAuth: false,
//         emailVerification: true,
//         accountDeletion: true,
//         fileUploads: false,
//         themeToggle: true,
//         teams: true,
//       },
//     });
//
//     ReactDOM.createRoot(document.getElementById('root')!).render(
//       <React.StrictMode>
//         <BrowserRouter>
//           <AuthApp />
//         </BrowserRouter>
//       </React.StrictMode>
//     );
//   });
// ─────────────────────────────────────────────────────────────────────
