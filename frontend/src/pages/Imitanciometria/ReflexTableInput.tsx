import { Table, InputNumber, Switch, Typography } from 'antd'
import type { ReflexTable } from '@/types'
import { REFLEX_FREQUENCIES, type ReflexFrequency } from '@/types'

const { Text } = Typography

interface Props {
  label: string
  color: string
  reflexes: ReflexTable
  onChange: (updated: ReflexTable) => void
}

export default function ReflexTableInput({ label, color, reflexes, onChange }: Props) {
  const handleChange = (
    freq: ReflexFrequency,
    side: 'ipsilateral' | 'contralateral',
    field: 'present' | 'threshold',
    value: boolean | number | null,
  ) => {
    const updated = { ...reflexes }
    updated[freq] = {
      ...updated[freq],
      [side]: {
        ...updated[freq][side],
        [field]: value,
      },
    }
    onChange(updated)
  }

  const columns = [
    {
      title: 'Freq.',
      dataIndex: 'freq',
      key: 'freq',
      width: 80,
      render: (f: number) => <Text strong>{f} Hz</Text>,
    },
    {
      title: 'Ipsilateral',
      children: [
        {
          title: 'Presente',
          key: 'ipsiPresent',
          width: 80,
          align: 'center' as const,
          render: (_: unknown, record: { freq: ReflexFrequency }) => (
            <Switch
              size="small"
              checked={reflexes[record.freq].ipsilateral.present ?? false}
              onChange={(v) => handleChange(record.freq, 'ipsilateral', 'present', v)}
            />
          ),
        },
        {
          title: 'dB',
          key: 'ipsiThreshold',
          width: 90,
          align: 'center' as const,
          render: (_: unknown, record: { freq: ReflexFrequency }) => (
            <InputNumber
              size="small"
              disabled={!reflexes[record.freq].ipsilateral.present}
              value={reflexes[record.freq].ipsilateral.threshold}
              onChange={(v) => handleChange(record.freq, 'ipsilateral', 'threshold', v)}
              min={50}
              max={120}
              step={5}
              style={{ width: 70 }}
              placeholder="—"
            />
          ),
        },
      ],
    },
    {
      title: 'Contralateral',
      children: [
        {
          title: 'Presente',
          key: 'contraPresent',
          width: 80,
          align: 'center' as const,
          render: (_: unknown, record: { freq: ReflexFrequency }) => (
            <Switch
              size="small"
              checked={reflexes[record.freq].contralateral.present ?? false}
              onChange={(v) => handleChange(record.freq, 'contralateral', 'present', v)}
            />
          ),
        },
        {
          title: 'dB',
          key: 'contraThreshold',
          width: 90,
          align: 'center' as const,
          render: (_: unknown, record: { freq: ReflexFrequency }) => (
            <InputNumber
              size="small"
              disabled={!reflexes[record.freq].contralateral.present}
              value={reflexes[record.freq].contralateral.threshold}
              onChange={(v) => handleChange(record.freq, 'contralateral', 'threshold', v)}
              min={50}
              max={120}
              step={5}
              style={{ width: 70 }}
              placeholder="—"
            />
          ),
        },
      ],
    },
  ]

  const dataSource = REFLEX_FREQUENCIES.map((freq) => ({
    key: freq,
    freq,
  }))

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong style={{ color, fontSize: 16, marginBottom: 8, display: 'block' }}>
        Reflexos Estapedianos — {label}
      </Text>
      <Table columns={columns} dataSource={dataSource} pagination={false} size="small" bordered />
    </div>
  )
}
