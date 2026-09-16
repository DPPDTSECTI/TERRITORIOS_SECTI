-- ====================================================================
-- ETAPA 3.0 — SUÍTE DE CHECAGENS DE INTEGRIDADE PÓS-MIGRAÇÃO
-- Executa 10 testes de consistência territorial, cartográfica e cadastral.
-- ====================================================================

-- 1. Checagem de IDs Duplicados
SELECT id_ativo, COUNT(*) AS duplicidades
FROM lista_ativos_cti
GROUP BY id_ativo
HAVING COUNT(*) > 1;

-- 2. Checagem de Registros sem Município
SELECT id_ativo, nome_ativo
FROM lista_ativos_cti
WHERE municipio IS NULL OR TRIM(municipio) = '';

-- 3. Checagem de Integridade Territorial (id_territorio entre 1 e 27)
SELECT id_ativo, nome_ativo, id_territorio
FROM lista_ativos_cti
WHERE id_territorio IS NULL OR id_territorio < 1 OR id_territorio > 27;

-- 4. Checagem de Coordenadas Geográficas Válidas na Bahia
-- Bahia latitude range: -18.5 a -8.5 / longitude range: -46.5 a -37.0
SELECT id_ativo, nome_ativo, latitude, longitude
FROM lista_ativos_cti
WHERE latitude IS NULL OR longitude IS NULL
   OR latitude > -8.0 OR latitude < -19.0
   OR longitude > -36.0 OR longitude < -47.0;

-- 5. Checagem de Coordenadas Idênticas entre Registros Distintos
SELECT latitude, longitude, COUNT(*) AS pontos_sobrepostos, STRING_AGG(id_ativo::text, ', ') AS ids
FROM lista_ativos_cti
GROUP BY latitude, longitude
HAVING COUNT(*) > 1;

-- 6. Checagem do Registro Inativo (ID 164)
SELECT id_ativo, nome_ativo, ativo
FROM lista_ativos_cti
WHERE id_ativo = 164;

-- 7. Checagem dos 6 Polos EAD Segregados
SELECT id_ativo, nome_ativo, tipo, id_tipo_ativo
FROM lista_ativos_cti
WHERE id_ativo IN (23, 38, 64, 92, 112, 158);

-- 8. Checagem dos 7 Campi Técnicos
SELECT id_ativo, nome_ativo, tipo, id_tipo_ativo
FROM lista_ativos_cti
WHERE id_ativo IN (5, 27, 58, 71, 83, 174, 188);

-- 9. Checagem de Consistência da Reitoria UFSB vs Campus Jorge Amado (BLK-01)
SELECT id_ativo, nome_ativo, tipo, latitude, longitude
FROM lista_ativos_cti
WHERE id_ativo IN (75, 76);

-- 10. Balanço Geral de Quantitativos Físicos vs Totais
SELECT 
  COUNT(*) AS total_geral,
  SUM(CASE WHEN tipo NOT IN ('Polo EAD') AND (ativo IS NULL OR ativo = TRUE) THEN 1 ELSE 0 END) AS infraestrutura_fisica_ativa,
  SUM(CASE WHEN tipo = 'Polo EAD' THEN 1 ELSE 0 END) AS total_ead,
  SUM(CASE WHEN ativo = FALSE THEN 1 ELSE 0 END) AS total_inativas
FROM lista_ativos_cti;
