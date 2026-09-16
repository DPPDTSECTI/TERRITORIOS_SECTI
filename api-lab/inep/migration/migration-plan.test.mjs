import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PLAN_JSON = path.resolve(__dirname, 'migration-plan.json');
const FILE_PENDING_INSERT_JSON = path.resolve(__dirname, 'pending_insert.json');
const FILE_PLAN_MD = path.resolve(__dirname, 'migration-plan.md');
const FILE_DRY_RUN_SQL = path.resolve(__dirname, 'migration-dry-run.sql');
const FILE_ROLLBACK_SQL = path.resolve(__dirname, 'migration-rollback.sql');
const FILE_CHECKS_SQL = path.resolve(__dirname, 'migration-checks.sql');

describe('ETAPA 3.0 — Testes do Plano de Migração e Dry-Run', () => {
  it('todos os 6 arquivos do plano de migração devem existir', () => {
    expect(fs.existsSync(FILE_PLAN_JSON)).toBe(true);
    expect(fs.existsSync(FILE_PENDING_INSERT_JSON)).toBe(true);
    expect(fs.existsSync(FILE_PLAN_MD)).toBe(true);
    expect(fs.existsSync(FILE_DRY_RUN_SQL)).toBe(true);
    expect(fs.existsSync(FILE_ROLLBACK_SQL)).toBe(true);
    expect(fs.existsSync(FILE_CHECKS_SQL)).toBe(true);
  });

  const planPayload = JSON.parse(fs.readFileSync(FILE_PLAN_JSON, 'utf-8'));
  const pendingInserts = JSON.parse(fs.readFileSync(FILE_PENDING_INSERT_JSON, 'utf-8'));
  const dryRunSql = fs.readFileSync(FILE_DRY_RUN_SQL, 'utf-8');

  it('migration-dry-run.sql deve conter BEGIN e ROLLBACK obrigatórios, sem nenhum COMMIT', () => {
    expect(dryRunSql).toContain('BEGIN;');
    expect(dryRunSql).toContain('ROLLBACK;');
    // Não pode conter COMMIT não comentado
    const commitMatches = dryRunSql.split('\n').filter(l => !l.trim().startsWith('--') && l.includes('COMMIT'));
    expect(commitMatches.length).toBe(0);
  });

  it('pending_insert.json deve conter exatamente 50 registros com chaves de idempotência únicas', () => {
    expect(pendingInserts.length).toBe(50);
    const keys = pendingInserts.map(p => p.idempotency_key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(50);

    for (const p of pendingInserts) {
      expect(typeof p.nome).toBe('string');
      expect(typeof p.municipio).toBe('string');
      expect(typeof p.codigo_ibge).toBe('number');
      expect(typeof p.codigo_ies).toBe('number');
      expect(Array.isArray(p.coordenada)).toBe(true);
      expect(p.coordenada.length).toBe(2);
      expect(p.origem).toBe('inep');
    }
  });

  it('migration-plan.json deve conter a contagem correta de operações (17 UPDATE, 1 DEACTIVATE, 156 NO_CHANGE, 50 INSERT)', () => {
    expect(planPayload.metadados.resumo_operacoes.UPDATE).toBe(17);
    expect(planPayload.metadados.resumo_operacoes.DEACTIVATE).toBe(1);
    expect(planPayload.metadados.resumo_operacoes.NO_CHANGE).toBe(156);
    expect(planPayload.metadados.resumo_operacoes.INSERT).toBe(50);
    expect(planPayload.metadados.resumo_operacoes.total).toBe(224);
  });

  it('cada operação do plano deve seguir o schema obrigatório', () => {
    const validOps = ['UPDATE', 'INSERT', 'DEACTIVATE', 'NO_CHANGE'];
    for (const op of planPayload.operacoes) {
      expect(validOps).toContain(op.operation);
      expect(typeof op.table).toBe('string');
      expect(typeof op.primary_key).toBe('string');
      expect(op.primary_key_value).toBeDefined();
      expect(typeof op.reason).toBe('string');
      expect(typeof op.source).toBe('string');
      if (op.operation !== 'INSERT') {
        expect(op.before).toBeDefined();
      }
      expect(op.after).toBeDefined();
    }
  });

  it('deve contemplar a resolução formal dos 5 bloqueadores (BLK-01 a BLK-05)', () => {
    expect(planPayload.resolucao_bloqueadores['BLK-01']).toBeDefined();
    expect(planPayload.resolucao_bloqueadores['BLK-02']).toBeDefined();
    expect(planPayload.resolucao_bloqueadores['BLK-03']).toBeDefined();
    expect(planPayload.resolucao_bloqueadores['BLK-04']).toBeDefined();
    expect(planPayload.resolucao_bloqueadores['BLK-05']).toBeDefined();

    // BLK-04: UNIRB Serrinha deve ser a única DEACTIVATE
    const deactivateOp = planPayload.operacoes.find(o => o.operation === 'DEACTIVATE');
    expect(deactivateOp.primary_key_value).toBe(164);
    expect(deactivateOp.after.ativo).toBe(false);

    // BLK-01: ID 75 deve ter UPDATE para Administrativo
    const u75 = planPayload.operacoes.find(o => o.primary_key_value === 75);
    expect(u75.operation).toBe('UPDATE');
    expect(u75.after.tipo).toBe('Administrativo');
  });
});
