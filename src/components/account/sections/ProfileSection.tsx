/**
 * Profile Section Component
 * 
 * Displays and allows editing of user profile information
 */

import { AccountSection } from "../AccountSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ProfileSectionProps {
  /** User name */
  name?: string;
  
  /** User email */
  email?: string;
  
  /** User avatar image URL */
  image?: string;
  
  /** User role */
  role?: string;
  
  /** Whether to show edit functionality */
  editable?: boolean;
  
  /** Callback when edit is clicked */
  onEdit?: () => void;
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

export function ProfileSection({
  name,
  email,
  image,
  role,
  editable = false,
  onEdit,
}: ProfileSectionProps) {
  return (
    <AccountSection
      title="Profile Information"
      description="Your account details and information"
      action={editable && onEdit ? (
        <button
          onClick={onEdit}
          className="text-sm text-primary hover:underline"
        >
          Edit
        </button>
      ) : undefined}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={image || undefined} />
          <AvatarFallback className="text-lg font-medium bg-slate-700 text-white">
            {getUserInitials(name, email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{name || "User"}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{email || "No email provided"}</p>
        </div>
      </div>
    </AccountSection>
  );
}
