import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authClient from '@/auth/authClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2, Loader2, Check, X } from 'lucide-react';
import { appConfig } from '@/config/app';

export default function NewOrganizationPage() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (session === null) {
      navigate(appConfig.routes.public.home);
    }
  }, [session, navigate]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setSlug(generatedSlug);
    }
  }, [name, slugManuallyEdited]);

  // Check slug availability
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus('idle');
      return;
    }

    const checkSlug = async () => {
      setSlugStatus('checking');
      try {
        const result = await authClient.organization.checkSlug({ slug });
        // The API returns { status: boolean } where true means available
        setSlugStatus(result.data?.status === true ? 'available' : 'taken');
      } catch (err) {
        setSlugStatus('idle');
      }
    };

    const debounce = setTimeout(checkSlug, 500);
    return () => clearTimeout(debounce);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
        logo: logo.trim() || undefined,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create organization');
        setIsSubmitting(false);
        return;
      }

      // Redirect to the new organization
      navigate(`/organizations/${slug}`);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link to="/organizations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>Set up a new organization to collaborate with your team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input id="name" type="text" placeholder="Acme Corporation" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                <p className="text-xs text-muted-foreground">This is the display name for your organization</p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="relative">
                  <Input
                    id="slug"
                    type="text"
                    placeholder="acme-corp"
                    value={slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    required
                    maxLength={50}
                    className={`pr-10 ${slugStatus === 'available' ? 'border-green-500 focus-visible:ring-green-500' : slugStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {slugStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
                    {slugStatus === 'taken' && <X className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your organization URL: {appConfig.urls.base}/organizations/{slug || 'your-slug'}
                </p>
                {slugStatus === 'taken' && <p className="text-xs text-red-500">This slug is already taken. Please choose another.</p>}
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input id="logo" type="url" placeholder="https://example.com/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} />
                <p className="text-xs text-muted-foreground">Direct link to your organization's logo image</p>
              </div>

              {/* Error Message */}
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !name || !slug || slugStatus === 'taken'} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
