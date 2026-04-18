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

/**
 * Gera curva timpanométrica com gaussiana assimétrica (cauda neg. mais suave que a pos.),
 * seguindo o padrão clínico real observado em timpanogramas.
 *
 * Gaussiana assimétrica:
 *   sigma_left  → cauda para pressões negativas (mais suave / longa)
 *   sigma_right → queda para pressões positivas (mais íngreme / curta)
 */
function generateCurve(data: TympanogramData): { pressure: number; compliance: number }[] {
  if (data.curve.length > 0) return data.curve
  if (!data.type) return []

  // Baseline = volume do canal auditivo (piso da curva nas pressões extremas)
  const baseline = data.earCanalVolume ?? 0.2

  function asymGaussian(p: number, mu: number, sL: number, sR: number): number {
    const s = p < mu ? sL : sR
    return Math.exp(-0.5 * Math.pow((p - mu) / s, 2))
  }

  let amplitude: number
  let mu: number
  let sL: number // sigma lado negativo (cauda longa)
  let sR: number // sigma lado positivo (queda íngreme)

  switch (data.type) {
    case 'A':
      // Pico central normal — assimétrico: cauda neg. suave, pos. mais íngreme
      amplitude = Math.max((data.staticCompliance ?? 0.9) - baseline, 0.3)
      mu = data.peakPressure ?? 0
      sL = 100
      sR = 60
      break
    case 'As':
      // Rigidez — mesma forma de A, mas amplitude muito reduzida
      amplitude = Math.max((data.staticCompliance ?? 0.35) - baseline, 0.05)
      mu = data.peakPressure ?? 0
      sL = 100
      sR = 60
      break
    case 'Ad':
      // Hipermobilidade — espigão estreitíssimo e alto (sai do gráfico)
      amplitude = Math.max((data.staticCompliance ?? 2.5) - baseline, 1.0)
      mu = data.peakPressure ?? 0
      sL = 12
      sR = 10
      break
    case 'B':
      // Efusão / obstrução — quase linha reta, levíssimo bojo
      amplitude = Math.max((data.staticCompliance ?? 0.1) - baseline, 0.02)
      mu = data.peakPressure ?? 0
      sL = 300
      sR = 300
      break
    case 'C':
      // Disfunção tubária — forma idêntica a A, deslocada para ~-200 daPa
      amplitude = Math.max((data.staticCompliance ?? 0.9) - baseline, 0.3)
      mu = data.peakPressure ?? -200
      sL = 100
      sR = 60
      break
    default:
      return []
  }

  const points: { pressure: number; compliance: number }[] = []
  for (let p = -400; p <= 200; p += 10) {
    const compliance = baseline + amplitude * asymGaussian(p, mu, sL, sR)
    points.push({ pressure: p, compliance: Math.round(compliance * 1000) / 1000 })
  }

  return points
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

  // Domínio Y dinâmico baseado no pico máximo real
  const allValues = [...rightCurve, ...leftCurve].map((p) => p.compliance)
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 2
  const yMax = Math.ceil(maxVal * 10) / 10 + 0.2

  const typeLabel = (ear: TympanogramData) =>
    ear.type ? ` (Tipo ${ear.type})` : ''

  return (
    <div>
      {title && <h4 style={{ textAlign: 'center', marginBottom: 8 }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="pressure"
            type="number"
            domain={[-400, 200]}
            ticks={[-400, -300, -200, -100, 0, 100, 200]}
            label={{ value: 'Pressão (daPa)', position: 'insideBottom', offset: -15 }}
          />
          <YAxis
            domain={[0, yMax]}
            tickFormatter={(v: number) => v.toFixed(1)}
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
                rightCompliance: `OD${typeLabel(rightEar)}`,
                leftCompliance: `OE${typeLabel(leftEar)}`,
              }
              return [`${value} ml`, labels[name] || name]
            }}
            labelFormatter={(label: number) => `${label} daPa`}
          />
          <Legend
            payload={[
              { value: `OD${typeLabel(rightEar)} — linha contínua`, type: 'line', color: '#e74c3c' },
              { value: `OE${typeLabel(leftEar)} — linha contínua`, type: 'line', color: '#2980b9' },
            ]}
            wrapperStyle={{ paddingTop: 12 }}
          />
          {/* Linha de referência em 0 daPa */}
          <ReferenceLine x={0} stroke="#999" strokeDasharray="3 3" label={{ value: '0', position: 'top', fontSize: 10 }} />

          {/* OD — linha contínua vermelha */}
          <Line
            dataKey="rightCompliance"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          {/* OE — linha contínua azul */}
          <Line
            dataKey="leftCompliance"
            stroke="#2980b9"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
