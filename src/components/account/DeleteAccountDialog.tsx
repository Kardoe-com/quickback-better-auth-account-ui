/**
 * Delete Account Dialog Component
 * 
 * Confirmation dialog for account deletion.
 * 
 * Uses Better Auth's built-in delete-user endpoint for self-deletion.
 * This is a core Better Auth feature (not part of admin plugin).
 * 
 * @see https://www.better-auth.com/docs/api-reference/delete-user
 */

import { useState } from "react";
import authClient from "@/auth/authClient";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface DeleteAccountDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** User email for confirmation */
  userEmail: string;
  
  /** Callback when account is deleted (optional, uses default if not provided) */
  onDelete?: () => Promise<void>;
}

export function DeleteAccountDialog({
  isOpen,
  onClose,
  userEmail,
  onDelete,
}: DeleteAccountDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const expectedText = `delete ${userEmail}`;
  const isConfirmed = confirmationText === expectedText;

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (onDelete) {
        await onDelete();
      } else {
        // Use Better Auth's deleteUser method (passwordless - sends verification email)
        // This will send a verification email; user must click link to confirm deletion
        const { error: deleteError } = await authClient.deleteUser({
            callbackURL: "/account-deleted?deleted=true"
        });

        if (deleteError) {
            setError(deleteError.message || "Failed to initiate account deletion");
            setIsDeleting(false);
            return;
        }

        // Success - verification email sent
        setSuccessMessage(
            `A verification email has been sent to ${userEmail}. Please check your email and click the link to complete the account deletion. Your account will remain active until you confirm deletion via the email link.`
        );
        setIsDeleting(false);
      }
    } catch (err) {
      console.error("Error initiating account deletion:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationText("");
    setError("");
    setSuccessMessage("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="space-y-1 mb-2">
            <AlertDialogTitle className="text-red-600 text-lg font-semibold">Danger Zone</AlertDialogTitle>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>
          <AlertDialogTitle className="text-red-600 mt-4">Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold">This action cannot be undone!</p>
            <p>This will permanently delete your account and remove all of your data from our servers.</p>
            <p>To confirm deletion, please type exactly:</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-center select-all">
              {expectedText}
            </p>
          </AlertDialogDescription>
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
              className={confirmationText && !isConfirmed ? "border-red-500" : ""}
              autoFocus
            />
            {confirmationText && !isConfirmed && (
              <p className="text-sm text-red-500">Text doesn't match</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {successMessage && (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded whitespace-pre-line">{successMessage}</p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              {successMessage ? "Close" : "Cancel"}
            </Button>
            {!successMessage && (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!isConfirmed || isDeleting}
              >
                {isDeleting ? "Sending..." : "Delete My Account"}
              </Button>
            )}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
