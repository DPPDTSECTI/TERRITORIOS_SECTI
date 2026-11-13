# Graph Report - TERRITORIOS_SECTI  (2026-11-12)

## Corpus Check
- 114 files · ~157,606 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 725 nodes · 2224 edges · 33 communities (21 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d80c10cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioCadeias.jsx
- @fontsource-variable/lexend
- dependencies
- CadeiaPage.jsx
- exportReportClient.js
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- @radix-ui/react-tooltip
- normalize
- App.jsx
- react-helmet-async
- @dnd-kit/sortable@^10.0.0
- capture-redesign.mjs
- generateJson.mjs
- notes
- supercluster
- vercel.json
- clientExport.js
- simplify-topojson.mjs
- @fontsource-variable/plus-jakarta-sans
- vite-plugin-node-polyfills
- recharts
- package.json
- DataContext.jsx
- @sparticuz/chromium
- ErrorBoundary
- AUDITORIA.md Auditoria do repositorio

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 53 edges
3. `lucide-react` - 38 edges
4. `useTheme()` - 36 edges
5. `SideMap()` - 32 edges
6. `getSemanticColors()` - 29 edges
7. `isMunicipioSemiarido()` - 28 edges
8. `AUDITORIA.md Auditoria do repositorio` - 25 edges
9. `UiShowcasePage()` - 24 edges
10. `normalize()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md
- `README Painel Territorial CT&I` --references--> `SISTEMA.md Documentacao do Sistema`  [EXTRACTED]
  README.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Communities (33 total, 12 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (65): framer-motion, @radix-ui/react-dialog, react, FontesReferenciasSection(), ICONES_CATEGORIA, indicadoresEstrategicos, LandingHero(), modulosPlataforma (+57 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.09
Nodes (53): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapa coropletico da Bahia (escala de azuis), Mapas PtiMap e SideMap (Leaflet), leaflet (+45 more)

### Community 2 - "RelatorioCadeias.jsx"
Cohesion: 0.07
Nodes (66): [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Layout, sidebar, scroll navigator e tour guiado, lucide-react, react-router-dom, react-to-print, getContrastTextColor(), DARK_BLUE_PALETTE (+58 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, clsx@^2.1.1, @dnd-kit/core@^6.3.1, @dnd-kit/utilities@^3.2.2, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, playwright-core@^1.63.0 (+13 more)

### Community 5 - "CadeiaPage.jsx"
Cohesion: 0.06
Nodes (51): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador (+43 more)

### Community 6 - "exportReportClient.js"
Cohesion: 0.08
Nodes (26): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+18 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.20
Nodes (15): handler(), handler(), [Alta] reportAggregation e funcoes de normalization so usados por testes, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist (+7 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+7 more)

### Community 12 - "normalize"
Cohesion: 0.17
Nodes (22): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest@^4.1.10, vitest, CardLista(), MUN_LOOKUP, classificarInstituicao(), expandirNomeEntidade(), extractSigla() (+14 more)

### Community 13 - "App.jsx"
Cohesion: 0.09
Nodes (36): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+28 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "clientExport.js"
Cohesion: 0.31
Nodes (8): html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf(), downloadCanvasAsPng()

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.10
Nodes (19): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename (+11 more)

### Community 28 - "package.json"
Cohesion: 0.12
Nodes (16): @dnd-kit/modifiers@^9.0.0, react-dom@^18.3.1, react-joyride@^3.2.0, @supabase/supabase-js@^2.112.3, topojson-client@^3.1.0, xlsx@^0.18.5, description, name (+8 more)

### Community 29 - "DataContext.jsx"
Cohesion: 0.06
Nodes (55): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] /admin e mock publico (CRUD em useState, sem auth), INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Dados estaticos versionados e consistencia dupla, Glossario (IFDM, CT&I, PTI, EAD, RLS) (+47 more)

### Community 35 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.15
Nodes (16): AUDITORIA.md Auditoria do repositorio, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema, Arquitetura SPA sem backend, somente leitura (+8 more)

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioCadeias.jsx`, `AUDITORIA.md Auditoria do repositorio`, `dependencies`, `CadeiaPage.jsx`, `normalize`, `App.jsx`, `package.json`, `DataContext.jsx`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07915808739418898 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `RelatorioCadeias.jsx` to `react`, `SideMap.jsx`, `dependencies`, `CadeiaPage.jsx`, `normalize`, `App.jsx`, `package.json`, `DataContext.jsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09326923076923077 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._