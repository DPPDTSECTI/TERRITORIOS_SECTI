import React from 'react';

const LandingHero = ({ onAccessDashboard }) => {
    return (
        <div className="relative w-full h-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 font-sans flex flex-col justify-between overflow-hidden">

            {/* Conteúdo Principal com padding ajustado para alinhar com o header */}
            <main className="flex-1 flex flex-col justify-center items-start max-w-4xl z-10 my-auto px-8 sm:px-12 lg:px-16">
                
                {/* Título de duas cores (Secti + Inovação) */}
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                    <span className="text-inovacao-600">Painel </span>
                    <span className="text-inovacao-600">Territorial</span>
                </h2>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 tracking-tight mt-2 mb-6 font-display leading-[1.15]">                    Ciência, Tecnologia e <br />
                    Inovação
                </h1>

                {/* Descrição oficial */}
                <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mb-10 leading-relaxed">
                    Uma plataforma interativa desenvolvida pela SECTI para a visualização das 
                    características inerentes à ciência, tecnologia e inovação nos territórios de 
                    identidade do Estado da Bahia.
                </p>

                {/* Ações / Botões */}
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={onAccessDashboard}
                        className="w-full sm:w-auto px-12 py-4 rounded-xl bg-inovacao-600 hover:bg-amber-600 text-white font-bold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center"
                    >
                        Acessar
                    </button>

                    <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-base transition-all flex items-center justify-center shadow-sm">
                        Baixar relatório
                    </button>
                </div>
            </main>

            {/* 3. Logo Institucional (Canto Inferior Direito) */}
            <div className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 max-w-[180px] sm:max-w-[240px] z-20">
                <img 
                    src="/img/Secti_Vertical-removebg-preview.png" 
                    alt="Governo do Estado da Bahia - Secretaria de Ciência, Tecnologia e Inovação" 
                    className="w-full h-auto object-contain object-right-bottom"
                />
            </div>
        </div>
    );
};

export default LandingHero;