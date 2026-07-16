// ============================================================
// Sound engine — 100% ფრონტზე, Web Audio API-ით სინთეზირებული.
// ფაილები არ სჭირდება; ყველა ხმა რეალურ დროში იგება ოსცილატორებით.
//
// რატომ ფრონტზე და არა სერვერზე?
//   ხმა წმინდა პრეზენტაციაა — სერვერი მხოლოდ თამაშის შედეგს აბრუნებს
//   (grid, totalWin, ...), ბრაუზერი კი შედეგის მიხედვით უკრავს შესაბამის ხმას.
//   ასე ხმა მყისიერია, latency-ს არ ქმნის და სერვერს არ ტვირთავს.
// ============================================================

export type SoundName =
  | "spin"
  | "reelStop"
  | "win"
  | "bigWin"
  | "megaWin"
  | "coin"
  | "wild"
  | "scatter"
  | "seven"
  | "click"
  | "bet"
  | "error"
  | "login"

type Ctx = AudioContext

class SoundEngine {
  private ctx: Ctx | null = null
  private master: GainNode | null = null
  private muted = false
  private whir: { osc: OscillatorNode[]; gain: GainNode; lfo: OscillatorNode } | null = null

  // AudioContext მხოლოდ user-gesture-ის შემდეგ იქმნება (ბრაუზერის წესი).
  private ensure(): Ctx | null {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AC: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.85
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === "suspended") void this.ctx.resume()
    return this.ctx
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setTargetAtTime(m ? 0 : 0.85, now, 0.05)
    }
  }

  isMuted() {
    return this.muted
  }

  // ---- დაბალი დონის პრიმიტივები -----------------------------------------

  private tone(
    freq: number,
    at: number,
    dur: number,
    opts: {
      type?: OscillatorType
      gain?: number
      attack?: number
      release?: number
      glideTo?: number
      dest?: AudioNode
    } = {},
  ) {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const { type = "sine", gain = 0.3, attack = 0.005, release = 0.08, glideTo, dest } = opts
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), at + dur)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(gain, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + release)
    osc.connect(g)
    g.connect(dest ?? this.master)
    osc.start(at)
    osc.stop(at + dur + release + 0.02)
  }

  private noise(
    at: number,
    dur: number,
    opts: { gain?: number; type?: BiquadFilterType; freq?: number; q?: number } = {},
  ) {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const { gain = 0.2, type = "bandpass", freq = 1200, q = 0.8 } = opts
    const frames = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, at)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(at)
    src.stop(at + dur + 0.02)
  }

  private arp(notes: number[], step: number, dur: number, gain: number, type: OscillatorType = "triangle") {
    const ctx = this.ctx
    if (!ctx) return
    const t0 = ctx.currentTime + 0.01
    notes.forEach((f, i) => this.tone(f, t0 + i * step, dur, { type, gain, release: 0.14 }))
  }

  // ---- საჯარო: play(name) -------------------------------------------------

  play(name: SoundName) {
    const ctx = this.ensure()
    if (!ctx) return
    const t = ctx.currentTime + 0.01

    switch (name) {
      case "spin":
        // მოკლე whoosh + აწევადი ტონი — ბრუნვის სტარტი
        this.noise(t, 0.28, { gain: 0.14, type: "bandpass", freq: 900, q: 0.6 })
        this.tone(220, t, 0.22, { type: "sawtooth", gain: 0.09, glideTo: 520, release: 0.05 })
        break

      case "reelStop":
        // ბარაბნის დაჯდომის "თუდ" — დაბალი დარტყმა + კლიკი
        this.tone(150, t, 0.05, { type: "sine", gain: 0.32, glideTo: 70, release: 0.04 })
        this.noise(t, 0.045, { gain: 0.14, type: "lowpass", freq: 2600 })
        break

      case "seven":
        // "იღბლიანი" ding-ding-ding
        this.arp([784, 988, 1319], 0.08, 0.18, 0.26, "triangle")
        break

      case "wild":
        // მაგიური shimmer — აწევადი მაჟორული ტრიადა + სპარკლი
        this.arp([659, 831, 988, 1319], 0.06, 0.2, 0.22, "sine")
        this.tone(2637, t + 0.05, 0.3, { type: "sine", gain: 0.08, release: 0.2 })
        break

      case "scatter":
        // ბრჭყვიალა sparkle-cluster (ზარების მტევანი)
        this.arp([1047, 1319, 1568, 2093, 1568, 2093], 0.05, 0.16, 0.16, "sine")
        this.noise(t, 0.4, { gain: 0.05, type: "highpass", freq: 5000 })
        break

      case "win":
        // პატარა მოგების სასიამოვნო აკორდი
        this.arp([523, 659, 784], 0.07, 0.22, 0.24, "triangle")
        break

      case "bigWin":
        this.fanfare(false)
        break

      case "megaWin":
        this.fanfare(true)
        break

      case "coin":
        // მონეტის მეტალის "პინგ"
        this.tone(1760 + Math.random() * 300, t, 0.05, { type: "square", gain: 0.12, release: 0.1 })
        this.tone(2637, t + 0.01, 0.04, { type: "sine", gain: 0.08, release: 0.09 })
        break

      case "click":
        this.tone(660, t, 0.03, { type: "square", gain: 0.12, release: 0.03 })
        break

      case "bet":
        this.tone(880, t, 0.025, { type: "triangle", gain: 0.16, release: 0.03 })
        break

      case "error":
        // დაბალი buzz — არასაკმარისი ბალანსი / შეცდომა
        this.tone(160, t, 0.18, { type: "sawtooth", gain: 0.18, glideTo: 110, release: 0.05 })
        this.tone(161, t + 0.12, 0.16, { type: "sawtooth", gain: 0.16, glideTo: 100, release: 0.05 })
        break

      case "login":
        // წარმატებული შესვლის აღმავალი აკორდი
        this.arp([392, 523, 659, 784], 0.08, 0.26, 0.22, "triangle")
        break
    }
  }

  private fanfare(mega: boolean) {
    const ctx = this.ctx
    if (!ctx) return
    const t0 = ctx.currentTime + 0.01
    // ბრასის მსგავსი აღმავალი მელოდია
    const seq = mega
      ? [523, 659, 784, 1047, 1319, 1568, 2093]
      : [523, 659, 784, 1047, 1319]
    seq.forEach((f, i) => {
      this.tone(f, t0 + i * 0.11, 0.24, { type: "sawtooth", gain: 0.14, release: 0.12 })
      this.tone(f / 2, t0 + i * 0.11, 0.24, { type: "triangle", gain: 0.1, release: 0.12 })
    })
    // საბოლოო მდიდარი აკორდი
    const end = t0 + seq.length * 0.11
    ;[523, 659, 784, 1047].forEach((f) =>
      this.tone(f, end, 0.7, { type: "triangle", gain: mega ? 0.16 : 0.12, release: 0.4 }),
    )
    // მონეტების წვიმა
    const coinCount = mega ? 22 : 12
    for (let i = 0; i < coinCount; i++) {
      const at = t0 + 0.15 + i * (mega ? 0.06 : 0.08)
      this.tone(1760 + Math.random() * 500, at, 0.05, { type: "square", gain: 0.07, release: 0.1 })
    }
  }

  // ---- ბრუნვის უწყვეტი "whir" ---------------------------------------------

  startWhir() {
    const ctx = this.ensure()
    if (!ctx || !this.master || this.whir) return
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1)
    gain.connect(this.master)

    // ორი detuned ხერხისებრი ტონი = მექანიკური ბრუნვის გუგუნი
    const oscA = ctx.createOscillator()
    const oscB = ctx.createOscillator()
    oscA.type = "sawtooth"
    oscB.type = "sawtooth"
    oscA.frequency.value = 90
    oscB.frequency.value = 92
    const filt = ctx.createBiquadFilter()
    filt.type = "lowpass"
    filt.frequency.value = 700

    // LFO — მსუბუქი ტრემოლო (ბარაბნის რიტმი)
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 18
    lfoGain.gain.value = 0.02
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    oscA.connect(filt)
    oscB.connect(filt)
    filt.connect(gain)
    oscA.start()
    oscB.start()
    lfo.start()
    this.whir = { osc: [oscA, oscB], gain, lfo }
  }

  stopWhir() {
    const ctx = this.ctx
    if (!ctx || !this.whir) return
    const { osc, gain, lfo } = this.whir
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setTargetAtTime(0.0001, now, 0.04)
    osc.forEach((o) => o.stop(now + 0.2))
    lfo.stop(now + 0.2)
    this.whir = null
  }
}

let engine: SoundEngine | null = null

export function getSoundEngine(): SoundEngine {
  if (!engine) engine = new SoundEngine()
  return engine
}

export type { SoundEngine }
