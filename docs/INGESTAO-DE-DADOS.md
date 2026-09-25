# Ingestão e Fluxo de Dados

Como os dados chegam até o Painel Territorial CT&I, de onde vêm, como são transformados e como atualizá-los.

Documento complementar: [SISTEMA.md](./SISTEMA.md).

> **Limite desta documentação:** o repositório **não contém** o processo que carrega as tabelas no Supabase (nem SQL, migrations, ETL ou o esquema das tabelas). Ele só *lê* o banco. A seção 2 descreve o que o código prova; a seção 7 lista o que precisa ser confirmado com quem mantém o banco.

---

## 1. Panorama

```
 Fontes oficiais                Banco                    Aplicação
 (MEC/INEP, FIRJAN, SEPLAN,     ┌────────────┐           ┌───────────────────────┐
  IBGE, SUDENE, MDIC, INPI,     │  Supabase  │  select   │ DataContext (React)   │
  SEBRAE, planilhas SECTI…)  ──►│ (Postgres) │──────────►│  • trata e enriquece  │
        │                       │ tabelas +  │  12 em    │  • cache 10 min       │
        │  (processo fora       │ views      │  paralelo │  • alimenta módulos   │
        │   deste repositório)  └────────────┘           └───────────────────────┘
        │
        └── Dados estáticos versionados no repositório
            (municípios, territórios, Semiárido, referências, TopoJSON do mapa)
```

Há **três origens** de dado no sistema:

| Origem | Como chega ao app | Atualização |
|---|---|---|
| **Supabase** (principal) | Consulta em tempo de execução, no navegador | Alterando o banco; o app reflete em até 10 min (cache) |
| **Arquivos estáticos em `src/data` e `src/constants`** | Empacotados no build | Editar o arquivo + novo deploy |
| **Mapa (TopoJSON)** em `public/` | `fetch` em tempo de execução | Substituir o arquivo + novo deploy |

## 2. Carga a partir do Supabase

Implementada em `src/context/DataContext.jsx`, executada uma vez quando o app abre.

### 2.1 Sequência

1. Lê `localStorage['@SectiPainel_Data_v14_SUPABASE_PROD']`.
2. Se o cache existe, tem menos de **10 minutos** e `distCadeias.length > 88`, usa o cache e **não consulta o banco**.
3. Caso contrário, dispara **12 consultas em paralelo** (`Promise.all`) e aplica os tratamentos da seção 2.3.
4. Grava o resultado no cache (se o `localStorage` estiver cheio, segue sem cache).
5. Publica os dados no contexto React; `loadingStats` passa a `false` no final, mesmo com erro.

Falhas: cada consulta com erro é registrada em `console.error` **e o resultado daquela tabela vira lista vazia** — o app não exibe aviso ao usuário. Um erro geral cai no `catch` e também só é registrado no console.

### 2.2 Tabelas/views lidas

| Origem | Colunas que o código usa | Observação |
|---|---|---|
| `stats_ti` | `id_territorio`, `nome_territorio`/`territorio`, `media_ifdm`, `ativos_cti`, `qtd_cursos_cti`, `cadeias_produtivas`, `pct_semiarido` | Uma linha por território; base de KPIs e mapa |
| `lista_ativos_cti` | (lista completa, `select *`) | Ativos de CT&I por município |
| `lista_cursos_cti` | `id`, `id_territorio`, `ead`, `curso`, `entidade`, `municipio`, `areaGeral`… | Cursos; `ead` é recalculado (ver 2.3) |
| `cursos` | `id_curso`, `ead` | Fonte de verdade do EAD |
| `distribuicao_cadeias` | `id_tipo_cadeia`, `nome_tipo`/`tipo`, `fonte`, `entidade`… | Cadeias × localidade |
| `lista_cadeia_produtiva` | `id_tipo_cadeia`, `tipo`, `fonte`, `entidade`… | Cadeias produtivas |
| `lista_municipioxterritorio` | (lista completa) | Município ↔ território |
| `tipo_ativos` | `id_tipo_ativo`, `nome_tipo` | Domínio de tipos de ativo |
| `tipo_cursos` | (lista completa) | Domínio de tipos de curso |
| `tipo_cadeia` | (lista completa) | Domínio; `id_tipo_cadeia = 3` é "potencial" |
| `referencias` | `id_referencia`, `titulo_referencia`, `texto_referencia`, `url_referencia` | Textos de fonte para IGs potenciais |
| `firjan` | (lista completa) | Indicadores IFDM |

