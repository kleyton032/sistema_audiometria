import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  Popconfirm,
  message,
  Modal,
  Result,
  Spin,
  notification,
} from 'antd'
import { SaveOutlined, FileTextOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import ObjetivosEspecialidades, {
  criarObjetivosIniciais,
  validarObjetivos,
  getMinhasEspecialidades,
  type ObjetivosState,
  type ObjetivoErro,
} from './ObjetivosEspecialidades'
import type { ColumnsType } from 'antd/es/table'
import PTSPrintView from './PTSPrintView'
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
  CER_GRUPOS,
  CER_GRUPO_LABEL,
  CER_OPCOES,
  EXTERNAL_TERAPY_OPTIONS,
  type CerGrupo,
  type Area,
} from './data/listas'
import { getMe, getPTSDiagnosticosPrincipais, getPTSDiagnosticosArea, getPTSDiagnosticosTerapeuticos, getPTSEspecialidades, getPTSItensMultidisciplinar, getPTSTerapiasIndicadas, getPTSInstrumentosAvaliacao, finalizarPTS, cancelarPTS, savePTS, updatePTS, getPTSById, getCondutaInterdisciplinarStatus } from '@/api'
import type { CondutaInterdisciplinarStatus } from '@/api/ptsService'
import type { User } from '@/types'

const { Title, Text } = Typography
dayjs.locale('pt-br')

// ── helper especialidade/conselho ────────────────────────────────────────────
function formatEspecialidadeConselho(user: any): string {
  const p = user?.prestador || user;
  const especialidade = p?.nm_tip_presta || p?.ds_especialidade
  if (!especialidade) return '—'
  const isPsicopedagogo = especialidade.toUpperCase().includes('PSICOPEDAGO')
  if (isPsicopedagogo) return especialidade
  const codigoConselho = p?.ds_codigo_conselho || p?.nr_conselho
  if (!codigoConselho) return especialidade
  const nomeConselho = p?.ds_conselho || 'Conselho'
  return `${especialidade} / ${nomeConselho}: ${codigoConselho}`
}

// ── tipo linha diagnóstico médico principal ─────────────────────────────────
interface DiagPrincipalRow {
  key: number
  diagnostico: string | undefined
}

