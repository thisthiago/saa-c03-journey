/**
 * Questões da Revisão da Fase 6 de Computação (Auto Scaling), no formato do
 * exame SAA-C03. Fatos conferidos em 20/10/2026 e 29/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'cmp.f06',
  questions: [
    {
      id: 'rv:cmp.f06.capacidade-por-zona',
      kind: 'decision',
      title: 'Capacidade que sobrevive à perda de uma zona',
      prompt:
        'Uma aplicação de agendamento precisa de **6 instâncias** para atender o pico, que dura o dia todo. Ela roda num Auto Scaling group atrás de um Application Load Balancer, numa Região com três zonas de disponibilidade, e precisa **continuar com 6 instâncias atendendo durante a falha de uma zona**, sem depender de lançar instâncias novas no meio da falha. Qual configuração atende com o **menor custo**?',
      concepts: [{ id: 'asg.group' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: '6 instâncias, 3 em cada uma de duas zonas.', correct: false, consequence: 'Se uma zona cair, sobram só 3 instâncias: metade da capacidade até o grupo repor as perdidas.' },
        { id: 'b', text: '9 instâncias, 3 em cada uma das três zonas.', correct: true, consequence: 'Se uma zona cair, sobram 6 instâncias nas outras duas, sem esperar nada ser lançado; é o menor total que garante isso.' },
        { id: 'c', text: '12 instâncias, 6 em cada uma de duas zonas.', correct: false, consequence: 'Também sobram 6 com a perda de uma zona, mas pagando 12 instâncias o tempo todo, 3 a mais que espalhando por três zonas.' },
        { id: 'd', text: '6 instâncias, 2 em cada zona, contando com o grupo para repor as perdidas.', correct: false, consequence: 'O grupo repõe as instâncias perdidas, mas leva minutos e depende de capacidade nas outras zonas; durante a falha, ficariam só 4.' },
      ],
      explanation: [
        'O requisito é manter **6 instâncias atendendo durante a falha de uma zona**, sem depender de lançamentos. Para isso, a capacidade que sobra nas zonas restantes precisa bastar sozinha. Com as instâncias equilibradas entre N zonas, cada zona precisa de 6 ÷ (N − 1) instâncias. Em três zonas, são 3 por zona, 9 no total; em duas, 6 por zona, 12 no total. Três zonas saem mais barato.',
        'Seis instâncias em duas zonas perdem metade da capacidade com a falha. Contar com o Auto Scaling para repor funciona, mas leva minutos para lançar e iniciar as instâncias, e o requisito proíbe depender disso. Doze instâncias em duas zonas atendem, com 3 instâncias a mais do que o necessário.',
        '**Regra prática:** para sobreviver à perda de uma zona sem perder capacidade, cada zona precisa da capacidade total dividida pelo número de zonas menos uma. Quanto mais zonas, menor a sobra que você paga.',
      ],
    },
    {
      id: 'rv:cmp.f06.m1.a5',
      kind: 'decision',
      title: 'O grupo que demora a reagir',
      prompt:
        'Um grupo de uma farmácia online usa **simple scaling** com o cooldown padrão: quando o alarme de CPU dispara, ele soma 2 instâncias e fica 5 minutos sem reagir, mesmo com a CPU ainda alta. Os picos não têm hora certa. A equipe quer que o grupo acompanhe a carga de forma proporcional, com o **menor esforço** de configuração. Qual mudança atende?',
      concepts: [{ id: 'asg.step-simple' }, { id: 'asg.target-tracking' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Manter o simple scaling e zerar o cooldown para o grupo reagir mais vezes.', correct: false, consequence: 'O grupo passaria a somar instâncias antes de as novas pesarem na métrica, podendo crescer demais; e o simple scaling continua desaconselhado.' },
        { id: 'b', text: 'Criar ações agendadas que aumentam o mínimo do grupo nos horários de pico.', correct: false, consequence: 'Os picos não têm hora certa: ações agendadas só servem para horários conhecidos.' },
        { id: 'c', text: 'Trocar por uma política de target tracking com a CPU média como métrica.', correct: true, consequence: 'O grupo ajusta a capacidade na proporção da métrica, sem esperar cooldown, e a AWS cria e gerencia os alarmes.' },
        { id: 'd', text: 'Aumentar o máximo do grupo, para que ele possa crescer mais no pico.', correct: false, consequence: 'O máximo não é o gargalo: o atraso vem da espera do cooldown entre um ajuste e outro.' },
      ],
      explanation: [
        'O problema é o **cooldown** do simple scaling: depois de cada ajuste, o grupo espera 300 segundos (o padrão) antes de agir de novo. O target tracking resolve com o menor esforço: você escolhe a métrica e o alvo, a AWS cria e gerencia os alarmes, e o grupo cresce ou encolhe na proporção do desvio, usando o tempo de aquecimento (warmup) de cada instância nova em vez do cooldown.',
        'Zerar o cooldown no simple scaling faz o grupo somar instâncias antes que as anteriores aliviem a CPU, e a AWS desaconselha esse tipo de política. Ações agendadas pedem horários conhecidos, que aqui não existem. E aumentar o máximo não muda a espera entre ajustes.',
        '**Regra prática:** para manter uma métrica perto de um valor (CPU média, requisições por instância), use target tracking. Step scaling serve quando você quer degraus próprios; simple scaling, quase nunca.',
      ],
    },
    {
      id: 'rv:cmp.f06.pico-recorrente',
      kind: 'decision',
      title: 'Ponto eletrônico às 8h e picos inesperados',
      prompt:
        'O tráfego de um sistema de ponto eletrônico sobe forte todo dia útil, por volta das 8h, e o horário exato muda aos poucos ao longo do ano. As instâncias levam **12 minutos** para ficar prontas, e às vezes há picos inesperados em outros horários. A empresa quer capacidade pronta antes do pico diário e reação aos picos inesperados, com o **menor esforço operacional**. Quais políticas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'asg.scheduled-predictive' }, { id: 'asg.target-tracking' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Ações agendadas para as 7h45, ajustadas à mão sempre que o horário do pico mudar.', correct: false, consequence: 'Cobrem o pico, mas exigem ajuste manual toda vez que o horário muda, o oposto de menor esforço.' },
        { id: 'b', text: 'Predictive scaling, que aprende o padrão diário e lança capacidade antes do pico.', correct: true, consequence: 'Com padrão recorrente e instâncias lentas para iniciar, o predictive sobe a capacidade antes da demanda prevista e acompanha a mudança gradual do horário.' },
        { id: 'c', text: 'Um mínimo igual à capacidade de pico, mantido o dia inteiro.', correct: false, consequence: 'Garante capacidade, mas paga o pico o dia inteiro, inclusive de madrugada.' },
        { id: 'd', text: 'Simple scaling com cooldown de 60 segundos, para reagir mais rápido.', correct: false, consequence: 'Continua reagindo depois que a carga chega, e as instâncias levam 12 minutos para ficar prontas: o pico chega antes delas.' },
        { id: 'e', text: 'Target tracking, que ajusta a capacidade conforme a carga real a qualquer hora.', correct: true, consequence: 'O predictive só prevê o que se repete; a política dinâmica continua necessária para os picos fora do padrão.' },
      ],
      explanation: [
        'Há duas necessidades diferentes. O pico diário é **recorrente** e as instâncias demoram a iniciar: o predictive scaling aprende os padrões diários e semanais e lança capacidade antes da demanda prevista, acompanhando sozinho a mudança gradual do horário. Os picos **inesperados** não seguem padrão nenhum: para eles, a política dinâmica, como o target tracking, continua necessária. As duas trabalham juntas.',
        'Ações agendadas funcionam para horários conhecidos, mas aqui exigiriam ajuste manual a cada mudança. Manter o mínimo no pico resolve à força e paga instâncias ociosas fora do horário. E qualquer política só reativa, como o simple scaling, chega tarde quando a instância leva 12 minutos para ficar pronta.',
        '**Regra prática:** padrão recorrente com inicialização lenta pede predictive scaling; data e hora conhecidas, ação agendada; variação imprevista, target tracking. Predictive e agendada não substituem a política dinâmica: combinam com ela.',
      ],
    },
    {
      id: 'rv:cmp.f06.grace-period',
      kind: 'decision',
      title: 'Instâncias substituídas logo depois de nascer',
      prompt:
        'Depois que a equipe ligou o health check do ELB num Auto Scaling group, as instâncias novas passaram a ser encerradas e substituídas em ciclo: a aplicação leva **6 minutos** para iniciar, e o grupo as marca como doentes antes disso, porque o Application Load Balancer ainda não recebe resposta delas. Qual ajuste resolve **sem perder a detecção** de instâncias com a aplicação travada?',
      concepts: [{ id: 'asg.health-checks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desligar o health check do ELB e voltar a usar só os status checks do EC2 no grupo.', correct: false, consequence: 'Para o ciclo, mas o grupo volta a não enxergar a aplicação travada numa instância que segue ligada.' },
        { id: 'b', text: 'Aumentar o cooldown do grupo para 10 minutos.', correct: false, consequence: 'O cooldown atrasa novas atividades do simple scaling; não adia o health check das instâncias novas.' },
        { id: 'c', text: 'Mudar a política de término do grupo para OldestInstance.', correct: false, consequence: 'A política de término escolhe quem sai no scale-in; instâncias doentes são substituídas por outro caminho.' },
        { id: 'd', text: 'Aumentar o grace period do health check para mais que o tempo de inicialização.', correct: true, consequence: 'O grupo só passa a avaliar a saúde da instância nova depois que a aplicação teve tempo de subir.' },
      ],
      explanation: [
        'O grupo começa a avaliar a saúde de uma instância nova quando termina o **grace period** (período de carência). Se ele é menor que os 6 minutos de inicialização, o health check do ELB marca a instância como doente enquanto ela ainda sobe, e o grupo a substitui por outra que terá o mesmo destino. Aumentar o grace period para além do tempo de inicialização quebra o ciclo e mantém o health check do ELB.',
        'Desligar o health check do ELB para o ciclo, mas devolve o problema original: o status check do EC2 só enxerga a instância, não a aplicação. O cooldown e a política de término não têm relação com a avaliação de saúde de instâncias novas.',
        '**Regra prática:** com o health check do ELB ligado no grupo, ajuste o grace period ao tempo real de inicialização da aplicação. Instâncias substituídas em ciclo logo depois de lançadas são o sinal de grace period curto.',
      ],
    },
    {
      id: 'rv:cmp.f06.boss.a2',
      kind: 'decision',
      title: 'Spot sem arriscar o mínimo da loja',
      prompt:
        'Uma loja online roda num Auto Scaling group de instâncias m7i.large On-Demand que varia de 4 a 12 instâncias ao longo do dia. A sessão dos clientes fica num cache fora das instâncias, então perder uma instância não perde carrinhos. A loja quer **reduzir o custo** sem nunca ficar com menos de 4 instâncias, mesmo se instâncias Spot forem interrompidas. Qual configuração atende?',
      concepts: [{ id: 'asg.mixed-instances' }, { id: 'asg.group' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Todo o grupo em Spot, com um único tipo de instância e a estratégia lowest-price.', correct: false, consequence: 'É a estratégia com maior risco de interrupção, e nada garante as 4 instâncias mínimas.' },
        { id: 'b', text: 'Base de 4 On-Demand e o excedente em Spot, com um único tipo de instância e lowest-price.', correct: false, consequence: 'A base está certa, mas um tipo só e a estratégia lowest-price concentram o Spot nos pools mais interrompidos.' },
        { id: 'c', text: 'Base de 4 On-Demand e o excedente em Spot, com vários tipos e price-capacity-optimized.', correct: true, consequence: 'A base fixa garante as 4 instâncias; o excedente ganha o desconto do Spot em pools com menor chance de interrupção.' },
        { id: 'd', text: 'Um Savings Plan de 3 anos que cubra as 12 instâncias o tempo todo.', correct: false, consequence: 'O desconto vale para o que é usado: na maior parte do dia, a loja pagaria compromisso por instâncias que não estão rodando.' },
      ],
      explanation: [
        'Os requisitos são **reduzir custo** e manter **pelo menos 4 instâncias** mesmo com interrupções do Spot. Um grupo misto resolve: uma base de 4 instâncias On-Demand, que não é interrompida, e o excedente em Spot. Para o Spot, a AWS recomenda a estratégia price-capacity-optimized, que escolhe pools com menor chance de interrupção e menor preço, e vários tipos de instância, que ampliam os pools disponíveis. Como a sessão fica fora das instâncias, uma interrupção não perde carrinhos, e o grupo repõe a capacidade.',
        'Tudo em Spot com lowest-price é a combinação mais arriscada e não garante o mínimo. A base On-Demand com um tipo só e lowest-price acerta metade: a estratégia desaconselhada concentra o excedente nos pools mais interrompidos. O Savings Plan para 12 instâncias paga compromisso nas horas em que o grupo tem 4.',
        '**Regra prática:** reduzir custo com Spot mantendo uma base garantida pede grupo misto: base On-Demand, excedente em Spot, vários tipos de instância e price-capacity-optimized. Savings Plans cobrem bem a base constante, não o pico.',
      ],
    },
    {
      id: 'rv:cmp.f06.warm-pool',
      kind: 'decision',
      title: 'Inicialização longa e picos imprevisíveis',
      prompt:
        'Uma API de análise de imagens baixa e prepara um modelo grande a cada instância nova e leva **15 minutos** para ficar pronta. Os picos são **imprevisíveis** e duram poucos minutos. Manter instâncias de reserva rodando o tempo todo ficou caro. A empresa quer escalar rápido nos picos **pagando o mínimo** pela capacidade de reserva. Qual solução atende?',
      concepts: [{ id: 'asg.lifecycle-hooks' }, { id: 'asg.scheduled-predictive' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Predictive scaling, para lançar as instâncias antes dos picos.', correct: false, consequence: 'O predictive prevê padrões que se repetem; picos imprevisíveis não aparecem na previsão.' },
        { id: 'b', text: 'Um lifecycle hook de launch que segura cada instância nova até o modelo ficar pronto para uso.', correct: false, consequence: 'Impede que a instância receba tráfego antes da hora, mas não encurta os 15 minutos: no pico, a capacidade continua chegando tarde.' },
        { id: 'c', text: 'Um warm pool com instâncias já preparadas, paradas ou hibernadas, junto do target tracking.', correct: true, consequence: 'As instâncias do warm pool já fizeram a preparação longa; paradas, cobram só os volumes EBS e os Elastic IPs, e entram em serviço bem mais rápido.' },
        { id: 'd', text: 'Um mínimo maior no grupo, com instâncias rodando prontas para o pico.', correct: false, consequence: 'Escala rápido, mas é exatamente a reserva rodando o tempo todo que ficou cara.' },
      ],
      explanation: [
        'O que pesa é a **inicialização longa** com **picos imprevisíveis**. O warm pool mantém instâncias que já passaram pela preparação demorada, guardadas paradas ou hibernadas; quando a política dinâmica pede capacidade, elas entram em serviço bem mais rápido que uma instância nova. Paradas, elas cobram só os volumes EBS e os Elastic IPs, bem menos que reservas rodando.',
        'O predictive scaling só ajuda quando o pico se repete num padrão. O lifecycle hook de launch evita que a instância receba tráfego antes de ficar pronta, mas não encurta a preparação. E aumentar o mínimo é a solução cara que a empresa quer abandonar.',
        '**Regra prática:** a aplicação demora muito a iniciar e precisa escalar rápido, warm pool; padrão recorrente, predictive; fazer algo antes de a instância receber tráfego, lifecycle hook.',
      ],
    },
    {
      id: 'rv:cmp.f06.protecao-scale-in',
      kind: 'decision',
      title: 'Trabalhos longos e o scale-in',
      prompt:
        'Um Auto Scaling group processa trabalhos de renderização tirados de uma fila, e cada trabalho leva até **2 horas**. A frota cresce com a fila e precisa encolher quando ela esvazia, mas um scale-in não pode encerrar uma instância no meio de um trabalho. A empresa quer resolver **sem trabalho manual**. Qual solução atende?',
      concepts: [{ id: 'asg.termination' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar a proteção contra encerramento do EC2 (termination protection) nas instâncias.', correct: false, consequence: 'Essa proteção barra encerramentos manuais pelo EC2, mas não impede o Auto Scaling de encerrar a instância.' },
        { id: 'b', text: 'A aplicação liga a proteção contra scale-in ao pegar um trabalho e a desliga no fim.', correct: true, consequence: 'Instâncias protegidas não são escolhidas no scale-in; o grupo encolhe pelas que estão livres.' },
        { id: 'c', text: 'Mudar a política de término do grupo para NewestInstance.', correct: false, consequence: 'Escolhe a instância mais nova, que pode estar no meio de um trabalho tanto quanto as outras.' },
        { id: 'd', text: 'Desligar o scale-in das políticas e reduzir a capacidade à mão sempre que a fila esvaziar.', correct: false, consequence: 'Evita o encerramento no meio do trabalho, mas depende de alguém acompanhar a fila, o que o requisito proíbe.' },
      ],
      explanation: [
        'A **proteção contra scale-in** impede que uma instância seja escolhida quando o grupo encolhe, e pode ser ligada e desligada em cada instância a qualquer momento. Se a aplicação liga a proteção ao pegar um trabalho e a desliga ao terminar, o scale-in só encerra instâncias livres, sem intervenção manual. Ela não impede a substituição de uma instância que falhe no health check, nem a interrupção de uma instância Spot.',
        'A termination protection do EC2 vale para encerramentos manuais e não segura o Auto Scaling. A política de término só escolhe qual instância sai, sem saber quem está trabalhando. E desligar o scale-in transfere para uma pessoa o trabalho de encolher a frota.',
        '**Regra prática:** para trabalhos longos que não podem ser interrompidos num scale-in, use a proteção contra scale-in por instância, controlada pela própria aplicação. Para ações curtas antes do encerramento, como copiar logs, use um lifecycle hook de terminate.',
      ],
    },
    {
      id: 'rv:cmp.f06.m1.a3',
      kind: 'decision',
      title: 'Duas políticas pedindo capacidades diferentes',
      prompt:
        'Um grupo tem duas políticas de target tracking: uma mantém a CPU média em 50% e outra mantém 1.000 requisições por instância. À noite, pela CPU bastariam **4 instâncias**, mas pelas requisições seriam necessárias **6**. O grupo tem mínimo 2 e máximo 20. Com quantas instâncias ele fica?',
      concepts: [{ id: 'asg.multi-policies' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: '4 instâncias, porque o grupo sempre segue a política que economiza mais.', correct: false, consequence: 'Ao encolher, o Auto Scaling também respeita a política que pede mais capacidade: ele nunca remove instâncias demais.' },
        { id: 'b', text: '5 instâncias, a média do que as duas políticas pedem.', correct: false, consequence: 'O Auto Scaling não tira média entre políticas: prevalece a que deixa mais capacidade.' },
        { id: 'c', text: '6 instâncias, porque prevalece a política que deixa mais capacidade.', correct: true, consequence: 'Com várias políticas, o grupo cresce se qualquer uma pedir e só encolhe até onde todas aceitam.' },
        { id: 'd', text: 'Alterna entre 4 e 6, conforme a política que disparar por último.', correct: false, consequence: 'As políticas não brigam entre si: o grupo usa sempre a que deixa mais capacidade, o que evita esse vaivém.' },
      ],
      explanation: [
        'Com várias políticas ao mesmo tempo, o Auto Scaling usa a que deixa **mais capacidade**, tanto para crescer quanto para encolher. Na prática, ele cresce se qualquer política pedir e só encolhe até onde todas aceitam. Como as requisições ainda pedem 6 instâncias, o grupo fica com 6.',
        'Seguir a política mais econômica deixaria o grupo sem capacidade para as requisições. Não existe média entre políticas, nem disputa pela última que disparou: a regra é sempre a da maior capacidade, justamente para não remover instâncias demais.',
        '**Regra prática:** dá para combinar políticas sem medo de ficar sem capacidade, porque vence sempre a que deixa o grupo maior. Para encolher, todas precisam concordar.',
      ],
    },
    {
      id: 'rv:cmp.f06.health-check-proprio',
      kind: 'decision',
      title: 'Workers travados que o grupo não troca',
      prompt:
        'Um Auto Scaling group de workers lê mensagens de uma fila SQS, **sem load balancer**. Às vezes o processo do worker trava, mas a instância continua ligada e passa nos status checks do EC2; o grupo não a substitui, e a fila acumula. A equipe já tem um script na instância que detecta o travamento. Qual solução faz o grupo **substituir automaticamente** essas instâncias?',
      concepts: [{ id: 'asg.health-checks' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar o health check do ELB no grupo do Auto Scaling.', correct: false, consequence: 'Sem load balancer, não há health check do ELB para o grupo consultar.' },
        { id: 'b', text: 'Aumentar o grace period do health check do grupo.', correct: false, consequence: 'O grace period só adia a primeira avaliação de instâncias novas; não ensina o grupo a enxergar o processo travado.' },
        { id: 'c', text: 'O script marca a instância como Unhealthy pela API SetInstanceHealth.', correct: true, consequence: 'É um health check próprio: o grupo substitui imediatamente a instância marcada como doente.' },
        { id: 'd', text: 'Criar um alarme de fila cheia que aumenta a capacidade desejada do grupo de workers.', correct: false, consequence: 'Soma instâncias novas, mas mantém as travadas no grupo, pagando por elas sem processar nada.' },
      ],
      explanation: [
        'Os status checks do EC2 só enxergam a instância, não o processo, e sem load balancer também não há health check do ELB. A saída é um **health check próprio**: o script que já detecta o travamento chama a API SetInstanceHealth do Auto Scaling e marca a instância como Unhealthy, e o grupo a substitui imediatamente, mantendo a capacidade desejada.',
        'O health check do ELB exige um load balancer, que esse grupo não tem. O grace period só adia a avaliação de instâncias recém-lançadas. E somar capacidade pelo tamanho da fila trata o sintoma: as instâncias travadas continuam no grupo, cobradas e paradas.',
        '**Regra prática:** o Auto Scaling só substitui o que ele enxerga como doente. Para falhas que os status checks do EC2 não veem, ligue o health check do ELB quando houver balanceador ou use um health check próprio pela API.',
      ],
    },
  ],
}
