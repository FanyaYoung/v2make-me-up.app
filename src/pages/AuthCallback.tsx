import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const oauthError = searchParams.get('error_description') || searchParams.get('error');
      if (oauthError) {
        navigate(`/auth?oauthError=${encodeURIComponent(oauthError)}`, { replace: true });
        return;
      }

      // Handle PKCE callback explicitly to avoid race conditions on getSession().
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          navigate(`/auth?oauthError=${encodeURIComponent(error.message)}`, { replace: true });
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const next = searchParams.get('next') ?? '/';
        navigate(next, { replace: true });
      } else {
        navigate('/auth?oauthError=Unable%20to%20complete%20sign%20in', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
