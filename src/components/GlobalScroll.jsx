import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function GlobalScroll() {
  const { pathname } = useLocation();

  // Efeito 1: Lida com a navegação e a restauração pós-F5
  useEffect(() => {
    // Busca se existe um scroll salvo para a página atual
    const savedScrollPosition = sessionStorage.getItem(`scroll-${pathname}`);
    
    if (savedScrollPosition) {
      // Se deu F5, restaura a posição invisivelmente
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition, 10),
          behavior: 'instant'
        });
      }, 0);
    } else {
      // Se for uma navegação comum (clicou num link para outra página), joga para o topo
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  // Efeito 2: Salva a posição exata 1 milissegundo antes da página recarregar
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll-${window.location.pathname}`, window.scrollY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // Componente fantasma, não renderiza nada na tela
}