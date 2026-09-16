# 🧪 API Lab — Laboratório de Validação de Dados e APIs

Ambiente isolado para homologação, validação e comparação de fontes de dados e APIs externas antes de qualquer substituição ou integração nos componentes de produção do dashboard.

---

## 📌 Objetivos e Diretrizes

1. **Isolamento Total**: Nenhuma rotina do `api-lab/` altera os componentes React ou os dados do dashboard em produção (`src/`).
2. **Execução Independente**: Todos os scripts rodam diretamente via Node.js e Vitest sem depender da inicialização do servidor de desenvolvimento Vite.
3. **Preservação de Integridade**: A fonte oficial de territórios de identidade permanece vindo de `utils/territorioMunicipios.json` (SEPLAN-BA). O código IBGE não é utilizado para inferir ou alterar relações territoriais.

---

## 🏛️ Etapa 1 — Validação IBGE (Bahia)

Validação cadastral entre os 417 municípios do Estado da Bahia obtidos via API oficial do IBGE e a base atualmente utilizada no projeto (`utils/territorioMunicipios.json`).

### 1. API e Endpoint Utilizados

- **Fonte Oficial**: Instituto Brasileiro de Geografia e Estatística (IBGE)
- **Serviço**: API de Localidades (v1)
- **Endpoint**:
  ```http
  GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/29/municipios
  ```
  *(Código `29` corresponde ao Estado da Bahia)*

### 2. Estrutura de Arquivos

```text
api-lab/
├── README.md                          # Documentação e guia do laboratório
└── ibge/
    ├── normalize-municipios.mjs       # Módulo de normalização de nomes e formatação
    ├── fetch-municipios.mjs           # Script de consulta à API do IBGE
    ├── compare-municipios.mjs         # Comparador entre base SEPLAN e IBGE
    ├── __tests__/
    │   └── ibge.test.mjs              # Testes automatizados (Vitest)
    └── output/
        ├── municipios_ibge.json       # Base IBGE normalizada (417 municípios)
        └── relatorio_ibge.json        # Relatório detalhado de comparação e divergências
```

---

## 🚀 Como Executar

Os scripts podem ser executados pelos comandos configurados no `package.json`:

### Consultar a API do IBGE e gerar a base normalizada
```bash
npm run api:ibge
```
*Gera o arquivo `api-lab/ibge/output/municipios_ibge.json`.*

### Executar a comparação contra a base do projeto
```bash
npm run api:ibge:compare
```
*Gera o relatório `api-lab/ibge/output/relatorio_ibge.json` e imprime o resumo no terminal.*

### Executar o pipeline completo (Fetch + Comparação)
```bash
npm run api:ibge:test
```

### Executar os testes automatizados
```bash
npm run test:api:ibge
```
*(ou `npx vitest run api-lab/ibge`)*

---

## 📄 Arquivos Gerados e Formatos

### 1. `api-lab/ibge/output/municipios_ibge.json`
Lista dos 417 municípios da Bahia cadastrados no IBGE no formato:
```json
[
  {
    "codigo_ibge": 2900108,
    "municipio": "Abaíra",
    "uf": "BA"
  },
  {
    "codigo_ibge": 2900207,
    "municipio": "Abaré",
    "uf": "BA"
  }
]
```

### 2. `api-lab/ibge/output/relatorio_ibge.json`
Relatório comparativo contendo:
- `total_atual`: Quantidade de municípios na base atual do projeto (417).
- `total_ibge`: Quantidade de municípios retornados pelo IBGE (417).
- `municipios_coincidentes`: Lista dos municípios coincidentes (413 com grafia exata e 2 com variação de acento).
- `municipios_somente_projeto_atual`: Municípios cuja grafia na base atual difere do cadastro do IBGE.
- `municipios_somente_ibge`: Municípios do IBGE com grafia equivalente à divergência acima.
- `divergencias_nome`: Detalhamento completo da divergência, tipo e motivo.
- `codigos_ibge_encontrados`: Lista dos 417 códigos IBGE identificados.
- `municipios_sem_codigo`: Municípios não mapeados (atualmente 0).

---

## 🔍 Como Interpretar o Relatório de Divergências

A comparação normaliza cadeias de texto eliminando acentos, espaços extras e caixa alta/baixa. Foram identificadas **4 particularidades históricas** entre a SEPLAN-BA e o IBGE:

| Município no Projeto | Município no IBGE | Código IBGE | Tipo de Divergência | Explicação |
| :--- | :--- | :---: | :---: | :--- |
| **Itaetê** | Itaeté | `2915007` | Acentuação | Projeto adota circunflexo (`ê`), IBGE adota agudo (`é`). |
| **Iuiú** | Iuiu | `2917334` | Acentuação | Projeto adota acento agudo (`ú`), IBGE grafa sem acento. |
| **Muquém de São Francisco** | Muquém do São Francisco | `2922250` | Preposição | Projeto usa `de`, IBGE adota contração `do`. |
| **Santa Teresinha** | Santa Terezinha | `2928505` | Ortografia | Projeto grafa com `s`, IBGE grafa com `z`. |

Ambas as formas referem-se rigorosamente aos mesmos municípios e entidades territoriais.
