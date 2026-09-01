'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Camera, ArrowRight, User } from 'lucide-react'
import Webcam from 'react-webcam'

type Goal = 'weight_loss' | 'muscle_gain' | 'maintenance'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        // check if user already onboarded
        const { data } = await supabase.from('users').select('id').eq('id', session.user.id).single()
        if (data) {
          router.push('/dashboard')
        }
      }
    }
    checkAuth()
  }, [router])

  const handleComplete = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('users').insert({
      id: session.user.id,
      full_name: name,
      age: parseInt(age),
      weight: parseFloat(weight),
      fitness_goal: goal
    })

    if (!error) {
      router.push('/dashboard')
    } else {
      console.error(error)
      setLoading(false)
    }
  }

  const nextStep = () => setStep((prev) => prev + 1)
  const prevStep = () => setStep((prev) => prev - 1)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-dark-gray">
        <motion.div 
          className="h-full bg-neon-green"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-panel-gray rounded-2xl border border-dark-gray shadow-2xl p-6 sm:p-8 overflow-hidden relative min-h-[400px] flex flex-col">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="text-neon-blue w-6 h-6" />
                  <h2 className="text-2xl font-bold">About You</h2>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black border border-dark-gray rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-black border border-dark-gray rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Weight (kg/lbs)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-black border border-dark-gray rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                        placeholder="70"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!name || !age || !weight}
                  className="w-full bg-neon-blue text-black font-bold rounded-lg px-4 py-3 mt-6 hover:bg-[#0bc5d0] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl font-bold mb-2">What is your primary goal?</h2>
                <p className="text-gray-400 mb-6">This helps us recommend the best plans for you.</p>

                <div className="space-y-3 flex-1">
                  {[
                    { id: 'weight_loss', title: 'Lose Belly Fat', desc: 'High intensity, burn calories' },
                    { id: 'muscle_gain', title: 'Build a 6-Pack', desc: 'Core strength and hypertrophy' },
                    { id: 'maintenance', title: 'General Fitness', desc: 'Stay active and healthy' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setGoal(item.id as Goal)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        goal === item.id 
                          ? 'border-neon-green bg-neon-green/10' 
                          : 'border-dark-gray bg-black hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className={`font-bold ${goal === item.id ? 'text-neon-green' : 'text-white'}`}>{item.title}</h3>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                        {goal === item.id && <Check className="text-neon-green w-6 h-6" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={prevStep}
                    className="w-1/3 bg-dark-gray text-white font-bold rounded-lg px-4 py-3 hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!goal}
                    className="w-2/3 bg-neon-green text-black font-bold rounded-lg px-4 py-3 hover:bg-[#32e011] disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Camera className="text-white w-6 h-6" />
                  <h2 className="text-2xl font-bold">Camera Setup</h2>
                </div>
                
                <p className="text-gray-400 mb-4 text-sm">FormCheck requires camera access to track your movements in real-time. Please allow permissions when prompted.</p>

                <div className="flex-1 bg-black rounded-lg border border-dark-gray overflow-hidden relative flex items-center justify-center">
                  <Webcam
                    audio={false}
                    className="w-full h-full object-cover"
                    onUserMedia={() => setCameraReady(true)}
                    onUserMediaError={(err) => setCameraError(err.toString())}
                  />
                  {!cameraReady && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="animate-pulse text-neon-green">Requesting access...</div>
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 p-4 text-center">
                      <p className="text-red-200">Camera error: {cameraError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={prevStep}
                    className="w-1/3 bg-dark-gray text-white font-bold rounded-lg px-4 py-3 hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!cameraReady || loading}
                    className="w-2/3 bg-white text-black font-bold rounded-lg px-4 py-3 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? 'Completing...' : 'Finish Setup'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
