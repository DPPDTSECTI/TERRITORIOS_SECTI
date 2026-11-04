import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  GraduationCap,
  GitPullRequest,
  MapPin,
  X,
  Award,
  Database,
  Wifi,
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
    loadingStats = false,
    filtroSemiarido,
    setFiltroSemiarido
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportMode = searchParams.has('modo')
    ? searchParams.get('modo')
    : (filtroSemiarido ? 'semiarido' : 'normal');
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
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats && (territoriosData && territoriosData.length > 0)) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats, handlePrint, territoriosData]);

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
    return Array.from(new Set(scopedCadeias.map(c => c.entidade || c.cadeia_produtiva || c.nome_cadeia || c.id_cadeia))).slice(0, 16);
  }, [scopedCadeias]);

  // Configuração dos 4 KPIs
  const kpiCards = [
    {
      label: isSemiarido ? 'Ativos no Semiárido' : 'Ativos de CT&I Mapeados',
      value: loadingStats ? '...' : stats.totalAtivos,
      suffix: null,
      badge: isSemiarido ? `${stats.pctAtivosEstado}% da Bahia` : `${stats.rnpAtivos} RNP (${stats.rnpTaxa}%)`,
      icon: Database,
      isHero: true
    },
    {
      label: isSemiarido ? 'Cursos no Semiárido' : 'Cursos CT&I Mapeados',
      value: loadingStats ? '...' : stats.totalCursos,
      suffix: null,
      badge: isSemiarido ? `${stats.pctCursosEstado}% da Bahia` : 'Graduação & Pós',
      icon: GraduationCap,
      isHero: false
    },
    {
      label: 'Cadeias Produtivas',
      value: loadingStats ? '...' : stats.totalCadeias,
      suffix: 'setores',
      badge: isSemiarido ? 'Vocações Semiárido' : 'Vocações APL',
      icon: GitPullRequest,
      isHero: false
    },
    {
      label: 'Cobertura Territorial',
      value: loadingStats ? '...' : stats.munAtendidosCount,
      suffix: `/ ${stats.totalMunEscopo}`,
      badge: `${stats.taxaCoberturaMun}% do total`,
      icon: MapPin,
      isHero: false
    }
  ];

  return (
    <main
      id="pdf-report"
      data-ready={!loadingStats ? 'true' : 'false'}
      data-loading={loadingStats ? 'true' : 'false'}
      ref={contentRef}
      className="flex-1 h-screen overflow-hidden relative p-5 lg:p-6 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-transparent select-none"
    >
      {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-700 ease-in-out select-none ${
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
      </div>

      {/* CABEÇALHO */}
      <header className="flex items-center justify-between w-full shrink-0 relative z-10">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-headline font-bold text-text-primary tracking-tight leading-none">
              Síntese Executiva de CT&I
            </h1>

            {isSemiarido ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption font-semibold bg-amber-500/10 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-500/20 dark:border-amber-700/50">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Recorte Oficial: Semiárido Baiano (278 Municípios)
              </span>
            ) : selectedTerritory ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption font-semibold bg-primary-500/10 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-500/20 dark:border-primary-800/60">
                <MapPin size={13} className="text-primary-600 dark:text-primary-400" />
                Recorte: {territoryTitle}
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-primary-600 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer print:hidden"
                  title="Limpar seleção territorial"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption font-semibold bg-primary-500/10 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-500/20 dark:border-primary-800/60">
                <span className="w-2 h-2 rounded-full bg-primary-600" />
                Cenário Geral: Estado da Bahia (417 Municípios)
              </span>
            )}
          </div>

          <p className="text-body-sm text-text-secondary mt-1 font-medium">
            {isSemiarido
              ? 'Diagnóstico consolidado de infraestrutura física, formação e arranjos econômicos nos 278 municípios do Semiárido'
              : 'Diagnóstico consolidado de infraestrutura física, formação de recursos humanos e arranjos econômicos da Bahia'}
          </p>
          <div className={`divider-territorial w-48 mt-2 ${isSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = !isSemiarido;
              setFiltroSemiarido?.(next);
              const newParams = new URLSearchParams(searchParams);
              if (next) {
                newParams.set('modo', 'semiarido');
              } else {
                newParams.delete('modo');
              }
              navigate(`?${newParams.toString()}`, { replace: true });
            }}
            title={isSemiarido ? 'Desativar modo Semiárido' : 'Ativar modo Semiárido'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-caption font-semibold transition-all shadow-xs active:scale-95 print:hidden cursor-pointer border ${
              isSemiarido
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                : 'bg-surface-soft border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span>Semiárido</span>
          </button>

          <span className="text-caption font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 dark:bg-primary-950/40 border border-primary-500/20 dark:border-primary-800/40 px-3 py-1 rounded-md inline-flex items-center gap-1.5">
            <Award size={14} className="text-primary-600 dark:text-primary-400" />
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
              <Sun size={15} strokeWidth={2} className="text-amber-400" />
            ) : (
              <Moon size={15} strokeWidth={2} className="text-neutral-600" />
            )}
          </button>
        </div>
      </header>

      {/* GRID DE KPIS (4 CARDS) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          {kpiCards.map((kpi, index) => {
            const isHero = kpi.isHero;
            const IconComp = kpi.icon;

            return (
              <div
                key={index}
                className={`p-4 flex flex-col justify-between h-[98px] rounded-card cursor-default overflow-hidden select-none ${
                  isHero
                    ? (isSemiarido
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-400/40 shadow-xs'
                        : 'bg-gradient-brand text-white border border-primary-500/40 shadow-xs')
                    : (isSemiarido
                        ? 'bg-surface-soft border border-amber-200/60 dark:border-amber-500/30 text-text-primary'
                        : 'bg-surface-soft border border-border/70 text-text-primary')
                }`}
              >
                {/* LINHA SUPERIOR: LABEL + ÍCONE CIRCULAR À DIREITA */}
                <div className="flex items-start justify-between gap-2 w-full min-w-0">
                  <span
                    className={`text-[13px] font-medium leading-tight truncate ${
                      isHero ? (isSemiarido ? 'text-amber-100' : 'text-white/85') : 'text-text-secondary'
                    }`}
                  >
                    {kpi.label}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      isHero
                        ? 'bg-white/15 text-white border border-white/20 shadow-2xs'
                        : 'bg-surface border border-border/80 text-text-secondary shadow-2xs'
                    }`}
                  >
                    <IconComp size={15} strokeWidth={2} />
                  </div>
                </div>

                {/* LINHA INFERIOR: VALOR GRANDE + BADGE PILL */}
                <div className="flex items-baseline justify-between gap-2 w-full min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span
                      className={`text-[30px] font-bold tracking-tight leading-none shrink-0 tnum ${
                        isHero ? 'text-white' : 'text-text-primary'
                      }`}
                    >
                      {kpi.value}
                    </span>
                    {kpi.suffix && (
                      <span
                        className={`text-caption font-semibold tnum ${
                          isHero ? 'text-white/75' : 'text-text-muted'
                        }`}
                      >
                        {kpi.suffix}
                      </span>
                    )}
                  </div>

                  {kpi.badge && (
                    <span
                      className={`text-caption font-medium px-2 py-0.5 rounded-md tabular-nums inline-flex items-center leading-none truncate shrink-0 ${
                        isHero
                          ? 'bg-white/15 text-white border border-white/20'
                          : (isSemiarido
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60'
                              : 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60')
                      }`}
                    >
                      {kpi.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ÁREA CENTRAL: COLUNA ESQUERDA (70%) + MAPA À DIREITA (30%) */}
      <div className="flex-1 w-full flex gap-4 min-h-0 overflow-hidden relative z-10">
        
        {/* COLUNA ESQUERDA: DIAGNÓSTICO INTEGRADO */}
        <div style={{ width: 'calc(70% - 8px)' }} className="flex flex-col gap-3.5 h-full overflow-hidden">
          
          {/* BANNER INSTITUCIONAL DO ESCOPO */}
          <div className={`${isSemiarido ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 border border-amber-400/30' : 'bg-gradient-brand border border-primary-500/30'} text-white p-4 px-5 rounded-card shadow-card flex items-center justify-between shrink-0`}>
            <div className="max-w-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Award size={14} className={isSemiarido ? "text-amber-200" : "text-white/85"} />
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSemiarido ? "text-amber-100" : "text-white/85"}`}>Panorama Estratégico SECTI</span>
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight">
                {isSemiarido ? 'Recorte Territorial do Semiárido Baiano' : territoryTitle}
              </h2>
              <p className="text-caption text-white/85 mt-1 leading-relaxed">
                {isSemiarido
                  ? `Consolidação executiva de indicadores de CT&I para os 278 municípios do Semiárido Baiano (66,7% dos municípios do estado).`
                  : (selectedTerritory
                    ? `Consolidação de indicadores de CT&I para os ${stats.totalMunEscopo} municípios integrantes deste Território de Identidade.`
                    : 'Visão executiva estadual consolidando os 27 Territórios de Identidade e todos os 417 municípios da Bahia.'
                  )
                }
              </p>
            </div>

            <div className="flex gap-2.5 shrink-0">
              <div className="bg-white/15 px-3.5 py-2 rounded-xl border border-white/20 text-center shadow-2xs">
                <span className="text-[10px] text-white/75 block uppercase font-medium">População</span>
                <strong className="text-sm font-bold tnum">{stats.populacaoTotal} hab.</strong>
              </div>
              {stats.ifdmMedio && (
                <div className="bg-white/15 px-3.5 py-2 rounded-xl border border-white/20 text-center shadow-2xs">
                  <span className="text-[10px] text-white/75 block uppercase font-medium">IFDM Médio</span>
                  <strong className="text-sm font-bold tnum">{stats.ifdmMedio}</strong>
                </div>
              )}
            </div>
          </div>

          {/* GRID COM 2 BLOCOS ANALÍTICOS (INFRAESTRUTURA E OFERTA EDUCACIONAL) */}
          <div className="grid grid-cols-2 gap-3.5 flex-1 min-h-0">
            
            {/* BLOCO 1: INFRAESTRUTURA E CONECTIVIDADE (PÍLULAS PROPORCIONAIS) */}
            <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between overflow-hidden shadow-card`}>
              <div className="border-b border-border/70 pb-2 mb-2 flex items-center justify-between shrink-0">
                <div className="flex flex-col min-w-0">
                  <h3 className="text-subtitle font-semibold text-text-primary flex items-center gap-1.5">
                    <Database size={16} className={isSemiarido ? "text-amber-600" : "text-primary-600"} />
                    Infraestrutura de CT&I & RNP
                  </h3>
                  <p className="text-caption text-text-muted font-medium mt-0.5">Conectividade e adesão à rede acadêmica</p>
                </div>
                <span className="text-caption font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 dark:bg-primary-950/40 border border-primary-500/20 dark:border-primary-800/60 px-2 py-0.5 rounded-md">
                  {stats.totalAtivos} Ativos
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around py-1 gap-2.5">
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-center text-caption font-semibold text-text-primary px-0.5">
                    <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                      <span className="w-2 h-2 rounded-full bg-primary-600" />
                      Conexão Rede RNP
                    </span>
                    <span className="tabular-nums">{stats.rnpAtivos} de {stats.totalAtivos} ({stats.rnpTaxa}%)</span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="h-[22px] rounded-md bg-primary-600 flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                      style={{
                        flexGrow: Math.max(1, stats.rnpAtivos),
                        flexBasis: 0,
                        minWidth: '38px'
                      }}
                    >
                      <span className="text-caption font-bold tabular-nums leading-none">
                        {stats.rnpAtivos}
                      </span>
                    </div>

                    <div
                      className="h-[22px] rounded-md bg-surface-soft border border-border flex items-center justify-center px-2 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs"
                      style={{
                        flexGrow: Math.max(1, stats.totalAtivos - stats.rnpAtivos),
                        flexBasis: 0
                      }}
                    />

                    <div className="h-[22px] min-w-[50px] px-2 rounded-md bg-surface-soft border border-border text-text-primary flex items-center justify-center shrink-0 select-none shadow-2xs">
                      <span className="text-caption font-semibold tabular-nums leading-none">
                        {stats.rnpTaxa}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-center text-caption font-semibold text-text-primary px-0.5">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span className="w-2 h-2 rounded-full bg-text-muted" />
                      Demais Ativos / Polos
                    </span>
                    <span className="tabular-nums">{stats.totalAtivos - stats.rnpAtivos} ({(100 - Number(stats.rnpTaxa)).toFixed(1)}%)</span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="h-[22px] rounded-md bg-text-muted flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                      style={{
                        flexGrow: Math.max(1, stats.totalAtivos - stats.rnpAtivos),
                        flexBasis: 0,
                        minWidth: '38px'
                      }}
                    >
                      <span className="text-caption font-bold tabular-nums leading-none">
                        {stats.totalAtivos - stats.rnpAtivos}
                      </span>
                    </div>

                    <div
                      className="h-[22px] rounded-md bg-surface-soft border border-border flex items-center justify-center px-2 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs"
                      style={{
                        flexGrow: Math.max(1, stats.rnpAtivos),
                        flexBasis: 0
                      }}
                    />

                    <div className="h-[22px] min-w-[50px] px-2 rounded-md bg-surface-soft border border-border text-text-primary flex items-center justify-center shrink-0 select-none shadow-2xs">
                      <span className="text-caption font-semibold tabular-nums leading-none">
                        {(100 - Number(stats.rnpTaxa)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 2: OFERTA EDUCACIONAL (PÍLULAS PROPORCIONAIS) */}
            <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between overflow-hidden shadow-card`}>
              <div className="border-b border-border/70 pb-2 mb-2 flex items-center justify-between shrink-0">
                <div className="flex flex-col min-w-0">
                  <h3 className="text-subtitle font-semibold text-text-primary flex items-center gap-1.5">
                    <GraduationCap size={16} className={isSemiarido ? "text-amber-600" : "text-primary-600"} />
                    Oferta Educacional CT&I
                  </h3>
                  <p className="text-caption text-text-muted font-medium mt-0.5">Distribuição por rede acadêmica</p>
                </div>
                <span className="text-caption font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 dark:bg-primary-950/40 border border-primary-500/20 dark:border-primary-800/60 px-2 py-0.5 rounded-md">
                  {stats.totalCursos} Cursos
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around py-1 gap-2">
                {/* Estadual */}
                <div className="flex flex-col gap-0.5 w-full">
                  <div className="flex justify-between items-center text-caption font-medium text-text-primary px-0.5">
                    <span className="text-[#2563EB] font-semibold">Rede Pública Estadual</span>
                    <span className="tabular-nums font-semibold">{stats.estadualCursos} ({stats.estadualTaxa}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="h-[18px] rounded-md bg-[#2563EB] flex items-center justify-center px-2 text-white shadow-2xs whitespace-nowrap"
                      style={{ flexGrow: Math.max(1, stats.estadualCursos), flexBasis: 0, minWidth: '32px' }}
                    >
                      <span className="text-[10px] font-bold tabular-nums leading-none">{stats.estadualCursos}</span>
                    </div>
                    <div
                      className="h-[18px] rounded-md bg-surface-soft border border-border"
                      style={{ flexGrow: Math.max(1, stats.totalCursos - stats.estadualCursos), flexBasis: 0 }}
                    />
                  </div>
                </div>

                {/* Federal */}
                <div className="flex flex-col gap-0.5 w-full">
                  <div className="flex justify-between items-center text-caption font-medium text-text-primary px-0.5">
                    <span className="text-[#10B981] font-semibold">Rede Pública Federal</span>
                    <span className="tabular-nums font-semibold">{stats.federalCursos} ({stats.federalTaxa}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="h-[18px] rounded-md bg-[#10B981] flex items-center justify-center px-2 text-white shadow-2xs whitespace-nowrap"
                      style={{ flexGrow: Math.max(1, stats.federalCursos), flexBasis: 0, minWidth: '32px' }}
                    >
                      <span className="text-[10px] font-bold tabular-nums leading-none">{stats.federalCursos}</span>
                    </div>
                    <div
                      className="h-[18px] rounded-md bg-surface-soft border border-border"
                      style={{ flexGrow: Math.max(1, stats.totalCursos - stats.federalCursos), flexBasis: 0 }}
                    />
                  </div>
                </div>

                {/* Privada */}
                <div className="flex flex-col gap-0.5 w-full">
                  <div className="flex justify-between items-center text-caption font-medium text-text-primary px-0.5">
                    <span className="text-[#F59E0B] font-semibold">Rede Privada / Outros</span>
                    <span className="tabular-nums font-semibold">{stats.privadaCursos} ({stats.privadaTaxa}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="h-[18px] rounded-md bg-[#F59E0B] flex items-center justify-center px-2 text-white shadow-2xs whitespace-nowrap"
                      style={{ flexGrow: Math.max(1, stats.privadaCursos), flexBasis: 0, minWidth: '32px' }}
                    >
                      <span className="text-[10px] font-bold tabular-nums leading-none">{stats.privadaCursos}</span>
                    </div>
                    <div
                      className="h-[18px] rounded-md bg-surface-soft border border-border"
                      style={{ flexGrow: Math.max(1, stats.totalCursos - stats.privadaCursos), flexBasis: 0 }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* BLOCO INFERIOR: VOCAÇÕES ECONÔMICAS E CADEIAS */}
          <div className={`bg-surface rounded-card p-3.5 px-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} shadow-card shrink-0`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-caption font-semibold text-text-primary flex items-center gap-1.5">
                <GitPullRequest size={15} className={isSemiarido ? "text-amber-600" : "text-primary-600"} />
                Vocações Econômicas e Cadeias Produtivas Mapeadas ({stats.totalCadeias})
              </h3>
              <span className="text-caption text-text-muted font-medium">Base Oficial SECTI/SDR</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cadeiasNomes.map((nome, idx) => (
                <span
                  key={idx}
                  className="text-caption font-semibold px-2 py-0.5 rounded-md bg-surface-soft border border-border text-text-primary shadow-2xs"
                >
                  {nome}
                </span>
              ))}
              {cadeiasNomes.length === 0 && (
                <span className="text-caption text-text-muted">Nenhuma cadeia específica mapeada neste recorte.</span>
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: MAPA TERRITORIAL INTEGRADO (30%) */}
        <div style={{ width: 'calc(30% - 8px)' }} className={`h-full bg-surface rounded-card border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} shadow-card relative overflow-hidden flex flex-col shrink-0 min-h-0`}>
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
