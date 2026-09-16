import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ETAPA 3.4 — Testes Automatizados de Homologação Final da Produção Composta', () => {
  const fileHomologationJson = path.resolve(process.cwd(), 'api-lab/inep/production-adapter/final-homologation.json');
  const fileReadinessJson = path.resolve(process.cwd(), 'api-lab/inep/production-adapter/final-production-readiness.json');
  const fileRootReadinessJson = path.resolve(process.cwd(), 'final-production-readiness.json');
  const fileHomologationMd = path.resolve(process.cwd(), 'api-lab/inep/production-adapter/final-homologation.md');

  it('arquivos de homologação final e prontidão de produção devem existir', () => {
    expect(fs.existsSync(fileHomologationJson)).toBe(true);
    expect(fs.existsSync(fileReadinessJson)).toBe(true);
    expect(fs.existsSync(fileRootReadinessJson)).toBe(true);
    expect(fs.existsSync(fileHomologationMd)).toBe(true);
  });

  const homologation = JSON.parse(fs.readFileSync(fileHomologationJson, 'utf-8'));
  const readiness = JSON.parse(fs.readFileSync(fileReadinessJson, 'utf-8'));

  it('1. Números Canônicos Exatos: 224 total, 217 físicos, 204 superior presencial, 207 c/ ambíguas, 7 técnicos, 2 pesquisa, 1 adm, 6 EAD, 1 inativa', () => {
    const num = homologation.resumo_numerico;
    expect(num.total).toBe(224);
    expect(num.fisicas).toBe(217);
    expect(num.superior_presencial).toBe(204);
    expect(num.superior_com_ambiguas).toBe(207);
    expect(num.tecnico).toBe(7);
    expect(num.pesquisa).toBe(2);
    expect(num.administrativo).toBe(1);
    expect(num.ead).toBe(6);
    expect(num.inativa).toBe(1);
    expect(num.status_fechamento_matematico).toBe(true);
  });

  it('2. Auditoria Territorial: Universo = 27, Com Unidade = 26, Sem Unidade = 1, ID 2 = Velho Chico', () => {
    const terr = homologation.auditoria_territorios;
    expect(terr.universo_territorios).toBe(27);
    expect(terr.territorios_com_unidade).toBe(26);
    expect(terr.territorios_sem_unidade).toBe(1);
    expect(terr.territorio_sem_unidade_identificado.id).toBe(2);
    expect(terr.territorio_sem_unidade_identificado.nome).toBe('Velho Chico');
    expect(terr.territorio_sem_unidade_identificado.municipios_vinculados).toBe(16);
    expect(terr.territorio_sem_unidade_identificado.campi_ativos_velho_chico).toBeGreaterThanOrEqual(5);
  });

  it('3. Auditoria Municipal: 417 municípios disponíveis, 100% com território e IBGE válido', () => {
    const mun = homologation.auditoria_municipios;
    expect(mun.total_municipios_bahia).toBe(417);
    expect(mun.municipios_com_territorio).toBe(417);
    expect(mun.municipios_sem_ibge).toBe(0);
    expect(mun.todos_com_ibge_valido).toBe(true);
  });

  it('4. Auditoria de Mapas: 217 pontos físicos reais, 6 EAD e 1 inativa excluídos do modo padrão', () => {
    const mapa = homologation.auditoria_mapa;
    expect(mapa.modo_padrao_fisico).toBe(217);
    expect(mapa.pontos_excluidos).toBe(7);
    expect(mapa.ead_excluidos).toBe(6);
    expect(mapa.inativa_excluida).toBe(1);
    expect(mapa.status).toBe('APROVADO');
    expect(mapa.densidade_polos.length).toBe(7);
  });

  it('5. Auditoria de Filtros: pureza das contagens sem contaminação cruzada', () => {
    const f = homologation.filtros;
    expect(f.ensino_superior).toBe(207);
    expect(f.tecnico).toBe(7);
    expect(f.pesquisa_extensao).toBe(2);
    expect(f.administrativo).toBe(1);
    expect(f.ead).toBe(6);
    expect(f.inativo).toBe(1);
  });

  it('6. Auditoria de Relatórios e PDF: sem falsa rotulagem semântica', () => {
    const r = homologation.relatorios_pdf;
    expect(r.ead_em_graduacao_presencial).toBe(true);
    expect(r.tecnico_em_superior).toBe(true);
    expect(r.pesquisa_em_ensino).toBe(true);
    expect(r.administrativo_em_ensino).toBe(true);
    expect(r.inativa_em_listas_ativas).toBe(true);
  });

  it('7. Prontidão Final: todos os sub-itens válidos, porém ready_for_production estritamente FALSE', () => {
    expect(readiness.composition_valid).toBe(true);
    expect(readiness.frontend_valid).toBe(true);
    expect(readiness.map_valid).toBe(true);
    expect(readiness.filters_valid).toBe(true);
    expect(readiness.reports_valid).toBe(true);
    expect(readiness.territories_valid).toBe(true);
    expect(readiness.municipalities_valid).toBe(true);
    expect(readiness.performance_valid).toBe(true);
    expect(Array.isArray(readiness.blockers)).toBe(true);
    expect(readiness.blockers.length).toBeGreaterThanOrEqual(5);
    expect(readiness.ready_for_production).toBe(false);
  });
});
