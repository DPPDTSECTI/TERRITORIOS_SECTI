import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Validação da Composição Controlada Supabase (174) + INEP (50) = 224', () => {
  const composedPath = path.resolve(process.cwd(), 'api-lab/inep/production-adapter/composed-production-canonical.json');
  const rawData = JSON.parse(fs.readFileSync(composedPath, 'utf8'));
  const composedUnits = Array.isArray(rawData) ? rawData : rawData.dados;

  const legacyUnits = composedUnits.filter(u => u.origem !== 'inep');
  const inepUnits = composedUnits.filter(u => u.origem === 'inep');

  it('A. Deve conter exatamente 174 legados + 50 novos INEP = 224 registros', () => {
    expect(legacyUnits.length).toBe(174);
    expect(inepUnits.length).toBe(50);
    expect(composedUnits.length).toBe(224);
  });

  it('B. Deve totalizar exatamente 167 + 50 = 217 unidades físicas', () => {
    const physicalUnits = composedUnits.filter(u => u.presenca_fisica === true);
    const legacyPhysical = legacyUnits.filter(u => u.presenca_fisica === true);
    const inepPhysical = inepUnits.filter(u => u.presenca_fisica === true);

    expect(legacyPhysical.length).toBe(167);
    expect(inepPhysical.length).toBe(50);
    expect(physicalUnits.length).toBe(217);
  });

  it('C. Nenhum ID legado duplicado e todos os 174 preservados', () => {
    const legacyIds = legacyUnits.map(u => u.id_ativo);
    expect(legacyIds.every(id => typeof id === 'number' && id > 0)).toBe(true);
    
    const uniqueLegacyIds = new Set(legacyIds);
    expect(uniqueLegacyIds.size).toBe(174);
  });

  it('D. Nenhum novo registro INEP deve possuir id_ativo', () => {
    expect(inepUnits.every(u => u.id_ativo === null)).toBe(true);
    expect(inepUnits.every(u => u.status_reconciliacao === 'novo_presencial_inep')).toBe(true);
  });

  it('E. Categorias canônicas devem satisfazer exatamente a especificação', () => {
    const counts = composedUnits.reduce((acc, u) => {
      acc[u.tipo_unidade] = (acc[u.tipo_unidade] || 0) + 1;
      return acc;
    }, {});

    expect(counts['ensino_superior_presencial']).toBe(204);
    expect(counts['ambigua']).toBe(3);
    expect(counts['ensino_tecnico']).toBe(7);
    expect(counts['pesquisa_extensao']).toBe(2);
    expect(counts['administrativo']).toBe(1);
    expect(counts['ead']).toBe(6);
    expect(counts['inativa']).toBe(1);
    expect(composedUnits.length).toBe(224);
  });

  it('F1. ETAPA 3.3.1 — Universo total de Territórios de Identidade da Bahia deve ser exatamente 27', () => {
    const rawTerritorios = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'utils/territorioMunicipios.json'), 'utf8'));
    const universo_territorios = rawTerritorios.territorios_de_identidade.length;
    expect(universo_territorios).toBe(27);
  });

  it('F2. ETAPA 3.3.1 — Auditoria de Cobertura Territorial: N=26 com unidades e 27-N=1 sem unidade na codificação legada', () => {
    const rawTerritorios = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'utils/territorioMunicipios.json'), 'utf8'));
    const universo_territorios = rawTerritorios.territorios_de_identidade.length; // 27
    
    const territoriesWithUnits = new Set(composedUnits.map(u => u.id_territorio));
    const territorios_com_unidade = territoriesWithUnits.size; // 26
    const territorios_sem_unidade = universo_territorios - territorios_com_unidade; // 1
    
    expect(universo_territorios).toBe(27);
    expect(territorios_com_unidade).toBe(26);
    expect(territorios_sem_unidade).toBe(1);

    // Identificar explicitamente o território sem unidade na codificação numérica legada
    const todosIds = rawTerritorios.territorios_de_identidade.map(t => t.id);
    const idsSemUnidade = todosIds.filter(id => !territoriesWithUnits.has(id));
    expect(idsSemUnidade).toEqual([2]);

    // Garantir que a ausência de campus no código numérico 2 NÃO significa ausência do território
    const territorioSemCampusNumerico = rawTerritorios.territorios_de_identidade.find(t => t.id === 2);
    expect(territorioSemCampusNumerico).toBeDefined();
    expect(territorioSemCampusNumerico.nome).toBe('Velho Chico');

    // Valida que os campi de Velho Chico existem na composição sob a chave histórica legada (id_territorio 27)
    const unidadesVelhoChico = composedUnits.filter(u => u.territorio_identidade === 'Velho Chico');
    expect(unidadesVelhoChico.length).toBeGreaterThan(0);
    expect(unidadesVelhoChico.every(u => u.id_territorio === 27)).toBe(true);
  });

  it('F3. ETAPA 3.3.1 — Integridade dos atributos municipais e códigos IBGE', () => {
    expect(composedUnits.every(u => typeof u.codigo_ibge === 'number' && String(u.codigo_ibge).startsWith('29'))).toBe(true);
    expect(composedUnits.every(u => typeof u.id_territorio === 'number' && u.id_territorio >= 1 && u.id_territorio <= 27)).toBe(true);
    expect(composedUnits.every(u => typeof u.territorio_identidade === 'string' && u.territorio_identidade.trim().length > 0)).toBe(true);
  });

  it('G. Nenhuma chave duplicada de codigo_ies + codigo_ibge entre os 50 novos registros e nem com os legados', () => {
    const inepKeys = inepUnits.map(u => `${u.codigo_ies}-${u.codigo_ibge}`);
    expect(new Set(inepKeys).size).toBe(50); // 50 chaves únicas entre si

    const legacyKeys = new Set(legacyUnits.map(u => `${u.codigo_ies}-${u.codigo_ibge}`));
    const overlap = inepKeys.filter(k => legacyKeys.has(k));
    expect(overlap.length).toBe(0); // Zero duplicatas com legados reconciliados
  });

  it('H. Coordenadas legadas permanecem inalteradas', () => {
    const rawProdData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'api-lab/inep/raw/secti_campi_atual.json'), 'utf8'));
    const rawProd = Array.isArray(rawProdData) ? rawProdData : (rawProdData.data || rawProdData.dados || rawProdData.campi);
    const prodMap = new Map(rawProd.map(p => [p.id_ativo, p]));

    for (const u of legacyUnits) {
      const orig = prodMap.get(u.id_ativo);
      expect(orig).toBeDefined();
      expect(u.latitude).toBe(Number(orig.latitude));
      expect(u.longitude).toBe(Number(orig.longitude));
    }
  });

  it('I. Composed readiness deve manter ready_for_supabase_insert = false e auditar cobertura territorial', () => {
    const readinessPath = path.resolve(process.cwd(), 'api-lab/inep/production-adapter/composed-readiness.json');
    const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
    expect(readiness.ready_for_supabase_insert).toBe(false);
    expect(Array.isArray(readiness.blockers)).toBe(true);
    expect(readiness.blockers.length).toBeGreaterThanOrEqual(5);

    // Auditoria de cobertura territorial
    expect(readiness.cobertura_territorial).toBeDefined();
    expect(readiness.cobertura_territorial.universo_territorios).toBe(27);
    expect(readiness.cobertura_territorial.territorios_com_unidade).toBe(26);
    expect(readiness.cobertura_territorial.territorios_sem_unidade).toBe(1);
    expect(readiness.cobertura_territorial.territorios_sem_unidade_ids).toEqual([2]);
  });
});
