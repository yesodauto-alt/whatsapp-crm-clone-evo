CREATE TABLE IF NOT EXISTS public.crm_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'telegram')),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, channel_type)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL CHECK (length(btrim(subject)) > 0),
  description text NOT NULL CHECK (length(btrim(description)) > 0),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  description text NOT NULL DEFAULT '',
  trigger_type text NOT NULL DEFAULT 'manual',
  action_type text NOT NULL DEFAULT 'notify',
  is_active boolean NOT NULL DEFAULT true,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_channels_select_member ON public.crm_channels
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY crm_channels_manage_admin ON public.crm_channels
  FOR ALL TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]))
  WITH CHECK (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]));

CREATE POLICY support_tickets_select_member ON public.support_tickets
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY support_tickets_insert_member ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND private.is_org_member(organization_id));
CREATE POLICY support_tickets_update_owner_or_admin ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[])
  )
  WITH CHECK (
    created_by = auth.uid()
    OR private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[])
  );
CREATE POLICY support_tickets_delete_owner_or_admin ON public.support_tickets
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[])
  );

CREATE POLICY message_templates_select_member ON public.message_templates
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY message_templates_manage_member ON public.message_templates
  FOR ALL TO authenticated
  USING (private.is_org_member(organization_id))
  WITH CHECK (created_by = auth.uid() AND private.is_org_member(organization_id));

CREATE POLICY crm_automations_select_member ON public.crm_automations
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY crm_automations_manage_admin ON public.crm_automations
  FOR ALL TO authenticated
  USING (private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[]))
  WITH CHECK (
    created_by = auth.uid()
    AND private.has_org_role(organization_id, ARRAY['super_admin', 'admin']::public.app_role[])
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.crm_channels,
  public.support_tickets,
  public.message_templates,
  public.crm_automations
TO authenticated;

CREATE INDEX IF NOT EXISTS crm_channels_organization_idx
  ON public.crm_channels(organization_id);
CREATE INDEX IF NOT EXISTS support_tickets_organization_status_idx
  ON public.support_tickets(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS message_templates_organization_idx
  ON public.message_templates(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_automations_organization_idx
  ON public.crm_automations(organization_id, created_at DESC);
