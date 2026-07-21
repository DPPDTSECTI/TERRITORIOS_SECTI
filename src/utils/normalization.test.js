import { describe, it, expect } from 'vitest';
import {
  normalize,
  safeKey,
  fixWeirdCapitalization,
  expandirNomeEntidade,
  sortAlpha
} from './normalization.js';

describe('Funções de Normalização de Texto (normalization.js)', () => {
  describe('normalize()', () => {
    it('deve remover acentos e converter para minúsculas', () => {
      expect(normalize('Vitória da Conquista')).toBe('vitoria da conquista');
      expect(normalize('Lauro de Freitas / BA')).toBe('lauro de freitas ba');
    });

    it('deve lidar com valores nulos, indefinidos e numéricos', () => {
      expect(normalize(null)).toBe('');
      expect(normalize(undefined)).toBe('');
      expect(normalize(12345)).toBe('12345');
    });

    it('deve colapsar múltiplos espaços em branco', () => {
      expect(normalize('  Feira    de  Santana   ')).toBe('feira de santana');
    });
  });

  describe('safeKey()', () => {
    it('deve remover todos os caracteres não alfanuméricos', () => {
      expect(safeKey('Bacia do Rio Corrente!')).toBe('baciadoriocorrente');
      expect(safeKey('Semiárido (2022)')).toBe('semiarido2022');
    });
  });

  describe('fixWeirdCapitalization()', () => {
    it('deve manter acrônimos conhecidos e ajustar capitalizações estranhas', () => {
      expect(fixWeirdCapitalization('UFBA')).toBe('UFBA');
      expect(fixWeirdCapitalization('IFBA')).toBe('IFBA');
    });

    it('deve tratar adequadamente strings vazias ou nulas', () => {
      expect(fixWeirdCapitalization('')).toBe('');
      expect(fixWeirdCapitalization(null)).toBe(null);
    });
  });

  describe('expandirNomeEntidade()', () => {
    it('deve expandir siglas conhecidas para os seus nomes oficiais completos', () => {
      expect(expandirNomeEntidade('ufba')).toBe('Universidade Federal da Bahia (UFBA)');
      expect(expandirNomeEntidade('uneb')).toBe('Universidade do Estado da Bahia (UNEB)');
      expect(expandirNomeEntidade('ifba')).toBe('Instituto Federal da Bahia (IFBA)');
      expect(expandirNomeEntidade('ifbaiano')).toBe('Instituto Federal Baiano (IF BAIANO)');
      expect(expandirNomeEntidade('uesc')).toBe('Universidade Estadual de Santa Cruz (UESC)');
    });

    it('deve retornar o nome original quando a entidade não estiver no dicionário', () => {
      expect(expandirNomeEntidade('Faculdade Tecnológica Desconhecida')).toBe('Faculdade Tecnológica Desconhecida');
    });
  });

  describe('sortAlpha()', () => {
    it('deve ordenar objetos em ordem alfabética respeitando o idioma português (pt-BR)', () => {
      const lista = [
        { nome: 'Vitória' },
        { nome: 'Água Fria' },
        { nome: 'Barreiras' },
        { nome: 'Amargosa' }
      ];

      const ordenada = [...lista].sort((a, b) => sortAlpha(a, b, 'nome'));

      expect(ordenada.map(o => o.nome)).toEqual([
        'Água Fria',
        'Amargosa',
        'Barreiras',
        'Vitória'
      ]);
    });
  });
});
