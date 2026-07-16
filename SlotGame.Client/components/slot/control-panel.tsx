"use client"

import { Minus, Plus, RotateCw, Zap, Info, Repeat } from "lucide-react"

interface ControlPanelProps {
  balance: number | null
  bet: number
  lastWin: number
  spinning: boolean
  autoplay: boolean
  onAdjustBet: (delta: number) => void
  onMaxBet: () => void
  onSpin: () => void
  onToggleAutoplay: () => void
  onOpenPaytable: () => void
}

function Meter({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: "gold" | "green"
}) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-black/50 px-2 py-1.5 ring-1 ring-[color:var(--gold)]/25 sm:px-4">
      <span className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-amber-200/70 sm:text-[0.6rem]">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-bold tabular-nums sm:text-lg ${
          accent === "green"
            ? "text-emerald-400"
            : accent === "gold"
              ? "text-amber-300"
              : "text-stone-100"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export function ControlPanel({
  balance,
  bet,
  lastWin,
  spinning,
  autoplay,
  onAdjustBet,
  onMaxBet,
  onSpin,
  onToggleAutoplay,
  onOpenPaytable,
}: ControlPanelProps) {
  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-b from-stone-800/90 to-stone-950/95 p-3 ring-1 ring-[color:var(--gold)]/30 sm:p-4">
      {/* meters */}
      <div className="grid grid-cols-3 gap-2">
        <Meter
          label="Credit"
          value={balance === null ? "----" : balance.toFixed(2)}
          accent="gold"
        />
        <Meter label="Bet" value={bet.toFixed(2)} />
        <Meter label="Win" value={lastWin.toFixed(2)} accent="green" />
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* left cluster */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-black/50 p-1 ring-1 ring-[color:var(--gold)]/25">
            <button
              onClick={() => onAdjustBet(-1)}
              disabled={spinning}
              aria-label="Decrease bet"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-amber-300 transition hover:bg-stone-700 active:scale-95 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAdjustBet(1)}
              disabled={spinning}
              aria-label="Increase bet"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-amber-300 transition hover:bg-stone-700 active:scale-95 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onMaxBet}
            disabled={spinning}
            className="flex h-9 items-center gap-1 rounded-lg bg-stone-800 px-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-[color:var(--gold)]/25 transition hover:bg-stone-700 active:scale-95 disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5" /> Max
          </button>
        </div>

        {/* SPIN */}
        <button
          onClick={onSpin}
          disabled={spinning}
          aria-label="Spin"
          className="spin-button group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full sm:h-20 sm:w-20"
        >
          <RotateCw
            className={`h-7 w-7 text-stone-900 sm:h-9 sm:w-9 ${
              spinning ? "animate-spin" : "transition-transform group-hover:rotate-90"
            }`}
            strokeWidth={2.5}
          />
        </button>

        {/* right cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutoplay}
            disabled={spinning && !autoplay}
            aria-label="Autoplay"
            className={`flex h-9 items-center gap-1 rounded-lg px-2.5 text-[0.65rem] font-bold uppercase tracking-wider ring-1 transition active:scale-95 disabled:opacity-40 ${
              autoplay
                ? "bg-emerald-600 text-white ring-emerald-300/40"
                : "bg-stone-800 text-amber-300 ring-[color:var(--gold)]/25 hover:bg-stone-700"
            }`}
          >
            <Repeat className="h-3.5 w-3.5" /> Auto
          </button>
          <button
            onClick={onOpenPaytable}
            aria-label="Paytable"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-amber-300 ring-1 ring-[color:var(--gold)]/25 transition hover:bg-stone-700 active:scale-95"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
