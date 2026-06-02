import React, { useState, useMemo } from 'react'
import { Card, Typography, Input, Button, Space, Divider, App, Spin, Row, Col, Select, DatePicker, Checkbox, Tabs, Tag, Timeline, Empty } from 'antd'
import { SearchOutlined, HistoryOutlined, PrinterOutlined, DownloadOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, MinusCircleOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined, AimOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { getPTSHistoricoPaciente, PtsHistoricoSummaryOut, PtsHistoricoItemOut, PtsHistoricoObjetivoOut } from '../../api/ptsService'

dayjs.extend(isBetween)

const { Title, Text } = Typography
const { Search } = Input
const { RangePicker } = DatePicker

// Componente visual para status com as cores exigidas
const getStatusTag = (status: string | null) => {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s.includes('conclu') || s.includes('alcan')) return <Tag color="success" icon={<CheckCircleOutlined />}>{status}</Tag>;
  if (s.includes('parcial') || s.includes('mantid') || s.includes('acompanha')) return <Tag color="processing" icon={<SyncOutlined />}>{status}</Tag>;
  if (s.includes('cancel')) return <Tag color="default" icon={<CloseCircleOutlined />}>{status}</Tag>;
  if (s.includes('não alcan')) return <Tag color="error" icon={<CloseCircleOutlined />}>{status}</Tag>;
  if (s.includes('reformul')) return <Tag color="warning" icon={<SyncOutlined spin />}>{status}</Tag>;
  return <Tag color="blue" icon={<MinusCircleOutlined />}>{status}</Tag>;
}

