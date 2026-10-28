import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Activity, Plus, X, Trash2, ChevronDown, Pencil, Search } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, getWeatherIcon, calculatePace, calculateCalories, formatRelativeTime, toLocalInputValue } from '@/utils';
import { useSeo } from '@/hooks/useSeo';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import type { Run } from '@/types';

// Empty or invalid number fields count as 0 (they used to become NaN and slip past the check)
const num = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const durationOf = (f: { hours: string; minutes: string; seconds: string }) =>
  num(f.hours) * 3600 + num(f.minutes) * 60 + num(f.seconds);

// ── Log / Edit Run Modal ───────────────────────────────────────────────────
function NewRunModal({ onClose, onSaved, run }: { onClose: () => void; onSaved: () => void; run?: Run | null }) {
  const editing = Boolean(run);
  const [form, setForm] = useState(() => run ? {
    distanceKm: String(run.distance),
    hours: String(Math.floor(run.duration / 3600)),
    minutes: String(Math.floor((run.duration % 3600) / 60)),
    seconds: String(run.duration % 60),
    weather: run.weather || '', notes: run.notes || '', rating: String(run.rating || ''),
    date: toLocalInputValue(run.startTime || run.createdAt),
  } : {
    distanceKm: '',
    hours: '0', minutes: '30', seconds: '0',
    // Local time (toISOString() gave UTC, which showed the wrong hour/day outside UTC)
    weather: '', notes: '', rating: '4', date: toLocalInputValue(new Date()),
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const dist = parseFloat(form.distanceKm);
    if (!Number.isFinite(dist) || dist <= 0) { toast.error('Enter a valid distance'); return; }
    if (dist > 500) { toast.error('Distance cannot be more than 500 km'); return; }
    const duration = durationOf(form);
    if (duration <= 0) { toast.error('Enter how long the run took'); return; }
    const startTime = new Date(form.date);
    if (Number.isNaN(startTime.getTime())) { toast.error('Enter a valid date and time'); return; }
    if (startTime.getTime() > Date.now() + 60_000) { toast.error("The run can't be in the future"); return; }

    setSaving(true);
    try {
      const payload = {
        distance: dist,
        duration,
        calories: calculateCalories(dist),
        weather: (form.weather || '') as Run['weather'],
        notes: form.notes,
        rating: form.rating ? parseInt(form.rating, 10) : undefined,
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + duration * 1000).toISOString(),
      };
      if (run) await apiService.updateRun(run._id, payload);
      else await apiService.createRun(payload);
      toast.success(editing ? 'Run updated!' : 'Run saved!');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save run');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div role="dialog" aria-modal="true" aria-label={editing ? 'Edit run' : 'Log a run'} className="bg-surface border border-border w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl shadow-lift animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-display font-bold">{editing ? 'Edit Run' : 'Log New Run'}</h2>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-surface2 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Distance */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Distance (km) *</label>
            <input className="input" type="number" step="0.01" min="0.1" placeholder="5.00" value={form.distanceKm} onChange={(e) => set('distanceKm', e.target.value)} />
          </div>
          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Duration *</label>
            <div className="grid grid-cols-3 gap-2">
              {[['hours', 'h'], ['minutes', 'min'], ['seconds', 'sec']].map(([k, label]) => (
                <div key={k}>
                  <input className="input text-center" type="number" min="0" max={k === 'hours' ? '99' : '59'} placeholder="0" value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} />
                  <p className="text-xs text-center text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Date & Time</label>
            <input className="input" type="datetime-local" value={form.date} max={toLocalInputValue(new Date())} onChange={(e) => set('date', e.target.value)} />
          </div>
          {/* Weather */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Weather</label>
            <div className="relative">
              <select className="input appearance-none pr-9" value={form.weather} onChange={(e) => set('weather', e.target.value)}>
                <option value="">Select weather</option>
                {['sunny','cloudy','rainy','hot','cold','windy'].map((w) => (
                  <option key={w} value={w}>{getWeatherIcon(w)} {w.charAt(0).toUpperCase() + w.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => set('rating', String(n))}
                  className={`text-2xl transition-transform hover:scale-110 ${parseInt(form.rating) >= n ? 'text-warning' : 'text-surface3'}`}>
                  ★
                </button>
              ))}
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="How did it feel?" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {/* Pace preview */}
          {form.distanceKm && (parseFloat(form.distanceKm) > 0) && (
            (() => {
              const dur = durationOf(form);
              const p = calculatePace(parseFloat(form.distanceKm), dur);
              return dur > 0 ? (
                <div className="px-4 py-3 bg-surface2 rounded-xl text-sm text-center">
                  Pace: <strong>{formatPace(p)}</strong> · Calories: ~<strong>{calculateCalories(parseFloat(form.distanceKm))}</strong>
                </div>
              ) : null;
            })()
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <Button onClick={handleSave} loading={saving} className="flex-1">{editing ? 'Save Changes' : 'Save Run'}</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── All Runs Modal ─────────────────────────────────────────────────────────
function AllRunsModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [search, setSearch] = useState('');

  const fetchRuns = async (p = 1, q = search) => {
    setLoading(true);
    try {
      const res = await apiService.getRuns(p, 10, q.trim() ? { q: q.trim() } : undefined);
      setRuns(res.items || []);
      setTotalPages(res.pages || 1);
      setPage(p);
    } catch { toast.error('Failed to load runs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRuns(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchRuns(1, search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this run?')) return;
    setDeleting(id);
    try {
      await apiService.deleteRun(id);
      toast.success('Run deleted');
      fetchRuns(page);
      onChanged();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      {editingRun && (
        <NewRunModal run={editingRun} onClose={() => setEditingRun(null)} onSaved={() => { fetchRuns(page); onChanged(); }} />
      )}
      <div role="dialog" aria-modal="true" aria-label="All runs" className="bg-surface border border-border w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl overflow-hidden shadow-lift animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-display font-bold">All Runs</h2>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-surface2 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input pl-9" placeholder="Search your run notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-border mx-auto mb-3" />
              <p className="text-muted-foreground">{search ? 'No runs match your search.' : 'No runs logged yet. Go for a run!'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run._id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-background border border-border transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span>{formatDistance(run.distance)}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{formatDuration(run.duration)}</span>
                        {run.weather && <span>{getWeatherIcon(run.weather)}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="info" className="text-xs">{formatPace(run.pace)}</Badge>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(run.startTime || run.createdAt)}</span>
                      </div>
                      {run.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{run.notes}"</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < (run.rating || 0) ? 'text-warning' : 'text-surface3'}`}>★</span>
                      ))}
                    </div>
                    <button onClick={() => setEditingRun(run)} aria-label="Edit run"
                      className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(run._id)} disabled={deleting === run._id} aria-label="Delete run"
                      className="p-1.5 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors disabled:opacity-40">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-border flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={() => fetchRuns(page - 1)} disabled={page === 1}>Prev</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => fetchRuns(page + 1)} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard helpers ────────────────────────────────────────────────────────
const DAY = 86400000;

/** Monday 00:00 of the week containing `d` */
function weekStart(d: Date | string) {
  const x = new Date(d);
  const offset = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  return new Date(x.getTime() - offset * DAY);
}

function sumRuns(runs: Run[]) {
  const distance = runs.reduce((s, r) => s + r.distance, 0);
  const duration = runs.reduce((s, r) => s + r.duration, 0);
  return { count: runs.length, distance, duration, pace: distance > 0 ? duration / 60 / distance : 0 };
}

const shortDate = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

function GoalRing({ value, goal }: { value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const c = 2 * Math.PI * 50;
  return (
    <svg viewBox="0 0 120 120" className="w-40 h-40" role="img" aria-label={`${value.toFixed(1)} of ${goal} kilometres, ${Math.round(pct * 100)} percent`}>
      <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(var(--surface3))" strokeWidth="12" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(var(--primary))" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray .8s cubic-bezier(.22,1,.36,1)' }} />
      <text x="60" y="58" textAnchor="middle" fontWeight="800" fontSize="24" fill="rgb(var(--foreground))" style={{ fontStretch: '115%' }}>{Math.round(pct * 100)}%</text>
      <text x="60" y="76" textAnchor="middle" fontSize="10" fill="rgb(var(--muted))">{value.toFixed(1)} / {goal} km</text>
    </svg>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, setCurrentUser } = useAuth();
  useSeo({ title: 'Your dashboard', noindex: true });
  const [showNewRun, setShowNewRun] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [allTime, setAllTime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const goal = user?.preferences?.weeklyGoalKm ?? 20;
  const [goalDraft, setGoalDraft] = useState(String(goal));

  const fetchData = async () => {
    try {
      const [res, stats] = await Promise.all([apiService.getRuns(1, 100), apiService.getRunStats()]);
      setRuns(res.items || []);
      setAllTime(stats);
    } catch {
      toast.error('Could not load your runs');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = Number(goalDraft);
    if (!Number.isFinite(g) || g < 1 || g > 500) { toast.error('Enter a goal between 1 and 500 km'); return; }
    try {
      const fresh = await apiService.updateProfile({ preferences: { weeklyGoalKm: g } } as any);
      setCurrentUser(fresh);
      setEditingGoal(false);
      toast.success('Weekly goal updated');
    } catch { toast.error('Could not save your goal'); }
  };

  // ── Derived numbers ──
  const thisWeek = weekStart(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => new Date(thisWeek.getTime() - (7 - i) * 7 * DAY));
  const weekly = weeks.map((start) => {
    const end = start.getTime() + 7 * DAY;
    return sumRuns(runs.filter((r) => { const t = new Date(r.startTime || r.createdAt).getTime(); return t >= start.getTime() && t < end; }));
  });
  const now = weekly[7];
  const last = weekly[6];
  const maxKm = Math.max(goal, ...weekly.map((w) => w.distance), 1);
  const deltaKm = now.distance - last.distance;
  const paceDelta = allTime?.averagePace && now.pace ? Math.round((allTime.averagePace - now.pace) * 60) : null;

  // Streak: consecutive weeks with at least one run (this week counts once it has a run)
  let streak = 0;
  for (let i = now.count > 0 ? 7 : 6; i >= 0 && weekly[i].count > 0; i--) streak++;

  const bestPace = (minKm: number) => {
    const eligible = runs.filter((r) => r.distance >= minKm);
    return eligible.length ? Math.min(...eligible.map((r) => r.pace)) : null;
  };
  const best5 = bestPace(5);
  const best10 = bestPace(10);
  const biggestWeek = Math.max(...weekly.map((w) => w.distance));
  const recent = runs.slice(0, 6);
  const firstName = user?.name?.split(' ')[0];

  const kpis = [
    { label: 'Distance', value: now.distance.toFixed(1), unit: 'km', note: deltaKm === 0 ? 'Same as last week' : `${deltaKm > 0 ? '▲' : '▼'} ${Math.abs(deltaKm).toFixed(1)} km vs last week`, good: deltaKm > 0 },
    { label: 'Runs', value: String(now.count), unit: '', note: `${last.count} last week`, good: false },
    { label: 'Time', value: formatDuration(Math.round(now.duration)), unit: '', note: 'h : min : sec', good: false },
    { label: 'Avg pace', value: now.pace ? formatPace(now.pace).replace(' /km', '') : '—', unit: now.pace ? '/km' : '', note: paceDelta === null ? 'Log a run to see it' : paceDelta === 0 ? 'Same as your average' : `${paceDelta > 0 ? '▲' : '▼'} ${Math.abs(paceDelta)} s ${paceDelta > 0 ? 'faster' : 'slower'} than usual`, good: (paceDelta ?? 0) > 0 },
  ];

  return (
    <div className="max-w-[1180px] mx-auto">
      {(showNewRun || editingRun) && (
        <NewRunModal run={editingRun} onClose={() => { setShowNewRun(false); setEditingRun(null); }} onSaved={fetchData} />
      )}
      {showAllRuns && <AllRunsModal onClose={() => setShowAllRuns(false)} onChanged={fetchData} />}

      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[2rem] sm:text-[2.6rem]">{greeting()}, {firstName}</h1>
          <p className="text-muted-foreground mt-1.5">
            {thisWeek.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} – {new Date(thisWeek.getTime() + 6 * DAY).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <Button onClick={() => setShowNewRun(true)} className="w-full sm:w-auto"><Plus className="w-4 h-4" /> Log a run</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-[18px] bg-surface2 animate-pulse" />)}</div>
      ) : runs.length === 0 ? (
        /* First-run state */
        <div className="card p-8 md:p-12 text-center max-w-2xl mx-auto">
          <span className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto"><Activity className="w-7 h-7" /></span>
          <h2 className="text-3xl mt-5">Log your first run</h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">Add a run you've already done (distance and time are all you need) and your weekly chart, pace and personal bests start filling in.</p>
          <Button onClick={() => setShowNewRun(true)} className="mt-7"><Plus className="w-4 h-4" /> Log a run</Button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="card p-4 sm:p-5">
                <p className="text-sm text-muted-foreground">{k.label} <span className="sr-only">this week</span></p>
                <p className="stat-num text-[1.75rem] sm:text-[2.25rem] mt-1.5">{k.value} {k.unit && <span className="text-sm sm:text-base font-medium text-muted-foreground">{k.unit}</span>}</p>
                <p className={`text-xs sm:text-sm mt-2 ${k.good ? 'text-success font-semibold' : 'text-muted-foreground'}`}>{k.note}</p>
              </div>
            ))}
          </div>

          {/* Chart + goal */}
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
            <section className="card" aria-labelledby="weekly-title">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="weekly-title" className="text-lg" style={{ fontStretch: '105%' }}>Weekly distance · last 8 weeks</h2>
                <p className="text-sm text-muted-foreground">Avg {(weekly.reduce((s, w) => s + w.distance, 0) / 8).toFixed(1)} km</p>
              </div>
              <div className="relative mt-6 h-52 grid grid-cols-8 gap-2 sm:gap-4 items-end border-b border-border"
                role="img" aria-label={`Weekly kilometres for the last 8 weeks: ${weekly.map((w) => w.distance.toFixed(1)).join(', ')}. Goal ${goal} km.`}>
                <div className="absolute inset-x-0 z-10 border-t-[1.5px] border-dashed border-foreground/40 pointer-events-none" style={{ bottom: `${(goal / maxKm) * 100}%` }} aria-hidden="true">
                  <span className="absolute left-0 -top-[11px] text-[11px] font-semibold text-foreground/80 bg-surface pr-1.5 leading-[20px]">Goal {goal} km</span>
                </div>
                {weekly.map((w, i) => (
                  <div key={i} className="relative h-full flex flex-col justify-end items-center group">
                    <span className="text-[11px] sm:text-xs text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{w.distance.toFixed(1)}</span>
                    <div className={`w-full rounded-t-md transition-all duration-700 ${i === 7 ? 'bg-primary' : 'bg-surface3 group-hover:bg-muted-foreground/40'}`}
                      style={{ height: `${Math.max((w.distance / maxKm) * 100, w.distance ? 2 : 0.5)}%` }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-2 sm:gap-4 mt-2 text-center text-[11px] sm:text-xs text-muted-foreground">
                {weeks.map((w, i) => (
                  <span key={i} className={i === 7 ? 'text-foreground font-bold' : ''}>
                    {i === 7 ? 'Now' : w.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                ))}
              </div>
            </section>

            <section className="card flex flex-col items-center text-center" aria-labelledby="goal-title">
              <div className="w-full flex items-center justify-between">
                <h2 id="goal-title" className="text-lg" style={{ fontStretch: '105%' }}>Weekly goal</h2>
                {!editingGoal && (
                  <button type="button" onClick={() => { setGoalDraft(String(goal)); setEditingGoal(true); }}
                    className="text-sm font-semibold text-primary hover:underline px-2 py-1">Edit</button>
                )}
              </div>
              {editingGoal ? (
                <form onSubmit={saveGoal} className="w-full mt-6 space-y-3 text-left">
                  <label htmlFor="goal-input" className="text-sm font-semibold">Kilometres per week</label>
                  <input id="goal-input" type="number" min={1} max={500} step={0.5} value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} className="input" autoFocus />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1">Save</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setEditingGoal(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="my-4"><GoalRing value={now.distance} goal={goal} /></div>
                  <p className="text-[15px] text-foreground/80">
                    {now.distance >= goal ? 'Goal reached. Nice work!' : `${(goal - now.distance).toFixed(1)} km to go by Sunday`}
                  </p>
                </>
              )}
            </section>
          </div>

          {/* Recent runs + bests */}
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
            <section className="card" aria-labelledby="recent-title">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 id="recent-title" className="text-lg" style={{ fontStretch: '105%' }}>Recent runs</h2>
                <button type="button" onClick={() => setShowAllRuns(true)} className="text-sm font-semibold text-primary hover:underline px-2 py-1">All runs & search</button>
              </div>
              {/* Phones: stacked list */}
              <ul className="sm:hidden">
                {recent.map((r) => (
                  <li key={r._id} className="flex items-center gap-3 py-3.5 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{r.distance.toFixed(2)} km <span className="font-normal text-muted-foreground">· {formatDuration(r.duration)}</span></p>
                      <p className="text-sm text-muted-foreground truncate">{shortDate(r.startTime || r.createdAt)} · {formatPace(r.pace)}</p>
                    </div>
                    <button type="button" onClick={() => setEditingRun(r)} aria-label={`Edit run on ${shortDate(r.startTime || r.createdAt)}`}
                      className="w-11 h-11 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface2 shrink-0">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="font-semibold py-2.5">Date</th>
                      <th className="font-semibold py-2.5 text-right">Distance</th>
                      <th className="font-semibold py-2.5 text-right">Time</th>
                      <th className="font-semibold py-2.5 text-right">Pace</th>
                      <th className="py-2.5"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r._id} className="border-b border-border last:border-0">
                        <td className="py-3.5">
                          <span className="font-medium">{shortDate(r.startTime || r.createdAt)}</span>
                          {r.notes && <span className="block text-xs text-muted-foreground truncate max-w-[220px]">{r.notes}</span>}
                        </td>
                        <td className="py-3.5 text-right font-bold">{r.distance.toFixed(2)} km</td>
                        <td className="py-3.5 text-right">{formatDuration(r.duration)}</td>
                        <td className="py-3.5 text-right">{formatPace(r.pace).replace(' /km', '')}</td>
                        <td className="py-3.5 text-right">
                          <button type="button" onClick={() => setEditingRun(r)} aria-label={`Edit run on ${shortDate(r.startTime || r.createdAt)}`}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface2">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card" aria-labelledby="bests-title">
              <h2 id="bests-title" className="text-lg mb-4" style={{ fontStretch: '105%' }}>Personal bests</h2>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-primary-soft p-3.5">
                  <p className="text-xs text-primary font-semibold">Longest run</p>
                  <p className="stat-num text-xl mt-1.5 text-primary">{(allTime?.longestRun ?? 0).toFixed(2)} km</p>
                </div>
                <div className="rounded-2xl bg-surface2 p-3.5">
                  <p className="text-xs text-muted-foreground">Best pace · 5K+</p>
                  <p className="stat-num text-xl mt-1.5">{best5 ? formatPace(best5) : '—'}</p>
                </div>
                <div className="rounded-2xl bg-surface2 p-3.5">
                  <p className="text-xs text-muted-foreground">Best pace · 10K+</p>
                  <p className="stat-num text-xl mt-1.5">{best10 ? formatPace(best10) : '—'}</p>
                </div>
                <div className="rounded-2xl bg-surface2 p-3.5">
                  <p className="text-xs text-muted-foreground">Biggest week</p>
                  <p className="stat-num text-xl mt-1.5">{biggestWeek.toFixed(1)} km</p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-ink text-[rgb(var(--ink-foreground))] flex items-center justify-center stat-num text-xl">{streak}</span>
                <div>
                  <p className="font-semibold">{streak === 1 ? '1-week streak' : `${streak}-week streak`}</p>
                  <p className="text-sm text-muted-foreground">{now.count > 0 ? 'Weeks in a row with at least one run' : 'Run this week to keep it going'}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">All time: {allTime?.totalRuns ?? 0} runs · {formatDistance(allTime?.totalDistance ?? 0)}</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
