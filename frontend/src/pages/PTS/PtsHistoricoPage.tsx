import React, { useState } from 'react'
import { Card, Typography, Input, Button, Space, Divider, App } from 'antd'
import { SearchOutlined, HistoryOutlined } from '@ant-design/icons'
import { PtsHistoryTimeline } from '../../components/PTS/PtsHistoryTimeline'

const { Title, Text } = Typography
const { Search } = Input

export default function PtsHistoricoPage() {
  const { notification } = App.useApp()
  const [cdPacienteBusca, setCdPacienteBusca] = useState('')
  const [cdPacienteAtivo, setCdPacienteAtivo] = useState<string | null>(null)

  const handleSearch = (value: string) => {
    const cleanValue = value.trim()
    if (!cleanValue) {
      notification.warning({
        message: 'Campo vazio',
        description: 'Por favor, digite o código do paciente.',
      })
      return
    }
    setCdPacienteAtivo(cleanValue)
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <Title level={1}>Consulta de Histórico Longitudinal</Title>
      
      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              <HistoryOutlined style={{ marginRight: 8, color: '#667eea' }} />
              Buscar Histórico de Paciente
            </Text>
            <p style={{ color: '#8c8c8c', marginTop: 4, marginBottom: 16 }}>
              Digite o código do paciente para visualizar todo o seu histórico evolutivo de Projeto Terapêutico Singular.
            </p>
            <Search
              placeholder="Digite o código do paciente (ex: 12345)"
              allowClear
              enterButton={<><SearchOutlined /> Buscar</>}
              size="large"
              onSearch={handleSearch}
              value={cdPacienteBusca}
              onChange={(e) => setCdPacienteBusca(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
        </Space>
      </Card>

      {cdPacienteAtivo && (
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <PtsHistoryTimeline cdPaciente={cdPacienteAtivo} />
        </Card>
      )}
    </div>
  )
}
