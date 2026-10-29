# Progresso

Branch `feat/mapa-de-servicos`, saída da `main` em 29/10/2026. Nenhum commit feito (aguarda pedido).

## Etapas

| Etapa | Situação |
|---|---|
| 1. Diagnóstico | Concluída (PLAN.md, INVENTORY.md, DECISIONS.md) |
| 2. Modelo de dados | Concluída: `src/engine/service-graph.ts` e 11 testes |
| 3. Protótipo | Concluída: layout com d3-force, tokens de território, desenho em SVG, aba em `/mapa` |
| 4. Interações | Concluída: seleção, painel, busca, filtros, zoom, arraste, pinça, teclado, lista e legenda |
| 5. Progresso | Concluída: estado por `phaseStatus`, próxima missão por `missionStatus`, caminho para liberar por `unmetRequirements` |
| 6. Refinamento | Concluída: nomes longos de território em duas linhas, faixa livre para os botões de zoom, legenda fechada no celular, movimento reduzido respeitado |
| 7. Validação | Ver abaixo |

## Arquivos

Novos: `src/engine/service-graph.ts` e `.test.ts`; `src/features/map/service-map.ts` e `.test.ts`, `ServiceMap.tsx` e `.test.tsx`, `ServiceGraph.tsx`, `ServicePanel.tsx`, `service-map.module.css`; `docs/grafo-de-servicos/*`.

Alterados: `MapPage.tsx`, `map.module.css`, `status.ts`, `styles/tokens.css`, `vite.config.ts`, `package.json`, `package-lock.json`, `tests/e2e/smoke.spec.ts`, `tests/e2e/screens.spec.ts`, `docs/ARQUITETURA.md`.

## Testes (29/10/2026)

- `npm run typecheck`: passou.
- `npm run lint`: passou, sem avisos.
- `npm test`: 622 de 622 na segunda rodada. Na primeira, `content.test.ts` estourou o limite de 5 s numa atividade longa por causa da carga da máquina; sozinho ele passa (teste antigo, não tocado aqui).
- `npm run build`: passou. `vendor-grafo` tem 5,4 KB comprimido e não é citado no `dist/index.html`.
- `npx playwright test smoke`: 17 de 17, incluindo os dois testes novos (desktop e 390 × 844).
- Suíte e2e completa: EM ANDAMENTO no momento desta anotação.
- Verificação visual com capturas em 1440 px (escuro) e 390 px (claro): sem rolagem horizontal, sem erros de página.

## Medidas

- Layout: cerca de 165 ms em Node, uma vez por carregamento da aba.
- Na abertura: 84 de 118 serviços desbloqueados e 34 bloqueados.

## Problemas encontrados

- O Vitest entrega o CSS processado; o teste dos tokens lê `tokens.css` do disco.
- Um conceito tem o mesmo título do serviço (Transit Gateway); o teste de revelação desconta esse caso.

## Próxima ação

Conferir o resultado da suíte e2e completa e revisar as capturas `screenshots/*-mapa-servicos.png`. Depois, se o usuário pedir, commits pela skill alisar-o-pelo.

## Último ponto validado

Testes unitários, de componente e smoke e2e passando; build conferido.
