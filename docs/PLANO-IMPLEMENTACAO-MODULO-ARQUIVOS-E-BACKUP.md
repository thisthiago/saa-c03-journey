# Plano de implementação: módulo de Arquivos e backup ("Arquivos e backup na AWS")

Plano para o módulo de sistemas de arquivos e backup do AWS Quest, escrito em 20/10/2026 e **implementado em 22/10/2026**, com as opções recomendadas (ver a seção "Trilha Arquivos e backup na AWS" em [CONTEUDO.md](CONTEUDO.md) e os fatos em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md)).

> **Diferenças em relação ao plano:**
> - O módulo entrou no **fim** de `MODULES`, não logo depois da S3 Expedition: ele reaproveita conceitos das trilhas IAM, Computação, Bancos de dados, Monitoramento e governança e Segurança, e o Codex mostra cada conceito na primeira fase que o ensina pela ordem dos módulos.
> - O `filesystem` calcula o acesso com uma AZ fora no próprio modelo, sem reaproveitar o `zones/`. As falhas do FSx (servidor e AZ) ganharam um modelo próprio, `simulators/fsx/`, usado nas previsões das Fases 3, 4 e 5.
> - O `fs-chooser` serve aos chefes das Fases 5 e 6. A Fase 3 termina num chefe de decisão e estimativa, e a Fase 4, num de classificação e previsão.
> - O AWS Backup reaproveita `bkp.aws-backup` (Bancos de dados), `bkp.vault-lock` (Segurança) e `gov.org-policies` (Monitoramento e governança), já declarados antes desta trilha.
> - Tamanho final: 27 missões, 68 atividades, 36 conceitos novos, 15 conquistas e 28 questões.

