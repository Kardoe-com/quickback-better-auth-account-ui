import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import authClient from '@/auth/authClient';
import { Users, UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface TeamMembersDialogProps {
  team: any;
  organizationMembers: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersChanged: () => void;
}

export function TeamMembersDialog({
  team,
  organizationMembers,
  open,
  onOpenChange,
  onMembersChanged,
}: TeamMembersDialogProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fetch team members when dialog opens
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!open || !team?.id) return;

      setIsLoadingMembers(true);
      setError('');

      try {
        const { data, error: fetchError } = await authClient.organization.listTeamMembers({
          query: { teamId: team.id },
        });

        if (fetchError) {
          setError(fetchError.message || 'Failed to load team members');
          return;
        }

        setTeamMembers(data || []);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('Failed to load team members');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, [open, team?.id]);

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

  // Get organization members not in the team
  const availableMembers = organizationMembers.filter(
    (m) => !teamMembers.some((tm) => tm.userId === m.userId)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    setError('');

    try {
      const { error: addError } = await authClient.organization.addTeamMember({
        teamId: team.id,
        userId: selectedUserId,
      });

      if (addError) {
        setError(addError.message || 'Failed to add member');
        return;
      }

      // Refresh the team members list
      const { data } = await authClient.organization.listTeamMembers({
        query: { teamId: team.id },
      });
      setTeamMembers(data || []);
      setSelectedUserId('');
      onMembersChanged();
    } catch (err) {
      console.error('Error adding team member:', err);
      setError('Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingUserId(userId);
    setError('');

    try {
      const { error: removeError } = await authClient.organization.removeTeamMember({
        teamId: team.id,
        userId,
      });

      if (removeError) {
        setError(removeError.message || 'Failed to remove member');
        return;
      }

      // Update local state
      setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
      onMembersChanged();
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove member');
    } finally {
      setRemovingUserId(null);
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.name} - Members
          </DialogTitle>
          <DialogDescription>
            Manage members of this team. Add or remove organization members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add member section */}
          {availableMembers.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a member to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.user?.name || m.user?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMember}
                disabled={!selectedUserId || isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          {/* Team members list */}
          <div className="border rounded-lg">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : teamMembers.length > 0 ? (
              <ScrollArea className="max-h-[300px]">
                <div className="divide-y">
                  {teamMembers.map((tm) => {
                    // Find the full user info from organization members
                    const memberInfo = organizationMembers.find(
                      (m) => m.userId === tm.userId
                    );
                    const user = memberInfo?.user || tm.user;

                    return (
                      <div
                        key={tm.userId}
                        className="flex items-center gap-3 p-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.image || undefined} />
                          <AvatarFallback className="bg-slate-700 text-white text-xs">
                            {getInitials(user?.name, user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(tm.userId)}
                          disabled={removingUserId === tm.userId}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removingUserId === tm.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members in this team</p>
                <p className="text-xs mt-1">Add organization members above</p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in this team
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
