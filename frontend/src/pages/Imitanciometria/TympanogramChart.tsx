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
  ReferenceDot,
} from 'recharts'
import type { TympanogramData } from '@/types'

interface Props {
  rightEar: TympanogramData
  leftEar: TympanogramData
  title?: string
}

/**
 * Gera curva timpanométrica 226 Hz com perfil assimétrico:
 * - lado esquerdo (pressões negativas): subida gradual
 * - lado direito (pressões positivas): queda rápida
 * O perfil usa exponencial generalizada para gerar pico mais pontudo,
 * visualmente mais próximo do traçado de equipamentos clínicos.
 */
function generateCurve(data: TympanogramData): { pressure: number; compliance: number }[] {
  if (data.curve.length > 0) return data.curve
  if (!data.type) return []

  // Baseline = volume do canal auditivo (piso da curva nas pressões extremas)
  const baseline = data.earCanalVolume ?? 0.2

  // Exponencial generalizada assimétrica: beta menor deixa o pico mais agudo.
  function asymProfile(
    p: number,
    mu: number,
    sL: number,
    sR: number,
    betaL: number,
    betaR: number
  ): number {
    const d = Math.abs(p - mu)
    if (p <= mu) {
      return Math.exp(-Math.pow(d / sL, betaL))
    }
    return Math.exp(-Math.pow(d / sR, betaR))
  }

  let amplitude: number
  let mu: number
  let sL: number // largura lado negativo (p <= mu)
  let sR: number // largura lado positivo (p > mu)
  let betaL: number // forma do lado negativo
  let betaR: number // forma do lado positivo

  switch (data.type) {
    case 'A':
      // Tipo A (normal): pico pontudo com subida longa à esquerda e queda rápida à direita.
      amplitude = Math.max((data.staticCompliance ?? 0.8) - baseline, 0.05)
      mu = data.peakPressure ?? -20
      sL = 125
      sR = 34
      betaL = 1.55
      betaR = 1.7
      break
    case 'As':
      // Tipo As: mesma topologia de A, porém com menor amplitude.
      amplitude = Math.max((data.staticCompliance ?? 0.35) - baseline, 0.05)
      mu = data.peakPressure ?? -10
      sL = 120
      sR = 34
      betaL = 1.6
      betaR = 1.75
      break
    case 'Ad':
      // Tipo Ad: pico muito alto e estreito.
      amplitude = Math.max((data.staticCompliance ?? 2.4) - baseline, 1.0)
      mu = data.peakPressure ?? -15
      sL = 16
      sR = 12
      betaL = 1.45
      betaR = 1.6
      break
    case 'B':
      // Tipo B: linha quase plana, sem pico definido.
      amplitude = Math.max((data.staticCompliance ?? 0.1) - baseline, 0.02)
      mu = data.peakPressure ?? 0
      sL = 300
      sR = 300
      betaL = 2.0
      betaR = 2.0
      break
    case 'C':
      // Tipo C: deslocada para pressão negativa, com cauda prolongada à direita.
      amplitude = Math.max((data.staticCompliance ?? 0.9) - baseline, 0.05)
      mu = data.peakPressure ?? -180
      sL = 60
      sR = 110
      betaL = 1.7
      betaR = 1.45
      break
    default:
      return []
  }

  const points: { pressure: number; compliance: number }[] = []
  for (let p = -600; p <= 400; p += 5) {
    const compliance = baseline + amplitude * asymProfile(p, mu, sL, sR, betaL, betaR)
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

  // Ponto de pico:
  //   - X = peakPressure exato do usuário
  //   - Y = compliance da curva gerada (ponto fica SOBRE a curva)
  //   - labelCompliance = staticCompliance do usuário (valor real do exame)
  const findPeak = (curve: { pressure: number; compliance: number }[], ear: TympanogramData) => {
    if (!ear.type || ear.type === 'B' || curve.length === 0) return null
    if (ear.peakPressure == null) return null
    const mu = ear.peakPressure
    const closest = curve.reduce((best, pt) =>
      Math.abs(pt.pressure - mu) < Math.abs(best.pressure - mu) ? pt : best
    )
    return {
      pressure: mu,
      compliance: closest.compliance,
      labelCompliance: ear.staticCompliance ?? closest.compliance,
    }
  }
  const rightPeak = findPeak(rightCurve, rightEar)
  const leftPeak = findPeak(leftCurve, leftEar)

  // Domínio Y dinâmico: começa próximo ao baseline (como o equipamento), não em 0
  const allValues = [...rightCurve, ...leftCurve].map((p) => p.compliance)
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 2
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0
  const yMax = Math.ceil(maxVal * 10) / 10 + 0.1
  // Base do eixo Y: 10% abaixo do mínimo ou 0, o que for maior — equivale ao auto-scale do equipamento
  const yMin = Math.max(0, Math.floor(minVal * 10) / 10 - 0.1)

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
            domain={[-600, 400]}
            ticks={[-600, -400, -200, 0, 200, 400]}
            label={{ value: 'Pressão (daPa)', position: 'insideBottom', offset: -15 }}
          />
          <YAxis
            domain={[yMin, yMax]}
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

          {/* Ponto de pico OD */}
          {rightPeak && (
            <ReferenceDot
              x={rightPeak.pressure}
              y={rightPeak.compliance}
              r={5}
              fill="#e74c3c"
              stroke="#fff"
              strokeWidth={1.5}
              label={{
                value: `${rightPeak.pressure} daPa | ${rightPeak.labelCompliance} ml`,
                position: 'top',
                fontSize: 11,
                fill: '#e74c3c',
              }}
            />
          )}
          {/* Ponto de pico OE */}
          {leftPeak && (
            <ReferenceDot
              x={leftPeak.pressure}
              y={leftPeak.compliance}
              r={5}
              fill="#2980b9"
              stroke="#fff"
              strokeWidth={1.5}
              label={{
                value: `${leftPeak.pressure} daPa | ${leftPeak.labelCompliance} ml`,
                position: 'top',
                fontSize: 11,
                fill: '#2980b9',
              }}
            />
          )}

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
