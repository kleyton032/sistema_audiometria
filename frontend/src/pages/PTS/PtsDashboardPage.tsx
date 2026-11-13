import { useEffect, useState, type CSSProperties } from 'react'
import { Typography, Tooltip, Alert, Modal, Spin } from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  PrinterOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPTSDashboardStats, getPTSDashboardReport, getPTSById } from '@/api/ptsService'
import PTSPrintView from './PTSPrintView'
import { Area } from './data/listas'
import { criarObjetivosIniciais } from './ObjetivosEspecialidades'
import { useAuth } from '@/contexts'

const { Text } = Typography

type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; direction: 'prev' | 'next' }

export default function PtsDashboardPage() {
  const { isConsulta } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_pts: 0, finalizados: 0, em_rascunho: 0, cancelados: 0 })
  const [report, setReport] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'finalizados' | 'rascunho' | 'cancelados' | null>(null)
  const [filtroData, setFiltroData] = useState<any[]>([])
  const [filtroLoading, setFiltroLoading] = useState(false)
  const [horaAtualizacao, setHoraAtualizacao] = useState<string>(() => dayjs().format('HH:mm'))
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [jumpInput, setJumpInput] = useState('')

  // Estados para o Preview
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [currentPtsData, setCurrentPtsData] = useState<any>(null)
  const [isPreviewFull, setIsPreviewFull] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([
        getPTSDashboardStats(),
        getPTSDashboardReport(),
      ])
      setStats(s)
      setReport(r)
      setHoraAtualizacao(dayjs().format('HH:mm'))
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Recarrega dados automaticamente se a sessão do usuário for renovada
  useEffect(() => {
    const handleSessionRenewed = () => {
      loadData()
    }
    window.addEventListener('auth-session-renewed', handleSessionRenewed)
    return () => {
      window.removeEventListener('auth-session-renewed', handleSessionRenewed)
    }
  }, [])

  const handleFiltroStatus = async (status: 'finalizados' | 'rascunho' | 'cancelados') => {
    setCurrentPage(1)
    if (filtroStatus === status) {
      setFiltroStatus(null)
      setFiltroData([])
      return
    }
    setFiltroStatus(status)
    setFiltroLoading(true)
    try {
      const data = await getPTSDashboardReport(status)
      setFiltroData(data)
    } catch (error) {
      console.error('Erro ao filtrar por status:', error)
      setFiltroData([])
    } finally {
      setFiltroLoading(false)
    }
  }

  const limparFiltro = () => {
    setFiltroStatus(null)
    setFiltroData([])
    setSearchText('')
    setCurrentPage(1)
  }

  const dadosExibidos = filtroStatus ? filtroData : report

  const filteredData = dadosExibidos.filter(item => {
    const term = searchText.toLowerCase().trim()
    if (!term) return true
    return (
      (item.nm_paciente && item.nm_paciente.toLowerCase().includes(term)) ||
      (item.cd_paciente && String(item.cd_paciente).includes(term)) ||
      (item.nm_usuario && item.nm_usuario.toLowerCase().includes(term))
    )
  })

  // Paginação
  const totalItems = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageIndex = Math.min(currentPage, totalPages)
  const startIndex = (pageIndex - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Gerador de páginas com janela inteligente (no máximo 7 botões para não estourar a tela)
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

  const handleOpenPreview = async (record: any, full = false) => {
    setPreviewVisible(true)
    setPreviewLoading(true)
    setIsPreviewFull(full)
    try {
      const d = await getPTSById(record.id_pts)

      const toRows = (arr: string[]) => arr.map((v, i) => ({ key: i + 1, diagnostico: v }))

      const printData = {
        paciente: {
          nm_paciente: record.nm_paciente,
          cd_paciente: record.cd_paciente,
          cd_atendimento: record.nr_atendimento,
        },
        formValues: {
          queixa_principal: d.queixa_principal,
          cer_terapias_texto: d.cer_terapias_texto,
          ext_nao_realiza: d.ext_nao_realiza,
          observacoes_gerais: d.observacoes_gerais,
          conduta_interdisciplinar: d.conduta_interdisciplinar,
          intervencao_prazo: d.intervencao_prazo,
          intervencao_descricao: d.intervencao_descricao,
          pts_nao_concluido: d.pts_nao_concluido,
          // Condições
          cond_nao_se_aplica: d.cond_nao_se_aplica,
          cond_nao_escuta: d.cond_nao_escuta,
          cond_nao_fala: d.cond_nao_fala,
          cond_nao_enxerga: d.cond_nao_enxerga,
          cond_agitacao: d.cond_agitacao,
          cond_agressividade: d.cond_agressividade,
          cond_nao_anda: d.cond_nao_anda,
          cond_nao_fica_sozinho: d.cond_nao_fica_sozinho,
          cond_sem_ctrl_cervical: d.cond_sem_ctrl_cervical,
          cond_sem_ctrl_tronco: d.cond_sem_ctrl_tronco,
          cond_outra: d.cond_outra,
          // OPME
          opme_nao_se_aplica: d.opme_nao_se_aplica,
          opme_cadeira: d.opme_cadeira,
          opme_bengala: d.opme_bengala,
          opme_muleta: d.opme_muleta,
          opme_andador: d.opme_andador,
          opme_protese: d.opme_protese,
          opme_com_alta: d.opme_com_alta,
          opme_com_baixa: d.opme_com_baixa,
          opme_orteses: d.opme_orteses,
          opme_outros: d.opme_outros,
          // Deficiências
          def_associada_visual: d.def_associada_visual,
          def_associada_intelectual: d.def_associada_intelectual,
          def_associada_fisica: d.def_associada_fisica,
          def_associada_auditiva: d.def_associada_auditiva,
          // Programas
          prog_nao_se_aplica: d.prog_nao_se_aplica,
          prog_glaucoma: d.prog_glaucoma,
          prog_catarata: d.prog_catarata,
          prog_alem_olhar: d.prog_alem_olhar,
          prog_zika: d.prog_zika,
          prog_apoio_familiar: d.prog_apoio_familiar,
          prog_tea: d.prog_tea,
          prog_intervencao_precoce: d.prog_intervencao_precoce,
          prog_rop: d.prog_rop,
          prog_pronas_tea: d.prog_pronas_tea,
          prog_pronas_doencas_raras: d.prog_pronas_doencas_raras,
        },
        diagPrincipais: toRows(d.diagnosticos_principais || []),
        diagnosticosArea: (d.diagnosticos_area || {}) as Record<Area, string | undefined>,
        grauArea: (d.grau_area || {}) as Record<Area, string | undefined>,
        diagTerapeuticos: toRows(d.diagnosticos_terapeuticos || []),
        extTerapias: toRows(d.cer_terapias || []),
        conductaRows: toRows(d.conduta_avaliacao_medica || []),
        multidisciplinarRows: toRows(d.conduta_multidisciplinar || []),
        instrumentoRows: (d.instrumentos || []).map((v: any, i: number) => ({
          key: i + 1,
          diagnostico: typeof v === 'string' ? v : v.ds_instrumento,
          calculo: typeof v === 'object' ? v.ds_calculo : undefined,
        })),
        terapias: d.terapias_indicadas || [],
        objetivos: { ...criarObjetivosIniciais(), ...(d.objetivos || {}) },
        usuarioMe: {
          nm_usuario: record.nm_usuario,
          nm_tip_presta: d.usuario_especialidade,
          ds_conselho: d.usuario_conselho,
          ds_codigo_conselho: d.usuario_nr_conselho,
        },
        id_pts: record.id_pts,
        fl_finalizado: record.fl_finalizado,
        dt_documento: d.dt_criacao || record.dt_criacao || undefined,
      }

      setCurrentPtsData(printData)
    } catch (error) {
      console.error('Erro ao buscar detalhes do PTS:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handlePrintFromPreview = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')
        } catch {
          return ''
        }
      })
      .join('')

    const content = document.getElementById('pts-preview-content')?.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão PTS - ${currentPtsData?.paciente?.nm_paciente ?? ''}</title>
          <style>
            ${styles}
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; margin: 0; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            ${content}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Estilos base
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: '"Atkinson Hyperlegible", Inter, sans-serif',
    color: '#14212b',
  }

  const cardFilterBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: '1px solid #6e7c89',
    background: '#ffffff',
  }

  return (
    <main style={containerStyle}>
      {/* Alerta de Modo Somente Consulta */}
      {isConsulta && (
        <Alert
          type="warning"
          showIcon
          icon={<EyeOutlined />}
          message={
            <div>
              <Text strong style={{ display: 'block', fontSize: 15 }}>Modo Somente Consulta</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Seu usuário não possui prestador vinculado ao MV. Você pode visualizar todas as informações, mas não pode criar, editar ou cancelar PTS.
              </Text>
            </div>
          }
        />
      )}

      {/* Header com Título e Ação de Atualização */}
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
            Dashboard PTS
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 16,
              color: '#44525e',
              lineHeight: 1.5,
            }}
          >
            Acompanhe os Projetos Terapêuticos Singulares por situação.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 16, color: '#44525e' }}>
            Atualizado às {horaAtualizacao}
          </span>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            aria-label="Atualizar dados do dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
              padding: '0 20px',
              border: '2px solid #5568d3',
              borderRadius: 6,
              backgroundColor: '#ffffff',
              color: '#5568d3',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#eceffb'
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }
            }}
          >
            <ReloadOutlined spin={loading} style={{ fontSize: 18 }} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* 4 Cards de Estatísticas / Filtros Rápidos */}
      <section
        aria-label="Filtros por situação do PTS"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
        }}
      >
        {/* Card 1: Total de PTS (Limpa filtros / Mostra todos) */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={filtroStatus === null}
          aria-label="Filtrar por todos os PTS"
          onClick={limparFiltro}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              limparFiltro()
            }
          }}
          style={{
            ...cardFilterBase,
            backgroundColor: filtroStatus === null ? '#eceffb' : '#ffffff',
            border: filtroStatus === null ? '2px solid #5568d3' : '1px solid #6e7c89',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 52,
              height: 52,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f5f7',
              borderRadius: 6,
            }}
          >
            <FileTextOutlined style={{ fontSize: 26, color: '#5568d3' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#14212b',
              }}
            >
              {loading ? '...' : stats.total_pts}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
                lineHeight: 1.4,
              }}
            >
              Total de PTS
            </span>
            <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.4 }}>
              {filtroStatus === null ? 'Mostrando todos' : 'Clique para mostrar todos'}
            </span>
          </div>
        </div>

        {/* Card 2: Finalizados */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={filtroStatus === 'finalizados'}
          aria-label="Filtrar por PTS finalizados"
          onClick={() => handleFiltroStatus('finalizados')}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleFiltroStatus('finalizados')
            }
          }}
          style={{
            ...cardFilterBase,
            backgroundColor: filtroStatus === 'finalizados' ? '#e4f3e9' : '#ffffff',
            border: filtroStatus === 'finalizados' ? '2px solid #1b6b3a' : '1px solid #6e7c89',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 52,
              height: 52,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f5f7',
              borderRadius: 6,
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 26, color: '#1b6b3a' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#14212b',
              }}
            >
              {loading ? '...' : stats.finalizados}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
                lineHeight: 1.4,
              }}
            >
              Finalizados
            </span>
            <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.4 }}>
              {filtroStatus === 'finalizados' ? 'Filtro ativo' : 'Clique para filtrar'}
            </span>
          </div>
        </div>

        {/* Card 3: Em Rascunho */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={filtroStatus === 'rascunho'}
          aria-label="Filtrar por PTS em rascunho"
          onClick={() => handleFiltroStatus('rascunho')}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleFiltroStatus('rascunho')
            }
          }}
          style={{
            ...cardFilterBase,
            backgroundColor: filtroStatus === 'rascunho' ? '#eceffb' : '#ffffff',
            border: filtroStatus === 'rascunho' ? '2px solid #5568d3' : '1px solid #6e7c89',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 52,
              height: 52,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f5f7',
              borderRadius: 6,
            }}
          >
            <EditOutlined style={{ fontSize: 26, color: '#5568d3' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#14212b',
              }}
            >
              {loading ? '...' : stats.em_rascunho}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
                lineHeight: 1.4,
              }}
            >
              Em rascunho
            </span>
            <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.4 }}>
              {filtroStatus === 'rascunho' ? 'Filtro ativo' : 'Clique para filtrar'}
            </span>
          </div>
        </div>

        {/* Card 4: Cancelados */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={filtroStatus === 'cancelados'}
          aria-label="Filtrar por PTS cancelados"
          onClick={() => handleFiltroStatus('cancelados')}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleFiltroStatus('cancelados')
            }
          }}
          style={{
            ...cardFilterBase,
            backgroundColor: filtroStatus === 'cancelados' ? '#fbe9e7' : '#ffffff',
            border: filtroStatus === 'cancelados' ? '2px solid #b3261e' : '1px solid #6e7c89',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 52,
              height: 52,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f5f7',
              borderRadius: 6,
            }}
          >
            <CloseCircleOutlined style={{ fontSize: 26, color: '#b3261e' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#14212b',
              }}
            >
              {loading ? '...' : stats.cancelados}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
                lineHeight: 1.4,
              }}
            >
              Cancelados
            </span>
            <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.4 }}>
              {filtroStatus === 'cancelados' ? 'Filtro ativo' : 'Clique para filtrar'}
            </span>
          </div>
        </div>
      </section>

      {/* Linha de Busca e Contador */}
      <section
        aria-label="Busca e contagem de PTS"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            maxWidth: 460,
            minHeight: 48,
            padding: '0 14px',
            backgroundColor: '#ffffff',
            border: '1px solid #6e7c89',
            borderRadius: 6,
          }}
        >
          <SearchOutlined style={{ fontSize: 18, color: '#44525e' }} />
          <label htmlFor="pts-search-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Buscar por paciente ou responsável
          </label>
          <input
            id="pts-search-input"
            type="search"
            placeholder="Buscar por paciente ou responsável"
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value)
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

        <div role="status" aria-live="polite" style={{ fontSize: 16, color: '#44525e' }}>
          {filtroLoading ? (
            <span>Carregando resultados...</span>
          ) : (
            <span>
              {filteredData.length} PTS {filteredData.length === 1 ? 'encontrado' : 'encontrados'}
              {filtroStatus && (
                <span>
                  {' '}(
                  {filtroStatus === 'finalizados' && 'Finalizados'}
                  {filtroStatus === 'rascunho' && 'Em Rascunho'}
                  {filtroStatus === 'cancelados' && 'Cancelados'}
                  )
                </span>
              )}
            </span>
          )}
        </div>
      </section>

      {/* Tabela de PTS Redesenhada com Suporte a Responsividade */}
      <section
        aria-label="Lista de Projetos Terapêuticos Singulares"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d5dce3',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Scroll Horizontal Interno para Evitar Quebras em Monitores de Menor Resolução */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ minWidth: 1080 }}>
            {/* Header da Tabela */}
            <div
              style={{
                display: 'grid',
                minHeight: 56,
                alignItems: 'center',
                gridTemplateColumns: 'minmax(200px, 1.4fr) minmax(95px, 0.7fr) minmax(180px, 1.2fr) minmax(260px, 2fr) minmax(150px, 0.9fr) minmax(250px, 1.3fr)',
                gap: 16,
                padding: '0 24px',
                backgroundColor: '#eceffb',
                borderBottom: '2px solid #d5dce3',
                fontSize: 16,
                fontWeight: 700,
                color: '#14212b',
              }}
            >
              <span>Paciente</span>
              <span>Vigência</span>
              <span>Responsável</span>
              <span>Terapias indicadas</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {/* Conteúdo da Tabela */}
            {loading || filtroLoading ? (
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
                <span style={{ fontSize: 16, color: '#44525e' }}>Carregando PTS...</span>
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
                  Nenhum PTS encontrado
                </p>
                <p style={{ margin: '8px 0 0 0' }}>
                  Tente alterar os termos da busca ou limpar os filtros de situação.
                </p>
                {filtroStatus && (
                  <button
                    type="button"
                    onClick={limparFiltro}
                    style={{
                      marginTop: 16,
                      minHeight: 40,
                      padding: '0 16px',
                      border: '1px solid #5568d3',
                      borderRadius: 6,
                      backgroundColor: '#ffffff',
                      color: '#5568d3',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Mostrar todos os PTS
                  </button>
                )}
              </div>
            ) : (
              paginatedData.map(record => {
                const isCancelado = record.fl_ativo === 0
                const isFinalizado = record.fl_finalizado === 1
                const isLegacyCancel = isCancelado && !record.ds_motivo_cancelamento

                return (
                  <div
                    key={record.id_pts}
                    style={{
                      display: 'grid',
                      minHeight: 84,
                      alignItems: 'center',
                      gridTemplateColumns: 'minmax(200px, 1.4fr) minmax(95px, 0.7fr) minmax(180px, 1.2fr) minmax(260px, 2fr) minmax(150px, 0.9fr) minmax(250px, 1.3fr)',
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
                    {/* Paciente */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          lineHeight: 1.4,
                          color: '#14212b',
                        }}
                      >
                        {record.nm_paciente}
                      </span>
                      <span style={{ fontSize: 14, color: '#44525e', lineHeight: 1.4 }}>
                        Cód. {record.cd_paciente}
                      </span>
                    </div>

                    {/* Vigência */}
                    <span style={{ fontSize: 16, color: '#14212b' }}>
                      {record.ds_vigencia || '—'}
                    </span>

                    {/* Responsável */}
                    <span style={{ fontSize: 16, color: '#14212b' }}>
                      {record.nm_usuario || '—'}
                    </span>

                    {/* Terapias indicadas */}
                    <span
                      title={record.terapias || undefined}
                      style={{
                        fontSize: 16,
                        lineHeight: 1.4,
                        color: '#14212b',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {record.terapias || '—'}
                    </span>

                    {/* Status Pill */}
                    <div>
                      {isCancelado ? (
                        <Tooltip
                          title={
                            isLegacyCancel ? (
                              <div style={{ padding: 4 }}>
                                <div
                                  style={{
                                    marginBottom: 6,
                                    padding: '4px 8px',
                                    background: '#fffbe6',
                                    border: '1px solid #ffe58f',
                                    borderRadius: 4,
                                    color: '#d46b08',
                                    fontSize: 12,
                                  }}
                                >
                                  <strong>⚠️ Cancelamento Legado</strong>
                                  <br />
                                  Realizado antes da atualização do sistema. Detalhes indisponíveis.
                                </div>
                                <strong>Responsável:</strong> {record.nm_usuario || 'Não informado'}
                              </div>
                            ) : (
                              <div style={{ padding: 4 }}>
                                <strong>Motivo:</strong> {record.ds_motivo_cancelamento || 'Não informado'}<br />
                                <strong>Observação:</strong> {record.ds_detalhe_cancelamento || 'Nenhuma'}<br />
                                <strong>Data:</strong> {record.dt_cancelamento || 'Não informada'}<br />
                                <strong>Responsável:</strong> {record.nm_usuario || 'Não informado'}
                              </div>
                            )
                          }
                          placement="top"
                          color="#ffffff"
                          overlayInnerStyle={{ color: '#14212b', border: '1px solid #d5dce3', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        >
                          <div
                            tabIndex={0}
                            aria-label={`PTS Cancelado. Clique ou passe o cursor para ver detalhes do cancelamento.`}
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
                              color: '#14212b',
                              cursor: 'help',
                            }}
                          >
                            <CloseCircleOutlined style={{ color: '#b3261e', fontSize: 16 }} />
                            <span>Cancelado</span>
                            <InfoCircleOutlined style={{ color: isLegacyCancel ? '#8c8c8c' : '#b3261e', fontSize: 12 }} />
                          </div>
                        </Tooltip>
                      ) : isFinalizado ? (
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
                          <CheckCircleOutlined style={{ color: '#1b6b3a', fontSize: 16 }} />
                          <span>Finalizado</span>
                        </div>
                      ) : (
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
                            color: '#14212b',
                          }}
                        >
                          <EditOutlined style={{ color: '#5568d3', fontSize: 16 }} />
                          <span>Rascunho</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Botão Ver PTS */}
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(record, true)}
                        aria-label={`Ver PTS de ${record.nm_paciente}`}
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
                        <EyeOutlined style={{ fontSize: 18 }} />
                        <span>Ver PTS</span>
                      </button>

                      {/* Botão Imprimir */}
                      {isFinalizado ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(record, false)}
                          aria-label={`Imprimir PTS de ${record.nm_paciente}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            minHeight: 44,
                            padding: '0 14px',
                            border: '1px solid #6e7c89',
                            borderRadius: 6,
                            backgroundColor: '#ffffff',
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
                          <PrinterOutlined style={{ fontSize: 18 }} />
                          <span>Imprimir</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            title="Disponível apenas após a finalização do PTS"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              minHeight: 44,
                              padding: '0 14px',
                              backgroundColor: '#f3f5f7',
                              border: '1px dashed #6e7c89',
                              borderRadius: 6,
                              color: '#6e7c89',
                              fontSize: 16,
                              fontWeight: 700,
                              cursor: 'not-allowed',
                            }}
                          >
                            <PrinterOutlined style={{ fontSize: 18 }} />
                            <span>Imprimir</span>
                          </button>
                          <span style={{ fontSize: 12, color: '#6e7c89', marginTop: 2 }}>
                            Após finalizar
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Paginação Aperfeiçoada */}
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
                ? 'Nenhum PTS para exibir'
                : `Mostrando ${startIndex + 1} a ${endIndex} de ${totalItems} PTS`}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#44525e' }}>
              <label htmlFor="pts-page-size-select">Exibir:</label>
              <select
                id="pts-page-size-select"
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

          {/* Navegação entre Páginas com Janela Inteligente */}
          <nav
            aria-label="Navegação da paginação"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {/* Atalho para Primeira Página */}
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

            {/* Botão Anterior */}
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

            {/* Números de Página e Reticências Inteligentes */}
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

            {/* Botão Próxima */}
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

            {/* Atalho para Última Página */}
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

            {/* Pular Diretamente para uma Página (Quick Jumper) */}
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

      {/* Modal de Visualização Rápida (Preview Estilo PDF) */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '95%' }}>
            <span>{isPreviewFull ? 'Visualização Completa (Tudo)' : 'Visualização de Impressão (Resumida)'}</span>
            {!isPreviewFull && (
              <button
                type="button"
                onClick={handlePrintFromPreview}
                disabled={previewLoading || !currentPtsData}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  border: '1px solid #5568d3',
                  borderRadius: 6,
                  backgroundColor: '#5568d3',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: previewLoading || !currentPtsData ? 'not-allowed' : 'pointer',
                }}
              >
                <PrinterOutlined />
                <span>Imprimir</span>
              </button>
            )}
          </div>
        }
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false)
          setCurrentPtsData(null)
        }}
        width={1000}
        style={{ top: 20 }}
        footer={null}
        destroyOnClose
      >
        <div style={{ minHeight: 400, background: '#f5f5f5', padding: '20px', borderRadius: 8 }}>
          {previewLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
              <Spin size="large" />
              <Text style={{ marginTop: 16 }}>Carregando documento...</Text>
            </div>
          ) : currentPtsData ? (
            <div
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxWidth: 850,
                margin: '0 auto',
                backgroundColor: '#ffffff',
                padding: 24,
                borderRadius: 8,
              }}
            >
              <div id="pts-preview-content">
                <PTSPrintView data={currentPtsData} full={isPreviewFull} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">Não foi possível carregar os dados do documento.</Text>
            </div>
          )}
        </div>
      </Modal>
    </main>
  )
}
