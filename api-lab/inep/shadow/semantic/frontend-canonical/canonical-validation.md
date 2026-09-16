# ETAPA 2.9 — RELATÓRIO DE HOMOLOGAÇÃO FINAL DO MODELO CANÔNICO NO DASHBOARD

**Data:** 16/09/2026  
**Status da Homologação:** HOMOLOGADO COM SUCESSO (AMBIENTE DEV)  
**Prontidão para Produção:** BLOQUEADA (`ready_for_production: false`)

---

## 1. Telas e Componentes Auditados

| Módulo / Tela | Componente React | Status | Comportamento com Modelo Canônico |
| :--- | :--- | :---: | :--- |
| **Dashboard Principal** | `src/components/DashboardPainel.jsx` | OK | Exibe 217 ativos físicos totais nos KPIs e contagens segregadas |
| **Ativos de CT&I** | `src/components/AtivosPage.jsx` | OK | Filtros por categoria refletem exatamente as 7 categorias canônicas |
| **Cursos de Graduação** | `src/components/CursosPage.jsx` | OK | Cursos vinculam-se aos 204 campi confirmados sem misturar EAD/técnicos |
| **Mapas Interativos** | `src/components/maps/PtiMap.jsx` e `SideMap.jsx` | OK | Modo infraestrutura física plota rigorosamente 217 pontos físicos |
| **Relatório Síntese** | `src/components/pdf/RelatorioSintese.jsx` | OK | Exibe capacidade instalada de ensino superior e infraestrutura de CTI |
| **Relatório Ativos** | `src/components/pdf/RelatorioAtivos.jsx` | OK | Categorias canônicas impressas sem duplicidade |
| **Relatório Ensino** | `src/components/pdf/RelatorioEnsino.jsx` | OK | Não lista polos EAD como unidades de graduação presencial |

---

## 2. Validação dos KPIs na Interface

| KPI Canônico | Valor Esperado | Valor Obtido | Status |
| :--- | :---: | :---: | :---: |
| **Infraestrutura Física Total** | **217** | **217** | VALIDADO |
| **Ensino Superior Presencial Confirmado** | **204** | **204** | VALIDADO |
| **Ensino Superior Presencial + Ambíguos** | **207** | **207** | VALIDADO |
| **Ensino Técnico** | **7** | **7** | VALIDADO |
| **Pesquisa e Extensão** | **2** | **2** | VALIDADO |
| **Administrativo** | **1** | **1** | VALIDADO |
| **EAD** | **6** | **6** | VALIDADO |
| **Inativas** | **1** | **1** | VALIDADO |
| **Total de Unidades Mapeadas** | **224** | **224** | VALIDADO |

---

## 3. Validação dos Filtros por Categoria

Cada filtro foi auditado para garantir a **ausência total de contaminação cruzada**:
- **Ensino Superior**: 204 confirmados + 3 ambíguos. Não inclui unidades técnicas, pesquisa nem polos EAD.
- **Ensino Técnico**: Exatamente 7 unidades de IFBA e IF Baiano com `nivel_ensino: ['tecnico']`.
- **Pesquisa e Extensão**: Exatamente 2 centros avançados (UNEB Canudos e UNEB Jeremoabo) com `oferta_presencial: false`.
- **Administrativo**: Exatamente 1 unidade predial (Reitoria IF Baiano Salvador).
- **EAD**: Exatamente 6 polos com `presenca_fisica: false`.
- **Inativo**: Exatamente 1 unidade (UNIRB Serrinha) com `ativo: false`.

---

## 4. Auditoria Cartográfica (Mapa)

- **Modo Padrão ("Infraestrutura Física"):** Plota exatamente **217** marcadores.
- **Pontos Excluídos do Mapa Físico:**
  - 6 Polos EAD (desprovidos de campus físico próprio)
  - 1 Unidade inativa
- **Composição dos 217 Pontos Físicos Plotados:**
  - 204 Campi de Ensino Superior Presencial Confirmados
  - 3 Unidades Ambíguas (sob auditoria cadastral)
  - 7 Campi de Ensino Técnico
  - 2 Centros de Pesquisa e Extensão
  - 1 Sede Administrativa / Reitoria

---

## 5. Auditoria por Território de Identidade (27 Territórios)

