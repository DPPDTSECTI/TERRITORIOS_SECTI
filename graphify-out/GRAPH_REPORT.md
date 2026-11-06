# Graph Report - TERRITORIOS_SECTI  (2026-11-06)

## Corpus Check
- 107 files · ~144,907 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 666 nodes · 1996 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bee59dae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioCadeias.jsx
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- dependencies
- package.json
- App.jsx
- supabase.js
- captureReports.mjs
- devDependencies
- simplify-topojson.mjs
- testReactToPrintComparison.mjs
- RelatorioPage.jsx
- SISTEMA.md Documentacao do Sistema
- capture-redesign.mjs
- generateJson.mjs
- RelatorioPage.jsx
- vercel.json
- optimize-images.mjs
- CadeiaPage.jsx

## God Nodes (most connected - your core abstractions)
1. `react` - 54 edges
2. `cn()` - 47 edges
3. `useTheme()` - 36 edges
4. `SideMap()` - 35 edges
5. `lucide-react` - 34 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `normalize()` - 24 edges
10. `CadeiaPage()` - 21 edges

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

## Communities (21 total, 1 thin omitted)

### Community 0 - "react"
Cohesion: 0.09
Nodes (61): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, framer-motion, react, FontesReferenciasSection(), ICONES_CATEGORIA, indicadoresEstrategicos, LandingHero(), modulosPlataforma (+53 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.10
Nodes (46): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, Mapa coropletico da Bahia (escala de azuis), leaflet, react-leaflet, topojson-client, buildTopologiaPayload(), getCachedBahiaTopologia() (+38 more)

### Community 2 - "RelatorioCadeias.jsx"
Cohesion: 0.07
Nodes (59): [Alta] ~25% de codigo identico nos 4 relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom, react-to-print, formatTerritoryName(), StackedBarChart(), GEOGRAPHICAL_ORDER (+51 more)

### Community 3 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.18
Nodes (18): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio (+10 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, clsx, @dnd-kit/core, @dnd-kit/modifiers, @dnd-kit/sortable, @dnd-kit/utilities, @fontsource-variable/plus-jakarta-sans, framer-motion (+20 more)

### Community 5 - "package.json"
Cohesion: 0.09
Nodes (23): description, name, notes, tailwind, topojson, type, version, autoprefixer (+15 more)

### Community 6 - "App.jsx"
Cohesion: 0.06
Nodes (49): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, Design System SECTI Territorios (Bento Grid) (+41 more)

### Community 7 - "supabase.js"
Cohesion: 0.25
Nodes (8): [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, Arquitetura SPA sem backend, somente leitura, Variaveis de ambiente, Mapas PtiMap e SideMap (Leaflet), Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro), @supabase/supabase-js, supabase

### Community 8 - "captureReports.mjs"
Cohesion: 0.13
Nodes (21): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes (+13 more)

### Community 9 - "devDependencies"
Cohesion: 0.09
Nodes (20): devDependencies, autoprefixer, mapshaper, playwright, postcss, sharp, tailwindcss, vite (+12 more)

### Community 10 - "simplify-topojson.mjs"
Cohesion: 0.20
Nodes (8): README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), mapshaper, __dirname, __filename, ROOT, TARGET_FILE

### Community 11 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (8): playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.17
Nodes (21): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, MUN_LOOKUP, MUN_LOOKUP, classificarInstituicao(), expandirNomeEntidade(), extractSigla(), filterCursos() (+13 more)

### Community 13 - "SISTEMA.md Documentacao do Sistema"
Cohesion: 0.13
Nodes (12): Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema, Deploy Vercel (cron, headers, rewrites), keep-alive: manter Supabase ativo, Pontos de atencao conhecidos (10 itens) (+4 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 19 - "RelatorioPage.jsx"
Cohesion: 0.06
Nodes (30): [Alta] /admin e mock publico (CRUD em useState, sem auth), Visualizacao: graficos Recharts/SVG, Pagina /admin (maquete sem autenticacao), Filtro do Semiarido (278 municipios), Componentes de graficos (components/graph), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils (+22 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 22 - "optimize-images.mjs"
Cohesion: 0.14
Nodes (13): exportarDados.mjs (placeholder), Scripts do repositorio, sharp, xlsx, __dirname, __filename, projectRoot, __dirname (+5 more)

### Community 25 - "CadeiaPage.jsx"
Cohesion: 0.06
Nodes (50): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo (+42 more)

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **14 isolated node(s):** `autoprefixer`, `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 198 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioCadeias.jsx`, `package.json`, `App.jsx`, `SISTEMA.md Documentacao do Sistema`, `RelatorioPage.jsx`, `CadeiaPage.jsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **What connects `autoprefixer`, `@dnd-kit/core`, `@dnd-kit/modifiers` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08580593424218123 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10064935064935066 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._