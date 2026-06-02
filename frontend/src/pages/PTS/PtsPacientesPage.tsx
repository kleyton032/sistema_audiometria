import React, { useEffect, useState } from 'react'
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
  App,
  Modal,
  Popover,
  List,
} from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileProtectOutlined,
} from '@ant-design/icons'
import { 
  DatePicker as AriaDatePicker, 
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
import { getPTSStatusBatch, type PtsStatusBatchItem } from '@/api/ptsService'
import { PtsHistoryTimeline } from '../../components/PTS/PtsHistoryTimeline'
import { Drawer } from 'antd'

dayjs.locale('pt-br')

const { Title, Text } = Typography

function situacaoTag(tp: string | null) {
  if (!tp) return <Tag aria-label="Situação não informada">—</Tag>
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
  return (
    <Tag
      color={info.color}
      role="status"
      aria-label={`Situação: ${info.label}`}
    >
      {info.label}
    </Tag>
  )
}

function encaixeBadge(sn: string | null) {
  return sn === 'S' ? <Badge status="warning" text="Encaixe" /> : null
}

export default function PtsPacientesPage() {
  const { notification } = App.useApp()
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
  const [ptsStatus, setPtsStatus] = useState<Record<string, PtsStatusBatchItem>>({})
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [historyCdPaciente, setHistoryCdPaciente] = useState<string | null>(null)

  // Anuncio acessível do resultado da busca para leitores de tela
  const [searchAnnouncement, setSearchAnnouncement] = useState('')

  function abrirPTS(record: AgendaItem) {
    const status = record.cd_paciente != null ? ptsStatus[String(record.cd_paciente)] : null
    const meuPts = status?.meu_pts
    const outrosPts = status?.outros_pts || []

    const navegar = () => {
      navigate('/pts', {
        state: {
          nm_paciente:    record.nm_paciente,
          cd_paciente:    record.cd_paciente,
          cd_atendimento: record.cd_atendimento,
          id_pts:         meuPts?.id_pts ?? null,
          fl_finalizado:  meuPts?.fl_finalizado ?? 0,
        },
      })
    }

    if (!meuPts && outrosPts.length > 0) {
      Modal.confirm({
        title: 'Paciente em acompanhamento multidisciplinar',
        content: `Este paciente já possui PTS iniciado por outros profissionais nesta vigência (${outrosPts.map(o => o.ds_especialidade).join(', ')}). Deseja iniciar a sua avaliação também?`,
        okText: 'Sim, iniciar',
        cancelText: 'Cancelar',
        onOk: navegar
      })
      return
    }

    navegar()
  }

  const columns: ColumnsType<AgendaItem> = [
    {
      title: 'Atendimento',
      dataIndex: 'cd_atendimento',
      key: 'cd_atendimento',
      width: 100,
      sorter: (a, b) => (a.cd_atendimento ?? 0) - (b.cd_atendimento ?? 0),
      render: (v) => <Text strong>{v ?? '—'}</Text>,
    },
    {
      title: 'Horário',
      dataIndex: 'hr_agenda',
      key: 'hr_agenda',
      width: 80,
      sorter: (a, b) => (a.hr_agenda ?? '').localeCompare(b.hr_agenda ?? ''),
      render: (v) => <Text strong>{v ?? '—'}</Text>,
    },
    {
      title: 'Paciente',
      dataIndex: 'nm_paciente',
      key: 'nm_paciente',
      ellipsis: true,
      render: (nome, record) => {
        const label = [
          nome ?? 'Nome não informado',
          record.cd_paciente ? `código ${record.cd_paciente}` : null,
          record.sn_encaixe === 'S' ? 'encaixe' : null,
          record.nr_fone ? `telefone ${record.nr_fone}` : null,
        ].filter(Boolean).join(', ')
        return (
          <Space direction="vertical" size={0} aria-label={`Paciente: ${label}`}>
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
              <Text type="secondary" style={{ fontSize: 11 }} aria-hidden="true">
                Cód. {record.cd_paciente}
              </Text>
            )}
            {encaixeBadge(record.sn_encaixe)}
          </Space>
        )
      },
    },
    {
      title: 'Procedimento',
      dataIndex: 'ds_item_agendamento',
      key: 'ds_item_agendamento',
      width: 160,
      ellipsis: true,
      render: (v) =>
        v ? (
          <Text ellipsis={{ tooltip: v }}>{v}</Text>
        ) : (
          <Text type="secondary" aria-label="Item agendado não informado">—</Text>
        ),
    },
    {
      title: 'Situação',
      dataIndex: 'tp_situacao',
      key: 'tp_situacao',
      width: 120,
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
      width: 170,
      fixed: 'right',
      render: (_, record) => {
        const status = record.cd_paciente != null ? ptsStatus[String(record.cd_paciente)] : null
        const meuPts = status?.meu_pts
        const outrosPts = status?.outros_pts || []
        const finalizado = meuPts?.fl_finalizado === 1
        const temPTS = meuPts != null
        const acaoLabel  = finalizado ? 'Ver Meu PTS' : temPTS ? 'Continuar PTS' : 'Iniciar PTS'
        const nomePaciente = record.nm_paciente ?? 'paciente'
        const semAtendimento = !record.cd_atendimento

        const contentMulti = (
          <List
            size="small"
            dataSource={outrosPts}
            renderItem={item => (
              <List.Item style={{ padding: '4px 0', fontSize: 11 }}>
                <Text strong>{item.ds_especialidade}</Text> ({item.nm_profissional}) - {item.fl_finalizado ? <Text type="success">Finalizado</Text> : <Text type="warning">Em andamento</Text>}
              </List.Item>
            )}
          />
        )

        return (
          <Space direction="vertical" size={4} align="start">
            <Tooltip title={semAtendimento ? 'Aguardando recepção (sem código de atendimento)' : undefined}>
              {/* React Aria Button garante que o leitor anuncie o texto exato do aria-label */}
              <AriaButton
                isDisabled={semAtendimento}
                onPress={() => abrirPTS(record)}
                aria-label={
                  semAtendimento
                    ? `PTS indisponível para ${nomePaciente}: aguardando recepção`
                    : `${acaoLabel} de ${nomePaciente}`
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  height: 24,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: 'none',
                  cursor: semAtendimento ? 'not-allowed' : 'pointer',
                  background: semAtendimento
                    ? '#f5f5f5'
                    : finalizado
                    ? '#52c41a'
                    : temPTS
                    ? '#faad14'
                    : '#667eea',
                  color: semAtendimento ? '#bfbfbf' : '#fff',
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                  outline: 'none',
                }}
                className="pts-aria-btn"
              >
                <FileProtectOutlined aria-hidden="true" style={{ fontSize: 13 }} />
                {acaoLabel}
              </AriaButton>
            </Tooltip>
            
            {record.cd_paciente && (
              <AriaButton
                onPress={() => {
                  setHistoryCdPaciente(String(record.cd_paciente))
                  setHistoryDrawerVisible(true)
                }}
                aria-label={`Ver histórico de PTS do paciente ${nomePaciente}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  height: 24,
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                  cursor: 'pointer',
                  background: '#fff',
                  color: '#595959',
                  marginTop: 4,
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
                className="pts-aria-btn"
              >
                Histórico
              </AriaButton>
            )}

            <Space size={2} wrap>
              {finalizado && (
                <Tag color="success" role="status" aria-label="PTS finalizado" style={{ fontSize: 10, margin: 0 }}>
                  Finalizado
                </Tag>
              )}
              {temPTS && !finalizado && (
                <Tag color="warning" role="status" aria-label="PTS em andamento" style={{ fontSize: 10, margin: 0 }}>
                  Em andamento
                </Tag>
              )}
              {outrosPts.length > 0 && (
                <Popover content={contentMulti} title="Outros Acompanhamentos" trigger="hover">
                  <Tag color="purple" style={{ fontSize: 10, margin: 0, cursor: 'pointer' }}>
                    Multi ({outrosPts.length})
                  </Tag>
                </Popover>
              )}
            </Space>
            
            {meuPts?.dt_criacao && (
              <Text type="secondary" style={{ fontSize: 10 }}>Últ. alteração: {meuPts.dt_criacao}</Text>
            )}
          </Space>
        )
      },
    },
  ]

  const fetchAgenda = async (d: Dayjs) => {
    setLoading(true)
    setError(null)
    setSearchAnnouncement('')
    try {
      sessionStorage.setItem('pts_pacientes_data_ref', d.toISOString())
      const result = await getAgendaDoPacientes(d.format('YYYY-MM-DD'))
      setData(result.items)
      setTotal(result.total)
      // Anuncia o resultado para leitores de tela
      setSearchAnnouncement(
        result.total === 0
          ? `Nenhum paciente encontrado para ${d.format('DD/MM/YYYY')}`
          : `${result.total} paciente${result.total !== 1 ? 's' : ''} encontrado${result.total !== 1 ? 's' : ''} para ${d.format('DD/MM/YYYY')}`
      )
      // Busca status PTS para todos os pacientes da agenda
      const ids = result.items
        .map((i) => i.cd_paciente)
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
      {/* CSS de foco visível para o botão React Aria da coluna PTS */}
      <style>{`
        .pts-aria-btn:focus-visible {
          outline: 2px solid #667eea;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.25);
        }
        .pts-aria-btn[data-hovered]:not([data-disabled]) {
          opacity: 0.88;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        }
        .pts-aria-btn[data-pressed]:not([data-disabled]) {
          transform: scale(0.97);
        }
      `}</style>
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
                <AriaButton
                  aria-label="Abrir calendário para selecionar data"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', display: 'flex' }}
                >
                  <CalendarOutlined style={{ color: '#667eea' }} aria-hidden="true" />
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

        {/* Live region acessível: anuncia resultado da busca ao leitor de tela */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1, height: 1, padding: 0, margin: -1,
            overflow: 'hidden', clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap', border: 0,
          }}
        >
          {searchAnnouncement}
        </div>

        <Table<AgendaItem>
          rowKey={(r) =>
            `${r.cd_atendimento ?? '0'}-${r.cd_item_agendamento ?? '0'}-${r.cd_paciente ?? '0'}`
          }
          columns={columns}
          dataSource={data}
          loading={loading}
          size="middle"
          caption="Lista de pacientes agendados com status de PTS"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} registros` }}
          locale={{ emptyText: 'Nenhum paciente agendado para esta data.' }}
          scroll={{ x: 780 }}
          aria-label="Lista de pacientes agendados com status de PTS"
          onRow={(record) => {
            const status = record.cd_paciente != null ? ptsStatus[String(record.cd_paciente)] : null
            const meuPts = status?.meu_pts
            const finalizado = meuPts?.fl_finalizado === 1
            const temPTS = meuPts != null
            const SITUACAO_MAP: Record<string, string> = {
              L: 'Livre', M: 'Marcado', A: 'Aguardando',
              E: 'Atendido', F: 'Falta', C: 'Cancelado', R: 'Em Atendimento',
            }
            const situacao = record.tp_situacao
              ? (SITUACAO_MAP[record.tp_situacao.toUpperCase()] ?? record.tp_situacao)
              : 'não informada'
            const ptsStatusLabel = finalizado
              ? 'PTS finalizado'
              : temPTS
              ? 'PTS em andamento'
              : 'Sem PTS registrado'

            return {
              'aria-label': [
                `Paciente: ${record.nm_paciente ?? 'não informado'}`,
                record.cd_atendimento
                  ? `código de atendimento ${record.cd_atendimento}`
                  : 'sem código de atendimento',
                `horário: ${record.hr_agenda ?? 'não informado'}`,
                record.ds_item_agendamento
                  ? `item agendado: ${record.ds_item_agendamento}`
                  : null,
                `situação: ${situacao}`,
                ptsStatusLabel,
              ].filter(Boolean).join(', '),
            } as React.HTMLAttributes<HTMLTableRowElement>
          }}
        />
      </Card>

      <Drawer
        title="Histórico Longitudinal de PTS"
        placement="right"
        width={700}
        onClose={() => {
          setHistoryDrawerVisible(false)
          setHistoryCdPaciente(null)
        }}
        open={historyDrawerVisible}
      >
        {historyCdPaciente && <PtsHistoryTimeline cdPaciente={historyCdPaciente} />}
      </Drawer>
    </div>
  )
}
