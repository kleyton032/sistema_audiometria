import React from 'react'
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
  maskingRight?: { va?: number | null; vo?: number | null }
  maskingLeft?: { va?: number | null; vo?: number | null }
}

/** Dados de uma única orelha para o gráfico */
function buildEarData(ear: EarThresholds) {
  return FREQUENCIES.map((freq) => ({
    frequency: `${freq >= 1000 ? freq / 1000 + 'k' : freq}`,
    air: ear.airConduction[freq] ?? undefined,
    bone: ear.boneConduction[freq] ?? undefined,
  }))
}

const Y_TICKS = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

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

// ── Sub-gráfico por orelha ───────────────────────────────────────────────────

type DotProps = { cx?: number; cy?: number; value?: number }

interface EarChartProps {
  ear: EarThresholds
  side: 'OD' | 'OE'
  masking?: { va?: number | null; vo?: number | null }
}

function EarChart({ ear, side, masking }: EarChartProps) {
  const color   = side === 'OD' ? '#e74c3c' : '#2980b9'
  const data    = buildEarData(ear)
  const maskVa  = !!(masking?.va)
  const maskVo  = !!(masking?.vo)
  const isNR_va = !!ear.airNR
  const isNR_vo = !!ear.boneNR

  // ── dots via aérea ──────────────────────────────────────────────────────────
  const AirDot: React.ReactElement | ((p: DotProps) => React.ReactElement | null) = isNR_va
    ? (p: DotProps) => <NRDot {...p} color={color} />
    : side === 'OD'
      ? maskVa ? <RightAirMaskedDot /> : <RightAirDot />
      : maskVa ? <LeftAirMaskedDot />  : <LeftAirDot />

  // ── dots via óssea ──────────────────────────────────────────────────────────
  const BoneDot: React.ReactElement | ((p: DotProps) => React.ReactElement | null) = isNR_vo
    ? (p: DotProps) => <NRDot {...p} color={color} />
    : side === 'OD'
      ? maskVo ? <RightBoneMaskedDot /> : <RightBoneDot />
      : maskVo ? <LeftBoneMaskedDot />  : <LeftBoneDot />

  const airLabel  = isNR_va ? 'VA — NR ↓' : maskVa
    ? (side === 'OD' ? 'VA — △ mascarado' : 'VA — □ mascarado')
    : (side === 'OD' ? 'VA — O' : 'VA — X')

  const boneLabel = isNR_vo ? 'VO — NR ↓' : maskVo
    ? (side === 'OD' ? 'VO — [ mascarado' : 'VO — ] mascarado')
    : (side === 'OD' ? 'VO — <' : 'VO — >')

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ textAlign: 'center', color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        {side === 'OD' ? 'OUVIDO DIREITO' : 'OUVIDO ESQUERDO'}
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="frequency"
            label={{ value: 'Hz', position: 'insideBottom', offset: -12, fontSize: 10 }}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            reversed
            domain={[-10, 120]}
            ticks={Y_TICKS}
            label={{ value: 'dB', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10 }}
            tick={{ fontSize: 10 }}
            width={38}
          />
          <Tooltip formatter={(v: number) => [`${v} dBHL`]} labelFormatter={(l) => `${l} Hz`} />
          <Legend
            payload={[
              { value: airLabel,  type: 'line', color },
              { value: boneLabel, type: 'none', color },
            ]}
            wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
          />
          <ReferenceLine
            y={25}
            stroke="#aaa"
            strokeDasharray="4 4"
            label={{ value: '25 dB', position: 'insideTopRight', fill: '#999', fontSize: 9 }}
          />
          {/* Via Aérea */}
          <Line
            dataKey="air"
            stroke={color}
            strokeWidth={2}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={AirDot as any}
            activeDot={{ r: 5, fill: color }}
            connectNulls
          />
          {/* Via Óssea — sem linha de conexão */}
          <Line
            dataKey="bone"
            stroke={color}
            strokeWidth={0}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={BoneDot as any}
            activeDot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function AudiogramChart({ rightEar, leftEar, maskingRight, maskingLeft }: Props) {
  return (
    <div>
      <div style={{
        textAlign: 'center', fontWeight: 700, fontSize: 14,
        letterSpacing: 3, color: '#333', marginBottom: 8,
      }}>
        AUDIOMETRIA
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <EarChart ear={rightEar} side="OD" masking={maskingRight} />
        <EarChart ear={leftEar}  side="OE" masking={maskingLeft}  />
      </div>
    </div>
  )
}
