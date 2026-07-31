# PtiMap – Pontos do PTI Bahia

Aplicação React que carrega um mapa da Bahia e destaca, por meio de marcadores, todos os municípios participantes do programa **PTI**. O objetivo não é mais selecionar municípios, mas visualizar rapidamente quais localidades do estado fazem parte do programa.

---

## 🔐 Variáveis de Ambiente & Vercel Onboarding

Para rodar a aplicação localmente ou realizar o deploy na **Vercel**, as seguintes variáveis de ambiente devem ser configuradas:

| Variável | Escopo | Descrição | Exemplo / Valor Padrão |
|---|---|---|---|
| `VITE_SHAREPOINT_URL` | Build / Server / Client | URL do link de download direto da planilha oficial de dados no SharePoint. | `https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/...` |
| `UPSTASH_REDIS_REST_URL` | Server (Vercel KV) | URL REST do banco Upstash Redis conectado via Marketplace da Vercel (ou `KV_REST_API_URL`). | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Server (Vercel KV) | Token de autenticação REST do banco Upstash Redis conectado via Marketplace da Vercel (ou `KV_REST_API_TOKEN`). | `AX...` |
| `VITE_OPENROUTER_API_KEY` | Client (Opcional) | Chave da API OpenRouter utilizada pelos recursos de IA e assistente. | `sk-or-v1-...` |

### 🛠️ Configuração Local (`.env`)

1. Copie o arquivo de exemplo para o seu ambiente local:
   ```bash
   cp .env.example .env
   ```
2. Abra o arquivo `.env` e preencha a URL do SharePoint ou sua API Key se necessário.
3. Para testar o cache Upstash Redis localmente, adicione `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` com as credenciais do seu banco Upstash (ou use `vc env pull` via Vercel CLI).

---

### 🚀 Configuração na Vercel (Deploy & Serverless Functions)

Ao realizar o onboarding do projeto na **Vercel**:

1. Acesse o painel do projeto na Vercel: **Project Settings** $\rightarrow$ **Environment Variables**.
2. Adicione as seguintes chaves para os ambientes Production, Preview e Development:
   - **`VITE_SHAREPOINT_URL`**: `https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1`
   - **`VITE_OPENROUTER_API_KEY`**: *(opcional)*
3. **Integração com Upstash Redis (Vercel Marketplace)**:
   - No painel da Vercel, acesse a aba **Storage** (ou **Marketplace** $\rightarrow$ procure por **"Upstash for Redis"**).
   - Clique em **Install**, selecione seu projeto e crie/conecte uma instância do Upstash Redis.
   - A própria Vercel criará e injetará automaticamente as variáveis **`UPSTASH_REDIS_REST_URL`** e **`UPSTASH_REDIS_REST_TOKEN`** (além das variáveis de compatibilidade `KV_REST_API_URL` e `KV_REST_API_TOKEN`).
   - Nossas Serverless Functions (`api/sharepoint.js` e o agendador Cron `api/sharepoint-refresh.js`) identificarão automaticamente essas variáveis e manterão o cache sempre aquecido (TTL 90min, atualizado a cada 30min).

---

### 🧪 Testes Unitários (`vitest`)

O projeto possui uma suíte de testes unitários automatizados cobrindo normalizações, expansões de nomes e filtros.

Para executar os testes:
```bash
# Executa todos os testes unitários uma vez
npm test

# Executa os testes no modo interativo (watch mode)
npm run test:watch
```

---

## Estrutura de arquivos

```
mapfilter-BA/
├── src/
│   ├── App.jsx                    ← Componente de alto nível que exibe o mapa
│   ├── PtiMap.jsx                 ← Mapa interativo com pontos PTI
│   └── utils/
│       ├── Municipios.js          ← Lista dos 417 municípios da Bahia (para colorização)
│       └── territorioMunicipios.json  ← Agrupamento por territórios (usado para cores opcionais)
└── public/
    ├── BA_(1)9396399957704198.json ← TopoJSON do mapa da Bahia (~3.9 MB)
    └── ptiMunicipios.json         ← Lista dos 133 municípios atendidos pelo programa
```

---

## Instalação no projeto destino

### 1. Instalar dependências NPM

```bash
npm install topojson-client lucide-react
```

> **Tailwind CSS** também é necessário e deve estar configurado no projeto.

### 2. Copiar os arquivos

| Arquivo | Destino sugerido (Vite/CRA) |
|---|---|
| `PtiMap.jsx` | `src/components/` (ou o local de sua preferência) |
| `utils/Municipios.js` | `src/utils/` |
| `utils/territorioMunicipios.json` | `src/utils/` |
| `public/BA_(1)9396399957704198.json` | `public/` (raiz pública) |
| `public/ptiMunicipios.json` | `public/` |

> Ajuste os imports no topo de `PtiMap.jsx` caso altere os caminhos dos utilitários.

### 3. Ajustar vite.config.js (se necessário)

Para importar JSON com `assert { type: 'json' }` no Vite, certifique-se que `resolveJsonModule: true` está no `tsconfig` ou não há nenhuma configuração bloqueando import de JSON.

---

## Uso básico

```jsx
import PtiMap from './PtiMap';

export default function App() {
  return <PtiMap />;
}
```




---

(O componente `PtiMap` não recebe props; ele carrega automaticamente os dados e renderiza o mapa.)

---

## Funcionalidades

- Mapa SVG vetorial interativo da Bahia com zoom (0.5x–4x) e pan por arrasto
- Municípios participantes do PTI são destacados com a cor do seu território; os demais aparecem esmaecidos em cinza
- Círculos vermelhos no centro de cada município que participa do programa PTI Bahia
- Tooltip ao passar o mouse mostrando nome do município e indicação de pertencimento ao PTI
- Legenda simples explicando o marcador

*Removidas as opções de filtro, seleção e lista lateral – o foco agora é apenas a visualização dos pontos do programa.*

---

## Dependências

| Pacote | Versão mínima | Uso |
|---|---|---|
| `react` | 17+ | Framework (peer dependency) |
| `topojson-client` | 3.1+ | Converte TopoJSON → GeoJSON para renderizar o SVG |
| `tailwindcss` | 3+ | Estilização via classes utilitárias |

---

## Dados geográficos

- **TopoJSON** (`BA_(1)9396399957704198.json`): geometria vetorial de todos os 417 municípios da Bahia. Fonte: IBGE.
- **Territórios de Identidade** (`territorioMunicipios.json`): agrupamento dos 27 territórios definidos pela SEPLAN/BA, usado apenas para colorização por território.
- **PTI Bahia** (`ptiMunicipios.json`): lista dos municípios atendidos pelo programa; utilizada para posicionar os pontos no mapa.
