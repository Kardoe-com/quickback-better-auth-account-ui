/**
 * Danger Zone Section Component
 * 
 * Displays dangerous actions like account deletion
 */

import { AccountSection } from "../AccountSection";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

export interface DangerZoneSectionProps {
  /** User email for delete confirmation */
  userEmail?: string;
  
  /** Callback when delete account is clicked */
  onDeleteAccountClick?: () => void;
  
  /** Whether account deletion is enabled */
  enabled?: boolean;
  
  /** Custom danger zone items */
  children?: React.ReactNode;
}

export function DangerZoneSection({
  userEmail,
  onDeleteAccountClick,
  enabled = true,
  children,
}: DangerZoneSectionProps) {
  if (!enabled) {
    return null;
  }

  return (
    <AccountSection
      title="Danger Zone"
      description="Irreversible and destructive actions"
      className="border-red-200 dark:border-red-900"
    >
      <div className="space-y-4">
        {userEmail && onDeleteAccountClick && (
          <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Delete Account
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteAccountClick}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </AccountSection>
  );
}
