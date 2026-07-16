// ============================================================
// Types — matches SlotGame.Api/Dtos/SpinDtos.cs
// ============================================================
export type SymbolName =
  | "Cherry"
  | "Lemon"
  | "Bell"
  | "Bar"
  | "Seven"
  | "Wild"
  | "Scatter"

export interface LoginResponse {
  token: string
  expiresAt: string
}

export interface WinLineDto {
  paylineId: number
  symbol: string
  matchCount: number
  payout: number
}

export interface SpinResponse {
  grid: string[][]
  betAmount: number
  totalWin: number
  winningLines: WinLineDto[]
  newBalance: number
}

export interface ApiErrorBody {
  error?: string
}

export type Grid = (SymbolName | null)[][]

export const SYMBOL_NAMES: SymbolName[] = [
  "Cherry",
  "Lemon",
  "Bell",
  "Bar",
  "Seven",
  "Wild",
  "Scatter",
]

// Bet config
export const BET_STEP = 0.5
export const MIN_BET = 0.1
export const MAX_BET = 500
export const BET_LEVELS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]
