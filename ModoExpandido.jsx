import React, { useState } from 'react';
import { Plus } from 'lucide-react';

/**
 * Componente para exibir uma lista/card individual.
 */
const ListaCard = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-6 h-full flex flex-col">
    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4">{title}</h3>
    <div className="flex-grow text-sm text-slate-600 dark:text-slate-300">{children}</div>
  </div>
);

/**
 * Botão estilizado para adicionar novas listas, que se encaixa na grade.
 */
const AdicionarListaButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center w-full h-full min-h-[200px] bg-transparent border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-300 group"
    aria-label="Adicionar nova lista"
  >
    <div className="text-center">
      <Plus size={24} className="mx-auto mb-2 stroke-2 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-semibold">Adicionar Lista</span>
    </div>
  </button>
);

/**
 * Componente principal que renderiza o "Modo Expandido" com as listas.
 */
export default function ModoExpandido({ darkMode }) {
  // Estado inicial com as listas que você mencionou
  const [listas, setListas] = useState([
    { id: 'cti', title: 'Estruturas CT&I', content: 'Informações sobre Universidades, ICTs, Centros de Pesquisa, etc.' },
    { id: 'dev', title: 'Desenvolvimento Territorial', content: 'Dados baseados no Índice FIRJAN de Desenvolvimento Municipal (IFDM).' },
  ]);

  const listasDisponiveis = [
    { id: 'cursos', title: 'Cursos Superiores em CT&I', content: 'Levantamento de cursos de nível superior em CT&I.' },
    { id: 'apl', title: 'APLs e IGs', content: 'Mapeamento em cascata de Arranjos Produtivos Locais (APL) e Indicações Geográficas (IG) com filtragem por segmento, sede e município satélite.' },
  ];

  const handleAdicionarLista = () => {
    // Lógica para adicionar uma nova lista.
    // Este exemplo pega a primeira lista disponível que ainda não foi adicionada.
    const proximaListaParaAdicionar = listasDisponiveis.find(
      disponivel => !listas.some(existente => existente.id === disponivel.id)
    );

    if (proximaListaParaAdicionar) {
      setListas([...listas, proximaListaParaAdicionar]);
    } else {
      alert("Todas as listas disponíveis já foram adicionadas.");
    }
    // NOTA: Uma implementação ideal abriria um modal para o usuário escolher qual lista adicionar.
  };

  return (
    <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Modo Expandido</h1>
        <p className="text-slate-500 dark:text-slate-400">Adicione e visualize as listas de dados de seu interesse.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Renderiza as listas que já estão no painel */}
        {listas.map(lista => (
          <div key={lista.id}>
            <ListaCard title={lista.title}>
              {lista.content}
            </ListaCard>
          </div>
        ))}

        {/* O botão para adicionar novas listas, posicionado ao lado na grade */}
        <div>
          <AdicionarListaButton onClick={handleAdicionarLista} />
        </div>
      </div>
    </div>
  );
}