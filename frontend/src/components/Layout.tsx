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
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts'

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
  const location = useLocation()
  const { logout, usuario } = useAuth()
  const { token: themeToken } = theme.useToken()

  const isFonoaudiologo = usuario?.nm_tip_presta === NM_TIP_FONOAUDIOLOGO

  const menuItems = [
    // ── Início (Home Consolidada) ──────────────────────────────
    {
      key: '/home',
      icon: <HomeOutlined aria-hidden="true" />,
      label: 'Início',
    },

    // ── Exames Auditivos (apenas Fonoaudiólogo) ─────────────────
    ...(isFonoaudiologo ? [{
      key: 'grupo-exames',
      icon: <SoundOutlined aria-hidden="true" />,
      label: 'Exames Auditivos',
      children: [
        { key: '/pacientes', icon: <TeamOutlined aria-hidden="true" />, label: 'Pacientes - Audiometrias' },
        { key: '/consulta', icon: <SearchOutlined aria-hidden="true" />, label: 'Laudos - Consultas' },
      ],
    }] : []),

    // ── PTS (todos os usuários) ─────────────────────────────────
    {
      key: 'grupo-pts',
      icon: <FileProtectOutlined aria-hidden="true" />,
      label: 'Projeto Terapêutico Singular (PTS)',
      children: [
        { key: '/pts/pacientes', icon: <TeamOutlined aria-hidden="true" />, label: 'Pacientes PTS' },
        { key: '/pts/dashboard', icon: <DashboardOutlined aria-hidden="true" />, label: 'Dashboard PTS' },
      ],
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <style>{`
        .menu-item-button {
          position: relative;
          overflow: hidden;
        }
        
        .menu-item-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }
        
        .menu-item-button:hover::before {
          left: 100%;
        }
        
        .menu-item-button:hover {
          background: rgba(102, 126, 234, 0.2) !important;
          transform: translateX(4px);
          box-shadow: inset 3px 0 8px rgba(102, 126, 234, 0.3);
        }
        
        .menu-item-button:focus-visible {
          outline: 2px solid #667eea;
          outline-offset: -2px;
          background: rgba(102, 126, 234, 0.25) !important;
          transform: translateX(4px);
        }
        
        .menu-group-summary {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .menu-group-summary:hover {
          color: #fff !important;
          background: rgba(102, 126, 234, 0.1);
          transform: translateX(2px);
        }
        
        .menu-group-summary:focus-visible {
          outline: 2px solid #667eea;
          outline-offset: 2px;
          background: rgba(102, 126, 234, 0.15);
        }
        
        .menu-item-button:focus-visible svg,
        .menu-group-summary:focus-visible svg {
          outline: none;
        }
        
        .menu-group-summary::marker {
          color: #667eea;
        }
        
        /* Efeito de ripple no clique */
        .menu-item-button:active {
          transform: translateX(3px) scale(0.98);
        }
        
        details[open] > .menu-group-summary {
          color: #fff !important;
          background: rgba(102, 126, 234, 0.12);
        }
      `}</style>
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
      
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        role="navigation"
        aria-label="Menu de navegação principal"
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            transition: 'all 0.2s',
          }}
        >
          <Space size={12}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileProtectOutlined style={{ fontSize: 18 }} />
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: 0.5 }}>
                  CDM
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase' }}>
                  Documentação Multidisciplinar
                </Text>
              </div>
            )}
          </Space>
        </div>

        <nav aria-label="Menu principal de navegação">
          <ul style={{ listStyle: 'none', padding: '12px 0', margin: 0 }}>
            {menuItems.map((item) => (
              <li key={item.key} style={{ margin: 0 }}>
                {item.children ? (
                  // Grupo com submenu
                  <details
                    open={true}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <summary
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 16px',
                        color: 'rgba(255,255,255,0.65)',
                        cursor: 'pointer',
                        fontSize: 14,
                        userSelect: 'none',
                        outline: 'none',
                      }}
                      className="menu-group-summary"
                      aria-expanded="true"
                      aria-label={`${item.label}, grupo com submenu`}
                    >
                      <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </summary>
                    <ul style={{ listStyle: 'none', padding: '0 0 0 24px', margin: 0 }}>
                      {item.children.map((child) => (
                        <li key={child.key} style={{ margin: 0 }}>
                          <button
                            onClick={() => navigate(child.key)}
                            aria-current={location.pathname === child.key ? 'page' : undefined}
                            aria-label={child.label}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 16px',
                              border: 'none',
                              background: location.pathname === child.key ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
                              color: location.pathname === child.key ? '#fff' : 'rgba(255,255,255,0.65)',
                              cursor: 'pointer',
                              fontSize: 14,
                              transition: 'all 0.3s ease',
                              textAlign: 'left',
                              borderLeft: location.pathname === child.key ? '3px solid #667eea' : '3px solid transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!location.pathname.includes(child.key)) {
                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'
                                e.currentTarget.style.color = '#fff'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!location.pathname.includes(child.key)) {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                              }
                            }}
                            className="menu-item-button"
                          >
                            <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                              {child.icon}
                            </span>
                            {!collapsed && <span>{child.label}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  // Item simples sem submenu
                  <button
                    onClick={() => navigate(item.key)}
                    aria-current={location.pathname === item.key ? 'page' : undefined}
                    aria-label={item.label}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      border: 'none',
                      background: location.pathname === item.key ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
                      color: location.pathname === item.key ? '#fff' : 'rgba(255,255,255,0.65)',
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                      borderLeft: location.pathname === item.key ? '3px solid #667eea' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!location.pathname.includes(item.key)) {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'
                        e.currentTarget.style.color = '#fff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!location.pathname.includes(item.key)) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                      }
                    }}
                    className="menu-item-button"
                  >
                    <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Rodapé com dados do usuário */}
        {!collapsed && usuario && (
          <button
            onClick={() => setProfileVisible(true)}
            aria-label={`Perfil de ${usuario.nm_usuario}. ${usuario.nm_tip_presta}${usuario.ds_conselho && usuario.ds_codigo_conselho ? ` - ${usuario.ds_conselho} ${usuario.ds_codigo_conselho}` : ''}. Clique para ver detalhes`}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'background 0.3s',
              width: '100%',
              textAlign: 'left',
            }}
            className="sidebar-user-footer"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={28} icon={<UserOutlined />} style={{ background: '#667eea', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <Text style={{ color: '#fff', fontSize: 12, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {usuario.nm_usuario}
                </Text>
                {usuario.nm_tip_presta && (
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {usuario.nm_tip_presta}
                    {usuario.ds_conselho && usuario.ds_codigo_conselho
                      ? ` · ${usuario.ds_conselho} ${usuario.ds_codigo_conselho}`
                      : ''}
                  </Text>
                )}
              </div>
            </div>
          </button>
        )}
        {collapsed && usuario && (
          <Tooltip title={`Perfil: ${usuario.nm_usuario}. ${usuario.nm_tip_presta}`} placement="right">
            <button
              onClick={() => setProfileVisible(true)}
              aria-label={`Abrir perfil de ${usuario.nm_usuario}`}
              style={{
                position: 'absolute',
                bottom: 12,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                padding: 0,
              }}
            >
              <Avatar size={28} icon={<UserOutlined />} style={{ background: '#667eea' }} />
            </button>
          </Tooltip>
        )}
      </Sider>

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
        /* Skip link visível no focus */
        .skip-link:focus {
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          padding: 12px;
          z-index: 1000;
        }

        /* Item de menu selecionado com indicador visual forte */
        .ant-menu-item-selected::before {
          content: '';
          position: absolute;
          left: 0;
          width: 4px;
          height: 100%;
          background: #52c41a;
        }

        /* Focus visível para navegação por teclado */
        .ant-menu-item:focus-visible,
        .ant-menu-submenu-title:focus-visible {
          outline: 2px solid #1677ff;
          outline-offset: -2px;
        }

        /* Grupos de menu com destaque */
        .ant-menu-submenu-title {
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* Melhor contraste na sidebar */
        .ant-menu-dark .ant-menu-item {
          color: rgba(255, 255, 255, 0.85);
        }

        .ant-menu-dark .ant-menu-item-selected {
          background: rgba(102, 126, 234, 0.15) !important;
        }

        /* Botão de usuário com melhor acessibilidade */
        .sidebar-user-footer:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .sidebar-user-footer:focus {
          outline: 2px solid #1677ff;
          outline-offset: -2px;
        }
      `}</style>
    </AntLayout>
  )
}
