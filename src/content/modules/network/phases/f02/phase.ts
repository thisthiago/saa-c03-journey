/**
 * Fase 2 — Roteamento e saída para a internet. Tabelas de rotas, a rota mais
 * específica, internet gateway, sub-rede pública e privada, NAT Gateway (zonal,
 * regional e por zona), NAT instance, egress-only internet gateway e o custo do
 * IPv4 público.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { RouteTableLabConfig } from '../../../../../simulators/vpcnet/routing'
import { META } from '../meta'
import { EGRESS_ONLY, EXIT_BOARD, NAT_PER_ZONE, PUBLIC_PRIVATE } from './diagrams'

const TABLE = [
  { destination: '10.40.0.0/16', target: 'local' },
  { destination: '172.31.0.0/16', target: 'pcx-escritorio' },
  { destination: '0.0.0.0/0', target: 'igw' },
]

export const PONTO_CERTO_ROUTES: RouteTableLabConfig = {
  ipv6: true,
  subnets: [
    { id: 'pub-a', name: 'pública A (balanceador)', az: 'a', v4: 'in-out', concepts: ['rt.igw', 'rt.public-private'] },
    { id: 'pub-b', name: 'pública B (balanceador)', az: 'b', v4: 'in-out', concepts: ['rt.igw', 'rt.public-private'] },
    { id: 'app-a', name: 'aplicação A', az: 'a', v4: 'out-only', v6: 'out-only', concepts: ['rt.nat-gateway', 'rt.nat-per-az', 'rt.eigw'] },
    { id: 'app-b', name: 'aplicação B', az: 'b', v4: 'out-only', v6: 'out-only', concepts: ['rt.nat-gateway', 'rt.nat-per-az', 'rt.eigw'] },
    { id: 'db-a', name: 'banco A', az: 'a', v4: 'none', concepts: ['rt.public-private'] },
  ],
  nats: [
    { id: 'nat-a', name: 'NAT Gateway A', subnet: 'pub-a', az: 'a' },
    { id: 'nat-b', name: 'NAT Gateway B', subnet: 'pub-b', az: 'b' },
  ],
}

export const F02_NET: PhaseDef = {
  ...META.f02,
  concepts: ['rt.route-table', 'rt.longest-prefix', 'rt.igw', 'rt.public-private', 'rt.public-ipv4-cost', 'rt.nat-gateway', 'rt.nat-per-az', 'infra.nat-zonal-regional', 'rt.nat-instance', 'rt.eigw'],
  availability: 'available',
  simplifications: ['O laboratório considera só a rota para a internet de cada sub-rede; security groups e ACLs ficam para a fase seguinte.', 'Endereços e nomes de recursos são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f02.m1',
      title: 'Para onde vai o pacote',
      type: 'mission',
      summary: 'A tabela de rotas, a rota local e a regra do prefixo mais específico.',
      briefing: {
        company: 'Varejo Ponto Certo',
        role: 'Você investiga um tráfego que não vai para onde a equipe esperava.',
        situation: 'A VPC da loja ganhou um peering (uma ligação privada e direta entre duas VPCs, que a fase 4 detalha) com uma VPC antiga do escritório, de bloco 172.31.0.0/16, e uma rota 0.0.0.0/0 para o internet gateway. Alguém jura que o tráfego para o escritório está saindo pela internet.',
        objective: 'Prever o alvo de cada destino lendo a tabela de rotas.',
        successCriteria: ['Aplicar a regra do prefixo mais específico', 'Saber que a ordem das linhas não decide nada'],
      },
      intel: [
        { conceptId: 'rt.route-table', body: ['Cada rota tem **destino** e **alvo**. A rota **local** já vem pronta e cobre o bloco da VPC.'] },
        {
          conceptId: 'rt.longest-prefix',
          body: [
            'Se várias rotas cobrem o destino, vence a **mais específica**: uma /16 vence a 0.0.0.0/0.',
            'Se duas rotas têm o mesmo prefixo, a **estática** (escrita por você na tabela) vence a **propagada** (instalada sozinha por um gateway de VPN, assunto da fase 6). O **Transit Gateway**, um roteador central entre VPCs que aparece na fase 4, também pode ser alvo de uma rota estática.',
          ],
        },
      ],
      activities: [
        {
          id: 'net.f02.m1.a1',
          kind: 'predict',
          title: 'Rumo ao escritório',
          prompt: 'Para onde vai um pacote destinado a 172.31.4.5?',
          concepts: [{ id: 'rt.longest-prefix' }],
          xp: 40,
          difficulty: 1,
          explanation: ['172.31.4.5 está coberto por 172.31.0.0/16 e por 0.0.0.0/0. A /16 é mais específica e vence: o pacote vai pelo peering.'],
          exhibits: [{ title: 'Tabela de rotas da sub-rede', code: '10.40.0.0/16   local\n172.31.0.0/16  pcx-escritorio\n0.0.0.0/0      igw' }],
          spec: { sim: 'route', routes: TABLE, destination: '172.31.4.5' },
          options: [
            { id: 'a', text: 'Pelo peering com o escritório', outcome: 'pcx-escritorio' },
            { id: 'b', text: 'Pelo internet gateway, que cobre todos os destinos', outcome: 'igw' },
            { id: 'c', text: 'Pela rota local', outcome: 'local' },
          ],
        },
        {
          id: 'net.f02.m1.a2',
          kind: 'predict',
          title: 'Dentro de casa',
          prompt: 'Com a mesma tabela, para onde vai um pacote destinado a 10.40.2.9, outra sub-rede da própria VPC?',
          concepts: [{ id: 'rt.route-table' }],
          xp: 40,
          difficulty: 1,
          explanation: ['A rota local cobre todo o bloco da VPC e é mais específica que 0.0.0.0/0. O tráfego entre sub-redes da mesma VPC nunca sai da VPC.'],
          exhibits: [{ title: 'Tabela de rotas da sub-rede', code: '10.40.0.0/16   local\n172.31.0.0/16  pcx-escritorio\n0.0.0.0/0      igw' }],
          spec: { sim: 'route', routes: TABLE, destination: '10.40.2.9' },
          options: [
            { id: 'a', text: 'Pela rota local, sem sair da VPC', outcome: 'local' },
            { id: 'b', text: 'Pelo internet gateway e de volta', outcome: 'igw' },
          ],
        },
        {
          id: 'net.f02.m1.a3',
          kind: 'predict',
          title: 'Duas rotas para o mesmo bloco',
          prompt: 'A tabela tem duas rotas com o destino 192.168.10.0/24: uma estática, para o Transit Gateway, e uma propagada pela VPN. Para onde vai um pacote destinado a 192.168.10.7?',
          concepts: [{ id: 'rt.longest-prefix' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Os dois prefixos são iguais. No empate, a rota estática vence a propagada, e o tráfego vai para o Transit Gateway.'],
          spec: {
            sim: 'route',
            routes: [
              { destination: '10.40.0.0/16', target: 'local' },
              { destination: '192.168.10.0/24', target: 'vgw', kind: 'propagated' },
              { destination: '192.168.10.0/24', target: 'tgw' },
            ],
            destination: '192.168.10.7',
          },
          options: [
            { id: 'a', text: 'Para o Transit Gateway: a rota estática vence a propagada', outcome: 'tgw' },
            { id: 'b', text: 'Para a VPN: rotas propagadas têm prioridade', outcome: 'vgw' },
          ],
        },
        {
          id: 'net.f02.m1.a4',
          kind: 'decision',
          title: 'A ordem das linhas',
          prompt: 'A equipe quer "subir" a rota do peering para a primeira linha da tabela, para que ela tenha prioridade. Isso muda alguma coisa?',
          concepts: [{ id: 'rt.longest-prefix' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A prioridade vem do prefixo mais específico (e, no empate, do tipo da rota), e não da posição da linha.'],
          options: [
            { id: 'a', text: 'Não: quem decide é o prefixo mais específico, e não a posição', correct: true, consequence: 'O tráfego para 172.31.0.0/16 já vai pelo peering.' },
            { id: 'b', text: 'Sim: a primeira rota que casa é a que vale', correct: false, consequence: 'Esse é o comportamento das network ACLs, e não das tabelas de rotas.' },
          ],
        },
      ],
      debrief: { takeaways: ['A rota local cobre o bloco da VPC.', 'O prefixo mais específico vence; no empate, a estática vence a propagada.', 'A posição da linha na tabela não decide nada.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f02.m2',
      title: 'Pública ou privada',
      type: 'mission',
      summary: 'O internet gateway, o que faz uma sub-rede ser pública e o custo do IPv4 público.',
      briefing: {
        company: 'Varejo Ponto Certo',
        role: 'Você explica à equipe o que torna uma sub-rede pública.',
        situation: 'Uma instância numa sub-rede "pública" não acessa a internet; outra, numa sub-rede "privada", tem IP público e também não. E a fatura mostra dezenas de IPv4 públicos em servidores que ninguém acessa de fora.',
        objective: 'Saber o que cada instância precisa para falar com a internet e cortar IPs públicos desnecessários.',
        successCriteria: ['Reconhecer sub-redes públicas e privadas pela tabela', 'Saber o papel do IP público'],
      },
      intel: [
        { conceptId: 'rt.public-private', body: ['A sub-rede é **pública** quando a tabela dela tem **rota direta para o internet gateway**, e **privada** quando não tem. O nome da sub-rede não muda nada.'], diagram: PUBLIC_PRIVATE },
        { conceptId: 'rt.igw', body: ['Para falar com a internet pelo **internet gateway**, a instância precisa de **IP público** e a sub-rede, de **rota**. O gateway não tem custo nem limite de banda.'] },
        { conceptId: 'rt.public-ipv4-cost', body: ['**Todo IPv4 público é cobrado por hora**, inclusive Elastic IPs. Instância que não é acessada de fora não precisa de um.'] },
      ],
      activities: [
        {
          id: 'net.f02.m2.a1',
          kind: 'classify',
          title: 'Que sub-rede é esta?',
          prompt: 'Classifique cada sub-rede pela tabela de rotas dela.',
          concepts: [{ id: 'rt.public-private' }],
          xp: 50,
          difficulty: 1,
          explanation: ['Só a rota direta para o internet gateway torna a sub-rede pública. Rota para NAT Gateway, só a rota local ou IP público nas instâncias não mudam isso.'],
          bins: [
            { id: 'public', label: 'Pública' },
            { id: 'private', label: 'Privada' },
          ],
          items: [
            { id: 'igw', text: 'Tabela com 0.0.0.0/0 para o internet gateway', bin: 'public', explanation: 'Rota direta para o internet gateway: pública.', concepts: ['rt.public-private'] },
            { id: 'nat', text: 'Tabela com 0.0.0.0/0 para um NAT Gateway', bin: 'private', explanation: 'Sai pelo NAT, mas não tem rota direta ao internet gateway: privada.', concepts: ['rt.public-private'] },
            { id: 'local', text: 'Tabela só com a rota local', bin: 'private', explanation: 'Sem nenhuma rota para fora, é privada (e isolada).', concepts: ['rt.public-private'] },
            { id: 'ip', text: 'Instâncias com IP público, mas tabela sem rota para o internet gateway', bin: 'private', explanation: 'O IP público sozinho não cria caminho: a sub-rede continua privada.', concepts: ['rt.public-private'] },
          ],
        },
        {
          id: 'net.f02.m2.a2',
          kind: 'decision',
          title: 'Rota certa, e nada sai',
          prompt: 'Uma instância numa sub-rede com rota 0.0.0.0/0 para o internet gateway não acessa a internet. O security group libera a saída. O que falta?',
          concepts: [{ id: 'rt.igw' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Para falar com a internet pelo internet gateway, a instância precisa de um IPv4 público ou Elastic IP. O gateway traduz o IP privado para o público dela.'],
          options: [
            { id: 'a', text: 'Um IPv4 público ou Elastic IP na instância', correct: true, consequence: 'Com o IP público, o internet gateway faz a tradução e o tráfego sai.' },
            { id: 'b', text: 'Um NAT Gateway na mesma sub-rede da instância', correct: false, consequence: 'O NAT serve a instâncias de sub-redes privadas. Esta sub-rede já tem rota para o internet gateway; o que falta é o IP público da instância.' },
            { id: 'c', text: 'Uma regra de entrada no security group para as respostas', correct: false, consequence: 'O security group guarda o estado da conexão: as respostas do que a instância iniciou voltam sem regra de entrada.' },
          ],
        },
        {
          id: 'net.f02.m2.a3',
          kind: 'decision',
          title: 'Quarenta IPs públicos',
          prompt: 'Quarenta servidores de aplicação, numa sub-rede privada atrás do balanceador, têm IPv4 público. Ninguém os acessa de fora, e a sub-rede já sai para a internet por um NAT Gateway. O que fazer?',
          concepts: [{ id: 'rt.public-ipv4-cost' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A AWS cobra todo IPv4 público por hora. Numa sub-rede privada, esses endereços nem dão acesso à internet: só geram custo. A saída já vai pelo NAT Gateway.'],
          options: [
            { id: 'a', text: 'Tirar os IPs públicos e deixar a saída pelo NAT Gateway', correct: true, consequence: 'A conta de IPv4 cai e nada muda no funcionamento.' },
            { id: 'b', text: 'Trocar os IPs públicos por Elastic IPs, que são gratuitos', correct: false, consequence: 'Elastic IPs também são cobrados por hora.' },
            { id: 'c', text: 'Manter: IPs públicos só custam quando há tráfego', correct: false, consequence: 'A cobrança é por hora, com ou sem tráfego.' },
          ],
        },
      ],
      debrief: { takeaways: ['Pública é a sub-rede com rota direta para o internet gateway.', 'Pelo internet gateway, a instância precisa de IP público.', 'IPv4 público é cobrado por hora: não dê um a quem não precisa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f02.m3',
      title: 'Sair sem ser visto',
      type: 'mission',
      summary: 'NAT Gateway, um por zona ou regional, NAT instance e egress-only internet gateway.',
      briefing: {
        company: 'Varejo Ponto Certo',
        role: 'Você dá saída à internet para os servidores de aplicação, sem expô-los.',
        situation: 'Os servidores de aplicação precisam baixar atualizações e chamar a API do meio de pagamento, mas não podem receber conexões de fora. A loja usa duas zonas, e a equipe quer economizar com um NAT só.',
        objective: 'Escolher o caminho de saída e decidir quantos NAT Gateways usar.',
        successCriteria: ['Pôr o NAT Gateway no lugar certo', 'Avaliar o risco de um NAT só', 'Dar saída em IPv6 sem expor as instâncias'],
      },
      intel: [
        { conceptId: 'rt.nat-gateway', body: ['O **NAT Gateway público** fica numa **sub-rede pública**, com **Elastic IP**. As instâncias privadas saem por ele; ninguém de fora inicia conexão. Cobra por hora e por GB.'] },
        { conceptId: 'rt.nat-per-az', body: ['Por padrão, o NAT Gateway é **zonal**: fica numa zona e numa sub-rede. Se o NAT da zona A cai junto com ela, quem estava na zona B e usava esse NAT perde a internet. A saída é **um por zona**, ou o **NAT regional**.'], diagram: NAT_PER_ZONE },
        { conceptId: 'infra.nat-zonal-regional', body: ['O **NAT Gateway regional** não fica numa sub-rede pública: ele está presente nas zonas em que a VPC tem recursos e se expande sozinho quando eles aparecem numa zona nova. A expansão não é imediata.'] },
        { conceptId: 'rt.nat-instance', body: ['A **NAT instance** é uma instância EC2 que você configura para fazer NAT. Como ela repassa tráfego de outras instâncias, exige a **verificação de origem e destino desligada**. Banda, atualizações e alta disponibilidade ficam com você; a AWS recomenda o NAT Gateway.'] },
        { conceptId: 'rt.eigw', body: ['Em **IPv6**, quem faz o papel de "só saída" é o **egress-only internet gateway**, sem custo.'], diagram: EGRESS_ONLY },
      ],
      activities: [
        {
          id: 'net.f02.m3.a5',
          kind: 'build',
          title: 'A saída da VPC',
          prompt: 'Monte a saída para a internet da VPC da loja: arraste os gateways, os NAT Gateways e as rotas para os lugares certos. O que não deve existir nesta rede vai para "Não entra nesta rede".',
          scenario: [
            'Os balanceadores ficam nas sub-redes públicas e recebem os clientes. Os servidores de aplicação só saem para a internet, em IPv4 e em IPv6, e não podem receber conexões de fora.',
            'Os NAT Gateways são zonais: cada um fica numa zona e numa sub-rede. A loja não pode perder a internet de uma zona quando a outra cair.',
          ],
          concepts: [{ id: 'rt.nat-gateway' }, { id: 'rt.nat-per-az' }, { id: 'rt.eigw' }],
          xp: 60,
          difficulty: 2,
          explanation: [
            'Os dois gateways se ligam à VPC. As sub-redes públicas têm a rota 0.0.0.0/0 para o internet gateway, e cada uma recebe o NAT da sua zona, que sai por essa mesma rota.',
            'As sub-redes de aplicação mandam 0.0.0.0/0 para o NAT da própria zona e ::/0 para o egress-only internet gateway. Assim elas saem nas duas famílias de endereços, e ninguém de fora inicia conexão com elas.',
          ],
          board: EXIT_BOARD,
          pieces: [
            { id: 'igw', text: 'Internet gateway', glyph: 'globe', explanation: 'Liga a VPC à internet nos dois sentidos e fica na borda da VPC.', concepts: ['rt.nat-gateway'] },
            { id: 'eigw', text: 'Egress-only internet gateway', glyph: 'route', explanation: 'Dá saída em IPv6 sem aceitar conexões iniciadas de fora. Também se liga à VPC inteira.', concepts: ['rt.eigw'] },
            { id: 'nat', text: 'NAT Gateway (zonal)', glyph: 'router', count: 2, explanation: 'O NAT zonal fica numa sub-rede pública, com Elastic IP. Um em cada zona evita que a queda de uma zona tire a internet da outra.', concepts: ['rt.nat-gateway', 'rt.nat-per-az'] },
            { id: 'rt-igw', text: 'Rota 0.0.0.0/0 para o internet gateway', count: 2, explanation: 'É o que torna a sub-rede pública. Sem ela, nem o balanceador nem o NAT que mora ali alcançam a internet.', concepts: ['rt.nat-gateway'] },
            { id: 'rt-nat-a', text: 'Rota 0.0.0.0/0 para o NAT da zona a', explanation: 'É da aplicação A: ela usa o NAT da própria zona e continua saindo se a zona b cair.', concepts: ['rt.nat-per-az'] },
            { id: 'rt-nat-b', text: 'Rota 0.0.0.0/0 para o NAT da zona b', explanation: 'É da aplicação B: ela usa o NAT da própria zona e continua saindo se a zona a cair.', concepts: ['rt.nat-per-az'] },
            { id: 'rt-eigw', text: 'Rota ::/0 para o egress-only internet gateway', count: 2, explanation: 'Em IPv6 os endereços são públicos. Pelo egress-only, a aplicação sai e recebe as respostas, mas ninguém de fora inicia conexão.', concepts: ['rt.eigw'] },
            { id: 'rt6-igw', text: 'Rota ::/0 para o internet gateway', explanation: 'Nas sub-redes de aplicação, essa rota deixaria a internet iniciar conexões em IPv6 com os servidores, o que o cenário proíbe.', concepts: ['rt.eigw'] },
            { id: 'eip', text: 'IPv4 público em cada servidor de aplicação', explanation: 'Os servidores saem pelo NAT, que já tem o Elastic IP. IPv4 público neles só gera custo, e sem rota para o internet gateway nem é usado.', concepts: ['rt.nat-gateway'] },
          ],
          slots: [
            { id: 'edge', label: 'Borda da VPC', x: 300, y: 44, w: 340, h: 62, expect: { igw: 1, eigw: 1 }, explanation: 'Os dois gateways se ligam à VPC: o internet gateway serve o IPv4 e quem recebe conexões; o egress-only, a saída em IPv6.' },
            { id: 'pub-a', label: 'Pública A', x: 60, y: 164, w: 268, h: 74, expect: { nat: 1, 'rt-igw': 1 }, explanation: 'A pública A precisa da rota para o internet gateway e recebe o NAT da zona a, que sai por essa rota.' },
            { id: 'pub-b', label: 'Pública B', x: 392, y: 164, w: 268, h: 74, expect: { nat: 1, 'rt-igw': 1 }, explanation: 'A pública B precisa da rota para o internet gateway e recebe o NAT da zona b, que sai por essa rota.' },
            { id: 'app-a', label: 'Aplicação A', x: 60, y: 276, w: 268, h: 86, expect: { 'rt-nat-a': 1, 'rt-eigw': 1 }, explanation: 'A aplicação A sai em IPv4 pelo NAT da zona a e em IPv6 pelo egress-only internet gateway.' },
            { id: 'app-b', label: 'Aplicação B', x: 392, y: 276, w: 268, h: 86, expect: { 'rt-nat-b': 1, 'rt-eigw': 1 }, explanation: 'A aplicação B sai em IPv4 pelo NAT da zona b e em IPv6 pelo egress-only internet gateway.' },
          ],
        },
        {
          id: 'net.f02.m3.a2',
          kind: 'decision',
          title: 'Um NAT para duas zonas',
          prompt: 'Para economizar, a equipe propõe um único NAT Gateway zonal, na zona A, para as duas zonas. O que acontece se a zona A cair?',
          concepts: [{ id: 'rt.nat-per-az' }, { id: 'infra.nat-zonal-regional', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O NAT Gateway zonal é redundante dentro da zona dele. Se a zona A cair, os servidores da zona B, que estavam saudáveis, perdem a internet. Um NAT por zona, ou o modo regional, evita isso.'],
          options: [
            { id: 'a', text: 'Os servidores da zona B perdem a saída para a internet, mesmo estando saudáveis', correct: true, consequence: 'O NAT único virou ponto único de falha.' },
            { id: 'b', text: 'Nada: o NAT Gateway passa sozinho para a zona B', correct: false, consequence: 'O NAT Gateway zonal não muda de zona.' },
            { id: 'c', text: 'Só fica mais lento, por causa do tráfego entre zonas', correct: false, consequence: 'Com a zona A fora, não há NAT para usar.' },
          ],
        },
        {
          id: 'net.f02.m3.a3',
          kind: 'match',
          title: 'Cada saída, seu papel',
          prompt: 'Associe cada componente ao que ele faz.',
          concepts: [{ id: 'rt.nat-gateway' }, { id: 'rt.nat-instance' }, { id: 'rt.eigw' }, { id: 'rt.igw' }],
          xp: 60,
          difficulty: 2,
          explanation: ['O internet gateway dá entrada e saída a quem tem IP público. O NAT Gateway e a NAT instance só deixam sair em IPv4; a instância exige mais trabalho. O egress-only internet gateway faz o "só saída" em IPv6.'],
          leftLabel: 'Componente',
          rightLabel: 'O que faz',
          pairs: [
            { id: 'igw', left: 'Internet gateway', right: 'Entrada e saída para recursos com IP público', explanation: 'Liga a VPC à internet nos dois sentidos.', concepts: ['rt.igw'] },
            { id: 'nat', left: 'NAT Gateway', right: 'Saída em IPv4 em que a AWS cuida da banda (até 100 Gbps) e da redundância na zona', explanation: 'Gerenciado pela AWS, redundante na zona dele.', concepts: ['rt.nat-gateway'] },
            { id: 'nati', left: 'NAT instance', right: 'Saída em IPv4 em que você cuida do tamanho, das atualizações e da alta disponibilidade', explanation: 'É uma instância EC2 sua, com a verificação de origem e destino desligada. A banda depende do tipo da instância.', concepts: ['rt.nat-instance'] },
            { id: 'eigw', left: 'Egress-only internet gateway', right: 'Saída em IPv6, sem aceitar conexões de fora', explanation: 'É o "só saída" do IPv6, sem custo.', concepts: ['rt.eigw'] },
          ],
        },
        {
          id: 'net.f02.m3.a4',
          kind: 'decision',
          title: 'A terceira zona',
          prompt: 'A loja usa um NAT Gateway regional e acabou de lançar servidores numa terceira zona. O que acontece com a saída deles?',
          concepts: [{ id: 'infra.nat-zonal-regional' }, { id: 'rt.nat-per-az', weight: 0.5 }],
          xp: 50,
          difficulty: 3,
          explanation: ['O NAT Gateway regional detecta a presença de recursos na zona nova e se expande para ela, o que pode levar até 60 minutos. Enquanto isso, o tráfego da zona nova é processado pelo NAT numa das zonas onde ele já está, atravessando zonas.'],
          options: [
            { id: 'a', text: 'O NAT se expande sozinho para a zona nova, o que pode levar até 60 minutos; até lá, o tráfego dela sai pelo NAT de outra zona', correct: true, consequence: 'Não é preciso criar outro NAT nem mudar rotas, e a saída não para durante a expansão.' },
            { id: 'b', text: 'O NAT se expande sozinho para a zona nova, o que pode levar até 60 minutos; até lá, os servidores dessa zona ficam sem saída', correct: false, consequence: 'A expansão leva tempo, mas a saída não para: até ela terminar, o tráfego passa pelo NAT de outra zona.' },
            { id: 'c', text: 'É preciso criar um NAT Gateway regional na terceira zona e apontar a rota da sub-rede nova para ele', correct: false, consequence: 'Esse é o trabalho do modo zonal. O regional é um recurso só, que acompanha as zonas sozinho.' },
            { id: 'd', text: 'A saída funciona na hora, porque o NAT regional já está em todas as zonas da Região desde a criação', correct: false, consequence: 'O NAT regional só está nas zonas onde a VPC tem recursos e se expande quando aparecem recursos numa zona nova.' },
          ],
        },
      ],
      debrief: { takeaways: ['NAT Gateway público: sub-rede pública e Elastic IP.', 'Um NAT por zona, ou o regional, evita o ponto único de falha.', 'IPv6 só de saída usa o egress-only internet gateway.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f02.boss',
      title: 'As rotas da loja',
      type: 'boss',
      summary: 'Monte a rota para a internet de cada sub-rede da loja virtual.',
      briefing: {
        company: 'Varejo Ponto Certo',
        role: 'Você entrega as tabelas de rotas da nova VPC.',
        situation: 'Os balanceadores recebem os clientes nas sub-redes públicas. Os servidores de aplicação só saem, em IPv4 e em IPv6, e o banco não pode ter nenhum caminho para a internet. Há um NAT Gateway em cada sub-rede pública.',
        objective: 'Escolher o alvo de 0.0.0.0/0 e de ::/0 em cada sub-rede.',
        successCriteria: ['Cada sub-rede com exatamente o acesso pedido', 'Cada zona de aplicação sai pelo NAT da própria zona'],
      },
      intel: [
        { conceptId: 'rt.nat-gateway', body: ['O NAT Gateway só funciona se a **sub-rede dele** tiver rota para o internet gateway.'] },
        { conceptId: 'rt.nat-per-az', body: ['Cada sub-rede de aplicação usa o NAT **da própria zona**.'] },
      ],
      activities: [
        {
          id: 'net.f02.boss.a1',
          kind: 'lab',
          lab: 'route-table',
          title: 'Cinco sub-redes, cinco tabelas',
          prompt: 'Para cada sub-rede, escolha para onde vão 0.0.0.0/0 e ::/0.',
          concepts: [{ id: 'rt.igw' }, { id: 'rt.public-private' }, { id: 'rt.nat-gateway' }, { id: 'rt.nat-per-az' }, { id: 'rt.eigw' }],
          xp: 200,
          difficulty: 3,
          hints: ['Sem a rota das sub-redes públicas para o internet gateway, os NAT Gateways não saem.', 'Em IPv6, "só sair" pede o egress-only internet gateway.'],
          explanation: [
            'Públicas A e B: 0.0.0.0/0 para o internet gateway, o que também dá saída aos NAT Gateways delas.',
            'Aplicação A e B: 0.0.0.0/0 para o NAT Gateway da mesma zona e ::/0 para o egress-only internet gateway. Banco: sem rota para a internet.',
          ],
          config: PONTO_CERTO_ROUTES,
        },
        {
          id: 'net.f02.boss.a2',
          kind: 'decision',
          title: 'A NAT instance antiga',
          prompt: 'Uma VPC antiga ainda usa uma NAT instance, e ela parou de repassar o tráfego depois de ser recriada a partir de uma AMI. A rota das sub-redes privadas já aponta para a instância nova. O que provavelmente faltou?',
          concepts: [{ id: 'rt.nat-instance' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Toda instância EC2 confere, por padrão, se é a origem ou o destino do tráfego. A NAT instance repassa tráfego dos outros e precisa dessa verificação desligada. A AWS recomenda trocar a NAT instance por um NAT Gateway.'],
          options: [
            { id: 'a', text: 'Desligar a verificação de origem e destino na nova instância', correct: true, consequence: 'A instância volta a repassar o tráfego; a longo prazo, o NAT Gateway evita esse trabalho.' },
            { id: 'b', text: 'Dar um IPv4 público a cada instância das sub-redes privadas', correct: false, consequence: 'Sem rota para o internet gateway, o IP público não cria caminho. O que falta é a NAT instance aceitar repassar o tráfego das outras.' },
            { id: 'c', text: 'Mover a instância para uma sub-rede privada', correct: false, consequence: 'A NAT instance precisa ficar numa sub-rede pública.' },
          ],
        },
      ],
      debrief: { takeaways: ['A sub-rede pública dá saída também ao NAT que mora nela.', 'Cada zona usa o próprio NAT; o banco fica sem rota para a internet.', 'A NAT instance exige a verificação de origem e destino desligada; prefira o NAT Gateway.'] },
    },
  ],
}
