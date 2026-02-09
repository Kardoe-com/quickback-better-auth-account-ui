import { Navigate, Outlet } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { appConfig } from '@/config/app';

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/**
 * Error display component for session errors
 */
function SessionError({ error, onRetry }: { error: { message?: string; status?: number }; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <div className="mb-4 text-red-600">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-red-800">Connection Error</h2>
        <p className="mb-4 text-sm text-red-700">
          {error.message || 'Unable to connect to the server. Please try again.'}
        </p>
        {error.status && (
          <p className="mb-4 text-xs text-red-500">Error code: {error.status}</p>
        )}
        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * AuthGuard - Protects routes that require authentication
 * Redirects to login if not authenticated
 */
export function AuthGuard() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <SessionError error={error} onRetry={() => refetch()} />;
  }

  const isAnonymous = (session?.user as any)?.isAnonymous === true;

  if (!session || isAnonymous) {
    return <Navigate to={appConfig.routes.public.login} replace />;
  }

  return <Outlet />;
}

/**
 * AdminGuard - Protects routes that require admin role
 * Redirects to login if not authenticated, to profile if not admin
 */
export function AdminGuard() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <SessionError error={error} onRetry={() => refetch()} />;
  }

  const isAnonymous = (session?.user as any)?.isAnonymous === true;

  if (!session || isAnonymous) {
    return <Navigate to={appConfig.routes.public.login} replace />;
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'admin') {
    return <Navigate to={appConfig.routes.authenticated.dashboard} replace />;
  }

  return <Outlet />;
}

/**
 * GuestGuard - Protects routes that should only be accessible to non-authenticated users
 * Redirects to profile if already authenticated
 */
export function GuestGuard() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <SessionError error={error} onRetry={() => refetch()} />;
  }

  const isAnonymous = (session?.user as any)?.isAnonymous === true;

  if (session && !isAnonymous) {
    return <Navigate to={appConfig.routes.authenticated.dashboard} replace />;
  }

  return <Outlet />;
}
