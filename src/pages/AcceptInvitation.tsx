import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Loader2, LogIn, Mail, XCircle } from 'lucide-react';
import { appConfig } from '@/config/app';

type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'error';

export default function AcceptInvitationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invitationId = id || '';
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<InvitationStatus>('pending');

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const result = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });

        if (result.error) {
          setError(result.error.message || 'Invitation not found');
          setStatus('error');
          setIsLoading(false);
          return;
        }

        if (result.data) {
          setInvitation(result.data);
          const expiresAt = new Date(result.data.expiresAt);
          if (expiresAt < new Date()) {
            setStatus('expired');
          } else if (result.data.status === 'accepted') {
            setStatus('accepted');
          } else if (result.data.status === 'rejected') {
            setStatus('rejected');
          } else if (result.data.status === 'canceled') {
            setStatus('error');
            setError('This invitation has been canceled');
          }
        }
      } catch (err: any) {
        console.error('Error fetching invitation:', err);
        setError(err?.message || 'Failed to load invitation');
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    }

    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  const handleAccept = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to accept invitation');
        setIsProcessing(false);
        return;
      }

      setStatus('accepted');
      setTimeout(() => {
        navigate(`/organizations/${invitation?.organization?.slug || ''}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err?.message || 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const result = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to reject invitation');
        setIsProcessing(false);
        return;
      }

      setStatus('rejected');
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      setError(err?.message || 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Organization Invitation</CardTitle>
            <CardDescription>You need to sign in to accept this invitation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">You&apos;ve been invited to join</p>
                <p className="font-semibold">{invitation.organization?.name}</p>
                <Badge variant="secondary" className="mt-2 capitalize">
                  as {invitation.role}
                </Badge>
              </div>
            )}
            <Button className="w-full" asChild>
              <Link to={`/login?redirect=/accept-invitation/${invitationId}`}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to={`/signup?redirect=/accept-invitation/${invitationId}`} className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-muted-foreground mb-6">{error || 'This invitation is not valid.'}</p>
              <Button asChild>
                <Link to="/organizations">Go to Organizations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-amber-100 rounded-full">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
              <p className="text-muted-foreground mb-6">
                This invitation has expired. Please ask the organization admin to send a new invitation.
              </p>
              <Button asChild>
                <Link to="/organizations">Go to Organizations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invitation Accepted!</h2>
              <p className="text-muted-foreground mb-6">
                You&apos;re now a member of {invitation?.organization?.name}. Redirecting...
              </p>
              <Button asChild>
                <Link to={`/organizations/${invitation?.organization?.slug}`}>Go to Organization</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-gray-100 rounded-full">
                <XCircle className="h-8 w-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invitation Declined</h2>
              <p className="text-muted-foreground mb-6">You have declined this invitation.</p>
              <Button asChild>
                <Link to="/organizations">Go to Organizations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={invitation?.organization?.logo || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getOrgInitials(invitation?.organization?.name || 'ORG')}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>You&apos;ve been invited to join an organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg text-center">
            <h3 className="font-semibold text-lg">{invitation?.organization?.name}</h3>
            <p className="text-sm text-muted-foreground">/{invitation?.organization?.slug}</p>
            <Badge variant="secondary" className="mt-3 capitalize">
              Invited as {invitation?.role}
            </Badge>
          </div>

          {invitation?.inviter && (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Invited by{' '}
                <span className="font-medium">
                  {invitation.inviter.user?.name || invitation.inviter.user?.email}
                </span>
              </p>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            Expires {new Date(invitation?.expiresAt).toLocaleDateString()}
          </div>

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg text-center">{error}</div>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
            </Button>
            <Button className="flex-1" onClick={handleAccept} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
