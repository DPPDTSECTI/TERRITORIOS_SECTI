# 🏛️ Relatório de Auditoria Específica: 219 Unidades INEP vs 174 Campi SECTI

**Data da Auditoria:** 16/09/2026, 10:46:28  
**Fontes Auditadas:** INEP/MEC Censo da Educação Superior (2023) e Catálogo de Ativos SECTI (`lista_ativos_cti`)

---

## 1. Segregação e Tipologia das 219 Unidades do INEP

As 219 presenças físicas do INEP na Bahia decorrem **exclusivamente de cursos de graduação presenciais regulares**. Polos de apoio EAD foram segregados formalmente.

| Tipologia de Unidade | Quantidade | Descrição Conceitual |
| :--- | :---: | :--- |
| **Sede da IES (`sede_ies`)** | **145** | Município onde se localiza a Reitoria / Matriz administrativa cadastrada no MEC (`CO_MUNICIPIO_IES`). |
| **Campus Presencial (`campus_presencial`)** | **70** | Campus descentralizado fora da sede de Universidade ou Instituto Federal (ex: UFBA Camaçari, UNEB Alagoinhas). |
| **Unidade Presencial (`unidade_presencial`)** | **4** | Prédio ou unidade acadêmica de faculdade isolada ou centro universitário privado com oferta física. |
| **Polo EAD (`polo_ead`)** | **0 nos 219** | **Isolados:** 36.358 ofertas EAD atuam em polos sem oferta de graduação presencial. Não computados como campus físico. |

---

## 2. Resultado da Classificação Cruzada

### A) Perspectiva das 219 Unidades Presenciais do INEP
- **Confirmados na SECTI**: **158** unidades presenciais já possuíam campus correspondente no painel SECTI.
- **Novos Presenciais do INEP**: **59** unidades com graduação presencial ativa no Censo 2023 que não faziam parte dos 174 campi originais da SECTI (predominantemente faculdades e centros universitários privados no interior).
- **Ambíguos**: **2** unidade(s) com divergência cadastral de denominação (ex: UNIAENE / FADBA em Cachoeira).

### B) Perspectiva dos 174 Campi Cadastrados na SECTI
- **Confirmados no INEP Presencial**: **139** campi (79.9%).
- **Ambíguos**: **2** campus.
- **Somente EAD**: **6** campi onde a IES só possui polo a distância registrado no município.
- **Não Encontrados no Censo 2023 de Graduação**: **27** campi (15.5%).

---

## 3. Detalhamento dos Casos Específicos dos 174 Campi da SECTI

### A) Casos Ambíguos (2)
- **ID 19 - Centro Universitário Adventista de Ensino do Nordeste (Cachoeira)**: SECTI denomina como "Centro Universitário Adventista de Ensino do Nordeste (UNIAENE)", enquanto no MEC/INEP está registrada como "FACULDADE ADVENTISTA DA BAHIA (FADBA)".
- **ID 1 - Centro Universitário UNIRB - Alagoinhas (Alagoinhas)**: Correspondência confirmada por denominação de campus ("Centro Universitário UNIRB - Alagoinhas").

### B) Casos com Atuação Exclusivamente EAD (6)
- **ID 28 - Universidade do Estado da Bahia - Campus Canudos (Canudos)**: IES atua no município exclusivamente via polo de ensino a distância (3 cursos EAD). Não possui graduação presencial registrada em 2023.
- **ID 38 - Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Euclides da Cunha (Euclides da Cunha)**: IES atua no município exclusivamente via polo de ensino a distância (1 cursos EAD). Não possui graduação presencial registrada em 2023.
- **ID 64 - Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Ilhéus (Ilhéus)**: IES atua no município exclusivamente via polo de ensino a distância (3 cursos EAD). Não possui graduação presencial registrada em 2023.
- **ID 92 - Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Juazeiro (Juazeiro)**: IES atua no município exclusivamente via polo de ensino a distância (2 cursos EAD). Não possui graduação presencial registrada em 2023.
- **ID 112 - Faculdade Dom Pedro II AFYA (Ribeira do Pombal)**: IES atua no município exclusivamente via polo de ensino a distância (22 cursos EAD). Não possui graduação presencial registrada em 2023.
- **ID 158 - Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Seabra (Seabra)**: IES atua no município exclusivamente via polo de ensino a distância (3 cursos EAD). Não possui graduação presencial registrada em 2023.

