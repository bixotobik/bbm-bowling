'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'
import { supabase, PricingRule, Reservation, Closure } from '@/lib/supabase'
import { getSlotInfo, calculateTotalPrice, OPENING_HOURS } from '@/lib/pricing'
import { formatHour, formatPrice } from '@/lib/utils'

const RESOURCE_TYPE = 'bowling'
const MAX_HOURS = 5
const LANE_COUNT = 4

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const MONTHS_SK = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS_SK = ['Ne','Po','Ut','St','Št','Pi','So']
const WEEKDAYS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function RezervaciaPage() {
  const { lang } = useLang()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedLane, setSelectedLane] = useState<number>(1)
  const [startHour, setStartHour] = useState<number | null>(null)
  const [duration, setDuration] = useState(1)
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [closures, setClosures] = useState<Closure[]>([])
  const [resources, setResources] = useState<{ id: string; number: number }[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [step, setStep] = useState<'date' | 'time' | 'form' | 'success'>('date')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load pricing rules and resources once
  useEffect(() => {
    supabase.from('pricing_rules').select('*').eq('resource_type', RESOURCE_TYPE).then(({ data }) => {
      if (data) setPricingRules(data as PricingRule[])
    })
    supabase.from('resources').select('id,number').eq('type', RESOURCE_TYPE).eq('is_active', true).then(({ data }) => {
      if (data) setResources(data as { id: string; number: number }[])
    })
  }, [])

  // Load reservations + closures when date changes
  const loadAvailability = useCallback(async (date: string) => {
    const [resResult, closResult] = await Promise.all([
      supabase.from('reservations').select('*').eq('date', date).eq('status', 'confirmed'),
      supabase.from('closures').select('*').eq('date', date),
    ])
    if (resResult.data) setReservations(resResult.data as Reservation[])
    if (closResult.data) setClosures(closResult.data as Closure[])
  }, [])

  useEffect(() => {
    if (selectedDate) loadAvailability(selectedDate)
  }, [selectedDate, loadAvailability])

  const dayOfWeek = selectedDate ? new Date(selectedDate).getDay() : 0
  const openHours = selectedDate ? OPENING_HOURS[dayOfWeek] : null

  function isHourBlocked(hour: number, laneNum: number): boolean {
    const resource = resources.find(r => r.number === laneNum)
    if (!resource) return false
    const blocked = closures.some(c => c.resource_id === resource.id && hour >= c.start_hour && hour < c.end_hour)
    if (blocked) return true
    const taken = reservations.filter(r => r.resource_id === resource.id)
    return taken.some(r => hour >= r.start_hour && hour < r.end_hour)
  }

  function canBookSlot(hour: number, laneNum: number, dur: number): boolean {
    if (!openHours || openHours.open === null || openHours.close === null) return false
    if (hour < openHours.open) return false
    if (hour + dur > openHours.close) return false
    const slotInfo = getSlotInfo(pricingRules, dayOfWeek, hour)
    if (slotInfo.tier === 'closed') return false
    for (let h = hour; h < hour + dur; h++) {
      if (isHourBlocked(h % 24, laneNum)) return false
      const info = getSlotInfo(pricingRules, dayOfWeek, h)
      if (info.tier === 'closed') return false
    }
    return true
  }

  const totalPrice = startHour !== null && selectedDate
    ? calculateTotalPrice(pricingRules, dayOfWeek, startHour, duration)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || startHour === null) return
    setSubmitting(true)
    setError(null)
    const resource = resources.find(r => r.number === selectedLane)
    if (!resource) { setError('Chyba: dráha nenájdená'); setSubmitting(false); return }

    const res = await fetch('/api/rezervacia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource_id: resource.id,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        notes: form.notes || null,
        date: selectedDate,
        start_hour: startHour,
        end_hour: startHour + duration,
        duration_hours: duration,
        total_price: totalPrice,
        lane: selectedLane,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? (lang === 'sk' ? 'Chyba pri rezervácii. Skúste znova.' : 'Booking error. Please try again.'))
    } else {
      setStep('success')
    }
    setSubmitting(false)
  }

  const months = lang === 'sk' ? MONTHS_SK : MONTHS_EN
  const weekdays = lang === 'sk' ? WEEKDAYS_SK : WEEKDAYS_EN
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const allHours = openHours
    ? Array.from({ length: (openHours.close ?? 0) - (openHours.open ?? 0) }, (_, i) => (openHours.open ?? 0) + i)
    : []

  return (
    <div className="pt-20 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <section className="py-16 bg-white border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">{t(T.booking.title, lang)}</h1>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <AnimatePresence mode="wait">

          {/* SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black mb-3">{lang === 'sk' ? 'Rezervácia potvrdená!' : 'Booking confirmed!'}</h2>
              <p className="text-black/50 mb-2">{t(T.booking.confirmation, lang)}</p>
              <p className="text-black/50 mb-8">
                {selectedDate} · {formatHour(startHour ?? 0)} – {formatHour((startHour ?? 0) + duration)} · {lang === 'sk' ? 'Dráha' : 'Lane'} {selectedLane}
              </p>
              <div className="text-3xl font-black mb-8">{formatPrice(totalPrice)}</div>
              <button
                onClick={() => { setStep('date'); setSelectedDate(null); setStartHour(null); setForm({ name: '', email: '', phone: '', notes: '' }) }}
                className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-black/80 transition-all cursor-pointer"
              >
                {lang === 'sk' ? 'Nová rezervácia' : 'New booking'}
              </button>
            </motion.div>
          )}

          {/* STEP: DATE */}
          {step === 'date' && (
            <motion.div key="date" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h2 className="text-2xl font-black mb-6">{t(T.booking.selectDate, lang)}</h2>
              <div className="bg-white rounded-3xl p-6">
                {/* Calendar nav */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer"
                  >‹</button>
                  <span className="font-black text-lg">{months[month]} {year}</span>
                  <button
                    onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer"
                  >›</button>
                </div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {weekdays.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-black/30 py-2">{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dateStr = toDateStr(year, month, day)
                    const dayDate = new Date(year, month, day)
                    const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    const isSelected = selectedDate === dateStr
                    const dow = dayDate.getDay()
                    const isOpen = OPENING_HOURS[dow].open !== null
                    return (
                      <button
                        key={day}
                        disabled={isPast || !isOpen}
                        onClick={() => { setSelectedDate(dateStr); setStep('time'); setStartHour(null) }}
                        className={`aspect-square rounded-xl text-sm font-semibold transition-all cursor-pointer
                          ${isPast || !isOpen ? 'text-black/20 cursor-not-allowed' : 'hover:bg-black/5'}
                          ${isSelected ? 'bg-black text-white hover:bg-black' : ''}
                        `}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom booking CTA */}
              <div className="mt-6 bg-black rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">{t(T.booking.customBooking, lang)}</p>
                  <p className="text-white/50 text-sm mt-1">{t(T.booking.maxHours, lang)}</p>
                </div>
                <a
                  href="tel:+421919080420"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-white/90 transition-all cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {t(T.booking.callUs, lang)}
                </a>
              </div>
            </motion.div>
          )}

          {/* STEP: TIME */}
          {step === 'time' && selectedDate && (
            <motion.div key="time" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => { setStep('date'); setStartHour(null) }} className="text-black/40 hover:text-black transition-colors cursor-pointer text-sm font-semibold">
                  ← {lang === 'sk' ? 'Späť' : 'Back'}
                </button>
                <h2 className="text-2xl font-black">{selectedDate}</h2>
              </div>

              {/* Lane selector */}
              <div className="bg-white rounded-3xl p-6 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(T.booking.selectLane, lang)}</p>
                <div className="flex gap-2">
                  {Array.from({ length: LANE_COUNT }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setSelectedLane(num)}
                      className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer
                        ${selectedLane === num ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}
                    >
                      {lang === 'sk' ? 'Dráha' : 'Lane'} {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-3xl p-6 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(T.booking.duration, lang)}</p>
                <div className="flex gap-2">
                  {Array.from({ length: MAX_HOURS }, (_, i) => i + 1).map(h => (
                    <button
                      key={h}
                      onClick={() => { setDuration(h); setStartHour(null) }}
                      className={`w-12 h-12 rounded-xl font-black transition-all cursor-pointer
                        ${duration === h ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div className="bg-white rounded-3xl p-6 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(T.booking.selectTime, lang)}</p>
                {allHours.length === 0 ? (
                  <p className="text-black/40">{t(T.booking.closed, lang)}</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {allHours.map(h => {
                      const info = getSlotInfo(pricingRules, dayOfWeek, h % 24)
                      const available = canBookSlot(h, selectedLane, duration)
                      const isSelected = startHour === h
                      return (
                        <button
                          key={h}
                          disabled={!available}
                          onClick={() => setStartHour(h)}
                          className={`relative rounded-xl p-2 text-center transition-all cursor-pointer
                            ${!available ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}
                            ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}
                          `}
                          style={{ background: available ? info.color : '#e5e5e5' }}
                        >
                          <div className="text-sm font-black text-white drop-shadow">{formatHour(h)}</div>
                          <div className="text-xs text-white/80 drop-shadow">{info.price ? `${info.price}€` : ''}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {/* Color legend */}
                <div className="flex gap-4 mt-4 flex-wrap">
                  {[{ c: '#F59E0B', l: '12,90 €' }, { c: '#22C55E', l: '18,90 €' }, { c: '#3B82F6', l: '24,90 €' }].map(x => (
                    <div key={x.l} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm" style={{ background: x.c }} />
                      <span className="text-xs text-black/40">{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {startHour !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black rounded-3xl p-6 flex items-center justify-between"
                >
                  <div className="text-white">
                    <p className="font-bold">{formatHour(startHour)} – {formatHour(startHour + duration)}</p>
                    <p className="text-white/50 text-sm">{lang === 'sk' ? 'Dráha' : 'Lane'} {selectedLane} · {duration}h</p>
                    <p className="text-2xl font-black mt-1">{formatPrice(totalPrice)}</p>
                    <p className="text-white/40 text-xs mt-1">{t(T.booking.payOnSite, lang)}</p>
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all cursor-pointer"
                  >
                    {lang === 'sk' ? 'Ďalej' : 'Next'} →
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP: FORM */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep('time')} className="text-black/40 hover:text-black transition-colors cursor-pointer text-sm font-semibold">
                  ← {lang === 'sk' ? 'Späť' : 'Back'}
                </button>
                <h2 className="text-2xl font-black">{lang === 'sk' ? 'Vaše údaje' : 'Your details'}</h2>
              </div>

              {/* Summary */}
              <div className="bg-black text-white rounded-3xl p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-white/40 text-xs">{lang === 'sk' ? 'Dátum' : 'Date'}</p><p className="font-bold">{selectedDate}</p></div>
                  <div><p className="text-white/40 text-xs">{lang === 'sk' ? 'Čas' : 'Time'}</p><p className="font-bold">{formatHour(startHour ?? 0)} – {formatHour((startHour ?? 0) + duration)}</p></div>
                  <div><p className="text-white/40 text-xs">{lang === 'sk' ? 'Dráha' : 'Lane'}</p><p className="font-bold">{selectedLane}</p></div>
                  <div><p className="text-white/40 text-xs">{t(T.booking.totalPrice, lang)}</p><p className="font-black text-xl">{formatPrice(totalPrice)}</p></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 space-y-5">
                {[
                  { key: 'name', label: T.booking.name, type: 'text', required: true },
                  { key: 'email', label: T.booking.email, type: 'email', required: true },
                  { key: 'phone', label: T.booking.phone, type: 'tel', required: true },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">
                      {t(field.label, lang)}
                    </label>
                    <input
                      type={field.type}
                      required={field.required}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm font-medium"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">
                    {t(T.booking.notes, lang)}
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm resize-none"
                  />
                </div>

                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

                <p className="text-xs text-black/40">{t(T.booking.payOnSite, lang)}</p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-black text-white font-black text-base rounded-full hover:bg-black/80 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (lang === 'sk' ? 'Odosielam...' : 'Submitting...') : t(T.booking.submit, lang)}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
