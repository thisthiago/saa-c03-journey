/**
 * Conceitos da Fase 1 — VPC e endereçamento.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F01_NET_CONCEPTS: ConceptDef[] = [
  {
    id: 'vpc.what',
    title: 'VPC: a rede privada na AWS',
    officialName: 'Amazon Virtual Private Cloud (Amazon VPC)',
    serviceIds: ['aws.vpc'],
    summary: 'Uma **VPC** é uma rede virtual isolada logicamente, numa **Região**. Dentro dela você cria **sub-redes**, cada uma numa zona de disponibilidade, e decide o caminho do tráfego com tabelas de rotas, gateways, security groups e network ACLs.',
    facts: [
      'A VPC vale para toda a Região; cada sub-rede fica inteira dentro de uma zona de disponibilidade e não se estende a outra.',
      'Separar VPCs isola cargas ou áreas da empresa; separar sub-redes isola as camadas da aplicação (web, aplicação, banco).',
      'Toda VPC precisa de um bloco IPv4; blocos IPv6 são opcionais.',
    ],
    commonMistakes: ['Achar que uma sub-rede pode atravessar duas zonas de disponibilidade'],
    exam: { domains: ['d1', 'd2'], relevance: 'alta' },
    references: [R.subnets, R.sgCompare],
    tags: ['fundamentos', 'seguranca'],
  },
  {
    id: 'vpc.cidr',
    title: 'Bloco CIDR da VPC',
    officialName: 'VPC CIDR blocks',
    serviceIds: ['aws.vpc'],
    summary: 'O endereço da VPC é um **bloco CIDR** IPv4 entre **/16** (65.536 endereços) e **/28** (16 endereços). A AWS recomenda faixas privadas da **RFC 1918** (10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16). O tamanho de um bloco já criado **não muda**: para crescer, adicione blocos secundários.',
    facts: [
      'Não podem ser usados 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16 e 224.0.0.0/4.',
      'Blocos secundários também vão de /16 a /28 e não podem se sobrepor aos blocos já associados à VPC.',
      'O bloco primário, usado na criação, não pode ser removido.',
      'Alguns serviços usam 172.17.0.0/16; a AWS recomenda evitar essa faixa para não haver conflito.',
      'Pela API, um bloco desalinhado vira a forma canônica: 100.68.0.18/18 é criado como 100.68.0.0/18.',
    ],
    commonMistakes: ['Pedir uma VPC /8 para "nunca faltar endereço": o maior bloco é /16', 'Escolher o mesmo bloco do escritório e depois não conseguir ligar as redes'],
    recommendations: ['Antes de criar a VPC, reserve faixas que não se sobreponham às do escritório nem às de outras VPCs que um dia serão conectadas.'],
    exam: { domains: ['d1', 'd2'], relevance: 'alta' },
    references: [R.cidrBlocks],
    tags: ['fundamentos'],
  },
  {
    id: 'vpc.subnet',
    title: 'Sub-redes',
    officialName: 'Subnets',
    serviceIds: ['aws.vpc'],
    summary: 'Uma **sub-rede** é uma faixa de endereços da VPC numa **única zona de disponibilidade**. O bloco vai de **/16 a /28**, fica dentro do bloco da VPC e **não pode se sobrepor** ao de outra sub-rede da mesma VPC.',
    facts: [
      'Toda sub-rede se associa a uma tabela de rotas; sem associação explícita, vale a tabela principal da VPC.',
      'Toda sub-rede se associa a uma network ACL; sem associação explícita, vale a ACL padrão.',
      'O tipo da sub-rede vem das rotas: pública (rota direta ao internet gateway), privada (sem essa rota), só VPN ou isolada (sem rotas para fora da VPC).',
      'Para resistir à falha de uma zona, distribua os recursos em sub-redes de zonas diferentes.',
    ],
    commonMistakes: ['Criar duas sub-redes com blocos que se sobrepõem', 'Colocar todos os recursos numa sub-rede só, numa zona só'],
    exam: { domains: ['d1', 'd2'], relevance: 'alta' },
    references: [R.subnets, R.subnetSizing],
    tags: ['fundamentos', 'disponibilidade'],
  },
  {
    id: 'vpc.reserved-ips',
    title: 'Os cinco endereços reservados',
    officialName: 'Reserved IP addresses in a subnet',
    serviceIds: ['aws.vpc'],
    summary: 'Em toda sub-rede, a AWS reserva os **quatro primeiros endereços e o último**: rede, roteador da VPC, servidor DNS, uso futuro e broadcast. Uma /24 tem 256 endereços e **251** utilizáveis; uma /28 tem 16 e **11** utilizáveis.',
    facts: [
      'Exemplo da documentação para 10.0.0.0/24: 10.0.0.0 (rede), 10.0.0.1 (roteador), 10.0.0.2 (DNS), 10.0.0.3 (uso futuro) e 10.0.0.255 (broadcast, que a VPC não suporta).',
      'O servidor DNS da AWS fica no endereço base da VPC mais dois.',
      'Em IPv6 também ficam reservados os quatro primeiros endereços e o último de cada sub-rede.',
    ],
    commonMistakes: ['Dimensionar uma sub-rede para 16 instâncias com um /28'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.subnetSizing],
    tags: ['fundamentos'],
  },
  {
    id: 'vpc.ipv6',
    title: 'IPv6 na VPC',
    officialName: 'IPv6 CIDR blocks',
    serviceIds: ['aws.vpc'],
    summary: 'A VPC pode ter blocos **IPv6**, opcionais, e as sub-redes recebem partes deles. Os endereços IPv6 fornecidos pela AWS são **globalmente únicos e anunciados na internet**: com rota para o internet gateway, a internet pode iniciar conexões com eles.',
    facts: [
      'Uma VPC aceita até cinco blocos IPv6, de /44 a /60 em passos de /4; a AWS pode fornecer o bloco, e você não escolhe a faixa.',
      'Sub-redes IPv6 vão de /44 a /64, em passos de /4.',
      'Uma sub-rede pode ser só IPv4, de pilha dupla (IPv4 e IPv6) ou só IPv6.',
    ],
    commonMistakes: ['Achar que IPv6 numa sub-rede "privada" fica escondido como um IPv4 privado'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.cidrBlocks, R.subnets, R.ipAddressing],
    tags: ['fundamentos'],
  },
  {
    id: 'vpc.default-vpc',
    title: 'VPC padrão',
    officialName: 'Default VPC',
    serviceIds: ['aws.vpc'],
    summary: 'Cada Região já tem uma **VPC padrão** com bloco **172.31.0.0/16**, uma **sub-rede pública /20 em cada zona**, internet gateway e rota 0.0.0.0/0 para ele. Instâncias nas sub-redes padrão recebem **IPv4 público** automaticamente. Serve para começar rápido, não para produção planejada.',
    facts: [
      'A VPC padrão também traz um security group padrão, uma network ACL padrão e o conjunto padrão de opções DHCP.',
      'Uma VPC criada por você não tem internet gateway nem rota para a internet até que você os adicione.',
      'A VPC padrão pode ser alterada como qualquer outra.',
    ],
    commonMistakes: ['Colocar um banco de dados de produção na VPC padrão, em sub-rede pública'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.defaultVpc, R.defaultVpcComponents, R.igw],
    tags: ['fundamentos', 'seguranca'],
  },
]
