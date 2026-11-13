import React, { useState, useMemo } from 'react'
import { Input, DatePicker, Select, Spin, App, Empty } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import {
  getPTSHistoricoPaciente,
  type PtsHistoricoSummaryOut,
  type PtsHistoricoItemOut,
  type PtsHistoricoObjetivoOut,
} from '../../api/ptsService'
import { DATE_PICKER_FORMATS } from '@/utils/dateUtils'

dayjs.extend(isBetween)

const { RangePicker } = DatePicker

// ── Ícones SVG Customizados (Wonder Mockup) ──────────────────────────────
const IconSearch = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const IconClose = ({ size = 18 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const IconDownload = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
)

const IconPrinter = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </svg>
)

const IconCalendar = ({ size = 18 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
)

const IconUser = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconUsersGroup = ({ size = 22 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconTarget = ({ size = 24 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const IconTrendingUp = ({ size = 24 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
)

const IconClock = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconLayers = ({ size = 24 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
  </svg>
)

const IconHistory = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
)

const IconSparkles = ({ size = 20 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
)

const IconFileText = ({ size = 22 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
)

const IconCheckCircle = ({ size = 16 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const IconCircleDot = ({ size = 16 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="1" />
  </svg>
)

const IconDashedCircle = ({ size = 16 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />
    <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />
    <path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" />
    <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />
    <path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" />
    <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />
    <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />
    <path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" />
  </svg>
)

const IconPen = ({ size = 16 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </svg>
)

const IconChevronRight = ({ size = 18 }: { size?: number }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

// ── Categorização de Status e Pills Visuais ──────────────────────────────
type StatusCategory = 'alcancado' | 'parcial' | 'pendente' | 'nao_se_aplica'

function getStatusCategory(status: string | null): StatusCategory {
  if (!status) return 'nao_se_aplica'
  const s = status.toLowerCase()
  if (s.includes('conclu') || s.includes('alcan')) return 'alcancado'
  if (s.includes('parcial') || s.includes('mantid') || s.includes('acompanha') || s.includes('reformul')) return 'parcial'
  if (s.includes('pend') || s.includes('não alcan') || s.includes('nao alcan') || s.includes('cancel')) return 'pendente'
  return 'nao_se_aplica'
}

function renderStatusPill(status: string | null) {
  const cat = getStatusCategory(status)
  const label = status?.trim() || (cat === 'alcancado' ? 'Alcançado' : cat === 'parcial' ? 'Parcial' : cat === 'pendente' ? 'Pendente' : 'Não se aplica')

  if (cat === 'alcancado') {
    return (
      <div style={{ display: 'flex', minHeight: 32, alignItems: 'center', gap: 6, padding: '0 12px', backgroundColor: '#e4f3e9', borderRadius: 9999, fontSize: 15, fontWeight: 700, color: '#1b6b3a', whiteSpace: 'nowrap' }}>
        <IconCheckCircle size={16} />
        <span>{label}</span>
      </div>
    )
  }
  if (cat === 'parcial') {
    return (
      <div style={{ display: 'flex', minHeight: 32, alignItems: 'center', gap: 6, padding: '0 12px', backgroundColor: '#eceffb', borderRadius: 9999, fontSize: 15, fontWeight: 700, color: '#5568d3', whiteSpace: 'nowrap' }}>
        <IconCircleDot size={16} />
        <span>{label}</span>
      </div>
    )
  }
  if (cat === 'pendente') {
    return (
      <div style={{ display: 'flex', minHeight: 32, alignItems: 'center', gap: 6, padding: '0 12px', backgroundColor: '#fbe9e7', borderRadius: 9999, fontSize: 15, fontWeight: 700, color: '#b3261e', whiteSpace: 'nowrap' }}>
        <IconClock size={16} />
        <span>{label}</span>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', minHeight: 32, alignItems: 'center', gap: 6, padding: '0 12px', backgroundColor: '#f3f5f7', border: '1px dashed #6e7c89', borderRadius: 9999, fontSize: 15, fontWeight: 700, color: '#14212b', whiteSpace: 'nowrap' }}>
      <IconDashedCircle size={16} />
      <span>{label}</span>
    </div>
  )
}

export default function PtsHistoricoPage() {
  const { notification } = App.useApp()
  const [cdPacienteBusca, setCdPacienteBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PtsHistoricoSummaryOut | null>(null)

  // Aba Ativa
  const [activeTab, setActiveTab] = useState<'timeline' | 'evolucao' | 'terapeuta'>('timeline')

  // Filtros
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [selectedProf, setSelectedProf] = useState<string | null>(null)
  const [selectedEsp, setSelectedEsp] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const handleSearch = async (value: string) => {
    const cleanValue = value.trim()
    if (!cleanValue) {
      notification.warning({
        message: 'Campo vazio',
        description: 'Por favor, digite o código do paciente ou prontuário.',
      })
      return
    }
    setLoading(true)
    setData(null)
    setDateRange(null)
    setSelectedProf(null)
    setSelectedEsp(null)
    setSelectedStatus(null)
    setSearchText('')

    try {
      const result = await getPTSHistoricoPaciente(cleanValue)
      setData(result)
      if (!result.historico || result.historico.length === 0) {
        notification.info({
          message: 'Sem registros',
          description: 'Nenhum Projeto Terapêutico Singular foi encontrado para este paciente.',
        })
      }
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error)
      notification.error({
        message: 'Erro na consulta',
        description: 'Não foi possível consultar o histórico neste momento. Tente novamente mais tarde.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Opções para Filtros
  const profOptions = useMemo(() => {
    if (!data?.historico) return []
    const profs = new Set(data.historico.map(h => h.nm_usuario).filter(Boolean))
    return Array.from(profs).sort().map(p => ({ label: p, value: p }))
  }, [data])

  const espOptions = useMemo(() => {
    if (!data?.historico) return []
    const esps = new Set<string>()
    data.historico.forEach(h => h.objetivos.forEach(o => {
      if (o.ds_especialidade) esps.add(o.ds_especialidade)
    }))
    return Array.from(esps).sort().map(e => ({ label: e, value: e }))
  }, [data])

  const statusOptions = useMemo(() => {
    if (!data?.historico) return []
    const st = new Set<string>()
    data.historico.forEach(h => h.objetivos.forEach(o => {
      if (o.ds_status) st.add(o.ds_status)
    }))
    return Array.from(st).sort().map(s => ({ label: s, value: s }))
  }, [data])

  const handleClearFilters = () => {
    setDateRange(null)
    setSelectedProf(null)
    setSelectedEsp(null)
    setSelectedStatus(null)
    setSearchText('')
  }

  // Aplicação dos Filtros
  const filteredHistorico = useMemo(() => {
    if (!data?.historico) return []
    return data.historico.map(pts => {
      // Filtro de data do PTS
      if (dateRange && dateRange[0] && dateRange[1]) {
        const ptsDate = dayjs(pts.dt_criacao, 'DD/MM/YYYY')
        if (!ptsDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) return null
      }
      // Filtro de profissional
      if (selectedProf && pts.nm_usuario !== selectedProf) return null

      // Filtra objetivos dentro do PTS
      const filteredObjs = pts.objetivos.filter(obj => {
        if (selectedEsp && obj.ds_especialidade !== selectedEsp) return false
        if (selectedStatus && obj.ds_status !== selectedStatus) return false
        if (searchText) {
          const term = searchText.toLowerCase()
          const match = obj.ds_objetivo?.toLowerCase().includes(term) || obj.ds_motivo?.toLowerCase().includes(term)
          if (!match) return false
        }
        return true
      })

      const aplicouFiltroObj = !!selectedEsp || !!selectedStatus || searchText !== ''
      if (aplicouFiltroObj && filteredObjs.length === 0) return null

      return { ...pts, objetivos: filteredObjs }
    }).filter(Boolean) as PtsHistoricoItemOut[]
  }, [data, dateRange, selectedProf, selectedEsp, selectedStatus, searchText])

  // Métricas e Resumos
  const metrics = useMemo(() => {
    let totalObjs = 0
    let successObjs = 0
    let pendingObjs = 0
    const profs = new Set<string>()
    const esps = new Set<string>()

    filteredHistorico.forEach(pts => {
      if (pts.nm_usuario) profs.add(pts.nm_usuario)
      pts.objetivos.forEach(obj => {
        totalObjs++
        if (obj.ds_especialidade) esps.add(obj.ds_especialidade)
        const cat = getStatusCategory(obj.ds_status)
        if (cat === 'alcancado') successObjs++
        if (cat === 'pendente') pendingObjs++
      })
    })

    const successRate = totalObjs > 0 ? Math.round((successObjs / totalObjs) * 100) : 0
    const espsList = Array.from(esps).slice(0, 2).join(' e ') || 'Geral'

    return {
      totalObjs,
      successObjs,
      successRate,
      pendingObjs,
      numProfs: profs.size,
      numEsps: esps.size,
      espsList,
    }
  }, [filteredHistorico])

  // Agrupamento para Evolução Inteligente (por Especialidade)
  const smartHistory = useMemo(() => {
    // Agrupa objetivos por especialidade
    const porEspecialidade: Record<string, { texto: string; esp: string; evols: { pts: PtsHistoricoItemOut; obj: PtsHistoricoObjetivoOut }[] }[]> = {}

    const grouped: Record<string, { esp: string; evols: { pts: PtsHistoricoItemOut; obj: PtsHistoricoObjetivoOut }[] }> = {}
    const reversed = [...filteredHistorico].reverse()

    reversed.forEach(pts => {
      pts.objetivos.forEach(obj => {
        const text = (obj.ds_objetivo || '').trim()
        const key = text ? text.toLowerCase() : `sem-desc-${obj.id_objetivo}`
        if (!grouped[key]) {
          grouped[key] = { esp: obj.ds_especialidade || 'Geral', evols: [] }
        }
        grouped[key].evols.push({ pts, obj })
      })
    })

    Object.values(grouped).forEach(groupData => {
      const esp = groupData.esp
      if (!porEspecialidade[esp]) {
        porEspecialidade[esp] = []
      }
      porEspecialidade[esp].push({
        texto: groupData.evols[0].obj.ds_objetivo || '',
        esp: groupData.esp,
        evols: groupData.evols,
      })
    })

    return porEspecialidade
  }, [filteredHistorico])

  // Consolidação por Terapeuta
  const consolidated = useMemo(() => {
    const cons: Record<string, {
      nm_usuario: string
      ds_especialidade: string
      totalPts: number
      ptsSet: Set<number>
      totalObjs: number
      successObjs: number
      partialObjs: number
      failObjs: number
    }> = {}

    filteredHistorico.forEach(pts => {
      pts.objetivos.forEach(obj => {
        const esp = obj.ds_especialidade || 'Geral'
        const user = pts.nm_usuario || 'Não informado'
        const key = `${user}__${esp}`

        if (!cons[key]) {
          cons[key] = {
            nm_usuario: user,
            ds_especialidade: esp,
            totalPts: 0,
            ptsSet: new Set(),
            totalObjs: 0,
            successObjs: 0,
            partialObjs: 0,
            failObjs: 0,
          }
        }
        cons[key].ptsSet.add(pts.id_pts)
        cons[key].totalObjs++

        const cat = getStatusCategory(obj.ds_status)
        if (cat === 'alcancado') cons[key].successObjs++
        else if (cat === 'parcial') cons[key].partialObjs++
        else if (cat === 'pendente') cons[key].failObjs++
      })
    })

    return Object.values(cons).map(stats => ({
      ...stats,
      totalPts: stats.ptsSet.size,
    })).sort((a, b) => a.nm_usuario.localeCompare(b.nm_usuario))
  }, [filteredHistorico])

  const handleExportCSV = () => {
    if (filteredHistorico.length === 0) return
    let csv = '\uFEFF' // BOM UTF-8
    csv += 'ID_PTS;Data;Vigência;Profissional;Especialidade;Objetivo;Status;Motivo\n'

    const escapeCell = (text: string | null | undefined) => {
      if (!text) return '""'
      return `"${text.replace(/"/g, '""')}"`
    }

    filteredHistorico.forEach(pts => {
      pts.objetivos.forEach(obj => {
        const row = [
          pts.id_pts,
          pts.dt_criacao,
          pts.ds_vigencia,
          escapeCell(pts.nm_usuario),
          escapeCell(obj.ds_especialidade),
          escapeCell(obj.ds_objetivo),
          escapeCell(obj.ds_status),
          escapeCell(obj.ds_motivo),
        ]
        csv += row.join(';') + '\n'
      })
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `historico_pts_paciente_${data?.cd_paciente || cdPacienteBusca}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const patientName = data?.nm_paciente || `Paciente #${data?.cd_paciente || cdPacienteBusca}`
  const patientCode = data?.cd_paciente || cdPacienteBusca

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        color: '#14212b',
        fontFamily: '"Atkinson Hyperlegible", Inter, sans-serif',
      }}
      className="pts-history-container"
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .pts-history-container { padding: 0 !important; background: #ffffff !important; }
        }
      `}</style>

      {/* ── Título da Página ── */}
      <header className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#14212b',
          }}
        >
          Consulta de histórico
        </h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: '#44525e' }}>
          Veja a evolução dos objetivos do PTS de um paciente ao longo do tempo.
        </p>
      </header>

      {/* ── Card de Busca do Paciente ── */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 20,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #d5dce3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 420 }}>
            <label
              htmlFor="codigo-paciente-input"
              style={{ fontSize: 16, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}
            >
              Código ou prontuário do paciente
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 48,
                padding: '0 14px',
                border: '2px solid #5568d3',
                borderRadius: 6,
                backgroundColor: '#ffffff',
                gap: 8,
              }}
            >
              <input
                id="codigo-paciente-input"
                type="text"
                value={cdPacienteBusca}
                onChange={e => setCdPacienteBusca(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch(cdPacienteBusca)
                }}
                placeholder="Ex: 2143651"
                style={{
                  all: 'unset',
                  flex: 1,
                  fontSize: 16,
                  color: '#14212b',
                  lineHeight: 1.5,
                }}
              />
              {cdPacienteBusca && (
                <button
                  type="button"
                  onClick={() => setCdPacienteBusca('')}
                  aria-label="Limpar campo de busca"
                  style={{ all: 'unset', cursor: 'pointer', color: '#6e7c89', display: 'flex' }}
                >
                  <IconClose size={18} />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSearch(cdPacienteBusca)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
              padding: '0 24px',
              backgroundColor: '#5568d3',
              borderRadius: 6,
              border: 'none',
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
            <IconSearch size={20} />
            <span>Buscar histórico</span>
          </button>

          <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5, alignSelf: 'center' }}>
            Digite o código e pressione Enter para buscar.
          </span>
        </div>
      </div>

      {/* ── Spinner durante carregamento ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <Spin size="large" />
          <span style={{ fontSize: 16, color: '#44525e' }}>Carregando histórico e analisando dados evolutivos...</span>
        </div>
      )}

      {/* ── Conteúdo Principal do Histórico (Quando carregado) ── */}
      {data && !loading && (
        <>
          {/* 1. Banner com Dados do Paciente e Botões de Ação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              padding: '16px 24px',
              backgroundColor: '#ffffff',
              borderLeft: '6px solid #5568d3',
              borderRadius: 8,
              borderTop: '1px solid #d5dce3',
              borderRight: '1px solid #d5dce3',
              borderBottom: '1px solid #d5dce3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>Paciente</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  {patientName}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>Cód. paciente</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  {patientCode}
                </span>
              </div>
              <span style={{ fontSize: 16, color: '#44525e', lineHeight: 1.5 }}>
                {metrics.totalObjs} objetivos em {filteredHistorico.length} PTS encontrados
              </span>
            </div>

            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
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
                <IconDownload size={20} />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
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
                <IconPrinter size={20} />
                <span>Imprimir (PDF)</span>
              </button>
            </div>
          </div>

          {/* 2. Card de Filtros */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              padding: 20,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #d5dce3',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                Filtros
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  all: 'unset',
                  minHeight: 44,
                  padding: '0 12px',
                  color: '#5568d3',
                  fontSize: 16,
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Limpar filtros
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Período do PTS</span>
                <RangePicker
                  style={{ width: '100%', minHeight: 44, borderRadius: 6, border: '1px solid #6e7c89' }}
                  format={DATE_PICKER_FORMATS}
                  placeholder={['dd/mm/aaaa', 'dd/mm/aaaa']}
                  value={dateRange as any}
                  onChange={v => setDateRange(v as any)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Profissional</span>
                <Select
                  style={{ width: '100%', minHeight: 44 }}
                  allowClear
                  placeholder="Todos"
                  options={profOptions}
                  value={selectedProf}
                  onChange={v => setSelectedProf(v || null)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Especialidade</span>
                <Select
                  style={{ width: '100%', minHeight: 44 }}
                  allowClear
                  placeholder="Todas"
                  options={espOptions}
                  value={selectedEsp}
                  onChange={v => setSelectedEsp(v || null)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Status do objetivo</span>
                <Select
                  style={{ width: '100%', minHeight: 44 }}
                  allowClear
                  placeholder="Todos"
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={v => setSelectedStatus(v || null)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 520 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Pesquisar objetivo</span>
              <Input
                style={{ minHeight: 44, borderRadius: 6, border: '1px solid #6e7c89', fontSize: 16 }}
                prefix={<IconSearch size={18} />}
                placeholder="Palavra-chave, por exemplo: marcha"
                allowClear
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Grid com 5 Cards de Métricas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {/* Card 1: Objetivos Totais */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 18,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eceffb',
                  borderRadius: 6,
                  color: '#5568d3',
                }}
              >
                <IconTarget size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                  {metrics.totalObjs}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  Objetivos totais
                </span>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>
                  Em {filteredHistorico.length} PTS
                </span>
              </div>
            </div>

            {/* Card 2: Taxa de Sucesso */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 18,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eceffb',
                  borderRadius: 6,
                  color: '#5568d3',
                }}
              >
                <IconTrendingUp size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                  {metrics.successRate}%
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  Taxa de sucesso
                </span>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>
                  {metrics.successObjs} de {metrics.totalObjs} alcançados
                </span>
              </div>
            </div>

            {/* Card 3: Objetivos Pendentes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 18,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eceffb',
                  borderRadius: 6,
                  color: '#5568d3',
                }}
              >
                <IconClock size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                  {metrics.pendingObjs}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  Objetivos pendentes
                </span>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>
                  Aguardam avaliação
                </span>
              </div>
            </div>

            {/* Card 4: Profissionais */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 18,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eceffb',
                  borderRadius: 6,
                  color: '#5568d3',
                }}
              >
                <IconUsersGroup size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                  {metrics.numProfs}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  Profissionais
                </span>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>
                  No período filtrado
                </span>
              </div>
            </div>

            {/* Card 5: Especialidades */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 18,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eceffb',
                  borderRadius: 6,
                  color: '#5568d3',
                }}
              >
                <IconLayers size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                  {metrics.numEsps}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                  Especialidades
                </span>
                <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.5 }}>
                  {metrics.espsList}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Card Principal com as 3 Abas */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: 24,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #d5dce3',
            }}
          >
            {/* Barra de Abas */}
            <div
              className="no-print"
              role="tablist"
              style={{
                display: 'flex',
                gap: 4,
                borderBottom: '2px solid #d5dce3',
                overflowX: 'auto',
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'timeline'}
                onClick={() => setActiveTab('timeline')}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 48,
                  padding: '0 20px',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: activeTab === 'timeline' ? 700 : 400,
                  color: activeTab === 'timeline' ? '#14212b' : '#44525e',
                  borderBottom: activeTab === 'timeline' ? '4px solid #5568d3' : '4px solid transparent',
                  marginBottom: -2,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: activeTab === 'timeline' ? '#5568d3' : '#44525e', display: 'flex' }}>
                  <IconHistory size={20} />
                </span>
                <span>Linha do tempo</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'evolucao'}
                onClick={() => setActiveTab('evolucao')}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 48,
                  padding: '0 20px',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: activeTab === 'evolucao' ? 700 : 400,
                  color: activeTab === 'evolucao' ? '#14212b' : '#44525e',
                  borderBottom: activeTab === 'evolucao' ? '4px solid #5568d3' : '4px solid transparent',
                  marginBottom: -2,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: activeTab === 'evolucao' ? '#5568d3' : '#44525e', display: 'flex' }}>
                  <IconSparkles size={20} />
                </span>
                <span>Evolução inteligente</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'terapeuta'}
                onClick={() => setActiveTab('terapeuta')}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 48,
                  padding: '0 20px',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: activeTab === 'terapeuta' ? 700 : 400,
                  color: activeTab === 'terapeuta' ? '#14212b' : '#44525e',
                  borderBottom: activeTab === 'terapeuta' ? '4px solid #5568d3' : '4px solid transparent',
                  marginBottom: -2,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: activeTab === 'terapeuta' ? '#5568d3' : '#44525e', display: 'flex' }}>
                  <IconUsersGroup size={20} />
                </span>
                <span>Consolidado por terapeuta</span>
              </button>
            </div>

            {/* Sem registros com os filtros atuais */}
            {filteredHistorico.length === 0 ? (
              <Empty description="Nenhum dado encontrado para os filtros selecionados." />
            ) : (
              <>
                {/* ── ABA 1: LINHA DO TEMPO ── */}
                {activeTab === 'timeline' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {filteredHistorico.map((pts, index) => {
                      const isLast = index === filteredHistorico.length - 1
                      const isFinalizado = !!pts.fl_finalizado

                      // Agrupa objetivos deste PTS por especialidade
                      const objsPorEsp = pts.objetivos.reduce((acc, obj) => {
                        const esp = obj.ds_especialidade || 'Geral'
                        if (!acc[esp]) acc[esp] = []
                        acc[esp].push(obj)
                        return acc
                      }, {} as Record<string, typeof pts.objetivos>)

                      return (
                        <div key={pts.id_pts} style={{ display: 'flex', gap: 16 }}>
                          {/* Coluna do nó da Timeline */}
                          <div
                            style={{
                              display: 'flex',
                              width: 32,
                              flexDirection: 'column',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                width: 32,
                                height: 32,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 9999,
                                border: '2px solid #5568d3',
                                backgroundColor: '#ffffff',
                                color: '#5568d3',
                              }}
                            >
                              {isFinalizado ? <IconCheckCircle size={18} /> : <IconPen size={16} />}
                            </div>
                            {!isLast && (
                              <div style={{ width: 2, backgroundColor: '#d5dce3', flex: '1 1 0%' }} />
                            )}
                          </div>

                          {/* Card do PTS */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 14,
                              padding: 20,
                              backgroundColor: '#ffffff',
                              border: '1px solid #d5dce3',
                              borderRadius: 8,
                              flex: '1 1 0%',
                              marginBottom: isLast ? 0 : 8,
                            }}
                          >
                            {/* Cabeçalho do Card */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 12,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, color: '#14212b' }}>
                                  <IconCalendar size={20} />
                                  <span>{pts.dt_criacao}</span>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
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
                                  Vigência {pts.ds_vigencia}
                                </div>

                                {isFinalizado ? (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      minHeight: 32,
                                      padding: '0 12px',
                                      backgroundColor: '#e4f3e9',
                                      borderRadius: 9999,
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: '#1b6b3a',
                                    }}
                                  >
                                    <IconCheckCircle size={16} />
                                    <span>PTS finalizado</span>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'flex',
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
                                    <IconPen size={16} />
                                    <span>Rascunho</span>
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#14212b' }}>
                                <IconUser size={18} />
                                <span>{pts.nm_usuario}</span>
                              </div>
                            </div>

                            {/* Objetivos Agrupados por Especialidade */}
                            {Object.entries(objsPorEsp).map(([esp, objetivos]) => (
                              <div key={esp} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#14212b' }}>
                                  {esp}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  {objetivos.map(obj => (
                                    <div
                                      key={obj.id_objetivo}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: 16,
                                        minHeight: 52,
                                        padding: '10px 0',
                                        borderTop: '1px solid #d5dce3',
                                      }}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span
                                          style={{
                                            fontSize: 16,
                                            fontWeight: obj.ds_objetivo ? 400 : 400,
                                            fontStyle: obj.ds_objetivo ? 'normal' : 'italic',
                                            color: obj.ds_objetivo ? '#14212b' : '#44525e',
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          {obj.ds_objetivo || 'Objetivo sem descrição'}
                                        </span>
                                        {obj.ds_motivo && (
                                          <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.4 }}>
                                            Motivo: {obj.ds_motivo}
                                          </span>
                                        )}
                                      </div>

                                      <div style={{ flexShrink: 0 }}>
                                        {renderStatusPill(obj.ds_status)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── ABA 2: EVOLUÇÃO INTELIGENTE ── */}
                {activeTab === 'evolucao' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Header com Legenda */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: 16, color: '#44525e', lineHeight: 1.5 }}>
                        Acompanhe a trajetória de cada objetivo ao longo das vigências.
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>Legenda</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
                          <IconDashedCircle size={18} />
                          <span>Não se aplica</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#5568d3' }}>
                          <IconCircleDot size={18} />
                          <span style={{ color: '#14212b' }}>Parcial</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#b3261e' }}>
                          <IconClock size={18} />
                          <span style={{ color: '#14212b' }}>Pendente</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#1b6b3a' }}>
                          <IconCheckCircle size={18} />
                          <span style={{ color: '#14212b' }}>Alcançado</span>
                        </div>
                      </div>
                    </div>

                    {/* Lista Agrupada por Especialidade */}
                    {Object.entries(smartHistory).map(([esp, objetivos]) => (
                      <div key={esp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#14212b' }}>
                          <span>{esp}</span>
                          <span style={{ color: '#44525e', fontWeight: 400, marginLeft: 8 }}>
                            · {objetivos.length} {objetivos.length === 1 ? 'objetivo' : 'objetivos'}
                          </span>
                        </div>

                        {objetivos.map((sh, idx) => {
                          const ultimaEvol = sh.evols[sh.evols.length - 1]

                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 20,
                                minHeight: 72,
                                padding: '14px 20px',
                                backgroundColor: '#ffffff',
                                borderLeft: '6px solid #5568d3',
                                borderTop: '1px solid #d5dce3',
                                borderRight: '1px solid #d5dce3',
                                borderBottom: '1px solid #d5dce3',
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                <span
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: sh.texto ? '#14212b' : '#44525e',
                                    fontStyle: sh.texto ? 'normal' : 'italic',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {sh.texto || 'Objetivo sem descrição'}
                                </span>

                                {/* Histórico Evolutivo quando repetido em mais de 1 PTS */}
                                {sh.evols.length > 1 && (
                                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                                    <span style={{ fontSize: 13, color: '#5568d3', fontWeight: 700 }}>
                                      Evolução em {sh.evols.length} PTS:
                                    </span>
                                    {sh.evols.map((e, eIdx) => (
                                      <React.Fragment key={eIdx}>
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 8px',
                                            backgroundColor: '#f3f5f7',
                                            borderRadius: 6,
                                            fontSize: 13,
                                          }}
                                        >
                                          <span style={{ fontWeight: 700 }}>{e.pts.ds_vigencia}:</span>
                                          <span>{e.obj.ds_status || 'N/A'}</span>
                                        </div>
                                        {eIdx < sh.evols.length - 1 && (
                                          <span style={{ color: '#6e7c89', fontWeight: 700 }}>→</span>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, color: '#14212b' }}>
                                  <IconCalendar size={18} />
                                  <span>{ultimaEvol.pts.dt_criacao}</span>
                                </div>
                                <div>{renderStatusPill(ultimaEvol.obj.ds_status)}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── ABA 3: CONSOLIDADO POR TERAPEUTA ── */}
                {activeTab === 'terapeuta' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ fontSize: 16, color: '#44525e', lineHeight: 1.5 }}>
                      Resumo dos objetivos de cada profissional, por especialidade, no período filtrado.
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: 20,
                      }}
                    >
                      {consolidated.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            padding: 20,
                            backgroundColor: '#ffffff',
                            border: '1px solid #d5dce3',
                            borderRadius: 8,
                          }}
                        >
                          {/* Topo do Card do Terapeuta */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div
                              style={{
                                display: 'flex',
                                width: 48,
                                height: 48,
                                flexShrink: 0,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#eceffb',
                                borderRadius: 9999,
                                color: '#5568d3',
                              }}
                            >
                              <IconUser size={26} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <span style={{ fontSize: 20, fontWeight: 700, color: '#14212b', lineHeight: 1.5 }}>
                                {c.nm_usuario}
                              </span>
                              <span style={{ fontSize: 16, color: '#44525e', lineHeight: 1.5 }}>
                                {c.ds_especialidade}
                              </span>
                            </div>
                          </div>

                          {/* Grade de Estatísticas */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: '#f3f5f7',
                                borderRadius: 6,
                              }}
                            >
                              <IconFileText size={24} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                                  {c.totalPts}
                                </span>
                                <span style={{ fontSize: 15, color: '#14212b', lineHeight: 1.5 }}>
                                  PTS realizados
                                </span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: '#f3f5f7',
                                borderRadius: 6,
                              }}
                            >
                              <IconTarget size={24} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                                  {c.totalObjs}
                                </span>
                                <span style={{ fontSize: 15, color: '#14212b', lineHeight: 1.5 }}>
                                  Objetivos cadastrados
                                </span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: '#f3f5f7',
                                borderRadius: 6,
                              }}
                            >
                              <div style={{ color: '#1b6b3a', display: 'flex' }}>
                                <IconCheckCircle size={24} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                                  {c.successObjs}
                                </span>
                                <span style={{ fontSize: 15, color: '#14212b', lineHeight: 1.5 }}>
                                  Alcançados
                                </span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: '#f3f5f7',
                                borderRadius: 6,
                              }}
                            >
                              <div style={{ color: '#5568d3', display: 'flex' }}>
                                <IconCircleDot size={24} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                                  {c.partialObjs}
                                </span>
                                <span style={{ fontSize: 15, color: '#14212b', lineHeight: 1.5 }}>
                                  Parciais ou mantidos
                                </span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 14,
                                backgroundColor: '#f3f5f7',
                                borderRadius: 6,
                                gridColumn: 'span 2',
                              }}
                            >
                              <div style={{ color: '#b3261e', display: 'flex' }}>
                                <IconClose size={24} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#14212b', lineHeight: 1.1 }}>
                                  {c.failObjs}
                                </span>
                                <span style={{ fontSize: 15, color: '#14212b', lineHeight: 1.5 }}>
                                  Não alcançados ou cancelados
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Botão de Filtrar por este Terapeuta */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProf(c.nm_usuario)
                              setActiveTab('timeline')
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              alignSelf: 'flex-start',
                              gap: 8,
                              minHeight: 44,
                              padding: '0 16px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #5568d3',
                              borderRadius: 6,
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
                            <span>Ver registros deste profissional</span>
                            <IconChevronRight size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
