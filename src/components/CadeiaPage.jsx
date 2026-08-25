import React, { useContext, useState, useMemo, useEffect } from 'react';
import { 
  GitPullRequest, 
  Award, 
  MapPin, 
  Sparkles, 
  Wheat,
  Filter,
  TrendingUp,
  ExternalLink,
  Layers,
  Compass,
  CheckCircle2,
  Building,
  Users,
  ArrowLeft
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { municipiosDB } from '../data/municipiosDB';
import SideMap from './maps/SideMap';
import CardLista from './graph/CardLista';

const SEGMENT_PALETTE = [
  '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', 
  '#A855F7', '#E11D48', '#0EA5E9', '#D97706'
];

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lookup absoluto de municípios
const MUN_LOOKUP = (() => {
  const byId = {};
  const byName = {};
  municipiosDB.forEach((row) => {
    byId[row.id_municipio] = row;
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byId, byName };
})();

// Estilização dinâmica por tipo
const getTipoCadeiaConfig = (nomeTipo) => {
  const str = String(nomeTipo || '').toLowerCase();
  if (str.includes('potencial')) {
    return {
      corHex: '#F59E0B',
      bgBadge: 'bg-[#F59E0B]/15 text-[#D97706]',
      icone: Compass,
      label: 'IG Potencial',
      iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
    };
  }
  if (str.includes('ig') || str.includes('indica')) {
    return {
      corHex: '#10B981',
      bgBadge: 'bg-[#10B981]/15 text-[#059669]',
      icone: Award,
      label: 'IG Registrada',
      iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`
    };
  }
  return {
    corHex: '#2563EB',
    bgBadge: 'bg-[#2563EB]/15 text-[#2563EB]',
    icone: Wheat,
    label: 'APL',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 12 12"/><path d="M7 17a5 5 0 0 1 5-5"/><path d="M12 12a5 5 0 0 1 5-5"/><path d="M17 7a5 5 0 0 1 5-5"/></svg>`
  };
};

export default function CadeiaPage() {
  const { 
    listaCadeias = [], 
    distribuicaoCadeias = [], 
    territoriosData = [], 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [selectedSegmento, setSelectedSegmento] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('todos');
  
  // Controle Escopo e Abas
  const [activeTab, setActiveTab] = useState('catalogo');
  const [selectedCadeia, setSelectedCadeia] = useState(null);

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // Troca de abas inteligente
  useEffect(() => {
    if (selectedCadeia) {
      setActiveTab('abrangentes');
    } else if (activeTab === 'abrangentes') {
      setActiveTab('catalogo');
    }
  }, [selectedCadeia]);

  // =========================================================================
  // 1. CRUZAMENTO E ENRIQUECIMENTO DOS DADOS RELACIONAIS (CORREÇÃO DE TERRITÓRIO)
  // =========================================================================
  const enrichedCadeias = useMemo(() => {
    const fontesMap = new Map();
    (listaCadeias || []).forEach(lc => {
      if (lc.id_cadeia && lc.fonte) fontesMap.set(lc.id_cadeia, lc.fonte);
    });

    const sourceData = (distribuicaoCadeias && distribuicaoCadeias.length > 0) ? distribuicaoCadeias : listaCadeias;
    if (!sourceData || sourceData.length === 0) return [];

    const mapCadeias = new Map();

    sourceData.forEach((row, idx) => {
      const idCadeia = Number(row.id_cadeia || idx + 1);
      const tipoNome = row.nome_tipo || row.tipo || 'APL';
      const configTipo = getTipoCadeiaConfig(tipoNome);

      // --- RESOLUÇÃO ESTRITA DA SEDE ---
      const munSedeNome = row.sede || row.municipio_sede || '';
      const lookupSede = (row.id_sede && MUN_LOOKUP.byId[row.id_sede]) || 
                         (munSedeNome && MUN_LOOKUP.byName[normalizeName(munSedeNome)]);

      const nomeSedeFinal = lookupSede ? lookupSede.nome_municipio : (munSedeNome || 'Bahia');
      // O Território da SEDE obrigatoriamente vem do lookup (jamais da view que associa à cobertura)
      const idTerrSede = lookupSede ? lookupSede.id_territorio : null;
      const nomeTerrSede = lookupSede ? lookupSede.nome_territorio : 'Não identificado';

      if (!mapCadeias.has(idCadeia)) {
        const coords = MUNICIPIOS_COORDS[nomeSedeFinal] || MUNICIPIOS_COORDS[nomeSedeFinal.toLowerCase()] || [-12.9714, -38.5014];
        
        const rawUrl = row.fonte || fontesMap.get(idCadeia) || row.url_referencia || '';
        const urlFinal = rawUrl !== '' ? rawUrl : (tipoNome.toLowerCase().includes('ig') ? 'https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas' : 'http://observatorioapl.mdic.gov.br/');

        mapCadeias.set(idCadeia, {
          id: idCadeia,
          id_cadeia: idCadeia,
          nome: row.entidade || `Arranjo #${idCadeia}`,
          entidade: row.entidade || `Arranjo #${idCadeia}`,
          segmento: row.segmento || row.nome_cadeia || 'Outros',
          tipo: tipoNome,
          shortTipo: configTipo.label,
          id_sede: lookupSede ? lookupSede.id_municipio : row.id_sede,
          municipio: nomeSedeFinal,
          municipio_sede: nomeSedeFinal,
          id_territorio: idTerrSede, // <-- Território blindado à sede
          territorio: nomeTerrSede,
          territorio_identidade: nomeTerrSede,
          lat: coords[0],
          lng: coords[1],
          corHex: configTipo.corHex,
          bgBadge: configTipo.bgBadge,
          icone: configTipo.icone,
          iconSvg: configTipo.iconSvg,
          fonte: urlFinal,
          urlReferencia: urlFinal,
          municipios_cobertos: []
        });
      }

      // --- RESOLUÇÃO DOS MUNICÍPIOS ABRANGIDOS ---
      if (row.id_municipio || row.nome_municipio) {
        const cadeiaObj = mapCadeias.get(idCadeia);
        const lookupMun = (row.id_municipio && MUN_LOOKUP.byId[row.id_municipio]) || 
                          (row.nome_municipio && MUN_LOOKUP.byName[normalizeName(row.nome_municipio)]);

        const mId = row.id_municipio || (lookupMun ? lookupMun.id_municipio : null);
        const mNome = row.nome_municipio || (lookupMun ? lookupMun.nome_municipio : '');
        // Aqui usamos o id_territorio que veio da view (pertencente ao município coberto)
        const mTerrId = row.id_territorio || (lookupMun ? lookupMun.id_territorio : null);
        const mTerrNome = row.nome_territorio || (lookupMun ? lookupMun.nome_territorio : '');

        if (mId && !cadeiaObj.municipios_cobertos.some(m => m.id_municipio === mId)) {
          cadeiaObj.municipios_cobertos.push({
            id_municipio: mId,
            nome_municipio: mNome,
            id_territorio: mTerrId,
            nome_territorio: mTerrNome
          });
        }
      }
    });

    return Array.from(mapCadeias.values());
  }, [listaCadeias, distribuicaoCadeias]);

  const availableTipos = useMemo(() => {
    const tipos = new Set();
    enrichedCadeias.forEach(c => { if (c.tipo) tipos.add(c.tipo); });
    return Array.from(tipos);
  }, [enrichedCadeias]);

  // Filtro Territorial: Exibe no catálogo tudo que ACTUA na região
  const territoryCadeias = useMemo(() => {
    if (!selectedTerritory) return enrichedCadeias;
    const targetId = Number(selectedTerritory.id_territorio);
    const targetNome = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

    return enrichedCadeias.filter(c => {
      const matchSede = Number(c.id_territorio) === targetId || normalizeName(c.territorio_identidade) === targetNome;
      const matchCobertura = c.municipios_cobertos.some(m => 
        Number(m.id_territorio) === targetId || normalizeName(m.nome_territorio) === targetNome
      );
      return matchSede || matchCobertura;
    });
  }, [enrichedCadeias, selectedTerritory]);

  const filteredCadeias = useMemo(() => {
    let list = territoryCadeias;
    if (selectedTipo !== 'todos') list = list.filter(c => c.tipo === selectedTipo);
    if (selectedSegmento) list = list.filter(c => c.segmento === selectedSegmento);
    return list;
  }, [territoryCadeias, selectedTipo, selectedSegmento]);

  const segmentStats = useMemo(() => {
    if (!territoryCadeias || territoryCadeias.length === 0) return [];
    const counts = {};
    const total = territoryCadeias.length;

    territoryCadeias.forEach(c => {
      const seg = c.segmento || 'Outros Segmentos';
      counts[seg] = (counts[seg] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count], idx) => {
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        const color = SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length];
        return { name, count, percent, color };
      })
      .sort((a, b) => b.count - a.count);
  }, [territoryCadeias]);

  const totalMunicipiosAbrangentes = useMemo(() => {
    const munSet = new Set();
    enrichedCadeias.forEach(c => {
      if (c.municipios_cobertos && c.municipios_cobertos.length > 0) {
        c.municipios_cobertos.forEach(m => {
          if (m.nome_municipio) munSet.add(normalizeName(m.nome_municipio));
        });
      } else if (c.municipio_sede) {
        munSet.add(normalizeName(c.municipio_sede));
      }
    });
    return munSet.size;
  }, [enrichedCadeias]);

  // Ranking Sede Territórios: Exclusivo das SEDES Físicas
  const territoryRanking = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    const counts = {};

    enrichedCadeias.forEach(c => {
      const tid = Number(c.id_territorio) || 0;
      const tName = c.territorio_identidade || 'Não identificado';

      if (tid > 0) {
        if (!counts[tid]) counts[tid] = { id: tid, name: tName, count: 0 };
        counts[tid].count += 1;
      }
    });

    const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map((t, idx) => ({
        ...t,
        rank: idx + 1,
        percentBar: Math.min(100, (t.count / maxCount) * 100),
        heatColor: t.count >= 8 ? '#1D3557' : t.count >= 4 ? '#2563EB' : '#60A5FA'
      }));
  }, [enrichedCadeias]);

  // Ranking Sede Municípios: Conta APENAS sedes geograficamente presentes
  const municipalityRanking = useMemo(() => {
    if (!territoryCadeias || territoryCadeias.length === 0) return [];
    const counts = {};
    const targetId = selectedTerritory ? Number(selectedTerritory.id_territorio) : null;

    territoryCadeias.forEach(c => {
      // Se selecionado, entra no ranking APENAS se a sede for daqui! (Acaba com o problema das 9 sedes pra 7 cadeias)
      if (!targetId || Number(c.id_territorio) === targetId) {
        const munSede = c.municipio_sede || 'Polo Regional';
        counts[munSede] = (counts[munSede] || 0) + 1;
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        rank: idx + 1,
        percentBar: Math.min(100, (count / maxCount) * 100),
        heatColor: count >= 5 ? '#1D3557' : count >= 2 ? '#2563EB' : '#60A5FA'
      }));
  }, [selectedTerritory, territoryCadeias]);

  const topSegment = segmentStats[0];

  const kpis = [
    { label: 'Arranjos & IGs Mapeados', value: loadingStats ? '...' : enrichedCadeias.length, icon: GitPullRequest },
    { label: 'Municípios Beneficiados', value: loadingStats ? '...' : totalMunicipiosAbrangentes, icon: CheckCircle2 },
    { label: 'Territórios com Arranjos', value: loadingStats ? '...' : `${territoryRanking.length} de ${territoriosData.length || 27}`, icon: MapPin },
    { label: 'Tipologias Identificadas', value: loadingStats ? '...' : `${availableTipos.length} Categorias`, icon: Layers },
    { label: topSegment ? `Maior Segmento: ${topSegment.name}` : 'Maior Segmento', value: loadingStats ? '...' : (topSegment ? `${topSegment.percent}%` : '-'), icon: Sparkles }
  ];

  // =========================================================================
  // ABAS DINÂMICAS PARA O CARDLISTA (ESCOPO CONDICIONAL)
  // =========================================================================
  const dynamicTabs = useMemo(() => {
    const tabsArray = [];

    if (selectedCadeia) {
      const outrosMunicipios = (selectedCadeia.municipios_cobertos || []).filter(
        m => normalizeName(m.nome_municipio) !== normalizeName(selectedCadeia.municipio_sede)
      );

      // ABA FOCADA: MUNICÍPIOS ABRANGENTES
      tabsArray.push({
        id: 'abrangentes',
        label: 'Municípios Abrangentes',
        icon: MapPin,
        count: 1 + outrosMunicipios.length,
        content: (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-3 shrink-0 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-4">
                <h3 className="text-[13px] font-extrabold text-[#1D3557] truncate" title={selectedCadeia.entidade}>
                  Escopo de Atuação · {selectedCadeia.entidade}
                </h3>
                <p className="text-[10.5px] text-[#457B9D] font-medium">Sede do arranjo e municípios parceiros</p>
              </div>
              <button
                onClick={() => { setSelectedCadeia(null); setFocusedAsset(null); }}
                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shrink-0"
              >
                <ArrowLeft size={12} />
                Voltar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
              {/* Sede */}
              <div className="rounded-2xl p-3 border border-[#2563EB]/40 bg-[#F8FAFC] shadow-2xs flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB]" />
                <div className="flex items-center gap-3 min-w-0 pl-1">
                  <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Building size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-[13px] font-extrabold text-[#1D3557] truncate">{selectedCadeia.municipio_sede}</h4>
                    <span className="text-[10.5px] text-[#457B9D]">{selectedCadeia.territorio_identidade}</span>
                  </div>
                </div>
                <span className="text-[9.5px] font-black bg-[#2563EB] text-white px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0">
                  Sede Oficial
                </span>
              </div>

              {/* Demais Municípios Cobertos */}
              {outrosMunicipios.length > 0 ? (
                outrosMunicipios.map((m, idx) => (
                  <div key={idx} className="rounded-2xl p-3 border border-transparent bg-[#F1F5F9] hover:bg-white hover:border-[#D6EAF8] shadow-2xs transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] flex items-center justify-center shrink-0">
                        <MapPin size={15} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-[12px] font-bold text-[#1D3557] truncate">{m.nome_municipio}</h4>
                        <span className="text-[10px] text-[#457B9D]">{m.nome_territorio || 'Território não identificado'}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-[#E2E8F0] text-[#64748B] px-2 py-0.5 rounded-md uppercase shrink-0">
                      Abrangido
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-[#94A3B8] border border-dashed border-[#E2E8F0] rounded-2xl bg-white mt-1">
                  <MapPin size={24} className="mb-2 opacity-30 text-[#457B9D]" />
                  <p className="text-[11px] font-semibold text-[#1D3557]">Arranjo Monomunicipal</p>
                  <p className="text-[9.5px] mt-0.5 text-[#64748B]">Atua exclusivamente na sede oficial.</p>
                </div>
              )}
            </div>
          </div>
        )
      });

      // ABA 2 SECUNDÁRIA: Catálogo (para voltar ao escopo facilmente)
      tabsArray.push({
        id: 'catalogo',
        label: 'Catálogo',
        icon: GitPullRequest,
        count: filteredCadeias.length,
        content: (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                {selectedTerritory ? `Arranjos em ${territoryName}` : 'Catálogo Completo'}
              </h3>
              <button
                onClick={() => { setSelectedCadeia(null); setFocusedAsset(null); }}
                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shrink-0"
              >
                Limpar Seleção
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 opacity-60 hover:opacity-100 transition-opacity">
              {filteredCadeias.map((c, idx) => {
                const IconComp = c.icone;
                const isThisSelected = selectedCadeia.id_cadeia === c.id_cadeia;

                return (
                  <div
                    key={c.id_cadeia || idx}
                    onClick={() => {
                      setSelectedCadeia(c);
                      if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
                    }}
                    className={`rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs transition-all duration-200 group cursor-pointer border ${
                      isThisSelected ? 'bg-white border-[#2563EB] ring-1 ring-[#2563EB]/20' : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${c.corHex}18`, color: c.corHex }}>
                        <IconComp size={16} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <h4 className="text-[12px] font-extrabold text-[#1D3557] truncate">{c.entidade}</h4>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                          <span className="font-bold text-[#1D3557]">{c.segmento}</span>
                          <span>•</span>
                          <span>{c.municipio_sede}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      });

    } else {
      // =======================================================================
      // MODO PADRÃO: 3 ABAS COMPLETAS
      // =======================================================================
      tabsArray.push({
        id: 'catalogo',
        label: 'Catálogo',
        icon: GitPullRequest,
        count: filteredCadeias.length,
        content: (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                  {selectedTerritory ? `Arranjos em ${territoryName}` : 'Arranjos Produtivos e IGs no Estado'}
                </h3>
                <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {filteredCadeias.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTipo('todos')}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    selectedTipo === 'todos' ? 'bg-[#1D3557] text-white' : 'bg-[#F1F5F9] text-[#457B9D] hover:bg-[#E2E8F0]'
                  }`}
                >
                  Todos
                </button>

                {availableTipos.map((tipo) => {
                  const conf = getTipoCadeiaConfig(tipo);
                  const isSelected = selectedTipo === tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setSelectedTipo(tipo)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                        isSelected ? 'text-white' : `${conf.bgBadge} hover:opacity-80`
                      }`}
                      style={{ backgroundColor: isSelected ? conf.corHex : undefined }}
                    >
                      {tipo}
                    </button>
                  );
                })}

                {selectedTerritory && (
                  <button
                    type="button"
                    onClick={() => setSelectedTerritory(null)}
                    className="text-[10px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 hover:bg-[#D6EAF8] px-2.5 py-1 rounded-full flex items-center gap-1 ml-1 cursor-pointer transition-colors"
                  >
                    <MapPin size={11} className="text-[#2563EB]" />
                    <span>{territoryName}</span>
                    <span className="text-red-500 font-black ml-0.5">×</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
              {filteredCadeias.length > 0 ? (
                filteredCadeias.map((c, idx) => {
                  const IconComp = c.icone;
                  const totalAbrangencia = (c.municipios_cobertos && c.municipios_cobertos.length > 0) ? c.municipios_cobertos.length : 1;

                  return (
                    <div
                      key={c.id_cadeia || idx}
                      onClick={() => {
                        setSelectedCadeia(c);
                        if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
                      }}
                      className="bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border border-transparent rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: `${c.corHex}18`, color: c.corHex }}
                        >
                          <IconComp size={16} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h4 className="text-[12px] font-extrabold text-[#1D3557] group-hover:text-[#2563EB] transition-colors leading-tight truncate">
                            {c.entidade}
                          </h4>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                            <span className="font-bold text-[#1D3557] bg-[#E2E8F0]/60 px-1.5 py-0.2 rounded-md">{c.segmento}</span>
                            <span>•</span>
                            <span className="font-semibold text-[#1D3557]">Sede: {c.municipio_sede}</span>
                            <span>•</span>
                            <span className="text-[#64748B]">{c.territorio_identidade}</span>
                          </div>

                          <div className="mt-1.5 text-[10px] text-[#457B9D]/90 font-medium">
                            {totalAbrangencia > 1 ? `Atua em ${totalAbrangencia} municípios` : 'Arranjo monomunicipal'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span 
                          className="text-[9px] font-extrabold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${c.corHex}18`, color: c.corHex }}
                        >
                          {c.tipo}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                  <GitPullRequest size={32} className="mb-2 opacity-40 text-[#457B9D]" />
                  <p className="text-[12px] font-bold text-[#1D3557]">Nenhum arranjo produtivo encontrado neste território</p>
                </div>
              )}
            </div>
          </div>
        )
      });

      tabsArray.push({
        id: 'segmentos',
        label: 'Segmentos',
        icon: Filter,
        count: segmentStats.length,
        content: (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-3 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                  {selectedTerritory ? `Segmentos em ${territoryName}` : 'Segmentos Econômicos da Bahia'}
                </h3>
                <p className="text-[10.5px] text-[#457B9D] font-medium">Distribuição por vocação produtiva</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
              {segmentStats.map((seg) => {
                const isSelected = selectedSegmento === seg.name;
                return (
                  <div
                    key={seg.name}
                    onClick={() => setSelectedSegmento(isSelected ? null : seg.name)}
                    className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                      isSelected ? 'bg-white border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20' : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: seg.color }} />
                        <span className="text-[12px] font-extrabold text-[#1D3557] truncate">{seg.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-[#1D3557]">{seg.count} arranjos</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${seg.color}15`, color: seg.color }}>
                          {seg.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${seg.percent}%`, backgroundColor: seg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      });

      tabsArray.push({
        id: 'ranking',
        label: selectedTerritory ? 'Ranking Sede Municípios' : 'Ranking Sede Territórios',
        icon: TrendingUp,
        count: selectedTerritory ? municipalityRanking.length : territoryRanking.length,
        content: (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-3 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                  {selectedTerritory ? `Ranking Sede Municípios · ${territoryName}` : 'Ranking Sede Territórios'}
                </h3>
                <p className="text-[10.5px] text-[#457B9D] font-medium">Densidade de arranjos produtivos por sede oficial</p>
              </div>
              <span className="text-[10px] font-black text-[#457B9D] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                {selectedTerritory ? `${municipalityRanking.length} sedes` : `${territoryRanking.length} territórios`}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
              {selectedTerritory ? (
                municipalityRanking.map((m) => (
                  <div
                    key={m.name}
                    onClick={() => {
                      const munKey = String(m.name || '').trim();
                      const coords = MUNICIPIOS_COORDS[munKey] || MUNICIPIOS_COORDS[munKey.toLowerCase()];
                      if (coords) setFocusedAsset(coords);
                    }}
                    className="rounded-2xl p-2.5 border bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        m.rank <= 3 ? 'bg-[#1D3557] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}>
                        {m.rank}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#1D3557] truncate">{m.name}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs" style={{ backgroundColor: m.heatColor }}>
                      {m.count} {m.count === 1 ? 'cadeia' : 'cadeias'}
                    </span>
                  </div>
                ))
              ) : (
                territoryRanking.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
                      setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                    }}
                    className="rounded-2xl p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        t.rank <= 3 ? 'bg-[#1D3557] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}>
                        {t.rank}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#1D3557] truncate">{t.name}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs" style={{ backgroundColor: t.heatColor }}>
                      {t.count} {t.count === 1 ? 'cadeia' : 'cadeias'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      });
    }

    return tabsArray;
  }, [selectedCadeia, filteredCadeias, segmentStats, territoryRanking, municipalityRanking, selectedTerritory, territoryName, selectedTipo, selectedSegmento, availableTipos, territoriosData]);

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full pr-[320px] shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#1D3557] tracking-tight">
              Módulo de Cadeias Produtivas & IGs
            </h1>
            <span className="bg-[#10B981]/10 text-[#059669] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#10B981]/20 flex items-center gap-1">
              <Award size={12} className="text-[#059669]" />
              Arranjos & Indicações Geográficas
            </span>
          </div>
          <p className="text-sm text-[#457B9D] mt-0.5 font-medium">
            Mapeamento territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas do Estado da Bahia
          </p>
        </div>
      </div>

      {/* GRID DE KPIS (5 COLUNAS) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-5 gap-5 items-stretch w-full">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="h-[88px] bg-white rounded-[22px] flex flex-col items-center justify-center relative border border-transparent hover:border-[#D6EAF8]/60 shadow-[0_4px_20px_rgba(29,53,87,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(29,53,87,0.08)] transition-all duration-300 group overflow-hidden text-center px-3 py-2 cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8] text-[#457B9D] flex items-center justify-center mb-1 transition-transform duration-300 group-hover:scale-110">
                <kpi.icon size={15} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-[#1D3557] tracking-tight leading-none mb-1 whitespace-nowrap">
                {kpi.value}
              </span>
              <span className="text-[#457B9D] text-[8.5px] uppercase font-extrabold tracking-widest truncate max-w-full">
                {kpi.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GRID PRINCIPAL: MAPA + CARDLISTA */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">
        
        {/* LADO ESQUERDO: MAPA DE CADEIAS */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col group min-h-[460px]">
          <SideMap
            mode="cadeias"
            cadeiasData={enrichedCadeias}
            focusedAsset={focusedAsset}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            selectedSegmento={selectedSegmento}
            onSelectSegmento={setSelectedSegmento}
            onAssetClick={(c) => {
              setSelectedCadeia(c);
              if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
            }}
          />
        </div>

        {/* LADO DIREITO: CARDLISTA DINÂMICO */}
        <div className="flex-1 min-h-0">
          <CardLista
            tabs={dynamicTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showSearch={true}
            searchPlaceholder="Buscar cadeia, segmento ou cidade..."
          />
        </div>

      </div>

    </main>
  );
}