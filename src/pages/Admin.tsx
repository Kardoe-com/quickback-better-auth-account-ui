import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserList } from '@/app/(authenticated)/admin/components/UserList';
import { CreateUserDialog } from '@/app/(authenticated)/admin/components/CreateUserDialog';
import { EditUserDialog } from '@/app/(authenticated)/admin/components/EditUserDialog';
import { BanUserDialog } from '@/app/(authenticated)/admin/components/BanUserDialog';
import { ChangePasswordDialog } from '@/app/(authenticated)/admin/components/ChangePasswordDialog';
import { SessionsDialog } from '@/app/(authenticated)/admin/components/SessionsDialog';
import { DeleteUserDialog } from '@/app/(authenticated)/admin/components/DeleteUserDialog';
import { SubscriptionList } from '@/app/(authenticated)/admin/components/SubscriptionList';
import { CreateSubscriptionDialog } from '@/app/(authenticated)/admin/components/CreateSubscriptionDialog';
import { EditSubscriptionDialog } from '@/app/(authenticated)/admin/components/EditSubscriptionDialog';
import { DeleteSubscriptionDialog } from '@/app/(authenticated)/admin/components/DeleteSubscriptionDialog';
import { User, Subscription } from '@/app/(authenticated)/admin/types';
import { Users, UserPlus, Shield, AlertTriangle, CreditCard, Crown, Plus } from 'lucide-react';
import { isStripeConfiguredClient } from '@/lib/stripe';

export default function AdminPage() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  // Dialog states
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [banUserOpen, setBanUserOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  // Subscription dialog states
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false);
  const [editSubscriptionOpen, setEditSubscriptionOpen] = useState(false);
  const [deleteSubscriptionOpen, setDeleteSubscriptionOpen] = useState(false);

  // Selected user for dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Selected subscription for dialogs
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Trigger for refreshing user list
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Trigger for refreshing subscription list
  const [subscriptionRefreshTrigger, setSubscriptionRefreshTrigger] = useState(0);

  // Loading state for impersonation
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Check if user is admin
  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login');
    }
  }, [session, isPending, navigate]);

  const refreshUserList = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setBanUserOpen(true);
  };

  const handleUnbanUser = async (user: User) => {
    try {
      const { error } = await authClient.admin.unbanUser({
        userId: user.id,
      });

      if (error) {
        console.error('Error unbanning user:', error);
        return;
      }

      refreshUserList();
    } catch (err) {
      console.error('Error unbanning user:', err);
    }
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setChangePasswordOpen(true);
  };

  const handleViewSessions = (user: User) => {
    setSelectedUser(user);
    setSessionsOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteUserOpen(true);
  };

  const handleImpersonateUser = async (user: User) => {
    setIsImpersonating(true);
    try {
      const { error } = await authClient.admin.impersonateUser({
        userId: user.id,
      });

      if (error) {
        console.error('Error impersonating user:', error);
        return;
      }

      // Redirect to profile page as the impersonated user
      navigate('/profile');
    } catch (err) {
      console.error('Error impersonating user:', err);
    } finally {
      setIsImpersonating(false);
    }
  };

  // Subscription handlers
  const refreshSubscriptionList = () => {
    setSubscriptionRefreshTrigger((prev) => prev + 1);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscriptionOpen(true);
  };

  const handleDeleteSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDeleteSubscriptionOpen(true);
  };

  if (isPending) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don&apos;t have permission to access the admin panel. Please contact an administrator if you believe this is an error.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/profile')}>Return to Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, roles, and permissions</p>
              </div>
            </div>
            <Button onClick={() => setCreateUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Crown className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            {isStripeConfiguredClient() && (
              <TabsTrigger value="stripe" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Billing & Stripe
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in your application. You can edit profiles, change roles, ban/unban users, manage sessions, and more.</CardDescription>
              </CardHeader>
              <CardContent>
                <UserList
                  onEditUser={handleEditUser}
                  onBanUser={handleBanUser}
                  onUnbanUser={handleUnbanUser}
                  onChangePassword={handleChangePassword}
                  onViewSessions={handleViewSessions}
                  onDeleteUser={handleDeleteUser}
                  onImpersonateUser={handleImpersonateUser}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>Manage user subscriptions manually. Create, edit, or delete subscriptions without requiring Stripe.</CardDescription>
                  </div>
                  <Button onClick={() => setCreateSubscriptionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Subscription
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SubscriptionList
                  onEditSubscription={handleEditSubscription}
                  onDeleteSubscription={handleDeleteSubscription}
                  refreshTrigger={subscriptionRefreshTrigger}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isStripeConfiguredClient() && (
            <TabsContent value="stripe" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Management</CardTitle>
                  <CardDescription>Access the full Stripe admin dashboard to manage customers, subscriptions, and billing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Use the dedicated Stripe dashboard for comprehensive billing management including customer creation, subscription management, plan configuration, and analytics.
                    </p>
                    <Link to="/admin/stripe">
                      <Button className="w-full sm:w-auto">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Open Stripe Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateUserDialog open={createUserOpen} onOpenChange={setCreateUserOpen} onUserCreated={refreshUserList} />

      <EditUserDialog user={selectedUser} open={editUserOpen} onOpenChange={setEditUserOpen} onUserUpdated={refreshUserList} />

      <BanUserDialog user={selectedUser} open={banUserOpen} onOpenChange={setBanUserOpen} onUserBanned={refreshUserList} />

      <ChangePasswordDialog user={selectedUser} open={changePasswordOpen} onOpenChange={setChangePasswordOpen} onPasswordChanged={refreshUserList} />

      <SessionsDialog user={selectedUser} open={sessionsOpen} onOpenChange={setSessionsOpen} />

      <DeleteUserDialog user={selectedUser} open={deleteUserOpen} onOpenChange={setDeleteUserOpen} onUserDeleted={refreshUserList} />

      {/* Subscription Dialogs */}
      <CreateSubscriptionDialog open={createSubscriptionOpen} onOpenChange={setCreateSubscriptionOpen} onSuccess={refreshSubscriptionList} />

      <EditSubscriptionDialog subscription={selectedSubscription} open={editSubscriptionOpen} onOpenChange={setEditSubscriptionOpen} onSuccess={refreshSubscriptionList} />

      <DeleteSubscriptionDialog subscription={selectedSubscription} open={deleteSubscriptionOpen} onOpenChange={setDeleteSubscriptionOpen} onSuccess={refreshSubscriptionList} />

      {/* Loading overlay for impersonation */}
      {isImpersonating && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Starting impersonation session...</p>
          </div>
        </div>
      )}
    </div>
  );
}