Os nomes exatos das colunas devem ser conferidos no banco; a tabela acima reflete apenas o que os componentes acessam.

### 2.3 Transformações aplicadas no navegador

1. **Separação EAD × presencial**
   - `eadMap = Map(cursos.id_curso → Boolean(cursos.ead))`.
   - Cada curso de `lista_cursos_cti` recebe `ead = eadMap.get(c.id) ?? Boolean(c.ead)`.
   - `cursosData` = só presenciais; `cursosEadData` = só EAD. **Os módulos usam apenas os presenciais.**
   - Consequência: o `id` de `lista_cursos_cti` precisa coincidir com `cursos.id_curso`; se divergir, cai no valor da própria linha.
2. **Recontagem de cursos por território:** `qtd_cursos_cti` de `stats_ti` é substituído pela contagem de cursos presenciais agrupados por `id_territorio`. Cursos sem `id_territorio` não entram em nenhum território.
3. **IFDM:** `media_ifdm` passa por regex `^-?\d+(?:\.\d{0,3})?` e `toFixed(3)`; valor inválido vira `null`.
4. **Texto de referência (só cadeias "potencial"):**
   - Uma cadeia é *potencial* se `id_tipo_cadeia === 3` ou o nome do tipo contém "potencial".
   - `texto_referencia` = texto da tabela `referencias` cuja `url_referencia` (em minúsculas, sem espaços nas pontas) seja igual à `fonte` da cadeia; se não houver, usa `getTextoReferencia(fonte, entidade)` de `src/data/referenciasDB.js`.
5. **Derivados:**
   - `territoriesDynamicStats[id_territorio]` → `ifdm`, `capacidadeCti`, `qtdCursos`, `cadeiasIgs`, `pctSemiarido`.
   - `kpisGlobais` → soma de ativos/cursos/cadeias e **média simples** do IFDM (ignora territórios sem IFDM).

### 2.4 Cache: como invalidar

- Mudou a estrutura de qualquer tabela ou o tratamento em `DataContext`? **Incremente a versão da chave** (`..._v14_...` → `..._v15_...`). Sem isso, usuários com cache válido continuam vendo o formato antigo por até 10 minutos.
- Para forçar recarga localmente: apagar a chave no DevTools → Application → Local Storage.
- O teste `distCadeias.length > 88` existe para descartar caches incompletos; **se o volume real de `distribuicao_cadeias` cair abaixo de 89 linhas o cache nunca será usado** (o app só ficará mais lento, não errado).

### 2.5 Limites de paginação (atenção)

As consultas usam `.range(0, N)` com N = 3000 (ativos, cursos), 4999 (distribuição de cadeias) e 1000 (demais listas). O Supabase costuma aplicar um teto de **1000 linhas por resposta** (configuração *max rows* do projeto). Se alguma tabela passar disso, os dados excedentes são **cortados sem erro**. Ações: conferir *Project Settings → API → Max rows* ou implementar paginação em blocos de 1000.

## 3. Manter o banco ativo

Projeto no plano gratuito pausa após ~7 dias sem requisição. A função `api/keep-alive.js` (Vercel Cron, diário 12:00 UTC) consulta `tipo_ativos` (1 linha). Detalhes em [SISTEMA.md, seção 9](./SISTEMA.md). Se o projeto pausar, é preciso **Restore project** no painel do Supabase.

## 4. Dados estáticos versionados

