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
  DatePicker,
  Popover,
  notification,
} from 'antd'
import {
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileProtectOutlined,
} from '@ant-design/icons'
import { 
  DatePicker as AriaDatePicker, 
  Label, 
  Group, 
  DateInput, 
  DateSegment, 
  Button as AriaButton, 
  Popover as AriaPopover, 
  Dialog, 
  Calendar, 
  CalendarGrid, 
  CalendarGridHeader, 
  CalendarHeaderCell, 
  CalendarGridBody, 
  CalendarCell, 
  Heading 
} from 'react-aria-components'
import { CalendarDate } from '@internationalized/date'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const isReturning = location.state?.fromPTS

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [data, setData]         = useState<AgendaItem[]>([])
  const [total, setTotal]       = useState(0)
  const [dataRef, setDataRef]   = useState<Dayjs>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('pts_pacientes_data_ref')
      if (saved) return dayjs(saved)
    }
    return dayjs()
  })
  const [inputValue, setInputValue] = useState<string>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('pts_pacientes_data_ref')
      if (saved) return dayjs(saved).format('DD/MM/YYYY')
    }
    return dayjs().format('DD/MM/YYYY')
  })
  const [ptsStatus, setPtsStatus] = useState<Record<string, { id_pts: number; fl_finalizado: number } | null>>({})
  const [calendarOpen, setCalendarOpen] = useState(false)

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
      sessionStorage.setItem('pts_pacientes_data_ref', d.toISOString())
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

  const handleDateChange = (date: Dayjs | null) => {
    if (date && date.isValid()) {
      setDataRef(date)
      setInputValue(date.format('DD/MM/YYYY'))
      setCalendarOpen(false)
      fetchAgenda(date)
    }
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.currentTarget.value.trim()
    
    // Remove tudo que não for número ou barra
    valor = valor.replace(/[^\d/]/g, '')
    
    // Se o usuário digitar só números, aplica a máscara automaticamente
    if (!/\//g.test(valor) && valor.length > 0) {
      // Remove qualquer caractere não numérico
      const apenasNumeros = valor.replace(/\D/g, '')
      
      if (apenasNumeros.length > 0) {
        // Aplica máscara DD/MM/YYYY
        if (apenasNumeros.length <= 2) {
          valor = apenasNumeros
        } else if (apenasNumeros.length <= 4) {
          valor = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`
        } else if (apenasNumeros.length <= 8) {
          valor = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`
        } else {
          // Limita a 8 dígitos
          valor = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`
        }
      }
    } else if (/\//g.test(valor)) {
      // Se já tem barras, remove e reaplica a máscara
      const apenasNumeros = valor.replace(/\D/g, '')
      if (apenasNumeros.length > 0) {
        if (apenasNumeros.length <= 2) {
          valor = apenasNumeros
        } else if (apenasNumeros.length <= 4) {
          valor = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`
        } else if (apenasNumeros.length <= 8) {
          valor = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`
        } else {
          valor = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`
        }
      }
    }
    
    setInputValue(valor)
  }

  const handlePesquisar = () => {
    const valor = inputValue.trim()

    if (!valor) {
      notification.error({
        message: 'Data inválida',
        description: 'Digite uma data no formato DD/MM/YYYY',
        duration: 3,
      })
      return
    }

    // Remove barras para normalizar
    const apenasNumeros = valor.replace(/\D/g, '')

    // Tenta parsear diferentes formatos
    let parsed: Dayjs | null = null

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      // Formato DD/MM/YYYY
      parsed = dayjs(valor, 'DD/MM/YYYY')
    } else if (/^\d{8}$/.test(apenasNumeros)) {
      // Formato DDMMYYYY
      const dia = apenasNumeros.slice(0, 2)
      const mes = apenasNumeros.slice(2, 4)
      const ano = apenasNumeros.slice(4, 8)
      parsed = dayjs(`${ano}-${mes}-${dia}`, 'YYYY-MM-DD')
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
        <Space 
          wrap 
          style={{ marginBottom: 16 }} 
          align="center"
          role="region"
          aria-label="Filtro de data para busca de pacientes"
        >
          <CalendarOutlined style={{ fontSize: 16, color: '#667eea' }} aria-hidden="true" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="data-referencia-input" style={{ fontWeight: 600, margin: 0 }}>
              Data de referência:
            </label>
            <span id="data-referencia-descricao" style={{ fontSize: 12, color: '#8c8c8c' }}>
              DD/MM/YYYY ou números (ex: 14052026)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AriaDatePicker
              value={new CalendarDate(dataRef.year(), dataRef.month() + 1, dataRef.date())}
              onChange={(date: CalendarDate | null) => {
                if (date) {
                  const djs = dayjs(`${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`)
                  setDataRef(djs)
                  setInputValue(djs.format('DD/MM/YYYY'))
                  fetchAgenda(djs)
                }
              }}
              aria-label="Campo de data de referência"
            >
              <Group style={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid #d9d9d9', 
                borderRadius: 6, 
                padding: '4px 11px',
                background: '#fff',
                height: 32,
                transition: 'all 0.2s'
              }}>
                <DateInput style={{ display: 'flex', gap: 2, border: 'none', background: 'transparent', outline: 'none' }}>
                  {(segment) => (
                    <DateSegment 
                      segment={segment} 
                      style={{ 
                        padding: '0 2px', 
                        fontVariantNumeric: 'tabular-nums', 
                        outline: 'none',
                        color: segment.isPlaceholder ? '#bfbfbf' : 'inherit'
                      }} 
                    />
                  )}
                </DateInput>
                <AriaButton style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', display: 'flex' }}>
                  <CalendarOutlined style={{ color: '#667eea' }} />
                </AriaButton>
              </Group>
              <AriaPopover style={{ 
                background: '#fff', 
                border: '1px solid #f0f0f0', 
                borderRadius: 8, 
                padding: 12, 
                boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)' 
              }}>
                <Dialog style={{ outline: 'none' }}>
                  <Calendar>
                    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <AriaButton slot="previous" style={{ background: 'none', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', padding: '4px 8px' }}>◀</AriaButton>
                      <Heading style={{ margin: 0, fontWeight: 600, fontSize: 14 }} />
                      <AriaButton slot="next" style={{ background: 'none', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', padding: '4px 8px' }}>▶</AriaButton>
                    </header>
                    <CalendarGrid>
                      <CalendarGridHeader>
                        {(day) => <CalendarHeaderCell style={{ fontSize: 12, color: '#8c8c8c', paddingBottom: 8, fontWeight: 400 }}>{day}</CalendarHeaderCell>}
                      </CalendarGridHeader>
                      <CalendarGridBody>
                        {(date) => (
                          <CalendarCell 
                            date={date} 
                            style={({ isSelected, isHovered }) => ({
                              cursor: 'pointer',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4,
                              fontSize: 14,
                              background: isSelected ? '#667eea' : isHovered ? '#f5f5f5' : 'transparent',
                              color: isSelected ? '#fff' : 'inherit',
                              outline: 'none'
                            })} 
                          />
                        )}
                      </CalendarGridBody>
                    </CalendarGrid>
                  </Calendar>
                </Dialog>
              </AriaPopover>
            </AriaDatePicker>
            <Button
              type="primary"
              onClick={handlePesquisar}
              loading={loading}
              aria-label="Pesquisar pacientes pela data de referência selecionada"
            >
              Pesquisar
            </Button>
          </div>
          {total > 0 && (
            <Tag 
              color="blue" 
              style={{ fontSize: 13 }}
              aria-label={`Total de ${total} paciente${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
            >
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
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
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
          aria-label="Lista de pacientes agendados com status de PTS"
        />
      </Card>
    </div>
  )
}
