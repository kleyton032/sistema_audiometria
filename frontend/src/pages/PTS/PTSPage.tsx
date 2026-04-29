import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  Input,
  Checkbox,
  Button,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Table,
  Tag,
  Alert,
  InputNumber,
  DatePicker,
} from 'antd'
import { SaveOutlined, FileTextOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import ObjetivosEspecialidades, {
  criarObjetivosIniciais,
  type ObjetivosState,
} from './ObjetivosEspecialidades'
import type { ColumnsType } from 'antd/es/table'
import {
  DIAGNOSTICOS_PRINCIPAIS,
  DIAGNOSTICOS_AREA,
  GRAU_DEFICIENCIA,
  DIAGNOSTICOS_TERAPEUTICOS,
  INSTRUMENTOS_AVALIACAO,
  TERAPIAS_INDICADAS,
  TIPOS_ATENDIMENTO,
  PERIODICIDADES,
  AREAS,
  AREA_LABEL,
  type Area,
} from './data/listas'
import { getMe } from '@/api'
import type { User } from '@/types'

const { Title, Text } = Typography
dayjs.locale('pt-br')

// ── tipo linha de terapia indicada ───────────────────────────────────────────
interface TerapiaRow {
  key: number
  terapia: string | undefined
  tipo_atendimento: string | undefined
  periodicidade: string | undefined
  qtde_sessoes: number | undefined
}

// ── helpers ──────────────────────────────────────────────────────────────────
function toOptions(list: string[]) {
  return list.map((v) => ({ label: v, value: v }))
}

// ── tipos do formulário ───────────────────────────────────────────────────────
interface DiagnosticoAreaRow {
  area: Area
  diagnostico: string | undefined
  grau: string | undefined
}

interface PTSFormValues {
  diag_principal_1: string | undefined
  diag_principal_2: string | undefined
  diag_principal_3: string | undefined
  diag_principal_4: string | undefined
  diag_outros: string | undefined
  queixa_principal: string | undefined
  diag_terapeutico_1: string | undefined
  diag_terapeutico_2: string | undefined
  diag_terapeutico_3: string | undefined
  def_associada_visual: boolean
  def_associada_intelectual: boolean
  def_associada_fisica: boolean
  def_associada_auditiva: boolean
  // condições do paciente
  cond_nao_se_aplica: boolean
  cond_nao_escuta: boolean
  cond_nao_fala: boolean
  cond_nao_enxerga: boolean
  cond_agitacao: boolean
  cond_agressividade: boolean
  cond_nao_anda: boolean
  cond_nao_fica_sozinho: boolean
  cond_sem_ctrl_cervical: boolean
  cond_sem_ctrl_tronco: boolean
  cond_outra: string | undefined
  // OPME
  opme_nao_se_aplica: boolean
  opme_cadeira: boolean
  opme_bengala: boolean
  opme_muleta: boolean
  opme_andador: boolean
  opme_protese: boolean
  opme_com_alta: boolean
  opme_com_baixa: boolean
  opme_orteses: boolean
  opme_outros: string | undefined
  // CER IV
  cer_fisioterapia: boolean
  cer_fisio_aquatica: boolean
  cer_fonoaudiologia: boolean
  cer_terapia_ocupacional: boolean
  cer_ed_fisica: boolean
  cer_psicologia: boolean
  cer_psicologia_musical: boolean
  cer_psicopedagogia: boolean
  cer_professor_braille: boolean
  // Serviços externos
  ext_nao_realiza: boolean
  ext_fisio_to: string | undefined
  ext_psicologia: string | undefined
  ext_fonoaudiologia: string | undefined
  ext_outras: string | undefined
  // Condutas
  conduta_avaliacao_medica: string | undefined
  conduta_multidisciplinar: string | undefined
  // Observações e condutas finais
  observacoes_gerais: string | undefined
  conduta_interdisciplinar: string | undefined
  intervencao_prazo: string | undefined
  intervencao_descricao: string | undefined
  // Instrumentos
  instrumento_1: string | undefined
  instrumento_2: string | undefined
  instrumento_3: string | undefined
  instrumento_4: string | undefined
  instrumento_outros: string | undefined
  // Programa Específico
  prog_glaucoma: boolean
  prog_catarata: boolean
  prog_alem_olhar: boolean
  prog_zika: boolean
  prog_apoio_familiar: boolean
  prog_tea: boolean
  prog_intervencao_precoce: boolean
  prog_rop: boolean
  prog_pronas_tea: boolean
  prog_pronas_doencas_raras: boolean
  // Rodapé
  pts_vigencia: string | undefined
  pts_nao_concluido: boolean
}

// ── componente principal ─────────────────────────────────────────────────────
export default function PTSPage() {
  const [form] = Form.useForm<PTSFormValues>()
  const [diagnosticosArea, setDiagnosticosArea] = useState<Record<Area, string | undefined>>(
    () => Object.fromEntries(AREAS.map((a) => [a, undefined])) as Record<Area, string | undefined>
  )
  const [grauArea, setGrauArea] = useState<Record<Area, string | undefined>>(
    () => Object.fromEntries(AREAS.map((a) => [a, undefined])) as Record<Area, string | undefined>
  )
  const [objetivos, setObjetivos] = useState<ObjetivosState>(criarObjetivosIniciais)
  const [usuarioMe, setUsuarioMe] = useState<User | null>(null)
  const [terapias, setTerapias] = useState<TerapiaRow[]>([{ key: 1, terapia: undefined, tipo_atendimento: undefined, periodicidade: undefined, qtde_sessoes: undefined }])

  useEffect(() => {
    getMe().then(setUsuarioMe).catch(() => null)
  }, [])

  // ── colunas tabela diagnóstico por área ───────────────────────────────────
  const colsDiagArea: ColumnsType<DiagnosticoAreaRow> = [
    {
      title: 'Área',
      dataIndex: 'area',
      width: 130,
      render: (v: Area) => <Text strong>{AREA_LABEL[v]}</Text>,
    },
    {
      title: 'Diagnóstico Médico Específico da Área',
      dataIndex: 'diagnostico',
      render: (_: unknown, row) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Selecione..."
          allowClear
          showSearch
          optionFilterProp="label"
          options={toOptions(DIAGNOSTICOS_AREA[row.area])}
          value={diagnosticosArea[row.area]}
          onChange={(v) => setDiagnosticosArea((prev) => ({ ...prev, [row.area]: v }))}
        />
      ),
    },
  ]

  const colsGrau: ColumnsType<DiagnosticoAreaRow> = [
    {
      title: 'Área de deficiência',
      dataIndex: 'area',
      width: 130,
      render: (v: Area) => <Text strong>{AREA_LABEL[v]}</Text>,
    },
    {
      title: 'Classificação do Grau de Deficiência',
      dataIndex: 'grau',
      render: (_: unknown, row) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Selecione..."
          allowClear
          showSearch
          optionFilterProp="label"
          options={toOptions(GRAU_DEFICIENCIA[row.area])}
          value={grauArea[row.area]}
          onChange={(v) => setGrauArea((prev) => ({ ...prev, [row.area]: v }))}
        />
      ),
    },
  ]

  const tableData: DiagnosticoAreaRow[] = AREAS.map((area) => ({
    area,
    diagnostico: diagnosticosArea[area],
    grau: grauArea[area],
  }))

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSave = (values: PTSFormValues) => {
    const payload = {
      ...values,
      diagnosticos_area: diagnosticosArea,
      grau_area: grauArea,
      objetivos,
      terapias_indicadas: terapias,
      prestador: usuarioMe?.nm_usuario,
      especialidade_conselho: [
        usuarioMe?.ds_especialidade,
        usuarioMe?.nr_conselho ? `Conselho: ${usuarioMe.nr_conselho}` : undefined,
      ].filter(Boolean).join('/'),
    }
    // TODO: chamar endpoint PTS quando disponível
    console.log('PTS payload:', payload)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Cabeçalho */}
      <Card
        bordered={false}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Space>
          <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              PTS — Programa Terapêutico Singular
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              Preenchimento do Programa Terapêutico Singular do paciente
            </Text>
          </div>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message="Módulo em implantação — fase de testes"
        description="Este módulo está disponível para validação. As seções de objetivos, condutas e PDF serão adicionadas nas próximas etapas."
        banner
      />

      <Form form={form} layout="vertical" onFinish={handleSave}>

        {/* ── SEÇÃO 1: Diagnóstico Médico Principal ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Diagnóstico Médico Principal</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 8]}>
            {[1, 2, 3, 4].map((n) => (
              <Col span={24} key={n}>
                <Form.Item
                  name={`diag_principal_${n}` as keyof PTSFormValues}
                  label={n === 1 ? undefined : undefined}
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="Selecione..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={toOptions(DIAGNOSTICOS_PRINCIPAIS)}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Form.Item label="Outros:" name="diag_outros" style={{ marginBottom: 0 }}>
            <Input placeholder="Outros diagnósticos..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 2: Diagnóstico Médico Específico da Área ── */}
        <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={tableData}
            columns={colsDiagArea}
            rowKey="area"
            pagination={false}
            size="small"
            bordered
          />
        </Card>

        {/* ── SEÇÃO 3: Área de deficiência / Grau ── */}
        <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={tableData}
            columns={colsGrau}
            rowKey="area"
            pagination={false}
            size="small"
            bordered
          />
        </Card>

        {/* ── SEÇÃO 4: Queixa(s) Principal(is) ── */}
        <Card style={{ marginBottom: 16 }}>
          <Form.Item label={<Text strong>Queixa(s) Principal(is):</Text>} name="queixa_principal">
            <Input.TextArea rows={4} placeholder="Descreva as queixas principais do paciente..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 5: Diagnóstico(s) Terapêutico(s) ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Diagnóstico(s) Terapêutico(s)</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 8]}>
            {[1, 2, 3].map((n) => (
              <Col span={24} key={n}>
                <Form.Item
                  name={`diag_terapeutico_${n}` as keyof PTSFormValues}
                  style={{ marginBottom: 8 }}
                >
                  <Select
                    placeholder="Selecione..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={toOptions(DIAGNOSTICOS_TERAPEUTICOS)}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        {/* ── SEÇÃO 6: Deficiências Associadas ── */}
        <Card style={{ marginBottom: 16 }}>
          <Space align="center" wrap>
            <Text strong>Deficiência(s) Associada(s):</Text>
            <Form.Item name="def_associada_visual" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Visual</Checkbox>
            </Form.Item>
            <Form.Item name="def_associada_intelectual" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Intelectual</Checkbox>
            </Form.Item>
            <Form.Item name="def_associada_fisica" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Física</Checkbox>
            </Form.Item>
            <Form.Item name="def_associada_auditiva" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Auditiva</Checkbox>
            </Form.Item>
          </Space>
        </Card>

        {/* ── SEÇÃO 7: Condições do Paciente ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Condições do Paciente</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[24, 8]}>
            {[
              ['cond_nao_se_aplica', 'Não se aplica'],
              ['cond_nao_escuta', 'Não escuta'],
              ['cond_nao_fala', 'Não Fala'],
              ['cond_nao_enxerga', 'Não enxerga'],
              ['cond_agitacao', 'Agitação Psicomotora'],
              ['cond_agressividade', 'Agressividade'],
              ['cond_nao_anda', 'Não Anda'],
              ['cond_nao_fica_sozinho', 'Não consegue ficar sozinho na sala'],
              ['cond_sem_ctrl_cervical', 'Não tem controle cervical'],
              ['cond_sem_ctrl_tronco', 'Não tem controle do tronco'],
            ].map(([name, label]) => (
              <Col key={name} xs={24} sm={12} md={8} lg={6}>
                <Form.Item name={name as keyof PTSFormValues} valuePropName="checked" style={{ marginBottom: 4 }}>
                  <Checkbox>{label}</Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Form.Item label="Outra Condição:" name="cond_outra" style={{ marginBottom: 0 }}>
            <Input placeholder="Descreva outra condição..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 8: Uso de OPME ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Uso de OPME (órtese, prótese e materiais especiais)</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[24, 8]}>
            {[
              ['opme_nao_se_aplica', 'Não se aplica'],
              ['opme_cadeira', 'Faz uso de cadeira de rodas'],
              ['opme_bengala', 'Utiliza Bengala'],
              ['opme_muleta', 'Utiliza Muleta'],
              ['opme_andador', 'Utiliza Andador'],
              ['opme_protese', 'Utiliza Prótese (ocular, auditiva e/ou ortopédica)'],
              ['opme_com_alta', 'Recursos de Comunicação Alternativa (alta tecnologia)'],
              ['opme_com_baixa', 'Recursos de Comunicação Alternativa (baixa tecnologia)'],
              ['opme_orteses', 'Usa Órteses'],
            ].map(([name, label]) => (
              <Col key={name} xs={24} sm={12} md={8}>
                <Form.Item name={name as keyof PTSFormValues} valuePropName="checked" style={{ marginBottom: 4 }}>
                  <Checkbox>{label}</Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Form.Item label="Outros OPME:" name="opme_outros" style={{ marginBottom: 0 }}>
            <Input placeholder="Descreva outros OPME..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 9: Faz outras terapias no CER IV ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Faz outras terapias no CER IV</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[24, 8]}>
            {([
              ['cer_fisioterapia',       'Fisioterapia'],
              ['cer_fisio_aquatica',     'Fisioterapia Aquática'],
              ['cer_fonoaudiologia',     'Fonoaudiologia'],
              ['cer_terapia_ocupacional','Terapia Ocupacional'],
              ['cer_ed_fisica',          'Profissional de Educação Física'],
              ['cer_psicologia',         'Psicologia'],
              ['cer_psicologia_musical', 'Psicologia Sonoro Musical'],
              ['cer_psicopedagogia',     'Psicopedagogia'],
              ['cer_professor_braille',  'Professor de Braille'],
            ] as [string, string][]).map(([name, label]) => (
              <Col key={name} xs={24} sm={12} md={8} lg={6}>
                <Form.Item name={name as keyof PTSFormValues} valuePropName="checked" style={{ marginBottom: 4 }}>
                  <Checkbox>{label}</Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        {/* ── SEÇÃO 10: Faz outras terapias em serviços externos ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Faz outras terapias em serviços externos</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Fisioterapia / Terap. Ocupacional" name="ext_fisio_to">
                <Input.TextArea rows={3} placeholder="Descreva..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Psicologia / Psicopedagogia" name="ext_psicologia">
                <Input.TextArea rows={3} placeholder="Descreva..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Fonoaudiologia" name="ext_fonoaudiologia">
                <Input.TextArea rows={3} placeholder="Descreva..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Outras" name="ext_outras">
                <Input.TextArea rows={3} placeholder="Descreva..." />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '4px 0 8px' }} />
          <Form.Item name="ext_nao_realiza" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>Não Realiza</Checkbox>
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 11: Conduta: Avaliação Médica ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Conduta: Avaliação Médica</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="conduta_avaliacao_medica" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} placeholder="Descreva a conduta de avaliação médica..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 12: Conduta: Atendimento Multidisciplinar ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Conduta: Atendimento Multidisciplinar</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="conduta_multidisciplinar" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} placeholder="Descreva a conduta de atendimento multidisciplinar..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 13: Objetivos por Especialidade ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Space>
                <Text strong>Objetivos por Especialidade</Text>
                <Tag color="purple" style={{ fontSize: 11 }}>Anterior + Atual</Tag>
              </Space>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="Clique na especialidade para expandir. Alterne entre &lsquo;Objetivos Atuais&rsquo; e &lsquo;Objetivos Anteriores (evolução)&rsquo; dentro de cada painel."
          />
          <ObjetivosEspecialidades value={objetivos} onChange={setObjetivos} />
        </Card>

        {/* ── SEÇÃO 14: Observações Gerais ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Observações</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="observacoes_gerais" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={4} placeholder="Observações gerais..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 15: Conduta Interdisciplinar ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Conduta Interdisciplinar</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="conduta_interdisciplinar" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={4} placeholder="Descreva a conduta interdisciplinar..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 16: Intervenção ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Intervenção</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 8]} align="middle" style={{ marginBottom: 12 }}>
            <Col flex="none">
              <Text strong>Prazo máximo estimado:</Text>
            </Col>
            <Col flex="220px">
              <Form.Item name="intervencao_prazo" style={{ marginBottom: 0 }}>
                <Input placeholder="Ex: 03 (Três) Meses" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="intervencao_descricao" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} placeholder="Descreva a intervenção..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 17: Instrumentos usados na avaliação ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Text strong>Instrumentos usados na avaliação</Text>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 8]}>
            {[1, 2, 3, 4].map((n) => (
              <Col xs={24} sm={12} key={n}>
                <Form.Item name={`instrumento_${n}` as keyof PTSFormValues} style={{ marginBottom: 8 }}>
                  <Select
                    placeholder="Selecione..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={INSTRUMENTOS_AVALIACAO.map((v) => ({ label: v, value: v }))}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Row align="middle" gutter={8}>
            <Col flex="none"><Text strong>Outros:</Text></Col>
            <Col flex="1">
              <Form.Item name="instrumento_outros" style={{ marginBottom: 0 }}>
                <Input placeholder="Outros instrumentos..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ── SEÇÃO 18: Programa Específico ── */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[0, 0]} align="top">
            <Col flex="160px">
              <Text strong>Programa Específico:</Text>
            </Col>
            <Col flex="1">
              <Row gutter={[24, 8]}>
                {([
                  ['prog_glaucoma',            'Glaucoma Congênito'],
                  ['prog_catarata',            'Catarata Congênita'],
                  ['prog_alem_olhar',          'Além do Olhar'],
                  ['prog_zika',               'ZIKA'],
                  ['prog_apoio_familiar',      'Apoio Familiar'],
                  ['prog_tea',                'TEA'],
                  ['prog_intervencao_precoce', 'Intervenção Precoce'],
                  ['prog_rop',                'ROP'],
                  ['prog_pronas_tea',          'PRONAS TEA'],
                  ['prog_pronas_doencas_raras','PRONAS Doenças Raras'],
                ] as [string, string][]).map(([name, label]) => (
                  <Col key={name} xs={12} sm={8} md={6}>
                    <Form.Item name={name as keyof PTSFormValues} valuePropName="checked" style={{ marginBottom: 4 }}>
                      <Checkbox>{label}</Checkbox>
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Card>

        {/* ── SEÇÃO 19: Terapia Indicada ── */}
        <Card
          title={
            <div style={{ background: '#d9d9d9', margin: '-12px -24px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
              <Row justify="space-between" align="middle">
                <Text strong>Terapia Indicada</Text>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    setTerapias((prev) => [
                      ...prev,
                      { key: Date.now(), terapia: undefined, tipo_atendimento: undefined, periodicidade: undefined, qtde_sessoes: undefined },
                    ])
                  }
                >
                  Adicionar linha
                </Button>
              </Row>
            </div>
          }
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 0 }}
        >
          <Table<TerapiaRow>
            dataSource={terapias}
            rowKey="key"
            pagination={false}
            size="small"
            bordered
            columns={[
              {
                title: 'Terapia',
                dataIndex: 'terapia',
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione..."
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={TERAPIAS_INDICADAS.map((v) => ({ label: v, value: v }))}
                    value={row.terapia}
                    onChange={(v) => setTerapias((prev) => prev.map((r) => r.key === row.key ? { ...r, terapia: v } : r))}
                  />
                ),
              },
              {
                title: 'Tipo de Atendimento',
                dataIndex: 'tipo_atendimento',
                width: 180,
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione..."
                    allowClear
                    options={TIPOS_ATENDIMENTO.map((v) => ({ label: v, value: v }))}
                    value={row.tipo_atendimento}
                    onChange={(v) => setTerapias((prev) => prev.map((r) => r.key === row.key ? { ...r, tipo_atendimento: v } : r))}
                  />
                ),
              },
              {
                title: 'Periodicidade',
                dataIndex: 'periodicidade',
                width: 180,
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione..."
                    allowClear
                    options={PERIODICIDADES.map((v) => ({ label: v, value: v }))}
                    value={row.periodicidade}
                    onChange={(v) => setTerapias((prev) => prev.map((r) => r.key === row.key ? { ...r, periodicidade: v } : r))}
                  />
                ),
              },
              {
                title: 'Qtde. Sessões',
                dataIndex: 'qtde_sessoes',
                width: 120,
                render: (_: unknown, row) => (
                  <InputNumber
                    min={1}
                    max={999}
                    style={{ width: '100%' }}
                    value={row.qtde_sessoes}
                    onChange={(v) => setTerapias((prev) => prev.map((r) => r.key === row.key ? { ...r, qtde_sessoes: v ?? undefined } : r))}
                  />
                ),
              },
              {
                title: '',
                width: 48,
                render: (_: unknown, row) => (
                  terapias.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => setTerapias((prev) => prev.filter((r) => r.key !== row.key))}
                    />
                  ) : null
                ),
              },
            ]}
          />
        </Card>

        {/* ── SEÇÃO 20: Rodapé do documento ── */}
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {/* Vigência */}
            <Row align="middle" gutter={12}>
              <Col flex="none">
                <Text strong>PTS entrou em vigor em:</Text>
              </Col>
              <Col flex="200px">
                <Form.Item name="pts_vigencia" style={{ marginBottom: 0 }}>
                  <DatePicker
                    format="MM/YYYY"
                    picker="month"
                    style={{ width: '100%' }}
                    placeholder="Mês/Ano"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Não concluído */}
            <Form.Item name="pts_nao_concluido" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>
                <Text style={{ color: '#cf1322', fontWeight: 600 }}>PTS não concluído</Text>
              </Checkbox>
            </Form.Item>

            <Divider style={{ margin: '4px 0' }} />

            {/* Data automática */}
            <Row gutter={[16, 8]} align="middle">
              <Col flex="none"><Text strong>Data:</Text></Col>
              <Col flex="200px">
                <Input value={dayjs().format('DD/MM/YYYY HH:mm:ss')} disabled />
              </Col>
            </Row>

            {/* Prestador auto-preenchido */}
            <Row gutter={[16, 8]} align="middle">
              <Col flex="none"><Text strong>Prestador:</Text></Col>
              <Col flex="1">
                <Input
                  value={usuarioMe?.nm_usuario ?? '—'}
                  disabled
                  style={{ maxWidth: 480 }}
                />
              </Col>
            </Row>

            {/* Especialidade/Conselho auto-preenchido */}
            <Row gutter={[16, 8]} align="middle">
              <Col flex="none"><Text strong>Especialidade/Conselho:</Text></Col>
              <Col flex="1">
                <Input
                  value={
                    [usuarioMe?.ds_especialidade, usuarioMe?.nr_conselho ? `Conselho: ${usuarioMe.nr_conselho}` : undefined]
                      .filter(Boolean).join('/') || '—'
                  }
                  disabled
                  style={{ maxWidth: 480 }}
                />
              </Col>
            </Row>
          </Space>
        </Card>

        {/* ── LGPD ── */}
        <Card
          style={{ marginBottom: 16, background: '#f5f5f5', border: '1px solid #d9d9d9' }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Text strong>LGPD — Lei Geral de Proteção de Dados</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Documento com dados sensíveis coletados para fins de assistência médica e terapêutica.
            Entregue e sob a guarda do paciente e/ou responsável legal. Em conformidade com a LGPD.
          </Text>
        </Card>

        {/* ── ações ── */}
        <Row justify="end">
          <Col>
            <Space>
              <Button onClick={() => form.resetFields()}>Limpar</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Salvar PTS
              </Button>
            </Space>
          </Col>
        </Row>

      </Form>
    </Space>
  )
}
