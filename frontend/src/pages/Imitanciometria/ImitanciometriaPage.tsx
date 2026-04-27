import { useState, useEffect } from 'react'
import {
  Card, Col, Row, Typography, Input, Divider,
  Button, Space, Alert, Spin, notification, Collapse, Table, Tag,
} from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import {
  SaveOutlined, FilePdfOutlined, CheckCircleOutlined, LoadingOutlined,
} from '@ant-design/icons'

// ── Referência de Jerger ──────────────────────────────────────────────────────

const JERGER_ROWS = [
  { tipo: 'A',         pico: '0,3 a 1,65 ml',  pressao: '0 a -100 daPa',  color: 'green' },
  { tipo: 'As ou Ar',  pico: '< 0,3 ml',        pressao: '0 a -100 daPa',  color: 'blue'  },
  { tipo: 'Ad',        pico: '> 1,65 ml',        pressao: '0 a -100 daPa',  color: 'gold'  },
  { tipo: 'B',         pico: 'Ausência de mobilidade', pressao: 'Não apresenta pico', color: 'red'  },
  { tipo: 'C',         pico: 'Pico deslocado para pressão negativa', pressao: '< -100 daPa', color: 'volcano' },
]

const jergerColumns = [
  {
    title: 'Tipo de Curva',
    dataIndex: 'tipo',
    key: 'tipo',
    width: 110,
    render: (v: string, r: typeof JERGER_ROWS[0]) => (
      <Tag color={r.color} style={{ fontWeight: 600 }}>Tipo {v}</Tag>
    ),
  },
  {
    title: 'Pico / Complacência',
    dataIndex: 'pico',
    key: 'pico',
  },
  {
    title: 'Pressão de Referência',
    dataIndex: 'pressao',
    key: 'pressao',
  },
]

function ReferenciasJerger() {
  return (
    <Collapse
      size="small"
      defaultActiveKey={['1']}
      style={{ marginBottom: 24 }}
      items={[{
        key: '1',
        label: (
          <span>
            <InfoCircleOutlined style={{ marginRight: 8, color: '#667eea' }} />
            Classificação dos Timpanogramas — Jerger, Jerger e Maudin (1972)
          </span>
        ),
        children: (
          <Table
            size="small"
            dataSource={JERGER_ROWS}
            columns={jergerColumns}
            rowKey="tipo"
            pagination={false}
            bordered
          />
        ),
      }]}
    />
  )
}
import TympanogramChart from './TympanogramChart'
import TympanogramInput from './TympanogramInput'
import ReflexTableInput from './ReflexTableInput'
import type { ImmittanceData } from '@/types'
import { createEmptyTympanogram, createEmptyReflexTable } from '@/types'
import type { ResultadoImitanResponse, ExameImitanciometriaCreate } from '@/api/exameService'
import {
  buscarExameImitanPorAtendimento,
  criarExameImitanciometria,
  atualizarExameImitanciometria,
  finalizarExame,
  gerarLaudoPdf,
} from '@/api/exameService'

const { Title } = Typography
const { TextArea } = Input

// ── Conversão resultado → state ───────────────────────────────────────────────

