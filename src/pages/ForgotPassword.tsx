import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { appConfig } from '@/config/app';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', description: '' });
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await authClient.forgetPassword.emailOtp({
        email,
      });

      if (error) {
        setAlertDialog({
          open: true,
          title: 'Error',
          description: error.message || 'Failed to send reset code. Please try again.',
        });
      } else {
        setShowOTPForm(true);
        setAlertDialog({
          open: true,
          title: 'Check Your Email',
          description: `We've sent a password reset code to ${email}. Enter the 6-digit code below.`,
        });
      }
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Skip OTP check and go directly to password form
      // The OTP will be verified when resetting the password
      setShowPasswordForm(true);
      setShowOTPForm(false);
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'Failed to verify code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password requirements
    const { passwordRequirements } = appConfig.auth;
    const password = newPassword;

    if (password.length < passwordRequirements.minLength) {
      setAlertDialog({ open: true, title: 'Password Too Short', description: `Password must be at least ${passwordRequirements.minLength} characters long.` });
      return;
    }

    if (password.length > passwordRequirements.maxLength) {
      setAlertDialog({ open: true, title: 'Password Too Long', description: `Password must be no more than ${passwordRequirements.maxLength} characters long.` });
      return;
    }

    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      setAlertDialog({ open: true, title: 'Missing Uppercase Letter', description: 'Password must contain at least one uppercase letter.' });
      return;
    }

    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      setAlertDialog({ open: true, title: 'Missing Lowercase Letter', description: 'Password must contain at least one lowercase letter.' });
      return;
    }

    if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
      setAlertDialog({ open: true, title: 'Missing Number', description: 'Password must contain at least one number.' });
      return;
    }

    if (passwordRequirements.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setAlertDialog({ open: true, title: 'Missing Special Character', description: 'Password must contain at least one special character.' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (error) {
        setAlertDialog({
          open: true,
          title: 'Error',
          description: error.message || 'Failed to reset password. Please try again.',
        });
      } else {
        setAlertDialog({
          open: true,
          title: 'Password Reset Successful',
          description: 'Your password has been reset. You can now sign in with your new password.',
        });
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate(appConfig.routes.public.login);
        }, 2000);
      }
    } catch (error) {
      setAlertDialog({
        open: true,
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordHelperText = () => {
    const req = appConfig.auth.passwordRequirements;
    const requirements = [];

    requirements.push(`${req.minLength}-${req.maxLength} characters`);
    if (req.requireUppercase) requirements.push('uppercase letter');
    if (req.requireLowercase) requirements.push('lowercase letter');
    if (req.requireNumbers) requirements.push('number');
    if (req.requireSymbols) requirements.push('special character');

    return `Must contain: ${requirements.join(', ')}`;
  };

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{showPasswordForm ? 'Set New Password' : showOTPForm ? 'Enter Reset Code' : 'Reset Password'}</CardTitle>
          <CardDescription className="text-center">
            {showPasswordForm ? 'Choose a strong password for your account' : showOTPForm ? 'Enter the 6-digit code from your email' : 'Enter your email to receive a reset code'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showPasswordForm ? (
            // New Password Form
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={appConfig.auth.passwordRequirements.minLength}
                  maxLength={appConfig.auth.passwordRequirements.maxLength}
                />
                <p className="text-xs text-muted-foreground">{getPasswordHelperText()}</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Resetting password...' : 'Reset Password'}
              </Button>
            </form>
          ) : showOTPForm ? (
            // OTP Verification Form
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Code sent to</p>
                <p className="font-medium">{email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-otp">Reset Code</Label>
                <Input
                  id="reset-otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <div className="flex gap-2 justify-center text-sm">
                <Button type="button" variant="link" onClick={() => handleSendOTP(new Event('submit') as any)} disabled={isLoading}>
                  Resend code
                </Button>
                <span className="text-muted-foreground">•</span>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setShowOTPForm(false);
                    setOTP('');
                  }}
                >
                  Use different email
                </Button>
              </div>
            </form>
          ) : (
            // Email Form
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input id="reset-email" type="email" placeholder="Enter your email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending reset code...' : 'Send Reset Code'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to={appConfig.routes.public.login} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
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
    </>
  );
}
