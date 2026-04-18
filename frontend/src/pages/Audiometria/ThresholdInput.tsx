import { InputNumber, Typography, Row, Col, Divider } from 'antd'
import type { EarThresholds } from '@/types'
import { FREQUENCIES, type Frequency } from '@/types'

const { Text } = Typography

interface Props {
  label: string
  color: string
  thresholds: EarThresholds
  onChange: (updated: EarThresholds) => void
}

export default function ThresholdInput({ label, color, thresholds, onChange }: Props) {
  const handleAirChange = (freq: Frequency, value: number | null) => {
    onChange({
      ...thresholds,
      airConduction: { ...thresholds.airConduction, [freq]: value },
    })
  }

  const handleBoneChange = (freq: Frequency, value: number | null) => {
    onChange({
      ...thresholds,
      boneConduction: { ...thresholds.boneConduction, [freq]: value },
    })
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Text strong style={{ color, fontSize: 16, marginBottom: 12, display: 'block' }}>
        {label}
      </Text>

      {/* Via Aérea */}
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block' }}>
          Via Aérea
        </Text>
        <Row gutter={[8, 8]}>
          {FREQUENCIES.map((freq) => {
            const value = thresholds.airConduction[freq]
            return (
              <Col xs={6} sm={6} md={3} key={`air-${freq}`} style={{ minWidth: 80 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    {freq >= 1000 ? freq / 1000 + 'k' : freq} Hz
                  </Text>
                  <InputNumber
                    size="small"
                    min={-10}
                    max={120}
                    step={5}
                    value={value}
                    onChange={(v) => handleAirChange(freq, v)}
                    style={{ width: '100%' }}
                    placeholder="—"
                  />
                </div>
              </Col>
            )
          })}
        </Row>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Via Óssea */}
      <div>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block' }}>
          Via Óssea
        </Text>
        <Row gutter={[8, 8]}>
          {FREQUENCIES.map((freq) => {
            const value = thresholds.boneConduction[freq]
            return (
              <Col xs={6} sm={6} md={3} key={`bone-${freq}`} style={{ minWidth: 80 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    {freq >= 1000 ? freq / 1000 + 'k' : freq} Hz
                  </Text>
                  <InputNumber
                    size="small"
                    min={-10}
                    max={120}
                    step={5}
                    value={value}
                    onChange={(v) => handleBoneChange(freq, v)}
                    style={{ width: '100%' }}
                    placeholder="—"
                  />
                </div>
              </Col>
            )
          })}
        </Row>
      </div>
    </div>
  )
}
