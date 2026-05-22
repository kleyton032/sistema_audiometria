import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, Result, Button } from 'antd'
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs'
import ptBR from 'antd/locale/pt_BR'
import { ErrorBoundary } from 'react-error-boundary'
import { AuthProvider } from '@/contexts'
import { ProtectedRoute, AppLayout } from '@/components'
import { LoginPage } from '@/pages/Login'
import { HomePage } from '@/pages/Home'
import { AudiometriaPage } from '@/pages/Audiometria'
import { ImitanciometriaPage } from '@/pages/Imitanciometria'
import { PacientesPage } from '@/pages/Pacientes'
import { ConsultaPage } from '@/pages/Consulta'
import { PTSPage, PtsPacientesPage, PtsDashboardPage } from '@/pages/PTS'
import { AdminPage } from '@/pages/Admin'
import { useAuth } from '@/contexts'

/** Rota acessível apenas para perfil ADMIN. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  return isAdmin ? <>{children}</> : <Navigate to="/home" replace />
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
      <Result
        status="500"
        title="Ocorreu um erro inesperado"
        subTitle={error?.message || "Houve uma falha ao renderizar a tela. Os dados não salvos podem ter sido perdidos."}
        extra={
          <Button type="primary" onClick={resetErrorBoundary}>
            Tentar Novamente
          </Button>
        }
      />
    </div>
  )
}

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
                      <ErrorBoundary FallbackComponent={ErrorFallback}>
                        <AppLayout />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/pacientes" element={<PacientesPage />} />
                  <Route path="/consulta" element={<ConsultaPage />} />
                  <Route path="/audiometria" element={<AudiometriaPage />} />
                  <Route path="/imitanciometria" element={<ImitanciometriaPage />} />
                  <Route path="/pts/pacientes" element={<PtsPacientesPage />} />
                  <Route path="/pts/dashboard" element={<PtsDashboardPage />} />
                  <Route path="/pts" element={<PTSPage />} />

                  {/* Painel Administrativo — exclusivo para ADMIN */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* Redirect padrão */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
