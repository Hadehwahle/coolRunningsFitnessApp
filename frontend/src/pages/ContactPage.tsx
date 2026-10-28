import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, BookOpen, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { PageHero } from '@/components/ui';
import { apiService, errorMessage } from '@/services/api';
import { useSeo } from '@/hooks/useSeo';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export function ContactPage() {
  useSeo({ title: 'Contact us', description: 'Questions, feedback or partnership ideas? Get in touch with the CoolRunningsFitness team.' });
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await apiService.submitContact(form);
      setForm(EMPTY); setSent(true);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to send message. Please try again.'));
    } finally { setLoading(false); }
  };

  const channels = [
    { icon: Mail, title: 'Email us', body: 'info@coolrunningsfitness.com', href: 'mailto:info@coolrunningsfitness.com' },
    { icon: MessageSquare, title: 'Ask the community', body: 'Quick running questions get fast answers in the forum.', to: '/community' },
    { icon: BookOpen, title: 'Read the guides', body: 'Training plans, nutrition and gear advice on the blog.', to: '/blog' },
  ];

  return (
    <div>
      <PageHero eyebrow="Contact" title="Get in touch"
        intro="Questions, feedback or partnership ideas? Send a message and we'll reply as soon as we can, usually within two working days." />

      <div className="container-custom py-12 md:py-16 grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8 lg:gap-12">
        <div className="card p-6 md:p-8">
          {sent ? (
            <div className="py-10 text-center" role="status">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
              <h2 className="text-3xl mt-4">Message sent</h2>
              <p className="text-muted-foreground mt-2">Thanks for reaching out. We'll get back to you soon.</p>
              <button type="button" onClick={() => setSent(false)} className="btn btn-secondary mt-6">Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Input label="Full name" name="name" autoComplete="name" value={form.name} onChange={onChange} placeholder="Your name" required />
                <Input type="email" label="Email address" name="email" autoComplete="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
              </div>
              <Input label="Subject" name="subject" value={form.subject} onChange={onChange} placeholder="How can we help?" required />
              <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold mb-2">Message</label>
                <textarea id="contact-message" name="message" value={form.message} onChange={onChange} rows={6}
                  className="input resize-y min-h-[140px]" placeholder="Tell us a bit more…" required />
              </div>
              <Button type="submit" loading={loading} className="w-full sm:w-auto"><Send className="w-4 h-4" /> Send message</Button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {channels.map(({ icon: Icon, title, body, href, to }) => {
            const inner = (
              <>
                <span className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
                <span>
                  <span className="block font-bold group-hover:text-primary transition-colors">{title}</span>
                  <span className="block text-muted-foreground text-[15px] mt-0.5 break-words">{body}</span>
                </span>
              </>
            );
            return to
              ? <Link key={title} to={to} className="card flex items-start gap-4 group">{inner}</Link>
              : <a key={title} href={href} className="card flex items-start gap-4 group">{inner}</a>;
          })}
          <div className="card bg-surface2 border-transparent">
            <p className="font-bold">Forgot your password?</p>
            <p className="text-muted-foreground text-[15px] mt-1">You can reset it yourself in a minute. <Link to="/forgot-password" className="text-primary font-semibold hover:underline">Reset password</Link></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
