import React from 'react'
import { Layout as AntLayout, Button, theme, Space } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { UserProfileDropdown } from './UserProfileDropdown'
import { User } from '@/types'

const { Header } = AntLayout

interface AppHeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  usuario: User | null
  onOpenProfile: () => void
  onLogout: () => void
}

export function AppHeader({ collapsed, onToggleSidebar, usuario, onOpenProfile, onLogout }: AppHeaderProps) {
  const { token: themeToken } = theme.useToken()

  return (
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
        height: 64,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined aria-hidden="true" /> : <MenuFoldOutlined aria-hidden="true" />}
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-expanded={!collapsed}
          style={{ fontSize: '16px', width: 40, height: 40 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <UserProfileDropdown 
          usuario={usuario}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />
      </div>
    </Header>
  )
}
