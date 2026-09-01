import Link from 'next/link'
import { Dumbbell, Activity, Video } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <main className="flex-1 w-full max-w-5xl px-4 flex flex-col items-center justify-center py-20">
        
        <div className="w-24 h-24 rounded-full bg-neon-green/20 flex items-center justify-center mb-8 border-2 border-neon-green/50 shadow-[0_0_30px_rgba(57,255,20,0.3)]">
          <Dumbbell className="text-neon-green w-12 h-12" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-center mb-6 tracking-tight">
          AI-Powered <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">
            Fitness Tracking
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-12">
          FormCheck uses your browser's camera to analyze your movements in real-time, count your reps, and ensure your form is perfect. No extra hardware required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/signup" className="bg-neon-green text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-[#32e011] transition-colors text-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
            Start Training Free
          </Link>
          <Link href="/login" className="bg-panel-gray text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-gray-800 transition-colors text-center border border-dark-gray">
            Log In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
          <div className="bg-panel-gray p-6 rounded-2xl border border-dark-gray text-center flex flex-col items-center">
            <div className="bg-black p-4 rounded-full mb-4 text-neon-blue">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Vision</h3>
            <p className="text-gray-400 text-sm">Our AI tracks your joints and angles to ensure every rep counts.</p>
          </div>
          <div className="bg-panel-gray p-6 rounded-2xl border border-dark-gray text-center flex flex-col items-center">
            <div className="bg-black p-4 rounded-full mb-4 text-neon-green">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Auto Rep Counting</h3>
            <p className="text-gray-400 text-sm">Focus on your workout, let FormCheck keep track of the numbers.</p>
          </div>
          <div className="bg-panel-gray p-6 rounded-2xl border border-dark-gray text-center flex flex-col items-center">
            <div className="bg-black p-4 rounded-full mb-4 text-white">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Curated Plans</h3>
            <p className="text-gray-400 text-sm">Follow structured routines tailored for weight loss, muscle gain, or maintenance.</p>
          </div>
        </div>

      </main>
    </div>
  )
}
