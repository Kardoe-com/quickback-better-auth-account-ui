import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Monitor, Globe, Trash2, Smartphone, Laptop, XCircle, Terminal } from 'lucide-react';
import { appConfig } from '@/config/app';

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  city?: string | null;
  country?: string | null;
  impersonatedBy?: string | null;
  deviceType?: string | null; // 'cli' | 'browser' | etc.
  deviceName?: string | null; // e.g., 'Quickback CLI', 'MacBook Pro'
}

export default function ManageDevicesPage() {
  const { data: currentSession, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPending && !currentSession) {
      navigate(appConfig.routes.public.home);
    }
  }, [currentSession, isPending, navigate]);

  useEffect(() => {
    if (currentSession) {
      loadSessions();
    }
  }, [currentSession]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.listSessions();
      if (error) {
        setError('Failed to load sessions');
      } else {
        setSessions((data as Session[]) || []);
      }
    } catch {
      setError('An error occurred while loading sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;
    setIsRevoking(true);

    try {
      const { error } = await authClient.revokeSession({ token: sessionToRevoke.token });

      if (error) {
        setError('Failed to revoke session');
      } else {
        setSessions((prev) => prev.filter((s) => s.token !== sessionToRevoke.token));
      }
    } catch {
      setError('An error occurred while revoking the session');
    } finally {
      setIsRevoking(false);
      setRevokeDialogOpen(false);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setIsRevoking(true);

    try {
      const { error } = await authClient.revokeOtherSessions();

      if (error) {
        setError('Failed to revoke other sessions');
      } else {
        // Keep only the current session
        setSessions((prev) => prev.filter((s) => isCurrentSession(s)));
      }
    } catch {
      setError('An error occurred while revoking sessions');
    } finally {
      setIsRevoking(false);
      setRevokeAllDialogOpen(false);
    }
  };

  const parseUserAgent = (session: Session) => {
    // Check for CLI sessions first
    if (session.deviceType === 'cli' || session.userAgent?.includes('Quickback CLI')) {
      return session.deviceName || 'Quickback CLI';
    }

    const userAgent = session.userAgent;
    if (!userAgent) return 'Unknown Browser';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const isCliSession = (session: Session) => {
    return session.deviceType === 'cli' || session.userAgent?.includes('Quickback CLI');
  };

  const getDeviceIcon = (session: Session) => {
    // CLI sessions get a terminal icon
    if (isCliSession(session)) {
      return <Terminal className="h-4 w-4" />;
    }

    const userAgent = session.userAgent;
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const getLocation = (session: Session) => {
    const parts = [session.city, session.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown location';
  };

  const isCurrentSession = (session: Session) => {
    // Match by token with the current session
    return (currentSession as any)?.session?.token === session.token;
  };

  const otherSessionsCount = sessions.filter((s) => !isCurrentSession(s)).length;

  if (isPending || !currentSession) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Monitor className="h-6 w-6" />
            Manage Devices
          </h1>
          <p className="text-muted-foreground mt-2">View and manage your active sessions across devices</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Active Sessions</CardTitle>
            <CardDescription>
              {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p>No active sessions found</p>
              </div>
            ) : (
              <div className="divide-y">
                {sessions.map((session) => (
                  <div key={session.id} className="py-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getDeviceIcon(session)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{parseUserAgent(session)}</h3>
                          {isCliSession(session) && (
                            <Badge variant="outline" className="text-xs">
                              CLI
                            </Badge>
                          )}
                          {isCurrentSession(session) && (
                            <Badge variant="secondary" className="text-xs">
                              This device
                            </Badge>
                          )}
                          {session.impersonatedBy && (
                            <Badge variant="outline" className="text-xs">
                              Impersonated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          <span>{getLocation(session)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created{' '}
                          {new Date(session.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isCurrentSession(session)}
                      onClick={() => {
                        setSessionToRevoke(session);
                        setRevokeDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {otherSessionsCount > 0 && (
            <CardFooter className="border-t pt-4">
              <Button
                variant="destructive"
                onClick={() => setRevokeAllDialogOpen(true)}
                disabled={isRevoking}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All Other Sessions
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Revoke Single Session Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The device will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSession}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Other Sessions Dialog */}
      <AlertDialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke all other sessions? All other devices will be signed out immediately.
              Your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllOtherSessions}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRevoking}
            >
              {isRevoking ? 'Revoking...' : 'Revoke All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
