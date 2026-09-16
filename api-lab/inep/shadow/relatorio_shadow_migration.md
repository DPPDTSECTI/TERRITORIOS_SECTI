# 🛡️ Relatório de Shadow Migration: INEP × SECTI

**Etapa:** 2.4 — Shadow Migration (Dados Enriquecidos sem Modificação em Produção)  
**Data da Execução:** 16/09/2026, 11:08:27  
**Diretório Shadow:** `api-lab/inep/shadow/`

---

## 1. Síntese Quantitativa da Shadow Migration

| Métrica | Quantidade | Descrição Conceitual |
| :--- | :---: | :--- |
| **Total SECTI Atual** | **174** | Registros cadastrais da base original em produção. |
| **INEP Confirmados (Enriquecidos)** | **154** | Campi SECTI enriquecidos com Código IES, Código IBGE e turmas INEP. |
| **Total Campi Shadow** | **224** | 174 SECTI reconciliados + 43 novas presenças físicas INEP. |
| **Total Shadow com Graduação Presencial** | **207** | 154 confirmados + 3 ambíguos + 43 novas unidades INEP. |
| **Registros Preservados Exclusivos SECTI** | **17** | Campi técnicos (7), pesquisa/especial (3), EAD (6) e inativo (1). |
| **Novos Registros INEP (`origem = inep_nova`)** | **50** | Unidades presenciais credenciadas no Censo 2023 (`id_ativo = null`). |
| **Campi Somente EAD** | **6** | Polos a distância identificados na base SECTI. |
| **Campi Ensino Técnico/Profissional** | **7** | Campi de IFBA e IF Baiano focados na educação profissional média. |
| **Centros de Pesquisa / Reitoria Especial** | **3** | Estações científicas da UNEB (Canudos/Jeremoabo) e Reitoria IF Baiano. |
| **Campi Ambíguos** | **3** | UNIAENE (FADBA), UNIRB Alagoinhas e UFSB Jorge Amado. |
| **Não Localizados no Censo 2023** | **1** | UNIRB Serrinha (unidade privada inativa). |

---

## 2. Comparação Campo a Campo: Schema Atual vs Schema Shadow

O dataset shadow mantém **100% de compatibilidade reversa** com os campos esperados pelos componentes do React (`AtivosPage`, `PtiMap`, `SideMap`, `RelatorioPage`), adicionando as dimensões de inteligência oficial do MEC/INEP:

| Campo | Schema Atual (`lista_ativos_cti`) | Schema Shadow Enriquecido | Tratamento de Migração |
| :--- | :--- | :--- | :--- |
| **`id_ativo`** | `number` (1 a 194) | `number` ou `null` | **Preservado integralmente**. Novos registros INEP recebem `null` (sem IDs fictícios). |
| **`nome_ativo`** | `string` (denominação SECTI) | `string` | Preservado o nome original SECTI; `nome_ies` adicionado para nome oficial MEC. |
| **`sigla`** | `string` | `string` | Preservada a sigla original SECTI; corrigidas inconsistências de busca. |
| **`municipio`** | `string` | `string` | Padronizado conforme a base oficial do IBGE. |
| **`codigo_ibge`** | *Ausente* | `number` (7 dígitos) | **Novo campo oficial adicionado** para amarração geoespacial confiável. |
| **`id_territorio`** | `number` (1 a 27) | `number` (1 a 27) | **Preservado integralmente** via chave oficial SEPLAN-BA. |
| **`territorio_identidade`** | `string` | `string` | Preservado integralmente (27 territórios da Bahia). |
| **`latitude` / `longitude`** | `number` | `number` | **Coordenadas SECTI preservadas**; auditadas contra centróide municipal. |
| **`coordenada_origem`** | *Ausente* | `"secti" | "inep_resolvida"` | **Novo campo de governança cartográfica**. |
| **`tipo`** | `string` (4 categorias SECTI) | `string` | **Preservado 100%**. Estilos de ícones e cores do frontend mantidos. |
| **`codigo_ies`** | *Ausente* | `number` | **Novo campo oficial adicionado** (código de regulação no MEC). |
| **`nome_ies`** | *Ausente* | `string` | **Novo campo oficial adicionado** (razão institucional do INEP). |
| **`modalidade`** | *Ausente* | `string` | Presencial, A distância ou Não aplicável (Técnico). |
| **`categoria_administrativa`** | *Ausente* | `string` | Pública Federal, Pública Estadual ou Privada. |
| **`tipo_unidade`** | *Ausente* | `string` | campus_presencial, campus_tecnico, centro_pesquisa, reitoria, polo_ead. |
| **`origem`** | *Ausente* | `string` | `secti_confirmada`, `secti_preservada`, `secti_ambigua`, `inep_nova`. |
| **`status_reconciliacao`** | *Ausente* | `string` | Indicador semântico de integridade. |

