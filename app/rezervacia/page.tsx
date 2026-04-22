'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'
import { supabase, PricingRule, Reservation, Closure, ResourceType } from '@/lib/supabase'
import { getSlotInfo, calculateTotalPrice, OPENING_HOURS } from '@/lib/pricing'
import { formatHour, formatPrice } from '@/lib/utils'
import Link from 'next/link'

const MAX_HOURS = 5

const SPORTS: Record<ResourceType, {
  label: { sk: string; en: string }
  desc: { sk: string; en: string }
  color: string
  unit: { sk: string; en: string }
  flatPrice: number | null
  perGame: boolean
}> = {
  bowling: {
    label: { sk: 'Bowling', en: 'Bowling' },
    desc: { sk: '4 profesionálne dráhy', en: '4 professional lanes' },
    color: '#3B82F6',
    unit: { sk: 'dráhy', en: 'lanes' },
    flatPrice: null,
    perGame: false,
  },
  billiard: {
    label: { sk: 'Biliard', en: 'Billiard' },
    desc: { sk: '4 biliardové stoly', en: '4 billiard tables' },
    color: '#22C55E',
    unit: { sk: 'stoly', en: 'tables' },
    flatPrice: 8.50,
    perGame: false,
  },
  darts: {
    label: { sk: 'Šípky', en: 'Darts' },
    desc: { sk: '4 elektronické automaty', en: '4 electronic machines' },
    color: '#F59E0B',
    unit: { sk: 'automaty', en: 'machines' },
    flatPrice: null,
    perGame: true,
  },
}

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

type Step = 'sport' | 'quantity' | 'date' | 'time' | 'form' | 'success'

