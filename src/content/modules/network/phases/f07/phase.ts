/**
 * Fase 7 — DNS com Route 53. Zonas hospedadas, alias × CNAME, políticas de
 * roteamento, verificações de saúde, failover e o Resolver para DNS híbrido.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { DnsPolicyLabConfig } from '../../../../../simulators/dns/policy'
import type { DnsRecord } from '../../../../../simulators/dns/model'
import { META } from '../meta'
import { GEO_NESTED, HYBRID_DNS_BOARD, WHAT_DECIDES } from './diagrams'

const LEITOR_BR = { country: 'BR', continent: 'SA', latency: { 'sa-east-1': 18, 'us-east-1': 125, 'eu-west-1': 190 } }

const WEIGHTED: DnsRecord[] = [
  { id: 'atual', label: 'site atual', policy: 'weighted', weight: 9 },
  { id: 'novo', label: 'site novo', policy: 'weighted', weight: 1 },
]

export const AGORA_POLICIES: DnsPolicyLabConfig = {
  itemsLabel: 'Requisitos do portal',
  options: ['simple', 'weighted', 'latency', 'failover', 'geolocation', 'geoproximity', 'multivalue', 'ip-based'],
  items: [
    { id: 'blog', text: 'O blog da redação roda num único servidor', dominant: 'single', needs: ['single'], concepts: ['dns.routing-policies'] },
    { id: 'beta', text: 'Mandar 5% dos leitores para a versão nova do site e aumentar aos poucos', dominant: 'split-percent', needs: ['split-percent'], concepts: ['dns.weighted'] },
    { id: 'regioes', text: 'O portal roda em São Paulo, na Virgínia e na Irlanda, e cada leitor deve cair na Região mais rápida para ele', dominant: 'lowest-latency', needs: ['lowest-latency'], concepts: ['dns.latency'] },
    { id: 'reserva', text: 'Se o portal cair, mostrar uma página estática de aviso guardada no S3', dominant: 'active-passive', needs: ['active-passive'], concepts: ['dns.failover'] },
    { id: 'direitos', text: 'Vídeos de futebol só podem ser servidos aos leitores do Brasil, por contrato', dominant: 'by-country', needs: ['by-country'], concepts: ['dns.geolocation'] },
    { id: 'deslocar', text: 'Levar mais tráfego para o novo data center da Irlanda, ampliando a área geográfica que ele atende', dominant: 'by-resource-location', needs: ['by-resource-location'], concepts: ['dns.geolocation'] },
    { id: 'ips', text: 'O serviço de notificações tem seis servidores, sem balanceador; o DNS deve devolver só os saudáveis', dominant: 'many-healthy', needs: ['many-healthy'], concepts: ['dns.multivalue'] },
    { id: 'provedor', text: 'Assinantes de um provedor parceiro, identificados pela faixa de IP, devem ir para um servidor exclusivo', dominant: 'by-client-ip', needs: ['by-client-ip'], concepts: ['dns.routing-policies'] },
  ],
}

export const F07_NET: PhaseDef = {
  ...META.f07,
  concepts: ['edge.route53', 'dns.hosted-zones', 'dns.alias', 'dns.routing-policies', 'dns.weighted', 'dns.latency', 'dns.geolocation', 'dns.multivalue', 'dns.failover', 'dns.health-checks', 'dns.resolver'],
  availability: 'available',
  simplifications: ['A política ponderada é mostrada pela proporção esperada, e não por um sorteio.', 'As latências entre os leitores e as Regiões são premissas do cenário.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f07.m1',
      title: 'O nome do portal',
      type: 'mission',
      summary: 'Zonas hospedadas pública e privada e registro alias.',
      briefing: {
        company: 'Portal de Notícias Agora',
        role: 'Você cuida do DNS de um portal de notícias.',
        situation: 'O portal migrou para um balanceador de carga e quer que agoranoticias.com, sem www, aponte para ele. A equipe interna também quer nomes fáceis para o banco e para o painel interno, sem publicá-los na internet.',
        objective: 'Apontar o domínio para o balanceador e criar os nomes internos.',
        successCriteria: ['Usar alias no ápice da zona', 'Separar nomes públicos e internos'],
      },
      intel: [
        { conceptId: 'dns.alias', body: ['O **alias** aponta para recursos da AWS, funciona no **ápice da zona** (agoranoticias.com) e **não cobra** as consultas a recursos da AWS. O **CNAME** não pode ficar no ápice.'] },
        { conceptId: 'dns.hosted-zones', body: ['Zona **pública**: responde à internet. Zona **privada**: responde só dentro das VPCs associadas.'] },
      ],
      activities: [
        {
          id: 'net.f07.m1.a1',
          kind: 'decision',
          title: 'O domínio sem www',
          prompt: 'Como fazer agoranoticias.com apontar para o Application Load Balancer?',
          concepts: [{ id: 'dns.alias' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O CNAME não pode ter o mesmo nome da zona. O alias pode, aponta para o balanceador, acompanha a troca de IP dele e não cobra a consulta.'],
          options: [
            { id: 'a', text: 'Um registro alias do tipo A apontando para o balanceador', correct: true, consequence: 'Funciona no ápice, sem custo por consulta.' },
            { id: 'b', text: 'Um CNAME agoranoticias.com apontando para o nome do balanceador', correct: false, consequence: 'CNAME no ápice da zona não é permitido.' },
            { id: 'c', text: 'Um registro A com os IPs atuais do balanceador', correct: false, consequence: 'Os IPs do balanceador mudam, e o registro fica errado.' },
          ],
        },
        {
          id: 'net.f07.m1.a2',
          kind: 'classify',
          title: 'Alias ou CNAME',
          prompt: 'Classifique cada característica.',
          concepts: [{ id: 'dns.alias' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O alias é uma extensão do Route 53: funciona no ápice, não cobra consultas a recursos da AWS e aponta só para recursos selecionados. O CNAME pode apontar para qualquer nome, até fora do Route 53, e é cobrado.'],
          bins: [
            { id: 'alias', label: 'Registro alias' },
            { id: 'cname', label: 'CNAME' },
          ],
          items: [
            { id: 'apex', text: 'Pode ficar no ápice da zona', bin: 'alias', explanation: 'O CNAME não pode.', concepts: ['dns.alias'] },
            { id: 'free', text: 'Consultas a recursos da AWS não são cobradas', bin: 'alias', explanation: 'O Route 53 cobra as consultas CNAME.', concepts: ['dns.alias'] },
            { id: 'any', text: 'Aponta para qualquer nome, até em outro provedor de DNS', bin: 'cname', explanation: 'O alias só aponta para recursos selecionados da AWS ou para registros da mesma zona.', concepts: ['dns.alias'] },
            { id: 'two', text: 'Não pode existir junto com outros registros do mesmo nome', bin: 'cname', explanation: 'Um nome com CNAME não pode ter outros registros, como MX ou TXT. Por isso o CNAME não fica no ápice, que precisa dos registros SOA e NS.', concepts: ['dns.alias'] },
          ],
        },
        {
          id: 'net.f07.m1.a3',
          kind: 'decision',
          title: 'Os nomes internos',
          prompt: 'A equipe quer usar banco.interno.agoranoticias.com dentro da VPC, sem que ninguém na internet consiga resolver esse nome. O que criar?',
          concepts: [{ id: 'dns.hosted-zones' }, { id: 'edge.route53', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Uma zona hospedada privada, associada à VPC, responde só às consultas feitas de dentro dela.'],
          options: [
            { id: 'a', text: 'Uma zona hospedada privada associada à VPC', correct: true, consequence: 'O nome resolve dentro da VPC e não existe na internet.' },
            { id: 'b', text: 'Registros na zona pública com IPs privados', correct: false, consequence: 'Qualquer um na internet descobre os nomes e endereços internos.' },
            { id: 'c', text: 'Registros na zona pública, num subdomínio difícil de adivinhar', correct: false, consequence: 'Quem descobrir o nome resolve o endereço: esconder o nome não impede a resolução pela internet.' },
          ],
        },
      ],
      debrief: { takeaways: ['Ápice da zona para recurso da AWS: alias.', 'Alias não cobra consultas a recursos da AWS.', 'Nomes internos: zona hospedada privada.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f07.m2',
      title: 'Cada leitor no lugar certo',
      type: 'mission',
      summary: 'As políticas ponderada, de latência, de geolocalização e de múltiplas respostas.',
      briefing: {
        company: 'Portal de Notícias Agora',
        role: 'Você escolhe como o Route 53 responde a cada leitor.',
        situation: 'O portal vai testar o site novo com parte dos leitores, roda em três Regiões e tem um acordo que restringe vídeos a alguns países.',
        objective: 'Prever a resposta do Route 53 em cada política.',
        successCriteria: ['Calcular a proporção da ponderada', 'Lembrar do registro padrão na geolocalização'],
      },
      intel: [
        {
          conceptId: 'dns.routing-policies',
          body: [
            'Cada política responde a uma pergunta diferente. Duas delas aparecem menos: a **geoproximidade** decide pela distância entre o usuário e o **recurso**, e um **viés** (bias) amplia ou reduz a área que cada recurso atende; a **baseada em IP** decide pela **faixa de IP** de quem pergunta.',
          ],
          diagram: WHAT_DECIDES,
        },
        { conceptId: 'dns.weighted', body: ['A proporção de cada registro é o **peso dele dividido pela soma dos pesos**.'] },
        { conceptId: 'dns.latency', body: ['A política de **latência** responde com a Região que tem a **menor latência medida** entre a rede do usuário e a AWS. Não é a distância no mapa nem uma Região padrão.'] },
        { conceptId: 'dns.geolocation', body: ['Vence o registro da **área mais específica** que contém o usuário: para um leitor brasileiro, o registro do Brasil vence o da América do Sul. Sem **registro padrão**, quem está num local sem registro fica **sem resposta**.'], diagram: GEO_NESTED },
        { conceptId: 'dns.multivalue', body: ['A política de **múltiplas respostas** devolve até **oito** registros saudáveis, escolhidos ao acaso. Ela espalha a carga, mas não substitui um balanceador.'] },
      ],
      activities: [
        {
          id: 'net.f07.m2.a1',
          kind: 'predict',
          title: 'O teste do site novo',
          prompt: 'Registros ponderados: site atual com peso 9, site novo com peso 1. Que porcentagem dos leitores vai para o site novo?',
          concepts: [{ id: 'dns.weighted' }],
          xp: 40,
          difficulty: 1,
          explanation: ['1 ÷ (9 + 1) = 10%.'],
          spec: { sim: 'dns', records: WEIGHTED, client: LEITOR_BR, query: 'share', record: 'novo' },
          options: [
            { id: 'a', text: '10%', outcome: '10' },
            { id: 'b', text: '1%', outcome: '1' },
            { id: 'c', text: '11,1%', outcome: '11.11' },
          ],
        },
        {
          id: 'net.f07.m2.a2',
          kind: 'predict',
          title: 'Três Regiões',
          prompt: 'O portal usa a política de latência com registros em São Paulo (sa-east-1), na Virgínia (us-east-1) e na Irlanda (eu-west-1). Para um leitor no Brasil, a latência até São Paulo é de 18 ms, até a Virgínia, de 125 ms, e até a Irlanda, de 190 ms. Qual registro ele recebe?',
          concepts: [{ id: 'dns.latency' }, { id: 'dns.routing-policies', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['A política de latência escolhe a Região com a menor latência medida para o usuário: São Paulo.'],
          spec: {
            sim: 'dns',
            records: [
              { id: 'sp', label: 'São Paulo', policy: 'latency', region: 'sa-east-1' },
              { id: 'va', label: 'Virgínia', policy: 'latency', region: 'us-east-1' },
              { id: 'ie', label: 'Irlanda', policy: 'latency', region: 'eu-west-1' },
            ],
            client: LEITOR_BR,
            query: 'answer',
          },
          options: [
            { id: 'a', text: 'São Paulo', outcome: 'sp' },
            { id: 'b', text: 'Virgínia, a Região padrão', outcome: 'va' },
            { id: 'c', text: 'Os três, para o navegador escolher', outcome: 'sp+va+ie' },
          ],
        },
        {
          id: 'net.f07.m2.a3',
          kind: 'predict',
          title: 'O leitor na França',
          prompt: 'Os vídeos usam geolocalização com registros para o Brasil e para a América do Sul, e nenhum registro padrão. Um leitor na França pede o vídeo. O que o Route 53 responde?',
          concepts: [{ id: 'dns.geolocation' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Não há registro para a França, para a Europa nem registro padrão: o Route 53 responde "sem resposta". Um registro padrão cobriria esse caso.'],
          spec: {
            sim: 'dns',
            records: [
              { id: 'br', label: 'servidor Brasil', policy: 'geolocation', location: 'BR' },
              { id: 'sa', label: 'servidor América do Sul', policy: 'geolocation', location: 'SA' },
            ],
            client: { country: 'FR', continent: 'EU' },
            query: 'answer',
          },
          options: [
            { id: 'a', text: 'Sem resposta', outcome: 'none' },
            { id: 'b', text: 'O registro da América do Sul, o mais próximo', outcome: 'sa' },
            { id: 'c', text: 'O registro do Brasil, o primeiro criado', outcome: 'br' },
          ],
        },
        {
          id: 'net.f07.m2.a4',
          kind: 'predict',
          title: 'Os servidores de notificação',
          prompt: 'Três registros de múltiplas respostas apontam para os servidores A, B e C, com verificação de saúde. B não está saudável. O que o Route 53 devolve?',
          concepts: [{ id: 'dns.multivalue' }, { id: 'dns.health-checks', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['A política de múltiplas respostas devolve até oito registros saudáveis. B fica de fora.'],
          spec: {
            sim: 'dns',
            records: [
              { id: 'a', label: 'servidor A', policy: 'multivalue', healthy: true },
              { id: 'b', label: 'servidor B', policy: 'multivalue', healthy: false },
              { id: 'c', label: 'servidor C', policy: 'multivalue', healthy: true },
            ],
            client: LEITOR_BR,
            query: 'answer',
          },
          options: [
            { id: 'a', text: 'A e C', outcome: 'a+c' },
            { id: 'b', text: 'A, B e C', outcome: 'a+b+c' },
            { id: 'c', text: 'Só A', outcome: 'a' },
          ],
        },
        {
          id: 'net.f07.m2.a5',
          kind: 'decision',
          title: 'Mais leitores para a Irlanda',
          prompt: 'O portal abriu um data center na Irlanda e quer que ele atenda leitores de uma área maior ao redor dele, tirando parte dos que hoje vão para outros lugares. Cada leitor deve continuar indo para o recurso mais próximo, e a equipe não quer manter uma lista de países. O que usar?',
          concepts: [{ id: 'dns.routing-policies' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A geoproximidade decide pela distância entre o leitor e cada recurso. Um viés positivo no registro da Irlanda amplia a área que ele atende, sem listar países.'],
          options: [
            { id: 'a', text: 'Geoproximidade, com um viés positivo no registro da Irlanda', correct: true, consequence: 'O viés amplia a área da Irlanda com um número só.' },
            { id: 'b', text: 'Geolocalização, com um registro para cada país vizinho da Irlanda', correct: false, consequence: 'Funciona país a país, mas é a lista que a equipe não quer manter.' },
            { id: 'c', text: 'Ponderada, com peso maior no registro da Irlanda', correct: false, consequence: 'O peso divide os leitores em proporção, sem olhar onde eles estão: leitores do Brasil iriam para a Irlanda.' },
            { id: 'd', text: 'Latência, que manda cada leitor para a Região mais rápida', correct: false, consequence: 'A latência segue a medição e não deixa ampliar a área de um recurso.' },
          ],
        },
      ],
      debrief: { takeaways: ['Ponderada: peso dividido pela soma dos pesos.', 'Latência: a Região mais rápida para o usuário.', 'Geolocalização sem registro padrão deixa locais sem resposta.', 'Múltiplas respostas: até oito saudáveis.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f07.m3',
      title: 'Quando o portal cai',
      type: 'mission',
      summary: 'Failover, verificações de saúde e DNS entre a VPC e a redação.',
      briefing: {
        company: 'Portal de Notícias Agora',
        role: 'Você prepara o portal para falhas e liga o DNS da redação à AWS.',
        situation: 'Num pico de acessos, o portal caiu e os leitores viram erro. A diretoria quer uma página de aviso automática. A redação, ligada por VPN, precisa resolver os nomes da zona privada, e os servidores da VPC precisam resolver os nomes internos da redação.',
        objective: 'Configurar o failover e o DNS híbrido.',
        successCriteria: ['Prever o failover', 'Verificar a saúde de recurso privado', 'Escolher os endpoints do Resolver'],
      },
      intel: [
        { conceptId: 'dns.failover', body: ['No **failover**, o primário responde enquanto está saudável; quando deixa de estar, entra o **secundário**.'] },
        { conceptId: 'dns.health-checks', body: ['A verificação de saúde pode olhar um **endpoint**, **outras verificações** ou um **alarme do CloudWatch**. Os verificadores de endpoint ficam na **internet**: só alcançam o que a internet alcança.'] },
        {
          conceptId: 'dns.resolver',
          body: [
            'Toda VPC tem o **Route 53 Resolver** no endereço base da VPC **mais dois** (10.70.0.2 numa VPC 10.70.0.0/16). Ele só atende quem está dentro da VPC.',
            'Um **endpoint de entrada** dá à empresa IPs dentro da VPC para onde mandar consultas. Um **endpoint de saída**, com **regras de encaminhamento** por domínio, manda consultas da VPC para o DNS da empresa.',
          ],
        },
      ],
      activities: [
        {
          id: 'net.f07.m3.a1',
          kind: 'predict',
          title: 'O primário caiu',
          prompt: 'Failover: o primário é o balanceador do portal, e o secundário é o site estático de aviso no S3. O primário não está saudável, e o secundário está. O que o Route 53 responde?',
          concepts: [{ id: 'dns.failover' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Com o primário não saudável, o Route 53 passa a responder com o secundário.'],
          spec: {
            sim: 'dns',
            records: [
              { id: 'portal', label: 'balanceador do portal', policy: 'failover', failover: 'primary', healthy: false },
              { id: 'aviso', label: 'site de aviso no S3', policy: 'failover', failover: 'secondary', healthy: true },
            ],
            client: LEITOR_BR,
            query: 'answer',
          },
          options: [
            { id: 'a', text: 'O site de aviso no S3', outcome: 'aviso' },
            { id: 'b', text: 'O balanceador, porque é o primário', outcome: 'portal' },
            { id: 'c', text: 'Sem resposta, até alguém intervir', outcome: 'none' },
          ],
        },
        {
          id: 'net.f07.m3.a2',
          kind: 'decision',
          title: 'A saúde do servidor privado',
          prompt: 'O sistema de comentários roda numa sub-rede privada, sem acesso pela internet. Como o Route 53 pode saber se ele está saudável?',
          concepts: [{ id: 'dns.health-checks' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A verificação de endpoint vem da internet e não alcança o servidor privado. Uma verificação baseada num alarme do CloudWatch acompanha uma métrica do serviço.'],
          options: [
            { id: 'a', text: 'Uma verificação de saúde baseada num alarme do CloudWatch', correct: true, consequence: 'O Route 53 acompanha a métrica, sem precisar alcançar o servidor.' },
            { id: 'b', text: 'Uma verificação de endpoint apontando para o IP privado', correct: false, consequence: 'Os verificadores estão na internet e não alcançam o IP privado.' },
            { id: 'c', text: 'Não há como: recursos privados não têm verificação', correct: false, consequence: 'O alarme do CloudWatch resolve esse caso.' },
          ],
        },
        {
          id: 'net.f07.m3.a4',
          kind: 'build',
          title: 'O DNS da redação e da VPC',
          prompt: 'Monte o DNS híbrido: a redação precisa resolver os nomes da zona privada, e os servidores da VPC precisam resolver os nomes de redacao.local. Arraste cada peça para onde ela fica; as que não servem vão para "Não entra nesta rede".',
          scenario: ['A redação chega à VPC por uma VPN. O Resolver da VPC, no endereço 10.70.0.2, só responde a quem está dentro da VPC.'],
          concepts: [{ id: 'dns.resolver' }],
          xp: 60,
          difficulty: 3,
          explanation: [
            'Da redação para a AWS: o servidor DNS da redação encaminha os nomes da zona privada para os IPs do endpoint de entrada, que os entrega ao Resolver.',
            'Da AWS para a redação: uma regra de encaminhamento diz ao Resolver que os nomes de redacao.local vão para o DNS da redação, pelo endpoint de saída.',
          ],
          board: HYBRID_DNS_BOARD,
          pieces: [
            { id: 'inbound', text: 'Endpoint de entrada do Resolver', explanation: 'Dá à redação IPs dentro da VPC para onde mandar as consultas da zona privada, pela VPN.', concepts: ['dns.resolver'] },
            { id: 'outbound', text: 'Endpoint de saída do Resolver', explanation: 'É por onde as consultas da VPC saem em direção ao DNS da redação.', concepts: ['dns.resolver'] },
            { id: 'rule', text: 'Regra de encaminhamento: redacao.local para o DNS da redação', explanation: 'Diz ao Resolver que os nomes de redacao.local vão para o DNS da redação, pelo endpoint de saída.', concepts: ['dns.resolver'] },
            { id: 'cond', text: 'Encaminhador condicional: interno.agoranoticias.com para o endpoint de entrada', explanation: 'No DNS da redação, manda as consultas dos nomes da zona privada para os IPs do endpoint de entrada.', concepts: ['dns.resolver'] },
            { id: 'dot2', text: 'Apontar o DNS da redação para 10.70.0.2', explanation: 'O Resolver no endereço base mais dois só atende quem está dentro da VPC. A redação precisa do endpoint de entrada.', concepts: ['dns.resolver'] },
            { id: 'pubzone', text: 'Zona hospedada pública com os nomes internos', explanation: 'Publicaria os nomes internos para a internet inteira.', concepts: ['dns.resolver'] },
            { id: 'igw', text: 'Internet gateway para chegar ao DNS da redação', explanation: 'O DNS da redação é privado e fica do outro lado da VPN: a internet não chega a ele.', concepts: ['dns.resolver'] },
          ],
          slots: [
            { id: 'red', label: 'No servidor DNS da redação', x: 30, y: 170, w: 210, h: 150, expect: { cond: 1 }, explanation: 'O DNS da redação precisa saber que os nomes da zona privada são resolvidos pelo endpoint de entrada.' },
            { id: 'in', label: 'Na VPC, recebendo consultas da redação', x: 350, y: 118, w: 200, h: 100, expect: { inbound: 1 }, explanation: 'As consultas da redação chegam à VPC pelo endpoint de entrada.' },
            { id: 'out', label: 'Na VPC, mandando consultas para a redação', x: 350, y: 236, w: 200, h: 100, expect: { outbound: 1, rule: 1 }, explanation: 'As consultas da VPC para redacao.local saem pelo endpoint de saída, guiadas pela regra de encaminhamento.' },
          ],
        },
      ],
      debrief: { takeaways: ['Failover: secundário quando o primário deixa de estar saudável.', 'Recurso privado: verificação por alarme do CloudWatch.', 'DNS híbrido: endpoints de entrada e de saída do Resolver.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f07.boss',
      title: 'As políticas do portal',
      type: 'boss',
      summary: 'Oito requisitos, uma política de roteamento para cada.',
      briefing: {
        company: 'Portal de Notícias Agora',
        role: 'Você define as políticas de DNS de todo o portal.',
        situation: 'Blog, testes, três Regiões, página de aviso, direitos de transmissão, data center novo, notificações e um provedor parceiro: cada parte tem uma necessidade.',
        objective: 'Escolher a política certa para cada requisito.',
        successCriteria: ['A política que atende ao requisito, a mais simples possível'],
      },
      intel: [{ conceptId: 'dns.routing-policies', body: ['Local do **usuário**: geolocalização. Local dos **recursos**: geoproximidade. Faixa de **IP**: baseada em IP. **Velocidade**: latência.'] }],
      activities: [
        {
          id: 'net.f07.boss.a1',
          kind: 'lab',
          lab: 'dns-policy',
          title: 'Oito políticas',
          prompt: 'Posicione cada requisito na política de roteamento que o atende.',
          concepts: [{ id: 'dns.routing-policies' }, { id: 'dns.weighted' }, { id: 'dns.latency' }, { id: 'dns.failover' }, { id: 'dns.geolocation' }, { id: 'dns.multivalue' }],
          xp: 200,
          difficulty: 3,
          hints: ['Contrato por país é sobre onde está o leitor.', 'Ampliar a área de um data center é sobre onde está o recurso.'],
          explanation: [
            'Blog: simples. Teste de 5%: ponderada. Três Regiões: latência. Página de aviso: failover.',
            'Direitos por país: geolocalização. Data center novo: geoproximidade. Seis servidores sem balanceador: múltiplas respostas. Provedor parceiro: baseada em IP.',
          ],
          config: AGORA_POLICIES,
        },
      ],
      debrief: { takeaways: ['Cada política responde a uma pergunta: proporção, velocidade, reserva, local do usuário, local do recurso, faixa de IP ou saúde.'] },
    },
  ],
}
