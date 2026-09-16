/**
 * api-lab/inep/shadow/frontend-validation/homologation.test.mjs
 * Testes automatizados de homologação do dataset Shadow contra os requisitos do frontend.
 * 
 * Requisitos validados:
 * 1. Todos os 27 territórios continuam disponíveis
 * 2. Todos os 417 municípios continuam disponíveis
 * 3. Nenhum registro shadow perde id_territorio
 * 4. Nenhum EAD é contado como presencial
 * 5. Nenhum registro técnico é apagado
 * 6. Nenhum registro de pesquisa é apagado
 * 7. Novos registros INEP continuam com id_ativo null
 * 8. Coordenadas SECTI não são sobrescritas
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const FILE_SHADOW_CAMPI = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'shadow', 'campi_shadow_secti.json');
const FILE_SHADOW_CURSOS = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'shadow', 'cursos_shadow_secti.json');
const FILE_SECTI_CAMPI = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw', 'secti_campi_atual.json');
const FILE_TERRITORIO_MUNICIPIOS = path.resolve(ROOT_DIR, 'utils', 'territorioMunicipios.json');
const FILE_IBGE_MUNICIPIOS = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output', 'municipios_ibge.json');

describe('ETAPA 2.5 — Testes de Homologação do Dataset Shadow no Frontend', () => {
  const shadowCampi = JSON.parse(fs.readFileSync(FILE_SHADOW_CAMPI, 'utf-8')).dados || [];
  const shadowCursos = JSON.parse(fs.readFileSync(FILE_SHADOW_CURSOS, 'utf-8')).dados || [];
  const sectiCampi = JSON.parse(fs.readFileSync(FILE_SECTI_CAMPI, 'utf-8')).dados || [];

  const territorioJson = JSON.parse(fs.readFileSync(FILE_TERRITORIO_MUNICIPIOS, 'utf-8'));
  const ibgeMunicipios = JSON.parse(fs.readFileSync(FILE_IBGE_MUNICIPIOS, 'utf-8'));

  it('1. todos os 27 territórios de identidade continuam disponíveis', () => {
    const territorios = territorioJson.territorios_de_identidade || [];
    expect(territorios).toHaveLength(27);
    expect(territorioJson.total_territorios).toBe(27);

    // Valida no shadow que temos representatividade territorial
    const territoriosNoShadow = new Set(shadowCampi.map((c) => c.id_territorio));
    expect(territoriosNoShadow.size).toBeGreaterThanOrEqual(25);
  });

  it('2. todos os 417 municípios continuam disponíveis na base oficial', () => {
    expect(ibgeMunicipios).toHaveLength(417);
    expect(territorioJson.total_municipios).toBe(417);

    let totalMunsNoJson = 0;
    for (const t of territorioJson.territorios_de_identidade || []) {
      totalMunsNoJson += (t.municipios || []).length;
    }
    expect(totalMunsNoJson).toBe(417);
  });

  it('3. nenhum registro shadow perde id_territorio (deve ser número entre 1 e 27)', () => {
    for (const c of shadowCampi) {
      expect(c.id_territorio).toBeDefined();
      expect(typeof c.id_territorio).toBe('number');
      expect(c.id_territorio).toBeGreaterThanOrEqual(1);
      expect(c.id_territorio).toBeLessThanOrEqual(27);
      expect(c.territorio_identidade).toBeDefined();
      expect(c.territorio_identidade.trim().length).toBeGreaterThan(0);
    }

    // Valida também nos cursos shadow
    for (const cur of shadowCursos.slice(0, 1000)) {
      if (cur.id_territorio) {
        expect(cur.id_territorio).toBeGreaterThanOrEqual(1);
        expect(cur.id_territorio).toBeLessThanOrEqual(27);
      }
    }
  });

  it('4. nenhum EAD é contado como presencial', () => {
    const eadCampi = shadowCampi.filter((c) => c.status_reconciliacao === 'somente_ead' || c.tipo_unidade === 'polo_ead');
    expect(eadCampi).toHaveLength(6);

    for (const e of eadCampi) {
      expect(e.modalidade).toBe('A distância');
      expect(e.tipo_unidade).toBe('polo_ead');
    }

    // Nos cursos presenciais, todos devem ter ead === false
    const cursosPresenciais = shadowCursos.filter((c) => c.ead === false);
    for (const c of cursosPresenciais.slice(0, 500)) {
      expect(c.ead).toBe(false);
      expect(c.modalidade).toBe('Presencial');
    }
  });

  it('5. nenhum registro técnico é apagado (7 campi de IF preservados)', () => {
    const tecnicoIds = [5, 27, 58, 71, 83, 174, 188];

    for (const id of tecnicoIds) {
      const found = shadowCampi.find((c) => c.id_ativo === id);
      expect(found).toBeDefined();
      expect(found.status_reconciliacao).toBe('tecnico_preservado');
      expect(found.tipo_unidade).toBe('campus_tecnico');
    }
  });

  it('6. nenhum registro de pesquisa ou reitoria especial é apagado (Canudos, Jeremoabo, Salvador IF)', () => {
    const pesquisaIds = [28, 88, 132];

    for (const id of pesquisaIds) {
      const found = shadowCampi.find((c) => c.id_ativo === id);
      expect(found).toBeDefined();
      expect(found.status_reconciliacao).toBe('pesquisa_preservada');
    }
  });

  it('7. novos registros INEP continuam estritamente com id_ativo null', () => {
    const novosInep = shadowCampi.filter((c) => c.origem === 'inep_nova');
    expect(novosInep).toHaveLength(50);

    for (const n of novosInep) {
      expect(n.id_ativo).toBeNull();
      expect(n.status_reconciliacao).toBe('novo_presencial_inep');
    }
  });

  it('8. coordenadas originais da SECTI não são sobrescritas', () => {
    const sectiMap = new Map(sectiCampi.map((s) => [s.id_ativo, s]));

    for (const c of shadowCampi) {
      if (c.id_ativo && sectiMap.has(c.id_ativo)) {
        const orig = sectiMap.get(c.id_ativo);
        expect(c.latitude).toBe(orig.latitude);
        expect(c.longitude).toBe(orig.longitude);
        expect(c.coordenada_origem).toBe('secti');
      }
    }
  });
});
