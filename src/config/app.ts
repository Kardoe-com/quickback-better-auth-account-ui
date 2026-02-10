export type AuthRouteMode = 'quickback' | 'better-auth' | 'custom';

export interface AppConfig {
  // Auth Route Mode
  authRoute: AuthRouteMode;

  // App Identity
  name: string;
  tagline: string;
  description: string;
  
  // Company Information
  companyName?: string;
  companyAddress?: string;
  
  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    twitterCard: 'summary' | 'summary_large_image';
    siteName: string;
    locale: string;
    themeColor: string;
  };
  
  // URLs
  urls: {
    base: string;
    support?: string;
    privacy?: string;
    terms?: string;
    github?: string;
    /**
     * Main app URL (optional)
     * The URL of your main features/business logic app
     */
    app?: string;
    /**
     * Tenant/Organization URL pattern (optional)
     * Template for organization-specific URLs in your main app
     * Use {slug} as placeholder for the organization slug
     * Examples:
     *   - "/organizations/{slug}"
     *   - "/tenant/{slug}"
     *   - "/workspace/{slug}"
     *   - "https://{slug}.yourdomain.com"
     */
    tenantPattern?: string;
  };
  
  // Labels
  labels: {
    terms: string;
    privacy: string;
    support: string;
    company: string;
    organizations?: string;
  };
  
  // Messages
  messages: {
    noOrganizations?: string;
    contactAdminForInvite?: string;
    noPendingInvitations?: string;
    accountInformation?: string;
    timezone?: string;
    serverLocation?: string;
    memberSince?: string;
    pendingInvitations?: string;
    invitedAs?: string;
    accept?: string;
    decline?: string;
    createOrganization?: string;
    userFallback?: string;
    noEmailProvided?: string;
    more?: string;
    total?: string;
    active?: string;
    new?: string;
  };
  
  // Branding
  branding: {
    primaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  
  // Auth Configuration
  auth: {
    enableSignup: boolean;
    disableEmailStatusCheck: boolean;
    requireEmailVerification: boolean;
    passwordRequirements: {
      minLength: number;
      maxLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionDuration: number; // in seconds
    resetPasswordTokenExpiresIn: number; // in seconds
    emailVerificationCooldown: number; // in seconds
  };
  

  // Email Configuration
  email: {
    fromEmail: string;
    fromName: string;
    replyTo: string;
    supportEmail?: string;
    region: string;
    rateLimit: {
      maxEmailsPerHour: number;
      maxEmailsPerDay: number;
    };
  };

  // Rate Limiting Configuration
  rateLimit: {
    enabled: boolean;
    window: number; // in seconds
    maxRequests: number;
    customRules: {
      signInEmail: { window: number; max: number; };
      signInSocial: { window: number; max: number; };
    };
  };

  // Route Configuration
  routes: {
    public: {
      home: string;
      login: string;
      signup: string;
      forgotPassword: string;
      emailOTP: string;
      welcome: string;
    };
    authenticated: {
      dashboard: string;
      profile: string;
      settings: string;
      managePasskeys: string;
      manageDevices: string;
      setupPasskey: string;
      apiKeys: string;
    };
    organizations: {
      list: string;
      create: string;
      detail: (slug: string) => string;
      members: (slug: string) => string;
      invitations: (slug: string) => string;
      settings: (slug: string) => string;
      acceptInvitation: (id: string) => string;
    };
    admin: {
      dashboard: string;
      users: string;
    };
    api: {
      auth: string;
      data?: string;
      storage?: string;
    };
  };

  // Feature Flags
  features: {
    organizations: boolean;
    admin: boolean;
    passkeys: boolean;
    emailOTP: boolean;
    magicLink: boolean;
    socialAuth: boolean;
    emailVerification: boolean;
    signup: boolean;
    accountDeletion: boolean;
    fileUploads: boolean;
    themeToggle: boolean;
    teams: boolean;
    passkeySignup: boolean;
  };

  // Stripe Configuration
  stripe: {
    plans: {
      name: string;
      priceId: string;
      annualDiscountPriceId?: string;
      price: number;
      annualPrice?: number;
      interval: 'month' | 'year';
      features: string[];
      limits: {
        projects?: number;
        storage?: number;
        users?: number;
        [key: string]: any;
      };
      popular: boolean;
      freeTrial?: {
        days: number;
      };
    }[];
  };
}

const AUTH_ROUTE_PRESETS: Record<'quickback' | 'better-auth', AppConfig['routes']['api']> = {
  'quickback':   { auth: '/auth/v1',  data: '/api/v1', storage: '/storage/v1' },
  'better-auth': { auth: '/api/auth' },
};

/**
 * Helper to get environment variable with fallback
 * Uses import.meta.env for Vite compatibility
 */
function env(key: string, defaultValue: string): string {
  // Access Vite env vars via import.meta.env
  const envVars = import.meta.env as Record<string, string | undefined>;
  return envVars[key] || defaultValue;
}

/**
 * Helper to get boolean environment variable
 * Uses import.meta.env for Vite compatibility
 */
function envBool(key: string, defaultValue: boolean): boolean {
  const envVars = import.meta.env as Record<string, string | undefined>;
  const value = envVars[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

// Mutable config that can be updated at runtime via setAppConfig()
export let appConfig: AppConfig = {
  authRoute: (env('VITE_AUTH_ROUTE', 'quickback') as AuthRouteMode),
  name: env('VITE_APP_NAME', "[APP_NAME]"),
  tagline: env('VITE_APP_TAGLINE', '[APP_TAGLINE]'),
  description: env('VITE_APP_DESCRIPTION', '[APP_DESCRIPTION]'),

  // Company Information
  companyName: env('VITE_COMPANY_NAME', "[COMPANY_NAME]"),
  companyAddress: env('VITE_COMPANY_ADDRESS', ""),

  seo: {
    title: env('VITE_APP_NAME', "[APP_NAME]"),
    description: env('VITE_APP_DESCRIPTION', '[APP_DESCRIPTION]'),
    keywords: env('VITE_SEO_KEYWORDS', '').split(',').filter(Boolean),
    ogImage: "/og-image.png",
    twitterCard: "summary_large_image",
    siteName: env('VITE_APP_NAME', "[APP_NAME]"),
    locale: "en_US",
    themeColor: env('VITE_THEME_COLOR', '')
  },

  urls: {
    base: (() => {
      const baseUrl = import.meta.env.VITE_ACCOUNT_APP_URL;
      if (!baseUrl) {
        // Default to current origin in browser
        return typeof window !== 'undefined' ? window.location.origin : '';
      }
      return baseUrl;
    })(),
    app: env('VITE_APP_URL', ''),
    tenantPattern: env('VITE_TENANT_URL_PATTERN', '/organizations/{slug}'),
    support: env('VITE_SUPPORT_URL', ''),
    privacy: env('VITE_PRIVACY_URL', ''),
    terms: env('VITE_TERMS_URL', '')
  },

  labels: {
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    support: "Contact Support",
    company: env('VITE_COMPANY_NAME', "[COMPANY_NAME]"),
    organizations: "Organizations"
  },
  
  messages: {
    noOrganizations: "You're not a member of any organizations yet.",
    contactAdminForInvite: "Contact an admin to be invited to an organization.",
    noPendingInvitations: "You have no pending invitations",
    accountInformation: "Account Information",
    timezone: "Timezone",
    serverLocation: "Server Location",
    memberSince: "Member since",
    pendingInvitations: "Pending Invitations",
    invitedAs: "Invited as",
    accept: "Accept",
    decline: "Decline",
    createOrganization: "Create Organization",
    userFallback: "User",
    noEmailProvided: "No email provided",
    more: "More",
    total: "total",
    active: "Active",
    new: "New"
  },
  
  branding: {
    primaryColor: "#1e293b", // slate-800
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.ico"
  },
  
  auth: {
    enableSignup: true,
    disableEmailStatusCheck: envBool('DISABLE_EMAIL_STATUS_CHECK', false),
    requireEmailVerification: true,
    passwordRequirements: {
      minLength: 8,
      maxLength: 64,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false
    },
    sessionDuration: 30 * 24 * 60 * 60, // 30 days
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    emailVerificationCooldown: 60 // 60 seconds
  },
  

  // Email Configuration
  email: {
    fromEmail: env('VITE_EMAIL_FROM', ''),
    fromName: env('VITE_APP_NAME', '[APP_NAME]'),
    replyTo: env('VITE_EMAIL_REPLY_TO', ''),
    region: env('VITE_EMAIL_REGION', ''),
    rateLimit: {
      maxEmailsPerHour: 100,
      maxEmailsPerDay: 500
    },
    supportEmail: env('VITE_SUPPORT_EMAIL', '')
  },

  // Rate Limiting Configuration
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    maxRequests: 100,
    customRules: {
      signInEmail: { window: 60, max: 100 },
      signInSocial: { window: 60, max: 100 }
    }
  },

  // Route Configuration
  routes: {
    public: {
      home: "/",
      login: "/login",
      signup: "/signup",
      forgotPassword: "/forgot-password",
      emailOTP: "/email-otp",
      welcome: "/welcome",
    },
    authenticated: {
      dashboard: "/profile",
      profile: "/profile",
      settings: "/settings",
      managePasskeys: "/manage-passkeys",
      manageDevices: "/devices",
      setupPasskey: "/setup-passkey",
      apiKeys: "/api-keys",
    },
    organizations: {
      list: '/organizations',
      create: '/organizations/new',
      detail: (slug: string) => `/organizations/${slug}`,
      members: (slug: string) => `/organizations/${slug}/members`,
      invitations: (slug: string) => `/organizations/${slug}/invitations`,
      settings: (slug: string) => `/organizations/${slug}/settings`,
      acceptInvitation: (id: string) => `/accept-invitation/${id}`,
    },
    admin: {
      dashboard: '/admin',
      users: '/admin',
    },
    api: (() => {
      const mode = env('VITE_AUTH_ROUTE', 'quickback');
      if (mode === 'quickback' || mode === 'better-auth') {
        return AUTH_ROUTE_PRESETS[mode];
      }
      return {
        auth: env('VITE_AUTH_BASE_PATH', '/api/auth'),
        data: env('VITE_DATA_BASE_PATH', '') || undefined,
        storage: env('VITE_STORAGE_BASE_PATH', '') || undefined,
      };
    })(),
  },

  // Feature Flags
  features: {
    organizations: envBool('ENABLE_ORGANIZATIONS', true),
    admin: envBool('ENABLE_ADMIN', true),
    passkeys: envBool('ENABLE_PASSKEYS', true),
    emailOTP: envBool('ENABLE_EMAIL_OTP', true),
    magicLink: envBool('ENABLE_MAGIC_LINK', true),
    socialAuth: envBool('ENABLE_SOCIAL_AUTH', false),
    emailVerification: envBool('ENABLE_EMAIL_VERIFICATION', true),
    signup: envBool('ENABLE_SIGNUP', true),
    accountDeletion: envBool('ENABLE_ACCOUNT_DELETION', true),
    fileUploads: envBool('VITE_ENABLE_FILE_UPLOADS', false),
    themeToggle: envBool('ENABLE_THEME_TOGGLE', true),
    teams: envBool('ENABLE_TEAMS', true),
    passkeySignup: envBool('ENABLE_PASSKEY_SIGNUP', true),
  },

  // Stripe Configuration
  stripe: {
    plans: [
      {
        name: "starter",
        priceId: "price_starter", // Replace with actual Stripe price ID
        price: 900, // $9.00 in cents
        interval: "month",
        features: [
          "Up to 3 projects",
          "1GB storage",
          "Email support",
          "Basic analytics"
        ],
        limits: {
          projects: 3,
          storage: 1, // GB
        },
        popular: false
      },
      {
        name: "pro",
        priceId: "price_pro", // Replace with actual Stripe price ID
        annualDiscountPriceId: "price_pro_annual", // Replace with actual Stripe price ID
        price: 2900, // $29.00 in cents
        annualPrice: 29000, // $290.00 in cents (2 months free)
        interval: "month",
        features: [
          "Up to 10 projects",
          "5GB storage",
          "Priority support",
          "Advanced analytics",
          "API access",
          "14-day free trial"
        ],
        limits: {
          projects: 10,
          storage: 5, // GB
        },
        popular: true,
        freeTrial: {
          days: 14
        }
      },
      {
        name: "team",
        priceId: "price_team", // Replace with actual Stripe price ID
        annualDiscountPriceId: "price_team_annual", // Replace with actual Stripe price ID
        price: 9900, // $99.00 in cents
        annualPrice: 99000, // $990.00 in cents (2 months free)
        interval: "month",
        features: [
          "Up to 50 projects",
          "25GB storage",
          "Team collaboration",
          "Premium support",
          "Advanced integrations",
          "SSO support",
          "Custom branding"
        ],
        limits: {
          projects: 50,
          storage: 25, // GB
          users: 10,
        },
        popular: false
      }
    ]
  }
};

// Type for environment-specific overrides
export type AppConfigOverrides = Partial<AppConfig>;

// Helper function to merge config with environment overrides
export function createAppConfig(overrides: AppConfigOverrides = {}): AppConfig {
  return {
    ...appConfig,
    ...overrides,
    seo: {
      ...appConfig.seo,
      ...overrides.seo
    },
    urls: {
      ...appConfig.urls,
      ...overrides.urls
    },
    labels: {
      ...appConfig.labels,
      ...overrides.labels
    },
    branding: {
      ...appConfig.branding,
      ...overrides.branding
    },
    auth: {
      ...appConfig.auth,
      ...overrides.auth,
      passwordRequirements: {
        ...appConfig.auth.passwordRequirements,
        ...overrides.auth?.passwordRequirements
      }
    },
    routes: {
      ...appConfig.routes,
      ...overrides.routes,
      public: {
        ...appConfig.routes.public,
        ...overrides.routes?.public
      },
      authenticated: {
        ...appConfig.routes.authenticated,
        ...overrides.routes?.authenticated
      },
      api: {
        ...appConfig.routes.api,
        ...overrides.routes?.api
      }
    },
    features: {
      ...appConfig.features,
      ...overrides.features
    }
  };
}

/**
 * Update the global appConfig with overrides
 * Call this before rendering to set app-specific values
 */
export function setAppConfig(overrides: AppConfigOverrides): void {
  if (overrides.authRoute && overrides.authRoute !== 'custom' && AUTH_ROUTE_PRESETS[overrides.authRoute]) {
    overrides = {
      ...overrides,
      routes: {
        ...overrides.routes,
        api: {
          ...AUTH_ROUTE_PRESETS[overrides.authRoute],
          ...overrides.routes?.api,
        },
      } as AppConfigOverrides['routes'],
    };
  }
  appConfig = createAppConfig(overrides);
}

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return appConfig.features[feature] ?? false;
}

/**
 * Helper to check if a route is protected (requires auth)
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    appConfig.routes.authenticated.dashboard,
    appConfig.routes.authenticated.profile,
    appConfig.routes.authenticated.settings,
    appConfig.routes.organizations.list,
    appConfig.routes.admin.dashboard,
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * Helper to check if a route is an auth route (login/signup)
 */
export function isAuthRoute(pathname: string): boolean {
  return pathname === appConfig.routes.public.login || pathname === appConfig.routes.public.signup;
}

/**
 * Helper to check if a route is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(appConfig.routes.admin.dashboard);
}

/**
 * Helper to build tenant/organization URL from pattern
 * Replaces {slug} placeholder with actual organization slug
 *
 * @param slug - Organization slug
 * @returns Full URL to the organization in the main app, or null if not configured
 *
 * @example
 * // With VITE_APP_URL=https://app.example.com and VITE_TENANT_URL_PATTERN=/tenant/{slug}
 * getTenantUrl('acme-corp') // returns 'https://app.example.com/tenant/acme-corp'
 *
 * @example
 * // With VITE_TENANT_URL_PATTERN=https://{slug}.example.com
 * getTenantUrl('acme-corp') // returns 'https://acme-corp.example.com'
 */
export function getTenantUrl(slug: string): string | null {
  const { app, tenantPattern } = appConfig.urls;

  if (!tenantPattern) {
    return null;
  }

  // Replace {slug} placeholder with actual slug
  const processedPattern = tenantPattern.replace(/{slug}/g, slug);

  // If pattern is absolute URL (starts with http:// or https://), return as-is
  if (processedPattern.startsWith('http://') || processedPattern.startsWith('https://')) {
    return processedPattern;
  }

  // If no app URL configured, can't build full URL
  if (!app) {
    return null;
  }

  // Combine app URL with pattern (handle trailing/leading slashes)
  const baseUrl = app.replace(/\/$/, '');
  const path = processedPattern.startsWith('/') ? processedPattern : `/${processedPattern}`;

  return `${baseUrl}${path}`;
}
