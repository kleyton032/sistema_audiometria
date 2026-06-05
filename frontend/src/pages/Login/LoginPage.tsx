import { useState } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { checkMvCode, registerUser, type PrestadorMVInfo } from '@/api/authService'

const { Title, Text } = Typography

interface LoginForm {
  username?: string
  password?: string
  confirmPassword?: string
}

type Step = 'USER_CHECK' | 'LOGIN' | 'REGISTER' | 'CHANGE_PASSWORD'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('USER_CHECK')
  const [username, setUsername] = useState('')
  const [prestadorMV, setPrestadorMV] = useState<PrestadorMVInfo | null>(null)
  const [form] = Form.useForm<LoginForm>()

  const handleCheckUser = async () => {
    try {
      const values = await form.validateFields(['username'])
      setLoading(true)
      setError(null)
      const normalizedUsername = values.username!.toLowerCase().trim()
      setUsername(normalizedUsername)
      
      const data = await checkMvCode(normalizedUsername)
      
      if (data.existe_local) {
        setStep('LOGIN')
      } else if (data.prestador) {
        setPrestadorMV(data.prestador)
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
      navigate('/home')
    } catch (err: unknown) {
      let msg = (err as any)?.response?.data?.detail
      if (msg === 'REQUIRE_PASSWORD_CHANGE') {
        setError(null)
        setStep('CHANGE_PASSWORD')
        return
      }
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

      await registerUser(username, values.password!)

      // Após cadastro ocorre login automático
      await login(username, values.password!)
      navigate('/home')
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

  const handleChangePasswordSubmit = async (values: LoginForm) => {
    if (step !== 'CHANGE_PASSWORD') return
    setLoading(true)
    setError(null)
    try {
      if (values.password !== values.confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }

      const { changePassword } = await import('@/api/authService')
      
      await changePassword({
        username: username,
        current_password: form.getFieldValue('password'), // A senha atual (temporária) que ele usou no passo anterior de LOGIN
        new_password: values.confirmPassword! // A nova senha (reaproveitando o fluxo do form)
      })

      // Realiza o login com a nova senha
      await login(username, values.confirmPassword!)
      navigate('/home')
    } catch (err: unknown) {
      let msg = (err as any)?.response?.data?.detail
      if (Array.isArray(msg)) {
        msg = msg.map((e: any) => e.msg).join(', ')
      } else if (typeof msg === 'object' && msg !== null) {
        msg = JSON.stringify(msg)
      }
      setError(msg || 'Erro ao redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  const resetStep = () => {
    setStep('USER_CHECK')
    setUsername('')
    setPrestadorMV(null)
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
            <MedicineBoxOutlined style={{ fontSize: 48, color: '#667eea' }} />
            <Title level={1} style={{ marginTop: 8, marginBottom: 0 }}>
              CDM — Centro de Documentação Multidisciplinar
            </Title>
            <Text type="secondary">Faça login para acessar o sistema</Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
          )}

          <Form<LoginForm>
            form={form}
            name="login_flow"
            onFinish={
              step === 'LOGIN' ? handleLoginSubmit :
              step === 'REGISTER' ? handleRegisterSubmit :
              step === 'CHANGE_PASSWORD' ? handleChangePasswordSubmit :
              undefined
            }
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
                  <Input prefix={<UserOutlined />} placeholder="Login / Código MV" onPressEnter={handleCheckUser} aria-label="Login ou Código MV" />
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
                  <Input.Password prefix={<LockOutlined />} placeholder="Senha" autoFocus aria-label="Senha" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Entrar
                  </Button>
                </Form.Item>
              </>
            )}

            {step === 'CHANGE_PASSWORD' && (
              <>
                <div style={{ marginBottom: 16, textAlign: 'left' }}>
                  <Text type="secondary">Usuário:</Text> <Text strong>{username}</Text>{' '}
                  <Button type="link" size="small" onClick={resetStep}>Cancelar</Button>
                </div>
                <Alert 
                   message="Redefinição de Senha"
                   description="O administrador redefiniu a sua senha temporariamente. Por segurança, você precisa criar uma nova senha agora para prosseguir."
                   type="warning"
                   showIcon
                   style={{ marginBottom: 16, textAlign: 'left' }}
                />
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Crie uma nova senha' }, { min: 8, message: 'Mínimo 8 caracteres'}]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Nova Senha" autoFocus />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Confirme a nova senha' },
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
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirmar Nova Senha" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Atualizar Senha e Entrar
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
                   description="Crie uma senha segura para o seu primeiro acesso ao CDM."
                   type="info"
                   showIcon
                   style={{ marginBottom: 16, textAlign: 'left' }}
                />
                {prestadorMV && (
                  <Alert
                    type="success"
                    showIcon
                    style={{ marginBottom: 16, textAlign: 'left' }}
                    message={prestadorMV.nm_prestador}
                    description={[
                      prestadorMV.nm_tip_presta,
                      prestadorMV.ds_conselho && prestadorMV.ds_codigo_conselho
                        ? `${prestadorMV.ds_conselho} ${prestadorMV.ds_codigo_conselho}`
                        : prestadorMV.ds_conselho || prestadorMV.ds_codigo_conselho,
                    ].filter(Boolean).join(' · ')}
                  />
                )}
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
