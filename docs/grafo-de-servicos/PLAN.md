# Mapa de serviços (grafo interativo) na página Mapa do AWS Quest

## Contexto

A rota `#/mapa` (`src/features/map/MapPage.tsx`, H1 "Trilhas") mostra hoje só a ordem sugerida das 12 trilhas. O desenho em grafo existe apenas dentro de cada trilha (`TrackMapPage.tsx`, com as fases em hexágonos). Não há nenhuma visão do conhecimento por **serviço AWS**.

O pedido é um grafo explorável, inspirado no llms3.com, com estas regras:
- cada nó é um serviço do catálogo real;
- a cor vem do território do serviço e o tamanho vem de uma métrica real do material;
- as linhas ligam só serviços que os dados relacionam;
- o estado de cada serviço (bloqueado, desbloqueado, em andamento ou concluído) sai do mesmo progresso que o resto do jogo usa.

Não entra um segundo mecanismo de progresso, e nada muda em conteúdo, regras de desbloqueio, fases ou pontuação.

**Decisões do usuário (29/10/2026):**
- "Domínio" é o **território** (10 grupos; cada serviço pertence a exatamente um).
- O grafo entra como **aba** em `/mapa`.
- O layout usa **d3-force** (só esse pacote).

## Diagnóstico (Etapa 1, feito nesta sessão, só leitura)

| Tema | O que existe | Onde |
|---|---|---|
| Página Mapa | Lista "Trilhas" em grupos (ordem de `recommendedTrackOrder`) e a faixa "Continuar" | `features/map/MapPage.tsx`, `map.module.css` |
| Mapa por trilha | Nós com posição absoluta, linhas em SVG, painel `PhasePanel` e rota vertical no celular | `TrackMapPage.tsx`, `layout.ts`, `status.ts` |
| Serviços | **118** `ServiceDef` (shortName, officialName, summary, glyph, availability e **um** `territory`) | `content/catalog/services.ts` |
| Territórios | **10** `TERRITORIES` (título, glyph, examDomains) | `content/catalog/catalog.ts` |
| Serviço e conceito | `ConceptDef.serviceIds` (769 conceitos). Todo serviço tem ao menos 1 conceito ensinado em fase disponível. | `content/modules/*` |
| Conceito e fase | `registry.conceptPhase` aponta a primeira fase que ensina o conceito (mesma regra do Codex) | `engine/registry.ts` |
| Questão e conceito | `ExamQuestion.concept`, `related` e `domain` (483 questões, com ids únicos validados) | `questions*.ts` |
| Progresso | Zustand fino sobre funções puras, gravado no `localStorage` (`aws-quest/progress`). Estados derivados nunca são gravados. | `store/gameStore.ts`, `engine/progress.ts` |
| Seletores oficiais | `phaseStatus`, `missionStatus`, `phaseProgress`, `unmetRequirements` e `masteryTier` | `engine/selectors.ts`, `engine/mastery.ts` |
| Revelação | Título de conceito só aparece com `progress.discovered[id]`; os outros viram "???" ou uma contagem | Codex, `PhasePanel` |
| Cores | Tokens claro e escuro em três escopos. Os domínios do exame usam tokens de status. **Não existe cor por território.** | `styles/tokens.css`, `ui/DomainTag.tsx` |
| Bibliotecas | Nenhuma de visualização | `package.json` |

Números medidos no registro real:
- **Questões distintas por serviço** (contando o conceito principal e os relacionados): vão de 0 a 77. O S3 tem 77, o EC2 68 e o IAM 63; 7 serviços não têm nenhuma.
- **Relações:** não existe relação explícita entre serviços. Existe co-ocorrência: 242 conceitos citam dois ou mais serviços, o que dá **330 pares**. Desses, 104 têm 2 ou mais conceitos em comum e 159 ligam territórios diferentes.
- **Progresso inicial:** 84 serviços começam desbloqueados e 34 bloqueados (por exemplo, Transit Gateway, WAF e EMR).

Lacunas e como cada uma será tratada:
1. Não há relação explícita entre serviços: usar os conceitos em comum.
2. Não há cor por território: criar tokens.
3. Não há estado por serviço: derivar das fases oficiais.
4. O banco de questões não filtra por serviço: o painel mostra só a contagem, sem link novo.

