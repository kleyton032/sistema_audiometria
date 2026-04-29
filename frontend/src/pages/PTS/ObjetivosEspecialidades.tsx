import { useState } from 'react'
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
} from '@ant-design/icons'
import type { ReactNode } from 'react'

const { Text } = Typography

// ── tipos ────────────────────────────────────────────────────────────────────
export interface ObjetivoItem {
  objetivo: string | undefined
  descricao: string | undefined
  status: string | undefined   // usado apenas em "anterior"
}

export type MomentoObjetivos = 'anterior' | 'atual'

export interface ObjetivosEspecialidade {
  anterior: [ObjetivoItem, ObjetivoItem, ObjetivoItem]
  atual: [ObjetivoItem, ObjetivoItem, ObjetivoItem]
}

export type ObjetivosState = Record<string, ObjetivosEspecialidade>

// ── listas de opções ─────────────────────────────────────────────────────────
const STATUS_EVOLUCAO = [
  { value: 'ALCANCADO',         label: 'Alcançado' },
  { value: 'PARCIAL',           label: 'Parcialmente Alcançado' },
  { value: 'NAO_ALCANCADO',     label: 'Não Alcançado' },
  { value: 'NAO_SE_APLICA',     label: 'Não se Aplica' },
]

// TODO: preencher com as listas reais de objetivos por especialidade
const OBJETIVOS_POR_ESPECIALIDADE: Record<string, string[]> = {
  fisioterapia:        [],
  fisio_aquatica:      [],
  fonoaudiologia:      [],
  terapia_ocupacional: [],
  ed_fisica:           [],
  psicologia:          [],
  psicologia_musical:  [],
  psicopedagogia:      [],
  prof_braille:        [],
}

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
  return { objetivo: undefined, descricao: undefined, status: undefined }
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

function badgePorEspecialidade(estado: ObjetivosState, key: string) {
  const esp = estado[key]
  const total = contarPreenchidos(esp.anterior) + contarPreenchidos(esp.atual)
  if (total === 0) return null
  return <Badge count={total} size="small" style={{ backgroundColor: '#667eea' }} />
}

// ── sub-componente: linha de objetivo ────────────────────────────────────────
function LinhaObjetivo({
  numero,
  item,
  momento,
  listaOpcoes,
  onChange,
}: {
  numero: number
  item: ObjetivoItem
  momento: MomentoObjetivos
  listaOpcoes: string[]
  onChange: (campo: keyof ObjetivoItem, valor: string | undefined) => void
}) {
  return (
    <Row gutter={[12, 8]} align="top" style={{ marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
      {/* número */}
      <Col flex="32px">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: momento === 'anterior' ? '#d9d9d9' : '#667eea',
            color: momento === 'anterior' ? '#595959' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 13,
            marginTop: 2,
          }}
        >
          {numero}
        </div>
      </Col>

      {/* select do objetivo */}
      <Col flex="1" style={{ minWidth: 180 }}>
        <Select
          style={{ width: '100%' }}
          placeholder="Selecione o objetivo..."
          allowClear
          showSearch
          optionFilterProp="label"
          disabled={momento === 'anterior'}
          options={listaOpcoes.map((v) => ({ label: v, value: v }))}
          value={item.objetivo}
          onChange={(v) => onChange('objetivo', v)}
        />
      </Col>

      {/* status (apenas anterior) */}
      {momento === 'anterior' && (
        <Col flex="200px">
          <Select
            style={{ width: '100%' }}
            placeholder="Status da evolução..."
            allowClear
            options={STATUS_EVOLUCAO}
            value={item.status}
            onChange={(v) => onChange('status', v)}
          />
        </Col>
      )}

      {/* texto livre */}
      <Col span={24} style={{ paddingLeft: 44 }}>
        <Input.TextArea
          rows={2}
          placeholder={momento === 'anterior' ? 'Evolução do objetivo anterior...' : 'Descreva o objetivo atual...'}
          value={item.descricao}
          onChange={(e) => onChange('descricao', e.target.value)}
          style={{ fontSize: 13 }}
        />
      </Col>
    </Row>
  )
}

// ── componente principal exportado ────────────────────────────────────────────
interface Props {
  value: ObjetivosState
  onChange: (next: ObjetivosState) => void
}

export default function ObjetivosEspecialidades({ value, onChange }: Props) {
  const [momento, setMomento] = useState<Record<string, MomentoObjetivos>>(
    () => Object.fromEntries(ESPECIALIDADES.map((e) => [e.key, 'atual' as MomentoObjetivos]))
  )

  function handleMomento(key: string, m: MomentoObjetivos) {
    setMomento((prev) => ({ ...prev, [key]: m }))
  }

  function handleItem(
    espKey: string,
    mom: MomentoObjetivos,
    idx: number,
    campo: keyof ObjetivoItem,
    val: string | undefined
  ) {
    const espAtual = value[espKey]
    const lista = [...espAtual[mom]] as [ObjetivoItem, ObjetivoItem, ObjetivoItem]
    lista[idx] = { ...lista[idx], [campo]: val }
    onChange({ ...value, [espKey]: { ...espAtual, [mom]: lista } })
  }

  const items = ESPECIALIDADES.map((esp) => {
    const mom = momento[esp.key]
    const lista = value[esp.key][mom]
    const qtdAnterior = contarPreenchidos(value[esp.key].anterior)
    const qtdAtual    = contarPreenchidos(value[esp.key].atual)

    return {
      key: esp.key,
      label: (
        <Space>
          <span style={{ color: esp.color }}>{esp.icon}</span>
          <Text strong>{esp.label}</Text>
          {qtdAnterior > 0 && (
            <Tag color="default" style={{ fontSize: 11 }}>
              {qtdAnterior} anterior{qtdAnterior > 1 ? 'es' : ''}
            </Tag>
          )}
          {qtdAtual > 0 && (
            <Tag color="purple" style={{ fontSize: 11 }}>
              {qtdAtual} atual{qtdAtual > 1 ? 'is' : ''}
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
            value={mom}
            onChange={(v) => handleMomento(esp.key, v as MomentoObjetivos)}
            style={{ width: '100%' }}
          />

          {mom === 'anterior' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Objetivos carregados automaticamente do último PTS registrado para este paciente nesta especialidade.
            </Text>
          )}

          {/* 3 linhas de objetivo */}
          {lista.map((item, idx) => (
            <LinhaObjetivo
              key={idx}
              numero={idx + 1}
              item={item}
              momento={mom}
              listaOpcoes={OBJETIVOS_POR_ESPECIALIDADE[esp.key]}
              onChange={(campo, val) => handleItem(esp.key, mom, idx, campo, val)}
            />
          ))}
        </Space>
      ),
    }
  })

  return (
    <Collapse
      accordion={false}
      items={items}
      style={{ background: '#fff' }}
      expandIconPosition="end"
    />
  )
}
