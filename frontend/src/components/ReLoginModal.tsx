import React, { useState } from 'react'
import { Modal, Form, Input, Button, Typography, App } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts'

const { Text } = Typography

export const ReLoginModal: React.FC = () => {
  const { isSessionExpired, clearSessionExpired, login, nm_login, logout } = useAuth()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleFinish = async (values: { password: string }) => {
    if (!nm_login) {
      message.error('Usuário não identificado. Por favor, recarregue a página.')
      return
    }

    setLoading(true)
    try {
      await login(nm_login, values.password)
      message.success('Sessão renovada com sucesso!')
      clearSessionExpired()
      form.resetFields()
    } catch (error) {
      console.error('Erro ao renovar sessão:', error)
      message.error('Senha incorreta ou erro ao renovar a sessão.')
    } finally {
      setLoading(false)
    }
  }

  const handleForceLogout = () => {
    clearSessionExpired()
    logout()
    window.location.href = '/login'
  }

  return (
    <Modal
      title="Sessão Expirada"
      open={isSessionExpired}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      zIndex={9999}
      centered
      styles={{ mask: { backdropFilter: 'blur(4px)' } }}
    >
      <div style={{ marginBottom: 24 }}>
        <Text>
          Sua sessão expirou por tempo de inatividade ou instabilidade na conexão. 
          Para <strong>não perder os dados</strong> que você preencheu na tela, digite sua senha novamente para renovar a sessão.
        </Text>
      </div>

      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item label="Usuário">
          <Input value={nm_login || 'Desconhecido'} disabled />
        </Form.Item>

        <Form.Item
          name="password"
          label="Senha"
          rules={[{ required: true, message: 'Por favor, informe sua senha' }]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Digite sua senha" 
            autoFocus 
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <Button type="text" danger onClick={handleForceLogout} disabled={loading}>
            Sair do sistema
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Renovar Sessão
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
