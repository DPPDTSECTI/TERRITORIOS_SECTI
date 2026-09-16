# Arquitetura de Dados — Painel SECTI

**Versão:** 4.0 (pós-integração INEP)  
**Data:** Setembro/2026  
**Status:** Produção Composta Homologada

---

## Visão Geral

O painel SECTI integra três fontes de dados distintas em uma camada canônica unificada,
sem modificar o banco de dados de produção.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FONTES DE DADOS                          │
├────────────────┬────────────────┬────────────────────────────────┤
│  SECTI/Supabase│      IBGE      │           INEP                  │
│  (174 registros│  (417 municípios│  (50 novos campi presenciais)  │
│   legados CTI) │   Bahia - ref) │   id_ativo = null              │
└───────┬────────┴───────┬────────┴───────────────┬────────────────┘
        │                │                        │
        ▼                ▼                        ▼
┌───────────────────────────────────────────────────────────────┐
│               CAMADA DE ADAPTERS (src/data/adapters/)         │
│                                                               │
│  sectiAdapter.js    →  fetchSectiUnits()                      │
│                        fetchSectiCourses()                    │
│                        fetchSectiMetadata()                   │
│                                                               │
│  inepAdapter.js     →  fetchInepUnits()  [memória, sem DB]    │
│                                                               │
│  canonicalAdapter.js → getCanonicalUnits()       (224)        │
│                         getCanonicalCourses()                 │
│                         getCanonicalInstitutions()            │
│                         getCanonicalTiposAtivos()             │
└───────────────────────────────────────┬───────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────┐
│                  DataContext.jsx                               │
│  (única porta de entrada de dados para o React)               │
└───────────────────────────────────────┬───────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────┐
│                  Componentes React                             │
│  Dashboard · Ativos · Cursos · Mapas · Relatórios · PDFs      │
│  (nenhum componente conhece Supabase, INEP ou shadow)         │
└───────────────────────────────────────────────────────────────┘
```

---

## Fontes de Dados

### SECTI/Supabase — Fonte Territorial e Cadastral

- **Tabelas:** `lista_ativos_cti`, `lista_cursos_cti`, `stats_ti`, `tipo_ativos`, etc.
- **Registros de Ativos:** 174 campi/unidades legados
- **Responsabilidade:** Dados primários territoriais, cadeias produtivas, FIRJAN, IFDM
- **Acesso:** Somente leitura via `sectiAdapter.js`
- **Mutações:** ❌ Proibidas nesta arquitetura

### IBGE — Referência Geográfica

- **Fonte:** API IBGE + `municipiosDB.js` local (417 municípios da Bahia)
- **Uso:** Geocódigos de 7 dígitos (`29XXXXX`), validação de coordenadas, cobertura territorial
- **Artefatos:** `api-lab/ibge/output/municipios_ibge.json`

### INEP — Referência Acadêmica

- **Fonte:** Censo da Educação Superior (dados públicos)
- **Registros:** 50 novos campi presenciais confirmados no INEP mas ausentes no Supabase
- **Gestão:** Memória apenas — `id_ativo = null`, `origem = "inep"`
- **Acesso:** `inepAdapter.js` → `/api/shadow-data/composed` (DEV) ou asset estático (PROD)
- **Mutações:** ❌ Proibidas — os 50 registros nunca serão inseridos automaticamente no banco

---

## Composição Canônica

A composição `production-composed` é a fonte de verdade do painel:

| Dimensão | Valor | Fonte |
|---|---|---|
| Total Geral | **224** | SECTI (174) + INEP (50) |
| Infraestrutura Física | **217** | `presenca_fisica === true` |
| Superior Presencial | **204** | `tipo_unidade === "ensino_superior_presencial"` |
| Superior + Ambíguas | **207** | sup. presencial + ambígua |
| Ensino Técnico | **7** | `tipo_unidade === "ensino_tecnico"` |
| Pesquisa e Extensão | **2** | `tipo_unidade === "pesquisa_extensao"` |
| Administrativo | **1** | `tipo_unidade === "administrativo"` |
| Polos EAD | **6** | `tipo_unidade === "ead"` |
| Inativa | **1** | `tipo_unidade === "inativa"` |
| Ambígua | **3** | `tipo_unidade === "ambigua"` |

### Cobertura Territorial

- **Universo:** 27 Territórios de Identidade da Bahia
- **Com unidades:** 26 territórios
- **Sem unidade na chave numérica legada:** 1 (ID 2 = Velho Chico — mapeado em `id_territorio = 27` na tabela legada)
- **Municípios cobertos:** 417 (100% da Bahia)

---

## Configuração de DATA_SOURCE

| Ambiente | DATA_SOURCE | Descrição |
|---|---|---|
| Produção | `production-composed` | 174 SECTI + 50 INEP (padrão obrigatório) |
| DEV (padrão) | `production-composed` | Igual à produção |
| DEV (shadow) | `shadow` | Dados shadow pré-reconciliação |
| DEV (canonical) | `canonical` | Modelo canônico semântico puro |
| DEV (prod puro) | `production` | Apenas 174 Supabase legado |

Configurado em `src/data/adapters/config.js`.  
Override via `VITE_DATA_SOURCE` (`.env.local`) ou `localStorage('@Secti_DataSource')`.

---

## Bloqueios Pendentes de Governança (não impactam o frontend)

| ID | Descrição | Status |
|---|---|---|
| BLK-01 | UFSB Itabuna (IDs 75 e 76): ambiguidade cadastral | Preservado em memória |
| BLK-02 | Polos EAD: segregação resolvida no adapter canônico | Sem ação no banco |
| BLK-03 | Ubaitaba (ID 174): distância coord. ≈ 237m | NO_CHANGE confirmado |
| BLK-04 | UNIRB Serrinha (ID 164): coluna `ativo` inexistente | Bloqueio de saneamento DB |
| BLK-05 | 7 campi técnicos: segregados na camada canônica | Sem ação no banco |
