import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { EarThresholds } from '@/types'
import { FREQUENCIES } from '@/types'

interface Props {
  rightEar: EarThresholds
  leftEar: EarThresholds
  title?: string
  maskingRight?: { va?: number | null; vo?: number | null }
  maskingLeft?: { va?: number | null; vo?: number | null }
}

/** Converte os limiares em pontos para o gráfico Recharts */
function buildChartData(right: EarThresholds, left: EarThresholds) {
  return FREQUENCIES.map((freq) => ({
    frequency: `${freq >= 1000 ? freq / 1000 + 'k' : freq}`,
    freqValue: freq,
    rightAir: right.airConduction[freq] ?? undefined,
    rightBone: right.boneConduction[freq] ?? undefined,
    leftAir: left.airConduction[freq] ?? undefined,
    leftBone: left.boneConduction[freq] ?? undefined,
  }))
}

// ── Símbolos sem mascaramento ─────────────────────────────────────────────────

// O — OD via aérea sem mascaramento
function RightAirDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return <circle cx={cx} cy={cy} r={8} stroke="#e74c3c" strokeWidth={2.5} fill="white" />
}

// X — OE via aérea sem mascaramento
function LeftAirDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return (
    <g>
      <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy + 7} stroke="#2980b9" strokeWidth={2.5} />
      <line x1={cx + 7} y1={cy - 7} x2={cx - 7} y2={cy + 7} stroke="#2980b9" strokeWidth={2.5} />
    </g>
  )
}

// < — OD via óssea sem mascaramento
function RightBoneDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return (
    <g>
      <line x1={cx + 8} y1={cy - 8} x2={cx - 6} y2={cy} stroke="#e74c3c" strokeWidth={2.5} />
      <line x1={cx - 6} y1={cy} x2={cx + 8} y2={cy + 8} stroke="#e74c3c" strokeWidth={2.5} />
    </g>
  )
}

// > — OE via óssea sem mascaramento
function LeftBoneDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return (
    <g>
      <line x1={cx - 8} y1={cy - 8} x2={cx + 6} y2={cy} stroke="#2980b9" strokeWidth={2.5} />
      <line x1={cx + 6} y1={cy} x2={cx - 8} y2={cy + 8} stroke="#2980b9" strokeWidth={2.5} />
    </g>
  )
}

// ── Símbolos COM mascaramento ─────────────────────────────────────────────────

// △ — OD via aérea COM mascaramento
function RightAirMaskedDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  const r = 8
  const pts = `${cx},${cy - r} ${cx + r * 0.87},${cy + r * 0.5} ${cx - r * 0.87},${cy + r * 0.5}`
  return <polygon points={pts} stroke="#e74c3c" strokeWidth={2.5} fill="white" />
}

// □ — OE via aérea COM mascaramento
function LeftAirMaskedDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  const s = 8
  return <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} stroke="#2980b9" strokeWidth={2.5} fill="white" />
}

// [ — OD via óssea COM mascaramento (colchete direito invertido)
function RightBoneMaskedDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return (
    <g stroke="#e74c3c" strokeWidth={2.5} fill="none">
      <line x1={cx + 6} y1={cy - 8} x2={cx - 4} y2={cy - 8} />
      <line x1={cx - 4} y1={cy - 8} x2={cx - 4} y2={cy + 8} />
      <line x1={cx - 4} y1={cy + 8} x2={cx + 6} y2={cy + 8} />
    </g>
  )
}

// ] — OE via óssea COM mascaramento
function LeftBoneMaskedDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return (
    <g stroke="#2980b9" strokeWidth={2.5} fill="none">
      <line x1={cx - 6} y1={cy - 8} x2={cx + 4} y2={cy - 8} />
      <line x1={cx + 4} y1={cy - 8} x2={cx + 4} y2={cy + 8} />
      <line x1={cx + 4} y1={cy + 8} x2={cx - 6} y2={cy + 8} />
    </g>
  )
}

// ── Seta NR (sem resposta) ────────────────────────────────────────────────────

