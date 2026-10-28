/** @type {import('tailwindcss').Config} */

// Every colour comes from a CSS variable (see src/index.css), so the whole app
// switches between light and dark by toggling the `dark` class on <html>.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          light: token('primary-hover'),
          dark: token('primary-hover'),
          soft: token('primary-soft'),
          foreground: token('primary-foreground'),
        },
        background: token('background'),
        foreground: token('foreground'),
        surface: token('surface'),
        surface2: token('surface2'),
        surface3: token('surface3'),
        border: token('border'),
        ink: token('ink'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
        // Old names kept so nothing breaks; they all point at the accent now
        gold: token('primary'),
        copper: token('primary'),
        amber: token('primary'),
        muted: {
          DEFAULT: token('surface2'),
          foreground: token('muted'),
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        serif: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '28px',
      },
      boxShadow: {
        'warm-sm': '0 1px 2px rgb(0 0 0 / 0.06)',
        warm: '0 12px 32px -20px rgb(0 0 0 / 0.35)',
        'warm-lg': '0 24px 48px -28px rgb(0 0 0 / 0.4)',
        glow: '0 0 0 4px rgb(var(--primary) / 0.15)',
        card: '0 1px 2px rgb(0 0 0 / 0.04)',
        'card-hover': '0 16px 32px -24px rgb(0 0 0 / 0.35)',
        lift: '0 24px 48px -32px rgb(0 0 0 / 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'pulse-gold': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.96)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        shimmer: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
}
