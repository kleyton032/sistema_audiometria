import { useState } from 'react'
import { Layout as AntLayout, Menu, Button, theme, Avatar, Typography, Tooltip, Space, Modal, Descriptions, Badge, Tag, Divider } from 'antd'
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
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts'

const { Header, Sider, Content } = AntLayout
const { Text, Title } = Typography

// nm_tip_presta do MV para Fonoaudiólogo (cd_tip_presta = 6)
const NM_TIP_FONOAUDIOLOGO = 'FONOAUDIOLOGO(A)'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [profileVisible, setProfileVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, usuario } = useAuth()
  const { token: themeToken } = theme.useToken()

  const isFonoaudiologo = usuario?.nm_tip_presta === NM_TIP_FONOAUDIOLOGO

  const menuItems = [
    // ── Dashboard (todos) ──────────────────────────────────────
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },

    // ── Exames Auditivos (apenas Fonoaudiólogo) ─────────────────
    ...(isFonoaudiologo ? [{
      key: 'grupo-exames',
      icon: <SoundOutlined />,
      label: 'Exames Auditivos',
      children: [
        { key: '/pacientes', icon: <TeamOutlined />, label: 'Pacientes' },
        { key: '/consulta', icon: <SearchOutlined />, label: 'Laudos' },
      ],
    }] : []),

    // ── PTS (todos os usuários) ─────────────────────────────────
    {
      key: 'grupo-pts',
      icon: <FileProtectOutlined />,
      label: 'PTS',
      children: [
        { key: '/pts/pacientes', icon: <TeamOutlined />, label: 'Pacientes' },
        { key: '/pts/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      ],
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
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

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['grupo-exames', 'grupo-pts']}
          items={menuItems}
          style={{
            background: 'transparent',
            paddingTop: 12,
            borderRight: 0,
          }}
          onClick={({ key }) => {
            if (!key.startsWith('grupo-')) navigate(key)
          }}
        />

        {/* Rodapé com dados do usuário */}
        {!collapsed && usuario && (
          <div
            onClick={() => setProfileVisible(true)}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'background 0.3s',
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
          </div>
        )}
        {collapsed && usuario && (
          <div 
            onClick={() => setProfileVisible(true)}
            style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Tooltip title={usuario.nm_usuario} placement="right">
              <Avatar size={28} icon={<UserOutlined />} style={{ background: '#667eea' }} />
            </Tooltip>
          </div>
        )}
      </Sider>

      <AntLayout>
        <Header
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
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!collapsed}
          />
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} aria-label="Sair do sistema">
            Sair
          </Button>
        </Header>
        <Content
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
        centered
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
            
            <Descriptions bordered column={1} size="small" labelStyle={{ width: 160, fontWeight: 'bold', background: '#fafafa' }}>
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
        .sidebar-user-footer:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </AntLayout>
  )
}
