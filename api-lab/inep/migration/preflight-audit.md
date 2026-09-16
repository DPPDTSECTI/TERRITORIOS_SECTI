# ETAPA 3.1 — RELATÓRIO DE AUDITORIA PRÉ-TRANSAÇÃO DO PLANO DE MIGRAÇÃO

**Data:** 16/09/2026  
**Status de Prontidão da Transação:** `ready_for_transaction: false`  
**Diretriz Aplicada:** NÃO assumir nomes ou colunas. Nenhuma modificação baseada puramente em heurísticas.

---

## 1. Resumo Executivo de Segurança

| Indicador de Auditoria | Quantidade | Status |
| :--- | :---: | :---: |
| **Operações Seguras para UPDATE (`safe_updates`)** | **0** | Nenhuma operação atende a 100% dos requisitos sem intervenção |
| **Operações Seguras para DEACTIVATE (`safe_deactivations`)** | **0** | Coluna `ativo` inexistente no banco |
| **Operações Pendentes de Revisão Humana (`review_required`)** | **4** | UFSB Itabuna (ID 75), UNEB Canudos (28), Jeremoabo (88) e Ubaitaba (174) |
| **Operações Bloqueadas (`blocked`)** | **14** | Violações de Foreign Key (IDs de tipo inexistentes) e ausência de colunas |
| **INSERTs Bloqueados (`blocked_inserts`)** | **50** | Incompletude de campos mandatórios (`id_municipio`, `id_ativo`, FKs) |
| **PRONTIDÃO PARA EXECUÇÃO DE TRANSAÇÃO** | **NÃO PERMITIDA** | **`ready_for_transaction = false`** |

---

## 2. Auditoria dos Bloqueadores Críticos

### BLK-01 (UFSB Itabuna — IDs 75 e 76)
- **Diagnóstico:** No Censo INEP 2023, o registro ID 75 possui 20 cursos presenciais ativos vinculados ao município de Itabuna. Não há evidência documental formal no dataset que justifique rebaixar ID 75 para "administrativo" em detrimento do ID 76.
- **Resultado:** `aprovado_tecnicamente: false` | `review_required: true`.
- **Decisão:** Manter **`NO_CHANGE`** em produção.

### BLK-02 (6 Polos EAD — IDs 23, 38, 64, 92, 112, 158)
- **Diagnóstico:** A proposta de atualizar para `id_tipo_ativo = 105` viola a constraint de Foreign Key com a tabela `tipo_ativos` (que só aceita valores de 1 a 10).
- **Resultado:** `aprovado_tecnicamente: false` | `classificacao: BLOCKED`.
- **Decisão:** Não alterar o banco. Segregar a modalidade via lógica de filtro no frontend (`DataContext`).

### BLK-03 (IFBA Ubaitaba — ID 174)
- **Recálculo Geodésico Formal:**
  - Latitude SECTI: `-14.3105545` | Longitude SECTI: `-39.3233337`
  - Latitude Referência: `-14.311997` | Longitude Referência: `-39.32171`
  - **Distância Exata Calculada:** **237.35 metros**
  - **Conclusão:** O suposto desvio de 15 km foi refutado matematicamente. O ponto dista menos de 240 metros do centro urbano.
- **Resultado:** `review_required: true`.
- **Decisão:** Manter **`NO_CHANGE`** (coordenada atual mantida sem substituição).

### BLK-04 (UNIRB Serrinha — ID 164)
- **Diagnóstico:** O schema REAL de `lista_ativos_cti` em produção **não possui a coluna `ativo`**.
- **Resultado:** `aprovado_tecnicamente: false` | `classificacao: BLOCKED (MIGRATION_SCHEMA_CHANGE)`.
- **Decisão:** Não executar `UPDATE ativo = false` até aprovação formal de DDL pelo DBA.

### BLK-05 (7 Campi Técnicos — IDs 5, 27, 58, 71, 83, 174, 188)
- **Diagnóstico:** A proposta de associar `id_tipo_ativo = 102` é inválida porque o ID 102 não existe em `tipo_ativos`. O valor existente é 5 (`Campi Instituto Federal`).
- **Resultado:** `aprovado_tecnicamente: false` | `classificacao: BLOCKED`.
- **Decisão:** Preservar `id_tipo_ativo = 5` e aplicar rotulagem canônica no `DataContext`.

---

## 3. Auditoria do Schema Real de Produção (Supabase)

- **Tabela `tipo_ativos`:**
  - Contém estritamente os IDs: `1, 2, 3, 4, 5, 6, 7, 8, 9, 10`.
  - IDs 101, 102, 103, 104, 105, 106, 107 NÃO existem. Qualquer DML que tente utilizá-los falhará por integridade referencial.
