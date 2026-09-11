import { describe, it, expect } from 'vitest';
import { getReportRoute } from '../../utils/exportReportClient';

describe('exportReportClient', () => {
  it('deve gerar a rota correta para relatório de síntese geral', () => {
    const route = getReportRoute('sintese', 'bahia', 'normal');
    expect(route).toBe('/relatorio/sintese?territorio=bahia&modo=normal');
  });

  it('deve gerar a rota correta para relatório de ativos com território específico e modo semiárido', () => {
    const route = getReportRoute('ativos', '5', 'semiarido');
    expect(route).toBe('/relatorio/ativos?territorio=5&modo=semiarido');
  });

  it('deve gerar a rota correta para relatório de cursos', () => {
    const route = getReportRoute('cursos', '10', 'normal');
    expect(route).toBe('/relatorio/cursos?territorio=10&modo=normal');
  });

  it('deve gerar a rota correta para relatório de cadeias produtivas', () => {
    const route = getReportRoute('cadeias', null, 'semiarido');
    expect(route).toBe('/relatorio/cadeias?territorio=bahia&modo=semiarido');
  });
});
