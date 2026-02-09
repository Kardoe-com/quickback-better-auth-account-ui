import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { appConfig } from '@/config/app';
import { getAuthApiUrl } from '@/config/runtime';
import { sanitizeCallbackUrl } from '@/utils/url-validation';

export default function WelcomePage() {
  const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });
  const [otp, setOTP] = useState('');
  const [email, setEmail] = useState('');
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle URL parameters for OTP magic link
  useEffect(() => {
    const encodedData = searchParams.get('data');

    if (encodedData && !hasAutoSubmitted) {
      try {
        // Decode the base64 data
        const decodedString = atob(encodedData);
        const data = JSON.parse(decodedString);

        if (data.email) {
          setEmail(data.email);

          // If we have an OTP (from magic link), set it up for auto-submit
          if (data.otp) {
            setOTP(data.otp);

            // Store callback URL for later use (after validation)
            if (data.callback) {
              const safeCallback = sanitizeCallbackUrl(data.callback, appConfig.routes.authenticated.dashboard);
              sessionStorage.setItem('loginCallback', safeCallback);
            }

            // Auto-submit the form after a brief delay (only once)
            setHasAutoSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Failed to decode magic link data:', error);
      }
    }
  }, [searchParams, hasAutoSubmitted]);

  // Auto-submit when we have OTP and email from magic link
  useEffect(() => {
    if (hasAutoSubmitted && otp && email && !isLoadingMagicLink) {
      // Reset the flag to prevent further auto-submits
      setHasAutoSubmitted(false);

      // Auto-submit the form
      const submitForm = async () => {
        await handleVerifyOTP(new Event('submit') as any);
      };

      // Small delay to let the UI update
      const timer = setTimeout(submitForm, 500);
      return () => clearTimeout(timer);
    }
  }, [hasAutoSubmitted, otp, email, isLoadingMagicLink]);

  // Auto-submit when user enters 6th digit
  useEffect(() => {
    if (otp.length === 6 && email && !isLoadingMagicLink) {
      // Auto-submit the form
      const submitForm = async () => {
        await handleVerifyOTP(new Event('submit') as any);
      };

      // Small delay to let the UI update
      const timer = setTimeout(submitForm, 100);
      return () => clearTimeout(timer);
    }
  }, [otp, email, isLoadingMagicLink]);

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
        setAlertDialog({
          open: true,
          title: 'Check Your Email',
          description: `We've sent a new verification code to ${email}.`,
        });
        setOTP(''); // Clear the OTP field
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingMagicLink(true);

    try {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (error) {
        setAlertDialog({
          open: true,
          title: 'Invalid Code',
          description: error.message || 'The code you entered is invalid or has expired. Please try again.',
        });
      } else {
        // Mark email as verified after successful OTP verification
        try {
          await fetch(getAuthApiUrl('/verify-email'), {
            method: 'POST',
            credentials: 'include',
          });
        } catch (verifyError) {
          // Non-critical - log but don't block the flow
          console.warn('Failed to mark email as verified:', verifyError);
        }

        // Prefetch session to update header immediately
        await authClient.getSession();

        // Since this is the welcome page, always redirect to passkey setup
        navigate('/setup-passkey');
      }
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'Failed to verify code. Please try again.',
      });
    } finally {
      setIsLoadingMagicLink(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[450px]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to {appConfig.name}!</CardTitle>
          <CardDescription className="text-center">Enter your verification code to access your new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {email ? (
              <>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to</p>
                  <p className="font-medium">{email}</p>
                </div>
                <input type="hidden" name="email" value={email} />
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Waiting for email information...</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp" className="sr-only">
                Verification Code
              </Label>
              <div className="flex justify-center px-4">
                <InputOTP id="otp" value={otp} onChange={setOTP} maxLength={6} autoComplete="one-time-code" autoFocus className="max-w-[400px]">
                  <InputOTPGroup className="grid grid-cols-6 w-full">
                    <InputOTPSlot index={0} className="h-12 sm:h-16 text-xl sm:text-2xl aspect-square" />
                    <InputOTPSlot index={1} className="h-12 sm:h-16 text-xl sm:text-2xl aspect-square" />
                    <InputOTPSlot index={2} className="h-12 sm:h-16 text-xl sm:text-2xl aspect-square" />
                    <InputOTPSlot index={3} className="h-12 sm:h-16 text-xl sm:text-2xl aspect-square" />
                    <InputOTPSlot index={4} className="h-12 sm:h-16 text-xl sm:text-2xl aspect-square" />
                    <InputOTPSlot index={5} className="h-12 sm:h-16 text-xl sm:text-2xl aspect-square" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoadingMagicLink || otp.length !== 6}>
              {isLoadingMagicLink ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify Code'
              )}
            </Button>

            <div className="flex gap-2 justify-center text-sm">
              <Button type="button" variant="link" onClick={handleSendMagicLink} disabled={isLoadingMagicLink}>
                Resend code
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button type="button" variant="link" onClick={() => navigate('/signup')}>
                Back to signup
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Need help?{' '}
        <Link to={appConfig.urls.support || 'mailto:' + appConfig.email.supportEmail} className="text-primary hover:underline font-medium">
          {appConfig.labels?.support || 'Contact support'}
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
