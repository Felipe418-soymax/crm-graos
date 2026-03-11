'use client'
import { Phone, MessageCircle, Mail, Headphones } from 'lucide-react'

export default function SuportePage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <Headphones className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Suporte ao Cliente</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md mx-auto">
            Precisa de ajuda para utilizar o sistema? Entre em contato com nossa equipe de suporte.
            Estamos prontos para ajudar!
          </p>
        </div>

        {/* Contact Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-gray-700">FL</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Felipi Ludtke</h2>
                <p className="text-sm text-gray-500">Suporte Técnico</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Telefone / WhatsApp</p>
                  <a href="tel:+5566999248403" className="text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors">
                    (66) 9 9924-8403
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 p-6 bg-gray-50/50 space-y-3">
            <a
              href="https://wa.me/5566999248403"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </a>
            <a
              href="tel:+5566999248403"
              className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 active:scale-[0.98]"
            >
              <Phone className="w-5 h-5" />
              Ligar agora
            </a>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Horário de atendimento: Segunda a Sexta, 8h às 18h
        </p>
      </div>
    </div>
  )
}
