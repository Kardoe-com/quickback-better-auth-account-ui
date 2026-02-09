/**
 * Account Header Component
 * 
 * Displays user avatar, name, email, and role badge
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface AccountHeaderProps {
  /** User name */
  name?: string;
  
  /** User email */
  email?: string;
  
  /** User avatar image URL */
  image?: string;
  
  /** User role (e.g., 'admin') */
  role?: string;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Get user initials from name or email
 */
function getUserInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(' ');
    return parts.map(part => part[0]).join('').toUpperCase().slice(0, 2);
  }
  return email ? email[0].toUpperCase() : '?';
}

export function AccountHeader({
  name,
  email,
  image,
  role,
  className = "",
}: AccountHeaderProps) {
  return (
    <div className={`bg-background lg:border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <Avatar className="h-20 w-20">
            <AvatarImage src={image || undefined} />
            <AvatarFallback className="text-xl font-medium bg-slate-700 text-white">
              {getUserInitials(name, email)}
            </AvatarFallback>
          </Avatar>
          
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold break-words">
                {name || "User"}
              </h1>
              {role === 'admin' && (
                <Badge variant="default">
                  admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground truncate">
              {email || "No email provided"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
