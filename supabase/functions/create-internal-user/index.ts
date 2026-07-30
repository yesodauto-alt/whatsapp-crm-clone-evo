import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anonKey || !serviceKey) throw new Error('Supabase não configurado')

    const authorization = req.headers.get('Authorization')
    if (!authorization) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) throw new Error('Sessão inválida')

    const { organizationId, teamId, email, password, fullName, role = 'agent', isLeader = false } = await req.json()
    if (!organizationId || !email || !password || !fullName) throw new Error('Dados obrigatórios ausentes')
    if (!['admin', 'team_lead', 'agent'].includes(role)) throw new Error('Perfil inválido')

    const { data: membership } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .maybeSingle()
    const globalAdmin = await admin.from('user_roles').select('role').eq('user_id', authData.user.id).eq('role', 'super_admin').maybeSingle()
    const isSuperAdmin = membership?.role === 'super_admin' || !!globalAdmin.data
    const isAdmin = membership?.role === 'admin'
    if (!isSuperAdmin && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Sem permissão para cadastrar usuários' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (role === 'admin' && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Somente o Super Admin pode cadastrar administradores' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { organization_id: organizationId, role },
    })
    if (createError) throw createError

    await admin.from('profiles').upsert({ id: created.user.id, email: created.user.email, full_name: fullName })
    await admin.from('organization_members').upsert({
      organization_id: organizationId,
      user_id: created.user.id,
      role,
      is_active: true,
    }, { onConflict: 'organization_id,user_id' })
    if (teamId) {
      await admin.from('team_members').upsert({
        team_id: teamId,
        user_id: created.user.id,
        is_leader: isLeader,
      }, { onConflict: 'team_id,user_id' })
    }

    return new Response(JSON.stringify({ userId: created.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Falha ao cadastrar usuário' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
