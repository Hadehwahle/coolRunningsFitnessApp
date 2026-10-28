import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthLayout, FormError } from '@/components/AuthLayout';
import { apiService, errorMessage } from '@/services/api';
import { useSeo } from '@/hooks/useSeo';

const backLink = (
  <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary">
    <ArrowLeft className="w-4 h-4" /> Back to sign in
  </Link>
);

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [error, setError] = useState('');
  useSeo({ title: 'Reset your password', noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { setSentMessage(await apiService.forgotPassword(email)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };

  if (sentMessage) {
    return (
      <AuthLayout eyebrow="Link sent" title="Check your email" footer={backLink}
        intro={<>{sentMessage} The link expires in 1 hour. Don't see it? Check your spam folder.</>}>
        <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
          <MailCheck className="w-7 h-7" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Forgot password" title="Reset your password" footer={backLink}
      intro="Enter the email you signed up with and we'll send you a link to set a new password.">
      {error && <FormError>{error}</FormError>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="email" label="Email address" placeholder="you@example.com" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required autoFocus />
        <Button type="submit" className="w-full" size="lg" loading={loading}>Send reset link</Button>
      </form>
    </AuthLayout>
  );
}
