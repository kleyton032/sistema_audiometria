
import * as Tooltip from '@radix-ui/react-tooltip'
import { useLocation, useNavigate } from 'react-router-dom'
import { MenuConfigItem, MenuRole } from '../../config/menuConfig'
import './Sidebar.css'

interface SidebarItemProps {
  item: MenuConfigItem
  collapsed: boolean
  permissions: Record<MenuRole, boolean>
  level?: number
}

export function SidebarItem({ item, collapsed, permissions, level = 1 }: SidebarItemProps) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Resolve the dynamic label if it's a function
  const label = typeof item.label === 'function' ? item.label(permissions) : item.label
  const isActive = item.path ? location.pathname.includes(item.path) : false

  const handleClick = () => {
    if (item.path) {
      navigate(item.path)
    }
  }

  const paddingLeft = collapsed ? 16 : 16 + (level - 1) * 16

  const button = (
    <button
      className="sidebar-nav-button"
      onClick={handleClick}
      data-active={isActive}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      style={{ paddingLeft, justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
        {item.icon}
      </span>
      {!collapsed && (
        <span style={{ marginLeft: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            {button}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="SidebarTooltipContent" side="right" sideOffset={10}>
              {label}
              <Tooltip.Arrow className="SidebarTooltipArrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    )
  }

  return button
}
