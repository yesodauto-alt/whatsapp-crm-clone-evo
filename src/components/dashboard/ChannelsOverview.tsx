import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Mail, Radio, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useIntegration } from '@/hooks/use-integration'
import { useOrganization } from '@/hooks/use-organization'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChannelRow {
  id: string
  channel_type: string
  name: string
  is_active: boolean
  settings: Record<string, string>
}

const channelMeta: Record<string, { label: string; icon: typeof MessageCircle; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600 bg-green-500/10' },
  email: { label: 'E-mail', icon: Mail, color: 'text-blue-600 bg-blue-500/10' },
  telegram: { label: 'Telegram', icon: Radio, color: 'text-sky-600 bg-sky-500/10' },
}

export function ChannelsOverview() {
  const { integration } = useIntegration()
  const { organizationId } = useOrganization()
  const [rows, setRows] = useState<ChannelRow[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!organizationId) return
    const load = async () => {
      const { data } = await (supabase as any)
        .from('crm_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })
      setRows(data || [])
    }
    load()
  }, [organizationId])

  // Canal principal de WhatsApp (integração Evolution)
  const mainWhatsApp = integration?.status === 'CONNECTED'
  const whatsappChannels = rows.filter((r) => r.channel_type === 'whatsapp')
  const otherChannels = rows.filter((r) => r.channel_type !== 'whatsapp')

  const boxes: { key: string; title: string; subtitle: string; active: boolean; type: string }[] = [
    {
      key: 'whatsapp-main',
      title: 'WhatsApp principal',
      subtitle: integration?.instance_name || 'Não conectado',
      active: mainWhatsApp,
      type: 'whatsapp',
    },
    ...whatsappChannels.map((c) => ({
      key: c.id,
      title: c.name,
      subtitle: c.settings?.phone_number || 'Número adicional',
      active: c.is_active,
      type: 'whatsapp',
    })),
    ...otherChannels.map((c) => ({
      key: c.id,
      title: c.name,
      subtitle: channelMeta[c.channel_type]?.label || c.channel_type,
      active: c.is_active,
      type: c.channel_type,
    })),
  ]

  return (
    <Card className="shadow-subtle border-border/40 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Canais
          </h3>
          <button
            onClick={() => navigate('/app/channels')}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Gerenciar
          </button>
        </div>
        {boxes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum canal configurado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boxes.map((box) => {
              const meta = channelMeta[box.type] || channelMeta.whatsapp
              const Icon = meta.icon
              return (
                <div
                  key={box.key}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
                >
                  <div className={cn('rounded-lg p-2', meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{box.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{box.subtitle}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 text-[10px]',
                      box.active
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    {box.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
