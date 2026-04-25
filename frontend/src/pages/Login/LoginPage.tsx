import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined, AudioOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { checkMvCode, registerUser } from '@/api/authService'

const { Title, Text } = Typography

interface LoginForm {
  username?: string
  password?: string
  confirmPassword?: string
}

type Step = 'USER_CHECK' | 'LOGIN' | 'REGISTER'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('USER_CHECK')
  const [username, setUsername] = useState('')
  const [form] = Form.useForm<LoginForm>()

  const handleCheckUser = async () => {
    try {
      const values = await form.validateFields(['username'])
      setLoading(true)
      setError(null)
      const data = await checkMvCode(values.username!)
      setUsername(values.username!)
      
      if (data.existe_local) {
        setStep('LOGIN')
      } else if (data.valido_mv) {
        setStep('REGISTER')
      } else {
        setError('Usuário não encontrado na base, ou não possui qualificação registrada no MV.')
      }
    } catch (err: unknown) {
      let msg = (err as any)?.response?.data?.detail
      if (Array.isArray(msg)) {
        msg = msg.map((e: any) => e.msg).join(', ')
      } else if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg)
      }
      setError(msg || 'Erro ao validar o usuário.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (values: LoginForm) => {
    if (step !== 'LOGIN') return
    setLoading(true)
    setError(null)
    try {
      await login(username, values.password!)
      navigate('/dashboard')
    } catch (err: unknown) {
      let msg = (err as any)?.response?.data?.detail
      if (Array.isArray(msg)) {
        msg = msg.map((e: any) => e.msg).join(', ')
      } else if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg)
      }
      setError(msg || 'Erro ao realizar login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (values: LoginForm) => {
    if (step !== 'REGISTER') return
    setLoading(true)
    setError(null)
    try {
      if (values.password !== values.confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }

      await registerUser({
        nm_login: username,
        nm_usuario: username, // Usando o proprio login como nome padrão temporario
        ds_email: `${username}@hospital.local`, // E-mail mockado momentaneo
        ds_senha: values.password!,
        cd_usuario_mv: username,
        ds_perfil: 'OPERADOR'
      })

      // Após cadastro ocorre login automático
      await login(username, values.password!)
      navigate('/dashboard')
    } catch (err: unknown) {
      let msg = (err as any)?.response?.data?.detail
      if (Array.isArray(msg)) {
        msg = msg.map((e: any) => e.msg).join(', ')
      } else if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg)
      }
      setError(msg || 'Erro ao cadastrar sistema.')
    } finally {
      setLoading(false)
    }
  }

  const resetStep = () => {
    setStep('USER_CHECK')
    setUsername('')
    form.resetFields(['password', 'confirmPassword'])
    setError(null)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
        variant="borderless"
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <AudioOutlined style={{ fontSize: 48, color: '#667eea' }} />
            <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
              Sistema de Audiometria
            </Title>
            <Text type="secondary">Faça login para acessar o sistema</Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
          )}

          <Form<LoginForm>
            form={form}
            name="login_flow"
            onFinish={step === 'LOGIN' ? handleLoginSubmit : handleRegisterSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            {step === 'USER_CHECK' && (
              <>
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Informe seu login ou código MV' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Login / Código MV" onPressEnter={handleCheckUser} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleCheckUser} loading={loading} block>
                    Continuar
                  </Button>
                </Form.Item>
              </>
            )}

            {step === 'LOGIN' && (
              <>
                <div style={{ marginBottom: 16, textAlign: 'left' }}>
                  <Text type="secondary">Entrando como:</Text> <Text strong>{username}</Text>{' '}
                  <Button type="link" size="small" onClick={resetStep}>Alterar</Button>
                </div>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Informe sua senha' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Senha" autoFocus />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Entrar
                  </Button>
                </Form.Item>
              </>
            )}

            {step === 'REGISTER' && (
              <>
                <div style={{ marginBottom: 16, textAlign: 'left' }}>
                  <Text type="secondary">Primeiro acesso verificado:</Text> <Text strong>{username}</Text>{' '}
                  <Button type="link" size="small" onClick={resetStep}>Alterar</Button>
                </div>
                <Alert 
                   message="Seja bem-vindo(a)!"
                   description="Crie uma senha segura para o seu primeiro acesso ao sistema de Audiometria."
                   type="info"
                   showIcon
                   style={{ marginBottom: 16, textAlign: 'left' }}
                />
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Crie uma senha' }, { min: 8, message: 'Mínimo 8 caracteres'}]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Criar Senha" autoFocus />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Confirme sua senha' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('As senhas não coincidem!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirmar Senha" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Criar Acesso e Entrar
                  </Button>
                </Form.Item>
              </>
            )}
          </Form>
        </Space>
      </Card>
    </div>
  )
}
