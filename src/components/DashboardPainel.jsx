import React from 'react';

export default function DashboardPainel() {
  return (
    // Fundo da área direita
    <main className="flex-1 h-screen overflow-y-hidden overflow-x-hidden relative p-8 flex flex-col gap-6 bg-[#1c1c1c] font-sans w-full">
      
      {/* A GRANDE CURVA (Vector 6) */}
      <div className="absolute top-[-10%] right-[-20%] w-[800px] h-[800px] lg:w-[1200px] lg:h-[1200px] border-[2px] rounded-full pointer-events-none border-white/5 z-0" />

      {/* Cabeçalho Interno da Página */}
      <header className="flex items-center justify-between relative z-10">
        <h1 className="text-white text-3xl font-light tracking-wide">
          Visão Geral dos Territórios
        </h1>
      </header>
      
      {/* Espaço reservado para o Mapa e os Cards do Supabase */}
      <div className="flex-1 w-full border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center bg-white/5 backdrop-blur-sm relative z-10">
        <p className="text-white/40 font-mono tracking-widest uppercase text-sm">
          Área do Mapa e Dashboards
        </p>
      </div>

    </main>
  );
}