import { useState } from 'react'
import {
  Button, Card, Col, DatePicker, Form, Input,
  InputNumber, Row, Select, Space, Statistic,
  Table, Tag, Tooltip, Typography, message,
} from 'antd'
import {
  EyeOutlined,
  FilePdfOutlined,
  SearchOutlined,
  ClearOutlined,
  AudioOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  buscarExamesGerencial,
  downloadUltimoLaudo,
  type ExameGerencialItem,
  type ExameGerencialResponse,
} from '@/api/exameService'
import ExameModal, { type TipoExame } from '@/components/ExameModal'

dayjs.locale('pt-br')

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const PAGE_SIZE = 50

function statusTag(ds: string) {
  return ds === 'FINALIZADO'
    ? <Tag color="green">Finalizado</Tag>
    : <Tag color="orange">Rascunho</Tag>
}

function tipoTag(ds: string) {
  return ds === 'AUDIOMETRIA'
    ? <Tag color="blue" icon={<AudioOutlined />}>Audiometria</Tag>
    : <Tag color="purple" icon={<SoundOutlined />}>Imitanciometria</Tag>
}

export default function ConsultaPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [result, setResult] = useState<ExameGerencialResponse | null>(null)
  const [page, setPage] = useState(1)

  // Modal de visualização
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTipo, setModalTipo] = useState<TipoExame | null>(null)
  const [modalPaciente, setModalPaciente] = useState<{ id: number; nome: string | null; atendimento: number | null } | null>(null)

  const handleSearch = async (pg = 1) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const [dtInicio, dtFim] = values.periodo ?? [null, null]
      const res = await buscarExamesGerencial({
        id_paciente:    values.id_paciente    || undefined,
        id_atendimento: values.id_atendimento || undefined,
        nm_paciente:    values.nm_paciente    || undefined,
        ds_tipo:        values.ds_tipo        || undefined,
        dt_inicio:      dtInicio ? dtInicio.format('YYYY-MM-DD') : undefined,
        dt_fim:         dtFim    ? dtFim.format('YYYY-MM-DD')    : undefined,
        skip:           (pg - 1) * PAGE_SIZE,
        limit:          PAGE_SIZE,
      })
      setResult(res)
      setPage(pg)
    } catch {
      message.error('Erro ao buscar exames.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    form.resetFields()
    setResult(null)
    setPage(1)
  }

  const handleView = (row: ExameGerencialItem) => {
    if (!row.id_atendimento) {
      message.warning('Este exame não possui atendimento vinculado para visualização.')
      return
    }
    setModalPaciente({ id: row.id_paciente, nome: row.nm_paciente, atendimento: row.id_atendimento })
    setModalTipo(row.ds_tipo === 'AUDIOMETRIA' ? 'audiometria' : 'imitanciometria')
    setModalOpen(true)
  }

  const handleReprint = async (row: ExameGerencialItem) => {
    setDownloading(row.id_exame)
    try {
      const blob = await downloadUltimoLaudo(row.id_exame)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laudo_exame_${row.id_exame}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      message.error('Erro ao baixar laudo.')
    } finally {
      setDownloading(null)
    }
  }

  const columns: ColumnsType<ExameGerencialItem> = [
    {
      title: 'Exame',
      dataIndex: 'id_exame',
      width: 80,
      render: (v) => <span style={{ color: '#999', fontSize: 12 }}>#{v}</span>,
    },
    {
      title: 'Prontuário',
      dataIndex: 'id_paciente',
      width: 100,
    },
    {
      title: 'Atendimento',
      dataIndex: 'id_atendimento',
      width: 110,
      render: (v) => v ?? '—',
    },
    {
      title: 'Paciente',
      dataIndex: 'nm_paciente',
      ellipsis: true,
      render: (v) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Tipo',
      dataIndex: 'ds_tipo',
      width: 160,
      render: tipoTag,
    },
    {
      title: 'Status',
      dataIndex: 'ds_status',
      width: 110,
      render: statusTag,
    },
    {
      title: 'Data',
      dataIndex: 'dt_exame',
      width: 140,
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.dt_exame).unix() - dayjs(b.dt_exame).unix(),
    },
    {
      title: 'Laudos',
      dataIndex: 'nr_laudos',
      width: 80,
      align: 'center',
      render: (v) =>
        v > 0
          ? <Tag color="green">{v}</Tag>
          : <Tag color="default">0</Tag>,
    },
    {
      title: 'Ações',
      width: 110,
      align: 'center',
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Visualizar exame">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(row)}
              disabled={!row.id_atendimento}
            />
          </Tooltip>
          <Tooltip title={row.nr_laudos > 0 ? 'Reimprimir laudo' : 'Sem laudo gerado'}>
            <Button
              type="text"
              size="small"
              icon={<FilePdfOutlined />}
              loading={downloading === row.id_exame}
              disabled={row.nr_laudos === 0}
              onClick={() => handleReprint(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const totalAudio  = result?.items.filter(i => i.ds_tipo === 'AUDIOMETRIA').length ?? 0
  const totalImitan = result?.items.filter(i => i.ds_tipo === 'IMITANCIOMETRIA').length ?? 0

  return (
    <div>
      <Title level={3}>Consulta de Exames</Title>

      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={() => handleSearch(1)}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={6}>
              <Form.Item name="id_paciente" label="Prontuário">
                <InputNumber style={{ width: '100%' }} placeholder="Código do paciente" min={1} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item name="id_atendimento" label="Atendimento">
                <InputNumber style={{ width: '100%' }} placeholder="Código do atendimento" min={1} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nm_paciente" label="Nome do paciente">
                <Input placeholder="Busca parcial pelo nome" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="ds_tipo" label="Tipo de exame">
                <Select placeholder="Todos" allowClear>
                  <Option value="AUDIOMETRIA">Audiometria</Option>
                  <Option value="IMITANCIOMETRIA">Imitanciometria</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name="periodo" label="Período">
                <RangePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder={['Data inicial', 'Data final']}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  Pesquisar
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClear}>
                  Limpar
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Resumo estatístico */}
      {result && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} size="small">
              <Statistic title="Total encontrado" value={result.total} valueStyle={{ color: '#667eea' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} size="small">
              <Statistic
                title="Audiometrias (página)"
                value={totalAudio}
                prefix={<AudioOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} size="small">
              <Statistic
                title="Imitanciometrias (página)"
                value={totalImitan}
                prefix={<SoundOutlined />}
                valueStyle={{ color: '#764ba2' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabela */}
      {result && (
        <Card bordered={false}>
          <Table<ExameGerencialItem>
            rowKey="id_exame"
            columns={columns}
            dataSource={result.items}
            loading={loading}
            size="small"
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: result.total,
              showTotal: (t) => `${t} registro(s)`,
              onChange: (pg) => handleSearch(pg),
            }}
          />
        </Card>
      )}

      {/* Modal de visualização */}
      <ExameModal
        open={modalOpen}
        tipo={modalTipo}
        nmPaciente={modalPaciente?.nome ?? null}
        cdPaciente={modalPaciente?.id ?? null}
        cdAtendimento={modalPaciente?.atendimento ?? null}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
