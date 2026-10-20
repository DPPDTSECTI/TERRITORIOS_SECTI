---
description: skill 
---

# REGRAS DE ACABAMENTO PROFISSIONAL (valem para toda tarefa)
Contexto: dashboard institucional do Governo da Bahia (SECTI). O visual deve parecer sóbrio, editorial e feito à mão, não um template gerado por IA.

PROIBIDO introduzir:
- gradientes em cards ou botões (exceto onde já existir e a tarefa mandar manter);
- pílulas aninhadas (forma arredondada dentro de forma arredondada);
- caixa-alta com espaçamento largo em textos menores que 13px;
- ícones coloridos sem significado (ícones decorativos usam a cor text-muted);
- divisores sob todo cabeçalho de card;
- subtítulos que repetem o título;
- sombras e bordas ao mesmo tempo no repouso do mesmo elemento;
- cores novas fora de tailwind.config.js / index.css.

OBRIGATÓRIO:
- texto mínimo de 12px; contraste AA nos dois temas;
- números com tabular-nums, em colunas de largura fixa;
- elementos que aparecem/somem usam `invisible`, nunca renderização condicional (layout estático);
- manter a interatividade existente (hover, tooltips, seleção, clique) dos gráficos e do mapa;
- não alterar lógica de dados, cálculos, filtros, testes nem exportações;
- trabalhar com mudanças mínimas (diffs pequenos), sem reescrever arquivos inteiros;
- ao terminar: npm run build, npm run test, git diff --stat e lista do que mudou.

ANTES de editar, escreva em até 5 linhas o plano do que vai mudar e em quais arquivos. Não faça nada além do pedido.