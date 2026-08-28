import React, { useContext, useState, useMemo } from 'react';
import { 
  FileText, 
  Layers, 
  Building2, 
  MapPin, 
  Wifi, 
  TrendingUp, 
  Sparkles, 
  PieChart as PieIcon, 
  BarChart3, 
  CheckCircle2, 
  Download,
  Filter,
  X
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
import SideMap from '../../components/maps/SideMap';
import { municipiosDB } from '../../data/municipiosDB';

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
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [focusedAsset, setFocusedAsset] = useState(null);

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Filtragem dos Ativos pelo Território e Categoria Selecionados
  const filteredAtivos = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    let list = ativosData;

    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

      list = list.filter(a => {
        const munKey = normalizeName(a.municipio || '');
        const munRow = MUN_LOOKUP.byName[munKey];
        const idTerr = a.id_territorio != null && a.id_territorio !== '' ? String(a.id_territorio) : (munRow?.id_territorio ? String(munRow.id_territorio) : null);
        const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
        const normTerr = normalizeName(rawTerr);

        if (tid && idTerr && idTerr === tid) return true;
        if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
        return false;
      });
    }

    if (selectedTipo !== 'todos') {
      list = list.filter(a => (a.tipo || a.nome_tipo) === selectedTipo);
    }

    return list;
  }, [ativosData, selectedTerritory, selectedTipo]);

  // 2. Tipologias disponíveis para filtro
  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set();
    ativosData.forEach(a => {
      const t = a.tipo || a.nome_tipo;
      if (t) tipos.add(t);
    });
    return Array.from(tipos);
  }, [ativosData]);

  // 3. Indicadores Executivos (KPIs)
  const statsKpis = useMemo(() => {
    const total = filteredAtivos.length;
    const rnpCount = filteredAtivos.filter(a => 
      a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim'
    ).length;

    const rnpPercent = total > 0 ? ((rnpCount / total) * 100).toFixed(1) : '0.0';

    const munSet = new Set();
    const terrSet = new Set();
    filteredAtivos.forEach(a => {
      if (a.municipio) munSet.add(normalizeName(a.municipio));
      const terr = a.territorio_identidade || a.territorio;
      if (terr) terrSet.add(normalizeName(terr));
    });

    return {
      total,
      rnpCount,
      rnpPercent,
      municipiosAtendidos: munSet.size,
      territoriosAtendidos: terrSet.size
    };
  }, [filteredAtivos]);

  // 4. Dados do Gráfico de Rosca: Distribuição por Tipo de Ativo
  const tipologiaChartData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const counts = {};
    filteredAtivos.forEach(a => {
      const tipo = a.tipo || a.nome_tipo || 'Outros';
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

  // 5. Dados do Gráfico de Barras: Proporção de Conexão RNP por Categoria
  const rnpCategoryData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const tipo = a.tipo || a.nome_tipo || 'Outros';
      if (!stats[tipo]) stats[tipo] = { name: tipo, comRnp: 0, semRnp: 0, total: 0 };

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) stats[tipo].comRnp += 1;
      else stats[tipo].semRnp += 1;
      stats[tipo].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => ({
        ...item,
        pctRnp: Number(((item.comRnp / item.total) * 100).toFixed(1))
      }));
  }, [filteredAtivos]);

  // 6. Ranking Top Municípios com mais Ativos
  const topMunicipiosData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const counts = {};

    filteredAtivos.forEach(a => {
      const mun = a.municipio || 'Não informado';
      counts[mun] = (counts[mun] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count
      }));
  }, [filteredAtivos]);

  // Exportação simples de CSV
  const handleExportCSV = () => {
    if (!filteredAtivos.length) return;
    const headers = ['ID', 'Nome', 'Sigla', 'Tipo', 'Municipio', 'Territorio', 'Conexao_RNP'];
    const rows = filteredAtivos.map(a => [
      a.id_ativo || a.id || '',
      `"${(a.nome_ativo || a.nome || '').replace(/"/g, '""')}"`,
      `"${(a.sigla_ativo || a.sigla || '').replace(/"/g, '""')}"`,
      `"${(a.tipo || a.nome_tipo || '').replace(/"/g, '""')}"`,
      `"${(a.municipio || '').replace(/"/g, '""')}"`,
      `"${(a.territorio_identidade || a.territorio || '').replace(/"/g, '""')}"`,
      a.rnp ? 'Sim' : 'Nao'
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
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <FileText size={12} className="text-[#2563EB]" />
              Painel Analítico
            </span>
          </div>
          <p className="text-xs lg:text-sm text-[#457B9D] mt-0.5 font-medium">
            Diagnóstico quantitativo da infraestrutura científica, tecnológica e de inovação do Estado da Bahia
          </p>
        </div>

        {/* BOTÃO DE EXPORTAÇÃO */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-[#1D3557] hover:bg-[#2563EB] text-white text-[11px] font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Exportar Dados (CSV)</span>
        </button>
      </div>

      {/* BARRA DE FILTROS SUPERIORES */}
      <div className="bg-white rounded-[22px] p-3 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-extrabold text-[#457B9D] uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Filter size={13} />
            Filtrar Tipologia:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTipo('todos')}
            className={`text-[10.5px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedTipo === 'todos'
                ? 'bg-[#1D3557] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#457B9D] hover:bg-[#E2E8F0]'
            }`}
          >
            Todas ({ativosData.length})
          </button>
          {tiposDisponiveis.slice(0, 5).map(tipo => (
            <button
              key={tipo}
              type="button"
              onClick={() => setSelectedTipo(tipo)}
              className={`text-[10.5px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedTipo === tipo
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        {selectedTerritory && (
          <div className="flex items-center gap-2 bg-[#E0F2FE]/70 border border-[#BAE6FD] px-3 py-1.5 rounded-xl">
            <MapPin size={12} className="text-[#0284C7]" />
            <span className="text-[11px] font-bold text-[#0369A1]">
              Região: <strong className="text-[#0C4A6E]">{territoryName}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedTerritory(null)}
              className="text-[#0369A1] hover:text-red-500 transition-colors ml-1 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}
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
          <span className="text-2xl lg:text-3xl font-black text-[#1D3557] mt-2">
            {loadingStats ? '...' : statsKpis.total}
          </span>
        </div>

        <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
          <div className="flex items-center gap-2 text-[#457B9D]">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wifi size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Conectados à RNP</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl lg:text-3xl font-black text-emerald-600">
              {loadingStats ? '...' : statsKpis.rnpCount}
            </span>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {statsKpis.rnpPercent}%
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

            {/* GRÁFICO 2: TOP 5 MUNICÍPIOS */}
            <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-[260px]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#1D3557]">Concentração Municipal</h3>
                  <p className="text-[10px] text-[#457B9D]">Municípios com maior densidade de CT&I</p>
                </div>
                <BarChart3 size={16} className="text-[#2563EB]" />
              </div>

              <div className="h-[180px] w-full">
                {topMunicipiosData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMunicipiosData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#1D3557', fontWeight: 700 }} />
                      <RechartsTooltip 
                        formatter={(value) => [`${value} ativos`, 'Total']}
                        contentStyle={{ backgroundColor: '#1D3557', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 8, 8, 0]}>
                        {topMunicipiosData.map((_, index) => (
                          <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[11px] text-gray-400 font-bold">Sem dados municipais</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* TABELA COMPARATIVA DE CONECTIVIDADE RNP POR TIPOLOGIA */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] shrink-0">
            <div className="flex items-center justify-between mb-3 border-b border-[#F1F5F9] pb-2">
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">Cobertura de Rede por Categoria</h3>
                <p className="text-[10.5px] text-[#457B9D]">Proporção de infraestrutura conectada ao backbone de pesquisa da RNP</p>
              </div>
              <Wifi size={16} className="text-emerald-500" />
            </div>

            <div className="flex flex-col gap-2.5">
              {rnpCategoryData.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#1D3557] truncate">{cat.name}</span>
                    <span className="font-bold text-[#457B9D]">
                      <strong className="text-emerald-600 font-black">{cat.comRnp}</strong> de {cat.total} com RNP ({cat.pctRnp}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
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

        {/* COLUNA DIREITA: SIDEMAP */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-[520px] lg:h-full bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
          <SideMap
            mode="ativos"
            processedAtivos={filteredAtivos}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            focusedAsset={focusedAsset}
          />
        </div>

      </div>

    </main>
  );
}