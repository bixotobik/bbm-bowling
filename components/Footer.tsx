'use client'

import Link from 'next/link'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'

export default function Footer() {
  const { lang } = useLang()
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center mb-4">
              <span className="font-black text-xl">BBM</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Bowling Bar Malacky<br />
              Priemyselná 5863, 1. poschodie<br />
              Malacky 901 01
            </p>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-white/40 mb-4">Menu</h3>
            <ul className="space-y-2">
              {[
                { href: '/o-nas', label: T.nav.about },
                { href: '/cennik', label: T.nav.pricing },
                { href: '/galeria', label: T.nav.gallery },
                { href: '/kontakt', label: T.nav.contact },
                { href: '/rezervacia', label: T.nav.reservation },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-white text-sm transition-colors cursor-pointer">
                    {t(l.label, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-white/40 mb-4">Kontakt</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="tel:+421919080420" className="hover:text-white transition-colors">+421 919 080 420</a></li>
              <li><a href="mailto:bowlingmalacky@gmail.com" className="hover:text-white transition-colors">bowlingmalacky@gmail.com</a></li>
            </ul>
            <div className="mt-4 text-sm text-white/40 space-y-1">
              <p>Po: 14:00 – 00:00</p>
              <p>Ut–Št: 14:00 – 00:00</p>
              <p>Pi–So: 13:00 – 02:00</p>
              <p>Ne: 13:00 – 22:00</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-white/30 text-xs">
          {t(T.footer.rights, lang)}
        </div>
      </div>
    </footer>
  )
}