| Território de Identidade | Infra. Física | Ensino Superior | Técnico | Pesquisa | Administrativo | EAD |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1 - Bacia do Jacuípe** | 4 | 4 | 0 | 0 | 0 | 0 |
| **2 - Território 2** | 0 | 0 | 0 | 0 | 0 | 0 |
| **3 - Bacia do Rio Corrente** | 2 | 2 | 0 | 0 | 0 | 0 |
| **4 - Bacia do Rio Grande** | 11 | 11 | 0 | 0 | 0 | 0 |
| **5 - Baixo Sul** | 6 | 6 | 0 | 0 | 0 | 0 |
| **6 - Chapada Diamantina** | 1 | 1 | 0 | 0 | 0 | 1 |
| **7 - Costa do Descobrimento** | 10 | 10 | 0 | 0 | 0 | 0 |
| **8 - Extremo Sul** | 6 | 6 | 0 | 0 | 0 | 0 |
| **9 - Irecê** | 7 | 6 | 1 | 0 | 0 | 0 |
| **10 - Itaparica** | 4 | 4 | 0 | 0 | 0 | 0 |
| **11 - Litoral Norte e Agreste Baiano** | 8 | 7 | 1 | 0 | 0 | 0 |
| **12 - Litoral Sul** | 11 | 10 | 1 | 0 | 0 | 1 |
| **13 - Médio Rio de Contas** | 6 | 6 | 0 | 0 | 0 | 0 |
| **14 - Médio Sudoeste da Bahia** | 2 | 2 | 0 | 0 | 0 | 0 |
| **15 - Metropolitano de Salvador** | 50 | 49 | 0 | 0 | 1 | 1 |
| **16 - Piemonte da Diamantina** | 3 | 3 | 0 | 0 | 0 | 0 |
| **17 - Piemonte do Paraguaçu** | 3 | 2 | 1 | 0 | 0 | 0 |
| **18 - Piemonte Norte do Itapicuru** | 6 | 5 | 1 | 0 | 0 | 0 |
| **19 - Portal do Sertão** | 13 | 13 | 0 | 0 | 0 | 0 |
| **20 - Recôncavo** | 13 | 12 | 1 | 0 | 0 | 0 |
| **21 - Semiárido Nordeste II** | 6 | 5 | 0 | 1 | 0 | 2 |
| **22 - Sertão do São Francisco** | 9 | 8 | 0 | 1 | 0 | 1 |
| **23 - Sertão Produtivo** | 10 | 10 | 0 | 0 | 0 | 0 |
| **24 - Sisal** | 7 | 7 | 0 | 0 | 0 | 0 |
| **25 - Sudoeste Baiano** | 10 | 10 | 0 | 0 | 0 | 0 |
| **26 - Vale do Jiquiriçá** | 4 | 3 | 1 | 0 | 0 | 0 |
| **27 - Velho Chico** | 5 | 5 | 0 | 0 | 0 | 0 |

---

## 6. Auditoria por Município (Divergências Produção × Canônico)

Exibindo apenas os municípios onde a contagem ativa difere entre a produção legada e o modelo canônico:

