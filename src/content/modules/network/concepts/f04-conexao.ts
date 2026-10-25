/**
 * Conceitos da Fase 4 — Conectando VPCs.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F04_NET_CONCEPTS: ConceptDef[] = [
  {
    id: 'tgw.peering',
    title: 'VPC peering',
    officialName: 'VPC peering connections',
    serviceIds: ['aws.vpc'],
    summary: 'O **peering** liga **duas VPCs** com endereços privados, na mesma conta ou em outra, na mesma Região ou em outra. Uma VPC pede, a outra aceita, e **cada lado adiciona rotas** para o bloco do vizinho. Não há gateway nem custo por hora.',
    commonMistakes: ['Aceitar o peering e esquecer as rotas nos dois lados'],
    facts: [
      'Só pode haver um peering entre o mesmo par de VPCs.',
      'Um pedido não aceito expira em 7 dias.',
      'Na mesma Região, um security group pode referenciar um grupo da VPC vizinha.',
      'O peering entre Regiões tem MTU de 8.500 bytes; na mesma Região, 9.001.',
    ],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'alta',
      notes: 'Sinal: "ligar duas VPCs com tráfego privado e sem custo por hora". A resposta é o peering, com rotas nos dois lados e security groups que permitam o tráfego.',
    },
    references: [R.peering],
    tags: ['fundamentos'],
  },
  {
    id: 'tgw.non-transitive',
    title: 'Peering não é transitivo',
    officialName: 'No transitive peering',
    serviceIds: ['aws.vpc'],
    summary: 'Se A tem peering com B e com C, **B não alcança C passando por A**. Para B falar com C, é preciso **outro peering** entre eles, ou um **Transit Gateway**. Com muitas VPCs, a malha completa cresce rápido: 10 VPCs pedem 45 peerings.',
    commonMistakes: ['Montar uma VPC central com peerings para todas e esperar que elas conversem entre si por ela'],
    facts: ['A documentação mostra o caso de A ligada a B e a C: o tráfego de B para C não passa por A.', 'Com n VPCs, a malha completa precisa de n × (n − 1) / 2 peerings.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'alta',
      notes: 'Se o enunciado descreve uma VPC central com peerings e espera que as outras conversem entre si por ela, isso não funciona: a resposta é criar um peering entre cada par ou usar um Transit Gateway.',
    },
    references: [R.peering],
    tags: ['fundamentos'],
  },
  {
    id: 'tgw.edge-to-edge',
    title: 'Sem roteamento de borda a borda',
    officialName: 'No edge to edge routing',
    serviceIds: ['aws.vpc'],
    summary: 'Pelo peering, a VPC B **não usa** o internet gateway, o NAT, a VPN, o Direct Connect nem o endpoint de gateway da VPC A. Cada VPC precisa da sua própria saída, ou de um **Transit Gateway** que centralize esses caminhos.',
    facts: ['Se a VPC A tem VPN com a empresa, recursos da VPC B não usam essa VPN pelo peering.', 'Recursos da VPC B não usam o endpoint de gateway do S3 da VPC A.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinal: "várias VPCs precisam usar a mesma saída para a internet ou a mesma VPN". Pelo peering, isso não funciona; a resposta é um Transit Gateway com a saída centralizada.',
    },
    references: [R.peering],
    tags: ['fundamentos', 'hibrido'],
  },
  {
    id: 'tgw.overlap',
    title: 'Blocos sobrepostos não se conectam',
    officialName: 'Overlapping CIDR blocks',
    serviceIds: ['aws.vpc'],
    summary: 'Não dá para criar peering entre VPCs com blocos **iguais ou sobrepostos**, mesmo que só parte deles se sobreponha. No Transit Gateway, blocos sobrepostos também entram em conflito nas rotas. Planejar os endereços **antes** evita refazer redes inteiras.',
    commonMistakes: ['Criar todas as VPCs com 10.0.0.0/16, o padrão do assistente, e depois precisar ligá-las'],
    facts: ['Se qualquer bloco IPv4 das duas VPCs se sobrepõe, o peering não é criado, mesmo que se pretenda usar só os outros blocos.', 'VPCs ligadas ao mesmo Direct Connect gateway também não podem ter blocos sobrepostos.'],
    recommendations: ['Para oferecer um serviço a uma VPC com blocos sobrepostos, use um serviço de endpoint do PrivateLink.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'alta',
      notes: 'Se as VPCs já têm blocos sobrepostos e só um serviço precisa ser compartilhado, a resposta é o PrivateLink (um serviço de endpoint), que não depende de blocos diferentes.',
    },
    references: [R.peering, R.cidrBlocks],
    tags: ['fundamentos'],
  },
  {
    id: 'tgw.transit-gateway',
    title: 'Transit Gateway',
    officialName: 'AWS Transit Gateway',
    serviceIds: ['aws.transit-gateway'],
    summary: 'O **Transit Gateway** é um **roteador regional**: cada VPC, VPN ou Direct Connect gateway se **anexa** a ele uma vez, e ele roteia entre todos. É a resposta para **muitas VPCs** e para **centralizar** a saída e a conexão com a empresa. Cobra **por hora de anexo** e **por GB processado**.',
    explanation: [
      'Pense num aeroporto central: em vez de voos diretos entre todas as cidades, cada cidade tem um voo para o centro, e as conexões acontecem lá. O limite da comparação: o Transit Gateway só deixa passar o que as tabelas de rotas dele permitem, e cada GB que passa por ele é cobrado.',
      'Exemplo: uma empresa tem 30 VPCs em várias contas e uma VPN com o escritório. Com peering, seriam 435 conexões entre VPCs e uma VPN por VPC; com o Transit Gateway, são 30 anexos de VPC e um anexo de VPN.',
    ],
    commonMistakes: ['Anexar a VPC numa sub-rede de uma zona só e não alcançar recursos de outra zona'],
    facts: [
      'Anexos possíveis: VPCs, conexões VPN, Direct Connect gateways, anexos Connect e peering entre Transit Gateways (inclusive de outra Região).',
      'O anexo de VPC exige uma sub-rede em cada zona que precise alcançar o Transit Gateway.',
      'Para somar banda de VPN, o Transit Gateway aceita ECMP com roteamento dinâmico.',
      'Um Transit Gateway pode ser compartilhado com outras contas pelo AWS RAM.',
    ],
    exam: {
      domains: ['d2', 'd3', 'd4'],
      relevance: 'alta',
      notes: 'Sinais: "dezenas de VPCs", "topologia hub-and-spoke", "conectar todas as VPCs e o data center" e "inspeção ou saída centralizada". A resposta é o Transit Gateway.',
    },
    references: [R.tgwHow, R.tgwWhat],
    tags: ['fundamentos', 'hibrido'],
  },
  {
    id: 'tgw.route-tables',
    title: 'Tabelas de rotas do Transit Gateway',
    officialName: 'Transit gateway route tables',
    serviceIds: ['aws.transit-gateway'],
    summary: 'Cada anexo se **associa** a uma tabela do Transit Gateway (que decide para onde ele pode mandar) e **propaga** as próprias rotas para uma ou mais tabelas. Com **tabelas separadas**, VPCs de produção e de desenvolvimento ficam **isoladas** entre si e ainda alcançam os serviços compartilhados.',
    commonMistakes: ['Deixar todos os anexos na tabela padrão e permitir que desenvolvimento alcance produção'],
    facts: [
      'O Transit Gateway vem com uma tabela padrão de associação e de propagação.',
      'Uma rota estática vence uma propagada com o mesmo destino.',
      'Uma rota blackhole descarta o tráfego que casa com ela.',
    ],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinal: "isolar as VPCs de desenvolvimento das de produção, deixando as duas acessarem serviços compartilhados". A resposta são tabelas de rotas separadas no Transit Gateway.',
    },
    references: [R.tgwHow],
    tags: ['seguranca'],
  },
  {
    id: 'tgw.peering-vs-tgw',
    title: 'Peering ou Transit Gateway',
    officialName: 'Choosing VPC peering or AWS Transit Gateway',
    serviceIds: ['aws.vpc', 'aws.transit-gateway'],
    summary: 'Para **poucas VPCs** que só precisam falar entre si, o **peering** é simples e não cobra por hora. Para **muitas VPCs**, rede da empresa compartilhada, isolamento por tabelas ou saída centralizada, o **Transit Gateway** reduz o número de conexões a manter.',
    recommendations: ['Conte as conexões: com peering, cada par de VPCs precisa de um; com o Transit Gateway, cada rede precisa de um anexo.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Questões de conexão entre VPCs comparam os dois pela quantidade: poucas VPCs, sem requisito de centralização, apontam para o peering, mais barato; muitas VPCs, conexão compartilhada com a empresa ou isolamento por tabelas apontam para o Transit Gateway.',
    },
    references: [R.peering, R.tgwHow],
    tags: ['custos'],
  },
]
