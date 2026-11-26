-- Onda 4: Reclassificação de tipos de ativos legados (ICT -> Centros e Unidades de Pesquisa)
-- e criação/reclassificação do tipo 'Hub de Inovação'

BEGIN;

-- 1. Renomear 'Entidade de Pesquisa' (id_tipo_ativo = 1) para 'Centros e Unidades de Pesquisa'
UPDATE public.tipo_ativos
SET nome_tipo = 'Centros e Unidades de Pesquisa'
WHERE id_tipo_ativo = 1
  AND nome_tipo = 'Entidade de Pesquisa';

-- 2. Migrar registros legados do tipo 'ICT' (id_tipo_ativo = 3: Fiocruz 205 e Embrapa 226)
--    para 'Centros e Unidades de Pesquisa' (id_tipo_ativo = 1)
UPDATE public.ativos_cti
SET id_tipo_ativo = 1
WHERE id_tipo_ativo = 3;

-- 3. Remover o tipo obsoleto 'ICT' (id_tipo_ativo = 3) caso não haja mais ativos vinculados
DELETE FROM public.tipo_ativos
WHERE id_tipo_ativo = 3
  AND NOT EXISTS (
    SELECT 1 FROM public.ativos_cti WHERE id_tipo_ativo = 3
  );

-- 4. Garantir existência do tipo 'Hub de Inovação' (id_tipo_ativo = 11, alinhado com assetTypes.js)
INSERT INTO public.tipo_ativos (id_tipo_ativo, nome_tipo)
SELECT 11, 'Hub de Inovação'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tipo_ativos WHERE nome_tipo = 'Hub de Inovação' OR id_tipo_ativo = 11
);

SELECT setval(
  'public.tipos_ativos_id_tipo_ativo_seq',
  GREATEST((SELECT COALESCE(MAX(id_tipo_ativo), 1) FROM public.tipo_ativos), 11),
  true
);

-- 5. Reclassificar Hubs já cadastrados como Aceleradora (id_ativo 254 e 260) para 'Hub de Inovação'
UPDATE public.ativos_cti
SET id_tipo_ativo = (
  SELECT id_tipo_ativo FROM public.tipo_ativos WHERE nome_tipo = 'Hub de Inovação' LIMIT 1
)
WHERE id_ativo IN (254, 260)
  AND id_tipo_ativo = 10;

COMMIT;
