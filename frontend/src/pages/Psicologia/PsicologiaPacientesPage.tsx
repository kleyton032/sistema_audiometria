import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  App,
  Spin,
  Alert,
  DatePicker,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { getAgendaDoPacientes, type AgendaItem } from '@/api/agendaService'
import {
  listarPsiProtocolos,
  getPsiAvaliacoesStatusBatch,
  criarPsiAvaliacao,
  type PsiStatusBatchItem,
} from '@/api/psicologiaService'
import type { PsiProtocolo } from '@/types/psicologia'

type FiltroSituacao = 'todos' | 'aguardando' | 'atendido' | 'nao_recepcionado'
type OrdenacaoCampo = 'cd_atendimento' | 'hr_agenda'

const GRID = '110px 90px 1fr 200px 170px minmax(320px, 480px)'
const PAGE_SIZE = 6

function PillSituacao({ record }: { record: AgendaItem }) {
  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    padding: '0 12px',
    borderRadius: 9999,
    fontSize: 15,
    fontWeight: 700,
    color: '#14212b',
    width: 'fit-content',
  }

  if (!record.cd_atendimento) {
    return (
      <div style={{ ...base, background: '#f3f5f7', border: '1px dashed #6e7c89' }}>
        <span>Não recepcionado</span>
      </div>
    )
  }

  const tp = (record.tp_situacao ?? '').toUpperCase()
  const map: Record<string, { label: string; bg: string; border?: string; icon?: ReactNode }> = {
    E: { label: 'Atendido', bg: '#e4f3e9', icon: <CheckCircleOutlined style={{ color: '#1b6b3a' }} /> },
    A: { label: 'Aguardando', bg: '#f3f5f7', border: '1px solid #6e7c89', icon: <ClockCircleOutlined /> },
    M: { label: 'Marcado', bg: '#eaf2fb', border: '1px solid #6e7c89', icon: <ClockCircleOutlined style={{ color: '#5568d3' }} /> },
    L: { label: 'Livre', bg: '#f3f5f7', border: '1px solid #6e7c89' },
    F: { label: 'Falta', bg: '#fbe9e7', icon: <CloseCircleOutlined style={{ color: '#b3261e' }} /> },
    C: { label: 'Cancelado', bg: '#fbe9e7', icon: <CloseCircleOutlined style={{ color: '#b3261e' }} /> },
    R: { label: 'Em Atendimento', bg: '#eaf2fb', icon: <ClockCircleOutlined style={{ color: '#764ba2' }} /> },
  }
  const info = map[tp] ?? { label: tp || '—', bg: '#f3f5f7', border: '1px solid #6e7c89' }

  return (
    <div style={{ ...base, background: info.bg, border: info.border }}>
      {info.icon}
      <span>{info.label}</span>
    </div>
  )
}