| Município | Código IBGE | Produção | Canônico (Ativo Físico) | Diferença |
| :--- | :---: | :---: | :---: | :---: |
| **Salvador** | `2927408` | 0 | 39 | **+39** |
| **Salvador** | `-` | 26 | 0 | **-26** |
| **Feira de Santana** | `-` | 12 | 0 | **-12** |
| **Feira de Santana** | `2910800` | 0 | 12 | **+12** |
| **Vitória da Conquista** | `2933307` | 0 | 10 | **+10** |
| **Vitória da Conquista** | `-` | 7 | 0 | **-7** |
| **Alagoinhas** | `2900702` | 0 | 7 | **+7** |
| **Alagoinhas** | `-` | 6 | 0 | **-6** |
| **Juazeiro** | `-` | 6 | 0 | **-6** |
| **Barreiras** | `2903201` | 0 | 6 | **+6** |
| **Itabuna** | `2914802` | 0 | 6 | **+6** |
| **Juazeiro** | `2918407` | 0 | 6 | **+6** |
| **Valença** | `2932903` | 0 | 6 | **+6** |
| **Valença** | `-` | 5 | 0 | **-5** |
| **Santo Antônio de Jesus** | `-` | 5 | 0 | **-5** |
| **Barreiras** | `-` | 5 | 0 | **-5** |
| **Camaçari** | `-` | 5 | 0 | **-5** |
| **Teixeira de Freitas** | `-` | 5 | 0 | **-5** |
| **Camaçari** | `2905701` | 0 | 5 | **+5** |
| **Eunápolis** | `2910727` | 0 | 5 | **+5** |
| **Guanambi** | `2911709` | 0 | 5 | **+5** |
| **Irecê** | `2914604` | 0 | 5 | **+5** |
| **Jequié** | `2918001` | 0 | 5 | **+5** |
| **Luís Eduardo Magalhães** | `2919553` | 0 | 5 | **+5** |
| **Porto Seguro** | `2925303` | 0 | 5 | **+5** |
| **Santo Antônio de Jesus** | `2928703` | 0 | 5 | **+5** |
| **Senhor do Bonfim** | `2930105` | 0 | 5 | **+5** |
| **Teixeira de Freitas** | `2931350` | 0 | 5 | **+5** |
| **Ilhéus** | `-` | 4 | 0 | **-4** |
| **Irecê** | `-` | 4 | 0 | **-4** |
| **Itabuna** | `-` | 4 | 0 | **-4** |
| **Jequié** | `-` | 4 | 0 | **-4** |
| **Lauro de Freitas** | `-` | 4 | 0 | **-4** |
| **Paulo Afonso** | `-` | 4 | 0 | **-4** |
| **Senhor do Bonfim** | `-` | 4 | 0 | **-4** |
| **Bom Jesus da Lapa** | `2903904` | 0 | 4 | **+4** |
| **Brumado** | `2904605` | 0 | 4 | **+4** |
| **Lauro de Freitas** | `2919207` | 0 | 4 | **+4** |
| **Paulo Afonso** | `2924009` | 0 | 4 | **+4** |
| **Bom Jesus da Lapa** | `-` | 3 | 0 | **-3** |
| **Cruz das Almas** | `-` | 3 | 0 | **-3** |
| **Eunápolis** | `-` | 3 | 0 | **-3** |
| **Guanambi** | `-` | 3 | 0 | **-3** |
| **Jacobina** | `-` | 3 | 0 | **-3** |
| **Luís Eduardo Magalhães** | `-` | 3 | 0 | **-3** |
| **Serrinha** | `-` | 3 | 0 | **-3** |
| **Cruz das Almas** | `2909802` | 0 | 3 | **+3** |
| **Ilhéus** | `2913606` | 0 | 3 | **+3** |
| **Itaberaba** | `2914703` | 0 | 3 | **+3** |
| **Jacobina** | `2917508` | 0 | 3 | **+3** |
| **Cachoeira** | `-` | 2 | 0 | **-2** |
| **Brumado** | `-` | 2 | 0 | **-2** |
| **Capim Grosso** | `-` | 2 | 0 | **-2** |
| **Conceição do Coité** | `-` | 2 | 0 | **-2** |
| **Euclides da Cunha** | `-` | 2 | 0 | **-2** |
| **Itaberaba** | `-` | 2 | 0 | **-2** |
| **Itapetinga** | `-` | 2 | 0 | **-2** |
| **Porto Seguro** | `-` | 2 | 0 | **-2** |
| **Santo Amaro** | `-` | 2 | 0 | **-2** |
| **Seabra** | `-` | 2 | 0 | **-2** |
| **Xique-Xique** | `-` | 2 | 0 | **-2** |
| **Amargosa** | `2901007` | 0 | 2 | **+2** |
| **Cachoeira** | `2904902` | 0 | 2 | **+2** |
| **Capim Grosso** | `2906873` | 0 | 2 | **+2** |
| **Conceição do Coité** | `2908408` | 0 | 2 | **+2** |
| **Euclides da Cunha** | `2910701` | 0 | 2 | **+2** |
| **Itapetinga** | `2916401` | 0 | 2 | **+2** |
| **Santa Maria da Vitória** | `2928109` | 0 | 2 | **+2** |
| **Santo Amaro** | `2928604` | 0 | 2 | **+2** |
| **Serrinha** | `2930501` | 0 | 2 | **+2** |
| **Xique-Xique** | `2933604` | 0 | 2 | **+2** |
| **Amargosa** | `-` | 1 | 0 | **-1** |
| **Barra** | `-` | 1 | 0 | **-1** |
| **Caetité** | `-` | 1 | 0 | **-1** |
| **Campo Formoso** | `-` | 1 | 0 | **-1** |
| **Canudos** | `-` | 1 | 0 | **-1** |
| **Catu** | `-` | 1 | 0 | **-1** |
| **Coronel João Sá** | `-` | 1 | 0 | **-1** |
| **Jeremoabo** | `-` | 1 | 0 | **-1** |
| **Governador Mangabeira** | `-` | 1 | 0 | **-1** |
| **Ipiaú** | `-` | 1 | 0 | **-1** |
| **Itamaraju** | `-` | 1 | 0 | **-1** |
| **Jaguaquara** | `-` | 1 | 0 | **-1** |
| **Paripiranga** | `-` | 1 | 0 | **-1** |
| **Queimadas** | `-` | 1 | 0 | **-1** |
| **Ribeira do Pombal** | `-` | 1 | 0 | **-1** |
| **Santa Inês** | `-` | 1 | 0 | **-1** |
| **Santa Maria da Vitória** | `-` | 1 | 0 | **-1** |
| **Simões Filho** | `-` | 1 | 0 | **-1** |
| **São Francisco do Conde** | `-` | 1 | 0 | **-1** |
| **Ubaitaba** | `-` | 1 | 0 | **-1** |
| **Uruçuca** | `-` | 1 | 0 | **-1** |
| **Barra** | `2902708` | 0 | 1 | **+1** |
| **Caetité** | `2905206` | 0 | 1 | **+1** |
| **Campo Formoso** | `2906006` | 0 | 1 | **+1** |
| **Canudos** | `2906824` | 0 | 1 | **+1** |
| **Casa Nova** | `2907202` | 0 | 1 | **+1** |
| **Catu** | `2907509` | 0 | 1 | **+1** |
| **Coronel João Sá** | `2909208` | 0 | 1 | **+1** |
| **Governador Mangabeira** | `2911600` | 0 | 1 | **+1** |
| **Ipiaú** | `2913903` | 0 | 1 | **+1** |
| **Ipirá** | `2914000` | 0 | 1 | **+1** |
| **Irará** | `2914505` | 0 | 1 | **+1** |
| **Itamaraju** | `2915601` | 0 | 1 | **+1** |
| **Jaguaquara** | `2917607` | 0 | 1 | **+1** |
| **Jeremoabo** | `2918100` | 0 | 1 | **+1** |
| **Monte Santo** | `2921500` | 0 | 1 | **+1** |
| **Paripiranga** | `2923803` | 0 | 1 | **+1** |
| **Queimadas** | `2925808` | 0 | 1 | **+1** |
| **Remanso** | `2926004` | 0 | 1 | **+1** |
| **Riachão do Jacuípe** | `2926301` | 0 | 1 | **+1** |
| **Ribeira do Pombal** | `2926608` | 0 | 1 | **+1** |
| **Santa Inês** | `2927903` | 0 | 1 | **+1** |
| **São Francisco do Conde** | `2929206` | 0 | 1 | **+1** |
| **Seabra** | `2929909` | 0 | 1 | **+1** |
| **Simões Filho** | `2930709` | 0 | 1 | **+1** |
| **Tucano** | `2931905` | 0 | 1 | **+1** |
| **Ubaitaba** | `2932200` | 0 | 1 | **+1** |
| **Uruçuca** | `2932705` | 0 | 1 | **+1** |

