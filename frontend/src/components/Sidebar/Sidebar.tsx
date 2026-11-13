import { useMemo } from 'react'
import { Layout as AntLayout } from 'antd'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useLayoutControls } from '@/contexts'
import { SidebarMenu } from './SidebarMenu'
import { IconLogo, IconCollapse, IconExpand } from './SidebarIcons'
import { menuTree, filterMenuByRoles, MenuRole } from '../../config/menuConfig'
import './Sidebar.css'

const { Sider } = AntLayout

interface SidebarProps {
  collapsed: boolean
  permissions: Record<MenuRole, boolean>
}

export function Sidebar({ collapsed, permissions }: SidebarProps) {
  const { toggleSidebar } = useLayoutControls()
  const filteredItems = useMemo(() => filterMenuByRoles(menuTree, permissions), [permissions])

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme="dark"
      width={300}
      collapsedWidth={80}
      role="navigation"
      aria-label="Menu lateral principal"
      className="sidebar-sider"
    >
      {/* ── Topo / Logo ── */}
      <div className={`sidebar-header ${collapsed ? 'sidebar-header-collapsed' : 'sidebar-header-expanded'}`}>
        <div className="sidebar-logo-icon" aria-hidden="true">
          <IconLogo size={32} />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">CDM</span>
            <span className="sidebar-logo-subtitle">Documentação multidisciplinar</span>
          </div>
        )}
      </div>

      {/* ── Menu de Navegação ── */}
      <div className="sidebar-nav-container">
        <SidebarMenu
          items={filteredItems}
          collapsed={collapsed}
          permissions={permissions}
        />
      </div>

      {/* ── Rodapé com Botão Recolher/Expandir ── */}
      <div className={`sidebar-footer ${collapsed ? 'sidebar-footer-collapsed' : 'sidebar-footer-expanded'}`}>
        {collapsed ? (
          <Tooltip.Provider delayDuration={150}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="sidebar-collapsed-btn"
                  aria-label="Expandir menu"
                >
                  <span className="sidebar-collapsed-icon" aria-hidden="true">
                    <IconExpand size={24} />
                  </span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="SidebarTooltipContent" side="right" sideOffset={12}>
                  Expandir menu
                  <Tooltip.Arrow className="SidebarTooltipArrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="sidebar-collapse-btn"
            aria-label="Recolher menu"
          >
            <span className="sidebar-collapse-icon" aria-hidden="true">
              <IconCollapse size={22} />
            </span>
            <span className="sidebar-collapse-label">Recolher menu</span>
          </button>
        )}
      </div>
    </Sider>
  )
}