## Regras do modelo (Etapa 2): `src/engine/service-graph.ts`, puro

`buildServiceGraph(reg)` é calculado uma vez, no carregamento do pacote, e devolve nós, arestas, `byId` e `neighbors`.

**Nó.** Cada serviço com ao menos uma fase de ensino vira um nó (hoje, os 118). O nó guarda:
- `territory`;
- `conceptIds`;
- `phaseIds`: a `conceptPhase` de cada conceito, sem repetição e só de fases com `availability: 'available'`;
- `questions`: questões distintas pelo id. Uma questão conta no máximo uma vez por serviço, mesmo que vários conceitos dela citem o serviço.
- `mainQuestions`;
- `questionsByDomain` (D1 a D4).

**Aresta.** Dois serviços se ligam se e somente se pelo menos um conceito cita os dois. A aresta guarda os `conceptIds` em comum, e o peso é a quantidade deles. Não há outra fonte de relação; a função recebe o registro, então relações futuras entram no mesmo ponto.

**Estado.** `serviceProgress(state, reg, node, phaseStatuses, trackOrder)` usa os status oficiais de `phaseStatus`, calculados uma vez por mudança de progresso para todas as fases:
- **concluído:** todas as fases de ensino estão `completed`;
- **em andamento:** alguma fase está `in-progress` ou `completed`. Segue a mesma regra do mapa da trilha: abrir uma missão conta, abrir o Codex não;
- **desbloqueado:** alguma fase está `available`;
- **bloqueado:** caso contrário.

A função também devolve:
- as missões aprovadas sobre o total das fases de ensino (`phaseProgress`) e as fases concluídas sobre o total;
- `nextMissionId`: a primeira missão `in-progress` ou `available` de `missionStatus`, na ordem de `recommendedTrackOrder` e depois de `phase.order`;
- `unlockPhaseId`, só para serviço bloqueado: a fase de ensino com menos `unmetRequirements`.

## Geometria e lógica de tela: `src/features/map/service-map.ts`, puro

**Raio.** `radiusFor(q, max) = 7 + 15·log1p(q)/log1p(max)`, entre 7 e 22, crescente. Nenhum nó domina.

**Ordem dos territórios no anel.** É calculada de forma determinística: um algoritmo guloso pela afinidade (conceitos entre territórios), refinado com 2-opt. Os centros ficam numa elipse dentro de um mundo de 1200 × 800, e cada território recebe um arco proporcional à √(área dos seus nós).

**Simulação.** `layoutServices` usa d3-force:
- forças `forceLink` (forte dentro do território, fraca entre territórios, proporcional ao peso), `forceManyBody`, `forceCollide(r+4)` e `forceX`/`forceY` puxando para o centro do território;
- `randomSource` com semente e posição inicial em filotaxia;
- `stop()` seguido de cerca de 400 `tick()`, e depois uma passada só de colisão;
- nenhuma simulação contínua e nenhuma posição aleatória por renderização.

**Rótulos do território:** ficam acima de cada grupo.

**Rótulos dos nós.** `visibleLabels` faz um corte guloso por prioridade: primeiro o selecionado, o focado e os vizinhos; depois os maiores. Os rótulos têm tamanho constante na tela e são recalculados só no fim do zoom e na seleção. O rótulo curto tira o prefixo "Amazon "/"AWS "; o nome completo fica no painel e no aria-label.

**Vista.** `fitView`, `zoomAt` (mantém fixo o ponto sob o cursor) e `centerOn`, com limites de zoom.

**Teclado.** `nearestInDirection` escolhe o nó mais próximo dentro de um cone de ±60° na direção da seta.

**Filtros.** `matchesFilter` combina a situação (todos, desbloqueados, em andamento, concluídos, bloqueados) com uma seleção múltipla de territórios. "Desbloqueados" significa qualquer estado diferente de bloqueado.

**Busca.** `searchServices` ignora acento e caixa e procura em shortName, officialName e id. Encontra serviços bloqueados também.

## Interface (Etapas 3 e 4)

