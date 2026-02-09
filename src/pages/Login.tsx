import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { appConfig } from '@/config/app';
import { getAuthApiUrl } from '@/config/runtime';
import { sanitizeCallbackUrl } from '@/utils/url-validation';
import { Mail, Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });
  const [email, setEmail] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);
  const navigate = useNavigate();
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

  const handleSendMagicLink = async () => {
    if (!email) {
      setAlertDialog({
        open: true,
        title: 'Email Required',
        description: 'Please enter your email address.',
      });
      return;
    }

    setIsLoadingMagicLink(true);
    try {
      // Send the OTP using Better Auth's standard emailOTP
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (error) {
        setAlertDialog({
          open: true,
          title: 'Error',
          description: error.message || 'Failed to send verification code. Please try again.',
        });
      } else {
        // Encode email data for OTP page
        const otpData = {
          email: email,
          fromLogin: true,
        };
        const encodedData = btoa(JSON.stringify(otpData));

        // Redirect to OTP page with encoded data
        navigate(`/email-otp?data=${encodedData}`);
      }
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoadingMagicLink(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setIsPasskeyLoading(true);
    try {
      const result = await authClient.signIn.passkey();

      if (result.error) {
        setAlertDialog({
          open: true,
          title: 'Passkey Sign-In Failed',
          description: result.error.message || 'Could not sign in with passkey. Please try again or use email.',
        });
        return;
      }

      // Get the callback URL from session storage or use default
      const callback = sessionStorage.getItem('loginCallback') || appConfig.routes.authenticated.dashboard;
      sessionStorage.removeItem('loginCallback');
      navigate(callback);
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Passkey Error',
        description: 'An error occurred during passkey authentication. Your browser may not support this feature.',
      });
    } finally {
      setIsPasskeyLoading(false);
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
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMagicLink();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoadingMagicLink || !email || !email.includes('@')}
                title={!email ? 'Please enter your email' : !email.includes('@') ? 'Please enter a valid email' : ''}
              >
                {isLoadingMagicLink ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Sign-in Link
                  </>
                )}
              </Button>

              {supportsWebAuthn && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handlePasskeySignIn}
                    disabled={isPasskeyLoading}
                  >
                    {isPasskeyLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <>
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Sign in with Passkey
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {appConfig.auth.enableSignup && (
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to={appConfig.routes.public.signup} className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </div>
      )}

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