---

## 3. Rastreabilidade e Governança Cartográfica de Coordenadas

> 📍 **Regra Fundamental:** As coordenadas geográficas cadastradas na SECTI foram **100% preservadas**. Nenhuma coordenada foi sobregravada automaticamente pelo INEP.

Foram detectadas **31 unidades** onde a coordenada SECTI diverge em mais de 5 km do centróide municipal:
- **ID 14 - Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Bom Jesus da Lapa (Bom Jesus da Lapa)**: Coord SECTI = `[-13.2621202, -43.5466799]`, Centróide = `[-13.251626, -43.409519]`
- **ID 35 - CENTRO UNIVERSITÁRIO MARIA MILZA (Cruz das Almas)**: Coord SECTI = `[-12.6095685, -39.0760809]`, Centróide = `[-12.670208, -39.10233]`
- **ID 88 - Universidade do Estado da Bahia - Campus Jeremoabo (Jeremoabo)**: Coord SECTI = `[-10.0152, -38.3975]`, Centróide = `[-10.077496, -38.346866]`
- **ID 53 - Universidade Estadual de Feira de Santana (Feira de Santana)**: Coord SECTI = `[-12.2004383, -38.9719222]`, Centróide = `[-12.25773, -38.961943]`
- **ID 60 - Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Guanambi (Guanambi)**: Coord SECTI = `[-14.3014979, -42.6936198]`, Centróide = `[-14.217592, -42.7858]`
- **ID 64 - Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Ilhéus (Ilhéus)**: Coord SECTI = `[-14.8029596, -39.1491653]`, Centróide = `[-14.792883, -39.043242]`
- **ID 65 - Universidade Estadual de Santa Cruz (Ilhéus)**: Coord SECTI = `[-14.7967668, -39.1733824]`, Centróide = `[-14.792883, -39.043242]`
- **ID 71 - Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Itaberaba (Itaberaba)**: Coord SECTI = `[-12.503564, -40.2502442]`, Centróide = `[-12.528837, -40.306002]`
- **ID 80 - Faculdade AGES de Jacobina (Jacobina)**: Coord SECTI = `[-11.1511923, -40.5733137]`, Centróide = `[-11.181565, -40.515603]`
- **ID 40 - FACULDADES INTEGRADAS DO EXTREMO SUL DA BAHIA (Eunápolis)**: Coord SECTI = `[-16.3952138, -39.4676593]`, Centróide = `[-16.370959, -39.580303]`
- **ID 110 - Universidade Federal do Sul da Bahia - Campus Sosígenes Costa (Porto Seguro)**: Coord SECTI = `[-16.4239768, -39.1363105]`, Centróide = `[-16.450241, -39.06428]`
- **ID 113 - CENTRO UNIVERSITÁRIO DE SALVADOR (Salvador)**: Coord SECTI = `[-12.9695405, -38.4219937]`, Centróide = `[-13.003795, -38.516259]`
- **ID 140 - CENTRO UNIVERSITÁRIO JORGE AMADO (Salvador)**: Coord SECTI = `[-12.9376671, -38.4107435]`, Centróide = `[-13.003795, -38.516259]`
- **ID 141 - CENTRO UNIVERSITÁRIO UNIRB (Salvador)**: Coord SECTI = `[-12.9594977, -38.4015539]`, Centróide = `[-13.003795, -38.516259]`
- **ID 117 - Centro Universitário Estácio da Bahia (Salvador)**: Coord SECTI = `[-12.9814679, -38.4463976]`, Centróide = `[-13.003795, -38.516259]`
- **ID 118 - Centro Universitário Maurício de Nassau de Salvador (Salvador)**: Coord SECTI = `[-12.9951914, -38.4521471]`, Centróide = `[-13.003795, -38.516259]`
- **ID 119 - Centro Universitário Ruy Barbosa Wyden (Salvador)**: Coord SECTI = `[-12.9611363, -38.4313397]`, Centróide = `[-13.003795, -38.516259]`
- **ID 120 - Centro Universitário UNIFTC (Salvador)**: Coord SECTI = `[-12.934439, -38.3920763]`, Centróide = `[-13.003795, -38.516259]`
- **ID 122 - FACULDADE CASTRO ALVES (Salvador)**: Coord SECTI = `[-12.9589265, -38.4010002]`, Centróide = `[-13.003795, -38.516259]`
- **ID 123 - FACULDADE DIPLOMATA (Salvador)**: Coord SECTI = `[-12.9376671, -38.4107435]`, Centróide = `[-13.003795, -38.516259]`
- **ID 126 - FACULDADE SÃO SALVADOR (Salvador)**: Coord SECTI = `[-12.9518961, -38.4995256]`, Centróide = `[-13.003795, -38.516259]`
- **ID 127 - FACULDADE UNIRB - SALVADOR (Salvador)**: Coord SECTI = `[-12.9594977, -38.4015539]`, Centróide = `[-13.003795, -38.516259]`
- **ID 129 - Faculdade Anhanguera Unime de Salvador (Salvador)**: Coord SECTI = `[-12.9366876, -38.3945855]`, Centróide = `[-13.003795, -38.516259]`
- **ID 130 - Faculdade Edufor de Salvador (Salvador)**: Coord SECTI = `[-12.9612895, -38.4311253]`, Centróide = `[-13.003795, -38.516259]`
- **ID 131 - INSTITUTO SALVADOR DE ENSINO E CULTURA (Salvador)**: Coord SECTI = `[-12.969604, -38.4221326]`, Centróide = `[-13.003795, -38.516259]`
- **ID 132 - Instituto Federal de Educação, Ciência e Tecnologia Baiano (Salvador)**: Coord SECTI = `[-12.9716309, -38.4381974]`, Centróide = `[-13.003795, -38.516259]`
- **ID 145 - UNIVERSIDADE CATÓLICA DO SALVADOR (Salvador)**: Coord SECTI = `[-12.9485141, -38.4133785]`, Centróide = `[-13.003795, -38.516259]`
- **ID 146 - UNIVERSIDADE SALVADOR (Salvador)**: Coord SECTI = `[-12.9851962, -38.4503646]`, Centróide = `[-13.003795, -38.516259]`
- **ID 147 - UNIVERSIDADE SENAI CIMATEC (Salvador)**: Coord SECTI = `[-12.938416, -38.387138]`, Centróide = `[-13.003795, -38.516259]`
- **ID 138 - Universidade do Estado da Bahia (Salvador)**: Coord SECTI = `[-12.952777, -38.4594595]`, Centróide = `[-13.003795, -38.516259]`
- **ID 160 - Faculdade AGES de Senhor do Bonfim (Senhor do Bonfim)**: Coord SECTI = `[-10.5169029, -40.1467704]`, Centróide = `[-10.459352, -40.188543]`

