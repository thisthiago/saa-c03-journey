/**
 * Fase 2 — Roteamento e saída para a internet. Tabelas de rotas, a rota mais
 * específica, internet gateway, sub-rede pública e privada, NAT Gateway (zonal,
 * regional e por zona), NAT instance, egress-only internet gateway e o custo do
 * IPv4 público.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { RouteTableLabConfig } from '../../../../../simulators/vpcnet/routing'
import { META } from '../meta'

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
        situation: 'A VPC da loja ganhou um peering com uma VPC antiga do escritório (172.31.0.0/16) e uma rota 0.0.0.0/0 para o internet gateway. Alguém jura que o tráfego para o escritório está saindo pela internet.',
        objective: 'Prever o alvo de cada destino lendo a tabela de rotas.',
        successCriteria: ['Aplicar a regra do prefixo mais específico', 'Saber que a ordem das linhas não decide nada'],
      },
      intel: [
        { conceptId: 'rt.route-table', body: ['Cada rota tem **destino** e **alvo**. A rota **local** já vem pronta e cobre o bloco da VPC.'] },
        { conceptId: 'rt.longest-prefix', body: ['Se várias rotas cobrem o destino, vence a **mais específica**: uma /16 vence a 0.0.0.0/0. No empate, a estática vence a propagada.'] },
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
        { conceptId: 'rt.public-private', body: ['Pública = a tabela tem **rota direta para o internet gateway**. Privada = não tem. O nome da sub-rede não muda nada.'] },
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
          title: 'A instância muda',
          prompt: 'Uma instância numa sub-rede com rota 0.0.0.0/0 para o internet gateway não acessa a internet. O security group libera a saída. O que falta?',
          concepts: [{ id: 'rt.igw' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Para falar com a internet pelo internet gateway, a instância precisa de um IPv4 público ou Elastic IP. O gateway traduz o IP privado para o público dela.'],
          options: [
            { id: 'a', text: 'Um IPv4 público ou Elastic IP na instância', correct: true, consequence: 'Com o IP público, o internet gateway faz a tradução e o tráfego sai.' },
            { id: 'b', text: 'Um segundo internet gateway', correct: false, consequence: 'A VPC tem um internet gateway; o que falta é o IP da instância.' },
            { id: 'c', text: 'Aumentar a banda do internet gateway', correct: false, consequence: 'O internet gateway não tem limite de banda a ajustar.' },
          ],
        },
        {
          id: 'net.f02.m2.a3',
          kind: 'decision',
          title: 'Quarenta IPs públicos',
          prompt: 'Quarenta servidores de aplicação, numa sub-rede privada atrás do balanceador, têm IPv4 público. Ninguém os acessa de fora. O que fazer?',
          concepts: [{ id: 'rt.public-ipv4-cost' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A AWS cobra todo IPv4 público por hora. Numa sub-rede privada, esses endereços nem dão acesso à internet: só geram custo. A saída deve ir pelo NAT Gateway ou por endpoints.'],
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
        { conceptId: 'rt.nat-per-az', body: ['Se o NAT da zona A cai junto com ela, quem estava na zona B e usava esse NAT perde a internet. **Um por zona**, ou o **NAT regional**.'] },
        { conceptId: 'rt.eigw', body: ['Em **IPv6**, quem faz o papel de "só saída" é o **egress-only internet gateway**, sem custo.'] },
      ],
      activities: [
        {
          id: 'net.f02.m3.a1',
          kind: 'decision',
          title: 'Onde fica o NAT',
          prompt: 'Em que sub-rede criar o NAT Gateway público que dará saída aos servidores de aplicação?',
          concepts: [{ id: 'rt.nat-gateway' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O NAT Gateway público precisa de um Elastic IP e de uma sub-rede pública, com rota para o internet gateway. As sub-redes privadas mandam 0.0.0.0/0 para ele.'],
          options: [
            { id: 'a', text: 'Numa sub-rede pública, com um Elastic IP', correct: true, consequence: 'O NAT encaminha ao internet gateway, e as instâncias privadas saem por ele.' },
            { id: 'b', text: 'Na própria sub-rede de aplicação, que é privada', correct: false, consequence: 'Sem rota para o internet gateway, o NAT não tem por onde sair.' },
            { id: 'c', text: 'Em qualquer sub-rede: o NAT Gateway é regional por natureza', correct: false, consequence: 'O NAT Gateway zonal fica numa zona e numa sub-rede; só o modo regional dispensa a sub-rede pública.' },
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
            { id: 'nat', left: 'NAT Gateway', right: 'Saída gerenciada em IPv4, de até 100 Gbps, sem aceitar conexões de fora', explanation: 'Gerenciado pela AWS, redundante na zona dele.', concepts: ['rt.nat-gateway'] },
            { id: 'nati', left: 'NAT instance', right: 'Saída em IPv4 por uma instância EC2 sua, com a verificação de origem e destino desligada', explanation: 'A banda depende do tipo da instância, e a alta disponibilidade é sua.', concepts: ['rt.nat-instance'] },
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
          explanation: ['O NAT Gateway regional detecta a presença de recursos na zona nova e se expande para ela, o que pode levar até 60 minutos. Enquanto isso, o tráfego é processado por outra zona onde ele já está.'],
          options: [
            { id: 'a', text: 'O NAT regional se expande para a zona nova em até 60 minutos; até lá, o tráfego passa por outra zona', correct: true, consequence: 'Não é preciso criar outro NAT nem mudar rotas.' },
            { id: 'b', text: 'É preciso criar um NAT Gateway na terceira zona e uma rota nova', correct: false, consequence: 'Esse é o trabalho do modo zonal; o regional acompanha as zonas sozinho.' },
            { id: 'c', text: 'A zona nova fica sem saída até alguém reiniciar o NAT', correct: false, consequence: 'A expansão é automática.' },
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
        successCriteria: ['Cada sub-rede com exatamente o acesso pedido', 'Saída independente de zona para a aplicação'],
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
          prompt: 'Uma VPC antiga ainda usa uma NAT instance, e ela parou de repassar o tráfego depois de ser recriada a partir de uma AMI. O que provavelmente faltou?',
          concepts: [{ id: 'rt.nat-instance' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Toda instância EC2 confere, por padrão, se é a origem ou o destino do tráfego. A NAT instance repassa tráfego dos outros e precisa dessa verificação desligada. A AWS recomenda trocar a NAT instance por um NAT Gateway.'],
          options: [
            { id: 'a', text: 'Desligar a verificação de origem e destino na nova instância', correct: true, consequence: 'A instância volta a repassar o tráfego; a longo prazo, o NAT Gateway evita esse trabalho.' },
            { id: 'b', text: 'Associar um security group ao NAT Gateway', correct: false, consequence: 'Não há NAT Gateway aqui, e NAT Gateways nem aceitam security group.' },
            { id: 'c', text: 'Mover a instância para uma sub-rede privada', correct: false, consequence: 'A NAT instance precisa ficar numa sub-rede pública.' },
          ],
        },
      ],
      debrief: { takeaways: ['A sub-rede pública dá saída também ao NAT que mora nela.', 'Cada zona usa o próprio NAT; o banco fica sem rota para a internet.', 'A NAT instance exige a verificação de origem e destino desligada; prefira o NAT Gateway.'] },
    },
  ],
}
