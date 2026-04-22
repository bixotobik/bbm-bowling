import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatHour(h: number) {
  return `${String(h % 24).padStart(2, '0')}:00`
}
function formatPrice(p: number) {
  return p.toFixed(2).replace('.', ',') + ' €'
}
function getBaseUrl(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host')
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resource_id, customer_name, customer_email, customer_phone, notes, date, start_hour, end_hour, duration_hours, total_price, lane } = body

    // Server-side availability check
    const { data: conflicts } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('resource_id', resource_id)
      .eq('date', date)
      .in('status', ['pending', 'confirmed'])
      .lt('start_hour', end_hour)
      .gt('end_hour', start_hour)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Tento termín je už obsadený. Vyberte iný čas.' }, { status: 409 })
    }

    const { data: closureConflicts } = await supabaseAdmin
      .from('closures')
      .select('id')
      .eq('resource_id', resource_id)
      .eq('date', date)
      .lt('start_hour', end_hour)
      .gt('end_hour', start_hour)

    if (closureConflicts && closureConflicts.length > 0) {
      return NextResponse.json({ error: 'Tento termín je uzavretý. Vyberte iný čas.' }, { status: 409 })
    }

    const confirmationToken = crypto.randomUUID()
    const cancelToken = crypto.randomUUID()

    const { data: reservation, error: insertError } = await supabaseAdmin
      .from('reservations')
      .insert({
        resource_id,
        customer_name,
        customer_email,
        customer_phone,
        notes: notes || null,
        date,
        start_hour,
        end_hour,
        duration_hours,
        total_price,
        status: 'pending',
        confirmation_token: confirmationToken,
        cancel_token: cancelToken,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Chyba pri vytváraní rezervácie.' }, { status: 500 })
    }

    // Send confirmation email to customer
    const baseUrl = getBaseUrl(req)
    sendConfirmationEmail({ customer_name, customer_email, date, start_hour, end_hour, duration_hours, total_price, lane, notes, confirmationToken, cancelToken, baseUrl }).catch(console.error)

    return NextResponse.json({ success: true, id: reservation.id })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Serverová chyba.' }, { status: 500 })
  }
}

async function sendConfirmationEmail(data: {
  customer_name: string
  customer_email: string
  date: string
  start_hour: number
  end_hour: number
  duration_hours: number
  total_price: number
  lane: number
  notes: string | null
  confirmationToken: string
  cancelToken: string
  baseUrl: string
}) {
  if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'your_gmail_app_password_here') return

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })

  const timeRange = `${formatHour(data.start_hour)} – ${formatHour(data.end_hour)}`
  const confirmUrl = `${data.baseUrl}/api/rezervacia/confirm?token=${data.confirmationToken}`
  const cancelUrl = `${data.baseUrl}/api/rezervacia/cancel?token=${data.cancelToken}`

  await transporter.sendMail({
    from: `BBM Bowling Bar <${process.env.GMAIL_USER}>`,
    to: data.customer_email,
    subject: `Potvrďte svoju rezerváciu – BBM Bowling Bar`,
    html: emailTemplate({
      title: 'Potvrďte rezerváciu',
      subtitle: 'Kliknite na tlačidlo nižšie pre potvrdenie vašej rezervácie.',
      customer_name: data.customer_name,
      date: data.date,
      timeRange,
      lane: data.lane,
      duration: data.duration_hours,
      price: formatPrice(data.total_price),
      notes: data.notes,
      primaryBtn: { label: 'Potvrdiť rezerváciu', url: confirmUrl, color: '#03AED2' },
      secondaryBtn: { label: 'Zrušiť rezerváciu', url: cancelUrl },
      footerNote: 'Ak ste rezerváciu nevytvárali, ignorujte tento email.',
    }),
  })
}
