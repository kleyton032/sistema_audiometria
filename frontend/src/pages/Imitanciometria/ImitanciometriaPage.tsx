import { useState } from 'react'
import { Card, Col, Row, Typography, Input, Divider } from 'antd'
import TympanogramChart from './TympanogramChart'
import TympanogramInput from './TympanogramInput'
import ReflexTableInput from './ReflexTableInput'
import type { ImmittanceData } from '@/types'
import { createEmptyTympanogram, createEmptyReflexTable } from '@/types'

const { Title } = Typography
const { TextArea } = Input

export default function ImitanciometriaPage() {
  const [data, setData] = useState<ImmittanceData>({
    rightEar: createEmptyTympanogram(),
    leftEar: createEmptyTympanogram(),
    rightReflexes: createEmptyReflexTable(),
    leftReflexes: createEmptyReflexTable(),
    conclusion: '',
  })

  return (
    <div>
      <Title level={3}>Imitanciometria</Title>

      {/* Gráfico do Timpanograma */}
      <Card style={{ marginBottom: 24 }}>
        <TympanogramChart
          rightEar={data.rightEar}
          leftEar={data.leftEar}
          title="Timpanograma"
        />
      </Card>

      {/* Dados do Timpanograma */}
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24 }}>
            <TympanogramInput
              label="Orelha Direita (OD)"
              color="#e74c3c"
              data={data.rightEar}
              onChange={(rightEar) => setData({ ...data, rightEar })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24 }}>
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
          <Card style={{ marginBottom: 24 }}>
            <ReflexTableInput
              label="Orelha Direita (OD)"
              color="#e74c3c"
              reflexes={data.rightReflexes}
              onChange={(rightReflexes) => setData({ ...data, rightReflexes })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ marginBottom: 24 }}>
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
      <Divider />
      <Card>
        <Title level={5}>Conclusão Clínica</Title>
        <TextArea
          rows={4}
          value={data.conclusion}
          onChange={(e) => setData({ ...data, conclusion: e.target.value })}
          placeholder="Digite a conclusão clínica do exame de imitanciometria..."
        />
      </Card>
    </div>
  )
}
