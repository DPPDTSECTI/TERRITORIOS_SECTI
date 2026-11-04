# Graph Report - TERRITORIOS_SECTI  (2026-11-04)

## Corpus Check
- 117 files · ~168,550 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .xml 1)

## Summary
- 639 nodes · 1982 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Paginas e UI base
- Mapas Leaflet e tema
- Dashboard e Semiarido
- Relatorios e normalizacao
- Deps de UI (dnd-kit)
- Build e package.json
- Design System
- App, rotas e Sidebar
- Auditoria: exportacao PDF/PNG
- Deps de dev e scripts npm
- Scripts de ingestao
- Scripts de teste de export
- Dados Supabase (docs e achados)
- SISTEMA.md e main.jsx
- Dados estaticos e referencias
- generateJson (legado)
- capture-redesign
- DataContext e seguranca
- Auditoria: Paginas e UI
- CadeiaPage e referencias
- Vercel e API de export
- optimize-images
- Arquitetura SPA

## God Nodes (most connected - your core abstractions)
1. `react` - 53 edges
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
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Riscos do pipeline de exportacao PDF/PNG** — docs_auditoria_seg_export_anonimos, docs_auditoria_seg_ssrf_baseurl, docs_auditoria_rel_timeouts_playwright, docs_sistema_relatorios_exportacao [INFERRED 0.85]
- **Fluxo de carga e cache de dados do Supabase** — docs_sistema_datacontext, docs_ingestao_de_dados_carga_supabase, docs_sistema_cache_localstorage, docs_ingestao_de_dados_limites_paginacao, docs_auditoria_dados_falhas_silenciosas [INFERRED 0.85]
- **Excecoes de cor hex fora dos tokens do design system** — docs_redesign_pending_excecoes_leaflet_svg, docs_redesign_pending_fallbacks_corhex, docs_redesign_pending_terceiros_joyride, docs_design_system_mapa_coropletico [INFERRED 0.75]

## Communities (24 total, 1 thin omitted)

### Community 0 - "Paginas e UI base"
Cohesion: 0.07
Nodes (73): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react, AdminPage(), getBadgeVariant(), INITIAL_ATIVOS (+65 more)

### Community 1 - "Mapas Leaflet e tema"
Cohesion: 0.08
Nodes (60): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, Pendencias e Excecoes de Redesign (+52 more)

### Community 2 - "Dashboard e Semiarido"
Cohesion: 0.07
Nodes (58): [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, react-router-dom, react-to-print, DashboardPainel(), MUN_LOOKUP (+50 more)

### Community 3 - "Relatorios e normalizacao"
Cohesion: 0.08
Nodes (47): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, Exportacoes com tema claro forcado, Utilitarios src/utils, html2canvas, jspdf, vitest (+39 more)

### Community 4 - "Deps de UI (dnd-kit)"
Cohesion: 0.07
Nodes (28): dependencies, clsx, @dnd-kit/core, @dnd-kit/modifiers, @dnd-kit/sortable, @dnd-kit/utilities, @fontsource-variable/plus-jakarta-sans, framer-motion (+20 more)

### Community 5 - "Build e package.json"
Cohesion: 0.08
Nodes (25): description, name, notes, tailwind, topojson, type, version, autoprefixer (+17 more)

### Community 6 - "Design System"
Cohesion: 0.10
Nodes (21): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Contraste text-muted e KPI ambar abaixo de AA, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Design System SECTI Territorios (Bento Grid), Acessibilidade e micro-interacoes, Badges semanticos de status (+13 more)

### Community 7 - "App, rotas e Sidebar"
Cohesion: 0.16
Nodes (24): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, GlobalScroll() (+16 more)

### Community 8 - "Auditoria: exportacao PDF/PNG"
Cohesion: 0.18
Nodes (16): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist (+8 more)

### Community 9 - "Deps de dev e scripts npm"
Cohesion: 0.09
Nodes (20): devDependencies, autoprefixer, mapshaper, playwright, postcss, sharp, tailwindcss, vite (+12 more)

### Community 10 - "Scripts de ingestao"
Cohesion: 0.13
Nodes (12): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, mapshaper, xlsx, __dirname, __filename, projectRoot (+4 more)

### Community 11 - "Scripts de teste de export"
Cohesion: 0.12
Nodes (8): playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 12 - "Dados Supabase (docs e achados)"
Cohesion: 0.22
Nodes (15): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio (+7 more)

### Community 13 - "SISTEMA.md e main.jsx"
Cohesion: 0.15
Nodes (10): Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, SISTEMA.md Documentacao do Sistema, Deploy Vercel (cron, headers, rewrites), Pontos de atencao conhecidos (10 itens), README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), @fontsource-variable/plus-jakarta-sans (+2 more)

### Community 14 - "Dados estaticos e referencias"
Cohesion: 0.18
Nodes (11): Dados estaticos versionados e consistencia dupla, Normalizacao de nomes (normalize), Dados estaticos embutidos, ASSET_DARK_THEME_COLORS, ASSET_THEME_COLORS, TIPOS_ATIVOS_CATALOG, MUNICIPIOS_COORDS, CATEGORIAS_REFERENCIAS (+3 more)

### Community 15 - "generateJson (legado)"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 16 - "capture-redesign"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "DataContext e seguranca"
Cohesion: 0.29
Nodes (8): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), Variaveis de ambiente, keep-alive: manter Supabase ativo, @supabase/supabase-js, supabase

### Community 18 - "Auditoria: Paginas e UI"
Cohesion: 0.20
Nodes (12): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] /admin e mock publico (CRUD em useState, sem auth), [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, Auditoria: secao Paginas e UI, Pagina /admin (maquete sem autenticacao) (+4 more)

### Community 19 - "CadeiaPage e referencias"
Cohesion: 0.33
Nodes (11): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+3 more)

### Community 20 - "Vercel e API de export"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "optimize-images"
Cohesion: 0.25
Nodes (7): sharp, __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT

### Community 22 - "Arquitetura SPA"
Cohesion: 0.40
Nodes (5): Arquitetura SPA sem backend, somente leitura, Tabelas/views consumidas (12 consultas paralelas), DataContext / DataProvider (carga e derivacao), Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro)

## Ambiguous Edges - Review These
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to

## Knowledge Gaps
- **151 isolated node(s):** `name`, `version`, `type`, `description`, `dev` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 185 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `Paginas e UI base` to `Mapas Leaflet e tema`, `Dashboard e Semiarido`, `Relatorios e normalizacao`, `Build e package.json`, `App, rotas e Sidebar`, `SISTEMA.md e main.jsx`, `DataContext e seguranca`, `CadeiaPage e referencias`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Paginas e UI base` be split into smaller, more focused modules?**
  _Cohesion score 0.06738084148424157 - nodes in this community are weakly interconnected._
- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `Deps de UI (dnd-kit)` to `Build e package.json`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `Mapas Leaflet e tema` be split into smaller, more focused modules?**
  _Cohesion score 0.07684210526315789 - nodes in this community are weakly interconnected._