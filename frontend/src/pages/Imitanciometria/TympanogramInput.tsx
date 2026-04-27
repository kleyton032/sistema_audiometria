import { InputNumber, Select, Row, Col, Typography } from 'antd'
import type { TympanogramData, TympanogramType } from '@/types'

const { Text } = Typography

interface Props {
  label: string
  color: string
  data: TympanogramData
  onChange: (updated: TympanogramData) => void
}

const typeOptions: { value: TympanogramType; label: string }[] = [
  { value: 'A', label: 'Tipo A (Normal)' },
  { value: 'As', label: 'Tipo As (Rigidez)' },
  { value: 'Ad', label: 'Tipo Ad (Hipermobilidade)' },
  { value: 'B', label: 'Tipo B (Efusão/Perfuração)' },
  { value: 'C', label: 'Tipo C (Disfunção Tubária)' },
]

export default function TympanogramInput({ label, color, data, onChange }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ color, fontSize: 16, marginBottom: 12, display: 'block' }}>
        Timpanograma — {label}
      </Text>
      <Row gutter={[16, 12]}>
        <Col xs={24} sm={12}>
          <Text type="secondary">Tipo de Curva</Text>
          <Select
            value={data.type}
            onChange={(v) => onChange({ ...data, type: v })}
            options={typeOptions}
            placeholder="Selecione"
            style={{ width: '100%' }}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12}>
          <Text type="secondary">Pressão do Pico (daPa)</Text>
          <InputNumber
            value={data.peakPressure}
            onChange={(v) => onChange({ ...data, peakPressure: v })}
            min={-400}
            max={200}
            step={5}
            style={{ width: '100%' }}
            placeholder="daPa"
          />
        </Col>
        <Col xs={24} sm={12}>
          <Text type="secondary">Complacência Estática (ml)</Text>
          <InputNumber
            value={data.staticCompliance}
            onChange={(v) => onChange({ ...data, staticCompliance: v })}
            min={0}
            max={5}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="ml"
          />
        </Col>
        <Col xs={24} sm={12}>
          <Text type="secondary">Volume do Canal (ml)</Text>
          <InputNumber
            value={data.earCanalVolume}
            onChange={(v) => onChange({ ...data, earCanalVolume: v })}
            min={0}
            max={5}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="ml"
          />
        </Col>
        <Col xs={24} sm={12}>
          <Text type="secondary">Gradiente</Text>
          <InputNumber
            value={data.gradient}
            onChange={(v) => onChange({ ...data, gradient: v })}
            min={0}
            max={5}
            step={0.05}
            style={{ width: '100%' }}
            placeholder="—"
          />
        </Col>
      </Row>
    </div>
  )
}
