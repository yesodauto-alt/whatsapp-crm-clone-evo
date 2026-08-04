import { supabase } from '@/lib/supabase/client'
import type { UserIntegration } from '@/lib/types'

export interface QrResult {
  qrCode: string | null
  connected: boolean
  creating: boolean
  error: string | null
}

/**
 * Busca o QR code de conexão da instância Evolution.
 *
 * A edge function `evolution-get-qr` espera `{ instanceName }` e retorna
 * `{ success: true, data: <resposta da Evolution API> }`. A resposta da
 * Evolution API para `/instance/connect/{instanceName}` tem o formato:
 * `{ instance: { status }, qrcode: { base64 } }`.
 *
 * Este helper normaliza a resposta para um formato simples, tolerando tanto
 * o wrapper `{ success, data }` quanto a resposta crua.
 */
export async function fetchQrCode(integration: UserIntegration | null): Promise<QrResult> {
  if (!integration?.instance_name) {
    return { qrCode: null, connected: false, creating: false, error: 'instanceName is required' }
  }

  const { data, error } = await supabase.functions.invoke('evolution-get-qr', {
    body: { instanceName: integration.instance_name },
  })

  if (error) {
    return { qrCode: null, connected: false, creating: false, error: error.message }
  }

  // data = { success: true, data: <resposta da Evolution> }
  const payload = data?.data ?? data ?? {}

  const qrcode = payload?.qrcode
  const instance = payload?.instance

  const qrCode = qrcode?.base64 || payload?.base64 || null
  const connected = instance?.status === 'open' || payload?.connected === true
  const creating = payload?.creating === true || payload?.error === 'qr_not_ready_yet'
  const err = payload?.error || null

  return { qrCode, connected, creating, error: err }
}
