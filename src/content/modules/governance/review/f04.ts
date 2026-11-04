/**
 * Questões da Revisão da Fase 4 de Monitoramento e governança (AWS Config), no
 * formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'gov.f04',
  questions: [
    {
      id: 'rv:cfg.what.past',
      kind: 'decision',
      title: 'Como estava um security group há duas semanas',
      prompt:
        'Uma auditoria quer saber **como estava configurado** um security group de produção **há duas semanas**: quais regras de entrada ele tinha naquele dia. A conta grava security groups no AWS Config e tem uma trilha do CloudTrail. Onde a equipe encontra **o estado do recurso naquele momento** com o **menor esforço**?',
      concepts: [{ id: 'cfg.what' }, { id: 'cfg.vs-others' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'No histórico de configuração do security group no AWS Config.', correct: true, consequence: 'A linha do tempo mostra as regras do security group em cada momento gravado.' },
        { id: 'b', text: 'Nos eventos do CloudTrail, refazendo a configuração chamada por chamada.', correct: false, consequence: 'O CloudTrail mostra quem fez cada ação; remontar o estado a partir delas é trabalhoso.' },
        { id: 'c', text: 'Nas métricas do CloudWatch do security group.', correct: false, consequence: 'O CloudWatch mede desempenho; security groups não guardam a configuração em métricas.' },
        { id: 'd', text: 'No console do EC2, que guarda as versões anteriores do security group.', correct: false, consequence: 'O console mostra só a configuração atual.' },
      ],
      explanation: [
        'O **AWS Config** mostra como cada recurso está configurado, **como esteve antes** e como os recursos se relacionam. O **histórico de configuração** do security group responde diretamente como ele estava há duas semanas.',
        'O CloudTrail registra ações, e remontar o estado a partir delas dá trabalho. O CloudWatch e o console do EC2 não guardam o estado passado.',
        '**Regra prática:** "como estava configurado" é Config; "quem mudou" é CloudTrail; "como está o desempenho" é CloudWatch.',
      ],
    },
    {
      id: 'rv:cfg.what.rules',
      kind: 'decision',
      title: 'Buckets que fogem da política, inclusive os antigos',
      prompt:
        'Uma empresa tem centenas de buckets, criados ao longo de anos por várias equipes. A segurança quer **verificar continuamente** se algum permite **leitura pública**, inclusive os buckets **que já existem**, e ver a lista dos que estão fora do padrão. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'cfg.what' }, { id: 'cfg.rules' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma SCP que nega tornar buckets públicos na organização.', correct: false, consequence: 'A SCP impede ações futuras, mas não aponta os buckets que já estão públicos.' },
        { id: 'b', text: 'Eventos de dados do CloudTrail em todos os buckets.', correct: false, consequence: 'Registra quem lê os objetos, não se a configuração do bucket permite leitura pública.' },
        { id: 'c', text: 'Um script semanal que lista os buckets e confere as políticas.', correct: false, consequence: 'Funciona, mas é código para manter e só olha uma vez por semana.' },
        { id: 'd', text: 'A regra gerenciada s3-bucket-public-read-prohibited.', correct: true, consequence: 'Cada bucket recebe COMPLIANT ou NON_COMPLIANT, e a avaliação acompanha as mudanças.' },
      ],
      explanation: [
        'O **Config** confere a configuração com **regras** e sinaliza o que sai do padrão, avaliando os recursos quando a regra é adicionada e depois a cada gatilho. A regra gerenciada **s3-bucket-public-read-prohibited** aponta os buckets com leitura pública.',
        'A SCP é preventiva: não mostra o que já existe. Eventos de dados registram leituras, não configuração. Um script semanal é esforço e atraso.',
        '**Regra prática:** "verificar continuamente se os recursos seguem a política" é Config; "impedir que fujam" é controle preventivo, como uma SCP.',
      ],
    },
    {
      id: 'rv:gov.f04.m1.a3',
      kind: 'decision',
      title: 'Histórico vazio de uma função Lambda',
      prompt:
        'Para economizar, o gravador do Config de uma conta grava **só instâncias EC2, volumes EBS e buckets**. A auditoria pediu o histórico de configuração de uma **função Lambda** que mudou várias vezes, e o Config mostra só a **criação** da função, sem detalhes. A empresa quer ter esse histórico **daqui em diante**. O que fazer?',
      concepts: [{ id: 'cfg.recorder' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mudar a gravação dos tipos atuais de contínua para diária.', correct: false, consequence: 'Muda a frequência dos tipos já gravados; a Lambda continua de fora.' },
        { id: 'b', text: 'Adicionar as funções Lambda aos tipos de recurso gravados.', correct: true, consequence: 'As próximas mudanças das funções passam a gerar itens de configuração.' },
        { id: 'c', text: 'Criar um agregador do Config para a conta.', correct: false, consequence: 'O agregador só junta dados que as contas já gravam.' },
        { id: 'd', text: 'Ligar uma regra do Config que avalie as funções Lambda.', correct: false, consequence: 'A regra avalia conformidade; o histórico depende de o tipo estar sendo gravado.' },
      ],
      explanation: [
        'O **gravador** guarda as mudanças só dos **tipos de recurso escolhidos**. Um recurso de um tipo não gravado tem **só a criação e a exclusão** registradas, sem custo, e os demais detalhes ficam vazios. Para ter o histórico, o tipo precisa entrar na lista.',
        'A frequência não muda a lista de tipos. O agregador só junta o que existe. Uma regra avalia, não grava histórico.',
        '**Regra prática:** grave só os tipos que a política exige, mas inclua todos os de que você vai precisar de histórico.',
      ],
    },
    {
      id: 'rv:gov.f04.m1.a2',
      kind: 'decision',
      title: 'Itens de configuração de recursos que ninguém audita',
      prompt:
        'Uma empresa grava **todos os tipos de recurso** no Config, em 30 contas, e a fatura de itens de configuração cresce a cada mês. A política de conformidade olha só **security groups, buckets e volumes EBS**, e a auditoria quer as mudanças desses recursos **na hora**. Qual mudança **reduz o custo** sem perder o que a política exige?',
      concepts: [{ id: 'cfg.recorder' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Desligar o gravador e manter só as regras do Config.', correct: false, consequence: 'Perde o histórico e a detecção das mudanças na hora que a auditoria exige.' },
        { id: 'b', text: 'Mudar a gravação de todos os tipos para diária.', correct: false, consequence: 'Perde a detecção na hora que a auditoria exige para os recursos da política.' },
        { id: 'c', text: 'Gravar continuamente só security groups, buckets e volumes EBS.', correct: true, consequence: 'O Config cobra por item gravado; os demais tipos deixam de gerar itens.' },
        { id: 'd', text: 'Criar um agregador e desligar o Config nas outras contas.', correct: false, consequence: 'O agregador só mostra o que as contas gravam; desligá-las deixa o agregador vazio.' },
      ],
      explanation: [
        'O Config **cobra por item de configuração gravado** e por avaliação de regra. Por padrão, o gravador grava todos os tipos aceitos na Região. **Gravar só os tipos necessários**, de forma contínua, mantém a detecção na hora e corta os itens dos demais.',
        'Desligar o gravador perde o histórico e a detecção. A gravação diária perde a detecção imediata. O agregador depende das contas gravarem.',
        '**Regra prática:** para reduzir o custo do Config, grave só os tipos necessários ou use a gravação diária onde a detecção imediata não é exigida.',
      ],
    },
    {
      id: 'rv:gov.f04.m1.a4:history',
      kind: 'decision',
      title: 'O que depende deste security group',
      prompt:
        'Antes de apagar um security group antigo, a equipe de redes quer ver **quais instâncias EC2 e interfaces de rede estão ligadas a ele**, numa visão pronta, para não derrubar nada. A conta grava instâncias, interfaces e security groups no Config. Qual recurso usar?',
      concepts: [{ id: 'cfg.history' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'O histórico de eventos do CloudTrail do security group.', correct: false, consequence: 'Mostra as ações dos últimos 90 dias, não quais recursos estão ligados hoje.' },
        { id: 'b', text: 'Uma regra do Config que avalie o security group.', correct: false, consequence: 'A regra diz se o recurso está em conformidade, não do que ele depende.' },
        { id: 'c', text: 'Os relacionamentos do security group no Config.', correct: true, consequence: 'O Config mostra os recursos ligados ao security group, como instâncias e interfaces.' },
        { id: 'd', text: 'Um painel do CloudWatch com as métricas das instâncias.', correct: false, consequence: 'Mostra desempenho, sem dizer quais instâncias usam o security group.' },
      ],
      explanation: [
        'O Config guarda, em cada item de configuração, os **relacionamentos** entre recursos, como o volume ligado a uma instância e o security group dela. Antes de apagar um recurso, os relacionamentos mostram o que depende dele.',
        'O CloudTrail mostra ações, não dependências atuais. Regras avaliam conformidade. Painéis mostram métricas.',
        '**Regra prática:** histórico, snapshot e relacionamentos são o lado "inventário" do Config; regras são o lado "conformidade".',
      ],
    },
    {
      id: 'rv:gov.f04.m2.a3',
      kind: 'decision',
      title: 'Uma regra de tags com todos os resultados em erro',
      prompt:
        'A equipe criou a regra gerenciada **required-tags** para exigir a tag de centro de custo nas instâncias EC2, mas todas as instâncias aparecem com o resultado **ERROR**, e não COMPLIANT ou NON_COMPLIANT. A equipe quer que a regra **passe a avaliar** as instâncias. O que fazer?',
      concepts: [{ id: 'cfg.rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Corrigir os parâmetros da regra, como o nome da tag exigida.', correct: true, consequence: 'Com os parâmetros válidos, cada instância recebe COMPLIANT ou NON_COMPLIANT.' },
        { id: 'b', text: 'Adicionar a tag em todas as instâncias para a regra funcionar.', correct: false, consequence: 'Instâncias sem a tag deveriam aparecer como NON_COMPLIANT, não como ERROR.' },
        { id: 'c', text: 'Mudar o escopo da regra para buckets do S3.', correct: false, consequence: 'Instâncias continuariam sem avaliação, e a regra passaria a olhar outro recurso.' },
        { id: 'd', text: 'Esperar a próxima avaliação periódica, que corrige o erro sozinha.', correct: false, consequence: 'Um parâmetro inválido continua inválido em qualquer avaliação.' },
      ],
      explanation: [
        'Cada recurso avaliado recebe **COMPLIANT** (passa), **NON_COMPLIANT** (falha), **ERROR** (algum parâmetro está inválido) ou **NOT_APPLICABLE** (a regra não se aplica ao recurso). ERROR em tudo aponta para a configuração da regra.',
        'Instância sem tag é NON_COMPLIANT. Mudar o escopo foge do objetivo. Esperar não conserta um parâmetro errado.',
        '**Regra prática:** NON_COMPLIANT é o recurso fora do padrão; ERROR é a regra mal configurada.',
      ],
    },
    {
      id: 'rv:gov.f04.m2.a4',
      kind: 'decision',
      title: 'Uma política interna sem regra pronta',
      prompt:
        'A política de uma empresa exige que o valor da tag `CentroDeCusto` siga o formato **CC-0000** e que o código exista numa **lista mantida pelo financeiro**. Nenhuma regra gerenciada do Config faz essa verificação. A empresa quer que o Config **avalie continuamente** os recursos contra essa política. O que usar?',
      concepts: [{ id: 'cfg.rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A regra gerenciada required-tags, que confere o formato e a lista.', correct: false, consequence: 'A required-tags confere as tags indicadas, mas não consulta a lista do financeiro.' },
        { id: 'b', text: 'Uma regra personalizada do Config com uma função Lambda.', correct: true, consequence: 'A função aplica a lógica da política, e o Config a avalia como qualquer regra.' },
        { id: 'c', text: 'Um pacote de conformidade só com regras gerenciadas.', correct: false, consequence: 'Sem uma regra própria, nenhuma das regras do pacote faz essa verificação.' },
        { id: 'd', text: 'Um agregador do Config com a lista do financeiro.', correct: false, consequence: 'O agregador só junta resultados; ele não avalia recursos.' },
      ],
      explanation: [
        'As **regras gerenciadas** são prontas, criadas pela AWS. Para uma verificação própria, as **regras personalizadas** são escritas com uma **função Lambda** ou com a linguagem **Guard**. Como a política consulta uma lista externa, a Lambda é o caminho.',
        'A required-tags não consulta a lista. Um pacote só com regras gerenciadas não tem essa lógica. O agregador não avalia.',
        '**Regra prática:** verificação comum é regra gerenciada; lógica própria é regra personalizada com Lambda ou Guard.',
      ],
    },
    {
      id: 'rv:gov.f04.m2.a5:mfa',
      kind: 'decision',
      title: 'MFA ligado e a regra ainda vermelha',
      prompt:
        'A regra **root-account-mfa-enabled** apontava a conta como NON_COMPLIANT. O administrador ligou o MFA no usuário root às 10h, mas a regra **continuou vermelha** até o dia seguinte. Ele acha que o Config está com defeito. Qual é a explicação?',
      concepts: [{ id: 'cfg.triggers' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A regra está no modo proativo e só avalia recursos novos.', correct: false, consequence: 'O modo proativo avalia antes da criação; a regra do root funciona no modo detectivo.' },
        { id: 'b', text: 'A regra é avaliada por mudança de configuração, que demora um dia.', correct: false, consequence: 'Regras por mudança de configuração são avaliadas quando o recurso muda, não um dia depois.' },
        { id: 'c', text: 'O usuário root não é um recurso gravado, então a regra não o vê.', correct: false, consequence: 'A regra já avaliava a conta, tanto que estava NON_COMPLIANT.' },
        { id: 'd', text: 'A regra é periódica e só reavalia na próxima execução.', correct: true, consequence: 'O resultado muda na próxima avaliação periódica, ou numa avaliação pedida à mão.' },
      ],
      explanation: [
        'Uma regra pode ser avaliada por **mudança de configuração**, de forma **periódica** (por exemplo, a cada 24 horas) ou pelos dois. A **root-account-mfa-enabled** é **periódica**, como a cloudtrail-enabled: o resultado só muda na próxima execução.',
        'Ela não é proativa nem por mudança de configuração, e já avaliava a conta.',
        '**Regra prática:** regras periódicas demoram a refletir a correção; regras por mudança de configuração reagem quando o recurso muda.',
      ],
    },
    {
      id: 'rv:gov.f04.m3.a2',
      kind: 'decision',
      title: 'Um banco público que talvez alguém ainda use',
      prompt:
        'A regra **rds-instance-public-access-check** apontou um banco RDS de produção acessível publicamente. A equipe sabe que **mudar o acesso pode derrubar um sistema de parceiro** que ainda se conecta pela internet, e quer corrigir **sem causar uma parada inesperada**. Como configurar a remediação dessa regra?',
      concepts: [{ id: 'cfg.remediation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Remediação automática, que fecha o acesso assim que a regra aponta.', correct: false, consequence: 'Fecha o acesso sem validar o impacto e pode derrubar o sistema do parceiro.' },
        { id: 'b', text: 'Remediação manual, acionada depois que a equipe valida o impacto.', correct: true, consequence: 'O documento de automação roda quando a equipe decide, sem surpresa.' },
        { id: 'c', text: 'Nenhuma remediação: apagar a regra para parar o alerta.', correct: false, consequence: 'O banco continua público e some do controle de conformidade.' },
        { id: 'd', text: 'Remediação automática com uma SCP que impede bancos públicos.', correct: false, consequence: 'A SCP não corrige o banco que já existe, e a remediação automática continua arriscada.' },
      ],
      explanation: [
        'A **remediação** corrige recursos NON_COMPLIANT com documentos de automação do Systems Manager, de forma **manual** (alguém aciona) ou **automática**. A automática é ótima para ajustes simples e seguros, e **arriscada quando a correção pode quebrar algo**.',
        'Fechar automaticamente arrisca a parada. Apagar a regra esconde o problema. A SCP não corrige o que existe.',
        '**Regra prática:** remediação automática para correções seguras; manual quando a correção pode parar um sistema.',
      ],
    },
    {
      id: 'rv:gov.f04.m3.a1',
      kind: 'decision',
      title: 'Recursos sem a tag de centro de custo',
      prompt:
        'Recursos sem a tag `CentroDeCusto` aparecem como NON_COMPLIANT na regra required-tags. A empresa quer que, nesses casos, a tag seja **acrescentada automaticamente** com o valor `PENDENTE`, para o financeiro revisar depois. Nenhum documento pronto faz exatamente isso. O que configurar?',
      concepts: [{ id: 'cfg.remediation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um agregador que aplique a tag nas contas de origem.', correct: false, consequence: 'O agregador é somente leitura e não altera recursos.' },
        { id: 'b', text: 'O modo proativo da regra, que acrescenta a tag antes da criação.', correct: false, consequence: 'O modo proativo só informa o resultado; não corrige nem impede a criação.' },
        { id: 'c', text: 'Uma remediação automática com um documento de automação próprio.', correct: true, consequence: 'O documento acrescenta a tag a cada recurso NON_COMPLIANT, sem ninguém agir.' },
        { id: 'd', text: 'Uma regra periódica a cada hora no lugar da required-tags.', correct: false, consequence: 'Avaliar mais vezes não acrescenta a tag a nenhum recurso.' },
      ],
      explanation: [
        'O Config traz documentos de automação gerenciados para remediação, e você também pode **criar e associar os seus**. Com a **remediação automática**, o documento roda para cada recurso NON_COMPLIANT. Acrescentar uma tag é uma correção simples e segura.',
        'O agregador não altera nada. O modo proativo não corrige. Avaliar mais vezes não muda o recurso.',
        '**Regra prática:** "corrigir automaticamente recursos fora do padrão" é regra do Config com remediação automática por documento de automação.',
      ],
    },
    {
      id: 'rv:gov.f04.m3.a4',
      kind: 'decision',
      title: 'Doze contas com buckets públicos no painel central',
      prompt:
        'Num **agregador do Config**, a diretoria vê que 12 das 60 contas da organização têm buckets públicos. Alguém sugere **implantar a regra e a remediação pelo próprio agregador**. A empresa quer as mesmas regras e correções **em todas as contas**, inclusive nas novas. O que fazer?',
      concepts: [{ id: 'cfg.conformance-packs' }, { id: 'cfg.aggregator' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Implantar a regra e a remediação pelo agregador nas 12 contas.', correct: false, consequence: 'O agregador é somente leitura: não implanta regras nem corrige recursos.' },
        { id: 'b', text: 'Implantar um pacote de conformidade na organização.', correct: true, consequence: 'As regras e as remediações chegam a todas as contas, e o agregador acompanha o resultado.' },
        { id: 'c', text: 'Criar a regra à mão em cada uma das 12 contas.', correct: false, consequence: 'Deixa as outras contas e as novas de fora, e repete trabalho.' },
        { id: 'd', text: 'Criar um segundo agregador com permissão de escrita.', correct: false, consequence: 'Não existe agregador com escrita; ele só junta dados.' },
      ],
      explanation: [
        'O **agregador** junta dados de configuração e conformidade de várias contas e Regiões, mas é **somente leitura**. Para levar o mesmo conjunto de **regras e remediações** a toda a organização, o caminho é um **pacote de conformidade**, um modelo YAML implantado como uma unidade.',
        'Criar regras conta a conta repete trabalho e esquece contas. Não há agregador com escrita.',
        '**Regra prática:** pacote de conformidade para implantar; agregador para ver.',
      ],
    },
    {
      id: 'rv:gov.f04.m3.a5',
      kind: 'decision',
      title: 'O preço de um painel central de conformidade',
      prompt:
        'Uma rede de lojas tem 100 contas, todas gravando no Config. A diretoria quer **ver num lugar só** a conformidade de todas, mas teme uma **nova cobrança grande**. A empresa quer a visão central com o **menor custo**. Qual é a recomendação?',
      concepts: [{ id: 'cfg.aggregator' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um agregador do Config, que não tem custo adicional.', correct: true, consequence: 'A visão central não acrescenta cobrança; continuam valendo os itens e as avaliações de cada conta.' },
        { id: 'b', text: 'Um script que copia os resultados de cada conta para um bucket.', correct: false, consequence: 'É código para manter, quando o agregador faz isso sem custo adicional.' },
        { id: 'c', text: 'Gravar de novo todos os recursos na conta central.', correct: false, consequence: 'Paga itens de configuração em dobro para dados que já existem nas contas.' },
        { id: 'd', text: 'Um pacote de conformidade que copie os resultados para a conta central.', correct: false, consequence: 'O pacote implanta regras; a visão central é o papel do agregador.' },
      ],
      explanation: [
        'O **agregador** junta numa conta os dados de configuração e de conformidade de várias contas e Regiões, e **usá-lo não tem custo adicional**. Com o AWS Organizations, as contas de origem nem precisam autorizar.',
        'Scripts e gravação duplicada custam mais. O pacote de conformidade implanta regras, não junta resultados.',
        '**Regra prática:** "visão central da conformidade de todas as contas e Regiões" é um agregador do Config.',
      ],
    },
    {
      id: 'rv:gov.f04.boss.a2:who',
      kind: 'decision',
      title: 'Três perguntas sobre a mesma instância',
      prompt:
        'Depois de um incidente com uma instância EC2, a auditoria faz três perguntas: (1) **a CPU passou de 90%** durante o incidente? (2) **quem trocou o tipo** da instância? (3) o tipo atual **está na lista aprovada** pela empresa? A equipe quer responder com o serviço certo para cada uma. Qual combinação atende?',
      concepts: [{ id: 'cfg.vs-others' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: '(1) CloudTrail, (2) Config, (3) CloudWatch.', correct: false, consequence: 'Troca os papéis: o CloudTrail não mede CPU, e o Config não diz quem agiu.' },
        { id: 'b', text: '(1) CloudWatch, (2) CloudTrail, (3) Config.', correct: true, consequence: 'Desempenho no CloudWatch, autoria no CloudTrail, conformidade no Config.' },
        { id: 'c', text: '(1) CloudWatch, (2) Config, (3) CloudTrail.', correct: false, consequence: 'O Config mostra o que mudou, não quem mudou; o CloudTrail não avalia conformidade.' },
        { id: 'd', text: '(1) Config, (2) CloudTrail, (3) CloudWatch.', correct: false, consequence: 'O Config não guarda métricas de CPU, e o CloudWatch não avalia a lista aprovada.' },
      ],
      explanation: [
        'Cada serviço responde a uma pergunta. O **CloudWatch** diz como está o **desempenho**: métricas, logs e alarmes. O **CloudTrail** diz **quem fez o quê**. O **Config** diz como o recurso está configurado e **se está dentro do padrão**, hoje e no passado.',
        'As outras combinações trocam esses papéis.',
        '**Regra prática:** monitorar e alertar é CloudWatch; auditar ações é CloudTrail; avaliar conformidade e histórico de configuração é Config.',
      ],
    },
  ],
}
