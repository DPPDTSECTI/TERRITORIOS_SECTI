import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCanonicalUnits } from './build-canonical-units.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_CANONICAL_JSON = path.resolve(__dirname, 'canonical-units.json');
const FILE_KPIS_JSON = path.resolve(__dirname, 'semantic-kpis.json');
const FILE_SCHEMA_JSON = path.resolve(__dirname, 'unidade-canonica.schema.json');

describe('ETAPA 2.7 — Testes do Modelo Canônico de Unidades Territoriais', () => {
  it('deve existir os arquivos de schema, canonical-units e semantic-kpis', () => {
    expect(fs.existsSync(FILE_SCHEMA_JSON)).toBe(true);
    expect(fs.existsSync(FILE_CANONICAL_JSON)).toBe(true);
    expect(fs.existsSync(FILE_KPIS_JSON)).toBe(true);
  });

  const canonicalPayload = JSON.parse(fs.readFileSync(FILE_CANONICAL_JSON, 'utf-8'));
  const kpis = JSON.parse(fs.readFileSync(FILE_KPIS_JSON, 'utf-8'));
  const units = canonicalPayload.dados;

  it('deve conter exatamente 224 unidades no total (174 SECTI + 50 INEP novos)', () => {
    expect(units.length).toBe(224);
    const sectiUnits = units.filter(u => u.id_ativo !== null);
    const inepNovos = units.filter(u => u.id_ativo === null);
    expect(sectiUnits.length).toBe(174);
    expect(inepNovos.length).toBe(50);
  });

  it('todos os 50 novos registros INEP devem ter id_ativo estritamente null e origem inep', () => {
    const inepNovos = units.filter(u => u.origem === 'inep');
    expect(inepNovos.length).toBe(50);
    for (const u of inepNovos) {
      expect(u.id_ativo).toBeNull();
      expect(u.presenca_fisica).toBe(true);
      expect(u.oferta_presencial).toBe(true);
      expect(u.nivel_ensino).toContain('superior');
    }
  });

  it('nenhuma unidade deve estar sem município ou código IBGE válido', () => {
    for (const u of units) {
      expect(typeof u.municipio).toBe('string');
      expect(u.municipio.trim().length).toBeGreaterThan(0);
      expect(typeof u.codigo_ibge).toBe('number');
      expect(String(u.codigo_ibge).startsWith('29')).toBe(true);
      expect(String(u.codigo_ibge).length).toBe(7);
      expect(u.id_territorio).toBeGreaterThanOrEqual(1);
      expect(u.id_territorio).toBeLessThanOrEqual(27);
      expect(typeof u.latitude).toBe('number');
      expect(typeof u.longitude).toBe('number');
    }
  });

  it('a unidade inativa (UNIRB Serrinha - ID 164) deve ter ativo = false e presenca_fisica = false', () => {
    const inativa = units.find(u => u.tipo_unidade === 'inativa');
    expect(inativa).toBeDefined();
    expect(inativa.id_ativo).toBe(164);
    expect(inativa.ativo).toBe(false);
    expect(inativa.presenca_fisica).toBe(false);
    expect(inativa.oferta_presencial).toBe(false);
  });

  it('unidades EAD não devem aparecer como ensino superior presencial nem possuir presença física', () => {
    const eadUnits = units.filter(u => u.tipo_unidade === 'ead');
    expect(eadUnits.length).toBe(6);
    for (const u of eadUnits) {
      expect(u.presenca_fisica).toBe(false);
      expect(u.oferta_presencial).toBe(false);
      expect(u.modalidade).toBe('A distância');
      expect(u.tipo_unidade).not.toBe('ensino_superior_presencial');
    }
  });

  it('unidades técnicas não devem ser classificadas com nível de ensino superior', () => {
    const tecnicoUnits = units.filter(u => u.tipo_unidade === 'ensino_tecnico');
    expect(tecnicoUnits.length).toBe(7);
    for (const u of tecnicoUnits) {
      expect(u.presenca_fisica).toBe(true);
      expect(u.oferta_presencial).toBe(true);
      expect(u.nivel_ensino).toContain('tecnico');
      expect(u.nivel_ensino).not.toContain('superior');
    }
  });

  it('centros de pesquisa/extensão e administrativos não devem ofertar graduação presencial', () => {
    const pesquisaUnits = units.filter(u => u.tipo_unidade === 'pesquisa_extensao');
    const adminUnits = units.filter(u => u.tipo_unidade === 'administrativo');
    expect(pesquisaUnits.length).toBe(2);
    expect(adminUnits.length).toBe(1);

    for (const u of [...pesquisaUnits, ...adminUnits]) {
      expect(u.presenca_fisica).toBe(true);
      expect(u.oferta_presencial).toBe(false);
      expect(u.nivel_ensino).not.toContain('superior');
    }
  });

  it('deve validar consistência dos KPIs semânticos', () => {
    expect(kpis.infraestrutura_total).toBe(217);
    expect(kpis.ensino_superior_presencial).toBe(204);
    expect(kpis.ensino_tecnico).toBe(7);
    expect(kpis.pesquisa_extensao).toBe(2);
    expect(kpis.administrativo).toBe(1);
    expect(kpis.ead).toBe(6);

    const somaAtivas = kpis.ensino_superior_presencial + kpis.detalhamento.ambigua + kpis.ensino_tecnico + kpis.pesquisa_extensao + kpis.administrativo + kpis.ead;
    expect(somaAtivas).toBe(223);
    expect(somaAtivas + kpis.detalhamento.total_inativas).toBe(224);
  });
});
