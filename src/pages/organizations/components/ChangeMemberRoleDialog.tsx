import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import authClient from '@/auth/authClient';
import { UserCog } from 'lucide-react';

interface ChangeMemberRoleDialogProps {
  member: any;
  currentUserRole: string;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangeMemberRoleDialog({
  member,
  currentUserRole,
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: ChangeMemberRoleDialogProps) {
  const [role, setRole] = useState(member?.role || 'member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = currentUserRole === 'owner';

  // Only owners can assign/revoke owner role
  const availableRoles = isOwner
    ? [
        { value: 'member', label: 'Member' },
        { value: 'admin', label: 'Admin' },
        { value: 'owner', label: 'Owner' },
      ]
    : [
        { value: 'member', label: 'Member' },
        { value: 'admin', label: 'Admin' },
      ];

  const handleClose = () => {
    setRole(member?.role || 'member');
    setError('');
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || role === member.role) {
      handleClose();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await authClient.organization.updateMemberRole({
        memberId: member.id,
        role: role as 'member' | 'admin' | 'owner',
        organizationId,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update role');
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Change Member Role
          </DialogTitle>
          <DialogDescription>
            Update the role for <span className="font-medium">{member.user?.name || member.user?.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="member-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Member:</strong> Basic access to the organization</p>
                <p><strong>Admin:</strong> Can manage members and invitations</p>
                {isOwner && <p><strong>Owner:</strong> Full control including deletion</p>}
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || role === member.role}>
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
