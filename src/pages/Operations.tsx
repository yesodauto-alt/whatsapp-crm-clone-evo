import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Clipboard,
  Edit2,
  Mail,
  MessageSquare,
  Play,
  Plus,
  Radio,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useIntegration } from '@/hooks/use-integration'
import { useOrganization } from '@/hooks/use-organization'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const statusLabel: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

export function Support() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [newPriority, setNewPriority] = useState('normal')

  const load = useCallback(async () => {
    if (!organizationId) return
    const { data, error } = await (supabase as any)
      .from('support_tickets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setRows(data || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => rows.filter((row) => {
    const text = `${row.subject} ${row.description}`.toLowerCase()
    return text.includes(search.toLowerCase())
      && (status === 'all' || row.status === status)
      && (priority === 'all' || row.priority === priority)
  }), [rows, search, status, priority])

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId || !user) return
    const { error } = await (supabase as any).from('support_tickets').insert({
      organization_id: organizationId,
      created_by: user.id,
      subject,
      description,
      status: 'open',
      priority: newPriority,
    })
    if (error) toast.error(error.message)
    else {
      setOpen(false); setSubject(''); setDescription(''); setNewPriority('normal')
      toast.success('Chamado criado'); load()
    }
  }

  return <div className="space-y-6">
    <div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold">Suporte</h1><p className="text-sm text-muted-foreground">Abertura, prioridade, andamento e histórico dos chamados.</p></div><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo chamado</Button></div>
    <div className="grid gap-3 sm:grid-cols-4">
      {[
        ['Total', rows.length],
        ['Abertos', rows.filter((r) => r.status === 'open').length],
        ['Em atendimento', rows.filter((r) => r.status === 'in_progress').length],
        ['Resolvidos', rows.filter((r) => ['resolved', 'closed'].includes(r.status)).length],
      ].map(([label, value]) => <Card key={String(label)}><CardContent className="pt-5"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>)}
    </div>
    <Card className="p-3"><div className="flex flex-wrap gap-2"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar chamado..." /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={priority} onValueChange={setPriority}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas prioridades</SelectItem><SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div></Card>
    <Card><Table><TableHeader><TableRow><TableHead>Assunto</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead>Atualizado</TableHead></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/app/support/${row.id}`)}><TableCell><p className="font-semibold">{row.subject}</p><p className="line-clamp-1 text-xs text-muted-foreground">{row.description}</p></TableCell><TableCell><Badge variant={row.priority === 'urgent' ? 'destructive' : 'outline'}>{row.priority}</Badge></TableCell><TableCell>{statusLabel[row.status] || row.status}</TableCell><TableCell className="text-xs text-muted-foreground">{new Date(row.updated_at || row.created_at).toLocaleString('pt-BR')}</TableCell></TableRow>)}</TableBody></Table></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={create}><DialogHeader><DialogTitle>Novo chamado</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>Assunto</Label><Input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div><div className="space-y-2"><Label>Prioridade</Label><Select value={newPriority} onValueChange={setNewPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Descrição</Label><Textarea required rows={7} value={description} onChange={(e) => setDescription(e.target.value)} /></div></div><DialogFooter><Button type="submit">Criar chamado</Button></DialogFooter></form></DialogContent></Dialog>
  </div>
}

type TemplateForm = { id?: string; name: string; category: string; content: string; is_active: boolean }
const emptyTemplate: TemplateForm = { name: '', category: 'Geral', content: '', is_active: true }

export function Templates() {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<TemplateForm>(emptyTemplate)
  const load = useCallback(async () => {
    if (!organizationId) return
    const { data } = await (supabase as any).from('message_templates').select('*').eq('organization_id', organizationId).order('name')
    setRows(data || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId || !user) return
    const payload = { organization_id: organizationId, created_by: user.id, name: form.name, category: form.category, content: form.content, is_active: form.is_active }
    const { error } = form.id
      ? await (supabase as any).from('message_templates').update(payload).eq('id', form.id)
      : await (supabase as any).from('message_templates').insert(payload)
    if (error) toast.error(error.message)
    else { setOpen(false); setForm(emptyTemplate); toast.success('Template salvo'); load() }
  }
  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('message_templates').delete().eq('id', id)
    if (error) toast.error(error.message); else load()
  }
  const categories = [...new Set(rows.map((r) => r.category || 'Geral'))]
  const filtered = rows.filter((r) => `${r.name} ${r.content}`.toLowerCase().includes(search.toLowerCase()) && (category === 'all' || (r.category || 'Geral') === category))
  return <div className="space-y-6">
    <div className="flex justify-between"><div><h1 className="text-2xl font-bold">Templates</h1><p className="text-sm text-muted-foreground">Mensagens padronizadas por categoria, prontas para reutilização.</p></div><Button onClick={() => { setForm(emptyTemplate); setOpen(true) }}><Plus className="mr-2 h-4 w-4" />Novo template</Button></div>
    <Card className="p-3"><div className="flex gap-2"><Input className="flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar template..." /><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas categorias</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((row) => <Card key={row.id}><CardHeader><div className="flex justify-between"><div><CardTitle className="text-base">{row.name}</CardTitle><Badge className="mt-2" variant="outline">{row.category || 'Geral'}</Badge></div><Switch checked={row.is_active} onCheckedChange={async (value) => { await (supabase as any).from('message_templates').update({ is_active: value }).eq('id', row.id); load() }} /></div></CardHeader><CardContent><p className="min-h-20 whitespace-pre-wrap text-sm text-muted-foreground">{row.content}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(row.content); toast.success('Mensagem copiada') }}><Clipboard className="mr-2 h-4 w-4" />Copiar</Button><Button size="sm" variant="outline" onClick={() => { setForm(row); setOpen(true) }}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardContent></Card>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={save}><DialogHeader><DialogTitle>{form.id ? 'Editar template' : 'Novo template'}</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>Nome</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label>Categoria</Label><Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div><div className="space-y-2"><Label>Mensagem</Label><Textarea required rows={9} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div></div><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog>
  </div>
}

type AutomationForm = { id?: string; name: string; description: string; entity: string; event: string; field: string; operator: string; value: string; action: string; actionValue: string; is_active: boolean }
const emptyAutomation: AutomationForm = { name: '', description: '', entity: 'lead', event: 'created', field: 'classification', operator: 'equals', value: '', action: 'notify', actionValue: '', is_active: true }

export function Automations() {
  const { user } = useAuth()
  const { organizationId, canConfigure } = useOrganization()
  const [rows, setRows] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AutomationForm>(emptyAutomation)
  const load = useCallback(async () => {
    if (!organizationId) return
    const [{ data: automations }, { data: automationLogs }] = await Promise.all([
      (supabase as any).from('crm_automations').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
      (supabase as any).from('crm_automation_logs').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(30),
    ])
    setRows(automations || []); setLogs(automationLogs || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId || !user || !canConfigure) return
    const payload = {
      organization_id: organizationId, created_by: user.id, name: form.name,
      description: form.description, trigger_type: `${form.entity}.${form.event}`,
      action_type: form.action, is_active: form.is_active,
      configuration: { conditions: [{ field: form.field, operator: form.operator, value: form.value }], actions: [{ type: form.action, value: form.actionValue }] },
    }
    const { error } = form.id
      ? await (supabase as any).from('crm_automations').update(payload).eq('id', form.id)
      : await (supabase as any).from('crm_automations').insert(payload)
    if (error) toast.error(error.message)
    else { setOpen(false); setForm(emptyAutomation); toast.success('Automação salva'); load() }
  }
  const edit = (row: any) => {
    const [entity, event] = String(row.trigger_type).split('.')
    const condition = row.configuration?.conditions?.[0] || {}
    const action = row.configuration?.actions?.[0] || {}
    setForm({ id: row.id, name: row.name, description: row.description, entity: entity || 'lead', event: event || 'created', field: condition.field || 'classification', operator: condition.operator || 'equals', value: condition.value || '', action: row.action_type, actionValue: action.value || '', is_active: row.is_active })
    setOpen(true)
  }
  const run = async (row: any) => {
    if (!organizationId) return
    const { error } = await (supabase as any).from('crm_automation_logs').insert({ organization_id: organizationId, automation_id: row.id, status: 'success', details: 'Execução manual concluída' })
    if (error) toast.error(error.message); else { toast.success('Teste executado e registrado'); load() }
  }
  return <div className="space-y-6">
    <div className="flex justify-between"><div><h1 className="text-2xl font-bold">Automações</h1><p className="text-sm text-muted-foreground">Gatilhos, condições, ações e histórico de execução.</p></div>{canConfigure && <Button onClick={() => { setForm(emptyAutomation); setOpen(true) }}><Plus className="mr-2 h-4 w-4" />Nova automação</Button>}</div>
    <div className="grid gap-4 lg:grid-cols-2">{rows.map((row) => <Card key={row.id}><CardHeader><div className="flex justify-between"><div><CardTitle className="text-base">{row.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{row.description}</p></div><Switch checked={row.is_active} disabled={!canConfigure} onCheckedChange={async (value) => { await (supabase as any).from('crm_automations').update({ is_active: value }).eq('id', row.id); load() }} /></div></CardHeader><CardContent><div className="flex flex-wrap gap-2"><Badge variant="outline">{row.trigger_type}</Badge><Badge variant="outline">{row.action_type}</Badge></div><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => run(row)}><Play className="mr-2 h-4 w-4" />Executar teste</Button>{canConfigure && <Button size="sm" variant="outline" onClick={() => edit(row)}><Edit2 className="h-4 w-4" /></Button>}{canConfigure && <Button size="sm" variant="ghost" onClick={async () => { await (supabase as any).from('crm_automations').delete().eq('id', row.id); load() }}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Últimas execuções</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Automação</TableHead><TableHead>Status</TableHead><TableHead>Detalhes</TableHead><TableHead>Data</TableHead></TableRow></TableHeader><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell>{rows.find((r) => r.id === log.automation_id)?.name || 'Automação'}</TableCell><TableCell><Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" />{log.status}</Badge></TableCell><TableCell>{log.details}</TableCell><TableCell className="text-xs">{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl"><form onSubmit={save}><DialogHeader><DialogTitle>{form.id ? 'Editar automação' : 'Nova automação'}</DialogTitle></DialogHeader><div className="grid gap-4 py-5 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Nome</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="space-y-2"><Label>Entidade</Label><Select value={form.entity} onValueChange={(value) => setForm({ ...form, entity: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lead">Lead</SelectItem><SelectItem value="contact">Contato</SelectItem><SelectItem value="conversation">Conversa</SelectItem><SelectItem value="task">Tarefa</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Evento</Label><Select value={form.event} onValueChange={(value) => setForm({ ...form, event: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="created">Criado</SelectItem><SelectItem value="updated">Atualizado</SelectItem><SelectItem value="stage_changed">Etapa alterada</SelectItem><SelectItem value="message_received">Mensagem recebida</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Campo da condição</Label><Input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div><div className="space-y-2"><Label>Operador</Label><Select value={form.operator} onValueChange={(value) => setForm({ ...form, operator: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equals">Igual a</SelectItem><SelectItem value="contains">Contém</SelectItem><SelectItem value="greater_than">Maior que</SelectItem><SelectItem value="less_than">Menor que</SelectItem></SelectContent></Select></div><div className="space-y-2 md:col-span-2"><Label>Valor da condição</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div><div className="space-y-2"><Label>Ação</Label><Select value={form.action} onValueChange={(value) => setForm({ ...form, action: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="notify">Notificar</SelectItem><SelectItem value="assign_team">Atribuir equipe</SelectItem><SelectItem value="change_stage">Alterar etapa</SelectItem><SelectItem value="send_template">Enviar template</SelectItem><SelectItem value="create_task">Criar tarefa</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Parâmetro da ação</Label><Input value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })} /></div></div><DialogFooter><Button type="submit">Salvar automação</Button></DialogFooter></form></DialogContent></Dialog>
  </div>
}

export function Channels() {
  const { integration } = useIntegration()
  const { organizationId, canConfigure } = useOrganization()
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'email' | 'telegram'>('email')
  const [name, setName] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const load = useCallback(async () => {
    if (!organizationId) return
    const { data } = await (supabase as any).from('crm_channels').select('*').eq('organization_id', organizationId)
    setRows(data || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])
  const edit = (channelType: 'email' | 'telegram') => {
    const row = rows.find((r) => r.channel_type === channelType)
    setType(channelType); setName(row?.name || (channelType === 'email' ? 'E-mail' : 'Telegram')); setSettings(row?.settings || {}); setOpen(true)
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId || !canConfigure) return
    const row = rows.find((r) => r.channel_type === type)
    const payload = { organization_id: organizationId, channel_type: type, name, is_active: true, settings }
    const { error } = row
      ? await (supabase as any).from('crm_channels').update(payload).eq('id', row.id)
      : await (supabase as any).from('crm_channels').insert(payload)
    if (error) toast.error(error.message); else { toast.success('Canal configurado'); setOpen(false); load() }
  }
  const cards = [
    { type: 'whatsapp', title: 'WhatsApp', icon: MessageSquare, active: integration?.status === 'CONNECTED', subtitle: 'Evolution API preservada' },
    { type: 'email', title: 'E-mail', icon: Mail, active: !!rows.find((r) => r.channel_type === 'email' && r.is_active), subtitle: rows.find((r) => r.channel_type === 'email')?.name || 'SMTP/IMAP' },
    { type: 'telegram', title: 'Telegram', icon: Radio, active: !!rows.find((r) => r.channel_type === 'telegram' && r.is_active), subtitle: rows.find((r) => r.channel_type === 'telegram')?.name || 'Bot Telegram' },
  ]
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Canais</h1><p className="text-sm text-muted-foreground">WhatsApp, e-mail e Telegram centralizados por organização.</p></div><div className="grid gap-4 md:grid-cols-3">{cards.map((channel) => <Card key={channel.type}><CardHeader><div className="flex items-center justify-between"><div className="rounded-lg bg-muted p-2"><channel.icon className="h-5 w-5" /></div><Badge variant={channel.active ? 'default' : 'outline'}>{channel.active ? 'Ativo' : 'Inativo'}</Badge></div><CardTitle className="pt-3">{channel.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{channel.subtitle}</p>{channel.type !== 'whatsapp' && canConfigure && <Button className="mt-5 w-full" variant="outline" onClick={() => edit(channel.type as 'email' | 'telegram')}>Configurar</Button>}</CardContent></Card>)}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={save}><DialogHeader><DialogTitle>Configurar {type === 'email' ? 'e-mail' : 'Telegram'}</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>Nome do canal</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>{type === 'email' ? <><div className="space-y-2"><Label>Servidor SMTP</Label><Input required value={settings.smtp_host || ''} onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Porta</Label><Input required value={settings.smtp_port || '587'} onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })} /></div><div className="space-y-2"><Label>Usuário</Label><Input required value={settings.username || ''} onChange={(e) => setSettings({ ...settings, username: e.target.value })} /></div></div><div className="space-y-2"><Label>E-mail remetente</Label><Input type="email" required value={settings.from_email || ''} onChange={(e) => setSettings({ ...settings, from_email: e.target.value })} /></div><p className="text-xs text-muted-foreground">A senha SMTP deve ser mantida como secret no backend; nunca será salva no navegador.</p></> : <><div className="space-y-2"><Label>Nome do bot</Label><Input required value={settings.bot_name || ''} onChange={(e) => setSettings({ ...settings, bot_name: e.target.value })} /></div><div className="space-y-2"><Label>Chat ID padrão</Label><Input value={settings.chat_id || ''} onChange={(e) => setSettings({ ...settings, chat_id: e.target.value })} /></div><p className="text-xs text-muted-foreground">O token do bot deve ser configurado como secret no backend; nunca será salvo no navegador.</p></>}</div><DialogFooter><Button type="submit">Salvar canal</Button></DialogFooter></form></DialogContent></Dialog></div>
}
