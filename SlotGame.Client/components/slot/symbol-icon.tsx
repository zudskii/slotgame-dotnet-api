import type { SymbolName } from "@/lib/slot-types"

interface SymbolIconProps {
  name: SymbolName | string
  className?: string
}

// Rich EGT/Amusnet-style fruit-machine symbols with gradients + shine.
export function SymbolIcon({ name, className = "" }: SymbolIconProps) {
  const uid = name // gradients ids are shared per symbol type, fine for repeats
  const common = { viewBox: "0 0 64 64", className }

  switch (name) {
    case "Cherry":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={`cherry-${uid}`} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ff7a92" />
              <stop offset="45%" stopColor="#d31f3c" />
              <stop offset="100%" stopColor="#7c0f22" />
            </radialGradient>
          </defs>
          <path
            d="M32 8 Q40 18 27 26 M32 8 Q26 18 41 28"
            stroke="#6a4423"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <path d="M30 8 Q44 4 52 12 Q42 12 34 12 Z" fill="#3f8a4a" />
          <circle cx={23} cy={42} r={13} fill={`url(#cherry-${uid})`} stroke="#5a0d1a" strokeWidth={1} />
          <circle cx={42} cy={44} r={13} fill={`url(#cherry-${uid})`} stroke="#5a0d1a" strokeWidth={1} />
          <ellipse cx={19} cy={37} rx={3.5} ry={2.6} fill="#ffd0da" opacity={0.85} />
          <ellipse cx={38} cy={39} rx={3.5} ry={2.6} fill="#ffd0da" opacity={0.85} />
        </svg>
      )
    case "Lemon":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={`lemon-${uid}`} cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#fff6bd" />
              <stop offset="55%" stopColor="#f2cf3f" />
              <stop offset="100%" stopColor="#b98d16" />
            </radialGradient>
          </defs>
          <ellipse cx={32} cy={33} rx={21} ry={16} fill={`url(#lemon-${uid})`} stroke="#8a6b12" strokeWidth={1.5} />
          <ellipse cx={12} cy={33} rx={4} ry={6} fill="#f2d94e" />
          <ellipse cx={52} cy={33} rx={4} ry={6} fill="#f2d94e" />
          <ellipse cx={25} cy={25} rx={7} ry={3.4} fill="#fffde3" opacity={0.7} />
        </svg>
      )
    case "Bell":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={`bell-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe89a" />
              <stop offset="45%" stopColor="#e6b422" />
              <stop offset="100%" stopColor="#9c7a10" />
            </linearGradient>
          </defs>
          <path
            d="M32 8 Q13 11 13 35 Q13 43 7 47 L57 47 Q51 43 51 35 Q51 11 32 8 Z"
            fill={`url(#bell-${uid})`}
            stroke="#7a5f0e"
            strokeWidth={1.5}
          />
          <rect x={6} y={46} width={52} height={6} rx={3} fill="#f0c74a" stroke="#7a5f0e" strokeWidth={0.8} />
          <circle cx={32} cy={57} r={4.5} fill="#8a6f1a" />
          <circle cx={32} cy={7} r={3} fill="none" stroke="#7a5f0e" strokeWidth={3} />
          <ellipse cx={24} cy={22} rx={3.5} ry={7} fill="#fff6cf" opacity={0.55} />
        </svg>
      )
    case "Bar":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={`bar-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="100%" stopColor="#d9a92a" />
            </linearGradient>
          </defs>
          <rect x={4} y={19} width={56} height={26} rx={6} fill="#1a1410" stroke="#d9a92a" strokeWidth={2} />
          <text
            x={32}
            y={39}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontWeight={700}
            fontSize={17}
            fill={`url(#bar-${uid})`}
            letterSpacing={1.5}
          >
            BAR
          </text>
        </svg>
      )
    case "Seven":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={`seven-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a5c" />
              <stop offset="55%" stopColor="#d6392f" />
              <stop offset="100%" stopColor="#8c1a20" />
            </linearGradient>
          </defs>
          <text x={35} y={48} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={50} fill="#4a0d18">
            7
          </text>
          <text x={32} y={45} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={50} fill={`url(#seven-${uid})`}>
            7
          </text>
        </svg>
      )
    case "Wild": {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 23 : 9.5
        const a = (Math.PI / 5) * i - Math.PI / 2
        pts.push(`${32 + r * Math.cos(a)},${30 + r * Math.sin(a)}`)
      }
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={`wild-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#fff6cf" />
              <stop offset="55%" stopColor="#f2c53d" />
              <stop offset="100%" stopColor="#a9781a" />
            </radialGradient>
          </defs>
          <polygon
            points={pts.join(" ")}
            fill={`url(#wild-${uid})`}
            stroke="#7a5810"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <text x={32} y={53} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={9} fill="#7a5810" letterSpacing={1}>
            WILD
          </text>
        </svg>
      )
    }
    case "Scatter":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={`scatter-${uid}`} cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="#8fe9dd" />
              <stop offset="55%" stopColor="#2a9d8f" />
              <stop offset="100%" stopColor="#134e46" />
            </radialGradient>
          </defs>
          <polygon points="32,5 55,26 32,59 9,26" fill={`url(#scatter-${uid})`} stroke="#0f3e38" strokeWidth={1.5} />
          <line x1={32} y1={5} x2={32} y2={59} stroke="#0f3e38" strokeWidth={1} opacity={0.5} />
          <line x1={9} y1={26} x2={55} y2={26} stroke="#0f3e38" strokeWidth={1} opacity={0.5} />
          <polygon points="32,5 43,26 32,26 21,26" fill="#c6f4ec" opacity={0.5} />
          <text x={32} y={44} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={8} fill="#0f3e38" letterSpacing={1}>
            SCATTER
          </text>
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx={32} cy={32} r={4} fill="#f1e9d8" opacity={0.3} />
        </svg>
      )
  }
}
