# Revisão didática e interativa da trilha Redes na AWS

## Contexto

O usuário pediu, em 05/11/2026, para revisar a trilha **Redes na AWS** (módulo `network`, fases `net.f01`–`net.f09` e o final `net.final`) com três objetivos:
- deixar as atividades mais claras e menos ambíguas;
- colocar desenhos e diagramas;
- criar atividades de arrastar componentes para montar a rede, para a trilha não ser só pergunta e resposta.

Três revisões completas do conteúdo (todas as 103 atividades, lidas linha a linha e conferidas contra os simuladores) acharam problemas em todas as fases. Os mais graves:
- **f03, chefe:** deixar o banco aberto a 0.0.0.0/0 tira nota máxima.
- **f04, chefe:** o resultado contradiz o que a missão ensina.
- **f05, chefe:** o resultado contradiz o briefing.
- **f06, chefe:** a réplica tem duas respostas defensáveis.
- **f08, chefe:** um critério de sucesso diz o contrário do pedido.
- **Fatos errados:** custo de invalidação do CloudFront, tempo do Lambda@Edge, JWT em CloudFront Functions.
- **Distratores fracos:** cerca de dez decisões com 2 opções, sendo uma absurda.
- **Opção correta denunciada:** em várias atividades, a correta é bem mais longa que as outras.

A interface ainda não tem diagramas. Os únicos visuais são os HTML/CSS dos cartões de conceitos, e nenhum deles é de redes. Também não há montagem sobre desenho: os labs de rede são tabelas com selects e checkboxes.

### Decisões do usuário (05/11/2026)
- Escopo: **a trilha inteira** (9 fases e o final).
- As montagens **substituem** perguntas fracas do mesmo assunto, e a fase fica mais ou menos do mesmo tamanho. Ids novos para as montagens. As missões já aprovadas continuam aprovadas, porque `passedAt` fica salvo.
- **Desenho vivo** nos labs principais: f01 (régua de endereços), f02 (setas das rotas), f03 (caminho do pacote), f04 (ligações entre VPCs) e final (rede crescendo por etapa).
- Ritmo: **fazer em partes, salvando o status** em arquivo, sem pausa para aprovação.
- **Tarefa agendada:** uma única execução em 06/11/2026 às 00:59, que retoma do PONTO DE RETOMADA (já criada com CronCreate; existe só nesta sessão).
- Valem as regras de sempre:
  - sem commit nem push sem pedido explícito;
  - textos em PT-BR claro, sem jargão, setas ou frases telegráficas ([[escrita-didatica]]);
  - foco no desktop, 1440 px ([[foco-desktop]]);
  - fatos conferidos na documentação da AWS e registrados em `docs/VERIFICACAO-DE-CONTEUDO.md`.

## Parte 0: branch e controle

- Criar a branch `revisao/trilha-de-redes` a partir da `main`. Deixar `scripts/auditoria-responsiva.mjs`, que não está no git, intocado.
- Criar `docs/revisao-trilha-redes/` no padrão de `docs/revisao-codex/`:
  - **PLAN.md:** este plano, resumido.
  - **PROGRESS.md:** tabela das partes 0 a 12, com status, e a seção **PONTO DE RETOMADA** (parte, fase, item exato e próximo passo). É atualizado ao fim de **cada item**.
  - **DECISIONS.md:** decisões tomadas durante o trabalho, com o motivo.
  - **ACHADOS.md:** o apêndice deste plano, uma linha por achado com status (pendente, feito, descartado + motivo).
- Salvar uma memória de projeto `revisao-trilha-redes.md` e uma linha no `MEMORY.md`.

## Parte 1: infraestrutura (antes das fases)

### 1a. Diagramas declarativos (SVG)
- **Tipo puro** `DiagramSpec` em `src/engine/diagram.ts`:
  - `width`, `height` (viewBox), `label` (descrição completa para `aria-label`) e `caption?`;
  - `boxes`: `kind` região, vpc, zona, sub-rede pública, sub-rede privada, local da empresa, internet, conta ou genérico; `failed?` desenha hachurado;
  - `nodes`: `glyph`, `label`, `sub?` e `state` ok, falha ou apagado;
  - `links`: `from`/`to` são ids de node ou box; `style` contínuo ou tracejado; `arrow`; `label?`; `tone`; `crossed?`; `via?` com pontos intermediários;
  - `notes`.
