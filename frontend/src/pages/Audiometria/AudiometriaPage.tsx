import { useState } from 'react'
import { Card, Col, Row, Typography, Input, Divider, Tag, Select } from 'antd'
import AudiogramChart from './AudiogramChart'
import ThresholdInput from './ThresholdInput'
import SpeechAudiometryInput from './SpeechAudiometryInput'
import type { AudiometryData, HearingLossType, HearingLossGrade } from '@/types'
import { calculatePTA, classifyHearingLoss } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input

const emptyThresholds = () => ({
  airConduction: {},
  boneConduction: {},
})

const emptySpeech = () => ({
  srt: null,
  irf: null,
  irfIntensity: null,
})

export default function AudiometriaPage() {
  const [data, setData] = useState<AudiometryData>({
    rightEar: emptyThresholds(),
    leftEar: emptyThresholds(),
    speechRight: emptySpeech(),
    speechLeft: emptySpeech(),
    hearingLossType: null,
    hearingLossGrade: null,
    conclusion: '',
  })

  const ptaRight = calculatePTA(data.rightEar)
  const ptaLeft = calculatePTA(data.leftEar)
  const gradeRight = ptaRight !== null ? classifyHearingLoss(ptaRight) : null
  const gradeLeft = ptaLeft !== null ? classifyHearingLoss(ptaLeft) : null

  return (
    <div style={{ padding: '0 8px' }}>
      <Title level={3}>Audiometria Tonal e Vocal</Title>

      {/* Gráfico do Audiograma */}
      <Card style={{ marginBottom: 32, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <AudiogramChart
          rightEar={data.rightEar}
          leftEar={data.leftEar}
          title="Audiograma"
        />
      </Card>

      {/* Entrada de Limiares e Logoaudiometria */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              borderLeft: '4px solid #e74c3c',
            }}
          >
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
          <Card
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              borderLeft: '4px solid #2980b9',
            }}
          >
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

      {/* Conclusão */}
      <Divider style={{ margin: '32px 0' }} />

      {/* Classificação */}
      <Card
        style={{
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Title level={5}>Classificação Audiológica</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Tipo de Perda
              </Text>
              <Select
                allowClear
                placeholder="Selecione o tipo de perda"
                value={data.hearingLossType}
                onChange={(v: HearingLossType | null) =>
                  setData({ ...data, hearingLossType: v })
                }
                options={[
                  { label: 'Sem perda auditiva', value: 'Normal' },
                  { label: 'Perda auditiva condutiva', value: 'Condutiva' },
                  {
                    label: 'Perda auditiva neurossensorial',
                    value: 'Sensorioneural',
                  },
                  { label: 'Perda auditiva mista', value: 'Mista' },
                ]}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Grau de Perda
              </Text>
              <Select
                allowClear
                placeholder="Selecione o grau de perda"
                value={data.hearingLossGrade}
                onChange={(v: HearingLossGrade | null) =>
                  setData({ ...data, hearingLossGrade: v })
                }
                options={[
                  { label: 'Audição normal', value: 'Normal' },
                  { label: 'Perda auditiva de grau leve', value: 'Leve' },
                  {
                    label: 'Perda auditiva de grau moderado',
                    value: 'Moderada',
                  },
                  {
                    label: 'Perda auditiva de grau moderadamente severo',
                    value: 'Moderadamente Severa',
                  },
                  { label: 'Perda auditiva de grau severo', value: 'Severa' },
                  {
                    label: 'Perda auditiva de grau profundo',
                    value: 'Profunda',
                  },
                ]}
                style={{ width: '100%' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Conclusão */}
      <Card
        style={{
          marginTop: 24,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Title level={5}>Conclusão Clínica</Title>
        <TextArea
          rows={4}
          value={data.conclusion}
          onChange={(e) => setData({ ...data, conclusion: e.target.value })}
          placeholder="Digite a conclusão clínica do exame de audiometria..."
          style={{ resize: 'vertical' }}
        />
      </Card>
    </div>
  )
}
