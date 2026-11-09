import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Alert,
  App,
  DatePicker,
  Drawer,
  List,
  Modal,
  Popover,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  LeftOutlined,
  MinusCircleOutlined,
  RightOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAgendaDoPacientes, type AgendaItem } from '@/api/agendaService'
import { getPTSStatusBatch, type PtsStatusBatchItem } from '@/api/ptsService'
import { PtsHistoryTimeline } from '../../components/PTS/PtsHistoryTimeline'
import { useAuth } from '@/contexts'

dayjs.locale('pt-br')

const { Text } = Typography

type FiltroPts = 'todos' | 'aguardando' | 'sem_pts' | 'em_andamento' | 'finalizado'
type OrdenacaoCampo = 'cd_atendimento' | 'hr_agenda'

const GRID =
  'minmax(86px, 0.65fr) minmax(66px, 0.5fr) minmax(170px, 1.8fr) minmax(120px, 1.15fr) minmax(115px, 0.85fr) minmax(135px, 1.05fr) minmax(215px, 1.45fr)'
const PAGE_SIZE = 5

function PillAtendimento({ record }: { record: AgendaItem }) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifySelf: 'start',
    alignSelf: 'center',
    gap: 6,
    minHeight: 30,
    padding: '2px 10px',
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 700,
    color: '#14212b',
    width: 'fit-content',
    whiteSpace: 'nowrap',
  }

  if (!record.cd_atendimento) {
    return (
      <div style={{ ...base, background: '#f3f5f7', border: '1px solid #6e7c89' }}>
        <ClockCircleOutlined style={{ fontSize: 14, color: '#14212b' }} />
        <span>Aguardando</span>
      </div>
    )
  }

  const tp = (record.tp_situacao ?? '').toUpperCase()
  const map: Record<string, { label: string; bg: string; border?: string; icon?: ReactNode }> = {
    E: {
      label: 'Atendido',
      bg: '#e4f3e9',
      icon: <CheckCircleOutlined style={{ fontSize: 14, color: '#1b6b3a' }} />,
    },
    A: {
      label: 'Aguardando',
      bg: '#f3f5f7',
      border: '1px solid #6e7c89',
      icon: <ClockCircleOutlined style={{ fontSize: 14, color: '#14212b' }} />,
    },
    M: {
      label: 'Marcado',
      bg: '#eaf2fb',
      border: '1px solid #6e7c89',
      icon: <ClockCircleOutlined style={{ fontSize: 14, color: '#5568d3' }} />,
    },
    L: {
      label: 'Livre',
      bg: '#f3f5f7',
      border: '1px solid #6e7c89',
    },
    F: {
      label: 'Falta',
      bg: '#fbe9e7',
      icon: <CloseCircleOutlined style={{ fontSize: 14, color: '#b3261e' }} />,
    },
    C: {
      label: 'Cancelado',
      bg: '#fbe9e7',
      icon: <CloseCircleOutlined style={{ fontSize: 14, color: '#b3261e' }} />,
    },
    R: {
      label: 'Em Atendimento',
      bg: '#eaf2fb',
      icon: <ClockCircleOutlined style={{ fontSize: 14, color: '#764ba2' }} />,
    },
  }
  const info = map[tp] ?? { label: tp || '—', bg: '#f3f5f7', border: '1px solid #6e7c89' }

  return (
    <div
      role="status"
      aria-label={`Situação do atendimento: ${info.label}`}
      style={{ ...base, background: info.bg, border: info.border }}
    >
      {info.icon}
      <span>{info.label}</span>
    </div>
  )
}

