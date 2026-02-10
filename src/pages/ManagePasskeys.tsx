import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Fingerprint, Trash2, Plus, Smartphone, Laptop, Key } from 'lucide-react';
import { appConfig } from '@/config/app';

interface Passkey {
  id: string;
  name?: string;
  credentialID: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string | number | Date;
  transports?: string;
  aaguid?: string;
}

export default function ManagePasskeysPage() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);
  const [error, setError] = useState('');
  const [newPasskeyName, setNewPasskeyName] = useState('');

  useEffect(() => {
    if (!isPending && !session) {
      navigate(appConfig.routes.public.home);
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (session) {
      loadPasskeys();
    }
  }, [session]);

  const loadPasskeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys({});
      if (error) {
        setError('Failed to load passkeys');
      } else {
        setPasskeys(data || []);
      }
    } catch {
      setError('An error occurred while loading passkeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPasskey = async () => {
    setIsAdding(true);
    setError('');

    try {
      const { error } = await authClient.passkey.addPasskey({
        name: newPasskeyName || undefined,
      });

      if (error) {
        setError(error.message || 'Failed to add passkey');
      } else {
        setNewPasskeyName('');
        await loadPasskeys();
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while adding the passkey');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;

    try {
      const { error } = await authClient.passkey.deletePasskey({
        id: passkeyToDelete.id,
      });

      if (error) {
        setError('Failed to delete passkey');
      } else {
        await loadPasskeys();
      }
    } catch {
      setError('An error occurred while deleting the passkey');
    } finally {
      setDeleteDialogOpen(false);
      setPasskeyToDelete(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.toLowerCase().includes('platform')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (deviceType.toLowerCase().includes('cross-platform')) {
      return <Key className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  if (isPending || !session) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Fingerprint className="h-6 w-6" />
            Manage Passkeys
          </h1>
          <p className="text-muted-foreground mt-2">Add or remove passkeys for secure, passwordless authentication</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Passkey</CardTitle>
            <CardDescription>
              Create a new passkey using your device&apos;s biometric authentication or security key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="passkey-name">Passkey Name (Optional)</Label>
                <Input
                  id="passkey-name"
                  type="text"
                  placeholder="e.g., MacBook Pro"
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  disabled={isAdding}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddPasskey} disabled={isAdding} className="w-full sm:w-auto">
                  {isAdding ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Passkey</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Passkeys</CardTitle>
            <CardDescription>
              {passkeys.length} passkey{passkeys.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : passkeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Fingerprint className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p>No passkeys registered yet</p>
                <p className="text-sm mt-2">Add a passkey to enable passwordless authentication</p>
              </div>
            ) : (
              <div className="divide-y">
                {passkeys.map((passkey) => (
                  <div key={passkey.id} className="py-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getDeviceIcon(passkey.deviceType)}</div>
                      <div>
                        <h3 className="font-medium">
                          {passkey.name || `Passkey ${passkey.credentialID.slice(0, 8)}...`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Created{' '}
                          {new Date(passkey.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{passkey.deviceType}</span>
                          {passkey.backedUp && <span className="text-xs text-green-600">Backed up</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPasskeyToDelete(passkey);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {passkeyToDelete?.name || 'this passkey'}? You won&apos;t be able to use it
              for authentication anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePasskey} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
