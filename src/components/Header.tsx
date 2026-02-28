import { Link, useNavigate, useLocation } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { refreshAuthToken } from '@/lib/jwt-refresh';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Building2, ChevronDown, Plus, Shield, CreditCard } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isStripeConfiguredClient } from '@/lib/stripe';
import { isAnonymousEmail } from '@/lib/utils';
import { appConfig } from '@/config/app';

export default function Header() {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    localStorage.removeItem('bearer_token');
    await authClient.signOut();
    navigate('/');
  };

  const handleSwitchOrganization = async (slug: string) => {
    await authClient.organization.setActive({ organizationSlug: slug });
    await refreshAuthToken();
    navigate(`/organizations/${slug}`);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* App Name */}
          <Link to={session?.user ? '/profile' : '/'} className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">{appConfig.name || 'Account'}</h1>
          </Link>

          {/* User Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Organization Switcher - Only shown on organization pages */}
            {session?.user && organizations && organizations.length > 0 && location.pathname.startsWith('/organizations/') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 gap-1 px-2 sm:px-3">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={activeOrganization?.logo || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {activeOrganization ? getOrgInitials(activeOrganization.name) : <Building2 className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block max-w-[100px] truncate text-sm">{activeOrganization?.name || 'Organizations'}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations.map((org: any) => (
                    <DropdownMenuItem key={org.id} className="cursor-pointer" onClick={() => handleSwitchOrganization(org.slug)}>
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={org.logo || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10">{getOrgInitials(org.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate flex-1">{org.name}</span>
                      {activeOrganization?.id === org.id && <span className="ml-auto text-primary text-xs">Active</span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {(session?.user as any)?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/organizations/new" className="cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create Organization</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />
            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user?.image || undefined} />
                      <AvatarFallback className="text-sm font-medium bg-slate-700 text-white">{getInitials(session.user.name, session.user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name || 'User'}</p>
                      {!isAnonymousEmail(session.user.email) && (
                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {isStripeConfiguredClient() && (
                    <DropdownMenuItem asChild>
                      <Link to="/profile/billing" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(session.user as any)?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
