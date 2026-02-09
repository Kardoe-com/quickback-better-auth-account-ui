import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Trash2, ChevronRight, Plus, Building2, Mail, Check, X, Fingerprint, Image, Pencil, Monitor } from 'lucide-react';
import { appConfig } from '@/config/app';
import { AvatarUploadDialog } from '@/components/account/AvatarUploadDialog';
import { EditNameDialog } from '@/components/account/EditNameDialog';
import { ChangeEmailDialog } from '@/components/account/ChangeEmailDialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Delete Account Dialog Component
function DeleteAccountDialog({ isOpen, onClose, userEmail }: { isOpen: boolean; onClose: () => void; userEmail: string }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const expectedText = `delete ${userEmail}`;
  const isConfirmed = confirmationText === expectedText;

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Use Better Auth's deleteUser method (passwordless - sends verification email)
      // This will send a verification email; user must click link to confirm deletion
      const { error: deleteError } = await authClient.deleteUser({
        callbackURL: '/account-deleted?deleted=true',
      });

      if (deleteError) {
        setError(deleteError.message || 'Failed to initiate account deletion');
        setIsDeleting(false);
        return;
      }

      // Success - verification email sent
      setSuccessMessage(
        `A verification email has been sent to ${userEmail}. Please check your email and click the link to complete the account deletion. Your account will remain active until you confirm deletion via the email link.`
      );
      setIsDeleting(false);
    } catch (err) {
      console.error('Error initiating account deletion:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setError('');
    setSuccessMessage('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
          <div className="text-sm text-muted-foreground space-y-3">
            <p className="font-semibold">This action cannot be undone!</p>
            <p>This will permanently delete your account and remove all of your data from our servers.</p>
            <p>To confirm deletion, please type exactly:</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-center select-all">{expectedText}</p>
            <p className="text-sm text-muted-foreground mt-2">After confirming, you'll receive an email with a verification link to complete the deletion.</p>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">Type: delete {userEmail}</Label>
            <Input
              id="confirmation"
              type="text"
              placeholder={expectedText}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className={confirmationText && !isConfirmed ? 'border-red-500' : ''}
              autoFocus
            />
            {confirmationText && !isConfirmed && <p className="text-sm text-red-500">Text doesn't match</p>}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

          {successMessage && <p className="text-sm text-green-700 bg-green-50 p-3 rounded whitespace-pre-line">{successMessage}</p>}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              {successMessage ? 'Close' : 'Cancel'}
            </Button>
            {!successMessage && (
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={!isConfirmed || isDeleting}>
                {isDeleting ? 'Sending...' : 'Delete My Account'}
              </Button>
            )}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ProfilePage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [localTimezone, setLocalTimezone] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Initialize avatar URL from session
  useEffect(() => {
    if (session?.user?.image) {
      setAvatarUrl(session.user.image);
    }
  }, [session?.user?.image]);

  useEffect(() => {
    // Get browser's local timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setLocalTimezone(timezone);
    } catch (error) {
      console.error('Failed to get local timezone:', error);
    }
  }, []);
  const { data: organizations, isPending: orgsLoading } = authClient.useListOrganizations();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null); // null means not measured yet
  const buttonsContainerRef = useRef<HTMLDivElement>(null);

  // Check container width for multiple breakpoints
  useEffect(() => {
    const checkWidth = () => {
      if (buttonsContainerRef.current) {
        const width = buttonsContainerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    // Check after component has rendered and ref is available
    const timeoutId1 = setTimeout(checkWidth, 0);
    const timeoutId2 = setTimeout(checkWidth, 100);
    const timeoutId3 = setTimeout(checkWidth, 300);

    // Use ResizeObserver for more accurate container width detection
    let resizeObserver: ResizeObserver | null = null;

    const setupObserver = () => {
      if (buttonsContainerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          checkWidth();
        });
        resizeObserver.observe(buttonsContainerRef.current);
      }
    };

    // Setup observer after a short delay to ensure ref is attached
    const observerTimeout = setTimeout(setupObserver, 0);

    // Also listen to window resize as fallback
    window.addEventListener('resize', checkWidth);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(observerTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', checkWidth);
    };
  }, []);

  // Define breakpoints for different behaviors
  // If not measured yet (null), default to showing all buttons
  const hasMeasured = containerWidth !== null;
  const showOnlyFirstButton = hasMeasured && containerWidth < 400;
  const showFirstTwoButtons = hasMeasured && containerWidth >= 400 && containerWidth < 550;
  const showMoreMenu = hasMeasured && containerWidth < 735; // Show More menu below 735px
  const showAllButtons = !hasMeasured || containerWidth >= 735; // Show all buttons if not measured yet or at 735px and above

  // Check if user has admin role
  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    // Only redirect if we're done loading and there's no session
    if (!sessionLoading && session === null) {
      navigate(appConfig.routes.public.home);
    }
  }, [session, sessionLoading, navigate]);

  // Fetch pending invitations
  useEffect(() => {
    async function fetchInvitations() {
      try {
        const result = await authClient.organization.listUserInvitations();
        if (result.data) {
          setPendingInvitations(result.data.filter((inv: any) => inv.status === 'pending'));
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
      } finally {
        setLoadingInvitations(false);
      }
    }
    if (session) {
      fetchInvitations();
    }
  }, [session]);

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      await authClient.organization.acceptInvitation({ invitationId });
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      // Refresh the page to update organizations list
      window.location.reload();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      await authClient.organization.rejectInvitation({ invitationId });
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    } finally {
      setProcessingInvite(null);
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  // Get user initials for avatar
  const getUserInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      const parts = name.split(' ');
      return parts
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : '?';
  };

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  return (
    <div className="flex-1 flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Profile Header */}
      <div className="bg-background">
        <div className="container mx-auto px-4 pt-2 pb-6 lg:pt-2 lg:pb-0">
          <div className="flex items-center gap-6">
            {/* Avatar - Clickable to open upload dialog (only if file uploads enabled) */}
            {appConfig.features.fileUploads ? (
              <button onClick={() => setIsAvatarDialogOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity" aria-label="Change avatar">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-xl font-medium bg-slate-700 text-white">{getUserInitials(session.user?.name, session.user?.email)}</AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xl font-medium bg-slate-700 text-white">{getUserInitials(session.user?.name, session.user?.email)}</AvatarFallback>
              </Avatar>
            )}

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold break-words">{session.user?.name || appConfig.messages.userFallback || 'User'}</h1>
              </div>
              <p className="text-muted-foreground truncate">{session.user?.email || appConfig.messages.noEmailProvided || 'No email provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="container mx-auto px-4 pb-4 lg:py-8">
          {/* Actions Section - All screen sizes: Row of buttons with More menu */}
          <div ref={buttonsContainerRef} className="flex mb-6 pb-1 border-b flex-wrap gap-2">
            {/* Change Avatar - Only visible if file uploads enabled */}
            {appConfig.features.fileUploads && (
              <button
                onClick={() => setIsAvatarDialogOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
              >
                <Image className="h-4 w-4" />
                <span>Change Avatar</span>
              </button>
            )}

            {/* Edit Name - Visible when >= 400px */}
            {!showOnlyFirstButton && (
              <button
                onClick={() => setIsEditNameDialogOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit Name</span>
              </button>
            )}

            {/* Change Email - Visible when >= 550px */}
            {!showOnlyFirstButton && !showFirstTwoButtons && session.user?.email && (
              <button
                onClick={() => setIsChangeEmailDialogOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
              >
                <Mail className="h-4 w-4" />
                <span>Change Email</span>
              </button>
            )}

            {/* Manage Passkeys, Manage Devices & Delete Account - Show as buttons when >= 735px, in More menu when below */}
            {showAllButtons ? (
              <>
                <Link to="/manage-passkeys" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
                  <Fingerprint className="h-4 w-4" />
                  <span>Manage Passkeys</span>
                </Link>
                <Link to="/devices" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
                  <Monitor className="h-4 w-4" />
                  <span>Manage Devices</span>
                </Link>
                {session.user?.email && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsDeleteDialogOpen(true);
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </a>
                )}
              </>
            ) : showMoreMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4" />
                    <span>{appConfig.messages.more || 'More'}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/manage-passkeys" className="flex items-center gap-2 cursor-pointer">
                      <Fingerprint className="h-4 w-4" />
                      <span>Manage Passkeys</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/devices" className="flex items-center gap-2 cursor-pointer">
                      <Monitor className="h-4 w-4" />
                      <span>Manage Devices</span>
                    </Link>
                  </DropdownMenuItem>
                  {session.user?.email && (
                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Account</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar - Left Side on desktop, bottom on mobile */}
            <div className="w-full lg:w-[300px] space-y-6 order-2 lg:order-1">
              {/* User Metadata */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">{appConfig.messages.accountInformation || 'Account Information'}</h2>
                <div className="space-y-4">
                  {localTimezone && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{appConfig.messages.timezone || 'Timezone'}</span>
                      </div>
                      <div className="pl-6">
                        <span>{localTimezone}</span>
                      </div>
                    </div>
                  )}
                  {((session as any).session?.city || (session as any).session?.country) && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{appConfig.messages.serverLocation || 'Server Location'}</span>
                      </div>
                      <div className="pl-6">
                        <span>
                          {[(session as any).session?.city, (session as any).session?.region, (session as any).session?.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{appConfig.messages.memberSince || 'Member since'}</span>
                    </div>
                    <div className="pl-6">
                      <span>
                        {new Date(session.user?.createdAt || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Invitations above Organizations */}
            <div className="flex-1 order-1 lg:order-2 space-y-6">
              {/* Pending Invitations Card */}
              {!loadingInvitations && pendingInvitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {appConfig.messages.pendingInvitations || 'Pending Invitations'}
                      <Badge variant="secondary" className="ml-2">
                        {pendingInvitations.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {pendingInvitations.map((invitation: any) => (
                        <div key={invitation.id} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={invitation.organization?.logo || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10">{getOrgInitials(invitation.organization?.name || 'ORG')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{invitation.organization?.name || 'Organization'}</h4>
                              <p className="text-xs text-muted-foreground">
                                {appConfig.messages.invitedAs || 'Invited as'} <span className="capitalize">{invitation.role}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="default" className="flex-1 h-8" disabled={processingInvite === invitation.id} onClick={() => handleAcceptInvitation(invitation.id)}>
                              <Check className="h-3 w-3 mr-1" />
                              {appConfig.messages.accept || 'Accept'}
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8" disabled={processingInvite === invitation.id} onClick={() => handleRejectInvitation(invitation.id)}>
                              <X className="h-3 w-3 mr-1" />
                              {appConfig.messages.decline || 'Decline'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Organizations Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {appConfig.labels.organizations || 'Organizations'}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {organizations?.length || 0} {appConfig.messages.total || 'total'}
                      </span>
                      {isAdmin && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/organizations/new">
                            <Plus className="h-4 w-4 mr-1" />
                            {appConfig.messages.new || 'New'}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {orgsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                          <div className="h-10 w-10 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !organizations || organizations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto opacity-20" />
                      </div>
                      <p className="text-muted-foreground mb-4">{appConfig.messages.noOrganizations || "You're not a member of any organizations yet."}</p>
                      {isAdmin ? (
                        <Button asChild>
                          <Link to="/organizations/new">
                            <Plus className="h-4 w-4 mr-2" />
                            {appConfig.messages.createOrganization || 'Create Organization'}
                          </Link>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">{appConfig.messages.contactAdminForInvite || 'Contact an admin to be invited to an organization.'}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {organizations.map((org: any) => (
                        <Link key={org.id} to={`/organizations/${org.slug}`} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors group">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={org.logo || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">{getOrgInitials(org.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{org.name}</h3>
                              <Badge variant={getRoleBadgeVariant(org.role)}>{org.role}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">/{org.slug}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* No Pending Invitations Message */}
              {!loadingInvitations && pendingInvitations.length === 0 && (
                <div className="text-center text-sm text-muted-foreground mt-4">{appConfig.messages.noPendingInvitations || 'You have no pending invitations'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      {session.user?.email && <DeleteAccountDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} userEmail={session.user.email} />}

      {/* Avatar Upload Dialog - Only if file uploads enabled */}
      {appConfig.features.fileUploads && session.user && (
        <AvatarUploadDialog
          isOpen={isAvatarDialogOpen}
          onClose={() => setIsAvatarDialogOpen(false)}
          currentImage={avatarUrl || undefined}
          userId={session.user.id}
          onSuccess={(newUrl) => setAvatarUrl(newUrl)}
        />
      )}

      {/* Edit Name Dialog */}
      {session.user && <EditNameDialog isOpen={isEditNameDialogOpen} onClose={() => setIsEditNameDialogOpen(false)} currentName={session.user?.name || undefined} />}

      {/* Change Email Dialog */}
      {session.user?.email && <ChangeEmailDialog isOpen={isChangeEmailDialogOpen} onClose={() => setIsChangeEmailDialogOpen(false)} currentEmail={session.user.email} />}
    </div>
  );
}