---

## 4. Auditoria dos Registros Preservados Exclusivamente pela SECTI (17)

Estes registros foram preservados na íntegra no dataset shadow para que a aplicação não perca ativos estratégicos:

### A) Campi de Ensino Técnico / Profissionalizante (7):
- **ID 5 - IF BAIANO Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Alagoinhas (Alagoinhas)**: Campus Alagoinhas do IF Baiano atua com ensino médio técnico integrado e subsequente (Agropecuária, Agroindústria). Ausente do Censo da Educação Superior por não ofertar graduação.
- **ID 27 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Campo Formoso (Campo Formoso)**: Campus Campo Formoso do IFBA atua exclusivamente com cursos técnicos (Manutenção em Informática, etc.). Sem graduação ativa em 2023.
- **ID 58 - IF BAIANO Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Governador Mangabeira (Governador Mangabeira)**: Campus Governador Mangabeira do IF Baiano atua exclusivamente com cursos técnicos de nível médio (Agropecuária, Informática).
- **ID 71 - IF BAIANO Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Itaberaba (Itaberaba)**: Campus Itaberaba do IF Baiano atua com formação profissionalizante e técnica de nível médio. Sem graduação no Censo 2023.
- **ID 83 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Jaguaquara (Jaguaquara)**: Campus Jaguaquara do IFBA vocacionado à educação profissional e técnica de nível médio. Sem cursos de graduação registrados no Censo 2023.
- **ID 174 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Avançado Ubaitaba (Ubaitaba)**: Campus Avançado Ubaitaba do IFBA é uma unidade de formação técnica sem turmas de ensino superior cadastradas no Censo 2023.
- **ID 188 - IF BAIANO Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Xique-Xique (Xique-Xique)**: Campus Xique-Xique do IF Baiano focado em formação técnica agropecuária e meio ambiente. Não possui turmas de graduação no Censo 2023.

