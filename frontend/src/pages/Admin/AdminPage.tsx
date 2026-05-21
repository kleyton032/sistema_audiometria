import { useState, useEffect, useCallback } from 'react'
import {
  Typography, Tabs, Card, Table, Button, Input, Select, Space, Tag, Badge,
  Modal, Form, Statistic, Row, Col, Tooltip, Popconfirm, message, Alert,
  Descriptions, Divider,
} from 'antd'
import {
  UserOutlined, SafetyOutlined, AuditOutlined, BugOutlined,
  SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined,
  LockOutlined, CheckCircleOutlined, StopOutlined, SettingOutlined,
  TeamOutlined, DatabaseOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  listAdminUsers, getAdminStats, updateUserPerfil, updateUserStatus,
  resetUserPassword, listProfiles, listPermissions, getAuditLogs,
  getAuditedTables, getSystemLogs,
  type AdminUser, type AdminStats, type PerfilPermissao,
  type AuditLog, type SystemLog, type AuditedTable, type Permissao,
} from '@/api/adminService'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

// ─── Constantes ──────────────────────────────────────────────────────────────

const PERFIS = ['ADMIN', 'SUPERVISOR', 'COORDENADOR', 'OPERADOR'] as const

const PERFIL_COLORS: Record<string, string> = {
  ADMIN:       'red',
  SUPERVISOR:  'orange',
  COORDENADOR: 'blue',
  OPERADOR:    'green',
}

const LOG_NIVEL_COLORS: Record<string, string> = {
  ERROR:   'error',
  WARNING: 'warning',
  INFO:    'processing',
}

