'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'

const navLinks = [
  { href: '/kontakt', label: T.nav.contact },
  { href: '/cennik', label: T.nav.pricing },
  { href: '/o-nas', label: T.nav.about },
]

const menuLinks = [
  { href: '/', label: T.nav.home },
  { href: '/o-nas', label: T.nav.about },
  { href: '/cennik', label: T.nav.pricing },
  { href: '/galeria', label: T.nav.gallery },
  { href: '/kontakt', label: T.nav.contact },
  { href: '/rezervacia', label: T.nav.reservation },
]

export default function Navbar() {
  const { lang, toggle } = useLang()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#F5F5F5]/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group" onClick={() => setOpen(false)}>
              <span className="font-black text-xl md:text-2xl tracking-tight text-black">BBM</span>
            </Link>

            {/* Center nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-black/70 hover:text-black transition-colors duration-200 cursor-pointer"
                >
                  {t(link.label, lang)}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Language toggle */}
              <button
                onClick={toggle}
                className="hidden md:flex text-xs font-bold text-black/50 hover:text-black transition-colors tracking-widest cursor-pointer"
              >
                {lang === 'sk' ? 'EN' : 'SK'}
              </button>

              {/* Book CTA */}
              <Link
                href="/rezervacia"
                className="hidden md:inline-flex items-center px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-black/80 transition-all duration-200 cursor-pointer"
              >
                {t(T.nav.reservation, lang)}
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setOpen(!open)}
                className="flex flex-col justify-center items-center gap-1.5 w-10 h-10 cursor-pointer"
                aria-label="Menu"
              >
                <motion.span
                  animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block w-7 h-0.5 bg-black rounded-full origin-center"
                />
                <motion.span
                  animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                  className="block w-7 h-0.5 bg-black rounded-full"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block w-7 h-0.5 bg-black rounded-full origin-center"
                />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Fullscreen menu overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black flex flex-col"
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                backgroundSize: '80px 80px',
              }}
            />

            <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-6 py-8 w-full">
              {/* Top bar in menu */}
              <div className="flex items-center justify-between mb-12">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
                  <span className="font-black text-2xl text-white">BBM</span>
                </Link>
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggle}
                    className="text-xs font-bold text-white/50 hover:text-white transition-colors tracking-widest cursor-pointer"
                  >
                    {lang === 'sk' ? 'EN' : 'SK'}
                  </button>
                </div>
              </div>

              {/* Menu links */}
              <nav className="flex-1 flex flex-col justify-center">
                <ul className="space-y-1">
                  {menuLinks.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="group flex items-center justify-between py-4 border-b border-white/10 cursor-pointer"
                      >
                        <span className="text-4xl md:text-5xl font-black text-white group-hover:text-white/70 transition-colors duration-200 tracking-tight">
                          {t(link.label, lang)}
                        </span>
                        <motion.span
                          className="text-white/30 text-2xl group-hover:text-white/60 transition-colors"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Bottom contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="text-white/40 text-sm">
                  <p>Priemyselná 5863, Malacky 901 01</p>
                  <p>+421 919 080 420</p>
                </div>
                <Link
                  href="/rezervacia"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-white/90 transition-all cursor-pointer"
                >
                  {t(T.nav.reservation, lang)}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
