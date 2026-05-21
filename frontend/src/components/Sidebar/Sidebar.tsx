import { useMemo } from 'react'
import { Layout as AntLayout, Typography, Space } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import { SidebarMenu } from './SidebarMenu'
import { menuTree, filterMenuByRoles, MenuRole } from '../../config/menuConfig'
import { User } from '@/types'

const { Sider } = AntLayout
const { Text } = Typography

interface SidebarProps {
  collapsed: boolean
  permissions: Record<MenuRole, boolean>
}

export function Sidebar({ collapsed, permissions }: SidebarProps) {
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

    </Sider>
  )
}
