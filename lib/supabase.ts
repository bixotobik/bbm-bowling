import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ResourceType = 'bowling' | 'billiard' | 'darts'
export type PricingTier = 'cheap' | 'medium' | 'peak' | 'closed'
export type ReservationStatus = 'confirmed' | 'cancelled'

export interface Resource {
  id: string
  name: string
  type: ResourceType
  number: number
  is_active: boolean
}

export interface PricingRule {
  id: string
  resource_type: ResourceType
  days_of_week: number[]
  start_hour: number
  end_hour: number
  price_per_hour: number | null
  tier: PricingTier
  color: string
  label: string | null
}

export interface Reservation {
  id: string
  resource_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  start_hour: number
  end_hour: number
  duration_hours: number
  total_price: number | null
  status: ReservationStatus
  notes: string | null
  created_at: string
  cancelled_at: string | null
  resources?: Resource
}

export interface Closure {
  id: string
  resource_id: string
  date: string
  start_hour: number
  end_hour: number
  reason: string | null
}