function NRDot(props: { cx?: number; cy?: number; value?: number; color: string }) {
  const { cx = 0, cy = 0, value, color } = props
  if (value == null) return null
  return (
    <g>
      <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke={color} strokeWidth={2.5} />
      <line x1={cx - 6} y1={cy + 4} x2={cx} y2={cy + 10} stroke={color} strokeWidth={2.5} />
      <line x1={cx + 6} y1={cy + 4} x2={cx} y2={cy + 10} stroke={color} strokeWidth={2.5} />
    </g>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AudiogramChart({ rightEar, leftEar, title, maskingRight, maskingLeft }: Props) {
  const data = buildChartData(rightEar, leftEar)

  const useMaskRight_va  = !!(maskingRight?.va)
  const useMaskRight_vo  = !!(maskingRight?.vo)
  const useMaskLeft_va   = !!(maskingLeft?.va)
  const useMaskLeft_vo   = !!(maskingLeft?.vo)

  return (
    <div>
      {title && (
        <h4 style={{ textAlign: 'center', marginBottom: 8 }}>{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="frequency"
            label={{ value: 'Frequência (Hz)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            reversed
            domain={[-10, 120]}
            ticks={[-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]}
            label={{
              value: 'Intensidade (dBHL)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                rightAir: 'OD - Via Aérea',
                rightBone: 'OD - Via Óssea',
                leftAir: 'OE - Via Aérea',
                leftBone: 'OE - Via Óssea',
              }
              return [`${value} dBHL`, labels[name] || name]
            }}
          />
          <Legend
            payload={[
              { value: `OD — VA  ${useMaskRight_va ? '△ mascarado' : 'O sem mascaramento'}`, type: 'line', color: '#e74c3c' },
              { value: `OD — VO  ${useMaskRight_vo ? '[ mascarado' : '< sem mascaramento'}`, type: 'none', color: '#e74c3c' },
              { value: `OE — VA  ${useMaskLeft_va  ? '□ mascarado' : 'X sem mascaramento'}`, type: 'line', color: '#2980b9' },
              { value: `OE — VO  ${useMaskLeft_vo  ? '] mascarado' : '> sem mascaramento'}`, type: 'none', color: '#2980b9' },
              ...(rightEar.airNR  ? [{ value: 'OD — VA  NR (↓)', type: 'none' as const, color: '#e74c3c' }] : []),
              ...(rightEar.boneNR ? [{ value: 'OD — VO  NR (↓)', type: 'none' as const, color: '#e74c3c' }] : []),
              ...(leftEar.airNR   ? [{ value: 'OE — VA  NR (↓)', type: 'none' as const, color: '#2980b9' }] : []),
              ...(leftEar.boneNR  ? [{ value: 'OE — VO  NR (↓)', type: 'none' as const, color: '#2980b9' }] : []),
            ]}
            wrapperStyle={{ paddingTop: 12 }}
          />
          <ReferenceLine
            y={20}
            stroke="#52c41a"
            strokeDasharray="5 5"
            label={{ value: 'Normal (20 dBHL)', position: 'insideTopRight', fill: '#52c41a', fontSize: 11 }}
          />

          {/* OD — Via Aérea */}
          <Line
            dataKey="rightAir"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={rightEar.airNR
              ? (p: { cx?: number; cy?: number; value?: number }) => <NRDot {...p} color="#e74c3c" />
              : useMaskRight_va
                ? <RightAirMaskedDot />
                : <RightAirDot />
            }
            activeDot={{ r: 6, fill: '#e74c3c' }}
            connectNulls
          />
          {/* OD — Via Óssea */}
          <Line
            dataKey="rightBone"
            stroke="#e74c3c"
            strokeWidth={0}
            dot={rightEar.boneNR
              ? (p: { cx?: number; cy?: number; value?: number }) => <NRDot {...p} color="#e74c3c" />
              : useMaskRight_vo
                ? <RightBoneMaskedDot />
                : <RightBoneDot />
            }
            activeDot={false}
            connectNulls={false}
          />
          {/* OE — Via Aérea */}
          <Line
            dataKey="leftAir"
            stroke="#2980b9"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={leftEar.airNR
              ? (p: { cx?: number; cy?: number; value?: number }) => <NRDot {...p} color="#2980b9" />
              : useMaskLeft_va
                ? <LeftAirMaskedDot />
                : <LeftAirDot />
            }
            activeDot={{ r: 6, fill: '#2980b9' }}
            connectNulls
          />
          {/* OE — Via Óssea */}
          <Line
            dataKey="leftBone"
            stroke="#2980b9"
            strokeWidth={0}
            dot={leftEar.boneNR
              ? (p: { cx?: number; cy?: number; value?: number }) => <NRDot {...p} color="#2980b9" />
              : useMaskLeft_vo
                ? <LeftBoneMaskedDot />
                : <LeftBoneDot />
            }
            activeDot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
