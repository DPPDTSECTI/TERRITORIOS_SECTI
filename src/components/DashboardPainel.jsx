import React from 'react';
import Sidebar from '../components/Sidebar';

export default function DashboardPainel() {
  return (
    // Fundo escuro idêntico ao do Hero (bg-[#1c1c1c])
    <div className="relative flex w-full min-h-screen bg-[#1c1c1c] overflow-hidden font-sans">
      
      {/* 
        A GRANDE CURVA (Vector 6) - Trazida do Hero para manter 
        a mesma identidade visual no fundo do Dashboard.
        Diminuí a opacidade da borda (border-white/5) para não brigar com os gráficos.
      */}
      <div className="absolute top-[-10%] right-[-20%] w-[800px] h-[800px] lg:w-[1200px] lg:h-[1200px] border-[2px] rounded-full pointer-events-none border-white/5 z-0" />

      {/* Sidebar fixada à esquerda. Z-index alto para ficar acima do fundo */}
      <Sidebar username="Visitante" />

      {/* Área Principal onde ficarão os mapas e tabelas (Fica sobreposta ao fundo) */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 p-8 flex flex-col gap-6">
        
        {/* Cabeçalho Interno da Página */}
        <header className="flex items-center justify-between">
          <h1 className="text-white text-3xl font-light tracking-wide">
            Visão Geral dos Territórios
          </h1>
        </header>
        
        {/* Espaço reservado para o Mapa e os Cards do Supabase */}
        <div className="flex-1 w-full border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center bg-white/5 backdrop-blur-sm">
          <p className="text-white/40 font-mono tracking-widest uppercase text-sm">
            Área do Mapa e Dashboards
          </p>
        </div>

      </main>

    </div>
  );
}