**`MapPage.tsx`.** O H1 "Trilhas" e a faixa "Continuar" ficam como estão. Abaixo deles entra uma navegação de visualização com duas opções:
- "Ordem das trilhas": a lista atual, sem mudança e como padrão;
- "Mapa de serviços": `?vista=servicos`, carregado com `lazy()` e com o fallback "Carregando…".

**`ServiceMap.tsx` (contêiner).** O estado fica na URL no padrão do Codex (estado local espelhado com `replace`): `servico`, `situacao`, `territorio` e `lista=1`. Ele tem:
- **Barra:** busca com lista de resultados (combobox), situação (grupo de opções com contagens), chips de território (servem também de legenda das cores, com nome e glyph), "Limpar filtros" e a troca entre grafo e lista.
- **Legenda compacta:** os estados com os símbolos, o tamanho ("o tamanho indica quantas questões do banco citam o serviço", com 3 círculos de exemplo) e as linhas ("os dois serviços aparecem juntos em pelo menos um conceito; quanto mais grossa, mais conceitos em comum").
- **Contagem ao vivo:** "Mostrando N de 118 serviços."
- **Lista (alternativa acessível):** agrupada por território, com estado em texto e ícone, questões e progresso, e os mesmos filtros e busca.

**`ServiceGraph.tsx` (SVG).**
- Camadas, de baixo para cima: arestas (`vector-effect: non-scaling-stroke`, opacidade pelo peso), nós, rótulos (com contorno na cor da superfície) e nomes dos territórios.
- **Estados do nó:**
  - desbloqueado: cor do território;
  - em andamento: cor do território com arco de progresso;
  - concluído: cor do território com anel e selo de check;
  - bloqueado: cinza (`--node-locked`), contorno tracejado e cadeado.
- **Seleção:** destaca o nó, as arestas e os vizinhos, e esmaece os demais sem removê-los. Os filtros também esmaecem.
- **Gestos:**
  - arrastar o fundo move o mapa, com um limite que separa o toque do arraste;
  - Ctrl ou ⌘ com a roda faz zoom (a pinça do trackpad também), enquanto a roda sozinha rola a página e mostra uma dica;
  - pinça com dois dedos no celular;
  - botões de aproximar, afastar e "Ajustar à tela".
- Durante o gesto, a transformação vai direto no `<g>` pela ref, a cada quadro, e só é gravada no estado no fim.
- **Teclado:** foco itinerante (roving tabindex), setas, Enter ou Espaço para selecionar, Esc para limpar, + e − para zoom, 0 para ajustar.
- **Busca:** seleciona, centraliza com animação curta (instantânea com movimento reduzido) e pulsa uma vez.
- `ResizeObserver` reajusta a vista se o usuário ainda não mexeu no mapa. Os listeners, o rAF e o observer são limpos ao desmontar.

**`ServicePanel.tsx`.** Usa os componentes `Card`, `Badge`, `IconTile`, `ProgressBar`, `Callout`, `ButtonLink` e `DomainTag`, e a classe `.conceptChip` de `map.module.css`. Mostra:
- território, nome curto e oficial, resumo do catálogo e o aviso de `availability` (legado ou encerrado);
- estado (`SERVICE_STATUS` em `status.ts`, ao lado de `PHASE_STATUS`);
- missões e fases concluídas;
- "N questões do banco citam o serviço (M como assunto principal)", com a divisão por domínio do exame;
- conceitos: só os descobertos, com link `/codex/:id` e o nível de domínio; os outros aparecem só como contagem ("Mais N conceitos ainda não descobertos");
- relações: os vizinhos por peso, cada um com "N conceitos em comum" e um botão que seleciona o vizinho;
- trilhas onde o serviço aparece.

As ações dependem do estado:
- **Desbloqueado:** "Começar" ou "Continuar: missão", com link `/missao/:id`, e "Ver no mapa da trilha" (`/trilha/:t?fase=:p`).
- **Bloqueado:** um callout "Para liberar, conclua: …" (usando `phaseMention`) e só o link para o mapa da trilha. Isso já é permitido hoje: o `MissionPage` continua barrando missões bloqueadas.
- **Concluído:** uma mensagem e o link para a revisão.

