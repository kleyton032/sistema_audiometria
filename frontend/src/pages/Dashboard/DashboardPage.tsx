import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import { AudioOutlined, SoundOutlined, FileTextOutlined } from '@ant-design/icons'
import { buscarEstatisticasDashboard, type DashboardStats } from '../../api/exameService'

const { Title } = Typography

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ audiometrias: 0, imitanciometrias: 0, laudos_gerados: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarEstatisticasDashboard()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Audiometrias"
              value={stats.audiometrias}
              loading={loading}
              prefix={<AudioOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Imitanciometrias"
              value={stats.imitanciometrias}
              loading={loading}
              prefix={<SoundOutlined />}
              valueStyle={{ color: '#764ba2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Laudos Gerados"
              value={stats.laudos_gerados}
              loading={loading}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
