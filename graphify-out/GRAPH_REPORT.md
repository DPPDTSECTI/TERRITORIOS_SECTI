# Graph Report - TERRITORIOS_SECTI  (2026-11-17)

## Corpus Check
- 114 files · ~170,559 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 734 nodes · 2317 edges · 41 communities (26 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fe6708f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- DashboardPainel.jsx
- AdminPage.jsx
- SideMap.jsx
- dependencies
- exportReportClient.js
- Design System SECTI Territorios (Bento Grid)
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- AtivosPage.jsx
- RelatorioPage.jsx
- App.jsx
- CadeiaPage.jsx
- RelatorioPage.jsx
- capture-redesign.mjs
- generateJson.mjs
- @dnd-kit/core@^6.3.1
- @radix-ui/react-dropdown-menu
- vercel.json
- motion.js
- simplify-topojson.mjs
- @sparticuz/chromium
- supercluster
- react-dom
- react-joyride
- DataContext.jsx
- [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable)
- @fontsource-variable/lexend
- optimize-images.mjs
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- notes
- clsx
- @radix-ui/react-tooltip
- @supabase/supabase-js
- vite-plugin-node-polyfills
- xlsx
- @vercel/analytics

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 53 edges
3. `lucide-react` - 38 edges
4. `useTheme()` - 37 edges
5. `SideMap()` - 36 edges
6. `normalize()` - 31 edges
7. `getSemanticColors()` - 30 edges
8. `isMunicipioSemiarido()` - 28 edges
9. `AUDITORIA.md Auditoria do repositorio` - 25 edges
10. `UiShowcasePage()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md

## Import Cycles
- None detected.

## Communities (41 total, 15 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (69): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, @radix-ui/react-dialog, react, FontesReferenciasSection(), ICONES_CATEGORIA (+61 more)

### Community 1 - "DashboardPainel.jsx"
Cohesion: 0.07
Nodes (72): [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, react-router-dom, react-to-print, recharts, DashboardPainel(), MUN_LOOKUP (+64 more)

### Community 2 - "AdminPage.jsx"
Cohesion: 0.14
Nodes (14): [Alta] /admin e mock publico (CRUD em useState, sem auth), Pagina /admin (maquete sem autenticacao), AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES (+6 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (54): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapa coropletico da Bahia (escala de azuis), Mapas PtiMap e SideMap (Leaflet), leaflet (+46 more)

### Community 4 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @dnd-kit/modifiers@^9.0.0, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0 (+14 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.17
Nodes (17): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+9 more)

### Community 6 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.10
Nodes (23): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo (+15 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.11
Nodes (13): handler(), handler(), playwright@^1.62.1, playwright, captureReportWithPlaywright(), launchChromium(), test(), __dirname (+5 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.24
Nodes (14): AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition (+6 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.13
Nodes (20): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+12 more)

### Community 11 - "AtivosPage.jsx"
Cohesion: 0.14
Nodes (4): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, getContrastTextColor(), MUNICIPIOS_COORDS

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.11
Nodes (35): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), Utilitarios src/utils, vitest, MUN_LOOKUP, cleanIes(), findMunicipioCoords(), getTipoCadeiaConfig(), RelatorioPage() (+27 more)

### Community 13 - "App.jsx"
Cohesion: 0.08
Nodes (40): Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, Pontos de atencao conhecidos (10 itens), AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage (+32 more)

### Community 14 - "CadeiaPage.jsx"
Cohesion: 0.31
Nodes (12): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+4 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "motion.js"
Cohesion: 0.25
Nodes (7): DURATIONS, EASINGS, fadeIn, fadeUp, scaleIn, SPRING_DEFAULT, SPRING_FLUID

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.15
Nodes (10): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+2 more)

### Community 28 - "DataContext.jsx"
Cohesion: 0.07
Nodes (54): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas) (+46 more)

### Community 29 - "[Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable)"
Cohesion: 0.60
Nodes (3): [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), keep-alive: manter Supabase ativo

### Community 30 - "@fontsource-variable/lexend"
Cohesion: 0.33
Nodes (4): @fontsource-variable/lexend@^5.3.0, topojson-client@^3.1.0, @fontsource-variable/lexend, topojson-client

### Community 32 - "optimize-images.mjs"
Cohesion: 0.33
Nodes (6): __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT

### Community 33 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.33
Nodes (6): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Visualizacao: graficos Recharts/SVG, Filtro do Semiarido (278 municipios), Componentes de graficos (components/graph), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado

### Community 34 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

## Ambiguous Edges - Review These
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DashboardPainel.jsx`, `AdminPage.jsx`, `SideMap.jsx`, `dependencies`, `Design System SECTI Territorios (Bento Grid)`, `devDependencies`, `AtivosPage.jsx`, `RelatorioPage.jsx`, `App.jsx`, `CadeiaPage.jsx`, `RelatorioPage.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07482993197278912 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `DashboardPainel.jsx`, `AdminPage.jsx`, `SideMap.jsx`, `dependencies`, `Design System SECTI Territorios (Bento Grid)`, `devDependencies`, `AtivosPage.jsx`, `RelatorioPage.jsx`, `App.jsx`, `CadeiaPage.jsx`, `RelatorioPage.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `DashboardPainel.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0692785475394171 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._