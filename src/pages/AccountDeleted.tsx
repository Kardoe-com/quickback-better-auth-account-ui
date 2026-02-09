import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Info } from 'lucide-react';

export default function AccountDeletedPage() {
  const [searchParams] = useSearchParams();
  const isFromDeletion = searchParams.get('deleted') === 'true';

  // If accessed directly without deletion confirmation, show generic message
  if (!isFromDeletion) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Info className="h-16 w-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl">Account Deletion</CardTitle>
          <CardDescription className="mt-2">Information about account deletion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>If you've recently deleted your account, your account and all associated data have been permanently removed from our system.</p>
            <p>If you're looking to delete your account, please sign in and visit your profile settings.</p>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/signup">Create New Account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show confirmation message when accessed via deletion flow
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Account Deleted</CardTitle>
        <CardDescription className="mt-2">Your account has been permanently deleted</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Your account and all associated data have been permanently removed from our system.</p>
          <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <Button asChild className="w-full">
            <Link to="/signup">Create New Account</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
