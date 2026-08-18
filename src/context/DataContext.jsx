import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

export const DataContext = createContext();

// =========================================================================
// CONFIGURAÇÕES DO CACHE
// =========================================================================
const CACHE_KEY = '@SectiPainel_Data_V4'; // MUDAMOS PARA V4!
const CACHE_TIME_MS = 15 * 60 * 1000;

export const DataProvider = ({ children }) => {
  const [territoriosData, setTerritoriosData] = useState([]);
  const [ativosData, setAtivosData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      const cachedDataStr = localStorage.getItem(CACHE_KEY);
      let isCacheValid = false;

      if (cachedDataStr) {
        try {
          const { stats, ativos, timestamp } = JSON.parse(cachedDataStr);
          const idadeDoCache = Date.now() - timestamp;

          if (stats && stats.length > 0) {
            setTerritoriosData(stats);
            setAtivosData(ativos || []);
            setLoadingStats(false);
          }

          if (idadeDoCache < CACHE_TIME_MS) {
            console.log("⚡ Carregado do Cache (V4)!");
            isCacheValid = true;
            return; 
          }
        } catch (e) {
          console.warn("Erro ao ler o cache, buscando do zero...", e);
        }
      }

      if (!isCacheValid && territoriosData.length === 0) {
        setLoadingStats(true);
      }

      // 2. BUSCA NO SUPABASE EM PARALELO
      const [statsRes, ativosRes] = await Promise.all([
        supabase.from('stats_ti').select('*'),
        supabase.from('lista_ativos_cti').select('*') // A View que acabamos de arrumar
      ]);

      if (statsRes.error || ativosRes.error) {
        console.error("Erro ao puxar do Supabase", statsRes.error, ativosRes.error);
      } else {
        const dadosTratados = (statsRes.data || []).map(t => {
          let ifdmFormatado = null;
          if (t.media_ifdm) {
            const match = String(t.media_ifdm).match(/^-?\d+(?:\.\d{0,3})?/);
            ifdmFormatado = match ? Number(match[0]).toFixed(3) : null;
          }
          return { ...t, media_ifdm: ifdmFormatado };
        });

        const ativosTratados = ativosRes.data || [];
        console.log("DADOS DOS ATIVOS DO SUPABASE:", ativosTratados); // Para debug!

        // 3. SALVA OS DADOS NOVOS NO CACHE
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          stats: dadosTratados,
          ativos: ativosTratados,
          timestamp: Date.now()
        }));

        setTerritoriosData(dadosTratados);
        setAtivosData(ativosTratados);
      }
      setLoadingStats(false);
    };

    carregarEstatisticas();
  }, []);

  const territoriesDynamicStats = useMemo(() => {
    const stats = {};
    territoriosData.forEach(t => {
      stats[t.id_territorio] = {
        matchesFilters: true, 
        ifdm: t.media_ifdm ? Number(t.media_ifdm).toFixed(3) : '-',
        capacidadeCti: t.ativos_cti || 0,
        cadeiasIgs: t.cadeias_produtivas || 0,
        pctSemiarido: t.pct_semiarido || 0,
      };
    });
    return stats;
  }, [territoriosData]);

  const kpisGlobais = useMemo(() => {
    if (!territoriosData.length) return { ativos: 0, cursos: 0, cadeias: 0, ifdmMedio: 0, territorios: 0 };
    const totais = territoriosData.reduce((acc, curr) => {
      acc.ativos += Number(curr.ativos_cti || 0);
      acc.cursos += Number(curr.qtd_cursos_cti || 0);
      acc.cadeias += Number(curr.cadeias_produtivas || 0);
      if (curr.media_ifdm) {
        acc.somaIfdm += Number(curr.media_ifdm);
        acc.qtdIfdm += 1; 
      }
      return acc;
    }, { ativos: 0, cursos: 0, cadeias: 0, somaIfdm: 0, qtdIfdm: 0 });

    return {
      ativos: totais.ativos,
      cursos: totais.cursos,
      cadeias: totais.cadeias,
      ifdmMedio: totais.qtdIfdm > 0 ? (totais.somaIfdm / totais.qtdIfdm).toFixed(3) : 0,
      territorios: territoriosData.length 
    };
  }, [territoriosData]);

  return (
    <DataContext.Provider value={{ 
      territoriosData, 
      ativosData, 
      territoriesDynamicStats,
      kpisGlobais,             
      loadingStats,
      selectedTerritory,
      setSelectedTerritory 
    }}>
      {children}
    </DataContext.Provider>
  );
};