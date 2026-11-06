# Graph Report - TERRITORIOS_SECTI  (2026-11-06)

## Corpus Check
- 108 files · ~146,362 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
<<<<<<< HEAD
- 642 nodes · 2030 edges · 32 communities (22 shown, 10 thin omitted)
=======
- 662 nodes · 2071 edges · 30 communities (22 shown, 8 thin omitted)
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
<<<<<<< HEAD
- Built from commit: `a8fdd751`
=======
- Built from commit: `75cf9027`
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioPage.jsx
- DataContext.jsx
- dependencies
<<<<<<< HEAD
- package.json
- CadeiaPage.jsx
- App.jsx
=======
- exportReportClient.js
- App.jsx
- clientExport.js
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
- captureReports.mjs
- scripts
- devDependencies
- ref_fs
- normalize
<<<<<<< HEAD
- @fontsource-variable/plus-jakarta-sans
- testReactToPrintComparison.mjs
- optimize-images.mjs
- capture-redesign.mjs
- generateJson.mjs
- notes
- exportReportClient.js
- vercel.json
- clsx
- simplify-topojson.mjs
- @dnd-kit/utilities@^3.2.2
- DashboardPainel.jsx
- react-dom
- react-helmet-async
- react-joyride
- topojson-client
- xlsx

## God Nodes (most connected - your core abstractions)
1. `react` - 55 edges
2. `cn()` - 47 edges
3. `useTheme()` - 36 edges
4. `lucide-react` - 35 edges
5. `SideMap()` - 35 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `CadeiaPage()` - 21 edges
=======
- Design System SECTI Territorios (Bento Grid)
- optimize-images.mjs
- xlsx
- capture-redesign.mjs
- generateJson.mjs
- notes
- clsx
- vercel.json
- playwright-core
- simplify-topojson.mjs
- react-joyride
- AtivosPage.jsx
- supercluster
- @supabase/supabase-js
- @vercel/analytics

