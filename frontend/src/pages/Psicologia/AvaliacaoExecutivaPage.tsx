import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Typography,
  Tag,
  App,
  Spin,
  Progress,
  Alert,
  Table,
  Modal,
  Tooltip,
  Input,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getPsiAvaliacao,
  getPsiProtocoloAtivo,
  salvarPsiRascunho,
  finalizarPsiAvaliacao,
} from '@/api/psicologiaService'
import type { PsiAvaliacao, PsiProtocolo, PsiItem } from '@/types/psicologia'

const { Title, Text } = Typography

const ESCALA = [
  { value: 0, label: 'Déficit evidente' },
  { value: 1, label: 'Executa com pistas ou instável' },
  { value: 2, label: 'Autônomo ou consolidado' },
]

interface RespostaEstado {
  valor: number | undefined
  observacao: string
}

interface DominioAgrupado {
  dominio: string
  itens: PsiItem[]
}

interface ContagemDominio {
  pontuados: number
  total: number
  subtotal: number
  maximo: number
}

function EscalaSelector({
  value,
  onChange,
  disabled,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pontuação do item"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
    >
      {ESCALA.map((e) => {
        const selecionado = value === e.value
        return (
          <button
            key={e.value}
            type="button"
            role="radio"
            aria-checked={selecionado}
            disabled={disabled}
            onClick={() => onChange(selecionado ? undefined : e.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 54,
              padding: '10px 14px',
              borderRadius: 8,
              cursor: disabled ? 'not-allowed' : 'pointer',
              border: selecionado ? '2px solid #5568d3' : '2px solid #d5dce3',
              background: selecionado ? '#5568d3' : '#ffffff',
              color: selecionado ? '#ffffff' : '#14212b',
              textAlign: 'left',
              fontFamily: 'inherit',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{e.value}</span>
            <span style={{ fontSize: 13, lineHeight: 1.3 }}>{e.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function CampoObservacao({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [aberta, setAberta] = useState(!!value)

  if (!aberta) {
    return (
      <Button
        type="link"
        icon={<PlusOutlined />}
        onClick={() => setAberta(true)}
        style={{ paddingLeft: 0 }}
      >
        Adicionar observação
      </Button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Input.TextArea
        placeholder="Observação do item (opcional)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoSize={{ minRows: 1, maxRows: 4 }}
        aria-label="Observação do item"
      />
      {!value && (
        <Button
          type="link"
          icon={<MinusOutlined />}
          onClick={() => setAberta(false)}
          style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
        >
          Remover
        </Button>
      )}
    </div>
  )
}

function ItemAvaliacao({
  item,
  estado,
  readOnly,
  onValor,
  onObservacao,
}: {
  item: PsiItem
  estado: RespostaEstado | undefined
  readOnly: boolean
  onValor: (idItem: number, valor: number | undefined) => void
  onObservacao: (idItem: number, observacao: string) => void
}) {
  const pontuado = estado?.valor !== undefined

  return (
    <div style={{ padding: '0 0 20px', borderBottom: '1px solid #f0f0f0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Tag
            style={{
              background: '#eceffb',
              color: '#14212b',
              fontWeight: 700,
              border: 'none',
              borderRadius: 6,
              margin: 0,
            }}
          >
            {item.ds_codigo}
          </Tag>
          <Text strong style={{ fontSize: 16 }}>
            {item.ds_componente || item.ds_codigo}
          </Text>
        </div>
        <Tag color={pontuado ? 'green' : 'default'} style={{ margin: 0 }}>
          {pontuado ? 'Pontuado' : 'Sem pontuação'}
        </Tag>
      </div>

      {item.ds_criterio && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>
          {item.ds_criterio}
        </Text>
      )}

      <EscalaSelector
        value={estado?.valor}
        onChange={(v) => onValor(item.id_item, v)}
        disabled={readOnly}
      />

      <div style={{ marginTop: 6 }}>
        <CampoObservacao
          value={estado?.observacao ?? ''}
          onChange={(v) => onObservacao(item.id_item, v)}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}

export default function AvaliacaoExecutivaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [avaliacao, setAvaliacao] = useState<PsiAvaliacao | null>(null)
  const [protocolo, setProtocolo] = useState<PsiProtocolo | null>(null)
  const [respostas, setRespostas] = useState<Record<number, RespostaEstado>>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null)
  const [dominioAtivo, setDominioAtivo] = useState<string | null>(null)

  const idAvaliacao = Number(id)
  const readOnly = avaliacao?.ds_situacao !== 'RASCUNHO'

  useEffect(() => {
    if (!idAvaliacao) return
    ;(async () => {
      setLoading(true)
      try {
        const [aval, prot] = await Promise.all([
          getPsiAvaliacao(idAvaliacao),
          getPsiProtocoloAtivo(),
        ])
        setAvaliacao(aval)
        setProtocolo(prot)
        const inicial: Record<number, RespostaEstado> = {}
        prot.itens.forEach((item) => {
          inicial[item.id_item] = { valor: undefined, observacao: '' }
        })
        aval.respostas.forEach((r) => {
          inicial[r.id_item] = { valor: r.nr_valor, observacao: r.ds_observacao ?? '' }
        })
        setRespostas(inicial)
      } catch (error: any) {
        message.error(error?.response?.data?.detail ?? 'Erro ao carregar avaliação.')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAvaliacao])

  const dominios = useMemo<DominioAgrupado[]>(() => {
    if (!protocolo) return []
    const ordem = new Map<string, PsiItem[]>()
    protocolo.itens.forEach((item) => {
      if (!ordem.has(item.ds_dominio)) ordem.set(item.ds_dominio, [])
      ordem.get(item.ds_dominio)!.push(item)
    })
    return Array.from(ordem.entries()).map(([dominio, itens]) => ({ dominio, itens }))
  }, [protocolo])

  const contagem = useMemo(() => {
    const porDominio: Record<string, ContagemDominio> = {}
    let pontuados = 0
    let total = 0

    protocolo?.itens.forEach((item) => {
      total += 1
      const base = porDominio[item.ds_dominio] ?? { pontuados: 0, total: 0, subtotal: 0, maximo: 0 }
      base.total += 1
      base.maximo += 2
      const v = respostas[item.id_item]?.valor
      if (v !== undefined) {
        pontuados += 1
        base.pontuados += 1
        base.subtotal += v
      }
      porDominio[item.ds_dominio] = base
    })

    return { total, pontuados, porDominio }
  }, [protocolo, respostas])

  const setValor = (idItem: number, valor: number | undefined) =>
    setRespostas((prev) => ({ ...prev, [idItem]: { ...prev[idItem], valor } }))

  const setObservacao = (idItem: number, observacao: string) =>
    setRespostas((prev) => ({ ...prev, [idItem]: { ...prev[idItem], observacao } }))

  const montarPayload = () => {
    if (!avaliacao || !protocolo) return null
    return {
      respostas: protocolo.itens
        .filter((item) => respostas[item.id_item]?.valor !== undefined)
        .map((item) => ({
          id_item: item.id_item,
          nr_valor: respostas[item.id_item].valor!,
          ds_observacao: respostas[item.id_item].observacao || null,
        })),
      ds_observacoes: avaliacao.ds_observacoes,
      ds_evolucao: avaliacao.ds_evolucao,
      ds_conduta: avaliacao.ds_conduta,
      nr_revisao: avaliacao.nr_revisao,
    }
  }

  const handleSalvar = async () => {
    const payload = montarPayload()
    if (!avaliacao || !payload) return
    setSalvando(true)
    try {
      const atualizada = await salvarPsiRascunho(avaliacao.id_avaliacao, payload)
      setAvaliacao(atualizada)
      setUltimoSalvo(new Date())
      message.success('Rascunho salvo com sucesso.')
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? 'Erro ao salvar rascunho.')
    } finally {
      setSalvando(false)
    }
  }

  const handleFinalizar = () => {
    const payload = montarPayload()
    if (!avaliacao || !payload) return

    Modal.confirm({
      title: 'Finalizar avaliação?',
      content: 'Após finalizar, a avaliação não poderá mais ser editada.',
      okText: 'Finalizar',
      cancelText: 'Voltar',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const atualizada = await finalizarPsiAvaliacao(avaliacao.id_avaliacao, payload)
          setAvaliacao(atualizada)
          message.success('Avaliação finalizada com sucesso.')
        } catch (error: any) {
          message.error(error?.response?.data?.detail ?? 'Erro ao finalizar avaliação.')
          throw error
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" tip="Carregando avaliação..." />
      </div>
    )
  }

  if (!avaliacao || !protocolo) {
    return <div style={{ padding: 24 }}>Avaliação não encontrada.</div>
  }

  const percentual = contagem.total ? Math.round((contagem.pontuados / contagem.total) * 100) : 0
  const pendentes = contagem.total - contagem.pontuados
  const faixaEtaria =
    protocolo.ds_faixa_etaria ??
    (protocolo.nr_idade_min != null && protocolo.nr_idade_max != null
      ? `${protocolo.nr_idade_min} a ${protocolo.nr_idade_max} anos`
      : null)

  const irPara = (dominio: string, idx: number) => {
    setDominioAtivo(dominio)
    document.getElementById(`dominio-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/psicologia/pacientes')}>
            Voltar
          </Button>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {protocolo.ds_titulo}
            </Title>
            <Text type="secondary">
              Paciente {avaliacao.cd_paciente}
              {avaliacao.cd_atendimento ? ` · Atendimento ${avaliacao.cd_atendimento}` : ''}
              {' · '}
              {dayjs(avaliacao.dt_clinica).format('DD/MM/YYYY')}
            </Text>
          </div>
          <Tag color={avaliacao.ds_situacao === 'RASCUNHO' ? 'orange' : 'green'}>
            {avaliacao.ds_situacao}
          </Tag>
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {ultimoSalvo && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Rascunho salvo às {dayjs(ultimoSalvo).format('HH:mm')}
              </Text>
            )}
            <Button icon={<SaveOutlined />} loading={salvando} onClick={handleSalvar}>
              Salvar rascunho
            </Button>
            <Tooltip
              title={
                pendentes > 0 ? `${pendentes} item(ns) ainda sem pontuação.` : undefined
              }
            >
              <Button
                type="primary"
                icon={<FileDoneOutlined />}
                disabled={pendentes > 0}
                onClick={handleFinalizar}
              >
                Finalizar avaliação
              </Button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Progresso + escala */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Text type="secondary">Progresso</Text>
            <Progress
              percent={percentual}
              format={() => `${contagem.pontuados} de ${contagem.total} itens`}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text strong>Escala:</Text>
            {ESCALA.map((e) => (
              <Tag
                key={e.value}
                style={{ margin: 0, borderRadius: 16, padding: '4px 12px', fontSize: 13 }}
              >
                <b>{e.value}</b> {e.label}
              </Tag>
            ))}
          </div>
        </div>
        {faixaEtaria && (
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Faixa do protocolo: {faixaEtaria}
          </Text>
        )}
      </Card>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Sidebar de domínios */}
        <Card
          style={{ width: 260, flexShrink: 0, position: 'sticky', top: 16 }}
          styles={{ body: { padding: 8 } }}
        >
          <Text
            strong
            style={{
              display: 'block',
              padding: '4px 8px',
              textTransform: 'uppercase',
              fontSize: 12,
              color: '#6b7280',
              letterSpacing: 0.5,
            }}
          >
            Domínios
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dominios.map(({ dominio }, idx) => {
              const c = contagem.porDominio[dominio]
              const completo = !!c && c.pontuados === c.total
              const ativo = dominioAtivo === dominio || (dominioAtivo === null && idx === 0)
              return (
                <button
                  key={dominio}
                  type="button"
                  onClick={() => irPara(dominio, idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'left',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: ativo ? '#eceffb' : 'transparent',
                    borderLeft: ativo ? '4px solid #5568d3' : '4px solid transparent',
                    fontFamily: 'inherit',
                  }}
                >
                  {completo ? (
                    <CheckCircleOutlined style={{ color: '#1b6b3a' }} />
                  ) : (
                    <ClockCircleOutlined
                      style={{ color: c && c.pontuados > 0 ? '#5568d3' : '#9aa4af' }}
                    />
                  )}
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 700, color: '#14212b' }}>
                      {dominio}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>
                      {c ? `${c.pontuados} de ${c.total} itens pontuados` : '—'}
                    </span>
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() =>
                document.getElementById('resumo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            >
              <FileDoneOutlined />
              <span style={{ fontWeight: 700, color: '#14212b' }}>Resumo da avaliação</span>
            </button>
          </div>
        </Card>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dominios.map(({ dominio, itens }, idx) => {
            const c = contagem.porDominio[dominio]
            const completo = !!c && c.pontuados === c.total
            return (
              <Card key={dominio} id={`dominio-${idx}`} style={{ scrollMarginTop: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Title level={4} style={{ margin: 0 }}>
                    {dominio}
                  </Title>
                  <Tag
                    color={completo ? 'green' : c && c.pontuados > 0 ? 'blue' : 'default'}
                  >
                    {c ? `${c.pontuados} de ${c.total} itens` : ''}
                  </Tag>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {itens.map((item) => (
                    <ItemAvaliacao
                      key={item.id_item}
                      item={item}
                      estado={respostas[item.id_item]}
                      readOnly={readOnly}
                      onValor={setValor}
                      onObservacao={setObservacao}
                    />
                  ))}
                </div>
              </Card>
            )
          })}

          {/* Resumo da avaliação */}
          <Card id="resumo" style={{ scrollMarginTop: 16, border: '2px solid #5568d3' }}>
            <Title level={4} style={{ marginTop: 0 }}>
              Resumo da avaliação
            </Title>

            {pendentes > 0 ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={`${pendentes} item(ns) ainda sem pontuação. Pontue todos os itens para finalizar a avaliação.`}
              />
            ) : (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 12 }}
                message="Todos os itens foram pontuados. Pronto para finalizar."
              />
            )}

            <Table
              dataSource={dominios.map(({ dominio }) => {
                const c = contagem.porDominio[dominio]
                return {
                  key: dominio,
                  dominio,
                  pontuados: `${c?.pontuados ?? 0} de ${c?.total ?? 0}`,
                  pontos:
                    c && c.pontuados > 0 ? `${c.subtotal} pontos` : 'Sem pontuação',
                }
              })}
              columns={[
                { title: 'Domínio', dataIndex: 'dominio' },
                { title: 'Itens pontuados', dataIndex: 'pontuados', width: 180 },
                { title: 'Pontos parciais', dataIndex: 'pontos', width: 180 },
              ]}
              pagination={false}
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              A pontuação final segue as regras do protocolo e é consolidada ao finalizar.
            </Text>
          </Card>
        </div>
      </div>
    </div>
  )
}
