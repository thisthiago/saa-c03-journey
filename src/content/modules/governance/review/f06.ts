/**
 * Questões da Revisão da Fase 6 de Monitoramento e governança
 * (Infraestrutura como código), no formato do exame SAA-C03. Fatos conferidos
 * na trilha (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'gov.f06',
  questions: [
    {
      id: 'rv:gov.f06.m1.a1',
      kind: 'decision',
      title: 'Recriar a infraestrutura em outra Região',
      prompt:
        'O plano de recuperação de desastre de uma empresa exige **recriar em outra Região**, em poucas horas, a mesma rede, os mesmos servidores e os mesmos balanceadores da Região principal, **sem depender de alguém lembrar cada configuração**. Hoje tudo foi criado à mão no console. Qual solução atende?',
      concepts: [{ id: 'cfn.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um documento com capturas de tela de cada configuração do console.', correct: false, consequence: 'Depende de alguém repetir cada passo à mão, com risco de erro e demora.' },
        { id: 'b', text: 'Um template do CloudFormation, criando uma stack na outra Região.', correct: true, consequence: 'O mesmo template cria uma cópia fiel na outra Região quando for preciso.' },
        { id: 'c', text: 'Copiar snapshots dos volumes para a outra Região toda noite.', correct: false, consequence: 'Leva dados, mas a rede, os balanceadores e as configurações continuam por fazer.' },
        { id: 'd', text: 'Ligar o AWS Config para guardar o histórico de configuração.', correct: false, consequence: 'O Config mostra como os recursos estavam; não os cria em outra Região.' },
      ],
      explanation: [
        'No **CloudFormation**, os recursos são descritos num **template**, e ele cria e configura tudo como uma **stack**, descobrindo a ordem pelas dependências. O mesmo template cria ambientes idênticos em contas e Regiões diferentes.',
        'Documentos e capturas dependem de pessoas. Snapshots levam dados, não a infraestrutura. O Config registra, não cria.',
        '**Regra prática:** "ambientes idênticos", "repetir em outra Região" e "recriar rapidamente numa recuperação" apontam para o CloudFormation.',
      ],
    },
    {
      id: 'rv:gov.f06.m1.a2:mappings',
      kind: 'decision',
      title: 'Um template para três Regiões com imagens diferentes',
      prompt:
        'Um template do CloudFormation cria instâncias a partir de uma imagem própria, que tem **um ID de AMI diferente em cada uma das três Regiões** usadas pela empresa. A equipe quer que **o mesmo template funcione nas três**, sem editá-lo e sem pedir o ID a quem cria a stack. Qual recurso do template usar?',
      concepts: [{ id: 'cfn.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Outputs com o ID da imagem de cada Região.', correct: false, consequence: 'Outputs devolvem valores da stack; não escolhem um valor na criação.' },
        { id: 'b', text: 'Parameters, com o ID da imagem digitado a cada criação.', correct: false, consequence: 'Funciona, mas obriga quem cria a stack a saber o ID, o que se quer evitar.' },
        { id: 'c', text: 'Mappings por Região, lidos com Fn::FindInMap.', correct: true, consequence: 'O template escolhe sozinho o ID da Região em que a stack é criada.' },
        { id: 'd', text: 'Metadata com a lista de IDs de cada Região.', correct: false, consequence: 'Metadata guarda informações sobre o template; não alimenta propriedades dos recursos.' },
      ],
      explanation: [
        'A seção **Mappings** funciona como uma **tabela de consulta**, como valores por Região, lida com a função **Fn::FindInMap**. O template pega o ID certo da Região onde a stack é criada.',
        'Parameters pedem o valor a cada criação. Outputs devolvem valores. Metadata não alimenta recursos. Só a seção Resources é obrigatória.',
        '**Regra prática:** valor que varia por Região ou ambiente e é conhecido de antemão vai em Mappings; valor escolhido por quem cria a stack vai em Parameters.',
      ],
    },
    {
      id: 'rv:gov.f06.m2.a5',
      kind: 'decision',
      title: 'Trocar a subnet de um servidor em produção',
      prompt:
        'Uma equipe vai mudar no template o **SubnetId** de uma instância EC2 de produção. Antes de aplicar, a diretoria quer **saber se a instância será substituída** e quer que **uma pessoa decida** se a atualização segue. Qual solução atende?',
      concepts: [{ id: 'cfn.change-sets' }, { id: 'cfn.update-behaviors' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Atualizar a stack direto e acompanhar os eventos dela.', correct: false, consequence: 'Os eventos mostram o que aconteceu, depois que já aconteceu.' },
        { id: 'b', text: 'Ligar a detecção de desvio antes de atualizar.', correct: false, consequence: 'O desvio aponta mudanças feitas fora do CloudFormation, não o efeito da próxima atualização.' },
        { id: 'c', text: 'Criar uma stack nova com o template alterado, ao lado da atual.', correct: false, consequence: 'Cria uma segunda instância sem mostrar o efeito na stack atual.' },
        { id: 'd', text: 'Criar um change set e executá-lo só depois da revisão.', correct: true, consequence: 'O change set mostra que a instância será substituída, e a pessoa decide se segue.' },
      ],
      explanation: [
        'O **change set** mostra, antes da execução, o que a atualização fará com cada recurso: propriedades que mudam e recursos **substituídos** ou removidos. Mudar o **SubnetId** de uma instância exige substituição, e o change set deixa isso visível. A stack só muda quando alguém executa o change set.',
        'Os eventos da stack chegam tarde. A detecção de desvio olha mudanças manuais. Uma stack nova não mostra o impacto na atual.',
        '**Regra prática:** "ver o impacto de uma atualização antes de aplicá-la" é change set.',
      ],
    },
    {
      id: 'rv:gov.f06.m2.a1',
      kind: 'decision',
      title: 'Mais capacidade sem perder o ID da instância',
      prompt:
        'Um servidor de licenças em EC2, criado por uma stack do CloudFormation, precisa de **mais CPU e memória**. A licença do software está **amarrada ao ID da instância**, então ele **não pode mudar**; uma breve indisponibilidade é aceitável. Que mudança fazer no template?',
      concepts: [{ id: 'cfn.update-behaviors' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar o InstanceType por um tipo maior.', correct: true, consequence: 'A instância é reconfigurada com alguma interrupção e mantém o mesmo ID.' },
        { id: 'b', text: 'Trocar o ImageId por uma imagem com o software já ajustado.', correct: false, consequence: 'Mudar o ImageId substitui a instância, e o ID muda.' },
        { id: 'c', text: 'Trocar o SubnetId para uma subnet com mais capacidade.', correct: false, consequence: 'Mudar o SubnetId substitui a instância, e o ID muda.' },
        { id: 'd', text: 'Apagar a stack e criá-la de novo com um tipo maior.', correct: false, consequence: 'A stack nova cria uma instância nova, com outro ID, e a licença deixa de valer.' },
      ],
      explanation: [
        'Cada propriedade tem um **comportamento de atualização**: **sem interrupção**, **com alguma interrupção** (mesmo ID) ou **substituição** (recurso novo, com ID novo). No EC2, o **InstanceType** exige alguma interrupção; ImageId, SubnetId e KeyName exigem substituição.',
        'Trocar a imagem, a subnet ou recriar a stack geram uma instância nova.',
        '**Regra prática:** antes de mudar uma propriedade, confira na referência do tipo se ela substitui o recurso.',
      ],
    },
    {
      id: 'rv:gov.f06.m2.a4',
      kind: 'decision',
      title: 'Padronizar o nome de uma tabela com dados',
      prompt:
        'Para padronizar nomes, alguém propõe mudar no template o **TableName** de uma tabela do DynamoDB de `pedidos` para `loja-pedidos`. A tabela tem milhões de itens, e o template **não define nenhuma política** para recursos substituídos. Antes de aprovar, a equipe criou um **change set**. O que ele vai mostrar, e qual é a decisão certa para **não perder dados**?',
      concepts: [{ id: 'cfn.update-behaviors' }, { id: 'cfn.change-sets' }, { id: 'cfn.deletion-policies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Atualização sem interrupção da tabela; pode executar.', correct: false, consequence: 'Mudar o TableName exige substituição: nasce uma tabela nova e vazia.' },
        { id: 'b', text: 'Substituição da tabela; executar com DeletionPolicy Retain.', correct: false, consequence: 'A DeletionPolicy não vale para recursos substituídos numa atualização.' },
        { id: 'c', text: 'Substituição com cópia dos itens para a tabela nova; pode executar.', correct: false, consequence: 'O CloudFormation cria a tabela nova vazia; ele não migra dados.' },
        { id: 'd', text: 'Substituição da tabela; não executar esse change set.', correct: true, consequence: 'Sem UpdateReplacePolicy, o padrão é Delete: a tabela antiga e os dados seriam apagados.' },
      ],
      explanation: [
        'No DynamoDB, mudar o **TableName exige substituição**: o CloudFormation cria uma tabela nova, muda as referências e só então trata a antiga. O **change set** mostra essa substituição antes da execução. O destino da antiga é decidido pela **UpdateReplacePolicy**, cujo padrão é **Delete**; a DeletionPolicy não vale nesse caso.',
        'O nome não muda sem substituição, a DeletionPolicy não protege na substituição, e o CloudFormation não copia dados.',
        '**Regra prática:** mudar nomes de bancos, tabelas, buckets ou funções no template cria recursos novos e vazios; leia o change set antes de executar.',
      ],
    },
    {
      id: 'rv:gov.f06.m1.a4',
      kind: 'decision',
      title: 'As evidências que precisam sobreviver ao ambiente',
      prompt:
        'Ao fim de cada ciclo de testes, a equipe **apaga a stack** do ambiente de homologação. Um bucket dessa stack guarda as **evidências dos testes**, que a auditoria exige manter depois que o ambiente some. A equipe quer continuar apagando a stack inteira de uma vez. O que configurar?',
      concepts: [{ id: 'cfn.deletion-policies' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'DeletionPolicy: Snapshot no bucket de evidências.', correct: false, consequence: 'A política Snapshot só existe para tipos com snapshot; o S3 não tem.' },
        { id: 'b', text: 'DeletionPolicy: Retain no bucket de evidências.', correct: true, consequence: 'Ao apagar a stack, o bucket continua na conta, com as evidências.' },
        { id: 'c', text: 'UpdateReplacePolicy: Retain no bucket de evidências.', correct: false, consequence: 'Ela vale para substituições em atualizações, não para a exclusão da stack.' },
        { id: 'd', text: 'Nenhuma: apagar a stack mantém os buckets por padrão.', correct: false, consequence: 'O padrão é Delete: o bucket sai junto com a stack.' },
      ],
      explanation: [
        'A **DeletionPolicy** diz o que fazer com um recurso quando ele sai da stack: **Delete** (o padrão), **Retain** (mantém) ou **Snapshot** (backup e exclusão). Com **Retain**, o bucket continua na conta, e continua sendo cobrado.',
        'O S3 não tem snapshot. A UpdateReplacePolicy é para substituições. O padrão apaga o bucket.',
        '**Regra prática:** "manter o recurso quando a stack for apagada" é DeletionPolicy Retain, ou Snapshot nos tipos que aceitam.',
      ],
    },
    {
      id: 'rv:gov.f06.m3.a4',
      kind: 'decision',
      title: 'Um backup do banco antes de uma substituição planejada',
      prompt:
        'Uma mudança planejada no template vai **substituir** o banco RDS de relatórios, que nascerá novo. A equipe quer que o **banco antigo só seja apagado depois de um snapshot**, para poder consultar os dados antigos se precisar. O banco não tem DBClusterIdentifier. Qual configuração atende?',
      concepts: [{ id: 'cfn.deletion-policies' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'DeletionPolicy: Snapshot no banco.', correct: false, consequence: 'A DeletionPolicy vale quando o recurso sai da stack, não quando é substituído numa atualização.' },
        { id: 'b', text: 'UpdateReplacePolicy: Snapshot no banco.', correct: true, consequence: 'Na substituição, o banco antigo é apagado só depois de um snapshot.' },
        { id: 'c', text: 'DeletionPolicy: Retain no banco.', correct: false, consequence: 'Não se aplica à substituição, e manter o banco inteiro pagaria uma instância parada.' },
        { id: 'd', text: 'Nenhuma: o padrão da substituição já tira snapshot de bancos RDS.', correct: false, consequence: 'O padrão da UpdateReplacePolicy é Delete; o snapshot padrão é da DeletionPolicy.' },
      ],
      explanation: [
        'A **UpdateReplacePolicy** decide o destino do recurso antigo quando ele é **substituído numa atualização**: Delete (padrão), Retain ou Snapshot. Para guardar os dados do banco antigo, **Snapshot**.',
        'A DeletionPolicy vale para a saída da stack. O padrão Snapshot de bancos RDS sem cluster é da DeletionPolicy, não da UpdateReplacePolicy.',
        '**Regra prática:** recurso que sai da stack é DeletionPolicy; recurso substituído numa atualização é UpdateReplacePolicy.',
      ],
    },
    {
      id: 'rv:gov.f06.m3.a2',
      kind: 'decision',
      title: 'Um banco retirado do template sem política escrita',
      prompt:
        'Um novo template **remove do modelo** um banco RDS (uma DBInstance **sem DBClusterIdentifier**) que **não tinha nenhuma DeletionPolicy escrita**. Antes de atualizar a stack, o gerente quer saber **o que vai acontecer com o banco e os dados**. Qual é a resposta?',
      concepts: [{ id: 'cfn.deletion-policies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O banco é apagado sem backup, porque o padrão é Delete.', correct: false, consequence: 'Para esse tipo de banco, o padrão da DeletionPolicy é Snapshot, não Delete.' },
        { id: 'b', text: 'O banco continua na conta, fora da stack.', correct: false, consequence: 'Isso seria Retain, que precisa estar escrito no template.' },
        { id: 'c', text: 'O banco é apagado depois de um snapshot, que fica na conta.', correct: true, consequence: 'O padrão para uma DBInstance sem cluster é Snapshot.' },
        { id: 'd', text: 'A atualização falha, porque bancos não podem sair do modelo.', correct: false, consequence: 'Qualquer recurso pode sair do modelo; a política decide o destino.' },
      ],
      explanation: [
        'O padrão da **DeletionPolicy** é **Delete**, **exceto** para **AWS::RDS::DBCluster** e **AWS::RDS::DBInstance sem DBClusterIdentifier**, em que o padrão é **Snapshot**. O banco sai da stack, mas um snapshot fica na conta.',
        'Delete é o padrão de outros tipos. Retain precisa ser escrito. A atualização não falha por isso.',
        '**Regra prática:** escreva a DeletionPolicy em recursos com dados; não dependa de padrões que variam por tipo.',
      ],
    },
    {
      id: 'rv:gov.f06.m4.a1',
      kind: 'decision',
      title: 'Monitoramento padrão para quinze parceiros',
      prompt:
        'Uma empresa quer implantar o mesmo template de monitoramento em **15 contas de parceiros**, que **não fazem parte da sua organização** do AWS Organizations, em duas Regiões, com uma única operação. Os parceiros aceitam criar uma role do IAM nas contas deles. Qual configuração atende?',
      concepts: [{ id: 'cfn.stacksets' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'StackSets com permissões gerenciadas pelo serviço.', correct: false, consequence: 'Esse modelo vale para contas da organização; as dos parceiros estão fora dela.' },
        { id: 'b', text: 'Uma stack criada à mão em cada conta e Região.', correct: false, consequence: 'São 30 operações manuais, o oposto de uma operação única.' },
        { id: 'c', text: 'StackSets autogerenciado, com a role criada nas contas.', correct: true, consequence: 'O StackSets implanta em qualquer conta em que exista a role do IAM.' },
        { id: 'd', text: 'Um produto do Service Catalog compartilhado com os parceiros.', correct: false, consequence: 'Cada parceiro ainda precisaria lançar o produto, conta a conta.' },
      ],
      explanation: [
        'O **StackSets** cria, atualiza ou apaga stacks em **várias contas e Regiões** com uma única operação. Com **permissões autogerenciadas**, você cria as roles do IAM e ele implanta em **qualquer conta** em que exista a role. Com **permissões gerenciadas pelo serviço**, ele cuida das roles nas contas **da organização** e pode implantar sozinho nas contas novas.',
        'O modelo gerenciado não alcança contas de fora. Stacks à mão e produtos lançados conta a conta não são uma operação única.',
        '**Regra prática:** StackSets na organização, com contas novas automáticas, é permissão gerenciada pelo serviço; fora da organização, autogerenciada.',
      ],
    },
    {
      id: 'rv:gov.f06.m4.a3',
      kind: 'decision',
      title: 'Uma criação que falhou no 25º recurso',
      prompt:
        'Uma stack com 30 recursos falhou na criação do 25º, por um parâmetro errado. Pelo comportamento padrão, o CloudFormation **desfaz tudo**, e recriar os 24 primeiros leva uma hora. A equipe quer **investigar a falha e retomar de onde parou**. O que escolher na próxima tentativa?',
      concepts: [{ id: 'cfn.drift' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A opção de preservar os recursos provisionados com sucesso.', correct: true, consequence: 'Os 24 recursos continuam, e o que falhou fica em CREATE_FAILED para investigar e retomar.' },
        { id: 'b', text: 'A detecção de desvio na stack que falhou.', correct: false, consequence: 'O desvio aponta mudanças feitas fora do CloudFormation, não falhas de criação.' },
        { id: 'c', text: 'Um change set para a stack que ainda não existe.', correct: false, consequence: 'O change set mostra o efeito de uma atualização; não evita o desfazer da falha.' },
        { id: 'd', text: 'Uma DeletionPolicy: Retain em todos os 30 recursos.', correct: false, consequence: 'Mantém recursos na conta, mas fora da stack, sem retomar a criação.' },
      ],
      explanation: [
        'Quando uma criação ou atualização falha, o CloudFormation **desfaz o que fez**. Com a opção de **preservar os recursos provisionados com sucesso**, a falha deixa o recurso com problema em CREATE_FAILED ou UPDATE_FAILED, para investigar e **retomar do ponto onde parou**.',
        'A detecção de desvio é para mudanças manuais. Change sets são para atualizações. Retain deixa recursos órfãos.',
        '**Regra prática:** falha longa de criação: preserve o que deu certo e retome; recurso alterado à mão: detecção de desvio.',
      ],
    },
    {
      id: 'rv:gov.f06.m4.a4:launch',
      kind: 'decision',
      title: 'Um produto aprovado que o time não consegue lançar',
      prompt:
        'Uma empresa publicou no **Service Catalog** um produto que cria um banco RDS aprovado. Os desenvolvedores, que **não têm permissão para criar bancos RDS** e não devem ganhar, recebem **acesso negado** ao lançar o produto. A empresa quer que eles lancem o produto **sem ampliar as permissões** deles. O que configurar?',
      concepts: [{ id: 'sc.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Dar aos desenvolvedores a política gerenciada de acesso total ao RDS.', correct: false, consequence: 'Amplia as permissões, e eles poderiam criar bancos fora do produto aprovado.' },
        { id: 'b', text: 'Uma restrição de lançamento com uma role que cria o banco.', correct: true, consequence: 'O Service Catalog assume a role ao lançar, e os desenvolvedores não precisam da permissão.' },
        { id: 'c', text: 'Uma restrição de notificação no portfólio do produto.', correct: false, consequence: 'Avisa sobre eventos da stack; não dá permissão para criar o banco.' },
        { id: 'd', text: 'Copiar o produto para outro portfólio com mais acesso.', correct: false, consequence: 'O portfólio controla quem vê o produto; a permissão de criar vem da role do lançamento.' },
      ],
      explanation: [
        'No **Service Catalog**, os administradores oferecem **produtos aprovados** em **portfólios**, com restrições. A **restrição de lançamento** indica a **role do IAM** que o serviço assume ao lançar, atualizar ou encerrar o produto. O usuário não precisa das permissões dos serviços por baixo.',
        'Dar acesso total ao RDS foge do objetivo. Notificações e portfólios não concedem a permissão de criar.',
        '**Regra prática:** "deixar os times criarem só recursos aprovados, sem dar permissões amplas" é Service Catalog com restrição de lançamento.',
      ],
    },
    {
      id: 'rv:gov.f06.m1.a3',
      kind: 'decision',
      title: 'Quarenta recursos toda semana, sem ninguém clicar',
      prompt:
        'Um time de dados cria toda segunda-feira o mesmo conjunto de 40 recursos para um processamento e os apaga na sexta. Hoje alguém faz isso **à mão no console**, com erros frequentes. A equipe quer um processo que **rode sozinho**, sempre igual. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'gov.access-tools' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um roteiro detalhado para quem faz a criação no console.', correct: false, consequence: 'Continua manual, com os mesmos erros de digitação e esquecimento.' },
        { id: 'b', text: 'Um script agendado que cria e apaga uma stack pela AWS CLI.', correct: true, consequence: 'O mesmo template vira o mesmo conjunto de recursos, sem ninguém clicar.' },
        { id: 'c', text: 'Uma pessoa a mais no time para revisar cada criação no console.', correct: false, consequence: 'Dobra o trabalho manual sem automatizar nada.' },
        { id: 'd', text: 'Gravar as telas do console e repetir os cliques com uma ferramenta.', correct: false, consequence: 'É frágil: qualquer mudança no console quebra a gravação.' },
      ],
      explanation: [
        'Tudo o que se faz no **console** tem equivalente na **AWS CLI** e na API. Um script agendado que cria e apaga uma stack do **CloudFormation** pela CLI, ou por um **SDK**, que assina as requisições e repete as que falham, roda sozinho e sempre igual.',
        'Roteiros, revisores e gravações de tela mantêm o trabalho manual ou frágil.',
        '**Regra prática:** tarefa repetida muitas vezes vira script ou template, não cliques no console.',
      ],
    },
  ],
}
