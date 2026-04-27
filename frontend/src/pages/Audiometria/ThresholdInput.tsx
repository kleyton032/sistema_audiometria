import { InputNumber, Typography, Row, Col, Divider, Checkbox } from 'antd'
import type { EarThresholds } from '@/types'
import { FREQUENCIES, type Frequency } from '@/types'

const { Text } = Typography

interface Props {
  label: string
  color: string
  thresholds: EarThresholds
  onChange: (updated: EarThresholds) => void
  disabled?: boolean
}

export default function ThresholdInput({ label, color, thresholds, onChange, disabled }: Props) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            Via Aérea
          </Text>
          <Checkbox
            disabled={disabled}
            checked={!!thresholds.airNR}
            onChange={(e) => onChange({ ...thresholds, airNR: e.target.checked })}
          >
            <Text type="danger" style={{ fontSize: 11, fontWeight: 600 }}>NR (sem resposta)</Text>
          </Checkbox>
        </div>
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
                    disabled={disabled || !!thresholds.airNR}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            Via Óssea
          </Text>
          <Checkbox
            disabled={disabled}
            checked={!!thresholds.boneNR}
            onChange={(e) => onChange({ ...thresholds, boneNR: e.target.checked })}
          >
            <Text type="danger" style={{ fontSize: 11, fontWeight: 600 }}>NR (sem resposta)</Text>
          </Checkbox>
        </div>
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
                    disabled={disabled || !!thresholds.boneNR}
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
