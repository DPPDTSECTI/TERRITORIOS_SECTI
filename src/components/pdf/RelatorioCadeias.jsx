import React, { useContext, useState, useMemo } from 'react';
import { 
  Boxes, 
  MapPin, 
  Layers, 
  Printer, 
  X, 
  Sparkles, 
  ListOrdered, 
  BarChart2,
  Wheat,
  Award,
  Compass
} from 'lucide-react';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import StackedBarChart from '../graph/StackedBarChart';
import ProportionBarChart from '../graph/ProportionBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';

function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  const byId = {};
  const byName = {};
  municipiosDB.forEach((row) => {
    byId[row.id_municipio] = row;
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byId, byName };
})();

function findMunicipioCoords(nome) {
  if (!nome) return null;
  const raw = String(nome).trim();
  const clean = normalizeName(raw);

  if (MUNICIPIOS_COORDS[raw]) return MUNICIPIOS_COORDS[raw];
  if (MUNICIPIOS_COORDS[clean]) return MUNICIPIOS_COORDS[clean];
  if (MUNICIPIOS_COORDS[raw.toLowerCase()]) return MUNICIPIOS_COORDS[raw.toLowerCase()];

  const aliases = {
    'petrolina': [-9.3989, -40.5008],
    'sao francisco': [-9.427268, -40.505742],
    'lem': [-12.087454, -45.796046],
    'saj': [-12.968813, -39.257965]
  };

  if (aliases[clean]) return aliases[clean];

  const lookup = MUN_LOOKUP.byName[clean];
  if (lookup && MUNICIPIOS_COORDS[lookup.nome_municipio]) {
    return MUNICIPIOS_COORDS[lookup.nome_municipio];
  }

  for (const key of Object.keys(MUNICIPIOS_COORDS)) {
    if (normalizeName(key).includes(clean) || clean.includes(normalizeName(key))) {
      return MUNICIPIOS_COORDS[key];
    }
  }

  return null;
}

const getTipoCadeiaConfig = (nomeTipo) => {
  const str = String(nomeTipo || '').toLowerCase();
  if (str.includes('potencial')) {
    return {
      corHex: '#F59E0B',
      label: 'IG Potencial',
      icone: Compass
    };
  }
  if (str.includes('ig') || str.includes('indica')) {
    return {
      corHex: '#10B981',
      label: 'IG',
      icone: Award
    };
  }
  return {
    corHex: '#2563EB',
    label: 'APL',
    icone: Wheat
  };
};

const SEMIARIDO_CATEGORIES = [
  { key: 'semi', label: 'Semiárido', shortLabel: 'Semiárido', colorHex: '#F59E0B' },
  { key: 'fora', label: 'Outras Regiões', shortLabel: 'Outras Regiões', colorHex: '#3B82F6' }
];

