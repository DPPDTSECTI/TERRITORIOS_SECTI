/**
 * api-lab/ibge/__tests__/ibge.test.mjs
 * Testes automatizados do laboratório de validação de APIs - Módulo IBGE.
 * 
 * Requisitos validados:
 * 1. Quantidade de municípios (417 na base local e 417 no IBGE).
 * 2. Existência e formato válido do código IBGE.
 * 3. Inexistência de duplicados (códigos ou nomes).
 * 4. Comparação precisa entre a fonte atual e a base do IBGE.
 * 5. Preservação do vínculo território -> município.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadCurrentTerritorios, compareMunicipios } from '../compare-municipios.mjs';
import { normalizeIbgeMunicipios, normalizeName } from '../normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const IBGE_OUTPUT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output', 'municipios_ibge.json');
const RELATORIO_OUTPUT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output', 'relatorio_ibge.json');

describe('API Lab - Validação IBGE (Bahia)', () => {
  let currentData;
  let ibgeData;

  beforeAll(() => {
    currentData = loadCurrentTerritorios();
    if (fs.existsSync(IBGE_OUTPUT_FILE)) {
      ibgeData = JSON.parse(fs.readFileSync(IBGE_OUTPUT_FILE, 'utf-8'));
    }
  });

  describe('1. Quantidade de Municípios', () => {
    it('deve conter exatamente 27 territórios de identidade na base do projeto', () => {
      expect(currentData.territorios).toHaveLength(27);
    });

    it('deve conter exatamente 417 municípios na base do projeto', () => {
      expect(currentData.municipios).toHaveLength(417);
    });

    it('deve conter exatamente 417 municípios na base normalizada do IBGE', () => {
      expect(ibgeData).toBeDefined();
      expect(ibgeData).toHaveLength(417);
    });
  });

  describe('2. Existência de Código IBGE e Tipagem', () => {
    it('todos os municípios do IBGE devem ter código oficial de 7 dígitos iniciando com 29 (BA)', () => {
      for (const m of ibgeData) {
        expect(typeof m.codigo_ibge).toBe('number');
        expect(m.codigo_ibge).toBeGreaterThanOrEqual(2900000);
        expect(m.codigo_ibge).toBeLessThanOrEqual(2999999);
      }
    });

    it('todos os registros normalizados devem possuir nome não vazio e uf BA', () => {
      for (const m of ibgeData) {
        expect(typeof m.municipio).toBe('string');
        expect(m.municipio.trim().length).toBeGreaterThan(0);
        expect(m.uf).toBe('BA');
      }
    });
  });

  describe('3. Inexistência de Duplicados', () => {
    it('não deve haver códigos IBGE duplicados na base do IBGE', () => {
      const codeSet = new Set();
      const duplicates = [];

      for (const m of ibgeData) {
        if (codeSet.has(m.codigo_ibge)) {
          duplicates.push(m.codigo_ibge);
        }
        codeSet.add(m.codigo_ibge);
      }

      expect(duplicates).toHaveLength(0);
      expect(codeSet.size).toBe(417);
    });

    it('não deve haver nomes duplicados na base do IBGE', () => {
      const nameSet = new Set();
      const duplicates = [];

      for (const m of ibgeData) {
        const norm = normalizeName(m.municipio);
        if (nameSet.has(norm)) {
          duplicates.push(m.municipio);
        }
        nameSet.add(norm);
      }

      expect(duplicates).toHaveLength(0);
      expect(nameSet.size).toBe(417);
    });

    it('não deve haver municípios duplicados na base atual do projeto', () => {
      const nameSet = new Set();
      const duplicates = [];

      for (const m of currentData.municipios) {
        const norm = normalizeName(m.municipio);
        if (nameSet.has(norm)) {
          duplicates.push(m.municipio);
        }
        nameSet.add(norm);
      }

      expect(duplicates).toHaveLength(0);
      expect(nameSet.size).toBe(417);
    });
  });

  describe('4. Comparação entre Fonte Atual e IBGE', () => {
    it('deve comparar corretamente as fontes identificando os 417 municípios', async () => {
      const relatorio = await compareMunicipios({ saveToFile: false });

      expect(relatorio.total_atual).toBe(417);
      expect(relatorio.total_ibge).toBe(417);

      // Pelo menos 413 são correspondências com grafia estritamente exata
      expect(relatorio.resumo.coincidentes_exatos).toBe(413);

      // 2 possuem variação apenas de acento gráfico (Itaeté/Itaetê, Iuiu/Iuiú)
      expect(relatorio.resumo.coincidentes_normalizados_com_acento).toBe(2);

      // As 4 divergências conhecidas entre SEPLAN e IBGE devem ser mapeadas
      expect(relatorio.divergencias_nome).toHaveLength(4);

      // Todos os 417 códigos IBGE são identificados e nenhum município fica sem código
      expect(relatorio.resumo.total_codigos_ibge_encontrados).toBe(417);
      expect(relatorio.municipios_sem_codigo).toHaveLength(0);
    });

    it('deve preservar o relacionamento original território -> município sem alterá-lo pelo IBGE', () => {
      expect(Object.keys(currentData.relacaoTerritorioMunicipios)).toHaveLength(27);
      
      // Valida que territórios-chave possuem seus municípios intocados
      const irece = currentData.relacaoTerritorioMunicipios['Irecê'];
      expect(irece).toBeDefined();
      expect(irece).toContain('Irecê');
      expect(irece).toContain('Xique-Xique');

      const metropolitano = currentData.relacaoTerritorioMunicipios['Metropolitano de Salvador'];
      expect(metropolitano).toBeDefined();
      expect(metropolitano).toContain('Salvador');
      expect(metropolitano).toContain('Camaçari');
    });
  });
});
