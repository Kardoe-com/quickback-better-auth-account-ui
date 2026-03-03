import { Link, Outlet } from 'react-router-dom';
import { appConfig } from '@/config/app';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Footer } from '@/components/layout/footer';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Simple header with just logo and theme toggle */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              {appConfig.branding.logoUrl ? (
                <>
                  <img src={appConfig.branding.logoUrl} alt={appConfig.name || 'Logo'} className="h-8 object-contain" />
                  <h1 className="sr-only">{appConfig.name || 'Account'}</h1>
                </>
              ) : (
                <h1 className="text-xl font-bold">{appConfig.name || 'Account'}</h1>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Centered content area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
