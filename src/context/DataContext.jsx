import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase'; // Importe o cliente

export const DataContext = createContext({});

export const DataProvider = ({ children }) => {
  const [territorios, setTerritorios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        
        // Exemplo: Buscando todos os dados da tabela 'ativos_cti'
        const { data, error } = await supabase
          .from('ativos_cti')
          .select('*');

        if (error) throw error;

        setTerritorios(data);
      } catch (error) {
        console.error("Erro ao buscar dados do Supabase:", error.message);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  return (
    <DataContext.Provider value={{ territorios, loading }}>
      {children}
    </DataContext.Provider>
  );
};