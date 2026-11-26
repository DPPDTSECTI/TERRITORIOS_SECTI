-- Onda 4.1: Cadastro dos novos ativos e instituições de referência
-- (CETAB, IRT, Bahiafarma e CEPEDI - Ilhéus)
-- Pré-requisito: executar após a Onda 4 (20261126135000_onda_4_reclassificacao_tipos_ativos_e_hubs.sql)

BEGIN;

-- Sincronizar sequences antes dos inserts
SELECT setval('public.referencias_id_referencia_seq', COALESCE((SELECT MAX(id_referencia) FROM public.referencias), 1), true);
SELECT setval('public.instituicoes_id_instituicao_seq', COALESCE((SELECT MAX(id_instituicao) FROM public.instituicoes), 1), true);
SELECT setval('public.ativos_cti_id_ativo_seq', COALESCE((SELECT MAX(id_ativo) FROM public.ativos_cti), 1), true);

-- ============================================================================
-- 1. REFERÊNCIAS
-- ============================================================================
INSERT INTO public.referencias (titulo_referencia, texto_referencia, url_referencia)
SELECT 'SEAGRI / CETAB', 'Portal da Secretaria da Agricultura, Pecuária, Irrigação, Pesca e Aquicultura da Bahia (CETAB).', 'https://www.agricultura.ba.gov.br'
WHERE NOT EXISTS (SELECT 1 FROM public.referencias WHERE url_referencia = 'https://www.agricultura.ba.gov.br');

INSERT INTO public.referencias (titulo_referencia, texto_referencia, url_referencia)
SELECT 'Portal Institucional IRT', 'Instituto Recôncavo de Tecnologia — Parque Tecnológico da Bahia.', 'https://reconcavo.org.br/'
WHERE NOT EXISTS (SELECT 1 FROM public.referencias WHERE url_referencia = 'https://reconcavo.org.br/');

INSERT INTO public.referencias (titulo_referencia, texto_referencia, url_referencia)
SELECT 'Portal Institucional Bahiafarma', 'Fundação Baiana de Pesquisa Científica e Desenvolvimento Tecnológico, Fornecimento e Distribuição de Medicamentos.', 'https://www.ba.gov.br/bahiafarma'
WHERE NOT EXISTS (SELECT 1 FROM public.referencias WHERE url_referencia = 'https://www.ba.gov.br/bahiafarma');

INSERT INTO public.referencias (titulo_referencia, texto_referencia, url_referencia)
SELECT 'Portal Institucional CEPEDI', 'Centro de Pesquisa e Desenvolvimento Tecnológico em Informática e Eletroeletrônica de Ilhéus.', 'https://cepedi.org.br/'
WHERE NOT EXISTS (SELECT 1 FROM public.referencias WHERE url_referencia = 'https://cepedi.org.br/');

-- ============================================================================
-- 2. INSTITUIÇÕES
-- ============================================================================
INSERT INTO public.instituicoes (nome_instituicao, sigla, ict_status, natureza_institucional, site_oficial, ativa)
SELECT 'Centro Tecnológico Agropecuário do Estado da Bahia', 'CETAB', 'nao', 'Pública Estadual', 'https://www.agricultura.ba.gov.br', true
WHERE NOT EXISTS (SELECT 1 FROM public.instituicoes WHERE UPPER(sigla) = 'CETAB');

INSERT INTO public.instituicoes (nome_instituicao, sigla, ict_status, natureza_institucional, site_oficial, ativa)
SELECT 'Instituto Recôncavo de Tecnologia', 'IRT', 'sim', 'Privada sem fins lucrativos', 'https://reconcavo.org.br/', true
WHERE NOT EXISTS (SELECT 1 FROM public.instituicoes WHERE UPPER(sigla) = 'IRT');

INSERT INTO public.instituicoes (nome_instituicao, sigla, ict_status, natureza_institucional, site_oficial, ativa)
SELECT 'Fundação Baiana de Pesquisa Científica e Desenvolvimento Tecnológico, Fornecimento e Distribuição de Medicamentos', 'BAHIAFARMA', 'sim', 'Pública Estadual', 'https://www.ba.gov.br/bahiafarma', true
WHERE NOT EXISTS (SELECT 1 FROM public.instituicoes WHERE UPPER(sigla) = 'BAHIAFARMA');

