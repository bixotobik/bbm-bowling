import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/rezervacia?error=invalid', req.url))

  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select('id, status')
    .eq('cancel_token', token)
    .single()

  if (error || !reservation) {
    return NextResponse.redirect(new URL('/rezervacia?error=notfound', req.url))
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.redirect(new URL('/rezervacia/cancelled', req.url))
  }

  await supabaseAdmin
    .from('reservations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', reservation.id)

  return NextResponse.redirect(new URL('/rezervacia/cancelled', req.url))
}
