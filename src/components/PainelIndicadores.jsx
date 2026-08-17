import React, { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { KpiCard } from './KpiCard';
import { FaBuilding, FaGraduationCap, FaTractor } from 'react-icons/fa'; // Ícones de exemplo

export const PainelIndicadores = ({ territorioSelecionado }) => {
  const { statsTerritorios, carregando } = useContext(DataContext);

  if (carregando) {
    return <div>Carregando indicadores...</div>;
  }

  // Se houver um território clicado no mapa, usa ele. Se não, podemos fazer um resumo geral.
  // Aqui vamos focar em exibir os dados de um território selecionado:
  if (!territorioSelecionado) {
    return <div>Selecione um território no mapa para ver os dados.</div>;
  }

  // Busca na nossa lista (que veio da View) o território exato que foi clicado
  const dadosAtuais = statsTerritorios.find(
    (t) => t.territorio === territorioSelecionado
  );

  if (!dadosAtuais) return null;

  return (
    <div className="grid-indicadores">
      <KpiCard 
        titulo="Ativos de CTI" 
        valor={dadosAtuais.ativos_cti} 
        icone={<FaBuilding />} 
        corDestaque="#3B82F6" // Azul
      />
      
      <KpiCard 
        titulo="Cursos Disponíveis" 
        valor={dadosAtuais.qtd_cursos_cti} 
        icone={<FaGraduationCap />} 
        corDestaque="#10B981" // Verde
      />
      
      <KpiCard 
        titulo="Cadeias Produtivas" 
        valor={dadosAtuais.cadeias_produtivas} 
        icone={<FaTractor />} 
        corDestaque="#F59E0B" // Laranja
      />
      
      <KpiCard 
        titulo="Média IFDM" 
        valor={dadosAtuais.media_ifdm} 
        icone={<span>📊</span>} 
        corDestaque="#8B5CF6" // Roxo
      />
    </div>
  );
};