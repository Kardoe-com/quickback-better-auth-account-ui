import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import authClient from '@/auth/authClient';
import { getAuthApiUrl } from '@/config/runtime';
import { UserPlus, Info } from 'lucide-react';

interface InviteMemberDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
];

export function InviteMemberDialog({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(true);

  useEffect(() => {
    if (open) {
      fetch(getAuthApiUrl('/ses/status'), { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data?.emailConfigured === 'boolean') {
            setEmailConfigured(data.emailConfigured);
          }
        })
        .catch(() => {
          // Assume configured if we can't check
        });
    }
  }, [open]);

  const resetForm = () => {
    setEmail('');
    setRole('member');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: inviteError } = await authClient.organization.inviteMember({
        email: email.trim(),
        role: role as 'member' | 'admin',
        organizationId,
      });

      if (inviteError) {
        setError(inviteError.message || 'Failed to send invitation');
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error inviting member:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            {emailConfigured
              ? 'Send an invitation to join this organization. They will receive an email with instructions.'
              : 'Create an invitation to join this organization. You can share the invitation link manually.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!emailConfigured && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Email delivery is not configured. The invitation will be created but no email will be sent. You can share the invitation link manually.</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admins can manage members and invitations. Members have basic access.
              </p>
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
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
