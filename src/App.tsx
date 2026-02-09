import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

// Layouts
import PublicLayout from '@/layouts/PublicLayout';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';

// Auth guard
import { AuthGuard, AdminGuard, GuestGuard } from '@/auth/AuthGuard';

// Public pages
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';
import EmailOtpPage from '@/pages/EmailOtp';
import WelcomePage from '@/pages/Welcome';
import ForgotPasswordPage from '@/pages/ForgotPassword';
import AccountDeletedPage from '@/pages/AccountDeleted';
import AcceptInvitationPage from '@/pages/AcceptInvitation';

// Authenticated pages
import ProfilePage from '@/pages/Profile';
import OrganizationsRedirect from '@/pages/OrganizationsRedirect';
import NewOrganizationPage from '@/pages/organizations/NewOrganization';
import OrganizationLayout from '@/pages/organizations/OrganizationLayout';
import OrganizationOverview from '@/pages/organizations/OrganizationOverview';
import OrganizationMembers from '@/pages/organizations/OrganizationMembers';
import OrganizationInvitations from '@/pages/organizations/OrganizationInvitations';
import OrganizationSettings from '@/pages/organizations/OrganizationSettings';
import OrganizationTeams from '@/pages/organizations/OrganizationTeams';
import AdminPage from '@/pages/Admin';

// Passkey pages (placeholders)
import ManagePasskeysPage from '@/pages/ManagePasskeys';
import SetupPasskeyPage from '@/pages/SetupPasskey';

// Device management
import ManageDevicesPage from '@/pages/ManageDevices';

// Organization API Keys
import OrganizationApiKeys from '@/pages/organizations/OrganizationApiKeys';

// CLI Authorization
import CliAuthorizePage from '@/pages/CliAuthorize';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <ImpersonationBanner />
        <Routes>
          {/* Home - redirects based on auth status */}
          <Route path="/" element={<HomePage />} />

          {/* Public routes - redirect to profile if authenticated */}
          <Route element={<GuestGuard />}>
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/email-otp" element={<EmailOtpPage />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
          </Route>

          {/* Public but accessible to all */}
          <Route element={<PublicLayout />}>
            <Route path="/account-deleted" element={<AccountDeletedPage />} />
            <Route path="/accept-invitation/:id" element={<AcceptInvitationPage />} />
          </Route>

          {/* CLI Authorization - handles its own auth redirect */}
          <Route path="/cli/authorize" element={<CliAuthorizePage />} />

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/organizations" element={<OrganizationsRedirect />} />
              <Route path="/organizations/new" element={<NewOrganizationPage />} />
              <Route path="/manage-passkeys" element={<ManagePasskeysPage />} />
              <Route path="/setup-passkey" element={<SetupPasskeyPage />} />
              <Route path="/devices" element={<ManageDevicesPage />} />

              {/* Organization detail routes */}
              <Route path="/organizations/:slug" element={<OrganizationLayout />}>
                <Route index element={<OrganizationOverview />} />
                <Route path="members" element={<OrganizationMembers />} />
                <Route path="invitations" element={<OrganizationInvitations />} />
                <Route path="teams" element={<OrganizationTeams />} />
                <Route path="settings" element={<OrganizationSettings />} />
                <Route path="api-keys" element={<OrganizationApiKeys />} />
              </Route>
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<AdminGuard />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/*" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </QueryProvider>
    </ThemeProvider>
  );
}
