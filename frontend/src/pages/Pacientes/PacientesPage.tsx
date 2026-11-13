import { useEffect, useState, useRef, type CSSProperties } from 'react'
import { DatePicker, Tooltip, Spin, Alert } from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PhoneOutlined,
  UserOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { getAgendaDoPacientes, type AgendaItem } from '@/api/agendaService'
import { buscarStatusAtendimentos, type ExameStatusItem } from '@/api/exameService'
import ExameModal, { type TipoExame } from '@/components/ExameModal'
import { parseBrDate, DATE_PICKER_FORMATS } from '@/utils/dateUtils'

dayjs.locale('pt-br')

// Códigos de item que abrem exames
const CD_AUDIOMETRIA = 2766
const CD_IMITANCIOMETRIA = 2767

function tipoExamePorItem(cdItem: number | null): TipoExame | null {
  if (cdItem === CD_AUDIOMETRIA) return 'audiometria'
  if (cdItem === CD_IMITANCIOMETRIA) return 'imitanciometria'
  return null
}

type FiltroExame = 'todos' | 'finalizado' | 'sem_exame'

type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; direction: 'prev' | 'next' }

export default function PacientesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AgendaItem[]>([])
  const [dataRef, setDataRef] = useState<Dayjs>(dayjs())
  const dataRefCurrent = useRef<Dayjs>(dataRef)
  dataRefCurrent.current = dataRef

  const [statusExames, setStatusExames] = useState<Record<string, ExameStatusItem>>({})

  // Filtros e busca
  const [busca, setBusca] = useState('')
  const [filtroExame, setFiltroExame] = useState<FiltroExame>('todos')
  const [sortAtendimento, setSortAtendimento] = useState<'asc' | 'desc' | null>(null)
  const [sortHorario, setSortHorario] = useState<'asc' | 'desc' | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [jumpInput, setJumpInput] = useState('')

  // Estado do modal de exame
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTipo, setModalTipo] = useState<TipoExame | null>(null)
  const [modalPaciente, setModalPaciente] = useState<string | null>(null)
  const [modalCdPaciente, setModalCdPaciente] = useState<number | null>(null)
  const [modalAtendimento, setModalAtendimento] = useState<number | null>(null)

  function abrirExame(record: AgendaItem) {
    const tipo = tipoExamePorItem(record.cd_item_agendamento)
    if (!tipo) return
    setModalTipo(tipo)
    setModalPaciente(record.nm_paciente)
    setModalCdPaciente(record.cd_paciente)
    setModalAtendimento(record.cd_atendimento)
    setModalOpen(true)
  }

  const fetchAgenda = async (d: Dayjs) => {
    dataRefCurrent.current = d
    setLoading(true)
    setError(null)
    setCurrentPage(1)
    try {
      const result = await getAgendaDoPacientes(d.format('YYYY-MM-DD'))
      setData(result.items)
      // Busca status de exame para todos os atendimentos da agenda
      const ids = result.items
        .map((i) => i.cd_atendimento)
        .filter((id): id is number => id != null)
      if (ids.length > 0) {
        const status = await buscarStatusAtendimentos(ids)
        setStatusExames(status)
      } else {
        setStatusExames({})
      }
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.detail ?? 'Erro ao buscar agenda do MV.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setData([])
      setStatusExames({})
    } finally {
      setLoading(false)
    }
  }

  const atualizarStatus = async (items: AgendaItem[]) => {
    const ids = items
      .map((i) => i.cd_atendimento)
      .filter((id): id is number => id != null)
    if (ids.length === 0) return
    try {
      const status = await buscarStatusAtendimentos(ids)
      setStatusExames(status)
    } catch {
      // falha silenciosa
    }
  }

  useEffect(() => {
    fetchAgenda(dataRef)
  }, [])

  const commitDataRef = (d: Dayjs) => {
    setDataRef(d)
    fetchAgenda(d)
  }

  // Contadores para as pills de filtro
  const countFinalizados = data.filter((r) => {
    const st = r.cd_atendimento ? statusExames[String(r.cd_atendimento)] : undefined
    return st?.ds_status === 'FINALIZADO'
  }).length

  const countSemExame = data.filter((r) => {
    const st = r.cd_atendimento ? statusExames[String(r.cd_atendimento)] : undefined
    return !st || (st.ds_status !== 'FINALIZADO' && st.ds_status !== 'RASCUNHO')
  }).length

  // Filtragem e ordenação dos dados
  const dadosFiltrados = data.filter((r) => {
    // 1. Busca por nome ou atendimento
    const term = busca.toLowerCase().trim()
    if (term) {
      const matchNome = r.nm_paciente && r.nm_paciente.toLowerCase().includes(term)
      const matchAtend = r.cd_atendimento && String(r.cd_atendimento).includes(term)
      const matchCod = r.cd_paciente && String(r.cd_paciente).includes(term)
      if (!matchNome && !matchAtend && !matchCod) return false
    }

    // 2. Filtro por status do exame
    const st = r.cd_atendimento ? statusExames[String(r.cd_atendimento)] : undefined
    const isFinalizado = st?.ds_status === 'FINALIZADO'
    const isRascunho = st?.ds_status === 'RASCUNHO'

    if (filtroExame === 'finalizado') {
      return isFinalizado
    }
    if (filtroExame === 'sem_exame') {
      return !isFinalizado && !isRascunho
    }

    return true
  })

  // Ordenação
  const dadosOrdenados = [...dadosFiltrados].sort((a, b) => {
    if (sortAtendimento) {
      const atA = a.cd_atendimento ?? 0
      const atB = b.cd_atendimento ?? 0
      return sortAtendimento === 'asc' ? atA - atB : atB - atA
    }
    if (sortHorario) {
      const hrA = a.hr_agenda ?? ''
      const hrB = b.hr_agenda ?? ''
      return sortHorario === 'asc' ? hrA.localeCompare(hrB) : hrB.localeCompare(hrA)
    }
    return 0
  })

  // Paginação inteligente
  const totalItems = dadosOrdenados.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageIndex = Math.min(currentPage, totalPages)
  const startIndex = (pageIndex - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedData = dadosOrdenados.slice(startIndex, endIndex)

  const getPaginationItems = (): PaginationItem[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', page: i + 1 }))
    }

    if (pageIndex <= 4) {
      return [
        { type: 'page', page: 1 },
        { type: 'page', page: 2 },
        { type: 'page', page: 3 },
        { type: 'page', page: 4 },
        { type: 'page', page: 5 },
        { type: 'ellipsis', direction: 'next' },
        { type: 'page', page: totalPages },
      ]
    }

    if (pageIndex >= totalPages - 3) {
      return [
        { type: 'page', page: 1 },
        { type: 'ellipsis', direction: 'prev' },
        { type: 'page', page: totalPages - 4 },
        { type: 'page', page: totalPages - 3 },
        { type: 'page', page: totalPages - 2 },
        { type: 'page', page: totalPages - 1 },
        { type: 'page', page: totalPages },
      ]
    }

    return [
      { type: 'page', page: 1 },
      { type: 'ellipsis', direction: 'prev' },
      { type: 'page', page: pageIndex - 1 },
      { type: 'page', page: pageIndex },
      { type: 'page', page: pageIndex + 1 },
      { type: 'ellipsis', direction: 'next' },
      { type: 'page', page: totalPages },
    ]
  }

  // Estilos
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: '"Atkinson Hyperlegible", Inter, sans-serif',
    color: '#14212b',
  }

  const renderSituacaoBadge = (tp: string | null) => {
    if (!tp) return <span style={{ color: '#6e7c89' }}>—</span>
    const upper = tp.toUpperCase()

    if (upper === 'A' || upper === 'AGUARDANDO') {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '0 12px',
            backgroundColor: '#f3f5f7',
            border: '1px solid #6e7c89',
            borderRadius: 9999,
            fontSize: 15,
            fontWeight: 700,
            color: '#14212b',
          }}
        >
          <ClockCircleOutlined style={{ fontSize: 15, color: '#44525e' }} />
          <span>Aguardando</span>
        </div>
      )
    }

    if (upper === 'E' || upper === 'ATENDIDO') {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '0 12px',
            backgroundColor: '#e4f3e9',
            borderRadius: 9999,
            fontSize: 15,
            fontWeight: 700,
            color: '#14212b',
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 15, color: '#1b6b3a' }} />
          <span>Atendido</span>
        </div>
      )
    }

    if (upper === 'M' || upper === 'MARCADO') {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '0 12px',
            backgroundColor: '#eceffb',
            borderRadius: 9999,
            fontSize: 15,
            fontWeight: 700,
            color: '#5568d3',
          }}
        >
          <CalendarOutlined style={{ fontSize: 15 }} />
          <span>Marcado</span>
        </div>
      )
    }

    if (upper === 'F' || upper === 'FALTA') {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '0 12px',
            backgroundColor: '#fbe9e7',
            borderRadius: 9999,
            fontSize: 15,
            fontWeight: 700,
            color: '#b3261e',
          }}
        >
          <CloseCircleOutlined style={{ fontSize: 15 }} />
          <span>Falta</span>
        </div>
      )
    }

    if (upper === 'C' || upper === 'CANCELADO') {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '0 12px',
            backgroundColor: '#fbe9e7',
            borderRadius: 9999,
            fontSize: 15,
            fontWeight: 700,
            color: '#b3261e',
          }}
        >
          <CloseCircleOutlined style={{ fontSize: 15 }} />
          <span>Cancelado</span>
        </div>
      )
    }

    if (upper === 'R' || upper === 'EM ATENDIMENTO') {
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 32,
            padding: '0 12px',
            backgroundColor: '#f3e8ff',
            borderRadius: 9999,
            fontSize: 15,
            fontWeight: 700,
            color: '#7c3aed',
          }}
        >
          <UserOutlined style={{ fontSize: 15 }} />
          <span>Em Atendimento</span>
        </div>
      )
    }

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 32,
          padding: '0 12px',
          backgroundColor: '#f3f5f7',
          borderRadius: 9999,
          fontSize: 15,
          fontWeight: 700,
          color: '#14212b',
        }}
      >
        <span>{tp}</span>
      </div>
    )
  }

  return (
    <main style={containerStyle}>
      {/* Header com Título e Seletor de Data */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#14212b',
            }}
          >
            Pacientes Agendados — Exames
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 16,
              color: '#44525e',
              lineHeight: 1.5,
            }}
          >
            Pacientes com exames auditivos agendados na data escolhida.
          </p>
        </div>

        {/* Grupo de Data de Referência e Atualizar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Data de referência
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Botão Dia Anterior */}
              <button
                type="button"
                aria-label={`Dia anterior: ${dataRef.subtract(1, 'day').format('DD/MM/YYYY')}`}
                onClick={() => commitDataRef(dataRefCurrent.current.subtract(1, 'day'))}
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  color: '#14212b',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f3f5f7'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                <LeftOutlined style={{ fontSize: 16 }} />
              </button>

              {/* DatePicker Acessível */}
              <DatePicker
                value={dataRef}
                allowClear={false}
                format={DATE_PICKER_FORMATS}
                placeholder="DD/MM/AAAA"
                style={{
                  width: 170,
                  height: 44,
                  borderRadius: 6,
                  border: '1px solid #6e7c89',
                  fontSize: 16,
                  color: '#14212b',
                }}
                onChange={d => {
                  if (d && d.isValid()) {
                    commitDataRef(d)
                  }
                }}
                onBlur={e => {
                  const raw = (e.target as HTMLInputElement)?.value?.trim()
                  if (raw) {
                    const parsed = parseBrDate(raw)
                    if (parsed && parsed.isValid()) {
                      commitDataRef(parsed)
                    }
                  }
                }}
                aria-label="Data de referência no formato dia, mês e ano"
              />

              {/* Botão Próximo Dia */}
              <button
                type="button"
                aria-label={`Próximo dia: ${dataRef.add(1, 'day').format('DD/MM/YYYY')}`}
                onClick={() => commitDataRef(dataRefCurrent.current.add(1, 'day'))}
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  color: '#14212b',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f3f5f7'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                <RightOutlined style={{ fontSize: 16 }} />
              </button>

              {/* Botão Hoje */}
              <button
                type="button"
                aria-label={`Ir para a data de hoje: ${dayjs().format('DD/MM/YYYY')}`}
                onClick={() => commitDataRef(dayjs())}
                style={{
                  minHeight: 44,
                  padding: '0 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  color: '#14212b',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f3f5f7'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Botão Atualizar */}
          <button
            type="button"
            onClick={() => fetchAgenda(dataRef)}
            disabled={loading}
            aria-label="Atualizar pacientes agendados"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 44,
              padding: '0 18px',
              border: '2px solid #5568d3',
              borderRadius: 6,
              backgroundColor: '#ffffff',
              color: '#5568d3',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.backgroundColor = '#eceffb'
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.backgroundColor = '#ffffff'
            }}
          >
            <ReloadOutlined spin={loading} style={{ fontSize: 18 }} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Alerta de erro caso ocorra */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Linha de Busca, Filtros Pills e Contador */}
      <section
        aria-label="Filtros e contagem de pacientes"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Campo de Busca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            maxWidth: 440,
            minHeight: 48,
            padding: '0 14px',
            backgroundColor: '#ffffff',
            border: '1px solid #6e7c89',
            borderRadius: 6,
          }}
        >
          <SearchOutlined style={{ fontSize: 18, color: '#44525e' }} />
          <label
            htmlFor="exames-search-input"
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
          >
            Buscar por nome ou nº do atendimento
          </label>
          <input
            id="exames-search-input"
            type="search"
            placeholder="Buscar por nome ou nº do atendimento"
            value={busca}
            onChange={e => {
              setBusca(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 16,
              color: '#14212b',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Filtros em Pills */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {/* Pill Todos */}
          <button
            type="button"
            onClick={() => {
              setFiltroExame('todos')
              setCurrentPage(1)
            }}
            aria-pressed={filtroExame === 'todos'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              padding: '0 16px',
              backgroundColor: filtroExame === 'todos' ? '#5568d3' : '#ffffff',
              border: filtroExame === 'todos' ? 'none' : '1px solid #6e7c89',
              borderRadius: 9999,
              color: filtroExame === 'todos' ? '#ffffff' : '#14212b',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {filtroExame === 'todos' && <CheckCircleOutlined style={{ fontSize: 16 }} />}
            <span>Todos ({data.length})</span>
          </button>

          {/* Pill Exame finalizado */}
          <button
            type="button"
            onClick={() => {
              setFiltroExame('finalizado')
              setCurrentPage(1)
            }}
            aria-pressed={filtroExame === 'finalizado'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              padding: '0 16px',
              backgroundColor: filtroExame === 'finalizado' ? '#5568d3' : '#ffffff',
              border: filtroExame === 'finalizado' ? 'none' : '1px solid #6e7c89',
              borderRadius: 9999,
              color: filtroExame === 'finalizado' ? '#ffffff' : '#14212b',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {filtroExame === 'finalizado' && <CheckCircleOutlined style={{ fontSize: 16 }} />}
            <span>Exame finalizado ({countFinalizados})</span>
          </button>

          {/* Pill Sem exame registrado */}
          <button
            type="button"
            onClick={() => {
              setFiltroExame('sem_exame')
              setCurrentPage(1)
            }}
            aria-pressed={filtroExame === 'sem_exame'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              padding: '0 16px',
              backgroundColor: filtroExame === 'sem_exame' ? '#5568d3' : '#ffffff',
              border: filtroExame === 'sem_exame' ? 'none' : '1px solid #6e7c89',
              borderRadius: 9999,
              color: filtroExame === 'sem_exame' ? '#ffffff' : '#14212b',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {filtroExame === 'sem_exame' && <CheckCircleOutlined style={{ fontSize: 16 }} />}
            <span>Sem exame registrado ({countSemExame})</span>
          </button>
        </div>

        {/* Contador */}
        <div role="status" aria-live="polite" style={{ fontSize: 16, color: '#44525e' }}>
          <span>
            {dadosFiltrados.length} paciente{dadosFiltrados.length !== 1 ? 's' : ''} em{' '}
            {dataRef.format('DD/MM/YYYY')}
          </span>
        </div>
      </section>

      {/* Tabela de Pacientes Agendados */}
      <section
        aria-label="Tabela de pacientes com exames auditivos agendados"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d5dce3',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: 1080 }}>
            {/* Header da Tabela */}
            <div
              style={{
                display: 'grid',
                minHeight: 56,
                alignItems: 'center',
                gridTemplateColumns: '120px 100px minmax(220px, 1.4fr) 220px 160px 300px',
                gap: 16,
                padding: '0 24px',
                backgroundColor: '#eceffb',
                borderBottom: '2px solid #d5dce3',
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
              }}
            >
              {/* Atendimento com Ordenação */}
              <button
                type="button"
                onClick={() => {
                  setSortHorario(null)
                  setSortAtendimento(prev => (prev === 'asc' ? 'desc' : 'asc'))
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#14212b',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>Atendimento</span>
                <span style={{ fontSize: 14, color: sortAtendimento ? '#5568d3' : '#6e7c89' }}>
                  {sortAtendimento === 'asc' ? '↑' : sortAtendimento === 'desc' ? '↓' : '↕'}
                </span>
              </button>

              {/* Horário com Ordenação */}
              <button
                type="button"
                onClick={() => {
                  setSortAtendimento(null)
                  setSortHorario(prev => (prev === 'asc' ? 'desc' : 'asc'))
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#14212b',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>Horário</span>
                <span style={{ fontSize: 14, color: sortHorario ? '#5568d3' : '#6e7c89' }}>
                  {sortHorario === 'asc' ? '↑' : sortHorario === 'desc' ? '↓' : '↕'}
                </span>
              </button>

              <span>Paciente</span>
              <span>Procedimento</span>
              <span>Situação</span>
              <span>Exame</span>
            </div>

            {/* Conteúdo / Linhas da Tabela */}
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 24px',
                  gap: 16,
                }}
              >
                <Spin size="large" />
                <span style={{ fontSize: 16, color: '#44525e' }}>Carregando agenda de exames...</span>
              </div>
            ) : paginatedData.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                  color: '#44525e',
                  fontSize: 16,
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#14212b' }}>
                  Nenhum paciente agendado encontrado
                </p>
                <p style={{ margin: '8px 0 0 0' }}>
                  {busca || filtroExame !== 'todos'
                    ? 'Tente ajustar os filtros ou os termos da busca.'
                    : `Não há pacientes agendados para ${dataRef.format('DD/MM/YYYY')}.`}
                </p>
              </div>
            ) : (
              paginatedData.map(record => {
                const tipo = tipoExamePorItem(record.cd_item_agendamento)
                const isAudio = tipo === 'audiometria'
                const exameStatus = record.cd_atendimento
                  ? statusExames[String(record.cd_atendimento)]
                  : undefined
                const isFinalizado = exameStatus?.ds_status === 'FINALIZADO'
                const isRascunho = exameStatus?.ds_status === 'RASCUNHO'

                return (
                  <div
                    key={`${record.cd_item_agendamento ?? ''}-${record.cd_paciente ?? ''}-${record.hr_agenda ?? ''}`}
                    style={{
                      display: 'grid',
                      minHeight: 80,
                      alignItems: 'center',
                      gridTemplateColumns: '120px 100px minmax(220px, 1.4fr) 220px 160px 300px',
                      gap: 16,
                      padding: '14px 24px',
                      borderBottom: '1px solid #d5dce3',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#fbfcfe'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                  >
                    {/* Atendimento */}
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
                      {record.cd_atendimento ?? '—'}
                    </span>

                    {/* Horário */}
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
                      {record.hr_agenda ?? '—'}
                    </span>

                    {/* Paciente */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: '#14212b' }}>
                          {record.nm_paciente ?? '—'}
                        </span>
                        {record.nr_fone && (
                          <Tooltip title={`Telefone: ${record.nr_fone}`}>
                            <PhoneOutlined style={{ color: '#6e7c89', fontSize: 13, cursor: 'pointer' }} />
                          </Tooltip>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        {record.cd_paciente && (
                          <span style={{ fontSize: 14, color: '#44525e' }}>
                            Cód. {record.cd_paciente}
                          </span>
                        )}
                        {record.sn_encaixe === 'S' && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#d46b08',
                              backgroundColor: '#fffbe6',
                              border: '1px solid #ffe58f',
                              borderRadius: 4,
                              padding: '1px 6px',
                            }}
                          >
                            Encaixe
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Procedimento */}
                    <span
                      title={record.ds_item_agendamento ?? undefined}
                      style={{
                        fontSize: 16,
                        color: '#14212b',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {record.ds_item_agendamento ?? '—'}
                    </span>

                    {/* Situação da Agenda */}
                    <div>{renderSituacaoBadge(record.tp_situacao)}</div>

                    {/* Ações / Status do Exame */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isFinalizado ? (
                        <>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              minHeight: 32,
                              padding: '0 10px',
                              backgroundColor: '#e4f3e9',
                              borderRadius: 9999,
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#1b6b3a',
                            }}
                          >
                            <CheckCircleOutlined style={{ fontSize: 15 }} />
                            <span>Finalizado</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => abrirExame(record)}
                            aria-label={`Abrir exame de ${record.nm_paciente}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              minHeight: 44,
                              padding: '0 14px',
                              border: '2px solid #5568d3',
                              borderRadius: 6,
                              backgroundColor: '#ffffff',
                              color: '#5568d3',
                              fontSize: 16,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#eceffb'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#ffffff'
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: 16 }} />
                            <span>Abrir exame</span>
                          </button>
                        </>
                      ) : isRascunho ? (
                        <>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              minHeight: 32,
                              padding: '0 10px',
                              backgroundColor: '#eceffb',
                              borderRadius: 9999,
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#5568d3',
                            }}
                          >
                            <EditOutlined style={{ fontSize: 15 }} />
                            <span>Rascunho</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => abrirExame(record)}
                            aria-label={`Continuar exame de ${record.nm_paciente}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              minHeight: 44,
                              padding: '0 14px',
                              border: '2px solid #5568d3',
                              borderRadius: 6,
                              backgroundColor: '#ffffff',
                              color: '#5568d3',
                              fontSize: 16,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#eceffb'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#ffffff'
                            }}
                          >
                            <EditOutlined style={{ fontSize: 16 }} />
                            <span>Continuar</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Sem exame registrado */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              minHeight: 32,
                              padding: '0 10px',
                              backgroundColor: '#f3f5f7',
                              border: '1px dashed #6e7c89',
                              borderRadius: 9999,
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#44525e',
                            }}
                          >
                            <MinusCircleOutlined style={{ fontSize: 14 }} />
                            <span>Sem exame</span>
                          </div>

                          {tipo && record.cd_atendimento ? (
                            <button
                              type="button"
                              onClick={() => abrirExame(record)}
                              aria-label={`Realizar exame de ${record.nm_paciente}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                minHeight: 44,
                                padding: '0 14px',
                                border: '2px solid #5568d3',
                                borderRadius: 6,
                                backgroundColor: '#5568d3',
                                color: '#ffffff',
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.opacity = '0.9'
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.opacity = '1'
                              }}
                            >
                              <ExperimentOutlined style={{ fontSize: 16 }} />
                              <span>{isAudio ? 'Audiometria' : 'Imitanciometria'}</span>
                            </button>
                          ) : !record.cd_atendimento ? (
                            <Tooltip title="Aguardando recepção (sem código de atendimento)">
                              <span style={{ fontSize: 13, color: '#6e7c89', fontStyle: 'italic' }}>
                                Sem atendimento
                              </span>
                            </Tooltip>
                          ) : (
                            <span style={{ fontSize: 14, color: '#6e7c89' }}>—</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Rodapé com Paginação Inteligente */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            minHeight: 64,
            padding: '14px 24px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #d5dce3',
          }}
        >
          {/* Informações e Seletor de Quantidade por Página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, color: '#44525e', fontWeight: 600 }}>
              {totalItems === 0
                ? 'Nenhum paciente agendado'
                : `Mostrando ${startIndex + 1} a ${endIndex} de ${totalItems} pacientes`}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#44525e' }}>
              <label htmlFor="pacientes-page-size-select">Exibir:</label>
              <select
                id="pacientes-page-size-select"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{
                  height: 38,
                  padding: '0 10px',
                  borderRadius: 6,
                  border: '1px solid #d5dce3',
                  backgroundColor: '#ffffff',
                  color: '#14212b',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
          </div>

          {/* Navegação entre Páginas */}
          <nav
            aria-label="Navegação da paginação"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {/* Primeira Página */}
            {totalPages > 5 && (
              <button
                type="button"
                disabled={pageIndex <= 1}
                onClick={() => setCurrentPage(1)}
                title="Primeira página"
                aria-label="Ir para a primeira página"
                style={{
                  minHeight: 38,
                  padding: '0 10px',
                  border: '1px solid #d5dce3',
                  borderRadius: 6,
                  backgroundColor: '#ffffff',
                  color: pageIndex <= 1 ? '#8c9ba5' : '#44525e',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: pageIndex <= 1 ? 'not-allowed' : 'pointer',
                  opacity: pageIndex <= 1 ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (pageIndex > 1) {
                    e.currentTarget.style.backgroundColor = '#f3f5f7'
                    e.currentTarget.style.borderColor = '#6e7c89'
                  }
                }}
                onMouseLeave={e => {
                  if (pageIndex > 1) {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#d5dce3'
                  }
                }}
              >
                « Primeira
              </button>
            )}

            {/* Anterior */}
            <button
              type="button"
              disabled={pageIndex <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              aria-label="Página anterior"
              style={{
                minHeight: 38,
                padding: '0 14px',
                border: '1px solid #d5dce3',
                borderRadius: 6,
                backgroundColor: '#ffffff',
                color: pageIndex <= 1 ? '#8c9ba5' : '#14212b',
                fontSize: 15,
                fontWeight: 700,
                cursor: pageIndex <= 1 ? 'not-allowed' : 'pointer',
                opacity: pageIndex <= 1 ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (pageIndex > 1) {
                  e.currentTarget.style.backgroundColor = '#f3f5f7'
                  e.currentTarget.style.borderColor = '#6e7c89'
                }
              }}
              onMouseLeave={e => {
                if (pageIndex > 1) {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = '#d5dce3'
                }
              }}
            >
              Anterior
            </button>

            {/* Itens de Página */}
            {getPaginationItems().map((item, idx) => {
              if (item.type === 'ellipsis') {
                const isPrev = item.direction === 'prev'
                return (
                  <button
                    key={`ellipsis-${item.direction}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (isPrev) {
                        setCurrentPage(p => Math.max(1, p - 5))
                      } else {
                        setCurrentPage(p => Math.min(totalPages, p + 5))
                      }
                    }}
                    title={isPrev ? 'Voltar 5 páginas' : 'Avançar 5 páginas'}
                    aria-label={isPrev ? 'Voltar 5 páginas' : 'Avançar 5 páginas'}
                    style={{
                      minWidth: 38,
                      height: 38,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 6,
                      backgroundColor: '#ffffff',
                      color: '#6e7c89',
                      border: '1px solid #d5dce3',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      letterSpacing: 2,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#eceffb'
                      e.currentTarget.style.color = '#5568d3'
                      e.currentTarget.style.borderColor = '#5568d3'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                      e.currentTarget.style.color = '#6e7c89'
                      e.currentTarget.style.borderColor = '#d5dce3'
                    }}
                  >
                    •••
                  </button>
                )
              }

              const isCurrent = item.page === pageIndex
              return (
                <button
                  key={`page-${item.page}`}
                  type="button"
                  onClick={() => setCurrentPage(item.page)}
                  aria-label={`Ir para a página ${item.page}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  style={{
                    minWidth: 38,
                    height: 38,
                    padding: '0 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    backgroundColor: isCurrent ? '#5568d3' : '#ffffff',
                    color: isCurrent ? '#ffffff' : '#14212b',
                    border: isCurrent ? '2px solid #5568d3' : '1px solid #d5dce3',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = '#f3f5f7'
                      e.currentTarget.style.borderColor = '#6e7c89'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                      e.currentTarget.style.borderColor = '#d5dce3'
                    }
                  }}
                >
                  {item.page}
                </button>
              )
            })}

            {/* Próxima */}
            <button
              type="button"
              disabled={pageIndex >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              aria-label="Próxima página"
              style={{
                minHeight: 38,
                padding: '0 14px',
                border: '1px solid #d5dce3',
                borderRadius: 6,
                backgroundColor: '#ffffff',
                color: pageIndex >= totalPages ? '#8c9ba5' : '#14212b',
                fontSize: 15,
                fontWeight: 700,
                cursor: pageIndex >= totalPages ? 'not-allowed' : 'pointer',
                opacity: pageIndex >= totalPages ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (pageIndex < totalPages) {
                  e.currentTarget.style.backgroundColor = '#f3f5f7'
                  e.currentTarget.style.borderColor = '#6e7c89'
                }
              }}
              onMouseLeave={e => {
                if (pageIndex < totalPages) {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = '#d5dce3'
                }
              }}
            >
              Próxima
            </button>

            {/* Última Página */}
            {totalPages > 5 && (
              <button
                type="button"
                disabled={pageIndex >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Última página"
                aria-label="Ir para a última página"
                style={{
                  minHeight: 38,
                  padding: '0 10px',
                  border: '1px solid #d5dce3',
                  borderRadius: 6,
                  backgroundColor: '#ffffff',
                  color: pageIndex >= totalPages ? '#8c9ba5' : '#44525e',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: pageIndex >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: pageIndex >= totalPages ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (pageIndex < totalPages) {
                    e.currentTarget.style.backgroundColor = '#f3f5f7'
                    e.currentTarget.style.borderColor = '#6e7c89'
                  }
                }}
                onMouseLeave={e => {
                  if (pageIndex < totalPages) {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#d5dce3'
                  }
                }}
              >
                Última »
              </button>
            )}

            {/* Quick Jumper */}
            {totalPages > 5 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginLeft: 10,
                  fontSize: 14,
                  color: '#44525e',
                }}
              >
                <span>Ir para:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpInput}
                  onChange={e => setJumpInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const page = Number(jumpInput)
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page)
                        setJumpInput('')
                      }
                    }
                  }}
                  placeholder={String(pageIndex)}
                  aria-label="Ir para número de página"
                  style={{
                    width: 54,
                    height: 38,
                    textAlign: 'center',
                    borderRadius: 6,
                    border: '1px solid #d5dce3',
                    backgroundColor: '#ffffff',
                    color: '#14212b',
                    fontWeight: 600,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const page = Number(jumpInput)
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page)
                      setJumpInput('')
                    }
                  }}
                  aria-label="Navegar para a página digitada"
                  style={{
                    height: 38,
                    padding: '0 12px',
                    borderRadius: 6,
                    border: '1px solid #5568d3',
                    backgroundColor: '#eceffb',
                    color: '#5568d3',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#5568d3'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#eceffb'
                    e.currentTarget.style.color = '#5568d3'
                  }}
                >
                  Ir
                </button>
              </div>
            )}
          </nav>
        </footer>
      </section>

      {/* Modal de Exame (Audiometria / Imitanciometria) */}
      <ExameModal
        open={modalOpen}
        tipo={modalTipo}
        nmPaciente={modalPaciente}
        cdPaciente={modalCdPaciente}
        cdAtendimento={modalAtendimento}
        onClose={() => {
          setModalOpen(false)
          atualizarStatus(data)
        }}
      />
    </main>
  )
}
