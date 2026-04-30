import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs'
import ptBR from 'antd/locale/pt_BR'
import { AuthProvider } from '@/contexts'
import { ProtectedRoute, AppLayout } from '@/components'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { AudiometriaPage } from '@/pages/Audiometria'
import { ImitanciometriaPage } from '@/pages/Imitanciometria'
import { PacientesPage } from '@/pages/Pacientes'
import { ConsultaPage } from '@/pages/Consulta'
import { PTSPage, PtsPacientesPage } from '@/pages/PTS'

export default function App() {
  return (
    <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
      <ConfigProvider
        locale={ptBR}
        theme={{
          hashed: false,
          token: {
            colorPrimary: '#667eea',
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Rotas protegidas */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/pacientes" element={<PacientesPage />} />
                  <Route path="/consulta" element={<ConsultaPage />} />
                  <Route path="/audiometria" element={<AudiometriaPage />} />
                  <Route path="/imitanciometria" element={<ImitanciometriaPage />} />
                  <Route path="/pts/pacientes" element={<PtsPacientesPage />} />
                  <Route path="/pts" element={<PTSPage />} />
                </Route>

                {/* Redirect padrão */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
