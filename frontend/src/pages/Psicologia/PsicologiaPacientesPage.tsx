import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Tooltip,
  App,
  Spin,
  Alert,
  DatePicker,
  Badge,
} from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { getAgendaDoPacientes, type AgendaItem } from '@/api/agendaService'
import {
  listarPsiProtocolos,
  getPsiAvaliacoesStatusBatch,
  criarPsiAvaliacao,
  type PsiStatusBatchItem,
} from '@/api/psicologiaService'
import type { PsiProtocolo } from '@/types/psicologia'

const { Title, Text } = Typography

function situacaoTag(tp: string | null) {
  if (!tp) return <Tag aria-label="Situação não informada">—</Tag>
  const map: Record<string, { color: string; label: string }> = {
    L: { color: 'default', label: 'Livre' },
    M: { color: 'blue', label: 'Marcado' },
    A: { color: 'orange', label: 'Aguardando' },
    E: { color: 'green', label: 'Atendido' },
    F: { color: 'red', label: 'Falta' },
    C: { color: 'volcano', label: 'Cancelado' },
    R: { color: 'purple', label: 'Em Atendimento' },
  }
  const info = map[tp.toUpperCase()] ?? { color: 'default', label: tp }
  return <Tag color={info.color} role="status" aria-label={`Situação: ${info.label}`}>{info.label}</Tag>
}

function encaixeBadge(sn: string | null) {
  return sn === 'S' ? <Badge status="warning" text="Encaixe" /> : null
}

