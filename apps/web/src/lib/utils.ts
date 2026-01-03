import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getTemperatureColor(temperature: string): string {
  switch (temperature) {
    case 'HOT':
      return 'text-hot bg-hot-light border-hot';
    case 'WARM':
      return 'text-warm bg-warm-light border-warm';
    case 'COLD':
      return 'text-cold bg-cold-light border-cold';
    case 'DEAD':
      return 'text-dead bg-dead-light border-dead';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-300';
  }
}

export function getTemperatureEmoji(temperature: string): string {
  switch (temperature) {
    case 'HOT':
      return '🔥';
    case 'WARM':
      return '🟡';
    case 'COLD':
      return '🔵';
    case 'DEAD':
      return '⚫';
    default:
      return '⚪';
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
