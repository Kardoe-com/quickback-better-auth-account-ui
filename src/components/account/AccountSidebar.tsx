/**
 * Account Sidebar Component
 * 
 * Displays account information and action links
 */

import { ReactNode } from "react";
import { Clock, MapPin, Calendar, Fingerprint, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { appConfig } from "@/config/app";

export interface AccountSidebarProps {
  /** Session data with timezone, location, etc. */
  session?: any;
  
  /** User email for delete account action */
  userEmail?: string;
  
  /** Callback when delete account is clicked */
  onDeleteAccountClick?: () => void;
  
  /** Custom sidebar items */
  customItems?: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
}

export function AccountSidebar({
  session,
  userEmail,
  onDeleteAccountClick,
  customItems,
  className = "",
}: AccountSidebarProps) {
  const sessionData = (session as any)?.session;

  return (
    <div className={`w-full lg:w-[300px] space-y-8 ${className}`}>
      {/* User Metadata */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Account Information</h2>
        <div className="space-y-4">
          {sessionData?.timezone && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Timezone:</span>
              <span>{sessionData.timezone}</span>
            </div>
          )}
          {(sessionData?.city || sessionData?.country) && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span>
                {[sessionData?.city, sessionData?.region, sessionData?.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
          {session?.user?.createdAt && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Member since:</span>
              <span>
                {new Date(session.user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Actions</h2>
        <div className="space-y-2">
          <Link
            to={appConfig.routes.authenticated.managePasskeys}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Fingerprint className="h-4 w-4" />
            <span>Manage Passkeys</span>
          </Link>
          {userEmail && onDeleteAccountClick && (
            <button
              onClick={onDeleteAccountClick}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          )}
          {customItems}
        </div>
      </div>
    </div>
  );
}
