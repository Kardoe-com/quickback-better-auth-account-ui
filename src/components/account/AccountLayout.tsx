/**
 * Account Layout Component
 * 
 * A reusable layout wrapper for account-related pages.
 * This component can be customized via props for different projects.
 */

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface AccountLayoutProps {
  /** Main content to display */
  children: ReactNode;
  
  /** Optional sidebar content */
  sidebar?: ReactNode;
  
  /** Optional header content */
  header?: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Maximum width of the content area */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  
  /** Layout variant */
  variant?: "default" | "centered" | "sidebar";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function AccountLayout({
  children,
  sidebar,
  header,
  className = "",
  maxWidth = "xl",
  variant = "default",
}: AccountLayoutProps) {
  const maxWidthClass = maxWidthClasses[maxWidth];

  if (variant === "centered") {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <div className={`w-full ${maxWidthClass}`}>
          {header && <div className="mb-6">{header}</div>}
          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (variant === "sidebar" && sidebar) {
    return (
      <div className={`min-h-screen ${className}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-[300px] order-2 lg:order-1">
              {sidebar}
            </aside>
            
            {/* Main Content */}
            <main className={`flex-1 order-1 lg:order-2 ${maxWidthClass}`}>
              {header && <div className="mb-6">{header}</div>}
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`min-h-screen ${className}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {header && <div className="mb-6">{header}</div>}
        <div className={maxWidthClass}>
          {children}
        </div>
      </div>
    </div>
  );
}
