import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, MoreHorizontal, UserCog, UserMinus, LogOut } from 'lucide-react';
import authClient from '@/auth/authClient';
import { ChangeMemberRoleDialog } from './components/ChangeMemberRoleDialog';
import { RemoveMemberDialog } from './components/RemoveMemberDialog';
import { LeaveOrganizationDialog } from './components/LeaveOrganizationDialog';

interface OrganizationContext {
  organization: any;
  member: any;
  isOwnerOrAdmin: boolean;
  refreshOrganization?: () => void;
}

export default function OrganizationMembers() {
  const { organization, member, isOwnerOrAdmin, refreshOrganization } = useOutletContext<OrganizationContext>();
  const { data: session } = authClient.useSession();

  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const currentUserId = session?.user?.id;
  const isOwner = member?.role === 'owner';

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : '?';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const openChangeRoleDialog = (m: any) => {
    setSelectedMember(m);
    setChangeRoleDialogOpen(true);
  };

  const openRemoveDialog = (m: any) => {
    setSelectedMember(m);
    setRemoveDialogOpen(true);
  };

  const handleSuccess = () => {
    refreshOrganization?.();
  };

  // Check if current user can manage a specific member
  const canManageMember = (targetMember: any) => {
    if (!isOwnerOrAdmin) return false;
    // Cannot manage yourself via these options (use Leave instead)
    if (targetMember.userId === currentUserId) return false;
    // Only owners can manage other owners
    if (targetMember.role === 'owner' && !isOwner) return false;
    return true;
  };

  // Check if current user can leave (non-owners only)
  const canLeave = !isOwner;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Members</CardTitle>
            </div>
            {canLeave && (
              <Button variant="outline" onClick={() => setLeaveDialogOpen(true)}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave Organization
              </Button>
            )}
          </div>
          <CardDescription>
            {organization.members?.length || 0} member{(organization.members?.length || 0) !== 1 ? 's' : ''} in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organization.members && organization.members.length > 0 ? (
            <div className="space-y-3">
              {organization.members.map((m: any) => {
                const isCurrentUser = m.userId === currentUserId;
                const showActions = canManageMember(m);

                return (
                  <div key={m.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.user?.image || undefined} />
                      <AvatarFallback className="bg-slate-700 text-white">
                        {getInitials(m.user?.name, m.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {m.user?.name || 'Unknown'}
                          {isCurrentUser && (
                            <span className="text-muted-foreground font-normal ml-1">(you)</span>
                          )}
                        </span>
                        <Badge variant={getRoleBadgeVariant(m.role)}>{m.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{m.user?.email}</p>
                    </div>
                    {showActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openChangeRoleDialog(m)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openRemoveDialog(m)}
                            className="text-red-600"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No members found</p>
          )}
        </CardContent>
      </Card>

      <ChangeMemberRoleDialog
        member={selectedMember}
        currentUserRole={member?.role || 'member'}
        organizationId={organization.id}
        open={changeRoleDialogOpen}
        onOpenChange={setChangeRoleDialogOpen}
        onSuccess={handleSuccess}
      />

      <RemoveMemberDialog
        member={selectedMember}
        organizationId={organization.id}
        organizationName={organization.name}
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onSuccess={handleSuccess}
      />

      <LeaveOrganizationDialog
        organizationId={organization.id}
        organizationName={organization.name}
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
      />
    </>
  );
}