export default function RelatorioCadeiasPage() {
  const { 
    listaCadeias = [], 
    distribuicaoCadeias = [], 
    territoriosData = [], 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Enriquecimento dos Dados (Idêntico ao CadeiaPage)
  const enrichedCadeias = useMemo(() => {
    const fontesMap = new Map();
    const coordsMap = new Map();

    (listaCadeias || []).forEach(lc => {
      const id = Number(lc.id_cadeia);
      if (id && lc.fonte) fontesMap.set(id, lc.fonte);
      if (id && (lc.latitude || lc.lat) && (lc.longitude || lc.lng)) {
        coordsMap.set(id, [Number(lc.latitude || lc.lat), Number(lc.longitude || lc.lng)]);
      }
    });

    const sourceData = (distribuicaoCadeias && distribuicaoCadeias.length > 0) ? distribuicaoCadeias : listaCadeias;
    if (!sourceData || sourceData.length === 0) return [];

    const mapCadeias = new Map();

    sourceData.forEach((row, idx) => {
      const idCadeia = Number(row.id_cadeia || idx + 1);
      const tipoNome = row.nome_tipo || row.tipo || 'APL';
      const configTipo = getTipoCadeiaConfig(tipoNome);
      const entidadeStr = String(row.entidade || '').toLowerCase();

      let overrideSede = null;
      let overrideTerritorioId = null;
      let overrideTerritorioNome = null;

      if (entidadeStr.includes('sao francisco') || entidadeStr.includes('uvas de mesa') || entidadeStr.includes('vinho do vale')) {
        overrideSede = 'Juazeiro';
        overrideTerritorioId = 21;
        overrideTerritorioNome = 'Sertão do São Francisco';
      } else if (entidadeStr.includes('luis eduardo') || entidadeStr.includes('oeste da bahia')) {
        overrideSede = 'Luís Eduardo Magalhães';
        overrideTerritorioId = 4;
        overrideTerritorioNome = 'Bacia do Rio Grande';
      } else if (entidadeStr.includes('cachaça de abaíra') || entidadeStr.includes('abaira')) {
        overrideSede = 'Abaíra';
        overrideTerritorioId = 11;
        overrideTerritorioNome = 'Chapada Diamantina';
      } else if (entidadeStr.includes('cacau do sul') || entidadeStr.includes('sul da bahia')) {
        overrideSede = 'Ilhéus';
        overrideTerritorioId = 6;
        overrideTerritorioNome = 'Litoral Sul';
      }

      let rawMunSede = overrideSede || row.sede || row.municipio_sede || '';
      if ((!rawMunSede || rawMunSede.toLowerCase() === 'bahia') && row.nome_municipio && row.nome_municipio.toLowerCase() !== 'bahia') {
        rawMunSede = row.nome_municipio;
      }

      const lookupSede = (row.id_sede && MUN_LOOKUP.byId[row.id_sede]) || 
                         (rawMunSede && MUN_LOOKUP.byName[normalizeName(rawMunSede)]);

      const nomeSedeFinal = lookupSede ? lookupSede.nome_municipio : (rawMunSede || 'Juazeiro');
      const idTerrSede = overrideTerritorioId || (lookupSede ? lookupSede.id_territorio : (row.id_territorio || null));
      const nomeTerrSede = overrideTerritorioNome || (lookupSede ? lookupSede.nome_territorio : (row.nome_territorio || 'Não identificado'));
      const isSedeSemi = lookupSede ? checkSemiaridoValue(lookupSede.semiarido) : false;

      if (!mapCadeias.has(idCadeia)) {
        let lat = row.latitude ? Number(row.latitude) : (row.lat ? Number(row.lat) : null);
        let lng = row.longitude ? Number(row.longitude) : (row.lng ? Number(row.lng) : null);

        if ((!lat || !lng) && coordsMap.has(idCadeia)) {
          const [cLat, cLng] = coordsMap.get(idCadeia);
          lat = cLat;
          lng = cLng;
        }

        if (!lat || !lng) {
          const huntedCoords = findMunicipioCoords(nomeSedeFinal) || 
                               (overrideSede ? findMunicipioCoords(overrideSede) : null) || 
                               [-9.4167, -40.5000];
          lat = huntedCoords[0];
          lng = huntedCoords[1];

          const offsetAngle = (idCadeia * 137.5 * Math.PI) / 180;
          const offsetRadius = 0.008 + ((idCadeia % 5) * 0.003);
          lat += Math.cos(offsetAngle) * offsetRadius;
          lng += Math.sin(offsetAngle) * offsetRadius;
        }

        const rawUrl = row.fonte || fontesMap.get(idCadeia) || row.url_referencia || '';

        mapCadeias.set(idCadeia, {
          id: idCadeia,
          id_cadeia: idCadeia,
          nome: row.entidade || `Arranjo #${idCadeia}`,
          entidade: row.entidade || `Arranjo #${idCadeia}`,
          segmento: row.segmento || row.nome_cadeia || 'Outros',
          tipo: tipoNome,
          shortTipo: configTipo.label,
          id_sede: lookupSede ? lookupSede.id_municipio : (row.id_sede || 1),
          municipio: nomeSedeFinal,
          municipio_sede: nomeSedeFinal,
          id_territorio: idTerrSede,
          territorio: nomeTerrSede,
          territorio_identidade: nomeTerrSede,
          lat,
          lng,
          corHex: configTipo.corHex,
          icone: configTipo.icone,
          fonte: rawUrl,
          semiarido: isSedeSemi,
          municipios_cobertos: []
        });
      }

      if (row.id_municipio || row.nome_municipio) {
        const cadeiaObj = mapCadeias.get(idCadeia);
        const lookupMun = (row.id_municipio && MUN_LOOKUP.byId[row.id_municipio]) || 
                          (row.nome_municipio && MUN_LOOKUP.byName[normalizeName(row.nome_municipio)]);

        const mId = row.id_municipio || (lookupMun ? lookupMun.id_municipio : null);
        const mNome = row.nome_municipio || (lookupMun ? lookupMun.nome_municipio : '');
        const mTerrId = row.id_territorio || (lookupMun ? lookupMun.id_territorio : idTerrSede);
        const mTerrNome = row.nome_territorio || (lookupMun ? lookupMun.nome_territorio : nomeTerrSede);
        const mSemi = lookupMun ? checkSemiaridoValue(lookupMun.semiarido) : false;

        if (mId && !cadeiaObj.municipios_cobertos.some(m => m.id_municipio === mId)) {
          cadeiaObj.municipios_cobertos.push({
            id_municipio: mId,
            nome_municipio: mNome,
            id_territorio: mTerrId,
            nome_territorio: mTerrNome,
            semiarido: mSemi
          });
          // Se qualquer município de abrangência for do semiárido, a cadeia atende ao semiárido
          if (mSemi) cadeiaObj.semiarido = true;
        }
      }
    });

    return Array.from(mapCadeias.values());
  }, [listaCadeias, distribuicaoCadeias]);

  // 2. Filtragem por Território Selecionado
  const filteredCadeias = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    if (!selectedTerritory) return enrichedCadeias;

    const tid = Number(selectedTerritory.id_territorio);
    const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

    return enrichedCadeias.filter(c => {
      const matchSedeId = Number(c.id_territorio) === tid;
      const matchSedeNome = normalizeName(c.territorio_identidade) === tNorm;
      const matchAbrangencia = c.municipios_cobertos?.some(m => 
        Number(m.id_territorio) === tid || normalizeName(m.nome_territorio) === tNorm
      );
      return matchSedeId || matchSedeNome || matchAbrangencia;
    });
  }, [enrichedCadeias, selectedTerritory]);

  // 3. Indicadores Executivos (KPIs)
  const statsKpis = useMemo(() => {
    const totalArranjos = filteredCadeias.length;
    const arranjosSemiCount = filteredCadeias.filter(c => c.semiarido).length;

    const munBeneficiadosSet = new Set();
    const munSemiBeneficiadosSet = new Set();
    const terrSet = new Set();
    const segmentoCounts = {};

    filteredCadeias.forEach(c => {
      if (c.municipios_cobertos && c.municipios_cobertos.length > 0) {
        c.municipios_cobertos.forEach(m => {
          if (m.nome_municipio) {
            const mNorm = normalizeName(m.nome_municipio);
            munBeneficiadosSet.add(mNorm);
            if (m.semiarido) munSemiBeneficiadosSet.add(mNorm);
          }
          if (m.nome_territorio) terrSet.add(normalizeName(m.nome_territorio));
        });
      } else if (c.municipio_sede) {
        const mNorm = normalizeName(c.municipio_sede);
        munBeneficiadosSet.add(mNorm);
        if (c.semiarido) munSemiBeneficiadosSet.add(mNorm);
      }

      if (c.territorio_identidade) terrSet.add(normalizeName(c.territorio_identidade));

      const seg = c.segmento || 'Outros';
      segmentoCounts[seg] = (segmentoCounts[seg] || 0) + 1;
    });

    let maiorSegmento = null;
    const entries = Object.entries(segmentoCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      const [name, count] = entries[0];
      maiorSegmento = {
        name,
        percent: totalArranjos > 0 ? ((count / totalArranjos) * 100).toFixed(1) : '0.0'
      };
    }

    return {
      totalArranjos,
      arranjosSemiCount,
      municipiosBeneficiados: munBeneficiadosSet.size,
      municipiosSemiBeneficiados: munSemiBeneficiadosSet.size,
      territoriosAtendidos: terrSet.size,
      maiorSegmento
    };
  }, [filteredCadeias]);

  // 4. Top 10 Arranjos / Cadeias Produtivas (Duas Bandas: 2 colunas x 5 linhas)
  const topCadeiasData = useMemo(() => {
    if (!filteredCadeias || filteredCadeias.length === 0) return [];

    return [...filteredCadeias]
      .sort((a, b) => {
        const abA = a.municipios_cobertos?.length || 1;
        const abB = b.municipios_cobertos?.length || 1;
        return abB - abA;
      })
      .slice(0, 10)
      .map(c => {
        const munList = c.municipios_cobertos || [];
        const semiMunicipios = munList.filter(m => m.semiarido).length || (c.semiarido ? 1 : 0);
        const totalMunicipios = munList.length > 0 ? munList.length : 1;

        return {
          id: c.id_cadeia,
          nome: c.entidade || c.nome,
          segmento: c.segmento,
          tipo: c.shortTipo || c.tipo,
          corHex: c.corHex || '#2563EB',
          totalMunicipios,
          semiMunicipios
        };
      });
  }, [filteredCadeias]);

  // 5. Concentração por Território (StackedBarChart com Semiárido vs Outras Regiões)
  const concentracaoTerritorialStackedData = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    const groups = {};

    enrichedCadeias.forEach(c => {
      const terr = c.territorio_identidade || c.territorio || 'Não identificado';
      if (!groups[terr]) {
        groups[terr] = { label: terr, total: 0, segments: { semi: 0, fora: 0 } };
      }
      if (c.semiarido) groups[terr].segments.semi += 1;
      else groups[terr].segments.fora += 1;
      groups[terr].total += 1;
    });

    return Object.values(groups)
      .sort((a, b) => b.total - a.total)
      .map(g => ({ ...g, totalLabel: String(g.total) }));
  }, [enrichedCadeias]);

  // 6. Distribuição das Top 6 Segmentos Econômicos (2 Colunas x 3 Linhas DESC)
  const segmentosEmpilhadosData = useMemo(() => {
    if (!filteredCadeias || filteredCadeias.length === 0) return [];
    const stats = {};
    const totalGeral = filteredCadeias.length;

    filteredCadeias.forEach(c => {
      const seg = c.segmento || 'Outros';
      if (!stats[seg]) {
        stats[seg] = { name: seg, total: 0, semi: 0, fora: 0 };
      }
      stats[seg].total += 1;
      if (c.semiarido) stats[seg].semi += 1;
      else stats[seg].fora += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => ({
        ...item,
        pctTotal: totalGeral > 0 ? ((item.total / totalGeral) * 100).toFixed(1) : '0.0',
        pctSemi: item.total > 0 ? ((item.semi / item.total) * 100).toFixed(0) : '0',
        pctFora: item.total > 0 ? ((item.fora / item.total) * 100).toFixed(0) : '0'
      }));
  }, [filteredCadeias]);

  // 7. Tipologias de Arranjo no Semiárido (APL vs IG vs IG Potencial - ProportionBarChart)
  const tiposProportionData = useMemo(() => {
    if (!filteredCadeias || filteredCadeias.length === 0) return [];
    const stats = {};

    filteredCadeias.forEach(c => {
      const tipo = c.shortTipo || c.tipo || 'APL';
      if (!stats[tipo]) {
        stats[tipo] = { label: tipo, positive: 0, negative: 0, total: 0 };
      }
      if (c.semiarido) stats[tipo].positive += 1;
      else stats[tipo].negative += 1;
      stats[tipo].total += 1;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredCadeias]);

  return (
    <main className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white select-none">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full pr-[340px] shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Cadeias Produtivas & IGs
            </h1>
            <span className="bg-[#10B981]/10 text-[#059669] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#10B981]/20 flex items-center gap-1">
              <Award size={13} className="text-[#059669]" />
              Arranjos Produtivos & Indicações Geográficas
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
              Diagnóstico territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas da Bahia
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

      {/* GRID DE KPIS UNIFICADO (h-[92px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          
          {/* KPI 1: ARRANJOS MAPEADOS */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Boxes size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Arranjos & IGs</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : statsKpis.totalArranjos}
              </span>
              <span className="text-[10px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.arranjosSemiCount} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 2: MAIOR SEGMENTO */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Sparkles size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Maior Segmento</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : (statsKpis.maiorSegmento ? `${statsKpis.maiorSegmento.percent}%` : '-')}
              </span>
              <span className="text-[10px] font-bold text-[#457B9D] truncate flex-1 min-w-0">
                {statsKpis.maiorSegmento ? statsKpis.maiorSegmento.name : 'Sem dados'}
              </span>
            </div>
          </div>

          {/* KPI 3: MUNICÍPIOS BENEFICIADOS */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <MapPin size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Municípios de Abrangência</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : `${statsKpis.municipiosBeneficiados} munic.`}
              </span>
              <span className="text-[10px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.municipiosSemiBeneficiados} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 4: TERRITÓRIOS COM ARRANJOS */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Layers size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider">Territórios com Arranjos</span>
            </div>
            <span className="text-2xl lg:text-3xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsKpis.territoriosAtendidos} de 27`)}
            </span>
          </div>

        </div>
      </div>

      {/* GRID PRINCIPAL: 4 GRÁFICOS (60%) EM 2x2 SIMÉTRICO + SIDEMAP (40%) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full overflow-hidden">
        
        {/* COLUNA ESQUERDA: GRID 2x2 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">
          
          {/* GRÁFICO 1: TOP 10 ARRANJOS EM DUAS BANDAS */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-[12.5px] font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <ListOrdered size={14} className="text-[#2563EB] shrink-0" />
                  Top 10 Arranjos & IGs
                </h3>
                <p className="text-[9.5px] text-[#457B9D]">Maior extensão municipal de abrangência</p>
              </div>
              <span className="text-[8.5px] font-bold text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#E2E8F0] shrink-0">
                Municípios / Semi
              </span>
            </div>

            {/* DUAS BANDAS (2 COLUNAS x 5 LINHAS) */}
            <div className="flex-1 grid grid-cols-2 gap-x-2.5 gap-y-1 min-h-0 overflow-hidden py-0.5 items-stretch">
              {topCadeiasData.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-[9px] min-w-0"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                    <span 
                      className="w-3.5 h-3.5 rounded flex items-center justify-center text-[7.5px] font-black text-white shrink-0 shadow-2xs" 
                      style={{ backgroundColor: item.corHex }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-extrabold text-[#1D3557] whitespace-normal break-words" title={item.nome}>
                        {item.nome}
                      </span>
                      <span className="text-[7.5px] text-[#64748B] whitespace-normal break-words leading-[9px] mt-0.5">
                        {item.segmento}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 font-extrabold">
                    <span className="text-[#1D3557] text-[8.5px] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">
                      {item.totalMunicipios}
                    </span>
                    <span className="text-[#B45309] bg-[#F59E0B]/15 px-1 py-0.5 rounded text-[8px]">
                      {item.semiMunicipios}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 2: CONCENTRAÇÃO POR TERRITÓRIO */}
          <div className="h-full min-h-0 overflow-hidden">
            <StackedBarChart
              data={concentracaoTerritorialStackedData}
              categories={SEMIARIDO_CATEGORIES}
              title={selectedTerritory ? `Arranjos em ${territoryName}` : 'Concentração por Território'}
              subtitle="Arranjos com presença e atuação no Semiárido"
              allowToggleView={!selectedTerritory}
              showTotalLabel={true}
            />
          </div>

          {/* GRÁFICO 3: DISTRIBUIÇÃO DOS SEGMENTOS (DUAS COLUNAS DESC) */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1">
              <div>
                <h3 className="text-[12.5px] font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-[#2563EB]" />
                  {selectedTerritory ? `Segmentos em ${territoryName}` : 'Distribuição Estadual por Segmento'}
                </h3>
                <p className="text-[9.5px] text-[#457B9D]">Semiárido vs Outras Regiões (Top 6 Segmentos)</p>
              </div>

              <div className="flex items-center gap-2.5 text-[8.5px] font-black">
                <span className="flex items-center gap-1 text-[#B45309]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Semiárido
                </span>
                <span className="flex items-center gap-1 text-[#2563EB]">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>Outras Regiões
                </span>
              </div>
            </div>

            {/* GRID SIMÉTRICO DE 2 COLUNAS X 3 LINHAS */}
            <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 min-h-0 overflow-hidden py-0.5">
              {segmentosEmpilhadosData.map((cat, idx) => (
                <div key={idx} className="flex flex-col justify-center gap-0.5 p-1.5 px-2 rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-start justify-between text-[9.5px] leading-tight gap-1">
                    <span className="font-extrabold text-[#1D3557] whitespace-normal break-words flex-1 min-w-0" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[9px] shrink-0">
                      <strong className="text-[#1D3557] font-black">{cat.total}</strong> ({cat.pctTotal}%)
                    </span>
                  </div>

                  {/* BARRA EMPILHADA */}
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs my-0.5">
                    {cat.semi > 0 && (
                      <div 
                        className="h-full bg-[#F59E0B] transition-all duration-500"
                        style={{ width: `${(cat.semi / cat.total) * 100}%` }}
                        title={`Semiárido: ${cat.semi}`}
                      />
                    )}
                    {cat.fora > 0 && (
                      <div 
                        className="h-full bg-[#3B82F6] transition-all duration-500"
                        style={{ width: `${(cat.fora / cat.total) * 100}%` }}
                        title={`Outras Regiões: ${cat.fora}`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-bold">
                    <span className="text-[#B45309]">
                      Semi: <strong>{cat.semi}</strong> ({cat.pctSemi}%)
                    </span>
                    <span className="text-[#2563EB]">
                      Fora: <strong>{cat.fora}</strong> ({cat.pctFora}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 4: MATRIZ DE TIPOLOGIAS (APL vs IG vs IG POTENCIAL) */}
          <div className="h-full min-h-0 overflow-hidden">
            <ProportionBarChart
              data={tiposProportionData}
              title="Tipologias de Reconhecimento"
              subtitle="Proporção de APLs e IGs presentes no Semiárido"
              positiveLabel="Semiárido"
              negativeLabel="Outras Regiões"
              positiveColor="bg-[#F59E0B]"
              negativeColor="bg-[#3B82F6]"
            />
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO CADEIAS */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-full bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
          <SideMap
            mode="cadeias"
            cadeiasData={filteredCadeias}
            processedAtivos={filteredCadeias}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
          />
        </div>

      </div>

    </main>
  );
}