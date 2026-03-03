'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClientForm from '@/components/clients/ClientForm'
import { Client } from '@/types'

export default function NovoClientePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(data: Partial<Client>) {
    setSubmitting(true); setError('')
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erro ao criar'); setSubmitting(false); return }
    router.push(`/clientes/${json.data.id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clientes" className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do cliente</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>}
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => router.push('/clientes')}
          loading={submitting}
        />
      </div>
    </div>
  )
}
