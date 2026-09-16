/**
 * api-lab/inep/shadow/frontend-validation/ShadowDataProvider.jsx
 * ETAPA 2.5 — Provider Isolado de Homologação do Dataset Shadow
 * 
 * Permite que componentes do frontend sejam montados e validados consumindo
 * diretamente os dados shadow do INEP (campi, cursos e instituições)
 * SEM alterar nenhuma linha de produção do DataContext original.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import campiShadowPayload from '../campi_shadow_secti.json';
import cursosShadowPayload from '../cursos_shadow_secti.json';
import instituicoesShadowPayload from '../instituicoes_shadow_secti.json';

export const ShadowDataContext = createContext(null);

export const useShadowData = () => {
  const context = useContext(ShadowDataContext);
  if (!context) {
    throw new Error('useShadowData deve ser utilizado dentro de um ShadowDataProvider');
  }
  return context;
};

export const ShadowDataProvider = ({ children, initialFiltroPresencial = true }) => {
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [filtroApenasPresencial, setFiltroApenasPresencial] = useState(initialFiltroPresencial);

  // Carrega os dados shadow puros
  const todosCampiShadow = campiShadowPayload.dados || [];
  const todosCursosShadow = cursosShadowPayload.dados || [];
  const todasIesShadow = instituicoesShadowPayload.dados || [];

  // Separação estrita de cursos presenciais x EAD
  const cursosData = useMemo(() => {
    return todosCursosShadow.filter((c) => c.ead === false);
  }, [todosCursosShadow]);

  const cursosEadData = useMemo(() => {
    return todosCursosShadow.filter((c) => c.ead === true);
  }, [todosCursosShadow]);

  // Filtragem de ativos: caso homologando estritamente presencial, oculta polos EAD
  const ativosData = useMemo(() => {
    if (filtroApenasPresencial) {
      return todosCampiShadow.filter((c) => c.status_reconciliacao !== 'somente_ead' && c.tipo_unidade !== 'polo_ead');
    }
    return todosCampiShadow;
  }, [todosCampiShadow, filtroApenasPresencial]);

  // Tipos padrão compatíveis com o frontend
  const tiposAtivos = useMemo(() => [
    { id_tipo_ativo: 6, tipo: 'Campi Universidade Pública - Federal' },
    { id_tipo_ativo: 7, tipo: 'Campi Instituto Federal' },
    { id_tipo_ativo: 8, tipo: 'Campi Universidade Pública - Estadual' },
    { id_tipo_ativo: 9, tipo: 'Campi Universidade Privada' },
  ], []);

  const tiposCursos = useMemo(() => [
    { id_tipo_curso: 1, categoria: 'Agricultura, silvicultura, pesca e veterinária' },
    { id_tipo_curso: 2, categoria: 'Ciências naturais, matemática e estatística' },
    { id_tipo_curso: 3, categoria: 'Computação e Tecnologias da Informação e Comunicação (TIC)' },
    { id_tipo_curso: 4, categoria: 'Engenharia, produção e construção' },
    { id_tipo_curso: 5, categoria: 'Saúde e bem-estar' },
  ], []);

  // Recálculo dinâmico de estatísticas territoriais com base no shadow
  const territoriesDynamicStats = useMemo(() => {
    const statsMap = new Map();

    ativosData.forEach((a) => {
      const tid = a.id_territorio;
      if (!tid) return;
      if (!statsMap.has(tid)) {
        statsMap.set(tid, {
          id_territorio: tid,
          nome_territorio: a.territorio_identidade,
          qtd_ativos_cti: 0,
          qtd_cursos_cti: 0,
        });
      }
      statsMap.get(tid).qtd_ativos_cti += 1;
    });

    cursosData.forEach((c) => {
      const tid = c.id_territorio;
      if (!tid) return;
      if (statsMap.has(tid)) {
        statsMap.get(tid).qtd_cursos_cti += 1;
      }
    });

    return Array.from(statsMap.values());
  }, [ativosData, cursosData]);

  // KPIs globais para o Hero e Dashboard
  const kpisGlobais = useMemo(() => ({
    totalAtivos: ativosData.length,
    totalCursos: cursosData.length,
    totalEad: cursosEadData.length,
    totalInstituicoes: todasIesShadow.length,
    territoriosCobertos: new Set(ativosData.map((a) => a.id_territorio)).size,
    municipiosCobertos: new Set(ativosData.map((a) => a.municipio)).size,
  }), [ativosData, cursosData, cursosEadData, todasIesShadow]);

  const value = {
    // Datasets no schema idêntico ao DataContext
    territoriosData: territoriesDynamicStats,
    ativosData,
    cursosData,
    cursosEadData,
    instituicoesData: todasIesShadow,
    tiposAtivos,
    tiposCursos,
    territoriesDynamicStats,
    kpisGlobais,
    loadingStats: false,

    // Controles de estado e filtros
    selectedTerritory,
    setSelectedTerritory,
    filtroSemiarido,
    setFiltroSemiarido,
    filtroApenasPresencial,
    setFiltroApenasPresencial,

    // Indicador de modo homologação
    isShadowHomologation: true,
  };

  return (
    <ShadowDataContext.Provider value={value}>
      {children}
    </ShadowDataContext.Provider>
  );
};
