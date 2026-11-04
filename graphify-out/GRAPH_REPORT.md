# Graph Report - TERRITORIOS_SECTI  (2026-11-04)

## Corpus Check
- 106 files · ~143,712 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 662 nodes · 1934 edges · 27 communities (25 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63e897d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioCadeias.jsx
- RelatorioPage.jsx
- dependencies
- package.json
- generateJson.mjs
- App.jsx
- captureReports.mjs
- devDependencies
- simplify-topojson.mjs
- testReactToPrintComparison.mjs
- DataContext.jsx
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- exportReportClient.js
- AtivosPage.jsx
- capture-redesign.mjs
- DashboardPainel.jsx
- useChartTheme
- RelatorioPage.jsx
- vercel.json
- CadeiaPage.jsx
- [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas
- exportarDados.mjs
- optimize-images.mjs
- supabase.js

## God Nodes (most connected - your core abstractions)
1. `react` - 53 edges
2. `cn()` - 47 edges
3. `useTheme()` - 36 edges
4. `lucide-react` - 34 edges
5. `SideMap()` - 31 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `normalize()` - 24 edges
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
- `Dados estaticos versionados e consistencia dupla` --semantically_similar_to--> `Dados estaticos embutidos`  [INFERRED] [semantically similar]
  docs/INGESTAO-DE-DADOS.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Excecoes de cor hex fora dos tokens do design system** — docs_redesign_pending_excecoes_leaflet_svg, docs_redesign_pending_fallbacks_corhex, docs_redesign_pending_terceiros_joyride, docs_design_system_mapa_coropletico [INFERRED 0.75]
- **Riscos do pipeline de exportacao PDF/PNG** — docs_auditoria_seg_export_anonimos, docs_auditoria_seg_ssrf_baseurl, docs_auditoria_rel_timeouts_playwright, docs_sistema_relatorios_exportacao [INFERRED 0.85]
- **Fluxo de carga e cache de dados do Supabase** — docs_sistema_datacontext, docs_ingestao_de_dados_carga_supabase, docs_sistema_cache_localstorage, docs_ingestao_de_dados_limites_paginacao, docs_auditoria_dados_falhas_silenciosas [INFERRED 0.85]

## Communities (27 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (64): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react, FontesReferenciasSection(), ICONES_CATEGORIA, indicadoresEstrategicos (+56 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.08
Nodes (60): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, Arquitetura SPA sem backend, somente leitura, Mapas PtiMap e SideMap (Leaflet), Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro), leaflet, react-leaflet (+52 more)

### Community 2 - "RelatorioCadeias.jsx"
Cohesion: 0.10
Nodes (45): [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, react-router-dom, react-to-print, ProportionBarChart(), formatTerritoryName(), StackedBarChart(), cleanIes() (+37 more)

### Community 3 - "RelatorioPage.jsx"
Cohesion: 0.18
Nodes (20): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, MUN_LOOKUP, classificarInstituicao(), expandirNomeEntidade(), extractSigla(), filterCursos(), fixWeirdCapitalization() (+12 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, clsx, @dnd-kit/core, @dnd-kit/modifiers, @dnd-kit/sortable, @dnd-kit/utilities, @fontsource-variable/plus-jakarta-sans, framer-motion (+20 more)

### Community 5 - "package.json"
Cohesion: 0.09
Nodes (23): description, name, notes, tailwind, topojson, type, version, autoprefixer (+15 more)

### Community 6 - "generateJson.mjs"
Cohesion: 0.06
Nodes (37): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula) (+29 more)

### Community 7 - "App.jsx"
Cohesion: 0.12
Nodes (24): react-joyride, AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel (+16 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.14
Nodes (20): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes (+12 more)

### Community 9 - "devDependencies"
Cohesion: 0.09
Nodes (20): devDependencies, autoprefixer, mapshaper, playwright, postcss, sharp, tailwindcss, vite (+12 more)

### Community 10 - "simplify-topojson.mjs"
Cohesion: 0.14
Nodes (10): mapshaper, __dirname, __filename, ROOT, TARGET_FILE, __dirname, __filename, OUTPUT_DIR (+2 more)

### Community 11 - "testReactToPrintComparison.mjs"
Cohesion: 0.18
Nodes (3): playwright, launchChromium(), test()

### Community 12 - "DataContext.jsx"
Cohesion: 0.15
Nodes (17): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado (+9 more)

### Community 13 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.18
Nodes (19): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Dados estaticos versionados e consistencia dupla, Glossario (IFDM, CT&I, PTI, EAD, RLS) (+11 more)

### Community 14 - "exportReportClient.js"
Cohesion: 0.16
Nodes (18): Filtro do Semiarido (278 municipios), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils, html2canvas, jspdf, captureDomElement(), captureReportViaIframe() (+10 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "DashboardPainel.jsx"
Cohesion: 0.16
Nodes (12): DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), SEMIARIDO_MUNICIPIOS_NORMALIZADOS, DURATIONS, EASINGS, fadeIn (+4 more)

### Community 18 - "useChartTheme"
Cohesion: 0.23
Nodes (9): [Media] lib/format.js nao usado (~38 formatacoes manuais), recharts, DARK_CHART_PALETTE, LIGHT_CHART_PALETTE, useChartTheme(), CustomPieChart(), DonutChart(), normalizeSimple() (+1 more)

### Community 19 - "RelatorioPage.jsx"
Cohesion: 0.10
Nodes (12): [Alta] /admin e mock publico (CRUD em useState, sem auth), [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), Pagina /admin (maquete sem autenticacao), keep-alive: manter Supabase ativo, AdminPage(), INITIAL_ATIVOS, cleanIes() (+4 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "CadeiaPage.jsx"
Cohesion: 0.33
Nodes (11): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+3 more)

### Community 22 - "[Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas"
Cohesion: 0.22
Nodes (8): [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, Acessibilidade e micro-interacoes, Pendencias e Excecoes de Redesign, Exportacoes com tema claro forcado, QA final: 48 screenshots Playwright, foco visivel, reduced-motion, CardLista()

### Community 24 - "exportarDados.mjs"
Cohesion: 0.29
Nodes (6): exportarDados.mjs (placeholder), Scripts do repositorio, xlsx, __dirname, __filename, projectRoot

### Community 25 - "optimize-images.mjs"
Cohesion: 0.29
Nodes (7): sharp, __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT

### Community 26 - "supabase.js"
Cohesion: 0.29
Nodes (7): [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, Variaveis de ambiente, README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), @supabase/supabase-js, supabase

## Ambiguous Edges - Review These
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **14 isolated node(s):** `autoprefixer`, `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 195 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioCadeias.jsx`, `package.json`, `generateJson.mjs`, `App.jsx`, `DataContext.jsx`, `AtivosPage.jsx`, `DashboardPainel.jsx`, `useChartTheme`, `RelatorioPage.jsx`, `CadeiaPage.jsx`, `[Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `@dnd-kit/core`, `@dnd-kit/modifiers` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08376068376068375 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07960014809329878 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._