import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { appConfig } from '@/config/app';
import { getAuthApiUrl } from '@/config/runtime';
import { Fingerprint, ArrowRight } from 'lucide-react';

export default function SetupPasskeyPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState<boolean | null>(null);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });

  useEffect(() => {
    setSupportsWebAuthn(typeof window !== 'undefined' && !!window.PublicKeyCredential);
  }, []);

  const handleRegisterPasskey = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        name: 'My Passkey',
      });

      if (error) {
        setAlertDialog({
          open: true,
          title: 'Passkey Setup Failed',
          description: error.message || "We couldn't set up your passkey. You can try again or skip for now.",
        });
        return;
      }

      await fetch(getAuthApiUrl('/upgrade-anonymous'), {
        method: 'POST',
        credentials: 'include',
      });
      await authClient.getSession({ query: { disableCookieCache: true } });

      setAlertDialog({
        open: true,
        title: 'Passkey Created Successfully!',
        description: 'Your passkey has been set up. You can now sign in quickly and securely without a password.',
      });

      setTimeout(() => {
        navigate(appConfig.routes.authenticated.dashboard);
      }, 1500);
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/profile');
  };

  if (supportsWebAuthn === false) {
    navigate(appConfig.routes.authenticated.dashboard);
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Set Up Passkey</CardTitle>
          <CardDescription>Secure your account with passwordless authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Passkeys are a more secure and convenient way to sign in.</p>
            <p>You can use your fingerprint, face, or device PIN to authenticate.</p>
          </div>

          <div className="space-y-3 pt-4">
            <Button className="w-full" onClick={handleRegisterPasskey} disabled={isLoading || supportsWebAuthn === null}>
              <Fingerprint className="h-4 w-4 mr-2" />
              {isLoading ? 'Setting up passkey...' : 'Set Up Passkey'}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSkip}>
              Skip for now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
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