export default function PtsHistoricoPage() {
  const { notification } = App.useApp()
  const [cdPacienteBusca, setCdPacienteBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PtsHistoricoSummaryOut | null>(null)

  // Filtros
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedProfs, setSelectedProfs] = useState<string[]>([])
  const [selectedEsps, setSelectedEsps] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')

  const handleSearch = async (value: string) => {
    const cleanValue = value.trim()
    if (!cleanValue) {
      notification.warning({ message: 'Campo vazio', description: 'Por favor, digite o código do paciente ou prontuário.' })
      return
    }
    setLoading(true)
    setData(null)
    // Reseta filtros
    setDateRange(null)
    setSelectedProfs([])
    setSelectedEsps([])
    setSelectedStatus([])
    setSearchText('')

    try {
      const result = await getPTSHistoricoPaciente(cleanValue)
      setData(result)
      if (result.historico.length === 0) {
        notification.info({ message: 'Sem registros', description: 'Nenhum Projeto Terapêutico Singular foi encontrado para este paciente.' })
      }
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error)
      notification.error({ 
        message: 'Erro na consulta', 
        description: 'Não foi possível consultar o histórico neste momento. Tente novamente mais tarde.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Opções para os filtros derivadas dos dados originais
  const profOptions = useMemo(() => {
    if (!data) return []
    const profs = new Set(data.historico.map(h => h.nm_usuario))
    return Array.from(profs).map(p => ({ label: p, value: p }))
  }, [data])

  const espOptions = useMemo(() => {
    if (!data) return []
    const esps = new Set<string>()
    data.historico.forEach(h => h.objetivos.forEach(o => esps.add(o.ds_especialidade)))
    return Array.from(esps).map(e => ({ label: e, value: e }))
  }, [data])

  const statusOptions = useMemo(() => {
    if (!data) return []
    const st = new Set<string>()
    data.historico.forEach(h => h.objetivos.forEach(o => { if (o.ds_status) st.add(o.ds_status) }))
    return Array.from(st).map(s => ({ label: s, value: s }))
  }, [data])

  // Aplicação dos filtros
  const filteredHistorico = useMemo(() => {
    if (!data) return []
    return data.historico.map(pts => {
      // Filtro de data do PTS
      if (dateRange && dateRange[0] && dateRange[1]) {
        const ptsDate = dayjs(pts.dt_criacao, 'DD/MM/YYYY')
        if (!ptsDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) return null
      }
      // Filtro de profissional
      if (selectedProfs.length > 0 && !selectedProfs.includes(pts.nm_usuario)) return null

      // Filtra os objetivos dentro do PTS
      const filteredObjs = pts.objetivos.filter(obj => {
        if (selectedEsps.length > 0 && !selectedEsps.includes(obj.ds_especialidade)) return false
        if (selectedStatus.length > 0 && obj.ds_status && !selectedStatus.includes(obj.ds_status)) return false
        if (searchText) {
          const textMatch = obj.ds_objetivo?.toLowerCase().includes(searchText.toLowerCase())
          if (!textMatch) return false
        }
        return true
      })

      // Se filtrou por algo relacionado a objetivos e não sobrou nada, e nós de fato aplicamos um filtro de objetivo, então o PTS todo não aparece.
      const aplicouFiltroObj = selectedEsps.length > 0 || selectedStatus.length > 0 || searchText !== ''
      if (aplicouFiltroObj && filteredObjs.length === 0) return null

      return { ...pts, objetivos: filteredObjs }
    }).filter(Boolean) as PtsHistoricoItemOut[]
  }, [data, dateRange, selectedProfs, selectedEsps, selectedStatus, searchText])

  // Indicadores
  const metrics = useMemo(() => {
    let totalObjs = 0
    let successObjs = 0
    let pendingObjs = 0
    const profs = new Set<string>()
    const esps = new Set<string>()

    filteredHistorico.forEach(pts => {
      profs.add(pts.nm_usuario)
      pts.objetivos.forEach(obj => {
        totalObjs++
        esps.add(obj.ds_especialidade)
        const s = obj.ds_status?.toLowerCase() || ''
        if (s.includes('conclu') || s.includes('alcan')) successObjs++
        if (s.includes('parcial') || s.includes('mantid') || s.includes('acompanha')) pendingObjs++
      })
    })

    const successRate = totalObjs > 0 ? Math.round((successObjs / totalObjs) * 100) : 0
    return { totalObjs, successRate, pendingObjs, numProfs: profs.size, numEsps: esps.size }
  }, [filteredHistorico])

  // Agrupamento Inteligente
  const smartHistory = useMemo(() => {
    // Chave: ds_objetivo normalizado -> Array de ocorrências cronológicas (asc)
    const grouped: Record<string, { esp: string, evols: { pts: PtsHistoricoItemOut, obj: PtsHistoricoObjetivoOut }[] }> = {}
    
    // Iterar do mais antigo para o mais novo
    const reversed = [...filteredHistorico].reverse()
    reversed.forEach(pts => {
      pts.objetivos.forEach(obj => {
        const text = (obj.ds_objetivo || '').trim()
        if (!text) return
        const key = text.toLowerCase() // correspondência exata case insensitive
        
        if (!grouped[key]) {
          grouped[key] = { esp: obj.ds_especialidade, evols: [] }
        }
        grouped[key].evols.push({ pts, obj })
      })
    })
    
    return Object.entries(grouped).map(([key, data]) => ({
      texto: data.evols[0].obj.ds_objetivo || key, // Pega com a capitalização original
      esp: data.esp,
      evols: data.evols
    }))
  }, [filteredHistorico])

  // Consolidação por Terapeuta
  const consolidated = useMemo(() => {
    const cons: Record<string, { totalPts: number, ptsSet: Set<number>, totalObjs: number, successObjs: number, partialObjs: number, failObjs: number }> = {}
    
    filteredHistorico.forEach(pts => {
      pts.objetivos.forEach(obj => {
        const key = `${obj.ds_especialidade} - ${pts.nm_usuario}`
        if (!cons[key]) {
          cons[key] = { totalPts: 0, ptsSet: new Set(), totalObjs: 0, successObjs: 0, partialObjs: 0, failObjs: 0 }
        }
        cons[key].ptsSet.add(pts.id_pts)
        cons[key].totalObjs++
        
        const s = obj.ds_status?.toLowerCase() || ''
        if (s.includes('conclu') || s.includes('alcan')) cons[key].successObjs++
        else if (s.includes('parcial') || s.includes('mantid') || s.includes('acompanha')) cons[key].partialObjs++
        else if (s.includes('não alcan') || s.includes('cancel')) cons[key].failObjs++
      })
    })

    return Object.entries(cons).map(([key, stats]) => ({
      label: key,
      ...stats,
      totalPts: stats.ptsSet.size
    })).sort((a, b) => a.label.localeCompare(b.label))
  }, [filteredHistorico])

  const handleExportCSV = () => {
    if (filteredHistorico.length === 0) return
    // Usar ponto e vírgula como delimitador para o Excel português e adicionar BOM para UTF-8
    let csv = '\uFEFF' // BOM para forçar UTF-8 no Excel
    csv += 'ID_PTS;Data;Vigência;Profissional;Especialidade;Objetivo;Status;Motivo\n'
    
    const escapeCell = (text: string | null | undefined) => {
      if (!text) return '""';
      // Escapa aspas duplas dobrando-as e envolve todo o texto em aspas
      return `"${text.replace(/"/g, '""')}"`;
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
          escapeCell(obj.ds_motivo)
        ]
        csv += row.join(';') + '\n'
      })
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `historico_pts_paciente.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ padding: '0 8px' }} className="pts-history-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .pts-history-page { background: white !important; }
        }
      `}</style>

      <Title level={1} className="no-print">Consulta de Histórico</Title>
      
      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} className="no-print">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              <HistoryOutlined style={{ marginRight: 8, color: '#667eea' }} />
              Buscar Histórico de Paciente
            </Text>
            <p style={{ color: '#8c8c8c', marginTop: 4, marginBottom: 16 }}>
              Digite o código ou prontuário do paciente para visualizar todo o seu histórico evolutivo de Projeto Terapêutico Singular.
            </p>
            <Space style={{ marginBottom: 24 }}>
              <Search
                placeholder="Código do paciente ou prontuário (ex: 12345)"
                allowClear
                enterButton={<><SearchOutlined /> Buscar Prontuário</>}
                size="large"
                onSearch={handleSearch}
                value={cdPacienteBusca}
                onChange={(e) => setCdPacienteBusca(e.target.value)}
                style={{ width: 400 }}
              />
              {data && (
                <>
                  <Button icon={<DownloadOutlined />} size="large" onClick={handleExportCSV}>Exportar CSV</Button>
                  <Button icon={<PrinterOutlined />} size="large" onClick={handlePrint}>Imprimir (PDF)</Button>
                </>
              )}
            </Space>

            <Divider style={{ margin: '0 0 16px 0' }} />

            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={6}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>Período do PTS</Text>
                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" value={dateRange as any} onChange={v => setDateRange(v as any)} />
              </Col>
              <Col xs={24} md={6}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>Profissional</Text>
                <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder={data ? "Todos" : "Aguardando paciente..."} disabled={!data} options={profOptions} value={selectedProfs} onChange={setSelectedProfs} />
              </Col>
              <Col xs={24} md={6}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>Especialidade</Text>
                <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder={data ? "Todas" : "Aguardando paciente..."} disabled={!data} options={espOptions} value={selectedEsps} onChange={setSelectedEsps} />
              </Col>
              <Col xs={24} md={6}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>Status do Objetivo</Text>
                <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder={data ? "Todos" : "Aguardando paciente..."} disabled={!data} options={statusOptions} value={selectedStatus} onChange={setSelectedStatus} />
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>Pesquisar Objetivo</Text>
                <Input placeholder="Palavra-chave (ex: Marcha)" allowClear value={searchText} onChange={e => setSearchText(e.target.value)} prefix={<SearchOutlined />} />
              </Col>
            </Row>
          </div>
        </Space>
      </Card>

      {loading && <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Carregando histórico e analisando dados evolutivos..." /></div>}

      {data && !loading && (
        <>
          {/* Indicadores Resumidos */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ textAlign: 'center', borderColor: '#d9d9d9', height: '100%' }}>
                <Title level={2} style={{ margin: 0, color: '#434343' }}>{metrics.totalObjs}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Objetivos Totais</Text>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ textAlign: 'center', borderColor: '#b7eb8f', background: '#f6ffed', height: '100%' }}>
                <Title level={2} style={{ margin: 0, color: '#389e0d' }}>{metrics.successRate}%</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Taxa de Sucesso</Text>
              </Card>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Card size="small" style={{ textAlign: 'center', borderColor: '#ffd591', background: '#fff7e6', height: '100%' }}>
                <Title level={2} style={{ margin: 0, color: '#d46b08' }}>{metrics.pendingObjs}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Objetivos Pendentes</Text>
              </Card>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Card size="small" style={{ textAlign: 'center', borderColor: '#91d5ff', background: '#e6f7ff', height: '100%' }}>
                <Title level={2} style={{ margin: 0, color: '#096dd9' }}>{metrics.numProfs}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Profissionais Envolvidos</Text>
              </Card>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Card size="small" style={{ textAlign: 'center', borderColor: '#d3adf7', background: '#f9f0ff', height: '100%' }}>
                <Title level={2} style={{ margin: 0, color: '#531dab' }}>{metrics.numEsps}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Especialidades Diferentes</Text>
              </Card>
            </Col>
          </Row>

          <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {filteredHistorico.length === 0 ? (
              <Empty description="Nenhum dado encontrado para os filtros selecionados." />
            ) : (
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: '1',
                    label: <><ClockCircleOutlined /> Timeline Convencional</>,
                    children: (
                      <Timeline
                        mode="left"
                        items={filteredHistorico.map((pts, index) => ({
                          color: pts.fl_finalizado ? 'green' : 'blue',
                          dot: index === 0 ? <ClockCircleOutlined style={{ fontSize: '16px' }} /> : undefined,
                          children: (
                            <Card 
                              size="small" 
                              title={
                                <Space>
                                  <CalendarOutlined /> 
                                  {pts.dt_criacao} 
                                  <Tag color="cyan" style={{ marginLeft: 8 }}>Vigência: {pts.ds_vigencia}</Tag>
                                  {!pts.fl_finalizado && <Tag color="orange">Rascunho</Tag>}
                                </Space>
                              }
                              extra={<Text type="secondary"><UserOutlined /> {pts.nm_usuario}</Text>}
                              style={{ marginBottom: '16px', boxShadow: '0 1px 2px -2px rgba(0,0,0,0.16)' }}
                            >
                              {pts.objetivos.length > 0 ? (
                                Object.entries(
                                  pts.objetivos.reduce((acc, obj) => {
                                    const esp = obj.ds_especialidade || 'Outros'
                                    if (!acc[esp]) acc[esp] = []
                                    acc[esp].push(obj)
                                    return acc
                                  }, {} as Record<string, typeof pts.objetivos>)
                                ).map(([esp, objetivos]) => (
                                  <div key={esp} style={{ marginBottom: '12px' }}>
                                    <Text strong style={{ color: '#595959' }}>{esp}</Text>
                                    <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                                      {objetivos.map((obj) => (
                                        <li key={obj.id_objetivo} style={{ marginBottom: '8px' }}>
                                          <Text>{obj.ds_objetivo}</Text>
                                          <div style={{ marginTop: '4px' }}>
                                            {getStatusTag(obj.ds_status)}
                                            {obj.ds_motivo && <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>- {obj.ds_motivo}</Text>}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))
                              ) : (
                                <Text type="secondary" italic>Nenhum objetivo registrado.</Text>
                              )}
                            </Card>
                          )
                        }))}
                      />
                    )
                  },
                  {
                    key: '2',
                    label: <><AimOutlined /> Evolução Inteligente</>,
                    children: (
                      <div>
                        <p style={{ color: '#8c8c8c', marginBottom: 24 }}>
                          Acompanhe a trajetória de cada objetivo repetido ao longo das vigências.
                        </p>
                        {smartHistory.map((sh, i) => (
                          <Card size="small" key={i} style={{ marginBottom: 16, borderLeft: '4px solid #667eea' }}>
                            <Title level={5} style={{ margin: 0 }}>{sh.texto}</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Especialidade: {sh.esp}</Text>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                              {sh.evols.map((e, idx) => (
                                <React.Fragment key={idx}>
                                  <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 6, minWidth: 150 }}>
                                    <Text strong style={{ fontSize: 12, display: 'block' }}>{e.pts.dt_criacao}</Text>
                                    <div style={{ marginTop: 4 }}>{getStatusTag(e.obj.ds_status)}</div>
                                  </div>
                                  {idx < sh.evols.length - 1 && <span style={{ color: '#bfbfbf', fontWeight: 'bold' }}>→</span>}
                                </React.Fragment>
                              ))}
                            </div>
                            {sh.evols.length > 1 && (
                              <Tag color="purple" style={{ marginTop: 12 }}>
                                Evolução rastreada em {sh.evols.length} PTS consecutivos/repetidos
                              </Tag>
                            )}
                          </Card>
                        ))}
                      </div>
                    )
                  },
                  {
                    key: '3',
                    label: <><UserOutlined /> Consolidado por Terapeuta</>,
                    children: (
                      <Row gutter={[16, 16]}>
                        {consolidated.map((c, i) => (
                          <Col xs={24} md={12} key={i}>
                            <Card size="small" title={<Text strong>{c.label}</Text>} style={{ height: '100%' }}>
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                <li><strong>{c.totalPts}</strong> PTS realizados</li>
                                <li><strong>{c.totalObjs}</strong> objetivos cadastrados</li>
                                <li><Text type="success">{c.successObjs}</Text> alcançados</li>
                                <li><Text type="warning">{c.partialObjs}</Text> parciais/mantidos</li>
                                <li><Text type="danger">{c.failObjs}</Text> não alcançados/cancelados</li>
                              </ul>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )
                  }
                ]}
              />
            )}
          </Card>
        </>
      )}
    </div>
  )
}
