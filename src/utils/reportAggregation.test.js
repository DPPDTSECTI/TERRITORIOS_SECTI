import { describe, it, expect } from 'vitest';
import {
  classificarInstituicao,
  buildMunicipiosInstituicoesList,
  buildAreaHeatmapData,
  buildTopMunicipiosRanking,
} from '../../utils/reportAggregation.js';

describe('Módulo de Agregação de Relatórios (reportAggregation.test.js)', () => {
  const sampleTerritorios = [
    {
      nome: 'Metropolitano de Salvador',
      territory: 'Metropolitano de Salvador',
      isSemiarido: false,
      cursosDetalhado: [
        {
          id: 1,
          curso: 'Engenharia de Computação',
          entidade: 'Universidade Federal da Bahia (UFBA)',
          municipio: 'Salvador',
          areaGeral: 'Engenharias',
          quantidade: 5,
        },
        {
          id: 2,
          curso: 'Direito',
          entidade: 'Universidade do Estado da Bahia (UNEB)',
          municipio: 'Salvador',
          areaGeral: 'Ciências Sociais Aplicadas',
          quantidade: 3,
        },
        {
          id: 3,
          curso: 'Administração',
          entidade: 'Universidade Salvador (UNIFACS)',
          municipio: 'Salvador',
          orgAcademica: 'Universidade',
          categoriaAdm: 'Privada',
          areaGeral: 'Ciências Sociais Aplicadas',
          quantidade: 10,
        },
        {
          id: 4,
          curso: 'Tecnologia em Sistemas',
          entidade: 'Instituto Federal da Bahia (IFBA)',
          municipio: 'Camaçari',
          areaGeral: 'Ciências Exatas e da Terra',
          quantidade: 2,
        },
      ],
    },
    {
      nome: 'Litoral Sul',
      territory: 'Litoral Sul',
      isSemiarido: false,
      cursosDetalhado: [
        {
          id: 5,
          curso: 'Medicina',
          entidade: 'Universidade Estadual de Santa Cruz (UESC)',
          municipio: 'Ilhéus',
          areaGeral: 'Ciências da Saúde',
          quantidade: 4,
        },
        {
          id: 6,
          curso: 'Agronomia',
          entidade: 'Instituto Federal Baiano (IF BAIANO)',
          municipio: 'Uruçuca',
          areaGeral: 'Ciências Agrárias',
          quantidade: 1,
        },
      ],
    },
  ];

  describe('classificarInstituicao', () => {
    it('deve classificar corretamente instituições públicas federais, estaduais, institutos federais e privadas', () => {
      expect(classificarInstituicao({ entidade: 'Universidade Federal da Bahia (UFBA)' }).categoria).toBe('federal');
      expect(classificarInstituicao({ entidade: 'Universidade do Estado da Bahia (UNEB)' }).categoria).toBe('estadual');
      expect(classificarInstituicao({ entidade: 'Universidade Estadual de Santa Cruz (UESC)' }).categoria).toBe('estadual');
      expect(classificarInstituicao({ entidade: 'Instituto Federal da Bahia (IFBA)' }).categoria).toBe('institutoFederal');
      expect(
        classificarInstituicao({
          entidade: 'Faculdade Particular',
          orgAcademica: 'Faculdade',
          categoriaAdm: 'Privada',
        }).categoria
      ).toBe('privada');
    });
  });

  describe('buildMunicipiosInstituicoesList', () => {
    it('deve retornar array vazio quando os dados de entrada forem vazios ou nulos', () => {
      expect(buildMunicipiosInstituicoesList([], {})).toEqual([]);
      expect(buildMunicipiosInstituicoesList(null, {})).toEqual([]);
    });

    it('deve retornar array vazio quando um filtro zerar todos os resultados', () => {
      const result = buildMunicipiosInstituicoesList(sampleTerritorios, {
        selectedLocation: { nome: 'Território Inexistente' },
      });
      expect(result).toEqual([]);
    });

    it('deve agregar corretamente os municípios e instituições públicas de 2 territórios de exemplo, ignorando privadas', () => {
      const result = buildMunicipiosInstituicoesList(sampleTerritorios, {});

      // Deve incluir Camaçari, Ilhéus, Salvador, Uruçuca em ordem alfabética
      expect(result).toHaveLength(4);

      // Ordem alfabética: 1. Camaçari, 2. Ilhéus, 3. Salvador, 4. Uruçuca
      expect(result[0].municipio).toBe('Camaçari');
      expect(result[0].numero).toBe(1);
      expect(result[0].instituicoes).toEqual([{ sigla: 'IFBA', categoria: 'institutoFederal' }]);

      expect(result[1].municipio).toBe('Ilhéus');
      expect(result[1].numero).toBe(2);
      expect(result[1].instituicoes).toEqual([{ sigla: 'UESC', categoria: 'estadual' }]);

      expect(result[2].municipio).toBe('Salvador');
      expect(result[2].numero).toBe(3);
      // Em Salvador, apenas UFBA e UNEB (UNIFACS é privada e deve ser excluída)
      expect(result[2].instituicoes).toHaveLength(2);
      expect(result[2].instituicoes.map(i => i.sigla)).toEqual(['UFBA', 'UNEB']);

      expect(result[3].municipio).toBe('Uruçuca');
      expect(result[3].numero).toBe(4);
      expect(result[3].instituicoes).toEqual([{ sigla: 'IF BAIANO', categoria: 'institutoFederal' }]);
    });
  });

  describe('buildAreaHeatmapData', () => {
    it('deve agregar por município e área geral, ordenando por total decrescente', () => {
      const { areas, linhas } = buildAreaHeatmapData(sampleTerritorios, {});

      expect(areas).toContain('Engenharias');
      expect(areas).toContain('Ciências Agrárias');
      expect(areas).toContain('Ciências da Saúde');

      // Ordem por total desc: Salvador (5+3+10=18), Ilhéus (4), Camaçari (2), Uruçuca (1)
      expect(linhas[0].municipio).toBe('Salvador');
      expect(linhas[0].total).toBe(18);
      expect(linhas[0].contagem['Engenharias']).toBe(5);

      expect(linhas[1].municipio).toBe('Ilhéus');
      expect(linhas[1].total).toBe(4);
    });
  });

  describe('buildTopMunicipiosRanking', () => {
    it('deve agrupa municípios em Demais municípios quando o limite for excedido', () => {
      const ranking = buildTopMunicipiosRanking(sampleTerritorios, {}, 2);

      expect(ranking).toHaveLength(3);
      expect(ranking[0].municipio).toBe('Salvador');
      expect(ranking[1].municipio).toBe('Ilhéus');
      expect(ranking[2].municipio).toBe('Demais municípios');
      // Demais municípios somam Camaçari (2) + Uruçuca (1) = 3
      expect(ranking[2].total).toBe(3);
    });
  });
});
