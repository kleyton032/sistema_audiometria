import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import {
  TeamOutlined,
  SearchOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import { getHomeStats, type HomeStats } from '../../api/homeService'
import { useAuth } from '@/contexts'

export default function HomePage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [stats, setStats] = useState<HomeStats>({
    resumo_mes: { pts_finalizados: 0, exames_realizados: 0 },
    pendencias: { pts_rascunho: 0, exames_pendentes: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHomeStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const primeiroNome = usuario?.nm_usuario?.split(' ')[0] ?? 'Colega'
  const totalPendencias = stats.pendencias.pts_rascunho + stats.pendencias.exames_pendentes

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    color: '#14212b',
    fontFamily: '"Atkinson Hyperlegible", Inter, sans-serif',
  }

  const visuallyHidden: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }

  return (
    <div style={containerStyle}>
      {/* Live region acessível para leitores de tela */}
      <div role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
        {loading ? 'Carregando dados da página inicial…' : 'Dados da página inicial carregados.'}
      </div>

      {/* ── Cabeçalho de boas-vindas ──────────────────────────────── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#14212b',
          }}
        >
          Olá, {primeiroNome}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.5,
            color: '#44525e',
          }}
        >
          Veja o resumo do seu dia e a sua produtividade neste mês.
        </p>
      </header>

      {/* ── Spinner acessível enquanto carrega ────────────────────── */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            gap: 16,
          }}
          aria-hidden="true"
        >
          <Spin size="large" />
          <span style={{ fontSize: 16, color: '#44525e' }}>Carregando dados…</span>
        </div>
      ) : (
        <>
          {/* ── Grid: Pendências + Ações Rápidas ────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* Pendências */}
            <section
              aria-labelledby="pendencias-heading"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                padding: 24,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <h2
                id="pendencias-heading"
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  color: '#14212b',
                }}
              >
                Minhas pendências
              </h2>

              <div aria-live="polite" aria-atomic="true" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {totalPendencias === 0 ? (
                  <div
                    role="status"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 20,
                      backgroundColor: '#f3f5f7',
                      borderLeft: '6px solid #1b6b3a',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', width: 32, height: 32, flexShrink: 0, color: '#1b6b3a' }}>
                      <CheckCircleOutlined style={{ fontSize: 28 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, color: '#14212b' }}>
                        Tudo em dia!
                      </span>
                      <span style={{ fontSize: 16, lineHeight: 1.5, color: '#44525e' }}>
                        Você não possui pendências ou rascunhos no momento.
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {stats.pendencias.pts_rascunho > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 20,
                          padding: 20,
                          backgroundColor: '#f3f5f7',
                          borderLeft: '6px solid #b3261e',
                          borderRadius: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                          <div style={{ display: 'flex', width: 32, height: 32, flexShrink: 0, color: '#b3261e' }}>
                            <ExclamationCircleOutlined style={{ fontSize: 30 }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                lineHeight: 1.4,
                                color: '#14212b',
                              }}
                            >
                              {stats.pendencias.pts_rascunho} PTS em rascunho
                            </span>
                            <span style={{ fontSize: 16, lineHeight: 1.5, color: '#44525e' }}>
                              Foram salvos, mas ainda não foram finalizados.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/pts/pacientes')}
                          aria-label={`Ver pacientes com ${stats.pendencias.pts_rascunho} PTS em rascunho`}
                          style={{
                            display: 'inline-flex',
                            minHeight: 48,
                            flexShrink: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0 20px',
                            backgroundColor: '#5568d3',
                            borderRadius: 6,
                            color: '#ffffff',
                            fontSize: 16,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          <span>Ver pacientes</span>
                          <ArrowRightOutlined style={{ fontSize: 18 }} />
                        </button>
                      </div>
                    )}

                    {stats.pendencias.exames_pendentes > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 20,
                          padding: 20,
                          backgroundColor: '#f3f5f7',
                          borderLeft: '6px solid #b3261e',
                          borderRadius: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                          <div style={{ display: 'flex', width: 32, height: 32, flexShrink: 0, color: '#b3261e' }}>
                            <ExclamationCircleOutlined style={{ fontSize: 30 }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 20,
                                fontWeight: 700,
                                lineHeight: 1.4,
                                color: '#14212b',
                              }}
                            >
                              {stats.pendencias.exames_pendentes} Exames aguardando laudo
                            </span>
                            <span style={{ fontSize: 16, lineHeight: 1.5, color: '#44525e' }}>
                              Existem exames criados que ainda não possuem laudo.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/pacientes')}
                          aria-label={`Ir para os ${stats.pendencias.exames_pendentes} exames pendentes de laudo`}
                          style={{
                            display: 'inline-flex',
                            minHeight: 48,
                            flexShrink: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0 20px',
                            backgroundColor: '#5568d3',
                            borderRadius: 6,
                            color: '#ffffff',
                            fontSize: 16,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          <span>Ir para Exames</span>
                          <ArrowRightOutlined style={{ fontSize: 18 }} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Ações Rápidas */}
            <nav
              aria-label="Ações rápidas"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 24,
                backgroundColor: '#ffffff',
                border: '1px solid #d5dce3',
                borderRadius: 8,
              }}
            >
              <h2
                style={{
                  margin: '0 0 4px 0',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  color: '#14212b',
                }}
              >
                Ações rápidas
              </h2>

              <button
                type="button"
                onClick={() => navigate('/pts/pacientes')}
                style={{
                  display: 'flex',
                  minHeight: 60,
                  alignItems: 'center',
                  gap: 14,
                  padding: '0 18px',
                  backgroundColor: '#5568d3',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 17,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                <TeamOutlined style={{ fontSize: 22, flexShrink: 0 }} />
                <span style={{ flex: '1 1 0%' }}>Buscar paciente para PTS</span>
                <ArrowRightOutlined style={{ fontSize: 18, flexShrink: 0 }} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/pacientes')}
                style={{
                  display: 'flex',
                  minHeight: 60,
                  alignItems: 'center',
                  gap: 14,
                  padding: '0 18px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #5568d3',
                  borderRadius: 6,
                  color: '#5568d3',
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                <SearchOutlined style={{ fontSize: 22, flexShrink: 0 }} />
                <span style={{ flex: '1 1 0%' }}>Buscar paciente para exame</span>
                <ArrowRightOutlined style={{ fontSize: 18, flexShrink: 0 }} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/consulta')}
                style={{
                  display: 'flex',
                  minHeight: 60,
                  alignItems: 'center',
                  gap: 14,
                  padding: '0 18px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #5568d3',
                  borderRadius: 6,
                  color: '#5568d3',
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                <FileTextOutlined style={{ fontSize: 22, flexShrink: 0 }} />
                <span style={{ flex: '1 1 0%' }}>Consultar laudos</span>
                <ArrowRightOutlined style={{ fontSize: 18, flexShrink: 0 }} />
              </button>
            </nav>
          </div>

          {/* ── Produtividade Mensal ───────────────────────────────── */}
          <section
            aria-labelledby="produtividade-heading"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2
              id="produtividade-heading"
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.5,
                color: '#14212b',
              }}
            >
              Produtividade do mês
            </h2>

            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                gap: 24,
                margin: 0,
                padding: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: 24,
                  backgroundColor: '#ffffff',
                  border: '1px solid #d5dce3',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#eceffb',
                    borderRadius: 6,
                    color: '#5568d3',
                  }}
                  aria-hidden="true"
                >
                  <FileTextOutlined style={{ fontSize: 30 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <dd
                    style={{
                      margin: 0,
                      fontSize: 40,
                      fontWeight: 700,
                      lineHeight: 1.1,
                      color: '#14212b',
                    }}
                  >
                    {stats.resumo_mes.pts_finalizados}
                  </dd>
                  <dt
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: 1.5,
                      color: '#14212b',
                    }}
                  >
                    PTS elaborados ou revisados
                  </dt>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#44525e' }}>
                    {stats.resumo_mes.pts_finalizados === 0
                      ? 'Mês atual · nenhum registro até agora'
                      : `Mês atual · ${stats.resumo_mes.pts_finalizados} registro${stats.resumo_mes.pts_finalizados !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: 24,
                  backgroundColor: '#ffffff',
                  border: '1px solid #d5dce3',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#eceffb',
                    borderRadius: 6,
                    color: '#5568d3',
                  }}
                  aria-hidden="true"
                >
                  <SoundOutlined style={{ fontSize: 30 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <dd
                    style={{
                      margin: 0,
                      fontSize: 40,
                      fontWeight: 700,
                      lineHeight: 1.1,
                      color: '#14212b',
                    }}
                  >
                    {stats.resumo_mes.exames_realizados}
                  </dd>
                  <dt
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: 1.5,
                      color: '#14212b',
                    }}
                  >
                    Exames realizados
                  </dt>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: '#44525e' }}>
                    {stats.resumo_mes.exames_realizados === 0
                      ? 'Mês atual · nenhum registro até agora'
                      : `Mês atual · ${stats.resumo_mes.exames_realizados} registro${stats.resumo_mes.exames_realizados !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  )
}
