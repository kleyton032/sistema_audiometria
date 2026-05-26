import { useState } from 'react'
import { Card, Form, Input, Button, Space, DatePicker, Table, Empty, Alert, Drawer } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { listarDocumentosPaciente, criarEvolucao, listarEvolucoes, atualizarEvolucao, deletarEvolucao } from '@/api'
import type { DocumentoListResponse, EvolucaoResponse } from '@/api'
import dayjs from 'dayjs'

export default function EvolucaoPage() {
  const [documentos, setDocumentos] = useState<DocumentoListResponse[]>([])
  const [evolucoes, setEvolucoes] = useState<EvolucaoResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cdPaciente, setCdPaciente] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<DocumentoListResponse | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingEvolucao, setEditingEvolucao] = useState<EvolucaoResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const carregarDocumentos = async (paciente: string) => {
    if (!paciente.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const resultado = await listarDocumentosPaciente(paciente, 'EVOLUCAO')
      setDocumentos(resultado.documentos)
      
      if (resultado.documentos.length > 0) {
        await carregarEvolucoes(resultado.documentos[0].id_psicologia_doc)
        setSelectedDoc(resultado.documentos[0])
      } else {
        setEvolucoes([])
        setSelectedDoc(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar documentos')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  const carregarEvolucoes = async (id_doc: number) => {
    try {
      const resultado = await listarEvolucoes(id_doc)
      setEvolucoes(resultado)
    } catch (err: any) {
      setError('Erro ao carregar evoluções')
    }
  }

  const handleSelecionarDocumento = (doc: DocumentoListResponse) => {
    setSelectedDoc(doc)
    carregarEvolucoes(doc.id_psicologia_doc)
  }

  const handleCriarEvolucao = async (values: any) => {
    if (!selectedDoc) return
    
    setSubmitting(true)
    try {
      await criarEvolucao(selectedDoc.id_psicologia_doc, {
        nr_atendimento: values.nr_atendimento,
        ds_data_atendimento: values.ds_data_atendimento.toISOString(),
        ds_observacoes: values.ds_observacoes,
        ds_objetivos_sessao: values.ds_objetivos_sessao,
        ds_intervencoes: values.ds_intervencoes,
        ds_proximos_passos: values.ds_proximos_passos,
      })
      
      form.resetFields()
      await carregarEvolucoes(selectedDoc.id_psicologia_doc)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar evolução')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditarEvolucao = (evolucao: EvolucaoResponse) => {
    setEditingEvolucao(evolucao)
    editForm.setFieldsValue({
      nr_atendimento: evolucao.nr_atendimento,
      ds_data_atendimento: dayjs(evolucao.ds_data_atendimento),
      ds_observacoes: evolucao.ds_observacoes,
      ds_objetivos_sessao: evolucao.ds_objetivos_sessao,
      ds_intervencoes: evolucao.ds_intervencoes,
      ds_proximos_passos: evolucao.ds_proximos_passos,
    })
    setDrawerVisible(true)
  }

  const handleSalvarEdicao = async (values: any) => {
    if (!editingEvolucao || !selectedDoc) return
    
    setSubmitting(true)
    try {
      await atualizarEvolucao(editingEvolucao.id_evolucao, {
        nr_atendimento: values.nr_atendimento,
        ds_data_atendimento: values.ds_data_atendimento.toISOString(),
        ds_observacoes: values.ds_observacoes,
        ds_objetivos_sessao: values.ds_objetivos_sessao,
        ds_intervencoes: values.ds_intervencoes,
        ds_proximos_passos: values.ds_proximos_passos,
      })
      
      await carregarEvolucoes(selectedDoc.id_psicologia_doc)
      setDrawerVisible(false)
      setEditingEvolucao(null)
      editForm.resetFields()
      
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar evolução')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletarEvolucao = async (id: number) => {
    if (!selectedDoc || !window.confirm('Deseja deletar esta evolução?')) return
    
    try {
      await deletarEvolucao(id)
      await carregarEvolucoes(selectedDoc.id_psicologia_doc)
    } catch (err: any) {
      setError('Erro ao deletar evolução')
    }
  }

  const columns = [
    {
      title: 'Data do Atendimento',
      dataIndex: 'ds_data_atendimento',
      key: 'ds_data_atendimento',
      render: (text: string) => new Date(text).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Nº Atendimento',
      dataIndex: 'nr_atendimento',
      key: 'nr_atendimento',
    },
    {
      title: 'Observações',
      dataIndex: 'ds_observacoes',
      key: 'ds_observacoes',
      render: (text: string) => (text ? text.substring(0, 50) + '...' : 'N/A'),
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: EvolucaoResponse) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditarEvolucao(record)}
          >
            Editar
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeletarEvolucao(record.id_evolucao)}
          >
            Deletar
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {error && <Alert message="Erro" description={error} type="error" showIcon closable style={{ marginBottom: '24px' }} />}

      {/* Seção de filtro */}
      <Card title="Buscar Paciente" style={{ marginBottom: '24px' }}>
        <Form layout="vertical" onFinish={() => carregarDocumentos(cdPaciente)}>
          <Form.Item label="Código do Paciente">
            <Input
              placeholder="Digite o código do paciente"
              value={cdPaciente}
              onChange={(e) => setCdPaciente(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Buscar
          </Button>
        </Form>
      </Card>

      {cdPaciente && documentos.length > 0 && (
        <>
          {/* Seção de criação de evolução */}
          <Card title="Nova Evolução" style={{ marginBottom: '24px' }} extra={<PlusOutlined />}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCriarEvolucao}
            >
              <Form.Item
                name="ds_data_atendimento"
                label="Data do Atendimento"
                rules={[{ required: true, message: 'Selecione a data' }]}
              >
                <DatePicker showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>

              <Form.Item
                name="nr_atendimento"
                label="Número do Atendimento"
              >
                <Input placeholder="Ref. de atendimento (opcional)" />
              </Form.Item>

              <Form.Item
                name="ds_observacoes"
                label="Observações"
              >
                <Input.TextArea rows={3} placeholder="Observações gerais" />
              </Form.Item>

              <Form.Item
                name="ds_objetivos_sessao"
                label="Objetivos da Sessão"
              >
                <Input.TextArea rows={2} placeholder="Objetivos estabelecidos" />
              </Form.Item>

              <Form.Item
                name="ds_intervencoes"
                label="Intervenções Realizadas"
              >
                <Input.TextArea rows={3} placeholder="Descreva as intervenções" />
              </Form.Item>

              <Form.Item
                name="ds_proximos_passos"
                label="Próximos Passos"
              >
                <Input.TextArea rows={2} placeholder="Próximas ações planejadas" />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={submitting}>
                Criar Evolução
              </Button>
            </Form>
          </Card>

          {/* Tabela de evoluções */}
          <Card title={`Evoluções (${evolucoes.length})`}>
            {evolucoes.length === 0 && !loading ? (
              <Empty description="Nenhuma evolução registrada" />
            ) : (
              <Table
                dataSource={evolucoes}
                columns={columns}
                loading={loading}
                rowKey="id_evolucao"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>
        </>
      )}

      {cdPaciente && documentos.length === 0 && !loading && (
        <Card>
          <Empty description="Nenhum documento de Evolução encontrado para este paciente" />
        </Card>
      )}

      {/* Drawer de edição */}
      <Drawer
        title="Editar Evolução"
        placement="right"
        onClose={() => {
          setDrawerVisible(false)
          setEditingEvolucao(null)
          editForm.resetFields()
        }}
        open={drawerVisible}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSalvarEdicao}
        >
          <Form.Item
            name="ds_data_atendimento"
            label="Data do Atendimento"
            rules={[{ required: true }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>

          <Form.Item
            name="nr_atendimento"
            label="Número do Atendimento"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="ds_observacoes"
            label="Observações"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="ds_objetivos_sessao"
            label="Objetivos da Sessão"
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="ds_intervencoes"
            label="Intervenções Realizadas"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="ds_proximos_passos"
            label="Próximos Passos"
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Salvar Alterações
            </Button>
            <Button onClick={() => {
              setDrawerVisible(false)
              setEditingEvolucao(null)
            }}>
              Cancelar
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
