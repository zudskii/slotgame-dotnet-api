"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Volume2, VolumeX, LogOut } from "lucide-react"
import {
  createApiClient,
  DEFAULT_API_BASE,
  PAYLINES,
  type SlotApi,
} from "../../lib/slot-api"
import {
  BET_LEVELS,
  SYMBOL_NAMES,
  type Grid,
  type SpinResponse,
  type SymbolName,
  type WinLineDto,
} from "../../lib/slot-types"
import { useGameSound } from "../../lib/use-game-sound"
import type { SoundName } from "../../lib/sound-engine"
import { Preloader } from "./preloader"
import { LoginScreen } from "./login-screen"
import { Reels } from "./reels"
import { ControlPanel } from "./control-panel"
import { WinOverlay } from "./win-overlay"
import { Paytable } from "./paytable"

function emptyGrid(): Grid {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => SYMBOL_NAMES[Math.floor(Math.random() * SYMBOL_NAMES.length)]),
  )
}

function randSymbol(): SymbolName {
  return SYMBOL_NAMES[Math.floor(Math.random() * SYMBOL_NAMES.length)]
}

function computeWinCells(grid: Grid, lines: WinLineDto[]): Set<string> {
  const cells = new Set<string>()
  for (const line of lines) {
    if (line.paylineId >= 1 && line.paylineId <= PAYLINES.length) {
      const pattern = PAYLINES[line.paylineId - 1]
      for (let col = 0; col < Math.min(line.matchCount, 5); col++) {
        cells.add(`${col}-${pattern[col]}`)
      }
    } else {
      // scatter / anywhere pays — highlight all matching symbols
      grid.forEach((col, ci) =>
        col.forEach((s, ri) => {
          if (s === line.symbol) cells.add(`${ci}-${ri}`)
        }),
      )
    }
  }
  return cells
}

// სვეტში ჩამოვარდნილი "სპეციალური" სიმბოლოების ხმები (Scatter → Wild → Seven).
function specialSoundsForColumn(col: (SymbolName | null)[]): SoundName[] {
  const out: SoundName[] = []
  if (col.includes("Scatter")) out.push("scatter")
  if (col.includes("Wild")) out.push("wild")
  if (col.includes("Seven")) out.push("seven")
  return out
}

