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
  Switch,
} from 'antd'
import {
  MedicineBoxOutlined,
  SoundOutlined,
  ThunderboltOutlined,
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
  atual: [ObjetivoItem, ObjetivoItem]
  outros_atual?: string | undefined
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
  { key: 'fisioterapia',        label: 'Fisioterapia',                icon: <ThunderboltOutlined />, color: '#52c41a' },
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
        atual:    [objetivoVazio(), objetivoVazio()] as [ObjetivoItem, ObjetivoItem],
        outros_atual: undefined,
      },
    ])
  )
}

/**
 * Valida o estado dos objetivos e retorna um objeto com os erros encontrados por especialidade.
 * Regras:
 * 1. Se preencher qualquer campo na linha de anterior, objetivo e status tornam-se obrigatórios.
 * 2. Se status exigir motivo (PARCIAL ou NAO_ALCANCADO), motivo torna-se obrigatório.
 * 3. Se motivo for OUTROS, o texto descritivo torna-se obrigatório.
 * 4. Para especialidades obrigatórias, PELO MENOS UM objetivo (anterior OU atual) deve estar preenchido.
 */
export function validarObjetivos(
  state: ObjetivosState,
  especialidadesObrigatorias: string[] = [],
  naoSeAplica: Record<string, boolean> = {},
): { 
  temErro: boolean; 
  erros: Record<string, { anterior: (ObjetivoErro | null)[]; atual: (ObjetivoErro | null)[]; outros_atual?: ObjetivoErro | null }>;
  especialidadesComErro: string[];
} {
  const erros: any = {}
  let temErroGeral = false
  const espsComErro: string[] = []

  Object.entries(state).forEach(([espKey, dados]) => {
    // Especialidade marcada como "Não se aplica" → skip total
    if (naoSeAplica[espKey]) return
    const isObrigatoria = especialidadesObrigatorias.includes(espKey);

    const errosAnterior = dados.anterior.map((item, idx) => {
      const e: ObjetivoErro = {}
      const temAlgo = !!(item.objetivo || item.status || item.motivo)
      
      if (temAlgo) {
        if (!item.objetivo) e.objetivo = true
        if (!item.status) e.status = true
        if (exigeMotivo(item.status) && !item.motivo) e.motivo = true
        if (item.motivo?.startsWith('OUTROS:') && item.motivo.length <= 8) e.motivo = true
      } else if (isObrigatoria && idx === 0) {
        // Primeira linha do objetivo anterior é obrigatória para a especialidade do usuário
        e.objetivo = true
        e.status = true
      }

      if (Object.keys(e).length > 0) return e
      return null
    })

    const errosAtual = dados.atual.map((item, idx) => {
      return null
    })
    let erroOutrosAtual: ObjetivoErro | null = null;

    // Validação adicional: Se é especialidade obrigatória, deve ter PELO MENOS UM objetivo preenchido (anterior OU atual)
    if (isObrigatoria) {
      const temObjetivoAnterior = dados.anterior.some(item => !!item.objetivo)
      const temObjetivoAtual = dados.atual.some(item => !!item.objetivo) || !!dados.outros_atual
      
      if (!temObjetivoAnterior && !temObjetivoAtual) {
        // Nenhum objetivo foi preenchido - adicionar erro na primeira linha de ambos
        if (!errosAnterior[0]) errosAnterior[0] = {}
        errosAnterior[0]!.objetivo = true
        errosAtual[0] = { objetivo: true }
        erroOutrosAtual = { objetivo: true }
      }
    }

    const espTemErro = errosAnterior.some(x => x !== null) || errosAtual.some(x => x !== null) || erroOutrosAtual !== null
    if (espTemErro) {
      temErroGeral = true
      erros[espKey] = { anterior: errosAnterior, atual: errosAtual, outros_atual: erroOutrosAtual }
      const label = ESPECIALIDADES.find(e => e.key === espKey)?.label || espKey
      espsComErro.push(label)
    }
  })

  return { temErro: temErroGeral, erros, especialidadesComErro: espsComErro }
}

