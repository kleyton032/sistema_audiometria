import { useState, useEffect, useRef } from 'react'
import { Layout as AntLayout, theme } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { Sidebar } from './Sidebar/Sidebar'
import { MenuRole } from '../config/menuConfig'
import { AppHeader } from './Header/AppHeader'
import { UserProfileDrawer } from './Profile/UserProfileDrawer'
import { ReLoginModal } from './ReLoginModal'

const { Content } = AntLayout

// nm_tip_presta do MV para Fonoaudiólogo (cd_tip_presta = 6)
const NM_TIP_FONOAUDIOLOGO = 'FONOAUDIOLOGO(A)'

// ── Mapa de nomes legíveis para cada rota ──────────────────────────────────
const ROUTE_NAMES: Record<string, string> = {
  '/home':                'Início',
  '/pacientes':           'Pacientes — Audiometrias',
  '/consulta':            'Laudos e Consultas',
  '/pts/pacientes':       'Lista de Pacientes do PTS',
  '/pts/dashboard':       'Dashboard PTS',
  '/pts':                 'Projeto Terapêutico Singular',
  '/psicologia/anamnese': 'Psicologia — Anamnese',
  '/psicologia/evolucao': 'Psicologia — Evolução',
  '/psicologia/avaliacao':'Psicologia — Avaliação',
  '/psicologia':          'Psicologia',
  '/admin':               'Painel Administrativo',
}

function routeLabel(pathname: string): string {
  // Correspondência exata primeiro
  if (ROUTE_NAMES[pathname]) return ROUTE_NAMES[pathname]
  // Prefixo mais longo
  const match = Object.keys(ROUTE_NAMES)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? ROUTE_NAMES[match] : 'Página'
}

/**
 * RouteAnnouncer — anuncia mudanças de rota para leitores de tela via aria-live.
 * Também move o foco para o primeiro h1 do conteúdo principal após a navegação,
 * garantindo que o usuário saiba exatamente onde está.
 */
function RouteAnnouncer() {
  const location = useLocation()
  const [announcement, setAnnouncement] = useState('')
  // Evita anunciar na montagem inicial
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const label = routeLabel(location.pathname)
    // Limpa antes de definir para forçar re-anúncio se a mesma rota for acessada
    setAnnouncement('')

    const announceTimer = setTimeout(() => {
      setAnnouncement(`Navegou para: ${label}`)
    }, 50)

    // Foca o h1 do conteúdo principal após a navegação
    const focusTimer = setTimeout(() => {
      const main = document.getElementById('main-content')
      const heading = main?.querySelector<HTMLElement>('h1')
      if (heading) {
        // tabIndex temporário para permitir foco programático
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: false })
      }
    }, 150)

    return () => {
      clearTimeout(announceTimer)
      clearTimeout(focusTimer)
    }
  }, [location.pathname])

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [profileVisible, setProfileVisible] = useState(false)
  const navigate = useNavigate()
  const { logout, usuario, isAdmin, isSupervisor, isCoordenador } = useAuth()
  const { token: themeToken } = theme.useToken()

  const isFonoaudiologo = usuario?.nm_tip_presta === NM_TIP_FONOAUDIOLOGO

  const permissions: Record<MenuRole, boolean> = {
    ADMIN: !!isAdmin,
    SUPERVISOR: !!isSupervisor,
    COORDENADOR: !!isCoordenador,
    FONOAUDIOLOGO: !!isFonoaudiologo,
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Skip link para acessibilidade */}
      <a 
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          background: '#000',
          color: '#fff',
          padding: '8px 12px',
          zIndex: 100,
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Pular para conteúdo principal
      </a>
      
      <Sidebar
        collapsed={collapsed}
        permissions={permissions}
      />


      <AntLayout>
        <AppHeader 
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          usuario={usuario}
          onOpenProfile={() => setProfileVisible(true)}
          onLogout={handleLogout}
        />
        <RouteAnnouncer />
        <Content
          id="main-content"
          role="main"
          aria-label="Conteúdo principal da aplicação"
          style={{
            margin: 24,
            padding: 24,
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadiusLG,
            minHeight: 360,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>

      <UserProfileDrawer 
        open={profileVisible}
        onClose={() => setProfileVisible(false)}
        usuario={usuario}
      />

      <ReLoginModal />

      <style>{`
        .skip-link:focus {
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          padding: 12px;
          z-index: 1000;
        }
      `}</style>
    </AntLayout>
  )
}
