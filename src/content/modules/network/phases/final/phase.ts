/** Desafio final — Projeto de Rede (empresa fictícia: Supermercados Cesta Cheia). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const CESTA_CHEIA: ArchitectureLabConfig = {
  title: 'Relatório do Projeto de Rede',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  groups: [{ id: 'sobra', title: 'Custo ou esforço além do que o requisito pede' }],
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 21/10/2026.',
  steps: [
    {
      id: 'enderecos',
      title: 'Endereçamento e sub-redes',
      intro: 'Os **Supermercados Cesta Cheia** vão criar três VPCs (loja virtual, sistemas internos e dados), que serão ligadas entre si e às 80 lojas físicas, cuja rede usa 10.0.0.0/12. A loja virtual roda em três zonas.',
      questions: [
        {
          id: 'blocos',
          prompt: 'Que blocos usar nas três VPCs?',
          options: [
            { id: 'distintos', label: '10.64.0.0/16, 10.65.0.0/16 e 10.66.0.0/16, fora da faixa das lojas', scores: { requisitos: 1, resiliente: 1, seguro: 1 }, consequence: 'Nenhuma sobreposição: as VPCs e as lojas podem ser ligadas depois.', concepts: ['vpc.cidr', 'tgw.overlap'] },
            { id: 'iguais', label: '10.0.0.0/16 nas três, o padrão do assistente', scores: { requisitos: 0, resiliente: 0.3, seguro: 0.6 }, consequence: 'As três VPCs se sobrepõem entre si e às lojas: nenhuma ligação funciona.', whyNot: 'Redes que serão ligadas precisam de blocos que não se sobreponham.', concepts: ['tgw.overlap'] },
            { id: 'grande', label: 'Um /8 para cada VPC, para nunca faltar', scores: { requisitos: 0, resiliente: 0.3, seguro: 0.6 }, consequence: 'A AWS recusa: o maior bloco de VPC é /16.', whyNot: 'Blocos de VPC vão de /16 a /28.', concepts: ['vpc.cidr'] },
          ],
        },
        {
          id: 'camadas',
          prompt: 'Como organizar as sub-redes da loja virtual?',
          options: [
            { id: 'tres-zonas', label: 'Sub-redes públicas, de aplicação e de banco em cada uma das três zonas', scores: { resiliente: 1, seguro: 1, requisitos: 1 }, consequence: 'Cada camada sobrevive à queda de uma zona, e o banco fica sem acesso direto da internet.', concepts: ['vpc.subnet'] },
            { id: 'uma-grande', label: 'Uma sub-rede pública grande, com tudo dentro', scores: { resiliente: 0.2, seguro: 0.1, requisitos: 0.4 }, consequence: 'Tudo numa zona e exposto: a queda da zona derruba a loja.', whyNot: 'Sub-rede fica numa zona só, e banco não deve ficar em sub-rede pública.', concepts: ['vpc.subnet', 'rt.public-private'] },
          ],
        },
      ],
    },
    {
      id: 'saida',
      title: 'Saída para a internet',
      intro: 'Os servidores de aplicação precisam baixar atualizações e chamar o meio de pagamento, sem receber conexões de fora. A loja usa três zonas.',
      questions: [
        {
          id: 'nat',
          prompt: 'Como dar saída aos servidores de aplicação?',
          options: [
            { id: 'regional', label: 'Um NAT Gateway regional (ou um zonal em cada zona), com as sub-redes de aplicação apontando para ele', scores: { resiliente: 1, seguro: 1, requisitos: 1 }, consequence: 'A saída continua mesmo se uma zona cair, e ninguém de fora inicia conexões.', concepts: ['rt.nat-per-az', 'infra.nat-zonal-regional'] },
            { id: 'um-nat', label: 'Um NAT Gateway zonal na zona A para as três zonas', scores: { resiliente: 0.3, seguro: 1, requisitos: 0.7, custo: 1 }, consequence: 'Se a zona A cair, as outras duas perdem a internet, e cada GB atravessa zonas.', whyNot: 'Um NAT zonal só é ponto único de falha.', concepts: ['rt.nat-per-az'] },
            { id: 'ip-publico', label: 'IP público em cada servidor de aplicação, com rota para o internet gateway', scores: { resiliente: 0.8, seguro: 0.1, requisitos: 0.3, custo: 0.4 }, consequence: 'Os servidores ficam expostos, e cada IPv4 público é cobrado por hora.', whyNot: 'Saída sem entrada é o papel do NAT.', concepts: ['rt.public-private', 'rt.public-ipv4-cost'] },
          ],
        },
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança na VPC',
      intro: 'O banco só pode ser acessado pelos servidores de aplicação, que sobem e descem com o Auto Scaling. A auditoria quer saber quais conexões foram recusadas nos últimos meses.',
      questions: [
        {
          id: 'banco',
          prompt: 'Como liberar o banco?',
          options: [
            { id: 'sg-ref', label: 'Security group do banco aceitando a porta 5432 do security group da aplicação', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'Só as instâncias do grupo da aplicação chegam ao banco, mesmo com IPs mudando.', concepts: ['sg.reference'] },
            { id: 'vpc-toda', label: 'Porta 5432 aberta para o bloco inteiro da VPC', scores: { seguro: 0.4, requisitos: 0.7, resiliente: 1 }, consequence: 'Qualquer recurso da VPC alcança o banco.', whyNot: 'Referenciar o grupo da aplicação libera só quem precisa.', concepts: ['sg.reference'] },
            { id: 'acl', label: 'Só uma network ACL, sem security group restritivo', scores: { seguro: 0.4, requisitos: 0.5, resiliente: 0.6 }, consequence: 'A ACL não conhece grupos de instâncias e exige regras de resposta para cada fluxo.', whyNot: 'O security group é o controle principal; a ACL é a segunda camada.', concepts: ['sg.nacl'] },
          ],
        },
        {
          id: 'registro',
          prompt: 'Como mostrar à auditoria as conexões recusadas?',
          options: [
            { id: 'flow', label: 'VPC Flow Logs enviados ao S3', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'Cada fluxo fica registrado com ACCEPT ou REJECT.', concepts: ['sg.flow-logs'] },
            { id: 'nada', label: 'Recriar os testes quando a auditoria pedir', scores: { seguro: 0.2, requisitos: 0.1, custo: 1 }, consequence: 'Não há registro do que aconteceu nos meses anteriores.', whyNot: 'Só os Flow Logs ligados antes guardam esse histórico.', concepts: ['sg.flow-logs'] },
          ],
        },
      ],
    },
    {
      id: 'vpcs',
      title: 'Conexão entre VPCs',
      intro: 'As três VPCs precisam falar entre si e com as lojas, e o grupo vai incorporar mais VPCs de redes compradas nos próximos anos.',
      questions: [
        {
          id: 'hub',
          prompt: 'Como ligar as VPCs e as lojas?',
          options: [
            { id: 'tgw', label: 'Um Transit Gateway com as VPCs e a conexão das lojas anexadas', scores: { requisitos: 1, resiliente: 1, desempenho: 1 }, consequence: 'Todas as redes se alcançam, e cada VPC nova é só mais um anexo.', concepts: ['tgw.transit-gateway', 'tgw.peering-vs-tgw'] },
            { id: 'peering', label: 'Peering entre as três VPCs, com a conexão das lojas na VPC de sistemas internos', scores: { requisitos: 0.4, resiliente: 0.6, desempenho: 1, custo: 1 }, consequence: 'As VPCs se falam, mas a loja virtual e a de dados não alcançam as lojas pela conexão da VPC vizinha.', whyNot: 'Pelo peering, uma VPC não usa a VPN ou o Direct Connect da outra.', concepts: ['tgw.edge-to-edge', 'tgw.non-transitive'] },
          ],
        },
      ],
    },
    {
      id: 'privado',
      title: 'Acesso privado a serviços',
      intro: 'A VPC de dados envia 30 TB por mês ao S3, e os sistemas internos usam o SQS. A regra de segurança pede que esse tráfego não passe pelo internet gateway.',
      questions: [
        {
          id: 's3',
          prompt: 'Como a VPC de dados chega ao S3?',
          group: 'sobra',
          options: [
            { id: 'gateway', label: 'Endpoint de gateway do S3', scores: { custo: 1, seguro: 1, requisitos: 1 }, consequence: 'Sem custo extra e sem passar pelo internet gateway.', concepts: ['pl.gateway-endpoint', 'pl.nat-vs-endpoint'] },
            { id: 'nat', label: 'Pelo NAT Gateway', scores: { custo: 0.2, seguro: 0.4, requisitos: 0.2 }, consequence: 'Paga o processamento de 30 TB no NAT e passa pelo internet gateway, contra a regra.', whyNot: 'O endpoint de gateway resolve sem custo.', concepts: ['pl.nat-vs-endpoint'] },
            { id: 'interface', label: 'Endpoint de interface do S3', scores: { custo: 0.6, seguro: 1, requisitos: 1 }, consequence: 'Atende à regra, mas paga hora e GB sem necessidade dentro da VPC.', whyNot: 'Dentro da VPC, o endpoint de gateway faz o mesmo sem custo.', concepts: ['pl.gateway-endpoint', 'pl.interface-endpoint'] },
          ],
        },
        {
          id: 'sqs',
          prompt: 'Como os sistemas internos chegam ao SQS?',
          options: [
            { id: 'if', label: 'Endpoint de interface do SQS com DNS privado, em duas zonas', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'O código não muda, e o tráfego não passa pelo internet gateway.', concepts: ['pl.interface-endpoint', 'pl.private-dns'] },
            { id: 'gw', label: 'Endpoint de gateway do SQS', scores: { seguro: 0.5, requisitos: 0, resiliente: 0.5 }, consequence: 'Não existe endpoint de gateway para o SQS.', whyNot: 'Só S3 e DynamoDB têm endpoint de gateway.', concepts: ['pl.gateway-endpoint'] },
          ],
        },
      ],
    },
    {
      id: 'lojas',
      title: 'Conexão com as lojas',
      intro: 'O centro de distribuição precisa de 5 Gbps estáveis para a VPC, e o sistema de pedidos não pode parar se um local do Direct Connect cair. As lojas pequenas precisam de conexão criptografada em poucos dias.',
      questions: [
        {
          id: 'cd',
          prompt: 'Como ligar o centro de distribuição?',
          options: [
            { id: 'dx-dois', label: 'Direct Connect em dois locais diferentes', scores: { resiliente: 1, desempenho: 1, requisitos: 1 }, consequence: 'Banda estável e resistência à queda de um local inteiro.', concepts: ['hyb.direct-connect', 'hyb.dx-resiliency'] },
            { id: 'dx-um', label: 'Um Direct Connect dedicado de 10 Gbps', scores: { resiliente: 0.3, desempenho: 1, requisitos: 0.5, custo: 1 }, consequence: 'Banda de sobra, mas um único local é ponto único de falha.', whyNot: 'O requisito pede resistir à queda de um local.', concepts: ['hyb.dx-resiliency'] },
            { id: 'vpn', label: 'Uma Site-to-Site VPN', scores: { resiliente: 0.6, desempenho: 0.2, requisitos: 0.3, custo: 1 }, consequence: 'Passa pela internet, com latência variável e até 1,25 Gbps por túnel.', whyNot: 'Banda estável de 5 Gbps pede o Direct Connect.', concepts: ['hyb.vpn-bandwidth'] },
          ],
        },
        {
          id: 'pequenas',
          prompt: 'Como ligar as lojas pequenas?',
          options: [
            { id: 'vpn-tgw', label: 'Site-to-Site VPN de cada loja para o Transit Gateway', scores: { requisitos: 1, seguro: 1, custo: 1 }, consequence: 'Fica pronta em dias, é criptografada e alcança todas as VPCs.', concepts: ['hyb.site-to-site-vpn'] },
            { id: 'dx-loja', label: 'Um Direct Connect hospedado em cada loja', scores: { requisitos: 0.3, seguro: 0.6, custo: 0.2 }, consequence: 'Não fica pronto em poucos dias, não é criptografado por padrão e custa muito para lojas pequenas.', whyNot: 'Prazo curto e criptografia pedem VPN.', concepts: ['hyb.direct-connect', 'hyb.dx-encryption'] },
          ],
        },
      ],
    },
    {
      id: 'dns',
      title: 'DNS e entrega de conteúdo',
      intro: 'A loja virtual roda em São Paulo e na Virgínia. O domínio cestacheia.com deve levar cada cliente à Região mais rápida, e as fotos dos produtos estão num bucket do S3.',
      questions: [
        {
          id: 'roteamento',
          prompt: 'Como configurar o domínio?',
          options: [
            { id: 'alias-lat', label: 'Registros alias com política de latência, apontando para os balanceadores das duas Regiões, com saúde do alvo avaliada', scores: { desempenho: 1, resiliente: 1, requisitos: 1, custo: 1 }, consequence: 'Cada cliente vai à Região mais rápida, e uma Região sem saúde sai da resposta.', concepts: ['dns.alias', 'dns.latency'] },
            { id: 'cname', label: 'Um CNAME no ápice apontando para o balanceador de São Paulo', scores: { desempenho: 0.4, resiliente: 0.3, requisitos: 0 }, consequence: 'CNAME no ápice da zona não é permitido.', whyNot: 'No ápice, use alias.', concepts: ['dns.alias'] },
            { id: 'geo', label: 'Geolocalização, com o Brasil em São Paulo e o resto na Virgínia, sem registro padrão', scores: { desempenho: 0.6, resiliente: 0.5, requisitos: 0.5 }, consequence: 'Locais sem registro e IPs sem local conhecido ficam sem resposta.', whyNot: 'Para a Região mais rápida, a política é a de latência.', concepts: ['dns.geolocation'] },
          ],
        },
        {
          id: 'fotos',
          prompt: 'Como entregar as fotos dos produtos?',
          options: [
            { id: 'cf-oac', label: 'CloudFront com origin access control, bucket privado', scores: { desempenho: 1, seguro: 1, custo: 1, requisitos: 1 }, consequence: 'Fotos em cache perto do cliente, e ninguém acessa o bucket direto.', concepts: ['edge.cloudfront', 'cdn.oac'] },
            { id: 'publico', label: 'Bucket público acessado direto pelos clientes', scores: { desempenho: 0.4, seguro: 0.2, custo: 0.6, requisitos: 0.5 }, consequence: 'Cada foto vai e volta de uma Região, e o bucket fica exposto.', whyNot: 'CloudFront com OAC entrega mais rápido e mantém o bucket privado.', concepts: ['cdn.oac'] },
          ],
        },
      ],
    },
    {
      id: 'borda',
      title: 'Proteção de borda e custo',
      intro: 'A loja já sofreu tentativas de injeção de SQL e um ataque DDoS na última promoção. O grupo tem 25 contas e quer as mesmas regras em todas.',
      questions: [
        {
          id: 'waf',
          prompt: 'Como proteger a aplicação?',
          options: [
            { id: 'waf-fm', label: 'WAF com regras gerenciadas e regra por taxa no CloudFront, aplicado a todas as contas pelo Firewall Manager', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'Injeção de SQL e robôs barrados em todas as contas, inclusive nas novas.', concepts: ['edgesec.waf-managed', 'edgesec.firewall-manager', 'edgesec.rate-based'] },
            { id: 'acl', label: 'Network ACLs negando os IPs dos ataques anteriores', scores: { seguro: 0.3, requisitos: 0.2, resiliente: 0.4 }, consequence: 'Os ataques seguintes vêm de outros IPs, e a ACL não enxerga injeção de SQL.', whyNot: 'Injeção de SQL se barra no WAF.', concepts: ['sg.nacl', 'edgesec.waf'] },
          ],
        },
        {
          id: 'ddos',
          prompt: 'Que proteção contra DDoS contratar?',
          group: 'sobra',
          options: [
            { id: 'advanced', label: 'Shield Advanced nos recursos da borda, com suporte Business, pela exigência de resposta especializada e créditos', scores: { seguro: 1, resiliente: 1, requisitos: 1 }, consequence: 'Equipe de resposta e créditos de custo na próxima promoção.', concepts: ['edgesec.shield-advanced'] },
            { id: 'standard', label: 'Só o Shield Standard, que já vem sem custo', scores: { seguro: 0.6, resiliente: 0.6, requisitos: 0.4, custo: 1 }, consequence: 'Cobre os ataques comuns de rede, mas não traz equipe de resposta nem créditos, que a diretoria exigiu.', whyNot: 'A diretoria pediu resposta especializada e proteção de custo.', concepts: ['edgesec.shield-standard'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'sobreposicao',
      when: [
        ['blocos', ['iguais']],
        ['hub', ['tgw', 'peering']],
      ],
      penalty: { requisitos: 0.3 },
      message: 'Blocos sobrepostos e a ligação entre as VPCs: nem o peering nem o Transit Gateway roteiam entre redes com os mesmos endereços.',
      concepts: ['tgw.overlap'],
    },
    {
      id: 'borda-a-borda',
      when: [
        ['hub', ['peering']],
        ['pequenas', ['vpn-tgw']],
      ],
      penalty: { requisitos: 0.3 },
      message: 'As VPNs das lojas terminam num Transit Gateway que não liga as VPCs, e o peering não deixa as VPCs usarem a conexão das outras.',
      concepts: ['tgw.edge-to-edge'],
    },
    {
      id: 'exposto',
      when: [
        ['nat', ['ip-publico']],
        ['banco', ['vpc-toda', 'acl']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Servidores de aplicação com IP público e banco aberto para a VPC inteira: quem comprometer um servidor exposto chega direto ao banco.',
      concepts: ['rt.public-private', 'sg.reference'],
    },
  ],
}

export const FINAL_NET: PhaseDef = {
  ...META.final,
  concepts: [
    'vpc.cidr',
    'vpc.subnet',
    'tgw.overlap',
    'rt.public-private',
    'rt.nat-per-az',
    'infra.nat-zonal-regional',
    'rt.public-ipv4-cost',
    'sg.reference',
    'sg.nacl',
    'sg.flow-logs',
    'tgw.transit-gateway',
    'tgw.peering-vs-tgw',
    'tgw.edge-to-edge',
    'tgw.non-transitive',
    'pl.gateway-endpoint',
    'pl.nat-vs-endpoint',
    'pl.interface-endpoint',
    'pl.private-dns',
    'hyb.direct-connect',
    'hyb.dx-resiliency',
    'hyb.vpn-bandwidth',
    'hyb.site-to-site-vpn',
    'hyb.dx-encryption',
    'dns.alias',
    'dns.latency',
    'dns.geolocation',
    'edge.cloudfront',
    'cdn.oac',
    'edgesec.waf',
    'edgesec.waf-managed',
    'edgesec.rate-based',
    'edgesec.firewall-manager',
    'edgesec.shield-standard',
    'edgesec.shield-advanced',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa, as redes e os números são fictícios.'],
  missions: [
    {
      id: 'net.final.projeto',
      title: 'Projeto Supermercados Cesta Cheia',
      type: 'final',
      summary: 'Oito etapas de decisões de rede, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Supermercados Cesta Cheia',
        role: 'Você é a pessoa responsável pela arquitetura de rede de uma rede de supermercados.',
        situation: 'Três VPCs novas, 80 lojas físicas, um centro de distribuição, uma loja virtual em duas Regiões, tráfego pesado para o S3, ataques recentes e 25 contas para proteger.',
        objective: 'Escolher endereços, saída, segurança, conexões, acesso privado, ligação com as lojas, DNS e proteção que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'net.choose', body: ['Cada decisão de rede depende das anteriores: blocos sobrepostos impedem as ligações, o peering não compartilha a VPN e um servidor exposto abre caminho para o banco. O relatório aponta esses conflitos.'] },
        { conceptId: 'tgw.transit-gateway' },
      ],
      activities: [
        {
          id: 'net.final.projeto.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Projeto de Rede',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'vpc.cidr' }, { id: 'rt.nat-per-az' }, { id: 'sg.reference' }, { id: 'tgw.transit-gateway' }, { id: 'pl.gateway-endpoint' }, { id: 'hyb.dx-resiliency' }, { id: 'dns.latency' }, { id: 'edgesec.waf-managed' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar uma ou duas opções.', 'Antes de ligar redes, confira se os blocos não se sobrepõem.'],
          explanation: [
            'Projeto de referência: blocos distintos fora da faixa das lojas, sub-redes por camada nas três zonas, NAT regional (ou um por zona), security group do banco referenciando a aplicação e Flow Logs no S3.',
            'Transit Gateway com as VPCs e as lojas; endpoint de gateway para o S3 e de interface para o SQS; Direct Connect em dois locais para o centro de distribuição e VPN para as lojas pequenas; alias com latência e CloudFront com OAC; WAF pelo Firewall Manager e Shield Advanced.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: CESTA_CHEIA,
        },
      ],
      debrief: { takeaways: ['Planeje os endereços antes de qualquer ligação.', 'Saída sem entrada, menor privilégio na VPC e registros para a auditoria.', 'Transit Gateway para muitas redes; endpoints para os serviços; Direct Connect em dois locais para o que não pode parar.', 'Alias e latência para a Região certa, CloudFront para o conteúdo, WAF e Shield na borda.'] },
    },
  ],
}
