'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLang } from '@/lib/lang'

export default function ConfirmedPage() {
  const { lang } = useLang()
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-sm"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#03AED220' }}>
          <svg className="w-10 h-10" fill="none" stroke="#03AED2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-3">
          {lang === 'sk' ? 'Rezervácia potvrdená!' : 'Booking confirmed!'}
        </h1>
        <p className="text-black/50 mb-8 leading-relaxed">
          {lang === 'sk'
            ? 'Vaša rezervácia bola úspešne potvrdená. Tešíme sa na vás! Platba prebieha na mieste.'
            : 'Your reservation has been confirmed. See you soon! Payment is on site.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-black/80 transition-all cursor-pointer"
        >
          {lang === 'sk' ? 'Späť na úvod' : 'Back to home'}
        </Link>
      </motion.div>
    </div>
  )
}
