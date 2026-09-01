'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      if (data.session) {
        router.push('/onboarding')
      } else {
        setSuccess(true)
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-panel-gray p-8 rounded-2xl border border-dark-gray shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-neon-blue/20 flex items-center justify-center mb-4 border border-neon-blue/50">
            <Dumbbell className="text-neon-blue w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join FormCheck</h1>
          <p className="text-gray-400 mt-2 text-center">Start your AI fitness journey</p>
        </div>

        {success ? (
          <div className="bg-neon-green/10 border border-neon-green text-neon-green p-4 rounded-lg text-center">
            <p className="font-semibold mb-2">Check your email!</p>
            <p className="text-sm text-green-200">We sent you a confirmation link to complete your signup.</p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-dark-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-dark-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="•••••••• (min 6 chars)"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon-blue text-black font-bold rounded-lg px-4 py-3 hover:bg-[#0bc5d0] transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Signing up...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-neon-green hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
