import { useEffect, useState } from 'react'
import {
  Card,
  DatePicker,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Badge,
  Tooltip,
  Alert,
} from 'antd'
import {
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { getAgendaDoPacientes, type AgendaItem } from '@/api/agendaService'
import ExameModal, { type TipoExame } from '@/components/ExameModal'

dayjs.locale('pt-br')

const { Title, Text } = Typography

function situacaoTag(tp: string | null) {
  if (!tp) return <Tag>—</Tag>
  const map: Record<string, { color: string; label: string }> = {
    L: { color: 'default',  label: 'Livre' },
    M: { color: 'blue',     label: 'Marcado' },
    A: { color: 'orange',   label: 'Aguardando' },
    E: { color: 'green',    label: 'Atendido' },
    F: { color: 'red',      label: 'Falta' },
    C: { color: 'volcano',  label: 'Cancelado' },
    R: { color: 'purple',   label: 'Em Atendimento' },
  }
  const info = map[tp.toUpperCase()] ?? { color: 'default', label: tp }
  return <Tag color={info.color}>{info.label}</Tag>
}

function encaixeBadge(sn: string | null) {
  return sn === 'S' ? <Badge status="warning" text="Encaixe" /> : null
}

// Códigos de item que abrem exames
const CD_AUDIOMETRIA = 2766
const CD_IMITANCIOMETRIA = 2767

function tipoExamePorItem(cdItem: number | null): TipoExame | null {
  if (cdItem === CD_AUDIOMETRIA) return 'audiometria'
  if (cdItem === CD_IMITANCIOMETRIA) return 'imitanciometria'
  return null
}

export default function PacientesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AgendaItem[]>([])
  const [total, setTotal] = useState(0)
  const [dataRef, setDataRef] = useState<Dayjs>(dayjs())

  // Estado do modal de exame
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTipo, setModalTipo] = useState<TipoExame | null>(null)
  const [modalPaciente, setModalPaciente] = useState<string | null>(null)
  const [modalAtendimento, setModalAtendimento] = useState<number | null>(null)

  function abrirExame(record: AgendaItem) {
    const tipo = tipoExamePorItem(record.cd_item_agendamento)
    if (!tipo) return
    setModalTipo(tipo)
    setModalPaciente(record.nm_paciente)
    setModalAtendimento(record.cd_atendimento)
    setModalOpen(true)
  }

  const columns: ColumnsType<AgendaItem> = [
    {
      title: 'Cód. Atendimento',
      dataIndex: 'cd_atendimento',
      key: 'cd_atendimento',
      width: 110,
      sorter: (a, b) => (a.cd_atendimento ?? 0) - (b.cd_atendimento ?? 0),
      render: (v) => <Text strong>{v ?? '—'}</Text>,
    },
    {
      title: 'Horário',
      dataIndex: 'hr_agenda',
      key: 'hr_agenda',
      width: 90,
      sorter: (a, b) => (a.hr_agenda ?? '').localeCompare(b.hr_agenda ?? ''),
      render: (v) => <Text strong>{v ?? '—'}</Text>,
    },
    {
      title: 'Paciente',
      dataIndex: 'nm_paciente',
      key: 'nm_paciente',
      ellipsis: true,
      render: (nome, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined style={{ color: '#667eea' }} />
            <Text strong>{nome ?? '—'}</Text>
          </Space>
          {record.cd_paciente && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Cód. {record.cd_paciente}
            </Text>
          )}
          {encaixeBadge(record.sn_encaixe)}
        </Space>
      ),
    },
    {
      title: 'Item Agendado',
      dataIndex: 'ds_item_agendamento',
      key: 'ds_item_agendamento',
      width: 180,
      ellipsis: true,
      render: (v) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Telefone',
      dataIndex: 'nr_fone',
      key: 'nr_fone',
      width: 140,
      render: (v) =>
        v ? (
          <Space>
            <PhoneOutlined />
            <Text>{v}</Text>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Situação',
      dataIndex: 'tp_situacao',
      key: 'tp_situacao',
      width: 140,
      filters: [
        { text: 'Marcado', value: 'M' },
        { text: 'Atendido', value: 'A' },
        { text: 'Falta', value: 'F' },
        { text: 'Cancelado', value: 'C' },
        { text: 'Em Atendimento', value: 'R' },
      ],
      onFilter: (value, record) =>
        (record.tp_situacao ?? '').toUpperCase() === value,
      render: (v) => situacaoTag(v),
    },
    {
      title: 'Consultório',
      dataIndex: 'ds_consultorio',
      key: 'ds_consultorio',
      width: 150,
      ellipsis: true,
      render: (v) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Observação',
      dataIndex: 'ds_observacao',
      key: 'ds_observacao',
      ellipsis: true,
      render: (v) =>
        v ? (
          <Tooltip title={v}>
            <Text ellipsis style={{ maxWidth: 200 }}>
              {v}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Realizar Exame',
      key: 'realizar_exame',
      width: 130,
      fixed: 'right',
      render: (_, record) => {
        const tipo = tipoExamePorItem(record.cd_item_agendamento)
        if (!tipo) return <Text type="secondary">—</Text>
        const isAudio = tipo === 'audiometria'
        return (
          <Button
            type="primary"
            size="small"
            icon={<ExperimentOutlined />}
            onClick={() => abrirExame(record)}
            style={{
              background: isAudio ? '#7c3aed' : '#10b981',
              borderColor: isAudio ? '#7c3aed' : '#10b981',
            }}
          >
            {isAudio ? 'Audiometria' : 'Imitanciometria'}
          </Button>
        )
      },
    },
  ]

  const fetchAgenda = async (d: Dayjs) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAgendaDoPacientes(d.format('YYYY-MM-DD'))
      setData(result.items)
      setTotal(result.total)
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.detail ?? 'Erro ao buscar agenda do MV.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgenda(dataRef)
  }, [])

  const handleDateChange = (d: Dayjs | null) => {
    if (d) {
      setDataRef(d)
      fetchAgenda(d)
    }
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <Title level={3}>Pacientes Agendados</Title>

      <Card
        style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <CalendarOutlined style={{ fontSize: 16, color: '#667eea' }} />
          <Text strong>Data de referência:</Text>
          <DatePicker
            value={dataRef}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchAgenda(dataRef)}
            loading={loading}
          >
            Atualizar
          </Button>
          {total > 0 && (
            <Tag color="blue" style={{ fontSize: 13 }}>
              {total} paciente{total !== 1 ? 's' : ''}
            </Tag>
          )}
        </Space>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Table<AgendaItem>
          rowKey={(r) =>
            `${r.cd_item_agendamento ?? ''}-${r.cd_paciente ?? ''}-${r.hr_agenda ?? ''}`
          }
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} registros` }}
          locale={{ emptyText: 'Nenhum paciente agendado para esta data.' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <ExameModal
        open={modalOpen}
        tipo={modalTipo}
        nmPaciente={modalPaciente}
        cdAtendimento={modalAtendimento}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
