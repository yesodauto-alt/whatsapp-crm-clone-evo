ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Geral';

CREATE INDEX IF NOT EXISTS idx_message_templates_organization_category
  ON public.message_templates (organization_id, category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
