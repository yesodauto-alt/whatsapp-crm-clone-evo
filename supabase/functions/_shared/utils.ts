/**
 * Extrai e normaliza número de telefone no formato internacional
 * Para Brasil: adiciona +55 se necessário e formata como 55+DDD+numero
 */
export function extractCanonicalPhone(data: any): string | null {
  if (!data) return null
  const fields = ['phone', 'phoneNumber', 'wa_id', 'senderPn', 'id', 'remoteJid', 'jid']
  for (const field of fields) {
    const val = data[field]
    if (typeof val === 'string') {
      if (val.includes('@s.whatsapp.net')) {
        const extracted = val.split('@')[0]
        if (/^\d+$/.test(extracted)) {
          return normalizeBrazilianPhone(extracted)
        }
      }
      if (val.includes('@lid') || val.includes('@g.us') || val.includes('status@broadcast'))
        continue

      const digits = val.replace(/\D/g, '')
      if (digits.length >= 8) {
        return normalizeBrazilianPhone(digits)
      }
    } else if (typeof val === 'number') {
      const strVal = String(val)
      if (strVal.length >= 8) return normalizeBrazilianPhone(strVal)
    }
  }
  return null
}

/**
 * Normaliza número de telefone para o padrão brasileiro internacional
 * Formato: 55 + DDD (2 dígitos) + número (8-9 dígitos)
 * Exemplos:
 * - "11987654321" → "5511987654321"
 * - "2198765432" → "552198765432"
 * - "5511987654321" → "5511987654321" (já formatado)
 */
export function normalizeBrazilianPhone(phone: string): string {
  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '')
  
  // Se já começa com 55 e tem 12-13 dígitos, já está no formato correto
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return digits
  }
  
  // Se tem 10-11 dígitos, é um número brasileiro sem o código do país
  // Adiciona 55 no início
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits
  }
  
  // Se tem 8-9 dígitos, é apenas o número local (sem DDD)
  // Não podemos adivinhar o DDD, então retornamos como está
  if (digits.length === 8 || digits.length === 9) {
    return digits
  }
  
  // Para outros casos (números internacionais), retorna os dígitos puros
  return digits
}

/**
 * Formata número para exibição no formato brasileiro
 * Ex: 5511987654321 → +55 (11) 98765-4321
 */
export function formatPhoneForDisplay(phone: string | null): string {
  if (!phone) return ''
  
  const digits = phone.replace(/\D/g, '')
  
  // Se começa com 55, formata como brasileiro
  if (digits.startsWith('55') && digits.length >= 12) {
    const ddd = digits.slice(2, 4)
    const number = digits.slice(4)
    
    // Número com 9 dígitos (celular)
    if (number.length === 9) {
      return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
    }
    // Número com 8 dígitos (fixo)
    if (number.length === 8) {
      return `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
    }
  }
  
  // Se tem 10-11 dígitos sem 55, assume que é brasileiro sem código
  if (digits.length === 10 || digits.length === 11) {
    const ddd = digits.slice(0, 2)
    const number = digits.slice(2)
    
    if (number.length === 9) {
      return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
    }
    if (number.length === 8) {
      return `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
    }
  }
  
  // Fallback: mostra com + no início
  return `+${digits}`
}
