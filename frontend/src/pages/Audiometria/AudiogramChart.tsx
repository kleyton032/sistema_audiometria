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

// Símbolo O para orelha direita via aérea
function RightAirDot(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props
  return (
    <circle
      cx={cx}
      cy={cy}
      r={8}
      stroke="#e74c3c"
      strokeWidth={2}
      fill="none"
    />
  )
}

// Símbolo X para orelha esquerda via aérea
function LeftAirDot(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props
  return (
    <g>
      <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke="#2980b9" strokeWidth={2} />
      <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke="#2980b9" strokeWidth={2} />
    </g>
  )
}

// Símbolo < para orelha direita via óssea
function RightBoneDot(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props
  return (
    <g>
      <line x1={cx + 5} y1={cy - 7} x2={cx - 5} y2={cy} stroke="#e74c3c" strokeWidth={2} />
      <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy + 7} stroke="#e74c3c" strokeWidth={2} />
    </g>
  )
}

// Símbolo > para orelha esquerda via óssea
function LeftBoneDot(props: { cx?: number; cy?: number }) {
  const { cx = 0, cy = 0 } = props
  return (
    <g>
      <line x1={cx - 5} y1={cy - 7} x2={cx + 5} y2={cy} stroke="#2980b9" strokeWidth={2} />
      <line x1={cx + 5} y1={cy} x2={cx - 5} y2={cy + 7} stroke="#2980b9" strokeWidth={2} />
    </g>
  )
}

export default function AudiogramChart({ rightEar, leftEar, title }: Props) {
  const data = buildChartData(rightEar, leftEar)

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
              { value: 'OD - Via Aérea (O)', type: 'circle', color: '#e74c3c' },
              { value: 'OD - Via Óssea (<)', type: 'triangle', color: '#e74c3c' },
              { value: 'OE - Via Aérea (X)', type: 'cross', color: '#2980b9' },
              { value: 'OE - Via Óssea (>)', type: 'triangle', color: '#2980b9' },
            ]}
          />
          {/* Linha de normalidade (25 dBHL) */}
          <ReferenceLine y={25} stroke="#52c41a" strokeDasharray="5 5" label="Normal" />

          {/* OD — Via Aérea (O vermelho, linha contínua) */}
          <Line
            dataKey="rightAir"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={<RightAirDot />}
            connectNulls
          />
          {/* OD — Via Óssea (< vermelho, linha tracejada) */}
          <Line
            dataKey="rightBone"
            stroke="#e74c3c"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={<RightBoneDot />}
            connectNulls
          />
          {/* OE — Via Aérea (X azul, linha contínua) */}
          <Line
            dataKey="leftAir"
            stroke="#2980b9"
            strokeWidth={2}
            dot={<LeftAirDot />}
            connectNulls
          />
          {/* OE — Via Óssea (> azul, linha tracejada) */}
          <Line
            dataKey="leftBone"
            stroke="#2980b9"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={<LeftBoneDot />}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
