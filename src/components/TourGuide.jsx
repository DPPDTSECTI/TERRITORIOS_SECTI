import React, { useState, useEffect, useRef } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const CustomTooltip = ({
  continuous,
  controls,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  skipProps,
  isLastStep,
  size,
}) => {
  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-surface border border-border shadow-card-hover rounded-xl p-4 sm:p-5 w-[330px] sm:w-[380px] relative z-50 flex flex-col font-sans overflow-hidden"
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[14px] font-semibold text-text-primary tracking-tight truncate">
            {step.title || 'Guia Interativo'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isLastStep && (
            <button 
              {...skipProps} 
              className="text-[11px] font-medium text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded transition-colors bg-transparent border-none cursor-pointer"
            >
              Pular
            </button>
          )}
          <button 
            {...closeProps} 
            title="Fechar Tutorial" 
            className="text-text-muted hover:text-text-primary hover:bg-surface-soft p-1 rounded-md transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="text-[12.5px] text-text-secondary leading-relaxed font-normal mb-4">
        {step.content}
      </div>

      {/* Rodapé com Navegação por Pontos e Botões de Ação */}
      <div className="flex items-center justify-between pt-3 border-t border-border/70 mt-auto gap-3">
        {/* Indicadores de Pontos Clicáveis (Linha única sem quebra) */}
        <div className="flex items-center gap-1 flex-nowrap shrink-0">
          {[...Array(size)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => controls?.go(i)}
              title={`Ir para o passo ${i + 1} de ${size}`}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer p-0 border-none outline-none ${
                i === index 
                  ? 'bg-primary-600 w-3.5' 
                  : 'bg-primary-200 hover:bg-primary-400 w-1.5 hover:scale-125'
              }`}
            />
          ))}
        </div>

        {/* Botões de Navegação */}
        <div className="flex items-center gap-1.5 shrink-0">
          {index > 0 && (
            <button 
              {...backProps} 
              className="px-2.5 py-1 text-[11.5px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-soft rounded-full transition-colors bg-transparent border-none cursor-pointer"
            >
              Voltar
            </button>
          )}
          {continuous && !isLastStep && (
            <button 
              {...primaryProps} 
              className="px-3.5 py-1 text-[12px] font-medium text-primary-600 border border-primary-600 bg-transparent hover:bg-primary-50 hover:text-primary-700 rounded-full transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Próximo</span>
              <ChevronRight size={13} />
            </button>
          )}
          {(!continuous || isLastStep) && (
            <button 
              {...primaryProps} 
              className="px-4 py-1 text-[12px] font-medium text-primary-600 border border-primary-600 bg-transparent hover:bg-primary-50 hover:text-primary-700 rounded-full transition-colors cursor-pointer"
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function TourGuide() {
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboardSteps = [
    {
      target: 'body',
      title: 'Bem-vindo(a)!',
      content: 'Bem-vindo ao Painel Territorial CT&I! Vamos fazer um tour rápido para você conhecer as principais funcionalidades.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-sidebar',
      title: 'Navegação Principal',
      content: 'Aqui você encontra os menus para acessar os relatórios completos, gestão de ativos e outras páginas do sistema.',
      placement: 'right',
      spotlightPadding: 0,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-sobre',
      title: 'Entenda o Sistema',
      content: 'Recomendamos FORTEMENTE visitar a aba "Sobre" antes de começar! Lá você entenderá a metodologia inovadora que utilizamos, as fontes de dados oficiais e os conceitos chave. Isso fará toda a diferença na sua análise!',
      placement: 'right',
      spotlightPadding: 4,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-visao',
      title: 'Visão Geral',
      content: 'Reúne os totais do estado e apresenta métricas agregadas de todos os indicadores em um painel integrado.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-ativos',
      title: 'Módulo de Ativos',
      content: 'O diferencial aqui é o mapeamento detalhado da infraestrutura tecnológica: laboratórios, centros de pesquisa e pontos de conectividade avançada RNP.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-cadeias',
      title: 'Módulo de Cadeias',
      content: 'Aqui exploramos as vocações econômicas. O grande destaque é a Teia de Conexões Interativa, que ilustra como os arranjos produtivos e indicações geográficas se conectam no território.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-cursos',
      title: 'Módulo de Cursos',
      content: 'Focado em capital humano. Veja a distribuição educacional (graduação/pós), com destaque para as áreas STEM (Ciência, Tecnologia, Engenharia e Matemática) e a força da educação à distância (EaD).',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-kpis',
      content: 'Aqui estão os indicadores principais (KPIs). Eles mostram um resumo dos dados de acordo com os filtros selecionados.',
      placement: 'bottom',
    },
    {
      target: '.tour-charts',
      content: 'Estes gráficos apresentam um resumo visual da distribuição de ativos e cursos no estado. Ah, você pode arrastá-los para reordenar a tela!',
      placement: 'left',
    },
    {
      target: '.tour-map',
      content: 'Este é o mapa interativo. Ele exibe a distribuição dos ativos tecnológicos e instituições por todo o estado da Bahia. Você pode clicar nos marcadores para mais detalhes.',
      placement: 'right',
    },
    {
      target: '.tour-user-menu',
      title: 'Seu Perfil e Ajustes',
      content: 'Aqui você tem acesso rápido ao seu perfil, configurações de sistema e também a opção de sair (logout).',
      placement: 'bottom-end',
      spotlightPadding: 4,
    },
    {
      target: '.tour-help-button',
      title: 'Dúvidas?',
      content: 'Se precisar rever este tutorial, basta clicar neste botão de ajuda a qualquer momento no cabeçalho!',
      placement: 'bottom-end',
      spotlightPadding: 2,
    },
  ];

  const relatorioSteps = [
    {
      target: 'body',
      title: 'Módulo de Relatórios',
      content: 'Aqui você pode consultar análises detalhadas, gerar relatórios executivos e exportar todos os dados do sistema.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-relatorio-tipo',
      title: 'Tipos de Relatório',
      content: 'Navegue entre as abas para alternar a visão dos dados (Síntese Geral, Ativos, Cursos, Cadeias Produtivas...).',
      placement: 'bottom',
    },
    {
      target: '.tour-relatorio-kpis',
      title: 'Resumo Dinâmico',
      content: 'Estes cartões mostram os totais e percentuais que se ajustam automaticamente ao relatório e território selecionados.',
      placement: 'bottom',
    },
    {
      target: '.tour-relatorio-export',
      title: 'Exportação de Dados',
      content: 'Precisa dos dados para planilhas ou sistemas? Exporte facilmente tudo em formatos CSV (Excel) ou JSON!',
      placement: 'left',
    },
    {
      target: '.tour-help-button',
      title: 'Dúvidas?',
      content: 'Sempre que precisar relembrar as funcionalidades desta tela, é só clicar aqui.',
      placement: 'bottom-end',
      spotlightPadding: 2,
    },
  ];

  const baseSteps = location.pathname === '/relatorio' ? relatorioSteps : dashboardSteps;
  const steps = baseSteps.map(step => ({
    disableBeacon: true,
    ...step,
  }));

 useEffect(() => {
  if (location.pathname === '/territorios') {
    const hasSeenTour = sessionStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
    sessionStorage.setItem('hasSeenTour', 'true');
    setTourKey(prev => prev + 1);
    setTimeout(() => setRun(true), 1200);
    }
  } else if (location.pathname === '/relatorio') {
    const hasSeenRelatorioTour = sessionStorage.getItem('hasSeenRelatorioTour');
    if (!hasSeenRelatorioTour) {
    sessionStorage.setItem('hasSeenRelatorioTour', 'true');
    setTourKey(prev => prev + 1);
    setTimeout(() => setRun(true), 1200);
    }
  }
  }, [location.pathname]);

 useEffect(() => {
 // Escutar evento para reiniciar o tour
 const handleStartTour = () => {
 setTourKey(prev => prev + 1);
 if (location.pathname === '/territorios' || location.pathname === '/relatorio') {
 setRun(true);
 } else {
 navigate('/territorios');
 setTimeout(() => setRun(true), 1000);
 }
 };
 window.addEventListener('start-tour', handleStartTour);

 return () => {
 window.removeEventListener('start-tour', handleStartTour);
 };
 }, [location.pathname, navigate]);

 const handleJoyrideCallback = (data) => {
 const { status, type, action } = data;
 
 // Quando o tour for concluído ou pulado
 if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || type === 'tour:end' || action === 'skip' || action === 'close') {
 setRun(false);
 // Salvar no sessionStorage para não mostrar novamente nesta sessão
 if (location.pathname === '/territorios') {
 sessionStorage.setItem('hasSeenTour', 'true');
 } else if (location.pathname === '/relatorio') {
 sessionStorage.setItem('hasSeenRelatorioTour', 'true');
 }
 }
 };

  return (
    <Joyride
      key={tourKey}
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      floatingOptions={{
        autoUpdate: {
          animationFrame: true,
        },
      }}
      floaterProps={{
        disableAnimation: true, // Desativa animação padrão para usar o Framer Motion
      }}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: '#ffffff', // A seta vai pegar a cor de fundo padrão
        },
        overlay: {
          backgroundColor: 'rgba(29, 53, 87, 0.4)', // Overlay mais escuro e elegante
        },
        spotlight: {
          borderRadius: '24px', // Deixa a luz arredondada combinando com os cards
        }
      }}
    />
  );
}
