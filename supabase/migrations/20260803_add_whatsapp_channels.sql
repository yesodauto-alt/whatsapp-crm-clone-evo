-- Permite configurar múltiplos números de WhatsApp por organização.
-- 1) Inclui 'whatsapp' no CHECK de channel_type.
-- 2) Remove a restrição UNIQUE (organization_id, channel_type) para permitir
--    vários canais do mesmo tipo (ex.: vários números de WhatsApp).

ALTER TABLE public.crm_channels
  DROP CONSTRAINT IF EXISTS crm_channels_channel_type_check;

ALTER TABLE public.crm_channels
  ADD CONSTRAINT crm_channels_channel_type_check
  CHECK (channel_type IN ('email', 'telegram', 'whatsapp'));

ALTER TABLE public.crm_channels
  DROP CONSTRAINT IF EXISTS crm_channels_organization_id_channel_type_key;
