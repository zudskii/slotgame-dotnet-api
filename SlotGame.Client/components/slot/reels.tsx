"use client"

import type { Grid } from "../../lib/slot-types"
import { SymbolIcon } from "./symbol-icon"

interface ReelsProps {
  grid: Grid
  // per-column spinning flags for staggered stops
  spinningReels: boolean[]
  // set of "col-row" strings that are part of a winning line
  winCells: Set<string>
  anyWin: boolean
}

export function Reels({ grid, spinningReels, winCells, anyWin }: ReelsProps) {
  return (
    <div className="reel-frame relative rounded-xl p-2 sm:p-3">
      {/* ornate corner bolts */}
      {[
        "-top-1.5 -left-1.5",
        "-top-1.5 -right-1.5",
        "-bottom-1.5 -left-1.5",
        "-bottom-1.5 -right-1.5",
      ].map((pos) => (
        <span
          key={pos}
          className={`absolute ${pos} h-3 w-3 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe9a8,#a9781a)] shadow-[0_0_6px_rgba(0,0,0,0.6)] ring-1 ring-black/40`}
        />
      ))}

      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
        {grid.map((col, ci) => {
          const spinning = spinningReels[ci]
          return (
            <div
              key={ci}
              className="flex flex-col gap-1 overflow-hidden rounded-lg bg-black/45 p-1 sm:gap-1.5"
            >
              {col.map((symbol, ri) => {
                const isWin = winCells.has(`${ci}-${ri}`)
                return (
                  <div
                    key={ri}
                    className={[
                      "reel-cell relative flex aspect-square items-center justify-center rounded-md",
                      spinning
                        ? "reel-cell-spinning"
                        : "reel-cell-settle",
                      isWin
                        ? "reel-cell-win"
                        : anyWin
                          ? "opacity-45"
                          : "",
                    ].join(" ")}
                    style={{ animationDelay: spinning ? "0ms" : `${ci * 40}ms` }}
                  >
                    {symbol ? (
                      <SymbolIcon
                        name={symbol}
                        className={`h-[78%] w-[78%] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] ${
                          spinning ? "blur-[1.5px] brightness-90" : ""
                        }`}
                      />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-stone-600" />
                    )}
                    {isWin && (
                      <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[color:var(--gold)] shadow-[0_0_16px_var(--gold)]" />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
