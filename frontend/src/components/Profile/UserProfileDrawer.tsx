import React from 'react'
import { Drawer, Avatar, Typography, Tag, Divider, Descriptions, Badge, Space } from 'antd'
import { UserOutlined, MailOutlined, IdcardOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { User } from '@/types'

const { Title, Text } = Typography

interface UserProfileDrawerProps {
  open: boolean
  onClose: () => void
  usuario: User | null
}

export function UserProfileDrawer({ open, onClose, usuario }: UserProfileDrawerProps) {
  if (!usuario) return null

  return (
    <Drawer
      title="Perfil do Profissional"
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      styles={{
        body: { padding: 0 }
      }}
    >
      {/* Cabeçalho de Identidade */}
      <div style={{ background: '#f5f7fa', padding: '32px 24px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <Avatar 
          size={80} 
          icon={<UserOutlined />} 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            marginBottom: 16
          }} 
        />
        <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
          {usuario.nm_usuario}
        </Title>
        <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <MailOutlined /> {usuario.ds_email || 'Email não cadastrado'}
          </Text>
          <Tag color={usuario.ds_perfil === 'ADMIN' ? 'gold' : 'blue'} style={{ marginTop: 4, marginInlineEnd: 0 }}>
            {usuario.ds_perfil}
          </Tag>
        </Space>
      </div>

      {/* Corpo com Detalhes */}
      <div style={{ padding: '24px' }}>
        <Divider orientation="left" style={{ margin: '0 0 16px 0', borderColor: '#e5e7eb', color: '#6b7280' }}>
          <IdcardOutlined style={{ marginRight: 6 }} />
          Identificação
        </Divider>
        <Descriptions column={1} size="small" styles={{ label: { width: 120, color: '#6b7280', fontWeight: 500 } }}>
          <Descriptions.Item label="Login">
            <Text strong>{usuario.nm_login}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge 
              status={usuario.fl_ativo === 1 ? 'success' : 'error'} 
              text={usuario.fl_ativo === 1 ? 'Ativo' : 'Inativo'} 
            />
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" style={{ margin: '24px 0 16px 0', borderColor: '#e5e7eb', color: '#6b7280' }}>
          <SafetyCertificateOutlined style={{ marginRight: 6 }} />
          Atuação Profissional
        </Divider>
        <Descriptions column={1} size="small" styles={{ label: { width: 120, color: '#6b7280', fontWeight: 500 } }}>
          <Descriptions.Item label="Prestador">
            <Text strong>{usuario.nm_tip_presta || 'Não informado'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Conselho">
            {usuario.ds_conselho || usuario.nr_conselho ? (
              <Space>
                <Tag color="cyan">{usuario.ds_conselho || 'Registro'}</Tag>
                <Text strong>{usuario.ds_codigo_conselho || usuario.nr_conselho}</Text>
              </Space>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Especialidade">
            {usuario.ds_especialidade ? <Text strong>{usuario.ds_especialidade}</Text> : <Text type="secondary">—</Text>}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Drawer>
  )
}
