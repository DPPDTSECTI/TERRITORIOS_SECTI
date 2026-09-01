import React, { useContext, useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Printer, 
  X, 
  Sparkles, 
  ListOrdered
} from 'lucide-react';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import ProportionBarChart from '../graph/ProportionBarChart';
import StackedBarChart from '../graph/StackedBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../../constants/assetTypes';

// Paleta limpa com destaque claro
const PALETTE = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

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

function checkSemiaridoValue(val) {
  if (val === true || val === 1) return true;
  const s = String(val ?? '').toLowerCase().trim();
  return s === 'sim' || s === 'true' || s === '1' || s === 't';
}

const MUN_LOOKUP = (() => {
  const byName = {};
  municipiosDB.forEach((row) => {
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byName };
})();

// Legenda dinâmica para quando não houver território selecionado
const SEMIARIDO_CATEGORIES = [
  { key: 'semi', label: 'Semiárido', shortLabel: 'Semiárido', colorHex: '#F59E0B' },
  { key: 'fora', label: 'Outras Regiões', shortLabel: 'Outras Regiões', colorHex: '#3B82F6' }
];

export default function RelatorioAtivosPage() {
  const { 
    ativosData = [], 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [focusedAsset, setFocusedAsset] = useState(null);

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 0. Processamento Completo dos Ativos
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

      const rawSemiarido = a.semiarido ?? a.semi_arido ?? a.is_semiarido ?? munRow?.semiarido;

      return {
        id: a.id_ativo || idx + 1,
        id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CT&I',
        sigla: a.sigla || a.sigla_ativo || a.nome_ativo || 'S/S',
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
        semiarido: checkSemiaridoValue(rawSemiarido)
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

    const munSet = new Set();
    const munSemiSet = new Set();
    const terrSet = new Set();
    const tipoCounts = {};

    filteredAtivos.forEach(a => {
      if (a.municipio) {
        const mKey = normalizeName(a.municipio);
        munSet.add(mKey);
        if (a.semiarido) munSemiSet.add(mKey);
      }
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
      municipiosAtendidos: munSet.size,
      municipiosSemiCount: munSemiSet.size,
      territoriosAtendidos: terrSet.size,
      tipoPredominante
    };
  }, [filteredAtivos]);

  // 3. Card Lista Top Siglas (Restrito a 6 itens para não transbordar no layout Flex)
  const topSiglasData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const map = {};

    filteredAtivos.forEach(a => {
      const sigla = (a.sigla || 'OUTROS').trim();
      if (!map[sigla]) {
        map[sigla] = { 
          sigla, 
          nome: a.nome || sigla, 
          tipo: a.shortTipo || a.tipo, 
          corHex: a.corHex || '#2563EB',
          total: 0, 
          semiarido: 0 
        };
      }
      map[sigla].total += 1;
      if (a.semiarido) map[sigla].semiarido += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6); // Limite rígido
  }, [filteredAtivos]);

  // 4. Agrupamento Despoluído para o Gráfico Empilhado (Top 4 Categorias + Outros)
  const { top4TiposSet, tipologiaCategories } = useMemo(() => {
    const counts = {};
    ativosProcessados.forEach(a => {
      const tipo = a.tipo || 'Outros';
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    // Pega as 4 mais frequentes no estado todo para formar a legenda
    const top4 = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);

    const top4Set = new Set(top4.map(normalizeName));
    
    const categories = top4.map((tipo, idx) => ({
      key: normalizeName(tipo),
      label: tipo,
      shortLabel: tipo.length > 20 ? tipo.substring(0, 18) + '...' : tipo,
      colorHex: PALETTE[idx % PALETTE.length]
    }));

    // Todo o resto vira "Outras Tipologias"
    categories.push({
      key: 'outros',
      label: 'Outras Tipologias',
      shortLabel: 'Outros',
      colorHex: '#94A3B8' // Cor neutra
    });

    return { top4TiposSet: top4Set, tipologiaCategories: categories };
  }, [ativosProcessados]);

  // 5. Dados do Gráfico Empilhado (agrupados nos 4 tipos + Outros)
  const concentracaoTipologiaStackedData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const groups = {};

    filteredAtivos.forEach(a => {
      const groupKey = selectedTerritory ? (a.municipio || 'Não informado') : (a.territorio || 'Não identificado');
      if (!groups[groupKey]) {
        groups[groupKey] = { label: groupKey, total: 0, segments: {} };
      }
      
      const rawKey = normalizeName(a.tipo || 'Outros');
      const finalKey = top4TiposSet.has(rawKey) ? rawKey : 'outros';

      groups[groupKey].segments[finalKey] = (groups[groupKey].segments[finalKey] || 0) + 1;
      groups[groupKey].total += 1;
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredAtivos, selectedTerritory, top4TiposSet]);

  // 6. Comparativo de Ativos no Semiárido por Categoria (Restrito a 5 barras para evitar overflow)
  const semiaridoProportionData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const tipo = a.tipo || 'Outros';
      if (!stats[tipo]) {
        stats[tipo] = { label: tipo, positive: 0, negative: 0, total: 0 };
      }
      if (a.semiarido) stats[tipo].positive += 1;
      else stats[tipo].negative += 1;
      stats[tipo].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Exibe apenas as Top 5 para não esmagar a DIV
  }, [filteredAtivos]);

  return (
    <main className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white print:overflow-visible">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full pr-[340px] shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Ativos de CT&I
            </h1>
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <Sparkles size={12} className="text-[#2563EB]" />
              Painel Analítico de Ativos
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
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-[#457B9D] font-medium">
              Diagnóstico territorial e mapeamento estrutural dos ativos de ciência, tecnologia e inovação na Bahia
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

      {/* GRID DE KPIS (PADRONIZADO h-[92px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Building2 size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Ativos Mapeados</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : statsKpis.total}
              </span>
              <span className="text-[10px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.semiaridoCount} no semiárido
              </span>
            </div>
          </div>

          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Sparkles size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Tipologia Predominante</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : (statsKpis.tipoPredominante ? `${statsKpis.tipoPredominante.percent}%` : '-')}
              </span>
              <span className="text-[10px] font-bold text-[#457B9D] truncate flex-1 min-w-0">
                {statsKpis.tipoPredominante ? statsKpis.tipoPredominante.name : 'Sem dados'}
              </span>
            </div>
          </div>

          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <MapPin size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Municípios com Presença</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : `${statsKpis.municipiosAtendidos} munic.`}
              </span>
              <span className="text-[10px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.municipiosSemiCount} no semiárido
              </span>
            </div>
          </div>

          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Layers size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Territórios Cobertos</span>
            </div>
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsKpis.territoriosAtendidos} de 27`)}
            </span>
          </div>

        </div>
      </div>

      {/* GRID PRINCIPAL DE GRÁFICOS + SIDEMAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full">
        
        {/* COLUNA ESQUERDA: GRÁFICOS AJUSTADOS (FLEX-[1.3] / FLEX-1) */}
        <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
          
          {/* GRID DE CIMA MAIS ALTO PARA NÃO CORTAR AS BARRAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-[1.3] min-h-0">
            
            {/* GRÁFICO 1: CARD LISTA TOP 6 SIGLAS (SEM OVERFLOW) */}
            <div className="bg-white rounded-[24px] p-4.5 border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] flex flex-col justify-between h-full min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-[13px] font-extrabold text-[#1D3557] flex items-center gap-1.5 truncate w-full">
                    <ListOrdered size={15} className="text-[#2563EB] shrink-0" />
                    Top Instituições / Entidades
                  </h3>
                  <p className="text-[9px] text-[#457B9D] truncate w-full mt-0.5">Entidades com maior volume estrutural</p>
                </div>
                <span className="text-[8.5px] font-bold text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.5 rounded-md border border-[#E2E8F0] shrink-0">
                  Total / Semi
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-start gap-1 overflow-y-auto pr-1 min-h-0 mt-1">
                {topSiglasData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 px-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[10px]">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span className="w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-2xs" style={{ backgroundColor: item.corHex }}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0 leading-tight">
                        <span className="font-extrabold text-[#1D3557] truncate w-full" title={item.nome}>
                          {item.sigla}
                        </span>
                        <span className="text-[8px] text-[#64748B] truncate w-full">
                          {item.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-extrabold">
                      <span className="text-[#1D3557] text-[9px] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                        {item.total} tot
                      </span>
                      <span className="text-[#B45309] bg-[#F59E0B]/15 px-1.5 py-0.5 rounded text-[9px]">
                        {item.semiarido} semi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GRÁFICO 2: CONCENTRAÇÃO TERRITORIAL (AGORA DESPOLUÍDO COM TOP 4 + OUTROS) */}
            <div className="h-full min-h-0">
              <StackedBarChart
                data={concentracaoTipologiaStackedData}
                categories={tipologiaCategories}
                title={selectedTerritory ? `Municípios em ${territoryName}` : 'Concentração por Território'}
                subtitle="Top 4 categorias + Outros"
                allowToggleView={!selectedTerritory}
              />
            </div>

          </div>

          {/* GRÁFICO 3: COMPARATIVO INFERIOR COM FLEX-1 PARA NÃO SER ESMAGADO */}
          <div className="flex-1 min-h-0 shrink-0">
            <ProportionBarChart
              data={semiaridoProportionData}
              title="Comparativo de Ativos no Semiárido por Categoria"
              subtitle="Proporção de infraestruturas mapeadas por região (Top 5)"
              positiveLabel="No Semiárido"
              negativeLabel="Outras Regiões"
              positiveColor="bg-[#F59E0B]"
              negativeColor="bg-[#3B82F6]"
            />
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-full bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
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