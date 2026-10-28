import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Users, TrendingUp, BookOpen } from 'lucide-react';
import { FAQSection } from '@/components/FAQSection';
import { PageHero } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { useSeo } from '@/hooks/useSeo';

const VALUES = [
  { icon: Target, title: 'Run smarter', body: 'Every feature exists to help you train with purpose, not just pile up kilometres.' },
  { icon: Users, title: 'Community first', body: 'Runners motivate each other, share what worked and celebrate every finish line.' },
  { icon: TrendingUp, title: 'Progress you can see', body: 'Weekly goals, trends and personal bests make steady improvement visible.' },
  { icon: BookOpen, title: 'Honest advice', body: 'Training notes written for real runners: clear, practical and free of hype.' },
];

const OFFER = [
  ['Run log', 'Distance, time, pace and notes for every run, with edits any time.'],
  ['Weekly goal', 'Set a target and watch the ring fill as the week goes on.'],
  ['Personal bests', 'Longest run, best pace and biggest week, worked out for you.'],
  ['Community forum', 'Ask questions, share race reports and help newer runners.'],
  ['Training notes', 'Articles on plans, nutrition, injury prevention and gear.'],
  ['Light & dark', 'Easy on the eyes on an early morning or a late night.'],
];

export function AboutPage() {
  useSeo({ title: 'About CoolRunningsFitness', description: 'CoolRunningsFitness is a running community and run tracker built to help runners of every level train smarter, stay motivated and run together.' });
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalUsers: number; totalRuns: number; totalThreads: number; totalBlogPosts: number } | null>(null);
  useEffect(() => { apiService.getPublicStats().then(setStats).catch(() => {}); }, []);

  return (
    <div>
      <PageHero
        eyebrow="Our story"
        title={<>Built by runners, <span className="text-primary">for runners.</span></>}
        intro="We want running to feel accessible, social and rewarding, whether you're lacing up for the first time or chasing a new personal best."
      >
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to dashboard <ArrowRight className="w-4 h-4" /></Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Join free</Link>
              <Link to="/community" className="btn btn-secondary">Explore the community</Link>
            </>
          )}
        </div>
      </PageHero>

      {stats && (
        <section className="border-b border-border">
          <dl className="container-custom grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              ['Runners', stats.totalUsers], ['Runs logged', stats.totalRuns],
              ['Discussions', stats.totalThreads], ['Articles', stats.totalBlogPosts],
            ].map(([label, value], i) => (
              <div key={label as string} className={`py-8 px-4 md:px-8 ${i % 2 === 0 ? 'pl-0 md:pl-8' : ''} ${i === 0 ? 'md:pl-0' : ''} ${i > 1 ? 'border-t md:border-t-0 border-border' : ''}`}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="stat-num text-4xl mt-1">{Number(value).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Story */}
      <section className="container-custom py-16 md:py-24 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-20">
        <div>
          <p className="section-tag">Why we started</p>
          <h2 className="mt-3 text-4xl md:text-5xl leading-[1.02]">More than a tracking app.</h2>
        </div>
        <div className="space-y-5 text-lg text-foreground/80 leading-relaxed">
          <p>CoolRunningsFitness grew from a simple idea: running should be fun, social and rewarding. Plenty of apps count kilometres, but few capture the joy and community spirit of the sport.</p>
          <p>So we built a place to keep an honest log of your running, see your progress add up, learn from practical training notes and talk to runners who've been where you're heading.</p>
          <p>From first-timers to seasoned marathoners, we're proud to be part of each runner's journey, and excited about every kilometre ahead.</p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface border-y border-border">
        <div className="container-custom py-16 md:py-20">
          <p className="section-tag">What guides us</p>
          <h2 className="mt-3 text-4xl">Our values</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card">
                <span className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-2 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer */}
      <section className="container-custom py-16 md:py-24">
        <p className="section-tag">What you get</p>
        <h2 className="mt-3 text-4xl">Everything in one place, free.</h2>
        <ol className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-x-10">
          {OFFER.map(([title, body], i) => (
            <li key={title} className="py-6 border-t border-border flex gap-5">
              <span className="stat-num text-primary text-lg w-8 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-bold text-lg">{title}</p>
                <p className="text-muted-foreground mt-1">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <FAQSection title="Common questions" subtitle="Everything you need to know about getting started with CoolRunnings." />

      {!user && (
        <section className="container-custom py-16">
          <div className="rounded-[28px] bg-ink text-[rgb(var(--ink-foreground))] p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl text-[rgb(var(--ink-foreground))]">Run with us.</h2>
              <p className="mt-3 opacity-75 text-lg max-w-lg">Join a supportive community of runners who motivate and celebrate each other.</p>
            </div>
            <Link to="/register" className="btn btn-primary btn-lg shrink-0">Create free account <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </section>
      )}
    </div>
  );
}
