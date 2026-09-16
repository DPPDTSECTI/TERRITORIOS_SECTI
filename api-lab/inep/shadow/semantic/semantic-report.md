# ETAPA 2.7 — RELATÓRIO DO MODELO CANÔNICO DE UNIDADES TERRITORIAIS

**Data:** 16/09/2026  
**Status:** VALIDADO COM SUCESSO  
**Objetivo:** Camada semântica única para representar ativos de ensino, pesquisa, extensão e EAD sem duplicidades e sem alterar dados de produção.

---

## 1. Taxonomia Canônica Definitiva

| Categoria Canônica (`tipo_unidade`) | Presença Física | Oferta Presencial | Nível de Ensino | Ativo | Quantidade | Descrição Semântica |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`ensino_superior_presencial`** | Sim (`true`) | Sim (`true`) | `['superior']` | `true` | **204** | 154 campi confirmados SECTI + 50 novas presenças físicas INEP |
| **`ensino_tecnico`** | Sim (`true`) | Sim (`true`) | `['tecnico']` | `true` | **7** | Campi de IFBA e IF Baiano que ofertam exclusivamente educação profissional |
| **`pesquisa_extensao`** | Sim (`true`) | Não (`false`) | `[]` | `true` | **2** | Centros avançados de pesquisa e extensão (ex: UNEB Canudos e Jeremoabo) |
| **`administrativo`** | Sim (`true`) | Não (`false`) | `[]` | `true` | **1** | Sede e gabinetes administrativos/reitorias (ex: Reitoria IF Baiano Salvador) |
| **`ead`** | Não (`false`) | Não (`false`) | `['superior']` | `true` | **6** | Polos de apoio presencial exclusivamente EAD herdados do cadastro legado |
| **`ambigua`** | Sim (`true`) | Sim (`true`) | `['superior']` | `true` | **3** | Unidades sob averiguação cadastral / sobreposição física (UFSB, UNIRB, UNIAENE) |
| **`inativa`** | Não (`false`) | Não (`false`) | `[]` | `false` | **1** | Unidade inativa no Censo Superior 2023 (UNIRB Serrinha - ID 164) |
| **TOTAL GERAL** | - | - | - | - | **224** | **174 preservados da SECTI + 50 novos presenciais INEP** |

---

## 2. Quantitativos por Categoria e Origem

- **Total de Registros Canônicos:** 224
  - Registros de Origem SECTI (legados preservados): **174**
  - Registros de Origem INEP (novos presenciais mapeados): **50**
  - Registros Híbridos Reconciliados (`secti_inep`): **157**
  - Registros Estritamente SECTI (`secti`): **17**
- **Infraestrutura Física Real no Estado (`presenca_fisica: true`):** **217**
- **Unidades Operacionais Ativas (`ativo: true`):** **223**
- **Unidades Inativas (`ativo: false`):** **1**

---

## 3. Divergências e Resoluções Semânticas

1. **Separação Rigorosa de Polos EAD:**
   - Os 6 polos EAD herdados da SECTI (UNINTER, UNIP, UNIFACS em Brumado, Guanambi, etc.) foram desvinculados da infraestrutura de "campus físico".
   - Regra aplicada: `presenca_fisica: false`, `oferta_presencial: false`, `modalidade: 'A distância'`.
   - **Resultado:** Não inflam mais a contagem de campi físicos nem aparecem indevidamente no mapa de infraestrutura.

2. **Isolamento de Campi de Ensino Técnico:**
   - 7 unidades de IFBA / IF Baiano ofertam apenas cursos técnicos/médio integrado (sem cursos de graduação registrados no Censo da Educação Superior).
   - Regra aplicada: `tipo_unidade: 'ensino_tecnico'`, `nivel_ensino: ['tecnico']`.
   - **Resultado:** Não contaminam mais os filtros de graduação universitária e relatórios de ensino superior.

3. **Distinção de Centros de Pesquisa e Reitorias Administrativas:**
   - UNEB Canudos e UNEB Jeremoabo são centros de pesquisa e conservação ecológica/histórica, sem turmas regulares de graduação.
   - Reitoria do IF Baiano (Salvador) é um prédio administrativo.
   - Regra aplicada: `oferta_presencial: false`, `nivel_ensino: []`.
   - **Resultado:** Preservados como infraestrutura de CTI sem gerar expectativa de oferta de cursos de graduação.

4. **Tratamento de Unidade Inativa:**
   - A FACULDADE UNIRB - SERRINHA (ID 164) não possui oferta ativa no Censo 2023.
   - Regra aplicada: `tipo_unidade: 'inativa'`, `ativo: false`, `presenca_fisica: false`.
   - **Resultado:** Preservada no histórico para auditoria sem poluir indicadores ativos.

---

## 4. Casos Ambíguos (`tipo_unidade: 'ambigua'`)

1. **UFSB - Campus Jorge Amado (Itabuna - ID 76):**
   - Coexiste com o ID 75 no mesmo município e com mesma coordenada geográfica.
   - Mantido como `ambigua` com aviso de sobreposição até unificação cadastral.
2. **UNIRB - Centro Universitário (Alagoinhas - ID 1):**
   - Transição institucional entre Faculdade e Centro Universitário em análise de código e-MEC.
3. **UNIAENE - Centro Universitário Adventista (Cachoeira - ID 19):**
   - Registro cadastral e territorial em Cachoeira com unidade física em Capoeiruçu.

---

## 5. Impacto nos KPIs e Dashboards

### KPIs Consolidados (`semantic-kpis.json`)
```json
{
  "infraestrutura_total": 217,
  "ensino_superior_presencial": 204,
  "ensino_tecnico": 7,
  "pesquisa_extensao": 2,
  "administrativo": 1,
  "ead": 6
}
```

### Benefícios Diretos no Frontend:
1. **Filtros Confiáveis:** Usuários que selecionarem "Ensino Superior" verão exatamente **204** campi confirmados (ou **207** com ambíguos), sem mistura de cursos técnicos ou polos EAD.
2. **Cartografia Fiel:** O mapa de infraestrutura física exibe **217** pontos reais no solo baiano, eliminando pins fantasmas de EAD.
3. **Relatórios em PDF Consistentes:** Os relatórios de síntese e ativos refletem a infraestrutura real de CT&I por Território de Identidade.
