/**
 * api-lab/inep/tests/inep.test.mjs
 * Testes automatizados para validação dos dados do INEP (Censo da Educação Superior).
 * 
 * Requisitos validados:
 * 1. Integridade dos códigos IBGE (7 dígitos válidos na Bahia, 29XXXXX).
 * 2. Inexistência de duplicidades anômalas.
 * 3. UF = BA em 100% dos registros.
 * 4. Relacionamento instituição -> município.
 * 5. Relacionamento curso -> instituição.
 * 6. Quantidade de registros e consistência dos tipos de dados.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const NORMALIZED_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized', 'cursos_inep_ba.json');
const IES_RAW_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw', 'inep_ba_ies_raw.json');
const IBGE_MUNICIPIOS_FILE = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output', 'municipios_ibge.json');
const RELATORIO_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output', 'relatorio_inep.json');

describe('API Lab - Validação INEP (Censo da Educação Superior)', () => {
  let normalizedCursos = [];
  let iesRawList = [];
  let validIbgeCodes = new Set();
  let relatorio = null;

  beforeAll(() => {
    if (fs.existsSync(NORMALIZED_FILE)) {
      normalizedCursos = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8'));
    }
    if (fs.existsSync(IES_RAW_FILE)) {
      iesRawList = JSON.parse(fs.readFileSync(IES_RAW_FILE, 'utf-8')).dados || [];
    }
    if (fs.existsSync(IBGE_MUNICIPIOS_FILE)) {
      const ibgeList = JSON.parse(fs.readFileSync(IBGE_MUNICIPIOS_FILE, 'utf-8'));
      ibgeList.forEach((m) => validIbgeCodes.add(m.codigo_ibge));
    }
    if (fs.existsSync(RELATORIO_FILE)) {
      relatorio = JSON.parse(fs.readFileSync(RELATORIO_FILE, 'utf-8'));
    }
  });

  describe('1. Integridade dos Códigos IBGE', () => {
    it('todos os registros devem possuir código IBGE numérico com 7 dígitos iniciado em 29 (Bahia)', () => {
      expect(normalizedCursos.length).toBeGreaterThan(0);
      for (const item of normalizedCursos) {
        expect(typeof item.codigo_ibge).toBe('number');
        expect(item.codigo_ibge).toBeGreaterThanOrEqual(2900000);
        expect(item.codigo_ibge).toBeLessThanOrEqual(2999999);
      }
    });

    it('todos os códigos IBGE presentes devem existir na base oficial do IBGE', () => {
      expect(validIbgeCodes.size).toBe(417);
      for (const item of normalizedCursos) {
        expect(validIbgeCodes.has(item.codigo_ibge)).toBe(true);
      }
    });
  });

  describe('2. Filtro Geográfico: UF = BA', () => {
    it('100% dos registros normalizados devem possuir uf igual a BA', () => {
      const nonBa = normalizedCursos.filter((c) => c.uf !== 'BA');
      expect(nonBa).toHaveLength(0);
    });

    it('100% das IES baianas na base bruta devem pertencer ao estado da Bahia', () => {
      for (const ies of iesRawList) {
        expect(ies.uf).toBe('BA');
      }
    });
  });

  describe('3. Inexistência de Duplicidades', () => {
    it('não deve haver códigos de IES duplicados no cadastro de IES com sede na Bahia', () => {
      const iesCodes = new Set();
      const duplicates = [];

      for (const ies of iesRawList) {
        if (iesCodes.has(ies.codigo_ies)) {
          duplicates.push(ies.codigo_ies);
        }
        iesCodes.add(ies.codigo_ies);
      }

      expect(duplicates).toHaveLength(0);
    });

    it('não deve haver registros de cursos exatamente idênticos com mesma chave composta (código_curso + código_ibge + modalidade)', () => {
      const courseKeys = new Set();
      const duplicates = [];

      for (const c of normalizedCursos) {
        const key = `${c.codigo_curso}_${c.codigo_ibge}_${c.modalidade}`;
        if (courseKeys.has(key)) {
          duplicates.push(key);
        }
        courseKeys.add(key);
      }

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('4. Relacionamento Instituição → Município', () => {
    it('cada instituição deve possuir nome e município válidos', () => {
      for (const item of normalizedCursos) {
        expect(item.instituicao).toBeDefined();
        expect(item.instituicao.trim().length).toBeGreaterThan(0);
        expect(item.municipio).toBeDefined();
        expect(item.municipio.trim().length).toBeGreaterThan(0);
      }
    });

    it('as principais universidades públicas devem ter presença garantida em seus municípios-sede', () => {
      // UFBA em Salvador
      const ufba = normalizedCursos.find(
        (c) => c.sigla_instituicao === 'UFBA' && c.municipio.toLowerCase().includes('salvador')
      );
      expect(ufba).toBeDefined();

      // UESC em Ilhéus
      const uesc = normalizedCursos.find(
        (c) => c.sigla_instituicao === 'UESC' && c.municipio.toLowerCase().includes('ilhéus')
      );
      expect(uesc).toBeDefined();

      // UEFS em Feira de Santana
      const uefs = normalizedCursos.find(
        (c) => c.sigla_instituicao === 'UEFS' && c.municipio.toLowerCase().includes('feira de santana')
      );
      expect(uefs).toBeDefined();
    });
  });

  describe('5. Relacionamento Curso → Instituição', () => {
    it('todo curso deve estar vinculado a uma instituição com código_ies e nome válidos', () => {
      for (const item of normalizedCursos) {
        expect(typeof item.codigo_ies).toBe('number');
        expect(item.codigo_ies).toBeGreaterThan(0);
        expect(typeof item.codigo_curso).toBe('number');
        expect(item.codigo_curso).toBeGreaterThan(0);
        expect(item.curso).toBeDefined();
        expect(item.curso.trim().length).toBeGreaterThan(0);
      }
    });

    it('cursos de instituições federais devem ter categoria_administrativa Pública Federal', () => {
      const ufbaCursos = normalizedCursos.filter((c) => c.sigla_instituicao === 'UFBA');
      expect(ufbaCursos.length).toBeGreaterThan(0);
      for (const c of ufbaCursos) {
        expect(c.categoria_administrativa).toBe('Pública Federal');
      }
    });
  });

  describe('6. Quantidade de Registros e Consistência', () => {
    it('deve conter o volume esperado de cursos presenciais e ofertas totais na Bahia', () => {
      expect(normalizedCursos.length).toBeGreaterThan(30000);
      const presenciais = normalizedCursos.filter((c) => c.modalidade === 'Presencial');
      expect(presenciais.length).toBeGreaterThanOrEqual(1900);
    });

    it('o relatório comparativo deve registrar alta taxa de correspondência com a SECTI', () => {
      expect(relatorio).toBeDefined();
      expect(relatorio.resumo.total_cursos_projeto).toBe(642);
      expect(relatorio.resumo.classificacao_cursos.coincidentes_exatos).toBeGreaterThanOrEqual(600);
      expect(relatorio.resumo.classificacao_municipios.municipios_sem_codigo_ibge).toBe(0);
    });
  });
});
