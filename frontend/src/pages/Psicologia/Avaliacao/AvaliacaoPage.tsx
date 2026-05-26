import { useState } from 'react'
import { Card, Form, Input, Button, Space, DatePicker, InputNumber, Table, Empty, Alert, Drawer, Tag } from 'antd'
import { EditOutlined, CheckOutlined } from '@ant-design/icons'
import { listarDocumentosPaciente, criarAvaliacao, obterAvaliacao, atualizarAvaliacao, finalizarAvaliacao, assinarAvaliacao } from '@/api'
import type { DocumentoListResponse, AvaliacaoResponse } from '@/api'
import dayjs from 'dayjs'

export default function AvaliacaoPage() {
  const [documentos, setDocumentos] = useState<DocumentoListResponse[]>([])
  const [avaliacao, setAvaliacao] = useState<AvaliacaoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cdPaciente, setCdPaciente] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<DocumentoListResponse | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const carregarDocumentos = async (paciente: string) => {
    if (!paciente.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const resultado = await listarDocumentosPaciente(paciente, 'AVALIACAO')
      setDocumentos(resultado.documentos)
      
      if (resultado.documentos.length > 0) {
        await carregarAvaliacao(resultado.documentos[0].id_psicologia_doc)
        setSelectedDoc(resultado.documentos[0])
      } else {
        setAvaliacao(null)
        setSelectedDoc(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar documentos')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  const carregarAvaliacao = async (id_doc: number) => {
    try {
      const resultado = await obterAvaliacao(id_doc)
      setAvaliacao(resultado)
    } catch (err: any) {
      setAvaliacao(null)
    }
  }

  const handleSelecionarDocumento = (doc: DocumentoListResponse) => {
    setSelectedDoc(doc)
    carregarAvaliacao(doc.id_psicologia_doc)
  }

  const handleCriarAvaliacao = async (values: any) => {
    if (!selectedDoc) return
    
    setSubmitting(true)
    try {
      await criarAvaliacao(selectedDoc.id_psicologia_doc, {
        ds_tipo_teste: values.ds_tipo_teste,
        ds_resultado: values.ds_resultado,
        nr_escore: values.nr_escore,
        ds_interpretacao: values.ds_interpretacao,
        ds_recomendacoes: values.ds_recomendacoes,
        dt_realizacao: values.dt_realizacao.toISOString(),
      })
      
      form.resetFields()
      await carregarAvaliacao(selectedDoc.id_psicologia_doc)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditarAvaliacao = () => {
    if (!avaliacao) return
    
    editForm.setFieldsValue({
      ds_resultado: avaliacao.ds_resultado,
      nr_escore: avaliacao.nr_escore,
      ds_interpretacao: avaliacao.ds_interpretacao,
      ds_recomendacoes: avaliacao.ds_recomendacoes,
    })
    setDrawerVisible(true)
  }

  const handleSalvarEdicao = async (values: any) => {
    if (!avaliacao) return
    
    setSubmitting(true)
    try {
      await atualizarAvaliacao(avaliacao.id_avaliacao, {
        ds_resultado: values.ds_resultado,
        nr_escore: values.nr_escore,
        ds_interpretacao: values.ds_interpretacao,
        ds_recomendacoes: values.ds_recomendacoes,
      })
      
      if (selectedDoc) {
        await carregarAvaliacao(selectedDoc.id_psicologia_doc)
      }
      setDrawerVisible(false)
      editForm.resetFields()
      
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinalizarAvaliacao = async () => {
    if (!avaliacao || !selectedDoc) return
    if (!window.confirm('Deseja finalizar esta avaliação?')) return
    
    setSubmitting(true)
    try {
      await finalizarAvaliacao(avaliacao.id_avaliacao)
      await carregarAvaliacao(selectedDoc.id_psicologia_doc)
      setError(null)
    } catch (err: any) {
      setError('Erro ao finalizar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssinarAvaliacao = async () => {
    if (!avaliacao || !selectedDoc) return
    if (!window.confirm('Deseja assinar esta avaliação? Esta ação não poderá ser desfeita.')) return
    
    setSubmitting(true)
    try {
      await assinarAvaliacao(avaliacao.id_avaliacao)
      await carregarAvaliacao(selectedDoc.id_psicologia_doc)
      setError(null)
    } catch (err: any) {
      setError('Erro ao assinar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return 'orange'
      case 'FINALIZADO':
        return 'blue'
      case 'ASSINADO':
        return 'green'
      default:
        return 'default'
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          {/* Se não tiver avaliação, mostrar formulário de criação */}
          {!avaliacao ? (
            <Card title="Criar Nova Avaliação" style={{ marginBottom: '24px' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCriarAvaliacao}
              >
                <Form.Item
                  name="ds_tipo_teste"
                  label="Tipo de Teste"
                  rules={[{ required: true, message: 'Selecione um tipo de teste' }]}
                >
                  <Input placeholder="Ex: WISC, WAIS, RORSCHACH" />
                </Form.Item>

                <Form.Item
                  name="dt_realizacao"
                  label="Data de Realização"
                  rules={[{ required: true, message: 'Selecione a data' }]}
                >
                  <DatePicker showTime format="DD/MM/YYYY HH:mm" />
                </Form.Item>

                <Form.Item
                  name="ds_resultado"
                  label="Resultado"
                >
                  <Input.TextArea rows={3} placeholder="Descreva os resultados obtidos" />
                </Form.Item>

                <Form.Item
                  name="nr_escore"
                  label="Escore / Pontuação"
                >
                  <InputNumber placeholder="Valor numérico do escore" precision={2} />
                </Form.Item>

                <Form.Item
                  name="ds_interpretacao"
                  label="Interpretação"
                >
                  <Input.TextArea rows={3} placeholder="Interpretação dos resultados" />
                </Form.Item>

                <Form.Item
                  name="ds_recomendacoes"
                  label="Recomendações"
                >
                  <Input.TextArea rows={3} placeholder="Recomendações e condutas subsequentes" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={submitting}>
                  Criar Avaliação
                </Button>
              </Form>
            </Card>
          ) : (
            /* Se tiver avaliação, mostrar os dados */
            <Card
              title={`Avaliação - ${avaliacao.ds_tipo_teste}`}
              style={{ marginBottom: '24px' }}
              extra={<Tag color={getStatusColor(avaliacao.ds_status)}>{avaliacao.ds_status}</Tag>}
            >
              <div style={{ marginBottom: '24px' }}>
                <p><strong>Tipo de Teste:</strong> {avaliacao.ds_tipo_teste}</p>
                <p><strong>Data de Realização:</strong> {new Date(avaliacao.dt_realizacao).toLocaleDateString('pt-BR')}</p>
                <p><strong>Escore/Pontuação:</strong> {avaliacao.nr_escore || 'N/A'}</p>
                <p><strong>Resultado:</strong> {avaliacao.ds_resultado || 'N/A'}</p>
                <p><strong>Interpretação:</strong> {avaliacao.ds_interpretacao || 'N/A'}</p>
                <p><strong>Recomendações:</strong> {avaliacao.ds_recomendacoes || 'N/A'}</p>
                <p><strong>Data de Criação:</strong> {new Date(avaliacao.dt_criacao).toLocaleDateString('pt-BR')}</p>
              </div>

              <Space>
                {avaliacao.ds_status === 'RASCUNHO' && (
                  <>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={handleEditarAvaliacao}
                    >
                      Editar
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleFinalizarAvaliacao}
                      loading={submitting}
                    >
                      Finalizar
                    </Button>
                  </>
                )}

                {avaliacao.ds_status === 'FINALIZADO' && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleAssinarAvaliacao}
                    loading={submitting}
                  >
                    Assinar
                  </Button>
                )}

                {avaliacao.ds_status === 'ASSINADO' && (
                  <Tag color="green">Avaliação Assinada e Finalizada</Tag>
                )}
              </Space>
            </Card>
          )}
        </>
      )}

      {cdPaciente && documentos.length === 0 && !loading && (
        <Card>
          <Empty description="Nenhum documento de Avaliação encontrado para este paciente" />
        </Card>
      )}

      {/* Drawer de edição */}
      <Drawer
        title="Editar Avaliação"
        placement="right"
        onClose={() => {
          setDrawerVisible(false)
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
            name="ds_resultado"
            label="Resultado"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="nr_escore"
            label="Escore / Pontuação"
          >
            <InputNumber precision={2} />
          </Form.Item>

          <Form.Item
            name="ds_interpretacao"
            label="Interpretação"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="ds_recomendacoes"
            label="Recomendações"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Salvar Alterações
            </Button>
            <Button onClick={() => {
              setDrawerVisible(false)
              editForm.resetFields()
            }}>
              Cancelar
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
