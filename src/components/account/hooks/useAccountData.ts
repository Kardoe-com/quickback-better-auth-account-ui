/**
 * Hook for fetching account-related data
 * 
 * Uses Better Auth's built-in organization plugin methods:
 * - authClient.useSession() - Better Auth session hook
 * - authClient.useListOrganizations() - Better Auth organization plugin hook
 * - authClient.organization.listUserInvitations() - Better Auth organization plugin method
 * 
 * @see https://www.better-auth.com/docs/plugins/organization
 */

import { useEffect, useState } from "react";
import authClient from "@/auth/authClient";

export interface AccountData {
  session: any;
  organizations: any[];
  pendingInvitations: any[];
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAccountData() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { data: organizations, isPending: orgsLoading } = authClient.useListOrganizations();
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  const isAdmin = (session?.user as any)?.role === 'admin';
  const isLoading = sessionLoading || orgsLoading;

  // Fetch pending invitations
  useEffect(() => {
    async function fetchInvitations() {
      try {
        const result = await authClient.organization.listUserInvitations();
        if (result.data) {
          setPendingInvitations(result.data.filter((inv: any) => inv.status === 'pending'));
        }
      } catch (error) {
        console.error("Error fetching invitations:", error);
      } finally {
        setLoadingInvitations(false);
      }
    }
    if (session) {
      fetchInvitations();
    }
  }, [session]);

  return {
    session,
    organizations: organizations || [],
    pendingInvitations,
    isLoading,
    isAdmin,
    loadingInvitations,
  };
}
