# Graph Report - TERRITORIOS_SECTI  (2026-11-06)

## Corpus Check
- 108 files · ~146,362 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 663 nodes · 2042 edges · 34 communities (24 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a8fdd751`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioPage.jsx
- DataContext.jsx
- dependencies
- App.jsx
- clientExport.js
- captureReports.mjs
- scripts
- devDependencies
- ref_fs
- normalize
- Design System SECTI Territorios (Bento Grid)
- lucide-react
- hero.jsx
- capture-redesign.mjs
- generateJson.mjs
- notes
- DataContext.jsx
- vercel.json
- CadeiaPage.jsx
- simplify-topojson.mjs
- Acessibilidade e micro-interacoes
- DashboardPainel.jsx
- supercluster
- react-dom
- react-helmet-async
- recharts
- @sparticuz/chromium
- topojson-client
- vite-plugin-node-polyfills

## God Nodes (most connected - your core abstractions)
1. `react` - 56 edges
2. `cn()` - 47 edges
3. `useTheme()` - 36 edges
4. `lucide-react` - 36 edges
5. `SideMap()` - 32 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `normalize()` - 21 edges
10. `[Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `[Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL` --conceptually_related_to--> `selectedTerritory compartilhado`  [INFERRED]
  docs/AUDITORIA.md → docs/SISTEMA.md
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Excecoes de cor hex fora dos tokens do design system** — docs_redesign_pending_excecoes_leaflet_svg, docs_redesign_pending_fallbacks_corhex, docs_redesign_pending_terceiros_joyride, docs_design_system_mapa_coropletico [INFERRED 0.75]
- **Riscos do pipeline de exportacao PDF/PNG** — docs_auditoria_seg_export_anonimos, docs_auditoria_seg_ssrf_baseurl, docs_auditoria_rel_timeouts_playwright, docs_sistema_relatorios_exportacao [INFERRED 0.85]
- **Fluxo de carga e cache de dados do Supabase** — docs_sistema_datacontext, docs_ingestao_de_dados_carga_supabase, docs_sistema_cache_localstorage, docs_ingestao_de_dados_limites_paginacao, docs_auditoria_dados_falhas_silenciosas [INFERRED 0.85]

## Communities (34 total, 10 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (61): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, framer-motion, react, AdminPage(), INITIAL_ATIVOS, FontesReferenciasSection(), ICONES_CATEGORIA, secoesPlataforma (+53 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.07
Nodes (63): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapa coropletico da Bahia (escala de azuis), leaflet@^1.9.4, leaflet, react-leaflet (+55 more)

### Community 2 - "RelatorioPage.jsx"
Cohesion: 0.08
Nodes (59): [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom, react-to-print, ProportionBarChart() (+51 more)

### Community 3 - "DataContext.jsx"
Cohesion: 0.06
Nodes (43): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] /admin e mock publico (CRUD em useState, sem auth), [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas) (+35 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @dnd-kit/core@^6.3.1, @dnd-kit/modifiers@^9.0.0, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, lucide-react@^1.18.0 (+17 more)

### Community 6 - "App.jsx"
Cohesion: 0.11
Nodes (25): Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, Pontos de atencao conhecidos (10 itens), AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage (+17 more)

### Community 7 - "clientExport.js"
Cohesion: 0.31
Nodes (8): html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf(), downloadCanvasAsPng()

### Community 8 - "captureReports.mjs"
Cohesion: 0.17
Nodes (18): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s (+10 more)

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
Cohesion: 0.16
Nodes (23): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest@^4.1.10, vitest, CardLista(), MUN_LOOKUP, MUN_LOOKUP, classificarInstituicao(), expandirNomeEntidade() (+15 more)

### Community 13 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.13
Nodes (15): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+7 more)

### Community 14 - "lucide-react"
Cohesion: 0.21
Nodes (10): [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Pendencias e Excecoes de Redesign, Exportacoes com tema claro forcado, Layout, sidebar, scroll navigator e tour guiado, lucide-react, ExportPdfButton(), Sidebar() (+2 more)

### Community 15 - "hero.jsx"
Cohesion: 0.19
Nodes (12): indicadoresEstrategicos, LandingHero(), modulosPlataforma, StatKpiCard(), DURATIONS, EASINGS, fadeIn, fadeUp (+4 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "notes"
Cohesion: 0.19
Nodes (7): clsx@^2.1.1, @vercel/analytics@^2.0.1, notes, tailwind, topojson, clsx, @vercel/analytics

### Community 19 - "DataContext.jsx"
Cohesion: 0.27
Nodes (11): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado (+3 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "CadeiaPage.jsx"
Cohesion: 0.29
Nodes (11): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+3 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.12
Nodes (15): exportarDados.mjs (placeholder), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename, getFilesRecursively() (+7 more)

### Community 24 - "Acessibilidade e micro-interacoes"
Cohesion: 0.67
Nodes (3): [Media] Contraste text-muted e KPI ambar abaixo de AA, Acessibilidade e micro-interacoes, QA final: 48 screenshots Playwright, foco visivel, reduced-motion

### Community 25 - "DashboardPainel.jsx"
Cohesion: 0.16
Nodes (16): [Media] lib/format.js nao usado (~38 formatacoes manuais), DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), DARK_BLUE_PALETTE, DARK_CHART_PALETTE, LIGHT_BLUE_PALETTE (+8 more)

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 150 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `dependencies`, `AtivosPage.jsx`, `App.jsx`, `devDependencies`, `normalize`, `lucide-react`, `hero.jsx`, `DataContext.jsx`, `CadeiaPage.jsx`, `DashboardPainel.jsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08489388264669163 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `react`, `SideMap.jsx`, `RelatorioPage.jsx`, `dependencies`, `AtivosPage.jsx`, `devDependencies`, `normalize`, `hero.jsx`, `CadeiaPage.jsx`, `DashboardPainel.jsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06937799043062201 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._