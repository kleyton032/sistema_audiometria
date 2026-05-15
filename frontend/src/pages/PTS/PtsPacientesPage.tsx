import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Badge,
  Alert,
  Tooltip,
  Input,
  notification,
} from 'antd'
import {
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileProtectOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { useNavigate } from 'react-router-dom'
import { getAgendaDoPacientes, type AgendaItem } from '@/api/agendaService'
import { getPTSStatusBatch } from '@/api/ptsService'

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

export default function PtsPacientesPage() {
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [data, setData]         = useState<AgendaItem[]>([])
  const [total, setTotal]       = useState(0)
  const [dataRef, setDataRef]   = useState<Dayjs>(dayjs())
  const [inputValue, setInputValue] = useState<string>(dayjs().format('DD/MM/YYYY'))
  const [ptsStatus, setPtsStatus] = useState<Record<string, { id_pts: number; fl_finalizado: number } | null>>({})

  function abrirPTS(record: AgendaItem) {
    const status = record.cd_atendimento != null ? ptsStatus[String(record.cd_atendimento)] : null
    navigate('/pts', {
      state: {
        nm_paciente:    record.nm_paciente,
        cd_paciente:    record.cd_paciente,
        cd_atendimento: record.cd_atendimento,
        id_pts:         status?.id_pts ?? null,
        fl_finalizado:  status?.fl_finalizado ?? 0,
      },
    })
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
            <UserOutlined style={{ color: '#667eea' }} aria-hidden="true" />
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
            <PhoneOutlined aria-hidden="true" />
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
        { text: 'Marcado',          value: 'M' },
        { text: 'Atendido',         value: 'A' },
        { text: 'Falta',            value: 'F' },
        { text: 'Cancelado',        value: 'C' },
        { text: 'Em Atendimento',   value: 'R' },
      ],
      onFilter: (value, record) =>
        (record.tp_situacao ?? '').toUpperCase() === value,
      render: (v) => situacaoTag(v),
    },
    {
      title: 'PTS',
      key: 'preencher_pts',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const status = record.cd_atendimento != null ? ptsStatus[String(record.cd_atendimento)] : null
        const finalizado = status?.fl_finalizado === 1
        const temPTS     = status != null
        return (
          <Space direction="vertical" size={4} align="center">
            <Tooltip title={!record.cd_atendimento ? "Aguardando recepção (sem código de atendimento)" : undefined}>
              <Button
                type="primary"
                size="small"
                icon={<FileProtectOutlined />}
                disabled={!record.cd_atendimento}
                onClick={() => abrirPTS(record)}
                style={{
                  background: !record.cd_atendimento ? undefined : finalizado ? '#52c41a' : '#667eea',
                  borderColor: !record.cd_atendimento ? undefined : finalizado ? '#52c41a' : '#667eea',
                }}
              >
                {finalizado ? 'Ver PTS' : temPTS ? 'Editar PTS' : 'Preencher PTS'}
              </Button>
            </Tooltip>
            {finalizado && <Tag color="success" style={{ fontSize: 10, margin: 0 }}>Finalizado</Tag>}
            {temPTS && !finalizado && <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>Em andamento</Tag>}
          </Space>
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
      // Busca status PTS para todos os pacientes da agenda
      const ids = result.items
        .map((i) => i.cd_atendimento)
        .filter((id): id is number => id != null)
      if (ids.length > 0) {
        getPTSStatusBatch(ids).then(setPtsStatus).catch(() => null)
      }
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

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.currentTarget.value.trim()
    setInputValue(valor)
  }

  const handlePesquisar = () => {
    const valor = inputValue.trim()
    
    if (!valor || valor.length < 10) {
      notification.error({
        message: 'Data inválida',
        description: 'Use o formato DD/MM/YYYY (ex: 14/05/2026)',
        duration: 3,
      })
      setInputValue(dataRef.format('DD/MM/YYYY'))
      return
    }
    
    // Tenta parsear diferentes formatos: DD/MM/YYYY ou DDMMYYYY
    let parsed: Dayjs | null = null
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      // Formato DD/MM/YYYY
      parsed = dayjs(valor, 'DD/MM/YYYY')
    } else if (/^\d{8}$/.test(valor)) {
      // Formato DDMMYYYY
      const partes = valor.match(/(\d{2})(\d{2})(\d{4})/)
      if (partes) {
        parsed = dayjs(`${partes[3]}-${partes[2]}-${partes[1]}`, 'YYYY-MM-DD')
      }
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor)) {
      // Formato D/M/YYYY ou DD/M/YYYY
      parsed = dayjs(valor, 'D/M/YYYY')
    }
    
    if (parsed && parsed.isValid()) {
      setDataRef(parsed)
      setInputValue(parsed.format('DD/MM/YYYY'))
      fetchAgenda(parsed)
    } else {
      notification.error({
        message: 'Data inválida',
        description: 'Use o formato DD/MM/YYYY (ex: 14/05/2026)',
        duration: 3,
      })
      setInputValue(dataRef.format('DD/MM/YYYY'))
    }
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <Title level={1}>Pacientes — PTS</Title>

      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Space wrap style={{ marginBottom: 16 }} align="center">
          <CalendarOutlined style={{ fontSize: 16, color: '#667eea' }} aria-hidden="true" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text strong>Data de referência:</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Digite no formato DD/MM/YYYY
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              type="text"
              placeholder="DD/MM/YYYY"
              value={inputValue}
              onChange={handleDateInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePesquisar()
                }
              }}
              aria-label="Digite a data no formato DD/MM/YYYY e clique em Pesquisar"
              style={{ width: 160 }}
              maxLength={10}
            />
            <Button
              type="primary"
              onClick={handlePesquisar}
              loading={loading}
              aria-label="Pesquisar pacientes pela data"
            >
              Pesquisar
            </Button>
          </div>
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
            `${r.cd_atendimento ?? '0'}-${r.cd_item_agendamento ?? '0'}-${r.cd_paciente ?? '0'}`
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
    </div>
  )
}
