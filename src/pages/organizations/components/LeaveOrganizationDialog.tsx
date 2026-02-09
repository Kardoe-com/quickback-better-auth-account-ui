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
import authClient from '@/auth/authClient';
import { LogOut, AlertTriangle } from 'lucide-react';

interface LeaveOrganizationDialogProps {
  organizationId: string;
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveOrganizationDialog({
  organizationId,
  organizationName,
  open,
  onOpenChange,
}: LeaveOrganizationDialogProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    onOpenChange(false);
  };

  const handleLeave = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: leaveError } = await authClient.organization.leave({
        organizationId,
      });

      if (leaveError) {
        setError(leaveError.message || 'Failed to leave organization');
        return;
      }

      // Redirect to profile after leaving
      navigate('/profile');
    } catch (err) {
      console.error('Error leaving organization:', err);
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
            Leave Organization
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to leave{' '}
              <span className="font-medium">{organizationName}</span>?
            </p>
            <p className="text-sm">
              You will lose access to all organization resources immediately. You'll need to be invited again to rejoin.
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
              Stay
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoading ? 'Leaving...' : 'Leave Organization'}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