---

## 7. Auditoria de Relatórios e Exportações em PDF

1. **Polos EAD:** Não são impressos como campi físicos nem inflacionam listas de cursos presenciais.
2. **Campi Técnicos:** Recebem badge específico de educação profissionalizante técnica.
3. **Centros de Pesquisa:** Identificados como patrimônio de C&T sem listagem fictícia de vagas de graduação.
4. **Reitoria:** Identificada como sede de gestão institucional.
5. **Inativa:** Oculta das tabelas de unidades em operação.

---

## 8. Bloqueadores para Migração para Produção

Permanecem 5 bloqueadores cadastrais que justificam a manutenção de `ready_for_production: false`:
1. **BLK-01 (Duplicidade UFSB Itabuna):** IDs 75 e 76 compartilham as mesmas coordenadas cartográficas.
2. **BLK-02 (Segregação de Polos EAD no Supabase):** 6 polos precisam de tabela específica para não constar na lista física de CTI.
3. **BLK-03 (Coordenada de Ubaitaba):** ID 174 necessita de georreferenciamento corrigido.
4. **BLK-04 (Status UNIRB Serrinha):** Decisão formal sobre arquivamento do ID 164.
5. **BLK-05 (Tagging de Campi Técnicos):** 7 unidades exigem atualização cadastral de tipo no banco de produção.
