-- Onda 0.1: Snapshots integrais pré-migração institucional (somente preservação)

-- 1. Snapshot integral de ativos_cti (245 registros)
CREATE TABLE public.backup_ativos_cti_pre_migracao (LIKE public.ativos_cti);
ALTER TABLE public.backup_ativos_cti_pre_migracao
  ADD CONSTRAINT backup_ativos_cti_pre_migracao_pkey PRIMARY KEY (id_ativo);
INSERT INTO public.backup_ativos_cti_pre_migracao
SELECT * FROM public.ativos_cti ORDER BY id_ativo;

-- 2. Snapshot integral de tipo_ativos (10 registros)
CREATE TABLE public.backup_tipo_ativos_pre_migracao (LIKE public.tipo_ativos);
ALTER TABLE public.backup_tipo_ativos_pre_migracao
  ADD CONSTRAINT backup_tipo_ativos_pre_migracao_pkey PRIMARY KEY (id_tipo_ativo);
INSERT INTO public.backup_tipo_ativos_pre_migracao
SELECT * FROM public.tipo_ativos ORDER BY id_tipo_ativo;

-- 3. Snapshot integral de referencias (52 registros)
CREATE TABLE public.backup_referencias_pre_migracao (LIKE public.referencias);
ALTER TABLE public.backup_referencias_pre_migracao
  ADD CONSTRAINT backup_referencias_pre_migracao_pkey PRIMARY KEY (id_referencia);
INSERT INTO public.backup_referencias_pre_migracao
SELECT * FROM public.referencias ORDER BY id_referencia;

-- 4. Snapshot baseline de stats_ti (27 territórios — Etapa 2.5 Ajuste 4)
CREATE TABLE public.backup_stats_ti_pre_migracao AS
SELECT * FROM public.stats_ti ORDER BY id_territorio;
ALTER TABLE public.backup_stats_ti_pre_migracao
  ALTER COLUMN id_territorio SET NOT NULL,
  ADD CONSTRAINT backup_stats_ti_pre_migracao_pkey PRIMARY KEY (id_territorio);

-- Metadados de preservação
COMMENT ON TABLE public.backup_ativos_cti_pre_migracao IS 'Onda 0.1 — Snapshot imutável pré-migração de public.ativos_cti (preservação).';
COMMENT ON TABLE public.backup_tipo_ativos_pre_migracao IS 'Onda 0.1 — Snapshot imutável pré-migração de public.tipo_ativos (preservação).';
COMMENT ON TABLE public.backup_referencias_pre_migracao IS 'Onda 0.1 — Snapshot imutável pré-migração de public.referencias (preservação).';
COMMENT ON TABLE public.backup_stats_ti_pre_migracao IS 'Onda 0.1 — Snapshot baseline imutável pré-migração de public.stats_ti (preservação).';

-- Isolamento da Data API (RLS habilitado sem policies + REVOKE de PUBLIC, anon e authenticated)
ALTER TABLE public.backup_ativos_cti_pre_migracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_tipo_ativos_pre_migracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_referencias_pre_migracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_stats_ti_pre_migracao ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.backup_ativos_cti_pre_migracao FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.backup_tipo_ativos_pre_migracao FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.backup_referencias_pre_migracao FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.backup_stats_ti_pre_migracao FROM PUBLIC, anon, authenticated;

-- Proteção de imutabilidade em nível de banco (bloqueia INSERT, UPDATE, DELETE e TRUNCATE acidentais)
CREATE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Tabela de backup imutável da Onda 0.1 (%): operação % bloqueada.', TG_TABLE_NAME, TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_imutavel_backup_ativos_dml
  BEFORE INSERT OR UPDATE OR DELETE ON public.backup_ativos_cti_pre_migracao
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();
CREATE TRIGGER trg_imutavel_backup_ativos_truncate
  BEFORE TRUNCATE ON public.backup_ativos_cti_pre_migracao
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();

CREATE TRIGGER trg_imutavel_backup_tipo_ativos_dml
  BEFORE INSERT OR UPDATE OR DELETE ON public.backup_tipo_ativos_pre_migracao
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();
CREATE TRIGGER trg_imutavel_backup_tipo_ativos_truncate
  BEFORE TRUNCATE ON public.backup_tipo_ativos_pre_migracao
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();

CREATE TRIGGER trg_imutavel_backup_referencias_dml
  BEFORE INSERT OR UPDATE OR DELETE ON public.backup_referencias_pre_migracao
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();
CREATE TRIGGER trg_imutavel_backup_referencias_truncate
  BEFORE TRUNCATE ON public.backup_referencias_pre_migracao
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();

CREATE TRIGGER trg_imutavel_backup_stats_ti_dml
  BEFORE INSERT OR UPDATE OR DELETE ON public.backup_stats_ti_pre_migracao
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();
CREATE TRIGGER trg_imutavel_backup_stats_ti_truncate
  BEFORE TRUNCATE ON public.backup_stats_ti_pre_migracao
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bloquear_alteracao_backup_onda_0_1();