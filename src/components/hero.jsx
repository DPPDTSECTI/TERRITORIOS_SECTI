import React, { useState, useEffect } from 'react';
import ExcelExportButton from './ExcelExportButton';

const LandingHero = ({ onAccessDashboard, territoriosData }) => {
    const images = [
        "/img/hero/55177617481_a2f52dd9f0_o.jpg",
        "/img/hero/55193881827_608169f0ec_o.jpg",
        "/img/hero/55280502368_f86e6bea57_o.jpg",
        "/img/hero/55284715576_5c6c560a5c_o.jpg",
        "/img/hero/55287787257_7b4ae60fbf_o.jpg",
        "/img/hero/54208024118_e48b529bdd_o.jpg",
        "/img/hero/54400089577_6b2f2c3fce_o.jpg",
        "/img/hero/54446840370_c6fa9c1d3c_o.jpg",
        "/img/hero/54492136003_c06ca3e046_o.jpg",
        "/img/hero/54718163457_5a44dc81e3_o.jpg",
        "/img/hero/54893586223_d842cb4664_o.jpg"
    ];

    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className="relative w-full h-screen font-sans flex flex-col lg:flex-row overflow-hidden bg-slate-50 touch-none pt-20 lg:pt-28 pb-6">
            
            {/* EFEITO DEGRADÊ DE FUNDO */}
            <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-gradient-to-bl from-gov-blueDark-500/10 via-transparent to-transparent z-0 pointer-events-none" />

            {/* COLUNA ESQUERDA: Conteúdo Principal */}
            <main className="relative z-30 w-full lg:w-[55%] h-full flex flex-col justify-center items-start px-8 sm:px-12 lg:pl-24 lg:pr-8 py-4 lg:py-0">
                
                <h2 className="text-lg sm:text-xl tracking-wide uppercase font-display mb-2 drop-shadow-sm">
                    <span className="text-gov-blueDark-500">Painel </span>
                    <span className="text-gov-red-500">Territorial</span>
                </h2>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-black text-slate-900 tracking-tight mb-5 leading-[1.1] drop-shadow-sm">                    
                    Ciência, Tecnologia e <br />
                    Inovação
                </h1>

                <p className="text-sm sm:text-base text-slate-600 font-light max-w-lg mb-8 leading-relaxed antialiased">
                    Uma plataforma interativa desenvolvida pela SECTI para a visualização das 
                    características inerentes à ciência, tecnologia e inovação nos territórios de 
                    identidade do Estado da Bahia.
                </p>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={onAccessDashboard}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gov-blueDark-500 hover:bg-gov-blueDark-600 text-white font-black tracking-wider uppercase text-xs sm:text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center transform-gpu"
                    >
                        Acessar
                    </button>

                    {/* 2. Passe os dados com o nome correto: territoriosData */}
                    <ExcelExportButton 
                        territoriosData={territoriosData} 
                        variant="outline" 
                        className="w-full sm:w-auto" 
                    />
                </div>

                {/* Indicadores do Carrossel */}
                <div className="flex gap-2 mt-8">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImage(index)}
                            aria-label={`Ir para a imagem ${index + 1}`}
                            className={`h-1.5 transition-all duration-500 rounded-full ${
                                index === currentImage ? 'w-8 bg-gov-blueDark-500 shadow-sm' : 'w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                        />
                    ))}
                </div>
            </main>

            {/* COLUNA DIREITA: Carrossel Vertical (Aceleração de Hardware ativada) */}
            <aside className="relative z-10 hidden md:flex w-full lg:w-[45%] h-full items-center justify-center pr-8 lg:pr-24 perspective-1000">
                
                <div className="relative w-full max-w-sm xl:max-w-md h-full max-h-[70vh] aspect-[4/5] flex items-center justify-center">
                    
                    {images.map((img, index) => {
                        const prevIndex = (currentImage - 1 + images.length) % images.length;
                        const nextIndex = (currentImage + 1) % images.length;
                        
                        let positionClasses = '';
                        
                        if (index === currentImage) {
                            positionClasses = 'translate-x-0 scale-100 opacity-100 z-30 shadow-[0_15px_40px_rgba(0,0,0,0.15)] border-[5px] border-white cursor-default';
                        } else if (index === prevIndex) {
                            positionClasses = '-translate-x-[25%] xl:-translate-x-[30%] scale-90 opacity-20 z-20 border-[3px] border-white/50 cursor-pointer hover:opacity-40';
                        } else if (index === nextIndex) {
                            positionClasses = 'translate-x-[25%] xl:translate-x-[30%] scale-90 opacity-20 z-20 border-[3px] border-white/50 cursor-pointer hover:opacity-40';
                        } else {
                            positionClasses = 'translate-x-0 scale-75 opacity-0 z-10 pointer-events-none';
                        }

                        return (
                            <div
                                key={index}
                                /* transform-gpu, will-change-transform e backface-hidden forçam a renderização suave via placa de vídeo */
                                className={`absolute w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] origin-center rounded-[2rem] overflow-hidden transform-gpu will-change-transform backface-hidden antialiased ${positionClasses}`}
                                style={{ WebkitBackfaceVisibility: 'hidden' }}
                                onClick={() => {
                                    if (index === prevIndex) setCurrentImage(prevIndex);
                                    if (index === nextIndex) setCurrentImage(nextIndex);
                                }}
                            >
                                <img 
                                    src={img} 
                                    alt={`Belezas da Bahia ${index + 1}`} 
                                    className="w-full h-full object-cover transform-gpu antialiased"
                                    style={{ imageRendering: 'high-quality' }} // Força algoritmo de alta qualidade
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                            </div>
                        );
                    })}
                </div>

                <div className="absolute top-[20%] right-[15%] w-56 h-56 bg-gov-red-500/10 rounded-full blur-[70px] -z-10" />
            </aside>

        </div>
    );
};

export default LandingHero;