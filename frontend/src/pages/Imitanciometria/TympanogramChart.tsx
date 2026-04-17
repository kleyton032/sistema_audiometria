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
import type { TympanogramData } from '@/types'

interface Props {
  rightEar: TympanogramData
  leftEar: TympanogramData
  title?: string
}

/** Gera curva timpanométrica simulada baseada nos dados numéricos */
function generateCurve(data: TympanogramData): { pressure: number; compliance: number }[] {
  if (data.curve.length > 0) return data.curve

  // Se tiver dados numéricos, gera curva gaussiana simulada
  if (data.peakPressure !== null && data.staticCompliance !== null) {
    const peak = data.peakPressure
    const amp = data.staticCompliance
    const points: { pressure: number; compliance: number }[] = []

    for (let p = -400; p <= 200; p += 25) {
      const sigma = data.type === 'Ad' ? 30 : data.type === 'B' ? 500 : 80
      const compliance =
        data.type === 'B'
          ? amp * 0.1 // Curva tipo B: quase plana
          : amp * Math.exp(-0.5 * Math.pow((p - peak) / sigma, 2))
      points.push({ pressure: p, compliance: Math.round(compliance * 100) / 100 })
    }
    return points
  }
  return []
}

export default function TympanogramChart({ rightEar, leftEar, title }: Props) {
  const rightCurve = generateCurve(rightEar)
  const leftCurve = generateCurve(leftEar)

  // Unir pressões de ambas as orelhas
  const pressures = new Set([
    ...rightCurve.map((p) => p.pressure),
    ...leftCurve.map((p) => p.pressure),
  ])

  const data = Array.from(pressures)
    .sort((a, b) => a - b)
    .map((pressure) => ({
      pressure,
      rightCompliance: rightCurve.find((p) => p.pressure === pressure)?.compliance,
      leftCompliance: leftCurve.find((p) => p.pressure === pressure)?.compliance,
    }))

  return (
    <div>
      {title && <h4 style={{ textAlign: 'center', marginBottom: 8 }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="pressure"
            type="number"
            domain={[-400, 200]}
            label={{ value: 'Pressão (daPa)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            domain={[0, 2]}
            label={{
              value: 'Complacência (ml)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                rightCompliance: 'OD',
                leftCompliance: 'OE',
              }
              return [`${value} ml`, labels[name] || name]
            }}
            labelFormatter={(label: number) => `${label} daPa`}
          />
          <Legend
            payload={[
              { value: 'Orelha Direita (OD)', type: 'line', color: '#e74c3c' },
              { value: 'Orelha Esquerda (OE)', type: 'line', color: '#2980b9' },
            ]}
          />
          <ReferenceLine x={0} stroke="#999" strokeDasharray="3 3" />

          <Line
            dataKey="rightCompliance"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={{ fill: '#e74c3c', r: 3 }}
            connectNulls
          />
          <Line
            dataKey="leftCompliance"
            stroke="#2980b9"
            strokeWidth={2}
            dot={{ fill: '#2980b9', r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
