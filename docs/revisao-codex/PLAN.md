# Revisão didática do Codex: plano

## Escopo

A revisão reescreve as explicações dos conceitos do Codex (`#/codex`) para que ensinem o raciocínio da SAA-C03: a ideia, o mecanismo na AWS, quando usar, as alternativas parecidas e como o assunto aparece na prova.

- **Dentro do escopo:** os campos de texto dos conceitos em `src/content/modules/<módulo>/concepts/fNN-*.ts`.
- **Fora do escopo:** banco de questões, fases, missões, atividades, laboratórios, `reviewItems` dos conceitos e a interface.
- **Total:** 769 conceitos em 101 arquivos. A relevância para o exame é alta em 385, média em 312 e baixa em 72.
- **Branch:** `revisao/codex`, saída da `main` em 355ad30.
- **Commits:** nenhum commit, push ou PR sem pedido explícito (decisão do usuário em 24/10/2026). O trabalho fica no diretório de trabalho.

## Onde cada parte da explicação fica

A página do conceito ([ConceptPage.tsx](../../src/features/codex/ConceptPage.tsx)) não muda. O formato editorial usa os campos que ela já mostra:

| Parte editorial | Campo | Como a tela mostra |
|---|---|---|
| A ideia central | `summary` | Primeiro parágrafo do cartão, com marcação |
| Imagem mental (opcional), como funciona, exemplo, regra prática | `explanation[]`, um parágrafo por parte, nessa ordem | Parágrafos do cartão, com marcação |
| Quando usar | `useCases`, e `limitations` para os casos em que não serve | Listas, com marcação |
| Não confunda com | `comparisons` (`with` é o id de outro conceito) | Lista com o título do outro conceito |
| Armadilhas | `commonMistakes`, e `consequences` quando o custo do erro ensina | Listas de alerta |
| Fatos e julgamento | `facts` (comportamento documentado) e `recommendations` (julgamento de arquitetura) | Listas com selos diferentes |
| Como aparece na SAA-C03 | `exam.notes` | **Texto puro**: sem negrito, código nem links |

O `summary` também aparece nos cartões de Conceitos-chave das missões quando o cartão não tem `body` (cerca de 141 conceitos) e entra na busca do Codex. Por isso ele só muda para corrigir uma imprecisão ou um problema de clareza.

## Campos protegidos

Estes campos não mudam: `id`, `officialName`, `serviceIds`, `exam.domains`, `exam.relevance`, `tags`, `availability`, `prerequisites` e `reviewItems`. O `title` só muda se estiver errado. As `references` podem ganhar páginas oficiais, mas nunca perder. O `check.mjs` confere tudo isso contra o retrato inicial.

## Níveis de profundidade

- **Nível 1, fundamental.** Uma ideia bem delimitada: resumo, mecanismo e, se ajudar, um exemplo curto.
- **Nível 2, comparativo.** Conceito que costuma ser confundido com outro: acrescenta quando usar, comparação, armadilhas e notas da prova.
- **Nível 3, arquitetural.** A decisão depende de vários componentes ou trade-offs: mecanismo completo, exemplo, comparações e notas da prova.

Um conceito que já está claro e correto fica `unchanged`. O tamanho do texto não é medida de qualidade.

## Lotes

- **Piloto:** 5 conceitos (`infra.az`, `lc.rules`, `iam.roles`, `sqs.visibility` e `iam.eval-flow`), com parada para aprovação.
- **Demais lotes:** um arquivo por lote, na ordem de `MODULES` (foundations, storage, identity, compute, database, governance, network, analytics, security, integration, files e architecture) e dos arquivos `f01`…`fNN`. Arquivos com mais de 7 conceitos viram partes equilibradas de até 7. Os conceitos do piloto são pulados.

## Critérios de qualidade

- A ideia central se entende sem ler o resto.
- O mecanismo está correto e usa os nomes oficiais.
- A analogia, quando existe, ajuda e diz onde a comparação deixa de valer.
- Há exemplo quando ele ensina algo, e os critérios de escolha estão claros.
- As comparações mostram a diferença que muda a decisão.
- As notas da prova dizem que requisitos do enunciado apontam para o conceito, sem prometer que o assunto cai.
- Escrita em português claro, sem jargão de jogo, sem "X → Y" nem "A = B" na prosa, e com o termo em inglês explicado na primeira vez.
- Todo fato novo foi conferido na documentação oficial e registrado em `docs/VERIFICACAO-DE-CONTEUDO.md`, na seção "Revisão didática do Codex".

## Validação

- **A cada lote:**
  - `check.mjs`;
  - `npm run typecheck`;
  - `npm run lint`;
  - `npx vitest run src/content src/engine src/features/codex`;
  - captura do conceito mais longo do lote em desktop.
- **No fim:**
  - `check.mjs` sobre os 769 conceitos;
  - `npm test`, `npm run build` e `npm run e2e`;
  - capturas de uma amostra em desktop e celular;
  - conferência de links e referências;
  - leitura de uma amostra por módulo e comparação do `heur.mjs` antes e depois;
  - atualização do padrão em `docs/CONTEUDO.md`.

## Ferramentas

Os scripts ficam fora do repositório, em `/home/thiago/.claude/projects/-home-thiago-Houer-plata-a-forma/revisao-codex-scripts/`. Para usá-los, copie a pasta para o scratchpad e rode a partir da raiz do projeto:

```
node --experimental-strip-types --no-warnings --import <pasta>/register.mjs <pasta>/<script>
```

| Script | Para quê |
|---|---|
| `baseline.json` | Retrato dos 769 conceitos antes da revisão (gerado pelo `snap.mjs`) |
| `check.mjs` | Integridade: ids, arquivos, ordem, campos protegidos, referências, links, setas e "=" na prosa, marcação em `exam.notes`, resumos alterados e coerência com o inventário |
| `inventory.mjs` | Gera ou atualiza o `INVENTORY.csv`. Uso: `inventory.mjs --set situacao=validated revisao_tecnica=ok lote=3 -- id1 id2` |
| `dump.mjs` | Mostra os conceitos de um arquivo (`dump.mjs storage/f06`) ou de uma lista de ids |
| `heur.mjs` | Diagnóstico editorial por módulo |
| `apply.mjs` | Aplica um patch de lote (`export default { id: { campos } }`) usando o parser do TypeScript, reescrevendo só os campos de texto em ordem canônica |
| `finish.mjs` | Fecha um lote: lê `meta` (nível e tarefa do guia) e `unchanged` do patch, atualiza o CSV e o PROGRESS |
| `progress.mjs` | Recalcula o resumo e o PONTO DE RETOMADA do PROGRESS a partir do CSV e do `git status` |
| `shot.mjs` | Captura `#/codex/<id>` em desktop (e celular com `--mobile`); precisa do `npx vite preview --port 4173` rodando |
