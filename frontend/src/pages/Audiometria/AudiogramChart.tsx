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

// Símbolo O para orelha direita via aérea (ASHA)
function RightAirDot(props: { cx?: number; cy?: number; value?: number }) {
  const { cx = 0, cy = 0, value } = props
  if (value == null) return null
  return (
    <circle cx={cx} cy={cy} r={8} stroke="#e74c3c" strokeWidth={2.5} fill="white" />
  )
}

// Símbolo X para orelha esquerda via aérea (ASHA)
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

// Símbolo < para orelha direita via óssea (ASHA)
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

// Símbolo > para orelha esquerda via óssea (ASHA)
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
              { value: 'OD — Via Aérea  (O) — linha contínua', type: 'line', color: '#e74c3c' },
              { value: 'OD — Via Óssea  (<) — sem linha', type: 'none', color: '#e74c3c' },
              { value: 'OE — Via Aérea  (X) — linha tracejada', type: 'line', color: '#2980b9' },
              { value: 'OE — Via Óssea  (>) — sem linha', type: 'none', color: '#2980b9' },
            ]}
            wrapperStyle={{ paddingTop: 12 }}
          />
          {/* Linha de normalidade: 20 dBHL (ASHA) */}
          <ReferenceLine
            y={20}
            stroke="#52c41a"
            strokeDasharray="5 5"
            label={{ value: 'Normal (20 dBHL)', position: 'insideTopRight', fill: '#52c41a', fontSize: 11 }}
          />

          {/* OD — Via Aérea: linha contínua vermelha + símbolo O */}
          <Line
            dataKey="rightAir"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={<RightAirDot />}
            activeDot={{ r: 6, fill: '#e74c3c' }}
            connectNulls
          />
          {/* OD — Via Óssea: sem linha, apenas símbolo < */}
          <Line
            dataKey="rightBone"
            stroke="#e74c3c"
            strokeWidth={0}
            dot={<RightBoneDot />}
            activeDot={false}
            connectNulls={false}
          />
          {/* OE — Via Aérea: linha tracejada azul + símbolo X */}
          <Line
            dataKey="leftAir"
            stroke="#2980b9"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={<LeftAirDot />}
            activeDot={{ r: 6, fill: '#2980b9' }}
            connectNulls
          />
          {/* OE — Via Óssea: sem linha, apenas símbolo > */}
          <Line
            dataKey="leftBone"
            stroke="#2980b9"
            strokeWidth={0}
            dot={<LeftBoneDot />}
            activeDot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