export default function PsicologiaPacientesPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [dataRef, setDataRef] = useState<Dayjs>(() => dayjs())
  const [data, setData] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [psiStatus, setPsiStatus] = useState<Record<string, PsiStatusBatchItem>>({})
  const [protocolos, setProtocolos] = useState<PsiProtocolo[]>([])
  const [criandoCodigo, setCriandoCodigo] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroSituacao>('todos')
  const [pagina, setPagina] = useState(0)
  const [ordenacao, setOrdenacao] = useState<{ campo: OrdenacaoCampo; dir: 1 | -1 } | null>(null)

  const fetchAgenda = async (d: Dayjs) => {
    setLoading(true)
    setError(null)
    setPagina(0)
    try {
      const result = await getAgendaDoPacientes(d.format('YYYY-MM-DD'))
      setData(result.items)

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

  const dadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return data.filter((item) => {
      const atendeBusca =
        !termo ||
        (item.nm_paciente ?? '').toLowerCase().includes(termo) ||
        String(item.cd_atendimento ?? '').includes(termo)

      if (!atendeBusca) return false
      if (filtro === 'aguardando') return (item.tp_situacao ?? '').toUpperCase() === 'A'
      if (filtro === 'atendido') return (item.tp_situacao ?? '').toUpperCase() === 'E'
      if (filtro === 'nao_recepcionado') return !item.cd_atendimento
      return true
    })
  }, [data, busca, filtro])

  const contadores = useMemo(() => {
    const aguardando = data.filter((i) => (i.tp_situacao ?? '').toUpperCase() === 'A').length
    const atendido = data.filter((i) => (i.tp_situacao ?? '').toUpperCase() === 'E').length
    const naoRecepcionado = data.filter((i) => !i.cd_atendimento).length
    return { total: data.length, aguardando, atendido, naoRecepcionado }
  }, [data])

  const filtros: { key: FiltroSituacao; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: contadores.total },
    { key: 'aguardando', label: 'Aguardando', count: contadores.aguardando },
    { key: 'atendido', label: 'Atendido', count: contadores.atendido },
    { key: 'nao_recepcionado', label: 'Não recepcionado', count: contadores.naoRecepcionado },
  ]

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
      style={{ fontSize: 16, color: '#5568d3' }}
    />
  )

  const botaoAvaliacao = (record: AgendaItem, protocolo: PsiProtocolo) => {
    const semAtendimento = !record.cd_atendimento
    const nomePaciente = record.nm_paciente ?? 'paciente'
    const status = record.cd_paciente != null ? psiStatus[String(record.cd_paciente)] : null
    const aval = status?.avaliacoes?.[protocolo.ds_codigo]
    const carregando = criandoCodigo === protocolo.ds_codigo
    const temRespostas = aval?.tem_respostas === true

    const rotulo =
      !aval || (aval.ds_situacao === 'RASCUNHO' && !temRespostas)
        ? 'Iniciar'
        : aval.ds_situacao === 'RASCUNHO'
          ? 'Continuar'
          : 'Ver'

    const ehIniciar = rotulo === 'Iniciar'
    const icone = ehIniciar ? <PlusOutlined /> : rotulo === 'Continuar' ? <EditOutlined /> : <EyeOutlined />

    return (
      <div key={protocolo.ds_codigo}>
        <Tooltip
          title={
            semAtendimento
              ? 'Aguardando recepção (sem código de atendimento)'
              : `${rotulo} ${protocolo.ds_codigo} de ${nomePaciente}`
          }
        >
          <button
            type="button"
            disabled={semAtendimento || carregando}
            onClick={() => abrirAvaliacao(record, protocolo)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 700,
              cursor: semAtendimento ? 'not-allowed' : 'pointer',
              background: semAtendimento ? '#f3f5f7' : ehIniciar ? '#5568d3' : '#ffffff',
              color: semAtendimento ? '#44525e' : ehIniciar ? '#ffffff' : '#14212b',
              border: semAtendimento ? '1px dashed #6e7c89' : ehIniciar ? 'none' : '1px solid #6e7c89',
              opacity: carregando ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ display: 'flex', fontSize: 18 }}>{icone}</span>
            <span>{carregando ? 'Abrindo…' : `${rotulo} ${protocolo.ds_codigo}`}</span>
          </button>
        </Tooltip>
      </div>
    )
  }

  const renderAvaliacoes = (record: AgendaItem) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {protocolos.map((p) => botaoAvaliacao(record, p))}
      </div>
      {!record.cd_atendimento && (
        <span style={{ fontSize: 14, color: '#44525e' }}>
          Disponível após a recepção do paciente
        </span>
      )}
    </div>
  )

  const celulaHeader: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: '#14212b',
  }

  const celulaLinha: CSSProperties = {
    display: 'grid',
    minHeight: 84,
    alignItems: 'center',
    gridTemplateColumns: GRID,
    gap: 16,
    padding: '14px 24px',
    borderBottom: '1px solid #d5dce3',
  }

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Cabeçalho: título + data de referência */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#14212b', lineHeight: 1.2 }}>
            Psicologia — Atendimentos
          </span>
          <span style={{ fontSize: 16, color: '#44525e' }}>
            Pacientes agendados ou recepcionados para os protocolos PAFE, PASAC e PAHB.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Data de referência</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              aria-label="Dia anterior"
              onClick={() => {
                const d = dataRef.subtract(1, 'day')
                setDataRef(d)
                fetchAgenda(d)
              }}
              style={{
                width: 44,
                height: 44,
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
              size="large"
              style={{ width: 180, borderRadius: 6 }}
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
                width: 44,
                height: 44,
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
                minHeight: 44,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
                cursor: 'pointer',
              }}
            >
              Hoje
            </button>
          </div>
        </div>
      </div>

      {/* Busca + filtros + contagem */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: 460,
            minHeight: 48,
            padding: '0 14px',
            background: '#fff',
            border: '1px solid #6e7c89',
            borderRadius: 6,
          }}
        >
          <SearchOutlined style={{ fontSize: 20, color: '#44525e' }} />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(0)
            }}
            placeholder="Buscar por nome ou nº do atendimento"
            aria-label="Buscar por nome ou nº do atendimento"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: '#14212b',
              background: 'transparent',
            }}
          />
        </div>

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
                  gap: 8,
                  minHeight: 44,
                  padding: '0 16px',
                  borderRadius: 9999,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: ativo ? '#5568d3' : '#fff',
                  color: ativo ? '#fff' : '#14212b',
                  border: ativo ? 'none' : '1px solid #6e7c89',
                }}
              >
                {ativo && <CheckCircleOutlined />}
                <span>{f.label}</span>
                <span>({f.count})</span>
              </button>
            )
          })}
        </div>

        <span style={{ fontSize: 16, color: '#44525e' }}>
          {dadosProcessados.length} pacientes em {dataRef.format('DD/MM/YYYY')}
        </span>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Não foi possível carregar a agenda"
          description={error}
        />
      )}

      {/* Tabela */}
      <Spin spinning={loading}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            border: '1px solid #d5dce3',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* Cabeçalho da tabela */}
          <div
            style={{
              display: 'grid',
              minHeight: 56,
              alignItems: 'center',
              gridTemplateColumns: GRID,
              gap: 16,
              padding: '0 24px',
              background: '#eceffb',
              borderBottom: '2px solid #d5dce3',
            }}
          >
            <button
              type="button"
              onClick={() => alternarOrdenacao('cd_atendimento')}
              style={{ ...celulaHeader, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span>Atendimento</span>
              {setaOrdenacao('cd_atendimento')}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao('hr_agenda')}
              style={{ ...celulaHeader, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span>Horário</span>
              {setaOrdenacao('hr_agenda')}
            </button>
            <span style={celulaHeader}>Paciente</span>
            <span style={celulaHeader}>Procedimento</span>
            <span style={celulaHeader}>Situação</span>
            <span style={celulaHeader}>Avaliações</span>
          </div>

          {/* Linhas */}
          {paginaItens.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#44525e' }}>
              Nenhum paciente agendado para {dataRef.format('DD/MM/YYYY')}.
            </div>
          ) : (
            paginaItens.map((r) => (
              <div
                key={`${r.cd_atendimento ?? 'atend'}_${r.cd_agenda_central ?? 'ag'}_${r.cd_paciente ?? 'pac'}_${r.hr_agenda ?? ''}`}
                style={celulaLinha}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
                  {r.cd_atendimento ?? 'Sem nº'}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>{r.hr_agenda ?? '—'}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#14212b' }}>{r.nm_paciente ?? '—'}</span>
                  <span style={{ fontSize: 14, color: '#44525e' }}>Cód. {r.cd_paciente ?? '—'}</span>
                </div>
                <span style={{ fontSize: 16, color: '#14212b' }}>{r.ds_item_agendamento ?? '—'}</span>
                <PillSituacao record={r} />
                {renderAvaliacoes(r)}
              </div>
            ))
          )}

          {/* Rodapé */}
          <div
            style={{
              display: 'flex',
              minHeight: 64,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 24px',
            }}
          >
            <span style={{ fontSize: 16, color: '#44525e' }}>
              Mostrando {inicioIntervalo} a {fimIntervalo} de {dadosProcessados.length} pacientes
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                disabled={paginaSegura === 0}
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                style={{
                  minHeight: 44,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#14212b',
                  cursor: paginaSegura === 0 ? 'not-allowed' : 'pointer',
                  opacity: paginaSegura === 0 ? 0.5 : 1,
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
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: i === paginaSegura ? '#5568d3' : '#fff',
                    color: i === paginaSegura ? '#fff' : '#14212b',
                    border: i === paginaSegura ? 'none' : '1px solid #6e7c89',
                    borderRadius: 6,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
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
                  minHeight: 44,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid #6e7c89',
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#14212b',
                  cursor: paginaSegura >= totalPaginas - 1 ? 'not-allowed' : 'pointer',
                  opacity: paginaSegura >= totalPaginas - 1 ? 0.5 : 1,
                }}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </Spin>

      {/* Banner informativo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: '#eceffb', borderRadius: 6 }}>
        <InfoCircleOutlined style={{ fontSize: 22, color: '#5568d3', flexShrink: 0 }} />
        <span style={{ fontSize: 16, color: '#14212b' }}>
          As avaliações só ficam disponíveis depois que o paciente é recepcionado.
        </span>
      </div>
    </div>
  )
}