- **Renderizador** `src/ui/diagram/Diagram.tsx` + `diagram.module.css`:
  - SVG escalável, só com os tokens de `src/styles/tokens.css`, para funcionar no tema claro e no escuro;
  - ícones do `Glyph` (`src/ui/Glyph.tsx`) aninhados em `<svg>`;
  - envolto em `<figure role="img" aria-label>`, como o `Frame` de `src/features/mission/visuals.tsx`.
- **Função pura de âncora das linhas** (borda do box, centro do node), com teste unitário.
- **Glyphs:** reaproveitar `network`, `route`, `router`, `waypoints`, `plug`, `firewall`, `shield`, `lock`, `globe`, `server`, `zone`, `tower` e `org`. Acrescentar ao `GlyphName` (`src/engine/types.ts`) só o que faltar, por exemplo um prédio para o local da empresa.

### 1b. Onde os diagramas aparecem
- Campo opcional `diagram?: DiagramSpec` em:
  - `IntelCardDef`: renderizado em `MissionPage.tsx`, junto do `<Visual>`;
  - `ActivityBase`: renderizado em `ActivityRunner.tsx`, entre o enunciado e os `exhibits`, e portanto visível também na solução guiada.
- Validação em `validateRegistry` (`src/engine/registry.ts`):
  - os ids citados nos links existem;
  - os elementos cabem no viewBox;
  - o `label` não está vazio.

### 1c. Novo tipo de atividade `build` (rótulo na tela: "Montagem")
- **Dados** (`src/activities/types.ts`):
  - `board: DiagramSpec` (o desenho de fundo);
  - `pieces: { id, text, glyph?, count? = 1, explanation, concepts? }[]`: tipos de peça; `count` cria cópias iguais;
  - `slots: { id, label, description?, x, y, w, h, expect: Record<pieceId, number>, explanation }[]`: lugares no desenho e o que cada um deve conter;
  - `scenario?`.
- **Bandeja fixa "Não entra nesta rede"** (id `__fora`). As peças que sobram vão para ela. A atividade fica completa quando a lista de peças esvazia, como na classificação.
- **Resposta:** `Record<chipId, slotId>`, com `chipId = "<pieceId>#<n>"`.
- **Avaliação** (`src/activities/evaluate.ts`):
  - casamento de multiconjunto por slot: corretas = Σ min(colocadas, esperadas) por tipo de peça;
  - na bandeja, uma cópia está correta enquanto não passa das cópias que sobram;
  - nota = chips corretos ÷ total de chips;
  - feedback por slot, com a `explanation` do slot quando ele está errado, e por peça;
  - assim cópias, "uma por zona" e distratores funcionam sem regra especial.
- **`referenceResponse`:** preenche cada `expect` e manda o resto para a bandeja.
- **`validateRegistry`:**
  - Σ esperado ≤ `count`;
  - ids válidos;
  - slots dentro do board;
  - toda montagem tem ao menos um distrator.
- **Pontos de ligação, seguindo `docs/ARQUITETURA.md`:** `ui-logic.ts` (`initialResponse`, `isComplete`, `incompleteHint`, `KIND_LABEL`), `views.tsx` (`BuildView`), `registry.tsx` e `src/engine/dossier.ts`.

### 1d. `PlacementBoard` com layout `canvas`
- Em `src/activities/shared/PlacementBoard.tsx`:
  - nova prop `canvas: { width, height, background: ReactNode, positions: Record<targetId, {x,y,w,h}> }`;
  - os destinos são posicionados em % sobre o desenho;
  - chips compactos, com ícone;
  - lista de peças e bandeja ao lado.
- Ficam como estão: o teclado, o toque e o arraste com `data-drop`, os anúncios `aria-live` e o `aria-label "Posicionar em X"`. Por isso `tests/e2e/helpers.ts` `place()` continua servindo.
- Abaixo de cerca de 720 px, cai no layout `bins`, com o desenho em cima (sem polir: foco no desktop).
- Estilos em `src/activities/shared/shared.module.css`.

