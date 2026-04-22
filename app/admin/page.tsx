'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Reservation } from '@/lib/supabase'
import { formatHour, formatPrice } from '@/lib/utils'

interface ResourceRow { id: string; name: string; type: string; number: number }

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function todayStr() {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

const MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December']
const WEEKDAYS = ['Ne','Po','Ut','St','Št','Pi','So']

const SPORT_COLORS: Record<string, string> = {
  bowling: '#3B82F6',
  billiard: '#22C55E',
  darts: '#F59E0B',
}
const SPORT_LABELS: Record<string, string> = {
  bowling: 'Bowling',
  billiard: 'Biliard',
  darts: 'Šípky',
}

export default function AdminPage() {
  const router = useRouter()
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [dayReservations, setDayReservations] = useState<Reservation[]>([])
  const [resources, setResources] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [showDay, setShowDay] = useState(false)

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/admin/login'); return }
    setUser({ email: session.user.email })
  }, [router])

  const loadMonth = useCallback(async () => {
    setLoading(true)
    const from = toDateStr(calYear, calMonth, 1)
    const to = toDateStr(calYear, calMonth, getDaysInMonth(calYear, calMonth))
    const [resMonth, resResources] = await Promise.all([
      supabase.from('reservations').select('*, resources(name,type,number)')
        .gte('date', from).lte('date', to)
        .in('status', ['confirmed', 'pending'])
        .order('start_hour'),
      supabase.from('resources').select('id,name,type,number').order('type').order('number'),
    ])
    if (resMonth.data) setReservations(resMonth.data as Reservation[])
    if (resResources.data) setResources(resResources.data as ResourceRow[])
    setLoading(false)
  }, [calYear, calMonth])

  const loadDay = useCallback(async (date: string) => {
    const { data } = await supabase.from('reservations')
      .select('*, resources(name,type,number)')
      .eq('date', date)
      .in('status', ['confirmed', 'pending'])
      .order('start_hour')
    if (data) setDayReservations(data as Reservation[])
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => { loadMonth() }, [loadMonth])
  useEffect(() => { if (selectedDate) loadDay(selectedDate) }, [selectedDate, loadDay])

  async function cancelReservation(id: string) {
    if (!confirm('Zrušiť túto rezerváciu?')) return
    await supabase.from('reservations').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id)
    loadMonth()
    loadDay(selectedDate)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Group reservations by date
  const resByDate: Record<string, Reservation[]> = {}
  reservations.forEach(r => {
    if (!resByDate[r.date]) resByDate[r.date] = []
    resByDate[r.date].push(r)
  })

  // Stats
  const todayResAll = reservations.filter(r => r.date === todayStr())
  const todayRevenue = todayResAll.reduce((s, r) => s + (r.total_price ?? 0), 0)
  const monthRevenue = reservations.reduce((s, r) => s + (r.total_price ?? 0), 0)

  // Day detail grouped by sport
  const sportTypes = ['bowling', 'billiard', 'darts']
  const dayBySport = sportTypes.map(type => ({
    type,
    items: dayReservations.filter(r => (r.resources as any)?.type === type).sort((a, b) => a.start_hour - b.start_hour),
  })).filter(g => g.items.length > 0)

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDay(calYear, calMonth)

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr)
    setShowDay(true)
  }

  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null
  const selectedLabel = selectedDateObj
    ? `${selectedDateObj.getDate()}. ${MONTHS[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()}`
    : ''

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-1">BBM</p>
            <h1 className="text-3xl font-black">Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-black/40 hidden sm:block">{user?.email}</span>
            <button onClick={signOut} className="px-4 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-black/80 cursor-pointer">
              Odhlásiť
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Dnes rezervácií', val: todayResAll.length, color: '#3B82F6' },
            { label: 'Dnes príjem', val: formatPrice(todayRevenue), color: '#22C55E' },
            { label: 'Mesiac rezervácií', val: reservations.length, color: '#F59E0B' },
            { label: 'Mesiac príjem', val: formatPrice(monthRevenue), color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs text-black/40 font-semibold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* Calendar */}
          <div className="bg-white rounded-3xl p-6">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer text-lg"
              >‹</button>
              <h2 className="text-xl font-black">{MONTHS[calMonth]} {calYear}</h2>
              <button
                onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 cursor-pointer text-lg"
              >›</button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-bold text-black/30 py-2">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr = toDateStr(calYear, calMonth, day)
                const isToday = dateStr === todayStr()
                const isSelected = dateStr === selectedDate
                const dayRes = resByDate[dateStr] ?? []
                const sportSet = [...new Set(dayRes.map(r => (r.resources as any)?.type).filter(Boolean))]
                const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                return (
                  <button
                    key={day}
                    onClick={() => selectDay(dateStr)}
                    className={`relative flex flex-col items-center py-2 px-1 rounded-2xl transition-all cursor-pointer min-h-[56px]
                      ${isSelected ? 'bg-black text-white' : isToday ? 'bg-black/5 font-black' : 'hover:bg-black/5'}
                      ${isPast && !isSelected ? 'opacity-40' : ''}
                    `}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : isPast ? 'text-black/40' : 'text-black'} ${isToday && !isSelected ? 'font-black' : ''}`}>
                      {day}
                    </span>
                    {dayRes.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {sportSet.map(type => (
                          <span
                            key={type}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isSelected ? 'white' : SPORT_COLORS[type] }}
                          />
                        ))}
                      </div>
                    )}
                    {dayRes.length > 0 && (
                      <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/70' : 'text-black/30'}`}>
                        {dayRes.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-black/5">
              {Object.entries(SPORT_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SPORT_COLORS[type] }} />
                  <span className="text-xs text-black/40 font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail */}
          <div className="bg-white rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg">{selectedLabel}</h3>
              {dayReservations.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 bg-black text-white rounded-full">
                  {dayReservations.length} rezerv.
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-black/30 text-sm">Načítavam...</div>
            ) : dayReservations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-black/40 text-sm font-semibold">Žiadne rezervácie</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {dayBySport.length > 0 ? dayBySport.map(group => (
                  <div key={group.type}>
                    {/* Sport header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: SPORT_COLORS[group.type] }} />
                      <span className="text-xs font-black uppercase tracking-widest text-black/40">
                        {SPORT_LABELS[group.type]}
                      </span>
                    </div>

                    {/* Reservation cards */}
                    <div className="space-y-2">
                      {group.items.map(res => (
                        <motion.div
                          key={res.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#F5F5F5] rounded-2xl p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className="font-black text-sm">{res.customer_name}</p>
                              <p className="text-xs text-black/40 mt-0.5">
                                {SPORT_LABELS[group.type]} {(res.resources as any)?.number} · {formatHour(res.start_hour)} – {formatHour(res.end_hour)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-sm">{res.total_price ? formatPrice(res.total_price) : '–'}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {res.status === 'confirmed' ? 'Potvrdené' : 'Čaká'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-black/50">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <a href={`tel:${res.customer_phone}`} className="hover:text-black transition-colors">{res.customer_phone}</a>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a href={`mailto:${res.customer_email}`} className="hover:text-black transition-colors truncate">{res.customer_email}</a>
                            </div>
                            {res.notes && (
                              <div className="flex items-start gap-1.5">
                                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>{res.notes}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => cancelReservation(res.id)}
                            className="mt-3 w-full py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          >
                            Zrušiť rezerváciu
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-black/40">Žiadne rezervácie pre tento deň.</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