O painel nunca chama ações da store. Selecionar um serviço não muda o progresso.

## Visual, tema e cores

- `styles/tokens.css` ganha `--territory-<id>` (10 territórios) e `--node-locked`, nos três escopos que já existem (escuro padrão, `prefers-color-scheme: light` e `[data-theme='light']`).
- A paleta será definida na Etapa 3 com o validador da skill dataviz (`validate_palette.js`), no modo claro e no escuro, sobre a cor real do fundo do grafo. A verificação usa os pares vizinhos no anel, incluindo o par entre o último e o primeiro.
- Como são 10 categorias (acima das 8 recomendadas), a cor nunca é o único sinal: o nome do território aparece no mapa, nos chips, no painel e na lista.
- As cores ficam presas ao território e não mudam com os filtros.
- Os textos usam os tokens de texto, nunca a cor da série.
- O grafo segue o tema do app: escuro por padrão, claro quando escolhido.
- Os textos da interface seguem a escrita didática: frases completas, sem setas nem jargão.

## Refinamento (Etapa 6)

Desktop primeiro (1440 px nas Etapas 3 a 5); depois o celular, porque o pedido exige:
- **Abaixo de 1100 px:** o painel vai para baixo do grafo e recebe `scrollIntoView` quando o usuário escolhe um serviço, como no `TrackMapPage`.
- **Abaixo de 640 px:**
  - o grafo ocupa cerca de 62vh (entre 360 e 560 px) com `touch-action: none`, e a página continua rolando fora dele;
  - os botões têm 44 px;
  - os chips de filtro ficam numa linha `.scroll-x`;
  - a legenda vai num `<details>`;
  - aparecem menos rótulos.
- Movimento reduzido, contraste e as contagens ao vivo também entram nesta etapa.

## Desempenho e pacote

- O grafo, o layout e a ordem dos territórios são calculados uma vez por carregamento. Os estados são recalculados com `useMemo` por progresso. As 118 bolinhas e 330 linhas em SVG são poucas.
- `vite.config.ts` ganha o grupo `{ name: 'vendor-grafo', test: /node_modules[\\/]d3-/ }` **antes** de `vendor`, para que o d3 só baixe com a aba. É preciso conferir que o `dist/index.html` não referencia esse pacote.
- Dependências: `d3-force@3` e `@types/d3-force` (dev).

## Arquivos

**Novos:**
- `src/engine/service-graph.ts` e `service-graph.test.ts`;
- `src/features/map/service-map.ts` e `service-map.test.ts`;
- `ServiceMap.tsx`, `ServiceGraph.tsx`, `ServicePanel.tsx`, `ServiceMap.test.tsx` e `service-map.module.css` em `src/features/map/`;
- `docs/grafo-de-servicos/{PLAN,INVENTORY,PROGRESS,DECISIONS}.md`, no precedente de `docs/revisao-codex/` (fora do app publicado).

**Alterados:**
- `MapPage.tsx` e `map.module.css` (abas);
- `status.ts` (`SERVICE_STATUS`);
- `styles/tokens.css`;
- `vite.config.ts`;
- `package.json` e `package-lock.json`;
- `tests/e2e/smoke.spec.ts` e `screens.spec.ts`;
- `docs/ARQUITETURA.md` (seção "Mapa de serviços": regras, métrica, relações, estados, layout e testes).

**Não mexer:** conteúdo, regras do engine, outras páginas e `scripts/auditoria-responsiva.mjs` (fica só local).

## Execução, acompanhamento e retomada

1. Criar a branch `feat/mapa-de-servicos` a partir da `main`, sem commit.
2. Gravar os quatro arquivos de `docs/grafo-de-servicos/` com este diagnóstico, o inventário, as decisões e os critérios de aceite (§12 do pedido, itens 1 a 13).
3. Seguir as Etapas 2 a 7 nesta ordem. Ao fim de cada etapa, atualizar o PROGRESS.md: etapa, arquivos, testes e resultados, problemas, próxima ação e último ponto validado.
4. Se o limite de tokens chegar perto, parar de começar alterações e registrar o estado real.

