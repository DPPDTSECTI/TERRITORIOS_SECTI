import React, { useContext, useState, useMemo } from 'react';
import { 
  FileText, 
  Layers, 
  Building2, 
  MapPin, 
  Wifi, 
  PieChart as PieIcon, 
  BarChart3, 
  Download,
  Filter,
  X,
  GraduationCap,
  Sparkles
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

const PALETTE = ['#1D3557', '#2563EB', '#457B9D', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

// Categorias estritas do escopo de Ensino Superior de CT&I
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

export default function RelatorioAtivosPage() {
  const { 
    ativosData = [], 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('todos');

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Isola e valida apenas instituições de ensino superior
  const baseEnsinoAtivos = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    return ativosData.filter(a => {
      const tipo = a.tipo || a.nome_tipo || '';
      return CATEGORIAS_ENSINO_VALIDAS.some(cat => 
        normalizeName(cat) === normalizeName(tipo)
      );
    });
  }, [ativosData]);

  // 2. Filtro contextual por território e tipologia
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

    if (selectedTipo !== 'todos') {
      list = list.filter(a => normalizeName(a.tipo || a.nome_tipo) === normalizeName(selectedTipo));
    }

    return list;
  }, [baseEnsinoAtivos, selectedTerritory, selectedTipo]);

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

  // 4. Gráfico de Rosca: Distribuição de Tipologia
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

  // 5. Gráfico de Cobertura de Rede (Categorias vs Instituições/Siglas)
  const rnpNetworkData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      let key;
      if (selectedTipo === 'todos') {
        key = a.tipo || a.nome_tipo || 'Outros';
      } else {
        const sigla = (a.sigla_ativo || a.sigla || '').trim().toUpperCase();
        const nome = (a.nome_ativo || a.nome || '').trim();
        key = sigla !== '' ? sigla : nome;
      }

      if (!stats[key]) {
        stats[key] = { 
          name: key, 
          comRnp: 0, 
          semRnp: 0, 
          total: 0 
        };
      }

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) stats[key].comRnp += 1;
      else stats[key].semRnp += 1;
      stats[key].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => ({
        ...item,
        pctRnp: Number(((item.comRnp / item.total) * 100).toFixed(1)),
        pctSemRnp: Number(((item.semRnp / item.total) * 100).toFixed(1))
      }));
  }, [filteredAtivos, selectedTipo]);

  // 6. Ranking Top Municípios
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

  // Exportação de Dados
  const handleExportCSV = () => {
    if (!filteredAtivos.length) return;
    const headers = ['ID', 'Instituicao', 'Sigla', 'Tipo', 'Municipio', 'Territorio', 'Conexao_RNP'];
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
    link.setAttribute('download', `relatorio_ensino_cti_${selectedTerritory ? territoryName : 'bahia'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-1 h-screen overflow-hidden relative p-5 lg:p-6 flex flex-col gap-3.5 bg-transparent font-sans w-full">
      
      {/* CABEÇALHO DO RELATÓRIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Ensino Superior de CT&I
            </h1>
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <GraduationCap size={12} className="text-[#2563EB]" />
              Instituições de Ensino
            </span>
          </div>
          <p className="text-[11px] lg:text-xs text-[#457B9D] mt-0.5 font-medium">
            Panorama territorial das universidades e institutos federais e estaduais no Estado da Bahia
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-[#1D3557] hover:bg-[#2563EB] text-white text-[10.5px] font-bold px-3.5 py-2 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download size={13} />
          <span>Exportar Dados (CSV)</span>
        </button>
      </div>

      {/* BARRA DE FILTROS SUPERIORES */}
      <div className="bg-white rounded-[18px] p-2.5 px-3.5 border border-transparent shadow-[0_2px_12px_rgba(29,53,87,0.03)] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-[#457B9D] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter size={11} />
            Tipologia de Ensino:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTipo('todos')}
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              selectedTipo === 'todos'
                ? 'bg-[#1D3557] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#457B9D] hover:bg-[#E2E8F0]'
            }`}
          >
            Todas ({baseEnsinoAtivos.length})
          </button>
          {CATEGORIAS_ENSINO_VALIDAS.map(tipo => {
            const count = baseEnsinoAtivos.filter(a => normalizeName(a.tipo || a.nome_tipo) === normalizeName(tipo)).length;
            const isSelected = selectedTipo === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setSelectedTipo(tipo)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                {tipo.replace(/^Campi\s+/i, '')} ({count})
              </button>
            );
          })}
        </div>

        {selectedTerritory && (
          <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-2.5 py-1 rounded-lg shrink-0">
            <MapPin size={11} className="text-[#0284C7]" />
            <span className="text-[10.5px] font-bold text-[#0369A1]">
              Região: <strong className="text-[#0C4A6E]">{territoryName}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedTerritory(null)}
              className="text-[#0369A1] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* GRID DE KPIS EXECUTIVOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white rounded-[16px] p-3 flex flex-col justify-between shadow-[0_2px_12px_rgba(29,53,87,0.03)] border border-transparent">
          <div className="flex items-center gap-1.5 text-[#457B9D]">
            <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
              <Building2 size={13} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider">Campi Mapeados</span>
          </div>
          <span className="text-xl lg:text-2xl font-black text-[#1D3557] mt-1">
            {loadingStats ? '...' : statsKpis.total}
          </span>
        </div>

        <div className="bg-white rounded-[16px] p-3 flex flex-col justify-between shadow-[0_2px_12px_rgba(29,53,87,0.03)] border border-transparent">
          <div className="flex items-center gap-1.5 text-[#457B9D]">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wifi size={13} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider">Conectados à RNP</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl lg:text-2xl font-black text-emerald-600">
              {loadingStats ? '...' : statsKpis.rnpCount}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
              {statsKpis.rnpPercent}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[16px] p-3 flex flex-col justify-between shadow-[0_2px_12px_rgba(29,53,87,0.03)] border border-transparent">
          <div className="flex items-center gap-1.5 text-[#457B9D]">
            <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
              <MapPin size={13} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider">Municípios com Campi</span>
          </div>
          <span className="text-xl lg:text-2xl font-black text-[#1D3557] mt-1">
            {loadingStats ? '...' : `${statsKpis.municipiosAtendidos} munic.`}
          </span>
        </div>

        <div className="bg-white rounded-[16px] p-3 flex flex-col justify-between shadow-[0_2px_12px_rgba(29,53,87,0.03)] border border-transparent">
          <div className="flex items-center gap-1.5 text-[#457B9D]">
            <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
              <Layers size={13} strokeWidth={2.5} />
            </div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider">Territórios Cobertos</span>
          </div>
          <span className="text-xl lg:text-2xl font-black text-[#1D3557] mt-1">
            {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsKpis.territoriosAtendidos} de 27`)}
          </span>
        </div>
      </div>

      {/* GRID PRINCIPAL: GRÁFICOS ANALÍTICOS (60%) + SIDEMAP (40%) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0 overflow-hidden pb-1">
        
        {/* COLUNA ESQUERDA: GRÁFICOS */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          
          {/* GRID DE ROSCA + BARRAS MUNICIPAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
            
            {/* GRÁFICO 1: DISTRIBUIÇÃO POR TIPOLOGIA */}
            <div className="bg-white rounded-[20px] p-3.5 border border-transparent shadow-[0_2px_12px_rgba(29,53,87,0.03)] flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-[12px] font-extrabold text-[#1D3557]">Composição das Redes</h3>
                  <p className="text-[9.5px] text-[#457B9D]">Distribuição dos campi universitários</p>
                </div>
                <PieIcon size={14} className="text-[#2563EB]" />
              </div>

              <div className="h-[155px] w-full flex items-center justify-center">
                {tipologiaChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tipologiaChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={3}
                      >
                        {tipologiaChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [`${value} campi`, 'Total']}
                        contentStyle={{ backgroundColor: '#1D3557', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '10.5px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold">Sem dados</span>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: TOP MUNICÍPIOS */}
            <div className="bg-white rounded-[20px] p-3.5 border border-transparent shadow-[0_2px_12px_rgba(29,53,87,0.03)] flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-[12px] font-extrabold text-[#1D3557]">Polos Universitários</h3>
                  <p className="text-[9.5px] text-[#457B9D]">Cidades com mais instituições de ensino</p>
                </div>
                <BarChart3 size={14} className="text-[#2563EB]" />
              </div>

              <div className="h-[155px] w-full">
                {topMunicipiosData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMunicipiosData} layout="vertical" margin={{ left: 5, right: 15, top: 5, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9.5, fill: '#1D3557', fontWeight: 700 }} />
                      <RechartsTooltip 
                        formatter={(value) => [`${value} campi`, 'Quantidade']}
                        contentStyle={{ backgroundColor: '#1D3557', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '10.5px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]}>
                        {topMunicipiosData.map((_, index) => (
                          <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[10px] text-gray-400 font-bold">Sem dados</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CARD DE COBERTURA RNP: CATEGORIAS OU AGRUPAMENTO POR SIGLA */}
          <div className="bg-white rounded-[20px] p-3.5 border border-transparent shadow-[0_2px_12px_rgba(29,53,87,0.03)] shrink-0">
            <div className="flex items-center justify-between mb-2.5 border-b border-[#F1F5F9] pb-1.5">
              <div>
                <h3 className="text-[12px] font-extrabold text-[#1D3557]">
                  {selectedTipo === 'todos'
                    ? 'Cobertura RNP por Categoria de Ensino'
                    : `Conectividade RNP: ${selectedTipo.replace(/^Campi\s+/i, '')} (Por Instituição)`
                  }
                </h3>
                <p className="text-[9.5px] text-[#457B9D]">
                  {selectedTipo === 'todos'
                    ? 'Proporção de infraestrutura conectada ao backbone RNP'
                    : 'Detalhamento empilhado por entidade/sigla com e sem RNP'
                  }
                </p>
              </div>
              <Wifi size={14} className="text-emerald-500" />
            </div>

            <div className="flex flex-col gap-2">
              {rnpNetworkData.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-extrabold text-[#1D3557] truncate max-w-[55%]">
                      {item.name}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[10px]">
                      <strong className="text-emerald-600 font-black">{item.comRnp}</strong> com RNP 
                      <span className="text-gray-400 mx-1">/</span> 
                      <strong className="text-slate-600 font-black">{item.semRnp}</strong> sem ({item.pctRnp}%)
                    </span>
                  </div>

                  {/* BARRA EMPILHADA */}
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${item.pctRnp}%` }}
                      title={`Com RNP: ${item.comRnp} (${item.pctRnp}%)`}
                    />
                    <div 
                      className="h-full bg-slate-300 transition-all duration-500"
                      style={{ width: `${item.pctSemRnp}%` }}
                      title={`Sem RNP: ${item.semRnp} (${item.pctSemRnp}%)`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-full bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_2px_16px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-[420px]">
          <SideMap
            mode="ativos"
            processedAtivos={filteredAtivos}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
          />
        </div>

      </div>

    </main>
  );
}