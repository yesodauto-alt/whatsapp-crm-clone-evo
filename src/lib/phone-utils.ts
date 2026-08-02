/**
 * Utilitários de formatação de telefone para exibição no frontend
 * Formata números brasileiros no padrão: +55 (DD) XXXXX-XXXX
 */

/**
 * Formata número para exibição no formato brasileiro
 * Exemplos:
 * - 5511987654321 → +55 (11) 98765-4321
 * - 552198765432 → +55 (21) 9876-5432
 * - 11987654321 → +55 (11) 98765-4321
 * - 2198765432 → +55 (21) 9876-5432
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

/**
 * Normaliza número de telefone para armazenamento (backend)
 * Formato: 55 + DDD (2 dígitos) + número (8-9 dígitos)
 */
export function normalizeBrazilianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  // Se já começa com 55 e tem 12-13 dígitos, já está no formato correto
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
    return digits
  }
  
  // Se tem 10-11 dígitos, é um número brasileiro sem o código do país
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits
  }
  
  // Se tem 8-9 dígitos, é apenas o número local (sem DDD)
  if (digits.length === 8 || digits.length === 9) {
    return digits
  }
  
  // Para outros casos (números internacionais), retorna os dígitos puros
  return digits
}
