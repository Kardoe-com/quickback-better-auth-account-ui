import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { appConfig, isFeatureEnabled } from '@/config/app';
import { sanitizeCallbackUrl } from '@/utils/url-validation';
import { Mail, Info } from 'lucide-react';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      const safeCallback = sanitizeCallbackUrl(redirectParam, appConfig.routes.authenticated.dashboard);
      sessionStorage.setItem('loginCallback', safeCallback);
    }
  }, [searchParams]);

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
  const showPasswordAuth = isFeatureEnabled('password');
  const showEmailOTP = isFeatureEnabled('emailOTP');

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

  const showEmailSignup = showEmailOTP || showPasswordAuth;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[450px]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Join {appConfig.name} today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
