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
import {
 BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
 PieChart, Pie, Cell, Legend
} from 'recharts';
import SideMap from './maps/SideMap';
import PtiMap from './maps/PtiMap';

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
 territoriesDynamicStats = {},
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
 const [isExportingPdf, setIsExportingPdf] = useState(false);


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
 const federalCursos = scopedCursos.filter(c => String(c.entidade || c.instituicao || c.nome || '').toLowerCase().includes('federal')).length;
 const estadualCursos = scopedCursos.filter(c => {
 const e = String(c.entidade || c.instituicao || c.nome || '').toLowerCase();
 return e.includes('estadual') || e.includes('estado da bahia');
 }).length;
 const privadaCursos = totalCursos - federalCursos - estadualCursos;
 
 const federalTaxa = totalCursos > 0 ? ((federalCursos / totalCursos) * 100).toFixed(1) : '0.0';
 const estadualTaxa = totalCursos > 0 ? ((estadualCursos / totalCursos) * 100).toFixed(1) : '0.0';
 const privadaTaxa = totalCursos > 0 ? ((privadaCursos / totalCursos) * 100).toFixed(1) : '0.0';

 const rnpAtivos = scopedAtivos.filter(a => a.rnp).length;
 const rnpTaxa = totalAtivos > 0 ? ((rnpAtivos / totalAtivos) * 100).toFixed(1) : '0.0';

 const uniqueCadeias = new Set(scopedCadeias.map(c => c.entidade || c.cadeia_produtiva || c.nome_cadeia || c.id_cadeia));
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
 federalCursos,
 estadualCursos,
 privadaCursos,
 federalTaxa,
 estadualTaxa,
 privadaTaxa,
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
 col5: a.territorio_identidade || a.territorio || '-',
 col6: a.rnp ? 'Sim' : 'Não',
 raw: a
 }));
 } else if (reportType === 'cursos') {
 list = scopedCursos.map(c => ({
 col1: c.nome || c.curso || 'Curso',
 col2: c.sigla || cleanIes(c.instituicao) || cleanIes(c.entidade) || '-',
 col3: c.tipo || c.categoria || 'Geral',
 col4: c.municipio || '-',
 col5: c.territorio_identidade || c.territorio || '-',
 col6: c.ead ? 'EaD' : 'Presencial',
 raw: c
 }));
 } else if (reportType === 'cadeias') {
 // Agrupar por cadeia
 const map = new Map();
 scopedCadeias.forEach(cad => {
 const name = cad.entidade || cad.cadeia_produtiva || cad.nome_cadeia || 'Cadeia Produtiva';
 const tipo = cad.nome_tipo || cad.segmento || cad.tipo_cadeia || 'Setor Econômico';
 if (!map.has(name)) {
 map.set(name, { name, tipo, territorios: new Set() });
 }
 if (cad.nome_territorio || cad.territorio) {
 map.get(name).territorios.add(cad.nome_territorio || cad.territorio);
 }
 });
 list = Array.from(map.values()).map(item => ({
 col1: item.name,
 col2: item.tipo,
 col3: `${item.territorios.size} território(s)`,
 col4: Array.from(item.territorios).slice(0, 3).join(', ') + (item.territorios.size > 3 ? '...' : ''),
 col5: '',
 col6: '',
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
 col6: qtdAtivos > 0 || qtdCursos > 0 ? 'Sim' : 'Não',
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

  const currentReportLabel = useMemo(() => {
    if (reportType === 'ativos') return 'Ativos de CT&I';
    if (reportType === 'cursos') return 'Cursos Superiores';
    if (reportType === 'cadeias') return 'Cadeias Produtivas';
    return 'Síntese Executiva';
  }, [reportType]);

  const handleExportPDF = (overrideType = null) => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);

    const type = overrideType || reportType;
    let path = '/relatorio/sintese';
    if (type === 'ativos') path = '/relatorio/ativos';
    else if (type === 'cursos') path = '/relatorio/cursos';
    else if (type === 'cadeias') path = '/relatorio/cadeias';
    else if (type === 'sintese') path = '/relatorio/sintese';

    const terrParam = selectedTerritoryId && selectedTerritoryId !== 'bahia'
      ? `territorio=${encodeURIComponent(selectedTerritoryId)}`
      : 'territorio=bahia';

    const targetUrl = `${path}?${terrParam}`;

    // Remove qualquer iframe de impressão anterior
    const oldIframe = document.getElementById('secti-pdf-print-frame');
    if (oldIframe) oldIframe.remove();

    // Cria iframe invisível no DOM
    const iframe = document.createElement('iframe');
    iframe.id = 'secti-pdf-print-frame';
    iframe.src = targetUrl;
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '1440px';
    iframe.style.height = '900px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    // Aguarda o carregamento do conteúdo no iframe
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print inacessível, usando fallback:', e);
          window.open(targetUrl + '&autoPrint=1', '_blank');
        } finally {
          setIsExportingPdf(false);
          setTimeout(() => {
            if (document.getElementById('secti-pdf-print-frame')) {
              document.getElementById('secti-pdf-print-frame').remove();
            }
          }, 4000);
        }
      }, 1200);
    };

    // Timeout de segurança
    setTimeout(() => {
      setIsExportingPdf(false);
    }, 10000);
  };


 const ativosPorTipo = useMemo(() => {
 if (reportType !== 'ativos') return [];
 const counts = {};
 scopedAtivos.forEach(a => {
 const t = a.tipo || 'Outros';
 counts[t] = (counts[t] || 0) + 1;
 });
 return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
 }, [scopedAtivos, reportType]);

 const cadeiasPorTipo = useMemo(() => {
 if (reportType !== 'cadeias') return [];
 const counts = {};
 scopedCadeias.forEach(c => {
 const t = c.nome_tipo || c.segmento || c.tipo_cadeia || 'Setor Econômico';
 counts[t] = (counts[t] || 0) + 1;
 });
 return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
 }, [scopedCadeias, reportType]);

 const cursosPorModalidade = useMemo(() => {
 return [
 { name: 'Presencial', value: statsSintese.presencialCursos, color: '#2563EB' },
 { name: 'EaD', value: statsSintese.eadCursos, color: '#8B5CF6' }
 ];
 }, [statsSintese]);

 return (
 <>
 <div className={`flex-1 w-full h-full flex flex-col p-4 sm:p-6 lg:p-7 min-h-0 overflow-hidden font-sans select-none bg-surface-soft print:hidden`}>

 {/* ================= TOPO: CABEÇALHO DO MÓDULO DE RELATÓRIOS ================= */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 pr-4 print:hidden">
 <div>
 <div className="flex items-center gap-2">
 <span className="bg-primary-600/10 text-primary-600 p-1.5 rounded-xl flex items-center justify-center">
 <FileText size={18} strokeWidth={2} />
 </span>
 <h1 className="text-xl sm:text-lg font-semibold text-text-primary tracking-tight">
 Relatórios Executivos de CT&I
 </h1>
 <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success-500/15 text-success-700 border border-success-500/25 inline-flex items-center justify-center leading-none">
 Dados Oficiais SECTI/BA
 </span>
 </div>
 <p className="text-xs sm:text-[13px] text-text-secondary font-medium mt-0.5 max-w-[70%]">
 Geração de relatórios, sínteses territoriais e exportação de dados consolidados
 </p>
 </div>
 </div>

 {/* ================= CORPO PRINCIPAL: AS DUAS CAIXAS ESPECIFICADAS ================= */}
 <div className={`flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden print:block print:h-auto print:overflow-visible min-h-0`}>



 {/* -------------------------------------------------------------
 WRAPPER DE IMPRESSÃO (CONTÉM O MAPA E A CAIXA 2)
 ------------------------------------------------------------- */}
 <div className={`flex-1 flex flex-col lg:flex-row gap-5 min-h-0 `}>

 {/* NOVO CARD DO MAPA (MEIO) */}
 <div className={`w-full lg:w-[400px] xl:w-[500px] shrink-0 bg-surface rounded-xl border border-border shadow-sm p-4 sm:p-5 flex flex-col print:hidden min-h-0`}>
 <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-3">Visão Espacial</h3>
 <div className="flex-1 w-full rounded-xl overflow-hidden border border-border shadow-sm relative z-0 bg-surface-soft">
 {(() => {
 const handleMapSelect = (t) => {
 if (t && t.id_territorio) setSelectedTerritoryId(String(t.id_territorio));
 else setSelectedTerritoryId('bahia');
 };

 if (reportType === 'ativos') return <SideMap mode="ativos" processedAtivos={scopedAtivos} selectedTerritory={selectedTerritory} onSelectTerritory={handleMapSelect} />;
 if (reportType === 'cursos') return <SideMap mode="cursos" cursosData={scopedCursos} selectedTerritory={selectedTerritory} onSelectTerritory={handleMapSelect} />;
 if (reportType === 'cadeias') return <SideMap mode="cadeias" cadeiasData={scopedCadeias} processedAtivos={scopedCadeias} selectedTerritory={selectedTerritory} onSelectTerritory={handleMapSelect} />;

 return (
 <PtiMap
 selectedTerritory={selectedTerritory}
 onSelectTerritory={handleMapSelect}
 territoriosData={territoriosData}
 territoriesDynamicStats={territoriesDynamicStats}
 semiaridoMunicipios={[]}
 filtroSemiarido={false}
 />
 );
 })()}
 </div>
 </div>

 {/* -------------------------------------------------------------
 CAIXA 2: TIPOS DE RELATÓRIO E OS SEUS DADOS (DIREITA)
 ------------------------------------------------------------- */}
 <div
 className={`flex-1 bg-surface rounded-xl border border-border shadow-sm p-4 sm:p-5 lg:p-6 flex flex-col overflow-hidden print:h-auto print:overflow-visible print:shadow-none print:border-none print:p-0 print:rounded-none min-h-0`}
 >

 {/* CABEÇALHO DA CAIXA 2: SELETOR DOS TIPOS DE RELATÓRIO */}
 <div className="mb-4 shrink-0">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-primary bg-surface-soft px-2.5 py-1 rounded-full border border-border justify-center leading-none">
 <Globe size={16} className="text-primary-600" />
 <span>Exibindo: <strong>{territoryTitle}</strong></span>
 </div>
 </div>

 {/* BOTÕES DE EXPORTAÇÃO E IMPRESSÃO (MOVIDOS PARA A CAIXA 2) */}
 <div className="tour-relatorio-export flex items-center gap-1.5 self-start sm:self-center print:hidden">
  <button
    type="button"
    disabled={isExportingPdf}
    onClick={() => handleExportPDF()}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary-900 text-white hover:bg-primary-800 disabled:opacity-60 shadow-2xs transition-all cursor-pointer justify-center leading-none"
    title={`Exportar Relatório Executivo em PDF (${currentReportLabel})`}
  >
    {isExportingPdf ? (
      <>
        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span>Gerando PDF...</span>
      </>
    ) : (
      <>
        <Printer size={15} />
        <span>Exportar PDF</span>
      </>
    )}
  </button>

 <button
 type="button"
 onClick={handleExportCSV}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-surface border border-primary-200 text-text-primary hover:bg-surface-soft hover:border-primary-600 shadow-2xs transition-all cursor-pointer justify-center leading-none"
 title="Baixar dados tabulares em formato CSV para Excel"
 >
 <Download size={16} className="text-primary-600" />
 <span className="hidden xl:inline">Exportar CSV</span>
 <span className="inline xl:hidden">CSV</span>
 </button>

 <button
 type="button"
 onClick={handleExportJSON}
 className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-surface border border-primary-200 text-text-primary hover:bg-surface-soft shadow-2xs transition-all cursor-pointer leading-none"
 title="Baixar em formato estruturado JSON"
 >
 <span>JSON</span>
 </button>


 </div>
 </div>

 {/* ABAS / BOTÕES DOS TIPOS DE RELATÓRIO */}
 <div className={`tour-relatorio-tipo flex items-center bg-surface-soft p-1 rounded-xl border border-border gap-1 overflow-x-auto print:hidden `}>
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
 className={`px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 flex-1 justify-center ${isActive
 ? 'bg-primary-900 text-white shadow-xs'
 : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
 }`}
 >
 <Icon size={14} />
 <span>{opt.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* CARTÕES DE RESUMO / KPIS DINÂMICOS DO RELATÓRIO SELECIONADO */}
 <div className="tour-relatorio-kpis grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 shrink-0">
 {/* CARD 1: Ativos */}
 <div className="relative rounded-[16px] p-4 flex flex-col items-start cursor-default overflow-hidden transition-all duration-200 hover:shadow-md surface-panel bg-primary-900/10 border border-primary-500/20 shadow-sm">
 <div className="flex items-center gap-2.5 w-full min-w-0">
 <div className="flex items-center justify-center shrink-0 mr-1">
 <Database size={16} strokeWidth={2} className="text-primary-400" />
 </div>
 <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wide truncate flex-1">
 Ativos de CT&I
 </span>
 </div>
 <div className="mt-3.5 flex items-baseline gap-2 w-full">
 <span className="text-[32px] font-bold text-text-primary tracking-tight leading-none">
 {statsSintese.totalAtivos}
 </span>
 <span className="text-[11px] font-medium text-success-500">
 {statsSintese.rnpAtivos} RNP ({statsSintese.rnpTaxa}%)
 </span>
 </div>
 </div>

 {/* CARD 2: Cursos */}
 <div className="relative rounded-[16px] p-4 flex flex-col items-start cursor-default overflow-hidden transition-all duration-200 hover:shadow-md surface-panel border border-border/50 shadow-sm">
 <div className="flex items-center gap-2.5 w-full min-w-0">
 <div className="flex items-center justify-center shrink-0 mr-1">
 <GraduationCap size={16} strokeWidth={2} className="text-[#14B8A6]" />
 </div>
 <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wide truncate flex-1">
 Cursos CT&I
 </span>
 </div>
 <div className="mt-3.5 flex items-baseline w-full">
 <span className="text-[32px] font-bold text-text-primary tracking-tight leading-none">
 {statsSintese.totalCursos}
 </span>
 </div>
 </div>

 {/* CARD 3: Cadeias */}
 <div className="relative rounded-[16px] p-4 flex flex-col items-start cursor-default overflow-hidden transition-all duration-200 hover:shadow-md surface-panel border border-border/50 shadow-sm">
 <div className="flex items-center gap-2.5 w-full min-w-0">
 <div className="flex items-center justify-center shrink-0 mr-1">
 <GitPullRequest size={16} strokeWidth={2} className="text-warning-400" />
 </div>
 <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wide truncate flex-1">
 Cadeias Mapeadas
 </span>
 </div>
 <div className="mt-3.5 flex items-baseline gap-2 w-full">
 <span className="text-[32px] font-bold text-text-primary tracking-tight leading-none">
 {statsSintese.totalCadeias}
 </span>
 <span className="text-[11px] font-medium text-text-secondary">
 setores
 </span>
 </div>
 </div>

 {/* CARD 4: Cobertura */}
 <div className="relative rounded-[16px] p-4 flex flex-col items-start cursor-default overflow-hidden transition-all duration-200 hover:shadow-md surface-panel border border-border/50 shadow-sm" title="Municípios que possuem pelo menos 1 Ativo ou Curso de CT&I mapeado">
 <div className="flex items-center gap-2.5 w-full min-w-0">
 <div className="flex items-center justify-center shrink-0 mr-1">
 <MapPin size={16} strokeWidth={2} className="text-danger-400" />
 </div>
 <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wide truncate flex-1">
 Cobertura CT&I
 </span>
 </div>
 <div className="mt-3.5 flex items-baseline gap-2 w-full">
 <span className="text-[32px] font-bold text-text-primary tracking-tight leading-none">
 {statsSintese.munAtendidosCount} <span className="text-sm font-medium text-text-secondary">/ {statsSintese.totalMunEscopo}</span>
 </span>
 <span className="text-[11px] font-medium text-success-500">
 {statsSintese.taxaCoberturaMun}% do total
 </span>
 </div>
 </div>
 </div>


 {/* ================= CONTEÚDO ESPECÍFICO DO TIPO DE RELATÓRIO ================= */}

 {/* CASO 1: SÍNTESE EXECUTIVA TERRITORIAL */}
 {reportType === 'sintese' && (
 <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">

 {/* CARTÃO DE APRESENTAÇÃO DO ESCOPO */}
 <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-primary-900 to-primary-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
 <div className="flex flex-col max-w-xl">
 <div className="flex items-center gap-2 mb-1">
 <Award size={16} className="text-primary-300" />
 <span className="text-[11px] font-medium uppercase text-primary-300">
 Documento Analítico SECTI
 </span>
 </div>
 <h3 className="text-lg sm:text-base font-semibold leading-tight">
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
 <div className="bg-surface/10 px-3 py-1.5 rounded-xl border border-white/15">
 <span className="text-[9px] text-white/70 block">População Estimada</span>
 <strong className="text-sm font-medium">{statsSintese.populacaoTotal} hab.</strong>
 </div>
 {statsSintese.ifdmMedio && (
 <div className="bg-surface/10 px-3 py-1.5 rounded-xl border border-white/15">
 <span className="text-[9px] text-white/70 block">IFDM Médio FIRJAN</span>
 <strong className="text-sm font-medium">{statsSintese.ifdmMedio}</strong>
 </div>
 )}
 </div>
 </div>

 {/* GRIDS DE ANÁLISE COMPARATIVA */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

 {/* BLOCO 1: INFRAESTRUTURA DE ATIVOS E CONECTIVIDADE */}
 <div className="p-4 rounded-xl bg-surface-soft border border-border flex flex-col gap-3">
 <div className="flex items-center justify-between border-b border-border pb-2">
 <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
 <Database size={16} className="text-primary-600" />
 Infraestrutura de CT&I & RNP
 </h4>
 <span className="text-[10px] font-semibold text-primary-600 bg-primary-600/10 px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none">
 {scopedAtivos.length} Registros
 </span>
 </div>

 <p className="text-[11px] text-text-secondary">
 Distribuição da conectividade avançada e polos de tecnologia operando no escopo:
 </p>

 <div className="space-y-3 mt-1">
 <div className="flex flex-col gap-1.5">
 <div className="flex justify-between items-center text-[11px] text-text-primary">
 <div className="flex items-center gap-1.5 font-medium">
 <span className="w-2 h-2 rounded-full bg-primary-600"></span>
 Pontos de Presença / Conexão RNP
 </div>
 <span className="font-medium">{statsSintese.rnpAtivos} de {statsSintese.totalAtivos} <span className="text-text-secondary font-medium">({statsSintese.rnpTaxa}%)</span></span>
 </div>
 <div className="flex justify-between items-center text-[11px] text-text-primary">
 <div className="flex items-center gap-1.5 font-medium">
 <span className="w-2 h-2 rounded-full bg-neutral-200"></span>
 Demais Ativos Institucionais / Lab
 </div>
 <span className="font-medium">{statsSintese.totalAtivos - statsSintese.rnpAtivos} <span className="text-text-secondary font-medium">({(100 - Number(statsSintese.rnpTaxa)).toFixed(1)}%)</span></span>
 </div>
 </div>
 <div className="w-full h-2.5 rounded-full bg-neutral-200 overflow-hidden flex">
 <div
 className="h-full bg-primary-600 transition-all"
 style={{ width: `${statsSintese.rnpTaxa}%` }}
 />
 <div
 className="h-full bg-neutral-200 transition-all"
 style={{ width: `${100 - Number(statsSintese.rnpTaxa)}%` }}
 />
 </div>
 </div>
 </div>

 {/* BLOCO 2: FORMAÇÃO SUPERIOR E MODALIDADES */}
 <div className="p-4 rounded-xl bg-surface-soft border border-border flex flex-col gap-3">
 <div className="flex items-center justify-between border-b border-border pb-2">
 <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
 <GraduationCap size={16} className="text-[#8B5CF6]" />
 Oferta Educacional CT&I
 </h4>
 <span className="text-[10px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none">
 {scopedCursos.length} Cursos
 </span>
 </div>

 <p className="text-[11px] text-text-secondary">
 Cursos superiores de ciência, tecnologia e inovação mapeados e ativos no escopo:
 </p>

 <div className="space-y-3 mt-1">
 <div>
 <div className="flex justify-between items-center text-[11px] font-medium text-text-primary mb-1">
 <span>Rede Pública Estadual</span>
 <span>{statsSintese.estadualCursos} ({statsSintese.estadualTaxa}%)</span>
 </div>
 <div className="w-full h-2 rounded-full bg-border overflow-hidden flex">
 <div className="h-full bg-primary-600 transition-all" style={{ width: `${statsSintese.estadualTaxa}%` }} />
 </div>
 </div>

 <div>
 <div className="flex justify-between items-center text-[11px] font-medium text-text-primary mb-1">
 <span>Rede Pública Federal</span>
 <span>{statsSintese.federalCursos} ({statsSintese.federalTaxa}%)</span>
 </div>
 <div className="w-full h-2 rounded-full bg-border overflow-hidden flex">
 <div className="h-full bg-success-700 transition-all" style={{ width: `${statsSintese.federalTaxa}%` }} />
 </div>
 </div>

 <div>
 <div className="flex justify-between items-center text-[11px] font-medium text-text-primary mb-1">
 <span>Rede Privada / Outros</span>
 <span>{statsSintese.privadaCursos} ({statsSintese.privadaTaxa}%)</span>
 </div>
 <div className="w-full h-2 rounded-full bg-border overflow-hidden flex">
 <div className="h-full bg-[#8B5CF6] transition-all" style={{ width: `${statsSintese.privadaTaxa}%` }} />
 </div>
 </div>
 </div>
 </div>

 </div>

 {/* VOCAÇÕES PRODUTIVAS MAPEADAS */}
 <div className="p-4 rounded-xl bg-surface-soft border border-border">
 <div className="flex items-center justify-between mb-2">
 <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
 <GitPullRequest size={16} className="text-warning-600" />
 Vocações Econômicas e Cadeias Produtivas Mapeadas ({statsSintese.totalCadeias})
 </h4>
 <span className="text-[10px] text-text-secondary font-medium">
 Fonte: Base Oficial SECTI / SDR
 </span>
 </div>
 <div className="flex flex-wrap gap-1.5">
 {Array.from(new Set(scopedCadeias.map(c => c.entidade || c.cadeia_produtiva || c.nome_cadeia || c.id_cadeia))).slice(0, 24).map((cad, idx) => (
 <span
 key={idx}
 className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-surface border border-border text-text-primary shadow-2xs inline-flex items-center justify-center leading-none"
 >
 {cad}
 </span>
 ))}
 {scopedCadeias.length === 0 && (
 <span className="text-xs text-text-muted">Nenhuma cadeia produtiva mapeada individualmente neste escopo.</span>
 )}
 </div>
 </div>

 </div>
 )}

 {/* CASO 2, 3, 4 e 5: TABELA DETALHADA DO RELATÓRIO SELECIONADO */}
 {reportType !== 'sintese' && (
 <div className={`flex-1 flex flex-col overflow-hidden print:block print:h-auto print:overflow-visible min-h-0`}>

 {/* BARRA DE BUSCA E FILTROS DA TABELA */}
 <div className={`flex items-center justify-between gap-3 mb-3 shrink-0 print:hidden `}>
 <div className="relative flex-1 max-w-sm">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
 <input
 type="text"
 value={tableSearch}
 onChange={(e) => setTableSearch(e.target.value)}
 placeholder={`Pesquisar nos ${tableData.length} registros...`}
 className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-surface-soft border border-border text-xs text-text-primary placeholder-text-muted focus:bg-surface focus:border-primary-600 focus:outline-none transition-colors"
 />
 {tableSearch && (
 <button
 type="button"
 onClick={() => setTableSearch('')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs font-medium"
 >
 ×
 </button>
 )}
 </div>

 <div className="text-[11px] font-medium text-text-secondary shrink-0">
   Mostrando <strong>{tableData.length}</strong> registro(s)
 </div>
 </div>

 {/* TABELA - CABEÇALHO (Estático, fora do scroll) */}
 <div className={`border border-border border-b-0 rounded-t-2xl bg-surface-soft print:hidden `}>
 <table className="w-full text-left border-collapse text-xs table-fixed">
 <colgroup>
 <col className={reportType === 'municipios' ? "w-[55%]" : reportType === 'cadeias' ? "w-[40%]" : "w-[35%]"} />
 {reportType !== 'municipios' && <col className={reportType === 'cadeias' ? "w-[20%]" : "w-[15%]"} />}
 {reportType !== 'municipios' && <col className="w-[20%]" />}
 <col className="w-[20%]" />
 {reportType !== 'ativos' && reportType !== 'cursos' && reportType !== 'cadeias' && <col className="w-[15%]" />}
 {reportType !== 'cadeias' && <col className="w-[10%]" />}
 </colgroup>
 <thead className="text-text-muted font-semibold text-[11px] uppercase ">
 <tr>
 <th className="py-2.5 px-3">
 {reportType === 'ativos' && 'Nome do Ativo'}
 {reportType === 'cursos' && 'Curso Superior'}
 {reportType === 'cadeias' && 'Cadeia Produtiva'}
 {reportType === 'municipios' && 'Município'}
 </th>
 {reportType !== 'municipios' && (
 <th className="py-2.5 px-3">
 {reportType === 'ativos' && 'Sigla'}
 {reportType === 'cursos' && 'Instituição (IES)'}
 {reportType === 'cadeias' && 'Setor / Tipologia'}
 </th>
 )}
 {reportType !== 'municipios' && (
 <th className="py-2.5 px-3">
 {reportType === 'ativos' && 'Tipo'}
 {reportType === 'cursos' && 'Área de Conhecimento'}
 {reportType === 'cadeias' && 'Abrangência'}
 </th>
 )}
 <th className="py-2.5 px-3">
 {reportType === 'ativos' && 'Município'}
 {reportType === 'cursos' && 'Município'}
 {reportType === 'cadeias' && 'Territórios'}
 {reportType === 'municipios' && 'Ativos CT&I'}
 </th>
 {reportType !== 'ativos' && reportType !== 'cursos' && reportType !== 'cadeias' && (
 <th className="py-2.5 px-3">
 {reportType === 'municipios' && 'Cursos CT&I'}
 </th>
 )}
 {reportType !== 'cadeias' && (
 <th className="py-2.5 px-3 text-right">
 {reportType === 'ativos' && 'RNP'}
 {reportType === 'cursos' && 'Modalidade'}
 {reportType === 'municipios' && 'Cobertura'}
 </th>
 )}
 </tr>
 </thead>
 </table>
 </div>

 {/* TABELA DE DADOS COM SCROLL INTERNO */}
 <div className={`flex-1 overflow-y-auto overflow-x-hidden border border-border rounded-b-2xl shadow-2xs bg-surface print:overflow-visible print:border-none print:shadow-none min-h-0`}>
 <table className="w-full text-left border-collapse text-xs table-fixed">
 <colgroup>
 <col className={reportType === 'municipios' ? "w-[55%]" : reportType === 'cadeias' ? "w-[40%]" : "w-[35%]"} />
 {reportType !== 'municipios' && <col className={reportType === 'cadeias' ? "w-[20%]" : "w-[15%]"} />}
 {reportType !== 'municipios' && <col className="w-[20%]" />}
 <col className="w-[20%]" />
 {reportType !== 'ativos' && reportType !== 'cursos' && reportType !== 'cadeias' && <col className="w-[15%]" />}
 {reportType !== 'cadeias' && <col className="w-[10%]" />}
 </colgroup>
 
 <tbody className="divide-y divide-border/70 text-text-primary">
 {tableData.length > 0 ? (
 tableData.map((row, idx) => (
 <tr
 key={idx}
 className="hover:bg-surface-soft transition-colors group"
 >
 <td className="py-2 px-3 font-medium text-text-primary truncate" title={row.col1}>
 {row.col1}
 </td>
 {reportType !== 'municipios' && (
 <td className="py-2 px-3 text-text-secondary font-medium max-w-[160px] truncate" title={row.col2}>
 {row.col2}
 </td>
 )}
 {reportType !== 'municipios' && (
 <td className="py-2 px-3 max-w-[180px] truncate" title={row.col3}>
 <span className="bg-surface-soft text-text-primary px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center justify-center leading-none">
 {row.col3}
 </span>
 </td>
 )}
 <td className="py-2 px-3 text-text-secondary max-w-[140px] truncate" title={row.col4}>
 {row.col4}
 </td>
 {reportType !== 'ativos' && reportType !== 'cursos' && reportType !== 'cadeias' && (
 <td className="py-2 px-3 text-text-secondary max-w-[140px] truncate" title={row.col5}>
 {row.col5}
 </td>
 )}
 {reportType !== 'cadeias' && (
 <td className="py-2 px-3 text-right font-medium whitespace-nowrap">
 {row.col6 === 'EaD' || row.col6 === 'Sim (RNP Conectado)' ? (
 <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1 justify-center leading-none">
 <Wifi size={16} />
 {row.col6}
 </span>
 ) : row.col6 === 'Presencial' ? (
 <span className="text-[10px] font-semibold text-text-secondary bg-surface-soft px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none">
 Presencial
 </span>
 ) : (
 <span className="text-[11px] font-medium text-text-secondary">
 {row.col6}
 </span>
 )}
 </td>
 )}
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="py-8 text-center text-text-muted font-medium">
 Nenhum registro encontrado para os filtros selecionados.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 </div> {/* FIM DO WRAPPER DE IMPRESSÃO */}
 </div>

 </div>
 </div>
 </>
 );
}