| Arquivo | Conteúdo | Quando atualizar |
|---|---|---|
| `src/data/municipiosDB.js` | `id_municipio`, `nome_municipio`, `id_territorio`, `nome_territorio` | Mudança na divisão territorial (SEPLAN/BA) |
| `src/data/municipiosCoords.js` | Coordenadas por município | Correções de geolocalização |
| `src/data/municipios_bahia.json` | Lista de municípios | Idem |
| `src/constants/semiarido.js` | 278 municípios do Semiárido; total do estado 417 | Nova delimitação SUDENE |
| `src/constants/assetTypes.js` | Tipos de ativo | Novo tipo de ativo (manter coerente com `tipo_ativos`) |
| `src/data/referenciasDB.js` | Catálogo de fontes (48 referências/4 categorias/10 subcategorias) e textos por fonte | Nova fonte; atualizar também `FONTES_METADADOS` |

> **Atenção à consistência:** os mesmos municípios/territórios existem no banco (`lista_municipioxterritorio`) e nestes arquivos. Mudanças precisam ser feitas nos dois lugares.

Normalização de nomes (`src/utils/normalization.js`): as comparações de município/entidade usam `normalize()` (minúsculas, sem acentos, sem símbolos). Ao carregar dados novos, mantenha nomes coerentes com os existentes (ex.: "Vitória da Conquista") ou o filtro do Semiárido e os cruzamentos por nome deixarão de casar.

## 5. Mapa (TopoJSON)

- Arquivo: `public/BA_(1)9396399957704198.json` (417 municípios, fonte IBGE). Tamanho atual ≈ **145 KB**, já simplificado.
- **Simplificar:** `npm run simplify-map [percentual]` (padrão `15%`, usa `mapshaper`). O script **sobrescreve o arquivo no mesmo caminho e não guarda o original**. Rodar de novo simplifica ainda mais (perda de qualidade). Sempre partir do arquivo original do IBGE e versionar antes.
- Consumo: `fetch('/BA_(1)9396399957704198.json')` em `PtiMap.jsx` e `SideMap.jsx`; o nome do arquivo está escrito nesses dois pontos.

## 6. Scripts do repositório

| Script (`npm run …`) | Arquivo | Estado |
|---|---|---|
| `simplify-map` | `scripts/simplify-topojson.mjs` | Funcional (ver seção 5) |
| `optimize-images` | `scripts/optimize-images.mjs` | Gera `.webp` (~80) e `.avif` (~68) ao lado de PNG/JPG de `public/img`; pula o que já foi gerado |
| `generate-json`, `generate-json:file` | `scripts/generateJson.mjs` | **Legado e quebrado** (6.1) |
| — | `scripts/exportarDados.mjs` | **Legado/placeholder** (6.2) |
| — | `scripts/captureReports.mjs` | Usado pelo endpoint de exportação no ambiente de desenvolvimento |
| — | `scripts/test_*.mjs`, `testReactToPrintComparison.mjs` | Experimentos manuais com Playwright (exigem `npm run dev` em `localhost:5173`); não fazem parte do build |

### 6.1 `generateJson.mjs` (planilha de praças PTI → JSON)

Lê a primeira aba de uma planilha Excel, detecta o cabeçalho (primeira linha, entre as 15 iniciais, com ≥ 10 células preenchidas) e produz `public/ptiMunicipios.json`, agrupado por município:

```json
{ "Município": [ { "projeto": "", "nome_da_praca": "", "territorio_identidade": "", "<outras_colunas>": "" } ] }
```

Regras:
- Colunas reconhecidas por trechos do título: município (`município`/`local`/`mun`), praça, projeto, território, e o filtro **"Instalação placa (TLD)"**.
- Se a coluna de filtro existir, **só entram linhas com valor "Sim"**.
- Colunas cujo título contenha termos financeiros (`recurso`, `investimento estadual`, `execução financeira/física`, `valor implantação`, `nota fiscal`, `pagamento efetuado`, `processo de pagamento`…) são **descartadas** — não publicar valores financeiros.
- Demais colunas viram chaves normalizadas (sem acento, `snake_case`).
- Municípios ordenados alfabeticamente (pt-BR).

Uso: `node scripts/generateJson.mjs [arquivo.xlsx]`. Sem argumento, tenta baixar do SharePoint (URL fixa no script; links de download expiram).

