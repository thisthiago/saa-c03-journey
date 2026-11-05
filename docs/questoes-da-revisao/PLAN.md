# Questões da Revisão: plano

Reestruturação das questões da tela `#/revisao` (Revisão do dia e Treino livre) para o padrão do exame SAA-C03. Começou em 29/10/2026 na branch `revisao/questoes-da-revisao`, saída da `main` em 350f247.

## Por quê

Em 29/10/2026, a Revisão tinha 1.945 itens. Desses, 1.895 (97%) eram cópias automáticas das atividades das fases, feitas por `deriveReviewItems` (`src/engine/registry.ts`). Só 50 tinham sido escritos à mão (`reviewItems` nos conceitos).

As cópias se dividiam assim:
- 780 classificações de um item só, 465 delas com 2 caixas;
- 328 decisões geradas de associações (definição decorada);
- 543 decisões e 221 previsões, quase todas com 2 ou 3 alternativas e presas ao contexto ou ao simulador da missão;
- 23 estimativas.

Fora da missão, essas atividades perdem a empresa, os dados e o simulador. O exemplo do pedido, "Exames do mês para Standard-IA", era a previsão `s3x.f02.m3.a2`.

As fases estão boas e **não mudam**. A Revisão passa a ter questões próprias.

## O que muda

- **Motor:**
  - Os tipos `ReviewQuestion` e `ReviewSet` e o campo `review` em `ContentModule`.
  - Uma fase com conjunto não tem as atividades copiadas.
  - A validação do formato e dos conceitos.
  - Rodadas sem questão repetida (`src/engine/review.ts`).
  - No fechamento, saem a cópia automática e `deriveReviewItems`.
- **Tela:** na rodada, o título e o nome oficial do conceito só aparecem depois da resposta (`ReviewPage.tsx`).
- **Conteúdo:**
  - `src/content/modules/<módulo>/review/fNN.ts`, um arquivo por fase não final, reunidos em `review/index.ts` e ligados no `index.ts` do módulo.
  - Os 50 itens escritos à mão são avaliados na fase deles; o que for aproveitado vai para o arquivo novo, com o mesmo id.

Não mudam: fases, missões, atividades e labs; textos do Codex; Banco de questões (`#/revisao/questoes`) e simulado; simuladores; demais telas.

## Padrão das questões

- **Formato:** `decision`, com `xp: 5`.
  - Resposta única: 4 alternativas e 1 correta.
  - Resposta múltipla: `multiple: true`, 5 alternativas e 2 corretas, com "(Escolha DUAS.)" no fim da pergunta. Raramente, 6 e 3, com "(Escolha TRÊS.)".
- **Enunciado (`prompt`):** um parágrafo com cenário, requisitos, critério em negrito e a pergunta no fim. Números, políticas e tabelas vão em `exhibits`. Nada de "O que acontece?" sem critério.
- **Título:** diz qual é o problema, nunca a resposta.
- **Alternativas:**
  - Soluções reconhecíveis e com o mesmo nível de detalhe. A correta tem no máximo 1,5 vez o tamanho médio dos distratores e é a mais longa em no máximo 35% das questões.
  - Os distratores representam confusões típicas. Nada de alternativa absurda ou genérica.
- **`consequence`:** na correta, o requisito que ela atende; nos distratores, o requisito que falha.
- **Explicação:** três parágrafos ou mais:
  1. o requisito decisivo e por que a correta o atende;
  2. por que cada distrator falha (a tela só mostra a `consequence` das opções marcadas e da correta);
  3. "**Regra prática:** …".
- **Conceitos:** de 1 a 3, só os ensinados pela primeira vez na própria fase e de fato avaliados. O cenário pode usar o que fases anteriores ensinaram, nunca as posteriores.
- **Cobertura, conferida por teste:** todo conceito da fase em pelo menos 1 questão; os de relevância alta em 2.
- **Metas, conferidas por script:**
  - dificuldade perto de 25/50/25;
  - cerca de 15% de resposta múltipla, com pelo menos 3 por trilha;
  - domínios no total perto de 30/26/24/20.
- **Fatos:** conferidos na documentação da AWS e registrados em `docs/VERIFICACAO-DE-CONTEUDO.md` ("Questões da Revisão"). Números aparecem como premissa; nenhuma questão exige preço decorado.
- **Sem repetir o Banco:** nenhuma questão repete a decisão de uma questão do Banco sobre os mesmos conceitos.

## Ciclo de cada lote (uma fase)

Os scripts ficam em `~/.claude/projects/-home-thiago-Houer-plata-a-forma/questoes-da-revisao-scripts/` e rodam da raiz do projeto com:

`node --experimental-strip-types --no-warnings --import <pasta>/register.mjs <pasta>/<script>.mjs`

1. `dump.mjs <fase>`: conceitos da fase, itens antigos (do `baseline.json`), questões do Banco sobre os mesmos conceitos e o conjunto novo.
2. Escrever `review/fNN.ts` e ligá-lo no `review/index.ts` do módulo.
3. Conferir os fatos novos e registrá-los na VERIFICACAO.
4. `check.mjs <fase>`: formato, cobertura, tamanhos, título, frases proibidas, semelhança com o Banco e distribuição. Aviso aceito vai para o DECISIONS, com o motivo.
5. `npx vitest run src/content src/engine`.
6. `lotes/<fase>.json` com a classificação de cada item antigo, aplicada por `classify.mjs lotes/<fase>.json`.
7. `progress.mjs` atualiza a tabela do PROGRESS.

## Partes

1. Piloto: motor, tela, testes e três fases (`s3x.f02`, `net.f05`, `cmp.f06`), com pausa para aprovação.
2. Uma trilha por parte, na ordem de `MODULES`: Foundations, S3, IAM, Computação, Bancos de dados, Governança, Redes, Análise, Segurança, Integração, Arquivos e Arquitetura.
3. Fechamento:
   - remover a cópia automática;
   - teste de que toda fase não final tem conjunto;
   - documentação (`CONTEUDO`, `ARQUITETURA` e os totais no `README` e no `EXECUTAR`);
   - suíte completa.
