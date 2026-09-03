import React, { useContext, useState, useMemo, useEffect } from 'react';
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
  Users
} from 'lucide-react';
import { DataContext } from '../../context/DataContext';
import PtiMap from '../maps/PtiMap';
import { isMunicipioSemiarido, SEMIARIDO_MUNICIPIOS, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';

export default function RelatorioSintese() {
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

  // Fallback de auto-impressão caso explicitamente solicitado
  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats) {
      const timer = setTimeout(() => {
        window.print();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats]);

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
    <main id="pdf-report" className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white select-none">
      {/* CABEÇALHO DO RELATÓRIO */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Síntese de CT&I
            </h1>

            {isSemiarido ? (
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] border border-[#FDE68A] px-3 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span className="text-[10.5px] font-bold text-[#92400E]">
                  Recorte Oficial: <strong>Semiárido Baiano (278 Municípios)</strong>
                </span>
              </div>
            ) : selectedTerritory ? (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
                <MapPin size={11} className="text-[#0284C7]" />
                <span className="text-[10.5px] font-bold text-[#0369A1]">
                  Recorte: <strong className="text-[#0C4A6E]">{territoryTitle}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-[#0369A1] hover:text-red-500 transition-colors ml-0.5 cursor-pointer print:hidden"
                  title="Limpar seleção territorial"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-[10.5px] font-bold text-[#0369A1]">
                  Cenário Geral: <strong className="text-[#0C4A6E]">Estado da Bahia (417 Municípios)</strong>
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-[#457B9D] font-medium mt-1">
            {isSemiarido
              ? 'Diagnóstico consolidado de infraestrutura física, formação e arranjos econômicos nos 278 municípios do Semiárido'
              : 'Diagnóstico consolidado de infraestrutura física, formação de recursos humanos e arranjos econômicos da Bahia'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-right">
          <span className="text-[10.5px] font-bold text-[#1D3557] bg-[#D6EAF8]/50 border border-[#BAE6FD] px-3 py-1 rounded-full inline-flex items-center gap-1">
            <Award size={12} className="text-[#2563EB]" />
            Dados Oficiais SECTI/BA
          </span>
        </div>
      </div>

      {/* GRID DE KPIS (h-[92px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          
          {/* KPI 1: ATIVOS */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Database size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Ativos de CT&I</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : stats.totalAtivos}
              </span>
              <span className="text-[9.5px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded-md whitespace-nowrap" title={`${stats.totalAtivos} de ${totalAtivosBahia} ativos estaduais`}>
                {isSemiarido ? `${stats.pctAtivosEstado}% da Bahia` : `${stats.rnpAtivos} RNP (${stats.rnpTaxa}%)`}
              </span>
            </div>
          </div>

          {/* KPI 2: CURSOS */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#CCFBF1] flex items-center justify-center text-[#0D9488] shrink-0">
                <GraduationCap size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Cursos CT&I</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : stats.totalCursos}
              </span>
              <span className="text-[9.5px] font-bold text-[#0D9488] bg-[#0D9488]/10 border border-[#0D9488]/25 px-2 py-0.5 rounded-md whitespace-nowrap" title={`${stats.totalCursos} de ${totalCursosBahia} cursos estaduais`}>
                {isSemiarido ? `${stats.pctCursosEstado}% da Bahia` : 'Graduação & Pós'}
              </span>
            </div>
          </div>

          {/* KPI 3: CADEIAS MAPEADAS */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0">
                <GitPullRequest size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Cadeias Mapeadas</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                  {loadingStats ? '...' : stats.totalCadeias}
                </span>
                <span className="text-[11px] font-bold text-[#64748B]">setores</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                {isSemiarido ? 'Vocações Semiárido' : 'Vocações APL'}
              </span>
            </div>
          </div>

          {/* KPI 4: COBERTURA MUNICIPAL */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] shrink-0">
                <MapPin size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Cobertura Territorial</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                  {loadingStats ? '...' : stats.munAtendidosCount}
                </span>
                <span className="text-[11px] font-bold text-[#64748B]">/ {stats.totalMunEscopo}</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                {stats.taxaCoberturaMun}% do total
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ÁREA CENTRAL: COLUNA ESQUERDA (70%) + MAPA À DIREITA (30%) */}
      <div className="flex-1 w-full flex gap-4 min-h-0 overflow-hidden">
        
        {/* COLUNA ESQUERDA: DIAGNÓSTICO INTEGRADO */}
        <div style={{ width: 'calc(70% - 8px)' }} className="flex flex-col gap-3.5 h-full overflow-hidden">
          
          {/* BANNER INSTITUCIONAL DO ESCOPO */}
          <div className="bg-gradient-to-br from-[#1D3557] to-[#162942] text-white p-3.5 px-4 rounded-[20px] shadow-sm flex items-center justify-between shrink-0">
            <div className="max-w-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Award size={13} className="text-[#A8C7FA]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8C7FA]">Panorama Estratégico SECTI</span>
              </div>
              <h2 className="text-base font-black text-white leading-tight">
                {isSemiarido ? 'Recorte Territorial do Semiárido Baiano' : territoryTitle}
              </h2>
              <p className="text-[11px] text-white/80 mt-0.5 leading-snug">
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
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
                <span className="text-[9px] text-white/70 block uppercase font-medium">População</span>
                <strong className="text-xs font-bold">{stats.populacaoTotal} hab.</strong>
              </div>
              {stats.ifdmMedio && (
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
                  <span className="text-[9px] text-white/70 block uppercase font-medium">IFDM Médio</span>
                  <strong className="text-xs font-bold">{stats.ifdmMedio}</strong>
                </div>
              )}
            </div>
          </div>

          {/* GRID COM 2 BLOCOS ANALÍTICOS (INFRAESTRUTURA E OFERTA EDUCACIONAL) */}
          <div className="grid grid-cols-2 gap-3.5 flex-1 min-h-0">
            
            {/* BLOCO 1: INFRAESTRUTURA E CONECTIVIDADE */}
            <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between overflow-hidden">
              <div className="border-b border-[#F1F5F9] pb-2 mb-2 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <Database size={14} className="text-[#2563EB]" />
                  Infraestrutura de CT&I & RNP
                </h3>
                <span className="text-[9.5px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                  {stats.totalAtivos} Ativos
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around py-1 gap-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#1D3557]">
                    <span className="flex items-center gap-1.5 text-[#2563EB]">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      Conexão Rede RNP
                    </span>
                    <span>{stats.rnpAtivos} ({stats.rnpTaxa}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${stats.rnpTaxa}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#1D3557]">
                    <span className="flex items-center gap-1.5 text-[#64748B]">
                      <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                      Demais Ativos / Polos
                    </span>
                    <span>{stats.totalAtivos - stats.rnpAtivos} ({(100 - Number(stats.rnpTaxa)).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex">
                    <div className="h-full bg-[#94A3B8]" style={{ width: `${100 - Number(stats.rnpTaxa)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 2: OFERTA EDUCACIONAL */}
            <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between overflow-hidden">
              <div className="border-b border-[#F1F5F9] pb-2 mb-2 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-[#8B5CF6]" />
                  Oferta Educacional CT&I
                </h3>
                <span className="text-[9.5px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">
                  {stats.totalCursos} Cursos
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-around py-1 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-bold text-[#1D3557]">
                    <span className="text-[#2563EB]">Rede Pública Estadual</span>
                    <span>{stats.estadualCursos} ({stats.estadualTaxa}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${stats.estadualTaxa}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-bold text-[#1D3557]">
                    <span className="text-[#10B981]">Rede Pública Federal</span>
                    <span>{stats.federalCursos} ({stats.federalTaxa}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className="h-full bg-[#10B981]" style={{ width: `${stats.federalTaxa}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px] font-bold text-[#1D3557]">
                    <span className="text-[#8B5CF6]">Rede Privada / Outros</span>
                    <span>{stats.privadaCursos} ({stats.privadaTaxa}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className="h-full bg-[#8B5CF6]" style={{ width: `${stats.privadaTaxa}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* BLOCO INFERIOR: VOCAÇÕES ECONÔMICAS E CADEIAS */}
          <div className="bg-white rounded-[24px] p-3.5 px-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-[#1D3557] flex items-center gap-1.5">
                <GitPullRequest size={14} className="text-[#D97706]" />
                Vocações Econômicas e Cadeias Produtivas Mapeadas ({stats.totalCadeias})
              </h3>
              <span className="text-[9.5px] font-bold text-[#64748B]">Fonte: Base Oficial SECTI/SDR</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cadeiasNomes.map((nome, idx) => (
                <span
                  key={idx}
                  className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#1D3557]"
                >
                  {nome}
                </span>
              ))}
              {cadeiasNomes.length === 0 && (
                <span className="text-[10.5px] text-[#94A3B8]">Nenhuma cadeia específica mapeada neste recorte.</span>
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: MAPA TERRITORIAL INTEGRADO (30%) */}
        <div style={{ width: 'calc(30% - 8px)' }} className="h-full bg-white rounded-[24px] border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] relative overflow-hidden flex flex-col shrink-0 min-h-0">
          <PtiMap
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