- **Tabela `lista_ativos_cti`:**
  - Possui 16 colunas. Nenhuma coluna `ativo` existe.
  - Exige `id_municipio` (FK) e `id_territorio` válidos para todos os registros.
- **50 INSERTs Pendentes:**
  - Bloqueados por ausência de `id_municipio` interno e chave primária gerada.

---

## 4. Auditoria Detalhada Item a Item

### Ativo ID 5 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campus da Rede Federal EPCT (IFBA/IF Baiano) que oferta exclusivamente ensino médio e técnico, sem registros no Censo da Educação Superior 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** Manter id_tipo_ativo = 5 e tratar classificação funcional na camada semântica sem violar FK do Supabase.

---

### Ativo ID 23 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidades com cursos de graduação ofertados estritamente na modalidade a distância (EAD) no Censo 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 (Tabela de Cursos / TP_MODALIDADE_ENSINO = 2)
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (105) não existe na tabela "tipo_ativos" de produção (domínio restrito a 1..10).
- **Recomendação:** Não inventar id_tipo_ativo em produção. Tratar exclusão da infraestrutura física através do filtro modalidade EAD no DataContext.

---

### Ativo ID 27 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campus da Rede Federal EPCT (IFBA/IF Baiano) que oferta exclusivamente ensino médio e técnico, sem registros no Censo da Educação Superior 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** Manter id_tipo_ativo = 5 e tratar classificação funcional na camada semântica sem violar FK do Supabase.

---

### Ativo ID 28 — tipo / id_tipo_ativo
- **Classificação:** `REVIEW_REQUIRED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campi avançados da UNEB voltados à conservação, memorial e pesquisa histórica/ambiental, sem turmas de graduação no Censo 2023.
- **Fonte da Evidência:** Cadastro Institucional UNEB / Censo Superior 2023
- **Grau de Confiança:** `media`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (103) não existe no banco (valores válidos: 1 a 10). Reclassificação formal de campus estadual demanda deliberação do CONSU/UNEB.
- **Recomendação:** NO_CHANGE na tabela de produção. Manter categoria canônica isolada no DataContext.

---

### Ativo ID 38 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidades com cursos de graduação ofertados estritamente na modalidade a distância (EAD) no Censo 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 (Tabela de Cursos / TP_MODALIDADE_ENSINO = 2)
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (105) não existe na tabela "tipo_ativos" de produção (domínio restrito a 1..10).
- **Recomendação:** Não inventar id_tipo_ativo em produção. Tratar exclusão da infraestrutura física através do filtro modalidade EAD no DataContext.

---

### Ativo ID 88 — tipo / id_tipo_ativo
- **Classificação:** `REVIEW_REQUIRED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campi avançados da UNEB voltados à conservação, memorial e pesquisa histórica/ambiental, sem turmas de graduação no Censo 2023.
- **Fonte da Evidência:** Cadastro Institucional UNEB / Censo Superior 2023
- **Grau de Confiança:** `media`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (103) não existe no banco (valores válidos: 1 a 10). Reclassificação formal de campus estadual demanda deliberação do CONSU/UNEB.
- **Recomendação:** NO_CHANGE na tabela de produção. Manter categoria canônica isolada no DataContext.

---

### Ativo ID 58 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campus da Rede Federal EPCT (IFBA/IF Baiano) que oferta exclusivamente ensino médio e técnico, sem registros no Censo da Educação Superior 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** Manter id_tipo_ativo = 5 e tratar classificação funcional na camada semântica sem violar FK do Supabase.

---

### Ativo ID 64 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidades com cursos de graduação ofertados estritamente na modalidade a distância (EAD) no Censo 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 (Tabela de Cursos / TP_MODALIDADE_ENSINO = 2)
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (105) não existe na tabela "tipo_ativos" de produção (domínio restrito a 1..10).
- **Recomendação:** Não inventar id_tipo_ativo em produção. Tratar exclusão da infraestrutura física através do filtro modalidade EAD no DataContext.

---

### Ativo ID 71 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campus da Rede Federal EPCT (IFBA/IF Baiano) que oferta exclusivamente ensino médio e técnico, sem registros no Censo da Educação Superior 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** Manter id_tipo_ativo = 5 e tratar classificação funcional na camada semântica sem violar FK do Supabase.

---

