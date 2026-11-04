# Auditoria do repositório — achados por área

Resumo compacto dos achados dos subagentes de análise. Cada seção é escrita pelo agente da área.
Formato: `- [Sev] problema — arquivo:linha — correção sugerida`. Severidades: Alta, Média, Baixa.
Relatórios completos (detalhe e evidências) ficam no scratchpad de cada agente; aqui só o que é acionável.
Documento-base: [SISTEMA.md](./SISTEMA.md). Itens abaixo que contradizem o SISTEMA.md prevalecem (verificar antes de corrigir a doc).


## Evolução entre branches
**Estado**
- História linear: dev (e636d4c, 07/2026) -> main local (56b901d) -> origin/main (0b5815a) -> redesign = joão (daa4c4e, 2 commits à frente de origin/main).
- origin/main x redesign: 2 commits, package.json/vercel.json/vite.config.js idênticos; fast-forward sem conflito.
- main LOCAL obsoleta: 29 commits atrás de redesign. Sem tags. V2/api_test/interface-test/newinterface/new/dev não existem mais como refs.
- Saltos: dev->main = SharePoint/Netlify/IndexedDB -> Supabase/Vercel (vite.config 548 -> 101 linhas); main->origin/main = design system (components/ui, /__ui) + export Vercel (api/export-pdf|png).

**Perdido na redesign (e o que voltar exigiria)**
- Filtro IFDM min/max (ifdmMin/ifdmMax no App.jsx da dev): reimplementar sobre DataContext + filtering.js.
- PWA/offline (public/sw.js, clear-sw.html, idb-keyval): recriar sw.js; hoje main.jsx registra /sw.js inexistente (código morto).
- Ingestão SharePoint/Excel ao vivo (Netlify Functions, cron 30 min): só com novo ETL para Supabase; dados.json é marcador "pendente".
- ConectaMap SVG com d3-force (rótulos sem colisão) e ModoExpandido (listas lado a lado): reescrever; recuperar via git show e636d4c:ConectaMap.jsx.
- PDF ABNT retrato (utils/pdfReportService.js) e ExcelExportButton: substituídos por relatórios 16:9; restaurar via git show da dev + jspdf.

**Acionável**
- Criar tags antes de limpar: v0-dev-sharepoint (e636d4c), v1-supabase-vercel (56b901d), v2-redesign (daa4c4e).
- Rodar npm run build e npm test; depois git merge --ff-only origin/redesign em main e push (rev-list --left-right --count origin/main...origin/redesign deve dar 0 2).
- Remover bloco de registro do sw.js em main.jsx (ou restaurar o SW).
- Apagar origin/vercel/install-vercel-web-analytics-7rrggp (analytics já em main; confirmar <Analytics/> no App.jsx).
- Tirar URLs pessoais do SharePoint de scripts/ e PDFs/PNGs binários de scripts/.
- docs/SISTEMA.md desatualizada (Playwright "só dev", fontes Roboto/Righteous).

