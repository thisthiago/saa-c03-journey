# Revisão didática do Codex: decisões editoriais

Decisões que precisam continuar valendo em todos os lotes. Cada decisão nova entra aqui com a data.

## Estrutura (24/10/2026)

- **Ordem dos parágrafos em `explanation`:** imagem mental (opcional), como funciona na AWS, exemplo e regra prática. Os parágrafos não têm título. O exemplo começa com "Exemplo:", e a regra prática com "**Regra prática:**".
- **Regra prática:** uma ou duas frases, sempre no último parágrafo de `explanation`. Não fica em `exam.notes`.
- **`exam.notes` é texto puro.** A tela não interpreta negrito, código nem links nesse campo (descoberto nas capturas do piloto). Os sinais do enunciado vão entre aspas duplas. O `check.mjs` acusa erro se houver marcação.
- **"Quando usar"** só existe quando o conceito é algo que se escolhe (um serviço, um recurso, uma configuração). Conceitos que explicam como a AWS funciona, como o `iam.eval-flow`, não ganham `useCases`.
- **Fatos repetidos:** um fato que já está no `summary` não se repete em `facts`.
- **Itens de lista** novos terminam com ponto final. Listas antigas só foram padronizadas quando a própria lista foi reescrita.

## Analogias (24/10/2026)

- Use analogia só quando a ideia é abstrata e a comparação é familiar: crachá para role, quadro de tarefas para visibilidade, arquivo de escritório para lifecycle, prédios independentes para AZs.
- Toda analogia termina com "O limite da comparação: …" quando há risco de levar a uma conclusão errada.
- Conceitos de lógica de permissões, consistência ou durabilidade preferem um **modelo mental técnico** a uma analogia. Exemplo: no `iam.eval-flow`, separar as políticas que concedem das que limitam.
- Conceitos de nível 1 com mecanismo simples não precisam de analogia.

## Profundidade (24/10/2026)

- Nível 1: resumo, um parágrafo de mecanismo e, se ajudar, exemplo e regra prática. Sem comparação forçada.
- Nível 2: acrescenta comparação com o conceito que mais confunde, armadilhas e notas da prova.
- Nível 3: mecanismo completo, exemplo com raciocínio, duas ou três comparações e notas da prova que ensinem a ler o enunciado.

## Notas da prova (24/10/2026)

- Formato: os sinais do enunciado que apontam para o conceito, o raciocínio esperado e o distrator típico.
- Nunca dizer que o assunto "cai" ou "sempre aparece".
- Mostrar o requisito que muda a resposta, por exemplo: "se o padrão de acesso é desconhecido, a resposta tende ao Intelligent-Tiering".

## Links e fontes (24/10/2026)

- Use `[[id|rótulo]]` para citar outro conceito no texto (exceto em `exam.notes`). O `check.mjs` confere se o alvo existe.
- `comparisons.with` precisa ser um id de conceito. Duas comparações antigas usam um rótulo no lugar do id: `infra.local-zones` (com "Availability Zone") e `edge.global-accelerator` (com "Amazon CloudFront"). Elas serão corrigidas para `infra.az` e `edge.cloudfront` no lote de foundations/f01.
- Toda página nova de referência é oficial (`docs.aws.amazon.com` ou `aws.amazon.com`) e conferida pelo título, porque o site da AWS devolve 200 para páginas inexistentes.
- Exemplos que dependem de comportamento configurável, como a distribuição do Auto Scaling entre AZs, são evitados ou trazem a condição explícita.

## Conceitos sobrepostos

| Conceitos | Quem explica o quê |
|---|---|
| `iam.policy-evaluation` (S3) e `iam.eval-flow` (IAM) | O da S3 fica na regra básica: deny implícito e Deny explícito vencendo. O da IAM traz o fluxo completo com as camadas que limitam. Os dois se citam em `comparisons`. |
| `iam.roles` e `iam.trust-policy` | A role explica a identidade e o uso. A trust policy aprofunda as duas políticas e os detalhes do Principal. |
| `sqs.visibility`, `sqs.delay` e `sqs.dlq` | A visibilidade esconde depois do recebimento, o atraso esconde antes da primeira entrega e a DLQ encerra as tentativas. |
| `lc.rules` e `sc.intelligent-tiering` | O lifecycle decide pela idade do objeto e o Intelligent-Tiering pelo acesso. |

## Processo (24/10/2026)

- **Aplicação por script.** Os lotes são escritos num patch (fora do repositório) e aplicados pelo `apply.mjs`, que usa o parser do TypeScript e reescreve só os campos de texto do conceito, em ordem canônica: `summary`, `explanation`, `prerequisites`, `useCases`, `benefits`, `limitations`, `comparisons`, `commonMistakes`, `consequences`, `facts`, `recommendations` e, por fim, `exam` (com `notes`). Os campos protegidos não são tocados. O `finish.mjs` fecha o lote no CSV e no PROGRESS.
- **Lotes em par.** Dois lotes do mesmo arquivo podem passar juntos pelo ciclo de verificação (check, typecheck, lint e testes). Cada um continua com a própria linha na tabela e no CSV.
- **Capturas por módulo.** A renderização usa sempre os mesmos campos, então a captura em desktop é feita ao fim de cada módulo, com o conceito mais longo dele, e não em todo lote.
- **Comparações antigas corrigidas** no lote 3 e 4: `infra.local-zones` aponta para `infra.az`, e `edge.global-accelerator` para `edge.cloudfront`.
- **Marcação aninhada (24/10/2026).** A marcação da tela não aninha: código ou link dentro de negrito, e asterisco dentro de negrito, aparecem crus. O `check.mjs` acusa esses casos. Dois resumos que já existiam foram corrigidos: `iam.mfa-condition` e `s3.public-policy`.
