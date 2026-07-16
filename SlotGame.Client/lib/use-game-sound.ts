"use client"

import { useEffect, useRef } from "react"
import { getSoundEngine, type SoundEngine } from "./sound-engine"

// მუთის მდგომარეობას ასინქრონებს ხმის ძრავასთან და აბრუნებს ერთ ინსტანსს.
export function useGameSound(muted: boolean): SoundEngine {
  const engineRef = useRef<SoundEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = getSoundEngine()
  }

  useEffect(() => {
    engineRef.current?.setMuted(muted)
  }, [muted])

  return engineRef.current
}