### Ativo ID 75 — tipo / nome_ativo / id_tipo_ativo
- **Classificação:** `REVIEW_REQUIRED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** O Censo INEP 2023 associa 20 cursos presenciais ativos em Itabuna à entidade mantenedora UFSB (ID 75), enquanto o Campus Jorge Amado (ID 76) é o local de oferta com duplicidade cartográfica. Não há ato normativo no dataset oficial comprovando que ID 75 é estritamente administrativo sem cursos.
- **Fonte da Evidência:** INEP Censo Superior 2023 / reconciliacao_campi.json
- **Grau de Confiança:** `baixa`
- **Diagnóstico:** FALTA_DE_EVIDENCIA_DOCUMENTAL: Não é seguro assumir ID 75 como administrativo apenas por heurística. Exige validação institucional UFSB/SECTI.
- **Recomendação:** NO_CHANGE na produção. Tratar duplicidade no nível de camada visual/agrupamento do frontend até definição formal.

---

### Ativo ID 83 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campus da Rede Federal EPCT (IFBA/IF Baiano) que oferta exclusivamente ensino médio e técnico, sem registros no Censo da Educação Superior 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** Manter id_tipo_ativo = 5 e tratar classificação funcional na camada semântica sem violar FK do Supabase.

---

### Ativo ID 92 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidades com cursos de graduação ofertados estritamente na modalidade a distância (EAD) no Censo 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 (Tabela de Cursos / TP_MODALIDADE_ENSINO = 2)
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (105) não existe na tabela "tipo_ativos" de produção (domínio restrito a 1..10).
- **Recomendação:** Não inventar id_tipo_ativo em produção. Tratar exclusão da infraestrutura física através do filtro modalidade EAD no DataContext.

---

### Ativo ID 112 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidades com cursos de graduação ofertados estritamente na modalidade a distância (EAD) no Censo 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 (Tabela de Cursos / TP_MODALIDADE_ENSINO = 2)
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (105) não existe na tabela "tipo_ativos" de produção (domínio restrito a 1..10).
- **Recomendação:** Não inventar id_tipo_ativo em produção. Tratar exclusão da infraestrutura física através do filtro modalidade EAD no DataContext.

---

### Ativo ID 132 — tipo / id_tipo_ativo / nome_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Sede administrativa e reitoria do Instituto Federal Baiano em Salvador (Rua do Rouxinol, Imbuí), sem oferta direta de cursos regulares.
- **Fonte da Evidência:** Portal Oficial IF Baiano / Censo da Educação Superior 2023
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (104) não existe em "tipo_ativos".
- **Recomendação:** NO_CHANGE na base física. Mapear papel administrativo no modelo canônico sem quebrar constraints.

---

### Ativo ID 158 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidades com cursos de graduação ofertados estritamente na modalidade a distância (EAD) no Censo 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 (Tabela de Cursos / TP_MODALIDADE_ENSINO = 2)
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (105) não existe na tabela "tipo_ativos" de produção (domínio restrito a 1..10).
- **Recomendação:** Não inventar id_tipo_ativo em produção. Tratar exclusão da infraestrutura física através do filtro modalidade EAD no DataContext.

---

### Ativo ID 164 — ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Ausência de turmas, matrículas ou cursos ativos no Censo da Educação Superior 2023 (INEP). Faticamente inativa.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Microdados BA
- **Grau de Confiança:** `alta`
- **Diagnóstico:** MIGRATION_SCHEMA_CHANGE: A coluna "ativo" não existe na tabela "lista_ativos_cti" no banco de produção. Não é permitido executar DML sem DDL prévio aprovado.
- **Recomendação:** Suspender UPDATE/DEACTIVATE até aprovação de migração estrutural DDL (ALTER TABLE) pela administração do banco.

---

### Ativo ID 174 — tipo / id_tipo_ativo
- **Classificação:** `REVIEW_REQUIRED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Unidade de ensino técnico profissionalizante de IF sem graduação superior ativa no Censo 2023. Distância geodésica SECTI x Referência calculada em 237.35m (compatível com perímetro urbano).
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** NO_CHANGE na coordenada e no id_tipo_ativo. Manter classificação técnica em camada canônica.

---

### Ativo ID 188 — tipo / id_tipo_ativo
- **Classificação:** `BLOCKED`
- **Aprovado Tecnicamente:** `false`
- **Evidência:** Campus da Rede Federal EPCT (IFBA/IF Baiano) que oferta exclusivamente ensino médio e técnico, sem registros no Censo da Educação Superior 2023.
- **Fonte da Evidência:** INEP Censo Superior 2023 / Rede Federal EPCT / Auditoria Geodésica
- **Grau de Confiança:** `alta`
- **Diagnóstico:** VIOLACAO_FK: O id_tipo_ativo proposto (102) não existe na tabela de domínio "tipo_ativos". O valor atual válido é 5 (Campi Instituto Federal).
- **Recomendação:** Manter id_tipo_ativo = 5 e tratar classificação funcional na camada semântica sem violar FK do Supabase.

