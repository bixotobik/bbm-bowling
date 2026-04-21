'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'

function checkIsOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  const h = now.getHours()
  // After midnight: Sat 00-02 = Fri night still open, Sun 00-02 = Sat night still open
  if (h < 2) {
    const prev = day === 0 ? 6 : day - 1
    return prev === 5 || prev === 6
  }
  if (day === 0) return h >= 13 && h < 22
  if (day >= 1 && day <= 4) return h >= 14
  if (day === 5 || day === 6) return h >= 13
  return false
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const { lang } = useLang()
  const open = checkIsOpen()

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#F5F5F5]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ top: '15%', right: '8%', width: 400, height: 400, border: '1.5px solid rgba(0,0,0,0.06)' }}
          animate={{ scale: [1, 1.05, 1], rotate: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute rounded-full pointer-events-none bg-black/[0.03]"
          style={{ bottom: '20%', right: '20%', width: 160, height: 160 }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-4xl">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full bg-black/5 border border-black/10">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: open ? '#50C878' : '#EF4444' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-black/60">Malacky, Slovakia</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: open ? '#50C87820' : '#EF444420', color: open ? '#22a85a' : '#dc2626' }}>
                {open ? (lang === 'sk' ? 'Otvorené' : 'Open') : (lang === 'sk' ? 'Zatvorené' : 'Closed')}
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight text-black mb-6">
              Bowling<br />
              <span style={{ color: '#03AED2' }}>Bar</span>{' '}<span>Malacky</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-black/50 mb-10 max-w-xl leading-relaxed">
              {t(T.hero.description, lang)}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/rezervacia" className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-bold text-base rounded-full hover:bg-black/80 transition-all duration-200 cursor-pointer">
                {t(T.hero.cta, lang)}
              </Link>
              <Link href="/cennik" className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-black font-bold text-base rounded-full border-2 border-black/20 hover:border-black/50 transition-all duration-200 cursor-pointer">
                {t(T.nav.pricing, lang)}
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-20 grid grid-cols-3 gap-6 max-w-sm"
          >
            {[
              { val: '4', label: { sk: 'Dráhy', en: 'Lanes' } },
              { val: '4', label: { sk: 'Biliardy', en: 'Billiards' } },
              { val: '4', label: { sk: 'Šípky', en: 'Darts' } },
            ].map((s) => (
              <div key={s.label.sk}>
                <div className="text-4xl font-black text-black mb-1">{s.val}</div>
                <div className="text-xs font-semibold text-black/40 uppercase tracking-wider">{t(s.label, lang)}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute inset-y-0 right-0 w-1/3 hidden lg:block overflow-hidden">
          <div className="relative h-full">
            <Image src="/images/gallery-hero.jpg" alt="BBM Bowling" fill className="object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#F5F5F5] to-transparent" />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp} className="mb-14 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t(T.services.title, lang)}</h2>
              </div>
              <Link href="/cennik" className="hidden md:inline text-sm font-semibold text-black/40 hover:text-black transition-colors cursor-pointer">
                {t(T.nav.pricing, lang)} →
              </Link>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { color: '#3B82F6', num: 4, unit: { sk: 'DRÁHY', en: 'LANES' }, title: T.services.bowling.title, desc: T.services.bowling.desc, price: null, priceLine: '12,90 – 24,90 €/hod' },
                { color: '#22C55E', num: 4, unit: { sk: 'STOLY', en: 'TABLES' }, title: T.services.billiard.title, desc: T.services.billiard.desc, price: '8,50 €', priceLine: '/hod' },
                { color: '#F59E0B', num: 4, unit: { sk: 'AUTOMATY', en: 'MACHINES' }, title: T.services.darts.title, desc: T.services.darts.desc, price: '0,25 €', priceLine: '/hra' },
              ].map((s) => (
                <motion.div
                  key={s.title.sk}
                  variants={fadeUp}
                  className="relative bg-[#F5F5F5] rounded-3xl p-8 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="absolute top-0 left-0 w-full h-1" style={{ background: s.color }} />
                  <div className="text-5xl font-black mb-2" style={{ color: s.color }}>{s.num}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-black/30 mb-4">{t(s.unit, lang)}</div>
                  <h3 className="text-2xl font-black mb-2">{t(s.title, lang)}</h3>
                  <p className="text-black/50 text-sm leading-relaxed">{t(s.desc, lang)}</p>
                  {s.price ? (
                    <div className="mt-6 text-2xl font-black">{s.price}<span className="text-sm font-normal text-black/30"> {s.priceLine}</span></div>
                  ) : (
                    <div className="mt-6 flex gap-2">
                      {['#F59E0B','#22C55E','#3B82F6'].map(c => (
                        <span key={c} className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />
                      ))}
                      <span className="text-xs text-black/30 ml-1">{s.priceLine}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* GALLERY TEASER */}
      <section className="py-24 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <motion.div variants={fadeUp} className="mb-10 flex items-end justify-between">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t(T.gallery.title, lang)}</h2>
              <Link href="/galeria" className="text-sm font-semibold text-black/40 hover:text-black transition-colors cursor-pointer">
                {lang === 'sk' ? 'Všetky fotky' : 'All photos'} →
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: '/images/gallery-9.webp', alt: 'BBM Bowling - bar lounge' },
                { src: '/images/gallery-7.webp', alt: 'BBM Bowling - bar' },
                { src: '/images/gallery-8.webp', alt: 'BBM Bowling - biliard' },
                { src: '/images/gallery-11.jpg', alt: 'BBM Bowling - dráhy' },
              ].map((photo) => (
                <motion.div
                  key={photo.src}
                  variants={fadeUp}
                  className="relative overflow-hidden rounded-2xl bg-black/5"
                  style={{ aspectRatio: '4/3' }}
                >
                  <Image src={photo.src} alt={photo.alt} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* BOOKING CTA */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Section>
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Online</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              {lang === 'sk' ? 'Rezervujte si miesto' : 'Book your spot'}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10 max-w-md mx-auto">
              {lang === 'sk' ? 'Vyberte dátum, čas a dráhu — trvá to 2 minúty.' : 'Choose date, time and lane — takes 2 minutes.'}
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/rezervacia" className="inline-flex items-center px-10 py-5 bg-white text-black font-black text-lg rounded-full hover:bg-white/90 transition-all cursor-pointer">
                {t(T.hero.cta, lang)}
              </Link>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* MAP */}
      <section className="py-24 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeUp}>
                <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">{lang === 'sk' ? 'Kde nás nájdete' : 'Find us'}</p>
                <h2 className="text-4xl font-black tracking-tight mb-4">{lang === 'sk' ? 'Malacky, 1. poschodie' : 'Malacky, 1st floor'}</h2>
                <p className="text-black/50 mb-6">Priemyselná 5863, 901 01 Malacky</p>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=BBM+Bowling+Bar+Malacky,+Priemyselná+5863,+Malacky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-full hover:bg-black/80 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t(T.contact.navigateBtn, lang)}
                </a>
              </motion.div>
              <motion.div variants={fadeUp} className="rounded-3xl overflow-hidden shadow-lg h-64 md:h-80">
                <iframe
                  src="https://maps.google.com/maps?q=Priemyselná+5863,+901+01+Malacky&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="BBM mapa"
                />
              </motion.div>
            </div>
          </Section>
        </div>
      </section>
    </>
  )
}
