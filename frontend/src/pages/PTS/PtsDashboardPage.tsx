import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, Space, Input, Tooltip } from 'antd'
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  EditOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PrinterOutlined
} from '@ant-design/icons'
import { getPTSDashboardStats, getPTSDashboardReport, getPTSById } from '@/api/ptsService'
import { useNavigate } from 'react-router-dom'
import { Modal, Spin, Divider } from 'antd'
import PTSPrintView from './PTSPrintView'
import { Area } from './data/listas'
import { criarObjetivosIniciais } from './ObjetivosEspecialidades'

const { Title, Text } = Typography

export default function PtsDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_pts: 0, finalizados: 0, em_rascunho: 0, cancelados: 0 })
  const [report, setReport] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')
  
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
        getPTSDashboardReport()
      ])
      setStats(s)
      setReport(r)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = report.filter(item => 
    item.nm_paciente.toLowerCase().includes(searchText.toLowerCase()) ||
    item.cd_paciente.includes(searchText) ||
    item.nm_usuario.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleOpenPreview = async (record: any, full = false) => {
    setPreviewVisible(true)
    setPreviewLoading(true)
    setIsPreviewFull(full)
    try {
      const d = await getPTSById(record.id_pts)
      
      // Mapeia os dados do banco para o formato esperado pelo PTSPrintView
      const toRows = (arr: string[]) => arr.map((v, i) => ({ key: i + 1, diagnostico: v }))
      
      const printData = {
        paciente: {
          nm_paciente: record.nm_paciente,
          cd_paciente: record.cd_paciente,
          cd_atendimento: record.nr_atendimento
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
          nm_usuario: record.nm_usuario, // Usamos o que veio do report para garantir o autor original
          nm_tip_presta: d.usuario_especialidade,
          ds_conselho: d.usuario_conselho,
          ds_codigo_conselho: d.usuario_nr_conselho
        },
        id_pts: record.id_pts,
        fl_finalizado: record.fl_finalizado
      }
      
      setCurrentPtsData(printData)
    } catch (error) {
      console.error('Erro ao buscar detalhes do PTS:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleEditFromPreview = () => {
    if (!currentPtsData) return
    const record = report.find(r => r.id_pts === currentPtsData.id_pts) || currentPtsData
    navigate('/pts', { 
      state: { 
        nm_paciente: currentPtsData.paciente.nm_paciente,
        cd_paciente: currentPtsData.paciente.cd_paciente,
        cd_atendimento: currentPtsData.paciente.cd_atendimento,
        id_pts: currentPtsData.id_pts,
        fl_finalizado: currentPtsData.fl_finalizado
      } 
    })
  }

  const handlePrintFromPreview = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    // Pegamos os estilos da página atual para aplicar no print
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')
        } catch (e) {
          return ''
        }
      }).join('')

    const content = document.getElementById('pts-preview-content')?.innerHTML

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão PTS - ${currentPtsData.paciente.nm_paciente}</title>
          <style>
            ${styles}
            @media print {
              .no-print { display: none; }
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

  const columns = [
    {
      title: 'Paciente',
      dataIndex: 'nm_paciente',
      key: 'nm_paciente',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Cód: {record.cd_paciente}</Text>
        </Space>
      )
    },
    {
      title: 'Vigência',
      dataIndex: 'ds_vigencia',
      key: 'ds_vigencia',
      width: 100,
    },
    {
      title: 'Responsável',
      dataIndex: 'nm_usuario',
      key: 'nm_usuario',
    },
    {
      title: 'Terapias Indicadas',
      dataIndex: 'terapias',
      key: 'terapias',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text || '—'}</Tooltip>
    },
    {
      title: 'PTS Completo',
      key: 'completo',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Button 
          icon={<FileTextOutlined />} 
          type="primary"
          ghost
          size="small"
          onClick={() => handleOpenPreview(record, true)}
        >
          Ver Tudo
        </Button>
      )
    },
    {
      title: 'Status',
      dataIndex: 'fl_finalizado',
      key: 'fl_finalizado',
      width: 120,
      render: (val: number) => (
        val === 1 
          ? <Tag color="success" icon={<CheckCircleOutlined />}>Finalizado</Tag>
          : <Tag color="processing" icon={<EditOutlined />}>Rascunho</Tag>
      )
    },
    {
      title: 'Imprimir',
      key: 'acoes',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Button 
          icon={<PrinterOutlined />} 
          type="text" 
          onClick={() => handleOpenPreview(record, false)}
          disabled={record.fl_finalizado !== 1}
          title={record.fl_finalizado !== 1 ? "Disponível apenas para PTS finalizado" : "Visualizar impressão"}
        />
      )
    }
  ]

  return (
    <div style={{ padding: '0 8px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={1} style={{ margin: 0 }}>Dashboard PTS</Title>
          <Text type="secondary">Monitoramento de Projetos Terapêuticos Singulares</Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Atualizar</Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic 
              title="Total de PTS" 
              value={stats.total_pts} 
              prefix={<FileTextOutlined />} 
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic 
              title="Finalizados" 
              value={stats.finalizados} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic 
              title="Em Rascunho" 
              value={stats.em_rascunho} 
              prefix={<EditOutlined />} 
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <Statistic 
              title="Cancelados" 
              value={stats.cancelados} 
              prefix={<CloseCircleOutlined />} 
              valueStyle={{ color: '#ff4d4f' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless">
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Buscar por paciente ou responsável..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id_pts"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* Modal de Visualização Rápida (Preview Estilo PDF) */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '95%' }}>
            <span>{isPreviewFull ? 'Visualização Completa (Tudo)' : 'Visualização de Impressão (Resumida)'}</span>
            <Space>
              <Button icon={<PrinterOutlined />} onClick={handlePrintFromPreview} disabled={previewLoading || !currentPtsData}>
                Imprimir
              </Button>
            </Space>
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
        destroyOnHidden
      >
        <div style={{ minHeight: 400, background: '#f5f5f5', padding: '20px', borderRadius: 8 }}>
          {previewLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
              <Spin size="large" />
              <Text style={{ marginTop: 16 }}>Carregando documento...</Text>
            </div>
          ) : currentPtsData ? (
            <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 850, margin: '0 auto' }}>
              <div id="pts-preview-content">
                <PTSPrintView data={currentPtsData} full={isPreviewFull} />
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">Não foi possível carregar os dados do documento.</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
