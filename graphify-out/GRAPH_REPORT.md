# Graph Report - TERRITORIOS_SECTI  (2026-11-13)

## Corpus Check
- 114 files · ~167,274 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 723 nodes · 2277 edges · 27 communities (21 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b1a622f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- optimize-images.mjs
- SideMap.jsx
- dependencies
- clientExport.js
- Design System SECTI Territorios (Bento Grid)
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- CadeiaPage.jsx
- normalize
- App.jsx
- capture-redesign.mjs
- generateJson.mjs
- vercel.json
- exportReportClient.js
- simplify-topojson.mjs
- @supabase/supabase-js
- playwright-core
- DataContext.jsx
- @sparticuz/chromium
- package.json
- @dnd-kit/sortable@^10.0.0

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 53 edges
3. `lucide-react` - 38 edges
4. `SideMap()` - 36 edges
5. `useTheme()` - 36 edges
6. `AdminPage()` - 30 edges
7. `getSemanticColors()` - 29 edges
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
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md
- `README Painel Territorial CT&I` --references--> `SISTEMA.md Documentacao do Sistema`  [EXTRACTED]
  README.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Communities (27 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (83): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, @radix-ui/react-dialog, react, AdminPage(), buildPayloadFromForm() (+75 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.07
Nodes (64): [Media] lib/format.js nao usado (~38 formatacoes manuais), react-to-print@^3.3.0, react-to-print, getContrastTextColor(), DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName() (+56 more)

### Community 2 - "optimize-images.mjs"
Cohesion: 0.22
Nodes (9): README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG (+1 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.10
Nodes (49): leaflet@^1.9.4, leaflet, react-leaflet, buildTopologiaPayload(), getCachedBahiaTopologia(), loadBahiaTopologia(), CtrlScrollZoom(), getMapPalette() (+41 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, clsx@^2.1.1, @dnd-kit/core@^6.3.1, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-tooltip@^1.4.1 (+18 more)

### Community 5 - "clientExport.js"
Cohesion: 0.27
Nodes (9): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+1 more)

### Community 6 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.09
Nodes (24): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, Design System SECTI Territorios (Bento Grid) (+16 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.13
Nodes (8): playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 8 - "captureReports.mjs"
Cohesion: 0.19
Nodes (14): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright) (+6 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, playwright@^1.62.1, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+8 more)

### Community 11 - "CadeiaPage.jsx"
Cohesion: 0.05
Nodes (42): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, Filtro do Semiarido (278 municipios), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils, CadeiaPage() (+34 more)

### Community 12 - "normalize"
Cohesion: 0.15
Nodes (24): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, Normalizacao de nomes (normalize), vitest@^4.1.10, vitest, MUN_LOOKUP, MUN_LOOKUP, classificarInstituicao() (+16 more)

### Community 13 - "App.jsx"
Cohesion: 0.10
Nodes (37): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+29 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.20
Nodes (14): xlsx@^0.18.5, xlsx, __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey() (+6 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "exportReportClient.js"
Cohesion: 0.36
Nodes (8): captureReportElementToCanvas(), captureReportViaIframe(), downloadCanvasAsPng(), exportReportAsPdf(), exportReportAsPng(), getReportRoute(), patchCanvasGradient(), waitForReportReady()

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.15
Nodes (10): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+2 more)

### Community 29 - "DataContext.jsx"
Cohesion: 0.06
Nodes (64): AUDITORIA.md Auditoria do repositorio, [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao (+56 more)

### Community 34 - "package.json"
Cohesion: 0.09
Nodes (21): @dnd-kit/modifiers@^9.0.0, @dnd-kit/utilities@^3.2.2, @fontsource-variable/lexend@^5.3.0, @radix-ui/react-dropdown-menu@^2.2.1, react-dom@^18.3.1, react-helmet-async@^3.0.0, supercluster@^9.0.0, description (+13 more)

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 149 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `package.json`, `SideMap.jsx`, `dependencies`, `Design System SECTI Territorios (Bento Grid)`, `CadeiaPage.jsx`, `App.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06651411136536994 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `package.json`, `SideMap.jsx`, `dependencies`, `Design System SECTI Territorios (Bento Grid)`, `CadeiaPage.jsx`, `App.jsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06835443037974684 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._