export default function SlotGame() {
  const [loading, setLoading] = useState(true)
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState("")

  const [balance, setBalance] = useState<number | null>(null)
  const [lastWin, setLastWin] = useState(0)
  const [bet, setBet] = useState(1)
  const [grid, setGrid] = useState<Grid>(emptyGrid())
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false])
  const [winCells, setWinCells] = useState<Set<string>>(new Set())
  const [bigWin, setBigWin] = useState<{ amount: number; bet: number } | null>(null)
  const [paytableOpen, setPaytableOpen] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [muted, setMuted] = useState(false)
  const [status, setStatus] = useState<{ text: string; kind: "" | "error" | "ok" }>({
    text: "",
    kind: "",
  })

  // ხმის ძრავა — მთლიანად ფრონტზე, Web Audio API-ით.
  const sound = useGameSound(muted)

  const apiRef = useRef<SlotApi | null>(null)
  const spinTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const stopTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const autoplayRef = useRef(false)
  const spinningRef = useRef(false)

  const anyReelSpinning = spinningReels.some(Boolean)

  useEffect(() => {
    autoplayRef.current = autoplay
  }, [autoplay])

  useEffect(
    () => () => {
      clearInterval(spinTimerRef.current)
      stopTimersRef.current.forEach(clearTimeout)
      sound.stopWhir()
    },
    [sound],
  )

  const handleLogin = async (playerId: string) => {
    if (!playerId.trim()) {
      setLoginError("შეიყვანე Player ID")
      sound.play("error")
      return
    }
    setLoggingIn(true)
    setLoginError("")
    try {
      const client = createApiClient(apiBase.trim().replace(/\/$/, ""))
      await client.login(playerId.trim())
      apiRef.current = client
      setLoggedIn(true)
      sound.play("login")
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "დაკავშირება ვერ მოხერხდა")
      sound.play("error")
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    clearInterval(spinTimerRef.current)
    stopTimersRef.current.forEach(clearTimeout)
    sound.stopWhir()
    sound.play("click")
    apiRef.current = null
    setLoggedIn(false)
    setAutoplay(false)
    setBalance(null)
    setLastWin(0)
    setWinCells(new Set())
    setBigWin(null)
    setStatus({ text: "", kind: "" })
  }

  const adjustBet = (dir: number) => {
    sound.play("bet")
    setBet((b) => {
      const idx = BET_LEVELS.findIndex((v) => v >= b)
      const next = Math.min(BET_LEVELS.length - 1, Math.max(0, idx + dir))
      return BET_LEVELS[next]
    })
  }
  const maxBet = () => {
    sound.play("bet")
    setBet(BET_LEVELS[BET_LEVELS.length - 1])
  }

  const handleSpin = useCallback(async () => {
    if (!apiRef.current || spinningRef.current) return
    if (balance !== null && bet > balance) {
      setStatus({ text: "არასაკმარისი ბალანსი", kind: "error" })
      setAutoplay(false)
      sound.play("error")
      return
    }

    spinningRef.current = true
    setSpinningReels([true, true, true, true, true])
    setWinCells(new Set())
    setLastWin(0)
    setStatus({ text: "", kind: "" })

    // ხმა: ბრუნვის სტარტი + უწყვეტი მექანიკური გუგუნი
    sound.play("spin")
    sound.startWhir()

    // blur cycle for spinning reels
    spinTimerRef.current = setInterval(() => {
      setGrid((g) => g.map((col) => col.map(() => randSymbol())))
    }, 60)

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    const spinPromise = apiRef.current.spin(bet, idempotencyKey)
    const minAnim = new Promise<void>((r) => setTimeout(r, 650))

    let res: Response
    try {
      const [r] = await Promise.all([spinPromise, minAnim])
      res = r
    } catch {
      clearInterval(spinTimerRef.current)
      sound.stopWhir()
      sound.play("error")
      setSpinningReels([false, false, false, false, false])
      spinningRef.current = false
      setAutoplay(false)
      setStatus({ text: "სერვერთან კავშირი ვერ მოხერხდა", kind: "error" })
      return
    }

    clearInterval(spinTimerRef.current)

    if (res.status === 429) {
      sound.stopWhir()
      sound.play("error")
      setSpinningReels([false, false, false, false, false])
      spinningRef.current = false
      setAutoplay(false)
      setStatus({ text: "ძალიან ხშირად ტრიალებ — დაელოდე რამდენიმე წამს", kind: "error" })
      return
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      sound.stopWhir()
      sound.play("error")
      setSpinningReels([false, false, false, false, false])
      spinningRef.current = false
      setAutoplay(false)
      setStatus({ text: body.error || `შეცდომა (${res.status})`, kind: "error" })
      return
    }

    const result: SpinResponse = await res.json()
    const finalGrid = result.grid as Grid

    // staggered left-to-right stop
    stopTimersRef.current = []
    for (let col = 0; col < 5; col++) {
      const t = setTimeout(() => {
        setGrid((g) => {
          const ng = g.map((c) => [...c])
          ng[col] = finalGrid[col]
          return ng
        })
        setSpinningReels((prev) => {
          const nx = [...prev]
          nx[col] = false
          return nx
        })

        // ხმა: ბარაბნის დაჯდომა (თითო სვეტს თავისი "თუდ")
        sound.play("reelStop")

        // ხმა: სპეციალური სიმბოლოების ("Wild / Scatter / Seven") ჩამოვარდნა
        const specials = specialSoundsForColumn(finalGrid[col])
        specials.forEach((s, i) => {
          const st = setTimeout(() => sound.play(s), 110 + i * 90)
          stopTimersRef.current.push(st)
        })

        // ბოლო სვეტი გაჩერდა — გუგუნი ვჩერდებით
        if (col === 4) sound.stopWhir()
      }, col * 170)
      stopTimersRef.current.push(t)
    }

    // after all reels settled, reveal outcome
    const settleT = setTimeout(() => {
      sound.stopWhir()
      setBalance(result.newBalance)
      setLastWin(result.totalWin)
      if (result.totalWin > 0) {
        setWinCells(computeWinCells(finalGrid, result.winningLines))
        setStatus({ text: `მოგება ${result.totalWin.toFixed(2)}!`, kind: "ok" })
        const ratio = result.totalWin / Math.max(bet, 0.01)
        if (result.totalWin >= bet * 5) {
          setBigWin({ amount: result.totalWin, bet })
          // ხმა: დიდი / მეგა მოგების ფანფარა
          sound.play(ratio >= 50 ? "megaWin" : "bigWin")
        } else {
          // ხმა: ჩვეულებრივი მოგება
          sound.play("win")
        }
      } else {
        setStatus({ text: "ამჯერად უიღბლო — სცადე ისევ", kind: "" })
      }
      spinningRef.current = false

      // autoplay continuation
      if (autoplayRef.current) {
        const next = result.newBalance
        if (next >= bet) {
          setTimeout(() => {
            if (autoplayRef.current) handleSpin()
          }, result.totalWin > 0 ? 1600 : 550)
        } else {
          setAutoplay(false)
        }
      }
    }, 5 * 170 + 120)
    stopTimersRef.current.push(settleT)
  }, [bet, balance, sound])

  const toggleAutoplay = () => {
    sound.play("click")
    setAutoplay((a) => {
      const next = !a
      if (next && !spinningRef.current) {
        setTimeout(() => handleSpin(), 50)
      }
      return next
    })
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-3 sm:p-6">
      {loading && <Preloader onComplete={() => setLoading(false)} />}

      {/* background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/casino-bg.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        <div className="bg-vignette absolute inset-0" />
      </div>

      <div className="cabinet relative w-full max-w-md rounded-[1.6rem] p-4 sm:p-6">
        {/* top marquee */}
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-[color:var(--gold)]/50">
              <Image src="/chajma-logo.png" alt="chajma.bet" fill className="object-cover" />
            </div>
            <div className="leading-none">
              <span className="font-display text-lg font-extrabold tracking-tight text-amber-300 [text-shadow:0_1px_6px_rgba(230,180,34,0.35)]">
                chajma<span className="text-rose-400">.bet</span>
              </span>
              <p className="text-[0.5rem] font-semibold uppercase tracking-[0.3em] text-amber-200/50">
                Fruit Fortune
              </p>
            </div>
          </div>
          {loggedIn && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sound.play("click")
                  setMuted((m) => !m)
                }}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-amber-300 ring-1 ring-[color:var(--gold)]/25 hover:bg-black/60"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-amber-300 ring-1 ring-[color:var(--gold)]/25 hover:bg-black/60"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </header>

        {!loggedIn ? (
          <div className="py-4">
            <LoginScreen
              apiBase={apiBase}
              onApiBaseChange={setApiBase}
              loggingIn={loggingIn}
              error={loginError}
              onLogin={handleLogin}
            />
          </div>
        ) : (
          <div className="relative">
            <Reels
              grid={grid}
              spinningReels={spinningReels}
              winCells={winCells}
              anyWin={winCells.size > 0}
            />

            <ControlPanel
              balance={balance}
              bet={bet}
              lastWin={lastWin}
              spinning={anyReelSpinning}
              autoplay={autoplay}
              onAdjustBet={adjustBet}
              onMaxBet={maxBet}
              onSpin={handleSpin}
              onToggleAutoplay={toggleAutoplay}
              onOpenPaytable={() => {
                sound.play("click")
                setPaytableOpen(true)
              }}
            />

            <p
              className={`mt-2 min-h-[1.25rem] text-center text-sm ${
                status.kind === "error"
                  ? "text-rose-400"
                  : status.kind === "ok"
                    ? "text-emerald-400"
                    : "text-stone-400"
              }`}
              role="status"
            >
              {status.text}
            </p>

            {bigWin && (
              <WinOverlay
                amount={bigWin.amount}
                bet={bigWin.bet}
                onDone={() => setBigWin(null)}
              />
            )}
            {paytableOpen && <Paytable onClose={() => setPaytableOpen(false)} />}
          </div>
        )}
      </div>
    </main>
  )
}
