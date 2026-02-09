import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authClient from '@/auth/authClient';

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending) {
      if (session) {
        const isAnonymous = (session.user as any)?.isAnonymous === true;
        navigate(isAnonymous ? '/signup' : '/profile');
      } else {
        navigate('/login');
      }
    }
  }, [session, isPending, navigate]);

  // Show a loading state while checking session
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show a brief loading state during redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}
