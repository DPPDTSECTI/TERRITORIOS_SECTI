/**
 * src/data/adapters/adapters.test.mjs
 * ETAPA 4.0 — Testes da Camada de Adapters Canônicos
 *
 * Valida os KPIs canônicos contra o composed-production-canonical.json
 * sem depender do frontend ou do Supabase em tempo de teste.
 *
 * Execução: vitest run src/data/adapters --config api-lab/vitest.config.mjs
 * (ou via script ad-hoc abaixo)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Carrega o dataset canônico composto diretamente do artefato validado ────
// O adapter de produção usa o mesmo arquivo via /api/shadow-data/composed
const COMPOSED_PATH = path.resolve(
  __dirname,
  '../../../api-lab/inep/production-adapter/composed-production-canonical.json'
);

let units = [];

beforeAll(() => {
  const raw = JSON.parse(fs.readFileSync(COMPOSED_PATH, 'utf-8'));
  units = raw?.dados || [];
});

// ─── Suite principal ──────────────────────────────────────────────────────────

describe('Adapter Canônico — KPIs de Composição (SECTI 174 + INEP 50)', () => {

  it('Total geral deve ser 224', () => {
    expect(units.length).toBe(224);
  });

  it('Infraestrutura física (presenca_fisica === true) deve ser 217', () => {
    const count = units.filter(u => u.presenca_fisica === true).length;
    expect(count).toBe(217);
  });

  it('Ensino Superior Presencial confirmado deve ser 204', () => {
    const count = units.filter(u => u.tipo_unidade === 'ensino_superior_presencial').length;
    expect(count).toBe(204);
  });

  it('Superior + Ambíguas deve ser 207', () => {
    const count = units.filter(
      u => u.tipo_unidade === 'ensino_superior_presencial' || u.tipo_unidade === 'ambigua'
    ).length;
    expect(count).toBe(207);
  });

  it('Ensino Técnico deve ser 7', () => {
    const count = units.filter(u => u.tipo_unidade === 'ensino_tecnico').length;
    expect(count).toBe(7);
  });

  it('Pesquisa e Extensão deve ser 2', () => {
    const count = units.filter(u => u.tipo_unidade === 'pesquisa_extensao').length;
    expect(count).toBe(2);
  });

  it('Administrativo deve ser 1', () => {
    const count = units.filter(u => u.tipo_unidade === 'administrativo').length;
    expect(count).toBe(1);
  });

  it('Polos EAD deve ser 6', () => {
    const count = units.filter(u => u.tipo_unidade === 'ead').length;
    expect(count).toBe(6);
  });

  it('Inativa deve ser 1', () => {
    const count = units.filter(u => u.tipo_unidade === 'inativa').length;
    expect(count).toBe(1);
  });

  it('Ambígua deve ser 3', () => {
    const count = units.filter(u => u.tipo_unidade === 'ambigua').length;
    expect(count).toBe(3);
  });

});

describe('Adapter Canônico — Rastreabilidade das Origens', () => {

  it('Registros INEP devem ser 50 com id_ativo = null e origem = "inep"', () => {
    const inep = units.filter(u => u.origem === 'inep');
    expect(inep.length).toBe(50);
    inep.forEach(u => {
      expect(u.id_ativo).toBeNull();
    });
  });

  it('Registros SECTI (origem secti ou secti_inep) devem ser 174 com id_ativo numérico', () => {
    // 17 registros têm origem='secti' (exclusivos SECTI)
    // 157 registros têm origem='secti_inep' (reconciliados SECTI+INEP)
    // Ambos são registros legados do Supabase com id_ativo numérico
    const secti = units.filter(u => u.origem === 'secti' || u.origem === 'secti_inep');
    expect(secti.length).toBe(174);
    secti.forEach(u => {
      expect(typeof u.id_ativo).toBe('number');
    });
  });

  it('Nenhum registro INEP deve ter id_ativo definido (garantia anti-INSERT)', () => {
    const violacoes = units.filter(u => u.origem === 'inep' && u.id_ativo !== null);
    expect(violacoes).toHaveLength(0);
  });

});

describe('Adapter Canônico — Cobertura Territorial', () => {

  const UNIVERSO_TERRITORIOS = 27;

  it(`Universo de Territórios de Identidade deve ser ${UNIVERSO_TERRITORIOS}`, () => {
    // Este valor é fixo pelo decreto estadual — 27 TIs na Bahia
    expect(UNIVERSO_TERRITORIOS).toBe(27);
  });

  it('Territórios com pelo menos uma unidade devem ser 26', () => {
    const ids = new Set(units.map(u => u.id_territorio).filter(Boolean));
    expect(ids.size).toBe(26);
  });

  it('ID 2 (Velho Chico) deve estar ausente da chave numérica legada', () => {
    const comId2 = units.filter(u => u.id_territorio === 2);
    // No legado Supabase, unidades do Velho Chico estão sob id_territorio = 27
    // Este teste documenta o comportamento esperado e rastreável
    expect(comId2.length).toBe(0);
  });

  it('Todos os registros devem ter codigo_ibge de 7 dígitos iniciado em 29', () => {
    const invalidos = units.filter(u => {
      const s = String(u.codigo_ibge || '');
      return s.length !== 7 || !s.startsWith('29');
    });
    expect(invalidos).toHaveLength(0);
  });

});

describe('Adapter Canônico — Integridade de Schema', () => {

  it('Todos os registros devem ter tipo_unidade válido', () => {
    const TIPOS_VALIDOS = new Set([
      'ensino_superior_presencial',
      'ensino_tecnico',
      'pesquisa_extensao',
      'administrativo',
      'ead',
      'ambigua',
      'inativa',
    ]);
    const invalidos = units.filter(u => !TIPOS_VALIDOS.has(u.tipo_unidade));
    expect(invalidos).toHaveLength(0);
  });

  it('Todos os registros devem ter nome não-vazio', () => {
    const invalidos = units.filter(u => !u.nome || !u.nome.trim());
    expect(invalidos).toHaveLength(0);
  });

  it('Todos os registros devem ter municipio não-vazio', () => {
    const invalidos = units.filter(u => !u.municipio || !u.municipio.trim());
    expect(invalidos).toHaveLength(0);
  });

  it('Todos os registros devem ter latitude e longitude válidos', () => {
    const invalidos = units.filter(u =>
      typeof u.latitude !== 'number' || typeof u.longitude !== 'number' ||
      u.latitude === 0 || u.longitude === 0
    );
    expect(invalidos).toHaveLength(0);
  });

  it('presenca_fisica deve ser boolean para todos os registros', () => {
    const invalidos = units.filter(u => typeof u.presenca_fisica !== 'boolean');
    expect(invalidos).toHaveLength(0);
  });

});
