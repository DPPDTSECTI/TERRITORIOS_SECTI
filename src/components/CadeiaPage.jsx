import React from 'react';

export default function CadeiaPage() {
  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-6 bg-transparent font-sans w-full">
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex flex-col">
          <h1 className="text-[28px] font-extrabold text-[#1D3557] tracking-tight leading-none mb-1">
            Módulo Cadeia
          </h1>
          <p className="text-[#457B9D] font-medium text-[14px]">
            Gestão e visualização de cadeias produtivas
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#457B9D] font-medium text-[16px]">Em desenvolvimento...</p>
      </div>
    </main>
  );
}
