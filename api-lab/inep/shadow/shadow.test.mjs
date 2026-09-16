/**
 * api-lab/inep/shadow/shadow.test.mjs
 * Testes automatizados de validação da Shadow Migration INEP x SECTI.
 * 
 * Requisitos validados:
 * 1. Nenhum id_ativo duplicado
 * 2. Nenhum município sem codigo_ibge
 * 3. Território de Identidade preservado (1 a 27)
 * 4. Coordenada SECTI preservada
 * 5. Nenhum EAD contado como presencial
 * 6. Nenhum registro técnico removido
 * 7. Nenhum registro de pesquisa removido
 * 8. Nenhum novo INEP recebeu id_ativo inventado
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const FILE_SHADOW_CAMPI = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'shadow', 'campi_shadow_secti.json');
const FILE_SECTI_CAMPI_174 = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw', 'secti_campi_atual.json');
const FILE_DIFF = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'shadow', 'diff.json');

describe('ETAPA 2.4 — Testes da Shadow Migration INEP x SECTI', () => {
  const shadowPayload = JSON.parse(fs.readFileSync(FILE_SHADOW_CAMPI, 'utf-8'));
  const shadowCampi = shadowPayload.dados || [];
  const sectiRaw = JSON.parse(fs.readFileSync(FILE_SECTI_CAMPI_174, 'utf-8')).dados || [];
  const diff = JSON.parse(fs.readFileSync(FILE_DIFF, 'utf-8'));

  it('1. nenhum id_ativo duplicado no dataset shadow', () => {
    const idSet = new Set();
    const duplicados = [];

    for (const c of shadowCampi) {
      if (c.id_ativo !== null && c.id_ativo !== undefined) {
        if (idSet.has(c.id_ativo)) {
          duplicados.push(c.id_ativo);
        }
        idSet.add(c.id_ativo);
      }
    }

    expect(duplicados).toHaveLength(0);
    expect(idSet.size).toBe(174);
  });

  it('2. nenhum município sem codigo_ibge (deve ter 7 dígitos e iniciar com 29 para Bahia)', () => {
    for (const c of shadowCampi) {
      expect(c.codigo_ibge).toBeDefined();
      expect(typeof c.codigo_ibge).toBe('number');
      const codStr = String(c.codigo_ibge);
      expect(codStr).toHaveLength(7);
      expect(codStr.startsWith('29')).toBe(true);
    }
  });

  it('3. território de identidade preservado e válido (id_territorio entre 1 e 27)', () => {
    for (const c of shadowCampi) {
      expect(c.id_territorio).toBeDefined();
      expect(typeof c.id_territorio).toBe('number');
      expect(c.id_territorio).toBeGreaterThanOrEqual(1);
      expect(c.id_territorio).toBeLessThanOrEqual(27);
      expect(c.territorio_identidade).toBeDefined();
      expect(c.territorio_identidade.trim().length).toBeGreaterThan(0);
    }
  });

  it('4. coordenadas originais da SECTI 100% preservadas', () => {
    const sectiMap = new Map(sectiRaw.map((s) => [s.id_ativo, s]));

    for (const c of shadowCampi) {
      if (c.id_ativo && sectiMap.has(c.id_ativo)) {
        const original = sectiMap.get(c.id_ativo);
        expect(c.latitude).toBe(original.latitude);
        expect(c.longitude).toBe(original.longitude);
        expect(c.coordenada_origem).toBe('secti');
      }
    }
  });

  it('5. nenhum polo EAD contado como campus presencial', () => {
    const eadCampi = shadowCampi.filter((c) => c.status_reconciliacao === 'somente_ead' || c.tipo_unidade === 'polo_ead');

    expect(eadCampi.length).toBe(6);
    for (const e of eadCampi) {
      expect(e.modalidade).toBe('A distância');
      expect(e.tipo_unidade).toBe('polo_ead');
      expect(e.origem).toBe('secti_ead');
    }

    // Garante que não foram etiquetados como campus_presencial
    for (const e of eadCampi) {
      expect(e.tipo_unidade).not.toBe('campus_presencial');
    }
  });

  it('6. nenhum registro técnico de IFBA/IF Baiano removido', () => {
    const tecnicoIds = [5, 27, 58, 71, 83, 174, 188];

    for (const id of tecnicoIds) {
      const found = shadowCampi.find((c) => c.id_ativo === id);
      expect(found).toBeDefined();
      expect(found.tipo_unidade).toBe('campus_tecnico');
      expect(found.origem).toBe('secti_preservada');
      expect(found.status_reconciliacao).toBe('tecnico_preservado');
    }

    expect(diff.tecnico).toHaveLength(7);
  });

  it('7. nenhum registro de pesquisa ou reitoria especial removido (Canudos, Jeremoabo, Salvador IF Baiano)', () => {
    const pesquisaIds = [28, 88, 132];

    for (const id of pesquisaIds) {
      const found = shadowCampi.find((c) => c.id_ativo === id);
      expect(found).toBeDefined();
      expect(found.origem).toBe('secti_preservada');
      expect(found.status_reconciliacao).toBe('pesquisa_preservada');
    }

    expect(diff.pesquisa).toHaveLength(3);
  });

  it('8. nenhum novo registro INEP recebeu id_ativo inventado (id_ativo === null)', () => {
    const novosInep = shadowCampi.filter((c) => c.origem === 'inep_nova');

    expect(novosInep.length).toBe(50);
    for (const n of novosInep) {
      expect(n.id_ativo).toBeNull();
      expect(n.status_reconciliacao).toBe('novo_presencial_inep');
      expect(n.codigo_ies).toBeDefined();
      expect(n.modalidade).toBe('Presencial');
      expect(n.coordenada_origem).toBe('inep_resolvida');
    }
  });
});
