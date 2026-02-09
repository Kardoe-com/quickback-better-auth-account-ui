/**
 * Account Section Component
 * 
 * A reusable section component for account pages.
 * Provides consistent styling and structure.
 */

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface AccountSectionProps {
  /** Section title */
  title: string;
  
  /** Optional section description */
  description?: string;
  
  /** Section content */
  children: ReactNode;
  
  /** Optional action button/component */
  action?: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Whether to show card wrapper */
  card?: boolean;
}

export function AccountSection({
  title,
  description,
  children,
  action,
  className = "",
  card = true,
}: AccountSectionProps) {
  const content = (
    <>
      {(title || description || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </>
  );

  if (card) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <div className="absolute top-4 right-4">{action}</div>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}
