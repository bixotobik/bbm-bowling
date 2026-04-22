'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLang } from '@/lib/lang'

export default function CancelledPage() {
  const { lang } = useLang()
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-sm"
      >
        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-3">
          {lang === 'sk' ? 'Rezervácia zrušená' : 'Booking cancelled'}
        </h1>
        <p className="text-black/50 mb-8 leading-relaxed">
          {lang === 'sk'
            ? 'Vaša rezervácia bola zrušená. Ak chcete rezervovať znova, kliknite nižšie.'
            : 'Your reservation has been cancelled. Click below to book again.'}
        </p>
        <Link
          href="/rezervacia"
          className="inline-flex items-center px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-black/80 transition-all cursor-pointer"
        >
          {lang === 'sk' ? 'Nová rezervácia' : 'New booking'}
        </Link>
      </motion.div>
    </div>
  )
}
