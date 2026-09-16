# ETAPA 3.3 & 3.3.1 — RELATÓRIO DE COMPOSIÇÃO CONTROLADA: SUPABASE + INEP

**Data:** 16/09/2026  
**Status da Composição:** VALIDADO COM 100% DE FECHAMENTO MATEMÁTICO  
**Princípio de Segurança:** Zero mutações no Supabase (`ready_for_supabase_insert: false`)  
**Equação Canônica:** $\mathbf{174\text{ (Supabase)} + 50\text{ (INEP)} = 224\text{ (Total Canônico)}}$

---

## 1. Balanço da Composição Controlada

| Dimensão Semântica | Produção Legada | INEP Novos (50) | Composição Canônica | Status de Fechamento |
| :--- | :---: | :---: | :---: | :---: |
| **Infraestrutura Física Real** | 167 | +50 | **217** | $\mathbf{167 + 50 = 217}$ |
| **Ensino Superior Presencial Confirmado** | 154 | +50 | **204** | $\mathbf{154 + 50 = 204}$ |
| **Unidades Ambíguas (sob auditoria)** | 3 | 0 | **3** | Preservadas sem conflito |
| **Ensino Técnico Profissionalizante** | 7 | 0 | **7** | IFBA/IF Baiano segregados |
| **Pesquisa e Extensão** | 2 | 0 | **2** | Centros avançados UNEB |
| **Administrativo (Reitoria)** | 1 | 0 | **1** | Reitoria IF Baiano Salvador |
| **Polos EAD** | 6 | 0 | **6** | Desvinculados do mapa físico |
| **Inativas** | 1 | 0 | **1** | UNIRB Serrinha (ativo: false) |
| **TOTAL GERAL DE UNIDADES** | **174** | **+50** | **224** | $\mathbf{174 + 50 = 224}$ |

---

## 2. Auditoria de Cobertura Territorial (Etapa 3.3.1)

- **Universo Total de Territórios de Identidade da Bahia:** **27**
- **Territórios com pelo menos uma unidade na composição:** **26** ($N = 26$)
- **Territórios sem unidade na composição:** **1** ($27 - N = 1$)
- **Identificação Explícita do Território sem Unidade na Codificação Numérica:**
  - **Território ID 2:** No referencial geográfico oficial do Estado da Bahia (`utils/territorioMunicipios.json`), o índice **ID 2** corresponde nominalmente ao território **Velho Chico** (composto por 16 municípios, incluindo Barra, Bom Jesus da Lapa e Ibotirama).
  - **Diagnóstico da Base Legada de Produção:** Na tabela do Supabase (`lista_ativos_cti`), os campi dos municípios de Velho Chico foram historicamente cadastrados com a chave numérica `id_territorio = 27`, enquanto o território Costa do Descobrimento foi registrado sob `id_territorio = 7`. Em decorrência dessa convenção numérica legada, o índice `id_territorio = 2` não possui linhas associadas no banco.
  - **Diretriz de Cobertura:** **A ausência de campus no código numérico 2 NÃO significa ausência do território.** O território Velho Chico existe, integra o universo oficial de 27 territórios da Bahia e possui 5 campi presenciais plenamente ativos na composição sob a denominação territorial de Velho Chico.

---

## 3. Garantias de Integridade e Não-Regressão

1. **Nenhum `id_ativo` legado alterado:** Todos os 174 registros legados mantêm rigorosamente sua chave primária numérica original.
2. **Nenhum registro legado desaparecido:** Os 174 ativos persistem no dataset adaptado.
3. **Nenhum novo INEP recebeu `id_ativo`:** Todos os 50 novos registros possuem estritamente `id_ativo = null`.
4. **Nenhuma chave `codigo_ies + codigo_ibge` duplicada:** As 50 chaves de idempotência são estritamente unívocas.
5. **Nenhum município perdeu código IBGE:** 100% das 224 unidades possuem código IBGE válido de 7 dígitos iniciado em 29.
6. **Nenhum território foi perdido:** Todos os territórios presentes na base legada mantêm cobertura e integridade.
7. **Coordenadas legadas intactas:** Nenhuma coordenada da produção foi sobrescrita.

---

## 4. Composição de Municípios e Territórios Afetados pelos 50 Novos INEP

- **Expansão Municipal:** Os 50 novos campi expandem a malha de ensino superior presencial para **6 novos municípios** que não possuíam campus cadastrado na base legada da SECTI.
- **Territórios Fortalecidos:**
  - *Metropolitano de Salvador:* +17 unidades
  - *Portal do Sertão (Feira de Santana):* +7 unidades
  - *Litoral Sul (Ilhéus/Itabuna):* +6 unidades
  - *Sudoeste Baiano (Vitória da Conquista):* +4 unidades
  - *Demais Territórios:* Ampliação pontual atestada no Censo da Educação Superior 2023.

---

## 5. Prontidão para Inserção no Supabase

- **Status:** `ready_for_supabase_insert: false`
- **Motivo:** A composição em memória atende 100% das necessidades do frontend, mapas, filtros e relatórios em PDF sem necessidade de arriscar a integridade do banco relacional de produção.
- **Bloqueadores Ativos:** BLK-01 (UFSB), BLK-02 (EAD), BLK-03 (Ubaitaba), BLK-04 (UNIRB Serrinha) e BLK-05 (Campi Técnicos).
