import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { appConfig } from '@/config/app';
import { getAuthApiUrl } from '@/config/runtime';
import { sanitizeCallbackUrl } from '@/utils/url-validation';
import { Fingerprint, Mail } from 'lucide-react';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });
  const navigate = useNavigate();
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setSupportsWebAuthn(typeof window !== 'undefined' && !!window.PublicKeyCredential);
  }, []);

  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      const safeCallback = sanitizeCallbackUrl(redirectParam, appConfig.routes.authenticated.dashboard);
      sessionStorage.setItem('loginCallback', safeCallback);
    }
  }, [searchParams]);

  useEffect(() => {
    if (appConfig.auth.disableEmailStatusCheck) {
      return;
    }

    fetch(getAuthApiUrl('/ses/status'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.emailConfigured === 'boolean') {
          setEmailConfigured(data.emailConfigured);
        }
      })
      .catch(() => {
        setEmailConfigured(false);
      });
  }, []);

  // Redirect to login if signup is disabled
  if (!appConfig.auth.enableSignup) {
    navigate(appConfig.routes.public.login);
    return null;
  }

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
  });

  const handlePasskeySignup = async () => {
    if (!supportsWebAuthn) {
      setAlertDialog({
        open: true,
        title: 'Passkeys Not Supported',
        description: "Your browser doesn't support passkeys. Please use email signup instead.",
      });
      return;
    }

    setIsPasskeyLoading(true);
    try {
      const sessionResult = await authClient.getSession();
      const existingUser = sessionResult.data?.user as { isAnonymous?: boolean } | undefined;
      const hasSession = !!sessionResult.data?.session;

      if (!hasSession) {
        const anonResult = await authClient.signIn.anonymous();
        if (anonResult.error) {
          setAlertDialog({
            open: true,
            title: 'Unable to Start Passkey Setup',
            description: anonResult.error.message || 'Failed to create a guest session.',
          });
          return;
        }
      } else if (existingUser?.isAnonymous === false) {
        navigate(appConfig.routes.authenticated.dashboard);
        return;
      }

      const passkeyResult = await authClient.passkey.addPasskey({
        name: 'My Passkey',
      });

      if (passkeyResult.error) {
        setAlertDialog({
          open: true,
          title: 'Passkey Setup Failed',
          description: passkeyResult.error.message || "We couldn't create a passkey. Please try again.",
        });
        return;
      }

      const upgradeResponse = await fetch(getAuthApiUrl('/upgrade-anonymous'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!upgradeResponse.ok) {
        setAlertDialog({
          open: true,
          title: 'Account Upgrade Failed',
          description: "Your passkey was created, but we couldn't finish setup. Please try again.",
        });
        return;
      }

      await authClient.getSession({ query: { disableCookieCache: true } });
      const storedCallback = sessionStorage.getItem('loginCallback');
      const callbackURL = sanitizeCallbackUrl(storedCallback, appConfig.routes.authenticated.dashboard);
      sessionStorage.removeItem('loginCallback');
      navigate(callbackURL);
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupForm.email || !signupForm.name) {
      setAlertDialog({
        open: true,
        title: 'Missing Information',
        description: 'Please enter your name and email address.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create the user account with a secure random password
      const randomPassword = crypto.randomUUID() + crypto.randomUUID().substring(0, 8);

      const signupResult = await authClient.signUp.email({
        email: signupForm.email,
        password: randomPassword,
        name: signupForm.name,
      });

      if (signupResult.error) {
        setIsLoading(false);
        setAlertDialog({
          open: true,
          title: 'Signup Failed',
          description: signupResult.error.message || 'Failed to create account. Please try again.',
        });
        return;
      }

      // Encode email data for welcome page BEFORE async operations
      // This prevents form from clearing during redirect
      const welcomeData = {
        email: signupForm.email,
        fromSignup: true,
      };
      const encodedData = btoa(JSON.stringify(welcomeData));

      // Redirect immediately to prevent form clearing
      navigate(`/welcome?data=${encodedData}`);

      // Send welcome email in the background (don't await)
      // This happens after redirect so user doesn't see form clearing
      authClient.emailOtp
        .sendVerificationOtp({
          email: signupForm.email,
          type: 'sign-in', // Use sign-in type since we're not verifying email
        })
        .catch((error) => {
          // Account was created but email failed - log but don't block
          console.error('Failed to send welcome email:', error);
        });
    } catch (error) {
      setIsLoading(false);
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[450px]">
      {!emailConfigured && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Email delivery is not configured yet. Sign-up and login emails may fail to send.
        </div>
      )}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Join {appConfig.name} today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handlePasskeySignup}
              className="w-full"
              variant="outline"
              disabled={isPasskeyLoading || !supportsWebAuthn}
              title={!supportsWebAuthn ? "Your browser doesn't support passkeys" : ''}
            >
              {isPasskeyLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Creating passkey...</span>
                </div>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Create Account with Passkey
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                required
              />
            </div>

            <Button onClick={handleSignup} className="w-full" disabled={isLoading || !signupForm.email || !signupForm.name}>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll send you a welcome email with a secure link to access your account
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={appConfig.routes.public.login} className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>

      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setAlertDialog({ ...alertDialog, open: false })}>OK</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
