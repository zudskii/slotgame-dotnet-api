"use client"

import { X } from "lucide-react"
import type { SymbolName } from "../../lib/slot-types"
import { SymbolIcon } from "./symbol-icon"

interface PaytableProps {
  onClose: () => void
}

const ROWS: { name: SymbolName; pays: [number, number, number]; note?: string }[] = [
  { name: "Wild", pays: [5, 20, 100], note: "ცვლის ყველა სიმბოლოს" },
  { name: "Scatter", pays: [2, 10, 50], note: "იხდის ნებისმიერ ადგილას" },
  { name: "Seven", pays: [3, 10, 40] },
  { name: "Bar", pays: [1.5, 4, 10] },
  { name: "Bell", pays: [1, 2.5, 5] },
  { name: "Lemon", pays: [0.5, 1, 2] },
  { name: "Cherry", pays: [0.5, 1, 2] },
]

export function Paytable({ onClose }: PaytableProps) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center rounded-[1.4rem] bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-sm overflow-auto rounded-xl bg-gradient-to-b from-stone-800 to-stone-950 p-4 ring-1 ring-[color:var(--gold)]/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-amber-300">
            გადახდის ცხრილი
          </h2>
          <button
            onClick={onClose}
            aria-label="Close paytable"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-amber-300 hover:bg-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-2 text-[0.6rem] font-semibold uppercase tracking-widest text-amber-200/60">
          <span>Symbol</span>
          <span className="text-right">x3</span>
          <span className="text-right">x4</span>
          <span className="text-right">x5</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {ROWS.map((r) => (
            <div
              key={r.name}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 rounded-lg bg-black/40 px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <SymbolIcon name={r.name} className="h-8 w-8" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-stone-100">{r.name}</span>
                  {r.note && (
                    <span className="text-[0.6rem] text-amber-200/60">{r.note}</span>
                  )}
                </div>
              </div>
              {r.pays.map((p, i) => (
                <span key={i} className="text-right font-mono text-sm text-amber-300 tabular-nums">
                  {p}×
                </span>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[0.65rem] leading-relaxed text-stone-400">
          10 ფიქსირებული ხაზი · მოგება მარცხნიდან მარჯვნივ · გამრავლდება საერთო ფსონზე
        </p>
      </div>
    </div>
  )
}
