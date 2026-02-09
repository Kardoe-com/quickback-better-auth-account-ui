import { appConfig } from '@/config/app';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright - Left side */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} {appConfig.companyName || appConfig.name}. All rights reserved.
          </div>

          {/* Links - Right side */}
          <div className="flex items-center gap-4 text-sm">
            {appConfig.urls.terms && (
              <a
                href={appConfig.urls.terms}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {appConfig.labels.terms}
              </a>
            )}
            {appConfig.urls.privacy && (
              <a
                href={appConfig.urls.privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {appConfig.labels.privacy}
              </a>
            )}
            {appConfig.urls.support && (
              <a
                href={appConfig.urls.support}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {appConfig.labels.support}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
