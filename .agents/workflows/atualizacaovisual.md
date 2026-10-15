---
description: frontend
---

# Contexto do Projeto — TERRITORIOS_SECTI
Dashboard de CT&I dos Territórios de Identidade da Bahia (React 18 + Vite 6 + Tailwind CSS 3.4 + framer-motion 12 + Recharts 3 + Leaflet/react-leaflet + Supabase). Deploy na Vercel.

# Meta do Redesign
Interface clean, moderna e institucional premium, com UX fluida. Foco 100% Desktop (≥1280px; não investir em mobile). Temas claro (`:root`) e escuro (`.dark`) com a mesma qualidade visual. Paleta azul institucional mantida. Fonte única: Plus Jakarta Sans Variable (`@fontsource-variable/plus-jakarta-sans`). Navegação por scroll entre módulos desativada.

# Protocolo de Execução para o Agente (Regras Estritas)
1. ESCOPO DE ARQUIVOS: Nunca edite mais de 3 arquivos sem antes verificar se há erros de sintaxe. Em arquivos com mais de 400 linhas (`SideMap.jsx`, `PtiMap.jsx`, `RelatorioPage.jsx`, `AtivosPage.jsx`, `CursosPage.jsx`, `CadeiaPage.jsx`, `DashboardPainel.jsx`), faça edições cirúrgicas por blocos — NUNCA reescreva nem apague o arquivo inteiro de uma vez.
2. CAMADA DE DADOS INTOCÁVEL: É estritamente proibido alterar lógica de negócios, cálculos, filtros, `src/context/DataContext.jsx`, `src/services/supabase.js`, `src/utils/*`, `api/*` ou `src/__tests__/*`.
3. COMPATIBILIDADE DE EXPORTAÇÃO: As exportações (PNG, Heatmap PNG, PDF, Excel) usam `html2canvas`, `jsPDF`, `react-to-print` e `Playwright`. Em componentes visuais e mapas, NUNCA use `oklch()`, `color-mix()`, `backdrop-filter` nem `filter` em paths SVG. Use apenas cores no formato `rgb(var(--color-token))` ou classes Tailwind mapeadas para os tokens.
4. ROTAS DE IMPRESSÃO PROTEGIDAS: As rotas `/relatorio/*` (`src/components/pdf/*`) são layouts fixos 1920x1080 de impressão em tema claro. NÃO altere nenhum arquivo dentro de `src/components/pdf/`.
5. PRESERVAÇÃO DE TRABALHO LOCAL: Se houver alterações locais não commitadas, trabalhe em cima do estado atual dos arquivos sem reverter nada.
6. ZERO VALORES ARBITRÁRIOS NOVOS: Não escreva cores hexadecimais hardcoded (`#...`) nem tamanhos de fonte arbitrários (`text-[Npx]`) em código novo. Use exclusivamente os tokens de cor e a escala tipográfica definidos em `tailwind.config.js` e `src/index.css`.
7. ACESSIBILIDADE E MOVIMENTO: Todo componente deve funcionar nos temas claro e escuro, ter estado `:focus-visible` com `ring` e respeitar `prefers-reduced-motion`. Seletores `.tour-*` usados pelo `src/components/TourGuide.jsx` devem ser preservados.
8. IDIOMA: Comentários de código e textos de interface sempre em português (`pt-BR`).
9. VALIDAÇÃO OBRIGATÓRIA: Ao concluir a tarefa do prompt, sempre execute `npm run test` e `npm run build` no terminal. Só declare a tarefa concluída após ambos passarem sem erros, listando os arquivos modificados.
