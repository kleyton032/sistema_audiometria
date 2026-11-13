import { useState, type CSSProperties } from 'react'
import {
  DatePicker,
  Tooltip,
  Spin,
  App,
} from 'antd'
import {
  EyeOutlined,
  FilePdfOutlined,
  SearchOutlined,
  ClearOutlined,
  AudioOutlined,
  SoundOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  buscarExamesGerencial,
  downloadUltimoLaudo,
  type ExameGerencialItem,
  type ExameGerencialResponse,
} from '@/api/exameService'
import ExameModal, { type TipoExame } from '@/components/ExameModal'
import { parseBrDate, DATE_PICKER_FORMATS } from '@/utils/dateUtils'

dayjs.locale('pt-br')

type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; direction: 'prev' | 'next' }

export default function ConsultaPage() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [result, setResult] = useState<ExameGerencialResponse | null>(null)

  // Filtros
  const [idPaciente, setIdPaciente] = useState<string>('')
  const [idAtendimento, setIdAtendimento] = useState<string>('')
  const [nmPaciente, setNmPaciente] = useState<string>('')
  const [dsTipo, setDsTipo] = useState<string>('')
  const [dtInicio, setDtInicio] = useState<Dayjs | null>(null)
  const [dtFim, setDtFim] = useState<Dayjs | null>(null)

  // Paginação
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpInput, setJumpInput] = useState('')

  // Modal de visualização
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTipo, setModalTipo] = useState<TipoExame | null>(null)
  const [modalPaciente, setModalPaciente] = useState<{ id: number; nome: string | null; atendimento: number | null } | null>(null)

  const handleSearch = async (pg = 1, currentSize = pageSize) => {
    setLoading(true)
    try {
      const res = await buscarExamesGerencial({
        id_paciente:    idPaciente.trim() ? Number(idPaciente) : undefined,
        id_atendimento: idAtendimento.trim() ? Number(idAtendimento) : undefined,
        nm_paciente:    nmPaciente.trim() || undefined,
        ds_tipo:        dsTipo || undefined,
        dt_inicio:      dtInicio ? dtInicio.format('YYYY-MM-DD') : undefined,
        dt_fim:         dtFim ? dtFim.format('YYYY-MM-DD') : undefined,
        skip:           (pg - 1) * currentSize,
        limit:          currentSize,
      })
      setResult(res)
      setPage(pg)
    } catch {
      message.error('Erro ao buscar exames.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setIdPaciente('')
    setIdAtendimento('')
    setNmPaciente('')
    setDsTipo('')
    setDtInicio(null)
    setDtFim(null)
    setResult(null)
    setPage(1)
  }

  const handleView = (row: ExameGerencialItem) => {
    if (!row.id_atendimento) {
      message.warning('Este exame não possui atendimento vinculado para visualização.')
      return
    }
    setModalPaciente({ id: row.id_paciente, nome: row.nm_paciente, atendimento: row.id_atendimento })
    setModalTipo(row.ds_tipo === 'AUDIOMETRIA' ? 'audiometria' : 'imitanciometria')
    setModalOpen(true)
  }

  const handleReprint = async (row: ExameGerencialItem) => {
    setDownloading(row.id_exame)
    try {
      const blob = await downloadUltimoLaudo(row.id_exame)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laudo_exame_${row.id_exame}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      message.error('Erro ao baixar laudo.')
    } finally {
      setDownloading(null)
    }
  }

  // Estatísticas calculadas da página atual
  const totalAudio  = result?.items.filter(i => i.ds_tipo === 'AUDIOMETRIA').length ?? 0
  const totalImitan = result?.items.filter(i => i.ds_tipo === 'IMITANCIOMETRIA').length ?? 0

  // Paginação
  const totalItems = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageIndex = Math.min(page, totalPages)
  const startIndex = (pageIndex - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

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

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: '"Atkinson Hyperlegible", Inter, sans-serif',
    color: '#14212b',
  }

  return (
    <main style={containerStyle}>
      {/* Header com Título e Subtítulo */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#14212b',
          }}
        >
          Consulta de Exames
        </h1>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: 16,
            color: '#44525e',
            lineHeight: 1.5,
          }}
        >
          Pesquise os exames auditivos e laudos já registrados.
        </p>
      </header>

      {/* Card de Filtros de Busca */}
      <section
        aria-label="Filtros de pesquisa de exames"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: 24,
          backgroundColor: '#ffffff',
          border: '1px solid #d5dce3',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#14212b',
            }}
          >
            Filtros de busca
          </h2>
          <span style={{ fontSize: 16, color: '#44525e' }}>
            Preencha um ou mais campos e pesquise.
          </span>
        </div>

        {/* Linha 1: Prontuário, Atendimento, Nome do Paciente */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {/* Prontuário */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="consulta-prontuario" style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Prontuário
            </label>
            <input
              id="consulta-prontuario"
              type="number"
              min={1}
              value={idPaciente}
              onChange={e => setIdPaciente(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch(1)
              }}
              placeholder="Digite aqui"
              style={{
                minHeight: 48,
                padding: '0 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                color: '#14212b',
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: 14, color: '#44525e' }}>Código do paciente</span>
          </div>

          {/* Atendimento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="consulta-atendimento" style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Atendimento
            </label>
            <input
              id="consulta-atendimento"
              type="number"
              min={1}
              value={idAtendimento}
              onChange={e => setIdAtendimento(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch(1)
              }}
              placeholder="Digite aqui"
              style={{
                minHeight: 48,
                padding: '0 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                color: '#14212b',
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: 14, color: '#44525e' }}>Código do atendimento</span>
          </div>

          {/* Nome do paciente */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="consulta-nome" style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Nome do paciente
            </label>
            <input
              id="consulta-nome"
              type="text"
              value={nmPaciente}
              onChange={e => setNmPaciente(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch(1)
              }}
              placeholder="Digite aqui"
              style={{
                minHeight: 48,
                padding: '0 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                color: '#14212b',
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: 14, color: '#44525e' }}>Busca parcial pelo nome</span>
          </div>
        </div>

        {/* Linha 2: Tipo de exame, Data inicial, Data final */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {/* Tipo de exame */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="consulta-tipo" style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Tipo de exame
            </label>
            <select
              id="consulta-tipo"
              value={dsTipo}
              onChange={e => setDsTipo(e.target.value)}
              style={{
                minHeight: 48,
                padding: '0 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #6e7c89',
                borderRadius: 6,
                color: '#14212b',
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Todos</option>
              <option value="AUDIOMETRIA">Audiometria</option>
              <option value="IMITANCIOMETRIA">Imitanciometria</option>
            </select>
            <span style={{ fontSize: 14, color: '#44525e' }}>Escolha um tipo ou deixe em Todos</span>
          </div>

          {/* Data inicial */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="consulta-dt-inicio" style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Data inicial
            </label>
            <DatePicker
              id="consulta-dt-inicio"
              value={dtInicio}
              format={DATE_PICKER_FORMATS}
              placeholder="dd/mm/aaaa"
              allowClear
              style={{
                minHeight: 48,
                padding: '0 14px',
                borderRadius: 6,
                border: '1px solid #6e7c89',
                fontSize: 16,
                color: '#14212b',
              }}
              onChange={d => setDtInicio(d)}
              onBlur={e => {
                const raw = (e.target as HTMLInputElement)?.value?.trim()
                if (raw) {
                  const parsed = parseBrDate(raw)
                  if (parsed && parsed.isValid()) setDtInicio(parsed)
                }
              }}
              aria-label="Data inicial do exame"
            />
            <span style={{ fontSize: 14, color: '#44525e' }}>Período do exame</span>
          </div>

          {/* Data final */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="consulta-dt-fim" style={{ fontSize: 16, fontWeight: 700, color: '#14212b' }}>
              Data final
            </label>
            <DatePicker
              id="consulta-dt-fim"
              value={dtFim}
              format={DATE_PICKER_FORMATS}
              placeholder="dd/mm/aaaa"
              allowClear
              style={{
                minHeight: 48,
                padding: '0 14px',
                borderRadius: 6,
                border: '1px solid #6e7c89',
                fontSize: 16,
                color: '#14212b',
              }}
              onChange={d => setDtFim(d)}
              onBlur={e => {
                const raw = (e.target as HTMLInputElement)?.value?.trim()
                if (raw) {
                  const parsed = parseBrDate(raw)
                  if (parsed && parsed.isValid()) setDtFim(parsed)
                }
              }}
              aria-label="Data final do exame"
            />
            <span style={{ fontSize: 14, color: '#44525e' }}>Período do exame</span>
          </div>
        </div>

        {/* Linha 3: Botões de Ação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
          {/* Botão Pesquisar */}
          <button
            type="button"
            onClick={() => handleSearch(1)}
            disabled={loading}
            aria-label="Pesquisar exames com os filtros preenchidos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
              padding: '0 24px',
              backgroundColor: '#5568d3',
              border: 'none',
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.opacity = '1'
            }}
          >
            <SearchOutlined style={{ fontSize: 18 }} />
            <span>{loading ? 'Pesquisando...' : 'Pesquisar'}</span>
          </button>

          {/* Botão Limpar Filtros */}
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            aria-label="Limpar todos os campos de filtro"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
              padding: '0 20px',
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
            <ClearOutlined style={{ fontSize: 18 }} />
            <span>Limpar filtros</span>
          </button>
        </div>
      </section>

      {/* Seção de Resultados */}
      {result === null ? (
        /* Estado Inicial: Nenhuma Pesquisa Feita Ainda */
        <section
          aria-label="Estado inicial da consulta de exames"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            border: '1px dashed #6e7c89',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#eceffb',
              borderRadius: 9999,
              color: '#5568d3',
            }}
          >
            <FileSearchOutlined style={{ fontSize: 32 }} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#14212b',
              lineHeight: 1.4,
            }}
          >
            Nenhuma pesquisa feita ainda
          </h3>
          <p
            style={{
              margin: 0,
              maxWidth: 520,
              fontSize: 16,
              color: '#44525e',
              lineHeight: 1.5,
            }}
          >
            Use os filtros acima e clique em Pesquisar. Os exames encontrados aparecem aqui.
          </p>
        </section>
      ) : result.items.length === 0 ? (
        /* Estado: Nenhum Exame Encontrado */
        <section
          aria-label="Resultado da consulta vazio"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            border: '1px solid #d5dce3',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#14212b' }}>
            Nenhum exame encontrado
          </h3>
          <p style={{ margin: 0, fontSize: 16, color: '#44525e' }}>
            Nenhum registro corresponde aos critérios informados. Tente ajustar os filtros de busca.
          </p>
        </section>
      ) : (
        /* Estado com Resultados */
        <>
          {/* Cards de Resumo Estatístico */}
          <section
            aria-label="Resumo dos exames encontrados"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {/* Total Encontrado */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderLeft: '4px solid #5568d3',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eceffb',
                  borderRadius: 6,
                }}
              >
                <FileTextOutlined style={{ fontSize: 24, color: '#5568d3' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: '#14212b' }}>
                  {result.total}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#44525e' }}>
                  Total encontrado
                </span>
              </div>
            </div>

            {/* Audiometrias */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderLeft: '4px solid #1890ff',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e6f7ff',
                  borderRadius: 6,
                }}
              >
                <AudioOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: '#14212b' }}>
                  {totalAudio}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#44525e' }}>
                  Audiometrias (pág.)
                </span>
              </div>
            </div>

            {/* Imitanciometrias */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderLeft: '4px solid #722ed1',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9f0ff',
                  borderRadius: 6,
                }}
              >
                <SoundOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: '#14212b' }}>
                  {totalImitan}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#44525e' }}>
                  Imitanciometrias (pág.)
                </span>
              </div>
            </div>
          </section>

          {/* Tabela de Resultados */}
          <section
            aria-label="Resultados da consulta de exames"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d5dce3',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <div style={{ minWidth: 1040 }}>
                {/* Header da Tabela */}
                <div
                  style={{
                    display: 'grid',
                    minHeight: 56,
                    alignItems: 'center',
                    gridTemplateColumns: '90px 110px 120px minmax(200px, 1.4fr) 150px 130px 160px 80px 140px',
                    gap: 14,
                    padding: '0 24px',
                    backgroundColor: '#eceffb',
                    borderBottom: '2px solid #d5dce3',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#14212b',
                  }}
                >
                  <span>Exame</span>
                  <span>Prontuário</span>
                  <span>Atendimento</span>
                  <span>Paciente</span>
                  <span>Tipo</span>
                  <span>Status</span>
                  <span>Data</span>
                  <span style={{ textAlign: 'center' }}>Laudos</span>
                  <span style={{ textAlign: 'center' }}>Ações</span>
                </div>

                {/* Linhas da Tabela */}
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
                    <span style={{ fontSize: 16, color: '#44525e' }}>Carregando exames...</span>
                  </div>
                ) : (
                  result.items.map(row => {
                    const isAudio = row.ds_tipo === 'AUDIOMETRIA'
                    const isFinalizado = row.ds_status === 'FINALIZADO'

                    return (
                      <div
                        key={row.id_exame}
                        style={{
                          display: 'grid',
                          minHeight: 74,
                          alignItems: 'center',
                          gridTemplateColumns: '90px 110px 120px minmax(200px, 1.4fr) 150px 130px 160px 80px 140px',
                          gap: 14,
                          padding: '12px 24px',
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
                        {/* Exame ID */}
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#6e7c89' }}>
                          #{row.id_exame}
                        </span>

                        {/* Prontuário */}
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#14212b' }}>
                          {row.id_paciente}
                        </span>

                        {/* Atendimento */}
                        <span style={{ fontSize: 15, color: '#14212b' }}>
                          {row.id_atendimento ?? '—'}
                        </span>

                        {/* Paciente */}
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#14212b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.nm_paciente ?? '—'}
                        </span>

                        {/* Tipo de Exame Pill */}
                        <div>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              minHeight: 28,
                              padding: '0 10px',
                              backgroundColor: isAudio ? '#e6f7ff' : '#f9f0ff',
                              borderRadius: 9999,
                              fontSize: 13,
                              fontWeight: 700,
                              color: isAudio ? '#096dd9' : '#531dab',
                            }}
                          >
                            {isAudio ? <AudioOutlined /> : <SoundOutlined />}
                            <span>{isAudio ? 'Audiometria' : 'Imitanciometria'}</span>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <div>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              minHeight: 28,
                              padding: '0 10px',
                              backgroundColor: isFinalizado ? '#e4f3e9' : '#eceffb',
                              borderRadius: 9999,
                              fontSize: 13,
                              fontWeight: 700,
                              color: isFinalizado ? '#1b6b3a' : '#5568d3',
                            }}
                          >
                            {isFinalizado ? <CheckCircleOutlined /> : <EditOutlined />}
                            <span>{isFinalizado ? 'Finalizado' : 'Rascunho'}</span>
                          </div>
                        </div>

                        {/* Data */}
                        <span style={{ fontSize: 14, color: '#14212b' }}>
                          {row.dt_exame ? dayjs(row.dt_exame).format('DD/MM/YYYY HH:mm') : '—'}
                        </span>

                        {/* Laudos */}
                        <div style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 13,
                              fontWeight: 700,
                              backgroundColor: row.nr_laudos > 0 ? '#e4f3e9' : '#f3f5f7',
                              color: row.nr_laudos > 0 ? '#1b6b3a' : '#6e7c89',
                            }}
                          >
                            {row.nr_laudos}
                          </span>
                        </div>

                        {/* Ações */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {/* Visualizar Exame */}
                          <Tooltip title="Visualizar exame">
                            <button
                              type="button"
                              onClick={() => handleView(row)}
                              disabled={!row.id_atendimento}
                              aria-label={`Visualizar exame de ${row.nm_paciente}`}
                              style={{
                                display: 'inline-flex',
                                width: 36,
                                height: 36,
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #d5dce3',
                                borderRadius: 6,
                                backgroundColor: '#ffffff',
                                color: !row.id_atendimento ? '#8c9ba5' : '#5568d3',
                                cursor: !row.id_atendimento ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => {
                                if (row.id_atendimento) {
                                  e.currentTarget.style.backgroundColor = '#eceffb'
                                  e.currentTarget.style.borderColor = '#5568d3'
                                }
                              }}
                              onMouseLeave={e => {
                                if (row.id_atendimento) {
                                  e.currentTarget.style.backgroundColor = '#ffffff'
                                  e.currentTarget.style.borderColor = '#d5dce3'
                                }
                              }}
                            >
                              <EyeOutlined style={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>

                          {/* Reimprimir Laudo */}
                          <Tooltip title={row.nr_laudos > 0 ? 'Reimprimir laudo' : 'Sem laudo gerado'}>
                            <button
                              type="button"
                              onClick={() => handleReprint(row)}
                              disabled={row.nr_laudos === 0 || downloading === row.id_exame}
                              aria-label={`Reimprimir laudo de ${row.nm_paciente}`}
                              style={{
                                display: 'inline-flex',
                                width: 36,
                                height: 36,
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #d5dce3',
                                borderRadius: 6,
                                backgroundColor: '#ffffff',
                                color: row.nr_laudos === 0 ? '#8c9ba5' : '#b3261e',
                                cursor: row.nr_laudos === 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => {
                                if (row.nr_laudos > 0) {
                                  e.currentTarget.style.backgroundColor = '#fbe9e7'
                                  e.currentTarget.style.borderColor = '#b3261e'
                                }
                              }}
                              onMouseLeave={e => {
                                if (row.nr_laudos > 0) {
                                  e.currentTarget.style.backgroundColor = '#ffffff'
                                  e.currentTarget.style.borderColor = '#d5dce3'
                                }
                              }}
                            >
                              <FilePdfOutlined style={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Paginação Inteligente */}
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
              {/* Informações e Seletor de Tamanho */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, color: '#44525e', fontWeight: 600 }}>
                  {totalItems === 0
                    ? 'Nenhum exame encontrado'
                    : `Mostrando ${startIndex + 1} a ${endIndex} de ${totalItems} exames`}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#44525e' }}>
                  <label htmlFor="consulta-page-size-select">Exibir:</label>
                  <select
                    id="consulta-page-size-select"
                    value={pageSize}
                    onChange={e => {
                      const newSize = Number(e.target.value)
                      setPageSize(newSize)
                      handleSearch(1, newSize)
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
                aria-label="Navegação da paginação de exames"
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
                    disabled={pageIndex <= 1 || loading}
                    onClick={() => handleSearch(1)}
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
                  disabled={pageIndex <= 1 || loading}
                  onClick={() => handleSearch(Math.max(1, pageIndex - 1))}
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

                {/* Itens com Janela Inteligente */}
                {getPaginationItems().map((item, idx) => {
                  if (item.type === 'ellipsis') {
                    const isPrev = item.direction === 'prev'
                    return (
                      <button
                        key={`ellipsis-${item.direction}-${idx}`}
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (isPrev) {
                            handleSearch(Math.max(1, pageIndex - 5))
                          } else {
                            handleSearch(Math.min(totalPages, pageIndex + 5))
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
                      disabled={loading}
                      onClick={() => handleSearch(item.page)}
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
                  disabled={pageIndex >= totalPages || loading}
                  onClick={() => handleSearch(Math.min(totalPages, pageIndex + 1))}
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
                    disabled={pageIndex >= totalPages || loading}
                    onClick={() => handleSearch(totalPages)}
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
                          const p = Number(jumpInput)
                          if (p >= 1 && p <= totalPages) {
                            handleSearch(p)
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
                      disabled={loading}
                      onClick={() => {
                        const p = Number(jumpInput)
                        if (p >= 1 && p <= totalPages) {
                          handleSearch(p)
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
        </>
      )}

      {/* Modal de Exame */}
      <ExameModal
        open={modalOpen}
        tipo={modalTipo}
        nmPaciente={modalPaciente?.nome ?? null}
        cdPaciente={modalPaciente?.id ?? null}
        cdAtendimento={modalPaciente?.atendimento ?? null}
        onClose={() => setModalOpen(false)}
      />
    </main>
  )
}
