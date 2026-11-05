/**
 * Questões da Revisão da Fase 4 de Segurança (certificados e TLS), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'sec.f04',
  questions: [
    {
      id: 'rv:sec.f04.m1.a1',
      kind: 'decision',
      title: 'Um cadeado no site da loja',
      prompt:
        'O Application Load Balancer de uma loja virtual precisa de **HTTPS com um certificado público** para o domínio da loja. A equipe é pequena e quer que a **renovação seja automática** e que o certificado **não tenha custo**. O DNS fica no Route 53. Qual solução atende?',
      concepts: [{ id: 'acm.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Comprar um certificado de outra autoridade e instalá-lo em cada instância.', correct: false, consequence: 'Funciona, mas a compra, a instalação e cada renovação ficam com a equipe.' },
        { id: 'b', text: 'Certificado público do ACM, validado por DNS, no listener do ALB.', correct: true, consequence: 'O certificado não tem custo e, validado por DNS e em uso, renova sozinho.' },
        { id: 'c', text: 'Ligar a criptografia do EBS nas instâncias da loja.', correct: false, consequence: 'Protege os discos, não o tráfego entre o navegador e o site.' },
        { id: 'd', text: 'Um certificado autoassinado no ALB, gerado pela equipe.', correct: false, consequence: 'Os navegadores não confiam nele e mostram alerta de segurança aos clientes.' },
      ],
      explanation: [
        'O **ACM** emite, guarda e **renova** certificados TLS para os serviços integrados, como load balancers, CloudFront e API Gateway. Os **certificados públicos do ACM não têm custo**. Validado por DNS e associado ao listener do ALB, o certificado renova sem ninguém agir.',
        'Comprar e instalar em cada instância dá trabalho a cada renovação. Criptografia de disco não protege a conexão. E um autoassinado não é confiável para o público.',
        '**Regra prática:** "HTTPS no load balancer ou no CloudFront, com renovação automática e sem custo pelo certificado" é um certificado público do ACM.',
      ],
    },
    {
      id: 'rv:sec.f04.m3.a2',
      kind: 'decision',
      title: 'Um segundo ALB em outra Região',
      prompt:
        'Uma loja usa um certificado do ACM em sa-east-1 no ALB de lá. Para a recuperação de desastres, ela criou **outro ALB em us-east-1**, que vai atender **o mesmo domínio**. A equipe quer reaproveitar o certificado. Qual caminho atende?',
      concepts: [{ id: 'acm.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Copiar o certificado de sa-east-1 para us-east-1 pelo console do ACM.', correct: false, consequence: 'Certificados do ACM não podem ser copiados entre Regiões.' },
        { id: 'b', text: 'Usar no ALB de us-east-1 o ARN do certificado de sa-east-1.', correct: false, consequence: 'O certificado só existe na Região em que foi pedido.' },
        { id: 'c', text: 'Pedir outro certificado do ACM em us-east-1 para o mesmo domínio.', correct: true, consequence: 'Cada Região tem o próprio certificado, validado de novo para o domínio.' },
        { id: 'd', text: 'Exportar a chave privada do certificado gerenciado e importá-la em us-east-1.', correct: false, consequence: 'A chave privada de um certificado gerenciado comum não é exportada.' },
      ],
      explanation: [
        'Os **certificados do ACM são regionais** e **não podem ser copiados entre Regiões**. Para usar o mesmo domínio em load balancers de duas Regiões, é preciso **um certificado em cada Região**, com o domínio validado de novo.',
        'Copiar, reaproveitar o ARN ou exportar a chave de um certificado gerenciado comum não funciona.',
        '**Regra prática:** em arquiteturas multirregião, planeje um certificado do ACM por Região para cada balanceador.',
      ],
    },
    {
      id: 'rv:sec.f04.m2.a3',
      kind: 'decision',
      title: 'Um certificado importado a 40 dias do fim',
      prompt:
        'O certificado da intranet foi **comprado de outra autoridade** e **importado no ACM**, onde está associado a um ALB. Ele **vence em 40 dias**, e a empresa precisa manter esse fornecedor por contrato. Qual ação evita a queda agora e ajuda a não esquecer nos próximos anos?',
      concepts: [{ id: 'acm.public-vs-imported' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Esperar o ACM renovar o certificado importado.', correct: false, consequence: 'O ACM não renova certificados importados.' },
        { id: 'b', text: 'Reimportar o novo e assinar os avisos de vencimento.', correct: true, consequence: 'O ALB continua no mesmo ARN, agora com o certificado novo, e os próximos vencimentos chegam como alerta.' },
        { id: 'c', text: 'Trocar por um certificado do ACM só depois que o atual vencer.', correct: false, consequence: 'A intranet fica fora do ar até a troca, e o contrato exige o fornecedor atual.' },
        { id: 'd', text: 'Apagar o certificado do ACM e instalá-lo direto nas instâncias.', correct: false, consequence: 'Tira o certificado do ALB e transfere o problema da renovação para as instâncias.' },
      ],
      explanation: [
        'O certificado **importado** funciona nos mesmos serviços, mas **o ACM não o renova**: quem importou obtém um novo e **reimporta**, o que **mantém o ARN e as associações**. O ACM envia **eventos diários ao EventBridge** a partir de 45 dias do vencimento de importados, e uma regra transforma esses eventos em alertas.',
        'Esperar a renovação não funciona. Trocar depois do vencimento derruba a intranet. E levar o certificado para as instâncias piora a gestão.',
        '**Regra prática:** certificado importado é renovação sua; reimporte no mesmo ARN e assine os eventos de vencimento.',
      ],
    },
    {
      id: 'rv:sec.f04.autoridade-do-contrato',
      kind: 'decision',
      title: 'O cliente exige outra autoridade',
      prompt:
        'Um cliente corporativo exige que a API que a empresa expõe a ele use um certificado emitido por **uma autoridade certificadora específica**, contratada pelo cliente. A API fica atrás de um **API Gateway**. A empresa quer usar o certificado **num serviço integrado**, sem instalá-lo em servidores. Qual solução atende?',
      concepts: [{ id: 'acm.public-vs-imported' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Pedir um certificado público do ACM, que é aceito por todas as autoridades.', correct: false, consequence: 'O certificado do ACM vem da autoridade da Amazon, não da que o cliente exige.' },
        { id: 'b', text: 'Instalar o certificado da autoridade num servidor web na frente do API Gateway.', correct: false, consequence: 'Acrescenta um servidor para manter, quando o ACM permite usar o certificado no próprio serviço.' },
        { id: 'c', text: 'Importar no ACM o certificado da autoridade e associá-lo ao API Gateway.', correct: true, consequence: 'O certificado importado funciona no serviço integrado; a renovação fica com a empresa.' },
        { id: 'd', text: 'Usar um certificado autoassinado, enviado ao cliente para ele confiar.', correct: false, consequence: 'Não atende à exigência de uma autoridade específica.' },
      ],
      explanation: [
        'O ACM **emite** certificados da autoridade da Amazon, com renovação gerenciada, e também **importa** certificados de **outras autoridades**, que funcionam nos mesmos serviços integrados. Quando o requisito é uma autoridade específica, o caminho é importar; a renovação passa a ser da empresa.',
        'O certificado do ACM é de outra autoridade. Um servidor na frente é peça a mais. E um autoassinado não atende à exigência.',
        '**Regra prática:** certificado de outra autoridade, importado no ACM; lembre que importado não renova sozinho.',
      ],
    },
    {
      id: 'rv:sec.f04.m2.a1',
      kind: 'decision',
      title: 'Quais certificados renovam sozinhos',
      prompt:
        'Uma empresa tem vários certificados no ACM e quer saber quais **renovam sem ninguém agir**. Todos os emitidos pelo ACM são públicos. Quais opções renovam automaticamente? (Escolha DUAS.)',
      concepts: [{ id: 'acm.renewal' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Emitido pelo ACM, validado por DNS, com o CNAME no DNS, em uso num ALB.', correct: true, consequence: 'Atende às três condições: emitido pelo ACM, validado por DNS e em uso.' },
        { id: 'b', text: 'Emitido pelo ACM, validado por DNS, com o CNAME no DNS, em uso no CloudFront.', correct: true, consequence: 'O CloudFront é um serviço integrado; a renovação é automática.' },
        { id: 'c', text: 'Comprado de outra autoridade e importado no ACM, em uso num ALB.', correct: false, consequence: 'O ACM não renova certificados importados.' },
        { id: 'd', text: 'Emitido pelo ACM, validado por DNS, sem associação a nenhum serviço.', correct: false, consequence: 'Certificados sem uso e não exportados não renovam sozinhos.' },
        { id: 'e', text: 'Emitido pelo ACM, validado por e-mail, sem ninguém aprovar o link.', correct: false, consequence: 'A validação por e-mail exige aprovação a cada renovação.' },
      ],
      explanation: [
        'Certificados públicos do ACM valem 198 dias, e a renovação começa 45 dias antes do vencimento. Para **renovar sozinho**, o certificado precisa ser **emitido pelo ACM**, **validado por DNS** (com o CNAME mantido) e **estar em uso** num serviço integrado. A renovação mantém o mesmo ARN.',
        'Importados, certificados sem uso e não exportados, e os validados por e-mail sem aprovação não renovam sozinhos.',
        '**Regra prática:** emitido pelo ACM + validado por DNS + em uso = renovação automática.',
      ],
    },
    {
      id: 'rv:sec.f04.m2.a2',
      kind: 'decision',
      title: 'Um link para aprovar a cada renovação',
      prompt:
        'Um certificado do ACM foi validado **por e-mail**, e a cada renovação alguém precisa **aprovar um link** enviado ao endereço administrativo do domínio; no último ano, a aprovação atrasou e o site quase caiu. A empresa quer **renovação totalmente automática** daqui em diante. Qual caminho atende?',
      concepts: [{ id: 'acm.validation' }, { id: 'acm.renewal' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mudar a validação do certificado atual de e-mail para DNS.', correct: false, consequence: 'Um certificado validado por e-mail não passa a ser validado por DNS.' },
        { id: 'b', text: 'Um certificado novo validado por DNS, trocado no serviço.', correct: true, consequence: 'O certificado novo renova sozinho enquanto o CNAME existir e ele estiver em uso.' },
        { id: 'c', text: 'Criar uma regra de encaminhamento que aprove os e-mails automaticamente.', correct: false, consequence: 'Aprovação automática de e-mail não é um recurso do ACM e enfraquece a validação.' },
        { id: 'd', text: 'Importar o certificado atual no ACM para ganhar a renovação gerenciada.', correct: false, consequence: 'Certificados importados não têm renovação gerenciada.' },
      ],
      explanation: [
        'Antes de emitir, o ACM confere que você controla o domínio. Na **validação por e-mail**, alguém aprova um link **a cada renovação**. Na **validação por DNS**, um **CNAME** fica no DNS e, enquanto ele existir, a **renovação é automática**. Um certificado validado por e-mail **não muda para DNS**: é preciso **pedir outro** e trocá-lo no serviço.',
        'Não há conversão do método de validação. Automatizar aprovações não é o caminho. E importar perde a renovação gerenciada.',
        '**Regra prática:** a AWS recomenda validação por DNS; com o Route 53, o ACM cria o CNAME direto.',
      ],
    },
    {
      id: 'rv:sec.f04.um-certificado-dois-servicos',
      kind: 'decision',
      title: 'CloudFront e ALB na mesma Região',
      prompt:
        'Uma empresa tem uma distribuição do CloudFront e, como origem, um **ALB em us-east-1**, os dois atendendo o domínio www.empresa.com com HTTPS. A equipe quer **o menor número de certificados para manter**. Qual configuração atende?',
      concepts: [{ id: 'acm.cloudfront-region' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um certificado em us-east-1 para o CloudFront e outro, também em us-east-1, para o ALB.', correct: false, consequence: 'Funciona, mas mantém dois certificados quando um só serve aos dois.' },
        { id: 'b', text: 'Um único certificado do ACM em us-east-1, usado pelo CloudFront e pelo ALB.', correct: true, consequence: 'O CloudFront exige us-east-1, e o ALB está nessa Região: o mesmo certificado atende aos dois.' },
        { id: 'c', text: 'Um certificado em sa-east-1 para o CloudFront e outro em us-east-1 para o ALB.', correct: false, consequence: 'O CloudFront só usa certificados de us-east-1.' },
        { id: 'd', text: 'Um certificado do ACM para cada ponto de presença do CloudFront.', correct: false, consequence: 'O certificado de us-east-1 é distribuído a todos os pontos de presença sozinho.' },
      ],
      explanation: [
        'Para o **CloudFront**, o certificado do ACM precisa estar em **us-east-1**, qualquer que seja a Região da origem. Como o certificado é regional e o **ALB também está em us-east-1**, o mesmo certificado pode ser associado aos dois serviços.',
        'Dois certificados funcionam, mas dão mais trabalho. O CloudFront não usa certificados de outra Região. E não há certificado por ponto de presença.',
        '**Regra prática:** CloudFront usa certificados de us-east-1; um balanceador usa os da própria Região. Quando os dois estão em us-east-1, um certificado serve aos dois.',
      ],
    },
    {
      id: 'rv:sec.f04.m3.a1',
      kind: 'decision',
      title: 'Visitantes asiáticos e us-east-1',
      prompt:
        'Uma empresa com visitantes na Ásia usa o CloudFront com o certificado do ACM obrigatoriamente em **us-east-1**. Um arquiteto teme que o **TLS dos visitantes asiáticos** passe por us-east-1 e fique lento, e propõe pedir certificados em Regiões da Ásia. Qual avaliação está correta?',
      concepts: [{ id: 'acm.cloudfront-region' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Correta: pedir certificados em Regiões da Ásia para a distribuição.', correct: false, consequence: 'O CloudFront só usa certificados de us-east-1.' },
        { id: 'b', text: 'Correta: mover a distribuição para uma Região da Ásia.', correct: false, consequence: 'Uma distribuição do CloudFront é global; não há Região para mudar.' },
        { id: 'c', text: 'Incorreta: o certificado vai a todos os pontos de presença.', correct: true, consequence: 'O TLS termina no ponto de presença mais próximo do visitante, não em us-east-1.' },
        { id: 'd', text: 'Incorreta: o CloudFront não usa TLS com os visitantes.', correct: false, consequence: 'O CloudFront usa TLS com os visitantes; é para isso que serve o certificado.' },
      ],
      explanation: [
        'O certificado do CloudFront é pedido ou importado em **us-east-1**, mas, a partir dali, é **distribuído a todos os pontos de presença** da distribuição. O visitante asiático faz o TLS no ponto de presença mais próximo, sem passar por us-east-1.',
        'Certificados de outras Regiões não aparecem para o CloudFront, e a distribuição não tem Região.',
        '**Regra prática:** a exigência de us-east-1 é só de onde o certificado é guardado; o uso acontece na borda, perto do usuário.',
      ],
    },
    {
      id: 'rv:sec.f04.m1.a2',
      kind: 'decision',
      title: 'A chave privada não pode sair dos servidores',
      prompt:
        'Uma norma de um banco exige **criptografia de ponta a ponta** do navegador até as instâncias e que a **chave privada do certificado fique só nos servidores**, sem ser instalada em nenhum load balancer. O tráfego é HTTPS. Qual solução atende?',
      concepts: [{ id: 'acm.tls-termination' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um ALB com listener HTTPS e certificado do ACM, encaminhando HTTPS às instâncias.', correct: false, consequence: 'Cifra de ponta a ponta, mas o TLS termina no ALB, que precisa do certificado.' },
        { id: 'b', text: 'Um ALB com listener HTTPS, encaminhando HTTP às instâncias.', correct: false, consequence: 'O trecho até as instâncias fica sem criptografia, e o certificado continua no ALB.' },
        { id: 'c', text: 'Um NLB com listener TCP na porta 443, repassando o TLS às instâncias.', correct: true, consequence: 'O NLB não termina o TLS: a conexão cifrada chega intacta às instâncias, que têm a chave.' },
        { id: 'd', text: 'Um CloudFront com certificado do ACM, apontando direto para as instâncias.', correct: false, consequence: 'O TLS do visitante termina no CloudFront, que guarda o certificado.' },
      ],
      explanation: [
        'O certificado fica **no serviço que termina o TLS**. Um ALB ou o CloudFront terminam o TLS e, portanto, usam o certificado. Para a chave ficar **só nos servidores**, o balanceador não pode terminar o TLS: um **NLB com listener TCP** repassa a conexão cifrada (o chamado TLS passthrough), e as instâncias fazem o TLS.',
        'Qualquer listener HTTPS num ALB, ou o CloudFront, exige o certificado ali. E HTTP até as instâncias quebra a ponta a ponta.',
        '**Regra prática:** "ponta a ponta até as instâncias" pode ser ALB com HTTPS também para os alvos; "chave só nos servidores" pede NLB com TLS passthrough.',
      ],
    },
    {
      id: 'rv:sec.f04.m3.a3',
      kind: 'decision',
      title: 'Uma aplicação antiga sem balanceador',
      prompt:
        'Uma aplicação antiga roda num **servidor web dentro de uma instância EC2**, sem load balancer, e precisa de **HTTPS com um certificado público** emitido pela AWS. A equipe aceita **instalar cada renovação** no servidor. Qual solução atende sem acrescentar um balanceador?',
      concepts: [{ id: 'acm.exportable' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Associar à instância o mesmo certificado gerenciado usado num ALB.', correct: false, consequence: 'O certificado gerenciado comum não é instalado direto numa instância.' },
        { id: 'b', text: 'Um certificado público exportável do ACM, instalado no servidor.', correct: true, consequence: 'O certificado é baixado com a chave privada e instalado; o ACM renova, e a instalação da versão nova é da equipe.' },
        { id: 'c', text: 'Um certificado autoassinado, gerado na própria instância.', correct: false, consequence: 'Não é um certificado público; os navegadores mostram alerta.' },
        { id: 'd', text: 'Ligar a criptografia do volume EBS da instância.', correct: false, consequence: 'Protege o disco da instância, não a conexão HTTPS dos visitantes.' },
      ],
      explanation: [
        'Um certificado **gerenciado** comum do ACM **não é instalado direto** num servidor da instância (só com Nitro Enclaves). Para EC2, contêineres e servidores próprios, o ACM oferece **certificados públicos exportáveis**, baixados com a chave privada e instalados no servidor; o ACM renova, e **instalar a versão nova** fica com a equipe. Eles têm custo.',
        'O certificado do ALB não vai para a instância. Autoassinado não é público. E criptografia de disco não é TLS.',
        '**Regra prática:** HTTPS direto numa instância EC2 pede certificado exportável (ou ACME); com um balanceador na frente, o certificado gerenciado basta.',
      ],
    },
  ],
}
