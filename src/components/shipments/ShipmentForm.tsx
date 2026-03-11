'use client'
import { useState } from 'react'
import { Shipment } from '@/types'
import { calculateBagsFromWeight } from '@/lib/utils'
import { Upload } from 'lucide-react'

interface ShipmentFormProps {
  shipment?: Shipment
  dealId: string
  productSuggestion?: string
  onSubmit: (data: Partial<Shipment>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function ShipmentForm({
  shipment,
  dealId,
  productSuggestion,
  onSubmit,
  onCancel,
  loading,
}: ShipmentFormProps) {
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    truckPlate: shipment?.truckPlate || '',
    cargoWeightKg: shipment?.cargoWeightKg?.toString() || '',
    loadedProduct: shipment?.loadedProduct || productSuggestion || '',
    loadingDate: shipment?.loadingDate
      ? new Date(shipment.loadingDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    cargoValue: shipment?.cargoValue?.toString() || '',
    driverName: shipment?.driverName || '',
    driverPhone: shipment?.driverPhone || '',
    invoicePdfPath: shipment?.invoicePdfPath || '',
  })

  const bagsQuantity = form.cargoWeightKg ? calculateBagsFromWeight(parseFloat(form.cargoWeightKg)) : 0

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/shipments/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Erro ao fazer upload')
        return
      }

      set('invoicePdfPath', data.data.path)
    } catch {
      alert('Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validations
    if (!form.truckPlate) {
      alert('Placa do caminhão é obrigatória')
      return
    }
    if (!form.cargoWeightKg || parseFloat(form.cargoWeightKg) <= 0) {
      alert('Peso da carga deve ser maior que zero')
      return
    }
    if (!form.loadedProduct) {
      alert('Produto é obrigatório')
      return
    }
    if (!form.loadingDate) {
      alert('Data de carregamento é obrigatória')
      return
    }
    if (!form.cargoValue || parseFloat(form.cargoValue) < 0) {
      alert('Valor da carga é obrigatório')
      return
    }
    if (!form.driverName) {
      alert('Nome do motorista é obrigatório')
      return
    }
    if (!form.driverPhone) {
      alert('Telefone do motorista é obrigatório')
      return
    }

    await onSubmit({
      dealId,
      truckPlate: form.truckPlate,
      cargoWeightKg: parseFloat(form.cargoWeightKg),
      loadedProduct: form.loadedProduct,
      loadingDate: form.loadingDate,
      cargoValue: parseFloat(form.cargoValue),
      driverName: form.driverName,
      driverPhone: form.driverPhone,
      invoicePdfPath: form.invoicePdfPath || null,
    })
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Truck Plate + Loading Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Placa do Caminhão *</label>
          <input
            type="text"
            className={inputClass}
            value={form.truckPlate}
            onChange={(e) => set('truckPlate', e.target.value.toUpperCase())}
            required
            placeholder="ABC-1234"
            maxLength={8}
          />
        </div>
        <div>
          <label className={labelClass}>Data do Carregamento *</label>
          <input
            type="date"
            className={inputClass}
            value={form.loadingDate}
            onChange={(e) => set('loadingDate', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Weight + Product */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Peso da Carga (KG) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={form.cargoWeightKg}
            onChange={(e) => set('cargoWeightKg', e.target.value)}
            required
            placeholder="50000"
          />
        </div>
        <div>
          <label className={labelClass}>Produto Carregado *</label>
          <input
            type="text"
            className={inputClass}
            value={form.loadedProduct}
            onChange={(e) => set('loadedProduct', e.target.value)}
            required
            placeholder="Soja"
          />
        </div>
      </div>

      {/* Calculated Bags */}
      {bagsQuantity > 0 && (
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Quantidade de Sacas (calculado)</p>
          <p className="text-2xl font-bold text-green-800">
            {bagsQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sacas
          </p>
          <p className="text-xs text-green-600 mt-1">Regra: 1 saca = 60 kg</p>
        </div>
      )}

      {/* Cargo Value */}
      <div>
        <label className={labelClass}>Valor da Carga (R$) *</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          value={form.cargoValue}
          onChange={(e) => set('cargoValue', e.target.value)}
          required
          placeholder="150000.00"
        />
      </div>

      {/* Driver Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome do Motorista *</label>
          <input
            type="text"
            className={inputClass}
            value={form.driverName}
            onChange={(e) => set('driverName', e.target.value)}
            required
            placeholder="João Silva"
          />
        </div>
        <div>
          <label className={labelClass}>Telefone do Motorista *</label>
          <input
            type="tel"
            className={inputClass}
            value={form.driverPhone}
            onChange={(e) => set('driverPhone', e.target.value)}
            required
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      {/* Invoice Upload */}
      <div>
        <label className={labelClass}>Nota Fiscal (PDF)</label>
        <div className="flex items-center gap-3">
          <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 cursor-pointer transition">
            <Upload size={16} className="text-gray-400" />
            <span className="text-gray-600">
              {uploading ? 'Enviando...' : form.invoicePdfPath ? 'Alterar PDF' : 'Selecionar PDF'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {form.invoicePdfPath && (
            <a
              href={form.invoicePdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition"
            >
              Ver PDF
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {loading ? 'Salvando...' : shipment ? 'Atualizar Carregamento' : 'Registrar Carregamento'}
        </button>
      </div>
    </form>
  )
}
