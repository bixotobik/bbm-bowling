'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Nesprávne prihlasovacie údaje.')
    } else {
      router.push('/admin')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <Image src="/images/logo.png" alt="BBM" fill className="object-contain brightness-0 invert" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin</h1>
          <p className="text-white/40 text-sm mt-1">BBM Bowling Bar Malacky</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Heslo</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-black/10 focus:outline-none focus:border-black text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white font-black rounded-full hover:bg-black/80 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
