import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHour(h: number): string {
  const actual = h % 24
  return `${String(actual).padStart(2, '0')}:00`
}

export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',') + ' €'
}
