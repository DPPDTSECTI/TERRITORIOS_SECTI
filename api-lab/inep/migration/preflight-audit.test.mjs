import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { haversine } from './run-preflight-audit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PREFLIGHT_JSON = path.resolve(__dirname, 'preflight-audit.json');
const FILE_PREFLIGHT_MD = path.resolve(__dirname, 'preflight-audit.md');

describe('ETAPA 3.1 — Testes da Auditoria Pré-Transação', () => {
  it('arquivos preflight-audit.json e preflight-audit.md devem existir', () => {
    expect(fs.existsSync(FILE_PREFLIGHT_JSON)).toBe(true);
    expect(fs.existsSync(FILE_PREFLIGHT_MD)).toBe(true);
  });

  const auditPayload = JSON.parse(fs.readFileSync(FILE_PREFLIGHT_JSON, 'utf-8'));
  const { resumo_seguranca, auditoria_geodesica_blk03, schema_producao_auditado, itens_auditados } = auditPayload;

  it('regra crítica de segurança: ready_for_transaction deve ser estritamente FALSE', () => {
    expect(resumo_seguranca.ready_for_transaction).toBe(false);
    expect(resumo_seguranca.blocked).toBeGreaterThan(0);
    expect(resumo_seguranca.review_required).toBeGreaterThan(0);
    expect(resumo_seguranca.blocked_inserts).toBe(50);
  });

  it('BLK-01 (UFSB Itabuna): deve marcar aprovado_tecnicamente = false e REVIEW_REQUIRED', () => {
    const item75 = itens_auditados.find(i => i.id_ativo === 75);
    expect(item75).toBeDefined();
    expect(item75.aprovado_tecnicamente).toBe(false);
    expect(item75.classificacao_seguranca).toBe('REVIEW_REQUIRED');
    expect(item75.confianca).toBe('baixa');
  });

  it('BLK-03 (Ubaitaba ID 174): recálculo geodésico deve atestar distância de ~237 metros, refutando 15 km', () => {
    const latOrig = auditoria_geodesica_blk03.latitude_original;
    const lonOrig = auditoria_geodesica_blk03.longitude_original;
    const latRef = auditoria_geodesica_blk03.latitude_referencia;
    const lonRef = auditoria_geodesica_blk03.longitude_referencia;

    const calc = haversine(latOrig, lonOrig, latRef, lonRef);
    expect(calc).toBeGreaterThan(200);
    expect(calc).toBeLessThan(250);
    expect(auditoria_geodesica_blk03.distancia_metros).toBeCloseTo(237.35, 1);
    expect(auditoria_geodesica_blk03.review_required).toBe(true);
    expect(auditoria_geodesica_blk03.recomendacao_final).toBe('NO_CHANGE');
  });

  it('BLK-04 (UNIRB Serrinha ID 164): deve acusar MIGRATION_SCHEMA_CHANGE e ser classificado como BLOCKED', () => {
    const item164 = itens_auditados.find(i => i.id_ativo === 164);
    expect(item164).toBeDefined();
    expect(item164.classificacao_seguranca).toBe('BLOCKED');
    expect(item164.aprovado_tecnicamente).toBe(false);
    expect(item164.motivo_bloqueio).toContain('MIGRATION_SCHEMA_CHANGE');
    expect(schema_producao_auditado.tabelas.lista_ativos_cti.coluna_ativo_existe).toBe(false);
  });

  it('BLK-05 (Campi Técnicos): deve vetar id_tipo_ativo inexistente (102) e ser classificado como BLOCKED', () => {
    const tecnicos = itens_auditados.filter(i => [5, 27, 58, 71, 83, 188].includes(i.id_ativo));
    expect(tecnicos.length).toBe(6);
    for (const t of tecnicos) {
      expect(t.classificacao_seguranca).toBe('BLOCKED');
      expect(t.aprovado_tecnicamente).toBe(false);
      expect(t.motivo_bloqueio).toContain('VIOLACAO_FK');
    }
    // Confirma que tipo_ativos em produção só aceita 1 a 10
    expect(schema_producao_auditado.tabelas.tipo_ativos.ids_validos_em_producao).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('BLK-02 (Polos EAD): deve vetar id_tipo_ativo 105 e ser classificado como BLOCKED', () => {
    const eads = itens_auditados.filter(i => [23, 38, 64, 92, 112, 158].includes(i.id_ativo));
    expect(eads.length).toBe(6);
    for (const e of eads) {
      expect(e.classificacao_seguranca).toBe('BLOCKED');
      expect(e.aprovado_tecnicamente).toBe(false);
    }
  });

  it('todos os itens auditados devem conter schema de resposta completo', () => {
    for (const item of itens_auditados) {
      expect(typeof item.id_ativo).toBe('number');
      expect(typeof item.campo).toBe('string');
      expect(item.valor_atual).toBeDefined();
      expect(item.valor_proposto).toBeDefined();
      expect(typeof item.evidencia).toBe('string');
      expect(typeof item.fonte_evidencia).toBe('string');
      expect(['alta', 'media', 'baixa']).toContain(item.confianca);
      expect(typeof item.aprovado_tecnicamente).toBe('boolean');
      expect(['SAFE', 'REVIEW_REQUIRED', 'BLOCKED']).toContain(item.classificacao_seguranca);
    }
  });
});
