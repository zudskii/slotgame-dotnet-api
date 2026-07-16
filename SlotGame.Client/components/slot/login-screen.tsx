"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, LogIn, ChevronDown } from "lucide-react"

interface LoginScreenProps {
  apiBase: string
  onApiBaseChange: (v: string) => void
  loggingIn: boolean
  error: string
  onLogin: (playerId: string) => void
}

export function LoginScreen({
  apiBase,
  onApiBaseChange,
  loggingIn,
  error,
  onLogin,
}: LoginScreenProps) {
  const [playerId, setPlayerId] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onLogin(playerId)
      }}
      className="flex flex-col items-center gap-4"
    >
      {/* logo */}
      <div className="relative flex flex-col items-center">
        <div className="logo-glow relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-[color:var(--gold)]/60 shadow-[0_4px_12px_rgba(230,180,34,0.4)]">
          <Image
            src="/chajma-logo.png"
            alt="chajma.bet ლოგო"
            fill
            className="object-cover"
            priority
          />
        </div>
        <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-amber-300 [text-shadow:0_2px_8px_rgba(230,180,34,0.35)]">
          chajma<span className="text-rose-400">.bet</span>
        </h1>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-amber-200/60">
          Fruit Fortune · 5×3
        </p>
      </div>

      <div className="w-full space-y-2.5">
        <label className="block">
          <span className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-widest text-amber-200/70">
            Player ID
          </span>
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="GUID..."
            className="w-full rounded-lg border border-[color:var(--gold)]/30 bg-black/50 px-4 py-3 font-mono text-sm text-stone-100 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex items-center gap-1 text-[0.65rem] font-medium text-amber-200/60 hover:text-amber-200"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
          სერვერის პარამეტრები
        </button>

        {showAdvanced && (
          <label className="block">
            <span className="mb-1 block text-[0.6rem] font-semibold uppercase tracking-widest text-amber-200/70">
              API Base URL
            </span>
            <input
              value={apiBase}
              onChange={(e) => onApiBaseChange(e.target.value)}
              placeholder="http://localhost:8080"
              className="w-full rounded-lg border border-[color:var(--gold)]/30 bg-black/50 px-4 py-2.5 font-mono text-xs text-stone-100 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />
          </label>
        )}
      </div>

      <div className="flex w-full flex-col gap-2">
        <button
          type="submit"
          disabled={loggingIn}
          className="cabinet-button flex items-center justify-center gap-2 rounded-lg py-3 font-display text-sm font-bold uppercase tracking-widest text-stone-50 disabled:opacity-50"
        >
          {loggingIn ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          შესვლა
        </button>
      </div>

      {error && (
        <p className="text-center text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
