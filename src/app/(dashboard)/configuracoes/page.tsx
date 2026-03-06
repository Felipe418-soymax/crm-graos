'use client'
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Shield, Settings, Building2, Save, Upload, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { User, CompanySettings } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ConfiguracoesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seller' })

  // Company settings state
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [companyForm, setCompanyForm] = useState({ companyName: '', region: '', logoUrl: '' })
  const [companySaving, setCompanySaving] = useState(false)
  const [companySuccess, setCompanySuccess] = useState(false)
  const [companyError, setCompanyError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function fetchData() {
    setLoading(true)
    const [usersRes, meRes, companyRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/auth/me'),
      fetch('/api/company'),
    ])
    if (usersRes.ok) {
      const d = await usersRes.json()
      setUsers(d.data || [])
    }
    if (meRes.ok) {
      const d = await meRes.json()
      setCurrentUser(d.user)
    }
    if (companyRes.ok) {
      const d = await companyRes.json()
      const s: CompanySettings | null = d.data
      setCompany(s)
      if (s) {
        setCompanyForm({
          companyName: s.companyName || '',
          region: s.region || '',
          logoUrl: s.logoUrl || '',
        })
      }
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const isAdmin = currentUser?.role === 'admin'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const method = editUser ? 'PATCH' : 'POST'
    const url = editUser ? `/api/users/${editUser.id}` : '/api/users'
    const payload: Record<string, string> = {}
    if (form.name) payload.name = form.name
    if (form.email) payload.email = form.email
    if (form.password) payload.password = form.password
    if (form.role) payload.role = form.role

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erro'); setSubmitting(false); return }
    setShowModal(false); setEditUser(null)
    setForm({ name: '', email: '', password: '', role: 'seller' })
    fetchData(); setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este usuário?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) alert(json.error || 'Erro ao excluir')
    else fetchData()
  }

  function openEdit(user: User) {
    setEditUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setError('')
    setShowModal(true)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) {
      setUploadError(json.error || 'Erro ao fazer upload')
    } else {
      setCompanyForm((f) => ({ ...f, logoUrl: json.data.url }))
    }
    setUploading(false)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  async function handleCompanySave(e: React.FormEvent) {
    e.preventDefault()
    setCompanySaving(true)
    setCompanyError('')
    setCompanySuccess(false)
    const res = await fetch('/api/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: companyForm.companyName || null,
        region: companyForm.region || null,
        logoUrl: companyForm.logoUrl || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setCompanyError(json.error || 'Erro ao salvar')
    } else {
      setCompany(json.data)
      setCompanySuccess(true)
      setTimeout(() => setCompanySuccess(false), 3000)
    }
    setCompanySaving(false)
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Gerenciamento de empresa, usuários e sistema</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setError(''); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'seller' }); setShowModal(true) }}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus size={18} />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Company settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={18} className="text-green-600" />
          <h3 className="font-semibold text-gray-900">Dados da Empresa</h3>
        </div>
        <form onSubmit={handleCompanySave} className="space-y-4">
          {companyError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{companyError}</div>
          )}
          {companySuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              ✓ Configurações salvas com sucesso!
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome da empresa</label>
              <input
                type="text"
                className={inputClass}
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Ex: Soymax Grãos Ltda"
              />
            </div>
            <div>
              <label className={labelClass}>Região de atuação</label>
              <input
                type="text"
                className={inputClass}
                value={companyForm.region}
                onChange={(e) => setCompanyForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Ex: Mato Grosso do Sul"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Logotipo da empresa</label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              {companyForm.logoUrl ? (
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyForm.logoUrl}
                    alt="Logo"
                    className="h-16 w-16 object-contain rounded-xl border border-gray-200 bg-gray-50 p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setCompanyForm((f) => ({ ...f, logoUrl: '' }))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition"
                    title="Remover logo"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Building2 size={24} className="text-gray-300" />
                </div>
              )}

              {/* Upload button */}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <Upload size={15} />
                  {uploading ? 'Enviando...' : (companyForm.logoUrl ? 'Trocar logo' : 'Fazer upload do logo')}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
                {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG ou WebP — máximo 5MB</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={companySaving}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              <Save size={16} />
              {companySaving ? 'Salvando...' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </div>

      {/* Current user info */}
      {currentUser && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{currentUser.name.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{currentUser.name}</p>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={currentUser.role === 'admin' ? 'warning' : 'info'}>
                {currentUser.role === 'admin' ? '🔑 Admin' : 'Vendedor'}
              </Badge>
            </div>
          </div>
          {!isAdmin && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              <Shield size={14} className="inline mr-1 text-gray-400" />
              Apenas administradores podem gerenciar usuários.
            </p>
          )}
        </div>
      )}

      {/* Users list (admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Usuários do sistema</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Criado em</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-semibold text-sm">{user.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-gray-400">(você)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'info'}>
                        {user.role === 'admin' ? 'Admin' : 'Vendedor'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <button onClick={() => openEdit(user)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition">
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* System info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900">Informações do sistema</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Versão</p>
            <p className="text-gray-700 font-medium">CRM Grãos v0.2.0</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Banco de dados</p>
            <p className="text-gray-700 font-medium">SQLite (local)</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Stack</p>
            <p className="text-gray-700 font-medium">Next.js 14 + Prisma</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Ambiente</p>
            <p className="text-gray-700 font-medium">Produção</p>
          </div>
        </div>
      </div>

      {/* User modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditUser(null) }}
        title={editUser ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div>
            <label className={labelClass}>Nome *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required={!editUser} placeholder="Nome completo" />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" className={inputClass} value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required={!editUser} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className={labelClass}>{editUser ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
            <input type="password" className={inputClass} value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={!editUser} placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>
          <div>
            <label className={labelClass}>Perfil *</label>
            <select className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="seller">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditUser(null) }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-60">
              {submitting ? 'Salvando...' : (editUser ? 'Atualizar' : 'Criar Usuário')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