## Segurança
- [Alta] /api/export-pdf e /api/export-png anônimos, sem rate limit nem cache (Chromium 1 GB, até 60 s por GET) — api/export-pdf.js:6-8, api/export-png.js:6-8, vercel.json:55-60 — exigir token/HMAC, rate limit (WAF Vercel), s-maxage nos GET e validar `territorio` contra lista fechada
- [Alta] baseUrl do Chromium montado com x-forwarded-host/proto sem allowlist (SSRF; erro 500 devolve até 300 chars da página) — api/export-pdf.js:36-41, api/export-png.js:32-37, scripts/captureReports.mjs:83,112-116 — fixar origem por env (PUBLIC_BASE_URL), validar origin antes de page.goto, bloquear requisições a hosts fora da allowlist
- [Média] RLS do Supabase não versionada; chave publishable do .env.example é a de produção; views podem ignorar RLS — src/services/supabase.js:3-9, .env.example:1-2 — conferir pg_policies, revogar INSERT/UPDATE/DELETE de anon, security_invoker nas views, versionar em supabase/migrations
- [Média] npm audit --omit=dev: 17 vulns (1 crítica, 6 altas); dompurify/fflate (via jspdf) e react-router 7.17.0 têm fix — package.json — `npm audit fix` e react-router-dom >= 7.18.2
- [Média] xlsx 0.18.5 sem fix no npm (prototype pollution, ReDoS); só afeta parse, feito em scripts offline — scripts/generateJson.mjs:151,155, scripts/exportarDados.mjs:47 — trocar para tarball oficial SheetJS 0.20.x ou exceljs; no front só escrita (RelatorioPage.jsx:20)
- [Média] Sem CSP, HSTS explícito e Permissions-Policy; X-XSS-Protection obsoleto — vercel.json:15-24 — adicionar CSP em Report-Only (hash do script inline de index.html:13-27, supabase, arcgisonline, frame-ancestors 'self'), HSTS, Permissions-Policy, X-XSS-Protection: 0
- [Média] type/modo/theme crus em Content-Disposition (injeta parâmetros; erro só após rodar o Chromium) — api/export-png.js:29,47, api/export-pdf.js:33,51 — normalizar para valores fixos e responder 400 antes de lançar o Chromium
- [Baixa] /api/keep-alive abre (fail-open) se CRON_SECRET não existir e devolve error.message — api/keep-alive.js:4-7,23-24 — `if (!secret || auth !== ...)` + timingSafeEqual; definir CRON_SECRET em Production
- [Baixa] /admin sem autenticação; hoje só estado em memória (não grava), mas exibe "Sincronizado/Base Oficial" — src/App.jsx:142, src/components/AdminPage.jsx:124-179,228-239 — ocultar fora de DEV ou rotular "demonstração"; antes de ligar ao Supabase: Auth + RLS de escrita por papel
- [Baixa] Erros detalhados (URL, texto da página) devolvidos ao cliente — api/export-pdf.js:55, api/export-png.js:51, scripts/captureReports.mjs:115 — resposta genérica, detalhe só em console.error
- [Baixa] cache immutable de 1 ano em /(.*)\.js|css e rewrite devolve index.html para /assets/* inexistente; /sw.js registrado mas inexistente — vercel.json:31-42,69-74, src/main.jsx:26-28 — limitar immutable a /assets/, excluir assets/ do rewrite, criar ou remover sw.js
- [Baixa] postMessage com '*' e listener sem checar origin (payload não sensível) — src/components/pdf/RelatorioAnalise.jsx:109, src/components/RelatorioPage.jsx:167-178 — usar window.location.origin e checar e.origin
- [Baixa] Middleware de export do Vite: theme não normalizado vai ao nome do arquivo (path traversal de escrita só em dev), Host aceito do cliente, server.host:true — vite.config.js:36,60-64,109, scripts/captureReports.mjs:208,233 — normalizar theme/modo/type, fixar baseUrl, server.host só quando necessário
- [Baixa] localStorage.getItem fora de try/catch; index.html com yourdomain.com (canonical/og/JSON-LD) — src/context/DataContext.jsx:47, index.html:36-65 — envolver em try/catch e trocar pelo domínio real
- [Baixa] @sparticuz/chromium 153 exige Node ^22.17 ou >=24 e package.json não define engines; playwright dev 1.62.1 vs playwright-core 1.63.0 — package.json — fixar engines/runtime Vercel e alinhar versões
- NÃO verificado: políticas RLS/permissões no painel Supabase; se a Vercel sobrescreve x-forwarded-host/proto vindos do cliente (A2 é condicional a isso); HSTS padrão da Vercel; CRON_SECRET configurado na Vercel
- NÃO verificado: nenhuma requisição externa ou exploração foi feita (análise estática); vetor file:// via x-forwarded-proto é teórico; destino de navigate/Link em react-router não auditado por completo; binários do git sem varredura de segredos
- Histórico git: sem service_role/sb_secret/JWT em texto; .env nunca rastreado (só .env.example)

## Relatórios e exportação
- [Alta] Endpoints de PDF/PNG anônimos, sem rate limit nem cache (Chromium 1 GB, 60 s por GET) — api/export-pdf.js:6, api/export-png.js:6, vercel.json:56 — Cache-Control s-maxage, rate limit por IP, unificar em um endpoint
- [Alta] Timeouts do Playwright somam >210 s contra maxDuration de 60 s; KPIs podem sair com "..." — scripts/captureReports.mjs:87-143, vercel.json:5 — reduzir timeouts a <55 s e falhar em vez de capturar dados incompletos
- [Alta] baseUrl do Chromium vem dos headers Host/x-forwarded-host, sem allowlist (SSRF) — api/export-pdf.js:36, api/export-png.js:32 — usar EXPORT_BASE_URL ou VERCEL_URL
- [Alta] enrichedCadeias (~150 linhas) copiado em 2 telas e 3ª versão divergente; KPIs diferem entre painel, 16:9 e A4 — RelatorioPage.jsx:276, RelatorioCadeias.jsx:224, RelatorioAnalise.jsx:172 — extrair utils/reportData.js único
- [Alta] ~25% de código idêntico nos 4 relatórios (halo, header, KPIs, print) — pdf/RelatorioSintese.jsx:259-442 (e equivalentes) — extrair ReportShell + useReportScope
- [Média] PDF 16:9 é imagem raster 5760x3240 dentro de jsPDF (sem texto selecionável) — scripts/captureReports.mjs:199-229 — usar page.pdf({preferCSSPageSize,printBackground})
- [Média] territorio sem validação (qualquer string gera relatório estadual) — api/export-pdf.js:14, api/export-png.js:14 — validar com ^(bahia|\d{1,3})$
- [Média] theme cru vira nome de arquivo e escreve fora da raiz (path traversal, host:true expõe na rede) — vite.config.js:36-70, captureReports.mjs:206 — whitelist light|dark e não passar pdfPath/pngPath
- [Média] ?theme= da URL é gravado no localStorage compartilhado; exportar reseta o tema do usuário — context/ThemeContext.jsx:12-39, RelatorioPage.jsx:993,1013 — não persistir em modo exportação (?export=1)
- [Média] Possível laço de impressão no autoPrint (handlePrint instável + setIsPrinting re-agenda o efeito) — RelatorioSintese.jsx:70, RelatorioAtivos.jsx:199, RelatorioEnsino.jsx:141, RelatorioCadeias.jsx:197 — guardar flag em useRef, imprimir uma vez
- [Média] A4: @page margin 0 faz páginas 2+ colarem na borda; sem número de página — RelatorioAnalise.jsx:459-494 — @page margin 12mm 10mm 15mm e counter(page)
- [Média] xlsx importado estático entra no chunk inicial do painel (~400 KB) — RelatorioPage.jsx:20 — await import('xlsx') dentro de handleExportExcel
- [Média] Código morto: clientExport.js, ExportPdfButton.jsx, downloadCanvasAsPdf, exportReportAsPdf, reportAggregation.js (502 linhas) sem uso — src/utils/clientExport.js, src/components/pdf/ExportPdfButton.jsx, src/utils/exportReportClient.js:205,498 — remover (ou usar reportAggregation nas telas)
- [Média] html2canvas+jsPDF+react-to-print (~35 MB) só para fallbacks; monkey-patch global de CanvasGradient — src/utils/exportReportClient.js:1-57, reportPrint.js — remover após endpoint estável
- [Média] playwright (devDep) duplica playwright-core (1.62 e 1.63); versões de @sparticuz/chromium 153 e playwright-core 1.63 não verificadas como par — package.json:19,30,51 — remover playwright e alinhar versões
- [Média] Lógica de rota/nome de arquivo repetida 6x — api/export-pdf.js:14, api/export-png.js:14, vite.config.js:38, RelatorioPage.jsx:933,1054, exportReportClient.js:424 — tabela única REPORT_TYPES
- [Média] 2,29 MB de PDF/PNG versionados em scripts/; .gitignore ineficaz (caminho errado e já rastreados) — scripts/print_*.pdf, scripts/*_view.png, .gitignore — git rm --cached e corrigir ignore
- [Média] Scripts órfãos/quebrados fora de package.json (test_html2canvas importa arquivo inexistente; testReactToPrintComparison busca botão inexistente) — scripts/test_html2canvas.mjs:16, scripts/testReactToPrintComparison.mjs — apagar ou migrar para @playwright/test
- [Baixa] Middleware Vite duplica a lógica das funções serverless — vite.config.js:16-94 — usar vercel dev ou proxy
- [Baixa] keep-alive com URL/chave hardcoded e público se CRON_SECRET ausente — api/keep-alive.js:4-11 — falhar fechado sem CRON_SECRET e ler de env
- [Baixa] Content-Disposition usa type/modo/theme crus — api/export-pdf.js:33,51, api/export-png.js:29 — montar nome com valores normalizados
- [Baixa] postMessage com '*' e sem checar origin — RelatorioPage.jsx:169-178, RelatorioAnalise.jsx:109 — validar e.origin === location.origin
- [Baixa] Escape quebrado (.print\:hidden vira .print:hidden) — RelatorioAnalise.jsx:486 — usar \:
- [Baixa] @media print global do index.css força 1920x1080 e conflita com reportPrint/Analise (3 fontes de CSS) — src/index.css:716-745, reportPrint.js:69 — escopar a .print-report e consolidar
- [Baixa] Tema escuro suportado na API mas inacessível na UI (theme=light fixo) — RelatorioPage.jsx:950,1013,1063 — expor opção ou remover dark da API
- [Baixa] "Heatmap PNG" é o mesmo PNG de cursos — RelatorioPage.jsx:1180 — remover o item
- [Baixa] Variáveis/memos mortos e console.log: ativosPorTipo, cadeiasPorTipo, cursosPorModalidade, isDark, eadCursos inexistente — RelatorioPage.jsx:120,123,1198-1224 — apagar
- [Baixa] munAtendidos mistura chaves (id_municipio vs nome) e pode contar município duas vezes — RelatorioPage.jsx:509, RelatorioSintese.jsx:168, RelatorioAnalise.jsx:309 — usar id_municipio único
- [Baixa] getTipoCadeiaConfig diverge entre painel e relatório (exige ig/indica/geogr vs ig/indica) — RelatorioPage.jsx:93, RelatorioCadeias.jsx:130 — unificar em util
- [Baixa] exportMenuItems useMemo sem deps dos handlers — RelatorioPage.jsx:1126-1195 — completar deps ou remover useMemo
- [Baixa] exports.test.js testa barrel de UI, não exportação; export de relatório sem testes — src/__tests__/ui/exports.test.js — renomear e testar reportData/api
- [Baixa] xlsx 0.18.5 com CVEs no npm (uso só de escrita) — package.json — migrar para exceljs ou build oficial SheetJS

## Dados

- [Alta] Falhas de consulta silenciosas, sem estado de erro e resultado parcial cacheado 10 min — src/context/DataContext.jsx:106-112,182-201,214-218,261-283 — expor `error` por tabela, não gravar cache se houver erro, banner com retry, usar cache expirado como contingência
- [Alta] `.range(0,3000|4999|1000)` sem `order` nem `count` pode truncar (limite 1000 do PostgREST) e corromper EAD e `qtd_cursos_cti` — DataContext.jsx:93-103,115-133 — paginar de 1000 em 1000 com `order('id')` ou mover o join para view
- [Alta] `classificarInstituicao` erra: UNILAB vira privada, "Comunitária" casa 'nit' (vira cti), `espacoDinamizadores` cai em privada (typo `espacoDinamizadoress`) — src/utils/normalization.js:156-157,170-174 (e reportAggregation.js:411,458) — usar `\bnit\b`, default `null` em vez de privada, corrigir o typo, testes de tabela
- [Alta] `isMunicipioSemiarido('Xique-Xique')` retorna false (correção 'xique xique'→'xiquexique' não bate com o Set) — src/constants/semiarido.js:304-313 — remover a correção, normalizar o Set pelo mesmo pipeline, teste "todos os 278 passam"
- [Alta] reportAggregation.js (502 linhas) e `fixWeirdCapitalization`/`expandirNomeEntidade`/`sortAlpha`/`filterCursos` só são usados por testes — src/utils/reportAggregation.js, normalization.js:33,48,93,100 — ligar os componentes ao módulo ou apagar módulo e testes
- [Média] `localStorage.getItem` fora de try/catch deixa `loadingStats` true para sempre se o storage estiver bloqueado — DataContext.jsx:47 — envolver em try/catch
- [Média] Chave Supabase e URL reais no `.env.example` e como fallback hardcoded (build sem `.env` fala com produção); sem schema/RLS versionado — src/services/supabase.js:3-4, .env.example:1-2, api/keep-alive.js:10-11 — placeholders, falhar sem variável, versionar `supabase/schema.sql` com policies só SELECT, `persistSession:false`
- [Média] Links SharePoint de contas funcionais commitados e colunas financeiras removidas por denylist (o resto vai para `public/`) — scripts/generateJson.mjs:13-14,16-30,89-92, scripts/exportarDados.mjs:24 — allowlist de colunas, URL por variável de ambiente, rotacionar links
- [Média] generateJson.mjs importa `./generateTerritoryFiles.mjs` inexistente (ERR_MODULE_NOT_FOUND); exportarDados.mjs só grava marcador; não há ETL para o Supabase — scripts/generateJson.mjs:6,171-173, scripts/exportarDados.mjs:61-65, package.json — remover ou consertar os scripts e os 2 comandos duplicados
- [Média] `getTextoReferencia` devolve texto errado (URL repetida usa `.find`; fallback por `includes` bidirecional) — src/data/referenciasDB.js:810-826, DataContext.jsx:157-163, CadeiaPage.jsx:336 — chave por `id`/slug e match exato por entidade normalizada
- [Média] Dados estáticos inconsistentes: Ibirapuã/Lafaiete Coutinho sem coordenada (grafia difere), coords em 3 variantes por município (1.025 chaves), `municipios_bahia.json` órfão, contagens de `FONTES_METADADOS` digitadas, "218 municípios" vs 278 — src/data/municipiosCoords.js, municipios_bahia.json, referenciasDB.js:10-12,788 — tabela única por `id_municipio` IBGE, derivar contagens, corrigir texto
- [Média] Duas fontes de verdade (semiárido hardcoded vs `pct_semiarido` do banco; `tipo_ativos`/`tipo_cursos`/`tipo_cadeia` buscados e nunca usados; cor 'privada' diverge de index.css:134) — DataContext.jsx:98-100, assetTypes.js:19, DashboardPainel.jsx:168,383 — eleger uma fonte, remover as 3 consultas mortas, teste de integridade
- [Média] ≥8 cópias de `normalizeName`, `MUN_LOOKUP` em 5 arquivos, tabela de correções de grafia 2x, `isCursoEad` sem uso — DashboardPainel.jsx:24, AtivosPage.jsx:47, CadeiaPage.jsx:67, mapGeoUtils.js:11-26, semiarido.js:309-315, CursosPage.jsx:120-127 — módulo único de normalização e lookup
- [Média] Sem validação nem tipos nas fronteiras: `select('*')`, aliases `a||b||c` (território, município, lat/lng), `media_ifdm` string, `ifdmMedio` 0|string — DataContext.jsx:92-103,136-140,252-256 — camada DTO→domínio única (zod ou TS), migrar primeiro lib/constants/utils/context
- [Média] Testes não cobrem o risco real (nenhum para DataContext, semiarido, getTextoReferencia, assetTypes; sem config vitest/jsdom) — __tests__/, vite.config.js — testes de tabela e DataContext com Supabase mockado
- [Média] Docs divergem do código: SISTEMA.md:148 (api/ tem export-pdf/png), :139 (reportAggregation "em uso"), INGESTAO-DE-DADOS.md:46,59-61,72,203 (logs 6/12, tipo_* usados, EAD) — docs/SISTEMA.md, docs/INGESTAO-DE-DADOS.md — atualizar conforme o código
- [Baixa] `getDynamicAssetTypeConfig` acoplado a índices, sem normalizar acento, `includes('ict')` casa "distrito"; desconhecido cai em "Pesquisa" — src/constants/assetTypes.js:230-243 — buscar por chave, normalizar texto, match por palavra
- [Baixa] `extractSigla`/`expandirNomeEntidade` com falso positivo (Faculdade Santa Cruz de Eunápolis→UESC) e termo camelCase que nunca casa — normalization.js:52,62-66,129 — match por palavra inteira, termos em minúsculo
- [Baixa] Heurística `distCadeias.length > 88` e chave de cache `_v14_` incrementada à mão, sem stale-while-revalidate — DataContext.jsx:7,8,54 — versionar por hash do schema, revalidar em segundo plano
- [Baixa] Provider recria `value` a cada render e mistura 14 `useState` (dados + UI); StrictMode dobra 24 consultas sem AbortController — DataContext.jsx:44-222,262, main.jsx:19 — `useMemo` no value, separar contexto de UI, cancelar no cleanup
- [Baixa] `?modo=normal` não sobrescreve `secti-semiarido` do localStorage (relatório exportado sai filtrado) — DataContext.jsx:29-32 — forçar `false` quando `modo=normal`
- [Baixa] O(n*m) com `includes`/`find` dentro de loops — DashboardPainel.jsx:391-398 — usar Set/Map
- [Baixa] Resíduos: `?? false` morto, `matchesFilters:true` constante, variável sem uso, comentário "wait...", `.range` duplicado — DataContext.jsx:120,227, reportAggregation.js:106,181-185,215 — remover
- [Baixa] `DataContext` importa referenciasDB (830 linhas) no chunk principal só como fallback; `xlsx@^0.18.5` estático com avisos conhecidos — DataContext.jsx:3, RelatorioPage.jsx:20 — import dinâmico, rodar `npm audit`

## Mapas
- [Alta] Limites de zoom/maxBounds do MapContainer não mudam ao alternar "Geográfico" (react-leaflet só lê opções na criação) — SideMap.jsx:1196-1215, PtiMap.jsx:738-757 — `key` com modoGeografico ou setMaxZoom/setMaxBounds em controller
- [Alta] Falha ao carregar o TopoJSON deixa spinner infinito (PtiMap) ou mapa sem território (SideMap), sem erro/retry — PtiMap.jsx:195-198,720; SideMap.jsx:139; bahiaTopologiaCache.js:197 — estado error + botão "tentar de novo", checar resp.ok, usar BASE_URL
- [Alta] Tiles Esri/ArcGIS sem atribuição (licença) — SideMap.jsx:1243-1267, PtiMap.jsx:772-797 — reativar attribution e confirmar licença Esri
- [Média] Clique em área vazia sempre dá flyTo na Bahia, inclusive no modo geográfico — MapControllers.jsx:40-45 — só limpar/recentralizar se houver território selecionado
- [Média] className dos estilos é ignorado com preferCanvas; "pointer-events-none" não desativa território não semiárido — SideMap.jsx:709-771, PtiMap.jsx:257-266 — remover classes e controlar interatividade no handler
- [Média] Hover re-renderiza o SideMap inteiro e refaz setStyle (prop style recriada + efeitos + mouseover); malhas com style inline — SideMap.jsx:691,895-924,1296-1359; PtiMap.jsx:815-901 — memoizar estilos, um só caminho de update, hover em filho (perfilar antes)
- [Média] Paleta do tema escuro lê CSS vars no render, antes da classe .dark ser aplicada — mapTheme.js:125-128, ThemeContext.jsx:27-31 — useLayoutEffect ou tokens em constantes
- [Média] findMunicipioCoords com fallback fuzzy (includes) e custo O(1025) por chamada; 2 nomes sem acerto exato (Ibirapuã, Lafaiete Coutinho) — mapGeoUtils.js:78-82 — Map nomeNormalizado→coords e remover fuzzy
- [Média] municipiosCoords repete cada município em 2-3 grafias (44,8 kB p/ 417 pontos) — data/municipiosCoords.js — chave normalizada única (~15 kB)
- [Média] ~247 hex hardcoded e escala de calor triplicada, getMapPalette refeito por feature — SideMap.jsx, PtiMap.jsx, mapIcons.js, mapHeatScale.js:3-49 — tokens únicos e heatLevel() único
- [Média] Duplicação SideMap/PtiMap (tooltip, zoom, toggles, tiles, patch global de Renderer) e formato divergente de selectedTerritory — SideMap.jsx:12-16,654-688,1560-1689; PtiMap.jsx:16-21,421-456,909-1036 — extrair BaseMapShell + isSameTerritory
- [Média] Marcadores: elem/eventHandlers novos a cada render anulam React.memo, Popup montado por marcador, uma Polyline por par na "Teia" — MapMarkersAndPopups.jsx:146,219-243; SideMap.jsx:1366-1380 — memo por id, popup único, Polyline multi-segmento (medir antes)
- [Média] TopoJSON: nome com parênteses/hash, cache 1h+SWR 24h sem versão, simplify-topojson sobrescreve o arquivo e degrada a malha — public/BA_(1)9396399957704198.json, scripts/simplify-topojson.mjs:10,35 — nome versionado e fonte original preservada
- [Média] Mapa sem role/aria-label, toggles sem aria-pressed, features canvas não focáveis, sem prefers-reduced-motion — SideMap.jsx:1182-1191,1451-1470,1560-1619 — aria-label/aria-pressed, seletor de território por teclado
- [Baixa] Código morto: toggleCategory/select/deselectAll, isLayerControlOpen, ZoomDependentTileLayer; efeito que reseta activeCategoryKeys — SideMap.jsx:122,235-256; MapControllers.jsx:5-7 — remover
- [Baixa] SideMap (1717 linhas) e PtiMap (1148) monolíticos; useMemo com efeito colateral — SideMap.jsx:476-652; PtiMap.jsx:697-699 — extrair hooks de estatística/conexões e overlays
- [Baixa] Topologia buscada no import e payload completo construído (~230 ms, main thread) mesmo sem uso — bahiaTopologiaCache.js:8-186,211-214 — getters sob demanda ou Worker
- [Baixa] iconSvg interpolado em divIcon sem sanitizar (hoje só strings estáticas) — mapIcons.js:108-130 — sanitizar se vier de CSV/banco
- [Baixa] Sem CSP e tiles sem crossOrigin (afeta html2canvas no cliente) — vercel.json, utils/exportReportClient.js — CSP com img-src arcgisonline ao adotar
- [Baixa] Cor do selo de cadeia sem isDark; normalizeName duplica semiarido.js — MapMarkersAndPopups.jsx:69-71, mapGeoUtils.js:11-30 — passar isDark, reutilizar normalizeMunicipioName
- Portabilidade: ~1.800-2.000 das ~4.160 linhas são lógica pura (cache, geoUtils, heat, icons, theme) e reaproveitáveis; o resto é JSX/hooks react-leaflet.
- Esforço (estimado): TS incremental 6-10 dias; Leaflet puro + wrapper React 10-15; Vue 15-25; MapLibre 20-30 (não recomendado sem necessidade de WebGL).

## Páginas e UI
- [Alta] /admin é mock público: CRUD só em useState, "Sincronizado" fixo, sem auth — AdminPage.jsx:36-47,124-179,228-239; App.jsx:142 — ocultar atrás de import.meta.env.DEV ou implementar Supabase Auth + RLS + mutações reais
- [Alta] Páginas monolíticas com ~65% de repetição (estimativa): Cursos 2035, Ativos 1676, Cadeia 1629, Relatório 1992 linhas — src/components/*Page.jsx — extrair hooks de filtro, funções puras de agregação e <KpiGrid>/<ExpandedListPanel>/<ProportionPillRow>
- [Alta] ETL e correções de dados hard-coded na UI, com fallback silencioso para Salvador — CadeiaPage.jsx:269-285,313-325; AtivosPage.jsx:208-214 — mover para banco/view e sinalizar "localização aproximada"
- [Alta] Contagens fixas (88 cadeias, 417 municípios) — hero.jsx:213-219; DataContext.jsx:54; DashboardPainel.jsx:455-456 — derivar dos dados
- [Média] div onClick sem role/tabIndex/teclado — CursosPage.jsx:799,1016,1201; AtivosPage.jsx:611,854,1205; CadeiaPage.jsx:955,1179 — usar <button>/Card como elemento semântico
- [Média] Gráficos só reagem a mouseenter, sem teclado/toque/aria — graph/CustomPieChart.jsx:92-143; DonutChart.jsx:98; StackedBarChart.jsx:166-245 — adicionar foco, role="img" e aria-label
- [Média] Tabs/SegmentedControl: setas não movem o foco, sem tabpanel/aria-controls — ui/Tabs.jsx:28-44; ui/SegmentedControl.jsx:33-43 — mover foco ao trocar
- [Média] Dialog com id fixo "dialog-title", sem focus-trap; Esc fecha todos os empilhados; Dropdown sem aria-haspopup — ui/Dialog.jsx:70,102; ui/Dropdown.jsx:95 — useId, trap e restauração de foco
- [Média] Contraste text-muted ≈2,6:1 (claro) e ≈3,7:1 (escuro); KPI âmbar com texto branco ≈2,1-3,2:1 — index.css tokens; DashboardPainel.jsx:626 — escurecer tokens para AA 4,5:1
- [Média] Props inexistentes no DS falham em silêncio (variant="outline"/"brand"/"warning", size="xs", compact) — CursosPage.jsx:1115,768; AtivosPage.jsx:732,756; DashboardPainel.jsx:594 — adicionar variantes ou corrigir chamadas; Chip count e Tabs count não renderizam
- [Média] lib/format.js não é usado por páginas/gráficos (~38 formatações manuais) — DashboardPainel.jsx:419,425,429; RankingBarChart.jsx:219; CustomPieChart.jsx:153,240 — centralizar em formatInt/Decimal/Percent
- [Média] Agregações recalculadas dentro de .map() (O(n²)) — CursosPage.jsx:1343,1454,1540,1659; AtivosPage.jsx:1369,1490,1584; CadeiaPage.jsx:1455,1539 — calcular total 1x no useMemo do ranking
- [Média] enrichedCadeias depende de chartTheme: reprocessa até 5000 linhas ao trocar tema; busca linear por município — CadeiaPage.jsx:397,88-118 — remover dependência, indexar coords em Map
- [Média] Landing re-renderiza a cada 18 ms (typewriter) com SVG de ~14 KB, ignora reduced-motion — hero.jsx:225-237,287 — isolar <Typewriter/>
- [Média] Contextos sem useMemo; DataContext mistura dados e filtros e baixa 12 tabelas em toda rota — ThemeContext.jsx:87; DataContext.jsx:92-103,262 — memoizar value e separar contexto de filtros
- [Média] localStorage sem try/catch derruba o app ou deixa skeleton infinito — ThemeContext.jsx:19,65; DataContext.jsx:47; Sidebar.jsx:27 — helper safeStorage
- [Média] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL — AtivosPage.jsx:80; CursosPage.jsx:141; CadeiaPage.jsx:171 — useSearchParams como fonte única (território já existe no DataContext)
- [Média] ErrorBoundary único exibe error.stack, sem recarregar; sem rota 404 — main.jsx:7-16; App.jsx:135-154 — fallback amigável, boundary por rota e path="*"
- [Média] Service Worker /sw.js removido mas ainda registrado (recebe index.html) — main.jsx:26-39; vercel.json — remover registro e regra de header
- [Média] SEO: canonical/og:url/og:image apontam para yourdomain.com; og-image.png inexistente; mesmo <title> em todas as rotas — index.html:36,41,42; App.jsx:165-167 — domínio real, imagem em public/img, Helmet por página
- [Média] Layout não responsivo: mapa 40% sem breakpoint, painel w-[420px], Sidebar 72px sem mobile — DashboardPainel.jsx:692; CursosPage.jsx:734,755; Sidebar.jsx:64-73 — breakpoints e drawer mobile
- [Média] Adoção do DS: <button> crus — AtivosPage 8, CursosPage 7, TourGuide 6, Fontes 5, Relatório 5, Sidebar 4, CadeiaPage 2 — trocar por ui/Button/IconButton/Chip
- [Média] Adoção do DS: cards/KPIs ad-hoc — Card importado e não usado em Ativos, Cadeia, Cursos, Dashboard, Relatório (div estilizada à mão); KpiCard só em Admin/Relatório; PageHeader só em Sobre/Admin — usar Card/KpiCard/PageHeader
- [Média] Adoção do DS: hex cru em Ativos (7: 338,339,850,1201,1364,1493,1587; fora das exceções não conferido contra REDESIGN_PENDING) e dark:bg-zinc-* x57 Ativos/x20 Cursos; amber-* x139/111/104 — AtivosPage.jsx; CursosPage.jsx — usar tokens; âmbar via classe .semiarido remapeando --color-primary
- [Baixa] Código morto: graph/CardLista.jsx (0 importadores), DonutChart não renderizado, ui/SegmentedControl/ProgressBar/Tooltip sem uso, semiaridoStackedComparisonData, isCursoEad, itemRefs — DashboardPainel.jsx:13,339; CursosPage.jsx:120,151 — remover
- [Baixa] Imports não usados — hero.jsx (Sun,Moon,Cpu,ExternalLink,IconButton); AtivosPage (Wifi,SunMedium,Card,Chip); CadeiaPage (SunMedium,Card); CursosPage (X,Card); DashboardPainel (useState,SunMedium,Card); RelatorioPage (Card,Badge,PageHeader) — remover
- [Baixa] @dnd-kit/* (4 pacotes) sem imports; Sobre ainda cita cards reordenáveis — package.json; SobrePage.jsx:56 — remover pacotes e texto
- [Baixa] GlobalScroll ineficaz (main rola, não window); listener de tema do SO inalcançável — App.jsx:30-56; ThemeContext.jsx:28-43,62-72 — corrigir ou remover
- [Baixa] Tour: "Tutorial" fora de /territorios e /relatorio redireciona; steps sem useMemo; setTimeout sem cleanup — TourGuide.jsx:121-283 — rodar por rota e limpar timers
- [Baixa] DESIGN_SYSTEM.md desatualizado (sombras, paleta de gráficos, modo Semiárido ausente) e linhas citadas em REDESIGN_PENDING.md obsoletas — docs/DESIGN_SYSTEM.md; docs/REDESIGN_PENDING.md — atualizar
