import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Key, Plus, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: Date;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  metadata?: {
    organizationId?: string;
  } | null;
}

interface OrganizationContext {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  member: any;
  isOwnerOrAdmin: boolean;
  refreshOrganization: () => Promise<void>;
}

export default function OrganizationApiKeys() {
  const { organization } = useOutletContext<OrganizationContext>();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete key state
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch API keys for this organization
  useEffect(() => {
    async function fetchApiKeys() {
      try {
        const keysResult = await authClient.apiKey.list();
        if (keysResult.error) {
          setError(keysResult.error.message || 'Failed to load API keys');
        } else if (keysResult.data) {
          // Filter keys by current organization
          const orgKeys = keysResult.data.filter(
            (key: any) => key.metadata?.organizationId === organization.id
          );
          setApiKeys(orgKeys);
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
        setError('Failed to load API keys');
      } finally {
        setLoading(false);
      }
    }

    if (organization) {
      fetchApiKeys();
    }
  }, [organization]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await authClient.apiKey.create({
        name: newKeyName.trim(),
        expiresIn: undefined, // No expiration
        metadata: {
          organizationId: organization.id,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create API key');
        setIsCreating(false);
        return;
      }

      if (result.data?.key) {
        setNewlyCreatedKey(result.data.key);
        // Refresh the list
        const listResult = await authClient.apiKey.list();
        if (listResult.data) {
          const orgKeys = listResult.data.filter(
            (key: any) => key.metadata?.organizationId === organization.id
          );
          setApiKeys(orgKeys);
        }
      }
    } catch (err) {
      console.error('Error creating API key:', err);
      setError('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newlyCreatedKey) return;

    try {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewKeyName('');
    setNewlyCreatedKey(null);
    setCopied(false);
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await authClient.apiKey.delete({
        keyId: keyToDelete.id,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to delete API key');
      } else {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyToDelete.id));
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key');
    } finally {
      setIsDeleting(false);
      setKeyToDelete(null);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage API keys for programmatic access to {organization.name}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization API Keys</CardTitle>
          <CardDescription>
            API keys allow external applications to access {organization.name} on your behalf.
            Keep your keys secure and never share them publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground mb-4">No API keys created for this organization yet.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name || 'Unnamed Key'}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {key.start}...
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created {formatDate(key.createdAt)}
                        {key.lastUsedAt && ` · Last used ${formatDate(key.lastUsedAt)}`}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-600"
                    onClick={() => setKeyToDelete(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <AlertDialog open={isCreateDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newlyCreatedKey ? 'API Key Created' : 'Create API Key'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {newlyCreatedKey
                ? 'Copy your API key now. You won\'t be able to see it again.'
                : 'Give your API key a name to help you identify it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {newlyCreatedKey ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Important:</strong> This is the only time you'll see this key.
                  Store it securely.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newlyCreatedKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production Server, Development"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This API key will have access to {organization.name}'s data.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            {newlyCreatedKey ? (
              <AlertDialogAction onClick={handleCloseCreateDialog}>Done</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Key Dialog */}
      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{keyToDelete?.name || 'this key'}"?
              Any applications using this key will no longer be able to access the API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
