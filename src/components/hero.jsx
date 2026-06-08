import React from 'react';

const LandingHero = ({ onAccessDashboard }) => {
    return (
        // 👇 AQUI ESTÁ A MÁGICA DO DEGRADÊ SUAVE 👇
        <div className="relative w-full h-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-gov-blueDark-100/50 to-gov-cyan-100/60 font-sans flex flex-col justify-between overflow-hidden">

            {/* Conteúdo Principal com padding ajustado para alinhar com o header */}
            <main className="flex-1 flex flex-col justify-center items-start max-w-4xl z-10 my-auto px-8 sm:px-12 lg:px-16">
                
                {/* Título com as cores oficiais (Azul e Vermelho do Gov) */}
                <h2 className="text-xl sm:text-2xl font-display tracking-tight uppercase">
                    <span className="text-gov-blueDark-500">Painel </span>
                    <span className="text-gov-red-500">Territorial</span>
                </h2>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-black text-slate-900 tracking-tight mt-2 mb-6 font-display leading-[1.15]">                    
                    Ciência, Tecnologia e <br />
                    Inovação
                </h1>

                {/* Descrição oficial */}
                <p className="text-base sm:text-lg text-slate-600 font-extralight max-w-2xl mb-10 leading-relaxed">
                    Uma plataforma interativa desenvolvida pela SECTI para a visualização das 
                    características inerentes à ciência, tecnologia e inovação nos territórios de 
                    identidade do Estado da Bahia.
                </p>

                {/* Ações / Botões */}
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={onAccessDashboard}
                        className="w-full sm:w-auto px-12 py-4 rounded-xl bg-gov-blueDark-500 hover:bg-gov-blueDark-700 text-white font-bold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center"
                    >
                        Acessar
                    </button>

                    <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-gov-blueDark-100/50 text-slate-600 font-bold text-base transition-all flex items-center justify-center shadow-sm border border-slate-200">
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