import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MailCheck } from 'lucide-react';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the token from the URL
        const token = new URLSearchParams(location.search).get('token');
        const type = new URLSearchParams(location.search).get('type');

        if (!token || type !== 'email_verification') {
          throw new Error('Invalid verification link');
        }

        // Verify the email
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (error) throw error;
        setVerificationStatus('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setVerificationStatus('error');
      }
    };

    handleEmailVerification();
  }, [location.search]);

  return (
    <div className="container max-w-[400px] mx-auto px-4 py-8">
      <div className="flex flex-col items-center space-y-6 text-center">
        {verificationStatus === 'loading' && (
          <div className="animate-pulse">
            <p>Verifying your email...</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MailCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">Email verified!</h1>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
            <button
              onClick={() => navigate('/signin')}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Sign in
            </button>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-destructive">Verification failed</h1>
            <p className="text-sm text-muted-foreground">
              {error || 'Unable to verify your email. Please try again or contact support.'}
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="text-sm text-primary hover:underline"
            >
              Back to Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}