function PillSituacaoPts({ status }: { status: PtsStatusBatchItem | null }) {
  const meuPts = status?.meu_pts
  const outrosPts = status?.outros_pts || []
  const finalizado = meuPts?.fl_finalizado === 1
  const temPTS = meuPts != null

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'start',
    gap: 6,
    minHeight: 30,
    padding: '2px 10px',
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 700,
    color: '#14212b',
    width: 'fit-content',
    whiteSpace: 'nowrap',
  }

  const contentMulti =
    outrosPts.length > 0 ? (
      <List
        size="small"
        dataSource={outrosPts}
        renderItem={(item) => (
          <List.Item style={{ padding: '4px 0', fontSize: 12 }}>
            <Text strong>{item.ds_especialidade}</Text> ({item.nm_profissional}) —{' '}
            {item.fl_finalizado ? (
              <Text type="success">Finalizado</Text>
            ) : (
              <Text type="warning">Em andamento</Text>
            )}
          </List.Item>
        )}
      />
    ) : null

  const multiTag =
    outrosPts.length > 0 ? (
      <Popover content={contentMulti} title="Outros Acompanhamentos" trigger="hover">
        <Tag color="purple" style={{ fontSize: 11, margin: 0, cursor: 'pointer', width: 'fit-content' }}>
          Multi ({outrosPts.length})
        </Tag>
      </Popover>
    ) : null

  if (!temPTS) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifySelf: 'start', minWidth: 0 }}>
        <div
          role="status"
          aria-label="Situação do PTS: Sem PTS"
          style={{ ...base, background: '#f3f5f7', border: '1px dashed #6e7c89' }}
        >
          <MinusCircleOutlined style={{ fontSize: 14, color: '#14212b' }} />
          <span>Sem PTS</span>
        </div>
        {multiTag}
      </div>
    )
  }

  if (finalizado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifySelf: 'start', minWidth: 0 }}>
        <div
          role="status"
          aria-label="Situação do PTS: Finalizado"
          style={{ ...base, background: '#e4f3e9' }}
        >
          <CheckCircleOutlined style={{ fontSize: 14, color: '#1b6b3a' }} />
          <span>Finalizado</span>
        </div>
        {meuPts?.dt_criacao && (
          <span style={{ color: '#44525e', fontSize: 12, lineHeight: 1.3 }}>
            Alterado em {meuPts.dt_criacao}
          </span>
        )}
        {multiTag}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifySelf: 'start', minWidth: 0 }}>
      <div
        role="status"
        aria-label="Situação do PTS: Em andamento"
        style={{ ...base, background: '#eceffb' }}
      >
        <EditOutlined style={{ fontSize: 14, color: '#5568d3' }} />
        <span>Em andamento</span>
      </div>
      {meuPts?.dt_criacao && (
        <span style={{ color: '#44525e', fontSize: 12, lineHeight: 1.3 }}>
          Alterado em {meuPts.dt_criacao}
        </span>
      )}
      {multiTag}
    </div>
  )
}

