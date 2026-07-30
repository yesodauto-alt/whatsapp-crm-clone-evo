import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpDown,
  FileText,
  Flame,
  LifeBuoy,
  Mail,
  Plus,
  Radio,
  Search,
  Send,
  Trash2,
  User,
  Workflow,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useContacts } from '@/hooks/use-contacts'
import { useIntegration } from '@/hooks/use-integration'
import { useOrganization } from '@/hooks/use-organization'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type WorkspaceProps = { title: string; description: string; icon?: ReactNode; children?: ReactNode }

export function Workspace({ title, description, icon, children }: WorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {icon && <div className="rounded-xl bg-primary p-2.5 text-primary-foreground">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

const classificationLabel: Record<string, string> = {
  Hot: 'Quente',
  Warm: 'Morno',
  Lukewarm: 'Pouco aquecido',
  Cold: 'Frio',
  'Do Not Contact': 'Não contatar',
}

export function Priorities() {
  const [search, setSearch] = useState('')
  const { contacts, loading } = useContacts(search)
  const navigate = useNavigate()
  const groups = ['Hot', 'Warm', 'Lukewarm', 'Cold']
  return (
    <Workspace title="Prioridades" description="Contatos classificados pela IA, ordenados por temperatura, pontuação e última interação." icon={<Flame className="h-5 w-5" />}>
      <Card className="p-3"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou telefone..." className="pl-9" /></div></Card>
      {loading ? <p className="text-sm text-muted-foreground">Carregando prioridades...</p> : groups.map((group) => {
        const items = contacts.filter((contact) => contact.classification === group)
        return (
          <section key={group} className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><span>{group === 'Hot' ? '🔥' : group === 'Warm' ? '🟠' : group === 'Lukewarm' ? '🟡' : '🔵'}</span>{classificationLabel[group]} <span className="font-normal text-muted-foreground">({items.length})</span></h2>
            {items.length === 0 ? <Card className="p-4 text-center text-xs text-muted-foreground">Nenhum contato nesta categoria.</Card> :
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((contact) => (
                <Card key={contact.id} className="cursor-pointer p-4 transition-colors hover:bg-muted/40" onClick={() => navigate(`/app/chat/${contact.id}`)}>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{contact.push_name || 'Contato sem nome'}</p><p className="text-xs text-muted-foreground">{contact.phone_number || contact.remote_jid.split('@')[0]}</p></div><Badge variant="outline">{contact.score || 0} pts</Badge></div>
                  {contact.ai_analysis_summary && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{contact.ai_analysis_summary}</p>}
                </Card>
              ))}</div>}
          </section>
        )
      })}
    </Workspace>
  )
}

export function Queue() {
  const [search, setSearch] = useState('')
  const [classification, setClassification] = useState('all')
  const [ascending, setAscending] = useState(false)
  const { contacts } = useContacts(search)
  const navigate = useNavigate()
  const rows = useMemo(() => contacts
    .filter((contact) => classification === 'all' || contact.classification === classification)
    .sort((a, b) => {
      const score = (a.score || 0) - (b.score || 0)
      return ascending ? score : -score
    }), [contacts, classification, ascending])
  return (
    <Workspace title="Fila SDR" description="Atenda os contatos em ordem operacional de prioridade." icon={<Flame className="h-5 w-5" />}>
      <Card className="p-3"><div className="flex flex-wrap gap-2"><Input className="min-w-56 flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contato..." /><Select value={classification} onValueChange={setClassification}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as temperaturas</SelectItem><SelectItem value="Hot">Quentes</SelectItem><SelectItem value="Warm">Mornos</SelectItem><SelectItem value="Cold">Frios</SelectItem></SelectContent></Select><Button variant="outline" onClick={() => setAscending(!ascending)}><ArrowUpDown className="mr-2 h-4 w-4" />{ascending ? 'Crescente' : 'Decrescente'}</Button></div></Card>
      <Card><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Contato</TableHead><TableHead>Telefone</TableHead><TableHead>Temperatura</TableHead><TableHead>Pontuação</TableHead><TableHead>Última interação</TableHead></TableRow></TableHeader><TableBody>{rows.map((contact, index) => <TableRow key={contact.id} className="cursor-pointer" onClick={() => navigate(`/app/chat/${contact.id}`)}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{contact.push_name || 'Contato sem nome'}</TableCell><TableCell>{contact.phone_number || contact.remote_jid.split('@')[0]}</TableCell><TableCell><Badge variant="outline">{classificationLabel[contact.classification || ''] || 'Sem classificação'}</Badge></TableCell><TableCell>{contact.score || 0}</TableCell><TableCell className="text-xs text-muted-foreground">{contact.last_message_at ? new Date(contact.last_message_at).toLocaleString('pt-BR') : '—'}</TableCell></TableRow>)}</TableBody></Table></Card>
    </Workspace>
  )
}

export function Leads() {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const { contacts } = useContacts(search)
  const navigate = useNavigate()
  const rows = contacts.filter((contact) => stage === 'all' || contact.pipeline_stage === stage)
  return (
    <Workspace title="Leads" description="Visão comercial completa dos contatos e suas etapas no funil." icon={<User className="h-5 w-5" />}>
      <Card className="p-3"><div className="flex gap-2"><Input className="flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou telefone..." /><Select value={stage} onValueChange={setStage}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as etapas</SelectItem>{['Em Espera', 'Contato Feito', 'Qualificado', 'Proposta Enviada', 'Fechado'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></Card>
      <Card><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>WhatsApp</TableHead><TableHead>Etapa</TableHead><TableHead>Temperatura</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader><TableBody>{rows.map((contact) => <TableRow key={contact.id} className="cursor-pointer" onClick={() => navigate(`/app/leads/${contact.id}`)}><TableCell className="font-medium">{contact.push_name || 'Contato sem nome'}</TableCell><TableCell>{contact.phone_number || contact.remote_jid.split('@')[0]}</TableCell><TableCell><Badge>{contact.pipeline_stage || 'Em Espera'}</Badge></TableCell><TableCell>{classificationLabel[contact.classification || ''] || '—'}</TableCell><TableCell className="text-muted-foreground">A definir</TableCell></TableRow>)}</TableBody></Table></Card>
    </Workspace>
  )
}

export function Channels() {
  const { integration } = useIntegration()
  const { organizationId } = useOrganization()
  const [rows, setRows] = useState<any[]>([])
  const load = useCallback(async () => {
    if (!organizationId) return
    const { data } = await (supabase as any).from('crm_channels').select('*').eq('organization_id', organizationId).order('created_at')
    setRows(data || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])
  const toggle = async (type: string, enabled: boolean) => {
    if (!organizationId) return
    const existing = rows.find((row) => row.channel_type === type)
    const payload = { organization_id: organizationId, channel_type: type, name: type === 'email' ? 'E-mail' : 'Telegram', is_active: enabled }
    const query = existing ? (supabase as any).from('crm_channels').update(payload).eq('id', existing.id) : (supabase as any).from('crm_channels').insert(payload)
    const { error } = await query
    if (error) toast.error(error.message); else { toast.success('Canal atualizado'); load() }
  }
  const channelRows = [
    { type: 'whatsapp', name: 'WhatsApp', description: `Evolution API · ${integration?.status || 'desconectado'}`, icon: Send, enabled: integration?.status === 'CONNECTED', locked: true },
    { type: 'email', name: 'E-mail', description: 'Atendimento e notificações por e-mail', icon: Mail, enabled: !!rows.find((row) => row.channel_type === 'email' && row.is_active) },
    { type: 'telegram', name: 'Telegram', description: 'Mensagens através de bot do Telegram', icon: Radio, enabled: !!rows.find((row) => row.channel_type === 'telegram' && row.is_active) },
  ]
  return <Workspace title="Canais" description="Configure os canais de atendimento da organização." icon={<Radio className="h-5 w-5" />}><div className="grid gap-4 md:grid-cols-3">{channelRows.map((channel) => <Card key={channel.type}><CardHeader className="flex-row items-center justify-between space-y-0"><div className="flex items-center gap-3"><div className="rounded-lg bg-muted p-2"><channel.icon className="h-5 w-5" /></div><div><CardTitle className="text-base">{channel.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{channel.description}</p></div></div><Switch checked={channel.enabled} disabled={channel.locked} onCheckedChange={(enabled) => toggle(channel.type, enabled)} /></CardHeader></Card>)}</div></Workspace>
}

type CrudKind = 'support' | 'automations' | 'templates'
const crudConfig = {
  support: { table: 'support_tickets', title: 'Suporte', description: 'Abra e acompanhe solicitações da sua organização.', icon: LifeBuoy, button: 'Novo chamado', nameLabel: 'Assunto' },
  automations: { table: 'crm_automations', title: 'Automações', description: 'Crie regras para executar ações comerciais automaticamente.', icon: Workflow, button: 'Nova automação', nameLabel: 'Nome' },
  templates: { table: 'message_templates', title: 'Templates', description: 'Cadastre mensagens reutilizáveis para o atendimento.', icon: FileText, button: 'Novo template', nameLabel: 'Nome' },
}

export function CrudModule({ kind }: { kind: CrudKind }) {
  const config = crudConfig[kind]
  const { organizationId, canConfigure } = useOrganization()
  const { user } = useAuth()
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const load = useCallback(async () => {
    if (!organizationId) return
    const { data, error } = await (supabase as any).from(config.table).select('*').eq('organization_id', organizationId).order('created_at', { ascending: false })
    if (!error) setRows(data || [])
  }, [organizationId, config.table])
  useEffect(() => { load() }, [load])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId || !user) return
    const base = { organization_id: organizationId, created_by: user.id }
    const payload = kind === 'support' ? { ...base, subject: name, description: content, status: 'open' } : kind === 'templates' ? { ...base, name, content, is_active: true } : { ...base, name, description: content, is_active: true, trigger_type: 'manual', action_type: 'notify' }
    const { error } = await (supabase as any).from(config.table).insert(payload)
    if (error) toast.error(error.message); else { setName(''); setContent(''); setOpen(false); toast.success('Registro criado'); load() }
  }
  const remove = async (id: string) => { const { error } = await (supabase as any).from(config.table).delete().eq('id', id); if (error) toast.error(error.message); else load() }
  return (
    <Workspace title={config.title} description={config.description} icon={<config.icon className="h-5 w-5" />}>
      <div className="flex justify-end">{(canConfigure || kind !== 'automations') && <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />{config.button}</Button>}</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <Card key={row.id}><CardHeader><div className="flex items-start justify-between"><div><CardTitle className="text-base">{row.name || row.subject}</CardTitle><Badge className="mt-2" variant="outline">{row.status || (row.is_active ? 'Ativo' : 'Inativo')}</Badge></div><Button size="icon" variant="ghost" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardHeader><CardContent><p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{row.content || row.description}</p></CardContent></Card>)}</div>
      {rows.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum registro cadastrado.</CardContent></Card>}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>{config.button}</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>{config.nameLabel}</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label>{kind === 'templates' ? 'Mensagem' : 'Descrição'}</Label><Textarea required rows={6} value={content} onChange={(e) => setContent(e.target.value)} /></div></div><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog>
    </Workspace>
  )
}

export function Profile() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  useEffect(() => {
    if (!user) return
    ;(supabase as any).from('profiles').select('full_name,avatar_url').eq('id', user.id).maybeSingle().then(({ data }: any) => { setName(data?.full_name || ''); setAvatar(data?.avatar_url || '') })
  }, [user])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    const { error } = await (supabase as any).from('profiles').upsert({ id: user.id, email: user.email, full_name: name, avatar_url: avatar })
    if (error) toast.error(error.message); else toast.success('Perfil atualizado')
  }
  return <Workspace title="Perfil" description="Gerencie seus dados pessoais e sua identificação no CRM." icon={<User className="h-5 w-5" />}><Card className="max-w-2xl"><CardContent className="pt-6"><form className="space-y-4" onSubmit={save}><div className="space-y-2"><Label>Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label>E-mail</Label><Input value={user?.email || ''} disabled /></div><div className="space-y-2"><Label>URL da foto</Label><Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." /></div><Button type="submit">Salvar perfil</Button></form></CardContent></Card></Workspace>
}
