import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link, Outlet } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, Users, Mail, Settings, UsersRound, Key, Crown } from 'lucide-react';
import { appConfig, isFeatureEnabled } from '@/config/app';
import { getOrganizationSubscription } from '@/lib/subscriptions';
import { Subscription } from '@/app/(authenticated)/admin/types';

export default function OrganizationLayout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  const [organization, setOrganization] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track if we've already fetched for this slug to prevent duplicate fetches
  const fetchedSlugRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (session === null) {
      navigate(appConfig.routes.public.home);
    }
  }, [session, navigate]);

  const fetchOrganization = useCallback(async () => {
    if (!slug) return;

    // Prevent duplicate fetches for the same slug
    if (fetchedSlugRef.current === slug || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      // Set this organization as active
      await authClient.organization.setActive({ organizationSlug: slug });

      // Get full organization details
      const result = await authClient.organization.getFullOrganization({ query: { organizationSlug: slug } });
      if (result.data) {
        setOrganization(result.data);
        // Find current user's membership using the session at call time
        const userId = session?.user?.id;
        const currentMember = result.data.members?.find((m: any) => m.userId === userId);
        setMember(currentMember);

        // Fetch subscription for this organization
        try {
          const sub = await getOrganizationSubscription(result.data.id);
          setSubscription(sub);
        } catch (err) {
          console.error('Error fetching subscription:', err);
        }

        // Mark this slug as fetched
        fetchedSlugRef.current = slug;
      } else {
        navigate('/organizations');
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      navigate('/organizations');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [slug, navigate, session]);

  useEffect(() => {
    // Only fetch if we have a session, a slug, and haven't already fetched this slug
    if (session && slug && fetchedSlugRef.current !== slug) {
      fetchOrganization();
    }
  }, [session, slug, fetchOrganization]);

  if (!session || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActiveTab = () => {
    const pathname = location.pathname;
    if (pathname.endsWith('/members')) return 'members';
    if (pathname.endsWith('/invitations')) return 'invitations';
    if (pathname.endsWith('/teams')) return 'teams';
    if (pathname.endsWith('/settings')) return 'settings';
    if (pathname.endsWith('/api-keys')) return 'api-keys';
    return 'overview';
  };

  const isOwnerOrAdmin = member?.role === 'owner' || member?.role === 'admin';

  return (
    <div className="flex-1 flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Organization Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Back Link */}
          <Button variant="ghost" asChild className="mb-4 -ml-2 h-8">
            <Link to="/organizations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Organizations
            </Link>
          </Button>

          {/* Org Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={organization.logo || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">{getOrgInitials(organization.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold truncate">{organization.name}</h1>
                {member && <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{member.role}</Badge>}
                {subscription && (
                  <Badge variant={subscription.tier === 'pro' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">/{organization.slug}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 -mb-px">
            <nav className="flex gap-4 border-b -mb-[1px]">
              <Link
                to={`/organizations/${slug}`}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  getActiveTab() === 'overview' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </Link>
              <Link
                to={`/organizations/${slug}/members`}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  getActiveTab() === 'members' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Members
              </Link>
              {isOwnerOrAdmin && (
                <Link
                  to={`/organizations/${slug}/invitations`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    getActiveTab() === 'invitations' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Invitations
                </Link>
              )}
              {isOwnerOrAdmin && isFeatureEnabled('teams') && (
                <Link
                  to={`/organizations/${slug}/teams`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    getActiveTab() === 'teams' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UsersRound className="h-4 w-4" />
                  Teams
                </Link>
              )}
              {isOwnerOrAdmin && (
                <Link
                  to={`/organizations/${slug}/settings`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    getActiveTab() === 'settings' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              )}
              <Link
                to={`/organizations/${slug}/api-keys`}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  getActiveTab() === 'api-keys' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Key className="h-4 w-4" />
                API Keys
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet context={{ organization, member, isOwnerOrAdmin, refreshOrganization: fetchOrganization }} />
        </div>
      </div>
    </div>
  );
}
