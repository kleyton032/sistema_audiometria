import { InputNumber, Row, Col, Typography } from 'antd'
import type { SpeechAudiometry } from '@/types'

const { Text } = Typography

interface Props {
  label: string
  color: string
  data: SpeechAudiometry
  onChange: (updated: SpeechAudiometry) => void
}

export default function SpeechAudiometryInput({ label, color, data, onChange }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ color, fontSize: 16, marginBottom: 8, display: 'block' }}>
        Logoaudiometria — {label}
      </Text>
      <Row gutter={16}>
        <Col span={8}>
          <Text type="secondary">SRT (dBHL)</Text>
          <InputNumber
            value={data.srt}
            onChange={(v) => onChange({ ...data, srt: v })}
            min={-10}
            max={120}
            step={5}
            style={{ width: '100%' }}
            placeholder="dBHL"
          />
        </Col>
        <Col span={8}>
          <Text type="secondary">IRF (%)</Text>
          <InputNumber
            value={data.irf}
            onChange={(v) => onChange({ ...data, irf: v })}
            min={0}
            max={100}
            step={4}
            style={{ width: '100%' }}
            placeholder="%"
          />
        </Col>
        <Col span={8}>
          <Text type="secondary">Intensidade IRF (dBHL)</Text>
          <InputNumber
            value={data.irfIntensity}
            onChange={(v) => onChange({ ...data, irfIntensity: v })}
            min={0}
            max={120}
            step={5}
            style={{ width: '100%' }}
            placeholder="dBHL"
          />
        </Col>
      </Row>
    </div>
  )
}