// ── tipo linha de terapia indicada ───────────────────────────────────────────
interface TerapiaRow {
  key: number
  cd_terapia: string | undefined
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
  // CER IV — agora gerenciado por estado (cerTerapias), removido da interface do form
  cer_terapias_texto: string | undefined
  // Serviços externos
  ext_nao_realiza: boolean
  // Condutas
  conduta_avaliacao_medica: string | undefined
  conduta_multidisciplinar: string | undefined
  // Observações e condutas finais
  observacoes_gerais: string | undefined
  conduta_interdisciplinar: string | undefined
  intervencao_prazo: string | undefined
  intervencao_descricao: string | undefined
  // Instrumentos — gerenciados por estado (instrumentoRows)
  // Programa Específico
  prog_nao_se_aplica: boolean
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
interface PacienteState {
  nm_paciente:    string | null
  cd_paciente:    number | null
  cd_atendimento: number | null
  id_pts:         number | null
  fl_finalizado:  number | null
}

export default function PTSPage() {
  const location  = useLocation()
  const navigate   = useNavigate()
  const paciente  = (location.state ?? {}) as Partial<PacienteState>

  const [form] = Form.useForm<PTSFormValues>()
  const [diagnosticosArea, setDiagnosticosArea] = useState<Record<Area, string | undefined>>(
    () => Object.fromEntries(AREAS.map((a) => [a, undefined])) as Record<Area, string | undefined>
  )
  const [grauArea, setGrauArea] = useState<Record<Area, string | undefined>>(
    () => Object.fromEntries(AREAS.map((a) => [a, undefined])) as Record<Area, string | undefined>
  )
  const [objetivos, setObjetivos] = useState<ObjetivosState>(criarObjetivosIniciais)
  const [usuarioMe, setUsuarioMe] = useState<User | null>(null)
  const [terapias, setTerapias] = useState<TerapiaRow[]>([{ key: 1, cd_terapia: undefined, terapia: undefined, tipo_atendimento: undefined, periodicidade: undefined, qtde_sessoes: undefined }])
  const [diagPrincipais, setDiagPrincipais] = useState<DiagPrincipalRow[]>([{ key: 1, diagnostico: undefined }])
  const [opcoesDiagPrincipais, setOpcoesDiagPrincipais] = useState<string[]>([])
  const [opcoesDiagTerapeuticos, setOpcoesDiagTerapeuticos] = useState<string[]>([])
  const [diagTerapeuticos, setDiagTerapeuticos] = useState<DiagPrincipalRow[]>([{ key: 1, diagnostico: undefined }])
  const [extTerapias, setExtTerapias] = useState<DiagPrincipalRow[]>([{ key: Date.now(), diagnostico: undefined }])
  const [conductaRows, setConductaRows] = useState<DiagPrincipalRow[]>([{ key: 1, diagnostico: undefined }])
  const [opcoesEspecialidades, setOpcoesEspecialidades] = useState<{ cd: string; ds: string }[]>([])
  const [multidisciplinarRows, setMultidisciplinarRows] = useState<DiagPrincipalRow[]>([{ key: 1, diagnostico: undefined }])
  const [opcoesMultidisciplinar, setOpcoesMultidisciplinar] = useState<{ cd: string; ds: string }[]>([])
  const [opcoesTerapiasIndicadas, setOpcoesTerapiasIndicadas] = useState<{ cd: string; ds: string }[]>([])
  const [instrumentoRows, setInstrumentoRows] = useState<DiagPrincipalRow[]>([{ key: 1, diagnostico: undefined }])
  const [condutaStatus, setCondutaStatus] = useState<CondutaInterdisciplinarStatus | null>(null)
  const [condutaStatusLoading, setCondutaStatusLoading] = useState(false)
  const [salvandoPTS, setSalvandoPTS] = useState(false)
  const [finalizandoPTS, setFinalizandoPTS] = useState(false)
  const [cancelandoPTS, setCancelandoPTS] = useState(false)
  const [printTrigger, setPrintTrigger] = useState(0)
  const [idPtsSalvo, setIdPtsSalvo] = useState<number | null>(() => paciente.id_pts ?? null)
  const [ptsFinalizado, setPtsFinalizado] = useState(() => (paciente.fl_finalizado ?? 0) === 1)
  const [idUsuarioAutor, setIdUsuarioAutor] = useState<number | null>(null)
  const [errosObjetivos, setErrosObjetivos] = useState<Record<string, { anterior: (ObjetivoErro | null)[]; atual: (ObjetivoErro | null)[] }>>({})


  // Consulta situação do documento de conduta interdisciplinar no MV (cd_documento=770)
  // e auto-preenche o campo oculto para persistência na tabela
  useEffect(() => {
    if (!paciente.cd_paciente) return
    setCondutaStatusLoading(true)
    getCondutaInterdisciplinarStatus(paciente.cd_paciente)
      .then((status) => {
        setCondutaStatus(status)
        form.setFieldValue('conduta_interdisciplinar', status.status_documento)
      })
      .catch(() => setCondutaStatus(null))
      .finally(() => setCondutaStatusLoading(false))
  }, [paciente.cd_paciente])

  // Observador para o campo de prazo da seção 16
  const prazoEstimado = Form.useWatch('intervencao_prazo', form)
  // Observador reativo para vigência (necessário para passar ao ObjetivosEspecialidades)
  const vigenciaAtual = Form.useWatch('pts_vigencia', form)
  // Observadores para "Não se aplica" que desabilitam outras opções
  const condNaoSeAplica = Form.useWatch('cond_nao_se_aplica', form)
  const opmeNaoSeAplica = Form.useWatch('opme_nao_se_aplica', form)

  // Memo para valores iniciais estáveis
  const initialValues = React.useMemo(() => ({
    intervencao_prazo: '06 (Seis) Meses',
    pts_vigencia: dayjs().format('YYYY-MM')
  }), [])

  // Helper para extrair número de meses do texto (ex: "06 (Seis) Meses" -> 6)
  const obterMesesPrazo = (texto: string | undefined): number => {
    if (!texto) return 0
    const match = texto.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }
  const [modalResultado, setModalResultado] = useState<{ visivel: boolean; status: 'success' | 'error'; titulo: string; mensagem: string }>(
    { visivel: false, status: 'success', titulo: '', mensagem: '' }
  )
  const [opcoesInstrumentos, setOpcoesInstrumentos] = useState<{ cd: string; ds: string }[]>([])
  const [opcoesDiagArea, setOpcoesDiagArea] = useState<Record<Area, string[]>>({
    visual: [],
    intelectual: [],
    fisica: [],
    auditiva: [],
  })
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [modalCancelamento, setModalCancelamento] = useState(false)
  const [formCancel] = Form.useForm()

  // ── carrega dados do PTS existente ao montar ──────────────────────────────
  function popularFormulario(d: any) {
    // Campos escalares do formulário antd
    form.setFieldsValue({
      queixa_principal:          d.queixa_principal,
      def_associada_visual:      d.def_associada_visual,
      def_associada_intelectual: d.def_associada_intelectual,
      def_associada_fisica:      d.def_associada_fisica,
      def_associada_auditiva:    d.def_associada_auditiva,
      cond_nao_se_aplica:        d.cond_nao_se_aplica,
      cond_nao_escuta:           d.cond_nao_escuta,
      cond_nao_fala:             d.cond_nao_fala,
      cond_nao_enxerga:          d.cond_nao_enxerga,
      cond_agitacao:             d.cond_agitacao,
      cond_agressividade:        d.cond_agressividade,
      cond_nao_anda:             d.cond_nao_anda,
      cond_nao_fica_sozinho:     d.cond_nao_fica_sozinho,
      cond_sem_ctrl_cervical:    d.cond_sem_ctrl_cervical,
      cond_sem_ctrl_tronco:      d.cond_sem_ctrl_tronco,
      cond_outra:                d.cond_outra,
      opme_nao_se_aplica:        d.opme_nao_se_aplica,
      opme_cadeira:              d.opme_cadeira,
      opme_bengala:              d.opme_bengala,
      opme_muleta:               d.opme_muleta,
      opme_andador:              d.opme_andador,
      opme_protese:              d.opme_protese,
      opme_com_alta:             d.opme_com_alta,
      opme_com_baixa:            d.opme_com_baixa,
      opme_orteses:              d.opme_orteses,
      opme_outros:               d.opme_outros,
      cer_terapias_texto:        d.cer_terapias_texto,
      ext_nao_realiza:           d.ext_nao_realiza,
      observacoes_gerais:        d.observacoes_gerais,
      conduta_interdisciplinar:  d.conduta_interdisciplinar,
      intervencao_prazo:         d.intervencao_prazo,
      intervencao_descricao:     d.intervencao_descricao,
      prog_nao_se_aplica:        d.prog_nao_se_aplica,
      prog_glaucoma:             d.prog_glaucoma,
      prog_catarata:             d.prog_catarata,
      prog_alem_olhar:           d.prog_alem_olhar,
      prog_zika:                 d.prog_zika,
      prog_apoio_familiar:       d.prog_apoio_familiar,
      prog_tea:                  d.prog_tea,
      prog_intervencao_precoce:  d.prog_intervencao_precoce,
      prog_rop:                  d.prog_rop,
      prog_pronas_tea:           d.prog_pronas_tea,
      prog_pronas_doencas_raras: d.prog_pronas_doencas_raras,
      pts_vigencia:              d.pts_vigencia,
      pts_nao_concluido:         d.pts_nao_concluido,
    })
    setIdUsuarioAutor(d.id_usuario ?? null)
    // Listas gerenciadas por estado
    const toRows = (arr: string[]): DiagPrincipalRow[] =>
      arr.length > 0
        ? arr.map((v, i) => ({ key: i + 1, diagnostico: v }))
        : [{ key: 1, diagnostico: undefined }]
    setDiagPrincipais(toRows(d.diagnosticos_principais ?? []))
    setDiagTerapeuticos(toRows(d.diagnosticos_terapeuticos ?? []))
    setExtTerapias(toRows(d.cer_terapias ?? []))
    setConductaRows(toRows(d.conduta_avaliacao_medica ?? []))
    setMultidisciplinarRows(toRows(d.conduta_multidisciplinar ?? []))
    setInstrumentoRows(toRows(d.instrumentos ?? []))
    setTerapias(
      (d.terapias_indicadas ?? []).length > 0
        ? d.terapias_indicadas
        : [{ key: 1, cd_terapia: undefined, terapia: undefined, tipo_atendimento: undefined, periodicidade: undefined, qtde_sessoes: undefined }]
    )
    setDiagnosticosArea(
      (d.diagnosticos_area ?? {}) as Record<Area, string | undefined>
    )
    setGrauArea((d.grau_area ?? {}) as Record<Area, string | undefined>)
    setObjetivos({ ...criarObjetivosIniciais(), ...(d.objetivos ?? {}) })
    setIdPtsSalvo(d.id_pts)
    setPtsFinalizado(d.fl_finalizado === 1)
  }

  useEffect(() => {
    if (paciente.id_pts) {
      setCarregandoDados(true)
      getPTSById(paciente.id_pts)
        .then(popularFormulario)
        .catch((e) => console.error('Erro ao carregar PTS:', e))
        .finally(() => setCarregandoDados(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    getMe().then(setUsuarioMe).catch(() => null)
    getPTSDiagnosticosPrincipais().then(setOpcoesDiagPrincipais).catch(() => null)
    getPTSDiagnosticosTerapeuticos().then(setOpcoesDiagTerapeuticos).catch(() => null)
    getPTSEspecialidades().then(setOpcoesEspecialidades).catch(() => null)
    getPTSItensMultidisciplinar().then(setOpcoesMultidisciplinar).catch(() => null)
    getPTSTerapiasIndicadas().then(setOpcoesTerapiasIndicadas).catch(() => null)
    getPTSInstrumentosAvaliacao().then(setOpcoesInstrumentos).catch(() => null)
    // Visual: sem dados por enquanto (id_especialidade não definido)
    getPTSDiagnosticosArea(64).then((v) => setOpcoesDiagArea((p) => ({ ...p, intelectual: v }))).catch(() => null)
    getPTSDiagnosticosArea(66).then((v) => setOpcoesDiagArea((p) => ({ ...p, fisica: v }))).catch(() => null)
    getPTSDiagnosticosArea(68).then((v) => setOpcoesDiagArea((p) => ({ ...p, auditiva: v }))).catch(() => null)
  }, [])

  // Reação quando "Não se aplica" é marcado na seção de Condições
  useEffect(() => {
    if (condNaoSeAplica) {
      form.setFieldsValue({
        cond_nao_escuta: false,
        cond_nao_fala: false,
        cond_nao_enxerga: false,
        cond_agitacao: false,
        cond_agressividade: false,
        cond_nao_anda: false,
        cond_nao_fica_sozinho: false,
        cond_sem_ctrl_cervical: false,
        cond_sem_ctrl_tronco: false,
      })
    }
  }, [condNaoSeAplica, form])

  // Reação quando "Não se aplica" é marcado na seção de OPME
  useEffect(() => {
    if (opmeNaoSeAplica) {
      form.setFieldsValue({
        opme_cadeira: false,
        opme_bengala: false,
        opme_muleta: false,
        opme_andador: false,
        opme_protese: false,
        opme_com_alta: false,
        opme_com_baixa: false,
        opme_orteses: false,
      })
    }
  }, [opmeNaoSeAplica, form])

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
          aria-label={`Diagnóstico médico específico para a área ${AREA_LABEL[row.area]}`}
          allowClear
          showSearch
          optionFilterProp="label"
          options={toOptions(opcoesDiagArea[row.area])}
          value={diagnosticosArea[row.area]}
          disabled={ptsFinalizado}
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
          aria-label={`Classificação do grau de deficiência para a área ${AREA_LABEL[row.area]}`}
          allowClear
          showSearch
          optionFilterProp="label"
          options={toOptions(GRAU_DEFICIENCIA[row.area])}
          value={grauArea[row.area]}
          disabled={ptsFinalizado}
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
  const handleSave = async (values: PTSFormValues, finalizeAfterSave = false) => {
    // Validação de objetivos antes de salvar
    const minhasEsps = getMinhasEspecialidades(usuarioMe)
    const val = validarObjetivos(objetivos, minhasEsps)
    if (val.temErro) {
      setErrosObjetivos(val.erros)
      notification.error({
        message: 'Objetivos Incompletos',
        description: `Por favor, preencha todos os campos obrigatórios nos objetivos das especialidades: ${val.especialidadesComErro.join(', ')}.`,
        duration: 8,
      })
      // Faz scroll até a seção de objetivos
      document.getElementById('sec-objetivos')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setErrosObjetivos({})

    setSalvandoPTS(true)
    const payload = {
      ...values,
      cd_paciente: String(paciente.cd_paciente || ''),
      nr_atendimento: String(paciente.cd_atendimento || ''),
      diagnosticos_principais: diagPrincipais.map((r) => r.diagnostico).filter(Boolean),
      diagnosticos_terapeuticos: diagTerapeuticos.map((r) => r.diagnostico).filter(Boolean),
      cer_terapias: extTerapias.map((r) => r.diagnostico).filter(Boolean),
      conduta_avaliacao_medica: conductaRows.map((r) => r.diagnostico).filter(Boolean),
      conduta_multidisciplinar: multidisciplinarRows.map((r) => r.diagnostico).filter(Boolean),
      instrumentos: instrumentoRows.map((r) => r.diagnostico).filter(Boolean),
      diagnosticos_area: diagnosticosArea,
      grau_area: grauArea,
      objetivos,
      terapias_indicadas: terapias,
      pts_vigencia: values.pts_vigencia || undefined,
      pts_nao_concluido: !!values.pts_nao_concluido,
    }
    
    try {
      const resp = await (idPtsSalvo !== null ? updatePTS(idPtsSalvo, payload) : savePTS(payload))
      setIdPtsSalvo(resp.id_pts)
      
      if (!finalizeAfterSave) {
        setModalResultado({ visivel: true, status: 'success', titulo: 'PTS Salvo', mensagem: resp.mensagem })
      } else {
        await executarFinalizacao(resp.id_pts)
      }
    } catch (error: any) {
      console.error('Erro ao salvar PTS:', error)
      const msg = error?.response?.data?.detail ?? 'Erro ao salvar PTS. Tente novamente.'
      setModalResultado({ visivel: true, status: 'error', titulo: 'Erro ao Salvar', mensagem: msg })
    } finally {
      setSalvandoPTS(false)
    }
  }

  const executarFinalizacao = async (idPts: number) => {
    setFinalizandoPTS(true)
    try {
      const resp = await finalizarPTS(idPts)
      setPtsFinalizado(true)
      setModalResultado({ visivel: true, status: 'success', titulo: 'PTS Finalizado', mensagem: resp.mensagem || 'PTS finalizado com sucesso!' })
      navigate('/pts/pacientes')
    } catch (error: any) {
      console.error('Erro ao finalizar PTS:', error)
      const msg = error?.response?.data?.detail ?? 'Erro ao finalizar PTS. Tente novamente.'
      setModalResultado({ visivel: true, status: 'error', titulo: 'Erro ao Finalizar', mensagem: msg })
    } finally {
      setFinalizandoPTS(false)
    }
  }

  const handleFinalizar = async () => {
    // Validação de objetivos antes de finalizar
    const minhasEsps = getMinhasEspecialidades(usuarioMe)
    const val = validarObjetivos(objetivos, minhasEsps)
    if (val.temErro) {
      setErrosObjetivos(val.erros)
      notification.error({
        message: 'Objetivos Incompletos',
        description: `Por favor, preencha todos os campos obrigatórios nos objetivos das especialidades: ${val.especialidadesComErro.join(', ')}.`,
        duration: 8,
      })
      document.getElementById('sec-objetivos')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setErrosObjetivos({})

    if (idPtsSalvo === null) {
      // Se não salvou ainda, valida o form e salva com flag de finalizar depois
      try {
        const values = await form.validateFields()
        handleSave(values, true)
      } catch (err) {
        message.warning('Por favor, preencha os campos obrigatórios antes de finalizar.')
      }
      return
    }
    await executarFinalizacao(idPtsSalvo)
  }

  const SectionHeader = ({ title, children, id }: { title: string; children?: React.ReactNode; id?: string }) => (
    <div style={{ background: '#f0f2f5', borderBottom: '1px solid #d9d9d9', margin: '-12px -24px 12px', padding: '10px 24px', borderRadius: '8px 8px 0 0' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} id={id} style={{ margin: 0, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#434343' }}>
            {title}
          </Title>
        </Col>
        {children && <Col>{children}</Col>}
      </Row>
    </div>
  )

  const handleCancelar = async (values: { ds_motivo: string; ds_detalhe?: string }) => {
    if (idPtsSalvo === null) return
    setCancelandoPTS(true)
    try {
      await cancelarPTS(idPtsSalvo, values)
      setIdPtsSalvo(null)
      setPtsFinalizado(false)
      setModalCancelamento(false)
      form.resetFields()
      setModalResultado({
        visivel: true,
        status: 'success',
        titulo: 'PTS Cancelado',
        mensagem: 'O PTS foi cancelado e os itens foram removidos da fila de espera.'
      })
    } catch (error: any) {
      console.error('Erro ao cancelar PTS:', error)
      const msg = error?.response?.data?.detail ?? 'Erro ao cancelar PTS.'
      setModalResultado({
        visivel: true,
        status: 'error',
        titulo: 'Erro no Cancelamento',
        mensagem: msg
      })
    } finally {
      setCancelandoPTS(false)
    }
  }

  const handleImprimir = () => {
    setPrintTrigger(prev => prev + 1)
    setTimeout(() => {
      const el = document.getElementById('pts-print-content')
      if (!el) {
        window.print()
        return
      }

      // Coleta todo o CSS do documento (Ant Design + styles inline)
      const linkStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((link) => `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">`)
        .join('\n')

      const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map((s) => `<style>${s.textContent}</style>`)
        .join('\n')

      const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes')
      if (!w) {
        alert('Permita popups neste site para imprimir o PTS.')
        return
      }

      w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>PTS - Projeto Terapêutico Singular</title>
  ${linkStyles}
  ${inlineStyles}
  <style>
    body { background: white !important; color: black !important; margin: 0; }
    @page { margin: 1.5cm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${el.innerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 500);
    };
  <\/script>
</body></html>`)
      w.document.close()
    }, 600)
  }

  return (
    <>
    <div className="no-print">
    <Spin spinning={carregandoDados} tip="Carregando dados do PTS...">
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Modal
        open={modalResultado.visivel}
        footer={
          <Button type="primary" onClick={() => setModalResultado((p) => ({ ...p, visivel: false }))}>
            OK
          </Button>
        }
        onCancel={() => setModalResultado((p) => ({ ...p, visivel: false }))}
        style={{ top: 20 }}
        width={480}
      >
        <Result
          status={modalResultado.status}
          title={modalResultado.titulo}
          subTitle={modalResultado.mensagem}
        />
      </Modal>

      {/* Modal de Justificativa de Cancelamento */}
      <Modal
        title="Justificativa de Cancelamento"
        open={modalCancelamento}
        onCancel={() => setModalCancelamento(false)}
        onOk={() => formCancel.submit()}
        confirmLoading={cancelandoPTS}
        okText="Confirmar Cancelamento"
        cancelText="Desistir"
        okButtonProps={{ danger: true }}
        style={{ top: 20 }}
      >
        <Form
          form={formCancel}
          layout="vertical"
          onFinish={handleCancelar}
        >
          <Form.Item
            name="ds_motivo"
            label="Motivo do Cancelamento"
            rules={[{ required: true, message: 'Por favor, selecione um motivo.' }]}
          >
            <Select placeholder="Selecione o motivo...">
              <Select.Option value="ERRO_PREENCHIMENTO">Erro de Preenchimento</Select.Option>
              <Select.Option value="MUDANCA_CONDUTA">Mudança de Conduta Terapêutica</Select.Option>
              <Select.Option value="SOLICITACAO_PACIENTE">Solicitação do Paciente/Família</Select.Option>
              <Select.Option value="DUPLICIDADE">Registro em Duplicidade</Select.Option>
              <Select.Option value="OUTROS">Outros</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="ds_detalhe"
            label="Detalhes / Observações"
            rules={[{ required: true, message: 'Por favor, descreva o motivo do cancelamento.' }]}
          >
            <Input.TextArea rows={4} placeholder="Descreva detalhadamente o porquê do cancelamento..." />
          </Form.Item>
        </Form>
      </Modal>
      {/* Cabeçalho */}
      <Card
        variant="borderless"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
          <Space>
            <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />
            <div>
              <Title level={1} style={{ color: '#fff', margin: 0 }}>
                PTS — Projeto Terapêutico Singular
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                Preenchimento do Projeto Terapêutico Singular do paciente
              </Text>
            </div>
          </Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/pts/pacientes', { state: { fromPTS: true } })}
            style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}
          >
            Voltar para lista
          </Button>
        </Space>
      </Card>

      {/* Card do paciente (quando vem da lista) */}
      {paciente.nm_paciente && (
        <Card
          role="region"
          aria-label={`Paciente: ${paciente.nm_paciente}`}
          variant="borderless"
          style={{ background: '#f0f5ff', borderLeft: '4px solid #667eea' }}
          styles={{ body: { padding: '12px 20px' } }}
        >
          <Space size="large">
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>Paciente</Text>
              <Text strong style={{ fontSize: 16 }}>{paciente.nm_paciente}</Text>
            </Space>
            {paciente.cd_paciente && (
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}>Cód. Paciente</Text>
                <Text strong>{paciente.cd_paciente}</Text>
              </Space>
            )}
            {paciente.cd_atendimento && (
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: 12 }}>Cód. Atendimento</Text>
                <Text strong>{paciente.cd_atendimento}</Text>
              </Space>
            )}
          </Space>
        </Card>
      )}

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSave}
        initialValues={initialValues}
        disabled={ptsFinalizado}
      >

        {/* ── SEÇÃO 1: Diagnóstico Médico Principal ── */}
        <Card
          role="region"
          aria-labelledby="sec-diag-principal"
          title={
            <SectionHeader title="01. Diagnóstico Médico Principal (CID-10)" id="sec-diag-principal">
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={ptsFinalizado}
                onClick={() =>
                  setDiagPrincipais((prev) => [
                    ...prev,
                    { key: Date.now(), diagnostico: undefined },
                  ])
                }
              >
                Adicionar
              </Button>
            </SectionHeader>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table<DiagPrincipalRow>
            dataSource={diagPrincipais}
            rowKey="key"
            pagination={false}
            size="small"
            bordered
            showHeader={false}
            columns={[
              {
                dataIndex: 'diagnostico',
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione o diagnóstico..."
                    aria-label="Diagnóstico médico principal"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={opcoesDiagPrincipais.map((v) => ({ label: v, value: v }))}
                    value={row.diagnostico}
                    onChange={(v) =>
                      setDiagPrincipais((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, diagnostico: v } : r))
                      )
                    }
                  />
                ),
              },
              {
                width: 48,
                render: (_: unknown, row) =>
                  diagPrincipais.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Remover diagnóstico médico principal"
                      disabled={ptsFinalizado}
                      onClick={() =>
                        setDiagPrincipais((prev) => prev.filter((r) => r.key !== row.key))
                      }
                    />
                  ) : null,
              },
            ]}
          />
        </Card>

        {/* ── SEÇÃO 2: Diagnóstico Médico Específico da Área ── */}
        <Card 
          role="region"
          aria-labelledby="sec-diag-area"
          title={<SectionHeader title="02. Diagnóstico Médico Específico por Área" id="sec-diag-area" />}
          style={{ marginBottom: 16 }} 
          styles={{ body: { padding: 0 } }}
        >
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
        <Card 
          role="region"
          aria-labelledby="sec-area-def"
          title={<SectionHeader title="03. Classificação do Grau de Deficiência" id="sec-area-def" />}
          style={{ marginBottom: 16 }} 
          styles={{ body: { padding: 0 } }}
        >
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
        <Card 
          role="region" 
          aria-labelledby="sec-queixa"
          title={<SectionHeader title="04. Queixas Principais e Histórico" id="sec-queixa" />}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="queixa_principal" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={4} aria-label="Descreva as queixas principais" placeholder="Descreva as queixas principais do paciente..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 5: Diagnóstico(s) Terapêutico(s) ── */}
        <Card
          role="region"
          aria-labelledby="sec-diag-terapeutico"
          title={
            <SectionHeader title="05. Diagnóstico Terapêutico Multidisciplinar" id="sec-diag-terapeutico">
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={ptsFinalizado}
                onClick={() =>
                  setDiagTerapeuticos((prev) => [
                    ...prev,
                    { key: Date.now(), diagnostico: undefined },
                  ])
                }
              >
                Adicionar
              </Button>
            </SectionHeader>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table<DiagPrincipalRow>
            dataSource={diagTerapeuticos}
            rowKey="key"
            pagination={false}
            size="small"
            bordered
            showHeader={false}
            columns={[
              {
                dataIndex: 'diagnostico',
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione o diagnóstico terapêutico..."
                    aria-label="Diagnóstico terapêutico"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={opcoesDiagTerapeuticos.map((v) => ({ label: v, value: v }))}
                    value={row.diagnostico}
                    onChange={(v) =>
                      setDiagTerapeuticos((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, diagnostico: v } : r))
                      )
                    }
                  />
                ),
              },
              {
                width: 48,
                render: (_: unknown, row) =>
                  diagTerapeuticos.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Remover diagnóstico terapêutico"
                      disabled={ptsFinalizado}
                      onClick={() =>
                        setDiagTerapeuticos((prev) => prev.filter((r) => r.key !== row.key))
                      }
                    />
                  ) : null,
              },
            ]}
          />
        </Card>

        {/* ── SEÇÃO 6: Deficiências Associadas ── */}
        <Card 
          role="region" 
          aria-labelledby="sec-def-associada"
          title={<SectionHeader title="06. Deficiência(s) Associada(s)" id="sec-def-associada" />}
          style={{ marginBottom: 16 }}
        >
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="ant-form-item-label" style={{ marginBottom: 8, display: 'none' }}>Deficiências Associadas</legend>
            <Space align="center" wrap>
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
          </fieldset>
        </Card>

        {/* ── SEÇÃO 7: Condições do Paciente ── */}
        <Card
          role="region"
          aria-labelledby="sec-condicoes"
          title={<SectionHeader title="07. Condições Gerais do Paciente" id="sec-condicoes" />}
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
                  <Checkbox disabled={ptsFinalizado || (condNaoSeAplica && name !== 'cond_nao_se_aplica')}>
                    {label}
                  </Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Form.Item label="Outra Condição:" name="cond_outra" style={{ marginBottom: 0 }}>
            <Input placeholder="Descreva outra condição..." disabled={ptsFinalizado || condNaoSeAplica} />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 8: Uso de OPME ── */}
        <Card
          role="region"
          aria-labelledby="sec-opme"
          title={<SectionHeader title="08. Uso de Órteses, Próteses e Materiais Especiais (OPME)" id="sec-opme" />}
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
                  <Checkbox disabled={ptsFinalizado || (opmeNaoSeAplica && name !== 'opme_nao_se_aplica')}>
                    {label}
                  </Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Divider style={{ margin: '8px 0' }} />
          <Form.Item label="Outros OPME:" name="opme_outros" style={{ marginBottom: 0 }}>
            <Input placeholder="Descreva outros OPME..." disabled={ptsFinalizado || opmeNaoSeAplica} />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 9: Faz outras terapias no CER IV ── */}
        <Card
          role="region"
          aria-labelledby="sec-cer-terapias"
          title={<SectionHeader title="09. Terapias em Andamento no CER IV" id="sec-cer-terapias" />}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="cer_terapias_texto" style={{ marginBottom: 0 }}>
            <Input.TextArea
              rows={3}
              placeholder="Informação será preenchida automaticamente a partir da base de dados..."
              disabled
            />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 10: Faz outras terapias em serviços externos ── */}
        <Card
          role="region"
          aria-labelledby="sec-ext-terapias"
          title={
            <SectionHeader title="10. Especificação das Terapias Externas (Fisio, Fono, Psic, Outros)" id="sec-ext-terapias">
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={ptsFinalizado}
                onClick={() =>
                  setExtTerapias((prev) => [...prev, { key: Date.now(), diagnostico: undefined }])
                }
              >
                Adicionar
              </Button>
            </SectionHeader>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table<DiagPrincipalRow>
            dataSource={extTerapias}
            rowKey="key"
            pagination={false}
            size="small"
            showHeader={false}
            columns={[
              {
                dataIndex: 'diagnostico',
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione a terapia externa..."
                    aria-label="Terapia externa"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={EXTERNAL_TERAPY_OPTIONS.map((v) => ({ label: v, value: v }))}
                    value={row.diagnostico}
                    onChange={(v) =>
                      setExtTerapias((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, diagnostico: v } : r))
                      )
                    }
                  />
                ),
              },
              {
                width: 48,
                render: (_: unknown, row) =>
                  extTerapias.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Remover terapia externa"
                      disabled={ptsFinalizado}
                      onClick={() =>
                        setExtTerapias((prev) => prev.filter((r) => r.key !== row.key))
                      }
                    />
                  ) : null,
              },
            ]}
          />
          <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
            <Form.Item name="ext_nao_realiza" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Não Realiza</Checkbox>
            </Form.Item>
          </div>
        </Card>

        {/* ── SEÇÕES 11 e 12: Avaliação Médica + Atendimento Multidisciplinar ── */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card
              role="region"
              aria-labelledby="sec-conduta-medica"
              title={
                <SectionHeader title="11. Conduta: Avaliação Médica" id="sec-conduta-medica">
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={ptsFinalizado}
                    onClick={() =>
                      setConductaRows((prev) => [...prev, { key: Date.now(), diagnostico: undefined }])
                    }
                  >
                    Adicionar
                  </Button>
                </SectionHeader>
              }
              style={{ height: '100%' }}
              styles={{ body: { padding: 0 } }}
            >
              <Table<DiagPrincipalRow>
                dataSource={conductaRows}
                rowKey="key"
                pagination={false}
                size="small"
                bordered
                showHeader={false}
                columns={[
                  {
                    dataIndex: 'diagnostico',
                    render: (_: unknown, row) => (
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Selecione a especialidade / conduta..."
                        aria-label="Conduta: Avaliação Médica"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={opcoesEspecialidades.map((e) => ({ label: e.ds, value: e.ds }))}
                        value={row.diagnostico}
                        onChange={(v) =>
                          setConductaRows((prev) =>
                            prev.map((r) => (r.key === row.key ? { ...r, diagnostico: v } : r))
                          )
                        }
                      />
                    ),
                  },
                  {
                    width: 48,
                    render: (_: unknown, row) =>
                      conductaRows.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label="Remover avaliação médica"
                          disabled={ptsFinalizado}
                          onClick={() =>
                            setConductaRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        />
                      ) : null,
                  },
                ]}
              />
            </Card>
          </Col>

          <Col span={12}>
            <Card
              role="region"
              aria-labelledby="sec-conduta-multi"
              title={
                <SectionHeader title="12. Conduta: Atendimento Multidisciplinar" id="sec-conduta-multi">
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={ptsFinalizado}
                    onClick={() =>
                      setMultidisciplinarRows((prev) => [...prev, { key: Date.now(), diagnostico: undefined }])
                    }
                  >
                    Adicionar
                  </Button>
                </SectionHeader>
              }
              style={{ height: '100%' }}
              styles={{ body: { padding: 0 } }}
            >
              <Table<DiagPrincipalRow>
                dataSource={multidisciplinarRows}
                rowKey="key"
                pagination={false}
                size="small"
                bordered
                showHeader={false}
                columns={[
                  {
                    dataIndex: 'diagnostico',
                    render: (_: unknown, row) => (
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Selecione o item de avaliação/rastreio..."
                        aria-label="Conduta: Atendimento Multidisciplinar"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={opcoesMultidisciplinar.map((e) => ({ label: e.ds, value: e.ds }))}
                        value={row.diagnostico}
                        onChange={(v) =>
                          setMultidisciplinarRows((prev) =>
                            prev.map((r) => (r.key === row.key ? { ...r, diagnostico: v } : r))
                          )
                        }
                      />
                    ),
                  },
                  {
                    width: 48,
                    render: (_: unknown, row) =>
                      multidisciplinarRows.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label="Remover item multidisciplinar"
                          disabled={ptsFinalizado}
                          onClick={() =>
                            setMultidisciplinarRows((prev) => prev.filter((r) => r.key !== row.key))
                          }
                        />
                      ) : null,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* ── SEÇÃO 13: Objetivos por Especialidade ── */}
        <Card
          role="region"
          aria-labelledby="sec-objetivos"
          title={
            <SectionHeader title="13. Plano de Metas e Objetivos por Especialidade" id="sec-objetivos">
              <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>Anterior + Atual</Tag>
            </SectionHeader>
          }
          style={{ marginBottom: 16 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="Clique na especialidade para expandir. Alterne entre &lsquo;Objetivos Atuais&rsquo; e &lsquo;Objetivos Anteriores (evolução)&rsquo; dentro de cada painel."
          />
          <ObjetivosEspecialidades
            value={objetivos}
            onChange={setObjetivos}
            ptsFinalizado={ptsFinalizado}
            nrAtendimento={paciente.cd_atendimento}
            cdPaciente={paciente.cd_paciente}
            vigencia={vigenciaAtual || dayjs().format('YYYY-MM')}
            idPtsAtual={idPtsSalvo ?? -1}
            erros={errosObjetivos}
          />
        </Card>

        {/* ── SEÇÃO 14: Observações Gerais ── */}
        <Card
          role="region"
          aria-labelledby="sec-obs"
          title={<SectionHeader title="14. Observações Complementares" id="sec-obs" />}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="observacoes_gerais" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={4} placeholder="Observações gerais..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 15: Conduta Interdisciplinar ── */}
        <Card
          role="region"
          aria-labelledby="sec-conduta-inter"
          title={<SectionHeader title="15. Conduta Interdisciplinar e Articulação" id="sec-conduta-inter" />}
          style={{ marginBottom: 16 }}
        >
          {/* Situação no sistema MV (últimos 3 meses) */}
          {condutaStatusLoading && (
            <div style={{ marginBottom: 12 }}>
              <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Verificando situação no sistema...</Text>
            </div>
          )}
          {!condutaStatusLoading && condutaStatus && (
            <Alert
              type={condutaStatus.possui_preenchimento ? 'success' : 'warning'}
              showIcon
              message="Situação no sistema MV — últimos 3 meses"
              description={condutaStatus.status_documento}
            />
          )}

          {/* Campo oculto — persiste o status_documento na coluna DS_CONDUTA_INTERDISCIPLINAR */}
          <Form.Item name="conduta_interdisciplinar" style={{ display: 'none' }}>
            <Input />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 16: Intervenção ── */}
        <Card
          role="region"
          aria-labelledby="sec-intervencao"
          title={<SectionHeader title="16. Intervenção" id="sec-intervencao" />}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="intervencao_descricao" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={4} placeholder="Descreva a intervenção..." />
          </Form.Item>
        </Card>

        {/* ── SEÇÃO 17: Prazo Estimado ── */}
        <Card
          role="region"
          aria-labelledby="sec-prazo"
          title={<SectionHeader title="17. Prazo Estimado" id="sec-prazo" />}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 8]} align="middle">
            <Col flex="none">
              <Text strong>Prazo máximo estimado:</Text>
            </Col>
            <Col flex="220px">
              <Form.Item name="intervencao_prazo" style={{ marginBottom: 0 }}>
                <Input placeholder="Ex: 03 (Três) Meses" disabled aria-label="Prazo máximo estimado fixo em 06 (Seis) Meses" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ── SEÇÃO 17: Instrumentos usados na avaliação ── */}
        <Card
          role="region"
          aria-labelledby="sec-instrumentos"
          title={
            <SectionHeader title="18. Instrumentos e Escalas de Avaliação" id="sec-instrumentos">
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={ptsFinalizado}
                onClick={() =>
                  setInstrumentoRows((prev) => [...prev, { key: Date.now(), diagnostico: undefined }])
                }
              >
                Adicionar
              </Button>
            </SectionHeader>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table<DiagPrincipalRow>
            dataSource={instrumentoRows}
            rowKey="key"
            pagination={false}
            size="small"
            bordered
            showHeader={false}
            columns={[
              {
                dataIndex: 'diagnostico',
                render: (_: unknown, row) => (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Selecione o instrumento..."
                    aria-label="Instrumento usado na avaliação"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    disabled={ptsFinalizado}
                    options={opcoesInstrumentos.map((i) => ({ label: i.ds, value: i.ds }))}
                    value={row.diagnostico}
                    onChange={(v) =>
                      setInstrumentoRows((prev) =>
                        prev.map((r) => (r.key === row.key ? { ...r, diagnostico: v } : r))
                      )
                    }
                  />
                ),
              },
              {
                width: 48,
                render: (_: unknown, row) =>
                  instrumentoRows.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Remover instrumento de avaliação"
                      disabled={ptsFinalizado}
                      onClick={() =>
                        setInstrumentoRows((prev) => prev.filter((r) => r.key !== row.key))
                      }
                    />
                  ) : null,
              },
            ]}
          />
        </Card>

        {/* ── SEÇÃO 18: Programa Específico ── */}
        <Card 
          role="region" 
          aria-labelledby="sec-prog-especifico"
          title={<SectionHeader title="19. Programas Específicos de Acompanhamento" id="sec-prog-especifico" />}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[0, 0]} align="top">
            <Col flex="160px">
              <Text strong>Programa Específico:</Text>
            </Col>
            <Col flex="1">
              <Row gutter={[24, 8]}>
                {([
                  ['prog_nao_se_aplica',       'Não se Aplica'],
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
          role="region"
          aria-labelledby="sec-terapias-indicadas"
          title={
            <SectionHeader title="20. Prescrição de Terapias Indicadas" id="sec-terapias-indicadas" />
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 0 } }}
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
                    aria-label="Terapia indicada"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={opcoesTerapiasIndicadas.map((e) => ({ label: e.ds, value: e.cd }))}
                    value={row.cd_terapia}
                    disabled={ptsFinalizado}
                    onChange={(cd) => {
                      const item = opcoesTerapiasIndicadas.find((e) => e.cd === cd)
                      setTerapias((prev) => prev.map((r) => r.key === row.key ? { ...r, cd_terapia: cd, terapia: item?.ds } : r))
                    }}
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
                    aria-label="Tipo de atendimento da terapia"
                    allowClear
                    options={TIPOS_ATENDIMENTO.map(o => ({ label: o.label, value: o.label }))}
                    value={row.tipo_atendimento}
                    disabled={ptsFinalizado}
                    onChange={(v) => {
                      setTerapias((prev) => prev.map((r) => {
                        if (r.key === row.key) {
                          const meses = obterMesesPrazo(prazoEstimado)
                          let novaQtde = r.qtde_sessoes
                          
                          // Sugere quantidade apenas se tiver prazo definido
                          if (meses > 0 && v) {
                            if (r.periodicidade === 'Semanal') novaQtde = meses * 4
                            else if (r.periodicidade === 'Quinzenal') novaQtde = meses * 2
                            else if (r.periodicidade === 'Mensal') novaQtde = meses * 1
                            else if (r.periodicidade === 'Bimestral') novaQtde = Math.ceil(meses / 2)
                            else if (r.periodicidade === 'Trimestral') novaQtde = Math.ceil(meses / 3)
                            else if (r.periodicidade === 'Semestral') novaQtde = Math.ceil(meses / 6)
                            else if (r.periodicidade === 'Anual') novaQtde = 1
                          }

                          return { ...r, tipo_atendimento: v, qtde_sessoes: novaQtde }
                        }
                        return r
                      }))
                    }}
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
                    aria-label="Periodicidade da terapia"
                    allowClear
                    options={PERIODICIDADES.map(o => ({ label: o.label, value: o.label }))}
                    value={row.periodicidade}
                    disabled={ptsFinalizado}
                    onChange={(v) => {
                      setTerapias((prev) => prev.map((r) => {
                        if (r.key === row.key) {
                          const meses = obterMesesPrazo(prazoEstimado)
                          let novaQtde = r.qtde_sessoes
                          
                          if (meses > 0) {
                            if (v === 'Semanal') novaQtde = meses * 4
                            else if (v === 'Quinzenal') novaQtde = meses * 2
                            else if (v === 'Mensal') novaQtde = meses * 1
                            else if (v === 'Bimestral') novaQtde = Math.ceil(meses / 2)
                            else if (v === 'Trimestral') novaQtde = Math.ceil(meses / 3)
                            else if (v === 'Semestral') novaQtde = Math.ceil(meses / 6)
                            else if (v === 'Anual') novaQtde = 1
                          }

                          return { ...r, periodicidade: v, qtde_sessoes: novaQtde }
                        }
                        return r
                      }))
                    }}
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
                    disabled={ptsFinalizado}
                    onChange={(v) => setTerapias((prev) => prev.map((r) => r.key === row.key ? { ...r, qtde_sessoes: v ?? undefined } : r))}
                  />
                ),
              },
            ]}
          />
        </Card>

        {/* ── SEÇÃO 20: Rodapé do documento ── */}
        <Card 
          role="region" 
          aria-labelledby="sec-vigencia"
          title={<SectionHeader title="21. Vigência e Responsabilidade Técnica" id="sec-vigencia" />}
          style={{ marginBottom: 16 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
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
                  value={formatEspecialidadeConselho(usuarioMe)}
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
          styles={{ body: { padding: '12px 16px' } }}
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
              <Button onClick={() => form.resetFields()} disabled={ptsFinalizado}>Limpar</Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={cancelandoPTS}
                disabled={idPtsSalvo === null || (idUsuarioAutor !== null && usuarioMe?.id_usuario !== idUsuarioAutor)}
                onClick={() => {
                  formCancel.resetFields()
                  setModalCancelamento(true)
                }}
                title={
                  idPtsSalvo === null 
                    ? 'Salve o PTS antes de cancelar' 
                    : (idUsuarioAutor !== null && usuarioMe?.id_usuario !== idUsuarioAutor)
                      ? 'Apenas o autor deste PTS pode cancelá-lo'
                      : 'Cancela o PTS e remove itens da fila de espera'
                }
              >
                Cancelar PTS
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handleImprimir}
                disabled={!ptsFinalizado || salvandoPTS || finalizandoPTS}
                title={!ptsFinalizado ? 'Finalize o PTS para habilitar a impressão' : (salvandoPTS || finalizandoPTS ? 'Aguarde...' : undefined)}
              >
                Imprimir
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={salvandoPTS}
                disabled={ptsFinalizado}
                title={ptsFinalizado ? 'PTS já finalizado — não é possível editar' : undefined}
              >
                Salvar PTS
              </Button>
              <Button
                type="primary"
                danger
                icon={<CheckCircleOutlined />}
                loading={finalizandoPTS}
                onClick={handleFinalizar}
                disabled={ptsFinalizado}
                title={ptsFinalizado ? 'PTS já finalizado' : 'Salva o PTS e insere as terapias na fila de espera'}
              >
                Finalizar PTS
              </Button>
            </Space>
          </Col>
        </Row>


      </Form>
    </Space>
    </Spin>
    </div>

    {/* Componente de impressão FORA do no-print para não ser escondido pelo @media print */}
    <div className="print-only">
      <div id="pts-print-content">
        <PTSPrintView
          key={printTrigger}
          data={{
            paciente,
            formValues: form.getFieldsValue(true),
            diagPrincipais,
            diagnosticosArea,
            grauArea,
            diagTerapeuticos,
            extTerapias,
            conductaRows,
            multidisciplinarRows,
            instrumentoRows,
            terapias,
            objetivos,
            usuarioMe,
            fl_finalizado: ptsFinalizado ? 1 : 0,
          }}
        />
      </div>
    </div>
    </>
  )
}