export interface ObjetivoErro {
  objetivo?: boolean
  status?: boolean
  motivo?: boolean
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
  if (espKey === 'prof_braille' && (userTip.includes('BRAILLE') || userTip.includes('DEF VISUAL') || userTip.includes('DEF. VISUAL') || userTip.includes('VISUAL'))) return true

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
  if (up.includes('FISIOTERA'))     return { icon: <ThunderboltOutlined />,    color: '#52c41a', label: 'Fisioterapia' }
  if (up.includes('FONOAUDIO'))     return { icon: <SoundOutlined />,          color: '#1677ff', label: 'Fonoaudiologia' }
  if (up.includes('OCUPACIONAL'))   return { icon: <MedicineBoxOutlined />,    color: '#722ed1', label: 'Terapia Ocupacional' }
  if (up.includes('PSICOLOG'))      return { icon: <TeamOutlined />,           color: '#eb2f96', label: 'Psicologia' }
  if (up.includes('PSICOPEDAGOG'))  return { icon: <BookOutlined />,           color: '#faad14', label: 'Psicopedagogia' }
  if (up.includes('BRAILLE') || up.includes('DEF VISUAL') || up.includes('DEF. VISUAL') || up.includes('VISUAL'))       return { icon: <ReadOutlined />,           color: '#08979c', label: 'Professor de Braille' }
  if (up.includes('FISICA') || up.includes('FÍSICA')) return { icon: <UserOutlined />, color: '#fa8c16', label: 'Prof. Educação Física' }
  return { icon: <UserOutlined />, color: '#8c8c8c', label: dsEspecialidade }
}

// Retorna as keys de especialidades que o usuário pode editar
export function getMinhasEspecialidades(user: any): string[] {
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
  erro,
  especialidadeLabel,
}: {
  numero: number
  item: ObjetivoItem
  disabled: boolean
  onChange: (updates: Partial<ObjetivoItem>) => void
  erro?: ObjetivoErro | null
  especialidadeLabel: string
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
          status={erro?.objetivo ? 'error' : undefined}
          ariaLabel={`Descrição do objetivo anterior número ${numero} para ${especialidadeLabel}`}
          onChange={(val) => onChange({ objetivo: val })} 
        />
        {erro?.objetivo && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>Campo obrigatório</div>}
      </Col>

      {/* status */}
      <Col flex="220px">
        <Select
          style={{ width: '100%' }}
          placeholder="Status da evolução..."
          aria-label={`Status da evolução do objetivo anterior número ${numero} para ${especialidadeLabel}`}
          allowClear
          disabled={disabled}
          status={erro?.status ? 'error' : undefined}
          options={STATUS_EVOLUCAO}
          value={item.status}
          onChange={(v) => {
            const updates: Partial<ObjetivoItem> = { status: v };
            if (!exigeMotivo(v)) updates.motivo = undefined;
            onChange(updates);
          }}
        />
        {erro?.status && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>Status obrigatório</div>}
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
                aria-label={`Motivo do status de não alcançado para objetivo anterior número ${numero} de ${especialidadeLabel}`}
                allowClear
                disabled={disabled}
                status={erro?.motivo ? 'error' : undefined}
                options={MOTIVOS_NAO_ALCANCADO}
                value={selectVal}
                onChange={(v) => {
                  if (!v) { onChange({ motivo: undefined }); return }
                  onChange({ motivo: v === 'OUTROS' ? 'OUTROS: ' : v });
                }}
              />
            </Col>
            {selectVal === 'OUTROS' && (
              <Col flex="1" style={{ minWidth: 180 }}>
                <InputObjetivoAnterior
                  placeholder="Descreva o motivo..."
                  ariaLabel={`Descreva detalhadamente o motivo de não alcançado para o objetivo anterior número ${numero} de ${especialidadeLabel}`}
                  value={outrosTexto}
                  disabled={disabled}
                  status={erro?.motivo ? 'error' : undefined}
                  onChange={(val) => onChange({ motivo: val ? `OUTROS: ${val}` : undefined })}
                />
                {erro?.motivo && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>Descrição obrigatória</div>}
              </Col>
            )}
            {selectVal !== 'OUTROS' && erro?.motivo && (
               <Col flex="1" style={{ minWidth: 0 }}>
                 <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 6 }}>Motivo obrigatório</div>
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
  disabled = false,
  status,
  ariaLabel
}: { 
  value: string | undefined, 
  onChange: (v: string | undefined) => void,
  placeholder?: string,
  disabled?: boolean,
  status?: "" | "error" | "warning" | undefined,
  ariaLabel?: string
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
      status={status}
      style={{ textTransform: 'uppercase' }}
      aria-label={ariaLabel}
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
  erro,
  especialidadeLabel,
}: {
  numero: number
  item: ObjetivoItem
  listaOpcoes: string[]
  disabled: boolean
  onChange: (updates: Partial<ObjetivoItem>) => void
  erro?: ObjetivoErro | null
  especialidadeLabel: string
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
          aria-label={`Selecione o objetivo atual número ${numero} para ${especialidadeLabel}`}
          allowClear
          showSearch
          disabled={disabled}
          status={erro?.objetivo ? 'error' : undefined}
          optionFilterProp="label"
          options={Array.from(new Set(listaOpcoes || [])).map((v) => ({ label: v.toUpperCase(), value: v }))}
          popupClassName="uppercase-select-options"
          value={item.objetivo}
          onChange={(v) => onChange({ objetivo: v })}
        />
        {erro?.objetivo && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>Objetivo obrigatório</div>}
      </Col>


    </Row>
  )
}

