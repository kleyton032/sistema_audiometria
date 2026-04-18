import { InputNumber, Row, Col, Typography, Divider } from 'antd'
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
    <div style={{ marginTop: 20, marginBottom: 16 }}>
      <Divider style={{ margin: '12px 0' }} />
      <Text strong style={{ color, fontSize: 14, marginBottom: 12, display: 'block' }}>
        Logoaudiometria — {label}
      </Text>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8} md={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              SRT (dBHL)
            </Text>
            <InputNumber
              value={data.srt}
              onChange={(v) => onChange({ ...data, srt: v })}
              min={-10}
              max={120}
              step={5}
              style={{ width: '100%' }}
              placeholder="dBHL"
              size="middle"
            />
          </div>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              IRF (%)
            </Text>
            <InputNumber
              value={data.irf}
              onChange={(v) => onChange({ ...data, irf: v })}
              min={0}
              max={100}
              step={4}
              style={{ width: '100%' }}
              placeholder="%"
              size="middle"
            />
          </div>
        </Col>
        <Col xs={24} sm={8} md={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Intensidade IRF (dBHL)
            </Text>
            <InputNumber
              value={data.irfIntensity}
              onChange={(v) => onChange({ ...data, irfIntensity: v })}
              min={0}
              max={120}
              step={5}
              style={{ width: '100%' }}
              placeholder="dBHL"
              size="middle"
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}
