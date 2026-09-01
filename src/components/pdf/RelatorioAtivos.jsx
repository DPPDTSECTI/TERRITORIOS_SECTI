import React, { useContext, useState, useMemo } from 'react';
import { 
  Layers, 
  Building2, 
  MapPin, 
  Sparkles, 
  Sun,
  PieChart as PieIcon, 
  BarChart3
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
  Pie 
} from 'recharts';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../../constants/assetTypes';

const PALETTE = ['#1D3557', '#2563EB', '#457B9D', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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

// Verifica se o município (linha da base) pertence à região do Semiárido.
// Suporta algumas variações comuns de nomenclatura do campo na base de dados.
function isSemiaridoRow(row) {
  if (!row) return false;
  const raw = row.semiarido ?? row.semi_arido ?? row.is_semiarido ?? row.semiArido;
  if (raw === true || raw === 1) return true;
  const s = String(raw ?? '').toLowerCase().trim();
  return s === 'sim' || s === 'true' || s === '1' || s === 'yes';
}

const MUN_LOOKUP = (() => {
  const byName = {};
  municipiosDB.forEach((row) => {
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byName };
})();

export default function RelatorioAtivosPage() {
  const { 
    ativosData = [], 
    territoriosData = [],
    municipiosTerritorios = [], 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);

  const [focusedAsset, setFocusedAsset] = useState(null);

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 0. Processamento Completo dos Ativos (coordenadas, ícones, cores, tipologia e semiárido)
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    return ativosData.map((a, idx) => {
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);

      const munKey = normalizeName(a.municipio || '');
      const munRow = MUN_LOOKUP.byName[munKey];

      const rawLat = a.latitude != null && a.latitude !== '' ? Number(a.latitude) : null;
      const rawLng = a.longitude != null && a.longitude !== '' ? Number(a.longitude) : null;

      let lat = rawLat;
      let lng = rawLng;

      if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || lat === 0) {
        const fallback = MUNICIPIOS_COORDS[String(a.municipio || '').trim()] ||
                         MUNICIPIOS_COORDS[munKey] ||
                         [-12.9714, -38.5014];
        lat = fallback[0];
        lng = fallback[1];
      }

      const id_territorio = a.id_territorio != null && a.id_territorio !== ''
        ? Number(a.id_territorio)
        : (munRow?.id_territorio || null);

      const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
      const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();

      return {
        id: a.id_ativo || idx + 1,
        id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CT&I',
        sigla: a.sigla || '',
        tipo: nomeTipoColuna,
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || munRow?.nome_municipio || 'Bahia',
        territorio: cleanTerr || 'Bahia',
        territorio_identidade: cleanTerr || 'Bahia',
        lat,
        lng,
        icone: configEstilo.icone,
        iconSvg: configEstilo.iconSvg,
        cor: configEstilo.bgClass,
        textCor: configEstilo.textClass,
        corHex: configEstilo.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || '',
        semiarido: a.semiarido
      };
    });
  }, [ativosData]);

  // 1. Filtragem dos Ativos pelo Território Selecionado
  const filteredAtivos = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    if (!selectedTerritory) return ativosProcessados;

    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return ativosProcessados.filter(a => {
      if (tid && a.id_territorio && String(a.id_territorio) === tid) return true;
      const normTerr = normalizeName(a.territorio || '');
      if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
      return false;
    });
  }, [ativosProcessados, selectedTerritory]);

  // 2. Indicadores Executivos (KPIs)
  const statsKpis = useMemo(() => {
    const total = filteredAtivos.length;
    const semiaridoCount = filteredAtivos.filter(a => a.semiarido).length;
    const semiaridoPercent = total > 0 ? ((semiaridoCount / total) * 100).toFixed(1) : '0.0';

    const munSet = new Set();
    const terrSet = new Set();
    const tipoCounts = {};

    filteredAtivos.forEach(a => {
      if (a.municipio) munSet.add(normalizeName(a.municipio));
      if (a.territorio) terrSet.add(normalizeName(a.territorio));
      const t = a.tipo || 'Outros';
      tipoCounts[t] = (tipoCounts[t] || 0) + 1;
    });

    let tipoPredominante = null;
    const tipoEntries = Object.entries(tipoCounts).sort((a, b) => b[1] - a[1]);
    if (tipoEntries.length > 0) {
      const [name, count] = tipoEntries[0];
      tipoPredominante = {
        name,
        percent: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      };
    }

    return {
      total,
      semiaridoCount,
      semiaridoPercent,
      municipiosAtendidos: munSet.size,
      territoriosAtendidos: terrSet.size,
      tipoPredominante
    };
  }, [filteredAtivos]);

  // 3. Dados do Gráfico de Rosca: Distribuição por Tipo de Ativo
  const tipologiaChartData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const counts = {};
    filteredAtivos.forEach(a => {
      const tipo = a.tipo || 'Outros';
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        color: PALETTE[idx % PALETTE.length]
      }));
  }, [filteredAtivos]);

  // 4. Gráfico de Barras: Concentração — por Território (visão geral) ou por Município (território selecionado)
  const topConcentracaoData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const counts = {};

    filteredAtivos.forEach(a => {
      const key = selectedTerritory ? (a.municipio || 'Não informado') : (a.territorio || 'Outros');
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count
      }));
  }, [filteredAtivos, selectedTerritory]);

  // 5. Comparativo: Proporção de Ativos no Semiárido por Categoria/Tipologia
  const semiaridoCategoryData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const tipo = a.tipo || 'Outros';
      if (!stats[tipo]) stats[tipo] = { name: tipo, semiarido: 0, fora: 0, total: 0 };

      if (a.semiarido) stats[tipo].semiarido += 1;
      else stats[tipo].fora += 1;
      stats[tipo].total += 1;
    });

    const arr = Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => ({
        ...item,
        pctSemiarido: Number(((item.semiarido / item.total) * 100).toFixed(1))
      }));

    const maxTotal = Math.max(0, ...arr.map(c => c.total));
    return arr.map(item => ({
      ...item,
      relativeWidth: maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
    }));
  }, [filteredAtivos]);

  // Exportação simples de CSV
  const handleExportCSV = () => {
    if (!filteredAtivos.length) return;
    const headers = ['ID', 'Nome', 'Sigla', 'Tipo', 'Municipio', 'Territorio', 'Semiarido'];
    const rows = filteredAtivos.map(a => [
      a.id || '',
      `"${(a.nome || '').replace(/"/g, '""')}"`,
      `"${(a.sigla || '').replace(/"/g, '""')}"`,
      `"${(a.tipo || '').replace(/"/g, '""')}"`,
      `"${(a.municipio || '').replace(/"/g, '""')}"`,
      `"${(a.territorio || '').replace(/"/g, '""')}"`,
      a.semiarido ? 'Sim' : 'Nao'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_ativos_cti_${selectedTerritory ? territoryName : 'bahia'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">
      
      {/* CABEÇALHO DO RELATÓRIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1D3557] tracking-tight">
              Relatório Executivo de Ativos de CT&I
            </h1>
          </div>
        </div>
      </div>

      {/* GRID DE KPIS / INDICADORES EXECUTIVOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 shrink-0">
        <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
          <div className="flex items-center gap-2 text-[#457B9D]">
            <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center">
              <Building2 size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Ativos Mapeados</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2 flex-wrap">
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557]">
              {loadingStats ? '...' : statsKpis.total}
            </span>
            <span className="text-[10px] font-bold text-[#B45309] bg-[#F59E0B]/12 px-2 py-0.5 rounded-full whitespace-nowrap">
              {loadingStats ? '...' : statsKpis.semiaridoCount} no semiárido
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
          <div className="flex items-center gap-2 text-[#457B9D]">
            <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center">
              <Sparkles size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Tipologia Predominante</span>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : (statsKpis.tipoPredominante ? `${statsKpis.tipoPredominante.percent}%` : '-')}
            </span>
            <span className="text-[9.5px] font-bold text-[#457B9D] mt-1 truncate">
              {statsKpis.tipoPredominante ? statsKpis.tipoPredominante.name : 'Sem dados'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
          <div className="flex items-center gap-2 text-[#457B9D]">
            <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center">
              <MapPin size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Municípios com Presença</span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-[#1D3557] mt-2">
            {loadingStats ? '...' : `${statsKpis.municipiosAtendidos} munic.`}
          </span>
        </div>

        <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
          <div className="flex items-center gap-2 text-[#457B9D]">
            <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center">
              <Layers size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Territórios Cobertos</span>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-[#1D3557] mt-2">
            {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsKpis.territoriosAtendidos} de 27`)}
          </span>
        </div>
      </div>

      {/* CORPO DO RELATÓRIO: GRÁFICOS (60%) + SIDEMAP (40%) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[560px] pb-4">
        
        {/* COLUNA ESQUERDA: GRÁFICOS ANALÍTICOS COMPARATIVOS */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          
          {/* GRID 2x1 DE GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            
            {/* GRÁFICO 1: DISTRIBUIÇÃO POR TIPOLOGIA */}
            <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-[260px]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#1D3557]">Composição das Tipologias</h3>
                  <p className="text-[10px] text-[#457B9D]">Distribuição percentual dos ativos mapeados</p>
                </div>
                <PieIcon size={16} className="text-[#2563EB]" />
              </div>

              <div className="h-[180px] w-full flex items-center justify-center">
                {tipologiaChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tipologiaChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {tipologiaChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [`${value} ativos`, 'Quantidade']}
                        contentStyle={{ backgroundColor: '#1D3557', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[11px] text-gray-400 font-bold">Sem dados no filtro</span>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: CONCENTRAÇÃO TERRITORIAL OU MUNICIPAL (DINÂMICO) */}
            <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-[260px]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                    {selectedTerritory ? 'Concentração Municipal' : 'Concentração Territorial'}
                  </h3>
                  <p className="text-[10px] text-[#457B9D]">
                    {selectedTerritory
                      ? `Municípios com maior densidade de CT&I em ${territoryName}`
                      : 'Territórios de Identidade com maior densidade de CT&I'}
                  </p>
                </div>
                <BarChart3 size={16} className="text-[#2563EB]" />
              </div>

              <div className="h-[180px] w-full">
                {topConcentracaoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topConcentracaoData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#1D3557', fontWeight: 700 }} />
                      <RechartsTooltip 
                        formatter={(value) => [`${value} ativos`, 'Total']}
                        contentStyle={{ backgroundColor: '#1D3557', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 8, 8, 0]}>
                        {topConcentracaoData.map((_, index) => (
                          <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[11px] text-gray-400 font-bold">Sem dados no filtro</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* TABELA COMPARATIVA: DISTRIBUIÇÃO NO SEMIÁRIDO POR TIPOLOGIA */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] shrink-0">
            <div className="flex items-center justify-between mb-3 border-b border-[#F1F5F9] pb-2">
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">Comparativo de Ativos no Semiárido por Categoria</h3>
                <p className="text-[10.5px] text-[#457B9D]">Proporção de ativos localizados em municípios da região do Semiárido, por tipologia</p>
              </div>
              <Sun size={16} className="text-[#F59E0B]" />
            </div>

            <div className="flex flex-col gap-2.5">
              {semiaridoCategoryData.length > 0 ? (
                semiaridoCategoryData.map((cat, idx) => (
                  <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-[#F8FAFC]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#1D3557] truncate">{cat.name}</span>
                      <span className="font-bold text-[#457B9D]">
                        <strong className="text-[#B45309] font-black">{cat.semiarido}</strong> de {cat.total} no semiárido ({cat.pctSemiarido}%)
                      </span>
                    </div>
                    <div 
                      className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden" 
                      style={{ width: `${cat.relativeWidth}%` }}
                    >
                      <div 
                        className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                        style={{ width: `${cat.pctSemiarido}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-[11px] text-gray-400 font-bold">Sem dados no filtro</span>
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-[520px] lg:h-full bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
          <SideMap
            mode="ativos"
            processedAtivos={ativosProcessados}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            focusedAsset={focusedAsset}
          />
        </div>

      </div>

    </main>
  );
}