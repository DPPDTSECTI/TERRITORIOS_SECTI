# Painel Territorial CT&I — SECTI Bahia

Painel web com ativos de CT&I, cadeias produtivas, cursos de ensino superior e indicadores (IFDM/FIRJAN) dos 27 Territórios de Identidade e 417 municípios da Bahia.

Produção: https://territorios-secti.vercel.app

## Documentação

- [docs/SISTEMA.md](docs/SISTEMA.md): arquitetura, módulos, temas, relatórios, deploy e pontos de atenção.
- [docs/INGESTAO-DE-DADOS.md](docs/INGESTAO-DE-DADOS.md): origem dos dados, carga do Supabase, cache, scripts e procedimentos de atualização.

## Começando

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build
npm test
```

As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são opcionais (há valores padrão em `src/services/supabase.js`). Para usar outro projeto Supabase, copie `.env.example` para `.env` e ajuste os valores; na Vercel, configure as mesmas chaves em **Settings → Environment Variables**.

## Grafo de conhecimento (graphify)

O repo traz um grafo do código em `graphify-out/` e a regra `.agents/rules/graphify.md` (`always_on`), que faz o Antigravity/Gemini consultar o grafo antes de responder sobre o código. Cada pessoa precisa fazer **uma vez**:

```bash
pip install graphifyy          # CLI usado pela regra (graphify query/path/explain/update)
graphify hook install          # atualiza o grafo a cada commit/checkout (hook local, não é versionado)
```

Opcional (MCP no Antigravity): adicione em `~/.gemini/antigravity/mcp_config.json`:

```json
"graphify": {
  "command": "uv",
  "args": ["run", "--with", "graphifyy", "--with", "mcp", "-m", "graphify.serve", "${workspace.path}/graphify-out/graph.json"]
}
```

Atualização manual: `graphify update .` (só AST, sem custo de API). Para recriar do zero, rode `/graphify .` no assistente.

## Scripts

| Comando | Função |
|---|---|
| `npm run dev` / `build` / `preview` | Desenvolvimento, build e pré-visualização |
| `npm test` / `test:watch` | Testes unitários (Vitest) |
| `npm run simplify-map` | Simplifica o TopoJSON do mapa (sobrescreve o arquivo) |
| `npm run optimize-images` | Gera WebP/AVIF das imagens de `public/img` |
