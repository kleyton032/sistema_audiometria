import { useState } from 'react'
import { Card, Col, Row, Typography, Input, Divider, Tag } from 'antd'
import AudiogramChart from './AudiogramChart'
import ThresholdInput from './ThresholdInput'
import SpeechAudiometryInput from './SpeechAudiometryInput'
import type { AudiometryData } from '@/types'
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
    conclusion: '',
  })

  const ptaRight = calculatePTA(data.rightEar)
  const ptaLeft = calculatePTA(data.leftEar)
  const gradeRight = ptaRight !== null ? classifyHearingLoss(ptaRight) : null
  const gradeLeft = ptaLeft !== null ? classifyHearingLoss(ptaLeft) : null

  return (
    <div>
      <Title level={3}>Audiometria Tonal e Vocal</Title>

      {/* Gráfico do Audiograma */}
      <Card style={{ marginBottom: 24 }}>
        <AudiogramChart
          rightEar={data.rightEar}
          leftEar={data.leftEar}
          title="Audiograma"
        />
      </Card>

      {/* Entrada de Limiares */}
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card>
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
              <div style={{ marginTop: 8 }}>
                <Text strong>PTA: {ptaRight} dBHL</Text>{' '}
                <Tag color={gradeRight === 'Normal' ? 'green' : 'orange'}>{gradeRight}</Tag>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
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
              <div style={{ marginTop: 8 }}>
                <Text strong>PTA: {ptaLeft} dBHL</Text>{' '}
                <Tag color={gradeLeft === 'Normal' ? 'green' : 'orange'}>{gradeLeft}</Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Conclusão */}
      <Divider />
      <Card>
        <Title level={5}>Conclusão Clínica</Title>
        <TextArea
          rows={4}
          value={data.conclusion}
          onChange={(e) => setData({ ...data, conclusion: e.target.value })}
          placeholder="Digite a conclusão clínica do exame de audiometria..."
        />
      </Card>
    </div>
  )
}
