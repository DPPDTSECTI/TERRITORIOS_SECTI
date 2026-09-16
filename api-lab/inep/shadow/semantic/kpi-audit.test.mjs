import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_CANONICAL_JSON = path.resolve(__dirname, 'canonical-units.json');
const FILE_DEFINITIONS_JSON = path.resolve(__dirname, 'kpi-definitions.json');

describe('ETAPA 2.8 — Testes de Auditoria dos KPIs Canônicos', () => {
  const canonicalPayload = JSON.parse(fs.readFileSync(FILE_CANONICAL_JSON, 'utf-8'));
  const definitions = JSON.parse(fs.readFileSync(FILE_DEFINITIONS_JSON, 'utf-8'));
  const units = canonicalPayload.dados;

  it('deve validar existência dos arquivos de auditoria e definições', () => {
    expect(fs.existsSync(FILE_CANONICAL_JSON)).toBe(true);
    expect(fs.existsSync(FILE_DEFINITIONS_JSON)).toBe(true);
    expect(units.length).toBe(224);
  });

  it('KPI 1: infraestrutura_fisica_total deve ser exatamente 217 (presenca_fisica === true)', () => {
    const total = units.filter(u => u.presenca_fisica === true).length;
    expect(total).toBe(217);
    expect(definitions.kpis.infraestrutura_fisica_total.valor).toBe(217);
  });

  it('KPI 2: infraestrutura_fisica_ativa deve ser exatamente 217 (presenca_fisica === true && ativo === true)', () => {
    const total = units.filter(u => u.presenca_fisica === true && u.ativo === true).length;
    expect(total).toBe(217);
    expect(definitions.kpis.infraestrutura_fisica_ativa.valor).toBe(217);
  });

  it('KPI 3: ensino_superior_presencial_confirmado deve ser exatamente 204', () => {
    const total = units.filter(u => u.tipo_unidade === 'ensino_superior_presencial').length;
    expect(total).toBe(204);
    expect(definitions.kpis.ensino_superior_presencial_confirmado.valor).toBe(204);
  });

  it('KPI 4: ensino_superior_presencial_com_ambiguos deve ser exatamente 207', () => {
    const total = units.filter(u => u.tipo_unidade === 'ensino_superior_presencial' || u.tipo_unidade === 'ambigua').length;
    expect(total).toBe(207);
    expect(definitions.kpis.ensino_superior_presencial_com_ambiguos.valor).toBe(207);
  });

  it('KPI 5: ensino_tecnico deve ser exatamente 7', () => {
    const total = units.filter(u => u.tipo_unidade === 'ensino_tecnico').length;
    expect(total).toBe(7);
    expect(definitions.kpis.ensino_tecnico.valor).toBe(7);
  });

  it('KPI 6: pesquisa_extensao deve ser exatamente 2', () => {
    const total = units.filter(u => u.tipo_unidade === 'pesquisa_extensao').length;
    expect(total).toBe(2);
    expect(definitions.kpis.pesquisa_extensao.valor).toBe(2);
  });

  it('KPI 7: administrativo deve ser exatamente 1', () => {
    const total = units.filter(u => u.tipo_unidade === 'administrativo').length;
    expect(total).toBe(1);
    expect(definitions.kpis.administrativo.valor).toBe(1);
  });

  it('KPI 8: ead deve ser exatamente 6', () => {
    const total = units.filter(u => u.tipo_unidade === 'ead').length;
    expect(total).toBe(6);
    expect(definitions.kpis.ead.valor).toBe(6);
  });

  it('KPI 9: unidades_inativas deve ser exatamente 1 (ativo === false)', () => {
    const total = units.filter(u => u.ativo === false).length;
    expect(total).toBe(1);
    expect(definitions.kpis.unidades_inativas.valor).toBe(1);
  });

  it('KPI 10: unidades_totais deve ser exatamente 224', () => {
    expect(units.length).toBe(224);
    expect(definitions.kpis.unidades_totais.valor).toBe(224);
  });

  it('Equação Matemática 1: 204 + 3 + 7 + 2 + 1 = 217 (Infraestrutura Física)', () => {
    const kpi3_sup = units.filter(u => u.tipo_unidade === 'ensino_superior_presencial').length; // 204
    const amb = units.filter(u => u.tipo_unidade === 'ambigua').length; // 3
    const kpi5_tec = units.filter(u => u.tipo_unidade === 'ensino_tecnico').length; // 7
    const kpi6_pesq = units.filter(u => u.tipo_unidade === 'pesquisa_extensao').length; // 2
    const kpi7_adm = units.filter(u => u.tipo_unidade === 'administrativo').length; // 1

    expect(kpi3_sup + amb + kpi5_tec + kpi6_pesq + kpi7_adm).toBe(217);
  });

  it('Equação Matemática 2: 204 + 3 + 7 + 2 + 1 + 6 + 1 = 224 (Unidades Totais)', () => {
    const kpi3_sup = units.filter(u => u.tipo_unidade === 'ensino_superior_presencial').length; // 204
    const amb = units.filter(u => u.tipo_unidade === 'ambigua').length; // 3
    const kpi5_tec = units.filter(u => u.tipo_unidade === 'ensino_tecnico').length; // 7
    const kpi6_pesq = units.filter(u => u.tipo_unidade === 'pesquisa_extensao').length; // 2
    const kpi7_adm = units.filter(u => u.tipo_unidade === 'administrativo').length; // 1
    const kpi8_ead = units.filter(u => u.tipo_unidade === 'ead').length; // 6
    const kpi9_inat = units.filter(u => u.tipo_unidade === 'inativa').length; // 1

    expect(kpi3_sup + amb + kpi5_tec + kpi6_pesq + kpi7_adm + kpi8_ead + kpi9_inat).toBe(224);
  });
});
