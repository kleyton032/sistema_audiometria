import { useState, useEffect, useRef } from 'react'
import { Layout as AntLayout, Button, theme, Avatar, Typography, Tooltip, Space, Modal, Descriptions, Badge, Tag, Divider } from 'antd'
import {
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  FileProtectOutlined,
  SoundOutlined,
  TeamOutlined,
  UserOutlined,
  HomeOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { Sidebar } from './Sidebar/Sidebar'
import { MenuRole } from '../config/menuConfig'

const { Header, Sider, Content } = AntLayout
const { Text, Title } = Typography

// nm_tip_presta do MV para Fonoaudiólogo (cd_tip_presta = 6)
const NM_TIP_FONOAUDIOLOGO = 'FONOAUDIOLOGO(A)'

// ── Mapa de nomes legíveis para cada rota ──────────────────────────────────
const ROUTE_NAMES: Record<string, string> = {
  '/home':           'Início',
  '/pacientes':      'Pacientes — Audiometrias',
  '/consulta':       'Laudos e Consultas',
  '/pts/pacientes':  'Lista de Pacientes do PTS',
  '/pts/dashboard':  'Dashboard PTS',
  '/pts':            'Projeto Terapêutico Singular',
  '/admin':          'Painel Administrativo',
}

function routeLabel(pathname: string): string {
  // Correspondência exata primeiro
  if (ROUTE_NAMES[pathname]) return ROUTE_NAMES[pathname]
  // Prefixo mais longo
  const match = Object.keys(ROUTE_NAMES)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? ROUTE_NAMES[match] : 'Página'
}

/**
 * RouteAnnouncer — anuncia mudanças de rota para leitores de tela via aria-live.
 * Também move o foco para o primeiro h1 do conteúdo principal após a navegação,
 * garantindo que o usuário saiba exatamente onde está.
 */
function RouteAnnouncer() {
  const location = useLocation()
  const [announcement, setAnnouncement] = useState('')
  // Evita anunciar na montagem inicial
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const label = routeLabel(location.pathname)
    // Limpa antes de definir para forçar re-anúncio se a mesma rota for acessada
    setAnnouncement('')

    const announceTimer = setTimeout(() => {
      setAnnouncement(`Navegou para: ${label}`)
    }, 50)

    // Foca o h1 do conteúdo principal após a navegação
    const focusTimer = setTimeout(() => {
      const main = document.getElementById('main-content')
      const heading = main?.querySelector<HTMLElement>('h1')
      if (heading) {
        // tabIndex temporário para permitir foco programático
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: false })
      }
    }, 150)

    return () => {
      clearTimeout(announceTimer)
      clearTimeout(focusTimer)
    }
  }, [location.pathname])

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [profileVisible, setProfileVisible] = useState(false)
  const navigate = useNavigate()
  const { logout, usuario, isAdmin, isSupervisor, isCoordenador } = useAuth()
  const { token: themeToken } = theme.useToken()

  const isFonoaudiologo = usuario?.nm_tip_presta === NM_TIP_FONOAUDIOLOGO

  const permissions: Record<MenuRole, boolean> = {
    ADMIN: !!isAdmin,
    SUPERVISOR: !!isSupervisor,
    COORDENADOR: !!isCoordenador,
    FONOAUDIOLOGO: !!isFonoaudiologo,
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Skip link para acessibilidade */}
      <a 
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          background: '#000',
          color: '#fff',
          padding: '8px 12px',
          zIndex: 100,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Pular para conteúdo principal
      </a>
      
      <Sidebar
        collapsed={collapsed}
        usuario={usuario}
        setProfileVisible={setProfileVisible}
        permissions={permissions}
      />


      <AntLayout>
        <Header
          role="banner"
          aria-label="Barra superior de navegação"
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined aria-hidden="true" /> : <MenuFoldOutlined aria-hidden="true" />}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!collapsed}
          />
          <Button 
            type="text" 
            icon={<LogoutOutlined aria-hidden="true" />} 
            onClick={handleLogout} 
            aria-label="Sair do sistema"
          >
            Sair
          </Button>
        </Header>
        <RouteAnnouncer />
        <Content
          id="main-content"
          role="main"
          aria-label="Conteúdo principal da aplicação"
          style={{
            margin: 24,
            padding: 24,
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadiusLG,
            minHeight: 360,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>

      {/* Modal de Perfil do Usuário */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Perfil do Profissional</span>
          </Space>
        }
        open={profileVisible}
        onCancel={() => setProfileVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setProfileVisible(false)}>
            Fechar
          </Button>
        ]}
        width={600}
        style={{ top: 20 }}
      >
        {usuario && (
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ background: '#667eea' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{usuario.nm_usuario}</Title>
                <Text type="secondary">{usuario.ds_email}</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color={usuario.ds_perfil === 'ADMIN' ? 'gold' : 'blue'}>
                    {usuario.ds_perfil}
                  </Tag>
                </div>
              </div>
            </div>

            <Divider orientation="left" style={{ margin: '12px 0' }}>Informações Profissionais</Divider>
            
            <Descriptions bordered column={1} size="small" styles={{ label: { width: 160, fontWeight: 'bold', background: '#fafafa' } }}>
              <Descriptions.Item label="Login">{usuario.nm_login}</Descriptions.Item>
              <Descriptions.Item label="Tipo de Prestador">
                {usuario.nm_tip_presta || 'Não informado'}
              </Descriptions.Item>
              <Descriptions.Item label="Conselho">
                {usuario.ds_conselho || usuario.nr_conselho ? (
                  <Space>
                    <Tag color="cyan">{usuario.ds_conselho || 'Conselho'}</Tag>
                    <Text strong>{usuario.ds_codigo_conselho || usuario.nr_conselho}</Text>
                  </Space>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Especialidade">
                {usuario.ds_especialidade || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge status={usuario.fl_ativo === 1 ? 'success' : 'error'} text={usuario.fl_ativo === 1 ? 'Ativo' : 'Inativo'} />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <style>{`
        .skip-link:focus {
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          padding: 12px;
          z-index: 1000;
        }
      `}</style>
    </AntLayout>
  )
}
