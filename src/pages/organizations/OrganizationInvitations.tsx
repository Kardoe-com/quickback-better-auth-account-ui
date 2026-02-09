import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Mail, MoreHorizontal, UserPlus, RefreshCw, XCircle } from 'lucide-react';
import authClient from '@/auth/authClient';
import { InviteMemberDialog } from './components/InviteMemberDialog';

interface OrganizationContext {
  organization: any;
  member: any;
  isOwnerOrAdmin: boolean;
  refreshOrganization?: () => void;
}

export default function OrganizationInvitations() {
  const { organization, isOwnerOrAdmin, refreshOrganization } = useOutletContext<OrganizationContext>();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleInviteSuccess = () => {
    refreshOrganization?.();
  };

  const handleResendInvitation = async (invitation: any) => {
    setProcessingId(invitation.id);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role,
        organizationId: organization.id,
        resend: true,
      });
      if (error) {
        console.error('Failed to resend invitation:', error);
      }
      refreshOrganization?.();
    } catch (err) {
      console.error('Error resending invitation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!selectedInvitation) return;
    setIsProcessing(true);
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId: selectedInvitation.id,
      });
      if (error) {
        console.error('Failed to cancel invitation:', error);
      }
      refreshOrganization?.();
    } catch (err) {
      console.error('Error canceling invitation:', err);
    } finally {
      setIsProcessing(false);
      setCancelDialogOpen(false);
      setSelectedInvitation(null);
    }
  };

  const openCancelDialog = (invitation: any) => {
    setSelectedInvitation(invitation);
    setCancelDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline' as const;
      case 'accepted':
        return 'default' as const;
      case 'rejected':
      case 'canceled':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (!isOwnerOrAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          You don't have permission to view invitations.
        </CardContent>
      </Card>
    );
  }

  const pendingInvitations = organization.invitations?.filter((i: any) => i.status === 'pending') || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Invitations</CardTitle>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          <CardDescription>Manage pending invitations to this organization</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{invitation.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(invitation.role)}>
                        {invitation.role}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(invitation.status)}>
                        {invitation.status}
                      </Badge>
                      {invitation.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={processingId === invitation.id}
                      >
                        {processingId === invitation.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleResendInvitation(invitation)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openCancelDialog(invitation)}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No pending invitations</p>
              <p className="text-sm text-muted-foreground mt-1">
                Invite team members to collaborate in this organization
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberDialog
        organizationId={organization.id}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleInviteSuccess}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{' '}
              <span className="font-medium">{selectedInvitation?.email}</span>?
              They will no longer be able to join using this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Canceling...' : 'Cancel Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
