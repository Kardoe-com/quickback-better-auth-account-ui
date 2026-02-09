import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import authClient from '@/auth/authClient';
import { UserMinus, AlertTriangle } from 'lucide-react';

interface RemoveMemberDialogProps {
  member: any;
  organizationId: string;
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RemoveMemberDialog({
  member,
  organizationId,
  organizationName,
  open,
  onOpenChange,
  onSuccess,
}: RemoveMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    onOpenChange(false);
  };

  const handleRemove = async () => {
    if (!member) return;

    setIsLoading(true);
    setError('');

    try {
      const { error: removeError } = await authClient.organization.removeMember({
        memberIdOrEmail: member.id,
        organizationId,
      });

      if (removeError) {
        setError(removeError.message || 'Failed to remove member');
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error removing member:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!member) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remove Member
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to remove{' '}
              <span className="font-medium">{member.user?.name || member.user?.email}</span> from{' '}
              <span className="font-medium">{organizationName}</span>?
            </p>
            <p className="text-sm">
              They will lose access to all organization resources immediately. You can invite them again later if needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {isLoading ? 'Removing...' : 'Remove Member'}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
