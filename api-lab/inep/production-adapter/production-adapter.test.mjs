import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adaptProductionToCanonical, validateCanonicalUnit } from './production-adapter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_OUTPUT_CANONICAL = path.resolve(__dirname, 'canonical-production-units.json');
const FILE_OUTPUT_PENDING = path.resolve(__dirname, 'pending-inep.json');
const FILE_OUTPUT_REPORT = path.resolve(__dirname, 'production-adapter-report.md');

describe('ETAPA 3.2 — Testes do Adapter de Produção para Modelo Canônico', () => {
  it('arquivos gerados pelo adapter devem existir no diretório', () => {
    expect(fs.existsSync(FILE_OUTPUT_CANONICAL)).toBe(true);
    expect(fs.existsSync(FILE_OUTPUT_PENDING)).toBe(true);
    expect(fs.existsSync(FILE_OUTPUT_REPORT)).toBe(true);
  });

  const payload = JSON.parse(fs.readFileSync(FILE_OUTPUT_CANONICAL, 'utf-8'));
  const pendingPayload = JSON.parse(fs.readFileSync(FILE_OUTPUT_PENDING, 'utf-8'));
  const units = payload.dados;

  it('deve converter exatamente os 174 registros legados da SECTI', () => {
    expect(units.length).toBe(174);
    expect(payload.metricas.total_unidades_legadas).toBe(174);
  });

  it('todos os 174 registros adaptados devem validar 100% contra o schema canônico', () => {
    for (let i = 0; i < units.length; i++) {
      const errs = validateCanonicalUnit(units[i], i);
      expect(errs.length).toBe(0);
    }
  });

  it('ID 75 e ID 76 (UFSB Itabuna) devem ser ambos preservados e rastreáveis', () => {
    const u75 = units.find(u => u.id_ativo === 75);
    const u76 = units.find(u => u.id_ativo === 76);

    expect(u75).toBeDefined();
    expect(u76).toBeDefined();
    expect(u75.id_ativo).toBe(75);
    expect(u76.id_ativo).toBe(76);
    expect(u76.tipo_unidade).toBe('ambigua');
    expect(u75.presenca_fisica).toBe(true);
    expect(u76.presenca_fisica).toBe(true);
  });

  it('os 6 polos EAD devem receber presenca_fisica = false e oferta_presencial = false', () => {
    const idsEad = [23, 38, 64, 92, 112, 158];
    const eadUnits = units.filter(u => idsEad.includes(u.id_ativo));
    expect(eadUnits.length).toBe(6);

    for (const u of eadUnits) {
      expect(u.tipo_unidade).toBe('ead');
      expect(u.presenca_fisica).toBe(false);
      expect(u.oferta_presencial).toBe(false);
      expect(u.modalidade).toBe('A distância');
      expect(u.ativo).toBe(true);
    }
  });

  it('os 7 campi técnicos devem receber tipo_unidade = ensino_tecnico e presenca_fisica = true', () => {
    const idsTec = [5, 27, 58, 71, 83, 174, 188];
    const tecUnits = units.filter(u => idsTec.includes(u.id_ativo));
    expect(tecUnits.length).toBe(7);

    for (const u of tecUnits) {
      expect(u.tipo_unidade).toBe('ensino_tecnico');
      expect(u.presenca_fisica).toBe(true);
      expect(u.oferta_presencial).toBe(true);
      expect(u.nivel_ensino).toContain('tecnico');
      expect(u.nivel_ensino).not.toContain('superior');
      expect(u.ativo).toBe(true);
    }
  });

  it('centros de pesquisa (28, 88) e reitoria (132) devem ter oferta_presencial = false', () => {
    const pesq = units.filter(u => [28, 88].includes(u.id_ativo));
    const reitoria = units.find(u => u.id_ativo === 132);

    expect(pesq.length).toBe(2);
    expect(reitoria).toBeDefined();

    for (const p of pesq) {
      expect(p.tipo_unidade).toBe('pesquisa_extensao');
      expect(p.presenca_fisica).toBe(true);
      expect(p.oferta_presencial).toBe(false);
    }
    expect(reitoria.tipo_unidade).toBe('administrativo');
    expect(reitoria.presenca_fisica).toBe(true);
    expect(reitoria.oferta_presencial).toBe(false);
  });

  it('UNIRB Serrinha (ID 164) deve ser adaptada como inativa com ativo = false', () => {
    const u164 = units.find(u => u.id_ativo === 164);
    expect(u164).toBeDefined();
    expect(u164.tipo_unidade).toBe('inativa');
    expect(u164.ativo).toBe(false);
    expect(u164.status_reconciliacao).toBe('nao_localizada');
    expect(u164.presenca_fisica).toBe(false);
    expect(u164.oferta_presencial).toBe(false);
  });

  it('deve validar os 154 registros confirmados de graduação superior', () => {
    const confirmados = units.filter(u => u.tipo_unidade === 'ensino_superior_presencial');
    expect(confirmados.length).toBe(154);
    for (const c of confirmados) {
      expect(c.presenca_fisica).toBe(true);
      expect(c.oferta_presencial).toBe(true);
      expect(c.ativo).toBe(true);
      expect(c.nivel_ensino).toContain('superior');
    }
  });

  it('deve validar os 3 ambíguos (IDs 1, 19, 76)', () => {
    const ambiguos = units.filter(u => u.tipo_unidade === 'ambigua');
    expect(ambiguos.length).toBe(3);
    const ids = ambiguos.map(a => a.id_ativo).sort();
    expect(ids).toEqual([1, 19, 76]);
  });

  it('pending-inep.json deve isolar exatamente 50 novos registros INEP com idempotência', () => {
    const pendingList = pendingPayload.registros;
    expect(pendingList.length).toBe(50);
    const keys = pendingList.map(p => p.idempotency_key);
    expect(new Set(keys).size).toBe(50);
  });

  it('deve suportar composição futura: Supabase (174) + INEP (50) -> 224 canônicos', () => {
    const mockInep = pendingPayload.registros.map(p => ({
      nome: p.nome_unidade,
      municipio: p.municipio,
      codigo_ibge: p.codigo_ibge,
      codigo_ies: p.codigo_ies,
      nome_ies: p.nome_ies,
      sigla: p.sigla,
      id_territorio: p.id_territorio,
      territorio_identidade: p.territorio_identidade,
      latitude: p.latitude,
      longitude: p.longitude
    }));

    const composicao = adaptProductionToCanonical({ inepUnits: mockInep, saveToFile: false });
    expect(composicao.canonicalProductionUnits.length).toBe(224);
    const fisicos = composicao.canonicalProductionUnits.filter(u => u.presenca_fisica === true);
    expect(fisicos.length).toBe(217); // 167 legados físicos + 50 novos físicos
  });
});
