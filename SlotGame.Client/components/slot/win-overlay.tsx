"use client"

import { useEffect, useState } from "react"

interface WinOverlayProps {
  amount: number
  bet: number
  onDone: () => void
}

// Big-win celebration with tiered label + coin shower.
export function WinOverlay({ amount, bet, onDone }: WinOverlayProps) {
  const [shown, setShown] = useState(0)
  const ratio = amount / Math.max(bet, 0.01)
  const tier =
    ratio >= 50 ? "MEGA WIN" : ratio >= 20 ? "BIG WIN" : ratio >= 8 ? "NICE WIN" : "WIN"

  // count-up
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 1200
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setShown(+(amount * (1 - Math.pow(1 - p, 3))).toFixed(2))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const t = setTimeout(onDone, 2600)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [amount, onDone])

  const coins = Array.from({ length: 26 })

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[1.4rem] bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-label={`${tier} ${amount.toFixed(2)}`}
      onClick={onDone}
    >
      {/* coin shower */}
      {coins.map((_, i) => (
        <span
          key={i}
          className="coin absolute top-0 text-xl"
          style={{
            left: `${(i * 3.8 + 3) % 96}%`,
            animationDelay: `${(i % 10) * 0.12}s`,
            animationDuration: `${1.6 + (i % 5) * 0.25}s`,
          }}
        >
          <span className="inline-block h-4 w-4 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff2b0,#e6b422_55%,#9c7a10)] shadow-[0_0_6px_rgba(230,180,34,0.8)] ring-1 ring-amber-900/40" />
        </span>
      ))}

      <div className="big-win-pop flex flex-col items-center">
        <div className="font-display text-3xl font-extrabold uppercase tracking-[0.15em] text-transparent [background:linear-gradient(180deg,#fff6cf,#f2c53d_55%,#a9781a)] [-webkit-background-clip:text] [background-clip:text] drop-shadow-[0_2px_8px_rgba(230,180,34,0.5)] sm:text-5xl">
          {tier}
        </div>
        <div className="mt-1 font-mono text-4xl font-bold tabular-nums text-amber-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-6xl">
          {shown.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
