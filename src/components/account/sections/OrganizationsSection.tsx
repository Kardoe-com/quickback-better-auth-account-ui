/**
 * Organizations Section Component
 * 
 * Displays user's organizations and pending invitations
 */

import { AccountSection } from "../AccountSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Plus, ChevronRight, Check, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { appConfig, getTenantUrl } from "@/config/app";

export interface OrganizationsSectionProps {
  /** List of organizations */
  organizations?: any[];
  
  /** List of pending invitations */
  pendingInvitations?: any[];
  
  /** Whether user is admin (can create organizations) */
  isAdmin?: boolean;
  
  /** Whether data is loading */
  isLoading?: boolean;
  
  /** Whether invitations are loading */
  loadingInvitations?: boolean;
  
  /** Currently processing invitation ID */
  processingInvite?: string | null;
  
  /** Callback when invitation is accepted */
  onAcceptInvitation?: (invitationId: string) => void;
  
  /** Callback when invitation is rejected */
  onRejectInvitation?: (invitationId: string) => void;
}

/**
 * Get organization initials from name
 */
function getOrgInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get badge variant based on role
 */
function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'owner':
      return 'default' as const;
    case 'admin':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

export function OrganizationsSection({
  organizations = [],
  pendingInvitations = [],
  isAdmin = false,
  isLoading = false,
  loadingInvitations = false,
  processingInvite = null,
  onAcceptInvitation,
  onRejectInvitation,
}: OrganizationsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {!loadingInvitations && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
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
                      <AvatarFallback className="text-xs bg-primary/10">
                        {getOrgInitials(invitation.organization?.name || 'ORG')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {invitation.organization?.name || 'Organization'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Invited as <span className="capitalize">{invitation.role}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 h-8"
                      disabled={processingInvite === invitation.id}
                      onClick={() => onAcceptInvitation?.(invitation.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      disabled={processingInvite === invitation.id}
                      onClick={() => onRejectInvitation?.(invitation.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <AccountSection
        title="Organizations"
        description="Organizations you're a member of"
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {organizations.length} total
            </span>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to={appConfig.routes.organizations.create}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Link>
              </Button>
            )}
          </div>
        }
      >
        {isLoading ? (
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
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto opacity-20" />
            </div>
            <p className="text-muted-foreground mb-4">
              You're not a member of any organizations yet.
            </p>
            {isAdmin ? (
              <Button asChild>
                <Link to={appConfig.routes.organizations.create}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact an admin to be invited to an organization.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {organizations.map((org: any) => {
              const tenantUrl = getTenantUrl(org.slug);

              return (
                <div
                  key={org.id}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <Link
                    to={appConfig.routes.organizations.detail(org.slug)}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={org.logo || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getOrgInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{org.name}</h3>
                        <Badge variant={getRoleBadgeVariant(org.role)}>
                          {org.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        /{org.slug}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    {tenantUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={tenantUrl} target="_blank" rel="noopener noreferrer">
                          Go to App
                          <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                        </a>
                      </Button>
                    )}
                    <Link to={appConfig.routes.organizations.detail(org.slug)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Manage
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AccountSection>

      {/* No Pending Invitations Message */}
      {!loadingInvitations && pendingInvitations.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          You have no pending invitations
        </div>
      )}
    </div>
  );
}