O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e dos planos de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md), [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md), [Integração e mensageria](PLANO-IMPLEMENTACAO-MODULO-INTEGRACAO-E-MENSAGERIA.md), [Monitoramento e governança](PLANO-IMPLEMENTACAO-MODULO-MONITORAMENTO-E-GOVERNANCA.md), [Arquitetura e otimização](PLANO-IMPLEMENTACAO-MODULO-ARQUITETURA-E-OTIMIZACAO.md), [Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md) e [Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- As tarefas 3.1 e 4.1 do exame citam o Amazon EFS e o Amazon FSx pelo nome. Hoje a S3 Expedition só os apresenta na fase 1, como exemplos de armazenamento de arquivos, para diferenciar objeto, bloco e arquivo. Os modos de desempenho, as classes de armazenamento e os quatro tipos de FSx não aparecem em lugar nenhum.
- O AWS Backup está na categoria Storage da lista do exame. Os planos de [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md) (fase 8) e de [Arquitetura e otimização](PLANO-IMPLEMENTACAO-MODULO-ARQUITETURA-E-OTIMIZACAO.md) (fase 3) disputam quem o ensina. Este plano propõe uma terceira saída: ensinar aqui, onde estão os outros serviços de armazenamento, e os dois planos passam a citá-lo (ver decisões).
- O território `armazenamento` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'active'` por causa da S3 Expedition, e o resumo "Objetos, blocos, arquivos, transferência e armazenamento híbrido." já fala em arquivos.
- Já estão em [services.ts](../src/content/catalog/services.ts), no território `armazenamento`: `aws.efs`, `aws.fsx` (com o resumo "Windows File Server, Lustre, NetApp ONTAP, OpenZFS"), `aws.ebs`, `aws.storage-gateway`, `aws.datasync` e `aws.snowball-edge`.
- Outras trilhas já ensinam parte do tema, e esta trilha **não repete** esses pontos:
  - a S3 Expedition ensina os tipos de armazenamento (`storage.object`, `storage.block`, `storage.file`), o Storage Gateway com o FSx File Gateway (`sgw.*`), o DataSync e a família Snow (`mig.*`) e a diferença entre versionamento e backup (`backup.independent-copy`);
  - a trilha de Computação ensina os volumes EBS e seus snapshots (`ebs.*`);
  - a trilha IAM ensina o Directory Service (`fed.directory-service`), que o FSx for Windows File Server usa.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): `storage.file`, `storage.block`, `storage.object`, `sgw.fsx-file`, `sgw.s3-file`, `mig.datasync`, `backup.independent-copy`, `ebs.snapshots`, `dr.rpo-rto`, `infra.multi-az`, `infra.az` e `fed.directory-service`.
- Simuladores que já existem e podem ser reaproveitados: `architecture/` (desafio final), `zones/` (falha de uma AZ), `lifecycle/` (regras de ciclo de vida), `gateway/` (Storage Gateway), `transfer/` (transferência de dados) e `chooser/` (escolha por requisito).

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) e nas tarefas dos domínios [3](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain3.html) e [4](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain4.html).

| Categoria | Serviços |
|---|---|
| **Storage** (que esta trilha ensina) | Amazon EFS, Amazon FSx (todos os tipos) e AWS Backup |
| **Storage** (ensinados em outras trilhas) | Amazon S3, S3 Glacier e Storage Gateway (S3 Expedition); Amazon EBS (Computação) |
| **Migration and Transfer** | AWS Transfer Family (ver decisões); DataSync e Snow Family já estão na S3 Expedition |

O que as tarefas pedem e esta trilha cobre:
- **Tarefa 3.1:** serviços de armazenamento e seus casos de uso (o guia cita S3, EFS e EBS), armazenamento híbrido, e configurações que atendem ao desempenho e crescem com a demanda.
- **Tarefa 4.1:**
  - serviços de armazenamento e seus casos de uso (o guia cita FSx, EFS, S3 e EBS);
  - estratégias de backup;
  - opções híbridas (o guia cita DataSync, Transfer Family e Storage Gateway);
  - camadas de armazenamento;
  - escolher a solução de backup e de arquivamento;
  - escolher o serviço mais barato para cada carga.
- **Tarefa 2.1:** o guia cita o Transfer Family entre os serviços gerenciados.
- **Tarefa 2.2:** estratégias para garantir a durabilidade e a disponibilidade dos dados, como backups.
- **Tarefa 1.3:** recuperação de dados e implementação de backups e réplicas.

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Formato | Trilha nova, curta: 7 fases mais um desafio final | Fases novas no fim da S3 Expedition (F12 a F15), mudando o nome dela |
| AWS Backup | Ensinado aqui (fase 7), junto dos outros serviços de armazenamento; Bancos de dados e Arquitetura e otimização passam a só citá-lo | Fica na fase 3 de Arquitetura e otimização, ou na fase 8 de Bancos de dados |
| Transfer Family | Ensinado aqui (fase 6), como opção híbrida de entrada de arquivos no S3 e no EFS; Arquitetura e otimização passa a só citá-lo | Fica na fase 7 (migração) de Arquitetura e otimização |
| Preços | Preços reais da Price List API para EFS, FSx e AWS Backup, como em Computação | Premissas fixas do cenário |

**Atenção:** as decisões sobre AWS Backup e Transfer Family mudam os planos de Bancos de dados e de Arquitetura e otimização. As notas de cada um já foram ajustadas para citar esta opção, mas a escolha final é do usuário e precisa ser a mesma nos três planos.

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations e a S3 Expedition, sem exigir.
- Entra em `MODULES` logo depois da S3 Expedition, se ela já existir quando a trilha for implementada.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `files`; trilha `files.aws-files` ("Arquivos e backup na AWS", subtítulo "EFS, FSx, transferência de arquivos e AWS Backup").
- Território `armazenamento`, glifo `file`, `recommends: ['foundations.aws-foundations', 'storage.s3-expedition']`.
- Prefixo das fases: `fil.f0N`. Prefixos dos conceitos novos: `efs.*`, `fsx.*`, `xfer.*` e `bkp.*`. O prefixo `backup.*` já tem `backup.independent-copy` e continua sendo usado para ele.
- Pasta `src/content/modules/files/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | EFS essencial | sistema de arquivos NFS compartilhado (reaproveita `storage.file`), Regional × One Zone, mount targets em cada AZ, security groups do mount target, uso por EC2, contêineres e Lambda, access points, autorização pelo IAM, criptografia | `filesystem`: montar o EFS para que todos os servidores alcancem os arquivos mesmo com uma AZ fora |
| **F2** | EFS: desempenho e custo | modos de vazão (Elastic, Provisioned, Bursting), modo de desempenho, classes de armazenamento (Standard, Infrequent Access, Archive), política de ciclo de vida, replicação para outra Região | `filesystem` com custo mensal pela tabela; predição "qual modo de vazão sai mais barato?" |
| **F3** | FSx for Windows File Server | SMB, integração com Active Directory (reaproveita `fed.directory-service`), Single-AZ × Multi-AZ, cópias de sombra, deduplicação, DFS, migração de servidores de arquivos Windows | Decisão e investigação "o compartilhamento sumiu na falha da AZ" |
| **F4** | FSx for Lustre | computação de alto desempenho e ML, ligação com um bucket S3 (importar e exportar), implantação temporária (scratch) × persistente, quando o Lustre vale mais que o EFS | Decisão; predição "o que se perde se o servidor falhar?" |
| **F5** | FSx for NetApp ONTAP e FSx for OpenZFS | vários protocolos ao mesmo tempo (NFS, SMB, iSCSI), snapshots e clones, compressão e camadas de armazenamento, migrar storage ONTAP ou ZFS sem mudar a aplicação | `fs-chooser` com os quatro tipos de FSx |
| **F6** | Escolher o armazenamento de arquivos e o caminho de entrada | quadro EFS × FSx × S3 × EBS, File Gateway e FSx File Gateway (reaproveita `sgw.*`), DataSync para EFS e FSx (reaproveita `mig.datasync`), Transfer Family (SFTP, FTPS e FTP gravando no S3 ou no EFS, para parceiros que não mudam o jeito de enviar) | `fs-chooser`: requisito para serviço e caminho de entrada |
| **F7** | AWS Backup | backup independente (reaproveita `backup.independent-copy`), planos de backup (frequência, janela, retenção, transição para armazenamento frio), cofres, Vault Lock (cópias que ninguém apaga), cópia para outra Região e outra conta, políticas de backup da organização (cita Monitoramento e governança), serviços cobertos, teste de restauração, relação com os snapshots do EBS (reaproveita `ebs.snapshots`) | `backup`: montar o plano que cumpre RPO, retenção e proteção contra exclusão pelo menor custo |
| **Final** | A Mudança do Escritório | integração | Estúdio de arquitetura fictício que sai do próprio data center, com `architecture` em 7 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F4 exige F3.
- F5 exige F3.
- F6 exige F2, F4 e F5.
- O final exige as sete.
- F3 e F7 só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1 e F3.
- x=300: F2, F4 e F5.
- x=560: F6 e F7.
- x=820: final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: A Mudança do Escritório

- Estúdio de arquitetura fictício que fecha o próprio data center:
  - compartilhamentos Windows com permissões do Active Directory;
  - diretórios Linux usados por vários servidores;
  - renderização pesada uma vez por semana;
  - parceiros que enviam plantas por SFTP;
  - exigência de guardar backups por cinco anos sem que ninguém possa apagá-los.
- Etapas do `architecture`:
  1. Arquivos dos servidores Linux.
  2. Desempenho e classes do EFS.
  3. Compartilhamentos Windows.
  4. Armazenamento da renderização.
  5. Migração dos arquivos existentes.
  6. Entrada de arquivos dos parceiros.
  7. Plano de backup e retenção.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 24 missões, 65 atividades, 40 conceitos novos, 3 laboratórios novos, 14 conquistas (`ach.fil-*`) e 28 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

## 4. Simuladores

Todos seguem o padrão de `src/simulators/<nome>/`:
- `model.ts` puro e testado, com cabeçalho "Conferido em DD/MM/AAAA" e as URLs da documentação;
- `lab.ts`;
- interface `.tsx` e CSS Module;
- painel "Simplificações".

Cada um é ligado em:
- `activities/lab/specs.ts`;
- `lab/evaluate.ts` (`evaluateLab`, `labSolution` e `labInitialResponse`);
- `activities/registry.tsx`;
- `activities/ui-logic.ts`;
- `predict/specs.ts` e `predict/resolve.ts`, quando houver predição.

O teste de conteúdo já garante que a solução chega a 100%, que o estado inicial fica abaixo de 70% e que cada predição tem uma única opção certa.

| Simulador | O que modela |
|---|---|
| `filesystem/` | Um sistema de arquivos EFS: tipo (Regional ou One Zone), mount targets por AZ, servidores em cada AZ, modo de vazão, classes de armazenamento e política de ciclo de vida. Mostra quem alcança os arquivos quando uma AZ cai (reaproveita o modelo de `zones/`) e o custo mensal pela tabela, com o padrão de acesso de cada arquivo como premissa do cenário. |
| `fs-chooser/` | Escolha do armazenamento de arquivos e do caminho de entrada, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. Exemplos de requisito: "SMB com Active Directory", "HPC lendo dados do S3", "NFS e SMB no mesmo volume", "diretório compartilhado por centenas de contêineres", "parceiro que só envia por SFTP". |
| `backup/` | Recursos fictícios (volumes EBS, um EFS, um FSx, um banco) e um plano de backup com frequência, retenção, transição para armazenamento frio, cópia para outra Região ou conta e Vault Lock. Calcula o RPO alcançado, o que sobrevive a uma exclusão maliciosa ou à perda da Região e o custo mensal pela tabela. |

Reaproveitado sem alteração: `architecture/` no desafio final, `zones/` dentro do `filesystem`, `gateway/` e `transfer/` na fase 6.

### Preços

- Novo script `scripts/fetch-files-prices.mjs` (`npm run prices:files`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/files-prices.json` com a data de publicação.
- Itens previstos:
  - **EFS:** armazenamento por classe, Regional e One Zone; acesso aos dados nas classes frias; vazão Elastic e Provisioned.
  - **FSx:** capacidade e vazão por tipo.
  - **AWS Backup:** armazenamento quente e frio por serviço; cópia entre Regiões; restauração.
  - **Transfer Family:** endpoint por hora e dados transferidos.
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução. Regiões: us-east-1 e sa-east-1, como em Computação.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame e das tarefas dos domínios 3 e 4. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | EFS Regional × One Zone (nomes atuais); mount target por AZ e o que acontece com uma AZ fora; sistemas operacionais suportados; access points; autorização pelo IAM; criptografia em repouso e em trânsito; uso por ECS, EKS e Lambda |
| F2 | modos de vazão atuais e qual é o recomendado; modos de desempenho (se o Max I/O ainda é oferecido); classes de armazenamento e cobrança de acesso nas classes frias; opções da política de ciclo de vida; replicação do EFS (Regiões, objetivo de tempo) |
| F3 | FSx for Windows File Server (Single-AZ × Multi-AZ, AD gerenciado pela AWS × próprio, cópias de sombra, deduplicação, SSD × HDD, DFS) |
| F4 | FSx for Lustre (scratch × persistente, ligação com o S3, desempenho por TiB, durabilidade de cada implantação) |
| F5 | FSx for NetApp ONTAP (protocolos, camada de capacidade, SnapMirror, Multi-AZ) e FSx for OpenZFS (protocolos, snapshots, clones, Multi-AZ) |
| F6 | Transfer Family (protocolos atuais, destinos S3 e EFS, provedores de identidade, endpoints público e na VPC); FSx File Gateway (reaproveitar a verificação da S3 Expedition); DataSync com EFS e FSx como destino |
| F7 | AWS Backup (serviços cobertos hoje, plano de backup, regras, janela, retenção, transição para armazenamento frio e retenção mínima nele, cofres, Vault Lock nos modos de conformidade e de governança, cópia entre Regiões e contas, políticas de backup do Organizations, teste de restauração, cofre logicamente isolado se existir) |
| Todas | disponibilidade atual de cada serviço e tipo de FSx (restrições a novos clientes entram como `availability: 'no-new-customers'`) e mudanças de nome recentes: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `armazenamento` continua `active`. O resumo do território ganha "backup".
- **`content/catalog/services.ts`:** novos serviços `aws.backup` e `aws.transfer-family`, cada um com `docsUrl` conferido. `aws.efs` e `aws.fsx` já existem; o resumo do `aws.fsx` é conferido na fase 3.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): `file`, `history` e `drive` já existem. Avaliar `archive` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES` ganha `filesModule` e `CONTENT_VERSION` muda.
- **`engine/types.ts`:** nenhuma mudança prevista.
- **`package.json`:** script `prices:files`. **`vite.config.ts`:** chunk `content-files`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Dois módulos no mesmo território:** `armazenamento` passa a ter duas trilhas (S3 Expedition e esta). Conferir como a Base e o Codex mostram um território com mais de uma trilha; `seguranca` passa pela mesma situação no plano de [Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md).

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (sete fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `filesystem` |
| **M3** | F3, F4 e F5, com `fs-chooser` |
| **M4** | F6 e F7, com `backup` |
| **M5** | Desafio final, conquistas e banco de questões |
| **M6** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:files   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e            # capturas em screenshots/
npm run dev            # jogar F1 a F7 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations e S3 Expedition;
- **Codex:** não duplica os conceitos reaproveitados (`storage.*`, `sgw.*`, `mig.*`, `backup.independent-copy`, `ebs.snapshots`, `dr.rpo-rto`);
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **simulador do EFS:** com uma AZ fora, só os servidores sem mount target alcançável perdem o acesso;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Disputa pelo AWS Backup e pelo Transfer Family:** três planos tocam o AWS Backup e dois tocam o Transfer Family. Se a decisão não for a mesma nos três documentos, o mesmo conceito acaba declarado duas vezes. Decidir antes de implementar qualquer um deles.
- **Quatro tipos de FSx parecidos:** a fase 5 pode virar lista de recursos. O `fs-chooser` usa requisitos que só um tipo atende bem (protocolo, AD, ligação com o S3, migração de storage existente), sem pegadinhas de vocabulário.
- **Serviços que mudam com frequência:** modos de vazão do EFS, opções de implantação do FSx e recursos do AWS Backup mudaram nos últimos anos. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Tamanho:** é uma trilha curta, menor que as outras. Se a S3 Expedition ganhar as fases em vez de uma trilha nova, revisar o tamanho e o mapa dela.
