# ETAPA 3.0 — PLANO FORMAL DE SANEAMENTO E MIGRAÇÃO DE DADOS

**Data:** 16/09/2026  
**Status do Plano:** DRY-RUN AUDITADO (SEM EXECUÇÃO EM PRODUÇÃO)  
**Tabelas Afetadas:** `lista_ativos_cti`, `tipo_ativos`  
**Total de Registros SECTI Auditados:** 174  
**Novos Registros INEP Catalogados:** 50  

---

## 1. Resumo Quantitativo das Operações Propostas

| Operação | Quantidade | Descrição |
| :--- | :---: | :--- |
| **`NO_CHANGE`** | **156** | Registros presenciais confirmados da SECTI preservados sem qualquer alteração |
| **`UPDATE`** | **17** | Saneamento semântico de tipo/categoria (1 Reitoria UFSB, 6 EAD, 7 Técnicos, 2 Pesquisa, 1 Reitoria IF Baiano) |
| **`DEACTIVATE`** | **1** | Desativação lógica cadastral da UNIRB Serrinha (ID 164) com `ativo = false` |
| **`INSERT` (Pendentes)** | **50** | Novas unidades identificadas no Censo 2023 catalogadas em `pending_insert.json` |
| **TOTAL** | **224** | **100% dos ativos mapeados no ecossistema territorial** |

---

## 2. Seção A — Registros que Serão Alterados (17 UPDATEs)

| ID Ativo | Nome Atual | Município | Alteração Proposta (`tipo` / `id_tipo_ativo`) | Motivação Semântica |
| :-: | :--- | :--- | :--- | :--- |
| **75** | UNIVERSIDADE FEDERAL DO SUL DA BAHIA | Itabuna | `Administrativo` (`104`) | Diferenciação da Reitoria para sanar BLK-01 sem excluir o registro |
| **23** | FACULDADE UNIRB - CAMAÇARI | Camaçari | `Polo EAD` (`105`) | Local de oferta exclusivamente EAD desvinculado de campus físico |
| **38** | IFBA - Campus Euclides da Cunha | Euclides da Cunha | `Polo EAD` (`105`) | Local de oferta EAD no Censo Superior 2023 |
| **64** | IFBA - Campus Ilhéus | Ilhéus | `Polo EAD` (`105`) | Polo EAD sem graduação superior presencial registrada |
| **92** | IFBA - Campus Juazeiro | Juazeiro | `Polo EAD` (`105`) | Local de oferta EAD sem graduação presencial registrada |
| **112** | Faculdade Dom Pedro II AFYA | Ribeira do Pombal | `Polo EAD` (`105`) | Polo EAD |
| **158** | IFBA - Campus Seabra | Seabra | `Polo EAD` (`105`) | Local de oferta EAD sem graduação presencial registrada |
| **5** | IF BAIANO - Campus Alagoinhas | Alagoinhas | `Ensino Técnico` (`102`) | Campus de educação técnica profissionalizante (sem graduação) |
| **27** | IFBA - Campus Campo Formoso | Campo Formoso | `Ensino Técnico` (`102`) | Campus de educação técnica profissionalizante (sem graduação) |
| **58** | IF BAIANO - Campus Gov. Mangabeira | Gov. Mangabeira | `Ensino Técnico` (`102`) | Campus de educação técnica profissionalizante (sem graduação) |
| **71** | IF BAIANO - Campus Itaberaba | Itaberaba | `Ensino Técnico` (`102`) | Campus de educação técnica profissionalizante (sem graduação) |
| **83** | IFBA - Campus Jaguaquara | Jaguaquara | `Ensino Técnico` (`102`) | Campus de educação técnica profissionalizante (sem graduação) |
| **174** | IFBA - Campus Avançado Ubaitaba | Ubaitaba | `Ensino Técnico` (`102`) | Educação técnica; coordenada mantida para revisão de campo |
| **188** | IF BAIANO - Campus Xique-Xique | Xique-Xique | `Ensino Técnico` (`102`) | Campus de educação técnica profissionalizante (sem graduação) |
| **28** | UNEB - Campus Canudos | Canudos | `Pesquisa e Extensão` (`103`) | Centro avançado de pesquisa e conservação ecológica/histórica |
| **88** | UNEB - Campus Jeremoabo | Jeremoabo | `Pesquisa e Extensão` (`103`) | Centro avançado de pesquisa e extensão |
| **132** | IF BAIANO - Salvador | Salvador | `Administrativo` (`104`) | Reitoria e gabinete administrativo central em Salvador |

