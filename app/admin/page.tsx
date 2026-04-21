'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, Reservation } from '@/lib/supabase'
import { formatHour, formatPrice } from '@/lib/utils'

type Tab = 'dnes' | 'vsetky' | 'uzavretia'

interface ResourceRow { id: string; name: string; type: string; number: number }

const HOURS_DISPLAY = Array.from({ length: 15 }, (_, i) => i + 12) // 12–26

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dnes')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [todayRes, setTodayRes] = useState<Reservation[]>([])
  const [resources, setResources] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const [closureForm, setClosureForm] = useState({ resource_id: '', date: '', start_hour: '14', end_hour: '16', reason: '' })
  const [closureMsg, setClosureMsg] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/admin/login'); return }
    setUser({ email: session.user.email })
  }, [router])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [resAll, resToday, resResources] = await Promise.all([
      supabase.from('reservations').select('*, resources(name, type, number)').order('date', { ascending: false }).order('start_hour', { ascending: true }),
      supabase.from('reservations').select('*, resources(name, type, number)').eq('date', selectedDate).eq('status', 'confirmed').order('start_hour', { ascending: true }),
      supabase.from('resources').select('id,name,type,number').order('type').order('number'),
    ])
    if (resAll.data) setReservations(resAll.data as Reservation[])
    if (resToday.data) setTodayRes(resToday.data as Reservation[])
    if (resResources.data) setResources(resResources.data as ResourceRow[])
    setLoading(false)
  }, [selectedDate])

  useEffect(() => { checkAuth(); loadAll() }, [checkAuth, loadAll])

  async function cancelReservation(id: string) {
    if (!confirm('Zrušiť túto rezerváciu?')) return
    await supabase.from('reservations').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id)
    loadAll()
  }

  async function addClosure(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('closures').insert({
      resource_id: closureForm.resource_id,
      date: closureForm.date,
      start_hour: parseInt(closureForm.start_hour),
      end_hour: parseInt(closureForm.end_hour),
      reason: closureForm.reason || null,
    })
    setClosureMsg(error ? 'Chyba: ' + error.message : 'Uzavretie uložené!')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Find reservation for a specific resource+hour
  function getResForSlot(resourceId: string, hour: number, resList: Reservation[]) {
    return resList.find(r =>
      r.resource_id === resourceId &&
      hour >= r.start_hour &&
      hour < r.end_hour &&
      r.status === 'confirmed'
    ) ?? null
  }

  const confirmed = reservations.filter(r => r.status === 'confirmed')
  const todayRevenue = todayRes.reduce((s, r) => s + (r.total_price ?? 0), 0)
  const bowlingRes = resources.filter(r => r.type === 'bowling')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dnes', label: 'Dnes' },
    { key: 'vsetky', label: 'Všetky rezervácie' },
    { key: 'uzavretia', label: 'Uzavretia' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-1">Admin panel</p>
            <h1 className="text-3xl font-black">Dashboard</h1>
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
            { label: 'Dnes rezervácií', val: todayRes.length, color: '#3B82F6' },
            { label: 'Dnes príjem', val: formatPrice(todayRevenue), color: '#22C55E' },
            { label: 'Celkom potvrdené', val: confirmed.length, color: '#F59E0B' },
            { label: 'Celkom príjem', val: formatPrice(confirmed.reduce((s, r) => s + (r.total_price ?? 0), 0)), color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs text-black/40 font-semibold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer
                ${tab === t.key ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-black/40">Načítavam...</div>}

        {/* ===== TAB: DNES ===== */}
        {!loading && tab === 'dnes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Date picker */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">Dátum</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-white rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm font-semibold cursor-pointer"
              />
              <button
                onClick={() => setSelectedDate(todayStr())}
                className="px-4 py-2 text-xs font-bold bg-black/5 hover:bg-black/10 rounded-full transition-all cursor-pointer"
              >
                Dnes
              </button>
            </div>

            {/* Quick reservation list for the day */}
            {todayRes.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-black/30 font-semibold">
                Na {selectedDate} nie sú žiadne rezervácie.
              </div>
            ) : (
              <div className="space-y-2">
                {todayRes.map(res => {
                  const resource = res.resources as { name?: string; type?: string } | undefined
                  return (
                    <div key={res.id} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Time badge */}
                        <div className="shrink-0 bg-black text-white text-xs font-black px-3 py-2 rounded-xl text-center leading-tight">
                          <div>{formatHour(res.start_hour)}</div>
                          <div className="text-white/50">–{formatHour(res.end_hour)}</div>
                        </div>
                        {/* Resource badge */}
                        <div
                          className="shrink-0 text-white text-xs font-black px-3 py-2 rounded-xl"
                          style={{ background: resource?.type === 'bowling' ? '#3B82F6' : resource?.type === 'billiard' ? '#22C55E' : '#F59E0B' }}
                        >
                          {resource?.name ?? '—'}
                        </div>
                        {/* Customer */}
                        <div className="min-w-0">
                          <p className="font-black text-sm truncate">{res.customer_name}</p>
                          <p className="text-xs text-black/40 truncate">{res.customer_phone} · {res.customer_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-sm">{formatPrice(res.total_price ?? 0)}</span>
                        <button
                          onClick={() => cancelReservation(res.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-full hover:bg-red-100 transition-all cursor-pointer"
                        >
                          Zrušiť
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* BOWLING LANES CALENDAR */}
            <div className="bg-white rounded-3xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-4">
                Bowling — obsadenosť dráh
              </h3>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Hour header */}
                  <div className="flex mb-1">
                    <div className="w-20 shrink-0" />
                    {HOURS_DISPLAY.map(h => (
                      <div key={h} className="flex-1 text-center text-xs text-black/30 font-mono">
                        {h < 24 ? h : h - 24}
                      </div>
                    ))}
                  </div>
                  {/* Lane rows */}
                  {bowlingRes.map(lane => (
                    <div key={lane.id} className="flex mb-1 items-center">
                      <div className="w-20 shrink-0 text-xs font-bold text-black/50 pr-2">{lane.name}</div>
                      {HOURS_DISPLAY.map(h => {
                        const res = getResForSlot(lane.id, h, todayRes)
                        const isStart = res && res.start_hour === h
                        return (
                          <div
                            key={h}
                            className="flex-1 h-8 mx-px rounded-sm flex items-center overflow-hidden"
                            style={{
                              background: res ? '#3B82F6' : '#F5F5F5',
                              opacity: res ? 1 : 1,
                            }}
                            title={res ? `${res.customer_name} (${formatHour(res.start_hour)}–${formatHour(res.end_hour)})` : ''}
                          >
                            {isStart && (
                              <span className="text-white text-[10px] font-bold px-1 truncate leading-none">
                                {res!.customer_name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3B82F6] inline-block" /><span className="text-xs text-black/40">Obsadené</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#F5F5F5] border border-black/10 inline-block" /><span className="text-xs text-black/40">Voľné</span></div>
              </div>
            </div>

            {/* Summary by resource type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: 'bowling', label: 'Bowling dráhy', color: '#3B82F6' },
                { type: 'billiard', label: 'Biliard stoly', color: '#22C55E' },
                { type: 'darts', label: 'Šípky', color: '#F59E0B' },
              ].map(rt => {
                const count = todayRes.filter(r => (r.resources as { type?: string })?.type === rt.type).length
                return (
                  <div key={rt.type} className="bg-white rounded-2xl p-5">
                    <div className="text-3xl font-black mb-1" style={{ color: rt.color }}>{count}</div>
                    <div className="text-xs font-semibold text-black/40 uppercase tracking-wider">{rt.label} dnes</div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ===== TAB: VŠETKY ===== */}
        {!loading && tab === 'vsetky' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {reservations.length === 0 && <p className="text-black/40">Žiadne rezervácie.</p>}
            {reservations.map(res => {
              const resource = res.resources as { name?: string } | undefined
              return (
                <div
                  key={res.id}
                  className={`bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${res.status === 'cancelled' ? 'opacity-40' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`w-2 h-2 rounded-full inline-block ${res.status === 'confirmed' ? 'bg-[#22C55E]' : 'bg-red-400'}`} />
                      <span className="font-black text-sm">{res.customer_name}</span>
                      <span className="text-xs text-black/30 font-mono bg-black/5 px-2 py-0.5 rounded-full">{res.date}</span>
                    </div>
                    <div className="text-sm text-black/60 mb-1">
                      <span className="font-bold">{formatHour(res.start_hour)} – {formatHour(res.end_hour)}</span>
                      {' · '}{resource?.name ?? '—'}
                      {' · '}<span className="font-bold">{formatPrice(res.total_price ?? 0)}</span>
                    </div>
                    <div className="text-xs text-black/40">
                      {res.customer_email} · {res.customer_phone}
                    </div>
                  </div>
                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => cancelReservation(res.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-full hover:bg-red-100 transition-all cursor-pointer shrink-0"
                    >
                      Zrušiť
                    </button>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ===== TAB: UZAVRETIA ===== */}
        {!loading && tab === 'uzavretia' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-3xl p-8 max-w-lg">
              <h2 className="text-xl font-black mb-2">Pridať uzavretie</h2>
              <p className="text-sm text-black/40 mb-6">Zablokuje časový slot — zákazníci si ho nebudú môcť rezervovať.</p>
              <form onSubmit={addClosure} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Zdroj</label>
                  <select
                    required
                    value={closureForm.resource_id}
                    onChange={e => setClosureForm(f => ({ ...f, resource_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
                  >
                    <option value="">Vybrať...</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Dátum</label>
                  <input
                    type="date"
                    required
                    value={closureForm.date}
                    onChange={e => setClosureForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Od (hod)</label>
                    <input type="number" min={0} max={26} required value={closureForm.start_hour}
                      onChange={e => setClosureForm(f => ({ ...f, start_hour: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Do (hod)</label>
                    <input type="number" min={1} max={26} required value={closureForm.end_hour}
                      onChange={e => setClosureForm(f => ({ ...f, end_hour: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Dôvod (nepovinné)</label>
                  <input type="text" value={closureForm.reason}
                    onChange={e => setClosureForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
                  />
                </div>
                {closureMsg && <p className="text-sm font-semibold text-[#22C55E]">{closureMsg}</p>}
                <button type="submit" className="w-full py-4 bg-black text-white font-black rounded-full hover:bg-black/80 transition-all cursor-pointer">
                  Uložiť uzavretie
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
