import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';

export function NotFoundPage() {
  useSeo({ title: 'Page not found', noindex: true });
  return (
    <div className="container-custom min-h-[70vh] flex items-center py-16">
      <div className="max-w-xl animate-slide-up">
        <p className="section-tag">Error 404</p>
        <p className="stat-num text-[6rem] md:text-[8rem] leading-none mt-2 text-primary">DNF</p>
        <h1 className="mt-4 text-4xl md:text-5xl">This route doesn't exist.</h1>
        <p className="mt-4 text-lg text-muted-foreground">The page may have moved, or the link may be wrong. Let's get you back on course.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn btn-primary"><ArrowLeft className="w-4 h-4" /> Back home</Link>
          <Link to="/blog" className="btn btn-secondary">Read the blog</Link>
          <Link to="/community" className="btn btn-ghost">Community</Link>
        </div>
      </div>
    </div>
  );
}