## God Nodes (most connected - your core abstractions)
1. `react` - 56 edges
2. `cn()` - 47 edges
3. `useTheme()` - 36 edges
4. `lucide-react` - 36 edges
5. `SideMap()` - 34 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `CadeiaPage()` - 22 edges
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
10. `normalize()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
<<<<<<< HEAD
=======
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Excecoes de cor hex fora dos tokens do design system** — docs_redesign_pending_excecoes_leaflet_svg, docs_redesign_pending_fallbacks_corhex, docs_redesign_pending_terceiros_joyride, docs_design_system_mapa_coropletico [INFERRED 0.75]
- **Riscos do pipeline de exportacao PDF/PNG** — docs_auditoria_seg_export_anonimos, docs_auditoria_seg_ssrf_baseurl, docs_auditoria_rel_timeouts_playwright, docs_sistema_relatorios_exportacao [INFERRED 0.85]
- **Fluxo de carga e cache de dados do Supabase** — docs_sistema_datacontext, docs_ingestao_de_dados_carga_supabase, docs_sistema_cache_localstorage, docs_ingestao_de_dados_limites_paginacao, docs_auditoria_dados_falhas_silenciosas [INFERRED 0.85]

<<<<<<< HEAD
## Communities (32 total, 10 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (73): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react, AdminPage(), INITIAL_ATIVOS, FontesReferenciasSection() (+65 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.09
Nodes (57): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, Mapa coropletico da Bahia (escala de azuis), leaflet, react-leaflet, buildTopologiaPayload(), getCachedBahiaTopologia() (+49 more)

### Community 2 - "RelatorioPage.jsx"
Cohesion: 0.07
Nodes (63): [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, Utilitarios src/utils, react-router-dom@^7.17.0, react-to-print@^3.3.0 (+55 more)

### Community 3 - "DataContext.jsx"
Cohesion: 0.07
Nodes (49): AUDITORIA.md Auditoria do repositorio, [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca) (+41 more)

### Community 4 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @dnd-kit/modifiers@^9.0.0, @dnd-kit/sortable@^10.0.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, react@^18.3.1, react-leaflet@^4.2.1 (+10 more)

### Community 5 - "package.json"
Cohesion: 0.15
Nodes (12): @dnd-kit/core@^6.3.1, playwright-core@^1.63.0, @supabase/supabase-js@^2.112.3, vite-plugin-node-polyfills@^0.28.0, description, name, type, version (+4 more)

### Community 6 - "CadeiaPage.jsx"
Cohesion: 0.06
Nodes (42): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Alta] /admin e mock publico (CRUD em useState, sem auth), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador (+34 more)

### Community 7 - "App.jsx"
Cohesion: 0.16
Nodes (24): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, GlobalScroll() (+16 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.20
Nodes (13): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright() (+5 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+8 more)

### Community 11 - "ref_fs"
Cohesion: 0.18
Nodes (4): playwright@^1.62.1, playwright, launchChromium(), test()

### Community 12 - "normalize"
Cohesion: 0.18
Nodes (21): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, Normalizacao de nomes (normalize), vitest, classificarInstituicao(), expandirNomeEntidade(), extractSigla(), filterCursos() (+13 more)

### Community 14 - "testReactToPrintComparison.mjs"
Cohesion: 0.29
Nodes (5): __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 15 - "optimize-images.mjs"
Cohesion: 0.33
Nodes (6): __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT
=======
## Communities (30 total, 8 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (67): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react, AdminPage(), INITIAL_ATIVOS, FontesReferenciasSection() (+59 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.09
Nodes (55): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, leaflet@^1.9.4, leaflet, react-leaflet, buildTopologiaPayload(), getCachedBahiaTopologia() (+47 more)

### Community 2 - "RelatorioPage.jsx"
Cohesion: 0.08
Nodes (59): [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom, react-to-print, ProportionBarChart() (+51 more)

### Community 3 - "DataContext.jsx"
Cohesion: 0.06
Nodes (58): AUDITORIA.md Auditoria do repositorio, [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Falha no TopoJSON deixa spinner infinito sem retry (+50 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @dnd-kit/core@^6.3.1, @dnd-kit/modifiers@^9.0.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, lucide-react@^1.18.0, react@^18.3.1, react-dom@^18.3.1 (+17 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.36
Nodes (8): captureReportElementToCanvas(), captureReportViaIframe(), downloadCanvasAsPng(), exportReportAsPdf(), exportReportAsPng(), getReportRoute(), patchCanvasGradient(), waitForReportReady()

### Community 6 - "App.jsx"
Cohesion: 0.14
Nodes (23): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, GlobalScroll() (+15 more)

### Community 7 - "clientExport.js"
Cohesion: 0.27
Nodes (9): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.19
Nodes (14): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright) (+6 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.14
Nodes (19): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+11 more)

### Community 11 - "ref_fs"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 12 - "normalize"
Cohesion: 0.15
Nodes (25): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, Utilitarios src/utils, vitest@^4.1.10, vitest, CardLista(), MUN_LOOKUP, MUN_LOOKUP (+17 more)

### Community 13 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.09
Nodes (23): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, Design System SECTI Territorios (Bento Grid) (+15 more)

### Community 14 - "optimize-images.mjs"
Cohesion: 0.33
Nodes (6): __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT

### Community 15 - "xlsx"
Cohesion: 0.20
Nodes (6): @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2, xlsx@^0.18.5, @dnd-kit/sortable, @dnd-kit/utilities, xlsx
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson
<<<<<<< HEAD

### Community 19 - "exportReportClient.js"
Cohesion: 0.17
Nodes (17): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+9 more)
=======
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.15
Nodes (10): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+2 more)

<<<<<<< HEAD
### Community 25 - "DashboardPainel.jsx"
Cohesion: 0.21
Nodes (16): [Media] lib/format.js nao usado (~38 formatacoes manuais), DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), DARK_BLUE_PALETTE, DARK_CHART_PALETTE, LIGHT_BLUE_PALETTE (+8 more)

## Ambiguous Edges - Review These
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
=======
### Community 25 - "AtivosPage.jsx"
Cohesion: 0.06
Nodes (36): [Media] lib/format.js nao usado (~38 formatacoes manuais), CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig() (+28 more)

## Ambiguous Edges - Review These
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to

## Knowledge Gaps
<<<<<<< HEAD
- **7 isolated node(s):** `Deploy Vercel (cron, headers, rewrites)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 143 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
=======
- **7 isolated node(s):** `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens`, `Workflow frontend.md (regras de acabamento)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 149 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

<<<<<<< HEAD
- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `DataContext.jsx`, `dependencies`, `package.json`, `CadeiaPage.jsx`, `App.jsx`, `DashboardPainel.jsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `Deploy Vercel (cron, headers, rewrites)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06722558608911659 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `dependencies`, `package.json`, `CadeiaPage.jsx`, `DashboardPainel.jsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08612836438923395 - nodes in this community are weakly interconnected._
=======
- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `DataContext.jsx`, `dependencies`, `App.jsx`, `devDependencies`, `normalize`, `Design System SECTI Territorios (Bento Grid)`, `AtivosPage.jsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **What connects `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08037029244687566 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `dependencies`, `devDependencies`, `normalize`, `Design System SECTI Territorios (Bento Grid)`, `AtivosPage.jsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08531468531468532 - nodes in this community are weakly interconnected._
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

<<<<<<< HEAD
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
=======
- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
>>>>>>> 01cea5550f5baf0839e71bbdd473cf776548981d
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._