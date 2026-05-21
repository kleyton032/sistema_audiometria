import React, { useMemo } from 'react'
import { Layout as AntLayout, Typography, Avatar, Tooltip, Space } from 'antd'
import { FileProtectOutlined, UserOutlined } from '@ant-design/icons'
import { SidebarMenu } from './SidebarMenu'
import { menuTree, filterMenuByRoles, MenuRole } from '../../config/menuConfig'
import { User } from '@/types'

const { Sider } = AntLayout
const { Text } = Typography

interface SidebarProps {
  collapsed: boolean
  usuario: User | null
  setProfileVisible: (visible: boolean) => void
  permissions: Record<MenuRole, boolean>
}

export function Sidebar({ collapsed, usuario, setProfileVisible, permissions }: SidebarProps) {
  const filteredItems = useMemo(() => filterMenuByRoles(menuTree, permissions), [permissions])

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme="dark"
      width={240}
      role="navigation"
      aria-label="Menu de navegação principal"
      style={{ overflow: 'hidden' }}
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
          transition: 'all 0.2s',
          flexShrink: 0,
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

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <SidebarMenu items={filteredItems} collapsed={collapsed} permissions={permissions} />
      </div>

      {/* Footer / User Profile */}
      {!collapsed && usuario && (
        <button
          onClick={() => setProfileVisible(true)}
          aria-label={`Perfil de ${usuario.nm_usuario}. ${usuario.nm_tip_presta || ''}. Clique para ver detalhes`}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'background 0.3s',
            width: '100%',
            textAlign: 'left',
            flexShrink: 0,
          }}
          className="sidebar-user-footer sidebar-nav-button"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={28} icon={<UserOutlined />} style={{ background: '#667eea', flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <Text style={{ color: '#fff', fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {usuario.nm_usuario}
              </Text>
              {usuario.nm_tip_presta && (
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {usuario.nm_tip_presta}
                </Text>
              )}
            </div>
          </div>
        </button>
      )}

      {collapsed && usuario && (
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => setProfileVisible(true)}
                aria-label={`Abrir perfil de ${usuario.nm_usuario}`}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px 0',
                  cursor: 'pointer',
                  border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                  width: '100%',
                  flexShrink: 0,
                }}
                className="sidebar-user-footer sidebar-nav-button"
              >
                <Avatar size={28} icon={<UserOutlined />} style={{ background: '#667eea' }} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="SidebarTooltipContent" side="right" sideOffset={10}>
                Perfil: {usuario.nm_usuario}
                <Tooltip.Arrow className="SidebarTooltipArrow" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}
    </Sider>
  )
}