### B) Estações Científicas, Centros de Pesquisa e Reitoria (3):
- **ID 28 - UNEB Universidade do Estado da Bahia - Campus Canudos (Canudos)**: Campus Avançado de Canudos abriga o Centro de Estudos Euclides da Cunha (CEEC) e o Parque Estadual de Canudos, atuando em pesquisa histórica/ambiental e extensão, com oferta acadêmica formal limitada a EAD.
- **ID 88 - UNEB Universidade do Estado da Bahia - Campus Jeremoabo (Jeremoabo)**: Unidade temática da UNEB em Jeremoabo que abriga o Museu de Arqueologia e Paleontologia (MAP) e centro de pesquisa ecológica. Não opera como campus de graduação regular.
- **ID 132 - IF BAIANO Instituto Federal de Educação, Ciência e Tecnologia Baiano (Salvador)**: Sede Administrativa e Reitoria Geral do IF Baiano (Rua do Rouxinol, Imbuí, Salvador). Estrutura executiva central, sem atividades diretas de ensino/graduação no local.

### C) Campi Atuantes Exclusivamente via Polo EAD (6):
- **ID 23 - UNIRB FACULDADE UNIRB - CAMAÇARI (Camaçari)**: A UNIRB em Camaçari encerrou atividades presenciais e opera no município estritamente como polo de apoio a distância (10 cursos EAD ativos no Censo 2023).
- **ID 38 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Euclides da Cunha (Euclides da Cunha)**: Campus Euclides da Cunha do IFBA figura no Censo Superior 2023 exclusivamente como polo de ensino a distância.
- **ID 64 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Ilhéus (Ilhéus)**: Campus Ilhéus do IFBA atua com cursos técnicos locais e oferta superior formalizada no Censo 2023 apenas na modalidade a distância.
- **ID 92 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Juazeiro (Juazeiro)**: Campus Juazeiro do IFBA figura no Censo Superior 2023 estritamente com oferta a distância.
- **ID 112 - UNIDOMPEDRO Faculdade Dom Pedro II AFYA (Ribeira do Pombal)**: Faculdade Dom Pedro II AFYA em Ribeira do Pombal atua estritamente como polo de ensino a distância (sem instalações permanentes de graduação presencial).
- **ID 158 - IFBA Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Seabra (Seabra)**: Campus Seabra do IFBA figura no Censo Superior 2023 exclusivamente com oferta a distância.

---

## 5. Novos Registros Presenciais Identificados no INEP (50)

Foram integrados ao shadow com a marcação de segurança `origem = "inep_nova"` e `id_ativo = null`, prontos para análise da equipe SECTI:

