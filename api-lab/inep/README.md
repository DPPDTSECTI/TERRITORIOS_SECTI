# 🎓 API Lab — Etapa 2: Validação INEP (Censo da Educação Superior)

Ambiente de homologação e validação de dados do **Censo da Educação Superior (INEP)** contra os dados atuais de cursos superiores, instituições de ensino, campi e municípios utilizados no projeto.

---

## 📌 Diretrizes de Isolamento
- **Frontend Preservado**: Nenhuma alteração em `src/` ou nos componentes do dashboard.
- **Produção Preservada**: Nenhuma alteração em `public/data/` ou nos dados do Supabase.
- **Independência Operacional**: Todos os scripts rodam de forma autônoma em `api-lab/inep/` via Node.js e Vitest.

---

## 🏛️ Fonte de Dados e Edição Utilizada

- **Fonte Oficial**: Ministério da Educação (MEC) / Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP)
- **Serviço**: Microdados Abertos do Censo da Educação Superior
- **Edição**: **2023** (Edição mais recente consolidada)
- **URL de Download**:
  ```http
  https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_2023.zip
  ```
- **Arquivos do Pacote Utilizados**:
  1. `MICRODADOS_CADASTRO_CURSOS_2023.CSV`: Relação de todos os cursos, modalidades, graus acadêmicos, áreas CINE e municípios de oferta.
  2. `MICRODADOS_ED_SUP_IES_2023.CSV`: Dados cadastrais, siglas, categorias administrativas e endereços das instituições (IES).

---

## 📂 Estrutura de Diretórios

```text
api-lab/inep/
├── README.md                      # Documentação completa e guia de uso
├── raw/                           # Dados brutos com metadados de proveniência
│   ├── inep_ba_cursos_raw.json    # 38.356 ofertas de cursos na Bahia (bruto)
│   ├── inep_ba_ies_raw.json       # 149 IES com sede na Bahia
│   ├── secti_cursos_atual.json    # Snapshot dos 642 cursos de CT&I do projeto
│   └── secti_campi_atual.json     # Snapshot dos 174 campi educacionais do projeto
├── normalized/                    # Dados padronizados
│   └── cursos_inep_ba.json        # Base normalizada no formato solicitado
├── scripts/                       # Rotinas de automação
│   ├── extract-inep.mjs           # Extração e filtro de UF = BA
│   ├── normalize-inep.mjs         # Mapeamento de categorias e códigos
│   ├── compare-inep.mjs           # Comparador cruzado SECTI vs INEP
│   └── report-inep.mjs            # Gerador do relatório diagnóstico executivo
├── output/                        # Relatórios finais gerados
│   ├── relatorio_inep.json        # Relatório estruturado de divergências
│   └── diagnostico_inep.md        # Relatório executivo sobre viabilidade de substituição
└── tests/                         # Suíte de testes automatizados
    └── inep.test.mjs              # 12 testes no Vitest
```

---

## 🚀 Como Executar

### 1. Extrair os dados brutos da Bahia a partir do Censo
```bash
npm run api:inep:extract
```

### 2. Normalizar os dados para o padrão do laboratório
```bash
npm run api:inep:normalize
```

### 3. Comparar a base atual da SECTI contra o INEP
```bash
npm run api:inep:compare
```

### 4. Gerar o relatório executivo em Markdown
```bash
npm run api:inep:report
```

### 5. Executar os testes automatizados
```bash
npm run api:inep:test
```

---

## 📋 Formato Normalizado (`cursos_inep_ba.json`)

```json
{
  "codigo_ibge": 2927408,
  "municipio": "Salvador",
  "instituicao": "UNIVERSIDADE FEDERAL DA BAHIA",
  "sigla_instituicao": "UFBA",
  "tipo_instituicao": "Universidade",
  "categoria_administrativa": "Pública Federal",
  "curso": "Engenharia de Computação",
  "tipo_curso": "Bacharelado",
  "modalidade": "Presencial",
  "area_geral": "Engenharia, produção e construção",
  "rotulo_cine": "Engenharia de computação",
  "codigo_curso": 105652,
  "codigo_ies": 578,
  "ano_censo": 2023,
  "uf": "BA"
}
```

---

## 🔍 Resumo dos Resultados e Diagnóstico

### Comparação de Cursos e Municípios
- **Cursos no Projeto (Recorte CT&I)**: 642
- **Ofertas Totais no INEP (Bahia)**: 38.356 (1.998 presenciais e 36.358 polos EAD)
- **Correspondência Exata de Cursos**: **641 de 642 cursos presenciais (99,8%)** da base SECTI foram localizados no Censo INEP com o mesmo nome e município.
- **Integridade de Municípios**: **0 municípios sem código IBGE**.
- **Validação de Campi**: Todos os 174 campi cadastrados no projeto possuem município com oferta confirmada no INEP.

Para mais detalhes sobre o que pode ser substituído e o que a SECTI deve manter, consulte [`output/diagnostico_inep.md`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/output/diagnostico_inep.md).
