import { useMemo } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useLocation, useNavigate } from 'react-router-dom'
import { MenuConfigItem, MenuRole } from '../../config/menuConfig'
import './Sidebar.css'

interface SidebarItemProps {
  item: MenuConfigItem
  collapsed: boolean
  permissions: Record<MenuRole, boolean>
  isSubmenu?: boolean
}

export function SidebarItem({ item, collapsed, permissions, isSubmenu = false }: SidebarItemProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  // Resolve dynamic label
  const label = typeof item.label === 'function' ? item.label(permissions) : item.label

  // Precise route matching so /pacientes doesn't match /pts/pacientes
  const isActive = useMemo(() => {
    if (!item.path) return false
    if (item.path === '/home') {
      return currentPath === '/' || currentPath === '/home'
    }
    if (item.path === '/pacientes') {
      return currentPath === '/pacientes' || currentPath.startsWith('/pacientes/')
    }
    return currentPath === item.path || currentPath.startsWith(item.path + '/')
  }, [item.path, currentPath])

  const handleClick = () => {
    if (item.path) {
      navigate(item.path)
    }
  }

  if (collapsed) {
    return (
      <Tooltip.Provider delayDuration={150}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className="sidebar-collapsed-btn"
              onClick={handleClick}
              data-active={isActive}
              aria-current={isActive ? 'page' : undefined}
              aria-label={typeof label === 'string' ? label : undefined}
            >
              <span className="sidebar-collapsed-icon" aria-hidden="true">
                {item.icon}
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="SidebarTooltipContent" side="right" sideOffset={12}>
              {label}
              <Tooltip.Arrow className="SidebarTooltipArrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    )
  }

  return (
    <button
      type="button"
      className={`sidebar-nav-item ${isSubmenu ? 'sidebar-submenu-item' : 'sidebar-root-item'}`}
      onClick={handleClick}
      data-active={isActive}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="sidebar-item-icon" aria-hidden="true">
        {item.icon}
      </span>
      <span className="sidebar-item-label">
        {label}
      </span>
    </button>
  )
}
