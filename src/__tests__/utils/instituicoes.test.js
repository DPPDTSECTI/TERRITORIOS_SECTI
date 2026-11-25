import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  normalizeIctStatus,
  computeInstituicoesKpis,
  buildAtivosByInstituicaoMap,
  extractNaturezasInstitucionais,
  filterInstituicoes,
  enrichInstituicoesWithAtivos,
  getAtivosDaInstituicao,
  formatSafeUrl,
  SEM_INSTITUICAO_FILTER,
  filterAtivosByInstituicao,
  formatInstituicaoLabel,
  computeInstituicoesAnalytics,
  buildAtivosExportRows,
} from '../../utils/instituicoes.js';
import InstituicoesPage from '../../components/InstituicoesPage.jsx';

const SAMPLE_INSTITUICOES = [
  {
    id_instituicao: 1,
    nome_instituicao: 'Universidade Federal da Bahia',
    sigla: 'UFBA',
    ict_status: 'sim',
    natureza_institucional: 'Pública Federal',
    site_oficial: 'https://www.ufba.br',
    observacao_ict: 'ICT pública federal validada',
    ativa: true,
  },
  {
    id_instituicao: 2,
    nome_instituicao: 'Universidade do Estado da Bahia',
    sigla: 'UNEB',
    ict_status: 'sim',
    natureza_institucional: 'Pública Estadual',
    site_oficial: 'uneb.br',
    observacao_ict: null,
    ativa: true,
  },
  {
    id_instituicao: 3,
    nome_instituicao: 'Faculdade Regional Exemplo',
    sigla: 'FRE',
    ict_status: 'nao',
    natureza_institucional: 'Privada com fins lucrativos',
    site_oficial: null,
    observacao_ict: null,
    ativa: true,
  },
  {
    id_instituicao: 4,
    nome_instituicao: 'Centro de Inovação do Sertão',
    sigla: null,
    ict_status: 'pendente',
    natureza_institucional: 'Ambiente Promotor de Inovação',
    site_oficial: null,
    observacao_ict: 'Em análise documental',
    ativa: true,
  },
  {
    id_instituicao: 5,
    nome_instituicao: 'Instituto Desativado do Recôncavo',
    sigla: 'IDR',
    ict_status: 'pendente',
    natureza_institucional: null,
    site_oficial: 'javascript:alert(1)',
    observacao_ict: null,
    ativa: false,
  },
  {
    id_instituicao: 6,
    nome_instituicao: 'Entidade com Status Inesperado',
    sigla: 'ESI',
    ict_status: null,
    natureza_institucional: 'Não determinada',
    site_oficial: null,
    observacao_ict: null,
    ativa: true,
  },
];

const SAMPLE_ATIVOS = [
  { id_ativo: 10, nome_ativo: 'Campus Ondina', tipo: 'Campi Universidade Pública - Federal', municipio: 'Salvador', territorio_identidade: 'Metropolitano de Salvador', id_instituicao: 1 },
  { id_ativo: 11, nome_ativo: 'Campus Federação', tipo: 'Campi Universidade Pública - Federal', municipio: 'Salvador', territorio_identidade: 'Metropolitano de Salvador', id_instituicao: 1 },
  { id_ativo: 12, nome_ativo: 'Campus Cabula', tipo: 'Campi Universidade Pública - Estadual', municipio: 'Salvador', territorio_identidade: 'Metropolitano de Salvador', id_instituicao: 2 },
  { id_ativo: 13, nome_ativo: 'Ativo Sem Vínculo', tipo: 'ICT', municipio: 'Ilhéus', territorio_identidade: 'Litoral Sul', id_instituicao: null },
];

