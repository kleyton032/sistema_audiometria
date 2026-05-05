import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, Space, Input, Tooltip } from 'antd'
import { 
  FileTextOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { getPTSDashboardStats, getPTSDashboardReport } from '@/api/ptsService'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function PtsDashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_pts: 0, finalizados: 0, em_rascunho: 0, cancelados: 0 })
  const [report, setReport] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')

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
      title: 'Objetivos Atuais',
      dataIndex: 'objetivos',
      key: 'objetivos',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}>{text || '—'}</Tooltip>
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
      title: 'Ações',
      key: 'acoes',
      width: 80,
      render: (_: any, record: any) => (
        <Button 
          icon={<EyeOutlined />} 
          type="text" 
          onClick={() => navigate('/pts', { 
            state: { 
              nm_paciente: record.nm_paciente,
              cd_paciente: record.cd_paciente,
              cd_atendimento: record.nr_atendimento,
              id_pts: record.id_pts,
              fl_finalizado: record.fl_finalizado
            } 
          })}
        />
      )
    }
  ]

  return (
    <div style={{ padding: '0 8px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={1} style={{ margin: 0 }}>Dashboard PTS</Title>
          <Text type="secondary">Monitoramento de Programas Terapêuticos Singulares</Text>
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
    </div>
  )
}
