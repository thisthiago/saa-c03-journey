# Arquitetura

## Camadas

As dependências seguem uma única direção:

```
features/ (telas) ──► activities/ + simulators/*/UI ──► engine/ (TS puro) ◄── content/ (dados)
```

| Pasta | Responsabilidade |
|---|---|
| `src/engine/` | Regras do jogo em TypeScript puro, sem React: tipos de domínio, registro de conteúdo, XP, níveis, domínio por conceito, revisão espaçada, desbloqueio, conquistas, persistência e seletores. |
| `src/content/` | Só dados: catálogo de serviços, domínios do exame, módulos de conteúdo e a tabela de preços em JSON. |
| `src/activities/` | Tipos de interação. Cada `kind` tem uma avaliação pura (`evaluate.ts`) e uma interface (`views.tsx`). Os laboratórios são despachados por `lab` em `lab/evaluate.ts` e `registry.tsx`. |
| `src/simulators/<domínio>/` | `model.ts` (puro e testado), `lab.ts` (objetivos e avaliação), interface `*.tsx` e estilos. |
| `src/features/` | Telas: Base, Mapa, Fase, Missão, Revisão, Codex, Dossiê e Sobre. |
| `src/store/` | Camada fina em Zustand sobre o engine. Grava o progresso no `localStorage` 150 ms depois de cada mudança e também no `pagehide`. |
| `src/ui/` | Kit visual (botões, cartões, selos, anéis de progresso, modal, RichText) e glifos próprios. |

## Modelo de conteúdo

- **Módulo** (`ContentModule`): a unidade de registro. Agrupa serviços, conceitos, trilhas, conquistas e o banco de questões (`questions`).
- **Trilha** (`TrackDef`): fases e um desafio final opcional.
- **Fase** (`PhaseDef`): dependências `requires` e `recommends`, conceitos, missões, simplificações, posição no mapa e `availability`.
- **Missão** (`MissionDef`): tipo `mission`, `boss` ou `final`; briefing, cartas de intel, atividades e debrief.
- **Atividade**: união discriminada por `kind`. Define os conceitos avaliados, o XP máximo, a dificuldade, as dicas e a explicação.

O progresso é indexado por IDs estáveis. Estados derivados (fase concluída, desbloqueio, nível) nunca são gravados: os seletores os calculam a partir do progresso.

## Regras do motor

| Regra | Valor |
|---|---|
| XP de uma atividade | `round(xpMax × nota × fatorTentativa × fatorDica)`. Só a melhoria sobre o melhor resultado anterior é concedida. |
| Fator de tentativa | 1 / 0,75 / 0,5 / 0,35. Depois da solução guiada, o teto é 0,25. |
| Dica | −15% cada, com piso de 0,55. |
| Bônus | Missão 20, chefe 60, desafio final 150 (uma vez cada). Revisão: 5 XP por conceito vencido, uma vez por ciclo. |
| Níveis | XP acumulado para o nível L = `50·L·(L−1)`. |
| Domínio | `m ← m + 0,4·w·(o − m)`, começando em 0,2. Peso `w`: 1 na primeira tentativa, 0,5 em nova tentativa, 0,2 depois da solução guiada, 1 na revisão. |
| Revisão (Leitner) | Intervalos de 0, 1, 3, 7, 16 e 35 dias. Sobe no máximo uma caixa por dia. "Dominado" exige m ≥ 0,8 e caixa ≥ 2. |
| Aprovação | Atividade 0,7; missão 0,7; chefe 0,75; desafio final 0,7, com pelo menos 0,5 em cada dimensão da rubrica. |
| Medalhas | Ouro ≥ 0,95; prata ≥ 0,85. |

Atividades com `reviewWeakNow` (o desafio final) colocam os conceitos com resultado fraco na fila de revisão imediatamente.

## Banco de questões

- **Formato** (`ExamQuestion` em `engine/types.ts`): conceito principal, conceitos relacionados, dificuldade (1 a 3), domínio do exame, cenário, pergunta, alternativas com o porquê de cada uma e explicação. Segue o guia do exame: múltipla escolha tem uma correta entre quatro; resposta múltipla tem duas ou mais corretas entre cinco ou mais. O registro recusa questões fora desse formato.
- **Correção** (`engine/exam.ts`): tudo ou nada, como no exame. Questão sem resposta conta como errada.
- **Progresso** (`submitExam` em `engine/progress.ts`): cada resposta atualiza o domínio do conceito principal e dos relacionados com o peso da revisão, então um erro traz o conceito de volta para a fila. Não concede XP, porque a mesma questão pode ser respondida de novo. Guarda o resultado por questão e os últimos 30 simulados em `progress.exam`; progresso salvo antes do banco recebe o campo vazio ao carregar.
- **Tela** (`features/review/QuestionBankPage.tsx`, rota `#/revisao/questoes`): filtros por trilha, conceito, dificuldade, domínio e situação (guardados na URL, então o Codex leva direto às questões de um conceito); treino com explicação na hora, começando pelas erradas; simulado com navegação livre, marcação para revisar e cronômetro opcional de 2 minutos por questão (130 minutos para 65 questões); resultado por domínio, por dificuldade e por conceito, com correção comentada.

## Persistência

- Chave `aws-quest/progress`, com `schemaVersion` e migrações em `engine/persistence.ts`.
- JSON corrompido é guardado à parte, e o jogo recomeça com um aviso.
- O Dossiê exporta e importa o progresso em JSON; o reset pede confirmação.

## Coerência garantida por testes

`src/content/content.test.ts` verifica:

