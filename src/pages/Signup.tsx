import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { appConfig, isFeatureEnabled } from '@/config/app';
import { getAuthApiUrl } from '@/config/runtime';
import { sanitizeCallbackUrl } from '@/utils/url-validation';
import { Fingerprint, Mail, Info, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });
  const navigate = useNavigate();
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [searchParams] = useSearchParams();
  const [passkeyStep, setPasskeyStep] = useState<'initial' | 'email-collection'>('initial');
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [passkeyName, setPasskeyName] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

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
    password: '',
  });
  const showPasswordAuth = isFeatureEnabled('passwordAuth');

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

      // Server-side hook auto-upgrades anonymous → real user on passkey registration.
      // Refetch session to get the updated user state.
      await authClient.getSession({ query: { disableCookieCache: true } });

      setIsPasskeyLoading(false);

      // If email is configured, offer optional email collection
      if (emailConfigured) {
        setPasskeyStep('email-collection');
      } else {
        // No email configured — go straight to dashboard
        const storedCallback = sessionStorage.getItem('loginCallback');
        const callbackURL = sanitizeCallbackUrl(storedCallback, appConfig.routes.authenticated.dashboard);
        sessionStorage.removeItem('loginCallback');
        navigate(callbackURL);
      }
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

  const handlePasskeyUpgrade = async (skip: boolean) => {
    setIsUpgrading(true);
    try {
      // User is already upgraded server-side (passkey hook).
      // This step optionally attaches email/name to the account.
      if (!skip && (passkeyEmail || passkeyName)) {
        const body: Record<string, string> = {};
        if (passkeyEmail) body.email = passkeyEmail;
        if (passkeyName) body.name = passkeyName;

        const upgradeResponse = await fetch(getAuthApiUrl('/upgrade-anonymous'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!upgradeResponse.ok) {
          const errorData = await upgradeResponse.json().catch(() => ({}));
          setAlertDialog({
            open: true,
            title: 'Failed to Save Details',
            description: errorData?.message || "Your passkey was created, but we couldn't save your details. You can update them later in settings.",
          });
          // Don't block — passkey is already set up, user is already upgraded
        } else {
          const data = await upgradeResponse.json();
          await authClient.getSession({ query: { disableCookieCache: true } });

          if (data.verificationRequired && passkeyEmail) {
            const welcomeData = { email: passkeyEmail, fromSignup: true };
            const encodedData = btoa(JSON.stringify(welcomeData));
            navigate(`/welcome?data=${encodedData}`);

            authClient.emailOtp
              .sendVerificationOtp({ email: passkeyEmail, type: 'sign-in' })
              .catch((error: unknown) => {
                console.error('Failed to send verification email:', error);
              });
            return;
          }
        }
      }

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
      setIsUpgrading(false);
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

    if (showPasswordAuth && !signupForm.password) {
      setAlertDialog({
        open: true,
        title: 'Missing Password',
        description: 'Please enter a password.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const password = showPasswordAuth
        ? signupForm.password
        : crypto.randomUUID() + crypto.randomUUID().substring(0, 8);

      const signupResult = await authClient.signUp.email({
        email: signupForm.email,
        password,
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

      // Password auth: user is already signed in, redirect to app
      if (showPasswordAuth) {
        const callback = sessionStorage.getItem('loginCallback');
        sessionStorage.removeItem('loginCallback');
        window.location.href = callback || appConfig.routes.authenticated.dashboard;
        return;
      }

      // OTP flow: redirect to welcome page and send verification email
      const welcomeData = {
        email: signupForm.email,
        fromSignup: true,
      };
      const encodedData = btoa(JSON.stringify(welcomeData));
      navigate(`/welcome?data=${encodedData}`);

      authClient.emailOtp
        .sendVerificationOtp({
          email: signupForm.email,
          type: 'sign-in',
        })
        .catch((error) => {
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

  const showPasskeySignup = isFeatureEnabled('passkeySignup') && supportsWebAuthn;
  const showEmailSignup = emailConfigured;

  if (passkeyStep === 'email-collection') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[450px]">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Your passkey has been set up successfully</span>
            </div>
            <CardTitle className="text-2xl text-center">Almost There</CardTitle>
            <CardDescription className="text-center">Add your email to secure your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passkey-name">Full Name</Label>
                <Input
                  id="passkey-name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passkey-email">Email Address</Label>
                <Input
                  id="passkey-email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={passkeyEmail}
                  onChange={(e) => setPasskeyEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={() => handlePasskeyUpgrade(false)}
                className="w-full"
                disabled={isUpgrading}
              >
                {isUpgrading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Finishing setup...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>

              <Button
                onClick={() => handlePasskeyUpgrade(true)}
                className="w-full"
                variant="ghost"
                disabled={isUpgrading}
              >
                Skip for now
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You can add your email later in account settings
              </p>
            </div>
          </CardContent>
        </Card>

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

  return (
    <div className="flex flex-col gap-6 w-full max-w-[450px]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Join {appConfig.name} today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {showPasskeySignup && (
              <Button
                onClick={handlePasskeySignup}
                className="w-full"
                variant="outline"
                disabled={isPasskeyLoading}
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
            )}

            {showPasskeySignup && showEmailSignup && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}

            {showEmailSignup ? (
              <>
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

                {showPasswordAuth && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a password"
                      autoComplete="new-password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <Button onClick={handleSignup} className="w-full" disabled={isLoading || !signupForm.email || !signupForm.name || (showPasswordAuth && !signupForm.password)}>
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

                {!showPasswordAuth && (
                  <p className="text-xs text-center text-muted-foreground">
                    We'll send you a welcome email with a secure link to access your account
                  </p>
                )}
              </>
            ) : showPasskeySignup ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Create your account instantly with a passkey. Email signup will be available once email delivery is configured.</span>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Signup is currently unavailable. Please contact an administrator.</span>
              </div>
            )}
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
