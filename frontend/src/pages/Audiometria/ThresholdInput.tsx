import { InputNumber, Typography, Row, Col, Divider } from 'antd'
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

  const handleAirNRChange = (freq: Frequency, isNR: boolean) => {
    onChange({
      ...thresholds,
      airNR: { ...thresholds.airNR, [freq]: isNR },
    })
  }

  const handleBoneNRChange = (freq: Frequency, isNR: boolean) => {
    onChange({
      ...thresholds,
      boneNR: { ...thresholds.boneNR, [freq]: isNR },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir: backspace, delete, tab, escape, enter, sinal de menos e números
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      '-', 'Subtract'
    ]
    if (
      allowedKeys.includes(e.key) ||
      (e.key >= '0' && e.key <= '9') ||
      (e.ctrlKey || e.metaKey)
    ) {
      return
    }
    e.preventDefault()
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Text strong style={{ color, fontSize: 16, marginBottom: 12, display: 'block' }}>
        {label}
      </Text>

      {/* Via Aérea */}
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>
          Via Aérea
        </Text>
        <Row gutter={[8, 8]}>
          {FREQUENCIES.map((freq) => {
            const value = thresholds.airConduction[freq]
            const isNR = !!(thresholds.airNR?.[freq])
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
                    onKeyDown={handleKeyDown}
                    style={{ width: '100%' }}
                    placeholder="—"
                    disabled={disabled}
                  />
                  <div
                    onClick={() => !disabled && handleAirNRChange(freq, !isNR)}
                    style={{
                      marginTop: 3,
                      textAlign: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: isNR ? '#fff' : '#aaa',
                      background: isNR ? '#e74c3c' : 'transparent',
                      border: `1px solid ${isNR ? '#e74c3c' : '#d9d9d9'}`,
                      borderRadius: 3,
                      cursor: disabled ? 'default' : 'pointer',
                      userSelect: 'none',
                      lineHeight: '18px',
                    }}
                  >
                    NR
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Via Óssea */}
      <div>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>
          Via Óssea
        </Text>
        <Row gutter={[8, 8]}>
          {([500, 1000, 2000, 3000, 4000] as const).map((freq) => {
            const value = thresholds.boneConduction[freq]
            const isNR = !!(thresholds.boneNR?.[freq])
            return (
              <Col xs={8} sm={6} md={4} key={`bone-${freq}`} style={{ minWidth: 80 }}>
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
                    onKeyDown={handleKeyDown}
                    style={{ width: '100%' }}
                    placeholder="—"
                    disabled={disabled}
                  />
                  <div
                    onClick={() => !disabled && handleBoneNRChange(freq, !isNR)}
                    style={{
                      marginTop: 3,
                      textAlign: 'center',
                      fontSize: 10,
                        fontWeight: 700,
                        color: isNR ? '#fff' : '#aaa',
                        background: isNR ? '#e74c3c' : 'transparent',
                        border: `1px solid ${isNR ? '#e74c3c' : '#d9d9d9'}`,
                        borderRadius: 3,
                        cursor: disabled ? 'default' : 'pointer',
                        userSelect: 'none',
                        lineHeight: '18px',
                      }}
                    >
                      NR
                    </div>
                </div>
              </Col>
            )
          })}
        </Row>
      </div>
    </div>
  )
}
