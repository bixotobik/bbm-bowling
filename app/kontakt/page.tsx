'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

const hours = [
  { day: { sk: 'Pondelok', en: 'Monday' }, time: '14:00 – 00:00' },
  { day: { sk: 'Utorok – Štvrtok', en: 'Tuesday – Thursday' }, time: '14:00 – 00:00' },
  { day: { sk: 'Piatok – Sobota', en: 'Friday – Saturday' }, time: '13:00 – 02:00' },
  { day: { sk: 'Nedeľa', en: 'Sunday' }, time: '13:00 – 22:00' },
]

export default function KontaktPage() {
  const { lang } = useLang()

  return (
    <div className="pt-20 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <section className="py-16 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">{t(T.contact.title, lang)}</h1>
          </motion.div>
        </div>
      </section>

      {/* Contact info + map */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Info */}
              <div className="space-y-8">
                {/* Address */}
                <motion.div variants={fadeUp} className="bg-white rounded-3xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">{t(T.contact.address, lang)}</p>
                      <p className="font-bold text-lg">Priemyselná 5863, 1. poschodie</p>
                      <p className="text-black/50">Malacky 901 01</p>
                    </div>
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={fadeUp} className="bg-white rounded-3xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">{t(T.contact.phone, lang)}</p>
                      <a href="tel:+421919080420" className="font-bold text-lg hover:text-black/60 transition-colors">+421 919 080 420</a>
                    </div>
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div variants={fadeUp} className="bg-white rounded-3xl p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">{t(T.contact.email, lang)}</p>
                      <a href="mailto:bowlingmalacky@gmail.com" className="font-bold text-lg hover:text-black/60 transition-colors">bowlingmalacky@gmail.com</a>
                    </div>
                  </div>
                </motion.div>

                {/* Opening hours */}
                <motion.div variants={fadeUp} className="bg-white rounded-3xl p-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(T.contact.hours, lang)}</p>
                  <div className="space-y-3">
                    {hours.map((h) => (
                      <div key={h.day.sk} className="flex justify-between items-center py-2 border-b border-black/5 last:border-0">
                        <span className="font-semibold text-sm text-black/70">{t(h.day, lang)}</span>
                        <span className="font-black text-sm">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Map */}
              <div className="space-y-6">
                <motion.div variants={fadeUp}>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(T.contact.navigation, lang)}</p>
                  <div className="rounded-3xl overflow-hidden shadow-lg h-80 md:h-96 mb-4">
                    <iframe
                      src="https://maps.google.com/maps?q=Priemyselná+5863,+901+01+Malacky&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      title="BBM Bowling Malacky mapa"
                    />
                  </div>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=BBM+Bowling+Bar+Malacky,+Priemyselná+5863,+Malacky"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-full hover:bg-black/80 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {t(T.contact.navigateBtn, lang)}
                  </a>
                </motion.div>

                {/* Legal info */}
                <motion.div variants={fadeUp} className="bg-white rounded-3xl p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">
                    {lang === 'sk' ? 'Firemné údaje' : 'Company Info'}
                  </p>
                  <div className="text-sm text-black/50 space-y-1">
                    <p>BBM s.r.o.</p>
                    <p>Mgr. Josef Smolínský</p>
                    <p>IČO: 50327178</p>
                    <p>DIČ: 2120283880</p>
                    <p>Lekárska Nová Ves 61 908 76</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </Section>
        </div>
      </section>
    </div>
  )
}
