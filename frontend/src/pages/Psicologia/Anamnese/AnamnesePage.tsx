import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Space, Spin, Alert, Empty, Table, Modal, Drawer } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { listarDocumentosPaciente, criarDocumento, obterAnamnese, atualizarAnamnese } from '@/api'
import type { DocumentoListResponse, AnamneseResponse } from '@/api'

export default function AnamnesePage() {
  const [documentos, setDocumentos] = useState<DocumentoListResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cdPaciente, setCdPaciente] = useState('')
  const [form] = Form.useForm()
  const [anamneseModal, setAnamneseModal] = useState(false)
  const [anamneseData, setAnamneseData] = useState<AnamneseResponse | null>(null)
  const [editingAnamnese, setEditingAnamnese] = useState<AnamneseResponse | null>(null)
  const [editForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const carregarDocumentos = async (paciente: string) => {
    if (!paciente.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const resultado = await listarDocumentosPaciente(paciente, 'ANAMNESE')
      setDocumentos(resultado.documentos)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar documentos')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCriarDocumento = async (values: any) => {
    setSubmitting(true)
    try {
      await criarDocumento({
        cd_paciente: cdPaciente,
        ds_tipo_doc: 'ANAMNESE',
        ds_observacoes: values.ds_observacoes,
      })
      
      form.resetFields()
      await carregarDocumentos(cdPaciente)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar documento')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVisualizarAnamnese = async (doc: DocumentoListResponse) => {
    setLoading(true)
    try {
      const anamnese = await obterAnamnese(doc.id_psicologia_doc)
      setAnamneseData(anamnese)
      setAnamneseModal(true)
    } catch (err: any) {
      setError('Erro ao carregar anamnese')
    } finally {
      setLoading(false)
    }
  }

  const handleEditarAnamnese = (anamnese: AnamneseResponse) => {
    setEditingAnamnese(anamnese)
    editForm.setFieldsValue({
      ds_historia_familiar: anamnese.ds_historia_familiar,
      ds_historia_pessoal: anamnese.ds_historia_pessoal,
      ds_escolaridade: anamnese.ds_escolaridade,
      ds_socioeconomico: anamnese.ds_socioeconomico,
      ds_queixa_principal: anamnese.ds_queixa_principal,
      ds_hipotese_inicial: anamnese.ds_hipotese_inicial,
    })
  }

  const handleSalvarEdicao = async (values: any) => {
    if (!editingAnamnese) return
    
    setSubmitting(true)
    try {
      await atualizarAnamnese(editingAnamnese.id_anamnese, values)
      
      // Recarrega a anamnese
      const anamneseAtualizada = await obterAnamnese(editingAnamnese.id_psicologia_doc)
      setAnamneseData(anamneseAtualizada)
      setEditingAnamnese(null)
      editForm.resetFields()
      
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar anamnese')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: 'Código Paciente',
      dataIndex: 'cd_paciente',
      key: 'cd_paciente',
    },
    {
      title: 'Data de Criação',
      dataIndex: 'dt_criacao',
      key: 'dt_criacao',
      render: (text: string) => new Date(text).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: DocumentoListResponse) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleVisualizarAnamnese(record)}
          >
            Visualizar
          </Button>
          {anamneseData?.id_psicologia_doc === record.id_psicologia_doc && (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditarAnamnese(anamneseData)}
            >
              Editar
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Seção de filtro e criação */}
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

      {error && <Alert message="Erro" description={error} type="error" showIcon closable style={{ marginBottom: '24px' }} />}

      {/* Seção de criação de documento */}
      {cdPaciente && !loading && (
        <Card title="Novo Documento - Anamnese" style={{ marginBottom: '24px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCriarDocumento}
          >
            <Form.Item
              name="ds_observacoes"
              label="Observações Gerais"
            >
              <Input.TextArea
                placeholder="Adicione observações sobre este documento"
                rows={3}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Criar Documento
            </Button>
          </Form>
        </Card>
      )}

      {/* Tabela de documentos */}
      {cdPaciente && (
        <Card title={`Documentos - Anamnese (${documentos.length})`}>
          {documentos.length === 0 && !loading ? (
            <Empty description="Nenhum documento encontrado" />
          ) : (
            <Table
              dataSource={documentos}
              columns={columns}
              loading={loading}
              rowKey="id_psicologia_doc"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      )}

      {/* Modal de visualização/edição */}
      {editingAnamnese ? (
        <Drawer
          title="Editar Anamnese"
          placement="right"
          onClose={() => {
            setEditingAnamnese(null)
            editForm.resetFields()
          }}
          width={600}
          loading={submitting}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleSalvarEdicao}
          >
            <Form.Item
              name="ds_historia_familiar"
              label="História Familiar"
            >
              <Input.TextArea rows={3} placeholder="Descreva a história familiar do paciente" />
            </Form.Item>

            <Form.Item
              name="ds_historia_pessoal"
              label="História Pessoal"
            >
              <Input.TextArea rows={3} placeholder="Dados pessoais e antecedentes" />
            </Form.Item>

            <Form.Item
              name="ds_escolaridade"
              label="Escolaridade"
            >
              <Input placeholder="Nível e desempenho escolar" />
            </Form.Item>

            <Form.Item
              name="ds_socioeconomico"
              label="Dados Socioeconômicos"
            >
              <Input placeholder="Situação sócio-econômica" />
            </Form.Item>

            <Form.Item
              name="ds_queixa_principal"
              label="Queixa Principal"
            >
              <Input.TextArea rows={3} placeholder="Principal motivo da consulta" />
            </Form.Item>

            <Form.Item
              name="ds_hipotese_inicial"
              label="Hipótese Inicial"
            >
              <Input.TextArea rows={3} placeholder="Hipóteses preliminares do psicólogo" />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Salvar Alterações
              </Button>
              <Button onClick={() => {
                setEditingAnamnese(null)
                editForm.resetFields()
              }}>
                Cancelar
              </Button>
            </Space>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title="Visualizar Anamnese"
          open={anamneseModal}
          onCancel={() => setAnamneseModal(false)}
          footer={null}
          width={700}
        >
          {anamneseData ? (
            <div>
              <p><strong>História Familiar:</strong> {anamneseData.ds_historia_familiar || 'N/A'}</p>
              <p><strong>História Pessoal:</strong> {anamneseData.ds_historia_pessoal || 'N/A'}</p>
              <p><strong>Escolaridade:</strong> {anamneseData.ds_escolaridade || 'N/A'}</p>
              <p><strong>Dados Socioeconômicos:</strong> {anamneseData.ds_socioeconomico || 'N/A'}</p>
              <p><strong>Queixa Principal:</strong> {anamneseData.ds_queixa_principal || 'N/A'}</p>
              <p><strong>Hipótese Inicial:</strong> {anamneseData.ds_hipotese_inicial || 'N/A'}</p>
              <p><strong>Data de Criação:</strong> {new Date(anamneseData.dt_criacao).toLocaleDateString('pt-BR')}</p>
            </div>
          ) : (
            <Spin />
          )}
        </Modal>
      )}
    </div>
  )
}
