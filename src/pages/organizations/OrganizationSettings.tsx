import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2, Check, AlertTriangle, Trash2 } from 'lucide-react';
import authClient from '@/auth/authClient';
import { DeleteOrganizationDialog } from './components/DeleteOrganizationDialog';

interface OrganizationContext {
  organization: any;
  member: any;
  isOwnerOrAdmin: boolean;
  refreshOrganization?: () => void;
}

export default function OrganizationSettings() {
  const { organization, member, isOwnerOrAdmin, refreshOrganization } = useOutletContext<OrganizationContext>();

  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  const [logo, setLogo] = useState(organization?.logo || '');

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);


  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = member?.role === 'owner';
  const hasChanges = name !== organization?.name || logo !== (organization?.logo || '');

  // Reset form when organization changes
  useEffect(() => {
    setName(organization?.name || '');
    setSlug(organization?.slug || '');
    setLogo(organization?.logo || '');
  }, [organization]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      const { error } = await authClient.organization.update({
        data: {
          name: name !== organization?.name ? name : undefined,
          logo: logo !== (organization?.logo || '') ? (logo || null) : undefined,
        },
      });

      if (error) {
        setUpdateError(error.message || 'Failed to update organization');
        return;
      }

      setUpdateSuccess(true);
      refreshOrganization?.();

      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating organization:', err);
      setUpdateError('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOwnerOrAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          You don't have permission to access settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Organization Settings</CardTitle>
          </div>
          <CardDescription>Manage your organization's profile and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="org-slug"
                  type="text"
                  value={slug}
                  disabled={true}
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Organization slug cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-logo">Logo URL (optional)</Label>
              <Input
                id="org-logo"
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to an image for your organization's logo
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Created</Label>
              <p className="text-sm">{new Date(organization.createdAt).toLocaleDateString()}</p>
            </div>

            {updateError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {updateError}
              </p>
            )}

            {updateSuccess && (
              <p className="text-sm text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                <Check className="h-4 w-4" />
                Organization updated successfully
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!hasChanges || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
              <div>
                <p className="font-medium">Delete this organization</p>
                <p className="text-sm text-muted-foreground">
                  Once deleted, all data will be permanently removed.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DeleteOrganizationDialog
        organizationId={organization.id}
        organizationName={organization.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
