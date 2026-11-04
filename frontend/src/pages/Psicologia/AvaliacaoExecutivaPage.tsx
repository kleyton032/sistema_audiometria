import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Radio,
  Input,
  Typography,
  Space,
  Tag,
  App,
  Spin,
  Divider,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPsiAvaliacao, getPsiProtocoloAtivo, salvarPsiRascunho } from '@/api/psicologiaService'
import type { PsiAvaliacao, PsiProtocolo, PsiItem } from '@/types/psicologia'

const { Title, Text } = Typography

const ESCALA = [
  { value: 0, label: '0 — Déficit Evidente' },
  { value: 1, label: '1 — Executa com Pistas/Instável' },
  { value: 2, label: '2 — Autônomo/Consolidado' },
]

interface RespostaEstado {
  valor: number | undefined
  observacao: string
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

  const idAvaliacao = Number(id)

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

  const dominios = useMemo(() => {
    if (!protocolo) return [] as { dominio: string; itens: PsiItem[] }[]
    const ordem = new Map<string, PsiItem[]>()
    protocolo.itens.forEach((item) => {
      if (!ordem.has(item.ds_dominio)) ordem.set(item.ds_dominio, [])
      ordem.get(item.ds_dominio)!.push(item)
    })
    return Array.from(ordem.entries()).map(([dominio, itens]) => ({ dominio, itens }))
  }, [protocolo])

  const setValor = (idItem: number, valor: number) =>
    setRespostas((prev) => ({ ...prev, [idItem]: { ...prev[idItem], valor } }))

  const setObservacao = (idItem: number, observacao: string) =>
    setRespostas((prev) => ({ ...prev, [idItem]: { ...prev[idItem], observacao } }))

  const handleSalvar = async () => {
    if (!avaliacao || !protocolo) return
    setSalvando(true)
    try {
      const payloadRespostas = protocolo.itens
        .filter((item) => respostas[item.id_item]?.valor !== undefined)
        .map((item) => ({
          id_item: item.id_item,
          nr_valor: respostas[item.id_item].valor!,
          ds_observacao: respostas[item.id_item].observacao || null,
        }))

      const atualizada = await salvarPsiRascunho(avaliacao.id_avaliacao, {
        respostas: payloadRespostas,
        ds_observacoes: avaliacao.ds_observacoes,
        ds_evolucao: avaliacao.ds_evolucao,
        ds_conduta: avaliacao.ds_conduta,
        nr_revisao: avaliacao.nr_revisao,
      })
      setAvaliacao(atualizada)
      message.success('Rascunho salvo com sucesso.')
    } catch (error: any) {
      message.error(error?.response?.data?.detail ?? 'Erro ao salvar rascunho.')
    } finally {
      setSalvando(false)
    }
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

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/psicologia/pacientes')}>
              Voltar
            </Button>
            <div>
              <Title level={2} style={{ margin: 0 }}>{protocolo.ds_titulo}</Title>
              <Text type="secondary">
                Paciente {avaliacao.cd_paciente}
                {avaliacao.cd_atendimento ? ` · Atendimento ${avaliacao.cd_atendimento}` : ''}
                {' · '}
                {dayjs(avaliacao.dt_clinica).format('DD/MM/YYYY')}
              </Text>
            </div>
          </Space>
          <Space>
            <Tag color={avaliacao.ds_situacao === 'RASCUNHO' ? 'orange' : 'green'}>
              {avaliacao.ds_situacao}
            </Tag>
            {avaliacao.ds_situacao === 'RASCUNHO' && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={salvando}
                onClick={handleSalvar}
              >
                Salvar rascunho
              </Button>
            )}
          </Space>
        </Space>

        <Card variant="borderless">
          <Text strong>Escala de pontuação</Text>
          <Space wrap style={{ marginTop: 8 }}>
            {ESCALA.map((e) => (
              <Tag key={e.value}>{e.label}</Tag>
            ))}
          </Space>
        </Card>

        {dominios.map(({ dominio, itens }) => (
          <Card key={dominio} title={<Text strong style={{ fontSize: 16 }}>{dominio}</Text>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {itens.map((item) => (
                <div key={item.id_item}>
                  <Text strong style={{ fontSize: 15 }}>{item.ds_codigo}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Componente Executivo Alvo: </Text>
                    <Text>{item.ds_componente || '—'}</Text>
                  </div>
                  <div>
                    <Text strong type="secondary">Critério de Observação Prática (10 a 17 anos): </Text>
                    <Text type="secondary">{item.ds_criterio || '—'}</Text>
                  </div>
                  <Radio.Group
                    options={ESCALA}
                    value={respostas[item.id_item]?.valor}
                    onChange={(e) => setValor(item.id_item, e.target.value)}
                    disabled={avaliacao.ds_situacao !== 'RASCUNHO'}
                    aria-label={`Resposta do item ${item.ds_codigo}`}
                  />
                  <Input
                    placeholder="Observação do item (opcional)"
                    value={respostas[item.id_item]?.observacao ?? ''}
                    onChange={(e) => setObservacao(item.id_item, e.target.value)}
                    disabled={avaliacao.ds_situacao !== 'RASCUNHO'}
                    style={{ marginTop: 4 }}
                    aria-label={`Observação do item ${item.ds_codigo}`}
                  />
                  <Divider style={{ margin: '12px 0' }} />
                </div>
              ))}
            </Space>
          </Card>
        ))}
      </Space>
    </div>
  )
}