Commit, push e PR só com pedido. Quando houver pedido:
- usar a skill alisar-o-pelo (um arquivo por commit, em português, sem coautoria nem menção a IA);
- fazer push e abrir o PR só depois da suíte completa passar.

Ficam fora do escopo, registrados no DECISIONS.md:
- arestas por `comparisons`;
- filtro por serviço no banco de questões;
- filtro por domínio do exame.

## Verificação (Etapa 7)

**`service-graph.test.ts`:**
- os nós existem no catálogo e cobrem todo serviço com fase de ensino;
- a contagem de questões é por id distinto (com uma fixture em que uma questão cita dois conceitos do mesmo serviço);
- as arestas só ligam serviços que de fato dividem conceito, com a lista exata dos conceitos, sem laço e sem duplicata;
- com o progresso inicial, o estado bate com `phaseStatus` (`aws.transit-gateway` bloqueado, `aws.s3` desbloqueado);
- com a Fase 1 da S3 concluída, o S3 fica em andamento;
- com todas as fases de ensino concluídas (fixtures de `engine/fixtures.ts`), o serviço fica concluído;
- `nextMissionId` sempre aponta uma missão jogável;
- `serviceProgress` não altera o estado recebido.

**`service-map.test.ts`:**
- o layout é determinístico, sem círculos sobrepostos e dentro do mundo;
- cada nó fica mais perto do centro do próprio território do que dos outros;
- os nomes de território não cobrem nós;
- o raio respeita os limites e cresce com as questões;
- os filtros se combinam e "Todos" restaura;
- a busca encontra "s3", "lambda" e "simple storage" e devolve serviços bloqueados;
- `zoomAt` mantém o ponto sob o cursor e `fitView` contém o desenho;
- `nearestInDirection` funciona;
- o `tokens.css` define `--territory-<id>` de todo território nos três escopos.

**`ServiceMap.test.tsx`** (com `matchMedia` e `ResizeObserver` simulados):
- um nó por serviço, e a lista completa;
- a busca abre o painel certo;
- o painel de um serviço bloqueado não tem link `/missao/` nem título de conceito não descoberto;
- os filtros esmaecem, a contagem ao vivo acompanha e "Limpar filtros" restaura;
- selecionar não muda `useGame.getState().progress` (mesma referência);
- o teclado funciona: setas, Enter e Esc.

**e2e:**
- **smoke, desktop:** abrir a aba, buscar "Lambda" e ver o painel;
- **smoke, 390 × 844:** busca, filtros e zoom visíveis, painel abaixo do grafo e nenhuma rolagem horizontal;
- **screens:** `{ name: 'mapa-servicos', path: '/#/mapa?vista=servicos&servico=aws.s3' }` nas 3 larguras;
- o smoke "o mapa lista todas as trilhas" (12 links) continua passando.

**Comandos:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (conferindo os pacotes no `dist`) e `npm run e2e`.

**Manual** (`npm run dev`, no tema escuro e no claro):
- 1440 px e 390 px;
- arrastar, Ctrl+roda e pinça (emulação de toque);
- só teclado;
- movimento reduzido;
- console sem erros;
- nenhuma tarefa longa depois do carregamento.

## Critérios de aceite (§12 do pedido)

1. Todo serviço exibido existe no catálogo (`registry.services`).
2. A cor de cada nó desbloqueado é a do seu território (`--territory-<id>`).
3. Serviços bloqueados aparecem em cinza (`--node-locked`), com contorno tracejado e cadeado.
4. Os estados vêm de `phaseStatus` e `missionStatus` (fonte oficial).
5. O tamanho usa o número de questões distintas que citam o serviço (documentado em DECISIONS.md).
6. A busca encontra os serviços pelo nome curto, oficial ou id, inclusive os bloqueados.
7. Os filtros funcionam, se combinam e "Limpar filtros" restaura.
8. Selecionar um nó mostra os detalhes corretos.
9. Os links respeitam o desbloqueio (serviço bloqueado não tem link de missão).
10. Navegação e progresso existentes continuam funcionando.
11. Funciona em desktop e celular.
12. Sem erros de renderização nem degradação relevante.
13. Os componentes existentes continuam funcionando (suíte completa).
