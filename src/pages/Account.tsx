import { Link } from 'react-router-dom';
import { User, LogOut, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const accountLinks = [
  { to: '/privacy-policy', label: 'Privacy policy' },
  { to: '/terms-of-service', label: 'Terms of service' },
  { to: '/affiliate-disclosure', label: 'Affiliate disclosure' },
  { to: '/account-deletion', label: 'Delete your account' },
];

export default function Account() {
  const { user, loading } = useAuth();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error('Unable to sign out. Please try again.');
    else toast.success('Signed out');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Your account</h1>
        <section className="mb-6 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm" aria-label="Sign-in details">
          <User className="mb-4 h-8 w-8 text-rose-500" aria-hidden="true" />
          {loading ? <p role="status">Loading your account…</p> : user ? (
            <>
              <p className="mb-4 break-all font-medium text-gray-800">{user.email}</p>
              <Button variant="outline" onClick={() => { void signOut(); }}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
            </>
          ) : (
            <>
              <p className="mb-4 text-gray-600">Sign in to save your matches and make the most of Make Me Up.</p>
              <Button asChild><Link to="/auth?returnTo=%2Faccount">Sign in or create an account</Link></Button>
            </>
          )}
        </section>
        <nav aria-label="Account information" className="divide-y divide-rose-100 overflow-hidden rounded-2xl border border-rose-100 bg-white">
          {accountLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="flex min-h-14 items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-rose-50">
              {label}<ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
