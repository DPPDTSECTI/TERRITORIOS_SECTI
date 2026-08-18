import { describe, it, expect } from 'vitest';
import { filterCursos } from '../../utils/normalization.js';

describe('Funções de Filtragem de Dados (filtering.test.js)', () => {
  const sampleCursos = [
    { id: 1, curso: 'Engenharia de Computação', entidade: 'Universidade Federal da Bahia (UFBA)', municipio: 'Salvador', areaGeral: 'Engenharias' },
    { id: 2, curso: 'Agronomia', entidade: 'Universidade do Estado da Bahia (UNEB)', municipio: 'Juazeiro', areaGeral: 'Ciências Agrárias' },
    { id: 3, curso: 'Medicina', entidade: 'Universidade Estadual de Santa Cruz (UESC)', municipio: 'Ilhéus', areaGeral: 'Ciências da Saúde' },
    { id: 4, curso: 'Ciência da Computação', entidade: 'Universidade Estadual de Feira de Santana (UEFS)', municipio: 'Feira de Santana', areaGeral: 'Ciências Exatas e da Terra' },
    { id: 5, curso: 'Engenharia Agronômica', entidade: 'Instituto Federal Baiano (IF BAIANO)', municipio: 'Guanambi', areaGeral: 'Ciências Agrárias' }
  ];

  it('deve retornar todos os cursos quando nenhum filtro for aplicado', () => {
    const res = filterCursos(sampleCursos, '', []);
    expect(res).toHaveLength(5);
  });

  it('deve filtrar por busca textual insensible a acentos e maiúsculas', () => {
    const resComputacao = filterCursos(sampleCursos, 'computacao', []);
    expect(resComputacao).toHaveLength(2);
    expect(resComputacao.map(c => c.curso)).toContain('Engenharia de Computação');
    expect(resComputacao.map(c => c.curso)).toContain('Ciência da Computação');

    const resSalvador = filterCursos(sampleCursos, 'salvador', []);
    expect(resSalvador).toHaveLength(1);
    expect(resSalvador[0].municipio).toBe('Salvador');
  });

  it('deve filtrar por Área Geral do Conhecimento', () => {
    const resAgrarias = filterCursos(sampleCursos, '', ['Ciências Agrárias']);
    expect(resAgrarias).toHaveLength(2);
    expect(resAgrarias.map(c => c.curso)).toEqual(['Agronomia', 'Engenharia Agronômica']);
  });

  it('deve combinar filtro textual com filtro de Área Geral', () => {
    const resComb = filterCursos(sampleCursos, 'eng', ['Ciências Agrárias']);
    expect(resComb).toHaveLength(1);
    expect(resComb[0].curso).toBe('Engenharia Agronômica');
  });

  it('deve retornar lista vazia se nenhum registro corresponder ao filtro', () => {
    const resVazio = filterCursos(sampleCursos, 'Astronomia', []);
    expect(resVazio).toHaveLength(0);
  });
});
