import { FormEvent, useState } from 'react'
import { Crown, KeyRound, Loader2, MailPlus, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { useTeams } from '@/hooks/use-teams'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { toast } from 'sonner'

export default function Teams() {
  const { teams, loading, canConfigure, createTeam, addExistingMember, createInvite, removeMember } = useTeams()
  const { organizationId } = useOrganization()
  const [createOpen, setCreateOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [leader, setLeader] = useState(false)
  const [invite, setInvite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const [internal, setInternal] = useState({ fullName: '', email: '', password: '', role: 'agent', teamId: '', isLeader: false })

  const submitTeam = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true)
    try { await createTeam({ name, description, color: '#6366f1' }); setCreateOpen(false); setName(''); setDescription('') }
    catch (error: any) { toast.error(error.message) } finally { setSaving(false) }
  }
  const submitMember = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTeam) return
    setSaving(true)
    try {
      if (invite) await createInvite({ teamId: selectedTeam, email, role: leader ? 'team_lead' : 'agent' })
      else await addExistingMember(selectedTeam, email, leader)
      setMemberOpen(false); setEmail(''); setLeader(false); setInvite(false)
    } catch (error: any) { toast.error(error.message) } finally { setSaving(false) }
  }
  const submitInternal = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.functions.invoke('create-internal-user', {
        body: { ...internal, organizationId },
      })
      if (error) throw error
      toast.success('Usuário interno criado e vinculado')
      setInternalOpen(false)
      setInternal({ fullName: '', email: '', password: '', role: 'agent', teamId: '', isLeader: false })
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível cadastrar o usuário')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Equipes</h1><p className="mt-1 text-sm text-muted-foreground">Gerencie usuários, líderes e a atribuição das conversas.</p></div>{canConfigure && <div className="flex gap-2"><Button variant="outline" onClick={() => setInternalOpen(true)}><KeyRound className="mr-2 h-4 w-4" />Usuário interno</Button><Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova equipe</Button></div>}</div>
      {loading ? <Loader2 className="mx-auto h-7 w-7 animate-spin" /> : <div className="grid gap-4 md:grid-cols-2">{teams.map((team) => (
        <Card key={team.id}>
          <CardHeader><div className="flex items-start justify-between"><div className="flex gap-3"><div className="rounded-lg p-2 text-white" style={{ background: team.color }}><Users className="h-5 w-5" /></div><div><CardTitle className="text-lg">{team.name}</CardTitle><CardDescription>{team.description || 'Sem descrição'} · {team.members.length} membro(s)</CardDescription></div></div>{canConfigure && <Button variant="outline" size="sm" onClick={() => { setSelectedTeam(team.id); setMemberOpen(true) }}><UserPlus className="mr-2 h-4 w-4" />Adicionar</Button>}</div></CardHeader>
          <CardContent className="space-y-2">{team.members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-lg border p-3"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback>{(member.full_name || member.email || 'U')[0].toUpperCase()}</AvatarFallback></Avatar><div><p className="text-sm font-semibold">{member.full_name || 'Usuário'}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div><div className="flex items-center gap-2">{member.is_leader && <Badge><Crown className="mr-1 h-3 w-3" />Líder</Badge>}{canConfigure && <Button size="icon" variant="ghost" onClick={() => removeMember(member.id).catch((e) => toast.error(e.message))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></div>)}{team.members.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum membro vinculado.</p>}</CardContent>
        </Card>
      ))}</div>}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><form onSubmit={submitTeam}><DialogHeader><DialogTitle>Nova equipe</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>Nome</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div></div><DialogFooter><Button disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}><DialogContent><form onSubmit={submitMember}><DialogHeader><DialogTitle>Adicionar usuário à equipe</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>E-mail do usuário</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={leader} onCheckedChange={(value) => setLeader(!!value)} />Líder do time</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={invite} onCheckedChange={(value) => setInvite(!!value)} /><MailPlus className="h-4 w-4" />Enviar convite caso ainda não esteja cadastrado</label></div><DialogFooter><Button disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Vincular usuário</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={internalOpen} onOpenChange={setInternalOpen}><DialogContent><form onSubmit={submitInternal}><DialogHeader><DialogTitle>Cadastrar usuário interno</DialogTitle></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label>Nome completo</Label><Input required value={internal.fullName} onChange={(e) => setInternal({ ...internal, fullName: e.target.value })} /></div><div className="space-y-2"><Label>E-mail de acesso</Label><Input type="email" required value={internal.email} onChange={(e) => setInternal({ ...internal, email: e.target.value })} /></div><div className="space-y-2"><Label>Senha inicial</Label><Input type="password" required minLength={8} value={internal.password} onChange={(e) => setInternal({ ...internal, password: e.target.value })} /></div><div className="space-y-2"><Label>Permissão</Label><Select value={internal.role} onValueChange={(role) => setInternal({ ...internal, role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="team_lead">Líder de equipe</SelectItem><SelectItem value="agent">Agente</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Equipe</Label><Select value={internal.teamId} onValueChange={(teamId) => setInternal({ ...internal, teamId })}><SelectTrigger><SelectValue placeholder="Selecione uma equipe" /></SelectTrigger><SelectContent>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={internal.isLeader} onCheckedChange={(value) => setInternal({ ...internal, isLeader: !!value })} />Líder da equipe selecionada</label></div><DialogFooter><Button disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cadastrar usuário</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  )
}