---

## 3. Seção B — Registros Preservados sem Alteração (156 NO_CHANGE)

- **154 Campi Universitários Confirmados:** Mantêm rigorosamente seus IDs, nomes, coordenadas e categorias em `lista_ativos_cti`.
- **ID 76 (UFSB Campus Jorge Amado):** Permanece como o campus universitário federal de Itabuna.
- **IDs 1 e 19 (UNIRB Alagoinhas e UNIAENE Cachoeira):** Mantidos como campi operacionais com etiqueta de observação cadastral.

---

## 4. Seção C — Registros Desativados (1 DEACTIVATE)

- **ID 164 (FACULDADE UNIRB - SERRINHA):**
  - **Ação:** Proposta de atualização para `ativo = false`.
  - **Justificativa:** Unidade sem atividade ou matrículas reportadas no Censo da Educação Superior 2023.
  - **Garantia:** Nenhum dado é deletado do banco de dados (preservação histórica garantida).

---

## 5. Seção D — Novos Registros Aguardando Aprovação (50 INSERTs)

- Arquivo estruturado: [`pending_insert.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/migration/pending_insert.json)
- Chave de Idempotência: `codigo_ies + '_' + codigo_ibge` (ex: `599_2905701`)
- **Política de Inserção:** Nenhum registro será inserido sem aprovação prévia e execução de transação supervisionada.

---

## 6. Seção E — Registros Ambíguos e Resoluções

1. **UFSB em Itabuna (IDs 75 e 76 - BLK-01):**
   - *Resolução:* Reclassificação do ID 75 como Reitoria/Administrativo e manutenção do ID 76 como campus de graduação. Elimina sobreposição cartográfica sem exclusão de linhas.
2. **Ubaitaba (ID 174 - BLK-03):**
   - *Resolução:* A distância entre a coordenada atual e o centro urbano é de apenas ~230 metros (dentro da sede urbana). Mantém-se a coordenada atual, marcada para validação em vistoria de campo.
3. **UNIRB Alagoinhas (ID 1) e UNIAENE Cachoeira (ID 19):**
   - *Resolução:* Mantidos em funcionamento como unidades presenciais com anotação cadastral.

---

## 7. Seção F — Análise de Riscos e Mitigações

| Risco Identificado | Nível | Mitigação Estruturada no Plano |
| :--- | :---: | :--- |
| **Quebra de Foreign Keys** | Alto | Nenhum registro é excluído (`DELETE` estritamente proibido). |
| **Incompatibilidade de Schema** | Médio | As colunas existentes permanecem intactas; usa-se apenas extensão lógica (`ativo = false`). |
| **Duplicidade em Reexecução** | Alto | Chave de idempotência estrita (`codigo_ies_codigo_ibge`) para todos os futuros inserts. |
| **Indisponibilidade do Painel** | Baixo | Scripts de migração operam em transação ACID única com duração inferior a 2 segundos. |

---

## 8. Seção G — Mecanismo de Rollback

O script [`migration-rollback.sql`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/migration/migration-rollback.sql) foi confeccionado e auditado para restaurar em tempo zero o estado exato anterior a qualquer execução, reativando a UNIRB Serrinha e recompondo as categorias originais da SECTI.
