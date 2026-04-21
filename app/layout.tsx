import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/lang'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BBM Bowling Bar Malacky — Rezervácia',
  description: '4 bowlingové dráhy, biliard, šípky. Rezervujte online. Priemyselná 5863, Malacky.',
  keywords: 'bowling Malacky, BBM, rezervácia bowling, biliard, šípky',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#F5F5F5] antialiased">
        <LangProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  )
}
