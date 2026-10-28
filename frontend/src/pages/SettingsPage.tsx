import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { User, Lock, Bell, Shield, CheckCircle, AlertCircle, LogOut, Palette } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { passwordProblem } from '@/utils';
import { ThemeSegmented } from '@/components/Brand';

type Tab = 'profile' | 'security' | 'notifications' | 'appearance' | 'account';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  useSeo({ title: 'Account settings', noindex: true });

  if (!user) return null;

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Lock },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'appearance' as Tab, label: 'Appearance', icon: Palette },
    { id: 'account' as Tab, label: 'Account', icon: Shield },
  ];

  return (
    <div className="max-w-3xl py-8 md:py-10">
        <div className="mb-8">
          <p className="section-tag">Your account</p>
          <h1 className="mt-2 text-[2.25rem] md:text-[2.75rem] leading-none">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile, security and preferences.</p>
        </div>

        <div role="tablist" aria-label="Settings sections" className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === id ? 'bg-ink text-[rgb(var(--ink-foreground))] border-transparent' : 'bg-surface border-border text-foreground/75 hover:bg-surface2'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && <ProfileTab user={user} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'account' && <AccountTab user={user} logout={logout} navigate={navigate} />}
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({ user }: { user: any }) {
  const { setCurrentUser } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }
    setSaving(true);
    try {
      const fresh = await apiService.updateProfile({ name: name.trim(), bio: bio.trim() });
      setCurrentUser(fresh); // header and menus update straight away
      toast.success('Profile updated!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 animate-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="w-4 h-4 text-primary" /> Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={50} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Bio <span className="text-xs font-normal text-muted-foreground">({bio.length}/500)</span>
            </label>
            <textarea className="input resize-none" rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other runners a bit about yourself" maxLength={500} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Email <span className="text-xs font-normal text-muted-foreground">(cannot be changed)</span>
            </label>
            <div className="input bg-surface text-muted-foreground cursor-not-allowed select-none">{user.email}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Role</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-info/10 text-info border border-info/20'}`}>
              {user.role === 'admin' ? '⚡ Administrator' : '🏃 Runner'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Member Since</label>
            <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Button onClick={handleSave} loading={saving} className="gap-2">
            <CheckCircle className="w-4 h-4" /> Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async () => {
    setError('');
    if (!currentPassword) { setError('Enter your current password'); return; }
    const ruleError = passwordProblem(newPassword);
    if (ruleError) { setError(ruleError); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    if (newPassword === currentPassword) { setError('New password must be different'); return; }
    setSaving(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed. Other devices have been signed out.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 animate-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lock className="w-4 h-4 text-primary" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Current Password</label>
            <input type="password" className="input" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }} placeholder="Enter current password" autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">New Password</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }} placeholder="8+ characters, upper & lower case, a number" autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm New Password</label>
            <input type="password" className="input" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} placeholder="Repeat new password" autoComplete="new-password" />
            {confirmPassword && newPassword && (
              <p className={`text-xs mt-1.5 flex items-center gap-1 ${newPassword === confirmPassword ? 'text-success' : 'text-danger'}`}>
                {newPassword === confirmPassword
                  ? <><CheckCircle className="w-3 h-3" /> Passwords match</>
                  : <><AlertCircle className="w-3 h-3" /> Passwords do not match</>}
              </p>
            )}
          </div>
          <Button onClick={handleChange} loading={saving} disabled={!currentPassword || !newPassword || !confirmPassword} className="gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────
// Saved to the account (they were previously kept only in page state and lost on reload)
function NotificationsTab() {
  const { user, setCurrentUser } = useAuth();
  const current = user?.preferences?.notifications || {};
  const [prefs, setPrefs] = useState({
    newBlogPost: current.newBlogPost !== false,
    threadReplies: current.threadReplies !== false,
    threadLikes: current.threadLikes !== false,
  });

  const toggle = async (k: keyof typeof prefs) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    try {
      const fresh = await apiService.updateProfile({ preferences: { notifications: { [k]: next[k] } } } as any);
      setCurrentUser(fresh);
      toast.success('Preference saved');
    } catch {
      setPrefs(prefs); // revert
      toast.error('Could not save. Please try again.');
    }
  };

  return (
    <div className="space-y-4 animate-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="w-4 h-4 text-primary" /> Notification Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose what you get notified about in the bell icon.</p>
          {[
            { key: 'newBlogPost' as const, label: 'New Blog Posts', desc: 'Get notified when a new article is published' },
            { key: 'threadReplies' as const, label: 'Replies to My Discussions', desc: 'When someone replies to a thread you started' },
            { key: 'threadLikes' as const, label: 'Likes on My Discussions', desc: 'When someone likes a thread you started' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                aria-label={label}
                onClick={() => toggle(key)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${prefs[key] ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            Saved to your account and applied on every device.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Account Tab ────────────────────────────────────────────────────────────
function AccountTab({ user, logout, navigate }: { user: any; logout: () => Promise<void>; navigate: (p: string) => void }) {
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') { setDeleteError('Type DELETE to confirm'); return; }
    if (!deletePassword) { setDeleteError('Enter your password to confirm'); return; }
    setDeleting(true);
    try {
      await apiService.deleteAccount(deletePassword);
      await logout();
      toast.success('Account deleted. We\'re sorry to see you go.');
      navigate('/');
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message || 'Failed to delete account');
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Session */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><LogOut className="w-4 h-4 text-primary" /> Session</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Signed in as <strong>{user.email}</strong></p>
          <Button variant="secondary" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      {user.role !== 'admin' && (
        <Card className="border-danger/20">
          <CardHeader><CardTitle className="text-base text-danger flex items-center gap-2"><Shield className="w-4 h-4" /> Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data (runs, forum posts, etc.). This action cannot be undone.
            </p>
            {!showDelete ? (
              <Button variant="danger" onClick={() => setShowDelete(true)} size="sm">Delete My Account</Button>
            ) : (
              <div className="space-y-3 p-4 bg-danger/5 border border-danger/20">
                <p className="text-sm font-semibold text-danger">This will permanently delete your account.</p>
                {deleteError && (
                  <div className="flex items-center gap-2 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {deleteError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Type DELETE to confirm</label>
                  <input
                    className="input text-sm"
                    placeholder="DELETE"
                    value={confirmText}
                    onChange={(e) => { setConfirmText(e.target.value); setDeleteError(''); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Your password</label>
                  <input
                    type="password"
                    className="input text-sm"
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={handleDeleteAccount} loading={deleting} size="sm" disabled={confirmText !== 'DELETE' || !deletePassword}>
                    Permanently Delete
                  </Button>
                  <Button variant="secondary" onClick={() => { setShowDelete(false); setDeleteError(''); setConfirmText(''); setDeletePassword(''); }} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Appearance Tab ─────────────────────────────────────────────────────────
function AppearanceTab() {
  return (
    <div className="card">
      <h2 className="text-xl">Theme</h2>
      <p className="text-muted-foreground mt-1 mb-5">Choose light or dark, or follow your device setting. Saved on this device.</p>
      <ThemeSegmented />
    </div>
  );
}
