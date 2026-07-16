"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { SymbolIcon } from "./symbol-icon"
import { SYMBOL_NAMES } from "../../lib/slot-types"

interface PreloaderProps {
  onComplete: () => void
}

// Amusnet / EGT Interactive-style splash: animated logo + 0→100% bar.
export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const DURATION = 2600 // ms

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      // ease-out so it feels like real asset loading (fast then settles)
      const eased = 1 - Math.pow(1 - t, 2.2)
      setProgress(Math.round(eased * 100))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else if (!doneRef.current) {
        doneRef.current = true
        setDone(true)
        // let the fade-out play before unmounting
        setTimeout(onComplete, 650)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="იტვირთება"
    >
      {/* background */}
      <div className="absolute inset-0 -z-10">
        <Image src="/loader-bg.png" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        <div className="loader-rays absolute inset-0" />
      </div>

      {/* rotating symbol ring */}
      <div className="loader-ring relative mb-8 h-40 w-40">
        {SYMBOL_NAMES.map((name, i) => {
          const angle = (360 / SYMBOL_NAMES.length) * i
          return (
            <div
              key={name}
              className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `rotate(${angle}deg) translateY(-68px) rotate(-${angle}deg)`,
              }}
            >
              <SymbolIcon
                name={name}
                className="h-full w-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              />
            </div>
          )
        })}
        {/* center logo */}
        <div className="logo-glow absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-2 ring-[color:var(--gold)]/60 shadow-[0_4px_16px_rgba(230,180,34,0.55)]">
          <Image
            src="/chajma-logo.png"
            alt="chajma.bet"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* wordmark */}
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-amber-300 [text-shadow:0_2px_10px_rgba(230,180,34,0.4)]">
        chajma<span className="text-rose-400">.bet</span>
      </h1>
      <p className="mb-8 mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-amber-200/70">
        Fruit Fortune · 5×3
      </p>

      {/* progress bar */}
      <div className="w-72 max-w-[80vw]">
        <div className="loader-track relative h-3 overflow-hidden rounded-full">
          <div
            className="loader-fill h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-200/60">
            იტვირთება
          </span>
          <span className="font-display text-sm font-bold tabular-nums text-amber-300">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  )
}
