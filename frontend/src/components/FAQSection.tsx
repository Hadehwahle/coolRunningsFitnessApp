import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Is CoolRunningsFitness free to use?',
    answer: 'Yes — completely free. Create your account, log runs, join the community, and access all the blog content at no cost. There are no hidden fees or premium tiers.',
  },
  {
    question: 'How do I log a run?',
    answer: 'Once signed in, head to your Dashboard and click "Log New Run". Enter your distance (in km), duration (hours, minutes, seconds), the date and time, weather conditions, and a rating. Your pace and estimated calories are calculated automatically.',
  },
  {
    question: 'Can I track my progress over time?',
    answer: 'Absolutely. Your Dashboard shows your total runs, total distance, total time, and average pace — all updated in real time as you log more runs. Every stat reflects your actual data, not placeholders.',
  },
  {
    question: 'What is the Community section for?',
    answer: 'The Community is a forum where runners ask questions, share training tips, discuss races, and motivate each other. You can start new discussions, reply to existing threads, and like posts. New replies and likes appear in real time without refreshing.',
  },
  {
    question: 'How do notifications work?',
    answer: 'Logged-in users receive real-time notifications (via the bell icon in the header) when a new blog post is published, someone replies to their community thread, or someone likes their thread. No email is required.',
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes. Go to Settings → Account tab, scroll to the Danger Zone, and follow the confirmation steps. Deleting your account permanently removes all your runs, forum posts, and account data. This cannot be undone.',
  },
  {
    question: 'Who writes the blog content?',
    answer: 'Blog posts are written and published by the CoolRunnings admin team — coaches, dietitians, sports medicine professionals, and experienced runners. Each article shows the author\'s name and bio.',
  },
  {
    question: 'How do I change my password?',
    answer: 'Go to Settings → Security tab. Enter your current password, then your new password (at least 8 characters, with an uppercase letter, a lowercase letter and a number) twice. Your password is stored securely using bcrypt hashing.',
  },
];

function FAQItem({ item, isOpen, onToggle, id }: { item: FAQItem; isOpen: boolean; onToggle: () => void; id: string }) {
  return (
    <div className="border-b border-border">
      <h3 className="m-0" style={{ fontSize: 'inherit', fontStretch: '100%' }}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          className="w-full flex items-center justify-between gap-6 py-5 text-left group"
        >
          <span className="font-semibold text-[17px] md:text-lg group-hover:text-primary transition-colors">{item.question}</span>
          <span className={`w-9 h-9 rounded-full border border-border flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-ink text-[rgb(var(--ink-foreground))] border-transparent rotate-180' : 'text-foreground'}`}>
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="pb-6 pr-12 text-muted-foreground leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  dark?: boolean; // kept for compatibility: true = on the white "surface" band
  items?: FAQItem[];
}

export function FAQSection({
  title = 'Frequently asked questions',
  subtitle = 'Everything you need to know about CoolRunningsFitness.',
  dark = false,
  items = FAQ_ITEMS,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className={`py-20 md:py-24 border-t border-border ${dark ? 'bg-surface' : 'bg-background'}`}>
      <div className="container-custom grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16">
        <div>
          <p className="section-tag mb-3">FAQ</p>
          <h2 className="text-[2rem] md:text-5xl mb-4">{title}</h2>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
          <p className="mt-6 text-muted-foreground">
            Still stuck? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact us</Link> and we'll get back to you.
          </p>
        </div>
        <div className="border-t border-border">
          {items.map((item, i) => (
            <FAQItem key={i} id={`faq-${i}`} item={item} isOpen={openIndex === i} onToggle={() => toggle(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
