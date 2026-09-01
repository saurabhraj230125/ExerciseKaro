'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, Activity, Target, Flame, Trophy, LogOut } from 'lucide-react'

type Plan = {
  id: string
  title: string
  description: string
  difficulty: string
}

type UserProfile = {
  full_name: string
  fitness_goal: string
}

export default function Dashboard() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('full_name, fitness_goal')
        .eq('id', session.user.id)
        .single()
      
      if (userProfile) setProfile(userProfile)

      // Fetch plans
      const { data: plansData } = await supabase
        .from('workout_plans')
        .select('*')
      
      if (plansData) setPlans(plansData)
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Athlete'}</h1>
            <p className="text-gray-400 capitalize text-sm flex items-center gap-2 mt-1">
              <Target className="w-4 h-4 text-neon-blue" />
              Goal: {profile?.fitness_goal?.replace('_', ' ') || 'General Fitness'}
            </p>
          </div>
          <button onClick={handleLogout} className="p-3 bg-panel-gray rounded-full hover:bg-dark-gray transition-colors border border-dark-gray">
            <LogOut className="w-5 h-5 text-gray-400" />
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-panel-gray p-5 rounded-2xl border border-dark-gray">
            <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm font-medium">
              <Flame className="w-5 h-5 text-orange-500" />
              Day Streak
            </div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-panel-gray p-5 rounded-2xl border border-dark-gray">
            <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm font-medium">
              <Activity className="w-5 h-5 text-neon-green" />
              Total Reps
            </div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-panel-gray p-5 rounded-2xl border border-dark-gray">
            <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm font-medium">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Avg Form
            </div>
            <div className="text-3xl font-bold">0%</div>
          </div>
          <div className="bg-panel-gray p-5 rounded-2xl border border-dark-gray">
            <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm font-medium">
              <Target className="w-5 h-5 text-neon-blue" />
              Workouts
            </div>
            <div className="text-3xl font-bold">0</div>
          </div>
        </div>

        {/* Workouts */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Discover Workouts</h2>
          {plans.length === 0 ? (
            <div className="bg-panel-gray p-8 rounded-2xl border border-dark-gray text-center">
              <p className="text-gray-400">No workout plans found. Ensure the Supabase database is seeded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-panel-gray rounded-2xl border border-dark-gray overflow-hidden flex flex-col group hover:border-gray-500 transition-colors">
                  <div className="h-40 bg-dark-gray relative">
                    {/* Placeholder for cover image */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 to-transparent flex items-end p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                        ${plan.difficulty === 'beginner' ? 'bg-green-900 text-neon-green' : 
                          plan.difficulty === 'intermediate' ? 'bg-blue-900 text-neon-blue' : 
                          'bg-red-900 text-red-400'}`}>
                        {plan.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                    <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-2">{plan.description}</p>
                    <Link 
                      href={`/workout/${plan.id}`}
                      className="w-full bg-dark-gray hover:bg-neon-green hover:text-black text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-700 hover:border-neon-green"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Start Workout
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
