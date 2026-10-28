import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { apiService, errorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSeo } from '@/hooks/useSeo';
import { passwordProblem } from '@/utils';
import { AuthLayout, FormError } from '@/components/AuthLayout';

export function ResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { acceptSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useSeo({ title: 'Choose a new password', noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const session = await apiService.resetPassword(token, password);
      acceptSession(session);
      toast.success('Password updated. Welcome back!');
      navigate(session.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const expired = /invalid or has expired/i.test(error);

  return (
    <AuthLayout eyebrow="New password" title="Choose a new password"
      intro="Use at least 8 characters with an uppercase letter, a lowercase letter and a number.">
      {error && (
        <FormError>
          <p>{error}</p>
          {expired && <Link to="/forgot-password" className="underline font-semibold mt-1 inline-block">Send me a new link</Link>}
        </FormError>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />} autoComplete="new-password" required autoFocus />
        <Input type="password" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="w-4 h-4" />} autoComplete="new-password" required />
        {confirm && password === confirm && (
          <p className="text-xs text-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Set new password</Button>
      </form>
    </AuthLayout>
  );
}
