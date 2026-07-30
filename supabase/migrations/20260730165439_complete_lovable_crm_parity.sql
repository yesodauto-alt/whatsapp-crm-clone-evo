CREATE TABLE IF NOT EXISTS public.contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('note', 'follow_up', 'task')),
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.support_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.crm_automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  automation_id uuid NOT NULL REFERENCES public.crm_automations(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_activities_member ON public.contact_activities FOR ALL TO authenticated
  USING (private.is_org_member(organization_id))
  WITH CHECK (created_by = auth.uid() AND private.is_org_member(organization_id));
CREATE POLICY support_comments_member ON public.support_ticket_comments FOR ALL TO authenticated
  USING (private.is_org_member(organization_id))
  WITH CHECK (created_by = auth.uid() AND private.is_org_member(organization_id));
CREATE POLICY knowledge_documents_select_member ON public.ai_knowledge_documents FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY knowledge_documents_manage_admin ON public.ai_knowledge_documents FOR ALL TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]))
  WITH CHECK (created_by = auth.uid() AND private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));
CREATE POLICY automation_logs_select_member ON public.crm_automation_logs FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY automation_logs_insert_admin ON public.crm_automation_logs FOR INSERT TO authenticated
  WITH CHECK (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));
CREATE POLICY organization_settings_select_member ON public.organization_settings FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY organization_settings_manage_admin ON public.organization_settings FOR ALL TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]))
  WITH CHECK (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.contact_activities,
  public.support_ticket_comments,
  public.ai_knowledge_documents,
  public.crm_automation_logs,
  public.organization_settings
TO authenticated;

CREATE INDEX IF NOT EXISTS contact_activities_contact_idx ON public.contact_activities(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_comments_ticket_idx ON public.support_ticket_comments(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS knowledge_documents_agent_idx ON public.ai_knowledge_documents(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_logs_automation_idx ON public.crm_automation_logs(automation_id, created_at DESC);
