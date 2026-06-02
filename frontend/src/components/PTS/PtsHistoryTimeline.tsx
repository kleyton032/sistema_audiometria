import React, { useEffect, useState } from 'react'
import { Timeline, Card, Tag, Typography, Spin, Empty, Row, Col, Divider, Space } from 'antd'
import { ClockCircleOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { getPTSHistoricoPaciente, PtsHistoricoSummaryOut } from '../../api/ptsService'

const { Title, Text, Paragraph } = Typography

interface PtsHistoryTimelineProps {
  cdPaciente: string
}

export const PtsHistoryTimeline: React.FC<PtsHistoryTimelineProps> = ({ cdPaciente }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PtsHistoricoSummaryOut | null>(null)

  useEffect(() => {
    if (cdPaciente) {
      loadHistory()
    }
  }, [cdPaciente])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const result = await getPTSHistoricoPaciente(cdPaciente)
      setData(result)
    } catch (error) {
      console.error('Erro ao carregar histórico de PTS:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string | null) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes('conclu')) return <Tag color="success" icon={<CheckCircleOutlined />}>{status}</Tag>;
    if (s.includes('mantid')) return <Tag color="processing" icon={<SyncOutlined />}>{status}</Tag>;
    if (s.includes('cancel')) return <Tag color="error" icon={<CloseCircleOutlined />}>{status}</Tag>;
    if (s.includes('reformul')) return <Tag color="warning" icon={<SyncOutlined spin />}>{status}</Tag>;
    return <Tag color="default" icon={<MinusCircleOutlined />}>{status}</Tag>;
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Carregando histórico longitudinal..." /></div>
  }

  if (!data || data.historico.length === 0) {
    return <Empty description="Nenhum histórico de PTS encontrado para este paciente." />
  }

  return (
    <div className="pts-history-container" style={{ padding: '16px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff', borderColor: '#adc6ff' }}>
            <Title level={3} style={{ margin: 0, color: '#1d39c4' }}>{data.total_pts}</Title>
            <Text type="secondary">Total de PTS</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Title level={4} style={{ margin: 0, color: '#389e0d', marginTop: '4px' }}>{data.primeiro_pts_data || '-'}</Title>
            <Text type="secondary">Primeiro PTS</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff', borderColor: '#91d5ff' }}>
            <Title level={4} style={{ margin: 0, color: '#096dd9', marginTop: '4px' }}>{data.ultimo_pts_data || '-'}</Title>
            <Text type="secondary">Último PTS</Text>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Evolução Longitudinal</Divider>

      <Timeline
        mode="left"
        items={data.historico.map((pts, index) => ({
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
              style={{ marginBottom: '16px', boxShadow: '0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12)' }}
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
    </div>
  )
}
