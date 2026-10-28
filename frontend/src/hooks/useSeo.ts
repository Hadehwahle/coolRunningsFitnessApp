import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'CoolRunningsFitness';
const DEFAULT_DESCRIPTION =
  'Track your runs, join a community of runners, and get training tips, race guides and nutrition advice. We run together.';
const DEFAULT_IMAGE = '/og-image.png';

// Public URL of the site. Set VITE_SITE_URL in production (e.g. https://coolrunningsfitness.com).
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

interface SeoOptions {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  /** Keep this page out of search results (login, settings, admin…) */
  noindex?: boolean;
  /** Structured data (schema.org) for rich results */
  jsonLd?: Record<string, unknown> | null;
  publishedTime?: string;
  modifiedTime?: string;
  /** Skip (when a child component is setting the tags for this page instead) */
  disabled?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`);

/**
 * Sets the page title, description, canonical URL, Open Graph/Twitter tags and
 * structured data for the current page. Before this, every page had the same
 * title and a canonical tag pointing at the homepage, which told Google all
 * pages were duplicates of the home page.
 */
export function useSeo(options: SeoOptions) {
  const { pathname } = useLocation();
  const {
    title, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, type = 'website',
    noindex = false, jsonLd = null, publishedTime, modifiedTime, disabled = false,
  } = options;

  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    if (disabled) return;
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Track Your Runs, Join the Community`;
    const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
    const img = absolute(image);

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setCanonical(url);

    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('property', 'article:published_time', type === 'article' ? publishedTime : undefined);
    setMeta('property', 'article:modified_time', type === 'article' ? modifiedTime : undefined);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', img);

    let script = document.getElementById('page-jsonld') as HTMLScriptElement | null;
    if (jsonLdString) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'page-jsonld';
        document.head.appendChild(script);
      }
      script.textContent = jsonLdString;
    } else {
      script?.remove();
    }
  }, [title, description, image, type, noindex, jsonLdString, publishedTime, modifiedTime, pathname, disabled]);
}
