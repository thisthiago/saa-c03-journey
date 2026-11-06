# Revisão da trilha Redes na AWS: progresso

Branch `revisao/trilha-de-redes`, saída da `main` em 42e68b0. Não há commit nem push sem pedido do usuário. O plano está em [PLAN.md](PLAN.md), as decisões em [DECISIONS.md](DECISIONS.md) e a lista de achados em [ACHADOS.md](ACHADOS.md).

## PONTO DE RETOMADA

- **Situação:** revisão concluída em 06/11/2026. Não há item pendente.
- **Próximo passo, só com pedido do usuário:** commits com a skill `alisar-o-pelo` (um arquivo por commit), push e PR. O `scripts/auditoria-responsiva.mjs`, fora do git, não faz parte desta revisão.

## Partes

| Parte | O quê | Situação |
|---|---|---|
| 0 | Branch, documentos de controle e memória | Concluída em 05/11/2026 |
| 1 | Infraestrutura: diagramas, montagem, canvas e desenho vivo | Concluída em 05/11/2026 (o desenho vivo vai com cada fase) |
| 2 | f01 | Concluída em 05/11/2026 |
| 3 | f02 | Concluída em 05/11/2026 |
| 4 | f03 | Concluída em 05/11/2026 |
| 5 | f04 | Concluída em 05/11/2026 |
| 6 | f05 | Concluída em 05/11/2026 |
| 7 | f06 | Concluída em 05/11/2026 |
| 8 | f07 | Concluída em 05/11/2026 |
| 9 | f08 | Concluída em 06/11/2026 |
| 10 | f09 | Concluída em 06/11/2026 |
| 11 | Final | Concluída em 06/11/2026 |
| 12 | Fechamento | Concluída em 06/11/2026 |

## Parte 1, itens

| Item | O quê | Situação |
|---|---|---|
| 1a | `DiagramSpec` e renderizador SVG | Feito: `src/engine/diagram.ts` (+ teste), `src/ui/diagram/Diagram.tsx` |
| 1b | `diagram?` nos cartões de conceitos e nas atividades | Feito: tipos, `validateRegistry`, `MissionPage`, `ActivityRunner` |
| 1c | Tipo `build` (Montagem) | Feito: `src/activities/build/evaluate.ts` (+ teste), tipos, `evaluate`, `ui-logic`, `BuildView`, `registry.tsx`, `validateRegistry`. `dossier.ts` não depende do tipo |
| 1d | `PlacementBoard` com canvas | Feito: prop `canvas`, CSS em `shared.module.css`; conferido no desktop com a montagem de f01 (lista de peças embaixo do desenho) |
| 1e | Desenho vivo (f01, f02, f03, f04, final) | Feito junto de cada fase (passo 5 do ciclo) |
| 1f | Testes da infraestrutura | Feito: unitários, teclado e e2e (`smoke.spec.ts`: montagem e régua) |

## Registro

- 05/11/2026: plano aprovado. Branch criada e documentos de controle escritos.
- 05/11/2026: Parte 1 concluída (diagramas, `build`, canvas, testes unitários e de teclado).
- 05/11/2026: f01 concluída: montagem `net.f01.m1.a5`, três desenhos nos cartões, régua de endereços no chefe, `m3.a1` e opção 10.0.0.0/8 corrigidos. Cartões com desenho ocupam a linha inteira. Capturas `desktop-net-f1-*` conferidas.
- 05/11/2026: f02 concluída: montagem `net.f02.m3.a5`, três desenhos nos cartões, desenho vivo das rotas no chefe, achados aplicados (NAT regional conferido na documentação). Nós dos desenhos ganharam `labelSide` e halo no texto.
- 05/11/2026: f03 concluída: chefe corrigido (servidor de relatórios e fluxo até o banco), montagem `net.f03.m2.a6`, dois desenhos nos cartões, desenho vivo do caminho de cada fluxo (botão "Ver caminho"), achados das missões aplicados.
- 05/11/2026: f04 concluída: intel da missão 3 reescrito (o peering também isola), montagem `net.f04.m2.a5`, dois desenhos nos cartões, desenho vivo das topologias no chefe.
- 05/11/2026: f05 concluída: cenário "segredos" do chefe e briefing da missão 2 corrigidos, montagem `net.f05.m2.a5`, três desenhos nos cartões.
- 05/11/2026: f06 concluída: cenário `replica` com 40 Gbps e simulador híbrido corrigido, montagem `net.f06.m2.a5`, três desenhos nos cartões, fatos do Direct Connect conferidos.
- 05/11/2026: f07 concluída: intel da missão 2 reescrito, decisão de geoproximidade, montagem `net.f07.m3.a4`, dois desenhos nos cartões, "sem saúde" trocado.
- 06/11/2026: f08 concluída: chefe sem invalidação automática e critério das playlists corrigido, custo da invalidação corrigido (fase, conceito e Revisão), montagem `net.f08.m2.a4`, três desenhos nos cartões, fatos conferidos.
- 06/11/2026: f09 concluída: intel com pacote de proteção, camadas e Suricata, distratores novos, montagem `net.f09.m3.a4` (na missão 3, ver DECISIONS), dois desenhos nos cartões.
- 06/11/2026: final concluído: questões corrigidas e com terceira opção, seta do feedback trocada em todos os finais, desenho do projeto crescendo a cada escolha.
- 06/11/2026: fechamento: ARQUITETURA e CONTEUDO documentados, totais do README e do EXECUTAR recontados (1.218 atividades, 9 tipos de interação), memória atualizada. Suíte completa passou: `tsc -b`, `oxlint`, `vitest run` (697 testes), `npm run build` e `playwright test` (548 testes, celular, tablet e desktop).