export default function RezervaciaPage() {
  const { lang } = useLang()
  const today = new Date()

  const [step, setStep] = useState<Step>('sport')
  const [sport, setSport] = useState<ResourceType>('bowling')
  const [quantity, setQuantity] = useState(1)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [startHour, setStartHour] = useState<number | null>(null)
  const [duration, setDuration] = useState(1)
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [closures, setClosures] = useState<Closure[]>([])
  const [resources, setResources] = useState<{ id: string; number: number }[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [customDuration, setCustomDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step === 'date' || step === 'time') {
      supabase.from('pricing_rules').select('*').eq('resource_type', sport).then(({ data }) => {
        if (data) setPricingRules(data as PricingRule[])
      })
      supabase.from('resources').select('id,number').eq('type', sport).eq('is_active', true).then(({ data }) => {
        if (data) setResources(data as { id: string; number: number }[])
      })
    }
  }, [step, sport])

  const loadAvailability = useCallback(async (date: string) => {
    const [resResult, closResult] = await Promise.all([
      supabase.from('reservations').select('*').eq('date', date).in('status', ['pending', 'confirmed']),
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

  function getAvailableResourcesCount(hour: number, dur: number): number {
    return resources.filter(r => {
      for (let h = hour; h < hour + dur; h++) {
        const blocked = closures.some(c => c.resource_id === r.id && (h % 24) >= c.start_hour && (h % 24) < c.end_hour)
        if (blocked) return false
        const taken = reservations.some(res => res.resource_id === r.id && (h % 24) >= res.start_hour && (h % 24) < res.end_hour)
        if (taken) return false
      }
      return true
    }).length
  }

  function canBookSlot(hour: number, dur: number): boolean {
    if (!openHours || openHours.open === null || openHours.close === null) return false
    if (hour < openHours.open || hour + dur > openHours.close) return false
    if (sport === 'bowling') {
      const slotInfo = getSlotInfo(pricingRules, dayOfWeek, hour)
      if (slotInfo.tier === 'closed') return false
      for (let h = hour; h < hour + dur; h++) {
        if (getSlotInfo(pricingRules, dayOfWeek, h).tier === 'closed') return false
      }
    }
    return getAvailableResourcesCount(hour, dur) >= quantity
  }

  function getAvailableResources(hour: number, dur: number): { id: string; number: number }[] {
    return resources.filter(r => {
      for (let h = hour; h < hour + dur; h++) {
        const blocked = closures.some(c => c.resource_id === r.id && (h % 24) >= c.start_hour && (h % 24) < c.end_hour)
        if (blocked) return false
        const taken = reservations.some(res => res.resource_id === r.id && (h % 24) >= res.start_hour && (h % 24) < res.end_hour)
        if (taken) return false
      }
      return true
    }).slice(0, quantity)
  }

  function calcPrice(): number {
    if (!selectedDate || startHour === null) return 0
    const info = SPORTS[sport]
    if (info.perGame) return 0 // darts: coin-operated, no fixed price
    if (info.flatPrice !== null) return info.flatPrice * duration * quantity
    return calculateTotalPrice(pricingRules, dayOfWeek, startHour, duration) * quantity
  }

  const totalPrice = calcPrice()
  const isDarts = SPORTS[sport].perGame

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || startHour === null) return
    setSubmitting(true)
    setError(null)

    const selectedResources = getAvailableResources(startHour, duration)
    if (selectedResources.length < quantity) {
      setError(lang === 'sk' ? 'Nedostatok voľných miest. Vyberte iný čas.' : 'Not enough availability. Choose a different time.')
      setSubmitting(false)
      return
    }

    const pricePerResource = totalPrice / quantity

    const results = await Promise.all(
      selectedResources.map(r =>
        fetch('/api/rezervacia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: r.id,
            customer_name: form.name,
            customer_email: form.email,
            customer_phone: form.phone,
            notes: form.notes || null,
            date: selectedDate,
            start_hour: startHour,
            end_hour: startHour + duration,
            duration_hours: duration,
            total_price: pricePerResource,
            lane: r.number,
          }),
        }).then(res => res.json())
      )
    )

    const failed = results.find(r => r.error)
    if (failed) {
      setError(failed.error)
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

  const sportInfo = SPORTS[sport]

  function goBack() {
    if (step === 'quantity') setStep('sport')
    else if (step === 'date') setStep('quantity')
    else if (step === 'time') { setStep('date'); setStartHour(null) }
    else if (step === 'form') setStep('time')
  }

  const stepLabels = {
    sport: lang === 'sk' ? 'Vyberte šport' : 'Choose sport',
    quantity: lang === 'sk' ? 'Počet' : 'Quantity',
    date: lang === 'sk' ? 'Dátum' : 'Date',
    time: lang === 'sk' ? 'Čas' : 'Time',
    form: lang === 'sk' ? 'Údaje' : 'Details',
    success: '',
  }

  return (
    <div className="pt-20 bg-[#F5F5F5] min-h-screen">
      <section className="py-16 bg-white border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">{t(T.booking.title, lang)}</h1>
          </motion.div>
        </div>
      </section>

      {/* Step indicator */}
      {step !== 'success' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
          <div className="flex items-center gap-2">
            {(['sport', 'quantity', 'date', 'time', 'form'] as Step[]).map((s, i) => {
              const steps: Step[] = ['sport', 'quantity', 'date', 'time', 'form']
              const currentIndex = steps.indexOf(step)
              const isDone = i < currentIndex
              const isActive = s === step
              const labels: Record<Step, { sk: string; en: string }> = {
                sport:    { sk: 'Šport',  en: 'Sport' },
                quantity: { sk: 'Počet',  en: 'Count' },
                date:     { sk: 'Dátum',  en: 'Date' },
                time:     { sk: 'Čas',    en: 'Time' },
                form:     { sk: 'Údaje',  en: 'Details' },
                success:  { sk: '',       en: '' },
              }
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${isDone ? 'bg-black' : isActive ? 'bg-black' : 'bg-black/10'}`} />
                    <span className={`text-xs font-bold hidden sm:block transition-colors ${isActive ? 'text-black' : isDone ? 'text-black/40' : 'text-black/20'}`}>
                      {t(labels[s], lang)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <AnimatePresence mode="wait">

          {/* STEP: SPORT */}
          {step === 'sport' && (
            <motion.div key="sport" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

              {/* Custom reservation CTA */}
              <div className="bg-black rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-black text-white text-lg">{lang === 'sk' ? 'Potrebujete vlastnú rezerváciu?' : 'Need a custom booking?'}</p>
                  <p className="text-white/50 text-sm mt-1">{lang === 'sk' ? 'Skupiny, firemné akcie, celý večer — zavolajte nám.' : 'Groups, events, full evening — give us a call.'}</p>
                </div>
                <a
                  href="tel:+421919080420"
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-white text-black font-bold text-sm rounded-full hover:bg-white/90 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +421 919 080 420
                </a>
              </div>

              <h2 className="text-2xl font-black mb-6">{lang === 'sk' ? 'Vyberte šport' : 'Choose sport'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(SPORTS) as [ResourceType, typeof SPORTS[ResourceType]][]).map(([key, info]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSport(key); setStep('quantity') }}
                    className="relative bg-white rounded-3xl p-8 text-left hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-3xl" style={{ background: info.color }} />
                    <div className="text-4xl font-black mb-1" style={{ color: info.color }}>4</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(info.unit, lang)}</div>
                    <h3 className="text-2xl font-black mb-1">{t(info.label, lang)}</h3>
                    <p className="text-black/40 text-sm">{t(info.desc, lang)}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: info.color }}>
                      {lang === 'sk' ? 'Rezervovať' : 'Book'} →
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP: QUANTITY */}
          {step === 'quantity' && (
            <motion.div key="quantity" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={goBack} className="text-black/40 hover:text-black transition-colors cursor-pointer text-sm font-semibold">
                  ← {lang === 'sk' ? 'Späť' : 'Back'}
                </button>
                <h2 className="text-2xl font-black">
                  {t(sportInfo.label, lang)} — {lang === 'sk' ? 'koľko chcete?' : 'how many?'}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setQuantity(n); setStep('date') }}
                    className="bg-white rounded-3xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="text-6xl font-black mb-2" style={{ color: sportInfo.color }}>{n}</div>
                    <div className="text-sm font-semibold text-black/50">
                      {n === 1
                        ? (lang === 'sk' ? `1 ${t(sportInfo.unit, lang).slice(0, -1)}` : `1 ${t(sportInfo.unit, lang).slice(0, -1)}`)
                        : `${n} ${t(sportInfo.unit, lang)}`}
                    </div>
                  </motion.button>
                ))}

              </div>
            </motion.div>
          )}

          {/* STEP: DATE */}
          {step === 'date' && (
            <motion.div key="date" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={goBack} className="text-black/40 hover:text-black transition-colors cursor-pointer text-sm font-semibold">
                  ← {lang === 'sk' ? 'Späť' : 'Back'}
                </button>
                <h2 className="text-2xl font-black">{t(T.booking.selectDate, lang)}</h2>
                <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold" style={{ background: sportInfo.color + '20', color: sportInfo.color }}>
                  {t(sportInfo.label, lang)} × {quantity}
                </span>
              </div>

              <div className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer">‹</button>
                  <span className="font-black text-lg">{months[month]} {year}</span>
                  <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer">›</button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {weekdays.map(d => <div key={d} className="text-center text-xs font-bold text-black/30 py-2">{d}</div>)}
                </div>
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
                      >{day}</button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: TIME */}
          {step === 'time' && selectedDate && (
            <motion.div key="time" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={goBack} className="text-black/40 hover:text-black transition-colors cursor-pointer text-sm font-semibold">
                  ← {lang === 'sk' ? 'Späť' : 'Back'}
                </button>
                <h2 className="text-2xl font-black">{selectedDate}</h2>
                <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold" style={{ background: sportInfo.color + '20', color: sportInfo.color }}>
                  {t(sportInfo.label, lang)} × {quantity}
                </span>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-3xl p-6 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(T.booking.duration, lang)}</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(h => (
                    <button key={h} onClick={() => { setDuration(h); setStartHour(null) }}
                      className={`w-12 h-12 rounded-xl font-black transition-all cursor-pointer ${duration === h ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}
                    >{h}h</button>
                  ))}

                  {/* Custom hours input */}
                  <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 h-12">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customDuration}
                      placeholder={lang === 'sk' ? 'Iný počet' : 'Custom'}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '')
                        setCustomDuration(raw)
                        if (raw === '') return
                        const v = parseInt(raw)
                        const maxH = openHours ? (openHours.close ?? 24) - (openHours.open ?? 0) : 12
                        if (v >= 1 && v <= maxH) { setDuration(v); setStartHour(null) }
                      }}
                      className="w-20 bg-transparent text-sm font-bold focus:outline-none placeholder:text-black/30"
                    />
                    <span className="text-xs text-black/40">hod</span>
                  </div>

                  {/* Celý deň */}
                  <button
                    onClick={() => {
                      if (!openHours || openHours.open === null || openHours.close === null) return
                      const fullDay = openHours.close - openHours.open
                      setDuration(fullDay)
                      setStartHour(openHours.open)
                    }}
                    className={`px-4 h-12 rounded-xl font-black text-sm transition-all cursor-pointer ${
                      openHours && duration === (openHours.close ?? 0) - (openHours.open ?? 0)
                        ? 'bg-black text-white'
                        : 'bg-black/5 hover:bg-black/10'
                    }`}
                  >
                    {lang === 'sk' ? 'Celý deň' : 'Full day'}
                  </button>
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
                      const available = canBookSlot(h, duration)
                      const isSelected = startHour === h
                      const info = sport === 'bowling' ? getSlotInfo(pricingRules, dayOfWeek, h % 24) : null
                      const bgColor = available
                        ? (info ? info.color : sportInfo.color)
                        : '#e5e5e5'
                      const price = info?.price ?? (sportInfo.flatPrice ?? null)
                      return (
                        <button
                          key={h}
                          disabled={!available}
                          onClick={() => setStartHour(h)}
                          className={`relative rounded-xl p-2 text-center transition-all cursor-pointer ${!available ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'} ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}`}
                          style={{ background: bgColor }}
                        >
                          <div className="text-sm font-black text-white drop-shadow">{formatHour(h)}</div>
                          {price && <div className="text-xs text-white/80 drop-shadow">{price}€</div>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {sport === 'bowling' && (
                  <div className="flex gap-4 mt-4 flex-wrap">
                    {[{ c: '#F59E0B', l: '12,90 €' }, { c: '#22C55E', l: '18,90 €' }, { c: '#3B82F6', l: '24,90 €' }].map(x => (
                      <div key={x.l} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm" style={{ background: x.c }} />
                        <span className="text-xs text-black/40">{x.l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {startHour !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black rounded-3xl p-6 flex items-center justify-between">
                  <div className="text-white">
                    <p className="font-bold">{formatHour(startHour)} – {formatHour(startHour + duration)}</p>
                    <p className="text-white/50 text-sm">{t(sportInfo.label, lang)} × {quantity} · {duration}h</p>
                    {isDarts
                      ? <p className="text-lg font-black mt-1 text-[#F59E0B]">0,25 € / hra</p>
                      : <p className="text-2xl font-black mt-1">{formatPrice(totalPrice)}</p>
                    }
                    <p className="text-white/40 text-xs mt-1">{t(T.booking.payOnSite, lang)}</p>
                  </div>
                  <button onClick={() => setStep('form')} className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all cursor-pointer">
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
                <button onClick={goBack} className="text-black/40 hover:text-black transition-colors cursor-pointer text-sm font-semibold">
                  ← {lang === 'sk' ? 'Späť' : 'Back'}
                </button>
                <h2 className="text-2xl font-black">{lang === 'sk' ? 'Vaše údaje' : 'Your details'}</h2>
              </div>

              <div className="bg-black text-white rounded-3xl p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-white/40 text-xs">{lang === 'sk' ? 'Šport' : 'Sport'}</p><p className="font-bold">{t(sportInfo.label, lang)} × {quantity}</p></div>
                  <div><p className="text-white/40 text-xs">{lang === 'sk' ? 'Dátum' : 'Date'}</p><p className="font-bold">{selectedDate}</p></div>
                  <div><p className="text-white/40 text-xs">{lang === 'sk' ? 'Čas' : 'Time'}</p><p className="font-bold">{formatHour(startHour ?? 0)} – {formatHour((startHour ?? 0) + duration)}</p></div>
                  <div><p className="text-white/40 text-xs">{t(T.booking.totalPrice, lang)}</p><p className="font-black text-xl">{isDarts ? '0,25 € / hra' : formatPrice(totalPrice)}</p></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 space-y-5">
                {[
                  { key: 'name', label: T.booking.name, type: 'text', required: true },
                  { key: 'email', label: T.booking.email, type: 'email', required: true },
                  { key: 'phone', label: T.booking.phone, type: 'tel', required: true },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">{t(field.label, lang)}</label>
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
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">{t(T.booking.notes, lang)}</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm resize-none" />
                </div>
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                <p className="text-xs text-black/40">{t(T.booking.payOnSite, lang)}</p>
                <button type="submit" disabled={submitting}
                  className="w-full py-4 bg-black text-white font-black text-base rounded-full hover:bg-black/80 transition-all cursor-pointer disabled:opacity-50">
                  {submitting ? (lang === 'sk' ? 'Odosielam...' : 'Submitting...') : t(T.booking.submit, lang)}
                </button>
              </form>
            </motion.div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-12 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#03AED220' }}>
                <svg className="w-10 h-10" fill="none" stroke="#03AED2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black mb-3">{lang === 'sk' ? 'Skontrolujte email!' : 'Check your email!'}</h2>
              <p className="text-black/50 mb-2">{lang === 'sk' ? `Poslali sme vám email na ${form.email}` : `We sent an email to ${form.email}`}</p>
              <p className="text-black/40 text-sm mb-8">{lang === 'sk' ? 'Kliknite na odkaz v emaili pre potvrdenie rezervácie.' : 'Click the link in the email to confirm your booking.'}</p>
              <button
                onClick={() => { setStep('sport'); setSelectedDate(null); setStartHour(null); setForm({ name: '', email: '', phone: '', notes: '' }) }}
                className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-black/80 transition-all cursor-pointer"
              >
                {lang === 'sk' ? 'Nová rezervácia' : 'New booking'}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