export default function PtsPacientesPage() {
  const { notification } = App.useApp()
  const { isConsulta } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isReturning = location.state?.fromPTS

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AgendaItem[]>([])
  const [dataRef, setDataRef] = useState<Dayjs>(() => {
    if (isReturning) {
      const saved = sessionStorage.getItem('pts_pacientes_data_ref')
      if (saved) return dayjs(saved)
    }
    return dayjs()
  })
  const [ptsStatus, setPtsStatus] = useState<Record<string, PtsStatusBatchItem>>({})
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroPts>('todos')
  const [pagina, setPagina] = useState(0)
  const [ordenacao, setOrdenacao] = useState<{ campo: OrdenacaoCampo; dir: 1 | -1 } | null>(null)

  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [historyCdPaciente, setHistoryCdPaciente] = useState<string | null>(null)
  const [searchAnnouncement, setSearchAnnouncement] = useState('')

  const fetchAgenda = async (d: Dayjs) => {
    setLoading(true)
    setError(null)
    setPagina(0)
    setSearchAnnouncement('')
    try {
      sessionStorage.setItem('pts_pacientes_data_ref', d.toISOString())
      const result = await getAgendaDoPacientes(d.format('YYYY-MM-DD'))
      setData(result.items)
      setSearchAnnouncement(
        result.total === 0
          ? `Nenhum paciente encontrado para ${d.format('DD/MM/YYYY')}`
          : `${result.total} paciente${result.total !== 1 ? 's' : ''} encontrado${result.total !== 1 ? 's' : ''} para ${d.format('DD/MM/YYYY')}`
      )
      const ids = result.items
        .map((i) => i.cd_paciente)
        .filter((id): id is number => id != null)
      if (ids.length > 0) {
        getPTSStatusBatch(ids).then(setPtsStatus).catch(() => null)
      } else {
        setPtsStatus({})
      }
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.detail ?? 'Erro ao buscar agenda do MV.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setData([])
      setPtsStatus({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgenda(dataRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function abrirPTS(record: AgendaItem) {
    if (isConsulta) {
      notification.info({
        message: 'Modo Somente Consulta',
        description: 'Seu perfil permite apenas visualização. Redirecionando para o Dashboard de PTS.',
        duration: 4,
      })
      navigate('/pts/dashboard')
      return
    }

    const status = record.cd_paciente != null ? ptsStatus[String(record.cd_paciente)] : null
    const meuPts = status?.meu_pts
    const outrosPts = status?.outros_pts || []

    const navegar = () => {
      navigate('/pts', {
        state: {
          nm_paciente: record.nm_paciente,
          cd_paciente: record.cd_paciente,
          cd_atendimento: record.cd_atendimento,
          id_pts: meuPts?.id_pts ?? null,
          fl_finalizado: meuPts?.fl_finalizado ?? 0,
        },
      })
    }

    if (!meuPts && outrosPts.length > 0) {
      Modal.confirm({
        title: 'Paciente em acompanhamento multidisciplinar',
        content: `Este paciente já possui PTS iniciado por outros profissionais nesta vigência (${outrosPts.map((o) => o.ds_especialidade).join(', ')}). Deseja iniciar a sua avaliação também?`,
        okText: 'Sim, iniciar',
        cancelText: 'Cancelar',
        onOk: navegar,
      })
      return
    }

    navegar()
  }

  const contadores = useMemo(() => {
    let aguardando = 0
    let semPts = 0
    let emAndamento = 0
    let finalizado = 0

    data.forEach((item) => {
      const tp = (item.tp_situacao ?? '').toUpperCase()
      if (!item.cd_atendimento || tp === 'A') {
        aguardando += 1
      }
      const st = item.cd_paciente != null ? ptsStatus[String(item.cd_paciente)] : null
      const meuPts = st?.meu_pts
      if (!meuPts) {
        semPts += 1
      } else if (meuPts.fl_finalizado === 1) {
        finalizado += 1
      } else {
        emAndamento += 1
      }
    })

    return {
      total: data.length,
      aguardando,
      semPts,
      emAndamento,
      finalizado,
    }
  }, [data, ptsStatus])

  const filtros: { key: FiltroPts; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: contadores.total },
    { key: 'aguardando', label: 'Aguardando atendimento', count: contadores.aguardando },
    { key: 'sem_pts', label: 'Sem PTS', count: contadores.semPts },
    { key: 'em_andamento', label: 'Em andamento', count: contadores.emAndamento },
    { key: 'finalizado', label: 'Finalizado', count: contadores.finalizado },
  ]

  const dadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return data.filter((item) => {
      const atendeBusca =
        !termo ||
        (item.nm_paciente ?? '').toLowerCase().includes(termo) ||
        String(item.cd_atendimento ?? '').includes(termo) ||
        String(item.cd_paciente ?? '').includes(termo)

      if (!atendeBusca) return false

      const tp = (item.tp_situacao ?? '').toUpperCase()
      const st = item.cd_paciente != null ? ptsStatus[String(item.cd_paciente)] : null
      const meuPts = st?.meu_pts

      if (filtro === 'aguardando') return !item.cd_atendimento || tp === 'A'
      if (filtro === 'sem_pts') return !meuPts
      if (filtro === 'em_andamento') return meuPts != null && meuPts.fl_finalizado !== 1
      if (filtro === 'finalizado') return meuPts?.fl_finalizado === 1
      return true
    })
  }, [data, busca, filtro, ptsStatus])

  const dadosProcessados = useMemo(() => {
    const lista = [...dadosFiltrados]
    if (ordenacao) {
      lista.sort((a, b) => {
        if (ordenacao.campo === 'cd_atendimento') {
          return ((a.cd_atendimento ?? 0) - (b.cd_atendimento ?? 0)) * ordenacao.dir
        }
        return (a.hr_agenda ?? '').localeCompare(b.hr_agenda ?? '') * ordenacao.dir
      })
    }
    return lista
  }, [dadosFiltrados, ordenacao])

  const totalPaginas = Math.max(1, Math.ceil(dadosProcessados.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas - 1)
  const paginaItens = dadosProcessados.slice(paginaSegura * PAGE_SIZE, (paginaSegura + 1) * PAGE_SIZE)
  const inicioIntervalo = dadosProcessados.length === 0 ? 0 : paginaSegura * PAGE_SIZE + 1
  const fimIntervalo = Math.min((paginaSegura + 1) * PAGE_SIZE, dadosProcessados.length)

  const alternarOrdenacao = (campo: OrdenacaoCampo) => {
    setOrdenacao((atual) => {
      if (!atual || atual.campo !== campo) return { campo, dir: 1 }
      if (atual.dir === 1) return { campo, dir: -1 }
      return null
    })
  }

  const setaOrdenacao = (campo: OrdenacaoCampo) => (
    <SwapOutlined
      rotate={ordenacao && ordenacao.campo === campo && ordenacao.dir === -1 ? 180 : 0}
      style={{ fontSize: 14, color: '#5568d3' }}
    />
  )

  const renderAcoes = (record: AgendaItem) => {
    const status = record.cd_paciente != null ? ptsStatus[String(record.cd_paciente)] : null
    const meuPts = status?.meu_pts
    const finalizado = meuPts?.fl_finalizado === 1
    const temPTS = meuPts != null
    const semAtendimento = !record.cd_atendimento
    const nomePaciente = record.nm_paciente ?? 'paciente'

    const acaoLabel = isConsulta
      ? 'Ver PTS'
      : finalizado
        ? 'Ver PTS'
        : temPTS
          ? 'Continuar PTS'
          : 'Iniciar PTS'

    const ehVerPts = finalizado || isConsulta

    const estiloBotaoPts: CSSProperties = semAtendimento
      ? {
          display: 'inline-flex',
          minHeight: 38,
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          backgroundColor: '#f3f5f7',
          border: '1px solid #6e7c89',
          borderRadius: 6,
          color: '#14212b',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'not-allowed',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }
      : ehVerPts
        ? {
            display: 'inline-flex',
            minHeight: 38,
            alignItems: 'center',
            gap: 6,
            padding: '0 12px',
            backgroundColor: '#ffffff',
            border: '2px solid #5568d3',
            borderRadius: 6,
            color: '#5568d3',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }
        : {
            display: 'inline-flex',
            minHeight: 38,
            alignItems: 'center',
            gap: 6,
            padding: '0 12px',
            backgroundColor: '#5568d3',
            border: 'none',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Tooltip
            title={
              semAtendimento
                ? 'Aguardando recepção/atendimento (sem código de atendimento)'
                : `${acaoLabel} de ${nomePaciente}`
            }
          >
            <button
              type="button"
              disabled={semAtendimento}
              onClick={() => abrirPTS(record)}
              aria-label={
                semAtendimento
                  ? `PTS indisponível para ${nomePaciente}: aguardando atendimento`
                  : `${acaoLabel} de ${nomePaciente}`
              }
              style={estiloBotaoPts}
            >
              <FileTextOutlined style={{ fontSize: 16 }} />
              <span>{acaoLabel}</span>
            </button>
          </Tooltip>

          {record.cd_paciente != null && (
            <button
              type="button"
              onClick={() => {
                setHistoryCdPaciente(String(record.cd_paciente))
                setHistoryDrawerVisible(true)
              }}
              aria-label={`Ver histórico de PTS do paciente ${nomePaciente}`}
              style={{
                display: 'inline-flex',
                minHeight: 38,
                flexShrink: 0,
                alignItems: 'center',
                gap: 6,
                padding: '0 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                color: '#14212b',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              <HistoryOutlined style={{ fontSize: 16 }} />
              <span>Histórico</span>
            </button>
          )}
        </div>
        {semAtendimento && (
          <span style={{ color: '#44525e', fontSize: 12, lineHeight: 1.3 }}>
            Disponível após o atendimento
          </span>
        )}
      </div>
    )
  }

  const celulaHeader: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: '#14212b',
    whiteSpace: 'nowrap',
  }

  const celulaLinha: CSSProperties = {
    display: 'grid',
    minHeight: 74,
    alignItems: 'center',
    gridTemplateColumns: GRID,
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #d5dce3',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        color: '#14212b',
        fontFamily: '"Atkinson Hyperlegible", Inter, sans-serif',
      }}
    >
      {/* Live region acessível para leitores de tela */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {searchAnnouncement}
      </div>

      {/* Cabeçalho da página */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#14212b', lineHeight: 1.2 }}>
          Pacientes — PTS
        </span>
        <span style={{ fontSize: 15, color: '#44525e', lineHeight: 1.5 }}>
          Pacientes agendados para a data escolhida, com a situação do PTS de cada um.
        </span>
      </div>

      {/* Barra de controles: Data de referência + Busca + Botão Pesquisar */}
      <div
        role="region"
        aria-label="Filtros de data e busca de pacientes"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
          padding: 16,
          backgroundColor: '#ffffff',
          border: '1px solid #d5dce3',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#14212b', lineHeight: 1.4 }}>
            Data de referência
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              aria-label="Dia anterior"
              onClick={() => {
                const d = dataRef.subtract(1, 'day')
                setDataRef(d)
                fetchAgenda(d)
              }}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#14212b',
              }}
            >
              <LeftOutlined />
            </button>

            <DatePicker
              value={dataRef}
              allowClear={false}
              format="DD/MM/YYYY"
              style={{
                width: 155,
                height: 40,
                borderRadius: 6,
                borderColor: '#6e7c89',
              }}
              onChange={(d) => {
                if (d) {
                  setDataRef(d)
                  fetchAgenda(d)
                }
              }}
              aria-label="Data de referência da agenda"
            />

            <button
              type="button"
              aria-label="Próximo dia"
              onClick={() => {
                const d = dataRef.add(1, 'day')
                setDataRef(d)
                fetchAgenda(d)
              }}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#14212b',
              }}
            >
              <RightOutlined />
            </button>

            <button
              type="button"
              onClick={() => {
                const hoje = dayjs()
                setDataRef(hoje)
                fetchAgenda(hoje)
              }}
              style={{
                height: 40,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 700,
                color: '#14212b',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Hoje
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 220px', minWidth: 200 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#14212b', lineHeight: 1.4 }}>
            Buscar paciente
          </span>
          <div
            style={{
              display: 'flex',
              height: 40,
              alignItems: 'center',
              gap: 8,
              padding: '0 12px',
              background: '#fff',
              border: '1px solid #6e7c89',
              borderRadius: 6,
            }}
          >
            <SearchOutlined style={{ fontSize: 18, color: '#44525e' }} />
            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setPagina(0)
              }}
              placeholder="Nome do paciente ou nº do atendimento"
              aria-label="Buscar por nome do paciente ou número do atendimento"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: '#14212b',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchAgenda(dataRef)}
          disabled={loading}
          aria-label="Pesquisar pacientes pela data de referência selecionada"
          style={{
            height: 40,
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#5568d3',
            border: 'none',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          Pesquisar
        </button>
      </div>

      {/* Filtros em pílula + contagem de pacientes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {filtros.map((f) => {
            const ativo = filtro === f.key
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  setFiltro(f.key)
                  setPagina(0)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 38,
                  padding: '0 14px',
                  borderRadius: 9999,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: ativo ? '#5568d3' : '#ffffff',
                  color: ativo ? '#ffffff' : '#14212b',
                  border: ativo ? 'none' : '1px solid #6e7c89',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {ativo && <CheckCircleOutlined />}
                <span>
                  {f.label} ( {f.count} )
                </span>
              </button>
            )
          })}
        </div>

        <span style={{ fontSize: 14, color: '#44525e', whiteSpace: 'nowrap' }}>
          {dadosProcessados.length} paciente{dadosProcessados.length !== 1 ? 's' : ''} encontrado
          {dadosProcessados.length !== 1 ? 's' : ''} em {dataRef.format('DD/MM/YYYY')}
        </span>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          message="Não foi possível carregar a agenda"
          description={error}
          role="alert"
        />
      )}

      {/* Tabela em Grid com adaptação responsiva */}
      <Spin spinning={loading}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: '1px solid #d5dce3',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ minWidth: 880 }}>
              {/* Cabeçalho da tabela */}
              <div
                style={{
                  display: 'grid',
                  minHeight: 50,
                  alignItems: 'center',
                  gridTemplateColumns: GRID,
                  gap: 12,
                  padding: '0 16px',
                  backgroundColor: '#eceffb',
                  borderBottom: '2px solid #d5dce3',
                }}
              >
                <button
                  type="button"
                  onClick={() => alternarOrdenacao('cd_atendimento')}
                  style={{
                    ...celulaHeader,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  <span>Atendimento</span>
                  {setaOrdenacao('cd_atendimento')}
                </button>

                <button
                  type="button"
                  onClick={() => alternarOrdenacao('hr_agenda')}
                  style={{
                    ...celulaHeader,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  <span>Horário</span>
                  {setaOrdenacao('hr_agenda')}
                </button>

                <span style={celulaHeader}>Paciente</span>
                <span style={celulaHeader}>Procedimento</span>
                <span style={celulaHeader}>Atendimento</span>
                <span style={celulaHeader}>Situação do PTS</span>
                <span style={celulaHeader}>Ação</span>
              </div>

              {/* Linhas da tabela */}
              {paginaItens.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#44525e', fontSize: 15 }}>
                  Nenhum paciente agendado para {dataRef.format('DD/MM/YYYY')}.
                </div>
              ) : (
                paginaItens.map((r) => {
                  const st = r.cd_paciente != null ? ptsStatus[String(r.cd_paciente)] ?? null : null
                  return (
                    <div
                      key={`${r.cd_atendimento ?? 'atend'}_${r.cd_agenda_central ?? 'ag'}_${r.cd_paciente ?? 'pac'}_${r.hr_agenda ?? ''}`}
                      style={celulaLinha}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#14212b' }}>
                        {r.cd_atendimento ?? 'Sem nº'}
                      </span>

                      <span style={{ fontSize: 15, fontWeight: 700, color: '#14212b' }}>
                        {r.hr_agenda ?? '—'}
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#14212b',
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                          }}
                        >
                          {r.nm_paciente ?? '—'}
                        </span>
                        <span style={{ fontSize: 13, color: '#44525e' }}>
                          Cód. {r.cd_paciente ?? '—'}
                          {r.sn_encaixe === 'S' ? ' · Encaixe' : ''}
                        </span>
                      </div>

                      <span style={{ fontSize: 14, color: '#14212b', lineHeight: 1.35, minWidth: 0 }}>
                        {r.ds_item_agendamento ?? '—'}
                      </span>

                      <PillAtendimento record={r} />

                      <PillSituacaoPts status={st} />

                      {renderAcoes(r)}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Rodapé com paginação */}
          <div
            style={{
              display: 'flex',
              minHeight: 56,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 16px',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 14, color: '#44525e' }}>
              Mostrando {inicioIntervalo} a {fimIntervalo} de {dadosProcessados.length} pacientes
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={paginaSegura === 0}
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                style={{
                  minHeight: 38,
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#14212b',
                  cursor: paginaSegura === 0 ? 'not-allowed' : 'pointer',
                  opacity: paginaSegura === 0 ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPagina(i)}
                  style={{
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: i === paginaSegura ? '#5568d3' : '#ffffff',
                    color: i === paginaSegura ? '#ffffff' : '#14212b',
                    border: i === paginaSegura ? 'none' : '1px solid #6e7c89',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={paginaSegura >= totalPaginas - 1}
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                style={{
                  minHeight: 38,
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#14212b',
                  cursor: paginaSegura >= totalPaginas - 1 ? 'not-allowed' : 'pointer',
                  opacity: paginaSegura >= totalPaginas - 1 ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </Spin>

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
