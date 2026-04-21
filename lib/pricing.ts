import { PricingRule } from './supabase'

export interface SlotInfo {
  hour: number
  tier: 'cheap' | 'medium' | 'peak' | 'closed' | 'unavailable'
  price: number | null
  color: string
  label: string
}

export function getPricingRuleForSlot(
  rules: PricingRule[],
  dayOfWeek: number,
  hour: number
): PricingRule | null {
  return (
    rules.find(
      (r) =>
        r.days_of_week.includes(dayOfWeek) &&
        hour >= r.start_hour &&
        hour < r.end_hour
    ) ?? null
  )
}

export function getSlotInfo(
  rules: PricingRule[],
  dayOfWeek: number,
  hour: number
): SlotInfo {
  const rule = getPricingRuleForSlot(rules, dayOfWeek, hour)

  if (!rule) {
    return {
      hour,
      tier: 'closed',
      price: null,
      color: '#1a1a1a',
      label: 'Zatvorené',
    }
  }

  return {
    hour,
    tier: rule.tier as SlotInfo['tier'],
    price: rule.price_per_hour,
    color: rule.color,
    label: rule.label ?? `${rule.price_per_hour} €`,
  }
}

export function calculateTotalPrice(
  rules: PricingRule[],
  dayOfWeek: number,
  startHour: number,
  durationHours: number
): number {
  let total = 0
  for (let h = startHour; h < startHour + durationHours; h++) {
    const info = getSlotInfo(rules, dayOfWeek, h % 24)
    if (info.price) total += info.price
  }
  return total
}

export const TIER_COLORS: Record<string, string> = {
  cheap: '#F59E0B',
  medium: '#22C55E',
  peak: '#3B82F6',
  closed: '#1a1a1a',
}

export const TIER_LABELS: Record<string, { sk: string; en: string }> = {
  cheap: { sk: '12,90 €', en: '12.90 €' },
  medium: { sk: '18,90 €', en: '18.90 €' },
  peak: { sk: '24,90 €', en: '24.90 €' },
  closed: { sk: 'Zatvorené', en: 'Closed' },
}

export const OPENING_HOURS: Record<number, { open: number | null; close: number | null }> = {
  0: { open: 13, close: 22 },  // Sunday
  1: { open: 14, close: 24 },  // Monday
  2: { open: 14, close: 24 },  // Tuesday
  3: { open: 14, close: 24 },  // Wednesday
  4: { open: 14, close: 24 },  // Thursday
  5: { open: 13, close: 26 },  // Friday (02:00)
  6: { open: 13, close: 26 },  // Saturday (02:00)
}
