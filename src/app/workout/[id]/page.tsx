'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LiveWorkout from '@/components/LiveWorkout'

type Exercise = {
  id: string
  name: string
  target_reps: number
  target_sets: number
  order_index: number
}

type Plan = {
  id: string
  title: string
}

export default function WorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string

  const [plan, setPlan] = useState<Plan | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track total workout stats
  const [totalReps, setTotalReps] = useState(0)
  const [scores, setScores] = useState<number[]>([])

  useEffect(() => {
    const fetchWorkoutData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch Plan details
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .select('id, title')
        .eq('id', planId)
        .single()
      
      if (planError) {
        setError('Workout plan not found.')
        setLoading(false)
        return
      }
      setPlan(planData)

      // Fetch Exercises
      const { data: exercisesData, error: exError } = await supabase
        .from('exercises')
        .select('*')
        .eq('plan_id', planId)
        .order('order_index', { ascending: true })
      
      if (exError || !exercisesData || exercisesData.length === 0) {
        setError('No exercises found for this plan.')
        setLoading(false)
        return
      }
      setExercises(exercisesData)
      setLoading(false)
    }

    fetchWorkoutData()
  }, [planId, router])

  const finishWorkout = async (additionalReps: number, currentScores: number[]) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const avgScore = currentScores.length > 0 
        ? currentScores.reduce((a, b) => a + b, 0) / currentScores.length 
        : 0
      const finalReps = totalReps + additionalReps

      await supabase.from('workout_logs').insert({
        user_id: session.user.id,
        plan_id: planId,
        total_reps_completed: finalReps,
        form_score: avgScore
      })
    }

    router.push('/dashboard') 
  }

  const handleExerciseComplete = async (completedReps: number, formScore: number) => {
    setTotalReps((prev) => prev + completedReps)
    
    const newScores = [...scores, formScore]
    setScores(newScores)

    if (currentExIndex < exercises.length - 1) {
      // Move to next exercise
      setCurrentExIndex((prev) => prev + 1)
    } else {
      // Workout completely finished
      await finishWorkout(completedReps, newScores)
    }
  }

  const handleSkip = () => {
    if (currentExIndex < exercises.length - 1) {
      setCurrentExIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentExIndex > 0) {
      setCurrentExIndex((prev) => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl text-red-500 font-bold mb-4">Error</h2>
        <p className="text-white mb-6">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="bg-neon-blue px-6 py-2 rounded-lg text-black font-bold">
          Go Back
        </button>
      </div>
    )
  }

  const currentExercise = exercises[currentExIndex]
  const hasNext = currentExIndex < exercises.length - 1
  const hasPrevious = currentExIndex > 0

  return (
    <LiveWorkout 
      planId={planId}
      exerciseName={currentExercise.name}
      targetReps={currentExercise.target_reps}
      onComplete={handleExerciseComplete}
      onSkip={handleSkip}
      onPrevious={handlePrevious}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
    />
  )
}
