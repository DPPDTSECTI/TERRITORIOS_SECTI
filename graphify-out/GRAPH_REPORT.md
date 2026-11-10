# Graph Report - TERRITORIOS_SECTI  (2026-11-10)

## Corpus Check
- 108 files · ~146,362 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 645 nodes · 2043 edges · 35 communities (24 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cee8ecbc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioPage.jsx
- [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes
- dependencies
- CadeiaPage.jsx
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- @fontsource-variable/plus-jakarta-sans
- captureReports.mjs
- scripts
- devDependencies
- exportReportClient.js
- normalize
- App.jsx
- Design System SECTI Territorios (Bento Grid)
- @dnd-kit/utilities@^3.2.2
- capture-redesign.mjs
- generateJson.mjs
- notes
- CursosPage.jsx
- vercel.json
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- simplify-topojson.mjs
- react-dom
- CadeiaPage.jsx
- @fontsource-variable/plus-jakarta-sans
- package.json
- [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo
- react-dom
- react-helmet-async
- @dnd-kit/core@^6.3.1
- react-joyride
- @sparticuz/chromium

## God Nodes (most connected - your core abstractions)
1. `react` - 56 edges
2. `cn()` - 47 edges
3. `lucide-react` - 36 edges
4. `useTheme()` - 36 edges
5. `SideMap()` - 34 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `CadeiaPage()` - 22 edges
10. `normalize()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Communities (35 total, 11 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (69): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, react, AdminPage(), INITIAL_ATIVOS, FontesReferenciasSection(), ICONES_CATEGORIA (+61 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.08
Nodes (62): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, Mapa coropletico da Bahia (escala de azuis), Mapas PtiMap e SideMap (Leaflet), leaflet (+54 more)

### Community 2 - "RelatorioPage.jsx"
Cohesion: 0.07
Nodes (71): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, lucide-react (+63 more)

### Community 3 - "[Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes"
Cohesion: 0.11
Nodes (20): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), generateJson.mjs (legado e quebrado), Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema, Arquitetura SPA sem backend, somente leitura (+12 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, clsx@^2.1.1, @dnd-kit/modifiers@^9.0.0, @dnd-kit/sortable@^10.0.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, react@^18.3.1 (+13 more)

### Community 5 - "CadeiaPage.jsx"
Cohesion: 0.17
Nodes (17): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+9 more)

### Community 6 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.19
Nodes (17): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio (+9 more)

### Community 7 - "@fontsource-variable/plus-jakarta-sans"
Cohesion: 0.33
Nodes (4): @fontsource-variable/plus-jakarta-sans@^5.3.0, playwright-core@^1.63.0, @fontsource-variable/plus-jakarta-sans, playwright-core

### Community 8 - "captureReports.mjs"
Cohesion: 0.17
Nodes (17): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios) (+9 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.13
Nodes (20): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+12 more)

### Community 11 - "exportReportClient.js"
Cohesion: 0.14
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 12 - "normalize"
Cohesion: 0.13
Nodes (27): [Alta] reportAggregation e funcoes de normalization so usados por testes, Normalizacao de nomes (normalize), vitest, CardLista(), MUN_LOOKUP, cleanIes(), findMunicipioCoords(), getTipoCadeiaConfig() (+19 more)

### Community 13 - "App.jsx"
Cohesion: 0.16
Nodes (24): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, GlobalScroll() (+16 more)

### Community 14 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.17
Nodes (12): [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, Design System SECTI Territorios (Bento Grid), Acessibilidade e micro-interacoes, Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Menu lateral dock vertical (+4 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 19 - "CursosPage.jsx"
Cohesion: 0.15
Nodes (7): DURATIONS, EASINGS, fadeIn, fadeUp, scaleIn, SPRING_DEFAULT, SPRING_FLUID

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.17
Nodes (13): [Alta] /admin e mock publico (CRUD em useState, sem auth), [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, Auditoria: secao Paginas e UI, Visualizacao: graficos Recharts/SVG, Pagina /admin (maquete sem autenticacao) (+5 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.11
Nodes (15): exportarDados.mjs (placeholder), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename, getFilesRecursively() (+7 more)

### Community 25 - "CadeiaPage.jsx"
Cohesion: 0.29
Nodes (13): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+5 more)

### Community 28 - "[Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo"
Cohesion: 0.18
Nodes (8): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Dark mode proporcional, Tipografia Plus Jakarta Sans e tabular-nums, Tokens de cor e CSS variables, Convencoes de interface (desktop only, tokens, min-w-0)

## Ambiguous Edges - Review These
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens`, `Workflow frontend.md (regras de acabamento)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 143 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `[Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes`, `dependencies`, `devDependencies`, `normalize`, `App.jsx`, `Design System SECTI Territorios (Bento Grid)`, `CursosPage.jsx`, `CadeiaPage.jsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07216117216117215 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `RelatorioPage.jsx` to `react`, `SideMap.jsx`, `dependencies`, `devDependencies`, `normalize`, `Design System SECTI Territorios (Bento Grid)`, `CursosPage.jsx`, `CadeiaPage.jsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07855855855855856 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._