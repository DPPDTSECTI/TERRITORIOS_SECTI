# Pendências e Exceções Justificadas de Redesign (Design System)

Este documento registra as exceções mapeadas de cores hexadecimais hardcoded e elementos gráficos especializados que foram deliberadamente mantidos para garantir a compatibilidade com renderização vetorial no Leaflet, bibliotecas de terceiros (React Joyride) e exportações gráficas (`html2canvas`/PDF).

---

## 1. Mapeamento Cartográfico & Leaflet SVG (PtiMap & SideMap)

Os mapas interativos utilizam polígonos GeoJSON e ícones SVG gerados dinamicamente via Leaflet. Para garantir renderização consistente e evitar incompatibilidades com o motor de rasterização do `html2canvas` (que não processa variáveis CSS avançadas nem classes utilitárias em nós `<path>` SVG), as seguintes paletas categóricas permanecem em notação hexadecimal:

| Arquivo | Linhas | Finalidade / Justificativa |
| :--- | :--- | :--- |
| `src/components/maps/PtiMap.jsx` | 16–42 | `TERRITORY_COLORS`: 27 cores únicas de alto contraste para distinção simultânea dos 27 Territórios de Identidade no mapa estadual. |
| `src/components/maps/PtiMap.jsx` | 47–73 | `SEMIARIDO_TERRITORY_COLORS`: 27 variações de tonalidade âmbar/ocre para representação territorial do semiárido baiano. |
| `src/components/maps/PtiMap.jsx` | 323, 335, 340, 375, 711–762 | Cores de preenchimento (`fillColor`) e borda (`color`) para camadas GeoJSON e SVG do Leaflet. |
| `src/components/maps/SideMap.jsx` | 783–929, 1161–1238 | Definição de estilos inline de polígonos GeoJSON (fillColor, stroke color) dependentes de seleção territorial e tema. |
| `src/components/maps/side/mapHeatScale.js` | 4–35 | Escalas coropléticas de densidade (5 faixas + nível neutro) com cores RGB hexadecimais compatíveis com Leaflet. |
| `src/components/maps/side/mapIcons.js` | 7–127 | Cores categóricas de marcadores e ícones SVG embutidos (Universidades Federais, Estaduais, IFs, Parques Tecnológicos, Hubs). |
| `src/constants/assetTypes.js` | 70–190 | Strings SVG de ícones vetoriais com `stroke="#ffffff"`. |

---

## 2. Dados Dinâmicos & Fallbacks de Categorias

Registros vindos do banco de dados (Supabase/JSON) podem possuir o campo `corHex` associado a cada tipologia de ativo ou cadeia produtiva. Os fallbacks locais mantêm a integridade visual caso o registro não possua cor definida:

| Arquivo | Linhas | Finalidade / Justificativa |
| :--- | :--- | :--- |
| `src/components/AtivosPage.jsx` | 332, 747, 1162, 1336, 1344 | Fallback `corHex || '#2563EB'` / `'#3B82F6'` para renderização de pinos e pílulas de categorias dinâmicas. |
| `src/components/graph/CardLista.jsx` | 274, 276 | Fallback `item.corHex || '#2563EB'` para ícones de listas de ativos. |
| `src/components/maps/side/MapMarkersAndPopups.jsx` | 16, 70 | Fallback `ativo.corHex || '#2563EB'` para clusters e marcadores individuais no mapa. |
| `src/components/RelatorioPage.jsx` | 100, 108, 115, 1211, 1212 | Cores de séries dos relatórios analíticos de síntese (preservadas conforme regra de ouro de relatórios/impressão). |

---

## 3. Bibliotecas de Terceiros

| `src/components/TourGuide.jsx` | 320 | `arrowColor: '#ffffff'` na configuração do `ReactJoyride` (exige cor hexadecimal pura para renderizar o triângulo SVG da seta). |

---

## 4. Status de Verificação de Qualidade (QA Final Concluído)

- **Captura Automática Playwright (`scripts/capture-redesign.mjs`):**
  - Rotas auditadas: `/`, `/sobre`, `/territorios`, `/ativos`, `/cadeia`, `/cursos`, `/relatorio`, `/admin` (8 rotas).
  - Resoluções: `1280x720`, `1440x900` e `1920x1080` (3 viewports).
  - Temas: Claro e Escuro (alternância via `.dark`).
  - Total: **48 screenshots gerados em `scratch/redesign/`**.
  - **Resultado:** 0 problemas de overflow horizontal (`scrollWidth <= innerWidth` em todas as rotas e resoluções).
- **Acessibilidade & Foco Visível:**
  - `<IconButton>` atualizado para suportar `label` ou `aria-label` e atributo `title` nativo.
  - Links de navegação e módulos na Sidebar recebem anéis de foco `focus-visible:ring-2 focus-visible:ring-ring`.
  - `@media (prefers-reduced-motion: reduce)` em `src/index.css` desativa `animate-sun-breath`, `animate-sun-arc`, `animate-pulse`, `animate-spin`, `animate-bounce` e zera durações de transição.
- **Exportações com Tema Claro Forçado:**
  - `RelatorioPage.jsx`, `src/utils/clientExport.js` e `src/utils/exportReportClient.js` forçam tema claro (`&theme=light`, remoção da classe `.dark` em `clonedDoc` e iframes), garantindo integridade visual para relatórios impressos, PDFs e imagens PNG.
- **Proteção da rota `/__ui`:**
  - Confirmada a proteção via `{import.meta.env.DEV && <Route path="/__ui" ... />}` no `src/App.jsx`.

