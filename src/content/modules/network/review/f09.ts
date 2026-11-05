/**
 * Questões da Revisão da Fase 9 de Redes (proteção de borda e escolha), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'net.f09',
  questions: [
    {
      id: 'rv:net.f09.m1.a1',
      kind: 'decision',
      title: 'Injeção de SQL atrás de um NLB',
      prompt:
        'Uma aplicação web em HTTPS recebe tentativas de **injeção de SQL e de cross-site scripting**. Hoje ela fica atrás de um **Network Load Balancer**, e a equipe quer usar **regras prontas, sem escrever regras próprias**, para bloquear esses padrões antes que cheguem aos servidores. Qual solução atende?',
      concepts: [{ id: 'edgesec.waf' }, { id: 'edgesec.waf-managed' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Associar ao NLB um pacote de proteção do WAF com as regras gerenciadas.', correct: false, consequence: 'O NLB não está entre os recursos que aceitam o WAF; a associação não é possível.' },
        { id: 'b', text: 'Trocar o NLB por um ALB e associar a ele o WAF com regras gerenciadas.', correct: true, consequence: 'O ALB aceita o WAF, e os grupos gerenciados bloqueiam SQLi e XSS com 403, sem regras próprias.' },
        { id: 'c', text: 'Assinar o Shield Advanced e adicionar o NLB à proteção ampliada contra ataques.', correct: false, consequence: 'O Shield trata de negação de serviço, não de injeção de SQL nem de XSS.' },
        { id: 'd', text: 'Negar na network ACL os IPs de onde vieram os ataques.', correct: false, consequence: 'A ACL olha IPs e portas, não o conteúdo das requisições; novos IPs passariam.' },
      ],
      explanation: [
        'Injeção de SQL e XSS estão no **conteúdo** das requisições HTTP, que só o **WAF** inspeciona. O WAF se associa ao CloudFront, ao ALB, ao API Gateway (REST) e a outros recursos, mas **não ao NLB**. Trocar o NLB por um ALB, ou pôr um CloudFront na frente, permite usar os **grupos gerenciados** SQL database e Core rule set, que já cobrem esses padrões.',
        'O NLB não aceita o WAF. O Shield cuida de DDoS. E a ACL não lê o conteúdo das requisições.',
        '**Regra prática:** ataques na camada de aplicação web pedem WAF, num recurso que o aceite: CloudFront, ALB ou API Gateway. Se a aplicação está atrás de um NLB ou direto numa instância, o primeiro passo é colocar um desses na frente.',
      ],
    },
    {
      id: 'rv:net.f09.contagem-antes',
      kind: 'decision',
      title: 'Regras novas sem barrar clientes',
      prompt:
        'Uma loja vai ligar o **Core rule set** do WAF no ALB de produção. Ela teme que algumas regras **bloqueiem clientes legítimos**, porque o site recebe formulários com textos longos e caracteres especiais. A empresa quer o **menor risco de derrubar vendas**. Qual procedimento atende?',
      concepts: [{ id: 'edgesec.waf-managed' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar o grupo com a ação de bloqueio e corrigir as regras se surgirem reclamações.', correct: false, consequence: 'Os bloqueios indevidos aparecem como vendas perdidas antes de alguém agir.' },
        { id: 'b', text: 'Ligar o grupo só contando, analisar os registros e ajustar antes de bloquear.', correct: true, consequence: 'As regras mostram o que bloqueariam sem bloquear; os ajustes são feitos antes de valerem.' },
        { id: 'c', text: 'Desistir das regras gerenciadas e escrever do zero regras próprias para SQLi e XSS.', correct: false, consequence: 'Troca regras mantidas pela AWS por regras próprias, com mais trabalho e mais chance de erro.' },
        { id: 'd', text: 'Ligar só o grupo de controle de bots, que nunca bloqueia clientes humanos.', correct: false, consequence: 'Não cobre as vulnerabilidades do Core rule set e também precisa ser testado antes.' },
      ],
      explanation: [
        'A AWS recomenda **testar e ajustar** as regras gerenciadas antes de usá-las com o tráfego de produção. O caminho é ligar o grupo com a ação de **contagem** (Count): o WAF registra o que cada regra bloquearia, a equipe analisa os casos legítimos e ajusta exceções, e só então passa as regras a bloquear.',
        'Bloquear direto transforma os falsos positivos em vendas perdidas. Escrever regras próprias dá mais trabalho e cobre menos. E o grupo de bots tem outro propósito, além de cobrança adicional.',
        '**Regra prática:** regras novas do WAF entram contando, não bloqueando. Depois de analisar os registros, a equipe ajusta e passa para o bloqueio.',
      ],
    },
    {
      id: 'rv:net.f09.waf-nao-ve-ssh',
      kind: 'decision',
      title: 'Tentativas de senha no SSH',
      prompt:
        'Um servidor de administração tem IPv4 público e o **security group liberando a porta 22 para 0.0.0.0/0**. Os registros mostram milhares de tentativas de senha por SSH vindas da internet. Um analista propõe associar o **AWS WAF** ao servidor. Só a equipe do escritório, de IPs fixos, administra o servidor. Qual ação resolve?',
      concepts: [{ id: 'edgesec.waf' }, { id: 'net.choose' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Associar o WAF ao servidor, com uma regra por taxa para o SSH.', correct: false, consequence: 'O WAF inspeciona só HTTP e HTTPS, e não se associa a uma instância EC2.' },
        { id: 'b', text: 'Assinar o Shield Advanced e adicionar o Elastic IP do servidor.', correct: false, consequence: 'O Shield trata de negação de serviço, não de tentativas de senha numa porta aberta.' },
        { id: 'c', text: 'Liberar a porta 22 do security group só para os IPs do escritório.', correct: true, consequence: 'A internet deixa de alcançar a porta 22, e só o escritório continua administrando.' },
        { id: 'd', text: 'Pôr um CloudFront com WAF na frente do servidor, ouvindo na porta 22.', correct: false, consequence: 'O CloudFront entrega HTTP e HTTPS; ele não encaminha conexões SSH.' },
      ],
      explanation: [
        'O problema é uma **porta aberta para o mundo**, e a peça certa para isso é o **security group**: liberar a porta 22 só para os IPs do escritório tira o servidor do alcance das tentativas, sem custo e sem mudar a administração.',
        'O WAF é um firewall de aplicações web: só inspeciona HTTP e HTTPS e não se associa a uma instância. O Shield cuida de DDoS. E o CloudFront não leva SSH.',
        '**Regra prática:** antes de procurar um serviço de proteção, veja se o requisito é de filtro de porta e origem; nesse caso, security group resolve. O WAF só entra quando o ataque está no conteúdo de requisições web.',
      ],
    },
    {
      id: 'rv:net.f09.m1.a2',
      kind: 'decision',
      title: 'Milhares de senhas por minuto',
      prompt:
        'Robôs testam **milhares de senhas por minuto** no caminho /login de uma aplicação atrás de um CloudFront com WAF. Cada robô usa poucos IPs, que mudam de um dia para o outro. A empresa quer **frear os robôs automaticamente** sem afetar o resto do site. Qual solução atende?',
      concepts: [{ id: 'edgesec.rate-based' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma regra por taxa no WAF, limitada ao caminho /login.', correct: true, consequence: 'Cada IP que passa do limite no login é bloqueado, e o resto do site não é afetado.' },
        { id: 'b', text: 'Uma lista de IPs bloqueados no WAF, atualizada todo dia à mão.', correct: false, consequence: 'Os IPs mudam diariamente: a lista fica sempre atrasada e dá trabalho.' },
        { id: 'c', text: 'Mais servidores atrás do balanceador, para aguentar as tentativas.', correct: false, consequence: 'Os robôs continuam tentando senhas, agora com mais capacidade para isso.' },
        { id: 'd', text: 'Uma restrição geográfica no CloudFront para os países dos robôs.', correct: false, consequence: 'Bloqueia clientes legítimos desses países, e os robôs podem usar IPs de outros.' },
      ],
      explanation: [
        'A **regra por taxa** do WAF conta as requisições de cada IP numa janela de tempo e **bloqueia quem passa do limite**, sem lista manual. Com uma **declaração de escopo** para o caminho /login, ela conta só as tentativas de login e deixa o resto do site em paz.',
        'Listas manuais não acompanham IPs que mudam. Mais servidores não freiam ninguém. E bloquear países pega clientes e deixa robôs de outros lugares.',
        '**Regra prática:** "bloquear IPs que fazem requisições demais" é regra por taxa no WAF; limite o escopo ao caminho atacado quando o resto do site tiver tráfego normal alto.',
      ],
    },
    {
      id: 'rv:net.f09.m2.a1',
      kind: 'decision',
      title: 'Proteção contra DDoS com orçamento zero',
      prompt:
        'Uma startup tem o site atrás do Amazon CloudFront, com DNS no Route 53. Ela quer proteção contra os **ataques DDoS de rede e de transporte mais comuns**, como inundações de SYN, com o **menor custo possível**. Não precisa de equipe de resposta nem de créditos. Qual solução atende?',
      concepts: [{ id: 'edgesec.shield-standard' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Assinar o Shield Advanced para o CloudFront e a zona do Route 53.', correct: false, consequence: 'Atende, mas é uma assinatura paga, com recursos que a startup não pediu.' },
        { id: 'b', text: 'Contar com o Shield Standard, já incluído sem custo extra.', correct: true, consequence: 'O Shield Standard vem ligado para todos e protege melhor serviços de borda como CloudFront e Route 53.' },
        { id: 'c', text: 'Criar regras por taxa no WAF para todos os caminhos do site.', correct: false, consequence: 'O WAF age na camada de aplicação; inundações de SYN são de transporte, e o WAF tem custo.' },
        { id: 'd', text: 'Colocar um AWS Network Firewall na frente da origem do CloudFront.', correct: false, consequence: 'Tem custo por hora e não é a proteção contra DDoS de rede que o Shield já dá.' },
      ],
      explanation: [
        'O **Shield Standard** vem **ligado para todos os clientes, sem custo extra**, e protege contra os ataques DDoS de rede e de transporte (camadas 3 e 4) mais comuns, como a inundação de SYN. CloudFront e Route 53 recebem a proteção mais completa, porque ficam na borda da AWS.',
        'O Shield Advanced é pago e traz o que a startup dispensou. O WAF age na camada 7. E o Network Firewall filtra o tráfego da VPC, com custo, sem substituir a proteção contra DDoS.',
        '**Regra prática:** proteção básica contra DDoS já existe para todos, sem custo: Shield Standard. Equipe de resposta, créditos e mitigação avançada são do Shield Advanced.',
      ],
    },
    {
      id: 'rv:net.f09.comecar-na-borda',
      kind: 'decision',
      title: 'Um servidor exposto direto na internet',
      prompt:
        'Um site roda em instâncias EC2 com Elastic IPs, acessadas **direto pela internet**, e sofre inundações de requisições e de conexões. A empresa não quer assinar o Shield Advanced e quer **mudar a arquitetura** para resistir melhor a DDoS, mantendo o site disponível. Qual mudança atende?',
      concepts: [{ id: 'edgesec.shield-standard' }, { id: 'net.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar as instâncias por tipos maiores, para aguentar mais conexões.', correct: false, consequence: 'Aumenta a capacidade, mas os servidores continuam recebendo o ataque direto.' },
        { id: 'b', text: 'Negar na network ACL as faixas de IP de cada ataque, conforme aparecem.', correct: false, consequence: 'Os ataques mudam de origem, e as regras ficam sempre atrasadas.' },
        { id: 'c', text: 'CloudFront e ALB na frente, e as instâncias em sub-redes privadas.', correct: true, consequence: 'O ataque é absorvido na borda da AWS, e as instâncias deixam de ser alcançáveis diretamente.' },
        { id: 'd', text: 'Trocar os Elastic IPs a cada ataque, para despistar quem ataca.', correct: false, consequence: 'O DNS aponta o atacante para o IP novo, e o site fica instável a cada troca.' },
      ],
      explanation: [
        'O desenho da arquitetura influencia a resistência a DDoS. **Começar na borda**, com o **CloudFront**, faz o tráfego chegar primeiro a pontos de presença com a proteção mais completa do Shield Standard. Um ALB atrás dele distribui a carga, e as instâncias em sub-redes privadas deixam de ser alvo direto.',
        'Instâncias maiores continuam expostas. Regras de ACL por faixa não acompanham ataques que mudam de origem. E trocar IPs só gera instabilidade.',
        '**Regra prática:** contra DDoS, tire os servidores do alcance direto e coloque serviços de borda (CloudFront, Global Accelerator, Route 53) na frente. O Shield Advanced é o passo seguinte, quando é preciso mais que isso.',
      ],
    },
    {
      id: 'rv:net.f09.recursos-do-advanced',
      kind: 'decision',
      title: 'O que entra na proteção ampliada',
      prompt:
        'Uma empresa assinou o **Shield Advanced** e precisa escolher os recursos que vai **adicionar à proteção**. O inventário tem, entre outros: um bucket do S3 com arquivos públicos, um Application Load Balancer, um banco no Amazon RDS, o Elastic IP de um servidor de jogos e uma tabela do DynamoDB. Quais peças do inventário **podem ser adicionadas**? (Escolha DUAS.)',
      concepts: [{ id: 'edgesec.shield-advanced' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'O bucket do S3 com os arquivos públicos.', correct: false, consequence: 'O bucket não está entre os recursos do Shield Advanced; para protegê-lo, entregue os arquivos por um CloudFront protegido.' },
        { id: 'b', text: 'O Application Load Balancer.', correct: true, consequence: 'O ALB está entre os recursos que o Shield Advanced protege.' },
        { id: 'c', text: 'O banco no Amazon RDS.', correct: false, consequence: 'O RDS não é um recurso do Shield Advanced e nem deveria estar exposto à internet.' },
        { id: 'd', text: 'O Elastic IP do servidor de jogos.', correct: true, consequence: 'Elastic IPs estão entre os recursos que o Shield Advanced protege.' },
        { id: 'e', text: 'A tabela do DynamoDB.', correct: false, consequence: 'O DynamoDB não está entre os recursos do Shield Advanced.' },
      ],
      explanation: [
        'O Shield Advanced protege só os recursos que você **adiciona** a ele, e só de certos tipos: distribuições do **CloudFront**, zonas do **Route 53**, aceleradores do **Global Accelerator**, **Elastic IPs**, **ALB**, CLB e NLB (pelo Elastic IP). Do inventário, entram o ALB e o Elastic IP.',
        'Bucket do S3, banco do RDS e tabela do DynamoDB não são recursos do Shield Advanced. Conteúdo público do S3 ganha a proteção quando passa a ser entregue por um CloudFront protegido.',
        '**Regra prática:** o Shield Advanced protege a borda e os pontos de entrada da rede (CloudFront, Route 53, Global Accelerator, balanceadores e Elastic IPs). Serviços de dados ficam protegidos atrás deles.',
      ],
    },
    {
      id: 'rv:net.f09.m2.a3',
      kind: 'decision',
      title: 'Contas novas sem a proteção contratada',
      prompt:
        'Uma organização com 50 contas, na mesma família de faturamento consolidado, assinou o **Shield Advanced**. Os balanceadores das contas antigas foram adicionados à proteção um a um, mas os das **contas criadas depois** aparecem **sem proteção**. A segurança quer que **todo balanceador novo, em qualquer conta**, seja protegido sem trabalho manual. Qual solução atende?',
      concepts: [{ id: 'edgesec.shield-advanced' }, { id: 'edgesec.firewall-manager' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma assinatura do Shield Advanced em cada conta nova.', correct: false, consequence: 'A assinatura da família de faturamento já cobre as contas; o que falta é adicionar os recursos.' },
        { id: 'b', text: 'Esperar: o Shield Advanced adiciona sozinho os recursos novos depois de alguns dias.', correct: false, consequence: 'O Shield Advanced não protege nada sozinho; os recursos precisam ser adicionados.' },
        { id: 'c', text: 'Uma política do Firewall Manager para o Shield Advanced, aplicada à organização.', correct: true, consequence: 'A política adiciona à proteção os recursos das contas atuais e das que entrarem depois.' },
        { id: 'd', text: 'Um lembrete para cada time adicionar os balanceadores pelo console.', correct: false, consequence: 'Depende de pessoas lembrarem, o oposto de sem trabalho manual, e deixa recursos de fora.' },
      ],
      explanation: [
        'O Shield Advanced **não protege nada sozinho**: só os recursos adicionados a ele. Numa organização, a assinatura cobre as contas da mesma família de faturamento consolidado, mas cada recurso ainda precisa entrar na proteção. O **Firewall Manager**, com uma política de Shield Advanced, faz isso em todas as contas, **inclusive as que entrarem depois**.',
        'Assinaturas extras não adicionam recursos. Não há adição automática sem uma política. E depender de lembretes deixa buracos.',
        '**Regra prática:** "aplicar a mesma proteção em todas as contas, inclusive nas novas" é Firewall Manager, seja para WAF, Shield Advanced, security groups ou Network Firewall.',
      ],
    },
    {
      id: 'rv:net.f09.m2.a2',
      kind: 'decision',
      title: 'A equipe de resposta que não atendeu',
      prompt:
        'Uma empresa assinou o Shield Advanced e adicionou o CloudFront e o ALB à proteção. Durante um ataque, tentou acionar a **equipe de resposta a DDoS da AWS (SRT)** e não conseguiu. A conta está no plano de suporte **Developer**. O que falta para **ter acesso à SRT**?',
      concepts: [{ id: 'edgesec.shield-advanced' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Passar a conta para o plano de suporte Business ou Enterprise.', correct: true, consequence: 'O acesso à SRT exige o Shield Advanced e um desses planos de suporte.' },
        { id: 'b', text: 'Adicionar também a zona do Route 53 à proteção.', correct: false, consequence: 'Mais recursos protegidos não liberam a SRT; o requisito é o plano de suporte.' },
        { id: 'c', text: 'Esperar 90 dias de assinatura, prazo para a SRT ser liberada.', correct: false, consequence: 'Não há carência: o que falta é o plano de suporte adequado.' },
        { id: 'd', text: 'Associar um pacote de proteção do WAF a todos os recursos protegidos.', correct: false, consequence: 'O WAF ajuda na mitigação, mas não é o que dá acesso à equipe de resposta.' },
      ],
      explanation: [
        'A **SRT** é um benefício do **Shield Advanced**, mas exige também o plano de suporte **Business ou Enterprise**. Com o plano Developer, a assinatura funciona para a proteção e os créditos, mas a equipe de resposta não fica disponível.',
        'Adicionar recursos, esperar ou ligar o WAF não muda o requisito do plano de suporte.',
        '**Regra prática:** "falar com especialistas da AWS durante um ataque" pede Shield Advanced mais suporte Business ou Enterprise. Um sem o outro não basta.',
      ],
    },
    {
      id: 'rv:net.f09.m3.a1',
      kind: 'decision',
      title: 'O firewall que não inspeciona nada',
      prompt:
        'Uma equipe criou um **AWS Network Firewall** para filtrar a saída das instâncias para a internet, e colocou os endpoints do firewall **nas mesmas sub-redes das instâncias**. As tabelas de rotas não mudaram, e o tráfego **não está sendo inspecionado**. Qual desenho corrige?',
      concepts: [{ id: 'edgesec.network-firewall' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Associar o firewall aos security groups das instâncias.', correct: false, consequence: 'O Network Firewall não se associa a security groups; ele recebe o tráfego pelas rotas.' },
        { id: 'b', text: 'Sub-redes só do firewall, uma por zona, com rotas pelos endpoints.', correct: true, consequence: 'O tráfego das instâncias passa pelo endpoint da zona antes de sair, e é inspecionado.' },
        { id: 'c', text: 'Manter os endpoints com as instâncias e ligar as regras sem estado.', correct: false, consequence: 'O tipo de regra não muda o caminho: sem rotas pelo firewall, o tráfego não passa por ele.' },
        { id: 'd', text: 'Trocar o Network Firewall pelo WAF associado ao NAT Gateway.', correct: false, consequence: 'O WAF não se associa ao NAT Gateway nem filtra o tráfego de saída da VPC.' },
      ],
      explanation: [
        'O Network Firewall só inspeciona o que **passa pelos endpoints dele**, e o tráfego chega lá pelas **tabelas de rotas**. Os endpoints ficam em **sub-redes só do firewall, uma por zona**, e as rotas das sub-redes das instâncias (e as de volta) mandam o tráfego por eles. Na mesma sub-rede das instâncias, o tráfego entre elas e a saída não atravessa o firewall.',
        'O firewall não se associa a security groups. Mudar o tipo de regra não muda o caminho. E o WAF não filtra a saída da VPC.',
        '**Regra prática:** Network Firewall é um desenho de rotas: sub-redes dedicadas por zona e tabelas que forçam o tráfego a passar pelos endpoints.',
      ],
    },
    {
      id: 'rv:net.f09.inspecao-central',
      kind: 'decision',
      title: 'Inspeção com IPS entre vinte VPCs',
      prompt:
        'Uma empresa liga 20 VPCs e a saída para a internet por um **Transit Gateway**. A segurança exige **inspeção com estado e IPS**, com regras no formato Suricata, de todo o tráfego entre as VPCs e para a internet, num **ponto central**, sem instalar nada nas instâncias. Qual solução atende?',
      concepts: [{ id: 'edgesec.network-firewall' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um AWS Network Firewall anexado ao Transit Gateway.', correct: true, consequence: 'O tráfego que passa pelo Transit Gateway é inspecionado pelo firewall com estado e IPS, num ponto só.' },
        { id: 'b', text: 'Um pacote de proteção do WAF em cada VPC.', correct: false, consequence: 'O WAF se associa a recursos web, não a VPCs, e não inspeciona todo o tráfego de rede.' },
        { id: 'c', text: 'Security groups padronizados em todas as instâncias das 20 VPCs.', correct: false, consequence: 'Filtram portas e origens em cada instância, sem IPS nem inspeção central.' },
        { id: 'd', text: 'O Shield Advanced nos anexos do Transit Gateway.', correct: false, consequence: 'O Shield trata de DDoS e não protege anexos do Transit Gateway.' },
      ],
      explanation: [
        'O **Network Firewall** é um firewall de rede gerenciado, **com estado e IPS**, que usa regras compatíveis com o Suricata. Ele pode ser **anexado direto a um Transit Gateway**, e assim o tráfego entre as VPCs e para a internet que passa pelo Transit Gateway é inspecionado num ponto central, sem agentes nas instâncias.',
        'O WAF é para requisições web em recursos específicos. Security groups não fazem IPS nem inspeção central. E o Shield não protege anexos do Transit Gateway.',
        '**Regra prática:** "IPS", "inspeção profunda de pacotes" e "filtro por domínio" na rede pedem Network Firewall. Com muitas VPCs num Transit Gateway, a inspeção central vem do anexo do firewall a ele.',
      ],
    },
    {
      id: 'rv:net.f09.m3.a2',
      kind: 'decision',
      title: 'A porta 22 aberta em alguma conta',
      prompt:
        'Uma organização tem 60 contas, e novas contas são criadas toda semana. A segurança quer **auditar e corrigir automaticamente** qualquer security group que libere a porta 22 para 0.0.0.0/0, **em todas as contas, inclusive nas novas**, a partir de uma conta administradora. Qual serviço atende?',
      concepts: [{ id: 'edgesec.firewall-manager' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma network ACL padrão negando a porta 22, criada em cada VPC.', correct: false, consequence: 'Exige configurar VPC por VPC, não corrige os security groups e deixa contas novas de fora.' },
        { id: 'b', text: 'O Firewall Manager, com uma política de security groups.', correct: true, consequence: 'A política vale para a organização, inclusive para contas novas, e pode corrigir os grupos fora do padrão.' },
        { id: 'c', text: 'O AWS WAF, com uma regra que bloqueia a porta 22.', correct: false, consequence: 'O WAF inspeciona requisições web e não trata de regras de security group.' },
        { id: 'd', text: 'Um script em cada conta, que revisa os security groups uma vez por dia.', correct: false, consequence: 'Funciona com muito trabalho e sem cobrir contas novas sem alguém instalar o script.' },
      ],
      explanation: [
        'O **Firewall Manager** aplica, a partir de uma conta administradora, as mesmas proteções em **todas as contas da organização**, e **contas e recursos novos recebem as políticas sozinhos**. Entre elas há políticas de **security groups**, que auditam regras como a porta 22 aberta para o mundo e podem corrigi-las.',
        'ACLs por VPC e scripts por conta exigem trabalho e deixam as contas novas de fora. E o WAF não olha security groups.',
        '**Regra prática:** "em todas as contas, inclusive nas novas" para WAF, Shield Advanced, security groups, ACLs, Network Firewall ou DNS Firewall é Firewall Manager. A cobrança vem dos serviços que ele gerencia, como o AWS Config.',
      ],
    },
    {
      id: 'rv:net.f09.m3.a3',
      kind: 'decision',
      title: 'Cada ameaça com a sua proteção',
      prompt:
        'Num levantamento de riscos, a segurança listou ameaças e a proteção que pretende usar contra cada uma. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'net.choose' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Script malicioso enviado num formulário: AWS WAF com o Core rule set.', correct: true, consequence: 'O Core rule set do WAF bloqueia cross-site scripting no conteúdo das requisições.' },
        { id: 'b', text: 'Inundação de SYN contra o balanceador: AWS Shield.', correct: true, consequence: 'É um ataque de transporte, coberto pelo Shield.' },
        { id: 'c', text: 'Servidor comprometido enviando dados a um domínio desconhecido: security group.', correct: false, consequence: 'Security groups não entendem nomes de domínio; o filtro de saída por domínio é do Network Firewall.' },
        { id: 'd', text: 'Porta 22 aberta para o mundo num servidor: AWS Network Firewall.', correct: false, consequence: 'Exagero: basta corrigir a regra do security group do servidor.' },
        { id: 'e', text: 'Injeção de SQL num formulário: AWS Shield Advanced.', correct: false, consequence: 'O Shield trata de DDoS; injeção de SQL é trabalho do WAF.' },
      ],
      explanation: [
        'Cada ameaça tem a sua peça. Ataques no **conteúdo de requisições web** (XSS, injeção de SQL) são do **WAF**. Ataques de **rede e transporte** (inundação de SYN) são do **Shield**. Saída para **domínios** suspeitos é filtrada pelo **Network Firewall**. E uma **porta aberta** num servidor é corrigida no **security group**.',
        'Security group não filtra por domínio. Network Firewall para uma porta aberta é exagero, quando a regra errada está no grupo. E o Shield não trata injeção de SQL.',
        '**Regra prática:** identifique a camada da ameaça: conteúdo web, WAF; DDoS, Shield; tráfego de rede por domínio ou IPS, Network Firewall; porta e origem de uma instância, security group.',
      ],
    },
    {
      id: 'rv:net.f09.duas-pecas',
      kind: 'decision',
      title: 'Imagens para o mundo e dados para o S3',
      prompt:
        'Uma empresa tem dois requisitos de rede: entregar **imagens a visitantes do mundo todo com baixa latência** e fazer as instâncias de sub-redes privadas gravarem **10 TB por mês no Amazon S3** da mesma Região **sem pagar o processamento do NAT Gateway**. Quais peças atendem? (Escolha DUAS.)',
      concepts: [{ id: 'net.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma distribuição do Amazon CloudFront para as imagens.', correct: true, consequence: 'As imagens ficam em cache perto dos visitantes, com baixa latência no mundo todo.' },
        { id: 'b', text: 'Um endpoint de gateway do S3 nas tabelas das sub-redes privadas.', correct: true, consequence: 'O tráfego para o S3 sai do NAT por uma rota mais específica, e o endpoint de gateway não cobra nada.' },
        { id: 'c', text: 'O AWS Global Accelerator para as imagens.', correct: false, consequence: 'Acelera o caminho, mas não guarda as imagens em cache: a origem atende cada download.' },
        { id: 'd', text: 'Um NAT Gateway maior para a gravação no S3.', correct: false, consequence: 'O NAT Gateway escala sozinho e cobra por GB processado: o custo continua.' },
        { id: 'e', text: 'Um Transit Gateway entre as sub-redes privadas e o S3.', correct: false, consequence: 'O Transit Gateway liga VPCs e redes, não serviços como o S3, e ainda cobra por GB.' },
      ],
      explanation: [
        'Cada requisito tem a sua peça. Conteúdo estático para o mundo todo é o **CloudFront**, que guarda as imagens perto dos visitantes. Tráfego privado para o S3 sem passar pelo NAT é o **endpoint de gateway**, uma rota com a lista de prefixos do S3 que não cobra hora nem GB.',
        'O Global Accelerator não tem cache. Um NAT "maior" não existe nem resolve o custo por GB. E o Transit Gateway não é caminho para o S3.',
        '**Regra prática:** antes de escolher, separe os requisitos e ache a peça de cada um: aproximar o usuário (CloudFront ou Global Accelerator), sair para serviços da AWS (endpoints), sair para a internet (NAT), ligar redes (peering, Transit Gateway, VPN ou Direct Connect).',
      ],
    },
  ],
}