export default function PsicologiaPacientesPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [dataRef, setDataRef] = useState<Dayjs>(() => dayjs())
  const [data, setData] = useState<AgendaItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [psiStatus, setPsiStatus] = useState<Record<string, PsiStatusBatchItem>>({})
  const [protocolos, setProtocolos] = useState<PsiProtocolo[]>([])
  const [criandoCodigo, setCriandoCodigo] = useState<string | null>(null)

  const fetchAgenda = async (d: Dayjs) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAgendaDoPacientes(d.format('YYYY-MM-DD'))
      setData(result.items)
      setTotal(result.total)

      const ids = result.items
        .map((i) => i.cd_paciente)
        .filter((id): id is number => id != null)
      if (ids.length > 0) {
        getPsiAvaliacoesStatusBatch(ids).then(setPsiStatus).catch(() => null)
      } else {
        setPsiStatus({})
      }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.detail ?? 'Erro ao buscar agenda do MV.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    listarPsiProtocolos().then(setProtocolos).catch(() => setProtocolos([]))
    fetchAgenda(dataRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirAvaliacao = async (record: AgendaItem, protocolo: PsiProtocolo) => {
    const status = record.cd_paciente != null ? psiStatus[String(record.cd_paciente)] : null
    const aval = status?.avaliacoes?.[protocolo.ds_codigo]

    if (aval) {
      navigate(`/psicologia/avaliacoes/${aval.id_avaliacao}`)
      return
    }

    setCriandoCodigo(protocolo.ds_codigo)
    try {
      const nova = await criarPsiAvaliacao({
        cd_paciente: String(record.cd_paciente),
        cd_atendimento: record.cd_atendimento != null ? String(record.cd_atendimento) : null,
        dt_clinica: dayjs().toISOString(),
        id_protocolo: protocolo.id_protocolo,
      })
      navigate(`/psicologia/avaliacoes/${nova.id_avaliacao}`)
    } catch (err: any) {
      message.error(err?.response?.data?.detail ?? 'Erro ao iniciar avaliação.')
    } finally {
      setCriandoCodigo(null)
    }
  }

  const columns: ColumnsType<AgendaItem> = [
    {
      title: 'Atendimento',
      dataIndex: 'cd_atendimento',
      width: 100,
      sorter: (a, b) => (a.cd_atendimento ?? 0) - (b.cd_atendimento ?? 0),
      render: (v) => <Text strong>{v ?? '—'}</Text>,
    },
    {
      title: 'Horário',
      dataIndex: 'hr_agenda',
      width: 80,
      sorter: (a, b) => (a.hr_agenda ?? '').localeCompare(b.hr_agenda ?? ''),
      render: (v) => <Text strong>{v ?? '—'}</Text>,
    },
    {
      title: 'Paciente',
      dataIndex: 'nm_paciente',
      ellipsis: true,
      render: (nome, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined style={{ color: '#667eea' }} aria-hidden="true" />
            <Text strong>{nome ?? '—'}</Text>
            {record.nr_fone && (
              <Tooltip title={record.nr_fone}>
                <PhoneOutlined style={{ color: '#aaa', fontSize: 11 }} aria-hidden="true" />
              </Tooltip>
            )}
          </Space>
          {record.cd_paciente && (
            <Text type="secondary" style={{ fontSize: 11 }}>Cód. {record.cd_paciente}</Text>
          )}
          {encaixeBadge(record.sn_encaixe)}
        </Space>
      ),
    },
    {
      title: 'Procedimento',
      dataIndex: 'ds_item_agendamento',
      width: 160,
      ellipsis: true,
      render: (v) => (v ? <Text ellipsis={{ tooltip: v }}>{v}</Text> : '—'),
    },
    {
      title: 'Situação',
      dataIndex: 'tp_situacao',
      width: 130,
      filters: [
        { text: 'Marcado', value: 'M' },
        { text: 'Atendido', value: 'A' },
        { text: 'Falta', value: 'F' },
        { text: 'Cancelado', value: 'C' },
        { text: 'Em Atendimento', value: 'R' },
      ],
      onFilter: (value, record) => (record.tp_situacao ?? '').toUpperCase() === value,
      render: (v) => situacaoTag(v),
    },
    {
      title: 'Avaliações',
      key: 'avaliacoes',
      width: 190,
      fixed: 'right',
      render: (_, record) => {
        const semAtendimento = !record.cd_atendimento
        const nomePaciente = record.nm_paciente ?? 'paciente'
        const status = record.cd_paciente != null ? psiStatus[String(record.cd_paciente)] : null

        return (
          <Space direction="vertical" size={4} align="start">
            {protocolos.map((protocolo) => {
              const aval = status?.avaliacoes?.[protocolo.ds_codigo]
              const rotulo = !aval
                ? 'Iniciar'
                : aval.ds_situacao === 'RASCUNHO'
                  ? 'Continuar'
                  : 'Ver'

              const icone = !aval
                ? <PlusOutlined aria-hidden="true" />
                : aval.ds_situacao === 'RASCUNHO'
                  ? <EditOutlined aria-hidden="true" />
                  : <EyeOutlined aria-hidden="true" />

              return (
                <Space key={protocolo.ds_codigo} direction="vertical" size={2} align="start">
                  <Tooltip
                    title={
                      semAtendimento
                        ? 'Aguardando recepção (sem código de atendimento)'
                        : `${rotulo} ${protocolo.ds_codigo} de ${nomePaciente}`
                    }
                  >
                    <Button
                      size="small"
                      type={aval ? 'default' : 'primary'}
                      icon={icone}
                      loading={criandoCodigo === protocolo.ds_codigo}
                      disabled={semAtendimento}
                      onClick={() => abrirAvaliacao(record, protocolo)}
                      aria-label={
                        semAtendimento
                          ? `Avaliação ${protocolo.ds_codigo} indisponível para ${nomePaciente}: aguardando recepção`
                          : `${rotulo} ${protocolo.ds_codigo} de ${nomePaciente}`
                      }
                    >
                      {protocolo.ds_codigo}
                    </Button>
                  </Tooltip>
                  {aval && (
                    <Tag
                      color={
                        aval.ds_situacao === 'RASCUNHO'
                          ? 'orange'
                          : aval.ds_situacao === 'FINALIZADO'
                            ? 'green'
                            : 'red'
                      }
                      style={{ fontSize: 10, margin: 0 }}
                    >
                      {aval.ds_situacao}
                    </Tag>
                  )}
                </Space>
              )
            })}
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center" wrap>
          <div>
            <Title level={2} style={{ margin: 0 }}>Psicologia — Atendimentos</Title>
            <Text type="secondary">Pacientes agendados/recepcionados para os protocolos PAFE e PASAC</Text>
          </div>
          <Space>
            <Text strong>Data:</Text>
            <DatePicker
              value={dataRef}
              allowClear={false}
              format="DD/MM/YYYY"
              onChange={(d) => {
                if (d) {
                  setDataRef(d)
                  fetchAgenda(d)
                }
              }}
              aria-label="Data de referência da agenda"
            />
          </Space>
        </Space>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Não foi possível carregar a agenda"
            description={error}
          />
        )}

        <Spin spinning={loading}>
          <Card variant="borderless">
            <Table
              dataSource={data}
              rowKey={(r) =>
                `${r.cd_atendimento ?? 'atend'}_${r.cd_agenda_central ?? 'ag'}_${r.cd_paciente ?? 'pac'}_${r.hr_agenda ?? ''}`
              }
              columns={columns}
              pagination={false}
              scroll={{ x: 900 }}
              locale={{ emptyText: `Nenhum paciente agendado para ${dataRef.format('DD/MM/YYYY')}.` }}
            />
          </Card>
        </Spin>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {total > 0 ? `${total} paciente(s) na agenda.` : ''}
        </Text>
      </Space>
    </div>
  )
}
