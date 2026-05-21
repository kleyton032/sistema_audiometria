import api from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id_usuario: number
  cd_usuario_mv: string | null
  nm_login: string
  nm_usuario: string
  ds_email: string
  ds_perfil: string
  id_perfil: number | null
  fl_ativo: number
  dt_criacao: string | null
  dt_ultimo_acesso: string | null
  cd_prestador: number | null
  nm_tip_presta: string | null
  ds_conselho: string | null
  ds_codigo_conselho: string | null
  ds_especialidade: string | null
  nr_conselho: string | null
}

export interface PerfilPermissao {
  id_perfil: number
  ds_perfil: string
  ds_descricao: string | null
  permissoes: string[]
}

export interface Permissao {
  id_permissao: number
  cd_permissao: string
  ds_permissao: string
  ds_modulo: string
  ds_tipo: string
  fl_ativo: number
}

export interface AuditLog {
  id_log: number
  nm_tabela: string
  tp_operacao: string
  nm_login: string | null
  nm_usuario: string | null
  dt_operacao: string
  ds_descricao: string | null
  ds_valores_anteriores: string | null
  ds_valores_novos: string | null
}

export interface SystemLog {
  id_log: number
  tp_nivel: string
  nm_modulo: string | null
  ds_mensagem: string
  ds_detalhe: string | null
  nm_login: string | null
  dt_criacao: string
}

export interface AuditedTable {
  table_name: string
  trigger_name: string
  trigger_type: string
  events: string
  status: string
}

export interface AdminStats {
  total_usuarios: number
  usuarios_ativos: number
  usuarios_inativos: number
  sem_perfil: number
  por_perfil: Record<string, number>
  logs_hoje: number
  erros_hoje: number
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

export async function listAdminUsers(params?: {
  search?: string
  fl_ativo?: number
  ds_perfil?: string
}): Promise<AdminUser[]> {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function getAdminUser(id: number): Promise<AdminUser> {
  const { data } = await api.get(`/admin/users/${id}`)
  return data
}

export async function updateUserPerfil(id: number, ds_perfil: string): Promise<AdminUser> {
  const { data } = await api.patch(`/admin/users/${id}/perfil`, { ds_perfil })
  return data
}

export async function updateUserStatus(id: number, fl_ativo: number): Promise<AdminUser> {
  const { data } = await api.patch(`/admin/users/${id}/status`, { fl_ativo })
  return data
}

export async function resetUserPassword(id: number, nova_senha: string): Promise<{ detail: string }> {
  const { data } = await api.post(`/admin/users/${id}/reset-password`, { nova_senha })
  return data
}

// ─── Perfis e Permissões ──────────────────────────────────────────────────────

export async function listProfiles(): Promise<PerfilPermissao[]> {
  const { data } = await api.get('/admin/profiles')
  return data
}

export async function listPermissions(): Promise<Permissao[]> {
  const { data } = await api.get('/admin/permissions')
  return data
}

// ─── Auditoria ────────────────────────────────────────────────────────────────

export async function getAuditLogs(params?: {
  tabela?: string
  operacao?: string
  nm_login?: string
  limit?: number
}): Promise<AuditLog[]> {
  const { data } = await api.get('/admin/audit', { params })
  return data
}

export async function getAuditedTables(): Promise<AuditedTable[]> {
  const { data } = await api.get('/admin/audit/tables')
  return data
}

// ─── Logs de Sistema ──────────────────────────────────────────────────────────

export async function getSystemLogs(params?: {
  tp_nivel?: string
  nm_modulo?: string
  limit?: number
}): Promise<SystemLog[]> {
  const { data } = await api.get('/admin/system-logs', { params })
  return data
}

// ─── Estatísticas ─────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get('/admin/stats')
  return data
}
