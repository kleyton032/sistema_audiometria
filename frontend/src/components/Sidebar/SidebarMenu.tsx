import React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { DownOutlined } from '@ant-design/icons'
import { MenuConfigItem, MenuRole } from '../../config/menuConfig'
import { SidebarItem } from './SidebarItem'
import './Sidebar.css'

interface SidebarMenuProps {
  items: MenuConfigItem[]
  collapsed: boolean
  permissions: Record<MenuRole, boolean>
  level?: number
}

export function SidebarMenu({ items, collapsed, permissions, level = 1 }: SidebarMenuProps) {
  // If we're at the root level, we provide the Accordion.Root
  // If we're deeper, we just render Accordion.Items inside the existing Root (or handle nested Accordions if needed).
  // Radix allows Accordions inside Accordions if we use multiple Roots, but for a sidebar, 
  // having a single root with type="multiple" is usually best.

  const renderItem = (item: MenuConfigItem) => {
    // Leaf node
    if (!item.children || item.children.length === 0) {
      return (
        <li key={item.key} style={{ listStyle: 'none', margin: 0 }}>
          <SidebarItem item={item} collapsed={collapsed} permissions={permissions} level={level} />
        </li>
      )
    }

    // Group node
    const label = typeof item.label === 'function' ? item.label(permissions) : item.label
    const paddingLeft = collapsed ? 16 : 16 + (level - 1) * 16

    const triggerContent = (
      <>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
          {item.icon}
        </span>
        {!collapsed && (
          <span style={{ marginLeft: 12, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        )}
        {!collapsed && (
          <DownOutlined className="SidebarAccordionChevron" style={{ fontSize: 10, marginLeft: 8 }} aria-hidden />
        )}
      </>
    )

    const groupButton = collapsed ? (
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Accordion.Trigger className="SidebarAccordionTrigger" style={{ paddingLeft, justifyContent: 'center' }}>
              {triggerContent}
            </Accordion.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="SidebarTooltipContent" side="right" sideOffset={10}>
              {label} (Grupo)
              <Tooltip.Arrow className="SidebarTooltipArrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    ) : (
      <Accordion.Trigger className="SidebarAccordionTrigger" style={{ paddingLeft }}>
        {triggerContent}
      </Accordion.Trigger>
    )

    return (
      <Accordion.Item value={item.key} key={item.key} asChild>
        <li style={{ listStyle: 'none', margin: 0 }}>
          {groupButton}
          <Accordion.Content className="SidebarAccordionContent">
            {/* Se estiver colapsado, o submenu fica oculto ou vira popover? 
                Geralmente em modo collapsed o submenu do Radix pode quebrar o layout se não for em Portal.
                Para simplicidade, se estiver colapsado e o usuário clicar, podemos descolapsar o menu 
                ou apenas não mostrar os filhos in-place.
            */}
            {!collapsed && (
              <ul style={{ padding: 0, margin: 0 }}>
                <SidebarMenu items={item.children} collapsed={collapsed} permissions={permissions} level={level + 1} />
              </ul>
            )}
          </Accordion.Content>
        </li>
      </Accordion.Item>
    )
  }

  // Se for o nível 1, embrulhamos tudo em Accordion.Root
  // Note: defaultValue or value can be controlled if we want to auto-expand active groups.
  if (level === 1) {
    return (
      <nav aria-label="Menu principal de navegação" className="sidebar-wrapper">
        <Accordion.Root type="multiple" asChild>
          <ul style={{ padding: '12px 0', margin: 0, width: '100%' }}>
            {items.map(renderItem)}
          </ul>
        </Accordion.Root>
      </nav>
    )
  }

  // Se for subnível, não precisa de novo Root (a não ser que quisermos sub-accordions independentes, mas o HTML é válido)
  return <>{items.map(renderItem)}</>
}
