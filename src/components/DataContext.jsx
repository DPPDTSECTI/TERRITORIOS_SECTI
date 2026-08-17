import { createContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // Criamos um estado para guardar as estatísticas dos territórios
  const [statsTerritorios, setStatsTerritorios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      const { data, error } = await supabase
        .from('stats_ti') // Nossa View otimizada
        .select('*');

      if (!error) {
        setStatsTerritorios(data);
      }
      setCarregando(false);
    };

    carregarDados();
  }, []); // O array vazio garante que rode apenas uma vez ao abrir o painel

  return (
    <DataContext.Provider value={{ statsTerritorios, carregando }}>
      {children}
    </DataContext.Provider>
  );
};