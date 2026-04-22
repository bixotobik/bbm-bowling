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
  return `${proto}://${req.headers.get('host')}`
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/rezervacia?error=invalid', req.url))

  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select('*, resources(name, number)')
    .eq('confirmation_token', token)
    .single()

  if (error || !reservation) {
    return NextResponse.redirect(new URL('/rezervacia?error=notfound', req.url))
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.redirect(new URL('/rezervacia/cancelled', req.url))
  }

  if (reservation.status === 'confirmed') {
    return NextResponse.redirect(new URL('/rezervacia/confirmed', req.url))
  }

  // Confirm the reservation
  await supabaseAdmin
    .from('reservations')
    .update({ status: 'confirmed' })
    .eq('id', reservation.id)

  // Send emails
  const baseUrl = getBaseUrl(req)
  const cancelUrl = `${baseUrl}/api/rezervacia/cancel?token=${reservation.cancel_token}`
  const timeRange = `${formatHour(reservation.start_hour)} – ${formatHour(reservation.end_hour)}`
  const price = formatPrice(reservation.total_price)
  const lane = reservation.resources?.number ?? '–'

  if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD !== 'your_gmail_app_password_here') {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })

    // Success email to customer
    await transporter.sendMail({
      from: `BBM Bowling Bar <${process.env.GMAIL_USER}>`,
      to: reservation.customer_email,
      subject: `Rezervácia potvrdená – ${reservation.date} ${timeRange}`,
      html: emailTemplate({
        title: 'Rezervácia potvrdená',
        subtitle: 'Tešíme sa na vás! Tu sú detaily vašej rezervácie.',
        customer_name: reservation.customer_name,
        date: reservation.date,
        timeRange,
        lane,
        duration: reservation.duration_hours,
        price,
        notes: reservation.notes,
        primaryBtn: null,
        secondaryBtn: { label: 'Zrušiť rezerváciu', url: cancelUrl },
        footerNote: 'Platba prebieha na mieste pri príchode.',
      }),
    })

    // Admin notification
    await transporter.sendMail({
      from: `BBM Booking <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Nová rezervácia – ${reservation.date} ${timeRange} – ${reservation.customer_name}`,
      html: adminEmailTemplate({
        customer_name: reservation.customer_name,
        customer_email: reservation.customer_email,
        customer_phone: reservation.customer_phone,
        date: reservation.date,
        timeRange,
        lane,
        duration: reservation.duration_hours,
        price,
        notes: reservation.notes,
      }),
    })
  }

  return NextResponse.redirect(new URL('/rezervacia/confirmed', req.url))
}

// --- Email templates ---

function emailTemplate(data: {
  title: string
  subtitle: string
  customer_name: string
  date: string
  timeRange: string
  lane: number | string
  duration: number
  price: string
  notes: string | null
  primaryBtn: { label: string; url: string; color: string } | null
  secondaryBtn: { label: string; url: string } | null
  footerNote: string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:0 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#000;border-radius:16px 16px 0 0;padding:28px 36px;">
                  <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">BBM</span>
                  <span style="color:#ffffff40;font-size:13px;margin-left:12px;">Bowling Bar Malacky</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;border-radius:0 0 16px 16px;padding:36px;margin-top:-24px;">

            <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#000;letter-spacing:-0.5px;">${data.title}</h1>
            <p style="margin:0 0 32px;color:#666;font-size:15px;">Ahoj ${data.customer_name}, ${data.subtitle}</p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr><td style="padding:24px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;width:50%;">Dátum</td>
                    <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.date}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Čas</td>
                    <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.timeRange}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Dráha</td>
                    <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.lane}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #222;">Trvanie</td>
                    <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #222;">${data.duration} hod.</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0 0;color:#fff;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">Celková cena</td>
                    <td style="padding:14px 0 0;color:#03AED2;font-size:22px;font-weight:900;text-align:right;">${data.price}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            ${data.notes ? `<p style="margin:0 0 24px;padding:16px;background:#F5F5F5;border-radius:8px;color:#555;font-size:14px;"><strong>Poznámka:</strong> ${data.notes}</p>` : ''}

            <!-- Primary button -->
            ${data.primaryBtn ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr><td align="center">
                <a href="${data.primaryBtn.url}" style="display:inline-block;background:${data.primaryBtn.color};color:#fff;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:100px;letter-spacing:0.3px;">
                  ${data.primaryBtn.label}
                </a>
              </td></tr>
            </table>` : ''}

            <!-- Secondary button -->
            ${data.secondaryBtn ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${data.secondaryBtn.url}" style="display:inline-block;color:#999;font-size:13px;text-decoration:underline;padding:8px;">
                  ${data.secondaryBtn.label}
                </a>
              </td></tr>
            </table>` : ''}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="margin:0 0 4px;color:#aaa;font-size:12px;">${data.footerNote}</p>
            <p style="margin:0;color:#ccc;font-size:12px;">BBM Bowling Bar · Priemyselná 5863, 901 01 Malacky · +421 919 080 420</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function adminEmailTemplate(data: {
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  timeRange: string
  lane: number | string
  duration: number
  price: string
  notes: string | null
}) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:32px;background:#F5F5F5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
    <tr><td style="background:#000;border-radius:12px 12px 0 0;padding:20px 28px;">
      <span style="color:#fff;font-size:18px;font-weight:900;">BBM</span>
      <span style="color:#03AED2;font-size:13px;margin-left:12px;font-weight:700;">Nová rezervácia</span>
    </td></tr>
    <tr><td style="background:#fff;border-radius:0 0 12px 12px;padding:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
        <tr><td style="padding:6px 0;color:#999;width:140px;">Zákazník</td><td style="font-weight:700;">${data.customer_name}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Telefón</td><td><a href="tel:${data.customer_phone}" style="color:#000;">${data.customer_phone}</a></td></tr>
        <tr><td style="padding:6px 0;color:#999;">Email</td><td><a href="mailto:${data.customer_email}" style="color:#000;">${data.customer_email}</a></td></tr>
        <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #eee;"></td></tr>
        <tr><td style="padding:6px 0;color:#999;">Dátum</td><td style="font-weight:700;">${data.date}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Čas</td><td style="font-weight:700;">${data.timeRange}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Dráha</td><td>${data.lane}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Trvanie</td><td>${data.duration} hod.</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Cena</td><td style="font-weight:900;color:#03AED2;font-size:16px;">${data.price}</td></tr>
        ${data.notes ? `<tr><td style="padding:6px 0;color:#999;">Poznámka</td><td>${data.notes}</td></tr>` : ''}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
