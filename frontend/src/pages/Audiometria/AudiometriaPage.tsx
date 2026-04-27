import { useState, useEffect } from 'react'
import {
  Card, Col, Row, Typography, Input, Divider, Tag, Select,
  Button, Space, Alert, Spin, notification, Tooltip,
} from 'antd'
import {
  SaveOutlined, FilePdfOutlined, CheckCircleOutlined, LoadingOutlined,
} from '@ant-design/icons'
import AudiogramChart from './AudiogramChart'
import ThresholdInput from './ThresholdInput'
import SpeechAudiometryInput from './SpeechAudiometryInput'
import type { AudiometryData, HearingLossType, HearingLossGrade } from '@/types'
import { calculatePTA, classifyHearingLoss } from '@/types'
import {
  buscarExamePorAtendimento,
  criarExameAudiometria,
  atualizarExameAudiometria,
  finalizarExame,
  gerarLaudoPdf,
  type ResultadoAudioResponse,
  type ExameAudiometriaCreate,
} from '@/api/exameService'

const { Title, Text } = Typography
const { TextArea } = Input

// ── Helpers de conversão ──────────────────────────────────────────────────────

const emptyThresholds = () => ({ airConduction: {}, boneConduction: {} })
const emptySpeech = () => ({ srt: null, irf: null, irfIntensity: null })
const emptyData = (): AudiometryData => ({
  rightEar: emptyThresholds(),
  leftEar: emptyThresholds(),
  speechRight: emptySpeech(),
  speechLeft: emptySpeech(),
  hearingLossType: null,
  hearingLossGrade: null,
  conclusion: '',
})

function resultadoToData(r: ResultadoAudioResponse): AudiometryData {
  return {
    rightEar: {
      airConduction: {
        250: r.od_va_250 ?? undefined, 500: r.od_va_500 ?? undefined,
        1000: r.od_va_1000 ?? undefined, 2000: r.od_va_2000 ?? undefined,
        3000: r.od_va_3000 ?? undefined, 4000: r.od_va_4000 ?? undefined,
        6000: r.od_va_6000 ?? undefined, 8000: r.od_va_8000 ?? undefined,
      },
      boneConduction: {
        500: r.od_vo_500 ?? undefined, 1000: r.od_vo_1000 ?? undefined,
        2000: r.od_vo_2000 ?? undefined, 4000: r.od_vo_4000 ?? undefined,
      },
    },
    leftEar: {
      airConduction: {
        250: r.oe_va_250 ?? undefined, 500: r.oe_va_500 ?? undefined,
        1000: r.oe_va_1000 ?? undefined, 2000: r.oe_va_2000 ?? undefined,
        3000: r.oe_va_3000 ?? undefined, 4000: r.oe_va_4000 ?? undefined,
        6000: r.oe_va_6000 ?? undefined, 8000: r.oe_va_8000 ?? undefined,
      },
      boneConduction: {
        500: r.oe_vo_500 ?? undefined, 1000: r.oe_vo_1000 ?? undefined,
        2000: r.oe_vo_2000 ?? undefined, 4000: r.oe_vo_4000 ?? undefined,
      },
    },
    speechRight: {
      srt: r.od_lrf ?? null,
      irf: r.od_iprf_mon ?? null,
      irfIntensity: r.od_iprf_int ?? null,
    },
    speechLeft: {
      srt: r.oe_lrf ?? null,
      irf: r.oe_iprf_mon ?? null,
      irfIntensity: r.oe_iprf_int ?? null,
    },
    hearingLossType: (r.ds_tipo_od as HearingLossType) ?? null,
    hearingLossGrade: (r.ds_class_od as HearingLossGrade) ?? null,
    conclusion: r.ds_conclusao ?? '',
  }
}

