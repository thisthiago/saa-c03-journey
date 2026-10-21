/**
 * Fase 4 — Conectando VPCs. VPC peering (não transitivo, sem borda a borda,
 * sem blocos sobrepostos), Transit Gateway e suas tabelas de rotas, e a escolha
 * entre os dois.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { ConnectLabConfig } from '../../../../../simulators/connect/lab'
import type { Net, Topology } from '../../../../../simulators/connect/model'
import { META } from '../meta'

const THREE: Net[] = [
  { id: 'a', name: 'VPC de sinistros', cidr: '10.1.0.0/16' },
  { id: 'b', name: 'VPC de apólices', cidr: '10.2.0.0/16' },
  { id: 'c', name: 'VPC de análise', cidr: '10.3.0.0/16' },
  { id: 'dc', name: 'escritório', cidr: '192.168.0.0/16', onPrem: true },
]
const HUB: Topology = { kind: 'peering', pairs: [['a', 'b'], ['a', 'c']], vpnTo: 'a' }
const TWELVE: Net[] = [...Array.from({ length: 12 }, (_, i): Net => ({ id: `v${i + 1}`, name: `VPC ${i + 1}`, cidr: `10.${10 + i}.0.0/16` })), { id: 'dc', name: 'escritório', cidr: '192.168.0.0/16', onPrem: true }]
const ids12 = TWELVE.filter((n) => !n.onPrem).map((n) => n.id)
const mesh12: [string, string][] = ids12.flatMap((x, i) => ids12.slice(i + 1).map((y): [string, string] => [x, y]))

const ENV: Net[] = [
  { id: 'prod', name: 'VPC de produção', cidr: '10.20.0.0/16' },
  { id: 'dev', name: 'VPC de desenvolvimento', cidr: '10.21.0.0/16' },
  { id: 'shared', name: 'VPC de serviços compartilhados', cidr: '10.22.0.0/16' },
]
const ISOLATED: Topology = {
  kind: 'tgw',
  tables: [
    { id: 'p', name: 'produção', associate: ['prod'], propagate: ['shared'] },
    { id: 'd', name: 'desenvolvimento', associate: ['dev'], propagate: ['shared'] },
    { id: 's', name: 'compartilhada', associate: ['shared'], propagate: ['prod', 'dev'] },
  ],
}

export const HORIZONTE_CONNECT: ConnectLabConfig = {
  scenarios: [
    {
      id: 'duas',
      name: 'Duas VPCs',
      description: 'A VPC de sinistros precisa consultar a VPC de análise, e vice-versa. Não há outras redes envolvidas.',
      nets: [
        { id: 'sin', name: 'VPC de sinistros', cidr: '10.1.0.0/16' },
        { id: 'ana', name: 'VPC de análise', cidr: '10.3.0.0/16' },
      ],
      mustReach: [['sin', 'ana'], ['ana', 'sin']],
      mustNotReach: [],
      gbMonth: 2000,
      maxConnections: 10,
      options: [
        { id: 'peer', label: 'Um peering entre as duas VPCs', topology: { kind: 'peering', pairs: [['sin', 'ana']] } },
        { id: 'tgw', label: 'Um Transit Gateway com as duas VPCs anexadas', topology: { kind: 'tgw', tables: [{ id: 't', name: 'única', associate: ['sin', 'ana'], propagate: ['sin', 'ana'] }] } },
      ],
      concepts: ['tgw.peering', 'tgw.peering-vs-tgw'],
    },
    {
      id: 'doze',
      name: 'Doze VPCs e o escritório',
      description: 'O grupo tem doze VPCs, uma por empresa, e todas precisam falar entre si e com o escritório, que tem uma VPN.',
      nets: TWELVE,
      mustReach: [['v1', 'v2'], ['v5', 'v12'], ['v3', 'dc'], ['v12', 'dc']],
      mustNotReach: [],
      gbMonth: 5000,
      maxConnections: 20,
      options: [
        { id: 'mesh', label: 'Peering entre todas as VPCs (malha completa), com a VPN ligada à VPC 1', topology: { kind: 'peering', pairs: mesh12, vpnTo: 'v1' } },
        { id: 'star', label: 'Peering da VPC 1 com cada uma das outras, com a VPN ligada à VPC 1', topology: { kind: 'peering', pairs: ids12.slice(1).map((y): [string, string] => ['v1', y]), vpnTo: 'v1' } },
        { id: 'tgw', label: 'Um Transit Gateway com as doze VPCs e a VPN anexadas, numa tabela só', topology: { kind: 'tgw', tables: [{ id: 't', name: 'única', associate: [...ids12, 'dc'], propagate: [...ids12, 'dc'] }] } },
      ],
      concepts: ['tgw.transit-gateway', 'tgw.non-transitive', 'tgw.edge-to-edge'],
    },
    {
      id: 'ambientes',
      name: 'Produção, desenvolvimento e serviços compartilhados',
      description: 'Produção e desenvolvimento usam os serviços compartilhados (autenticação, logs), mas desenvolvimento não pode alcançar produção de jeito nenhum.',
      nets: ENV,
      mustReach: [['prod', 'shared'], ['dev', 'shared'], ['shared', 'prod'], ['shared', 'dev']],
      mustNotReach: [['dev', 'prod'], ['prod', 'dev']],
      gbMonth: 3000,
      maxConnections: 10,
      options: [
        { id: 'mesh', label: 'Peering entre as três VPCs', topology: { kind: 'peering', pairs: [['prod', 'dev'], ['prod', 'shared'], ['dev', 'shared']] } },
        { id: 'hub', label: 'Peering de serviços compartilhados com produção e com desenvolvimento', topology: { kind: 'peering', pairs: [['shared', 'prod'], ['shared', 'dev']] } },
        { id: 'tgw-one', label: 'Transit Gateway com as três VPCs numa tabela só', topology: { kind: 'tgw', tables: [{ id: 't', name: 'única', associate: ['prod', 'dev', 'shared'], propagate: ['prod', 'dev', 'shared'] }] } },
        {
          id: 'tgw-iso',
          label: 'Transit Gateway com tabelas separadas: produção e desenvolvimento só veem os serviços compartilhados',
          topology: {
            kind: 'tgw',
            tables: [
              { id: 'p', name: 'produção', associate: ['prod'], propagate: ['shared'] },
              { id: 'd', name: 'desenvolvimento', associate: ['dev'], propagate: ['shared'] },
              { id: 's', name: 'compartilhada', associate: ['shared'], propagate: ['prod', 'dev'] },
            ],
          },
        },
      ],
      concepts: ['tgw.non-transitive', 'tgw.route-tables', 'tgw.peering-vs-tgw'],
    },
  ],
}

export const F04_NET: PhaseDef = {
  ...META.f04,
  concepts: ['tgw.peering', 'tgw.non-transitive', 'tgw.edge-to-edge', 'tgw.overlap', 'tgw.transit-gateway', 'tgw.route-tables', 'tgw.peering-vs-tgw'],
  availability: 'available',
  simplifications: ['O custo considera só o Transit Gateway (hora de anexo e GB processado); a transferência entre zonas vale igual nos dois caminhos e fica fora.', 'O limite de conexões que a equipe aceita manter é uma premissa do cenário.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f04.m1',
      title: 'Duas VPCs, um peering',
      type: 'mission',
      summary: 'Como o peering funciona e o que ele não faz: transitividade, borda a borda e blocos sobrepostos.',
      briefing: {
        company: 'Grupo Horizonte Seguros',
        role: 'Você liga as VPCs de uma seguradora.',
        situation: 'A VPC de sinistros tem peering com a de apólices e com a de análise, e a VPN do escritório chega à de sinistros. A equipe de análise reclama que não alcança as apólices nem o escritório.',
        objective: 'Entender o que o peering liga e o que ele não liga.',
        successCriteria: ['Reconhecer a falta de transitividade', 'Saber que uma VPC não usa a VPN da outra'],
      },
      intel: [
        { conceptId: 'tgw.peering', body: ['O **peering** liga **duas** VPCs, com rotas nos dois lados. Não tem custo por hora.'] },
        { conceptId: 'tgw.non-transitive', body: ['A ligada a B e a C **não** faz B alcançar C. Cada par precisa do seu peering.'] },
        { conceptId: 'tgw.edge-to-edge', body: ['Pelo peering, uma VPC **não usa** a VPN, o Direct Connect, o internet gateway, o NAT ou o endpoint de gateway da vizinha.'] },
      ],
      activities: [
        {
          id: 'net.f04.m1.a1',
          kind: 'predict',
          title: 'Análise e apólices',
          prompt: 'Sinistros tem peering com apólices e com análise. A VPC de análise alcança a de apólices?',
          concepts: [{ id: 'tgw.non-transitive' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O peering não é transitivo: análise e apólices só se alcançam com um peering próprio entre elas.'],
          spec: { sim: 'connect', nets: THREE, topology: HUB, from: 'c', to: 'b' },
          options: [
            { id: 'a', text: 'Não: o tráfego não passa pela VPC de sinistros', outcome: 'no' },
            { id: 'b', text: 'Sim: as três estão ligadas a sinistros', outcome: 'yes' },
          ],
        },
        {
          id: 'net.f04.m1.a2',
          kind: 'predict',
          title: 'Análise e o escritório',
          prompt: 'A VPN do escritório termina na VPC de sinistros. A VPC de análise, que tem peering com sinistros, alcança o escritório?',
          concepts: [{ id: 'tgw.edge-to-edge' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Não há roteamento de borda a borda pelo peering: a VPC de análise não usa a VPN da VPC de sinistros.'],
          spec: { sim: 'connect', nets: THREE, topology: HUB, from: 'c', to: 'dc' },
          options: [
            { id: 'a', text: 'Não: a VPN de sinistros não serve às VPCs vizinhas', outcome: 'no' },
            { id: 'b', text: 'Sim: basta uma rota para o escritório apontando para o peering', outcome: 'yes' },
          ],
        },
        {
          id: 'net.f04.m1.a3',
          kind: 'decision',
          title: 'O parceiro com o mesmo bloco',
          prompt: 'A seguradora comprou uma corretora cuja VPC usa 10.1.0.0/16, o mesmo bloco da VPC de sinistros. O peering pedido falhou. Por quê?',
          concepts: [{ id: 'tgw.overlap' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Peering não aceita blocos iguais ou sobrepostos, mesmo que só parte deles se sobreponha. Uma das redes precisa de outro endereçamento, ou o serviço precisa ser oferecido de outro jeito, sem rotear entre as redes.'],
          options: [
            { id: 'a', text: 'Blocos iguais ou sobrepostos não podem ter peering', correct: true, consequence: 'É preciso mudar o endereçamento de uma das redes ou usar outra forma de acesso.' },
            { id: 'b', text: 'Peering entre contas diferentes não existe', correct: false, consequence: 'O peering funciona entre contas; o problema é o bloco.' },
            { id: 'c', text: 'Faltou criar as rotas antes do pedido', correct: false, consequence: 'As rotas vêm depois do peering aceito; aqui ele nem é criado.' },
          ],
        },
        {
          id: 'net.f04.m1.a4',
          kind: 'estimate',
          title: 'A malha completa',
          prompt: 'Quantos peerings são precisos para que 10 VPCs falem todas com todas?',
          concepts: [{ id: 'tgw.non-transitive' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Cada par precisa de um peering: 10 × 9 ÷ 2 = 45. Com o Transit Gateway, seriam 10 anexos.'],
          unit: 'peerings',
          min: 1,
          max: 100,
          step: 1,
          answer: 45,
          tolerance: 0,
        },
      ],
      debrief: { takeaways: ['Peering liga duas VPCs e não é transitivo.', 'Uma VPC não usa a saída da vizinha pelo peering.', 'Blocos sobrepostos impedem o peering.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f04.m2',
      title: 'O roteador central',
      type: 'mission',
      summary: 'Transit Gateway: anexos, tabelas de rotas, associação e propagação.',
      briefing: {
        company: 'Grupo Horizonte Seguros',
        role: 'Você centraliza a rede do grupo.',
        situation: 'O grupo vai juntar as VPCs num Transit Gateway. Desenvolvimento não pode alcançar produção, mas os dois usam os serviços compartilhados.',
        objective: 'Prever o alcance com tabelas separadas e montar o anexo de uma VPC.',
        successCriteria: ['Ler associação e propagação', 'Anexar a VPC em todas as zonas necessárias'],
      },
      intel: [
        { conceptId: 'tgw.transit-gateway', body: ['Cada rede se **anexa** uma vez ao **Transit Gateway**, que roteia entre todas. Cobra por hora de anexo e por GB processado.'] },
        { conceptId: 'tgw.route-tables', body: ['O anexo **se associa** a uma tabela (para onde pode mandar) e **propaga** suas rotas para outras. Tabelas separadas isolam grupos de VPCs.'] },
      ],
      activities: [
        {
          id: 'net.f04.m2.a1',
          kind: 'predict',
          title: 'Desenvolvimento e produção',
          prompt: 'As VPCs de produção e de desenvolvimento usam tabelas do Transit Gateway que só recebem as rotas da VPC de serviços compartilhados. A VPC de desenvolvimento alcança a de produção?',
          concepts: [{ id: 'tgw.route-tables' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A tabela de desenvolvimento só tem a rota da VPC compartilhada. Sem rota para produção, o Transit Gateway descarta o tráfego.'],
          spec: { sim: 'connect', nets: ENV, topology: ISOLATED, from: 'dev', to: 'prod' },
          options: [
            { id: 'a', text: 'Não: a tabela de desenvolvimento não tem rota para produção', outcome: 'no' },
            { id: 'b', text: 'Sim: tudo o que está anexado ao Transit Gateway se alcança', outcome: 'yes' },
          ],
        },
        {
          id: 'net.f04.m2.a2',
          kind: 'predict',
          title: 'Desenvolvimento e serviços compartilhados',
          prompt: 'Com as mesmas tabelas, a VPC de desenvolvimento alcança a de serviços compartilhados?',
          concepts: [{ id: 'tgw.route-tables' }, { id: 'tgw.transit-gateway', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['A tabela de desenvolvimento tem a rota da VPC de serviços compartilhados, e a tabela dela recebe a propagação de desenvolvimento: ida e volta funcionam.'],
          spec: { sim: 'connect', nets: ENV, topology: ISOLATED, from: 'dev', to: 'shared' },
          options: [
            { id: 'a', text: 'Sim: há rota de ida e de volta', outcome: 'yes' },
            { id: 'b', text: 'Não: tabelas separadas isolam tudo', outcome: 'no' },
          ],
        },
        {
          id: 'net.f04.m2.a3',
          kind: 'decision',
          title: 'O anexo numa zona só',
          prompt: 'A VPC de sinistros foi anexada ao Transit Gateway com uma sub-rede da zona A. Os servidores da zona B não alcançam o Transit Gateway. Por quê?',
          concepts: [{ id: 'tgw.transit-gateway' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O anexo de VPC usa uma sub-rede por zona. Só recursos de zonas com sub-rede no anexo alcançam o Transit Gateway. A AWS recomenda habilitar várias zonas.'],
          options: [
            { id: 'a', text: 'O anexo precisa de uma sub-rede em cada zona que use o Transit Gateway', correct: true, consequence: 'Com uma sub-rede da zona B no anexo, os servidores de B passam.' },
            { id: 'b', text: 'O Transit Gateway só funciona numa zona por vez', correct: false, consequence: 'Ele é regional; o anexo é que define as zonas.' },
            { id: 'c', text: 'Falta um segundo Transit Gateway para a zona B', correct: false, consequence: 'Basta habilitar a zona B no mesmo anexo.' },
          ],
        },
        {
          id: 'net.f04.m2.a4',
          kind: 'order',
          title: 'Ligar uma VPC ao Transit Gateway',
          prompt: 'Ordene os passos para a VPC de análise usar o Transit Gateway.',
          concepts: [{ id: 'tgw.transit-gateway' }, { id: 'tgw.route-tables', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Transit Gateway existe primeiro; depois vem o anexo, com uma sub-rede por zona; então a associação e a propagação nas tabelas do Transit Gateway; por fim, a rota na tabela da sub-rede da VPC, que manda o tráfego ao Transit Gateway.'],
          steps: [
            { id: 's1', text: 'Criar o Transit Gateway', explanation: 'É o roteador central.' },
            { id: 's2', text: 'Criar o anexo da VPC, com uma sub-rede em cada zona usada', explanation: 'Sem sub-rede na zona, os recursos dela não chegam ao Transit Gateway.' },
            { id: 's3', text: 'Associar o anexo a uma tabela do Transit Gateway e propagar as rotas dele', explanation: 'Define para onde ele manda e quem o alcança.' },
            { id: 's4', text: 'Adicionar na tabela de rotas da sub-rede a rota para as outras redes, com alvo no Transit Gateway', explanation: 'Sem essa rota, o tráfego nem chega ao Transit Gateway.' },
          ],
        },
      ],
      debrief: { takeaways: ['Cada rede se anexa uma vez ao Transit Gateway.', 'Associação e propagação decidem quem alcança quem.', 'O anexo precisa de uma sub-rede em cada zona usada.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f04.m3',
      title: 'Peering ou Transit Gateway',
      type: 'mission',
      summary: 'Quando cada um é a resposta.',
      briefing: {
        company: 'Grupo Horizonte Seguros',
        role: 'Você recomenda a forma de ligar as redes em cada caso.',
        situation: 'Dois projetos chegaram juntos: uma integração simples entre duas VPCs e a incorporação de trinta VPCs de empresas compradas, todas ligadas ao escritório.',
        objective: 'Escolher a peça mais simples que atende a cada caso.',
        successCriteria: ['Peering para poucas VPCs', 'Transit Gateway para muitas, com rede da empresa'],
      },
      intel: [{ conceptId: 'tgw.peering-vs-tgw', body: ['**Poucas VPCs**, só entre si: **peering**, sem custo por hora. **Muitas VPCs**, escritório compartilhado ou isolamento por tabelas: **Transit Gateway**.'] }],
      activities: [
        {
          id: 'net.f04.m3.a1',
          kind: 'decision',
          title: 'Duas VPCs',
          prompt: 'A VPC de sinistros precisa consultar a de análise. Nada mais está envolvido. O que usar?',
          concepts: [{ id: 'tgw.peering-vs-tgw' }, { id: 'tgw.peering', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Para duas VPCs, um peering resolve sem custo por hora e sem anexos para manter.'],
          options: [
            { id: 'a', text: 'Um peering entre as duas', correct: true, consequence: 'Simples e sem custo por hora.' },
            { id: 'b', text: 'Um Transit Gateway com as duas anexadas', correct: false, consequence: 'Funciona, mas paga hora de anexo e GB processado sem necessidade.' },
          ],
        },
        {
          id: 'net.f04.m3.a2',
          kind: 'decision',
          title: 'Trinta VPCs',
          prompt: 'Trinta VPCs de empresas compradas precisam falar entre si e com o escritório, por VPN. O que usar?',
          concepts: [{ id: 'tgw.peering-vs-tgw' }, { id: 'tgw.transit-gateway', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A malha de peering teria 435 conexões, e nenhuma VPC usaria a VPN da outra. O Transit Gateway liga as trinta VPCs e a VPN com 31 anexos.'],
          options: [
            { id: 'a', text: 'Um Transit Gateway com as VPCs e a VPN anexadas', correct: true, consequence: 'Cada rede tem um anexo, e todas alcançam o escritório.' },
            { id: 'b', text: 'Peering entre todas, com a VPN numa delas', correct: false, consequence: 'São 435 peerings, e as outras VPCs não usam a VPN da vizinha.' },
            { id: 'c', text: 'Uma VPN do escritório para cada VPC, sem ligar as VPCs entre si', correct: false, consequence: 'Atende o escritório, mas as VPCs continuam sem falar entre si.' },
          ],
        },
      ],
      debrief: { takeaways: ['Duas VPCs: peering.', 'Muitas VPCs e rede da empresa: Transit Gateway.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f04.boss',
      title: 'A rede do grupo',
      type: 'boss',
      summary: 'Três casos de conexão, uma topologia para cada.',
      briefing: {
        company: 'Grupo Horizonte Seguros',
        role: 'Você entrega a topologia de rede do grupo.',
        situation: 'Há um caso de duas VPCs, um de doze VPCs com o escritório e um de ambientes que precisam ficar isolados. A diretoria quer o menor custo, sem passar do número de conexões que a equipe consegue manter.',
        objective: 'Escolher a topologia de cada caso.',
        successCriteria: ['Cumprir quem precisa e quem não pode se alcançar', 'Menor custo dentro do limite de conexões'],
      },
      intel: [
        { conceptId: 'tgw.non-transitive', body: ['A falta de transitividade também pode **isolar**: com peering só para a VPC compartilhada, produção e desenvolvimento não se alcançam.'] },
        { conceptId: 'tgw.transit-gateway', body: ['O Transit Gateway cobra por anexo e por GB. Use quando o peering não atende ou exige conexões demais.'] },
      ],
      activities: [
        {
          id: 'net.f04.boss.a1',
          kind: 'lab',
          lab: 'connect',
          title: 'Três topologias',
          prompt: 'Para cada caso, escolha a topologia que cumpre os requisitos de alcance com o menor custo, dentro do limite de conexões.',
          concepts: [{ id: 'tgw.peering' }, { id: 'tgw.non-transitive' }, { id: 'tgw.edge-to-edge' }, { id: 'tgw.transit-gateway' }, { id: 'tgw.route-tables' }, { id: 'tgw.peering-vs-tgw' }],
          xp: 200,
          difficulty: 3,
          hints: ['Confira se o escritório alcança todas as VPCs: a VPN numa VPC não serve às outras pelo peering.', 'Peering da VPC compartilhada com as outras duas não deixa produção e desenvolvimento se alcançarem.'],
          explanation: [
            'Duas VPCs: um peering, sem custo por hora.',
            'Doze VPCs e o escritório: o Transit Gateway numa tabela só. A malha de peering teria 66 conexões e deixaria o escritório fora das outras VPCs.',
            'Ambientes: peering da VPC compartilhada com produção e com desenvolvimento. Como o peering não é transitivo, os dois não se alcançam, sem custo por hora. O Transit Gateway com tabelas separadas também funciona, mas custa mais.',
          ],
          config: HORIZONTE_CONNECT,
        },
      ],
      debrief: { takeaways: ['Escolha a topologia pelos requisitos de alcance, depois pelo custo e pelo esforço.', 'A falta de transitividade do peering pode servir para isolar.', 'Muitas VPCs com rede da empresa pedem o Transit Gateway.'] },
    },
  ],
}
