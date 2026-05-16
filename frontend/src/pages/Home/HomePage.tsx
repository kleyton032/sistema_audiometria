import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, Button, Space, Divider, Alert, Spin } from 'antd'
import { 
  FileTextOutlined, 
  SoundOutlined, 
  WarningOutlined, 
  PlusOutlined, 
  TeamOutlined, 
  FileSearchOutlined 
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getHomeStats, type HomeStats } from '../../api/homeService'
import { useAuth } from '@/contexts'

const { Title, Text } = Typography

export default function HomePage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [stats, setStats] = useState<HomeStats>({
    resumo_mes: { pts_finalizados: 0, exames_realizados: 0 },
    pendencias: { pts_rascunho: 0, exames_pendentes: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHomeStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const totalPendencias = stats.pendencias.pts_rascunho + stats.pendencias.exames_pendentes

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Olá, {usuario?.nm_usuario?.split(' ')[0]} 👋
        </Title>
        <Text type="secondary">Aqui está o resumo do seu dia e produtividade do mês.</Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {/* Seção 1: Pendências (O Foco principal) */}
          <Col xs={24} lg={16}>
            <Card 
              title={<span><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} /> Minhas Pendências</span>}
              variant="borderless"
              style={{ height: '100%' }}
            >
              {totalPendencias === 0 ? (
                <Alert 
                  message="Tudo em dia!" 
                  description="Você não possui pendências ou rascunhos no momento. Ótimo trabalho!" 
                  type="success" 
                  showIcon 
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {stats.pendencias.pts_rascunho > 0 && (
                    <Alert
                      message={`${stats.pendencias.pts_rascunho} PTS em Rascunho`}
                      description="Existem Projetos Terapêuticos Singulares que foram salvos mas ainda não finalizados."
                      type="warning"
                      showIcon
                      action={
                        <Button size="small" type="primary" ghost onClick={() => navigate('/pts/pacientes')}>
                          Ver Pacientes
                        </Button>
                      }
                    />
                  )}
                  {stats.pendencias.exames_pendentes > 0 && (
                    <Alert
                      message={`${stats.pendencias.exames_pendentes} Exames aguardando Laudo`}
                      description="Existem exames criados que ainda não possuem laudo ou não foram finalizados."
                      type="warning"
                      showIcon
                      action={
                        <Button size="small" type="primary" ghost onClick={() => navigate('/pacientes')}>
                          Ir para Exames
                        </Button>
                      }
                    />
                  )}
                </Space>
              )}
            </Card>
          </Col>

          {/* Seção 2: Ações Rápidas */}
          <Col xs={24} lg={8}>
            <Card title="Ações Rápidas" variant="borderless" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  block 
                  icon={<TeamOutlined />} 
                  onClick={() => navigate('/pts/pacientes')}
                  size="large"
                >
                  Buscar Paciente p/ PTS
                </Button>
                <Button 
                  block 
                  icon={<TeamOutlined />} 
                  onClick={() => navigate('/pacientes')}
                  size="large"
                >
                  Buscar Paciente p/ Exame
                </Button>
                <Button 
                  block 
                  icon={<FileSearchOutlined />} 
                  onClick={() => navigate('/consulta')}
                  size="large"
                >
                  Consultar Laudos
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">Produtividade Mensal</Divider>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card variant="borderless">
              <Statistic
                title="PTS Elaborados/Revisados (Mês atual)"
                value={stats.resumo_mes.pts_finalizados}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#667eea' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card variant="borderless">
              <Statistic
                title="Exames Realizados (Mês atual)"
                value={stats.resumo_mes.exames_realizados}
                prefix={<SoundOutlined />}
                valueStyle={{ color: '#764ba2' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}
