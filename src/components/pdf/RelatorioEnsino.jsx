import React, { useContext, useState, useMemo, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Wifi, 
  GraduationCap, 
  PieChart as PieIcon, 
  BarChart3, 
  Printer, 
  X, 
  BookOpen,
  Layers,
  Flame
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell, 
  PieChart, 
  Pie,
  LabelList
} from 'recharts';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import { municipiosDB } from '../../data/municipiosDB';

const PALETTE = ['#1D3557', '#2563EB', '#457B9D', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const CATEGORIAS_ENSINO_VALIDAS = [
  'Campi Instituto Federal',
  'Campi Universidade Privada',
  'Campi Universidade Pública - Federal',
  'Campi Universidade Pública - Estadual'
];

function normalizeName(value) {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MUN_LOOKUP = (() => {
  const byName = {};
  municipiosDB.forEach((row) => {
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byName };
})();

function getTipoPadronizado(tipoStr) {
  const s = String(tipoStr || '').toLowerCase();
  if (s.includes('federal') && (s.includes('instituto') || s.includes('ifba') || s.includes('if baiano'))) {
    return 'Instituto Federal';
  }
  if (s.includes('estadual')) {
    return 'Univ. Pública Estadual';
  }
  if (s.includes('federal')) {
    return 'Univ. Pública Federal';
  }
  return 'Univ. Privada';
}

export default function RelatorioAtivosPage() {
  const { 
    ativosData = [], 
    cursosData = [], 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Isola ativos de ensino superior
  const baseEnsinoAtivos = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    return ativosData.filter(a => {
      const tipo = a.tipo || a.nome_tipo || '';
      return CATEGORIAS_ENSINO_VALIDAS.some(cat => 
        normalizeName(cat) === normalizeName(tipo)
      );
    });
  }, [ativosData]);

  // 2. Filtro dos Ativos pelo Território
  const filteredAtivos = useMemo(() => {
    let list = baseEnsinoAtivos;

    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

      list = list.filter(a => {
        const munKey = normalizeName(a.municipio || '');
        const munRow = MUN_LOOKUP.byName[munKey];
        const idTerr = a.id_territorio != null && a.id_territorio !== '' 
          ? String(a.id_territorio) 
          : (munRow?.id_territorio ? String(munRow.id_territorio) : null);
        const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
        const normTerr = normalizeName(rawTerr);

        if (tid && idTerr && idTerr === tid) return true;
        if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
        return false;
      });
    }

    return list;
  }, [baseEnsinoAtivos, selectedTerritory]);

  // 3. Filtro dos Cursos pelo Território
  const filteredCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    let list = cursosData;

    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? Number(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);
      list = list.filter(c => 
        (tid && Number(c.id_territorio) === tid) || 
        (tNorm && normalizeName(c.territorio_identidade || c.territorio) === tNorm)
      );
    }

    return list;
  }, [cursosData, selectedTerritory]);

  // 4. Indicadores Executivos
  const statsCursosKpis = useMemo(() => {
    const totalCursos = filteredCursos.length;
    const totalCampi = filteredAtivos.length;

    const munSet = new Set();
    const terrSet = new Set();
    filteredCursos.forEach(c => {
      if (c.municipio) munSet.add(normalizeName(c.municipio));
      const terr = c.territorio_identidade || c.territorio;
      if (terr) terrSet.add(normalizeName(terr));
    });

    const mediaCursosPorCampus = totalCampi > 0 ? (totalCursos / totalCampi).toFixed(1) : '0';

    return {
      totalCursos,
      totalCampi,
      municipiosComCursos: munSet.size,
      territoriosComCursos: terrSet.size,
      mediaCursosPorCampus
    };
  }, [filteredCursos, filteredAtivos]);

  // 5. Gráfico 1: Donut de Áreas de Conhecimento
  const areasChartData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];
    const counts = {};
    const total = filteredCursos.length;

    filteredCursos.forEach(c => {
      const area = c.categoria || c.tipo || 'Outras Áreas';
      counts[area] = (counts[area] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
        color: PALETTE[idx % PALETTE.length]
      }));
  }, [filteredCursos]);

  // 6. Gráfico 2: Top Municípios por Volume de Cursos
  const topMunicipiosCursosData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];
    const counts = {};

    filteredCursos.forEach(c => {
      const mun = c.municipio || 'Não informado';
      counts[mun] = (counts[mun] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [filteredCursos]);

  // 7. Gráfico 3: Matriz de Distribuição por Área e Natureza Jurídica
  const matrixAreaNaturezaData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];

    const ativoTipoMap = new Map();
    baseEnsinoAtivos.forEach(a => {
      if (a.id_ativo || a.id) {
        ativoTipoMap.set(Number(a.id_ativo || a.id), getTipoPadronizado(a.tipo || a.nome_tipo));
      }
    });

    const countsByArea = {};

    filteredCursos.forEach(c => {
      const area = c.categoria || c.tipo || 'Geral';

      if (!countsByArea[area]) {
        countsByArea[area] = {
          categoria: area,
          'Univ. Pública Federal': 0,
          'Univ. Pública Estadual': 0,
          'Instituto Federal': 0,
          'Univ. Privada': 0,
          total: 0
        };
      }

      let tipoFinal = 'Univ. Privada';
      if (c.id_ativo && ativoTipoMap.has(Number(c.id_ativo))) {
        tipoFinal = ativoTipoMap.get(Number(c.id_ativo));
      } else if (c.sigla || c.entidade || c.instituicao) {
        tipoFinal = getTipoPadronizado(c.sigla || c.entidade || c.instituicao);
      }

      countsByArea[area][tipoFinal] = (countsByArea[area][tipoFinal] || 0) + 1;
      countsByArea[area].total += 1;
    });

    return Object.values(countsByArea).sort((a, b) => b.total - a.total);
  }, [filteredCursos, baseEnsinoAtivos]);

  // 8. Gráfico 4: Cobertura RNP por Categoria
  const rnpCategoryData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const tipo = a.tipo || a.nome_tipo || 'Outros';
      if (!stats[tipo]) {
        stats[tipo] = { name: tipo, comRnp: 0, semRnp: 0, total: 0 };
      }
      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) stats[tipo].comRnp += 1;
      else stats[tipo].semRnp += 1;
      stats[tipo].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        ...item,
        pctRnp: Number(((item.comRnp / item.total) * 100).toFixed(1))
      }));
  }, [filteredAtivos]);

  return (
    <main className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white print:overflow-visible">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full pr-[340px] shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Cursos e Ensino Superior de CT&I
            </h1>
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <Flame size={13} className="text-[#2563EB]" />
              Heatmap & Infraestrutura
            </span>

            {selectedTerritory && (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
                <MapPin size={11} className="text-[#0284C7]" />
                <span className="text-[10.5px] font-bold text-[#0369A1]">
                  Recorte: <strong className="text-[#0C4A6E]">{territoryName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-[#0369A1] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                  title="Limpar seleção territorial"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-[#457B9D] font-medium">
              Diagnóstico territorial da densidade de cursos e distribuição dos campi universitários na Bahia
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 bg-[#1D3557] hover:bg-[#2563EB] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer print:hidden"
            >
              <Printer size={11} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* GRID DE KPIS */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <BookOpen size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Cursos Mapeados</span>
            </div>
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : statsCursosKpis.totalCursos}
            </span>
          </div>

          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Building2 size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Campi Ofertantes</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : statsCursosKpis.totalCampi}
              </span>
              <span className="text-[10.5px] font-extrabold text-[#457B9D] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                ~{statsCursosKpis.mediaCursosPorCampus} cursos/campus
              </span>
            </div>
          </div>

          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <MapPin size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Municípios com Cursos</span>
            </div>
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : `${statsCursosKpis.municipiosComCursos} municípios`}
            </span>
          </div>

          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Layers size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Territórios com Oferta</span>
            </div>
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsCursosKpis.territoriosComCursos} de 27`)}
            </span>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL: GRÁFICOS ANALÍTICOS (60%) + SIDEMAP NO MODO CURSOS (40%) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full">
        
        {/* COLUNA ESQUERDA: GRID 2x2 TOTALMENTE EXPANDIDO */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">
          
          {/* GRÁFICO 1: DONUT DE ÁREAS COM LEGENDA ESTÁTICA EM BAIXO */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">Áreas de Conhecimento</h3>
                <p className="text-[10.5px] text-[#457B9D]">Distribuição dos cursos ofertados</p>
              </div>
              <PieIcon size={16} className="text-[#2563EB]" />
            </div>

            <div className="flex-1 flex items-center gap-2 min-h-0 overflow-hidden">
              {/* ROSCA */}
              <div className="w-[45%] h-full flex items-center justify-center">
                {areasChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={areasChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="85%"
                        paddingAngle={3}
                      >
                        {areasChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold">Sem dados</span>
                )}
              </div>

              {/* LEGENDA DETALHADA FIXA */}
              <div className="w-[55%] flex flex-col justify-center gap-1.5 overflow-y-auto pr-1">
                {areasChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-1 text-[9.5px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-[#1D3557] truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-black text-[#457B9D] shrink-0">
                      {item.value} ({item.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GRÁFICO 2: POLOS DE OFERTA COM RÓTULOS INTERNOS */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">Polos de Oferta</h3>
                <p className="text-[10.5px] text-[#457B9D]">Cidades com maior volume de cursos</p>
              </div>
              <BarChart3 size={16} className="text-[#2563EB]" />
            </div>

            <div className="flex-1 w-full min-h-0 pt-1">
              {topMunicipiosCursosData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMunicipiosCursosData} layout="vertical" margin={{ left: 5, right: 28, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#1D3557', fontWeight: 700 }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {topMunicipiosCursosData.map((_, index) => (
                        <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                      <LabelList 
                        dataKey="count" 
                        position="insideRight" 
                        fill="#ffffff" 
                        fontSize={10.5} 
                        fontWeight={800} 
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[11px] text-gray-400 font-bold">Sem dados</span>
                </div>
              )}
            </div>
          </div>

          {/* GRÁFICO 3: MATRIZ DE COMPOSIÇÃO POR ÁREA E REDE */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1">
              <div>
                <h3 className="text-[12.5px] font-extrabold text-[#1D3557]">Composição por Área e Rede</h3>
                <p className="text-[9.5px] text-[#457B9D]">Proporção Federal, Estadual, IF e Privada</p>
              </div>

              {/* LEGENDA */}
              <div className="flex items-center gap-2 text-[8.5px] font-black">
                <span className="flex items-center gap-1 text-[#1D3557]"><span className="w-2 h-2 rounded-full bg-[#1D3557]"></span>Fed.</span>
                <span className="flex items-center gap-1 text-[#2563EB]"><span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>Est.</span>
                <span className="flex items-center gap-1 text-[#10B981]"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span>IF</span>
                <span className="flex items-center gap-1 text-[#F59E0B]"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Priv.</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-around gap-1 overflow-y-auto pr-1 min-h-0">
              {matrixAreaNaturezaData.map((row, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-extrabold text-[#1D3557] truncate max-w-[70%]">
                      {row.categoria}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[10px]">
                      {row.total} cursos
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs">
                    {row['Univ. Pública Federal'] > 0 && (
                      <div 
                        className="h-full bg-[#1D3557]"
                        style={{ width: `${(row['Univ. Pública Federal'] / row.total) * 100}%` }}
                        title={`Federal: ${row['Univ. Pública Federal']} cursos`}
                      />
                    )}
                    {row['Univ. Pública Estadual'] > 0 && (
                      <div 
                        className="h-full bg-[#2563EB]"
                        style={{ width: `${(row['Univ. Pública Estadual'] / row.total) * 100}%` }}
                        title={`Estadual: ${row['Univ. Pública Estadual']} cursos`}
                      />
                    )}
                    {row['Instituto Federal'] > 0 && (
                      <div 
                        className="h-full bg-[#10B981]"
                        style={{ width: `${(row['Instituto Federal'] / row.total) * 100}%` }}
                        title={`IF: ${row['Instituto Federal']} cursos`}
                      />
                    )}
                    {row['Univ. Privada'] > 0 && (
                      <div 
                        className="h-full bg-[#F59E0B]"
                        style={{ width: `${(row['Univ. Privada'] / row.total) * 100}%` }}
                        title={`Privada: ${row['Univ. Privada']} cursos`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 4: COBERTURA DE REDE RNP */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1">
              <div>
                <h3 className="text-[12.5px] font-extrabold text-[#1D3557]">Cobertura de Rede RNP</h3>
                <p className="text-[9.5px] text-[#457B9D]">Campi conectados ao backbone de pesquisa</p>
              </div>
              <Wifi size={15} className="text-emerald-500" />
            </div>

            <div className="flex-1 flex flex-col justify-around gap-1.5 my-auto min-h-0">
              {rnpCategoryData.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 p-1.5 px-2.5 rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-extrabold text-[#1D3557] truncate max-w-[60%]">
                      {cat.name.replace(/^Campi\s+/i, '')}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[10px]">
                      <strong className="text-emerald-600 font-black">{cat.comRnp}</strong> de {cat.total} ({cat.pctRnp}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden shadow-2xs">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${cat.pctRnp}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO HEATMAP DE CURSOS */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-full bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
          <SideMap
            mode="cursos"
            cursosData={cursosData}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
          />
        </div>

      </div>

    </main>
  );
}