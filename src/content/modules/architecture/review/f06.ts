/**
 * Questões da Revisão da Fase 6 de Arquitetura e otimização (otimização de
 * custos), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). Os preços e as
 * especificações são premissas do enunciado. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'arq.f06',
  questions: [
    {
      id: 'rv:arq.f06.m1.a1',
      kind: 'decision',
      title: 'Quinze por cento ontem',
      prompt:
        'O time quer reduzir o tamanho das instâncias de uma API porque o **uso médio de CPU do último dia** foi de 15%. A API tem um **pico forte no fechamento do mês**, e ninguém olhou a memória. A empresa quer cortar custo **sem derrubar a API** no pico. Como decidir o novo tamanho?',
      concepts: [{ id: 'opt.rightsizing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Reduzir pela média de CPU do último dia, como proposto.', correct: false, consequence: 'Ignora o pico de fim de mês e a memória: a API pode cair.' },
        { id: 'b', text: 'Reduzir todas pela metade e esperar as reclamações.', correct: false, consequence: 'Sem métricas, a economia vira indisponibilidade.' },
        { id: 'c', text: 'Usar o máximo de CPU e memória em quatro semanas.', correct: true, consequence: 'O pico e a memória entram na decisão, com o apoio do Compute Optimizer.' },
        { id: 'd', text: 'Comprar Savings Plans antes, para garantir o desconto.', correct: false, consequence: 'Compromete o gasto antes de saber o tamanho certo.' },
      ],
      explanation: [
        'O **dimensionamento correto** usa as **métricas da carga em produção** num período que inclua os picos. Uma referência da AWS: instâncias com uso **máximo** de CPU **e de memória** abaixo de 40% em **quatro semanas** são candidatas a um tamanho menor. O **Compute Optimizer** analisa essas métricas e recomenda o tipo.',
        'A média de um dia esconde o pico, e a CPU sozinha esconde a memória. Reduzir sem medir ou comprar compromisso antes de dimensionar trava o erro.',
        '**Regra prática:** dimensione pelo máximo de CPU e memória num período longo; compromisso de uso vem depois do tamanho certo.',
      ],
    },
    {
      id: 'rv:arq.f06.memoria-alta',
      kind: 'decision',
      title: 'CPU sobrando, memória no limite',
      prompt:
        'Uma API roda em instâncias **m5.2xlarge (8 vCPUs, 32 GiB)**. Em quatro semanas, o uso máximo foi de **20% de CPU** e **85% de memória**. As opções são m5.xlarge (4 vCPUs, 16 GiB), r5.xlarge (4 vCPUs, 32 GiB) e c5.2xlarge (8 vCPUs, 16 GiB). Qual troca reduz o custo **sem faltar memória**?',
      concepts: [{ id: 'opt.rightsizing' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'm5.xlarge, a metade do tamanho atual na mesma família.', correct: false, consequence: 'Com 16 GiB, a memória usada hoje não cabe.' },
        { id: 'b', text: 'c5.2xlarge, da família otimizada para computação.', correct: false, consequence: 'Mantém as vCPUs que sobram e corta a memória que falta.' },
        { id: 'c', text: 'Manter a m5.2xlarge, porque a memória está alta.', correct: false, consequence: 'Continua pagando o dobro das vCPUs que a carga usa.' },
        { id: 'd', text: 'r5.xlarge, com metade das vCPUs e a mesma memória.', correct: true, consequence: 'Corta as vCPUs ociosas e mantém os 32 GiB de que a carga precisa.' },
      ],
      explanation: [
        'Dimensionar olha **CPU e memória juntas**. Aqui sobra CPU e falta pouco para a memória acabar: a troca certa é para uma família **otimizada para memória**, com menos vCPUs e a **mesma memória**, como a r5.xlarge.',
        'A m5.xlarge e a c5.2xlarge cortam a memória que a carga usa. Manter a instância paga vCPUs ociosas.',
        '**Regra prática:** olhando só a CPU, a redução derruba a carga; combine o recurso que sobra e o que falta para escolher a família.',
      ],
    },
    {
      id: 'rv:arq.f06.m1.a2:p3',
      kind: 'decision',
      title: 'Um site com data para acabar',
      prompt:
        'Uma agência vai lançar o site de uma campanha que **acaba em quatro meses**. As instâncias rodam o tempo todo nesse período e **não podem ser interrompidas**, porque o site precisa responder a qualquer hora. Qual modelo de compra dá o **menor custo** sem risco para o site?',
      concepts: [{ id: 'opt.pricing-model' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Instâncias reservadas de 1 ano, sem pagamento adiantado.', correct: false, consequence: 'Paga oito meses de compromisso depois que a campanha acabou.' },
        { id: 'b', text: 'Instâncias On-Demand, desligadas no fim da campanha.', correct: true, consequence: 'Sem compromisso para algo que termina logo, e sem interrupções.' },
        { id: 'c', text: 'Instâncias Spot, com o maior desconto disponível.', correct: false, consequence: 'Podem ser interrompidas, e o site não aceita isso.' },
        { id: 'd', text: 'Um Compute Savings Plan de 3 anos para o site.', correct: false, consequence: 'Compromete três anos de gasto para quatro meses de uso.' },
      ],
      explanation: [
        'A boa prática **COST07-BP01** (risco alto) é analisar o **modelo de compra de cada componente**. Compromisso de 1 ou 3 anos (Savings Plans e instâncias reservadas) só compensa para o que roda por muito tempo. Uma campanha de quatro meses, que não aceita interrupção, fica no **On-Demand**.',
        'Reservas e Savings Plans seguiriam cobrando depois do fim. O Spot dá até 90% de desconto, mas pode interromper.',
        '**Regra prática:** compromisso para a base longa e constante, Spot para o que aceita interrupção e On-Demand para o curto ou imprevisível.',
      ],
    },
    {
      id: 'rv:arq.f06.m1.a2:p1',
      kind: 'decision',
      title: 'Três perfis de uso na mesma frota',
      prompt:
        'Uma frota web usa **10 instâncias o ano todo**, chega a **30 em picos diários** imprevisíveis que **não podem ser interrompidos** e tem um **processamento noturno** que recomeça de onde parou se cair. A frota vai continuar por anos. Quais escolhas dão o **menor custo** sem riscos? (Escolha DUAS.)',
      concepts: [{ id: 'opt.pricing-model' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Um Savings Plan que cubra só as 10 instâncias da base.', correct: true, consequence: 'O compromisso fica sempre usado, e os picos seguem On-Demand.' },
        { id: 'b', text: 'Um Savings Plan que cubra as 30 instâncias do pico.', correct: false, consequence: 'Paga compromisso por 20 instâncias que ficam paradas boa parte do dia.' },
        { id: 'c', text: 'Instâncias Spot para o processamento noturno.', correct: true, consequence: 'O lote aceita interrupção e ganha o maior desconto.' },
        { id: 'd', text: 'Instâncias Spot para atender aos picos do dia.', correct: false, consequence: 'Os picos não aceitam interrupção, e o Spot pode ser retomado.' },
        { id: 'e', text: 'Instâncias reservadas de 3 anos para o processamento noturno.', correct: false, consequence: 'Paga 24 horas por dia por algo que roda só à noite.' },
      ],
      explanation: [
        'Em geral, a conta **mistura modelos**. A **base constante** (as 10 instâncias) vai para o **compromisso**; os picos imprevisíveis que não podem cair ficam **On-Demand**; e o que **aceita interrupção**, como o lote noturno, vai para o **Spot**.',
        'Um compromisso do tamanho do pico fica ocioso. Spot nos picos arrisca interrupções que o negócio não aceita. Reservar 24 horas para um lote noturno paga horas paradas.',
        '**Regra prática:** cubra com compromisso só o mínimo que roda sempre; o que varia fica On-Demand, e o que pode cair vai para Spot.',
      ],
    },
    {
      id: 'rv:arq.f06.m2.a3',
      kind: 'decision',
      title: 'Milhares de pedidos o dia todo',
      prompt:
        'A API de busca de um marketplace recebe **milhares de pedidos por segundo**, o dia inteiro, todos os dias, num volume **estável** há dois anos. O time propõe migrá-la para o Lambda porque "serverless é sempre mais barato". Qual opção tende a dar o **menor custo** por pedido?',
      concepts: [{ id: 'opt.serverless-vs-provisioned' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Migrar para o Lambda, pagando por pedido e duração.', correct: false, consequence: 'Com tráfego alto e constante, cada invocação paga pode sair mais caro.' },
        { id: 'b', text: 'Instâncias On-Demand desligadas durante a noite.', correct: false, consequence: 'A busca é usada o dia inteiro, todos os dias.' },
        { id: 'c', text: 'Contêineres provisionados com um Savings Plan.', correct: true, consequence: 'O recurso fica ocupado o tempo todo, e o desconto rende.' },
        { id: 'd', text: 'Instâncias Spot para toda a frota da API.', correct: false, consequence: 'Interrupções derrubariam a busca, que precisa estar sempre no ar.' },
      ],
      explanation: [
        'No **serverless**, paga-se por requisição e duração, o que favorece tráfego **baixo ou irregular**. No **provisionado**, paga-se a hora do recurso, use ou não: com uso **alto e constante**, ele costuma sair mais barato por unidade de trabalho, ainda mais com **Savings Plans**.',
        'Serverless não é sempre mais barato. Desligar à noite não serve a uma carga de 24 horas. Spot não serve a uma API que não pode cair.',
        '**Regra prática:** tráfego baixo ou irregular favorece o serverless; uso alto e constante, o provisionado com compromisso.',
      ],
    },
    {
      id: 'rv:arq.f06.m2.a2',
      kind: 'decision',
      title: 'A API de avaliações no Lambda',
      prompt:
        'Uma API recebe **3 milhões de pedidos por mês**, cada um com **200 ms** em funções de **512 MB**, e hoje roda em duas instâncias ligadas o mês todo. No Lambda, o preço é **US$ 0,20 por milhão de pedidos** e **US$ 0,0000166667 por GB-segundo**. Sem o nível gratuito, quanto a API custaria por mês no Lambda?',
      concepts: [{ id: 'opt.serverless-vs-provisioned' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 0,60, só pelos pedidos.', correct: false, consequence: 'Esquece a duração, que é a maior parte da conta.' },
        { id: 'b', text: 'Cerca de US$ 10,60, contando 1 GB por função.', correct: false, consequence: 'As funções têm 512 MB, ou 0,5 GB: a duração custa a metade disso.' },
        { id: 'c', text: 'Cerca de US$ 5,60, somando duração e pedidos.', correct: true, consequence: '300.000 GB-s custam US$ 5,00, e os pedidos, US$ 0,60.' },
        { id: 'd', text: 'Cerca de US$ 60,00, pelas horas ligadas no mês.', correct: false, consequence: 'O Lambda não cobra hora ligada; cobra pedidos e duração.' },
      ],
      explanation: [
        'Duração: 3.000.000 × 0,2 s × 0,5 GB = **300.000 GB-s**, ou **US$ 5,00**. Pedidos: 3 × US$ 0,20 = **US$ 0,60**. Total: cerca de **US$ 5,60 por mês**, contra duas instâncias ligadas o mês inteiro.',
        'Esquecer a duração ou usar a memória errada distorce a conta. O Lambda não tem cobrança por hora ligada: com tráfego baixo, ninguém paga servidor parado.',
        '**Regra prática:** custo do Lambda é pedidos mais GB-segundo (memória × duração); com pouco tráfego, costuma ser uma fração do provisionado.',
      ],
    },
    {
      id: 'rv:arq.f06.m1.a3',
      kind: 'decision',
      title: 'Desligou, mas a conta não zerou',
      prompt:
        'Uma empresa passou a **parar as instâncias EC2 e o RDS** da homologação fora do expediente, e a conta da computação caiu como esperado. Mesmo nas horas paradas, porém, uma parte da conta **continua aparecendo**. Qual custo continua sendo cobrado com os recursos parados?',
      concepts: [{ id: 'opt.schedule' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'A hora das instâncias EC2 paradas, com desconto.', correct: false, consequence: 'Instância parada não cobra a computação.' },
        { id: 'b', text: 'O armazenamento dos volumes EBS e do banco RDS.', correct: true, consequence: 'Os discos continuam guardando os dados e são cobrados.' },
        { id: 'c', text: 'A hora da instância do RDS, que não pode ser parada.', correct: false, consequence: 'O RDS pode ser parado, e a computação dele deixa de ser cobrada.' },
        { id: 'd', text: 'Nenhum: recurso parado não gera cobrança alguma.', correct: false, consequence: 'O armazenamento continua cobrado enquanto existir.' },
      ],
      explanation: [
        'Desligar fora do horário é uma das formas mais simples de economizar: a AWS cita **70% ou mais** do custo de rodar 24 horas. Instâncias **EC2 e RDS paradas param de cobrar a computação**, mas o **armazenamento continua cobrado**: os volumes EBS e o armazenamento do banco seguem existindo.',
        'Nem EC2 nem RDS parados cobram a hora de computação, e o armazenamento não some.',
        '**Regra prática:** agendar o desligamento corta a computação; o armazenamento só cai apagando ou reduzindo o que está guardado.',
      ],
    },
    {
      id: 'rv:arq.f06.m2.a1',
      kind: 'decision',
      title: 'Cinco meses de sobra',
      prompt:
        'Um ambiente montado para um **teste de carga** ficou rodando **cinco meses** depois do teste, e ninguém sabia de quem era. A empresa quer que recursos de testes e projetos encerrados **apareçam e sejam desligados** no prazo, sem depender da memória das pessoas. Qual prática atende?',
      concepts: [{ id: 'opt.decommission' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um orçamento da conta inteira com alerta de gasto.', correct: false, consequence: 'Avisa que o gasto subiu, mas não diz de quem é nem o que desligar.' },
        { id: 'b', text: 'Apagar todo recurso sem nome toda sexta-feira.', correct: false, consequence: 'Pode apagar produção que alguém esqueceu de nomear.' },
        { id: 'c', text: 'Pedir aos times que avisem quando terminarem os testes.', correct: false, consequence: 'Continua dependendo de alguém lembrar, como no ambiente esquecido.' },
        { id: 'd', text: 'Tags de dono e prazo, com aviso do que venceu.', correct: true, consequence: 'Cada recurso tem dono e data, e o que passou do prazo aparece.' },
      ],
      explanation: [
        'A boa prática **COST04-BP01** (risco alto) é **rastrear os recursos durante a vida deles**: tags que dizem a **carga**, o **dono** e, quando for o caso, uma **data ou prazo de desativação**, além de monitorar quando a carga para de receber pedidos. Assim, sobras de testes aparecem e são desligadas.',
        'Orçamentos avisam sem apontar o recurso. Apagar por falta de nome é arriscado. Pedidos aos times dependem de memória.',
        '**Regra prática:** todo recurso tem dono e motivo; os temporários têm data para acabar.',
      ],
    },
    {
      id: 'rv:arq.f06.m3.a1:i3',
      kind: 'decision',
      title: 'O cache na zona vizinha',
      prompt:
        'Em us-east-1, uma aplicação na **AZ a** lê **10.000 GB por mês** de um cache que está na **AZ b**. O preço é **US$ 0,01 por GB** em cada sentido entre AZs. Considerando só esse tráfego, quanto a transferência custa por mês?',
      concepts: [{ id: 'opt.transfer-pricing' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Nada, porque o tráfego fica dentro da mesma Região.', correct: false, consequence: 'Entre AZs da mesma Região, o GB é cobrado.' },
        { id: 'b', text: 'Cerca de US$ 100, cobrando só a saída da AZ b.', correct: false, consequence: 'Entre AZs, o GB paga na saída e na entrada.' },
        { id: 'c', text: 'Cerca de US$ 900, pelo preço da saída para a internet.', correct: false, consequence: 'O tráfego fica entre duas AZs; não sai para a internet.' },
        { id: 'd', text: 'Cerca de US$ 200, com a saída e a entrada cobradas.', correct: true, consequence: '10.000 GB × US$ 0,01 nos dois sentidos dão US$ 200.' },
      ],
      explanation: [
        'Entre **AZs da mesma Região**, cada GB paga **na saída e na entrada**: 10.000 × US$ 0,01 × 2 = **US$ 200 por mês**. Dentro da mesma AZ, não há cobrança; entre Regiões, paga só a saída da origem; para a internet, cada GB de saída é cobrado.',
        'Achar que o tráfego entre AZs é gratuito é um erro comum. Cobrar só um sentido subestima a conta. O preço da internet não se aplica.',
        '**Regra prática:** entrada da internet e mesma AZ não pagam; entre AZs paga nos dois sentidos; entre Regiões e para a internet paga a saída.',
      ],
    },
    {
      id: 'rv:arq.f06.m3.a3',
      kind: 'decision',
      title: 'Os livros pelo CloudFront',
      prompt:
        'Leitores baixam **20.000 GB por mês** de livros direto da Região, a **US$ 0,09 por GB**. Com o CloudFront na frente, a Região entrega ao CloudFront **sem custo de transferência**, e a saída do CloudFront custa **US$ 0,085 por GB**. Quanto passa a custar a transferência por mês?',
      concepts: [{ id: 'opt.transfer-pricing' }, { id: 'opt.transfer-reduce' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 3.500, pagando a Região e o CloudFront.', correct: false, consequence: 'Da Região para o CloudFront não há cobrança por GB.' },
        { id: 'b', text: 'Cerca de US$ 1.800, porque o CloudFront não muda o preço.', correct: false, consequence: 'A saída passa a ser do CloudFront, a US$ 0,085 por GB.' },
        { id: 'c', text: 'Cerca de US$ 1.700, só pela saída do CloudFront.', correct: true, consequence: '20.000 × US$ 0,085 = US$ 1.700, US$ 100 a menos por mês.' },
        { id: 'd', text: 'Nada, porque o CloudFront não cobra transferência.', correct: false, consequence: 'A saída do CloudFront para os leitores é cobrada.' },
      ],
      explanation: [
        'Da **Região para o CloudFront**, não há cobrança por GB; paga-se a **saída do CloudFront**: 20.000 × US$ 0,085 = **US$ 1.700**, contra US$ 1.800 direto da Região. Além dos US$ 100, o cache aproxima os livros dos leitores e tira carga da origem.',
        'Somar as duas saídas cobra um trecho que é gratuito. O CloudFront não é grátis para quem baixa.',
        '**Regra prática:** conteúdo baixado muitas vezes vai pelo CloudFront; a origem não paga a entrega a ele.',
      ],
    },
    {
      id: 'rv:arq.f06.m3.a2',
      kind: 'decision',
      title: 'Um lote que lê do banco na zona vizinha',
      prompt:
        'Um job de **relatórios noturnos**, que pode ser refeito se falhar, roda numa instância da **AZ a** e lê **30 TB por mês** de uma réplica de leitura do RDS na **AZ b**. A conta de transferência entre AZs chamou atenção. A aplicação web, que precisa de alta disponibilidade, não muda. Qual ajuste reduz esse custo?',
      concepts: [{ id: 'opt.transfer-reduce' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Pôr o CloudFront entre o job e a réplica de leitura.', correct: false, consequence: 'O CloudFront entrega conteúdo a usuários; não fica entre um job e um banco.' },
        { id: 'b', text: 'Rodar o job na mesma AZ da réplica de leitura.', correct: true, consequence: 'O tráfego passa a ficar dentro da AZ, sem cobrança por GB.' },
        { id: 'c', text: 'Mover a aplicação web inteira para uma única AZ.', correct: false, consequence: 'Economiza, mas tira a alta disponibilidade que a web precisa.' },
        { id: 'd', text: 'Criar um endpoint de gateway para o RDS na VPC.', correct: false, consequence: 'Endpoints de gateway existem só para o S3 e o DynamoDB.' },
      ],
      explanation: [
        'Uma das formas de **reduzir a transferência** é manter **na mesma AZ** os recursos que conversam muito, **quando a disponibilidade permite**. O job noturno pode ser refeito e não precisa de várias AZs: rodá-lo na AZ da réplica tira os 30 TB da cobrança entre AZs.',
        'Juntar a aplicação web numa AZ troca disponibilidade por economia, um erro citado. O CloudFront e endpoints de gateway não se aplicam a esse caminho.',
        '**Regra prática:** procure o caminho mais caro (NAT até o S3, downloads repetidos, tráfego entre AZs ou Regiões) e mude só o que o requisito de disponibilidade permite.',
      ],
    },
  ],
}
