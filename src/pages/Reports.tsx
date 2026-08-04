import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Flame,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  MessageCircle,
  Mail,
  Radio,
  Package,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useContacts } from '@/hooks/use-contacts'
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard'
import { useIntegration } from '@/hooks/use-integration'
import { useOrganization } from '@/hooks/use-organization'
import { classificationLabel } from '@/lib/classification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const channelMeta: Record<string, { label: string; icon: typeof MessageCircle }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'E-mail', icon: Mail },
  telegram: { label: 'Telegram', icon: Radio },
}

export default function Reports() {
  const { contacts, loading } = useContacts('')
  const financial = useFinancialDashboard()
  const { integration } = useIntegration()
  const { organizationId } = useOrganization()
  const [channels, setChannels] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!organizationId) return
    const load = async () => {
      const { data } = await (supabase as any)
        .from('crm_channels')
        .select('*')
        .eq('organization_id', organizationId)
      setChannels(data || [])
    }
    load()
  }, [organizationId])

  const counts = { Hot: 0, Warm: 0, Lukewarm: 0, Cold: 0, 'Do Not Contact': 0 }
  contacts.forEach((c) => {
    if (c.classification && counts[c.classification as keyof typeof counts] !== undefined) {
      counts[c.classification as keyof typeof counts]++
    }
  })

  const totalContacts = contacts.length
  const hotLeads = counts.Hot
  const avgScore =
    contacts.length > 0
      ? Math.round(contacts.reduce((sum, c) => sum + (c.score || 0), 0) / contacts.length)
      : 0

  const summary = [
    { label: 'Total de contatos', value: loading ? '-' : String(totalContacts), icon: Users },
    { label: 'Leads quentes', value: loading ? '-' : String(hotLeads), icon: Flame },
    { label: 'Valor do pipeline', value: money(financial.pipelineValue), icon: TrendingUp },
    { label: 'Receita ganha', value: money(financial.wonValue), icon: DollarSign },
    { label: 'Ticket médio', value: money(financial.ticketAverage), icon: Activity },
    {
      label: 'Taxa de conversão',
      value: `${financial.conversionRate.toFixed(1)}%`,
      icon: Target,
    },
    { label: 'Oportunidades', value: String(financial.opportunityCount), icon: Package },
    { label: 'Produtos ativos', value: String(financial.productCount), icon: Package },
  ]

  const classificationColors: Record<string, string> = {
    Hot: 'bg-class-hot',
    Warm: 'bg-class-warm',
    Lukewarm: 'bg-class-lukewarm',
    Cold: 'bg-class-cold',
    'Do Not Contact': 'bg-class-dnc',
  }

  const maxCount = Math.max(1, ...Object.values(counts))

  const channelBoxes = [
    {
      key: 'whatsapp-main',
      title: 'WhatsApp principal',
      subtitle: integration?.instance_name || 'Não conectado',
      active: integration?.status === 'CONNECTED',
      type: 'whatsapp',
    },
    ...channels.map((c) => ({
      key: c.id,
      title: c.name,
      subtitle: c.settings?.phone_number || channelMeta[c.channel_type]?.label || c.channel_type,
      active: c.is_active,
      type: c.channel_type,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1 font-medium text-sm">
          Visão gerencial com os principais indicadores do CRM.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summary.map((metric) => (
          <Card key={metric.label} className="shadow-subtle border-border/40 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </span>
                <div className="bg-muted p-2 rounded-full text-foreground">
                  <metric.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {metric.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-subtle border-border/40 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por classificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(counts).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {classificationLabel[key] || key}
                  </span>
                  <span className="font-semibold text-muted-foreground">{value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', classificationColors[key])}
                    style={{ width: `${(value / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-muted-foreground">
              Pontuação média: <strong className="text-foreground">{avgScore}</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-border/40 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Canais cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {channelBoxes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum canal configurado.</p>
            ) : (
              channelBoxes.map((box) => {
                const meta = channelMeta[box.type] || channelMeta.whatsapp
                const Icon = meta.icon
                return (
                  <div
                    key={box.key}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                  >
                    <div className="rounded-lg bg-muted p-2">
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
              })
            )}
            <button
              onClick={() => navigate('/app/channels')}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              Gerenciar canais →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