describe('Módulo de Instituições (Onda 3.2)', () => {
  it('exporta o componente InstituicoesPage corretamente', () => {
    expect(typeof InstituicoesPage).toBe('function');
  });

  it('calcula contagens reais por status ICT, tratando valores nulos e inativas', () => {
    const kpis = computeInstituicoesKpis(SAMPLE_INSTITUICOES);
    expect(kpis).toEqual({
      total: 6,
      sim: 2,
      nao: 1,
      pendente: 2,
      outros: 1,
      inativas: 1,
    });
    expect(normalizeIctStatus('Não')).toBe('nao');
    expect(normalizeIctStatus(undefined)).toBe('outro');
  });

  it('deriva naturezas institucionais reais ordenadas sem inventar categorias', () => {
    const naturezas = extractNaturezasInstitucionais(SAMPLE_INSTITUICOES);
    expect(naturezas).toEqual([
      'Ambiente Promotor de Inovação',
      'Não determinada',
      'Privada com fins lucrativos',
      'Pública Estadual',
      'Pública Federal',
    ]);
  });

  it('filtra por busca textual em nome e sigla (sem acentos e case-insensitive)', () => {
    const porNome = filterInstituicoes(SAMPLE_INSTITUICOES, { search: 'sertao' });
    expect(porNome.map((i) => i.id_instituicao)).toEqual([4]);

    const porSigla = filterInstituicoes(SAMPLE_INSTITUICOES, { search: 'ufba' });
    expect(porSigla.map((i) => i.id_instituicao)).toEqual([1]);
  });

  it('filtra por status ICT e natureza institucional de forma combinada e permite limpar filtros', () => {
    const apenasSim = filterInstituicoes(SAMPLE_INSTITUICOES, { ictStatus: 'sim' });
    expect(apenasSim).toHaveLength(2);

    const apenasPendente = filterInstituicoes(SAMPLE_INSTITUICOES, { ictStatus: 'pendente' });
    expect(apenasPendente).toHaveLength(2);

    const combinado = filterInstituicoes(SAMPLE_INSTITUICOES, {
      search: 'universidade',
      ictStatus: 'sim',
      natureza: 'Pública Estadual',
    });
    expect(combinado.map((i) => i.sigla)).toEqual(['UNEB']);

    const limpo = filterInstituicoes(SAMPLE_INSTITUICOES, {
      search: '',
      ictStatus: 'todos',
      natureza: 'todas',
    });
    expect(limpo).toHaveLength(6);
  });

  it('preserva instituições inativas, sem ativos vinculados e com campos nulos', () => {
    const ativosMap = buildAtivosByInstituicaoMap(SAMPLE_ATIVOS);
    const enriched = enrichInstituicoesWithAtivos(SAMPLE_INSTITUICOES, ativosMap);

    const semAtivos = enriched.find((i) => i.id_instituicao === 3);
    expect(semAtivos.qtdAtivos).toBe(0);
    expect(semAtivos.ativosVinculados).toEqual([]);

    const inativa = enriched.find((i) => i.id_instituicao === 5);
    expect(inativa).toBeDefined();
    expect(inativa.ativa).toBe(false);
    expect(inativa.natureza_institucional).toBeNull();

    const camposNulos = enriched.find((i) => i.id_instituicao === 4);
    expect(camposNulos.sigla).toBeNull();
  });

  it('associa múltiplos ativos individuais exclusivamente à instituição selecionada', () => {
    const ativosMap = buildAtivosByInstituicaoMap(SAMPLE_ATIVOS);
    const ativosUfba = getAtivosDaInstituicao(1, ativosMap);
    expect(ativosUfba).toHaveLength(2);
    expect(ativosUfba.map((a) => a.id_ativo)).toEqual([10, 11]);

    expect(getAtivosDaInstituicao(3, ativosMap)).toEqual([]);
    expect(getAtivosDaInstituicao(null, ativosMap)).toEqual([]);
  });

  it('sanitiza URLs de site oficial com segurança', () => {
    expect(formatSafeUrl('https://www.ufba.br')).toBe('https://www.ufba.br');
    expect(formatSafeUrl('uneb.br')).toBe('https://uneb.br');
    expect(formatSafeUrl('javascript:alert(1)')).toBeNull();
    expect(formatSafeUrl(null)).toBeNull();
  });

  it('trata lista vazia ou nula em computeInstituicoesKpis sem confundir com pendente (Onda 3.3.1)', () => {
    expect(computeInstituicoesKpis([])).toEqual({
      total: 0,
      sim: 0,
      nao: 0,
      pendente: 0,
      outros: 0,
      inativas: 0,
    });
    expect(computeInstituicoesKpis(null)).toEqual({
      total: 0,
      sim: 0,
      nao: 0,
      pendente: 0,
      outros: 0,
      inativas: 0,
    });
    expect(computeInstituicoesKpis(undefined)).toEqual({
      total: 0,
      sim: 0,
      nao: 0,
      pendente: 0,
      outros: 0,
      inativas: 0,
    });
  });

  it('mantém contagem institucional independente de múltiplos ativos vinculados (Onda 3.3.1)', () => {
    const umaInst = [{ id_instituicao: 1, nome_instituicao: 'UFBA', ict_status: 'sim', ativa: true }];
    const dezAtivos = Array.from({ length: 10 }, (_, idx) => ({ id_ativo: idx + 1, id_instituicao: 1 }));
    const kpis = computeInstituicoesKpis(umaInst);
    expect(kpis.total).toBe(1);
    expect(kpis.sim).toBe(1);
    expect(dezAtivos).toHaveLength(10);
  });

  it('filtra ativos por instituição, isola ativos sem vínculo e preserva lista completa em todas (Onda 3.3.2)', () => {
    expect(filterAtivosByInstituicao(SAMPLE_ATIVOS, 'todas')).toHaveLength(4);
    expect(filterAtivosByInstituicao(SAMPLE_ATIVOS, '1').map((a) => a.id_ativo)).toEqual([10, 11]);
    expect(filterAtivosByInstituicao(SAMPLE_ATIVOS, '3')).toEqual([]);
    expect(filterAtivosByInstituicao(SAMPLE_ATIVOS, SEM_INSTITUICAO_FILTER).map((a) => a.id_ativo)).toEqual([13]);
    expect(filterAtivosByInstituicao(null, 'todas')).toEqual([]);
  });

  it('formata rótulo institucional com e sem sigla (Onda 3.3.2)', () => {
    expect(formatInstituicaoLabel('Universidade Federal da Bahia', 'UFBA')).toBe('Universidade Federal da Bahia (UFBA)');
    expect(formatInstituicaoLabel('Centro de Inovação do Sertão', null)).toBe('Centro de Inovação do Sertão');
    expect(formatInstituicaoLabel(null, 'UFBA')).toBe('');
  });

  it('calcula analytics institucionais sem duplicação e preserva ativos sem vínculo (Onda 3.3.3)', () => {
    const analytics = computeInstituicoesAnalytics(SAMPLE_INSTITUICOES, SAMPLE_ATIVOS);
    expect(analytics.kpis).toEqual({
      total: 6,
      sim: 2,
      nao: 1,
      pendente: 2,
      outros: 1,
      inativas: 1,
    });
    expect(analytics.comAtivos).toBe(2);
    expect(analytics.semAtivos).toBe(4);
    expect(analytics.ativosEscopo).toEqual({
      total: 4,
      vinculados: 3,
      semVinculo: 1,
      taxaVinculo: '75.0',
    });
    expect(analytics.porNatureza.find((n) => n.natureza === 'Não informada')?.count).toBe(1);

    const vazio = computeInstituicoesAnalytics([], []);
    expect(vazio.kpis.total).toBe(0);
    expect(vazio.comAtivos).toBe(0);
    expect(vazio.semAtivos).toBe(0);
    expect(vazio.ativosEscopo.total).toBe(0);
  });

  it('gera planilha XLSX de ativos preservando as 12 colunas originais + 7 institucionais ao final sem duplicação (Onda 3.3.4)', () => {
    const sampleExportAtivos = [
      {
        id_ativo: 6,
        nome_ativo: 'Universidade Federal da Bahia',
        sigla: 'UFBA',
        tipo: 'Campi Universidade Pública - Federal',
        municipio: 'Salvador',
        territorio_identidade: 'Metropolitano de Salvador',
        rnp: true,
        semiarido: false,
        latitude: -12.999,
        longitude: -38.51,
        titulo_referencia: 'Portal UFBA',
        url_referencia: 'https://ufba.br',
        id_instituicao: 1,
        nome_instituicao: 'Universidade Federal da Bahia',
        sigla_instituicao: 'UFBA',
        ict_status: 'sim',
        natureza_institucional: null,
        natureza_instituicao: 'Pública Federal',
        site_oficial: 'https://www.ufba.br',
        parceiro_local: null,
      },
      {
        id_ativo: 76,
        nome_ativo: 'Ativo Sem Vínculo Exemplo',
        sigla: null,
        tipo: 'Centro de Pesquisa',
        municipio: 'Ilhéus',
        territorio_identidade: 'Litoral Sul',
        rnp: false,
        semiarido: false,
        latitude: null,
        longitude: null,
        titulo_referencia: null,
        url_referencia: null,
        id_instituicao: null,
        nome_instituicao: null,
        sigla_instituicao: null,
        ict_status: null,
        natureza_instituicao: null,
        site_oficial: null,
        parceiro_local: 'Prefeitura Parceira',
      },
    ];

    const rows = buildAtivosExportRows(sampleExportAtivos);
    expect(rows).toHaveLength(2);

    const expectedHeaders = [
      'ID',
      'Nome do Ativo',
      'Sigla',
      'Tipo de Ativo',
      'Município',
      'Território de Identidade',
      'Conexão RNP',
      'Pertence ao Semiárido',
      'Latitude',
      'Longitude',
      'Título Referência',
      'URL Referência',
      'ID da Instituição',
      'Nome da Instituição',
      'Sigla da Instituição',
      'Status ICT',
      'Natureza Institucional',
      'Site Oficial',
      'Parceiro Local',
    ];
    expect(Object.keys(rows[0])).toEqual(expectedHeaders);

    // Round-trip real via SheetJS (XLSX)
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Ativos de CT&I');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const readWb = XLSX.read(buf, { type: 'buffer' });
    expect(readWb.SheetNames).toEqual(['Ativos de CT&I']);

    const parsed = XLSX.utils.sheet_to_json(readWb.Sheets['Ativos de CT&I'], { defval: '' });
    expect(parsed).toHaveLength(2);
    expect(Object.keys(parsed[0])).toEqual(expectedHeaders);

    // Vinculado
    expect(parsed[0]['ID']).toBe(6);
    expect(parsed[0]['Conexão RNP']).toBe('Sim');
    expect(parsed[0]['ID da Instituição']).toBe(1);
    expect(parsed[0]['Nome da Instituição']).toBe('Universidade Federal da Bahia');
    expect(parsed[0]['Sigla da Instituição']).toBe('UFBA');
    expect(parsed[0]['Status ICT']).toBe('sim');
    expect(parsed[0]['Natureza Institucional']).toBe('Pública Federal');
    expect(parsed[0]['Site Oficial']).toBe('https://www.ufba.br');
    expect(parsed[0]['Parceiro Local']).toBe('');

    // Sem vínculo institucional + Parceiro Local preservado
    expect(parsed[1]['ID']).toBe(76);
    expect(parsed[1]['Conexão RNP']).toBe('Não');
    expect(parsed[1]['ID da Instituição']).toBe('');
    expect(parsed[1]['Nome da Instituição']).toBe('');
    expect(parsed[1]['Sigla da Instituição']).toBe('');
    expect(parsed[1]['Status ICT']).toBe('');
    expect(parsed[1]['Natureza Institucional']).toBe('');
    expect(parsed[1]['Site Oficial']).toBe('');
    expect(parsed[1]['Parceiro Local']).toBe('Prefeitura Parceira');
  });
});
