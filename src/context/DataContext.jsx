import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // Estado para a View principal de Estatísticas (stats_ti)
  const [territoriosData, setTerritoriosData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Estado para controlar quem está clicado no Mapa e na Sidebar
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      setLoadingStats(true);
      const { data, error } = await supabase
        .from('stats_ti') // Nossa View que acabou de ser atualizada com IDs
        .select('*');

      if (error) {
        console.error("Erro ao puxar dados do Supabase:", error);
      } else {
        setTerritoriosData(data || []);
      }
      setLoadingStats(false);
    };

    carregarEstatisticas();
  }, []);

  // =========================================================================
  // 1. ESTATÍSTICAS DINÂMICAS PARA O MAPA (PtiMap.jsx)
  // O nosso mapa espera um objeto estruturado pelas chaves dos IDs
  // Exemplo: { 1: { ifdm: 0.5, capacidadeCti: 10 }, 2: { ... } }
  // =========================================================================
  const territoriesDynamicStats = useMemo(() => {
    const stats = {};
    territoriosData.forEach(t => {
      stats[t.id_territorio] = {
        matchesFilters: true, // Podemos plugar filtros globais aqui no futuro
        ifdm: t.media_ifdm ? Number(t.media_ifdm).toFixed(.3) : '-',
        capacidadeCti: t.ativos_cti || 0,
        cadeiasIgs: t.cadeias_produtivas || 0,
        pctSemiarido: t.pct_semiarido || 0,
      };
    });
    return stats;
  }, [territoriosData]);

  // =========================================================================
  // 2. KPIs GLOBAIS PARA OS CARDS DO TOPO (Dashboard)
  // Calcula a soma da Bahia inteira para exibir na Visão Geral
  // =========================================================================
  const kpisGlobais = useMemo(() => {
    if (!territoriosData.length) {
      return { ativos: 0, cursos: 0, cadeias: 0, ifdmMedio: 0, territorios: 0 };
    }

    const totais = territoriosData.reduce((acc, curr) => {
      acc.ativos += Number(curr.ativos_cti || 0);
      acc.cursos += Number(curr.qtd_cursos_cti || 0);
      acc.cadeias += Number(curr.cadeias_produtivas || 0);
      
      if (curr.media_ifdm) {
        acc.somaIfdm += Number(curr.media_ifdm);
        acc.qtdIfdm += 1; // Contador para a média
      }
      return acc;
    }, { ativos: 0, cursos: 0, cadeias: 0, somaIfdm: 0, qtdIfdm: 0 });

    return {
      ativos: totais.ativos,
      cursos: totais.cursos,
      cadeias: totais.cadeias,
      ifdmMedio: totais.qtdIfdm > 0 ? (totais.somaIfdm / totais.qtdIfdm).toFixed(3) : 0,
      territorios: territoriosData.length // Isso vai corrigir o erro de "88 Territórios"!
    };
  }, [territoriosData]);

  return (
    <DataContext.Provider value={{ 
      territoriosData, 
      territoriesDynamicStats, // Enviamos as configs prontas pro Mapa
      kpisGlobais,             // Enviamos os Totais prontos pros Cards do topo
      loadingStats,
      selectedTerritory,
      setSelectedTerritory 
    }}>
      {children}
    </DataContext.Provider>
  );
};