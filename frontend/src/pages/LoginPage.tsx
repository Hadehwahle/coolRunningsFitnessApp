import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthLayout, FormError } from '@/components/AuthLayout';
import { useSeo } from '@/hooks/useSeo';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, authLoading, navigate]);
  useSeo({ title: 'Sign in', description: 'Sign in to CoolRunningsFitness to log runs and join the community.', noindex: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password, rememberMe); }
    catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 401 ? 'Incorrect email or password.'
        : status === 429 ? 'Too many attempts. Please wait a few minutes and try again.'
        : err?.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your account"
      intro="Pick up where you left off."
      footer={<>New here? <Link to="/register" className="text-primary font-semibold hover:underline">Create a free account</Link></>}
    >
      {error && <FormError>{error}</FormError>}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        <Input type="email" label="Email address" placeholder="you@example.com" autoComplete="email"
          value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
          icon={<Mail className="w-4 h-4" />} required />
        <Input type="password" label="Password" placeholder="Your password" autoComplete="current-password"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
          icon={<Lock className="w-4 h-4" />} required />
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm min-h-[44px]">
            <input type="checkbox" className="w-4 h-4 accent-[rgb(var(--primary))]" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline py-2">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in</Button>
      </form>
    </AuthLayout>
  );
}
