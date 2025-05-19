import React from 'react';
import { useAuth } from '@/lib/auth';
import { Mail } from 'lucide-react';

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  if (!user || user.email_confirmed_at) return null;

  const handleResend = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await resendVerificationEmail();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary/10 border-l-4 border-primary p-4">
      <div className="flex items-start space-x-3">
        <Mail className="w-5 h-5 text-primary mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-primary">
            Please verify your email address
          </p>
          <p className="text-sm text-muted-foreground">
            Check your inbox for a verification link. 
            {!success && !loading && (
              <>
                {' '}Didn't receive the email?{' '}
                <button
                  onClick={handleResend}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Resend verification email
                </button>
              </>
            )}
          </p>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-primary">
              Verification email sent! Please check your inbox.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}