### 1e. Desenho vivo nos labs
Cada lab ganha uma função pura que gera o `DiagramSpec` (ou a régua), com teste unitário, e um componente que a desenha ao lado ou acima da tabela atual:
- **f01:** régua de endereços. `src/simulators/vpcnet/ruler.ts` + `AddressRuler.tsx` no `VpcPlannerLab`. Cada sub-rede digitada vira um trecho do bloco da VPC, com sobreposição em vermelho e "fora da VPC" sinalizado.
- **f02:** `routeDiagram(config, response)` em `src/simulators/vpcnet/routing-diagram.ts`, usado no `RouteTableLab`. Desenha a VPC por zona, o IGW e o EIGW na borda e os NATs nas sub-redes. Há uma seta por rota escolhida (0.0.0.0/0 contínua, ::/0 tracejada), e o NAT sem saída aparece em falha.
- **f03:** `flowDiagram(world, flow, result)` em `src/simulators/reach/diagram.ts`, usado no `ReachLab`. Clicar num fluxo mostra o caminho de ida e de volta (internet, IGW, ACL de entrada, SG, destino, ACL de saída), com o ponto de bloqueio marcado a partir do `traceFlow`.
- **f04:** `topologyDiagram(...)` em `src/simulators/connect/diagram.ts`, usado no `ConnectLab`. Por cenário, mostra os peerings ou o hub do Transit Gateway e quem alcança quem (certo ou errado).
- **Final:**
  - campos opcionais `ArchConfig.diagram?` (desenho base) e `ArchOption.draw?` (o que a opção acrescenta) em `src/simulators/architecture/model.ts`;
  - `ArchitectureLab.tsx` mostra a rede crescendo acima de "Decisões até aqui";
  - os outros 11 finais não mudam.
  - A mesma parte troca a seta `${prompt} → ${label}` do feedback em `src/simulators/architecture/lab.ts` por texto. Isso vale para todos os finais e fica registrado no DECISIONS.

### 1f. Testes da infraestrutura
- Avaliação do `build` em `src/activities/evaluate.test.ts`: cópias, uma por zona, distrator, nota parcial.
- Teclado em `src/activities/keyboard.test.tsx`.
- Validação do registro e funções dos diagramas.
- Um e2e de montagem por clique em `tests/e2e/smoke.spec.ts`.

## Partes 2 a 11: uma fase por parte

Ordem: f01, f02, f03, f04, f05, f06, f07, f08, f09 e final.

### Ciclo de cada fase
1. Aplicar os achados do apêndice. Antes de mudar, conferir cada um contra o simulador e, quando for fato, contra a documentação da AWS.
2. Procurar o mesmo erro em `concepts/fNN-*.ts`, `review/fNN.ts` e `questions*.ts` do módulo, e corrigir só fatos errados.
3. Colocar 2 ou 3 diagramas fixos (nos cartões de conceitos ou na própria atividade), conforme o apêndice.
4. Criar a montagem da fase no lugar da atividade indicada:
   - id novo (próximo `aN` livre da missão), na mesma posição;
   - cada peça exige uma decisão real (nada de rótulo que entrega a resposta);
   - os distratores são confusões típicas;
   - explicação por peça e por slot.
5. Desenho vivo no lab, quando a fase tiver um.
6. Rodar `npx vitest run src/content src/engine src/activities src/simulators`, `npx tsc -b` e `npx oxlint`.
7. Conferir no desktop: `npx playwright test tests/e2e/screens.spec.ts -g net`, olhar as capturas `screenshots/desktop-net-*` e abrir a montagem nova.
8. Registrar os fatos na VERIFICACAO, marcar o ACHADOS e atualizar o PROGRESS (PONTO DE RETOMADA).

### Montagens planejadas (atividade substituída entre parênteses)
- **f01 m1, "Monte a VPC da loja"** (substitui `m1.a1`):
  - slots: borda da VPC, VPC inteira, zona a, zona b;
  - peças: internet gateway, security group, tabela de rotas principal, sub-rede web ×2 (uma por zona), NAT Gateway zonal;
  - distrator: "uma sub-rede que cobre as duas zonas".