Problemas:
1. **Importa `./generateTerritoryFiles.mjs`, que não existe** → o script falha na inicialização (`ERR_MODULE_NOT_FOUND`) antes de qualquer processamento. Remova o import e o bloco `if (sorted.territories)`, ou recrie o arquivo.
2. **O resultado (`ptiMunicipios.json`) não é lido por nenhum arquivo em `src/`** nem existe em `public/` hoje. É resquício da versão antiga do app (ver README original).
3. A URL do SharePoint é pessoal e contém identificadores; não deve ser tratada como fonte estável.

### 6.2 `exportarDados.mjs`

Baixa uma planilha do SharePoint, lista as abas e grava `public/dados.json` **apenas com um marcador `{ "status": "pendente" }`** — não converte os dados. O arquivo `public/dados.json` está no `.gitignore` e nenhum código o consome. Pode ser removido.

## 7. O que falta documentar (confirmar com o responsável pelo banco)

Não há, no repositório, respostas para:

1. **Origem e periodicidade** de cada conjunto (ativos, cursos, cadeias, FIRJAN, referências): planilhas, APIs, cargas manuais?
2. **Como as tabelas são populadas** (importação de CSV/XLSX no painel do Supabase, script externo, SQL?) e **quem** faz.
3. **Esquema completo** (tipos, chaves, índices) e definição das **views** (`stats_ti`, `lista_*`, `distribuicao_cadeias` parecem views/agregações).
4. **Políticas RLS**: a chave pública deve ter apenas `select`.
5. **Configuração de *max rows*** (ver 2.5).
6. **Regras de qualidade**: como tratar município com grafia divergente, curso sem território, instituição com sigla diferente.

Sugestão: exportar o esquema com `supabase db dump --schema public --schema-only` (ou pelo painel *Database → Schema*) e versionar em `supabase/schema.sql`; isso tornaria esta seção verificável.

## 8. Procedimentos

### 8.1 Atualizar um conjunto de dados do banco

1. Fazer a alteração no Supabase (tabela ou origem da view).
2. Conferir os totais esperados (ex.: número de linhas; `tipo_cadeia`/`tipo_ativos` com todos os tipos usados).
3. Abrir o site em janela anônima (ou apagar a chave de cache) e validar Visão Geral, Ativos, Cadeia e Cursos.
4. Se a **estrutura** mudou (colunas renomeadas/novas), ajustar `DataContext` e os módulos, **incrementar a versão do cache** e fazer deploy.

### 8.2 Adicionar/alterar um território ou município

1. Atualizar no banco (`lista_municipioxterritorio` e, se aplicável, `stats_ti`).
2. Atualizar `src/data/municipiosDB.js`, `municipiosCoords.js` e, se for Semiárido, `src/constants/semiarido.js` (e `SEMIARIDO_TOTAL_MUNICIPIOS`).
3. Se a geometria mudou, substituir o TopoJSON (seção 5).
4. Rodar `npm test` e validar visualmente.

### 8.3 Adicionar uma nova fonte/referência

1. Inserir em `referencias` (banco) com `url_referencia` idêntica à `fonte` usada nas cadeias.
2. Se for exibida na página *Sobre*, incluir também em `src/data/referenciasDB.js` e atualizar os totais de `FONTES_METADADOS`.

### 8.4 Restaurar o banco pausado

Painel do Supabase → projeto → **Restore project**; aguardar alguns minutos. Depois, apagar o cache local se o app mostrar dados vazios.

## 9. Glossário

| Termo | Significado |
|---|---|
| **Território de Identidade** | Divisão do estado da Bahia em 27 territórios (SEPLAN/BA) |
| **CT&I** | Ciência, Tecnologia e Inovação |
| **Ativo de CT&I** | Estrutura de pesquisa/inovação (parque, hub, incubadora, laboratório, polo etc.) |
| **Cadeia produtiva / IG potencial** | Segmento econômico e Indicação Geográfica com potencial de registro |
| **IFDM** | Índice FIRJAN de Desenvolvimento Municipal |
| **Semiárido** | 278 municípios baianos da delimitação SUDENE |
| **EAD** | Ensino a distância (excluído das contagens dos módulos) |
| **PTI** | Programa do qual trata o README original; nomeia o mapa `PtiMap` e o script `generateJson` |
| **RLS** | Row Level Security do Postgres/Supabase |
