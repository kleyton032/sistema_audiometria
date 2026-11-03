
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Avatar, Typography } from 'antd'
import { UserOutlined, LogoutOutlined, ProfileOutlined } from '@ant-design/icons'
import { User } from '@/types'
import './Header.css'

const { Text } = Typography

interface UserProfileDropdownProps {
  usuario: User | null
  onOpenProfile: () => void
  onLogout: () => void
}

export function UserProfileDropdown({ usuario, onOpenProfile, onLogout }: UserProfileDropdownProps) {
  const [open, setOpen] = useState(false)

  if (!usuario) return null

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="HeaderAvatarButton" aria-label="Menu do Usuário">
          <Avatar size={36} icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="DropdownMenuContent" sideOffset={8} align="end">
          {/* Info do Usuário */}
          <div className="DropdownUserInfo">
            <Text strong style={{ display: 'block', fontSize: 14 }}>{usuario.nm_usuario}</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              {usuario.ds_email || usuario.nm_login}
            </Text>
            <div style={{ marginTop: 4 }}>
               <Text style={{ fontSize: 11, background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>
                 {usuario.ds_perfil}
               </Text>
            </div>
          </div>

          <DropdownMenu.Separator className="DropdownMenuSeparator" />

          {/* Opções */}
          <DropdownMenu.Item 
            className="DropdownMenuItem" 
            onSelect={() => {
              // Fecha o menu antes de abrir o Drawer para não ficar sobreposto
              setOpen(false)
              setTimeout(onOpenProfile, 50)
            }}
          >
            <ProfileOutlined /> Ver Perfil Completo
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="DropdownMenuSeparator" />
          
          <DropdownMenu.Item 
            className="DropdownMenuItem danger" 
            onSelect={() => {
              setOpen(false)
              setTimeout(onLogout, 50)
            }}
          >
            <LogoutOutlined /> Sair do Sistema
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="DropdownMenuArrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