- **f02 m3, "A saída da VPC"** (substitui `m3.a1`, que tem a opção meio certa):
  - slots: borda, pública A, pública B, aplicação A, aplicação B;
  - peças: IGW, EIGW, NAT Gateway ×2 (um por zona);
  - distratores: segundo internet gateway, NAT na sub-rede de aplicação.
- **f03 m2, "Cada regra na sua camada"** (substitui `m2.a3`, com o item ambíguo):
  - slots: ACL da pública, sg-web, ACL da privada, sg-db;
  - peças: negar 198.51.100.0/24 (só a ACL nega); 443 de qualquer lugar; 5432 do grupo sg-web (só o SG referencia grupo);
  - distrator: "liberar a resposta da porta 443" (o SG tem estado e a ACL padrão já permite);
  - premissa: as ACLs padrão permitem tudo.
- **f04 m2, "As tabelas do Transit Gateway"** (substitui `m2.a4`, com a ordem discutível):
  - slots: as propagações de cada tabela (produção, desenvolvimento, compartilhados);
  - peças: bloco de compartilhados ×2, produção, desenvolvimento;
  - distrator: produção na tabela de desenvolvimento.
- **f05 m2, "Os caminhos até os serviços"** (substitui `m2.a4`):
  - slots: tabela da sub-rede privada, sub-rede A, sub-rede B;
  - peças: endpoint de gateway do S3 e do DynamoDB (tabela), endpoint de interface do SQS ×2 (um por zona);
  - distratores: "endpoint de gateway do SQS", "security group no endpoint de gateway".
- **f06 m2, "Ligue a fábrica às duas Regiões"** (substitui `m2.a1`, que entrega a resposta):
  - peças: interface virtual privada, interface virtual pública, Direct Connect gateway, virtual private gateway ×2, Site-to-Site VPN de reserva;
  - distratores: VPC peering, internet gateway, interface de trânsito sem Transit Gateway.
- **f07 m3, "O DNS da redação e da VPC"** (substitui `m3.a3`):
  - peças: endpoint de entrada e de saída do Resolver, regra de encaminhamento, encaminhador condicional no DNS da redação;
  - distratores: zona hospedada pública, endpoint de interface, internet gateway.
- **f08 m2, "Monte a distribuição"** (substitui `m2.a3`, com o caso de cookie defensável):
  - peças: OAC no bucket, certificado do ACM em us-east-1, cookies assinados em /assinantes/*, CloudFront Function no pedido do ouvinte, Lambda@Edge no pedido à origem;
  - distratores: certificado em sa-east-1, bucket público.
- **f09 m1, "Defesa em camadas"** (substitui `m1.a3`, com o termo não definido):
  - peças: WAF na distribuição, Shield Advanced nos recursos da borda, Network Firewall entre a aplicação e o NAT, Firewall Manager nas contas, ACL na sub-rede, SG na instância;
  - distratores: WAF no Network Load Balancer, Shield Advanced "para tentativas de senha".

## Parte 12: fechamento

- **Documentação:** `docs/ARQUITETURA.md` (tipo `build`, `DiagramSpec`, desenho vivo) e `docs/CONTEUDO.md` (regras de escrita das montagens e dos diagramas).
- **Totais:** em `README.md`, "8 tipos de interação" passa a 9 e o total de atividades é recontado; os totais do `EXECUTAR.md` também são recontados.
- **Suíte completa:** `npx tsc -b`, `npx oxlint`, `npx vitest run`, `npm run build`, `npx playwright test`. Celular e tablet: avisar se algo falhar, sem bloquear.
- **Memória e status:** atualizar a memória do projeto e o PROGRESS (concluída).
- **Sem commit nem push:** quando for pedido, usar a skill `alisar-o-pelo`.

## Verificação ponta a ponta

- **Unitários:** `content.test.ts` garante que toda atividade tira nota 1 com a resposta de referência e que o estado inicial do lab fica abaixo de 0,7. Somam-se os testes novos do `build` e das funções de desenho.
- **e2e:** `tests/e2e/screens.spec.ts` (missões `net.*` e capturas desktop sem estouro horizontal) e o novo e2e de montagem.
- **No navegador:** `npm run dev`. Jogar a montagem de f01 e f02 com mouse, teclado e clique, e ver o desenho vivo reagir no lab de rotas. Conferir os temas claro e escuro.

---

