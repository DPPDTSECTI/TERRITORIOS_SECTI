import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  GraduationCap,
  GitPullRequest,
  MapPin,
  Printer,
  ArrowLeft,
  X,
  Award,
  Database,
  Wifi,
  Users,
  Image as ImageIcon,
  Sun,
  Moon
} from 'lucide-react';
import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import PtiMap from '../maps/PtiMap';
import { isMunicipioSemiarido, SEMIARIDO_MUNICIPIOS, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';
import { useReactToPrint } from 'react-to-print';
import { REPORT_PRINT_PAGE_STYLE, prepareReportForPrint, printWithCanvasSync } from '../../utils/reportPrint';

export default function RelatorioSintese() {
  const { isDark, toggleTheme } = useTheme();
  const {
    territoriosData = [],
    ativosData = [],
    cursosData = [],
    distribuicaoCadeias = [],
    municipiosTerritorios = [],
    territoriesDynamicStats = {},
    loadingStats = false
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportMode = searchParams.get('modo') || 'normal';
  const isSemiarido = reportMode === 'semiarido';

  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // Inicializa o território a partir dos parâmetros de busca na URL
  useEffect(() => {
    const terrParam = searchParams.get('territorio');
    if (terrParam && terrParam !== 'bahia' && territoriosData.length > 0) {
      const match = territoriosData.find(t => String(t.id_territorio) === String(terrParam));
      if (match) {
        setSelectedTerritory(match);
      }
    } else if (terrParam === 'bahia') {
      setSelectedTerritory(null);
    }
  }, [searchParams, territoriosData]);

  const territoryTitle = selectedTerritory
    ? (selectedTerritory.nome_territorio || selectedTerritory.territorio)
    : 'Estado da Bahia (Toda a Bahia)';

  const selectedTerritoryId = selectedTerritory?.id_territorio;

  // React-to-print: referência do relatório 1920x1080 para renderização e impressão nativa
  const contentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `relatorio_sintese_${isSemiarido ? 'semiarido' : (selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : 'bahia')}`,
    pageStyle: REPORT_PRINT_PAGE_STYLE,
    onBeforePrint: async () => {
      setIsPrinting(true);
      await prepareReportForPrint();
    },
    onAfterPrint: () => setIsPrinting(false),
    print: (iframe) => {
      setIsPrinting(false);
      return printWithCanvasSync(iframe, contentRef);
    }
  });

  // Auto-impressão caso explicitamente solicitado via query param (ex: autoPrint=1 ou autoprint=true)
  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint') || searchParams.get('autoprint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats, handlePrint]);

  // Filtragem dos dados conforme escopo e modo
  const scopedAtivos = useMemo(() => {
    let list = ativosData;
    if (selectedTerritoryId) {
      list = list.filter(a => String(a.id_territorio) === String(selectedTerritoryId));
    }
    if (isSemiarido) {
      list = list.filter(a => isMunicipioSemiarido(a.municipio));
    }
    return list;
  }, [ativosData, selectedTerritoryId, isSemiarido]);

  const scopedCursos = useMemo(() => {
    let list = cursosData;
    if (selectedTerritoryId) {
      list = list.filter(c => String(c.id_territorio) === String(selectedTerritoryId));
    }
    if (isSemiarido) {
      list = list.filter(c => isMunicipioSemiarido(c.municipio));
    }
    return list;
  }, [cursosData, selectedTerritoryId, isSemiarido]);

  const scopedCadeias = useMemo(() => {
    let list = distribuicaoCadeias;
    if (selectedTerritoryId) {
      list = list.filter(d => String(d.id_territorio) === String(selectedTerritoryId));
    }
    if (isSemiarido) {
      list = list.filter(d => isMunicipioSemiarido(d.municipio || d.sede || d.municipio_sede || d.nome_municipio));
    }
    return list;
  }, [distribuicaoCadeias, selectedTerritoryId, isSemiarido]);

  const scopedMunicipios = useMemo(() => {
    let list = municipiosTerritorios;
    if (selectedTerritoryId) {
      list = list.filter(m => String(m.id_territorio) === String(selectedTerritoryId));
    }
    if (isSemiarido) {
      list = list.filter(m => isMunicipioSemiarido(m.nome_municipio || m.municipio));
    }
    return list;
  }, [municipiosTerritorios, selectedTerritoryId, isSemiarido]);

  // Totais estaduais para comparação analítica
  const totalAtivosBahia = useMemo(() => ativosData.length, [ativosData]);
  const totalCursosBahia = useMemo(() => cursosData.length, [cursosData]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const totalAtivos = scopedAtivos.length;
    const totalCursos = scopedCursos.length;
    const federalCursos = scopedCursos.filter(c => String(c.entidade || c.instituicao || c.nome || '').toLowerCase().includes('federal')).length;
    const estadualCursos = scopedCursos.filter(c => {
      const e = String(c.entidade || c.instituicao || c.nome || '').toLowerCase();
      return e.includes('estadual') || e.includes('estado da bahia');
    }).length;
    const privadaCursos = Math.max(0, totalCursos - federalCursos - estadualCursos);

    const federalTaxa = totalCursos > 0 ? ((federalCursos / totalCursos) * 100).toFixed(1) : '0.0';
    const estadualTaxa = totalCursos > 0 ? ((estadualCursos / totalCursos) * 100).toFixed(1) : '0.0';
    const privadaTaxa = totalCursos > 0 ? ((privadaCursos / totalCursos) * 100).toFixed(1) : '0.0';

    const pctAtivosEstado = totalAtivosBahia > 0 ? ((totalAtivos / totalAtivosBahia) * 100).toFixed(1) : '0.0';
    const pctCursosEstado = totalCursosBahia > 0 ? ((totalCursos / totalCursosBahia) * 100).toFixed(1) : '0.0';

    const rnpAtivos = scopedAtivos.filter(a => a.rnp).length;
    const rnpTaxa = totalAtivos > 0 ? ((rnpAtivos / totalAtivos) * 100).toFixed(1) : '0.0';

    const uniqueCadeias = new Set(scopedCadeias.map(c => c.entidade || c.cadeia_produtiva || c.nome_cadeia || c.id_cadeia));
    const totalCadeias = uniqueCadeias.size;

    const munComAtivo = new Set(scopedAtivos.map(a => a.id_municipio || a.municipio));
    const munComCurso = new Set(scopedCursos.map(c => c.id_municipio || c.municipio));
    const munAtendidos = new Set([...munComAtivo, ...munComCurso]);

    const totalMunEscopo = isSemiarido
      ? (selectedTerritoryId ? scopedMunicipios.length : SEMIARIDO_TOTAL_MUNICIPIOS)
      : (scopedMunicipios.length || (selectedTerritoryId ? 0 : BAHIA_TOTAL_MUNICIPIOS));

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
      pctAtivosEstado,
      rnpAtivos,
      rnpTaxa,
      totalCursos,
      pctCursosEstado,
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
  }, [scopedAtivos, scopedCursos, scopedCadeias, scopedMunicipios, selectedTerritory, selectedTerritoryId, territoriosData, isSemiarido, totalAtivosBahia, totalCursosBahia]);

  const cadeiasNomes = useMemo(() => {
    return Array.from(new Set(scopedCadeias.map(c => c.entidade || c.cadeia_produtiva || c.nome_cadeia || c.id_cadeia))).slice(0, 20);
  }, [scopedCadeias]);

  return (
    <main id="pdf-report" ref={contentRef} className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white select-none">
      {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-700 ease-in-out select-none print:hidden ${
          isSemiarido ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="absolute -top-[18vw] -right-[12vw] w-[62vw] h-[62vw] min-w-[550px] min-h-[550px] max-w-[1080px] max-h-[1080px] rounded-full animate-sun-breath"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.07) 30%, rgba(251, 191, 36, 0.03) 55%, transparent 75%)',
            filter: 'blur(35px)',
          }}
        />
        <div
          className="absolute -top-[16vw] -right-[10vw] w-[54vw] h-[54vw] min-w-[480px] min-h-[480px] max-w-[940px] max-h-[940px] rounded-full animate-sun-arc"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.22)',
            boxShadow: '0 0 45px rgba(251, 191, 36, 0.10), inset 0 0 45px rgba(245, 158, 11, 0.04)',
            maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0) 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          className="absolute -top-[22vw] -right-[16vw] w-[70vw] h-[70vw] min-w-[620px] min-h-[620px] max-w-[1220px] max-h-[1220px] rounded-full animate-sun-breath"
          style={{
            border: '1px solid rgba(217, 119, 6, 0.11)',
            maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 60%)',
            WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 60%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-[460px] h-[320px] rounded-full opacity-60 animate-sun-breath"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.02) 50%, transparent 80%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full shrink-0 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[30px] lg:text-[32px] font-black text-[#1D3557] dark:text-text-primary tracking-tight leading-none">
              Síntese Executiva de CT&I
            </h1>

            {isSemiarido ? (
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] dark:bg-amber-950/50 border border-[#FDE68A] dark:border-amber-600/40 px-3.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-[12px] font-bold text-[#92400E] dark:text-amber-200">
                  Recorte Oficial: <strong>Semiárido Baiano (278 Municípios)</strong>
                </span>
              </div>
            ) : selectedTerritory ? (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 dark:bg-primary-950/50 border border-[#BAE6FD] dark:border-primary-700/50 px-3 py-1 rounded-full">
                <MapPin size={13} className="text-[#0284C7] dark:text-primary-400" />
                <span className="text-[12px] font-bold text-[#0369A1] dark:text-primary-300">
                  Recorte: <strong className="text-[#0C4A6E] dark:text-text-primary">{territoryTitle}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-[#0369A1] dark:text-primary-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer print:hidden"
                  title="Limpar seleção territorial"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 dark:bg-primary-950/50 border border-[#BAE6FD] dark:border-primary-700/50 px-3.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-[12px] font-bold text-[#0369A1] dark:text-primary-300">
                  Cenário Geral: <strong className="text-[#0C4A6E] dark:text-text-primary">Estado da Bahia (417 Municípios)</strong>
                </span>
              </div>
            )}
          </div>
          <p className="text-[13.5px] text-[#457B9D] dark:text-text-secondary font-medium mt-1">
            {isSemiarido
              ? 'Diagnóstico consolidado de infraestrutura física, formação e arranjos econômicos nos 278 municípios do Semiárido'
              : 'Diagnóstico consolidado de infraestrutura física, formação de recursos humanos e arranjos econômicos da Bahia'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[12px] font-bold text-[#1D3557] dark:text-primary-300 bg-[#D6EAF8]/50 dark:bg-primary-950/40 border border-[#BAE6FD] dark:border-primary-800/40 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Award size={14} className="text-[#2563EB] dark:text-primary-400" />
            Dados Oficiais SECTI/BA
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="w-8 h-8 rounded-full bg-surface-soft text-text-secondary hover:text-primary-600 hover:bg-surface border border-border/70 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 print:hidden cursor-pointer"
          >
            {isDark ? (
              <Sun size={15} strokeWidth={2} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon size={15} strokeWidth={2} className="text-neutral-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>

      {/* GRID DE KPIS (h-[96px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          
          {/* KPI 1: ATIVOS */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#D6EAF8]/70 dark:bg-primary-950/50 text-[#2563EB] dark:text-primary-400'}`}>
                <Database size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Ativos de CT&I</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                {loadingStats ? '...' : stats.totalAtivos}
              </span>
              <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30' : 'text-[#10B981] dark:text-emerald-300 bg-[#10B981]/10 dark:bg-emerald-950/40 border border-[#10B981]/25 dark:border-emerald-600/30'}`} title={`${stats.totalAtivos} de ${totalAtivosBahia} ativos estaduais`}>
                {isSemiarido ? `${stats.pctAtivosEstado}% da Bahia` : `${stats.rnpAtivos} RNP (${stats.rnpTaxa}%)`}
              </span>
            </div>
          </div>

          {/* KPI 2: CURSOS */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#CCFBF1] dark:bg-teal-950/50 text-[#0D9488] dark:text-teal-400'}`}>
                <GraduationCap size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Cursos CT&I</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                {loadingStats ? '...' : stats.totalCursos}
              </span>
              <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30' : 'text-[#0D9488] dark:text-teal-300 bg-[#0D9488]/10 dark:bg-teal-950/40 border border-[#0D9488]/25 dark:border-teal-600/30'}`} title={`${stats.totalCursos} de ${totalCursosBahia} cursos estaduais`}>
                {isSemiarido ? `${stats.pctCursosEstado}% da Bahia` : 'Graduação & Pós'}
              </span>
            </div>
          </div>

          {/* KPI 3: CADEIAS MAPEADAS */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#FEF3C7] dark:bg-amber-950/50 text-[#D97706] dark:text-amber-400'}`}>
                <GitPullRequest size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Cadeias Mapeadas</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                  {loadingStats ? '...' : stats.totalCadeias}
                </span>
                <span className="text-[14px] font-bold text-[#64748B] dark:text-text-muted">setores</span>
              </div>
              <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30' : 'text-[#D97706] dark:text-amber-300 bg-[#D97706]/10 dark:bg-amber-950/40 border border-[#D97706]/25 dark:border-amber-600/30'}`}>
                {isSemiarido ? 'Vocações Semiárido' : 'Vocações APL'}
              </span>
            </div>
          </div>

          {/* KPI 4: COBERTURA MUNICIPAL */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#FEE2E2] dark:bg-rose-950/50 text-[#DC2626] dark:text-rose-400'}`}>
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Cobertura Territorial</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                  {loadingStats ? '...' : stats.munAtendidosCount}
                </span>
                <span className="text-[14px] font-bold text-[#64748B] dark:text-text-muted">/ {stats.totalMunEscopo}</span>
              </div>
              <span className="text-[11.5px] font-bold text-[#10B981] dark:text-emerald-300 bg-[#10B981]/10 dark:bg-emerald-950/40 border border-[#10B981]/25 dark:border-emerald-600/30 px-2.5 py-1 rounded-lg whitespace-nowrap">
                {stats.taxaCoberturaMun}% do total
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ÁREA CENTRAL: COLUNA ESQUERDA (70%) + MAPA À DIREITA (30%) */}
      <div className="flex-1 w-full flex gap-4 min-h-0 overflow-hidden relative z-10">
        
        {/* COLUNA ESQUERDA: DIAGNÓSTICO INTEGRADO */}
        <div style={{ width: 'calc(70% - 8px)' }} className="flex flex-col gap-3.5 h-full overflow-hidden">
          
          {/* BANNER INSTITUCIONAL DO ESCOPO */}
          <div className={`${isSemiarido ? 'bg-gradient-to-br from-[#92400E] via-[#78350F] to-[#451A03] border border-amber-500/30' : 'bg-gradient-to-br from-[#1D3557] to-[#162942] border border-transparent dark:border-border'} text-white p-3.5 px-4 rounded-[20px] shadow-sm flex items-center justify-between shrink-0`}>
            <div className="max-w-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Award size={14} className={isSemiarido ? "text-amber-300" : "text-[#A8C7FA]"} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isSemiarido ? "text-amber-200" : "text-[#A8C7FA]"}`}>Panorama Estratégico SECTI</span>
              </div>
              <h2 className="text-[19px] lg:text-[20px] font-black text-white leading-tight">
                {isSemiarido ? 'Recorte Territorial do Semiárido Baiano' : territoryTitle}
              </h2>
              <p className="text-[12.5px] text-white/85 mt-1 leading-snug">
                {isSemiarido
                  ? `Consolidação executiva de indicadores de CT&I para os 278 municípios do Semiárido Baiano (66,7% dos municípios do estado).`
                  : (selectedTerritory
                    ? `Consolidação de indicadores de CT&I para os ${stats.totalMunEscopo} municípios integrantes deste Território de Identidade.`
                    : 'Visão executiva estadual consolidando os 27 Territórios de Identidade e todos os 417 municípios da Bahia.'
                  )
                }
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 text-center">
                <span className="text-[10px] text-white/70 block uppercase font-semibold">População</span>
                <strong className="text-sm font-black">{stats.populacaoTotal} hab.</strong>
              </div>
              {stats.ifdmMedio && (
                <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 text-center">
                  <span className="text-[10px] text-white/70 block uppercase font-semibold">IFDM Médio</span>
                  <strong className="text-sm font-black">{stats.ifdmMedio}</strong>
                </div>
              )}
            </div>
          </div>

          {/* GRID COM 2 BLOCOS ANALÍTICOS (INFRAESTRUTURA E OFERTA EDUCACIONAL) */}
          <div className="grid grid-cols-2 gap-3.5 flex-1 min-h-0">
            
            {/* BLOCO 1: INFRAESTRUTURA E CONECTIVIDADE */}
            <div className={`bg-white dark:bg-surface rounded-[24px] p-4 border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} flex flex-col justify-between overflow-hidden`}>
              <div className="border-b border-[#F1F5F9] dark:border-border pb-2 mb-2 flex items-center justify-between shrink-0">
                <h3 className="text-[16px] font-extrabold text-[#1D3557] dark:text-text-primary flex items-center gap-1.5">
                  <Database size={17} className={isSemiarido ? "text-[#D97706]" : "text-[#2563EB]"} />
                  Infraestrutura de CT&I & RNP
                </h3>
                <span className="text-[11px] font-bold text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 px-2.5 py-0.5 rounded-full">
                  {stats.totalAtivos} Ativos
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around py-1 gap-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px] font-bold text-[#1D3557] dark:text-text-primary">
                    <span className="flex items-center gap-1.5 text-[#2563EB] dark:text-primary-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      Conexão Rede RNP
                    </span>
                    <span>{stats.rnpAtivos} ({stats.rnpTaxa}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden flex">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${stats.rnpTaxa}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px] font-bold text-[#1D3557] dark:text-text-primary">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                      Demais Ativos / Polos
                    </span>
                    <span>{stats.totalAtivos - stats.rnpAtivos} ({(100 - Number(stats.rnpTaxa)).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden flex">
                    <div className="h-full bg-[#94A3B8]" style={{ width: `${100 - Number(stats.rnpTaxa)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 2: OFERTA EDUCACIONAL */}
            <div className={`bg-white dark:bg-surface rounded-[24px] p-4 border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} flex flex-col justify-between overflow-hidden`}>
              <div className="border-b border-[#F1F5F9] dark:border-border pb-2 mb-2 flex items-center justify-between shrink-0">
                <h3 className="text-[16px] font-extrabold text-[#1D3557] dark:text-text-primary flex items-center gap-1.5">
                  <GraduationCap size={17} className="text-[#8B5CF6] dark:text-purple-400" />
                  Oferta Educacional CT&I
                </h3>
                <span className="text-[11px] font-bold text-[#8B5CF6] dark:text-purple-300 bg-[#8B5CF6]/10 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
                  {stats.totalCursos} Cursos
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around py-1 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-[#1D3557] dark:text-text-primary">
                    <span className="text-[#2563EB] dark:text-primary-400">Rede Pública Estadual</span>
                    <span>{stats.estadualCursos} ({stats.estadualTaxa}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${stats.estadualTaxa}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-[#1D3557] dark:text-text-primary">
                    <span className="text-[#10B981] dark:text-emerald-400">Rede Pública Federal</span>
                    <span>{stats.federalCursos} ({stats.federalTaxa}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden">
                    <div className="h-full bg-[#10B981]" style={{ width: `${stats.federalTaxa}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-[#1D3557] dark:text-text-primary">
                    <span className="text-[#8B5CF6] dark:text-purple-400">Rede Privada / Outros</span>
                    <span>{stats.privadaCursos} ({stats.privadaTaxa}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden">
                    <div className="h-full bg-[#8B5CF6]" style={{ width: `${stats.privadaTaxa}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* BLOCO INFERIOR: VOCAÇÕES ECONÔMICAS E CADEIAS */}
          <div className={`bg-white dark:bg-surface rounded-[24px] p-3.5 px-4 border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} shrink-0`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[15px] font-extrabold text-[#1D3557] dark:text-text-primary flex items-center gap-1.5">
                <GitPullRequest size={16} className={isSemiarido ? "text-[#D97706]" : "text-[#2563EB]"} />
                Vocações Econômicas e Cadeias Produtivas Mapeadas ({stats.totalCadeias})
              </h3>
              <span className="text-[11px] font-bold text-[#64748B] dark:text-text-muted">Fonte: Base Oficial SECTI/SDR</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cadeiasNomes.map((nome, idx) => (
                <span
                  key={idx}
                  className="text-[12px] font-bold px-3 py-1 rounded-lg bg-[#F8FAFC] dark:bg-surface-soft border border-[#E2E8F0] dark:border-border text-[#1D3557] dark:text-text-primary"
                >
                  {nome}
                </span>
              ))}
              {cadeiasNomes.length === 0 && (
                <span className="text-[12px] text-[#94A3B8] dark:text-text-muted">Nenhuma cadeia específica mapeada neste recorte.</span>
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: MAPA TERRITORIAL INTEGRADO (30%) */}
        <div style={{ width: 'calc(30% - 8px)' }} className={`h-full bg-white dark:bg-surface rounded-[24px] border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} relative overflow-hidden flex flex-col shrink-0 min-h-0`}>
          <PtiMap
            key={`map-sintese-${isSemiarido ? 'semi' : 'normal'}-${selectedTerritory?.id_territorio || 'all'}`}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={(t) => setSelectedTerritory(t)}
            territoriosData={territoriosData}
            territoriesDynamicStats={territoriesDynamicStats}
            semiaridoMunicipios={isSemiarido ? SEMIARIDO_MUNICIPIOS : []}
            filtroSemiarido={isSemiarido}
          />
        </div>

      </div>

    </main>
  );
}