### C) Campi SECTI Não Encontrados no Censo de Graduação 2023 (27)
Estes campi físicos constam na base SECTI, porém **não registraram turmas ativas de graduação presencial** no Censo Superior 2023 do INEP:

| ID Ativo | Nome do Campus SECTI | Município | Território | Motivo Provável |
| :---: | :--- | :--- | :--- | :--- |
| 5 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Alagoinhas | Alagoinhas | Litoral Norte e Agreste Baiano | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 14 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Bom Jesus da Lapa | Bom Jesus da Lapa | Velho Chico | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 27 | Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Campo Formoso | Campo Formoso | Piemonte Norte do Itapicuru | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 31 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Catu | Catu | Litoral Norte e Agreste Baiano | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 88 | Universidade do Estado da Bahia - Campus Jeremoabo | Jeremoabo | Semiárido Nordeste II | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 58 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Governador Mangabeira | Governador Mangabeira | Recôncavo | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 60 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Guanambi | Guanambi | Sertão Produtivo | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 71 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Itaberaba | Itaberaba | Piemonte do Paraguaçu | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 76 | Universidade Federal do Sul do Bahia - Campus Jorge Amado | Itabuna | Litoral Sul | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 78 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Itapetinga | Itapetinga | Médio Sudoeste da Bahia | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 83 | Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Jaguaquara | Jaguaquara | Vale do Jiquiriçá | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 120 | Centro Universitário UNIFTC | Salvador | Metropolitano de Salvador | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 123 | FACULDADE DIPLOMATA | Salvador | Metropolitano de Salvador | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 127 | FACULDADE UNIRB - SALVADOR | Salvador | Metropolitano de Salvador | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 129 | Faculdade Anhanguera Unime de Salvador | Salvador | Metropolitano de Salvador | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 132 | Instituto Federal de Educação, Ciência e Tecnologia Baiano | Salvador | Metropolitano de Salvador | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 148 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Santa Inês | Santa Inês | Vale do Jiquiriçá | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 161 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Senhor do Bonfim | Senhor do Bonfim | Piemonte Norte do Itapicuru | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 164 | FACULDADE UNIRB - SERRINHA | Serrinha | Sisal | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 165 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Serrinha | Serrinha | Sisal | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 171 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Teixeira de Freitas | Teixeira de Freitas | Extremo Sul | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 174 | Instituto Federal de Educação, Ciência e Tecnologia da Bahia - Campus Avançado Ubaitaba | Ubaitaba | Litoral Sul | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 175 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Uruçuca | Uruçuca | Litoral Sul | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 178 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Valença | Valença | Baixo Sul | Campus de ensino médio/técnico sem curso de graduação em 2023 |
| 183 | FACULDADE UNINASSAU VITÓRIA DA CONQUISTA | Vitória da Conquista | Sudoeste Baiano | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 184 | Faculdade Anhanguera De Vitória Da Conquista | Vitória da Conquista | Sudoeste Baiano | Polo avançado de extensão/pesquisa sem oferta de graduação regular |
| 188 | Instituto Federal de Educação, Ciência e Tecnologia Baiano - Campus Xique-Xique | Xique-Xique | Irecê | Campus de ensino médio/técnico sem curso de graduação em 2023 |

---

## 4. Regra de Segregação: Polos EAD vs Campi Físicos

> ⚠️ **Diretriz Técnica para o Dashboard:**  
> Polos EAD **NÃO devem ser adicionados** à camada cartográfica de campi físicos (`tipo = 'Campi*'`).  
> O INEP registra 36.358 ofertas EAD na Bahia abrangendo os 417 municípios. Se cada polo EAD fosse plotado como campus físico, o mapa apresentaria mais de 3.500 pontos fictícios em farmácias, escolas parceiras e salas de apoio.  
> **Apenas as 219 unidades com turmas de graduação presencial** possuem infraestrutura física acadêmica permanente comprovada pelo Censo.

---

## 5. Artefatos Produzidos
- Base auditada em JSON: [`api-lab/inep/output/auditoria_campi.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/output/auditoria_campi.json)