function dataToPayload(
  data: AudiometryData,
  cdPaciente: number,
  cdAtendimento: number | null,
  ptaRight: number | null,
  ptaLeft: number | null,
): ExameAudiometriaCreate {
  const ac = data.rightEar.airConduction
  const bc = data.rightEar.boneConduction
  const acL = data.leftEar.airConduction
  const bcL = data.leftEar.boneConduction
  return {
    id_paciente: cdPaciente,
    id_atendimento: cdAtendimento,
    od_va_250: ac[250] ?? null, od_va_500: ac[500] ?? null,
    od_va_1000: ac[1000] ?? null, od_va_2000: ac[2000] ?? null,
    od_va_3000: ac[3000] ?? null, od_va_4000: ac[4000] ?? null,
    od_va_6000: ac[6000] ?? null, od_va_8000: ac[8000] ?? null,
    od_vo_500: bc[500] ?? null, od_vo_1000: bc[1000] ?? null,
    od_vo_2000: bc[2000] ?? null, od_vo_4000: bc[4000] ?? null,
    oe_va_250: acL[250] ?? null, oe_va_500: acL[500] ?? null,
    oe_va_1000: acL[1000] ?? null, oe_va_2000: acL[2000] ?? null,
    oe_va_3000: acL[3000] ?? null, oe_va_4000: acL[4000] ?? null,
    oe_va_6000: acL[6000] ?? null, oe_va_8000: acL[8000] ?? null,
    oe_vo_500: bcL[500] ?? null, oe_vo_1000: bcL[1000] ?? null,
    oe_vo_2000: bcL[2000] ?? null, oe_vo_4000: bcL[4000] ?? null,
    od_lrf: data.speechRight.srt, od_iprf_mon: data.speechRight.irf,
    od_iprf_int: data.speechRight.irfIntensity,
    oe_lrf: data.speechLeft.srt, oe_iprf_mon: data.speechLeft.irf,
    oe_iprf_int: data.speechLeft.irfIntensity,
    nr_media_od: ptaRight, nr_media_oe: ptaLeft,
    ds_class_od: data.hearingLossGrade ?? null,
    ds_class_oe: data.hearingLossGrade ?? null,
    ds_tipo_od: data.hearingLossType ?? null,
    ds_tipo_oe: data.hearingLossType ?? null,
    ds_conclusao: data.conclusion || null,
    fl_cae_od_obstruido: 0,
    fl_cae_oe_obstruido: 0,
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

interface AudiometriaPageProps {
  cdPaciente?: number | null
  cdAtendimento?: number | null
}

export default function AudiometriaPage({ cdPaciente, cdAtendimento }: AudiometriaPageProps) {
  const [data, setData] = useState<AudiometryData>(emptyData())
  const [idExame, setIdExame] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const ptaRight = calculatePTA(data.rightEar)
  const ptaLeft = calculatePTA(data.leftEar)
  const gradeRight = ptaRight !== null ? classifyHearingLoss(ptaRight) : null
  const gradeLeft = ptaLeft !== null ? classifyHearingLoss(ptaLeft) : null
  const isFinalizado = status === 'FINALIZADO'

  // Carrega exame existente ao abrir
  useEffect(() => {
    if (!cdAtendimento) return
    setLoading(true)
    buscarExamePorAtendimento(cdAtendimento)
      .then((exame) => {
        if (exame?.resultado_audio) {
          setData(resultadoToData(exame.resultado_audio))
          setIdExame(exame.id_exame)
          setStatus(exame.ds_status)
        }
      })
      .catch(() => {/* sem exame existente */})
      .finally(() => setLoading(false))
  }, [cdAtendimento])

  async function salvar() {
    if (!cdPaciente) {
      notification.warning({ message: 'Paciente não identificado.' })
      return
    }
    setSaving(true)
    try {
      const payload = dataToPayload(data, cdPaciente, cdAtendimento ?? null, ptaRight, ptaLeft)
      let exame
      if (idExame) {
        exame = await atualizarExameAudiometria(idExame, payload)
      } else {
        exame = await criarExameAudiometria(payload)
        setIdExame(exame.id_exame)
      }
      setStatus(exame.ds_status)
      notification.success({ message: 'Exame salvo como rascunho.' })
    } catch {
      notification.error({ message: 'Erro ao salvar o exame.' })
    } finally {
      setSaving(false)
    }
  }

  async function finalizar() {
    if (!idExame) { await salvar(); return }
    setSaving(true)
    try {
      const exame = await finalizarExame(idExame)
      setStatus(exame.ds_status)
      notification.success({ message: 'Exame finalizado com sucesso.' })
    } catch {
      notification.error({ message: 'Erro ao finalizar o exame.' })
    } finally {
      setSaving(false)
    }
  }

  async function gerarPdf() {
    if (!idExame) {
      notification.warning({ message: 'Salve o exame antes de gerar o laudo.' })
      return
    }
    setGeneratingPdf(true)
    try {
      const blob = await gerarLaudoPdf(idExame)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laudo_audiometria_${idExame}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      notification.success({ message: 'Laudo gerado e salvo com sucesso.' })
    } catch {
      notification.error({ message: 'Erro ao gerar o laudo PDF.' })
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        <div style={{ marginTop: 12, color: '#888' }}>Carregando exame existente...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 8px' }}>
      {/* Status do exame */}
      {status && (
        <Alert
          style={{ marginBottom: 16 }}
          type={isFinalizado ? 'success' : 'info'}
          showIcon
          message={
            isFinalizado
              ? 'Exame finalizado — somente leitura'
              : `Exame em rascunho (ID: ${idExame})`
          }
        />
      )}

      {/* Audiograma */}
      <Card style={{ marginBottom: 32, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <AudiogramChart rightEar={data.rightEar} leftEar={data.leftEar} title="Audiograma" />
      </Card>

      {/* Limiares e Logoaudiometria */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', borderLeft: '4px solid #e74c3c' }}>
            <ThresholdInput
              label="Orelha Direita (OD)"
              color="#e74c3c"
              thresholds={data.rightEar}
              onChange={(rightEar) => setData({ ...data, rightEar })}
            />
            <SpeechAudiometryInput
              label="Orelha Direita"
              color="#e74c3c"
              data={data.speechRight}
              onChange={(speechRight) => setData({ ...data, speechRight })}
            />
            {ptaRight !== null && (
              <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: 6 }}>
                <Text strong>PTA: {ptaRight} dBHL</Text>{' '}
                <Tag color={gradeRight === 'Normal' ? 'green' : 'orange'}>{gradeRight}</Tag>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', borderLeft: '4px solid #2980b9' }}>
            <ThresholdInput
              label="Orelha Esquerda (OE)"
              color="#2980b9"
              thresholds={data.leftEar}
              onChange={(leftEar) => setData({ ...data, leftEar })}
            />
            <SpeechAudiometryInput
              label="Orelha Esquerda"
              color="#2980b9"
              data={data.speechLeft}
              onChange={(speechLeft) => setData({ ...data, speechLeft })}
            />
            {ptaLeft !== null && (
              <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fafafa', borderRadius: 6 }}>
                <Text strong>PTA: {ptaLeft} dBHL</Text>{' '}
                <Tag color={gradeLeft === 'Normal' ? 'green' : 'orange'}>{gradeLeft}</Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '32px 0' }} />

      {/* Classificação */}
      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <Title level={5}>Classificação Audiológica</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Tipo de Perda</Text>
            <Select
              allowClear
              disabled={isFinalizado}
              placeholder="Selecione o tipo de perda"
              value={data.hearingLossType}
              onChange={(v: HearingLossType | null) => setData({ ...data, hearingLossType: v })}
              options={[
                { label: 'Sem perda auditiva', value: 'Normal' },
                { label: 'Perda auditiva condutiva', value: 'Condutiva' },
                { label: 'Perda auditiva neurossensorial', value: 'Sensorioneural' },
                { label: 'Perda auditiva mista', value: 'Mista' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Grau de Perda</Text>
            <Select
              allowClear
              disabled={isFinalizado}
              placeholder="Selecione o grau de perda"
              value={data.hearingLossGrade}
              onChange={(v: HearingLossGrade | null) => setData({ ...data, hearingLossGrade: v })}
              options={[
                { label: 'Audição normal', value: 'Normal' },
                { label: 'Perda auditiva de grau leve', value: 'Leve' },
                { label: 'Perda auditiva de grau moderado', value: 'Moderada' },
                { label: 'Perda auditiva de grau moderadamente severo', value: 'Moderadamente Severa' },
                { label: 'Perda auditiva de grau severo', value: 'Severa' },
                { label: 'Perda auditiva de grau profundo', value: 'Profunda' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Conclusão */}
      <Card style={{ marginTop: 24, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <Title level={5}>Conclusão Clínica</Title>
        <TextArea
          rows={4}
          disabled={isFinalizado}
          value={data.conclusion}
          onChange={(e) => setData({ ...data, conclusion: e.target.value })}
          placeholder="Digite a conclusão clínica do exame de audiometria..."
          style={{ resize: 'vertical' }}
        />
      </Card>

      {/* Barra de ações */}
      <div
        style={{
          marginTop: 32,
          padding: '16px 24px',
          background: '#fafafa',
          border: '1px solid #eee',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Space>
          <Tooltip title={isFinalizado ? 'Exame finalizado' : 'Salvar como rascunho'}>
            <Button
              icon={<SaveOutlined />}
              onClick={salvar}
              loading={saving}
              disabled={isFinalizado || !cdPaciente}
            >
              Salvar Rascunho
            </Button>
          </Tooltip>

          <Tooltip title={isFinalizado ? 'Exame já finalizado' : 'Finalizar e bloquear edição'}>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={finalizar}
              loading={saving}
              disabled={isFinalizado || !cdPaciente}
              style={!isFinalizado && cdPaciente ? { background: '#10b981', borderColor: '#10b981', color: '#fff' } : {}}
            >
              Finalizar
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={gerarPdf}
            loading={generatingPdf}
            disabled={!idExame}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
          >
            Gerar Laudo PDF
          </Button>
        </Space>
      </div>
    </div>
  )
}