const OPERACAO_COLORS: Record<string, string> = {
  INSERT: 'success',
  UPDATE: 'processing',
  DELETE: 'error',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return dayjs(d).format('DD/MM/YYYY HH:mm')
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('usuarios')

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <SettingOutlined style={{ marginRight: 8 }} />
        Painel Administrativo
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        items={[
          {
            key: 'usuarios',
            label: (
              <span>
                <TeamOutlined />
                Usuários
              </span>
            ),
            children: <UsersTab />,
          },
          {
            key: 'perfis',
            label: (
              <span>
                <SafetyOutlined />
                Perfis e Permissões
              </span>
            ),
            children: <ProfilesTab />,
          },
          {
            key: 'auditoria',
            label: (
              <span>
                <AuditOutlined />
                Auditoria
              </span>
            ),
            children: <AuditTab />,
          },
          {
            key: 'logs',
            label: (
              <span>
                <BugOutlined />
                Logs do Sistema
              </span>
            ),
            children: <SystemLogsTab />,
          },
        ]}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 1 — USUÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPerfil, setFilterPerfil] = useState<string | undefined>()
  const [filterAtivo, setFilterAtivo] = useState<number | undefined>()

  // Modais
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [senhaOpen, setSenhaOpen] = useState(false)
  const [perfilForm] = Form.useForm()
  const [senhaForm] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([
        listAdminUsers({
          search: search || undefined,
          fl_ativo: filterAtivo,
          ds_perfil: filterPerfil,
        }),
        getAdminStats(),
      ])
      setUsers(u)
      setStats(s)
    } catch {
      message.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [search, filterAtivo, filterPerfil])

  useEffect(() => { load() }, [load])

  async function handleToggleStatus(user: AdminUser) {
    const novoStatus = user.fl_ativo === 1 ? 0 : 1
    try {
      await updateUserStatus(user.id_usuario, novoStatus)
      message.success(novoStatus === 1 ? 'Usuário ativado' : 'Usuário desativado')
      load()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Erro ao alterar status')
    }
  }

  async function handleSavePerfil() {
    if (!selectedUser) return
    try {
      const values = await perfilForm.validateFields()
      await updateUserPerfil(selectedUser.id_usuario, values.ds_perfil)
      message.success('Perfil atualizado com sucesso')
      setPerfilOpen(false)
      load()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.detail || 'Erro ao alterar perfil')
    }
  }

  async function handleResetPassword() {
    if (!selectedUser) return
    try {
      const values = await senhaForm.validateFields()
      await resetUserPassword(selectedUser.id_usuario, values.nova_senha)
      message.success('Senha resetada com sucesso')
      setSenhaOpen(false)
      senhaForm.resetFields()
    } catch (err: any) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.detail || 'Erro ao resetar senha')
    }
  }

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'Usuário',
      key: 'usuario',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.nm_usuario}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.nm_login}</Text>
        </Space>
      ),
    },
    {
      title: 'E-mail',
      dataIndex: 'ds_email',
      ellipsis: true,
    },
    {
      title: 'Especialidade',
      key: 'esp',
      render: (_, r) => r.nm_tip_presta || r.ds_especialidade || '—',
      ellipsis: true,
    },
    {
      title: 'Perfil',
      dataIndex: 'ds_perfil',
      width: 130,
      render: (v: string) => (
        <Tag color={PERFIL_COLORS[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'fl_ativo',
      width: 90,
      render: (v: number) =>
        v === 1
          ? <Badge status="success" text="Ativo" />
          : <Badge status="error" text="Inativo" />,
    },
    {
      title: 'Último acesso',
      dataIndex: 'dt_ultimo_acesso',
      width: 150,
      render: fmtDate,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 160,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Ver detalhes">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => { setSelectedUser(r); setDetailOpen(true) }}
            />
          </Tooltip>
          <Tooltip title="Alterar perfil">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setSelectedUser(r)
                perfilForm.setFieldsValue({ ds_perfil: r.ds_perfil })
                setPerfilOpen(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Resetar senha">
            <Button
              icon={<LockOutlined />}
              size="small"
              onClick={() => { setSelectedUser(r); setSenhaOpen(true) }}
            />
          </Tooltip>
          <Tooltip title={r.fl_ativo === 1 ? 'Desativar' : 'Ativar'}>
            <Popconfirm
              title={r.fl_ativo === 1 ? 'Desativar este usuário?' : 'Ativar este usuário?'}
              onConfirm={() => handleToggleStatus(r)}
              okText="Confirmar"
              cancelText="Cancelar"
            >
              <Button
                icon={r.fl_ativo === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
                size="small"
                danger={r.fl_ativo === 1}
                type={r.fl_ativo === 0 ? 'primary' : 'default'}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <>
      {/* Estatísticas */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total de Usuários" value={stats.total_usuarios} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Usuários Ativos" value={stats.usuarios_ativos} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Usuários Inativos" value={stats.usuarios_inativos} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Sem Perfil" value={stats.sem_perfil} valueStyle={{ color: stats.sem_perfil > 0 ? '#faad14' : undefined }} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtros */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="Buscar por nome, login, e-mail ou especialidade..."
            allowClear
            style={{ width: 360 }}
            onSearch={setSearch}
            onChange={(e) => { if (!e.target.value) setSearch('') }}
          />
          <Select
            placeholder="Perfil"
            allowClear
            style={{ width: 150 }}
            onChange={(v) => setFilterPerfil(v)}
          >
            {PERFIS.map((p) => (
              <Option key={p} value={p}><Tag color={PERFIL_COLORS[p]}>{p}</Tag></Option>
            ))}
          </Select>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            onChange={(v) => setFilterAtivo(v)}
          >
            <Option value={1}><Badge status="success" text="Ativo" /></Option>
            <Option value={0}><Badge status="error" text="Inativo" /></Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={load}>Atualizar</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id_usuario"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 900 }}
      />

      {/* Modal: Detalhes do usuário */}
      <Modal
        title={<><UserOutlined /> Detalhes do Usuário</>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>Fechar</Button>}
        width={600}
      >
        {selectedUser && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="ID" span={1}>{selectedUser.id_usuario}</Descriptions.Item>
            <Descriptions.Item label="Login">{selectedUser.nm_login}</Descriptions.Item>
            <Descriptions.Item label="Nome" span={2}>{selectedUser.nm_usuario}</Descriptions.Item>
            <Descriptions.Item label="E-mail" span={2}>{selectedUser.ds_email}</Descriptions.Item>
            <Descriptions.Item label="Perfil">
              <Tag color={PERFIL_COLORS[selectedUser.ds_perfil] || 'default'}>{selectedUser.ds_perfil}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {selectedUser.fl_ativo === 1
                ? <Badge status="success" text="Ativo" />
                : <Badge status="error" text="Inativo" />}
            </Descriptions.Item>
            <Descriptions.Item label="Criado em">{fmtDate(selectedUser.dt_criacao)}</Descriptions.Item>
            <Descriptions.Item label="Último acesso">{fmtDate(selectedUser.dt_ultimo_acesso)}</Descriptions.Item>
            <Descriptions.Item label="Especialidade" span={2}>{selectedUser.nm_tip_presta || selectedUser.ds_especialidade || '—'}</Descriptions.Item>
            <Descriptions.Item label="Conselho">{selectedUser.ds_conselho || '—'}</Descriptions.Item>
            <Descriptions.Item label="Nº Conselho">{selectedUser.ds_codigo_conselho || selectedUser.nr_conselho || '—'}</Descriptions.Item>
            <Descriptions.Item label="CD Prestador MV" span={2}>{selectedUser.cd_prestador ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal: Alterar perfil */}
      <Modal
        title={<><EditOutlined /> Alterar Perfil</>}
        open={perfilOpen}
        onOk={handleSavePerfil}
        onCancel={() => setPerfilOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
      >
        {selectedUser && (
          <>
            <Text>Usuário: <strong>{selectedUser.nm_usuario}</strong></Text>
            <Divider />
            <Form form={perfilForm} layout="vertical">
              <Form.Item
                name="ds_perfil"
                label="Novo Perfil"
                rules={[{ required: true, message: 'Selecione um perfil' }]}
              >
                <Select>
                  {PERFIS.map((p) => (
                    <Option key={p} value={p}>
                      <Tag color={PERFIL_COLORS[p]}>{p}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal: Resetar senha */}
      <Modal
        title={<><LockOutlined /> Resetar Senha</>}
        open={senhaOpen}
        onOk={handleResetPassword}
        onCancel={() => { setSenhaOpen(false); senhaForm.resetFields() }}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        {selectedUser && (
          <>
            <Alert
              type="warning"
              message={`A senha do usuário "${selectedUser.nm_login}" será alterada imediatamente.`}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={senhaForm} layout="vertical">
              <Form.Item
                name="nova_senha"
                label="Nova senha"
                rules={[
                  { required: true, message: 'Informe a nova senha' },
                  { min: 8, message: 'Mínimo de 8 caracteres' },
                ]}
              >
                <Input.Password placeholder="Mínimo 8 caracteres" />
              </Form.Item>
              <Form.Item
                name="confirmar_senha"
                label="Confirmar senha"
                dependencies={['nova_senha']}
                rules={[
                  { required: true, message: 'Confirme a senha' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('nova_senha') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('As senhas não coincidem'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Repita a senha" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 2 — PERFIS E PERMISSÕES
// ─────────────────────────────────────────────────────────────────────────────

function ProfilesTab() {
  const [profiles, setProfiles] = useState<PerfilPermissao[]>([])
  const [permissions, setPermissions] = useState<Permissao[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([listProfiles(), listPermissions()])
      .then(([p, perm]) => { setProfiles(p); setPermissions(perm) })
      .catch(() => message.error('Erro ao carregar perfis'))
      .finally(() => setLoading(false))
  }, [])

  const modulos = [...new Set(permissions.map((p) => p.ds_modulo))].sort()

  return (
    <div>
      {/* Cards de perfis */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {profiles.map((profile) => (
          <Col key={profile.id_perfil} xs={24} sm={12} md={6}>
            <Card
              size="small"
              title={<Tag color={PERFIL_COLORS[profile.ds_perfil] || 'default'} style={{ fontSize: 14 }}>{profile.ds_perfil}</Tag>}
              loading={loading}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>{profile.ds_descricao || 'Sem descrição'}</Text>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>{profile.permissoes.length}</Text>
              <Text type="secondary"> permissões ativas</Text>
              <div style={{ marginTop: 8 }}>
                {profile.permissoes.slice(0, 5).map((p) => (
                  <Tag key={p} style={{ marginBottom: 4, fontSize: 11 }}>{p}</Tag>
                ))}
                {profile.permissoes.length > 5 && (
                  <Tag style={{ fontSize: 11 }}>+{profile.permissoes.length - 5} mais</Tag>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Matriz de permissões por módulo */}
      {permissions.length > 0 && (
        <>
          <Divider>Matriz de Permissões por Módulo</Divider>
          {modulos.map((mod) => {
            const permsModulo = permissions.filter((p) => p.ds_modulo === mod)
            const columns: ColumnsType<Permissao> = [
              {
                title: 'Permissão',
                dataIndex: 'cd_permissao',
                render: (v, r) => (
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 12 }}>{v}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.ds_permissao}</Text>
                  </Space>
                ),
              },
              { title: 'Tipo', dataIndex: 'ds_tipo', width: 90 },
              ...profiles.map((profile) => ({
                title: <Tag color={PERFIL_COLORS[profile.ds_perfil] || 'default'}>{profile.ds_perfil}</Tag>,
                key: `perfil_${profile.id_perfil}`,
                width: 100,
                align: 'center' as const,
                render: (_: unknown, perm: Permissao) =>
                  profile.permissoes.includes(perm.cd_permissao)
                    ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                    : <Text type="secondary" style={{ fontSize: 16 }}>—</Text>,
              })),
            ]
            return (
              <Card
                key={mod}
                size="small"
                title={<><DatabaseOutlined /> Módulo: {mod}</>}
                style={{ marginBottom: 16 }}
              >
                <Table
                  columns={columns}
                  dataSource={permsModulo}
                  rowKey="id_permissao"
                  size="small"
                  pagination={false}
                />
              </Card>
            )
          })}

          {modulos.length === 0 && (
            <Alert
              type="info"
              message="Nenhuma permissão cadastrada ainda. Execute o script 03_controle_acesso.sql para popular as permissões."
              showIcon
            />
          )}
        </>
      )}

      {permissions.length === 0 && !loading && (
        <Alert
          type="info"
          message="Tabela de permissões vazia ou não encontrada."
          description="Execute o script backend/init-scripts/03_controle_acesso.sql para criar e popular as tabelas de controle de acesso."
          showIcon
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 3 — AUDITORIA
// ─────────────────────────────────────────────────────────────────────────────

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tables, setTables] = useState<AuditedTable[]>([])
  const [loading, setLoading] = useState(false)
  const [filterTabela, setFilterTabela] = useState('')
  const [filterOp, setFilterOp] = useState<string | undefined>()
  const [filterLogin, setFilterLogin] = useState('')
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [l, t] = await Promise.all([
        getAuditLogs({
          tabela: filterTabela || undefined,
          operacao: filterOp,
          nm_login: filterLogin || undefined,
          limit: 200,
        }),
        getAuditedTables(),
      ])
      setLogs(l)
      setTables(t)
    } catch {
      message.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }, [filterTabela, filterOp, filterLogin])

  useEffect(() => { load() }, [load])

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Data/Hora',
      dataIndex: 'dt_operacao',
      width: 160,
      render: fmtDate,
      sorter: (a, b) => a.dt_operacao.localeCompare(b.dt_operacao),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Tabela',
      dataIndex: 'nm_tabela',
      width: 220,
      render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Operação',
      dataIndex: 'tp_operacao',
      width: 100,
      render: (v) => <Badge status={OPERACAO_COLORS[v] as any} text={v} />,
    },
    {
      title: 'Usuário',
      key: 'usuario',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{r.nm_login || '—'}</Text>
          {r.nm_usuario && r.nm_usuario !== r.nm_login && (
            <Text type="secondary" style={{ fontSize: 11 }}>{r.nm_usuario}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'ds_descricao',
      ellipsis: true,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        r.ds_valores_anteriores || r.ds_valores_novos
          ? (
            <Tooltip title="Ver valores">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => setDetailLog(r)}
              />
            </Tooltip>
          )
          : null
      ),
    },
  ]

  return (
    <>
      {/* Tabelas com auditoria */}
      {tables.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}
          title={<><DatabaseOutlined /> Triggers de auditoria ativos ({tables.length})</>}
        >
          <Space wrap>
            {tables.map((t) => (
              <Tag
                key={t.trigger_name}
                color={t.status === 'ENABLED' ? 'success' : 'error'}
              >
                {t.table_name}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* Filtros */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Filtrar por tabela..."
            allowClear
            style={{ width: 220 }}
            value={filterTabela}
            onChange={(e) => setFilterTabela(e.target.value)}
          />
          <Select
            placeholder="Operação"
            allowClear
            style={{ width: 130 }}
            onChange={(v) => setFilterOp(v)}
          >
            {['INSERT', 'UPDATE', 'DELETE'].map((op) => (
              <Option key={op} value={op}><Badge status={OPERACAO_COLORS[op] as any} text={op} /></Option>
            ))}
          </Select>
          <Input
            prefix={<UserOutlined />}
            placeholder="Login do usuário..."
            allowClear
            style={{ width: 200 }}
            value={filterLogin}
            onChange={(e) => setFilterLogin(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>Atualizar</Button>
        </Space>
      </Card>

      {logs.length === 0 && !loading && (
        <Alert
          type="info"
          message="Nenhum log de auditoria encontrado."
          description="A tabela FAV_TB_LOG_AUDITORIA pode não existir ainda. Execute o script backend/init-scripts/10_tabelas_auditoria_logs.sql para criá-la."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id_log"
        loading={loading}
        size="small"
        pagination={{ pageSize: 25, showSizeChanger: true }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={<><AuditOutlined /> Valores da Operação</>}
        open={!!detailLog}
        onCancel={() => setDetailLog(null)}
        footer={<Button onClick={() => setDetailLog(null)}>Fechar</Button>}
        width={640}
      >
        {detailLog && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Tabela"><Text code>{detailLog.nm_tabela}</Text></Descriptions.Item>
            <Descriptions.Item label="Operação"><Badge status={OPERACAO_COLORS[detailLog.tp_operacao] as any} text={detailLog.tp_operacao} /></Descriptions.Item>
            <Descriptions.Item label="Responsável">{detailLog.nm_login || '—'}</Descriptions.Item>
            <Descriptions.Item label="Data/Hora">{fmtDate(detailLog.dt_operacao)}</Descriptions.Item>
            {detailLog.ds_valores_anteriores && (
              <Descriptions.Item label="Antes">
                <Text code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>
                  {detailLog.ds_valores_anteriores}
                </Text>
              </Descriptions.Item>
            )}
            {detailLog.ds_valores_novos && (
              <Descriptions.Item label="Depois">
                <Text code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>
                  {detailLog.ds_valores_novos}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 4 — LOGS DO SISTEMA
// ─────────────────────────────────────────────────────────────────────────────

function SystemLogsTab() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(false)
  const [filterNivel, setFilterNivel] = useState<string | undefined>()
  const [filterModulo, setFilterModulo] = useState('')
  const [detailLog, setDetailLog] = useState<SystemLog | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const l = await getSystemLogs({
        tp_nivel: filterNivel,
        nm_modulo: filterModulo || undefined,
        limit: 200,
      })
      setLogs(l)
    } catch {
      message.error('Erro ao carregar logs do sistema')
    } finally {
      setLoading(false)
    }
  }, [filterNivel, filterModulo])

  useEffect(() => { load() }, [load])

  const columns: ColumnsType<SystemLog> = [
    {
      title: 'Data/Hora',
      dataIndex: 'dt_criacao',
      width: 160,
      render: fmtDate,
      sorter: (a, b) => a.dt_criacao.localeCompare(b.dt_criacao),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Nível',
      dataIndex: 'tp_nivel',
      width: 100,
      render: (v) => <Badge status={LOG_NIVEL_COLORS[v] as any} text={v} />,
    },
    {
      title: 'Módulo',
      dataIndex: 'nm_modulo',
      width: 120,
      render: (v) => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: 'Mensagem',
      dataIndex: 'ds_mensagem',
      ellipsis: true,
    },
    {
      title: 'Usuário',
      dataIndex: 'nm_login',
      width: 130,
      render: (v) => v || '—',
    },
    {
      title: '',
      key: 'detail',
      width: 50,
      render: (_, r) =>
        r.ds_detalhe ? (
          <Tooltip title="Ver detalhes">
            <Button icon={<EyeOutlined />} size="small" onClick={() => setDetailLog(r)} />
          </Tooltip>
        ) : null,
    },
  ]

  const erros = logs.filter((l) => l.tp_nivel === 'ERROR').length
  const warnings = logs.filter((l) => l.tp_nivel === 'WARNING').length

  return (
    <>
      {/* Mini stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Card size="small">
            <Statistic
              title="Erros"
              value={erros}
              valueStyle={{ color: erros > 0 ? '#ff4d4f' : undefined }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col>
          <Card size="small">
            <Statistic
              title="Avisos"
              value={warnings}
              valueStyle={{ color: warnings > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col>
          <Card size="small">
            <Statistic title="Total" value={logs.length} />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Nível"
            allowClear
            style={{ width: 130 }}
            onChange={(v) => setFilterNivel(v)}
          >
            {['ERROR', 'WARNING', 'INFO'].map((n) => (
              <Option key={n} value={n}><Badge status={LOG_NIVEL_COLORS[n] as any} text={n} /></Option>
            ))}
          </Select>
          <Input
            placeholder="Filtrar por módulo..."
            allowClear
            style={{ width: 200 }}
            value={filterModulo}
            onChange={(e) => setFilterModulo(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>Atualizar</Button>
        </Space>
      </Card>

      {logs.length === 0 && !loading && (
        <Alert
          type="info"
          message="Nenhum log do sistema encontrado."
          description="A tabela FAV_TB_LOG_SISTEMA pode não existir ainda. Execute o script backend/init-scripts/10_tabelas_auditoria_logs.sql para criá-la."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id_log"
        loading={loading}
        size="small"
        pagination={{ pageSize: 25, showSizeChanger: true }}
        rowClassName={(r) => r.tp_nivel === 'ERROR' ? 'ant-table-row-error' : ''}
        scroll={{ x: 800 }}
      />

      <Modal
        title={<><BugOutlined /> Detalhes do Log</>}
        open={!!detailLog}
        onCancel={() => setDetailLog(null)}
        footer={<Button onClick={() => setDetailLog(null)}>Fechar</Button>}
        width={680}
      >
        {detailLog && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Nível"><Badge status={LOG_NIVEL_COLORS[detailLog.tp_nivel] as any} text={detailLog.tp_nivel} /></Descriptions.Item>
            <Descriptions.Item label="Módulo">{detailLog.nm_modulo || '—'}</Descriptions.Item>
            <Descriptions.Item label="Data/Hora">{fmtDate(detailLog.dt_criacao)}</Descriptions.Item>
            <Descriptions.Item label="Usuário">{detailLog.nm_login || '—'}</Descriptions.Item>
            <Descriptions.Item label="Mensagem">{detailLog.ds_mensagem}</Descriptions.Item>
            {detailLog.ds_detalhe && (
              <Descriptions.Item label="Detalhe / Stack Trace">
                <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>
                  {detailLog.ds_detalhe}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </>
  )
}
