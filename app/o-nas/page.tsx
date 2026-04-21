'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

export default function ONasPage() {
  const { lang } = useLang()

  return (
    <div className="pt-20 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <section className="py-16 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">{t(T.about.title, lang)}</h1>
          </motion.div>
        </div>
      </section>

      {/* About content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={fadeUp}>
                <p className="text-xl md:text-2xl leading-relaxed text-black/60 mb-8">
                  {t(T.about.description, lang)}
                </p>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { num: '4', label: { sk: 'Bowlingové dráhy', en: 'Bowling lanes' }, color: '#3B82F6' },
                    { num: '4', label: { sk: 'Biliardové stoly', en: 'Billiard tables' }, color: '#22C55E' },
                    { num: '4', label: { sk: 'Šípkové automaty', en: 'Dart machines' }, color: '#F59E0B' },
                  ].map((s) => (
                    <div key={s.label.sk}>
                      <div className="text-4xl font-black mb-1" style={{ color: s.color }}>{s.num}</div>
                      <div className="text-xs font-semibold text-black/40">{t(s.label, lang)}</div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/rezervacia"
                  className="inline-flex items-center px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-black/80 transition-all cursor-pointer"
                >
                  {t(T.nav.reservation, lang)}
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                {['/images/gallery-2.jpg', '/images/gallery-3.png', '/images/gallery-4.png', '/images/gallery-1.jpg'].map((src, i) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-2xl bg-black/5 ${i === 3 ? 'col-span-2' : ''}`}
                    style={{ aspectRatio: i === 3 ? '16/7' : '1/1' }}
                  >
                    <Image src={src} alt={`BBM ${i}`} fill className="object-cover" />
                  </div>
                ))}
              </motion.div>
            </div>
          </Section>
        </div>
      </section>
    </div>
  )
}
