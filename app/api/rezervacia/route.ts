import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatHour(h: number): string {
  const actual = h % 24
  return `${String(actual).padStart(2, '0')}:00`
}

function formatPrice(p: number): string {
  return p.toFixed(2).replace('.', ',') + ' €'
}

async function sendEmails(data: {
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  start_hour: number
  end_hour: number
  duration_hours: number
  total_price: number
  lane: number
  notes: string | null
}) {
  if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'your_gmail_app_password_here') return

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const timeRange = `${formatHour(data.start_hour)} – ${formatHour(data.end_hour)}`
  const price = formatPrice(data.total_price)

  // Email to customer
  await transporter.sendMail({
    from: `BBM Bowling Bar <${process.env.GMAIL_USER}>`,
    to: data.customer_email,
    subject: `Potvrdenie rezervácie – BBM Bowling Bar Malacky`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 32px; border-radius: 16px;">
        <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Rezervácia potvrdená ✓</h1>
        <p style="color: #666; margin: 0 0 32px;">BBM Bowling Bar Malacky</p>

        <div style="background: #000; color: #fff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Dátum</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.date}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Čas</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${timeRange}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Dráha</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.lane}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Trvanie</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.duration_hours} hod.</td></tr>
            <tr style="border-top: 1px solid #333;"><td style="padding: 12px 0 0; font-size: 18px; font-weight: 900;">Celková cena</td><td style="padding: 12px 0 0; font-size: 18px; font-weight: 900; text-align: right;">${price}</td></tr>
          </table>
        </div>

        <p style="color: #666; font-size: 14px; margin: 0 0 8px;">💳 <strong>Platba na mieste</strong> pri príchode.</p>
        ${data.notes ? `<p style="color: #666; font-size: 14px; margin: 0 0 8px;">📝 Poznámka: ${data.notes}</p>` : ''}

        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; margin: 0;">BBM Bowling Bar Malacky · Priemyselná 5863, 901 01 Malacky · +421 919 080 420</p>
        <p style="color: #999; font-size: 12px; margin: 4px 0 0;">V prípade zmeny nás kontaktujte telefonicky.</p>
      </div>
    `,
  })

  // Notification to admin
  await transporter.sendMail({
    from: `BBM Booking <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Nová rezervácia – ${data.date} ${timeRange} – ${data.customer_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="margin: 0 0 16px;">Nová rezervácia</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #666; width: 140px;">Zákazník</td><td style="font-weight: bold;">${data.customer_name}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Telefón</td><td><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Email</td><td><a href="mailto:${data.customer_email}">${data.customer_email}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Dátum</td><td>${data.date}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Čas</td><td>${timeRange}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Dráha</td><td>${data.lane}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Trvanie</td><td>${data.duration_hours} hod.</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Cena</td><td style="font-weight: bold;">${price}</td></tr>
          ${data.notes ? `<tr><td style="padding: 6px 0; color: #666;">Poznámka</td><td>${data.notes}</td></tr>` : ''}
        </table>
      </div>
    `,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resource_id, customer_name, customer_email, customer_phone, notes, date, start_hour, end_hour, duration_hours, total_price, lane } = body

    // Server-side availability check — prevent double booking
    const { data: conflicts } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('resource_id', resource_id)
      .eq('date', date)
      .eq('status', 'confirmed')
      .lt('start_hour', end_hour)
      .gt('end_hour', start_hour)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Tento termín je už obsadený. Vyberte iný čas.' }, { status: 409 })
    }

    // Check closures
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

    // Insert reservation
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
        status: 'confirmed',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Chyba pri vytváraní rezervácie.' }, { status: 500 })
    }

    // Send emails (non-blocking — don't fail reservation if email fails)
    sendEmails({ customer_name, customer_email, customer_phone, date, start_hour, end_hour, duration_hours, total_price, lane, notes }).catch(console.error)

    return NextResponse.json({ success: true, id: reservation.id })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Serverová chyba.' }, { status: 500 })
  }
}
