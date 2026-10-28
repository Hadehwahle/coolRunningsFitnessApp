import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(km: number): string {
  return `${km.toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(minPerKm: number): string {
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

export function calculatePace(distanceKm: number, durationSeconds: number): number {
  if (distanceKm === 0) return 0;
  return (durationSeconds / 60) / distanceKm;
}

export function calculateCalories(distanceKm: number, weightKg: number = 70): number {
  // Rough estimate: 1 km = 1 calorie per kg of body weight
  return Math.round(distanceKm * weightKg);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const ago = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return ago(Math.floor(diffInSeconds / 60), 'minute');
  if (diffInSeconds < 86400) return ago(Math.floor(diffInSeconds / 3600), 'hour');
  if (diffInSeconds < 172800) return 'yesterday';
  if (diffInSeconds < 604800) return ago(Math.floor(diffInSeconds / 86400), 'day');

  return formatDate(dateString);
}

export function getWeatherIcon(weather: string): string {
  const icons: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    hot: '🔥',
    cold: '❄️',
    windy: '💨',
  };
  return icons[weather] || '🌤️';
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Same password rules the server enforces. Returns a message, or null if OK. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return 'Password must contain an uppercase letter, a lowercase letter and a number';
  }
  return null;
}

/** Value for <input type="datetime-local"> in the user's local time */
export function toLocalInputValue(date: Date | string): string {
  const d = new Date(date);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
