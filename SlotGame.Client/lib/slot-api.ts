import type { LoginResponse } from "./slot-types"

// ============================================================
// API client — ზუსტად შეესაბამება SlotGame.Api-ს.
// login({ playerId })  →  POST /api/Auth/login
// spin({ betAmount, idempotencyKey })  →  POST /api/Spin  (Bearer token)
// ============================================================

// Vite-ში ეს იქნება import.meta.env.VITE_API_BASE_URL.
// აქ (Next.js preview) ვკითხულობთ public env-ს ლოკალური default-ით.
export const DEFAULT_API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:8080"

export interface SlotApi {
  login(playerId: string): Promise<LoginResponse>
  spin(betAmount: number, idempotencyKey: string): Promise<Response>
}

export function createApiClient(baseUrl: string): SlotApi {
  let token = ""
  return {
    async login(playerId: string): Promise<LoginResponse> {
      const res = await fetch(`${baseUrl}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      })
      if (!res.ok) throw new Error(`Login failed (${res.status})`)
      const data: LoginResponse = await res.json()
      token = data.token
      return data
    },
    spin(betAmount: number, idempotencyKey: string): Promise<Response> {
      return fetch(`${baseUrl}/api/Spin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ betAmount, idempotencyKey }),
      })
    },
  }
}

// 10 fixed paylines over a 5x3 grid (row index per column).
// მხოლოდ მომგებიანი უჯრების ვიზუალური მონიშვნისთვის — payout ლოგიკა სერვერზეა.
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 1, 1, 2],
]