// Especialidades que suportam "Não se aplica"
const ESPS_NAO_SE_APLICA = new Set(['fisioterapia', 'fisio_aquatica', 'psicologia', 'psicologia_musical'])

// ── componente principal exportado ────────────────────────────────────────────
interface Props {
  value: ObjetivosState
  onChange: (next: ObjetivosState) => void
  ptsFinalizado?: boolean
  nrAtendimento?: string | number | null
  cdPaciente?: string | number | null
  vigencia?: string
  idPtsAtual?: number | null
  erros?: Record<string, { anterior: (ObjetivoErro | null)[]; atual: (ObjetivoErro | null)[] }>
  naoSeAplica?: Record<string, boolean>
  onNaoSeAplicaChange?: (next: Record<string, boolean>) => void
}

export default function ObjetivosEspecialidades({
  value, onChange, ptsFinalizado = false,
  nrAtendimento, cdPaciente, vigencia, idPtsAtual,
  erros = {},
  naoSeAplica = {},
  onNaoSeAplicaChange,
}: Props) {
  const { usuario } = useAuth()
  const [objetivosPorArea, setObjetivosPorArea] = useState<Record<string, string[]>>({})
  const [momento, setMomento] = useState<Record<string, MomentoObjetivos>>(
    () => Object.fromEntries(ESPECIALIDADES.map((e) => [e.key, 'atual' as MomentoObjetivos]))
  )
  const [srAnnouncement, setSrAnnouncement] = useState('')

  // Identificar as especialidades do usuário logado
  const minhasEsps = useMemo(() => getMinhasEspecialidades(usuario), [usuario])
  const isAdmin = usuario?.ds_perfil === 'ADMIN'

  // Estado para outros PTS da mesma vigência
  const [outrosPTS, setOutrosPTS] = useState<OutroPTSItem[]>([])
  const [modalPTS, setModalPTS] = useState<OutroPTSItem | null>(null)

  const handleOpenModal = useCallback((pts: OutroPTSItem) => {
    setModalPTS(pts)
    const info = getEspecialidadeInfo(pts.ds_especialidade_profissional)
    setSrAnnouncement(`Modal de visualização aberto para objetivos de ${pts.nm_prestador}, especialidade ${info.label}.`)
    // Foca o modal após um pequeno tempo
    setTimeout(() => {
      const modalElement = document.querySelector('.ant-modal-content') as HTMLElement
      if (modalElement) modalElement.focus()
    }, 300)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalPTS(null)
    setSrAnnouncement(`Modal de visualização fechado.`)
  }, [])

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

  // Escuta atalhos de teclado (Alt + T, Alt + E, Alt + 1, Alt + 2, Alt + 3) para acessibilidade do Professor de Braille
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return

      const key = e.key.toLowerCase()

      if (key === 't') {
        e.preventDefault()
        minhasEsps.forEach(espKey => {
          setMomento(prev => ({ ...prev, [espKey]: 'atual' }))
        })
        setSrAnnouncement('Abas de objetivos alternadas para Objetivos Atuais')
        setTimeout(() => {
          const firstInput = document.querySelector(`[aria-label*="Selecione o objetivo atual número 1"] input, [aria-label*="Selecione o objetivo atual número 1"]`) as HTMLElement
          if (firstInput) firstInput.focus()
        }, 100)
      }

      if (key === 'e') {
        e.preventDefault()
        minhasEsps.forEach(espKey => {
          setMomento(prev => ({ ...prev, [espKey]: 'anterior' }))
        })
        setSrAnnouncement('Abas de objetivos alternadas para Objetivos Anteriores de evolução')
        setTimeout(() => {
          const firstInput = document.querySelector(`[aria-label*="Status da evolução do objetivo anterior número 1"] input, [aria-label*="Status da evolução do objetivo anterior número 1"]`) as HTMLElement
          if (firstInput) firstInput.focus()
        }, 100)
      }

      if (key === '1' || key === '2' || key === '3') {
        e.preventDefault()
        const numero = key
        setTimeout(() => {
          if (minhasEsps.length > 0) {
            const espKey = minhasEsps[0]
            const mom = momento[espKey] || 'atual'
            let targetSelector = ''
            if (mom === 'atual') {
              targetSelector = `[aria-label*="Selecione o objetivo atual número ${numero}"] input, [aria-label*="Selecione o objetivo atual número ${numero}"]`
            } else {
              targetSelector = `[aria-label*="Status da evolução do objetivo anterior número ${numero}"] input, [aria-label*="Status da evolução do objetivo anterior número ${numero}"]`
            }
            const input = document.querySelector(targetSelector) as HTMLElement
            if (input) {
              input.focus()
              const label = ESPECIALIDADES.find(x => x.key === espKey)?.label || ''
              setSrAnnouncement(`Focado no objetivo ${numero} de ${label}`)
            }
          }
        }, 50)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [minhasEsps, momento])

  const handleMomento = useCallback((key: string, m: MomentoObjetivos) => {
    setMomento((prev) => ({ ...prev, [key]: m }))
    const label = ESPECIALIDADES.find(e => e.key === key)?.label || key
    setSrAnnouncement(`Abas de objetivos para ${label} alternada para Objetivos ${m === 'atual' ? 'Atuais' : 'Anteriores (evolução)'}`)
    
    // Gerenciamento de foco ao alternar abas
    setTimeout(() => {
      let targetSelector = ''
      if (m === 'atual') {
        targetSelector = `[aria-label*="Selecione o objetivo atual número 1"] input, [aria-label*="Selecione o objetivo atual número 1"]`
      } else {
        targetSelector = `[aria-label*="Status da evolução do objetivo anterior número 1"] input, [aria-label*="Status da evolução do objetivo anterior número 1"]`
      }
      const element = document.querySelector(targetSelector) as HTMLElement
      if (element) element.focus()
    }, 150)
  }, [])

  const handleItem = useCallback((
    espKey: string,
    mom: MomentoObjetivos,
    idx: number,
    updates: Partial<ObjetivoItem>
  ) => {
    const espAtual = value[espKey]
    const lista = [...espAtual[mom]] as any[]
    lista[idx] = { ...lista[idx], ...updates }
    onChange({ ...value, [espKey]: { ...espAtual, [mom]: lista } })
  }, [value, onChange])

  const handleOutros = useCallback((espKey: string, text: string | undefined) => {
    const espAtual = value[espKey]
    onChange({ ...value, [espKey]: { ...espAtual, outros_atual: text } })
  }, [value, onChange])

  // Filtrar: ADMIN vê todas, profissional vê somente a(s) sua(s)
  const especialidadesFiltradas = useMemo(() => {
    if (isAdmin) return ESPECIALIDADES
    if (minhasEsps.length === 0) return ESPECIALIDADES // fallback: mostrar todas em read-only
    return ESPECIALIDADES.filter(e => minhasEsps.includes(e.key))
  }, [isAdmin, minhasEsps])

  const handleNaoSeAplica = useCallback((espKey: string, checked: boolean) => {
    onNaoSeAplicaChange?.({ ...naoSeAplica, [espKey]: checked })
  }, [naoSeAplica, onNaoSeAplicaChange])

  const collapseItems = useMemo(() => {
    return especialidadesFiltradas.map((esp) => {
      const mom = momento[esp.key]
      const lista = value[esp.key][mom]
      const qtdAnterior = contarPreenchidos(value[esp.key].anterior)
      const qtdAtual    = contarPreenchidos(value[esp.key].atual)
      const canEdit = canEditEspecialidade(esp.key, esp.label, usuario)
      const podeMarcarNaoSeAplica = ESPS_NAO_SE_APLICA.has(esp.key) && canEdit && !ptsFinalizado
      const marcadoNaoSeAplica = !!naoSeAplica[esp.key]

      return {
        key: esp.key,
        label: (
          <Space onClick={(e) => e.stopPropagation()}>
            <span style={{ color: marcadoNaoSeAplica ? '#bfbfbf' : esp.color }}>{esp.icon}</span>
            <Text strong style={{ color: marcadoNaoSeAplica ? '#bfbfbf' : undefined }}>{esp.label}</Text>
            {!canEdit && <LockOutlined style={{ color: '#bfbfbf' }} title="Visualização apenas" />}
            {!marcadoNaoSeAplica && qtdAnterior > 0 && (
              <Tag color="default" style={{ fontSize: 11 }}>
                {qtdAnterior} anterior{qtdAnterior > 1 ? 'es' : ''}
              </Tag>
            )}
            {!marcadoNaoSeAplica && qtdAtual > 0 && (
              <Tag color="purple" style={{ fontSize: 11 }}>
                {qtdAtual} {qtdAtual > 1 ? 'atuais' : 'atual'}
              </Tag>
            )}
            {marcadoNaoSeAplica && (
              <Tag color="default" style={{ fontSize: 11 }}>Não se aplica</Tag>
            )}
            {podeMarcarNaoSeAplica && (
              <Switch
                size="small"
                checked={marcadoNaoSeAplica}
                onChange={(checked) => handleNaoSeAplica(esp.key, checked)}
                checkedChildren="N/A"
                unCheckedChildren="N/A"
                title={marcadoNaoSeAplica ? 'Clique para reativar esta especialidade' : 'Marcar como não se aplica neste atendimento'}
                style={{ marginLeft: 4 }}
              />
            )}
          </Space>
        ),
        children: marcadoNaoSeAplica ? (
          <div style={{ background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8, padding: '20px 24px', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Esta especialidade foi marcada como <strong>Não se aplica</strong> neste atendimento.
              Nenhum objetivo é exigido. Para reativar, clique no toggle <strong>N/A</strong> no cabeçalho.
            </Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {/* Guia explicativo exclusivo para leitores de tela */}
            {canEdit && (
              <div
                style={{
                  position: 'absolute',
                  width: 1, height: 1, padding: 0, margin: -1,
                  overflow: 'hidden', clip: 'rect(0,0,0,0)',
                  whiteSpace: 'nowrap', border: 0,
                }}
              >
                Seção de objetivos de {esp.label}. Você pode alternar entre objetivos atuais e evolução anterior usando os atalhos de teclado Alt mais a letra T para objetivos atuais, ou Alt mais a letra E para evolução anterior. Também pode pular diretamente para os objetivos um, dois ou três pressionando Alt mais os números correspondentes um, dois ou três.
              </div>
            )}

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

            {/* linhas de objetivo (3 para anterior, 2 para atual) */}
            {lista.map((item, idx) =>
              mom === 'anterior' ? (
                <MemoizedLinhaObjetivoAnterior
                  key={idx}
                  numero={idx + 1}
                  item={item}
                  disabled={!canEdit || ptsFinalizado}
                  erro={erros[esp.key]?.anterior[idx]}
                  especialidadeLabel={esp.label}
                  onChange={(updates) => handleItem(esp.key, mom, idx, updates)}
                />
              ) : (
                <MemoizedLinhaObjetivoAtual
                  key={idx}
                  numero={idx + 1}
                  item={item}
                  disabled={!canEdit || ptsFinalizado}
                  listaOpcoes={objetivosPorArea[esp.key] || []}
                  erro={erros[esp.key]?.atual[idx]}
                  especialidadeLabel={esp.label}
                  onChange={(updates) => handleItem(esp.key, mom, idx, updates)}
                />
              )
            )}
            
            {mom === 'atual' && (
              <Row gutter={[12, 8]} align="top" style={{ marginBottom: 8, paddingBottom: 8 }}>
                <Col flex="32px">
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#667eea', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: 13, marginTop: 2,
                  }}>
                    3
                  </div>
                </Col>
                <Col flex="1" style={{ minWidth: 180 }}>
                  <Input.TextArea
                    placeholder="ESPECIFICAÇÕES ADICIONAIS / OUTROS OBJETIVOS..."
                    aria-label={`Especificações adicionais ou outros objetivos para ${esp.label}`}
                    disabled={!canEdit || ptsFinalizado}
                    status={erros[esp.key]?.outros_atual?.objetivo ? 'error' : undefined}
                    value={value[esp.key].outros_atual || ''}
                    onChange={(e) => handleOutros(esp.key, e.target.value.toUpperCase())}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {erros[esp.key]?.outros_atual?.objetivo && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>Objetivo obrigatório (selecione nos campos acima ou digite aqui)</div>}
                </Col>
              </Row>
            )}
          </Space>
        ),
      }
    })
  }, [value, momento, objetivosPorArea, handleItem, handleMomento, especialidadesFiltradas, ptsFinalizado, usuario, naoSeAplica, handleNaoSeAplica, erros])

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
            <div key={espKey} role="region" aria-label={`Objetivos de ${label}`}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color }} aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </h4>

              {/* Anteriores */}
              {dados.anterior.some(o => o.objetivo) && (
                <>
                  <h5 style={{ fontSize: '11px', color: '#8c8c8c', margin: '8px 0 4px 0', fontWeight: 'normal' }}>
                    Objetivos Anteriores
                  </h5>
                  {dados.anterior.map((obj, idx) => obj.objetivo && (
                    <div key={`ant-${idx}`} style={{
                      background: '#fafafa', border: '1px solid #f0f0f0',
                      borderRadius: 6, padding: '8px 12px', marginBottom: 6,
                    }}
                    role="text"
                    aria-label={`Objetivo anterior ${idx + 1}: ${obj.objetivo}. Status: ${STATUS_EVOLUCAO.find(s => s.value === obj.status)?.label || obj.status}.${obj.motivo ? ' Motivo: ' + (MOTIVOS_NAO_ALCANCADO.find(m => m.value === obj.motivo)?.label || obj.motivo) : ''}`}
                    >
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
                  <h5 style={{ fontSize: '11px', color: '#8c8c8c', margin: '8px 0 4px 0', fontWeight: 'normal' }}>
                    Objetivos Atuais
                  </h5>
                  {dados.atual.map((obj, idx) => obj.objetivo && (
                    <div key={`atu-${idx}`} style={{
                      background: '#f0f5ff', border: '1px solid #d6e4ff',
                      borderRadius: 6, padding: '8px 12px', marginBottom: 6,
                    }}
                    role="text"
                    aria-label={`Objetivo atual ${idx + 1}: ${obj.objetivo}`}
                    >
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
                    onClick={() => handleOpenModal(pts)}
                    aria-label={`Visualizar objetivos registrados por ${pts.nm_prestador}, especialidade ${info.label}`}
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
        onCancel={handleCloseModal}
        footer={
          <Button type="primary" onClick={handleCloseModal} aria-label="Fechar modal de visualização de objetivos">
            Fechar
          </Button>
        }
        width={700}
        style={{ top: 20 }}
        aria-label={modalPTS ? `Visualização de Objetivos do Profissional ${modalPTS.nm_prestador}, especialidade ${getEspecialidadeInfo(modalPTS.ds_especialidade_profissional).label}` : 'Visualização de Objetivos'}
        closeIcon={<span aria-label="Fechar modal de visualização de objetivos" style={{ fontSize: 16 }}>✕</span>}
        title={
          modalPTS ? (
            <Space>
              <EyeOutlined />
              <span aria-hidden="true">Objetivos — {modalPTS.nm_prestador}</span>
              <Tag color="blue" aria-hidden="true">{getEspecialidadeInfo(modalPTS.ds_especialidade_profissional).label}</Tag>
            </Space>
          ) : ''
        }
      >
        {modalPTS && renderModalContent(modalPTS)}
      </Modal>

      {/* Região live acessível para leitores de tela */}
      <div
        role="status"
        aria-live="polite"
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
        {srAnnouncement}
      </div>
    </>
  )
}
