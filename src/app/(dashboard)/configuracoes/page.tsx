'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2, Shield, Settings, Upload, X, Building2, ImageIcon, MapPin, Palette, AlertTriangle } from 'lucide-react'
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
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    tradeName: '',
    cnpjCpf: '',
    stateRegistration: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    shortName: '',
    region: '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyMsg, setCompanyMsg] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if company data is configured
  const isCompanyConfigured = !!(company?.companyName || company?.tradeName || company?.cnpjCpf)

  async function fetchData() {
    setLoading(true)
    const [usersRes, meRes, companyRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/auth/me'),
      fetch('/api/company/settings'),
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
      if (d.data) {
        setCompany(d.data)
        setCompanyForm({
          companyName: d.data.companyName || '',
          tradeName: d.data.tradeName || '',
          cnpjCpf: d.data.cnpjCpf || '',
          stateRegistration: d.data.stateRegistration || '',
          phone: d.data.phone || '',
          email: d.data.email || '',
          street: d.data.street || '',
          number: d.data.number || '',
          district: d.data.district || '',
          city: d.data.city || '',
          state: d.data.state || '',
          zipCode: d.data.zipCode || '',
          country: d.data.country || 'Brasil',
          shortName: d.data.shortName || '',
          region: d.data.region || '',
        })
        setLogoPreview(d.data.logoUrl || null)
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

  // ── Company settings handlers ──────────────────────────────────────────────

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/png', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      setCompanyMsg('Tipo não permitido. Use PNG ou SVG.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setCompanyMsg('Arquivo muito grande. Máximo 50MB.')
      return
    }

    setUploadingLogo(true)
    setCompanyMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/company/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setCompanyMsg(json.error || 'Erro no upload')
        setUploadingLogo(false)
        return
      }
      setLogoPreview(json.url)
      setCompanyMsg('Logo atualizada com sucesso! Variantes otimizadas foram geradas.')
    } catch {
      setCompanyMsg('Erro ao fazer upload.')
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setCompanyMsg(''), 4000)
    }
  }

  async function handleRemoveLogo() {
    setUploadingLogo(true)
    try {
      await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: null, logoThumbnailUrl: null, logoHeaderUrl: null, logoFaviconUrl: null }),
      })
      setLogoPreview(null)
      setCompanyMsg('Logo removida.')
    } catch {
      setCompanyMsg('Erro ao remover logo.')
    } finally {
      setUploadingLogo(false)
      setTimeout(() => setCompanyMsg(''), 4000)
    }
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault()
    setSavingCompany(true)
    setCompanyMsg('')
    try {
      const res = await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm),
      })
      if (res.ok) {
        setCompanyMsg('Configurações salvas com sucesso!')
        const d = await res.json()
        setCompany(d.data)
      } else {
        const d = await res.json()
        setCompanyMsg(d.error || 'Erro ao salvar')
      }
    } catch {
      setCompanyMsg('Erro de conexão.')
    } finally {
      setSavingCompany(false)
      setTimeout(() => setCompanyMsg(''), 4000)
    }
  }

  function updateCompanyField(field: string, value: string) {
    setCompanyForm(prev => ({ ...prev, [field]: value }))
  }

  // ── CNPJ/CPF mask ──
  function formatCnpjCpf(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }

  function formatCep(value: string): string {
    const digits = value.replace(/\D/g, '')
    return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
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

      {/* Company not configured alert */}
      {!loading && !isCompanyConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Dados da empresa não configurados</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Configure os dados da sua empresa para que apareçam automaticamente em documentos, relatórios e PDFs exportados.
            </p>
          </div>
        </div>
      )}

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
                {currentUser.role === 'admin' ? 'Admin' : 'Vendedor'}
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

      {/* ══════════════ COMPANY PROFILE ══════════════ */}
      <form onSubmit={handleSaveCompany} className="space-y-6">

        {/* ── Section 1: Dados da Empresa ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <Building2 size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Dados da Empresa</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-6">
              Informações da empresa que serão usadas automaticamente em documentos, relatórios e PDFs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className={labelClass}>Razão Social</label>
                <input
                  className={inputClass}
                  value={companyForm.companyName}
                  onChange={(e) => updateCompanyField('companyName', e.target.value)}
                  placeholder="Ex: Agro Norte Commodities Ltda."
                />
              </div>
              <div>
                <label className={labelClass}>Nome Fantasia</label>
                <input
                  className={inputClass}
                  value={companyForm.tradeName}
                  onChange={(e) => updateCompanyField('tradeName', e.target.value)}
                  placeholder="Ex: Agro Norte"
                />
              </div>
              <div>
                <label className={labelClass}>CNPJ / CPF</label>
                <input
                  className={inputClass}
                  value={companyForm.cnpjCpf}
                  onChange={(e) => updateCompanyField('cnpjCpf', formatCnpjCpf(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div>
                <label className={labelClass}>Inscrição Estadual</label>
                <input
                  className={inputClass}
                  value={companyForm.stateRegistration}
                  onChange={(e) => updateCompanyField('stateRegistration', e.target.value)}
                  placeholder="Ex: 123456789"
                />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input
                  className={inputClass}
                  value={companyForm.phone}
                  onChange={(e) => updateCompanyField('phone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={companyForm.email}
                  onChange={(e) => updateCompanyField('email', e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div>
                <label className={labelClass}>Região</label>
                <input
                  className={inputClass}
                  value={companyForm.region}
                  onChange={(e) => updateCompanyField('region', e.target.value)}
                  placeholder="Ex: Norte de MT"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Endereço ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <MapPin size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Endereço</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className={labelClass}>Rua</label>
                <input
                  className={inputClass}
                  value={companyForm.street}
                  onChange={(e) => updateCompanyField('street', e.target.value)}
                  placeholder="Ex: Av. Brasil"
                />
              </div>
              <div>
                <label className={labelClass}>Número</label>
                <input
                  className={inputClass}
                  value={companyForm.number}
                  onChange={(e) => updateCompanyField('number', e.target.value)}
                  placeholder="Ex: 1500"
                />
              </div>
              <div>
                <label className={labelClass}>Bairro</label>
                <input
                  className={inputClass}
                  value={companyForm.district}
                  onChange={(e) => updateCompanyField('district', e.target.value)}
                  placeholder="Ex: Centro"
                />
              </div>
              <div>
                <label className={labelClass}>Cidade</label>
                <input
                  className={inputClass}
                  value={companyForm.city}
                  onChange={(e) => updateCompanyField('city', e.target.value)}
                  placeholder="Ex: Sinop"
                />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select
                  className={inputClass}
                  value={companyForm.state}
                  onChange={(e) => updateCompanyField('state', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>CEP</label>
                <input
                  className={inputClass}
                  value={companyForm.zipCode}
                  onChange={(e) => updateCompanyField('zipCode', formatCep(e.target.value))}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div>
                <label className={labelClass}>País</label>
                <input
                  className={inputClass}
                  value={companyForm.country}
                  onChange={(e) => updateCompanyField('country', e.target.value)}
                  placeholder="Brasil"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Branding ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <Palette size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">Branding</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-6">
              A logo aparecerá no menu lateral, documentos e relatórios. O nome curto será usado no atalho do celular (PWA).
            </p>

            {/* Logo upload */}
            <div className="mb-6">
              <label className={labelClass}>Logo da Empresa</label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition disabled:opacity-50"
                    >
                      <Upload size={14} />
                      {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition disabled:opacity-50"
                      >
                        <X size={14} />
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    PNG ou SVG. Máximo 50MB. Recomendado: fundo transparente. A imagem será comprimida e variantes otimizadas serão geradas automaticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Short name */}
            <div className="max-w-md">
              <label className={labelClass}>Nome Curto da Empresa</label>
              <input
                className={inputClass}
                value={companyForm.shortName}
                onChange={(e) => updateCompanyField('shortName', e.target.value)}
                placeholder="Ex: Agro Silva"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Usado no atalho do celular: <span className="font-medium text-gray-600">{companyForm.shortName || 'Empresa'} CRM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Save button & message */}
        {companyMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm ${companyMsg.includes('sucesso') || companyMsg.includes('removida') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {companyMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingCompany}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-60"
          >
            {savingCompany ? 'Salvando...' : 'Salvar Dados da Empresa'}
          </button>
        </div>
      </form>

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
            <p className="text-gray-700 font-medium">Grãos CRM v0.2.0</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Banco de dados</p>
            <p className="text-gray-700 font-medium">PostgreSQL</p>
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