| Código IES | Instituição | Sigla | Município | Tipologia Semântica | Cursos Ativos |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 21280 | FACULDADE ANHANGUERA DE ALAGOINHAS (FPA) | FPA | Alagoinhas | `sede_da_ies` | 1 |
| 25439 | FACULDADE REGIONAL DO VALLE (FARVALLE) | FARVALLE | Amargosa | `sede_da_ies` | 2 |
| 3588 | CENTRO UNIVERSITÁRIO DOM PEDRO II (UNIDOMPEDRO) | UNIDOMPEDRO | Barreiras | `unidade_presencial` | 2 |
| 22125 | Faculdade de Ciências Jurídicas de Bom Jesus da Lapa | FACULDADE  | Bom Jesus da Lapa | `sede_da_ies` | 1 |
| 2023 | Centro Universitário FG (UNIFG) | UNIFG | Brumado | `unidade_presencial` | 1 |
| 22124 | Faculdade Pitágoras Unopar de Brumado | FACULDADE  | Brumado | `sede_da_ies` | 1 |
| 22787 | FACULDADE DE TECNOLOGIA E CIÊNCIAS - FTC CAMAÇARI (FTC CAMAÇARI) | FTC CAMAÇARI | Camaçari | `sede_da_ies` | 1 |
| 22443 | Faculdade Alfredo Nasser de Casa Nova (FAN) | FAN | Casa Nova | `sede_da_ies` | 1 |
| 17758 | Faculdades FAMEP Unidade Euclides da Cunha - BA (FAMEP) | FAMEP | Euclides da Cunha | `sede_da_ies` | 5 |
| 19298 | Faculdade Pitagoras de Eunapolis (FPE) | FPE | Eunápolis | `sede_da_ies` | 1 |
| 17876 | FACULDADE ESPÍRITO SANTO (FAES) | FAES | Eunápolis | `sede_da_ies` | 3 |
| 19780 | Faculdade Pitágoras Unopar de Guanambi (FPG) | FPG | Guanambi | `sede_da_ies` | 1 |
| 22104 | Faculdades Integradas Padrão (FIP GUANAMBI) | FIP GUANAMBI | Guanambi | `sede_da_ies` | 1 |
| 2163 | FACULDADE EUGÊNIO GOMES (FEG) | FEG | Ipirá | `sede_da_ies` | 1 |
| 22521 | FACULDADES FAMEP Unidade Irará - BA (FAMEP) | FAMEP | Irará | `sede_da_ies` | 2 |
| 20587 | Faculdade Pitágoras de Irecê (FPI) | FPI | Irecê | `sede_da_ies` | 1 |
| 13782 | FACULDADE DE SANTA CRUZ DA BAHIA (FSC) | FSC | Itaberaba | `sede_da_ies` | 2 |
| 22088 | Afya Faculdade de Ciências Médicas de Itabuna (AFYA ITABUNA) | AFYA ITABUNA | Itabuna | `sede_da_ies` | 1 |
| 22139 | FACULDADE SANTO ANTONIO DE ITABUNA (FSAI) | FSAI | Itabuna | `sede_da_ies` | 3 |
| 3588 | CENTRO UNIVERSITÁRIO DOM PEDRO II (UNIDOMPEDRO) | UNIDOMPEDRO | Jequié | `unidade_presencial` | 2 |
| 22202 | Faculdade Estácio de Juazeiro (EstácioJuazeiro) | EstácioJuazeiro | Juazeiro | `sede_da_ies` | 1 |
| 3588 | CENTRO UNIVERSITÁRIO DOM PEDRO II (UNIDOMPEDRO) | UNIDOMPEDRO | Luís Eduardo Magalhães | `unidade_presencial` | 3 |
| 3230 | FACULDADE LUIZ EDUARDO MAGALHÃES (FILEM) | FILEM | Luís Eduardo Magalhães | `sede_da_ies` | 1 |
| 11951 | FACULDADE DO SERTÃO BAIANO (FASBE) | FASBE | Monte Santo | `sede_da_ies` | 4 |
| 2140 | FACULDADE NOSSA SENHORA DE LOURDES (FNSL) | FNSL | Porto Seguro | `sede_da_ies` | 2 |
| 23155 | FACULDADE UNEX (UNEX) | UNEX | Porto Seguro | `sede_da_ies` | 1 |
| 25222 | FACULDADE ATENAS PORTO SEGURO | FACULDADE  | Porto Seguro | `sede_da_ies` | 1 |
| 11862 | FACULDADE ALFREDO NASSER DE REMANSO | FACULDADE  | Remanso | `sede_da_ies` | 5 |
| 4747 | FACULDADE REGIONAL DE RIACHÃO DO JACUÍPE (FARJ) | FARJ | Riachão do Jacuípe | `sede_da_ies` | 6 |
| 3669 | FACULDADE DOM LUIS DE ORLEANS E BRAGANÇA (FDL) | FDL | Ribeira do Pombal | `sede_da_ies` | 8 |
| 1461 | Centro Universitário Zarns - Salvador (ZARNS SALVADOR) | ZARNS SALVADOR | Salvador | `sede_da_ies` | 1 |
| 1641 | CENTRO UNIVERSITÁRIO SOCIAL DA BAHIA (UNISBA) | UNISBA | Salvador | `sede_da_ies` | 8 |
| 1524 | FACULDADE OLGA METTIG (FAMETTIG) | FAMETTIG | Salvador | `sede_da_ies` | 1 |
| 1937 | FACULDADE EVANGÉLICA DE SALVADOR (FACESA) | FACESA | Salvador | `sede_da_ies` | 2 |
| 2427 | FACULDADE LUSÓFONA DA BAHIA (FL-BA) | FL-BA | Salvador | `sede_da_ies` | 2 |
| 4460 | FACULDADE DOM PEDRO II DE TECNOLOGIA (FDP II Tec) | FDP II Tec | Salvador | `sede_da_ies` | 5 |
| 21103 | FIEP - FACULDADE INTERNACIONAL DE EVOLUÇÃO PROFISSIONAL (FIEP) | FIEP | Salvador | `sede_da_ies` | 2 |
| 21616 | FACULDADE ATUALIZA (ATUALIZA) | ATUALIZA | Salvador | `sede_da_ies` | 1 |
| 21871 | FACULDADE BAHIANA DE ENGENHARIA E CIÊNCIAS SOCIAIS APLICADAS (FBE) | FBE | Salvador | `sede_da_ies` | 3 |
| 152 | FACULDADE DE CIÊNCIAS CONTÁBEIS (FACIC) | FACIC | Salvador | `sede_da_ies` | 1 |
| 1302 | FACULDADE BATISTA BRASILEIRA (FBB) | FBB | Salvador | `sede_da_ies` | 2 |
| 3270 | FACULDADE SÃO BENTO DA BAHIA (FSBB) | FSBB | Salvador | `sede_da_ies` | 1 |
| 22763 | FACULDADE SANTA CASA (FSC) | FSC | Salvador | `sede_da_ies` | 4 |
| 5473 | FACULDADE DE CIÊNCIAS E TECNOLOGIA DA BAHIA (FACITE) | FACITE | Santa Maria da Vitória | `sede_da_ies` | 5 |
| 20537 | FACULDADE BAIANA DO SENHOR DO BONFIM (FABASB) | FABASB | Senhor do Bonfim | `sede_da_ies` | 1 |
| 18296 | Faculdade AGES de Tucano (Faculdade AGES) | Faculdade AGES | Tucano | `sede_da_ies` | 9 |
| 22086 | Faculdade de Educação Social da Bahia (FAESB) | FAESB | Valença | `sede_da_ies` | 3 |
| 17433 | FACULDADE SANTO AGOSTINHO DE VITÓRIA DA CONQUISTA (FASAVIC) | FASAVIC | Vitória da Conquista | `sede_da_ies` | 1 |
| 17498 | FACULDADE DE SAÚDE SANTO AGOSTINHO DE VITÓRIA DA CONQUISTA (FASA) | FASA | Vitória da Conquista | `sede_da_ies` | 1 |
| 21226 | FACULDADE SUDOESTE (FASU) | FASU | Vitória da Conquista | `sede_da_ies` | 2 |

---

## 6. Arquivos Gerados na Etapa 2.4
- Dataset Shadow de Campi: [`api-lab/inep/shadow/campi_shadow_secti.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/shadow/campi_shadow_secti.json)
- Dataset Shadow de Cursos: [`api-lab/inep/shadow/cursos_shadow_secti.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/shadow/cursos_shadow_secti.json)
- Dataset Shadow de IES: [`api-lab/inep/shadow/instituicoes_shadow_secti.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/shadow/instituicoes_shadow_secti.json)
- Estrutura de Diferenças: [`api-lab/inep/shadow/diff.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/shadow/diff.json)
