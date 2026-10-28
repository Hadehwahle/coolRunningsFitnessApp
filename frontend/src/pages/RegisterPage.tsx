import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AuthLayout, FormError } from '@/components/AuthLayout';
import { useSeo } from '@/hooks/useSeo';
import { passwordProblem } from '@/utils';
import { errorMessage } from '@/services/api';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, authLoading, navigate]);
  useSeo({ title: 'Create your free account', description: 'Join CoolRunningsFitness free: log your runs, track your progress and connect with runners.' });

  const checks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), label: 'Upper & lower case' },
    { ok: /\d/.test(password), label: 'A number' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created. Welcome to CoolRunnings!');
    } catch (err) {
      setError(errorMessage(err, 'Registration failed. Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      eyebrow="New runner"
      title="Create your free account"
      intro="No credit card. Start logging today."
      footer={<>Already a member? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link></>}
    >
      {error && <FormError>{error}</FormError>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="text" label="Full name" placeholder="Your name" autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)} icon={<User className="w-4 h-4" />} required />
        <Input type="email" label="Email address" placeholder="you@example.com" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} required />
        <div>
          <Input type="password" label="Password" placeholder="Create a password" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} required />
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label="Password requirements">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? 'text-success font-semibold flex items-center gap-1.5' : 'text-muted-foreground flex items-center gap-1.5'}>
                <span className={c.ok ? 'w-1.5 h-1.5 rounded-full bg-success' : 'w-1.5 h-1.5 rounded-full bg-border'} />
                {c.label}
              </li>
            ))}
          </ul>
        </div>
        <Input type="password" label="Confirm password" placeholder="Repeat your password" autoComplete="new-password"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} required />
        <p className="text-xs text-muted-foreground">
          By signing up you agree to our <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <Button type="submit" className="w-full" size="lg" loading={loading}>Create free account</Button>
      </form>
    </AuthLayout>
  );
}