function resultadoToData(r: ResultadoImitanResponse): ImmittanceData {
  const makeReflex = (
    ipsi500: number | null | undefined,
    ipsi1000: number | null | undefined,
    ipsi2000: number | null | undefined,
    ipsi4000: number | null | undefined,
    contra500: number | null | undefined,
    contra1000: number | null | undefined,
    contra2000: number | null | undefined,
    contra4000: number | null | undefined,
  ) => ({
    500:  { ipsilateral: { present: ipsi500  != null, threshold: ipsi500  ?? null }, contralateral: { present: contra500  != null, threshold: contra500  ?? null } },
    1000: { ipsilateral: { present: ipsi1000 != null, threshold: ipsi1000 ?? null }, contralateral: { present: contra1000 != null, threshold: contra1000 ?? null } },
    2000: { ipsilateral: { present: ipsi2000 != null, threshold: ipsi2000 ?? null }, contralateral: { present: contra2000 != null, threshold: contra2000 ?? null } },
    4000: { ipsilateral: { present: ipsi4000 != null, threshold: ipsi4000 ?? null }, contralateral: { present: contra4000 != null, threshold: contra4000 ?? null } },
  })

  return {
    rightEar: {
      type: (r.od_tipo_curva as ImmittanceData['rightEar']['type']) ?? null,
      staticCompliance: r.od_pico ?? null,
      earCanalVolume: r.od_ecv ?? null,
      peakPressure: r.od_pressao ?? null,
      gradient: r.od_gradiante ?? null,
      curve: [],
    },
    leftEar: {
      type: (r.oe_tipo_curva as ImmittanceData['leftEar']['type']) ?? null,
      staticCompliance: r.oe_pico ?? null,
      earCanalVolume: r.oe_ecv ?? null,
      peakPressure: r.oe_pressao ?? null,
      gradient: r.oe_gradiante ?? null,
      curve: [],
    },
    rightReflexes: makeReflex(
      r.od_ipsi_500, r.od_ipsi_1000, r.od_ipsi_2000, r.od_ipsi_4000,
      r.od_contra_500, r.od_contra_1000, r.od_contra_2000, r.od_contra_4000,
    ),
    leftReflexes: makeReflex(
      r.oe_ipsi_500, r.oe_ipsi_1000, r.oe_ipsi_2000, r.oe_ipsi_4000,
      r.oe_contra_500, r.oe_contra_1000, r.oe_contra_2000, r.oe_contra_4000,
    ),
    conclusion: r.ds_conclusao ?? '',
  }
}

