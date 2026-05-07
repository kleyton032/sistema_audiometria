import { useState, useEffect } from 'react'
import { getPTSObjetivosPorEspecialidade, getOutrosPTSVigencia } from '@/api/ptsService'
import type { OutroPTSItem } from '@/api/ptsService'
import {
  Collapse,
  Segmented,
  Select,
  Input,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Badge,
  Button,
  Modal,
  Tooltip,
  Divider,
} from 'antd'
import {
  MedicineBoxOutlined,
  SoundOutlined,
  HeartOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  ExperimentOutlined,
  ReadOutlined,
  RobotOutlined,
  LockOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import React, { ReactNode, memo, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts'

const { Text } = Typography

// ── tipos ────────────────────────────────────────────────────────────────────
export interface ObjetivoItem {
  objetivo: string | undefined
  descricao: string | undefined
  status: string | undefined   // usado apenas em "anterior"
  motivo: string | undefined   // usado apenas em "anterior", quando status ≠ Alcançado
}

export type MomentoObjetivos = 'anterior' | 'atual'

export interface ObjetivosEspecialidade {
  anterior: [ObjetivoItem, ObjetivoItem, ObjetivoItem]
  atual: [ObjetivoItem, ObjetivoItem, ObjetivoItem]
}

export type ObjetivosState = Record<string, ObjetivosEspecialidade>

// ── listas de opções ─────────────────────────────────────────────────────────
const STATUS_EVOLUCAO = [
  { value: 'ALCANCADO',    label: 'Alcançado' },
  { value: 'PARCIAL',      label: 'Parcialmente Alcançado' },
  { value: 'NAO_ALCANCADO',label: 'Não Alcançado' },
  { value: 'NAO_SE_APLICA',label: 'Não se Aplica' },
]

const MOTIVOS_NAO_ALCANCADO = [
  { value: 'ALTA_FALTAS',          label: 'Alta quantidade de faltas' },
  { value: 'INTERCORRENCIA_SAUDE', label: 'Intercorrência de saúde' },
  { value: 'BAIXA_ADESAO',         label: 'Baixa adesão do paciente/família' },
  { value: 'COMPLEXIDADE_CASO',    label: 'Complexidade do caso' },
  { value: 'TEMPO_INSUFICIENTE',   label: 'Tempo insuficiente de tratamento' },
  { value: 'FALTA_RECURSO',        label: 'Falta de recurso/equipamento' },
  { value: 'OUTROS',               label: 'Outros' },
]

// Apenas esses status exigem motivo
function exigeMotivo(status: string | undefined) {
  return status === 'PARCIAL' || status === 'NAO_ALCANCADO'
}

// TODO: As listas agora são carregadas dinamicamente via API no componente principal

// ── especialidades ────────────────────────────────────────────────────────────
interface Especialidade {
  key: string
  label: string
  icon: ReactNode
  color: string
}

const ESPECIALIDADES: Especialidade[] = [
  { key: 'fisioterapia',        label: 'Fisioterapia',                icon: <HeartOutlined />,      color: '#52c41a' },
  { key: 'fisio_aquatica',      label: 'Fisioterapia Aquática',       icon: <ExperimentOutlined />, color: '#13c2c2' },
  { key: 'fonoaudiologia',      label: 'Fonoaudiologia',              icon: <SoundOutlined />,      color: '#1677ff' },
  { key: 'terapia_ocupacional', label: 'Terapia Ocupacional',         icon: <MedicineBoxOutlined />,color: '#722ed1' },
  { key: 'ed_fisica',           label: 'Prof. Educação Física',       icon: <UserOutlined />,       color: '#fa8c16' },
  { key: 'psicologia',          label: 'Psicologia',                  icon: <TeamOutlined />,       color: '#eb2f96' },
  { key: 'psicologia_musical',  label: 'Psicologia Sonoro Musical',   icon: <RobotOutlined />,      color: '#f5222d' },
  { key: 'psicopedagogia',      label: 'Psicopedagogia',              icon: <BookOutlined />,       color: '#faad14' },
  { key: 'prof_braille',        label: 'Professor de Braille',        icon: <ReadOutlined />,       color: '#08979c' },
]

// ── valor inicial de um objetivo vazio ───────────────────────────────────────
function objetivoVazio(): ObjetivoItem {
  return { objetivo: undefined, descricao: undefined, status: undefined, motivo: undefined }
}

export function criarObjetivosIniciais(): ObjetivosState {
  return Object.fromEntries(
    ESPECIALIDADES.map((e) => [
      e.key,
      {
        anterior: [objetivoVazio(), objetivoVazio(), objetivoVazio()] as [ObjetivoItem, ObjetivoItem, ObjetivoItem],
        atual:    [objetivoVazio(), objetivoVazio(), objetivoVazio()] as [ObjetivoItem, ObjetivoItem, ObjetivoItem],
      },
    ])
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
function contarPreenchidos(items: ObjetivoItem[]): number {
  return items.filter((i) => i.objetivo).length
}

function canEditEspecialidade(espKey: string, espLabel: string, user: any): boolean {
  if (!user) return false
  if (user.ds_perfil === 'ADMIN') return true

  const userTip = (user.nm_tip_presta || user.ds_especialidade || '').toUpperCase()
  if (!userTip) return false

  // Mapeamento flexível das especialidades do MV para as chaves do sistema
  if ((espKey === 'fisioterapia' || espKey === 'fisio_aquatica') && userTip.includes('FISIOTERA')) return true
  if (espKey === 'fonoaudiologia' && userTip.includes('FONOAUDIO')) return true
  if (espKey === 'terapia_ocupacional' && userTip.includes('OCUPACIONAL')) return true
  if (espKey === 'ed_fisica' && (userTip.includes('FISICA') || userTip.includes('FÍSICA'))) return true
  if (espKey.startsWith('psicologia') && userTip.includes('PSICOLOG')) return true
  if (espKey === 'psicopedagogia' && userTip.includes('PSICOPEDAGOG')) return true
  if (espKey === 'prof_braille' && userTip.includes('BRAILLE')) return true

  return false
}

// Encontra o ícone e cor da especialidade a partir do nome do profissional (vindo do banco)
function getEspecialidadeInfo(dsEspecialidade: string | null | undefined): { icon: ReactNode; color: string; label: string } {
  if (!dsEspecialidade) return { icon: <UserOutlined />, color: '#8c8c8c', label: 'Desconhecida' }
  const up = dsEspecialidade.toUpperCase()
  for (const esp of ESPECIALIDADES) {
    const label = esp.label.toUpperCase()
    if (up.includes(label) || label.includes(up)) return { icon: esp.icon, color: esp.color, label: esp.label }
  }
  // Mapeamentos adicionais
  if (up.includes('FISIOTERA'))     return { icon: <HeartOutlined />,          color: '#52c41a', label: 'Fisioterapia' }
  if (up.includes('FONOAUDIO'))     return { icon: <SoundOutlined />,          color: '#1677ff', label: 'Fonoaudiologia' }
  if (up.includes('OCUPACIONAL'))   return { icon: <MedicineBoxOutlined />,    color: '#722ed1', label: 'Terapia Ocupacional' }
  if (up.includes('PSICOLOG'))      return { icon: <TeamOutlined />,           color: '#eb2f96', label: 'Psicologia' }
  if (up.includes('PSICOPEDAGOG'))  return { icon: <BookOutlined />,           color: '#faad14', label: 'Psicopedagogia' }
  if (up.includes('BRAILLE'))       return { icon: <ReadOutlined />,           color: '#08979c', label: 'Professor de Braille' }
  if (up.includes('FISICA') || up.includes('FÍSICA')) return { icon: <UserOutlined />, color: '#fa8c16', label: 'Prof. Educação Física' }
  return { icon: <UserOutlined />, color: '#8c8c8c', label: dsEspecialidade }
}

// Retorna as keys de especialidades que o usuário pode editar
function getMinhasEspecialidades(user: any): string[] {
  if (!user) return []
  if (user.ds_perfil === 'ADMIN') return ESPECIALIDADES.map(e => e.key)
  return ESPECIALIDADES.filter(esp => canEditEspecialidade(esp.key, esp.label, user)).map(e => e.key)
}

// ── sub-componente: linha de objetivo ANTERIOR (somente status + motivo) ─────
function LinhaObjetivoAnterior({
  numero,
  item,
  disabled,
  onChange,
}: {
  numero: number
  item: ObjetivoItem
  disabled: boolean
  onChange: (campo: keyof ObjetivoItem, valor: string | undefined) => void
}) {
  return (
    <Row gutter={[12, 8]} align="top" style={{ marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
      {/* número */}
      <Col flex="32px">
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#d9d9d9', color: '#595959',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: 13, marginTop: 2,
        }}>
          {numero}
        </div>
      </Col>

      {/* objetivo — editável na primeira vez, será carregado do PTS anterior nas renovações */}
      <Col flex="1" style={{ minWidth: 180 }}>
        <InputObjetivoAnterior 
          value={item.objetivo} 
          disabled={disabled}
          onChange={(val) => onChange('objetivo', val)} 
        />
      </Col>

      {/* status */}
      <Col flex="220px">
        <Select
          style={{ width: '100%' }}
          placeholder="Status da evolução..."
          aria-label={`Status da evolução do objetivo ${numero}`}
          allowClear
          disabled={disabled}
          options={STATUS_EVOLUCAO}
          value={item.status}
          onChange={(v) => {
            onChange('status', v)
            // limpa motivo se mudou para Alcançado / Não se Aplica
            if (!exigeMotivo(v)) onChange('motivo', undefined)
          }}
        />
      </Col>

      {/* motivo — só exibido quando status exige */}
      {exigeMotivo(item.status) && (() => {
        // valor selecionado no select: se começa com 'OUTROS:', seleciona 'OUTROS'
        const selectVal = item.motivo?.startsWith('OUTROS:') ? 'OUTROS' : item.motivo
        const outrosTexto = item.motivo?.startsWith('OUTROS:') ? item.motivo.slice(8) : ''
        return (
          <>
            <Col flex="220px">
              <Select
                style={{ width: '100%' }}
                placeholder="Motivo..."
                aria-label={`Motivo do status do objetivo ${numero}`}
                allowClear
                disabled={disabled}
                options={MOTIVOS_NAO_ALCANCADO}
                value={selectVal}
                onChange={(v) => {
                  if (!v) { onChange('motivo', undefined); return }
                  onChange('motivo', v === 'OUTROS' ? 'OUTROS: ' : v)
                }}
              />
            </Col>
            {selectVal === 'OUTROS' && (
              <Col flex="1" style={{ minWidth: 180 }}>
                <InputObjetivoAnterior
                  placeholder="Descreva o motivo..."
                  value={outrosTexto}
                  disabled={disabled}
                  onChange={(val) => onChange('motivo', val ? `OUTROS: ${val}` : undefined)}
                />
              </Col>
            )}
          </>
        )
      })()}
    </Row>
  )
}

// Componente de Input com estado local para evitar lag ao digitar
const InputObjetivoAnterior = memo(({ 
  value, 
  onChange, 
  placeholder = "Objetivo do período anterior...",
  disabled = false
}: { 
  value: string | undefined, 
  onChange: (v: string | undefined) => void,
  placeholder?: string,
  disabled?: boolean
}) => {
  const [localVal, setLocalVal] = useState(value ?? '')

  useEffect(() => {
    setLocalVal(value ?? '')
  }, [value])

  return (
    <Input
      value={localVal}
      placeholder={placeholder}
      disabled={disabled}
      style={{ textTransform: 'uppercase' }}
      onChange={(e) => setLocalVal(e.target.value.toUpperCase())}
      onBlur={() => {
        if (localVal !== (value ?? '')) {
          onChange(localVal || undefined)
        }
      }}
    />
  )
})

const MemoizedLinhaObjetivoAnterior = memo(LinhaObjetivoAnterior)
const MemoizedLinhaObjetivoAtual = memo(LinhaObjetivoAtual)

// ── sub-componente: linha de objetivo ATUAL (select + descrição) ─────────────
function LinhaObjetivoAtual({
  numero,
  item,
  listaOpcoes,
  disabled,
  onChange,
}: {
  numero: number
  item: ObjetivoItem
  listaOpcoes: string[]
  disabled: boolean
  onChange: (campo: keyof ObjetivoItem, valor: string | undefined) => void
}) {
  return (
    <Row gutter={[12, 8]} align="top" style={{ marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
      {/* número */}
      <Col flex="32px">
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#667eea', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: 13, marginTop: 2,
        }}>
          {numero}
        </div>
      </Col>

      {/* select do objetivo */}
      <Col flex="1" style={{ minWidth: 180 }}>
        <Select
          style={{ width: '100%' }}
          placeholder="Selecione o objetivo..."
          aria-label={`Selecione o objetivo atual número ${numero}`}
          allowClear
          showSearch
          disabled={disabled}
          optionFilterProp="label"
          options={listaOpcoes.map((v) => ({ label: v.toUpperCase(), value: v }))}
          popupClassName="uppercase-select-options"
          value={item.objetivo}
          onChange={(v) => onChange('objetivo', v)}
        />
      </Col>


    </Row>
  )
}

// ── componente principal exportado ────────────────────────────────────────────
interface Props {
  value: ObjetivosState
  onChange: (next: ObjetivosState) => void
  ptsFinalizado?: boolean
  nrAtendimento?: string | number | null
  cdPaciente?: string | number | null
  vigencia?: string
  idPtsAtual?: number | null
}

export default function ObjetivosEspecialidades({
  value, onChange, ptsFinalizado = false,
  nrAtendimento, cdPaciente, vigencia, idPtsAtual,
}: Props) {
  const { usuario } = useAuth()
  const [objetivosPorArea, setObjetivosPorArea] = useState<Record<string, string[]>>({})
  const [momento, setMomento] = useState<Record<string, MomentoObjetivos>>(
    () => Object.fromEntries(ESPECIALIDADES.map((e) => [e.key, 'atual' as MomentoObjetivos]))
  )

  // Estado para outros PTS da mesma vigência
  const [outrosPTS, setOutrosPTS] = useState<OutroPTSItem[]>([])
  const [modalPTS, setModalPTS] = useState<OutroPTSItem | null>(null)

  useEffect(() => {
    async function carregarObjetivos() {
      const novosObjetivos: Record<string, string[]> = {}
      
      // Busca os objetivos para cada especialidade em paralelo
      await Promise.all(
        ESPECIALIDADES.map(async (esp) => {
          try {
            const lista = await getPTSObjetivosPorEspecialidade(esp.label)
            novosObjetivos[esp.key] = lista
          } catch (error) {
            console.error(`Erro ao carregar objetivos para ${esp.label}:`, error)
            novosObjetivos[esp.key] = []
          }
        })
      )
      
      setObjetivosPorArea(novosObjetivos)
    }

    carregarObjetivos()
  }, [])

  // Carrega outros PTS da mesma vigência do paciente (com debounce via useRef para evitar loop)
  const ultimaChamadaRef = React.useRef<string>('')
  useEffect(() => {
    if (!vigencia) return
    const excluir = idPtsAtual && idPtsAtual > 0 ? idPtsAtual : -1
    const nr = nrAtendimento ?? ''
    const cd = cdPaciente ?? ''
    const chave = `${nr}|${cd}|${vigencia}|${excluir}`
    if (ultimaChamadaRef.current === chave) return  // já buscou com esses parâmetros
    ultimaChamadaRef.current = chave
    getOutrosPTSVigencia(nr, cd, vigencia, excluir)
      .then(setOutrosPTS)
      .catch((err) => console.error('Erro ao carregar outros PTS:', err))
  }, [nrAtendimento, cdPaciente, vigencia, idPtsAtual])

  const handleMomento = useCallback((key: string, m: MomentoObjetivos) => {
    setMomento((prev) => ({ ...prev, [key]: m }))
  }, [])

  const handleItem = useCallback((
    espKey: string,
    mom: MomentoObjetivos,
    idx: number,
    campo: keyof ObjetivoItem,
    val: string | undefined
  ) => {
    const espAtual = value[espKey]
    const lista = [...espAtual[mom]] as [ObjetivoItem, ObjetivoItem, ObjetivoItem]
    lista[idx] = { ...lista[idx], [campo]: val }
    onChange({ ...value, [espKey]: { ...espAtual, [mom]: lista } })
  }, [value, onChange])

  // Identificar as especialidades do usuário logado
  const minhasEsps = useMemo(() => getMinhasEspecialidades(usuario), [usuario])
  const isAdmin = usuario?.ds_perfil === 'ADMIN'

  // Filtrar: ADMIN vê todas, profissional vê somente a(s) sua(s)
  const especialidadesFiltradas = useMemo(() => {
    if (isAdmin) return ESPECIALIDADES
    if (minhasEsps.length === 0) return ESPECIALIDADES // fallback: mostrar todas em read-only
    return ESPECIALIDADES.filter(e => minhasEsps.includes(e.key))
  }, [isAdmin, minhasEsps])

  const collapseItems = useMemo(() => {
    return especialidadesFiltradas.map((esp) => {
      const mom = momento[esp.key]
      const lista = value[esp.key][mom]
      const qtdAnterior = contarPreenchidos(value[esp.key].anterior)
      const qtdAtual    = contarPreenchidos(value[esp.key].atual)

      const canEdit = canEditEspecialidade(esp.key, esp.label, usuario)

      return {
        key: esp.key,
        label: (
          <Space>
            <span style={{ color: esp.color }}>{esp.icon}</span>
            <Text strong>{esp.label}</Text>
            {!canEdit && <LockOutlined style={{ color: '#bfbfbf' }} title="Visualização apenas" />}
            {qtdAnterior > 0 && (
              <Tag color="default" style={{ fontSize: 11 }}>
                {qtdAnterior} anterior{qtdAnterior > 1 ? 'es' : ''}
              </Tag>
            )}
            {qtdAtual > 0 && (
              <Tag color="purple" style={{ fontSize: 11 }}>
                {qtdAtual} {qtdAtual > 1 ? 'atuais' : 'atual'}
              </Tag>
            )}
          </Space>
        ),
        children: (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {/* toggle anterior / atual */}
            <Segmented
              options={[
                { label: 'Objetivos Atuais', value: 'atual' },
                { label: 'Objetivos Anteriores (evolução)', value: 'anterior' },
              ]}
              aria-label="Alternar entre objetivos atuais e anteriores"
              value={mom}
              onChange={(v) => handleMomento(esp.key, v as MomentoObjetivos)}
              style={{ width: '100%' }}
            />

            {mom === 'anterior' && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Objetivos carregados automaticamente do último PTS (vigência anterior). Informe o status e, se necessário, o motivo.
              </Text>
            )}

            {mom === 'anterior' && ptsFinalizado && (
              <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: '8px 12px', borderRadius: 4, marginBottom: 8 }}>
                <Text type="danger" style={{ fontSize: 12 }}>
                  <LockOutlined style={{ marginRight: 6 }} />
                  PTS finalizado — os objetivos anteriores não podem ser editados.
                </Text>
              </div>
            )}

            {mom === 'atual' && ptsFinalizado && (
              <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: '8px 12px', borderRadius: 4, marginBottom: 8 }}>
                <Text type="danger" style={{ fontSize: 12 }}>
                  <LockOutlined style={{ marginRight: 6 }} />
                  PTS finalizado — os objetivos atuais não podem ser editados.
                </Text>
              </div>
            )}

            {!canEdit && (
              <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '8px 12px', borderRadius: 4, marginBottom: 8 }}>
                <Text type="warning" style={{ fontSize: 12 }}>
                  <LockOutlined style={{ marginRight: 6 }} />
                  Você possui acesso apenas para visualização aos objetivos desta especialidade.
                </Text>
              </div>
            )}

            {/* 3 linhas de objetivo */}
            {lista.map((item, idx) =>
              mom === 'anterior' ? (
                <MemoizedLinhaObjetivoAnterior
                  key={idx}
                  numero={idx + 1}
                  item={item}
                  disabled={!canEdit || ptsFinalizado}
                  onChange={(campo, val) => handleItem(esp.key, mom, idx, campo, val)}
                />
              ) : (
                <MemoizedLinhaObjetivoAtual
                  key={idx}
                  numero={idx + 1}
                  item={item}
                  disabled={!canEdit || ptsFinalizado}
                  listaOpcoes={objetivosPorArea[esp.key] || []}
                  onChange={(campo, val) => handleItem(esp.key, mom, idx, campo, val)}
                />
              )
            )}
          </Space>
        ),
      }
    })
  }, [value, momento, objetivosPorArea, handleItem, handleMomento, especialidadesFiltradas, ptsFinalizado, usuario])

  // Renderizar o conteúdo do modal de visualização de outro PTS
  const renderModalContent = useCallback((pts: OutroPTSItem) => {
    const espKeys = Object.keys(pts.objetivos)
    if (espKeys.length === 0) {
      return <Text type="secondary" italic>Nenhum objetivo registrado neste PTS.</Text>
    }
    return (
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {espKeys.map((espKey) => {
          const espInfo = ESPECIALIDADES.find(e => e.key === espKey)
          const label = espInfo?.label || espKey
          const icon = espInfo?.icon || <UserOutlined />
          const color = espInfo?.color || '#8c8c8c'
          const dados = pts.objetivos[espKey]

          return (
            <div key={espKey}>
              <Space style={{ marginBottom: 8 }}>
                <span style={{ color }}>{icon}</span>
                <Text strong>{label}</Text>
              </Space>

              {/* Anteriores */}
              {dados.anterior.some(o => o.objetivo) && (
                <>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Objetivos Anteriores
                  </Text>
                  {dados.anterior.map((obj, idx) => obj.objetivo && (
                    <div key={`ant-${idx}`} style={{
                      background: '#fafafa', border: '1px solid #f0f0f0',
                      borderRadius: 6, padding: '8px 12px', marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 13, textTransform: 'uppercase' }}>{idx + 1}. {obj.objetivo}</Text>
                      {obj.status && (
                        <Tag color={obj.status === 'ALCANCADO' ? 'green' : obj.status === 'PARCIAL' ? 'orange' : 'red'} style={{ marginLeft: 8, fontSize: 11 }}>
                          {STATUS_EVOLUCAO.find(s => s.value === obj.status)?.label || obj.status}
                        </Tag>
                      )}
                      {obj.motivo && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                          Motivo: {MOTIVOS_NAO_ALCANCADO.find(m => m.value === obj.motivo)?.label || obj.motivo}
                        </Text>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Atuais */}
              {dados.atual.some(o => o.objetivo) && (
                <>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4, marginTop: 8 }}>
                    Objetivos Atuais
                  </Text>
                  {dados.atual.map((obj, idx) => obj.objetivo && (
                    <div key={`atu-${idx}`} style={{
                      background: '#f0f5ff', border: '1px solid #d6e4ff',
                      borderRadius: 6, padding: '8px 12px', marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 13, textTransform: 'uppercase' }}>{idx + 1}. {obj.objetivo}</Text>
                    </div>
                  ))}
                </>
              )}

              <Divider style={{ margin: '12px 0' }} />
            </div>
          )
        })}
      </Space>
    )
  }, [])

  return (
    <>
      {/* ── Chips de outros PTS da mesma vigência ── */}
      {outrosPTS.length > 0 && (
        <div style={{
          background: '#f6ffed', border: '1px solid #b7eb8f',
          borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            <EyeOutlined style={{ marginRight: 6 }} />
            Outros PTS deste paciente na mesma vigência:
          </Text>
          <Space wrap size={8}>
            {outrosPTS.map((pts) => {
              const info = getEspecialidadeInfo(pts.ds_especialidade_profissional)
              return (
                <Tooltip key={pts.id_pts} title={`Visualizar objetivos de ${pts.nm_prestador}`}>
                  <Button
                    size="middle"
                    icon={<span style={{ color: info.color, marginRight: 4 }}>{info.icon}</span>}
                    onClick={() => setModalPTS(pts)}
                    style={{
                      borderColor: info.color,
                      color: '#333',
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {pts.nm_prestador} — {info.label}
                  </Button>
                </Tooltip>
              )
            })}
          </Space>
        </div>
      )}

      {/* ── Collapse de edição (filtrado por especialidade) ── */}
      <Collapse
        accordion={false}
        items={collapseItems}
        style={{ background: '#fff' }}
        expandIconPosition="end"
        defaultActiveKey={minhasEsps.length > 0 && !isAdmin ? minhasEsps : undefined}
      />

      {/* ── Modal de visualização de outro PTS ── */}
      <Modal
        open={!!modalPTS}
        onCancel={() => setModalPTS(null)}
        footer={
          <Button type="primary" onClick={() => setModalPTS(null)}>
            Fechar
          </Button>
        }
        width={700}
        centered
        title={
          modalPTS ? (
            <Space>
              <EyeOutlined />
              <span>Objetivos — {modalPTS.nm_prestador}</span>
              <Tag color="blue">{getEspecialidadeInfo(modalPTS.ds_especialidade_profissional).label}</Tag>
            </Space>
          ) : ''
        }
      >
        {modalPTS && renderModalContent(modalPTS)}
      </Modal>
    </>
  )
}
