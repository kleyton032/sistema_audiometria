import React from 'react'
import {
  DashboardOutlined,
  SearchOutlined,
  FileProtectOutlined,
  SoundOutlined,
  TeamOutlined,
  HomeOutlined,
  SettingOutlined,
  HistoryOutlined,
} from '@ant-design/icons'

// Perfis e atributos do usuário mapeados do contexto de autenticação
export type MenuRole = 'ADMIN' | 'SUPERVISOR' | 'COORDENADOR' | 'FONOAUDIOLOGO'

export interface MenuConfigItem {
  key: string
  label: string | ((permissions: Record<MenuRole, boolean>) => string)
  icon?: React.ReactNode
  path?: string // Se tiver path, é clicável (navega). Se não, é apenas um grupo.
  roles?: MenuRole[] // Se undefined/vazio, visível para todos.
  children?: MenuConfigItem[]
}

export const menuTree: MenuConfigItem[] = [
  {
    key: '/home',
    label: 'Início',
    icon: <HomeOutlined />,
    path: '/home',
  },
  {
    key: 'grupo-exames',
    label: 'Exames Auditivos',
    icon: <SoundOutlined />,
    roles: ['FONOAUDIOLOGO'],
    children: [
      {
        key: '/pacientes',
        label: 'Pacientes - Exames',
        icon: <TeamOutlined />,
        path: '/pacientes',
      },
      {
        key: '/consulta',
        label: 'Laudos - Consultas',
        icon: <SearchOutlined />,
        path: '/consulta',
      },
    ],
  },
  {
    key: 'grupo-pts',
    label: 'Projeto Terapêutico Singular (PTS)',
    icon: <FileProtectOutlined />,
    children: [
      {
        key: '/pts/pacientes',
        label: 'Pacientes PTS',
        icon: <TeamOutlined />,
        path: '/pts/pacientes',
      },
      {
        key: '/pts/dashboard',
        label: (perms) => 
          (perms.ADMIN || perms.SUPERVISOR || perms.COORDENADOR) ? 'Dashboard PTS' : 'Meus PTS',
        icon: <DashboardOutlined />,
        path: '/pts/dashboard',
      },
      {
        key: '/pts/historico',
        label: 'Consulta de Histórico',
        icon: <HistoryOutlined />,
        path: '/pts/historico',
      },
    ],
  },
  {
    key: '/admin',
    label: 'Painel Administrativo',
    icon: <SettingOutlined />,
    path: '/admin',
    roles: ['ADMIN'],
  },
]

/**
 * Filtra a árvore de menus com base nas permissões atuais.
 * @param items Lista de itens originais
 * @param permissions Objeto com permissões booleanas ativas
 * @returns Nova lista com apenas os itens permitidos
 */
export function filterMenuByRoles(
  items: MenuConfigItem[],
  permissions: Record<MenuRole, boolean>
): MenuConfigItem[] {
  return items.reduce<MenuConfigItem[]>((acc, item) => {
    // Verifica se o item possui restrição de roles
    if (item.roles && item.roles.length > 0) {
      const hasPermission = item.roles.some((role) => permissions[role])
      if (!hasPermission) return acc
    }

    const newItem = { ...item }

    // Se tiver filhos, filtra os filhos recursivamente
    if (newItem.children) {
      newItem.children = filterMenuByRoles(newItem.children, permissions)
      // Se após filtrar não sobrar nenhum filho e o grupo for apenas um container, não mostra o grupo
      if (newItem.children.length === 0) {
        return acc
      }
    }

    acc.push(newItem)
    return acc
  }, [])
}
