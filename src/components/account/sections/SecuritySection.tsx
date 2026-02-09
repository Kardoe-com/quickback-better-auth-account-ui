/**
 * Security Section Component
 * 
 * Displays security-related information and actions (passkeys, sessions, etc.)
 */

import { AccountSection } from "../AccountSection";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { Link } from "react-router-dom";
import { appConfig } from "@/config/app";

export interface SecuritySectionProps {
  /** Number of passkeys registered */
  passkeyCount?: number;
  
  /** Whether to show passkey management link */
  showPasskeyManagement?: boolean;
  
  /** Custom security items */
  children?: React.ReactNode;
}

export function SecuritySection({
  passkeyCount,
  showPasskeyManagement = true,
  children,
}: SecuritySectionProps) {
  return (
    <AccountSection
      title="Security"
      description="Manage your authentication methods and security settings"
    >
      <div className="space-y-4">
        {showPasskeyManagement && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Passkeys</p>
                <p className="text-sm text-muted-foreground">
                  {passkeyCount !== undefined 
                    ? `${passkeyCount} passkey${passkeyCount !== 1 ? 's' : ''} registered`
                    : 'Manage your passkeys'
                  }
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={appConfig.routes.authenticated.managePasskeys}>
                Manage
              </Link>
            </Button>
          </div>
        )}
        {children}
      </div>
    </AccountSection>
  );
}