INSERT INTO public.instituicoes (nome_instituicao, sigla, ict_status, natureza_institucional, site_oficial, ativa)
SELECT 'Centro de Pesquisa e Desenvolvimento Tecnológico em Informática e Eletroeletrônica de Ilhéus', 'CEPEDI', 'sim', 'Privada sem fins lucrativos', 'https://cepedi.org.br/', true
WHERE NOT EXISTS (SELECT 1 FROM public.instituicoes WHERE UPPER(sigla) = 'CEPEDI');

-- ============================================================================
-- 3. ATIVOS CT&I (Tipo 1 = Centros e Unidades de Pesquisa)
-- ============================================================================

-- 3.1 CETAB (Salvador - id_municipio = 211)
INSERT INTO public.ativos_cti (
  nome_ativo, id_tipo_ativo, id_municipio, id_referencia, sigla, rnp, latitude, longitude, id_instituicao
)
SELECT
  'Centro Tecnológico Agropecuário do Estado da Bahia',
  1,
  211,
  (SELECT id_referencia FROM public.referencias WHERE url_referencia = 'https://www.agricultura.ba.gov.br' LIMIT 1),
  'CETAB',
  false,
  -13.0050,
  -38.5045,
  (SELECT id_instituicao FROM public.instituicoes WHERE UPPER(sigla) = 'CETAB' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.ativos_cti WHERE UPPER(sigla) = 'CETAB');

-- 3.2 IRT (Salvador - id_municipio = 211)
INSERT INTO public.ativos_cti (
  nome_ativo, id_tipo_ativo, id_municipio, id_referencia, sigla, rnp, latitude, longitude, id_instituicao
)
SELECT
  'Instituto Recôncavo de Tecnologia',
  1,
  211,
  (SELECT id_referencia FROM public.referencias WHERE url_referencia = 'https://reconcavo.org.br/' LIMIT 1),
  'IRT',
  false,
  -12.9234,
  -38.3881,
  (SELECT id_instituicao FROM public.instituicoes WHERE UPPER(sigla) = 'IRT' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.ativos_cti WHERE UPPER(sigla) = 'IRT');

-- 3.3 Bahiafarma (Simões Filho - id_municipio = 218)
INSERT INTO public.ativos_cti (
  nome_ativo, id_tipo_ativo, id_municipio, id_referencia, sigla, rnp, latitude, longitude, id_instituicao
)
SELECT
  'Fundação Baiana de Pesquisa Científica e Desenvolvimento Tecnológico (Bahiafarma)',
  1,
  218,
  (SELECT id_referencia FROM public.referencias WHERE url_referencia = 'https://www.ba.gov.br/bahiafarma' LIMIT 1),
  'BAHIAFARMA',
  false,
  -12.7880,
  -38.4120,
  (SELECT id_instituicao FROM public.instituicoes WHERE UPPER(sigla) = 'BAHIAFARMA' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.ativos_cti WHERE UPPER(sigla) = 'BAHIAFARMA');

-- 3.4 CEPEDI - Ilhéus (Ilhéus - id_municipio = 164)
INSERT INTO public.ativos_cti (
  nome_ativo, id_tipo_ativo, id_municipio, id_referencia, sigla, rnp, latitude, longitude, id_instituicao
)
SELECT
  'Centro de Pesquisa e Desenvolvimento Tecnológico em Informática e Eletroeletrônica de Ilhéus',
  1,
  164,
  (SELECT id_referencia FROM public.referencias WHERE url_referencia = 'https://cepedi.org.br/' LIMIT 1),
  'CEPEDI',
  false,
  -14.7882,
  -39.0428,
  (SELECT id_instituicao FROM public.instituicoes WHERE UPPER(sigla) = 'CEPEDI' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.ativos_cti WHERE UPPER(sigla) = 'CEPEDI');

COMMIT;
