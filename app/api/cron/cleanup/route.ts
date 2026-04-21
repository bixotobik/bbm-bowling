import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Protect endpoint — only Vercel cron or manual call with secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90) // delete reservations older than 90 days
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { error, count } = await supabaseAdmin
    .from('reservations')
    .delete({ count: 'exact' })
    .lt('date', cutoffStr)

  if (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`Cleanup: deleted ${count} old reservations before ${cutoffStr}`)
  return NextResponse.json({ success: true, deleted: count, before: cutoffStr })
}
