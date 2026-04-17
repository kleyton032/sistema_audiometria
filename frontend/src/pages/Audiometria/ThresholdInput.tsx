import { InputNumber, Table, Typography } from 'antd'
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

  const columns = [
    {
      title: 'Via',
      dataIndex: 'via',
      key: 'via',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    ...FREQUENCIES.map((freq) => ({
      title: `${freq >= 1000 ? freq / 1000 + 'k' : freq} Hz`,
      dataIndex: String(freq),
      key: String(freq),
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: { key: string }) => {
        const isAir = record.key === 'air'
        const value = isAir ? thresholds.airConduction[freq] : thresholds.boneConduction[freq]
        return (
          <InputNumber
            size="small"
            min={-10}
            max={120}
            step={5}
            value={value}
            onChange={(v) => (isAir ? handleAirChange(freq, v) : handleBoneChange(freq, v))}
            style={{ width: 70 }}
            placeholder="—"
          />
        )
      },
    })),
  ]

  const data = [
    { key: 'air', via: 'Via Aérea' },
    { key: 'bone', via: 'Via Óssea' },
  ]

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ color, fontSize: 16, marginBottom: 8, display: 'block' }}>
        {label}
      </Text>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        bordered
      />
    </div>
  )
}
