/**
 * HomePage — reconstruída com React Aria Components para garantir
 * acessibilidade completa com leitores de tela (NVDA, JAWS, VoiceOver).
 *
 * Princípios aplicados:
 *  - Hierarquia de headings semântica (h1 → h2)
 *  - Landmarks: <section aria-labelledby>, <nav aria-label>
 *  - Região ao vivo (aria-live="polite") para o estado de carregamento
 *  - Botões via React Aria Button — suporte nativo a teclado e anúncio
 *  - Emojis decorativos com aria-hidden="true"
 *  - Estatísticas com <dl>/<dt>/<dd> — lidos como "termo: valor" pelo NVDA
 *  - Alvos de clique mínimos 44×44 px (WCAG 2.5.8)
 *  - Indicadores de foco visíveis e contrastados (outline 3 px)
 */
import { useEffect, useState } from 'react'
import { Button } from 'react-aria-components'
import { useNavigate } from 'react-router-dom'
import { getHomeStats, type HomeStats } from '../../api/homeService'
import { useAuth } from '@/contexts'
import styles from './HomePage.module.css'

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

  const totalPendencias =
    stats.pendencias.pts_rascunho + stats.pendencias.exames_pendentes

  const primeiroNome = usuario?.nm_usuario?.split(' ')[0] ?? ''

  return (
    <>
      {/*
        Região ao vivo oculta visualmente.
        O NVDA anuncia a mudança quando loading passa de true → false.
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.visuallyHidden}
      >
        {loading ? 'Carregando dados da página inicial…' : 'Dados carregados.'}
      </div>

      {/* ── Cabeçalho de boas-vindas ──────────────────────────────── */}
      <header className={styles.header}>
        <h1 className={styles.greeting}>
          Olá, {primeiroNome} <span aria-hidden="true">👋</span>
        </h1>
        <p className={styles.subtitle}>
          Aqui está o resumo do seu dia e produtividade do mês.
        </p>
      </header>

      {/* ── Spinner acessível enquanto carrega ────────────────────── */}
      {loading && (
        <div
          className={styles.loadingWrapper}
          aria-hidden="true"
        >
          <div className={styles.spinner} />
        </div>
      )}

      {!loading && (
        <>
          {/* ── Grid: Pendências + Ações Rápidas ────────────────────── */}
          <div className={styles.twoColGrid}>

            {/* Pendências */}
            <section
              aria-labelledby="pendencias-heading"
              className={styles.card}
            >
              <h2 id="pendencias-heading" className={styles.cardTitle}>
                <span aria-hidden="true">⚠️</span> Minhas Pendências
              </h2>

              {/*
                aria-live="polite" + aria-atomic="true": o NVDA relê o bloco
                completo sempre que o conteúdo mudar (ex.: após salvar um PTS).
              */}
              <div aria-live="polite" aria-atomic="true">
                {totalPendencias === 0 ? (
                  <div className={styles.alertSuccess} role="status">
                    <span className={styles.alertIcon} aria-hidden="true">
                      ✅
                    </span>
                    <div>
                      <strong>Tudo em dia!</strong>
                      <p>
                        Você não possui pendências ou rascunhos no momento.
                        Ótimo trabalho!
                      </p>
                    </div>
                  </div>
                ) : (
                  <ul
                    className={styles.alertList}
                    aria-label="Lista de pendências"
                  >
                    {stats.pendencias.pts_rascunho > 0 && (
                      <li>
                        <div className={styles.alertWarning}>
                          <div>
                            <strong>
                              {stats.pendencias.pts_rascunho} PTS em Rascunho
                            </strong>
                            <p>
                              Existem Projetos Terapêuticos Singulares salvos
                              mas ainda não finalizados.
                            </p>
                          </div>
                          <Button
                            className={styles.alertAction}
                            onPress={() => navigate('/pts/pacientes')}
                            aria-label={`Ver pacientes com ${stats.pendencias.pts_rascunho} PTS em rascunho`}
                          >
                            Ver Pacientes
                          </Button>
                        </div>
                      </li>
                    )}

                    {stats.pendencias.exames_pendentes > 0 && (
                      <li>
                        <div className={styles.alertWarning}>
                          <div>
                            <strong>
                              {stats.pendencias.exames_pendentes} Exames
                              aguardando Laudo
                            </strong>
                            <p>
                              Existem exames criados que ainda não possuem
                              laudo ou não foram finalizados.
                            </p>
                          </div>
                          <Button
                            className={styles.alertAction}
                            onPress={() => navigate('/pacientes')}
                            aria-label={`Ir para os ${stats.pendencias.exames_pendentes} exames pendentes de laudo`}
                          >
                            Ir para Exames
                          </Button>
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </section>

            {/* Ações Rápidas — nav porque navega para outras páginas */}
            <nav aria-label="Ações rápidas" className={styles.card}>
              <h2 className={styles.cardTitle}>Ações Rápidas</h2>

              <ul className={styles.actionList}>
                <li>
                  <Button
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    onPress={() => navigate('/pts/pacientes')}
                  >
                    <span aria-hidden="true" className={styles.btnIcon}>
                      👥
                    </span>
                    Buscar Paciente p/ PTS
                  </Button>
                </li>
                <li>
                  <Button
                    className={styles.actionBtn}
                    onPress={() => navigate('/pacientes')}
                  >
                    <span aria-hidden="true" className={styles.btnIcon}>
                      👥
                    </span>
                    Buscar Paciente p/ Exame
                  </Button>
                </li>
                <li>
                  <Button
                    className={styles.actionBtn}
                    onPress={() => navigate('/consulta')}
                  >
                    <span aria-hidden="true" className={styles.btnIcon}>
                      🔍
                    </span>
                    Consultar Laudos
                  </Button>
                </li>
              </ul>
            </nav>
          </div>

          {/* ── Produtividade Mensal ───────────────────────────────── */}
          <section
            aria-labelledby="produtividade-heading"
            className={styles.produtividadeSection}
          >
            <h2
              id="produtividade-heading"
              className={styles.sectionDivider}
            >
              Produtividade Mensal
            </h2>

            {/*
              <dl>/<dt>/<dd>: o NVDA lê naturalmente como
              "PTS Elaborados/Revisados (Mês atual) — 1"
            */}
            <dl className={styles.statsGrid}>
              <div className={styles.statCard}>
                <dt className={styles.statLabel}>
                  <span aria-hidden="true">📄</span>
                  PTS Elaborados/Revisados (Mês atual)
                </dt>
                <dd className={styles.statValue}>
                  {stats.resumo_mes.pts_finalizados}
                </dd>
              </div>

              <div className={styles.statCard}>
                <dt className={styles.statLabel}>
                  <span aria-hidden="true">🔊</span>
                  Exames Realizados (Mês atual)
                </dt>
                <dd className={styles.statValue}>
                  {stats.resumo_mes.exames_realizados}
                </dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </>
  )
}
