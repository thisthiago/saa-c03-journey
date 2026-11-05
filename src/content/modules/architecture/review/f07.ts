/**
 * Questões da Revisão da Fase 7 de Arquitetura e otimização (migração), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'arq.f07',
  questions: [
    {
      id: 'rv:arq.f07.m1.a2',
      kind: 'decision',
      title: 'Reescrever tudo em um ano',
      prompt:
        'Uma siderúrgica precisa **fechar o data center em um ano**, com 120 sistemas. O CEO quer **reescrever todos** como nativos da nuvem durante a migração. Só o portal de clientes, que já não escala, tem a reconstrução aprovada. Qual plano a AWS recomendaria para cumprir o prazo?',
      concepts: [{ id: 'mig.strategies' }, { id: 'mig.refactor' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Reescrever os 120 sistemas antes de migrar qualquer um.', correct: false, consequence: 'Um ano não comporta reescrever o portfólio inteiro.' },
        { id: 'b', text: 'Levar tudo em rehost, inclusive o portal que não escala.', correct: false, consequence: 'Cumpre o prazo, mas ignora a reconstrução já aprovada do portal.' },
        { id: 'c', text: 'Migrar a maioria sem reescrever; refactor só no portal.', correct: true, consequence: 'O data center fecha no prazo, e a modernização segue já na AWS.' },
        { id: 'd', text: 'Manter tudo no data center até ter tempo de reescrever.', correct: false, consequence: 'O prazo de fechamento não seria cumprido.' },
      ],
      explanation: [
        'O **refactor** reescreve a aplicação com recursos nativos da nuvem: vale quando o sistema já impede o negócio, como o portal, mas é a estratégia **mais complexa e cara**. Em migrações grandes, a AWS recomenda **rehost, relocate ou replatform** e **modernizar depois**, com tudo já na AWS.',
        'Reescrever o portfólio inteiro estoura o prazo. Rehost em tudo deixa o portal com o problema que justificou a reconstrução. Manter no local descumpre o fechamento.',
        '**Regra prática:** em migração grande e com prazo, migre primeiro com as estratégias simples e reescreva só o que já tem motivo aprovado.',
      ],
    },
    {
      id: 'rv:arq.f07.m1.a1:i1',
      kind: 'decision',
      title: 'O que fica de fora da mudança',
      prompt:
        'No portfólio de migração de uma indústria, o arquiteto quer separar os sistemas que **não vão para a AWS agora**, seja porque serão desativados, seja porque ficam no local por um tempo. Quais sistemas entram nessa lista? (Escolha DUAS.)',
      concepts: [{ id: 'mig.retire' }, { id: 'mig.retain' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Um servidor de relatórios sem nenhuma conexão há 90 dias.', correct: true, consequence: 'Sem uso: é retire, e a empresa para de pagar por ele.' },
        { id: 'b', text: 'Os servidores do ERP, que vão sem nenhuma mudança.', correct: false, consequence: 'É rehost: eles vão para a AWS sem mudanças.' },
        { id: 'c', text: 'O sistema de qualidade, atualizado há três meses com investimento novo.', correct: true, consequence: 'Investimento recente: é retain, e fica no local por enquanto.' },
        { id: 'd', text: 'O banco Oracle de uma VM, levado para o RDS for Oracle.', correct: false, consequence: 'É replatform: o banco vai para um serviço gerenciado.' },
        { id: 'e', text: 'A plataforma VMware, levada para a versão na nuvem.', correct: false, consequence: 'É relocate: a plataforma inteira muda de lugar, para a AWS.' },
      ],
      explanation: [
        '**Retire** é desativar o que não tem valor de negócio: sinais citados pela AWS são nenhuma conexão em 90 dias, uso abaixo de 5% (aplicações zumbis) ou sistema operacional sem suporte. **Retain** é manter no local por enquanto: investimento recente, dependência de outro sistema, residência de dados, hardware especial ou espera pela versão SaaS.',
        'ERP, Oracle e VMware vão para a AWS, com rehost, replatform e relocate.',
        '**Regra prática:** antes de migrar, tire do portfólio o que pode ser desligado (retire) e o que tem motivo para ficar (retain); migrar zumbis só aumenta a conta.',
      ],
    },
    {
      id: 'rv:arq.f07.m2.a1',
      kind: 'decision',
      title: 'Servidores de duas origens',
      prompt:
        'Uma rede varejista vai encerrar o contrato com **outro provedor de nuvem**, onde rodam 80 VMs, e ainda tem **120 máquinas físicas** antigas num galpão. As aplicações precisam chegar à AWS **exatamente como estão**, e a loja on-line aceita só **alguns minutos fora** no dia da troca. Qual serviço leva as duas origens?',
      concepts: [{ id: 'mig.mgn' }, { id: 'mig.rehost' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'AWS DMS, migrando cada servidor com carga contínua.', correct: false, consequence: 'O DMS migra bancos de dados, não servidores inteiros.' },
        { id: 'b', text: 'Amazon EVS, recebendo os servidores das duas origens.', correct: false, consequence: 'O EVS roda VMware; não migra servidores físicos nem de outra nuvem.' },
        { id: 'c', text: 'AWS Transform MGN, com o agente em cada servidor.', correct: true, consequence: 'Replica físicos, virtuais e de outra nuvem, com corte em minutos.' },
        { id: 'd', text: 'AWS DataSync, copiando os discos de cada servidor.', correct: false, consequence: 'O DataSync copia arquivos; não converte servidores para a AWS.' },
      ],
      explanation: [
        'O **rehost** leva o servidor sem mudar a aplicação, de servidores **físicos, virtuais ou de outra nuvem**. O **AWS Transform MGN** (antes AWS Application Migration Service) automatiza isso: o agente faz **replicação contínua em nível de bloco**, o serviço converte os servidores para a AWS e o corte costuma levar **minutos**. Funciona com Windows Server e várias distribuições Linux.',
        'O DMS migra dados de bancos. O EVS roda VMware na AWS. O DataSync copia arquivos.',
        '**Regra prática:** servidores inteiros, de qualquer origem, sem mudar a aplicação, é rehost com o AWS Transform MGN.',
      ],
    },
    {
      id: 'rv:arq.f07.ondas-e-templates',
      kind: 'decision',
      title: 'Duzentos servidores sem ajuste manual',
      prompt:
        'Uma empresa vai migrar **200 servidores** com o AWS Transform MGN, divididos em **dez ondas**. Cada servidor precisa subir com o **tipo de instância e a sub-rede certos** e rodar um **script de configuração** depois de lançado, e o time quer aplicar isso **em lote**, sem ajustar servidor por servidor. Qual recurso do MGN atende?',
      concepts: [{ id: 'mig.mgn' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ajustar cada instância à mão logo depois do corte.', correct: false, consequence: 'É servidor por servidor, o que o time quer evitar.' },
        { id: 'b', text: 'Templates de lançamento e pós-lançamento, com ondas.', correct: true, consequence: 'Cada onda sobe com a configuração certa, em ações em lote.' },
        { id: 'c', text: 'Uma AMI por servidor criada antes da replicação.', correct: false, consequence: 'O MGN converte os servidores; criar AMIs à mão é trabalho extra.' },
        { id: 'd', text: 'Migrar os 200 servidores de uma vez, num corte único.', correct: false, consequence: 'Aumenta o risco e não resolve a configuração de cada um.' },
      ],
      explanation: [
        'O **AWS Transform MGN** tem **três templates** (replicação, lançamento e pós-lançamento) que controlam como cada servidor é replicado, lançado e configurado. Os servidores podem ser agrupados em **aplicações e ondas**, com **ações em lote**.',
        'Ajustes manuais, AMIs à mão e um corte único jogam fora o que o serviço automatiza.',
        '**Regra prática:** migração grande com o MGN se organiza em ondas, com templates que definem o lançamento e a configuração de cada servidor.',
      ],
    },
    {
      id: 'rv:arq.f07.m2.a3',
      kind: 'decision',
      title: 'Cortar direto no domingo',
      prompt:
        'Os servidores do ERP de uma fábrica já estão **sincronizados** no AWS Transform MGN. Para ganhar tempo, um gerente quer **pular o teste** e fazer o corte direto no domingo. A fábrica não pode parar por surpresas. Qual caminho atende?',
      concepts: [{ id: 'mig.mgn-lifecycle' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Lançar e validar instâncias de teste antes.', correct: true, consequence: 'Os problemas aparecem no teste, sem parar a produção.' },
        { id: 'b', text: 'Cortar no domingo, porque o MGN garante a conversão.', correct: false, consequence: 'O MGN converte, mas só o teste mostra se o ERP sobe e conversa.' },
        { id: 'c', text: 'Testar só depois do corte, já na produção.', correct: false, consequence: 'Qualquer erro descoberto ali já é uma parada da fábrica.' },
        { id: 'd', text: 'Parar a replicação antes de testar para economizar.', correct: false, consequence: 'Os servidores voltariam a precisar de sincronização.' },
      ],
      explanation: [
        'Depois da sincronização inicial, o servidor fica **pronto para teste**: lança-se uma **instância de teste enquanto a replicação continua**, sem parar a produção. Validado, ele fica **pronto para o corte**. A AWS recomenda terminar as instâncias de teste ao fim dos testes, porque elas são cobradas.',
        'Pular o teste ou testar depois do corte transfere o risco para a fábrica. A replicação precisa continuar até o corte.',
        '**Regra prática:** no MGN, teste antes de cortar; o teste roda em paralelo à replicação e não afeta a produção.',
      ],
    },
    {
      id: 'rv:arq.f07.m1.a1:i3',
      kind: 'decision',
      title: 'Seis meses até o fim do contrato',
      prompt:
        'O contrato do data center de uma empresa **acaba em seis meses**, e há **300 servidores** de aplicações variadas. O time é pequeno e quer migrar **rápido e com pouca parada**, deixando as otimizações para depois. Qual estratégia atende à maior parte do portfólio?',
      concepts: [{ id: 'mig.rehost' }, { id: 'mig.strategies' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Refactor dos 300 sistemas para serviços sem servidor.', correct: false, consequence: 'É a estratégia mais demorada; não cabe em seis meses.' },
        { id: 'b', text: 'Replatform de todos para contêineres antes de migrar.', correct: false, consequence: 'Ajustar 300 aplicações atrasa a saída do data center.' },
        { id: 'c', text: 'Retain de todos até a renovação do contrato.', correct: false, consequence: 'O contrato acaba, e ficar exige renovar o que se quer deixar.' },
        { id: 'd', text: 'Rehost, levando os servidores como estão.', correct: true, consequence: 'Migra muitos servidores rápido; a otimização vem já na AWS.' },
      ],
      explanation: [
        'O **rehost** leva o servidor **sem mudar a aplicação**: serve para migrar **muitos servidores rápido e com pouca parada**, e a otimização vem depois, com a aplicação já na AWS. Em migrações grandes, ele é uma das estratégias mais comuns.',
        'Refactor e replatform de tudo alongam o projeto. Retain não resolve um contrato que acaba.',
        '**Regra prática:** "muitos servidores, prazo curto, sem mudar as aplicações" é rehost; otimizar vem depois.',
      ],
    },
    {
      id: 'rv:arq.f07.graviton',
      kind: 'decision',
      title: 'Mesma aplicação, conta menor',
      prompt:
        'Uma aplicação **Java**, já portável entre arquiteturas, vai para a AWS em instâncias x86. O time quer aproveitar a migração para **reduzir o custo da computação** com um **ajuste pequeno**, **sem reescrever** o código. Qual estratégia e escolha atendem?',
      concepts: [{ id: 'mig.replatform' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Refactor para funções Lambda, pagando por pedido.', correct: false, consequence: 'Exige reescrever a aplicação, o que o time quer evitar.' },
        { id: 'b', text: 'Rehost em instâncias x86 maiores, com folga.', correct: false, consequence: 'Não otimiza nada e ainda aumenta o custo da computação.' },
        { id: 'c', text: 'Replatform para instâncias Graviton (Arm).', correct: true, consequence: 'O ajuste é pequeno, e o custo por desempenho cai.' },
        { id: 'd', text: 'Repurchase de um SaaS que substitua a aplicação.', correct: false, consequence: 'Troca o produto, não aproveita a aplicação existente.' },
      ],
      explanation: [
        'O **replatform** migra com **alguma otimização, sem reescrever**: levar o banco para um serviço gerenciado, trocar Windows por Linux, ir para contêineres ou para **Graviton**. Uma aplicação Java portável roda em instâncias Arm com pouco ajuste, com custo menor por desempenho.',
        'Refactor reescreve, rehost em instâncias maiores não otimiza, e repurchase troca o produto.',
        '**Regra prática:** "otimizar sem reescrever" é replatform: banco gerenciado, sistema mais barato, contêineres ou Graviton.',
      ],
    },
    {
      id: 'rv:arq.f07.m1.a1:i6',
      kind: 'decision',
      title: 'O banco que ninguém quer mais cuidar',
      prompt:
        'Um banco **Oracle** roda numa máquina virtual do data center, e o time gasta horas com **patches, backups e failover**. A aplicação não pode ser reescrita, e o corte precisa de **parada curta**. Quais escolhas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'mig.replatform' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Levar o banco para o Amazon RDS for Oracle (replatform).', correct: true, consequence: 'A AWS passa a cuidar de patches, backups e failover.' },
        { id: 'b', text: 'Reescrever o acesso a dados para o DynamoDB (refactor).', correct: false, consequence: 'Exige reescrever a aplicação, o que não é possível aqui.' },
        { id: 'c', text: 'Usar o AWS DMS com replicação contínua até o corte.', correct: true, consequence: 'Os dados ficam sincronizados, e a parada no corte é curta.' },
        { id: 'd', text: 'Levar a VM do banco com o MGN para uma instância EC2.', correct: false, consequence: 'É rehost: o time continua cuidando de patches e backups.' },
        { id: 'e', text: 'Manter o banco no data center (retain) por mais um ano.', correct: false, consequence: 'O esforço com patches, backups e failover continua igual.' },
      ],
      explanation: [
        'Reduzir o esforço do banco **sem reescrever** é **replatform**: levar o Oracle para o **Amazon RDS for Oracle**, um serviço gerenciado. Para o corte com parada curta, o **AWS DMS** faz a carga completa e replica as **mudanças contínuas** até a troca.',
        'Refactor para DynamoDB reescreve a aplicação. Rehost com o MGN mantém o banco sob o cuidado do time. Retain não muda nada.',
        '**Regra prática:** banco que sai de VM para serviço gerenciado é replatform, e o DMS com replicação contínua encurta a parada.',
      ],
    },
    {
      id: 'rv:arq.f07.m1.a1:i4',
      kind: 'decision',
      title: 'O vCenter que não pode mudar',
      prompt:
        'A infraestrutura de uma distribuidora opera **500 cargas pelo vCenter**, com rotinas de backup e automações escritas para ele. A diretoria quer sair do data center **em semanas**, e o time de operação **não quer converter cada servidor** nem aprender outro jeito de operar. Um analista sugeriu o AWS Transform MGN. O que atende?',
      concepts: [{ id: 'mig.relocate' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Rehost com o MGN, como o time propôs.', correct: false, consequence: 'Converte cada VM em instância EC2, e as ferramentas do VMware ficam para trás.' },
        { id: 'b', text: 'Relocate para o Amazon EVS, com o VMware na AWS.', correct: true, consequence: 'A plataforma muda de lugar, com as mesmas ferramentas e procedimentos.' },
        { id: 'c', text: 'Replatform das VMs para contêineres no ECS.', correct: false, consequence: 'Muda a plataforma e os procedimentos, contra o requisito.' },
        { id: 'd', text: 'Retain das VMs no data center por tempo indeterminado.', correct: false, consequence: 'Não migra nada, e o data center continua sendo necessário.' },
      ],
      explanation: [
        'O **relocate** transfere muitos servidores de uma plataforma local para a **versão na nuvem da mesma plataforma**, como VMware, sem comprar hardware, reescrever ou mudar a operação. O **Amazon EVS** roda o VMware Cloud Foundation em instâncias bare metal do EC2.',
        'O rehost com MGN converte as VMs em instâncias EC2. Contêineres mudam a plataforma. Retain não migra.',
        '**Regra prática:** "levar o VMware mantendo ferramentas e operação" é relocate; "levar servidores sem mudar a aplicação" é rehost.',
      ],
    },
    {
      id: 'rv:arq.f07.m1.a1:i5',
      kind: 'decision',
      title: 'O CRM que ninguém quer hospedar',
      prompt:
        'Uma empresa tem um **CRM instalado** em servidores próprios, com licença tradicional e uma equipe cuidando da infraestrutura. O mesmo fornecedor oferece uma **versão SaaS** que atende à empresa. O objetivo é **parar de manter servidores e licenças** do CRM. Qual estratégia de migração atende?',
      concepts: [{ id: 'mig.repurchase' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Rehost dos servidores do CRM para instâncias EC2.', correct: false, consequence: 'Continua com servidores e licença para manter, agora na AWS.' },
        { id: 'b', text: 'Replatform do banco do CRM para o RDS.', correct: false, consequence: 'Reduz parte do esforço, mas o CRM instalado continua.' },
        { id: 'c', text: 'Repurchase, trocando pelo SaaS do fornecedor.', correct: true, consequence: 'Sai a infraestrutura e a licença tradicional; entra o pagamento pelo uso.' },
        { id: 'd', text: 'Refactor do CRM para microsserviços próprios.', correct: false, consequence: 'Reescreve um produto que o fornecedor já oferece como serviço.' },
      ],
      explanation: [
        '**Repurchase** é trocar o sistema por outro produto, em geral um **SaaS**: sai a licença tradicional e a infraestrutura para manter, entra o **pagamento pelo uso**. Depois vêm treinar os usuários, migrar os dados e integrar o login.',
        'Rehost e replatform mantêm o CRM instalado. Refactor reescreve algo que já existe como serviço.',
        '**Regra prática:** "o fornecedor tem a versão SaaS" e "parar de manter servidores e licenças" apontam para repurchase.',
      ],
    },
  ],
}
