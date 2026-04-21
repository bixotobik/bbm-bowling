'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

// Pricing grid data — rows=days, cols=hours 12..26
const HOURS = Array.from({ length: 15 }, (_, i) => i + 12) // 12..26 (02:00)

type SlotColor = 'orange' | 'green' | 'blue' | 'black' | 'empty'

function getSlotColor(day: number, hour: number): SlotColor {
  // 0=Mon,1=Tue,2=Wed,3=Thu,4=Fri,5=Sat,6=Sun
  if (day <= 3) { // Mon-Thu
    if (hour < 14) return 'black'
    if (hour < 16) return 'orange'
    if (hour < 18) return 'green'
    if (hour < 24) return 'blue'
    return 'black'
  }
  if (day === 4) { // Fri
    if (hour < 13) return 'black'
    if (hour < 16) return 'orange'
    if (hour < 18) return 'green'
    if (hour < 26) return 'blue'
    return 'black'
  }
  if (day === 5) { // Sat
    if (hour < 13) return 'black'
    if (hour < 16) return 'green'
    if (hour < 26) return 'blue'
    return 'black'
  }
  // Sun
  if (hour < 13) return 'black'
  if (hour < 16) return 'green'
  if (hour < 22) return 'blue'
  return 'black'
}

const COLOR_MAP: Record<SlotColor, string> = {
  orange: '#F59E0B',
  green: '#22C55E',
  blue: '#3B82F6',
  black: '#1a1a1a',
  empty: 'transparent',
}

const DAYS_SK = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa']
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CennikPage() {
  const { lang } = useLang()
  const days = lang === 'sk' ? DAYS_SK : DAYS_EN

  return (
    <div className="pt-20 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <section className="py-16 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">{t(T.pricing.title, lang)}</h1>
          </motion.div>
        </div>
      </section>

      {/* BOWLING */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp} className="mb-8">
              <h2 className="text-3xl md:text-4xl font-black mb-2">{t(T.pricing.bowling, lang)}</h2>
              <p className="text-black/40 text-sm">{t(T.pricing.perLane, lang)}</p>
            </motion.div>

            {/* Notice */}
            <motion.div variants={fadeUp} className="mb-8 bg-black text-white rounded-2xl p-5 max-w-xl">
              <p className="font-bold text-sm">{t(T.pricing.notice, lang)}</p>
              <p className="text-white/60 text-xs mt-1">
                {lang === 'sk'
                  ? 'Ak sa zákazník nedostaví včas, rezervácia bude zrušená.'
                  : 'If the customer does not arrive on time, the booking will be cancelled.'}
              </p>
            </motion.div>

            {/* Pricing grid */}
            <motion.div variants={fadeUp} className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[640px]">
                {/* Hour header */}
                <div className="flex mb-1">
                  <div className="w-24 shrink-0" />
                  {HOURS.map((h) => (
                    <div key={h} className="flex-1 text-center text-xs text-black/30 font-mono min-w-[32px]">
                      {h < 24 ? `${h}` : `${h - 24}`}
                    </div>
                  ))}
                </div>

                {/* Day rows */}
                {days.map((day, di) => (
                  <div key={day} className="flex mb-1 items-center">
                    <div className="w-24 shrink-0 text-xs font-semibold text-black/60 pr-2 truncate">{day}</div>
                    {HOURS.map((h) => {
                      const color = getSlotColor(di, h)
                      return (
                        <div
                          key={h}
                          className="flex-1 h-7 rounded-sm mx-0.5 min-w-[28px]"
                          style={{ background: COLOR_MAP[color], opacity: color === 'black' ? 0.85 : 1 }}
                          title={`${day} ${h < 24 ? h : h - 24}:00`}
                        />
                      )
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  {[
                    { color: '#F59E0B', label: '12,90 €' },
                    { color: '#22C55E', label: '18,90 €' },
                    { color: '#3B82F6', label: '24,90 €' },
                    { color: '#1a1a1a', label: lang === 'sk' ? 'Zatvorené' : 'Closed' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-sm inline-block" style={{ background: l.color }} />
                      <span className="text-xs font-semibold text-black/60">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Extra prices */}
            <motion.div variants={fadeUp} className="mt-8 grid grid-cols-2 gap-4 max-w-sm">
              <div className="bg-white rounded-2xl p-4">
                <div className="text-xs text-black/40 mb-1">{t(T.pricing.shoeRental, lang)}</div>
                <div className="text-2xl font-black">1,50 €</div>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <div className="text-xs text-black/40 mb-1">{t(T.pricing.laneWax, lang)}</div>
                <div className="text-2xl font-black">2,50 €</div>
              </div>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-4 text-xs text-black/40 italic">
              {t(T.pricing.holidayNote, lang)}
            </motion.p>
          </Section>
        </div>
      </section>

      {/* BILLIARD + DARTS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Billiard */}
              <motion.div variants={fadeUp} className="bg-[#F5F5F5] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#22C55E]" />
                <div className="w-16 h-16 bg-[#22C55E]/10 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                    <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
                  </svg>
                </div>
                <h3 className="text-3xl font-black mb-1">{t(T.pricing.billiard, lang)}</h3>
                <p className="text-black/40 text-sm mb-6">{t(T.pricing.perTable, lang)}</p>
                <div className="text-5xl font-black mb-2">8,50 €</div>
                <div className="text-sm text-black/40">{t(T.pricing.billedPer15, lang)}</div>
              </motion.div>

              {/* Darts */}
              <motion.div variants={fadeUp} className="bg-[#F5F5F5] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B]" />
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                    <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                    <line x1="12" y1="2" x2="12" y2="9" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black mb-1">{t(T.pricing.darts, lang)}</h3>
                <p className="text-black/40 text-sm mb-6">{t(T.pricing.dartsGame, lang)}</p>
                <div className="text-5xl font-black mb-2">0,25 €</div>
                <div className="text-sm text-black/40">{t(T.pricing.dartsCoin, lang)}</div>
              </motion.div>
            </div>
          </Section>
        </div>
      </section>
    </div>
  )
}
