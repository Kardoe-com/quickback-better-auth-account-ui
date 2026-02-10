import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UsersRound, Plus, MoreHorizontal, Users, Pencil, Trash2, Loader2 } from 'lucide-react';
import authClient from '@/auth/authClient';
import { CreateTeamDialog } from './components/CreateTeamDialog';
import { TeamMembersDialog } from './components/TeamMembersDialog';

interface OrganizationContext {
  organization: any;
  member: any;
  isOwnerOrAdmin: boolean;
  refreshOrganization?: () => void;
}

export default function OrganizationTeams() {
  const { organization, isOwnerOrAdmin, refreshOrganization } = useOutletContext<OrganizationContext>();

  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const { data, error: fetchError } = await authClient.organization.listTeams({
        query: { organizationId: organization.id },
      });

      if (fetchError) {
        // If teams aren't available server-side, treat as empty
        if (fetchError.status === 404 || fetchError.message?.includes('not found')) {
          setTeams([]);
          return;
        }
        setError(fetchError.message || 'Failed to load teams');
        return;
      }

      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateSuccess = () => {
    fetchTeams();
  };

  const openEditDialog = (team: any) => {
    setSelectedTeam(team);
    setEditName(team.name);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (team: any) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  };

  const openMembersDialog = (team: any) => {
    setSelectedTeam(team);
    setMembersDialogOpen(true);
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !editName.trim()) return;

    setIsUpdating(true);

    try {
      const { error: updateError } = await authClient.organization.updateTeam({
        teamId: selectedTeam.id,
        data: { name: editName.trim() },
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update team');
        return;
      }

      setEditDialogOpen(false);
      fetchTeams();
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setIsDeleting(true);

    try {
      const { error: deleteError } = await authClient.organization.removeTeam({
        teamId: selectedTeam.id,
        organizationId: organization.id,
      });

      if (deleteError) {
        setError(deleteError.message || 'Failed to delete team');
        return;
      }

      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOwnerOrAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          You don't have permission to manage teams.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              <CardTitle>Teams</CardTitle>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
          <CardDescription>
            Organize members into teams for easier management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">
              {error}
            </p>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => openMembersDialog(team)}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openMembersDialog(team)}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(team)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Name
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(team)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No teams yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create teams to organize your members into groups
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTeamDialog
        organizationId={organization.id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Team
            </DialogTitle>
            <DialogDescription>
              Update the team name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeam}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-team-name">Team Name</Label>
                <Input
                  id="edit-team-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Engineering"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !editName.trim()}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium">{selectedTeam?.name}</span>?
              This will remove the team but members will remain in the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TeamMembersDialog
        team={selectedTeam}
        organizationMembers={organization.members || []}
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        onMembersChanged={fetchTeams}
      />
    </>
  );
}
