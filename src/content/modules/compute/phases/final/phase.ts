/** Desafio final — Arquitetura de Computação (empresa fictícia: Maré Varejo). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const MARE: ArchitectureLabConfig = {
  title: 'Relatório da Arquitetura de Computação',
  dimensions: [
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  groups: [{ id: 'sobra', title: 'Capacidade ou compromisso além do que a carga pede' }],
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 20/10/2026.',
  steps: [
    {
      id: 'instancias',
      title: 'Instâncias',
      intro: 'A **Maré Varejo** vende online e em 80 lojas. A API do catálogo roda em Java, já testada em Arm, com CPU estável em torno de 40% o dia inteiro. O time de dados quer classificar as fotos dos produtos com um modelo de ML já treinado.',
      questions: [
        {
          id: 'catalogo',
          prompt: 'Que tipo de instância usar na API do catálogo?',
          group: 'sobra',
          options: [
            { id: 'graviton', label: 'Uso geral com Graviton (m7g), no tamanho medido', scores: { desempenho: 1, custo: 1 }, consequence: 'CPU e memória equilibradas, com o melhor preço por desempenho para um código que já roda em Arm.', concepts: ['ec2.families', 'ec2.graviton'] },
            { id: 'burst', label: 'Burstable (t3) para economizar', scores: { desempenho: 0.6, custo: 0.5 }, consequence: 'Com 40% de CPU o tempo todo, a média passa da baseline e o excedente de créditos é cobrado.', whyNot: 'Burstable compensa quando a CPU fica abaixo da baseline na maior parte do tempo.', concepts: ['ec2.burstable'] },
            { id: 'grande', label: 'Otimizada para computação (c7i) com o dobro de vCPUs, por segurança', scores: { desempenho: 1, custo: 0.3 }, consequence: 'Sobra metade da máquina o dia inteiro.', whyNot: 'Dimensionar pelo uso medido; o Auto Scaling cobre os picos.', concepts: ['ec2.families'] },
          ],
        },
        {
          id: 'inferencia',
          prompt: 'Onde rodar a classificação das fotos com o modelo já treinado?',
          options: [
            { id: 'inf', label: 'Instâncias com AWS Inferentia (Inf2), comparando o custo por inferência', scores: { desempenho: 1, custo: 1 }, consequence: 'Chips feitos para inferência, com o modelo compilado para eles.', concepts: ['ec2.accelerated'] },
            { id: 'p', label: 'Instâncias P, com as GPUs mais potentes', scores: { desempenho: 1, custo: 0.3 }, consequence: 'Potência de treino para uma carga que só faz inferência.', whyNot: 'Para servir um modelo pronto, compare Inferentia e GPU pelo custo por inferência.', concepts: ['ec2.accelerated'] },
            { id: 'cpu', label: 'Instâncias de uso geral, sem acelerador', scores: { desempenho: 0.4, custo: 0.6 }, consequence: 'As fotos do dia não terminam a tempo.', whyNot: 'O volume de fotos pede um acelerador de ML.', concepts: ['ec2.accelerated', 'ec2.families'] },
          ],
        },
      ],
    },
    {
      id: 'volumes',
      title: 'Volumes',
      intro: 'O ERP legado roda num banco instalado numa instância EC2 e precisa de **12.000 IOPS** constantes em 500 GiB. Os servidores de miniaturas guardam um cache que pode ser refeito a qualquer momento.',
      questions: [
        {
          id: 'erp',
          prompt: 'Que volume usar no banco do ERP?',
          group: 'sobra',
          options: [
            { id: 'gp3', label: 'gp3 com 12.000 IOPS provisionados', scores: { desempenho: 1, custo: 1 }, consequence: 'O gp3 entrega até 80.000 IOPS, e você paga só o que passa da baseline de 3.000.', concepts: ['ebs.gp3'] },
            { id: 'io2', label: 'io2 Block Express com 12.000 IOPS', scores: { desempenho: 1, custo: 0.5 }, consequence: 'Atende, pagando por durabilidade e IOPS que o ERP não pediu.', whyNot: 'io2 vale para mais de 80.000 IOPS, Multi-Attach ou durabilidade de 99,999%.', concepts: ['ebs.io2', 'ebs.gp3'] },
            { id: 'st1', label: 'st1, porque é mais barato por GiB', scores: { desempenho: 0, custo: 0.8 }, consequence: 'HDD de throughput: não entrega IOPS de banco.', whyNot: 'st1 é para leitura sequencial, não para acesso aleatório.', concepts: ['ebs.gp3'] },
          ],
        },
        {
          id: 'cache',
          prompt: 'Onde guardar o cache das miniaturas?',
          options: [
            { id: 'store', label: 'No instance store da própria instância', scores: { desempenho: 1, custo: 1 }, consequence: 'Disco local rápido que já vem com o tipo; se for apagado, o cache é refeito.', concepts: ['ec2.instance-store'] },
            { id: 'io2-cache', label: 'Num volume io2 para não perder nada', scores: { desempenho: 1, custo: 0.3 }, consequence: 'Paga caro para guardar algo que pode ser perdido.', whyNot: 'Dados temporários que se refazem cabem no instance store.', concepts: ['ec2.instance-store', 'ebs.io2'] },
          ],
        },
        {
          id: 'backup',
          prompt: 'Como proteger o ERP contra a perda da Região?',
          options: [
            { id: 'copia', label: 'Snapshots periódicos copiados para outra Região, cifrados', scores: { resiliente: 1, seguro: 1 }, consequence: 'Um volume novo pode nascer do snapshot em qualquer AZ da outra Região.', concepts: ['ebs.snapshots', 'ebs.encryption'] },
            { id: 'local', label: 'Snapshots só na mesma Região', scores: { resiliente: 0.5, seguro: 1 }, consequence: 'Protege contra a perda do volume, não da Região.', whyNot: 'Para outra Região, o snapshot precisa ser copiado.', concepts: ['ebs.snapshots'] },
          ],
        },
      ],
    },
    {
      id: 'balanceamento',
      title: 'Balanceamento',
      intro: 'A loja web tem caminhos `/api` e `/checkout` com times diferentes. Um parceiro de pagamentos só libera no firewall **IPs fixos** e exige que o TLS chegue intacto aos servidores.',
      questions: [
        {
          id: 'loja-lb',
          prompt: 'Que balanceador usar na loja web?',
          options: [
            { id: 'alb', label: 'Application Load Balancer com regras por caminho para cada target group', scores: { desempenho: 1, requisitos: 1 }, consequence: 'Cada caminho vai para o seu serviço, num só balanceador.', concepts: ['elb.alb', 'elb.listener-rules'] },
            { id: 'nlb-loja', label: 'Network Load Balancer', scores: { desempenho: 1, requisitos: 0.3 }, consequence: 'O NLB não lê o caminho da requisição.', whyNot: 'Rota por caminho é coisa do ALB.', concepts: ['elb.nlb', 'elb.alb'] },
          ],
        },
        {
          id: 'parceiro-lb',
          prompt: 'E a integração com o parceiro de pagamentos?',
          options: [
            { id: 'nlb', label: 'Network Load Balancer com Elastic IPs e listener TCP na porta 443', scores: { requisitos: 1, seguro: 1 }, consequence: 'IP fixo por AZ e o TLS passa direto para os servidores.', concepts: ['elb.nlb'] },
            { id: 'alb-parceiro', label: 'Application Load Balancer com certificado do ACM', scores: { requisitos: 0.2, seguro: 0.8 }, consequence: 'O ALB encerra o TLS e não tem IP fixo.', whyNot: 'IP estático e TLS de ponta a ponta apontam para o NLB.', concepts: ['elb.nlb', 'elb.alb'] },
          ],
        },
      ],
    },
    {
      id: 'escala',
      title: 'Auto Scaling',
      intro: 'A loja vai de 4 para 30 instâncias nos picos. A Black Friday tem data marcada e começa à meia-noite, mais rápido do que as instâncias novas ficam prontas.',
      questions: [
        {
          id: 'grupo',
          prompt: 'Como montar o grupo da loja?',
          group: 'sobra',
          options: [
            { id: 'multi', label: 'Auto Scaling group em 3 AZs, target tracking em 50% de CPU e health checks do ELB', scores: { resiliente: 1, custo: 1, desempenho: 1 }, consequence: 'O grupo acompanha a demanda, sobrevive à perda de uma AZ e troca as instâncias que o balanceador marca como não saudáveis.', concepts: ['asg.group', 'asg.target-tracking', 'asg.health-checks', 'infra.multi-az'] },
            { id: 'uma-az', label: 'Auto Scaling group numa só AZ, para simplificar', scores: { resiliente: 0.2, custo: 1, desempenho: 1 }, consequence: 'Uma falha na AZ derruba a loja inteira.', whyNot: 'Espalhar o grupo por várias AZs é o que dá resiliência.', concepts: ['infra.multi-az', 'asg.group'] },
            { id: 'fixo', label: '30 instâncias fixas o ano todo', scores: { resiliente: 0.8, custo: 0.1, desempenho: 1 }, consequence: 'Atende ao pico pagando por ele o ano inteiro.', whyNot: 'O Auto Scaling cresce só quando a demanda vem.', concepts: ['asg.group'] },
          ],
        },
        {
          id: 'black-friday',
          prompt: 'O que fazer para a meia-noite da Black Friday?',
          options: [
            { id: 'agendada', label: 'Ação agendada que sobe o mínimo do grupo uma hora antes', scores: { desempenho: 1, requisitos: 1 }, consequence: 'A capacidade já está pronta quando os clientes chegam; o target tracking continua cuidando do resto.', concepts: ['asg.scheduled-predictive'] },
            { id: 'esperar', label: 'Deixar só o target tracking reagir', scores: { desempenho: 0.4, requisitos: 0.5 }, consequence: 'Os primeiros minutos ficam lentos enquanto as instâncias sobem.', whyNot: 'Pico com hora marcada pede escala agendada.', concepts: ['asg.scheduled-predictive', 'asg.target-tracking'] },
          ],
        },
      ],
    },
    {
      id: 'eventos',
      title: 'Eventos com Lambda',
      intro: 'Cada foto que um lojista envia ao bucket precisa virar miniatura em poucos segundos. O checkout passou para a Lambda e não pode ter cold start nem ficar sem concorrência quando outras funções crescem.',
      questions: [
        {
          id: 'miniaturas',
          prompt: 'Como gerar as miniaturas?',
          options: [
            { id: 'lambda', label: 'Função Lambda chamada pelo evento do S3', scores: { custo: 1, desempenho: 1 }, consequence: 'Roda só quando chega uma foto e paga por requisição e duração.', concepts: ['lambda.function'] },
            { id: 'ec2-poll', label: 'Uma instância EC2 que consulta o bucket a cada minuto', scores: { custo: 0.3, desempenho: 0.6 }, consequence: 'Paga a máquina o dia inteiro e ainda atrasa até um minuto.', whyNot: 'Evento curto e esporádico é o caso da Lambda.', concepts: ['lambda.function'] },
          ],
        },
        {
          id: 'checkout',
          prompt: 'Como configurar a concorrência do checkout?',
          options: [
            { id: 'res-prov', label: 'Concorrência reservada para o pico e provisionada para o volume normal', scores: { desempenho: 1, resiliente: 1 }, consequence: 'A reservada garante espaço; a provisionada tira o cold start.', concepts: ['lambda.reserved', 'lambda.provisioned'] },
            { id: 'so-res', label: 'Só concorrência reservada', scores: { desempenho: 0.6, resiliente: 1 }, consequence: 'Ninguém toma a concorrência do checkout, mas o cold start continua.', whyNot: 'Cold start some com a provisionada.', concepts: ['lambda.reserved', 'lambda.provisioned'] },
            { id: 'nada', label: 'Deixar no limite compartilhado da conta', scores: { desempenho: 0.4, resiliente: 0.3 }, consequence: 'Outra função em pico pode deixar o checkout com throttling.', whyNot: 'Funções sem reserva disputam o mesmo limite.', concepts: ['lambda.reserved'] },
          ],
        },
      ],
    },
    {
      id: 'conteineres',
      title: 'Contêineres',
      intro: 'Doze microsserviços de estoque e entrega viraram contêineres. O time é pequeno, ninguém usa Kubernetes e cada serviço lê só a própria tabela do DynamoDB.',
      questions: [
        {
          id: 'microsservicos',
          prompt: 'Onde rodar os microsserviços?',
          options: [
            { id: 'fargate', label: 'ECS no Fargate', scores: { requisitos: 1, seguro: 1, custo: 1 }, consequence: 'Sem instâncias para cuidar, com cada task isolada das outras.', concepts: ['ecs.vs-eks', 'fargate.isolation'] },
            { id: 'eks', label: 'EKS com grupos de nós gerenciados', scores: { requisitos: 0.5, seguro: 0.8, custo: 0.6 }, consequence: 'Funciona, mas obriga o time a aprender e operar Kubernetes.', whyNot: 'Sem Kubernetes no time, o ECS é mais simples.', concepts: ['ecs.vs-eks'] },
          ],
        },
        {
          id: 'roles',
          prompt: 'Como cada serviço acessa a própria tabela?',
          options: [
            { id: 'task-role', label: 'Uma task role por serviço, com acesso só à tabela dele', scores: { seguro: 1 }, consequence: 'Cada contêiner recebe credenciais temporárias com o mínimo necessário.', concepts: ['ecs.roles'] },
            { id: 'execution', label: 'As permissões das tabelas na execution role, compartilhada por todos', scores: { seguro: 0.2 }, consequence: 'A execution role é do agente do ECS: o código não usa essas credenciais, e todos ganhariam acesso a tudo.', whyNot: 'O que o código chama vai na task role.', concepts: ['ecs.roles'] },
          ],
        },
      ],
    },
    {
      id: 'lotes',
      title: 'Lotes noturnos',
      intro: 'Toda madrugada, 400 jobs de conciliação de cerca de 1 hora cada precisam terminar até as 7h. Eles podem ser interrompidos e retomados, e alguns dependem de outros.',
      questions: [
        {
          id: 'conciliacao',
          prompt: 'Como rodar a conciliação?',
          options: [
            { id: 'batch-spot', label: 'AWS Batch com um compute environment gerenciado de instâncias Spot', scores: { custo: 1, requisitos: 1 }, consequence: 'O Batch lança e desliga a capacidade e respeita as dependências; o Spot corta o custo.', concepts: ['cmp.batch', 'ec2.spot'] },
            { id: 'lambda-lote', label: 'Uma função Lambda por job', scores: { custo: 0.8, requisitos: 0 }, consequence: 'Cada job de 1 hora estoura o limite de 15 minutos.', whyNot: 'Mais de 15 minutos não é Lambda.', concepts: ['lambda.limits'] },
            { id: 'frota', label: 'Uma frota On-Demand ligada o dia todo', scores: { custo: 0.2, requisitos: 0.8 }, consequence: 'Paga 24 horas por 6 de trabalho, e as dependências ficam em scripts.', whyNot: 'Fila de jobs com dependências é o caso do Batch.', concepts: ['cmp.batch', 'ec2.on-demand'] },
          ],
        },
        {
          id: 'interrupcao',
          prompt: 'E se o Spot interromper um job no meio?',
          options: [
            { id: 'checkpoint', label: 'Gravar checkpoints e tratar o aviso de 2 minutos para retomar de onde parou', scores: { resiliente: 1 }, consequence: 'Uma interrupção custa minutos, não a madrugada.', concepts: ['ec2.spot-interruption'] },
            { id: 'ignorar', label: 'Nada: recomeçar do zero quando acontecer', scores: { resiliente: 0.4 }, consequence: 'Jobs longos interrompidos perto do fim podem passar das 7h.', whyNot: 'Carga em Spot precisa aguentar a interrupção.', concepts: ['ec2.spot-interruption'] },
          ],
        },
      ],
    },
    {
      id: 'compromissos',
      title: 'Compromissos de custo',
      intro: 'O uso mínimo, que nunca some, soma EC2, Fargate e Lambda. A Maré quer trocar de família de instância no ano que vem, quando sair a próxima geração do Graviton.',
      questions: [
        {
          id: 'plano',
          prompt: 'Como cobrir o uso mínimo com desconto?',
          group: 'sobra',
          options: [
            { id: 'compute-sp', label: 'Compute Savings Plan de 1 ano no valor do uso mínimo por hora', scores: { custo: 1, requisitos: 1 }, consequence: 'Vale para qualquer família e Região, e também para Fargate e Lambda.', concepts: ['ec2.savings-plans'] },
            { id: 'ec2-sp', label: 'EC2 Instance Savings Plan de 3 anos na família atual', scores: { custo: 0.6, requisitos: 0.4 }, consequence: 'Desconto maior, preso à família atual e sem cobrir Fargate nem Lambda.', whyNot: 'A troca de família e o uso de Fargate e Lambda pedem o Compute Savings Plan.', concepts: ['ec2.savings-plans'] },
            { id: 'pico', label: 'Reserved Instances Standard de 3 anos para a capacidade do pico', scores: { custo: 0.2, requisitos: 0.3 }, consequence: 'Paga o pico o ano inteiro, sem poder cancelar.', whyNot: 'Compromisso cobre o uso que nunca some, não o pico.', concepts: ['ec2.reserved-instances'] },
            { id: 'sob-demanda', label: 'Nenhum compromisso: tudo On-Demand', scores: { custo: 0.3, requisitos: 1 }, consequence: 'Paga o preço cheio por um uso que existe o ano todo.', whyNot: 'Uso estável e previsível é o que os Savings Plans descontam.', concepts: ['ec2.on-demand', 'ec2.savings-plans'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'alb-uma-az',
      when: [
        ['loja-lb', ['alb']],
        ['grupo', ['uma-az']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'O ALB exige pelo menos duas AZs, mas todas as instâncias da loja ficaram numa só: a loja cai junto com ela.',
      concepts: ['infra.alb-zones', 'infra.multi-az'],
    },
    {
      id: 'sp-sem-fargate',
      when: [
        ['plano', ['ec2-sp']],
        ['microsservicos', ['fargate']],
      ],
      penalty: { custo: 0.2 },
      message: 'Os microsserviços foram para o Fargate, que o EC2 Instance Savings Plan não cobre: uma parte do uso mínimo fica sem desconto.',
      concepts: ['ec2.savings-plans'],
    },
    {
      id: 'spot-sem-checkpoint',
      when: [
        ['conciliacao', ['batch-spot']],
        ['interrupcao', ['ignorar']],
      ],
      penalty: { requisitos: 0.3 },
      message: 'Jobs de 1 hora em Spot, sem checkpoint, recomeçam do zero a cada interrupção e podem não terminar até as 7h.',
      concepts: ['ec2.spot-interruption'],
    },
  ],
}

export const FINAL_CMP: PhaseDef = {
  ...META.final,
  concepts: [
    'ec2.families',
    'ec2.graviton',
    'ec2.burstable',
    'ec2.accelerated',
    'ebs.gp3',
    'ebs.io2',
    'ebs.snapshots',
    'ebs.encryption',
    'ec2.instance-store',
    'elb.alb',
    'elb.nlb',
    'elb.listener-rules',
    'asg.group',
    'asg.target-tracking',
    'asg.health-checks',
    'asg.scheduled-predictive',
    'infra.multi-az',
    'infra.alb-zones',
    'lambda.function',
    'lambda.reserved',
    'lambda.provisioned',
    'lambda.limits',
    'ecs.vs-eks',
    'fargate.isolation',
    'ecs.roles',
    'cmp.batch',
    'ec2.spot',
    'ec2.spot-interruption',
    'ec2.on-demand',
    'ec2.savings-plans',
    'ec2.reserved-instances',
    'cmp.spectrum',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa, as cargas e os números são fictícios.'],
  missions: [
    {
      id: 'cmp.final.varejo',
      title: 'Projeto Maré Varejo',
      type: 'final',
      summary: 'Oito etapas de decisões de computação, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Maré Varejo',
        role: 'Você é a pessoa responsável pela arquitetura de computação do varejista.',
        situation: 'Uma loja web com picos, um ERP legado, fotos que chegam a toda hora, microsserviços em contêineres, lotes de madrugada, um modelo de ML e uma diretoria que quer gastar menos sem perder a Black Friday.',
        objective: 'Escolher instâncias, volumes, balanceadores, escala, funções, contêineres, lotes e compromissos que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'cmp.spectrum', body: ['Cada carga tem o seu ponto no espectro: instâncias dimensionadas pelo uso, Auto Scaling em várias AZs, Lambda para eventos curtos, Fargate para contêineres sem servidores, Batch para filas de jobs. Decisões de uma etapa afetam as outras, e o relatório aponta os conflitos.'] },
        { conceptId: 'ec2.savings-plans' },
      ],
      activities: [
        {
          id: 'cmp.final.varejo.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Arquitetura de Computação',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'ec2.families' }, { id: 'ebs.gp3' }, { id: 'elb.alb' }, { id: 'elb.nlb' }, { id: 'asg.group' }, { id: 'lambda.provisioned' }, { id: 'ecs.roles' }, { id: 'cmp.batch' }, { id: 'ec2.savings-plans' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Dimensione pelo uso medido e deixe o pico para o Auto Scaling.', 'Lembre o que cada plano de desconto cobre: o EC2 Instance Savings Plan não vale para Fargate nem Lambda.'],
          explanation: [
            'Projeto de referência: m7g no catálogo e Inferentia nas fotos; gp3 com 12.000 IOPS no ERP, instance store no cache e snapshots copiados para outra Região; ALB com regras por caminho na loja e NLB com Elastic IPs para o parceiro; Auto Scaling em 3 AZs com target tracking, health checks do ELB e ação agendada para a Black Friday; Lambda nas miniaturas, com reservada e provisionada no checkout; ECS no Fargate com uma task role por serviço; Batch em Spot com checkpoints; Compute Savings Plan no uso mínimo.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: MARE,
        },
      ],
      debrief: { takeaways: ['Dimensione pelo uso medido; picos são do Auto Scaling.', 'Cada carga no seu ponto do espectro: instância, função, contêiner ou lote.', 'Compromisso de custo cobre o que nunca some, com o plano mais flexível que a mudança prevista pede.', 'Decisões se cruzam: um grupo numa só AZ anula o balanceador multi-AZ.'] },
    },
  ],
}
