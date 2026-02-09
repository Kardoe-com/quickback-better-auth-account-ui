import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Terminal, CheckCircle, XCircle } from 'lucide-react';
import authClient from '@/auth/authClient';
import { getAuthApiUrl } from '@/config/runtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';

type AuthorizeStatus = 'input' | 'confirm' | 'authorizing' | 'success' | 'error';

export default function CliAuthorizePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Get user_code from URL - support both formats
  const urlCode = searchParams.get('user_code') || searchParams.get('code') || '';
  const hasUrlCode = urlCode.length >= 6;

  const [status, setStatus] = useState<AuthorizeStatus>(hasUrlCode ? 'confirm' : 'input');
  const [error, setError] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');

  // The active code is either from URL or manually entered
  const activeCode = hasUrlCode ? urlCode : inputCode;
  const formattedCode = formatUserCode(activeCode);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionPending && !session) {
      // Store the current URL to return after login
      const returnUrl = window.location.pathname + window.location.search;
      navigate(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
    }
  }, [session, sessionPending, navigate]);

  function handleCodeComplete(code: string) {
    setInputCode(code);
    if (code.length === 8) {
      setStatus('confirm');
    }
  }

  function handleEditCode() {
    setStatus('input');
    setError(null);
  }

  async function handleAuthorize() {
    if (!activeCode || activeCode.length < 6) return;

    setStatus('authorizing');
    setError(null);

    try {
      const cleanCode = activeCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const response = await fetch(getAuthApiUrl('/device/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userCode: cleanCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error_description || data.error || data.message || 'Failed to authorize');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Authorization failed');
    }
  }

  async function handleDeny() {
    if (!activeCode) return;

    try {
      const cleanCode = activeCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      await fetch(getAuthApiUrl('/device/deny'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userCode: cleanCode,
        }),
      });
    } catch {
      // Ignore errors on deny
    }

    setStatus('error');
    setError('Authorization denied');
  }

  // Loading state
  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not logged in - will redirect
  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Authorize Quickback CLI</CardTitle>
          <CardDescription>
            {status === 'input'
              ? 'Enter the code shown in your terminal'
              : 'The Quickback CLI is requesting access to your account'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Input mode - user types the code */}
          {status === 'input' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 8-character code from your CLI:
                </p>
                <InputOTP
                  maxLength={8}
                  value={inputCode}
                  onChange={handleCodeComplete}
                  className="justify-center"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                <p>The code is displayed in your terminal after running:</p>
                <code className="mt-1 block text-xs bg-muted px-2 py-1 rounded">
                  quickback login
                </code>
              </div>
            </div>
          )}

          {/* Confirm mode - show code and authorize/deny buttons */}
          {status === 'confirm' && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {hasUrlCode ? 'Confirm this code matches your CLI:' : 'You entered:'}
                </p>
                <p className="text-3xl font-mono font-bold tracking-wider">{formattedCode}</p>
                {!hasUrlCode && (
                  <button
                    onClick={handleEditCode}
                    className="text-xs text-primary hover:underline mt-2"
                  >
                    Edit code
                  </button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>By authorizing, you allow the CLI to:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Compile your Quickback projects</li>
                  <li>Access your account tier information</li>
                </ul>
              </div>
            </div>
          )}

          {/* Authorizing state */}
          {status === 'authorizing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Authorizing...</p>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <p className="font-medium">Authorization successful!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can close this window and return to your terminal.
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-medium">Authorization failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button variant="outline" onClick={() => {
                setStatus(hasUrlCode ? 'confirm' : 'input');
                setError(null);
              }}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>

        {/* Input mode footer */}
        {status === 'input' && (
          <CardFooter className="flex justify-center">
            <Button
              onClick={() => setStatus('confirm')}
              disabled={inputCode.length !== 8}
            >
              Continue
            </Button>
          </CardFooter>
        )}

        {/* Confirm mode footer */}
        {status === 'confirm' && (
          <CardFooter className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDeny}>
              Deny
            </Button>
            <Button className="flex-1" onClick={handleAuthorize}>
              Authorize
            </Button>
          </CardFooter>
        )}

        {/* Success mode footer */}
        {status === 'success' && (
          <CardFooter>
            <Link to="/profile" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Profile
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

/**
 * Format user code with dash for readability (e.g., ABCD-1234)
 */
function formatUserCode(code: string): string {
  const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return cleaned;
}
