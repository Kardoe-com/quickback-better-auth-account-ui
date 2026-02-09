import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authClient from '@/auth/authClient';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteOrganizationDialogProps {
  organizationId: string;
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteOrganizationDialog({
  organizationId,
  organizationName,
  open,
  onOpenChange,
}: DeleteOrganizationDialogProps) {
  const navigate = useNavigate();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const expectedText = organizationName;
  const isConfirmed = confirmationText === expectedText;

  const resetForm = () => {
    setConfirmationText('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsLoading(true);
    setError('');

    try {
      const { error: deleteError } = await authClient.organization.delete({
        organizationId,
      });

      if (deleteError) {
        setError(deleteError.message || 'Failed to delete organization');
        return;
      }

      // Redirect to profile after deletion
      navigate('/profile');
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold">This action cannot be undone!</p>
            <p>
              This will permanently delete <span className="font-medium">{organizationName}</span> and remove all associated data, including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>All organization members</li>
              <li>All teams</li>
              <li>All pending invitations</li>
              <li>Organization settings and metadata</li>
            </ul>
            <p>To confirm deletion, please type the organization name:</p>
            <p className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded text-center select-all">
              {expectedText}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="delete-org-confirmation">Organization name</Label>
            <Input
              id="delete-org-confirmation"
              type="text"
              placeholder={expectedText}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className={confirmationText && !isConfirmed ? 'border-red-500' : ''}
            />
            {confirmationText && !isConfirmed && (
              <p className="text-sm text-red-500">Name doesn't match</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
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
              onClick={handleDelete}
              disabled={!isConfirmed || isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Deleting...' : 'Delete Organization'}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
