-- ====================================================================
-- ETAPA 3.0 — SCRIPT DE ROLLBACK INTEGRAL
-- Reverte com exatidão qualquer alteração aplicada pelo plano de migração.
-- ====================================================================

BEGIN;

-- 1. Reverte desativação da UNIRB Serrinha
UPDATE lista_ativos_cti
SET ativo = TRUE
WHERE id_ativo = 164;

-- 2. Reverte Reitoria UFSB (ID 75)
UPDATE lista_ativos_cti
SET 
  nome_ativo = 'UNIVERSIDADE FEDERAL DO SUL DA BAHIA',
  tipo = 'Campi Universidade Pública - Federal',
  id_tipo_ativo = 8
WHERE id_ativo = 75;

-- 3. Reverte 6 Polos EAD
UPDATE lista_ativos_cti
SET 
  tipo = CASE 
    WHEN id_ativo IN (23, 112) THEN 'Campi Universidade Privada'
    ELSE 'Campi Instituto Federal'
  END,
  id_tipo_ativo = CASE 
    WHEN id_ativo IN (23, 112) THEN 9
    ELSE 5
  END
WHERE id_ativo IN (23, 38, 64, 92, 112, 158);

-- 4. Reverte 7 Campi Técnicos para Campi Instituto Federal
UPDATE lista_ativos_cti
SET 
  tipo = 'Campi Instituto Federal',
  id_tipo_ativo = 5
WHERE id_ativo IN (5, 27, 58, 71, 83, 174, 188);

-- 5. Reverte Centros de Pesquisa UNEB
UPDATE lista_ativos_cti
SET 
  tipo = 'Campi Universidade Pública - Estadual',
  id_tipo_ativo = 7
WHERE id_ativo IN (28, 88);

-- 6. Reverte Reitoria IF Baiano
UPDATE lista_ativos_cti
SET 
  nome_ativo = 'Instituto Federal de Educação, Ciência e Tecnologia Baiano',
  tipo = 'Campi Instituto Federal',
  id_tipo_ativo = 5
WHERE id_ativo = 132;

-- 7. Remove categorias customizadas criadas em tipo_ativos
DELETE FROM tipo_ativos
WHERE id_tipo_ativo IN (101, 102, 103, 104, 105, 106, 107);

COMMIT;
