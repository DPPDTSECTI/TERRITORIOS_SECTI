-- ====================================================================
-- ETAPA 3.0 — DRY-RUN DE SANEAMENTO E MIGRAÇÃO TERRITORIAL SECTI
-- Data: 2026-09-16T14:22:56.737Z
-- IMPORTANTE: ESTA TRANSAÇÃO CONTÉM EXCLUSIVAMENTE DIAGNÓSTICOS E SIMULAÇÕES.
-- NENHUMA ALTERAÇÃO É CONFIRMADA (ENCERRAMENTO OBRIGATÓRIO COM ROLLBACK).
-- ====================================================================

BEGIN;

-- 1. VALIDAÇÃO DE CONTEXTO E DIAGNÓSTICO PRÉVIO
SELECT 'Iniciando Dry-Run de Migração Canônica...' AS status, NOW() AS timestamp;

-- 1.1 Contagem prévia da lista de ativos
SELECT COUNT(*) AS total_ativos_atual FROM lista_ativos_cti;

-- 1.2 Diagnóstico BLK-01 (UFSB Itabuna)
SELECT id_ativo, nome_ativo, sigla, tipo, latitude, longitude
FROM lista_ativos_cti
WHERE id_ativo IN (75, 76);

-- 1.3 Diagnóstico BLK-02 (6 Polos EAD)
SELECT id_ativo, nome_ativo, sigla, municipio, tipo
FROM lista_ativos_cti
WHERE id_ativo IN (23, 38, 64, 92, 112, 158);

-- 1.4 Diagnóstico BLK-03 (Ubaitaba ID 174)
SELECT id_ativo, nome_ativo, municipio, latitude, longitude
FROM lista_ativos_cti
WHERE id_ativo = 174;

-- 1.5 Diagnóstico BLK-04 (UNIRB Serrinha ID 164)
SELECT id_ativo, nome_ativo, municipio, tipo
FROM lista_ativos_cti
WHERE id_ativo = 164;

-- 1.6 Diagnóstico BLK-05 (7 Campi Técnicos)
SELECT id_ativo, nome_ativo, sigla, municipio, tipo
FROM lista_ativos_cti
WHERE id_ativo IN (5, 27, 58, 71, 83, 174, 188);


-- 2. SIMULAÇÃO DE ESTRUTURAÇÃO (DDL NÃO DESTRUTIVO HIPOTÉTICO)
-- Adiciona coluna 'ativo' se não existir para suporte a desativação lógica
ALTER TABLE lista_ativos_cti ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Insere novas categorias na tabela de domínio 'tipo_ativos'
INSERT INTO tipo_ativos (id_tipo_ativo, nome_tipo)
VALUES 
  (101, 'Ensino Superior Presencial'),
  (102, 'Ensino Técnico'),
  (103, 'Pesquisa e Extensão'),
  (104, 'Administrativo'),
  (105, 'Polo EAD'),
  (106, 'Ensino Superior (Ambígua)'),
  (107, 'Inativa')
ON CONFLICT (id_tipo_ativo) DO NOTHING;


-- 3. SIMULAÇÃO DE ATUALIZAÇÕES (DML CONTROLADO DE 18 REGISTROS)

-- 3.1 [BLK-04] Desativação Lógica de UNIRB Serrinha
UPDATE lista_ativos_cti
SET ativo = FALSE
WHERE id_ativo = 164;

-- 3.2 [BLK-01] Resolução da Reitoria UFSB Itabuna
UPDATE lista_ativos_cti
SET 
  nome_ativo = 'Universidade Federal do Sul da Bahia - Reitoria e Sede Administrativa',
  tipo = 'Administrativo',
  id_tipo_ativo = 104
WHERE id_ativo = 75;

-- 3.3 [BLK-02] Segregação dos 6 Polos EAD
UPDATE lista_ativos_cti
SET 
  tipo = 'Polo EAD',
  id_tipo_ativo = 105
WHERE id_ativo IN (23, 38, 64, 92, 112, 158);

-- 3.4 [BLK-05] Reclassificação dos 7 Campi Técnicos
UPDATE lista_ativos_cti
SET 
  tipo = 'Ensino Técnico',
  id_tipo_ativo = 102
WHERE id_ativo IN (5, 27, 58, 71, 83, 174, 188);

-- 3.5 Reclassificação dos Centros de Pesquisa e Extensão
UPDATE lista_ativos_cti
SET 
  tipo = 'Pesquisa e Extensão',
  id_tipo_ativo = 103
WHERE id_ativo IN (28, 88);

-- 3.6 Reclassificação da Reitoria IF Baiano
UPDATE lista_ativos_cti
SET 
  nome_ativo = 'Instituto Federal Baiano - Reitoria',
  tipo = 'Administrativo',
  id_tipo_ativo = 104
WHERE id_ativo = 132;


-- 4. DIAGNÓSTICO PÓS-SIMULAÇÃO (CHECAGEM DENTRO DA TRANSAÇÃO)
SELECT 
  tipo, 
  COUNT(*) AS total,
  SUM(CASE WHEN ativo = TRUE THEN 1 ELSE 0 END) AS total_ativos,
  SUM(CASE WHEN ativo = FALSE THEN 1 ELSE 0 END) AS total_inativos
FROM lista_ativos_cti
GROUP BY tipo
ORDER BY total DESC;

SELECT 'Validação concluída com sucesso. Nenhuma alteração persistida.' AS status;

-- OBRIGATÓRIO: NENHUM COMMIT É EXECUTADO. REVERSÃO TOTAL DA TRANSAÇÃO.
ROLLBACK;
