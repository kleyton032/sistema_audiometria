import React, { useState, useEffect, useMemo, useRef } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { useLocation } from 'react-router-dom'
import { MenuConfigItem, MenuRole } from '../../config/menuConfig'
import { SidebarItem } from './SidebarItem'
import { IconChevronDown } from './SidebarIcons'
import './Sidebar.css'

interface SidebarMenuProps {
  items: MenuConfigItem[]
  collapsed: boolean
  permissions: Record<MenuRole, boolean>
}

export function SidebarMenu({ items, collapsed, permissions }: SidebarMenuProps) {
  const location = useLocation()
  const currentPath = location.pathname
  const navRef = useRef<HTMLElement>(null)

  // Identifica quais grupos contêm a rota atual
  const activeGroupKeys = useMemo(() => {
    const keys: string[] = []
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((child) => {
          if (!child.path) return false
          if (child.path === '/pacientes') {
            return currentPath === '/pacientes' || currentPath.startsWith('/pacientes/')
          }
          return currentPath === child.path || currentPath.startsWith(child.path + '/')
        })
        if (hasActiveChild) {
          keys.push(item.key)
        }
      }
    })
    return keys
  }, [items, currentPath])

  // Estado dos grupos abertos (por padrão abre grupos que têm rotas ativas ou os principais)
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    if (activeGroupKeys.length > 0) return activeGroupKeys
    return ['grupo-exames', 'grupo-pts']
  })

  // Garante que o grupo da rota atual esteja aberto quando a rota mudar
  useEffect(() => {
    if (activeGroupKeys.length > 0) {
      setOpenGroups((prev) => Array.from(new Set([...prev, ...activeGroupKeys])))
    }
  }, [activeGroupKeys])

  // Navegação por teclado com setas Cima / Baixo
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!navRef.current) return
      const focusable = navRef.current.querySelectorAll<HTMLButtonElement>(
        'button:not([disabled]):not([aria-hidden="true"])'
      )
      const buttons = Array.from(focusable)
      if (buttons.length === 0) return

      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (currentIndex === -1) {
        buttons[0]?.focus()
      } else if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % buttons.length
        buttons[nextIndex]?.focus()
      } else if (e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length
        buttons[prevIndex]?.focus()
      }
    }
  }

  // ── MODO RECOLHIDO (COLLAPSED) ──────────────────────────────────────────
  if (collapsed) {
    return (
      <nav
        ref={navRef}
        aria-label="Menu principal de navegação"
        className="sidebar-collapsed-nav"
        onKeyDown={handleKeyDown}
      >
        <div className="sidebar-collapsed-list">
          {items.map((item, index) => {
            // Se for folha (ex: Início)
            if (!item.children || item.children.length === 0) {
              return (
                <React.Fragment key={item.key}>
                  <SidebarItem
                    item={item}
                    collapsed={true}
                    permissions={permissions}
                  />
                  {index === 0 && <div className="sidebar-collapsed-divider" role="separator" />}
                </React.Fragment>
              )
            }

            // Se for grupo de filhos, renderiza cada filho como botão 56x56
            return (
              <React.Fragment key={item.key}>
                {item.children.map((child) => (
                  <SidebarItem
                    key={child.key}
                    item={child}
                    collapsed={true}
                    permissions={permissions}
                  />
                ))}
                {index < items.length - 1 && (
                  <div className="sidebar-collapsed-divider" role="separator" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </nav>
    )
  }

  // ── MODO EXPANDIDO ──────────────────────────────────────────────────────
  // Separar itens iniciais (ex: Início), grupos do accordion, e itens finais (ex: Admin)
  const topItems = items.filter((item) => (!item.children || item.children.length === 0) && item.key === '/home')
  const groupItems = items.filter((item) => item.children && item.children.length > 0)
  const bottomItems = items.filter((item) => (!item.children || item.children.length === 0) && item.key !== '/home')

  return (
    <nav
      ref={navRef}
      aria-label="Menu principal de navegação"
      className="sidebar-expanded-nav"
      onKeyDown={handleKeyDown}
    >
      {/* Itens do Topo (ex: Início) */}
      {topItems.length > 0 && (
        <div className="sidebar-section-top">
          {topItems.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={false}
              permissions={permissions}
            />
          ))}
          <div className="sidebar-divider" role="separator" />
        </div>
      )}

      {/* Grupos Accordion */}
      {groupItems.length > 0 && (
        <Accordion.Root
          type="multiple"
          value={openGroups}
          onValueChange={setOpenGroups}
          className="sidebar-accordion-root"
        >
          {groupItems.map((item) => {
            const label = typeof item.label === 'function' ? item.label(permissions) : item.label

            return (
              <Accordion.Item
                value={item.key}
                key={item.key}
                className="sidebar-accordion-item"
              >
                <Accordion.Header className="sidebar-accordion-header">
                  <Accordion.Trigger className="sidebar-group-trigger">
                    <span className="sidebar-group-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="sidebar-group-label">{label}</span>
                    <span className="sidebar-chevron" aria-hidden="true">
                      <IconChevronDown size={20} />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content className="sidebar-accordion-content">
                  <div className="sidebar-submenu-list">
                    {item.children?.map((child) => (
                      <SidebarItem
                        key={child.key}
                        item={child}
                        collapsed={false}
                        permissions={permissions}
                        isSubmenu={true}
                      />
                    ))}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            )
          })}
        </Accordion.Root>
      )}

      {/* Itens Finais (ex: Painel Administrativo) */}
      {bottomItems.length > 0 && (
        <div className="sidebar-section-bottom">
          <div className="sidebar-divider" role="separator" />
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              collapsed={false}
              permissions={permissions}
            />
          ))}
        </div>
      )}
    </nav>
  )
}
