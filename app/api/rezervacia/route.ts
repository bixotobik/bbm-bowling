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

function buildEmailTemplate(data: {
  title: string; subtitle: string; customer_name: string; date: string; timeRange: string
  lane: number | string; duration: number; price: string; notes: string | null
  primaryBtn: { label: string; url: string; color: string } | null
  secondaryBtn: { label: string; url: string } | null
  footerNote: string
}) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#000;border-radius:16px 16px 0 0;padding:28px 36px;">
  <span style="color:#fff;font-size:22px;font-weight:900;">BBM</span>
  <span style="color:#ffffff40;font-size:13px;margin-left:12px;">Bowling Bar Malacky</span>
</td></tr>
<tr><td style="background:#fff;border-radius:0 0 16px 16px;padding:36px;">
  <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#000;">${data.title}</h1>
  <p style="margin:0 0 32px;color:#666;font-size:15px;">Ahoj ${data.customer_name}, ${data.subtitle}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;border-radius:12px;margin-bottom:28px;">
  <tr><td style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Dátum</td><td style="padding:8px 0;color:#fff;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.date}</td></tr>
      <tr><td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Čas</td><td style="padding:8px 0;color:#fff;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.timeRange}</td></tr>
      <tr><td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Dráha</td><td style="padding:8px 0;color:#fff;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.lane}</td></tr>
      <tr><td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Trvanie</td><td style="padding:8px 0;color:#fff;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.duration} hod.</td></tr>
      <tr><td style="padding:14px 0 0;color:#fff;font-size:13px;font-weight:900;text-transform:uppercase;">Celková cena</td><td style="padding:14px 0 0;color:#03AED2;font-size:22px;font-weight:900;text-align:right;">${data.price}</td></tr>
    </table>
  </td></tr></table>
  ${data.notes ? `<p style="margin:0 0 24px;padding:16px;background:#F5F5F5;border-radius:8px;color:#555;font-size:14px;"><strong>Poznámka:</strong> ${data.notes}</p>` : ''}
  ${data.primaryBtn ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr><td align="center"><a href="${data.primaryBtn.url}" style="display:inline-block;background:${data.primaryBtn.color};color:#fff;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:100px;">${data.primaryBtn.label}</a></td></tr></table>` : ''}
  ${data.secondaryBtn ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="${data.secondaryBtn.url}" style="color:#999;font-size:13px;text-decoration:underline;padding:8px;">${data.secondaryBtn.label}</a></td></tr></table>` : ''}
</td></tr>
<tr><td style="padding:24px 0 0;text-align:center;">
  <p style="margin:0 0 4px;color:#aaa;font-size:12px;">${data.footerNote}</p>
  <p style="margin:0;color:#ccc;font-size:12px;">BBM Bowling Bar · Priemyselná 5863, 901 01 Malacky · +421 919 080 420</p>
</td></tr>
</table></td></tr></table></body></html>`
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
    html: buildEmailTemplate({
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
