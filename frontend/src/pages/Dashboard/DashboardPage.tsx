import { Card, Col, Row, Statistic, Typography } from 'antd'
import { AudioOutlined, SoundOutlined, FileTextOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function DashboardPage() {
  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Audiometrias"
              value={0}
              prefix={<AudioOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Imitanciometrias"
              value={0}
              prefix={<SoundOutlined />}
              valueStyle={{ color: '#764ba2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <Statistic
              title="Laudos Gerados"
              value={0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
