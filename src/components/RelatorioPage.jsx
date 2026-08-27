import React, { useState, useContext, useMemo, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Building2, 
  GraduationCap, 
  GitPullRequest, 
  Database, 
  MapPin, 
  TrendingUp, 
  Users, 
  Check, 
  Layers, 
  Globe, 
  Wifi, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight, 
  Filter, 
  ArrowUpDown,
  Sparkles,
  Award,
  BarChart3
} from 'lucide-react';
import { DataContext } from '../context/DataContext';

// Helper para limpeza de sufixos de campus / cidade nas IES
function cleanIes(name) {
  if (!name) return '';
  return String(name)
    .replace(/\s*-\s*Campus\b.*$/i, '')
    .replace(/\s*-\s*Polo\b.*$/i, '')
    .replace(/\s*-\s*Unidade\b.*$/i, '')
    .replace(/\s*\((?:campus|polo|sede|ead).*?\)/gi, '')
    .trim();
}

console.log('RelatorioPage montado!');

export default function RelatorioPage() {
  const { 
    territoriosData = [], 
    ativosData = [], 
    cursosData = [], 
    distribuicaoCadeias = [], 
    municipiosTerritorios = [],
    kpisGlobais = {},
    loadingStats = false 
  } = useContext(DataContext);

  // CAIXA 1: Território selecionado. 'bahia' = Toda a Bahia (Padrão)
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('bahia');
  const [searchTerritory, setSearchTerritory] = useState('');

  // CAIXA 2: Tipo de Relatório selecionado
  // 'sintese' | 'ativos' | 'cursos' | 'cadeias' | 'municipios'
  const [reportType, setReportType] = useState('sintese');
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Referência do painel de impressão
  const printRef = useRef();

  // Território selecionado (objeto) ou null se for Toda a Bahia
  const selectedTerritory = useMemo(() => {
    if (selectedTerritoryId === 'bahia') return null;
    return territoriosData.find(t => String(t.id_territorio) === String(selectedTerritoryId)) || null;
  }, [territoriosData, selectedTerritoryId]);

  const territoryTitle = selectedTerritory 
    ? (selectedTerritory.nome_territorio || selectedTerritory.territorio)
    : 'Estado da Bahia (Toda a Bahia)';

  // Lista dos 27 territórios ordenados alfabeticamente
  const sortedTerritorios = useMemo(() => {
    const list = [...territoriosData];
    list.sort((a, b) => {
      const nameA = (a.nome_territorio || a.territorio || '').toLowerCase();
      const nameB = (b.nome_territorio || b.territorio || '').toLowerCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
    if (!searchTerritory.trim()) return list;
    const q = searchTerritory.toLowerCase().trim();
    return list.filter(t => 
      (t.nome_territorio && t.nome_territorio.toLowerCase().includes(q)) ||
      (t.territorio && t.territorio.toLowerCase().includes(q))
    );
  }, [territoriosData, searchTerritory]);

  // DADOS FILTRADOS PELO ESCOPO (TODA A BAHIA OU TERRITÓRIO SELECIONADO)
  const scopedAtivos = useMemo(() => {
    if (selectedTerritoryId === 'bahia') return ativosData;
    return ativosData.filter(a => String(a.id_territorio) === String(selectedTerritoryId));
  }, [ativosData, selectedTerritoryId]);

  const scopedCursos = useMemo(() => {
    if (selectedTerritoryId === 'bahia') return cursosData;
    return cursosData.filter(c => String(c.id_territorio) === String(selectedTerritoryId));
  }, [cursosData, selectedTerritoryId]);

  const scopedCadeias = useMemo(() => {
    if (selectedTerritoryId === 'bahia') return distribuicaoCadeias;
    return distribuicaoCadeias.filter(d => String(d.id_territorio) === String(selectedTerritoryId));
  }, [distribuicaoCadeias, selectedTerritoryId]);

  const scopedMunicipios = useMemo(() => {
    if (selectedTerritoryId === 'bahia') return municipiosTerritorios;
    return municipiosTerritorios.filter(m => String(m.id_territorio) === String(selectedTerritoryId));
  }, [municipiosTerritorios, selectedTerritoryId]);

  // ESTATÍSTICAS INTEGRADAS DA SÍNTESE
  const statsSintese = useMemo(() => {
    const totalAtivos = scopedAtivos.length;
    const totalCursos = scopedCursos.length;
    const eadCursos = scopedCursos.filter(c => c.ead).length;
    const presencialCursos = totalCursos - eadCursos;
    const eadTaxa = totalCursos > 0 ? ((eadCursos / totalCursos) * 100).toFixed(1) : '0.0';

    const rnpAtivos = scopedAtivos.filter(a => a.rnp).length;
    const rnpTaxa = totalAtivos > 0 ? ((rnpAtivos / totalAtivos) * 100).toFixed(1) : '0.0';

    const uniqueCadeias = new Set(scopedCadeias.map(c => c.cadeia_produtiva || c.nome_cadeia || c.id_cadeia_produtiva));
    const totalCadeias = uniqueCadeias.size;

    // Municípios atendidos com pelo menos 1 ativo ou curso
    const munComAtivo = new Set(scopedAtivos.map(a => a.id_municipio || a.municipio));
    const munComCurso = new Set(scopedCursos.map(c => c.id_municipio || c.municipio));
    const munAtendidos = new Set([...munComAtivo, ...munComCurso]);

    const totalMunEscopo = scopedMunicipios.length || (selectedTerritoryId === 'bahia' ? 417 : 0);

    // População e IFDM
    let populacaoTotal = 0;
    let ifdmMedio = null;

    if (selectedTerritory) {
      populacaoTotal = Number(selectedTerritory.populacao) || 0;
      ifdmMedio = selectedTerritory.media_ifdm;
    } else {
      populacaoTotal = territoriosData.reduce((acc, t) => acc + (Number(t.populacao) || 0), 0);
      const validIfdms = territoriosData.map(t => Number(t.media_ifdm)).filter(n => !isNaN(n) && n > 0);
      ifdmMedio = validIfdms.length > 0 ? (validIfdms.reduce((a, b) => a + b, 0) / validIfdms.length).toFixed(3) : '0.620';
    }

    return {
      totalAtivos,
      rnpAtivos,
      rnpTaxa,
      totalCursos,
      eadCursos,
      presencialCursos,
      eadTaxa,
      totalCadeias,
      totalMunEscopo,
      munAtendidosCount: munAtendidos.size,
      taxaCoberturaMun: totalMunEscopo > 0 ? ((munAtendidos.size / totalMunEscopo) * 100).toFixed(1) : '0.0',
      populacaoTotal: populacaoTotal ? populacaoTotal.toLocaleString('pt-BR') : '14.141.626',
      ifdmMedio
    };
  }, [scopedAtivos, scopedCursos, scopedCadeias, scopedMunicipios, selectedTerritory, selectedTerritoryId, territoriosData]);

  // TIPOS DE RELATÓRIO CONFIGURADOS
  const reportOptions = [
    { 
      id: 'sintese', 
      label: 'Síntese Executiva', 
      icon: BarChart3,
      desc: 'Visão geral integrada de indicadores, cobertura e infraestrutura',
      badge: 'Geral'
    },
    { 
      id: 'ativos', 
      label: 'Ativos de CT&I', 
      icon: Database,
      desc: 'Laboratórios, centros de pesquisa, polos e conectividade RNP',
      badge: `${scopedAtivos.length} ativos`
    },
    { 
      id: 'cursos', 
      label: 'Cursos Superiores', 
      icon: GraduationCap,
      desc: 'Graduações e pós-graduações, instituições ofertantes e EaD',
      badge: `${scopedCursos.length} cursos`
    },
    { 
      id: 'cadeias', 
      label: 'Cadeias Produtivas', 
      icon: GitPullRequest,
      desc: 'Sectores econômicos mapeados, tipologias e teia territorial',
      badge: `${statsSintese.totalCadeias} cadeias`
    },
    { 
      id: 'municipios', 
      label: 'Cobertura Municipal', 
      icon: MapPin,
      desc: 'Cruzamento municipal de dados, presença de ativos e cursos',
      badge: `${scopedMunicipios.length || (selectedTerritoryId === 'bahia' ? 417 : 0)} municípios`
    }
  ];

  // FILTRAGEM E ORDENAÇÃO DE TABELAS CONFORME O RELATÓRIO
  const tableData = useMemo(() => {
    let list = [];
    const q = tableSearch.toLowerCase().trim();

    if (reportType === 'ativos') {
      list = scopedAtivos.map(a => ({
        col1: a.nome_ativo || a.ativo || 'Ativo sem nome',
        col2: a.sigla || '-',
        col3: a.tipo || 'Geral',
        col4: a.municipio || '-',
        col5: a.territorio || '-',
        col6: a.rnp ? 'Sim (RNP Conectado)' : 'Não',
        raw: a
      }));
    } else if (reportType === 'cursos') {
      list = scopedCursos.map(c => ({
        col1: c.curso || 'Curso',
        col2: c.sigla || cleanIes(c.entidade) || '-',
        col3: c.categoria || 'Geral',
        col4: c.municipio || '-',
        col5: c.territorio_identidade || '-',
        col6: c.ead ? 'EaD' : 'Presencial',
        raw: c
      }));
    } else if (reportType === 'cadeias') {
      // Agrupar por cadeia
      const map = new Map();
      scopedCadeias.forEach(cad => {
        const name = cad.cadeia_produtiva || cad.nome_cadeia || 'Cadeia Produtiva';
        const tipo = cad.tipo_cadeia || 'Setor Econômico';
        if (!map.has(name)) {
          map.set(name, { name, tipo, territorios: new Set() });
        }
        if (cad.territorio) map.get(name).territorios.add(cad.territorio);
      });
      list = Array.from(map.values()).map(item => ({
        col1: item.name,
        col2: item.tipo,
        col3: `${item.territorios.size} território(s)`,
        col4: Array.from(item.territorios).slice(0, 3).join(', ') + (item.territorios.size > 3 ? '...' : ''),
        col5: 'Cadeia Ativa',
        col6: 'Mapeada',
        raw: item
      }));
    } else if (reportType === 'municipios') {
      // Contagem por município
      const ativosPorMun = {};
      scopedAtivos.forEach(a => {
        const m = a.municipio;
        if (m) ativosPorMun[m] = (ativosPorMun[m] || 0) + 1;
      });
      const cursosPorMun = {};
      scopedCursos.forEach(c => {
        const m = c.municipio;
        if (m) cursosPorMun[m] = (cursosPorMun[m] || 0) + 1;
      });

      list = scopedMunicipios.map(m => {
        const nomeMun = m.municipio || m.nome_municipio || 'Município';
        const qtdAtivos = ativosPorMun[nomeMun] || 0;
        const qtdCursos = cursosPorMun[nomeMun] || 0;
        return {
          col1: nomeMun,
          col2: m.territorio || m.nome_territorio || '-',
          col3: m.codigo_ibge || m.id_municipio || '-',
          col4: `${qtdAtivos} ativo(s)`,
          col5: `${qtdCursos} curso(s)`,
          col6: qtdAtivos > 0 || qtdCursos > 0 ? 'Com Atendimento CT&I' : 'Sem infraestrutura registrada',
          raw: m
        };
      });
    }

    if (q) {
      list = list.filter(row => 
        String(row.col1).toLowerCase().includes(q) ||
        String(row.col2).toLowerCase().includes(q) ||
        String(row.col3).toLowerCase().includes(q) ||
        String(row.col4).toLowerCase().includes(q) ||
        String(row.col5).toLowerCase().includes(q) ||
        String(row.col6).toLowerCase().includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        return sortAsc ? valA.localeCompare(valB, 'pt-BR') : valB.localeCompare(valA, 'pt-BR');
      });
    }

    return list;
  }, [reportType, scopedAtivos, scopedCursos, scopedCadeias, scopedMunicipios, tableSearch, sortField, sortAsc]);

  // FUNÇÕES DE EXPORTAÇÃO
  const handleExportCSV = () => {
    if (!tableData || tableData.length === 0) {
      alert('Nenhum dado disponível para exportar no momento.');
      return;
    }

    let headers = [];
    if (reportType === 'ativos') headers = ['Nome do Ativo', 'Sigla', 'Tipo', 'Município', 'Território', 'RNP'];
    else if (reportType === 'cursos') headers = ['Curso', 'Instituição / IES', 'Área de Conhecimento', 'Município', 'Território', 'Modalidade'];
    else if (reportType === 'cadeias') headers = ['Cadeia Produtiva', 'Tipo / Setor', 'Qtd Territórios', 'Territórios de Abrangência', 'Status', 'Situação'];
    else if (reportType === 'municipios') headers = ['Município', 'Território de Identidade', 'Código IBGE', 'Qtd Ativos', 'Qtd Cursos', 'Status CT&I'];
    else headers = ['Indicador', 'Valor', 'Categoria', 'Escopo', 'Data', 'Status'];

    const rows = tableData.map(r => [
      `"${String(r.col1 || '').replace(/"/g, '""')}"`,
      `"${String(r.col2 || '').replace(/"/g, '""')}"`,
      `"${String(r.col3 || '').replace(/"/g, '""')}"`,
      `"${String(r.col4 || '').replace(/"/g, '""')}"`,
      `"${String(r.col5 || '').replace(/"/g, '""')}"`,
      `"${String(r.col6 || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${reportType}_${selectedTerritoryId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const exportObject = {
      relatorio: reportType,
      abrangencia: territoryTitle,
      data_geracao: new Date().toISOString(),
      estatisticas: statsSintese,
      itens: tableData.map(r => r.raw)
    };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${reportType}_${selectedTerritoryId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col p-4 sm:p-6 lg:p-7 min-h-0 overflow-hidden font-sans select-none bg-[#F8FAFC] print:h-auto print:overflow-visible print:bg-white print:p-0">
      
      {/* ================= TOPO: CABEÇALHO DO MÓDULO DE RELATÓRIOS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 pr-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#2563EB]/10 text-[#2563EB] p-1.5 rounded-xl flex items-center justify-center">
              <FileText size={18} strokeWidth={2.5} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1D3557] tracking-tight">
              Relatórios Executivos de CT&I
            </h1>
            <span className="text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] border border-[#10B981]/25">
              Dados Oficiais SECTI/BA
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#457B9D] font-medium mt-0.5 max-w-[70%]">
            Geração de relatórios, sínteses territoriais e exportação de dados consolidados
          </p>
        </div>
      </div>

      {/* ================= CORPO PRINCIPAL: AS DUAS CAIXAS ESPECIFICADAS ================= */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden print:block print:h-auto print:overflow-visible">

         {/* -------------------------------------------------------------
             CAIXA 1: ABRANGÊNCIA TERRITORIAL (ESQUERDA)
             Por padrão retorna Toda a Bahia quando nada for selecionado,
             e possui a lista completa dos 27 territórios pesquisável.
            ------------------------------------------------------------- */}
         <div className="w-full lg:w-[340px] xl:w-[360px] bg-white rounded-[28px] border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] p-4 sm:p-5 flex flex-col min-h-0 shrink-0 print:hidden">
          
          {/* CABEÇALHO DA CAIXA 1 */}
          <div className="mb-3.5 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-[#457B9D] uppercase tracking-wider">
                Caixa 1 • Escopo Geográfico
              </span>
              <span className="text-[10px] font-extrabold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                {selectedTerritoryId === 'bahia' ? '27 Territórios' : '1 Território'}
              </span>
            </div>
            <h2 className="text-sm sm:text-[15px] font-black text-[#1D3557] tracking-tight">
              Abrangência Territorial
            </h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Selecione o estado inteiro ou clique em um território específico:
            </p>
          </div>

          {/* ITEM PADRÃO FIXO NO TOPO: TODA A BAHIA */}
          <div
            onClick={() => setSelectedTerritoryId('bahia')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer mb-3 flex items-center justify-between gap-3 ${
              selectedTerritoryId === 'bahia'
                ? 'bg-gradient-to-r from-[#1D3557] to-[#2563EB] text-white border-transparent shadow-md ring-2 ring-[#2563EB]/25'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#1D3557] hover:bg-white hover:border-[#2563EB]/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-[12px] shadow-sm ${
                selectedTerritoryId === 'bahia' ? 'bg-white/20 text-white' : 'bg-[#1D3557] text-white'
              }`}>
                BA
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className={`text-xs font-black truncate ${selectedTerritoryId === 'bahia' ? 'text-white' : 'text-[#1D3557]'}`}>
                    Toda a Bahia
                  </h3>
                  <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    selectedTerritoryId === 'bahia' ? 'bg-white/20 text-white' : 'bg-[#10B981]/15 text-[#059669]'
                  }`}>
                    Padrão Estadual
                  </span>
                </div>
                <span className={`text-[10px] truncate ${selectedTerritoryId === 'bahia' ? 'text-white/80' : 'text-[#457B9D]'}`}>
                  Consolidação dos 417 municípios
                </span>
              </div>
            </div>

            {selectedTerritoryId === 'bahia' ? (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
            ) : (
              <span className="text-[10px] font-bold text-[#457B9D] shrink-0">
                Selecionar
              </span>
            )}
          </div>

          {/* BUSCA DE TERRITÓRIOS */}
          <div className="relative mb-2.5 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#457B9D]" />
            <input
              type="text"
              value={searchTerritory}
              onChange={(e) => setSearchTerritory(e.target.value)}
              placeholder="Buscar território de identidade..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#1D3557] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
            />
            {searchTerritory && (
              <button
                type="button"
                onClick={() => setSearchTerritory('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1D3557] text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* LISTA SCROLLÁVEL DOS 27 TERRITÓRIOS */}
          <div className="flex-1 overflow-y-auto px-1.5 py-1 -mx-1.5 pr-2 flex flex-col gap-1.5 min-h-0">
            {sortedTerritorios.length > 0 ? (
              sortedTerritorios.map((t) => {
                const isSelected = String(t.id_territorio) === String(selectedTerritoryId);
                const tName = t.nome_territorio || t.territorio;

                return (
                  <div
                    key={t.id_territorio}
                    onClick={() => setSelectedTerritoryId(String(t.id_territorio))}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs ring-2 ring-[#2563EB]/25 text-[#1E40AF]'
                        : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs text-[#1D3557]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-[10px] ${
                        isSelected ? 'bg-[#2563EB] text-white' : 'bg-[#E2E8F0] text-[#457B9D]'
                      }`}>
                        <MapPin size={12} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-bold leading-tight truncate">
                          {tName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-[#64748B] mt-0.5">
                          <span>{t.ativos_cti || 0} ativos</span>
                          <span>•</span>
                          <span>{t.qtd_cursos_cti || 0} cursos</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.media_ifdm && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white text-[#457B9D] border border-[#E2E8F0]" title="IFDM Médio">
                          IFDM {t.media_ifdm}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={13} className="text-[#2563EB]" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-[#94A3B8] text-xs">
                Nenhum território encontrado com esse nome.
              </div>
            )}
          </div>

          {/* RODAPÉ DA CAIXA 1: RESUMO DO ESCOPO ATIVO */}
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] shrink-0 text-[10.5px] text-[#64748B] flex items-center justify-between">
            <span className="font-semibold truncate">
              Escopo: <strong className="text-[#1D3557]">{territoryTitle}</strong>
            </span>
            <span className="font-bold text-[#2563EB]">
              {selectedTerritoryId === 'bahia' ? 'Bahia Toda' : 'Território Único'}
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------------
            CAIXA 2: TIPOS DE RELATÓRIO E OS SEUS DADOS (DIREITA)
            Permite selecionar o tipo de relatório e exibe todos os seus
            dados correspondentes, com KPIs, tabelas, busca e paginação.
           ------------------------------------------------------------- */}
        <div 
          ref={printRef}
          className="flex-1 bg-white rounded-[28px] border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] p-4 sm:p-5 lg:p-6 flex flex-col min-h-0 overflow-hidden print:h-auto print:overflow-visible print:shadow-none print:border-none print:p-0 print:rounded-none"
        >
          
          {/* CABEÇALHO DA CAIXA 2: SELETOR DOS TIPOS DE RELATÓRIO */}
          <div className="mb-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[#457B9D] uppercase tracking-wider hidden sm:block">
                  Caixa 2 • Relatório e Dados
                </span>
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#1D3557] bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                  <Globe size={12} className="text-[#2563EB]" />
                  <span>Exibindo: <strong>{territoryTitle}</strong></span>
                </div>
              </div>

              {/* BOTÕES DE EXPORTAÇÃO E IMPRESSÃO (MOVIDOS PARA A CAIXA 2) */}
              <div className="flex items-center gap-1.5 self-start sm:self-center print:hidden">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-[#D6EAF8] text-[#1D3557] hover:bg-[#F1F5F9] hover:border-[#2563EB] shadow-2xs transition-all cursor-pointer"
                  title="Baixar dados tabulares em formato CSV para Excel"
                >
                  <Download size={13} className="text-[#2563EB]" />
                  <span className="hidden xl:inline">Exportar CSV</span>
                  <span className="inline xl:hidden">CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-[#D6EAF8] text-[#1D3557] hover:bg-[#F1F5F9] shadow-2xs transition-all cursor-pointer"
                  title="Baixar em formato estruturado JSON"
                >
                  <span>JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#1D3557] text-white hover:bg-[#2563EB] shadow-sm transition-all cursor-pointer"
                  title="Imprimir relatório ou salvar como PDF"
                >
                  <Printer size={13} />
                  <span className="hidden xl:inline">Imprimir / PDF</span>
                  <span className="inline xl:hidden">Imprimir</span>
                </button>
              </div>
            </div>

            {/* ABAS / BOTÕES DOS TIPOS DE RELATÓRIO */}
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-2xl border border-[#E2E8F0] gap-1 overflow-x-auto print:hidden">
              {reportOptions.map((opt) => {
                const isActive = reportType === opt.id;
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setReportType(opt.id);
                      setTableSearch('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 flex-1 justify-center ${
                      isActive
                        ? 'bg-[#1D3557] text-white shadow-xs'
                        : 'text-[#457B9D] hover:text-[#1D3557] hover:bg-white/60'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#457B9D]'
                    }`}>
                      {opt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARTÕES DE RESUMO / KPIS DINÂMICOS DO RELATÓRIO SELECIONADO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 shrink-0">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-[#457B9D] uppercase tracking-wider flex items-center gap-1">
                <Database size={11} className="text-[#2563EB]" />
                Ativos de CT&I
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-[#1D3557]">
                  {statsSintese.totalAtivos}
                </span>
                <span className="text-[10px] font-bold text-[#10B981]">
                  {statsSintese.rnpAtivos} RNP ({statsSintese.rnpTaxa}%)
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-[#457B9D] uppercase tracking-wider flex items-center gap-1">
                <GraduationCap size={11} className="text-[#8B5CF6]" />
                Cursos CT&I
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-[#1D3557]">
                  {statsSintese.totalCursos}
                </span>
                <span className="text-[10px] font-bold text-[#8B5CF6] flex items-center gap-0.5">
                  <Wifi size={10} /> {statsSintese.eadTaxa}% EaD
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-[#457B9D] uppercase tracking-wider flex items-center gap-1">
                <GitPullRequest size={11} className="text-[#F59E0B]" />
                Cadeias Mapeadas
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-[#1D3557]">
                  {statsSintese.totalCadeias}
                </span>
                <span className="text-[10px] font-bold text-[#64748B]">
                  setores estratégicos
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-[#457B9D] uppercase tracking-wider flex items-center gap-1">
                <MapPin size={11} className="text-[#EF4444]" />
                Municípios Atendidos
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-[#1D3557]">
                  {statsSintese.munAtendidosCount} / {statsSintese.totalMunEscopo}
                </span>
                <span className="text-[10px] font-bold text-[#059669]">
                  {statsSintese.taxaCoberturaMun}%
                </span>
              </div>
            </div>
          </div>

          {/* ================= CONTEÚDO ESPECÍFICO DO TIPO DE RELATÓRIO ================= */}
          
          {/* CASO 1: SÍNTESE EXECUTIVA TERRITORIAL */}
          {reportType === 'sintese' && (
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
              
              {/* CARTÃO DE APRESENTAÇÃO DO ESCOPO */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1D3557] to-[#2B4C7E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-col max-w-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={16} className="text-[#A8DADC]" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#A8DADC]">
                      Documento Analítico SECTI
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black leading-tight">
                    {territoryTitle}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    {selectedTerritory 
                      ? `Relatório territorial consolidado abrangendo ${statsSintese.totalMunEscopo} municípios pertencentes a este Território de Identidade, integrando infraestrutura física, formação superior e vocações produtivas.`
                      : 'Panorama executivo estadual consolidando os 27 Territórios de Identidade e todos os 417 municípios da Bahia cadastrados na infraestrutura pública e privada de Ciência, Tecnologia e Inovação.'
                    }
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:items-end">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                    <span className="text-[9px] text-white/70 block">População Estimada</span>
                    <strong className="text-sm font-black">{statsSintese.populacaoTotal} hab.</strong>
                  </div>
                  {statsSintese.ifdmMedio && (
                    <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                      <span className="text-[9px] text-white/70 block">IFDM Médio FIRJAN</span>
                      <strong className="text-sm font-black">{statsSintese.ifdmMedio}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* GRIDS DE ANÁLISE COMPARATIVA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* BLOCO 1: INFRAESTRUTURA DE ATIVOS E CONECTIVIDADE */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <h4 className="text-xs font-black text-[#1D3557] flex items-center gap-1.5">
                      <Database size={13} className="text-[#2563EB]" />
                      Infraestrutura de CT&I & RNP
                    </h4>
                    <span className="text-[10px] font-extrabold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                      {scopedAtivos.length} Registros
                    </span>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Distribuição da conectividade avançada e polos de tecnologia operando no escopo:
                  </p>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#1D3557] mb-1">
                        <span>Pontos de Presença / Conexão RNP</span>
                        <span>{statsSintese.rnpAtivos} de {statsSintese.totalAtivos} ({statsSintese.rnpTaxa}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#00B4D8]"
                          style={{ width: `${statsSintese.rnpTaxa}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#1D3557] mb-1">
                        <span>Demais Ativos Institucionais / Lab</span>
                        <span>{statsSintese.totalAtivos - statsSintese.rnpAtivos} ({(100 - Number(statsSintese.rnpTaxa)).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#3B82F6]"
                          style={{ width: `${100 - Number(statsSintese.rnpTaxa)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: FORMAÇÃO SUPERIOR E MODALIDADES */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <h4 className="text-xs font-black text-[#1D3557] flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#8B5CF6]" />
                      Oferta Educacional CT&I (Presencial vs. EaD)
                    </h4>
                    <span className="text-[10px] font-extrabold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">
                      {scopedCursos.length} Cursos
                    </span>
                  </div>

                  <p className="text-[11px] text-[#64748B]">
                    Proporção de modalidade dos cursos superiores de ciência, tecnologia e inovação:
                  </p>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#1D3557] mb-1">
                        <span>Cursos Presenciais</span>
                        <span>{statsSintese.presencialCursos} ({(100 - Number(statsSintese.eadTaxa)).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#2563EB]"
                          style={{ width: `${100 - Number(statsSintese.eadTaxa)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-purple-700 mb-1">
                        <span className="flex items-center gap-1"><Wifi size={11} /> Cursos EaD (A Distância)</span>
                        <span>{statsSintese.eadCursos} ({statsSintese.eadTaxa}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-purple-500"
                          style={{ width: `${statsSintese.eadTaxa}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* VOCAÇÕES PRODUTIVAS MAPEADAS */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-[#1D3557] flex items-center gap-1.5">
                    <GitPullRequest size={13} className="text-[#F59E0B]" />
                    Vocações Econômicas e Cadeias Produtivas Mapeadas ({statsSintese.totalCadeias})
                  </h4>
                  <span className="text-[10px] text-[#457B9D] font-bold">
                    Fonte: Base Oficial SECTI / SDR
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(scopedCadeias.map(c => c.cadeia_produtiva || c.nome_cadeia))).slice(0, 24).map((cad, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[#1D3557] shadow-2xs"
                    >
                      {cad}
                    </span>
                  ))}
                  {scopedCadeias.length === 0 && (
                    <span className="text-xs text-[#94A3B8]">Nenhuma cadeia produtiva mapeada individualmente neste escopo.</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* CASO 2, 3, 4 e 5: TABELA DETALHADA DO RELATÓRIO SELECIONADO */}
          {reportType !== 'sintese' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden print:block print:h-auto print:overflow-visible">
              
              {/* BARRA DE BUSCA E FILTROS DA TABELA */}
              <div className="flex items-center justify-between gap-3 mb-3 shrink-0 print:hidden">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#457B9D]" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder={`Pesquisar nos ${tableData.length} registros...`}
                    className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#1D3557] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                  {tableSearch && (
                    <button
                      type="button"
                      onClick={() => setTableSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1D3557] text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-bold text-[#64748B] shrink-0">
                  Mostrando <strong>{tableData.length}</strong> registro(s)
                </div>
              </div>

              {/* TABELA DE DADOS COM SCROLL INTERNO */}
              <div className="flex-1 overflow-auto border border-[#E2E8F0] rounded-2xl shadow-2xs min-h-0 bg-white print:overflow-visible print:border-none print:shadow-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0] z-10 text-[#457B9D] font-extrabold text-[10.5px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">
                        {reportType === 'ativos' && 'Nome do Ativo'}
                        {reportType === 'cursos' && 'Curso Superior'}
                        {reportType === 'cadeias' && 'Cadeia Produtiva'}
                        {reportType === 'municipios' && 'Município'}
                      </th>
                      <th className="py-2.5 px-3">
                        {reportType === 'ativos' && 'Sigla'}
                        {reportType === 'cursos' && 'Instituição (IES)'}
                        {reportType === 'cadeias' && 'Setor / Tipologia'}
                        {reportType === 'municipios' && 'Território'}
                      </th>
                      <th className="py-2.5 px-3">
                        {reportType === 'ativos' && 'Tipo'}
                        {reportType === 'cursos' && 'Área de Conhecimento'}
                        {reportType === 'cadeias' && 'Abrangência'}
                        {reportType === 'municipios' && 'Código SEI/IBGE'}
                      </th>
                      <th className="py-2.5 px-3">
                        {reportType === 'ativos' && 'Município'}
                        {reportType === 'cursos' && 'Município'}
                        {reportType === 'cadeias' && 'Territórios'}
                        {reportType === 'municipios' && 'Ativos CT&I'}
                      </th>
                      <th className="py-2.5 px-3">
                        {reportType === 'ativos' && 'Território'}
                        {reportType === 'cursos' && 'Território'}
                        {reportType === 'cadeias' && 'Status'}
                        {reportType === 'municipios' && 'Cursos CT&I'}
                      </th>
                      <th className="py-2.5 px-3 text-right">
                        {reportType === 'ativos' && 'RNP'}
                        {reportType === 'cursos' && 'Modalidade'}
                        {reportType === 'cadeias' && 'Situação'}
                        {reportType === 'municipios' && 'Cobertura'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/70 text-[#1D3557]">
                    {tableData.length > 0 ? (
                      tableData.map((row, idx) => (
                        <tr 
                          key={idx}
                          className="hover:bg-[#F8FAFC] transition-colors group"
                        >
                          <td className="py-2 px-3 font-bold text-[#1D3557] max-w-[220px] truncate" title={row.col1}>
                            {row.col1}
                          </td>
                          <td className="py-2 px-3 text-[#457B9D] font-medium max-w-[160px] truncate" title={row.col2}>
                            {row.col2}
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate" title={row.col3}>
                            <span className="bg-[#F1F5F9] text-[#1D3557] px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {row.col3}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#64748B] max-w-[140px] truncate" title={row.col4}>
                            {row.col4}
                          </td>
                          <td className="py-2 px-3 text-[#64748B] max-w-[140px] truncate" title={row.col5}>
                            {row.col5}
                          </td>
                          <td className="py-2 px-3 text-right font-bold whitespace-nowrap">
                            {row.col6 === 'EaD' || row.col6 === 'Sim (RNP Conectado)' ? (
                              <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Wifi size={10} />
                                {row.col6}
                              </span>
                            ) : row.col6 === 'Presencial' ? (
                              <span className="text-[10px] font-extrabold text-[#457B9D] bg-slate-100 px-2 py-0.5 rounded-full">
                                Presencial
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-bold text-[#64748B]">
                                {row.col6}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#94A3B8] font-bold">
                          Nenhum registro encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
