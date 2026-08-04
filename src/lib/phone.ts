/**
 * Formata um número de telefone no padrão brasileiro.
 *
 * O número armazenado vem do JID do WhatsApp (ex.: "5511999999999" — código do
 * país 55 + DDD + número). Esta função normaliza e exibe como "+55 (11) 99999-9999".
 */
export function formatPhoneBR(raw?: string | null): string {
  if (!raw) return ''

  const digits = raw.replace(/\D/g, '')

  let country = ''
  let local = digits

  // Remove o código do país brasileiro (+55) quando presente
  if (local.startsWith('55') && local.length > 11) {
    country = '+55 '
    local = local.slice(2)
  }

  if (local.length === 11) {
    // Celular: (DD) DDDDD-DDDD
    return `${country}(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }

  if (local.length === 10) {
    // Fixo: (DD) DDDD-DDDD
    return `${country}(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }

  // Fallback: mantém o valor original
  return raw
}
