/**
 * Questões da Revisão da Fase 5 de Monitoramento e governança (Systems
 * Manager), no formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'gov.f05',
  questions: [
    {
      id: 'rv:ssm.what.nodes',
      kind: 'decision',
      title: 'Servidores no data center e instâncias na AWS',
      prompt:
        'Uma rede de lojas tem 200 instâncias EC2 e **50 servidores Linux no próprio data center**. A equipe quer aplicar patches e rodar comandos em **todos eles a partir de um só lugar**, sem abrir portas de entrada. Qual solução atende?',
      concepts: [{ id: 'ssm.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Systems Manager só nas instâncias EC2 e scripts por SSH nos servidores locais.', correct: false, consequence: 'Divide a operação em dois lugares e mantém portas SSH abertas nos servidores locais.' },
        { id: 'b', text: 'Migrar os 50 servidores para EC2 antes de usar o Systems Manager.', correct: false, consequence: 'Não é preciso migrar: o Systems Manager gerencia servidores fora da AWS.' },
        { id: 'c', text: 'Systems Manager em todos, com o SSM Agent também nos servidores locais.', correct: true, consequence: 'Com o agente, os servidores locais viram nós gerenciados, como as instâncias.' },
        { id: 'd', text: 'Um servidor bastion no data center para alcançar os servidores locais.', correct: false, consequence: 'O bastion exige porta de entrada aberta e não junta a operação num só lugar.' },
      ],
      explanation: [
        'O **Systems Manager** opera **nós** em escala: instâncias EC2, **servidores locais** e máquinas de outras nuvens. O que torna uma máquina gerenciada é o **SSM Agent** instalado e capaz de falar com o serviço, com as permissões certas. Daí em diante, patches e comandos saem do mesmo lugar, sem portas de entrada.',
        'Dividir em dois lugares, migrar antes ou manter um bastion contrariam os requisitos.',
        '**Regra prática:** operar instâncias e servidores em escala, sem SSH, é Systems Manager; a máquina precisa do agente, esteja onde estiver.',
      ],
    },
    {
      id: 'rv:ssm.what.tools',
      kind: 'decision',
      title: 'Terminal e comandos em massa sem portas abertas',
      prompt:
        'Uma empresa fechou as portas 22 e 3389 de todas as instâncias. O time de operação ainda precisa (1) **abrir um terminal interativo** numa instância para investigar problemas e (2) **rodar o mesmo comando em 400 instâncias** depois de cada atualização. Quais ferramentas do Systems Manager atendem? (Escolha DUAS.)',
      concepts: [{ id: 'ssm.what' }, { id: 'ssm.run-command' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Session Manager, para o terminal interativo.', correct: true, consequence: 'Dá um shell na instância sem porta de entrada, bastion ou chave SSH.' },
        { id: 'b', text: 'Run Command, para o comando nas 400 instâncias.', correct: true, consequence: 'Executa o comando remotamente em escala, sem entrar em cada instância.' },
        { id: 'c', text: 'Parameter Store, para guardar o comando e executá-lo.', correct: false, consequence: 'O Parameter Store guarda configurações; não executa nada.' },
        { id: 'd', text: 'Inventory, para abrir o terminal nas instâncias.', correct: false, consequence: 'O Inventory coleta o que está instalado nos nós; não abre sessões.' },
        { id: 'e', text: 'Patch Manager, para rodar comandos quaisquer.', correct: false, consequence: 'O Patch Manager aplica correções aprovadas num baseline, não comandos livres.' },
      ],
      explanation: [
        'O **Session Manager** dá um **shell interativo** sem abrir portas de entrada, sem bastion e sem chaves SSH. O **Run Command** executa **comandos remotos em escala**, sem entrar em cada máquina. Os dois funcionam sobre nós gerenciados.',
        'Parameter Store guarda configurações, Inventory coleta metadados e Patch Manager aplica correções.',
        '**Regra prática:** acesso é Session Manager; comandos em massa, Run Command; patches, Patch Manager; configurações, Parameter Store.',
      ],
    },
    {
      id: 'rv:gov.f05.m1.a5',
      kind: 'decision',
      title: 'Uma instância com o agente que não aparece no console',
      prompt:
        'Uma instância EC2 nova tem o **SSM Agent rodando** e **acesso à internet** por um NAT gateway, mas **não aparece** como nó gerenciado no Systems Manager. Ela **não tem role** anexada, e a Default Host Management Configuration não está ligada. A equipe quer que ela apareça com o **menor esforço**. O que fazer?',
      concepts: [{ id: 'ssm.managed-node' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Abrir a porta 22 no security group da instância.', correct: false, consequence: 'O agente faz conexões de saída; abrir uma porta de entrada não dá permissões.' },
        { id: 'b', text: 'Criar os endpoints de VPC ssm, ssmmessages e ec2messages.', correct: false, consequence: 'A instância já alcança o serviço pela internet; o que falta é permissão.' },
        { id: 'c', text: 'Reinstalar o SSM Agent na instância.', correct: false, consequence: 'O agente já está rodando; sem permissões, ele continua sem poder se registrar.' },
        { id: 'd', text: 'Anexar uma role com a política AmazonSSMManagedInstanceCore.', correct: true, consequence: 'Com as permissões, a instância passa a aparecer como nó gerenciado.' },
      ],
      explanation: [
        'Três coisas tornam uma instância um **nó gerenciado**: o **SSM Agent** rodando, **permissões** (uma role com **AmazonSSMManagedInstanceCore** ou a Default Host Management Configuration) e um **caminho de saída** até o serviço. Por padrão, o Systems Manager não tem permissão para agir nas instâncias. Aqui só falta a permissão.',
        'Portas de entrada não são usadas. A rede já funciona. O agente já está rodando.',
        '**Regra prática:** instância fora do Systems Manager: confira agente, role e caminho de rede, nessa ordem.',
      ],
    },
    {
      id: 'rv:gov.f05.boss.a2',
      kind: 'decision',
      title: 'Instâncias antigas fora da configuração automática',
      prompt:
        'Uma conta ligou a **Default Host Management Configuration** para que as instâncias virem nós gerenciados sem anexar roles. As instâncias novas apareceram, mas as criadas a partir de uma **imagem antiga**, com **IMDSv1** e um **SSM Agent de 2021**, continuam ausentes. A equipe quer que elas também apareçam **sem anexar roles**. O que fazer?',
      concepts: [{ id: 'ssm.managed-node' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Exigir IMDSv2 nas instâncias e atualizar o SSM Agent.', correct: true, consequence: 'A configuração exige IMDSv2 e um agente recente; atendidos os dois, elas viram gerenciadas.' },
        { id: 'b', text: 'Ligar a Default Host Management Configuration de novo.', correct: false, consequence: 'Ela já está ligada; o problema está nas instâncias, não na configuração.' },
        { id: 'c', text: 'Criar os endpoints de VPC do Systems Manager.', correct: false, consequence: 'As instâncias novas já se registraram pela mesma rede; o caminho funciona.' },
        { id: 'd', text: 'Abrir a porta 443 de entrada nas instâncias antigas.', correct: false, consequence: 'O agente usa conexões de saída; uma porta de entrada não muda nada.' },
      ],
      explanation: [
        'A **Default Host Management Configuration** torna gerenciadas sozinhas as instâncias que usam **IMDSv2** e têm o **SSM Agent 3.2.582.0 ou mais novo**. Ela **não aceita IMDSv1**. As instâncias da imagem antiga precisam passar a exigir IMDSv2 e ter o agente atualizado.',
        'Religar a configuração não muda as instâncias. A rede já funciona. Portas de entrada não são usadas pelo agente.',
        '**Regra prática:** a configuração automática do Systems Manager depende de IMDSv2 e de um agente recente; sem isso, use uma role na instância.',
      ],
    },
    {
      id: 'rv:gov.f05.boss.a3',
      kind: 'decision',
      title: 'O painel interno de uma instância privada',
      prompt:
        'Uma ferramenta de administração roda na **porta 8080** de uma instância numa **subnet privada**, já gerenciada pelo Systems Manager. Um engenheiro precisa abri-la no **navegador do próprio notebook** de vez em quando. A segurança proíbe **abrir portas de entrada** e manter **bastion**. Qual solução atende?',
      concepts: [{ id: 'ssm.session-manager' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Liberar a porta 8080 no security group só para o IP do engenheiro.', correct: false, consequence: 'Abre uma porta de entrada, o que a segurança proíbe, e a subnet nem tem rota da internet.' },
        { id: 'b', text: 'Encaminhar a porta 8080 para o notebook pelo Session Manager.', correct: true, consequence: 'A porta da instância aparece numa porta local do notebook, sem abrir nada na instância.' },
        { id: 'c', text: 'Rodar pelo Run Command um comando que copie a página para o S3.', correct: false, consequence: 'Gera uma cópia estática; a ferramenta interativa continua inacessível.' },
        { id: 'd', text: 'Criar um servidor bastion numa subnet pública e entrar por SSH.', correct: false, consequence: 'O bastion é proibido e exige porta de entrada aberta.' },
      ],
      explanation: [
        'O **Session Manager** dá acesso sem portas de entrada, sem bastion e sem chaves SSH, controlado por políticas do IAM. O **encaminhamento de portas** leva uma porta de dentro do nó para uma **porta local do cliente**: o engenheiro abre a ferramenta no navegador como se ela estivesse no notebook.',
        'Liberar a porta e o bastion violam a regra. Copiar a página não dá a ferramenta interativa.',
        '**Regra prática:** "acesso sem bastion", "sem abrir portas" e "sem chaves SSH" apontam para o Session Manager, inclusive para portas de aplicações.',
      ],
    },
    {
      id: 'rv:gov.f05.m1.a7',
      kind: 'decision',
      title: 'O que foi feito dentro de cada sessão',
      prompt:
        'Uma empresa já usa o **Session Manager** para administrar as instâncias. A auditoria passou a exigir, além de **quem abriu cada sessão**, o **registro do que foi feito** dentro dela, guardado por um ano. Qual configuração atende?',
      concepts: [{ id: 'ssm.session-manager' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar o envio dos dados das sessões ao S3, com o CloudTrail ligado.', correct: true, consequence: 'O CloudTrail registra quem abriu a sessão, e o S3 guarda o que foi feito nela.' },
        { id: 'b', text: 'Ligar só uma trilha do CloudTrail de várias Regiões.', correct: false, consequence: 'O CloudTrail registra as chamadas de API das sessões, não o que foi digitado dentro delas.' },
        { id: 'c', text: 'Instalar o agente do CloudWatch para enviar as métricas das instâncias.', correct: false, consequence: 'As métricas não mostram os comandos executados nas sessões.' },
        { id: 'd', text: 'Ativar o Inventory para listar o software instalado.', correct: false, consequence: 'O Inventory mostra o que está instalado, não quem fez o quê numa sessão.' },
      ],
      explanation: [
        'Com o Session Manager, as **chamadas de API** das sessões ficam no **CloudTrail**, e os **dados das sessões** podem ir para o **S3** e para o **CloudWatch Logs**. O EventBridge também detecta quando uma sessão começa ou termina.',
        'O CloudTrail sozinho não tem o conteúdo das sessões. Métricas e Inventory não registram comandos.',
        '**Regra prática:** sessões auditadas são Session Manager com os dados das sessões enviados ao S3 ou ao CloudWatch Logs.',
      ],
    },
    {
      id: 'rv:gov.f05.m2.a1:cmd',
      kind: 'decision',
      title: 'Os logs de uma instância que vai ser encerrada',
      prompt:
        'Um grupo do Auto Scaling encerra instâncias quando a carga cai, e os logs locais da aplicação se perdem junto. A equipe quer **copiar os logs para o S3 antes de cada instância sair**, sem abrir portas e sem entrar nas instâncias. As instâncias são nós gerenciados. Qual solução atende?',
      concepts: [{ id: 'ssm.run-command' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um hook de ciclo de vida no encerramento que dispara um Run Command.', correct: true, consequence: 'A instância espera no encerramento enquanto o comando copia os logs para o S3.' },
        { id: 'b', text: 'Uma associação do State Manager que roda uma vez por dia.', correct: false, consequence: 'Roda numa agenda, não no momento em que a instância vai sair; logs se perdem entre as execuções.' },
        { id: 'c', text: 'Uma janela de manutenção nas madrugadas de domingo.', correct: false, consequence: 'As instâncias saem quando a carga cai, a qualquer hora, não no domingo.' },
        { id: 'd', text: 'Abrir uma sessão do Session Manager em cada instância que sair.', correct: false, consequence: 'É trabalho manual, e as instâncias saem sem aviso para a equipe.' },
      ],
      explanation: [
        'O **Run Command** executa comandos remotamente e em escala, e um dos usos citados pela AWS é **capturar logs de uma instância que está saindo de um grupo do Auto Scaling**. Um **hook de ciclo de vida** segura a instância no encerramento enquanto o comando copia os logs.',
        'State Manager e janelas de manutenção rodam em agendas. Sessões manuais não acompanham o Auto Scaling.',
        '**Regra prática:** comando em instâncias, sob demanda ou disparado por um evento, sem SSH, é Run Command.',
      ],
    },
    {
      id: 'rv:gov.f05.m2.a2',
      kind: 'decision',
      title: 'Um relatório do que falta antes de instalar',
      prompt:
        'Antes de começar a instalar correções em 300 servidores, a equipe quer **um relatório de quais patches aprovados faltam em cada nó**, **sem alterar nada** nos servidores nesta etapa. Os servidores são nós gerenciados. O que fazer no Patch Manager?',
      concepts: [{ id: 'ssm.patch-manager' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Rodar a operação de varredura e instalação, com reinício desligado.', correct: false, consequence: 'Instala as correções nos servidores, o que a equipe ainda não quer.' },
        { id: 'b', text: 'Rodar só a operação de varredura (Scan) com o baseline.', correct: true, consequence: 'O relatório de conformidade mostra o que falta, sem alterar os nós.' },
        { id: 'c', text: 'Abrir uma sessão em cada servidor e listar os pacotes.', correct: false, consequence: 'É manual, demorado em 300 servidores e não usa o baseline aprovado.' },
        { id: 'd', text: 'Criar uma janela de manutenção sem tarefas.', correct: false, consequence: 'A janela define quando agir; sem tarefa, nada é analisado.' },
      ],
      explanation: [
        'No **Patch Manager**, um **patch baseline** define quais correções são aprovadas. A operação pode ser **só varredura**, que gera o relatório do que falta, ou **varredura e instalação**. O relatório de conformidade mostra o resultado da última operação.',
        'Instalar contraria o pedido. Sessões manuais não escalam. Uma janela vazia não faz nada.',
        '**Regra prática:** "automatizar patches no sistema operacional de várias instâncias" é Patch Manager, com baseline e janela de manutenção.',
      ],
    },
    {
      id: 'rv:gov.f05.m2.a3',
      kind: 'decision',
      title: 'Todos os nós em conformidade com o baseline',
      prompt:
        'O relatório do Patch Manager mostra **todos os nós em conformidade** com o baseline predefinido da AWS. A diretoria concluiu que **nenhum servidor tem vulnerabilidade** e quer encerrar o projeto. A segurança quer responder com precisão e ter mais controle daqui em diante. Qual é a resposta adequada?',
      concepts: [{ id: 'ssm.patch-manager' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Concordar: conformidade com o baseline prova que os nós são seguros.', correct: false, consequence: 'A conformidade diz só que as correções aprovadas foram instaladas.' },
        { id: 'b', text: 'Discordar: o relatório só vale para nós Windows.', correct: false, consequence: 'O Patch Manager trata vários sistemas operacionais; o limite está no que o baseline aprova.' },
        { id: 'c', text: 'Explicar o limite da conformidade e criar baselines próprios.', correct: true, consequence: 'A diretoria entende o que o relatório prova, e a empresa passa a decidir o que conta como conformidade.' },
        { id: 'd', text: 'Rodar a varredura de novo, porque o relatório é em tempo real.', correct: false, consequence: 'O relatório é uma foto da última operação, e repeti-la não muda o que ele significa.' },
      ],
      explanation: [
        'Estar **em conformidade com o baseline** significa que as **correções aprovadas e disponíveis foram instaladas**, **não** que o nó seja seguro. A AWS oferece baselines predefinidos, mas **recomenda criar baselines próprios** para controlar o que é conformidade.',
        'O relatório não é prova de segurança, não se limita ao Windows e é uma foto da última operação.',
        '**Regra prática:** conformidade de patches mede o baseline, não a segurança do nó; defina o baseline que a empresa quer.',
      ],
    },
    {
      id: 'rv:gov.f05.m3.a2',
      kind: 'decision',
      title: 'Um documento de configuração de 6 KB',
      prompt:
        'Uma aplicação lê do Parameter Store um **documento de configuração de 6 KB**, que precisa ficar num **único parâmetro**. A conta tem 300 parâmetros, todos pequenos, na camada padrão. A empresa quer o **menor custo**. O que fazer?',
      concepts: [{ id: 'ssm.parameter-store' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Passar todos os 300 parâmetros para a camada avançada.', correct: false, consequence: 'Paga a camada avançada em parâmetros que cabem na padrão, e eles não voltam depois.' },
        { id: 'b', text: 'Guardar o documento como StringList para caber em 4 KB.', correct: false, consequence: 'O tipo não muda o limite de tamanho da camada.' },
        { id: 'c', text: 'Criar só esse parâmetro na camada avançada, que aceita até 8 KB.', correct: true, consequence: 'O documento cabe, e só esse parâmetro paga a camada avançada.' },
        { id: 'd', text: 'Guardar o documento como SecureString, que aceita mais espaço.', correct: false, consequence: 'SecureString criptografa o valor, mas segue o limite da camada.' },
      ],
      explanation: [
        'O Parameter Store tem duas camadas: a **padrão** (até 10.000 parâmetros de **4 KB**, sem custo) e a **avançada** (até 100.000 parâmetros de **8 KB**, paga). Só o parâmetro grande precisa da avançada. Um parâmetro padrão pode virar avançado, mas **não volta** a ser padrão.',
        'Passar todos para a avançada paga à toa. O tipo do parâmetro não muda o limite de tamanho.',
        '**Regra prática:** use a camada avançada só nos parâmetros que precisam dela, por tamanho, políticas ou compartilhamento entre contas.',
      ],
    },
    {
      id: 'rv:gov.f05.m3.a3',
      kind: 'decision',
      title: 'A chave de API de um parceiro',
      prompt:
        'Uma aplicação usa uma **chave de API de um parceiro**, que **nunca é trocada** e não tem rotação possível do lado do parceiro. A segurança exige que ela fique **criptografada** e fora do código, com acesso controlado pelo IAM. A empresa quer o **menor custo**. Onde guardá-la?',
      concepts: [{ id: 'ssm.parameter-store' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Num parâmetro SecureString da camada padrão do Parameter Store.', correct: true, consequence: 'O valor fica criptografado pelo KMS, fora do código, sem custo da camada padrão.' },
        { id: 'b', text: 'No Secrets Manager, com a rotação automática ligada.', correct: false, consequence: 'Funciona, mas paga por um recurso de rotação que o parceiro não permite usar.' },
        { id: 'c', text: 'Num parâmetro String da camada padrão do Parameter Store.', correct: false, consequence: 'String guarda o valor em texto, sem a criptografia exigida.' },
        { id: 'd', text: 'Numa variável de ambiente da aplicação, criptografada no deploy.', correct: false, consequence: 'O valor continua na configuração da aplicação, longe do controle central pelo IAM.' },
      ],
      explanation: [
        'O **Parameter Store** guarda configurações fora do código, e o tipo **SecureString** criptografa o valor com o **KMS**. Na **camada padrão**, não há custo. Para segredos que **precisam de rotação automática**, como senhas de banco, a AWS recomenda o **Secrets Manager**; aqui, a rotação não existe.',
        'O Secrets Manager paga por rotação que não será usada. String não criptografa. Variáveis de ambiente espalham o segredo.',
        '**Regra prática:** valor sensível simples, sem rotação, com custo baixo é SecureString no Parameter Store; com rotação automática, Secrets Manager.',
      ],
    },
    {
      id: 'rv:gov.f05.m3.a5',
      kind: 'decision',
      title: 'Um snapshot sempre que um alarme dispara',
      prompt:
        'A equipe quer que um **runbook do Automation** crie um snapshot do volume de uma instância **sempre que um alarme do CloudWatch** daquela instância **entrar em ALARM**, para preservar o estado antes de qualquer correção. A solução deve ser **sem servidores** e com o **menor código**. O que configurar?',
      concepts: [{ id: 'ssm.automation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma janela de manutenção que roda o runbook a cada hora.', correct: false, consequence: 'Roda numa agenda, não no momento em que o alarme dispara.' },
        { id: 'b', text: 'Uma regra do EventBridge que inicia o runbook no evento do alarme.', correct: true, consequence: 'A mudança de estado do alarme inicia o runbook, que cria o snapshot.' },
        { id: 'c', text: 'Um script numa instância que consulta o alarme a cada minuto.', correct: false, consequence: 'Exige um servidor e código para algo que um evento resolve.' },
        { id: 'd', text: 'Uma associação do State Manager com o runbook.', correct: false, consequence: 'Associações mantêm um estado numa agenda; não reagem ao alarme.' },
      ],
      explanation: [
        'O **Automation** executa **runbooks** que podem ser disparados por **eventos do EventBridge**, e todo alarme do CloudWatch publica um evento a cada mudança de estado. Uma regra do EventBridge que escuta a entrada em ALARM inicia o runbook.',
        'Janelas de manutenção e associações rodam em agendas. Um script próprio exige servidor e código.',
        '**Regra prática:** automatizar tarefas de operação é runbook do Automation, acionado pelo Config, pelo EventBridge ou por uma agenda.',
      ],
    },
    {
      id: 'rv:gov.f05.m2.a5',
      kind: 'decision',
      title: 'Um agente que precisa estar sempre instalado',
      prompt:
        'A equipe quer garantir que o **agente do CloudWatch** esteja instalado em **todo nó novo** e que **continue instalado**, mesmo se alguém o remover por engano. Não há urgência nem horário específico para isso. Qual recurso do Systems Manager é o mais adequado?',
      concepts: [{ id: 'ssm.state-manager' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma janela de manutenção semanal que instala o agente.', correct: false, consequence: 'A janela serve para tarefas em períodos definidos; nós novos ficariam dias sem o agente.' },
        { id: 'b', text: 'Um Run Command executado à mão a cada nó novo.', correct: false, consequence: 'Depende de alguém lembrar, e não reinstala o agente removido.' },
        { id: 'c', text: 'O Inventory, que lista os nós sem o agente.', correct: false, consequence: 'Mostra quem está sem o agente, mas não instala nada.' },
        { id: 'd', text: 'Uma associação do State Manager que instala o agente.', correct: true, consequence: 'A associação aplica o estado nos nós novos e o reaplica numa agenda.' },
      ],
      explanation: [
        'O **State Manager** mantém os nós no estado definido por meio de **associações**, que aplicam um documento a nós escolhidos numa agenda. Ele combate o **desvio de configuração**: o agente removido volta na próxima aplicação.',
        'Janelas de manutenção são para tarefas em períodos definidos. Run Command manual depende de pessoas. O Inventory só mostra.',
        '**Regra prática:** manter um estado o tempo todo é State Manager; ações disruptivas em horário definido, Maintenance Windows.',
      ],
    },
    {
      id: 'rv:gov.f05.m2.a1:inv',
      kind: 'decision',
      title: 'Uma biblioteca vulnerável em várias contas',
      prompt:
        'Uma biblioteca de criptografia teve uma falha divulgada, e a segurança precisa saber **quais nós, em 20 contas e três Regiões, têm a versão afetada** instalada. Os nós são gerenciados pelo Systems Manager. A equipe quer consultar isso **com SQL**, num lugar central. Qual solução atende?',
      concepts: [{ id: 'ssm.inventory-windows' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Rodar um Run Command em cada conta e juntar as saídas numa planilha.', correct: false, consequence: 'Funciona, mas é manual e não deixa os dados prontos para consultas futuras.' },
        { id: 'b', text: 'O Inventory, num bucket central, consultado pelo Athena.', correct: true, consequence: 'O software instalado de todos os nós fica num lugar só, consultável em SQL.' },
        { id: 'c', text: 'Uma regra do Config para a versão da biblioteca.', correct: false, consequence: 'Uma regra diz se cada recurso está em conformidade; listar a versão instalada em cada nó é papel do Inventory.' },
        { id: 'd', text: 'O Patch Manager com o baseline predefinido.', correct: false, consequence: 'Mostra correções aprovadas pendentes, não uma busca livre por versão de software.' },
      ],
      explanation: [
        'O **Inventory** coleta metadados dos nós, como o **software instalado**. Ele pode guardar os dados num **bucket do S3 central** e consultá-los com o **Athena**, também entre Regiões e contas.',
        'Juntar saídas de comandos à mão não escala e precisa ser refeito a cada falha divulgada. Uma regra do Config avalia conformidade, e o Patch Manager mostra correções aprovadas pendentes, não versões de software quaisquer.',
        '**Regra prática:** "o que está instalado em cada nó" é Inventory; "quando agir de forma disruptiva" é Maintenance Window.',
      ],
    },
  ],
}
