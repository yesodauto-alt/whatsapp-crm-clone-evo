import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, DollarSign, Loader2, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'
import { useAgents } from '@/hooks/use-agents'
import { useContacts } from '@/hooks/use-contacts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const [contact, setContact] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [type, setType] = useState('note')
  const [dueAt, setDueAt] = useState('')
  const load = useCallback(async () => {
    if (!id) return
    const [{ data: contactRow }, { data: activityRows }] = await Promise.all([
      (supabase as any).from('whatsapp_contacts').select('*').eq('id', id).maybeSingle(),
      (supabase as any).from('contact_activities').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
    ])
    setContact(contactRow); setActivities(activityRows || [])
  }, [id])
  useEffect(() => { load() }, [load])
  const saveContact = async () => {
    const { error } = await (supabase as any).from('whatsapp_contacts').update({
      push_name: contact.push_name,
      classification: contact.classification,
      pipeline_stage: contact.pipeline_stage,
    }).eq('id', id)
    if (error) toast.error(error.message); else toast.success('Lead atualizado')
  }
  const addActivity = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !organizationId || !id) return
    const { error } = await (supabase as any).from('contact_activities').insert({
      organization_id: organizationId, contact_id: id, created_by: user.id,
      activity_type: type, content, due_at: dueAt || null,
    })
    if (error) toast.error(error.message); else { setContent(''); setDueAt(''); load() }
  }
  if (!contact) return <Loader2 className="mx-auto h-7 w-7 animate-spin" />
  return <div className="space-y-6">
    <Button variant="ghost" onClick={() => navigate('/app/leads')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
    <div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold">{contact.push_name || 'Contato sem nome'}</h1><p className="text-sm text-muted-foreground">{contact.phone_number || contact.remote_jid}</p></div><Button onClick={() => navigate(`/app/chat/${id}`)}><MessageSquare className="mr-2 h-4 w-4" />Abrir conversa</Button></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-lg">Dados do lead</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Nome</Label><Input value={contact.push_name || ''} onChange={(e) => setContact({ ...contact, push_name: e.target.value })} /></div><div className="space-y-2"><Label>Temperatura</Label><Select value={contact.classification || 'none'} onValueChange={(value) => setContact({ ...contact, classification: value === 'none' ? null : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem classificação</SelectItem><SelectItem value="Hot">Quente</SelectItem><SelectItem value="Warm">Morno</SelectItem><SelectItem value="Lukewarm">Pouco aquecido</SelectItem><SelectItem value="Cold">Frio</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Etapa do pipeline</Label><Select value={contact.pipeline_stage || 'Em Espera'} onValueChange={(value) => setContact({ ...contact, pipeline_stage: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Em Conversa', 'Em Espera', 'Resolvido', 'Perdido'].map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></div><Button onClick={saveContact}>Salvar alterações</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Observações e follow-ups</CardTitle></CardHeader><CardContent><form onSubmit={addActivity} className="space-y-3"><div className="flex gap-2"><Select value={type} onValueChange={setType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="note">Observação</SelectItem><SelectItem value="follow_up">Follow-up</SelectItem><SelectItem value="task">Tarefa</SelectItem></SelectContent></Select><Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></div><Textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Registre o histórico ou a próxima ação..." /><Button type="submit"><Plus className="mr-2 h-4 w-4" />Adicionar</Button></form><div className="mt-5 space-y-2">{activities.map((activity) => <div key={activity.id} className="rounded-lg border p-3"><div className="flex justify-between"><Badge variant="outline">{activity.activity_type}</Badge><span className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString('pt-BR')}</span></div><p className="mt-2 text-sm">{activity.content}</p>{activity.due_at && <p className="mt-1 text-xs text-muted-foreground">Agendado: {new Date(activity.due_at).toLocaleString('pt-BR')}</p>}</div>)}</div></CardContent></Card>
    </div>
  </div>
}

export function KnowledgeBase() {
  const { user } = useAuth()
  const { organizationId, canConfigure } = useOrganization()
  const { agents } = useAgents()
  const [agentId, setAgentId] = useState('')
  const [documents, setDocuments] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const load = useCallback(async () => {
    if (!agentId) return setDocuments([])
    const { data } = await (supabase as any).from('ai_knowledge_documents').select('*').eq('agent_id', agentId).order('created_at', { ascending: false })
    setDocuments(data || [])
  }, [agentId])
  useEffect(() => { load() }, [load])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !organizationId || !agentId) return
    const { error } = await (supabase as any).from('ai_knowledge_documents').insert({ organization_id: organizationId, agent_id: agentId, created_by: user.id, title, content })
    if (error) toast.error(error.message); else { setOpen(false); setTitle(''); setContent(''); load() }
  }
  const remove = async (id: string) => { await (supabase as any).from('ai_knowledge_documents').delete().eq('id', id); load() }
  return <div className="space-y-6"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpen className="h-6 w-6" />Base de conhecimento</h1><p className="mt-1 text-sm text-muted-foreground">Documentos autorizados para consulta dos agentes OpenAI.</p></div><div className="flex gap-3"><Select value={agentId} onValueChange={setAgentId}><SelectTrigger className="max-w-sm"><SelectValue placeholder="Selecione um agente" /></SelectTrigger><SelectContent>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}</SelectContent></Select>{canConfigure && <Button disabled={!agentId} onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Documento</Button>}</div><div className="grid gap-3 md:grid-cols-2">{documents.map((document) => <Card key={document.id}><CardHeader className="flex-row items-start justify-between"><CardTitle className="text-base">{document.title}</CardTitle>{canConfigure && <Button size="icon" variant="ghost" onClick={() => remove(document.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</CardHeader><CardContent><p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">{document.content}</p></CardContent></Card>)}</div><Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={save}><DialogHeader><DialogTitle>Novo documento</DialogTitle></DialogHeader><div className="space-y-4 py-5"><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" /><Textarea required rows={12} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conteúdo autorizado..." /></div><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog></div>
}

export function Opportunities() {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const { contacts } = useContacts()
  const [rows, setRows] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [contactId, setContactId] = useState('')
  const [amount, setAmount] = useState('')
  const load = useCallback(async () => {
    if (!organizationId) return
    const { data } = await (supabase as any).from('opportunities').select('*, opportunity_items(*)').eq('organization_id', organizationId).order('created_at', { ascending: false })
    setRows(data || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !organizationId) return
    const { data, error } = await (supabase as any).from('opportunities').insert({ organization_id: organizationId, contact_id: contactId || null, title, stage: 'open', created_by: user.id, owner_user_id: user.id }).select('id').single()
    if (error) return toast.error(error.message)
    await (supabase as any).from('opportunity_items').insert({ opportunity_id: data.id, description: title, quantity: 1, unit_price: Number(amount || 0) })
    setOpen(false); setTitle(''); setAmount(''); setContactId(''); load()
  }
  const updateStage = async (id: string, stage: string) => { await (supabase as any).from('opportunities').update({ stage }).eq('id', id); load() }
  return <div className="space-y-6"><div className="flex justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><DollarSign className="h-6 w-6" />Oportunidades</h1><p className="text-sm text-muted-foreground">Propostas, produtos, valores e fechamento.</p></div><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova oportunidade</Button></div><Card><Table><TableHeader><TableRow><TableHead>Oportunidade</TableHead><TableHead>Contato</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.title}</TableCell><TableCell>{contacts.find((c) => c.id === row.contact_id)?.push_name || '—'}</TableCell><TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((row.opportunity_items || []).reduce((sum: number, item: any) => sum + Number(item.total || 0), 0))}</TableCell><TableCell><Select value={row.stage} onValueChange={(stage) => updateStage(row.id, stage)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Aberta</SelectItem><SelectItem value="won">Ganha</SelectItem><SelectItem value="lost">Perdida</SelectItem></SelectContent></Select></TableCell></TableRow>)}</TableBody></Table></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={save}><DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader><div className="space-y-4 py-5"><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da proposta" /><Select value={contactId} onValueChange={setContactId}><SelectTrigger><SelectValue placeholder="Contato" /></SelectTrigger><SelectContent>{contacts.map((contact) => <SelectItem key={contact.id} value={contact.id}>{contact.push_name || contact.phone_number}</SelectItem>)}</SelectContent></Select><Input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor" /></div><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></DialogContent></Dialog></div>
}
