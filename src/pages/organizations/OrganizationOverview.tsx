import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity } from 'lucide-react';

interface OrganizationContext {
  organization: any;
  member: any;
  isOwnerOrAdmin: boolean;
}

export default function OrganizationOverview() {
  const { organization, member } = useOutletContext<OrganizationContext>();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.members?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active members in this organization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{member?.role || 'Member'}</div>
            <p className="text-xs text-muted-foreground">Your current role in this organization</p>
          </CardContent>
        </Card>
      </div>

      {organization.metadata && Object.keys(organization.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Additional information about this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground">{JSON.stringify(organization.metadata, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
