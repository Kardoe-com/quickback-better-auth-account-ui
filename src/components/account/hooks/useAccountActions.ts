/**
 * Hook for account-related actions
 * 
 * Uses Better Auth's built-in organization plugin methods:
 * - authClient.organization.acceptInvitation() - Better Auth organization plugin
 * - authClient.organization.rejectInvitation() - Better Auth organization plugin
 * 
 * For self-deletion, uses Better Auth's built-in delete-user endpoint
 * (Better Auth doesn't provide a client method wrapper for self-deletion)
 * 
 * @see https://www.better-auth.com/docs/plugins/organization
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authClient from "@/auth/authClient";
import { getAuthApiUrl } from "@/config/runtime";

export interface UseAccountActionsOptions {
  /** Callback when invitation is accepted (for updating local state) */
  onInvitationAccepted?: (invitationId: string) => void;
  
  /** Callback when invitation is rejected (for updating local state) */
  onInvitationRejected?: (invitationId: string) => void;
}

export function useAccountActions(options?: UseAccountActionsOptions) {
  const navigate = useNavigate();
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      await authClient.organization.acceptInvitation({ invitationId });
      options?.onInvitationAccepted?.(invitationId);
      // Refresh the page to update organizations list
      window.location.reload();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      await authClient.organization.rejectInvitation({ invitationId });
      options?.onInvitationRejected?.(invitationId);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      throw error;
    } finally {
      setProcessingInvite(null);
    }
  };

  /**
   * Handle self-deletion of user account
   *
   * Uses Better Auth's built-in delete-user endpoint.
   * This is a core Better Auth feature (not part of admin plugin) that allows
   * users to delete their own accounts.
   *
   * @see https://www.better-auth.com/docs/api-reference/delete-user
   */
  const handleDeleteAccount = async (password: string, userEmail: string) => {
    const response = await fetch(getAuthApiUrl('/delete-user'), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        password: password,
        callbackURL: "/"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to delete account" }));
      const errorMessage = (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string')
        ? errorData.message
        : "Failed to delete account";
      throw new Error(errorMessage);
    }

    navigate("/");
  };

  return {
    handleAcceptInvitation,
    handleRejectInvitation,
    handleDeleteAccount,
    processingInvite,
  };
}
