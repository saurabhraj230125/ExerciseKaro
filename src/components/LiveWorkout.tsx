'use client'

import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, ChevronRight, ChevronLeft, SkipForward, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LiveWorkoutProps {
  planId: string
  exerciseName: string
  targetReps: number
  onComplete: (completedReps: number, formScore: number) => void
  onSkip?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
}

// Vector math utility for angle calculation
function calculateAngle(a: { x: number, y: number }, b: { x: number, y: number }, c: { x: number, y: number }) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs((radians * 180.0) / Math.PI)
  if (angle > 180.0) {
    angle = 360.0 - angle
  }
  return angle
}

export default function LiveWorkout({ planId, exerciseName, targetReps, onComplete, onSkip, onPrevious, hasNext, hasPrevious }: LiveWorkoutProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [reps, setReps] = useState(0)
  const [isDown, setIsDown] = useState(false)
  const [finished, setFinished] = useState(false)
  const [currentDepth, setCurrentDepth] = useState(0) // 0 to 100

  // Mutable refs for the requestAnimationFrame loop
  const requestRef = useRef<number>(0)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const lastVideoTimeRef = useRef(-1)
  
  // State refs for the logic inside the loop
  const stateRef = useRef({ reps: 0, isDown: false, finished: false })

  // Reset local state when exercise changes
  useEffect(() => {
    setReps(0)
    setIsDown(false)
    setFinished(false)
    setCurrentDepth(0)
    stateRef.current = { reps: 0, isDown: false, finished: false }
  }, [exerciseName, targetReps])

  useEffect(() => {
    let active = true

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        )
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })
        
        if (!active) return
        poseLandmarkerRef.current = poseLandmarker
        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to load MediaPipe Pose", error)
      }
    }

    initializeMediaPipe()

    return () => {
      active = false
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close()
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || finished) return

    const drawFrame = () => {
      if (!webcamRef.current || !webcamRef.current.video || !canvasRef.current || !poseLandmarkerRef.current) {
        requestRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const video = webcamRef.current.video
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      // Ensure video is actually loaded and has dimensions
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        requestRef.current = requestAnimationFrame(drawFrame)
        return
      }

      // Match canvas dimensions to video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      // Check if video is playing and has new frame
      let startTimeMs = performance.now()
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime

        const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs)

        if (ctx) {
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          if (results.landmarks && results.landmarks.length > 0) {
            const drawingUtils = new DrawingUtils(ctx)
            for (const landmark of results.landmarks) {
              drawingUtils.drawLandmarks(landmark, {
                radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
                color: "#39ff14", // neon-green
                lineWidth: 2,
              })
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
                color: "#0ff0fc", // neon-blue
                lineWidth: 4,
              })
            }

            // --- REP COUNTING LOGIC (Squat Example) ---
            if (exerciseName.toLowerCase().includes('squat')) {
              const landmarks = results.landmarks[0]
              // Get left hip (23), left knee (25), left ankle (27)
              const hip = landmarks[23]
              const knee = landmarks[25]
              const ankle = landmarks[27]
              
              if (hip && knee && ankle) {
                // Ensure visibility is decent before counting
                if (hip.visibility! > 0.5 && knee.visibility! > 0.5 && ankle.visibility! > 0.5) {
                  const angle = calculateAngle(
                    { x: hip.x, y: hip.y },
                    { x: knee.x, y: knee.y },
                    { x: ankle.x, y: ankle.y }
                  )

                  // Map angle 160 (standing) to 90 (squat) to a percentage 0-100
                  let depth = 0
                  if (angle <= 90) depth = 100
                  else if (angle >= 160) depth = 0
                  else depth = ((160 - angle) / (160 - 90)) * 100
                  
                  setCurrentDepth(depth)

                  const { isDown, reps } = stateRef.current

                  // Squat threshold (deep enough)
                  if (angle < 95 && !isDown) {
                    stateRef.current.isDown = true
                    setIsDown(true)
                  }
                  
                  // Standing threshold
                  if (angle > 155 && isDown) {
                    stateRef.current.isDown = false
                    stateRef.current.reps += 1
                    setIsDown(false)
                    setReps(stateRef.current.reps)

                    if (stateRef.current.reps >= targetReps && !stateRef.current.finished) {
                      stateRef.current.finished = true
                      setFinished(true)
                      setCurrentDepth(0)
                      setTimeout(() => {
                        onComplete(stateRef.current.reps, 95) // Dummy form score 95
                      }, 2000)
                    }
                  }
                }
              }
            } else {
              // Dummy logic for non-squat exercises for visual tracking
              // Slowly increase depth for testing
              const newDepth = ((Date.now() / 50) % 100)
              setCurrentDepth(newDepth)
            }
          }
          ctx.restore()
        }
      }

      if (!stateRef.current.finished) {
        requestRef.current = requestAnimationFrame(drawFrame)
      }
    }

    requestRef.current = requestAnimationFrame(drawFrame)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isLoaded, finished, exerciseName, targetReps, onComplete])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10 flex justify-between items-start sm:items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => router.back()}
          className="p-2 sm:p-3 bg-dark-gray/80 backdrop-blur rounded-full hover:bg-gray-700 transition-colors border border-gray-600 shrink-0"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <div className="text-center flex flex-col items-center flex-1 px-2">
          <h2 className="text-xl sm:text-3xl font-extrabold text-white uppercase tracking-widest drop-shadow-lg leading-tight">{exerciseName}</h2>
          <motion.p 
            key={reps}
            initial={{ scale: 1.5, color: '#ffffff' }}
            animate={{ scale: 1, color: '#39ff14' }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            className="text-lg sm:text-2xl font-mono font-bold tracking-widest drop-shadow-[0_0_10px_rgba(57,255,20,0.8)] mt-1"
          >
            {reps} / {targetReps} <span className="hidden sm:inline">REPS</span>
          </motion.p>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasPrevious && onPrevious && (
            <button 
              onClick={onPrevious}
              className="p-2 sm:p-3 bg-dark-gray/80 backdrop-blur rounded-full hover:bg-gray-700 transition-colors border border-gray-600"
              title="Previous Exercise"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          )}
          {hasNext && onSkip && (
            <button 
              onClick={onSkip}
              className="p-2 sm:p-3 bg-dark-gray/80 backdrop-blur rounded-full hover:bg-gray-700 transition-colors border border-gray-600"
              title="Skip Exercise"
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Main Camera View */}
      <div className="relative flex-1 bg-gray-900 overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="absolute inset-0 w-full h-full object-cover mirror"
          videoConstraints={{
            facingMode: 'user'
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover mirror"
        />

        {/* Rep Depth Tracking UI */}
        {isLoaded && !finished && (
          <div className="absolute right-4 sm:right-6 top-1/4 bottom-1/4 w-4 sm:w-8 bg-black/60 backdrop-blur rounded-full border border-dark-gray overflow-hidden flex flex-col justify-end">
            <motion.div 
              className={`w-full ${isDown ? 'bg-neon-green' : 'bg-neon-blue'}`}
              animate={{ height: `${currentDepth}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-neon-blue mb-4"></div>
            <p className="text-white font-mono animate-pulse">Initializing AI Vision Model...</p>
          </div>
        )}

        {/* Workout Progress Bar (Bottom) */}
        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 h-2 sm:h-3 bg-dark-gray/50 backdrop-blur rounded-full overflow-hidden border border-gray-700">
          <motion.div 
            className="h-full bg-gradient-to-r from-neon-blue to-neon-green"
            initial={{ width: 0 }}
            animate={{ width: `${(reps / targetReps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Success Celebration Overlay */}
        <AnimatePresence>
          {finished && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20"
            >
              <CheckCircle2 className="w-24 h-24 sm:w-32 sm:h-32 text-neon-green mb-4 sm:mb-6" />
              <h2 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-white mb-2 text-center px-4">EXERCISE COMPLETE!</h2>
              {hasNext ? (
                <p className="text-lg sm:text-xl text-gray-300 text-center px-4">Moving to next exercise...</p>
              ) : (
                <p className="text-lg sm:text-xl text-gray-300 text-center px-4">Workout Finished! Saving results...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global style to mirror the camera since users are facing it */}
      <style dangerouslySetInnerHTML={{__html: `
        .mirror {
          transform: scaleX(-1);
        }
      `}} />
    </div>
  )
}
