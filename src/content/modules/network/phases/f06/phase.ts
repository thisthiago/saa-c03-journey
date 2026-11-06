/**
 * Fase 6 — Conectividade híbrida. Site-to-Site VPN e banda por túnel, Direct
 * Connect (dedicado e hospedado, VIFs, Direct Connect gateway, criptografia,
 * resiliência) e Client VPN.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { HybridLabConfig } from '../../../../../simulators/hybrid/model'
import { META } from '../meta'
import { FACTORY_BOARD, RESILIENCE_MODELS, VIF_TYPES, VPN_TUNNELS } from './diagrams'

export const FERRO_FORTE_HYBRID: HybridLabConfig = {
  itemsLabel: 'Necessidades da metalúrgica',
  options: ['vpn', 'vpn-ecmp', 'dx-hosted', 'dx-dedicated', 'dx-vpn-backup', 'dx-high', 'vpn-over-dx', 'dx-macsec', 'client-vpn'],
  items: [
    { id: 'filial', text: 'A filial de Betim precisa falar com a VPC a partir de amanhã, com 300 Mbps e tráfego criptografado', dominant: 'fast-setup', needs: ['fast-setup', 'encrypted', 'bw-1'], concepts: ['hyb.site-to-site-vpn'] },
    { id: 'ponte', text: 'Enquanto o Direct Connect não fica pronto, a fábrica precisa de cerca de 4 Gbps criptografados nesta semana', dominant: 'bw-5', needs: ['fast-setup', 'encrypted', 'bw-5'], concepts: ['hyb.vpn-bandwidth'] },
    { id: 'replica', text: 'A réplica do ERP transfere 40 Gbps contínuos e precisa de latência estável', dominant: 'bw-40', needs: ['private-path', 'bw-40'], concepts: ['hyb.direct-connect'] },
    { id: 'pequena', text: 'O laboratório de qualidade precisa de 200 Mbps estáveis, sem passar pela internet', dominant: 'private-path', needs: ['private-path', 'bw-1'], concepts: ['hyb.direct-connect'] },
    { id: 'auditoria', text: 'A auditoria exige criptografia no link privado de 10 Gbps com a AWS', dominant: 'encrypted', needs: ['private-path', 'bw-10', 'encrypted'], concepts: ['hyb.dx-encryption'] },
    { id: 'reserva', text: 'O link privado de 2 Gbps não pode deixar a fábrica isolada se cair, mas o orçamento é curto', dominant: 'survive-link', needs: ['private-path', 'bw-5', 'survive-link'], concepts: ['hyb.dx-resiliency'] },
    { id: 'critico', text: 'O sistema de pedidos precisa continuar ligado à AWS mesmo se um local do Direct Connect inteiro sair do ar', dominant: 'survive-location', needs: ['private-path', 'survive-location'], concepts: ['hyb.dx-resiliency'] },
    { id: 'casa', text: 'Oitenta engenheiros trabalhando de casa precisam acessar a VPC e a rede da fábrica', dominant: 'remote-users', needs: ['remote-users'], concepts: ['hyb.client-vpn'] },
  ],
}

export const F06_NET: PhaseDef = {
  ...META.f06,
  concepts: ['hyb.site-to-site-vpn', 'hyb.vpn-bandwidth', 'hyb.direct-connect', 'hyb.vif', 'hyb.dx-gateway', 'hyb.dx-encryption', 'hyb.dx-resiliency', 'hyb.client-vpn'],
  availability: 'available',
  simplifications: ['O prazo do Direct Connect é uma premissa: a AWS revisa a porta em até 72 horas úteis, mas o circuito até o local depende do parceiro.', 'Metalúrgica, filiais e números são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f06.m1',
      title: 'Amanhã e criptografado',
      type: 'mission',
      summary: 'Site-to-Site VPN, os dois túneis e a banda por túnel.',
      briefing: {
        company: 'Metalúrgica Ferro Forte',
        role: 'Você liga as fábricas de uma metalúrgica à AWS.',
        situation: 'A filial de Betim precisa acessar o ERP na nuvem a partir de amanhã. A fábrica principal vai precisar de mais banda nas próximas semanas, até chegar um link dedicado.',
        objective: 'Montar a VPN e entender quanto ela aguenta.',
        successCriteria: ['Escolher a VPN para ligação rápida', 'Calcular túneis para mais banda'],
      },
      intel: [
        { conceptId: 'hyb.site-to-site-vpn', body: ['A **Site-to-Site VPN** cria **túneis IPsec** pela internet, entre o roteador da empresa (o **customer gateway**) e a AWS. Cada conexão tem **dois túneis**. Do lado da AWS, ela termina num **virtual private gateway**, preso a uma VPC, ou num **Transit Gateway**.'], diagram: VPN_TUNNELS },
        { conceptId: 'hyb.vpn-bandwidth', body: ['Um túnel padrão leva **até 1,25 Gbps**. Para somar túneis, use **várias VPNs no Transit Gateway com ECMP**, que exige **roteamento dinâmico (BGP)**.'] },
      ],
      activities: [
        {
          id: 'net.f06.m1.a1',
          kind: 'decision',
          title: 'A filial de amanhã',
          prompt: 'A filial precisa de 300 Mbps criptografados até a VPC a partir de amanhã. O que montar?',
          concepts: [{ id: 'hyb.site-to-site-vpn' }],
          xp: 40,
          difficulty: 1,
          explanation: ['A VPN fica pronta em pouco tempo, criptografa o tráfego com IPsec e atende 300 Mbps. O Direct Connect depende de circuito físico e não fica pronto para amanhã.'],
          options: [
            { id: 'a', text: 'Uma Site-to-Site VPN entre o roteador da filial e a AWS', correct: true, consequence: 'Funciona amanhã, criptografada, pela internet.' },
            { id: 'b', text: 'Um Direct Connect dedicado de 1 Gbps', correct: false, consequence: 'O circuito físico não fica pronto em um dia.' },
            { id: 'c', text: 'Liberar o ERP na internet para o IP da filial', correct: false, consequence: 'O ERP ganha um endereço público, e só os protocolos que já usam TLS vão criptografados. A VPN cifra todo o tráfego entre as duas redes.' },
          ],
        },
        {
          id: 'net.f06.m1.a2',
          kind: 'estimate',
          title: 'Quantos túneis',
          prompt: 'Cada conexão VPN tem dois túneis, e cada túnel padrão leva até 1,25 Gbps. Quantos túneis ativos, no mínimo, são precisos para levar 4 Gbps?',
          concepts: [{ id: 'hyb.vpn-bandwidth' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Três túneis chegam a 3,75 Gbps, que não basta. Quatro túneis chegam a 5 Gbps. Como cada conexão tem dois túneis, duas conexões bastam, desde que os quatro túneis fiquem ativos ao mesmo tempo: para isso, as VPNs terminam no Transit Gateway com ECMP e BGP.'],
          unit: 'túneis',
          min: 1,
          max: 10,
          step: 1,
          answer: 4,
          tolerance: 0,
        },
        {
          id: 'net.f06.m1.a3',
          kind: 'decision',
          title: 'O ECMP que não somou',
          prompt: 'A equipe ligou quatro VPNs ao Transit Gateway, com ECMP habilitado, mas a banda não passou de um túnel. As VPNs usam rotas estáticas. O que falta?',
          concepts: [{ id: 'hyb.vpn-bandwidth' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O ECMP para VPN no Transit Gateway exige roteamento dinâmico. Com rotas estáticas, ele não divide o tráfego entre os túneis.'],
          options: [
            { id: 'a', text: 'Usar roteamento dinâmico (BGP) nas VPNs', correct: true, consequence: 'Com BGP, o Transit Gateway distribui o tráfego entre os túneis.' },
            { id: 'b', text: 'Trocar o Transit Gateway por um virtual private gateway', correct: false, consequence: 'O ECMP para somar VPNs é recurso do Transit Gateway.' },
            { id: 'c', text: 'Ligar a aceleração das VPNs (Accelerated VPN)', correct: false, consequence: 'A aceleração leva os túneis pela rede global da AWS, mas não faz o ECMP dividir o tráfego: isso exige BGP.' },
          ],
        },
      ],
      debrief: { takeaways: ['VPN: rápida, criptografada, pela internet, com dois túneis.', 'Até 1,25 Gbps por túnel padrão.', 'Somar túneis: Transit Gateway, ECMP e BGP.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f06.m2',
      title: 'O cabo dedicado',
      type: 'mission',
      summary: 'Direct Connect dedicado e hospedado, interfaces virtuais, Direct Connect gateway e criptografia.',
      briefing: {
        company: 'Metalúrgica Ferro Forte',
        role: 'Você contrata o link dedicado da fábrica principal.',
        situation: 'A réplica do ERP precisa de banda estável. A metalúrgica tem VPCs em São Paulo e na Virgínia, usa o S3 diretamente e a auditoria pergunta se o link privado é criptografado.',
        objective: 'Escolher o tipo de conexão e as interfaces e responder à auditoria.',
        successCriteria: ['Distinguir dedicado e hospedado', 'Escolher a interface virtual certa', 'Saber o que criptografa o Direct Connect'],
      },
      intel: [
        { conceptId: 'hyb.direct-connect', body: ['O **Direct Connect** é uma conexão física, sem internet. **Dedicada**: 1, 10, 100 ou 400 Gbps. **Hospedada**, por parceiro: de 50 Mbps a 25 Gbps.'] },
        {
          conceptId: 'hyb.vif',
          body: [
            'Uma **interface virtual** é uma ligação lógica, com VLAN e sessão BGP próprias, dentro da conexão física. A **privada** chega a VPCs; a **pública**, aos serviços públicos da AWS, como o S3; a **de trânsito**, a Transit Gateways.',
          ],
          diagram: VIF_TYPES,
        },
        { conceptId: 'hyb.dx-gateway', body: ['O **Direct Connect gateway** é um recurso **global**: liga interfaces privadas ou de trânsito a VPCs e Transit Gateways de várias Regiões e contas, menos as da China.'] },
        { conceptId: 'hyb.dx-encryption', body: ['O Direct Connect **não é criptografado por padrão**. Opções: **MACsec** (dedicada de 10, 100 ou 400 Gbps) ou **VPN por dentro** do link.'] },
      ],
      activities: [
        {
          id: 'net.f06.m2.a5',
          kind: 'build',
          title: 'Ligue a fábrica às duas Regiões',
          prompt: 'Monte a ligação da fábrica com a AWS: arraste cada peça para onde ela fica. As peças que não servem neste cenário vão para "Não entra nesta rede".',
          scenario: [
            'A fábrica contratou uma conexão dedicada do Direct Connect num local de São Paulo. Pelo mesmo link, ela precisa chegar por IP privado às VPCs de São Paulo e da Virgínia e enviar arquivos ao S3 sem passar pela internet. Não há Transit Gateway.',
            'Se o link cair, a fábrica aceita seguir mais devagar, pela internet.',
          ],
          concepts: [{ id: 'hyb.vif' }, { id: 'hyb.dx-gateway' }, { id: 'hyb.dx-resiliency', weight: 0.5 }],
          xp: 60,
          difficulty: 2,
          explanation: [
            'Dentro da conexão passam duas interfaces virtuais: a privada, que vai ao Direct Connect gateway, e a pública, que chega ao S3. O Direct Connect gateway é global e se associa aos virtual private gateways das duas VPCs.',
            'A Site-to-Site VPN de reserva vai pela internet até os mesmos virtual private gateways e assume se o link cair.',
          ],
          board: FACTORY_BOARD,
          pieces: [
            { id: 'vif-priv', text: 'Interface virtual privada', explanation: 'Leva o tráfego por IP privado até o Direct Connect gateway, e dele às VPCs.', concepts: ['hyb.vif'] },
            { id: 'vif-pub', text: 'Interface virtual pública', explanation: 'Chega aos serviços públicos da AWS, como o S3, sem passar pela internet.', concepts: ['hyb.vif'] },
            { id: 'dxgw', text: 'Direct Connect gateway', glyph: 'waypoints', explanation: 'É global: uma interface privada chega por ele a VPCs de São Paulo e da Virgínia.', concepts: ['hyb.dx-gateway'] },
            { id: 'vgw', text: 'Virtual private gateway', glyph: 'router', count: 2, explanation: 'É o lado da AWS ligado a cada VPC. O Direct Connect gateway se associa aos dois, e a VPN de reserva termina neles.', concepts: ['hyb.dx-gateway'] },
            { id: 'vpn', text: 'Site-to-Site VPN de reserva', explanation: 'Vai pela internet e assume se o Direct Connect cair, com menos banda.', concepts: ['hyb.dx-resiliency'] },
            { id: 'vif-tr', text: 'Interface virtual de trânsito', explanation: 'Só serve para chegar a Transit Gateways, e o cenário não tem nenhum.', concepts: ['hyb.vif'] },
            { id: 'peering', text: 'Peering entre as VPCs de São Paulo e da Virgínia', explanation: 'Pelo peering, a VPC da Virgínia não usa o Direct Connect da VPC de São Paulo. Quem leva o link às duas Regiões é o Direct Connect gateway.', concepts: ['hyb.dx-gateway'] },
            { id: 'igw', text: 'Internet gateway para chegar ao S3', explanation: 'Mandaria os arquivos pela internet. A interface pública chega ao S3 pelo link privado.', concepts: ['hyb.vif'] },
          ],
          slots: [
            { id: 'link', label: 'Dentro da conexão do Direct Connect', x: 160, y: 136, w: 150, h: 150, expect: { 'vif-priv': 1, 'vif-pub': 1 }, explanation: 'A conexão física leva duas interfaces virtuais: a privada, para as VPCs, e a pública, para o S3.' },
            { id: 'global', label: 'Entre a conexão e as Regiões', x: 348, y: 166, w: 124, h: 96, expect: { dxgw: 1 }, explanation: 'O Direct Connect gateway, global, leva a interface privada às VPCs das duas Regiões.' },
            { id: 'vpc-sp', label: 'Na VPC de São Paulo', x: 525, y: 62, w: 160, h: 64, expect: { vgw: 1 }, explanation: 'A VPC de São Paulo precisa do seu virtual private gateway.' },
            { id: 'vpc-va', label: 'Na VPC da Virgínia', x: 525, y: 276, w: 160, h: 54, expect: { vgw: 1 }, explanation: 'A VPC da Virgínia também precisa do seu virtual private gateway.' },
            { id: 'net', label: 'Pela internet, se o link cair', x: 220, y: 344, w: 250, h: 54, expect: { vpn: 1 }, explanation: 'A reserva barata que o cenário aceita é uma VPN pela internet.' },
          ],
        },
        {
          id: 'net.f06.m2.a2',
          kind: 'decision',
          title: 'Duas Regiões, um link',
          prompt: 'A metalúrgica quer usar um único Direct Connect, em São Paulo, para chegar às VPCs de São Paulo e da Virgínia. O que usar?',
          concepts: [{ id: 'hyb.dx-gateway' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Direct Connect gateway é global: liga a conexão a VPCs de várias Regiões e contas, exceto as da China.'],
          options: [
            { id: 'a', text: 'Um Direct Connect gateway associado aos virtual private gateways das VPCs das duas Regiões', correct: true, consequence: 'Um link alcança as duas Regiões.' },
            { id: 'b', text: 'Um segundo Direct Connect na Virgínia é obrigatório', correct: false, consequence: 'O Direct Connect gateway alcança outras Regiões pelo mesmo link.' },
            { id: 'c', text: 'Um peering entre as VPCs, para a da Virgínia usar o link da de São Paulo', correct: false, consequence: 'Pelo peering, uma VPC não usa o Direct Connect da outra.' },
          ],
        },
        {
          id: 'net.f06.m2.a3',
          kind: 'decision',
          title: 'O link é criptografado?',
          prompt: 'A auditoria pergunta se o tráfego no Direct Connect dedicado de 10 Gbps é criptografado. Qual é a resposta certa?',
          concepts: [{ id: 'hyb.dx-encryption' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O caminho é privado, mas não é criptografado por padrão. Na porta dedicada de 10 Gbps, o MACsec criptografa o trecho entre o roteador da empresa e o equipamento da AWS; outra opção é uma VPN IPsec por dentro do Direct Connect.'],
          options: [
            { id: 'a', text: 'Não por padrão; dá para usar MACsec na porta ou uma VPN por dentro do link', correct: true, consequence: 'A auditoria recebe uma resposta exata e duas formas de atender.' },
            { id: 'b', text: 'Sim: como o link não passa pela internet, ele já vai criptografado', correct: false, consequence: 'Privado não quer dizer criptografado.' },
            { id: 'c', text: 'Só se a conexão for hospedada, que já vem com MACsec ligado', correct: false, consequence: 'O MACsec não está disponível em conexões hospedadas.' },
          ],
        },
        {
          id: 'net.f06.m2.a4',
          kind: 'classify',
          title: 'Dedicada ou hospedada',
          prompt: 'Classifique cada característica pelo tipo de conexão do Direct Connect.',
          concepts: [{ id: 'hyb.direct-connect' }, { id: 'hyb.dx-encryption', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A dedicada é pedida pelo console, com portas de 1, 10, 100 ou 400 Gbps, e aceita MACsec nas maiores. A hospedada é provisionada por um parceiro, de 50 Mbps a 25 Gbps, e o parceiro muda a velocidade.'],
          bins: [
            { id: 'ded', label: 'Conexão dedicada' },
            { id: 'host', label: 'Conexão hospedada' },
          ],
          items: [
            { id: 'speeds', text: 'Porta física exclusiva de 100 ou 400 Gbps', bin: 'ded', explanation: 'A dedicada tem portas de 1, 10, 100 ou 400 Gbps; a hospedada vai só até 25 Gbps.', concepts: ['hyb.direct-connect'] },
            { id: 'small', text: 'Velocidades a partir de 50 Mbps', bin: 'host', explanation: 'A hospedada vai de 50 Mbps a 25 Gbps.', concepts: ['hyb.direct-connect'] },
            { id: 'partner', text: 'Um parceiro provisiona a conexão em nome do cliente', bin: 'host', explanation: 'A hospedada não é pedida pelo console.', concepts: ['hyb.direct-connect'] },
            { id: 'macsec', text: 'Pode usar MACsec', bin: 'ded', explanation: 'MACsec vale para dedicadas de 10, 100 e 400 Gbps.', concepts: ['hyb.dx-encryption'] },
          ],
        },
      ],
      debrief: { takeaways: ['Dedicada: portas de 1 a 400 Gbps. Hospedada: de 50 Mbps a 25 Gbps, por parceiro.', 'Privada, pública ou de trânsito: a interface depende do destino.', 'Direct Connect não é criptografado por padrão.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f06.m3',
      title: 'Quando o link cai',
      type: 'mission',
      summary: 'Resiliência do Direct Connect e Client VPN para quem trabalha de casa.',
      briefing: {
        company: 'Metalúrgica Ferro Forte',
        role: 'Você define a resiliência das ligações e o acesso remoto.',
        situation: 'O sistema de pedidos não pode ficar isolado da AWS, e o link privado de 2 Gbps da fábrica precisa de uma reserva com orçamento curto. Além disso, oitenta engenheiros passaram a trabalhar de casa.',
        objective: 'Escolher o nível de resiliência de cada ligação e o acesso dos engenheiros.',
        successCriteria: ['Distinguir resistir à queda de um link e à queda de um local', 'Usar a Client VPN para pessoas'],
      },
      intel: [
        {
          conceptId: 'hyb.dx-resiliency',
          body: [
            'Uma conexão só é **ponto único de falha**. **Desenvolvimento e teste**: duas conexões no mesmo local, em equipamentos diferentes. **Alta resiliência**: conexões em dois locais. **Máxima**: duas conexões em cada um de dois locais.',
            'Uma **VPN de reserva** é a opção barata: assume se o link cair, com menos banda e pela internet.',
          ],
          diagram: RESILIENCE_MODELS,
        },
        { conceptId: 'hyb.client-vpn', body: ['A **Client VPN** é para **pessoas**: cada uma conecta o próprio computador com um cliente OpenVPN.'] },
      ],
      activities: [
        {
          id: 'net.f06.m3.a1',
          kind: 'decision',
          title: 'O local inteiro cai',
          prompt: 'O sistema de pedidos precisa continuar ligado mesmo se um local do Direct Connect inteiro sair do ar. O que contratar?',
          concepts: [{ id: 'hyb.dx-resiliency' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Só conexões em locais diferentes resistem à queda de um local. Duas portas no mesmo local resistem à falha de um dispositivo, mas não do prédio.'],
          options: [
            { id: 'a', text: 'Conexões em dois locais do Direct Connect (alta resiliência ou máxima)', correct: true, consequence: 'A queda de um local não isola os pedidos.' },
            { id: 'b', text: 'Duas conexões no mesmo local, em dispositivos diferentes', correct: false, consequence: 'É o modelo de desenvolvimento e teste: não resiste à queda do local.' },
            { id: 'c', text: 'Uma conexão de 100 Gbps, mais robusta', correct: false, consequence: 'Banda maior não elimina o ponto único de falha.' },
          ],
        },
        {
          id: 'net.f06.m3.a2',
          kind: 'decision',
          title: 'Reserva barata',
          prompt: 'A fábrica tem um link privado de 2 Gbps e um orçamento curto. Se o link cair, basta continuar funcionando, ainda que mais devagar. O que usar como reserva?',
          concepts: [{ id: 'hyb.dx-resiliency' }, { id: 'hyb.site-to-site-vpn', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['Uma Site-to-Site VPN de reserva custa pouco e assume se o Direct Connect cair, com menos banda e pela internet.'],
          options: [
            { id: 'a', text: 'Uma Site-to-Site VPN de reserva', correct: true, consequence: 'Barata e pronta a assumir, com menos banda.' },
            { id: 'b', text: 'Um segundo Direct Connect em outro local', correct: false, consequence: 'Funciona, mas custa muito mais do que o caso pede.' },
            { id: 'c', text: 'Uma segunda conexão no mesmo local do Direct Connect', correct: false, consequence: 'Resiste à falha de um equipamento, mas não à queda do local, e custa bem mais que a VPN.' },
          ],
        },
        {
          id: 'net.f06.m3.a3',
          kind: 'decision',
          title: 'Os engenheiros em casa',
          prompt: 'Oitenta engenheiros, cada um em casa, precisam acessar a VPC e a rede da fábrica. O que usar?',
          concepts: [{ id: 'hyb.client-vpn' }],
          xp: 40,
          difficulty: 1,
          explanation: ['A Client VPN é gerenciada, escala sozinha e atende pessoas, com autenticação por Active Directory, federação ou certificado.'],
          options: [
            { id: 'a', text: 'AWS Client VPN', correct: true, consequence: 'Cada engenheiro se conecta com o cliente OpenVPN.' },
            { id: 'b', text: 'Uma Site-to-Site VPN para cada casa', correct: false, consequence: 'A Site-to-Site liga redes inteiras, com um roteador em cada ponta.' },
            { id: 'c', text: 'Um Direct Connect hospedado para cada engenheiro', correct: false, consequence: 'Direct Connect liga locais, e não pessoas.' },
          ],
        },
      ],
      debrief: { takeaways: ['Queda de um local: conexões em locais diferentes.', 'Reserva barata: VPN.', 'Pessoas de fora do escritório: Client VPN.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f06.boss',
      title: 'Ligando a metalúrgica',
      type: 'boss',
      summary: 'Oito necessidades, uma conexão para cada.',
      briefing: {
        company: 'Metalúrgica Ferro Forte',
        role: 'Você apresenta o plano de conectividade da metalúrgica.',
        situation: 'Filial nova, réplica do ERP, laboratório, auditoria, sistema de pedidos e engenheiros em casa: cada necessidade tem prazo, banda, criptografia e resiliência próprios.',
        objective: 'Associar cada necessidade à conexão que a atende com o menor esforço.',
        successCriteria: ['Cumprir todos os requisitos de cada necessidade', 'Escolher a opção mais simples entre as que atendem'],
      },
      intel: [{ conceptId: 'hyb.direct-connect', body: ['Prazo curto descarta o Direct Connect. Banda estável sem internet pede o Direct Connect. Criptografia, resiliência e banda refinam a escolha.'] }],
      activities: [
        {
          id: 'net.f06.boss.a1',
          kind: 'lab',
          lab: 'hybrid',
          title: 'Oito ligações',
          prompt: 'Posicione cada necessidade na conexão que a atende com o menor esforço e custo.',
          concepts: [{ id: 'hyb.site-to-site-vpn' }, { id: 'hyb.vpn-bandwidth' }, { id: 'hyb.direct-connect' }, { id: 'hyb.dx-encryption' }, { id: 'hyb.dx-resiliency' }, { id: 'hyb.client-vpn' }],
          xp: 200,
          difficulty: 3,
          hints: ['Leia primeiro o requisito que decide: prazo, banda, criptografia, resiliência ou acesso de pessoas.', 'A conexão hospedada vai de 50 Mbps a 25 Gbps; acima disso, só a dedicada.'],
          explanation: [
            'Filial: Site-to-Site VPN. Ponte de 4 Gbps: várias VPNs no Transit Gateway com ECMP. Réplica de 40 Gbps: Direct Connect dedicado, porque a conexão hospedada vai só até 25 Gbps. Laboratório de 200 Mbps: Direct Connect hospedado.',
            'Auditoria de 10 Gbps: Direct Connect dedicado com MACsec. Reserva barata: Direct Connect com VPN de reserva. Pedidos: Direct Connect em dois locais. Engenheiros: Client VPN.',
          ],
          config: FERRO_FORTE_HYBRID,
        },
      ],
      debrief: { takeaways: ['Prazo curto e criptografia: VPN.', 'Banda estável sem internet: Direct Connect, hospedado ou dedicado conforme a velocidade.', 'Criptografia no link privado: MACsec ou VPN por dentro.', 'Resiliência: VPN de reserva ou outro local.'] },
    },
  ],
}
