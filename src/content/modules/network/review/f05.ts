/**
 * Questões da Revisão da Fase 5 de Redes (acesso privado a serviços), no
 * formato do exame SAA-C03. Fatos conferidos em 21/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md); preços de us-east-1 da AWS Price List
 * usados na trilha. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'net.f05',
  questions: [
    {
      id: 'rv:net.f05.nat-dynamodb-sqs',
      kind: 'decision',
      title: 'A fatura do NAT com DynamoDB e SQS',
      prompt:
        'Uma aplicação em sub-redes privadas de duas zonas grava cerca de 5.000 GB por mês no Amazon DynamoDB e troca outros 4.000 GB por mês de mensagens com o Amazon SQS, tudo pelo NAT Gateway, que virou a maior linha da fatura de rede. A empresa quer **reduzir esse custo** sem expor as instâncias à internet. Quais mudanças atendem com o menor custo? (Escolha DUAS.)',
      concepts: [{ id: 'pl.gateway-endpoint' }, { id: 'pl.interface-endpoint' }, { id: 'pl.nat-vs-endpoint' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Criar um endpoint de gateway do SQS e associá-lo às tabelas de rotas das sub-redes privadas.', correct: false, consequence: 'Não existe: só o S3 e o DynamoDB têm endpoint de gateway.' },
        { id: 'b', text: 'Criar um endpoint de gateway do DynamoDB e associá-lo às tabelas de rotas das sub-redes privadas.', correct: true, consequence: 'O tráfego do DynamoDB sai do NAT por uma rota mais específica, e o endpoint de gateway não cobra hora nem GB.' },
        { id: 'c', text: 'Criar um endpoint de interface do DynamoDB em sub-redes das duas zonas.', correct: false, consequence: 'Funciona, mas cobra hora em cada zona e GB processado, enquanto o endpoint de gateway do DynamoDB não cobra nada.' },
        { id: 'd', text: 'Criar um endpoint de interface do SQS, com DNS privado, em sub-redes das duas zonas.', correct: true, consequence: 'O SQS não tem endpoint de gateway; pelo endpoint de interface, cada GB custa US$ 0,01 em vez dos US$ 0,045 do NAT, o que paga as horas com folga.' },
        { id: 'e', text: 'Mover as instâncias para sub-redes públicas e mandar o tráfego pelo internet gateway.', correct: false, consequence: 'Elimina o NAT, mas expõe as instâncias e passa a pagar IPv4 público por hora; o requisito proíbe expor.' },
      ],
      explanation: [
        'O critério é o **menor custo** sem expor as instâncias, e cada serviço tem um caminho próprio. O DynamoDB, como o S3, tem endpoint de gateway: uma rota com a lista de prefixos do serviço, mais específica que a 0.0.0.0/0, que tira o tráfego do NAT e não cobra nada. O SQS só tem endpoint de interface, que processa o GB por US$ 0,01, contra US$ 0,045 no NAT (preços da trilha em us-east-1); com 4.000 GB por mês, a economia passa de US$ 120 mesmo descontando as horas do endpoint nas duas zonas.',
        'Não existe endpoint de gateway do SQS: só o S3 e o DynamoDB têm. O endpoint de interface do DynamoDB funciona, mas cobra hora e GB quando o de gateway é gratuito. E levar as instâncias para sub-redes públicas elimina o NAT à custa de expô-las, que é justamente o que o requisito proíbe.',
        '**Regra prática:** tráfego privado para o S3 ou o DynamoDB vai pelo endpoint de gateway, que é gratuito. Para os outros serviços, olhe o volume: com muitos GB por mês, o endpoint de interface sai mais barato que o NAT; com pouco tráfego, as horas do endpoint podem custar mais que o NAT que já existe.',
      ],
    },
    {
      id: 'rv:net.f05.m2.a1',
      kind: 'decision',
      title: 'Segredos sem NAT e sem mudar o código',
      prompt:
        'Uma aplicação de faturamento roda em instâncias EC2 numa sub-rede privada **sem NAT Gateway**, por exigência da segurança. Ela precisa ler segredos do AWS Secrets Manager pelo endereço padrão do serviço, que o SDK já usa, **sem mudar o código** e sem que o tráfego saia da rede da AWS. A VPC tem os atributos de DNS ligados. Qual configuração atende?',
      concepts: [{ id: 'pl.interface-endpoint' }, { id: 'pl.private-dns' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um endpoint de gateway do Secrets Manager, associado à tabela de rotas da sub-rede.', correct: false, consequence: 'Não existe: endpoint de gateway só há para o S3 e o DynamoDB.' },
        { id: 'b', text: 'Um endpoint de interface do Secrets Manager, com DNS privado desligado, na sub-rede da aplicação.', correct: false, consequence: 'O endpoint existe, mas o nome padrão continua resolvendo para endereços públicos, que a sub-rede sem NAT não alcança; seria preciso mudar o código para o nome do endpoint.' },
        { id: 'c', text: 'Um NAT Gateway numa sub-rede pública, com rota 0.0.0.0/0 na sub-rede da aplicação.', correct: false, consequence: 'Faria a chamada funcionar, mas a segurança proibiu o NAT, e o tráfego seguiria para o endereço público do serviço.' },
        { id: 'd', text: 'Um endpoint de interface do Secrets Manager, com DNS privado ligado, na sub-rede da aplicação.', correct: true, consequence: 'O nome padrão do serviço passa a resolver para os IPs privados do endpoint dentro da VPC: o código não muda e o tráfego não sai da rede da AWS.' },
      ],
      explanation: [
        'Três requisitos se somam: sub-rede **sem NAT**, tráfego dentro da rede da AWS e **código sem mudança**. O endpoint de interface coloca interfaces de rede com IPs privados na sub-rede; com o **DNS privado** ligado, o nome padrão do Secrets Manager passa a resolver, dentro da VPC, para esses IPs. A aplicação chama o mesmo endereço de sempre e chega ao serviço por dentro da VPC.',
        'Sem DNS privado, o endpoint só atende quem usa o nome específico dele, o que exige mudar o código. Endpoint de gateway existe apenas para o S3 e o DynamoDB. E o NAT Gateway foi proibido pela segurança, além de mandar o tráfego para o endereço público do serviço.',
        '**Regra prática:** "sem mudar o código" ou "usar o endereço padrão do serviço" pede DNS privado no endpoint de interface. Ele exige que a VPC tenha ligados os atributos de nomes DNS e de resolução DNS.',
      ],
    },
    {
      id: 'rv:net.f05.m2.a2',
      kind: 'decision',
      title: 'Endpoint de interface e a queda de uma zona',
      prompt:
        'Uma aplicação roda em instâncias de duas zonas atrás de um Application Load Balancer e precisa continuar funcionando se uma zona cair. Para economizar, o endpoint de interface do AWS KMS, que a aplicação usa para descriptografar dados, foi criado com uma sub-rede só, na zona A. As chamadas ao KMS precisam usar apenas endereços privados, sem NAT nem internet gateway. Qual mudança atende ao requisito de **disponibilidade**?',
      concepts: [{ id: 'pl.interface-endpoint' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar um segundo endpoint de interface do KMS, também numa sub-rede da zona A.', correct: false, consequence: 'Duas interfaces na mesma zona caem juntas: o ponto único de falha continua sendo a zona A.' },
        { id: 'b', text: 'Adicionar ao endpoint uma sub-rede da zona B, para ter uma interface em cada zona usada.', correct: true, consequence: 'Com uma interface por zona, a queda da zona A não deixa a zona B sem acesso ao KMS.' },
        { id: 'c', text: 'Criar um NAT Gateway em cada zona e mandar as chamadas ao KMS por eles.', correct: false, consequence: 'Daria redundância, mas por endereços públicos, o que o requisito proíbe.' },
        { id: 'd', text: 'Criar um endpoint de gateway do KMS, para atender a zona B enquanto a zona A estiver fora.', correct: false, consequence: 'Não existe endpoint de gateway do KMS: só o S3 e o DynamoDB têm.' },
      ],
      explanation: [
        'O endpoint de interface cria uma interface de rede em cada sub-rede escolhida, uma por zona. Com uma interface só na zona A, as instâncias da zona B também dependem dela: se a zona A cair, a zona B perde o acesso ao KMS e a aplicação para de descriptografar. Adicionar uma sub-rede da zona B ao endpoint resolve, e é o que a AWS recomenda em produção: pelo menos duas zonas por endpoint.',
        'Um segundo endpoint na zona A repete o mesmo ponto único de falha. Um NAT Gateway em cada zona daria redundância, mas por endereços públicos, que o requisito proíbe. E o KMS não tem endpoint de gateway.',
        '**Regra prática:** o endpoint de interface é zonal: crie uma interface em cada zona onde a aplicação roda. Economizar zonas no endpoint cria um ponto único de falha escondido.',
      ],
    },
    {
      id: 'rv:net.f05.privatelink-dois-sentidos',
      kind: 'decision',
      title: 'Quando o provedor precisa chamar o parceiro',
      prompt:
        'Uma empresa de pagamentos oferece a sua API a dez parceiros pelo AWS PrivateLink: a API fica atrás de um Network Load Balancer, publicada como serviço de endpoint, e cada parceiro criou um endpoint de interface na própria VPC. Agora a empresa também precisa **chamar uma API de cada parceiro**, sem internet, sem peering (os blocos de endereços se sobrepõem) e sem que ninguém enxergue a VPC do outro. Qual solução atende?',
      concepts: [{ id: 'pl.endpoint-service' }, { id: 'pl.interface-endpoint' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Usar os endpoints de interface que já existem nas VPCs dos parceiros, no sentido contrário.', correct: false, consequence: 'Pelo PrivateLink, só quem consome inicia conexões: o serviço não consegue abrir conexões pelos endpoints dos parceiros.' },
        { id: 'b', text: 'Liberar, nos security groups dos endpoints dos parceiros, as conexões iniciadas pela VPC da empresa.', correct: false, consequence: 'Security group não muda o sentido do PrivateLink: o endpoint de interface só recebe conexões iniciadas do lado de quem o criou.' },
        { id: 'c', text: 'Cada parceiro publica sua API como serviço de endpoint, e a empresa cria endpoints para elas.', correct: true, consequence: 'Cada sentido vira um serviço de endpoint próprio, com o consumidor iniciando as conexões e sem roteamento entre as VPCs.' },
        { id: 'd', text: 'Criar um peering com cada parceiro, com rotas apenas para os IPs das APIs deles.', correct: false, consequence: 'Peering não aceita blocos sobrepostos, nem parcialmente, e abriria roteamento entre as VPCs.' },
      ],
      explanation: [
        'O PrivateLink tem sentido único: quem cria o endpoint de interface, o consumidor, inicia as conexões, e o serviço do outro lado só responde. Para a empresa chamar os parceiros, cada parceiro precisa publicar a própria API como serviço de endpoint, com um Network Load Balancer na frente, e a empresa vira consumidora, criando endpoints de interface na sua VPC. Como não há roteamento entre as VPCs, os blocos sobrepostos não atrapalham, e ninguém enxerga a rede do outro.',
        'Os endpoints atuais não servem para o caminho inverso, e nenhum security group muda isso: o limite é do modelo do PrivateLink, não de permissão. O peering exige blocos sem sobreposição e liga as redes, o oposto do que se pede.',
        '**Regra prática:** no PrivateLink, só o consumidor abre conexões. Comunicação nos dois sentidos pede dois serviços de endpoint, um de cada lado.',
      ],
    },
    {
      id: 'rv:net.f05.m2.a3',
      kind: 'decision',
      title: 'Endpoint do S3 sem vazamento de dados',
      prompt:
        'As instâncias de uma corretora acessam o S3 por um endpoint de gateway. A segurança quer duas garantias: pelo endpoint, as instâncias só alcançam **os buckets da corretora**; e esses buckets só aceitam requisições que **chegam por esse endpoint**. Quais configurações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'pl.endpoint-policy' }, { id: 'pl.gateway-endpoint' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Um security group no endpoint de gateway que libere só os buckets da corretora.', correct: false, consequence: 'O endpoint de gateway é uma rota na tabela, não uma interface de rede: não aceita security group.' },
        { id: 'b', text: 'Uma política no endpoint que permite acesso só aos ARNs dos buckets da corretora.', correct: true, consequence: 'O que não está na política do endpoint não passa por ele, qualquer que seja a credencial usada.' },
        { id: 'c', text: 'Uma política no endpoint com o `Principal` igual à role das instâncias, em vez de `"*"`.', correct: false, consequence: 'No endpoint de gateway, o `Principal` precisa ser `"*"`; para limitar quem usa o endpoint, a condição é `aws:PrincipalArn`.' },
        { id: 'd', text: 'Uma bucket policy que nega as requisições cujo `aws:SourceVpce` não seja o id do endpoint.', correct: true, consequence: 'Requisições que não chegam pelo endpoint são negadas, mesmo com credenciais válidas.' },
        { id: 'e', text: 'Rotas nas tabelas das sub-redes apenas para os IPs dos buckets da corretora.', correct: false, consequence: 'Os buckets não têm IPs próprios: a rota do endpoint usa a lista de prefixos do S3 inteiro e não distingue buckets.' },
      ],
      explanation: [
        'As duas garantias olham para lados diferentes. A **política de endpoint** limita o que sai da VPC: permitindo só os ARNs dos buckets da corretora, qualquer requisição a outro bucket é negada no endpoint, mesmo com credenciais de outra conta. A **bucket policy** com a condição `aws:SourceVpce` limita o que entra nos buckets: requisição que não chega por aquele endpoint é negada.',
        'O endpoint de gateway não tem security group, porque é uma rota, não uma interface de rede. Na política dele, o `Principal` precisa ser `"*"`; para restringir quem usa, a condição é `aws:PrincipalArn`. E rotas não filtram buckets: a lista de prefixos é do serviço S3 inteiro.',
        '**Regra prática:** para impedir vazamento de dados pelo S3, combine os dois lados: política de endpoint para alcançar só os seus buckets e bucket policy com `aws:SourceVpce` para aceitar só o seu endpoint. Lembre que essa bucket policy nega também quem chega por outro caminho, como o console.',
      ],
    },
    {
      id: 'rv:net.f05.endpoint-pouco-trafego',
      kind: 'decision',
      title: 'Endpoint de interface para pouco tráfego',
      prompt:
        'Uma empresa mantém um NAT Gateway em cada uma de duas zonas, porque as instâncias privadas baixam atualizações da internet. Essas instâncias também trocam cerca de **50 GB por mês** com o Amazon SQS, pelos mesmos NATs. Um analista propõe criar um endpoint de interface do SQS nas duas zonas para economizar. Com os preços de referência abaixo, e considerando só o **custo mensal** desse tráfego, qual avaliação está correta?',
      exhibits: [
        {
          title: 'Preços de referência (us-east-1, 730 horas por mês)',
          code: 'NAT Gateway             US$ 0,045 por GB processado (as horas já são pagas)\nEndpoint de interface   US$ 0,01 por hora em cada zona\n                        US$ 0,01 por GB processado',
        },
      ],
      concepts: [{ id: 'pl.nat-vs-endpoint' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O endpoint sai mais barato, porque processa cada GB por menos de um quarto do preço do NAT.', correct: false, consequence: 'O preço por GB é menor, mas o endpoint também cobra por hora em cada zona; com só 50 GB, as horas dominam a conta.' },
        { id: 'b', text: 'O endpoint numa zona só fica mais barato que o NAT e mantém a mesma disponibilidade.', correct: false, consequence: 'Numa zona, ainda custaria cerca de US$ 7,80, mais que o NAT, e criaria um ponto único de falha.' },
        { id: 'c', text: 'Continuar pelo NAT sai mais barato: só as horas do endpoint já superam o custo atual.', correct: true, consequence: 'No NAT, os 50 GB custam US$ 2,25; o endpoint custaria US$ 14,60 de horas nas duas zonas, mais US$ 0,50 pelos GB.' },
        { id: 'd', text: 'Um endpoint de gateway do SQS resolve, porque endpoints de gateway não cobram nada.', correct: false, consequence: 'Endpoint de gateway existe só para o S3 e o DynamoDB.' },
      ],
      explanation: [
        'O critério é o **custo** de um tráfego pequeno. O NAT já existe e já é pago por hora, então os 50 GB do SQS custam só o processamento: 50 × US$ 0,045 = US$ 2,25 por mês. O endpoint de interface processa o GB por menos, mas cobra por hora em cada zona: 2 zonas × 730 horas × US$ 0,01 = US$ 14,60, mais US$ 0,50 pelos GB. Para esse volume, o NAT sai mais barato.',
        'Olhar só o preço por GB esconde a parcela fixa do endpoint. Criar o endpoint numa zona só reduz as horas, mas ainda custa mais que o NAT e cria um ponto único de falha. E o SQS não tem endpoint de gateway. Com esses preços, o endpoint de interface nas duas zonas passa a compensar a partir de cerca de 400 GB por mês.',
        '**Regra prática:** o endpoint de gateway (S3 e DynamoDB) é sempre a opção de menor custo. O endpoint de interface tem custo fixo por hora em cada zona: compensa com tráfego alto ou quando o requisito é manter o tráfego em endereços privados, não com poucos GB por mês e um NAT que já existe.',
      ],
    },
  ],
}