- referências, ciclos e IDs duplicados;
- toda fase disponível tem missões, e todo conceito ensinado é avaliado e tem item de revisão;
- toda predição tem exatamente uma opção correta, **calculada pelo simulador**;
- em todo laboratório, o estado inicial fica abaixo de 70% e a solução de referência chega a 100%;
- toda atividade pode chegar a 100% com a resposta de referência;
- o banco de questões cobre as três trilhas e as três dificuldades, só avalia conceitos de fases disponíveis e não usa setas no texto;
- na trilha IAM, usuário, role, policy, trust policy, STS e SCP têm conceito ensinado, atividades, itens de revisão e questões de simulado.

## Como estender

**Nova trilha ou serviço**
1. Crie `src/content/modules/<id>/` com conceitos, fases e conquistas (veja `modules/foundations/` como exemplo compacto).
2. Se for um território novo, acrescente-o em `content/catalog/catalog.ts`; serviços novos vão em `content/catalog/services.ts`.
3. Registre o módulo em `src/content/index.ts`. A ordem de `MODULES` é a ordem das trilhas na Base e define a primeira missão sugerida a quem começa.

As telas já tratam várias trilhas:
- a Base lista uma por cartão;
- o mapa mostra o território, as trilhas recomendadas (`TrackDef.recommends`) e o motivo de bloqueio (`TrackDef.requires`);
- `phaseRef()` (`app/format.ts`) acrescenta o nome da trilha onde fases de trilhas diferentes aparecem juntas (Codex, Sobre, pré-requisitos);
- o Codex mostra cada conceito uma vez, na primeira fase que o ensina;
- a próxima missão sugerida prefere a trilha em que a pessoa estava jogando.

O teste do engine prova a extensibilidade com módulos de exemplo: uma segunda trilha, dependência entre trilhas, ciclos entre trilhas (detectados no grafo global) e a preferência pela trilha em andamento.

**Desafio final de uma trilha**
Use o laboratório `architecture`. As dimensões da rubrica (com o domínio do SAA-C03 de cada uma), o título do relatório, grupos de perguntas com seção própria (ex.: responsabilidades) e o motivo de cada alternativa rejeitada (`whyNot`) vêm da configuração.

**Novo tipo de atividade**
1. Declare o tipo em `activities/types.ts`.
2. Implemente a avaliação em `evaluate.ts`, a interface em `views.tsx` e os casos em `registry.tsx` e `ui-logic.ts`.

**Novo laboratório**
1. Crie `simulators/<domínio>/` com `model.ts`, `lab.ts` (configuração, resposta, solução e avaliação) e a interface.
2. Acrescente o caso em `activities/lab/specs.ts`, `lab/evaluate.ts`, `registry.tsx` e `ui-logic.ts`.

**Nova predição**
1. Acrescente a variante em `activities/predict/specs.ts`.
2. Implemente a resolução em `predict/resolve.ts`, executando o simulador.

**Motor de políticas (`simulators/policy/`)**
Peça reutilizável para qualquer trilha que precise decidir acesso:
- `core.ts`: curingas e faixas de IP, compartilhados com o simulador de acesso do S3;
- `model.ts`: `evaluate(cenário, requisição)` segue o fluxo documentado (Deny explícito, RCP, SCP, política de recurso por tipo de principal, identidade, boundary e session policy; duas avaliações entre contas; exceções de trust policy e key policy) e devolve decisão, camada, código de motivo e rastro em português;
- `builder.ts` e `PolicyBuilder.tsx`: construtor guiado com JSON ao vivo;
- `layers.ts` e `PolicyLayersLab.tsx`: bibliotecas de statements por camada e matriz de decisões.

Os simuladores `sts/` (AssumeRole) e `org/` (árvore com SCPs por nível) montam cenários e delegam a decisão ao motor. Trilhas futuras (KMS, VPC endpoints, Secrets Manager) podem reaproveitar o mesmo cenário (`PolicyScenario`) e acrescentar tipos de recurso.

**Fase ainda incompleta**
Marque `availability: 'in-construction'`. A fase aparece no mapa sem ação de iniciar.

## Mapa da trilha

O campo `map` de cada fase é o centro do hexágono num canvas de 900 de largura. A altura padrão é 720 e pode ser alterada por trilha em `TrackDef.mapHeight`. As medidas ficam em `src/features/map/layout.ts`, que é usado tanto pelo desenho quanto pelos testes.
- **Tamanho dos nós:** o hexágono, o selo e o rótulo escalam junto com o mapa (CSS em `cqw`). Por isso, uma posição válida vale em qualquer largura.
- **Rota vertical:** abaixo de 640 px de mapa, a tela mostra a rota vertical no lugar do grafo.
- **Linhas:** seguem o estilo de mapa de metrô. Cada linha sai na horizontal, muda de altura num corredor logo antes da coluna do destino e entra pela esquerda.
- **Como posicionar:** organize as fases em colunas por dependência. Nenhuma fase deve ficar na altura de uma linha que atravessa a coluna dela.

**Testes do layout:**
- **`content.test.ts`** roda no CI e falha se houver nós sobrepostos, nós fora do mapa, linhas por cima de um nó (ou do selo e do rótulo das fases que a linha liga), linhas sem fase em comum correndo juntas ou uma dependência à direita da fase que depende dela.
- **`tests/e2e/map-layout.spec.ts`** mede a tela real em 680, 1000, 1100 e 1440 px. Ele também confere se o número de linhas estimado para cada rótulo cobre o número de linhas que o navegador de fato desenha.

## Build

O pacote é dividido em bibliotecas (`vendor`), conteúdo comum (`content`), um pacote por módulo de conteúdo (`content-foundations`, `content-storage`, `content-identity`, `content-compute`, `content-database`) e aplicação. As telas além da Base são carregadas sob demanda.
