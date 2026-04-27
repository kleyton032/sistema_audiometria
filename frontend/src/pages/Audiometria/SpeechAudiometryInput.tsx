import { InputNumber, Row, Col, Typography, Divider, Table } from 'antd'
import type { SpeechAudiometry, MaskingData } from '@/types'

const { Text } = Typography

interface Props {
  label: string
  color: string
  data: SpeechAudiometry
  masking: MaskingData
  onChange: (updated: SpeechAudiometry) => void
  onMaskingChange: (updated: MaskingData) => void
  disabled?: boolean
}

function Num({
  value, onChange, disabled, min = -10, max = 120, step = 5, placeholder = '—',
}: {
  value: number | null
  onChange: (v: number | null) => void
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  return (
    <InputNumber
      size="small"
      value={value}
      onChange={onChange}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      style={{ width: '100%' }}
      placeholder={placeholder}
    />
  )
}

export default function SpeechAudiometryInput({
  label, color, data, masking, onChange, onMaskingChange, disabled,
}: Props) {
  // ── Tabela de Logoaudiometria ──────────────────────────────────────────────
  const logoColumns = [
    { title: '', dataIndex: 'row', key: 'row', width: 60,
      render: (v: string) => <Text strong style={{ fontSize: 11 }}>{v}</Text> },
    { title: '%', dataIndex: 'pct', key: 'pct', width: 80,
      render: (_: unknown, rec: { pct: number | null; onPct: (v: number | null) => void }) => (
        <Num value={rec.pct} onChange={rec.onPct} disabled={disabled} min={0} max={100} step={4} placeholder="%" />
      ) },
    { title: 'dB', dataIndex: 'db', key: 'db', width: 80,
      render: (_: unknown, rec: { db: number | null; onDb: (v: number | null) => void }) => (
        <Num value={rec.db} onChange={rec.onDb} disabled={disabled} placeholder="dB" />
      ) },
  ]

  const logoData = [
    {
      key: 'mon', row: 'MON',
      pct: data.irf,         onPct: (v: number | null) => onChange({ ...data, irf: v }),
      db:  data.irfIntensity, onDb:  (v: number | null) => onChange({ ...data, irfIntensity: v }),
    },
    {
      key: 'dis', row: 'DIS',
      pct: data.irfDis,   onPct: (v: number | null) => onChange({ ...data, irfDis: v }),
      db:  data.irfDisDb, onDb:  (v: number | null) => onChange({ ...data, irfDisDb: v }),
    },
    {
      key: 'tri', row: 'TRI',
      pct: data.irfTri,   onPct: (v: number | null) => onChange({ ...data, irfTri: v }),
      db:  data.irfTriDb, onDb:  (v: number | null) => onChange({ ...data, irfTriDb: v }),
    },
  ]

  // ── Tabela de Mascaramento ─────────────────────────────────────────────────
  const maskColumns = [
    { title: '', dataIndex: 'row', key: 'row', width: 60,
      render: (v: string) => <Text strong style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'até (dB NB)', dataIndex: 'val', key: 'val',
      render: (_: unknown, rec: { val: number | null; onVal: (v: number | null) => void }) => (
        <Num value={rec.val} onChange={rec.onVal} disabled={disabled} min={0} max={120} step={5} placeholder="dB NB" />
      ) },
  ]

  const maskData = [
    { key: 'va',   row: 'VA',   val: masking.va,   onVal: (v: number | null) => onMaskingChange({ ...masking, va: v }) },
    { key: 'vo',   row: 'VO',   val: masking.vo,   onVal: (v: number | null) => onMaskingChange({ ...masking, vo: v }) },
    { key: 'lrf',  row: 'LRF',  val: masking.lrf,  onVal: (v: number | null) => onMaskingChange({ ...masking, lrf: v }) },
    { key: 'iprf', row: 'IPRF', val: masking.iprf, onVal: (v: number | null) => onMaskingChange({ ...masking, iprf: v }) },
  ]

  return (
    <div style={{ marginTop: 20 }}>
      <Divider style={{ margin: '12px 0' }} />
      <Text strong style={{ color, fontSize: 14, display: 'block', marginBottom: 12 }}>
        Logoaudiometria e Mascaramento — {label}
      </Text>

      <Row gutter={16} align="top">
        {/* LRF + SDT */}
        <Col xs={24} sm={12}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>LRF (dBHL)</Text>
          <Num value={data.srt} onChange={(v) => onChange({ ...data, srt: v })} disabled={disabled} />
        </Col>
        <Col xs={24} sm={12}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4 }}>SDT (dBHL)</Text>
          <Num value={data.sdt} onChange={(v) => onChange({ ...data, sdt: v })} disabled={disabled} />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 12 }}>
        {/* IPRF */}
        <Col xs={24} md={12}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>IPRF</Text>
          <Table
            size="small"
            dataSource={logoData}
            columns={logoColumns}
            pagination={false}
            bordered
            showHeader
          />
        </Col>

        {/* Mascaramento */}
        <Col xs={24} md={12}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>Mascaramento</Text>
          <Table
            size="small"
            dataSource={maskData}
            columns={maskColumns}
            pagination={false}
            bordered
            showHeader
          />
        </Col>
      </Row>
    </div>
  )
}