function dataToPayload(
  data: ImmittanceData,
  cdPaciente: number,
  cdAtendimento: number | null,
): ExameImitanciometriaCreate {
  const rr = data.rightReflexes
  const lr = data.leftReflexes
  return {
    id_paciente:    cdPaciente,
    id_atendimento: cdAtendimento,
    od_ecv:         data.rightEar.earCanalVolume,
    od_pico:        data.rightEar.staticCompliance,
    od_pressao:     data.rightEar.peakPressure,
    od_gradiante:   data.rightEar.gradient,
    od_tipo_curva:  data.rightEar.type,
    oe_ecv:         data.leftEar.earCanalVolume,
    oe_pico:        data.leftEar.staticCompliance,
    oe_pressao:     data.leftEar.peakPressure,
    oe_gradiante:   data.leftEar.gradient,
    oe_tipo_curva:  data.leftEar.type,
    od_ipsi_500:    rr[500].ipsilateral.present  ? rr[500].ipsilateral.threshold   : null,
    od_ipsi_1000:   rr[1000].ipsilateral.present ? rr[1000].ipsilateral.threshold  : null,
    od_ipsi_2000:   rr[2000].ipsilateral.present ? rr[2000].ipsilateral.threshold  : null,
    od_ipsi_4000:   rr[4000].ipsilateral.present ? rr[4000].ipsilateral.threshold  : null,
    od_contra_500:  rr[500].contralateral.present  ? rr[500].contralateral.threshold   : null,
    od_contra_1000: rr[1000].contralateral.present ? rr[1000].contralateral.threshold  : null,
    od_contra_2000: rr[2000].contralateral.present ? rr[2000].contralateral.threshold  : null,
    od_contra_4000: rr[4000].contralateral.present ? rr[4000].contralateral.threshold  : null,
    oe_ipsi_500:    lr[500].ipsilateral.present  ? lr[500].ipsilateral.threshold   : null,
    oe_ipsi_1000:   lr[1000].ipsilateral.present ? lr[1000].ipsilateral.threshold  : null,
    oe_ipsi_2000:   lr[2000].ipsilateral.present ? lr[2000].ipsilateral.threshold  : null,
    oe_ipsi_4000:   lr[4000].ipsilateral.present ? lr[4000].ipsilateral.threshold  : null,
    oe_contra_500:  lr[500].contralateral.present  ? lr[500].contralateral.threshold   : null,
    oe_contra_1000: lr[1000].contralateral.present ? lr[1000].contralateral.threshold  : null,
    oe_contra_2000: lr[2000].contralateral.present ? lr[2000].contralateral.threshold  : null,
    oe_contra_4000: lr[4000].contralateral.present ? lr[4000].contralateral.threshold  : null,
    ds_conclusao:   data.conclusion || null,
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

interface ImitanciometriaPageProps {
  cdPaciente?: number | null
  cdAtendimento?: number | null
}

export default function ImitanciometriaPage({ cdPaciente, cdAtendimento }: ImitanciometriaPageProps) {
  const [data, setData] = useState<ImmittanceData>({
    rightEar: createEmptyTympanogram(),
    leftEar: createEmptyTympanogram(),
    rightReflexes: createEmptyReflexTable(),
    leftReflexes: createEmptyReflexTable(),
    conclusion: '',
  })
  const [idExame, setIdExame] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const isFinalizado = status === 'FINALIZADO'

  // Carrega exame existente ao abrir
  useEffect(() => {
    if (!cdAtendimento) return
    setLoading(true)
    buscarExameImitanPorAtendimento(cdAtendimento)
      .then((exame) => {
        if (exame?.resultado_imitan) {
          setData(resultadoToData(exame.resultado_imitan as ResultadoImitanResponse))
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
      const payload = dataToPayload(data, cdPaciente, cdAtendimento ?? null)
      let exame
      if (idExame) {
        exame = await atualizarExameImitanciometria(idExame, payload)
      } else {
        exame = await criarExameImitanciometria(payload)
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
      a.download = `laudo_imitanciometria_${idExame}.pdf`
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

      {/* Referências de Jerger */}
      <ReferenciasJerger />

      {/* Gráfico do Timpanograma */}
      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <TympanogramChart
          rightEar={data.rightEar}
          leftEar={data.leftEar}
          title="Timpanograma"
        />
      </Card>

      {/* Dados do Timpanograma */}
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #e74c3c' }}>
            <TympanogramInput
              label="Orelha Direita (OD)"
              color="#e74c3c"
              data={data.rightEar}
              onChange={(rightEar) => setData({ ...data, rightEar })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #2980b9' }}>
            <TympanogramInput
              label="Orelha Esquerda (OE)"
              color="#2980b9"
              data={data.leftEar}
              onChange={(leftEar) => setData({ ...data, leftEar })}
            />
          </Card>
        </Col>
      </Row>

      {/* Reflexos Estapedianos */}
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #e74c3c' }}>
            <ReflexTableInput
              label="Orelha Direita (OD)"
              color="#e74c3c"
              reflexes={data.rightReflexes}
              onChange={(rightReflexes) => setData({ ...data, rightReflexes })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #2980b9' }}>
            <ReflexTableInput
              label="Orelha Esquerda (OE)"
              color="#2980b9"
              reflexes={data.leftReflexes}
              onChange={(leftReflexes) => setData({ ...data, leftReflexes })}
            />
          </Card>
        </Col>
      </Row>

      {/* Conclusão */}
      <Divider style={{ margin: '16px 0' }} />
      <Card style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={5}>Conclusão Clínica</Title>
        <TextArea
          rows={4}
          disabled={isFinalizado}
          value={data.conclusion}
          onChange={(e) => setData({ ...data, conclusion: e.target.value })}
          placeholder="Digite a conclusão clínica do exame de imitanciometria..."
        />
      </Card>

      {/* Ações */}
      <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={isFinalizado || !cdPaciente}
            onClick={salvar}
          >
            Salvar Rascunho
          </Button>
          <Button
            type="default"
            icon={<CheckCircleOutlined />}
            loading={saving}
            disabled={isFinalizado || !cdPaciente}
            onClick={finalizar}
          >
            Finalizar Exame
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            loading={generatingPdf}
            disabled={!idExame}
            onClick={gerarPdf}
          >
            Gerar Laudo PDF
          </Button>
        </Space>
      </Card>
    </div>
  )
}
