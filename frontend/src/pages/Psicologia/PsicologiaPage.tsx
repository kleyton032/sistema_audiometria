import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Tabs } from 'antd'
import { FileProtectOutlined, SearchOutlined, DashboardOutlined } from '@ant-design/icons'
import AnamnesePage from './Anamnese/AnamnesePage'
import EvolucaoPage from './Evolucao/EvolucaoPage'
import AvaliacaoPage from './Avaliacao/AvaliacaoPage'

const tabConfig = [
  {
    key: 'anamnese',
    label: 'Anamnese',
    icon: <FileProtectOutlined />,
    path: '/psicologia/anamnese',
  },
  {
    key: 'evolucao',
    label: 'Evolução',
    icon: <SearchOutlined />,
    path: '/psicologia/evolucao',
  },
  {
    key: 'avaliacao',
    label: 'Avaliação',
    icon: <DashboardOutlined />,
    path: '/psicologia/avaliacao',
  },
]

export default function PsicologiaPage() {
  const location = useLocation()

  // Determina a aba ativa com base na rota atual
  const getActiveTab = () => {
    if (location.pathname.includes('anamnese')) return 'anamnese'
    if (location.pathname.includes('evolucao')) return 'evolucao'
    if (location.pathname.includes('avaliacao')) return 'avaliacao'
    return 'anamnese'
  }

  const handleTabChange = (key: string) => {
    const tab = tabConfig.find((t) => t.key === key)
    if (tab) {
      window.location.hash = tab.path
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Psicologia</h1>

      <Tabs
        activeKey={getActiveTab()}
        onChange={handleTabChange}
        items={tabConfig.map((tab) => ({
          key: tab.key,
          label: (
            <span>
              {tab.icon}
              <span style={{ marginLeft: '8px' }}>{tab.label}</span>
            </span>
          ),
        }))}
      />

      <div style={{ marginTop: '24px' }}>
        <Routes>
          <Route path="anamnese/*" element={<AnamnesePage />} />
          <Route path="evolucao/*" element={<EvolucaoPage />} />
          <Route path="avaliacao/*" element={<AvaliacaoPage />} />
          <Route path="*" element={<Navigate to="anamnese" replace />} />
        </Routes>
      </div>
    </div>
  )
}
