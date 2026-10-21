/**
 * Fase 9 — Proteção de borda e escolha. WAF (regras gerenciadas e por taxa),
 * Shield Standard e Advanced, Network Firewall, Firewall Manager e o quadro de
 * escolha da solução de rede.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { NetChooserLabConfig } from '../../../../../simulators/netchooser/model'
import { META } from '../meta'

export const PECHINCHA_CHOOSER: NetChooserLabConfig = {
  itemsLabel: 'Requisitos do marketplace',
  options: ['waf', 'shield-standard', 'shield-advanced', 'network-firewall', 'firewall-manager', 'security-group', 'nacl', 'cloudfront', 'global-accelerator', 'privatelink', 'transit-gateway', 'peering', 'gateway-endpoint', 'site-to-site-vpn', 'nat-gateway'],
  items: [
    { id: 'sqli', text: 'Bloquear tentativas de injeção de SQL nos formulários da loja', dominant: 'block-sqli', needs: ['block-sqli'], concepts: ['edgesec.waf-managed'] },
    { id: 'login', text: 'Barrar robôs que testam milhares de senhas por minuto no login', dominant: 'rate-limit', needs: ['rate-limit'], concepts: ['edgesec.rate-based'] },
    { id: 'ddos', text: 'Contar com a equipe de resposta da AWS e com créditos se um ataque DDoS inflar a fatura', dominant: 'ddos-response', needs: ['ddos-response'], concepts: ['edgesec.shield-advanced'] },
    { id: 'saida', text: 'Permitir que os servidores acessem só os domínios dos parceiros de pagamento', dominant: 'inspect-vpc', needs: ['inspect-vpc'], concepts: ['edgesec.network-firewall'] },
    { id: 'contas', text: 'Aplicar as mesmas regras de WAF nas trinta contas, inclusive nas que forem criadas', dominant: 'org-wide', needs: ['org-wide'], concepts: ['edgesec.firewall-manager'] },
    { id: 'porta', text: 'Deixar os servidores da loja receberem só a porta 8080, vinda do balanceador', dominant: 'instance-firewall', needs: ['instance-firewall'], concepts: ['net.choose'] },
    { id: 'faixa', text: 'Negar, na sub-rede inteira, uma faixa de IPs de um ataque', dominant: 'deny-range', needs: ['deny-range'], concepts: ['net.choose'] },
    { id: 'fotos', text: 'Entregar as fotos dos produtos rapidamente a compradores do país todo', dominant: 'cache-static', needs: ['cache-static'], concepts: ['net.choose'] },
    { id: 'parceiro', text: 'Oferecer a API de frete a transportadoras parceiras, nas VPCs delas, sem abrir a sua', dominant: 'share-service', needs: ['share-service'], concepts: ['net.choose'] },
    { id: 's3', text: 'Os servidores enviam 10 TB por mês ao S3 e hoje passam pelo NAT', dominant: 's3-private', needs: ['s3-private'], concepts: ['net.choose'] },
    { id: 'vpcs', text: 'Ligar as quarenta VPCs dos vendedores e o escritório', dominant: 'hub-many', needs: ['hub-many'], concepts: ['net.choose'] },
    { id: 'basico', text: 'Proteção contra os ataques DDoS de rede mais comuns, sem custo extra', dominant: 'ddos-basic', needs: ['ddos-basic'], concepts: ['edgesec.shield-standard'] },
  ],
}

export const F09_NET: PhaseDef = {
  ...META.f09,
  concepts: ['edgesec.waf', 'edgesec.waf-managed', 'edgesec.rate-based', 'edgesec.shield-standard', 'edgesec.shield-advanced', 'edgesec.network-firewall', 'edgesec.firewall-manager', 'net.choose'],
  availability: 'available',
  simplifications: ['Cada requisito tem uma peça que decide; na prática, CloudFront, WAF e Shield costumam trabalhar juntos.', 'Marketplace, contas e ataques são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f09.m1',
      title: 'O formulário atacado',
      type: 'mission',
      summary: 'AWS WAF, grupos de regras gerenciadas e regras por taxa.',
      briefing: {
        company: 'Mercado Online Pechincha',
        role: 'Você protege a loja de um marketplace.',
        situation: 'Os registros mostram tentativas de injeção de SQL na busca, scripts colados nos comentários e robôs testando senhas no login. A loja fica atrás de um CloudFront e de um ALB.',
        objective: 'Barrar os ataques na camada de aplicação.',
        successCriteria: ['Usar o WAF onde ele funciona', 'Escolher as regras gerenciadas e a regra por taxa'],
      },
      intel: [
        { conceptId: 'edgesec.waf', body: ['O **WAF** inspeciona requisições **HTTP(S)** no CloudFront, no ALB, no API Gateway e em outros recursos, e permite ou bloqueia (403).'] },
        { conceptId: 'edgesec.waf-managed', body: ['Grupo **SQL database**: injeção de SQL. **Core rule set**: vulnerabilidades comuns, inclusive cross-site scripting.'] },
        { conceptId: 'edgesec.rate-based', body: ['A **regra por taxa** conta as requisições de cada IP e bloqueia quem passa do limite.'] },
      ],
      activities: [
        {
          id: 'net.f09.m1.a1',
          kind: 'decision',
          title: 'A injeção de SQL',
          prompt: 'Como barrar as tentativas de injeção de SQL e de cross-site scripting antes que cheguem aos servidores?',
          concepts: [{ id: 'edgesec.waf-managed' }, { id: 'edgesec.waf', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Um pacote de proteção (web ACL) do WAF, no CloudFront ou no ALB, com o grupo gerenciado SQL database e o Core rule set, bloqueia esses padrões antes da aplicação.'],
          options: [
            { id: 'a', text: 'WAF com os grupos gerenciados SQL database e Core rule set', correct: true, consequence: 'As requisições com esses padrões recebem 403.' },
            { id: 'b', text: 'Uma regra de negação na network ACL', correct: false, consequence: 'A ACL olha IPs e portas, e não o conteúdo das requisições.' },
            { id: 'c', text: 'Shield Advanced', correct: false, consequence: 'O Shield trata de negação de serviço, e não de injeção de SQL.' },
          ],
        },
        {
          id: 'net.f09.m1.a2',
          kind: 'decision',
          title: 'Os robôs do login',
          prompt: 'Robôs testam milhares de senhas por minuto, cada um de poucos IPs. O que usar?',
          concepts: [{ id: 'edgesec.rate-based' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A regra por taxa do WAF conta as requisições por IP numa janela de tempo e bloqueia quem passa do limite. Uma declaração de escopo pode limitá-la ao caminho do login.'],
          options: [
            { id: 'a', text: 'Uma regra por taxa no WAF, limitada ao caminho do login', correct: true, consequence: 'Cada IP que passa do limite é bloqueado.' },
            { id: 'b', text: 'Aumentar o número de servidores', correct: false, consequence: 'Os robôs continuam tentando, agora em mais servidores.' },
          ],
        },
        {
          id: 'net.f09.m1.a3',
          kind: 'classify',
          title: 'Onde o WAF se associa',
          prompt: 'Classifique cada recurso: aceita um pacote de proteção do WAF diretamente ou não?',
          concepts: [{ id: 'edgesec.waf' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O WAF protege recursos que recebem requisições web, como CloudFront, ALB, API Gateway (REST), AppSync e Cognito. Ele não se associa a um Network Load Balancer nem a uma instância EC2 diretamente.'],
          bins: [
            { id: 'yes', label: 'Aceita o WAF' },
            { id: 'no', label: 'Não aceita diretamente' },
          ],
          items: [
            { id: 'cf', text: 'Distribuição do CloudFront', bin: 'yes', explanation: 'É um dos recursos protegidos pelo WAF.', concepts: ['edgesec.waf'] },
            { id: 'alb', text: 'Application Load Balancer', bin: 'yes', explanation: 'É um dos recursos protegidos pelo WAF.', concepts: ['edgesec.waf'] },
            { id: 'api', text: 'API REST do API Gateway', bin: 'yes', explanation: 'É um dos recursos protegidos pelo WAF.', concepts: ['edgesec.waf'] },
            { id: 'nlb', text: 'Network Load Balancer', bin: 'no', explanation: 'O NLB não está na lista de recursos do WAF.', concepts: ['edgesec.waf'] },
            { id: 'ec2', text: 'Uma instância EC2', bin: 'no', explanation: 'Para proteger a instância, coloque um ALB ou um CloudFront com WAF na frente.', concepts: ['edgesec.waf'] },
          ],
        },
      ],
      debrief: { takeaways: ['WAF para requisições web, no CloudFront, no ALB e no API Gateway.', 'Regras gerenciadas contra injeção de SQL e XSS.', 'Regra por taxa contra robôs.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f09.m2',
      title: 'A Black Friday sob ataque',
      type: 'mission',
      summary: 'Shield Standard e Shield Advanced.',
      briefing: {
        company: 'Mercado Online Pechincha',
        role: 'Você prepara o marketplace para ataques de negação de serviço.',
        situation: 'No ano passado, um ataque DDoS derrubou a loja na Black Friday, e o escalonamento automático gerou uma fatura enorme. A diretoria quer saber o que já tem e o que pode contratar.',
        objective: 'Distinguir o Shield Standard do Advanced e configurá-lo do jeito certo.',
        successCriteria: ['Saber o que vem sem custo', 'Saber o que o Advanced acrescenta e exige'],
      },
      intel: [
        { conceptId: 'edgesec.shield-standard', body: ['O **Shield Standard** vem ligado para todos, **sem custo extra**, contra os ataques de rede e de transporte mais comuns.'] },
        { conceptId: 'edgesec.shield-advanced', body: ['O **Shield Advanced** é assinatura: mitigação na camada 7, **equipe de resposta** (exige suporte Business ou Enterprise) e **créditos de custo**. Só protege os recursos que você adiciona.'] },
      ],
      activities: [
        {
          id: 'net.f09.m2.a1',
          kind: 'decision',
          title: 'O que já vem',
          prompt: 'A loja nunca contratou nada de DDoS. Que proteção ela já tem?',
          concepts: [{ id: 'edgesec.shield-standard' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Todo cliente da AWS tem o Shield Standard, automático e sem custo extra, contra os ataques mais comuns de rede e de transporte.'],
          options: [
            { id: 'a', text: 'O Shield Standard, automático e sem custo extra', correct: true, consequence: 'Cobre os ataques mais comuns das camadas 3 e 4.' },
            { id: 'b', text: 'Nenhuma: toda proteção contra DDoS é paga', correct: false, consequence: 'O Shield Standard vem para todos.' },
            { id: 'c', text: 'O Shield Advanced, ligado em toda conta nova', correct: false, consequence: 'O Advanced é uma assinatura.' },
          ],
        },
        {
          id: 'net.f09.m2.a2',
          kind: 'decision',
          title: 'Equipe e créditos',
          prompt: 'A diretoria quer falar com especialistas da AWS durante um ataque e ter proteção contra o custo gerado por ele. O que contratar?',
          concepts: [{ id: 'edgesec.shield-advanced' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Shield Advanced oferece a equipe de resposta (SRT) e créditos para o custo de um ataque. Para usar a SRT, a conta também precisa do plano de suporte Business ou Enterprise.'],
          options: [
            { id: 'a', text: 'Shield Advanced, com plano de suporte Business ou Enterprise', correct: true, consequence: 'A SRT fica disponível, e o custo de um ataque pode virar crédito.' },
            { id: 'b', text: 'Só um plano de suporte Business', correct: false, consequence: 'Sem o Shield Advanced, não há SRT nem créditos de DDoS.' },
            { id: 'c', text: 'Mais regras no WAF', correct: false, consequence: 'O WAF ajuda na camada 7, mas não traz a equipe nem os créditos.' },
          ],
        },
        {
          id: 'net.f09.m2.a3',
          kind: 'decision',
          title: 'Assinado e desprotegido',
          prompt: 'A loja assinou o Shield Advanced há um mês, mas o relatório não mostra nenhum recurso protegido. O que faltou?',
          concepts: [{ id: 'edgesec.shield-advanced' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O Shield Advanced não protege nada sozinho: só os recursos adicionados a ele (CloudFront, Route 53, Global Accelerator, Elastic IPs, ALB...), ou adicionados por uma política do Firewall Manager.'],
          options: [
            { id: 'a', text: 'Adicionar o CloudFront, o ALB e a zona do Route 53 à proteção', correct: true, consequence: 'Só os recursos adicionados recebem a proteção ampliada.' },
            { id: 'b', text: 'Esperar: a proteção chega em até 90 dias', correct: false, consequence: 'Não há espera; os recursos precisam ser adicionados.' },
          ],
        },
      ],
      debrief: { takeaways: ['Shield Standard: para todos, sem custo extra.', 'Shield Advanced: assinatura com SRT e créditos, só para os recursos adicionados.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f09.m3',
      title: 'A rede inteira, em todas as contas',
      type: 'mission',
      summary: 'Network Firewall e Firewall Manager.',
      briefing: {
        company: 'Mercado Online Pechincha',
        role: 'Você estende a proteção para a rede e para todas as contas.',
        situation: 'Os servidores só deveriam acessar os domínios dos parceiros de pagamento, e o marketplace tem trinta contas, com novas contas para cada vendedor grande.',
        objective: 'Filtrar a saída da VPC por domínio e aplicar regras em todas as contas.',
        successCriteria: ['Usar o Network Firewall na borda da VPC', 'Usar o Firewall Manager na organização'],
      },
      intel: [
        { conceptId: 'edgesec.network-firewall', body: ['O **Network Firewall** filtra o tráfego que entra e sai da VPC, com estado, **regras Suricata** e **filtro por domínio**. Os endpoints dele ficam em sub-redes próprias.'] },
        { conceptId: 'edgesec.firewall-manager', body: ['O **Firewall Manager** aplica WAF, Shield Advanced, security groups e Network Firewall em **todas as contas**, inclusive nas novas.'] },
      ],
      activities: [
        {
          id: 'net.f09.m3.a1',
          kind: 'decision',
          title: 'Só os domínios de pagamento',
          prompt: 'Os servidores devem acessar, na internet, só os domínios dos parceiros de pagamento. O que usar?',
          concepts: [{ id: 'edgesec.network-firewall' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Network Firewall filtra o tráfego que sai da VPC por nome de domínio, com regras com estado. Security groups e ACLs só entendem IPs e portas.'],
          options: [
            { id: 'a', text: 'AWS Network Firewall com uma lista de domínios permitidos', correct: true, consequence: 'O resto do tráfego de saída é bloqueado na borda da VPC.' },
            { id: 'b', text: 'Regras de saída no security group com os nomes dos domínios', correct: false, consequence: 'Security groups não usam nomes de domínio.' },
            { id: 'c', text: 'WAF no NAT Gateway', correct: false, consequence: 'O WAF não se associa ao NAT Gateway e não inspeciona tráfego de saída.' },
          ],
        },
        {
          id: 'net.f09.m3.a2',
          kind: 'decision',
          title: 'Trinta contas',
          prompt: 'As regras do WAF precisam valer nas trinta contas e em toda conta nova de vendedor, sem configurar uma por uma. O que usar?',
          concepts: [{ id: 'edgesec.firewall-manager' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Firewall Manager aplica as proteções a partir de uma conta administradora em toda a organização, e contas e recursos novos recebem as regras sozinhos.'],
          options: [
            { id: 'a', text: 'AWS Firewall Manager com uma política de WAF para a organização', correct: true, consequence: 'As contas novas recebem as regras ao entrar.' },
            { id: 'b', text: 'Copiar o pacote de proteção para cada conta à mão', correct: false, consequence: 'Dá trabalho e deixa contas novas de fora.' },
          ],
        },
        {
          id: 'net.f09.m3.a3',
          kind: 'match',
          title: 'Cada ameaça, sua proteção',
          prompt: 'Associe cada ameaça à proteção que a enfrenta.',
          concepts: [{ id: 'net.choose' }, { id: 'edgesec.waf' }, { id: 'edgesec.shield-standard' }, { id: 'edgesec.network-firewall' }],
          xp: 60,
          difficulty: 2,
          explanation: ['Conteúdo malicioso em requisições web: WAF. Inundação de rede: Shield. Tráfego indevido saindo da VPC: Network Firewall. Porta aberta num servidor: security group.'],
          leftLabel: 'Ameaça',
          rightLabel: 'Proteção',
          pairs: [
            { id: 'xss', left: 'Script malicioso enviado num comentário', right: 'AWS WAF', explanation: 'O Core rule set bloqueia cross-site scripting.', concepts: ['edgesec.waf'] },
            { id: 'syn', left: 'Inundação de SYN contra o balanceador', right: 'AWS Shield', explanation: 'Ataque de transporte, coberto pelo Shield.', concepts: ['edgesec.shield-standard'] },
            { id: 'exfil', left: 'Servidor comprometido enviando dados a um domínio desconhecido', right: 'AWS Network Firewall', explanation: 'Filtra a saída da VPC por domínio.', concepts: ['edgesec.network-firewall'] },
            { id: 'ssh', left: 'Porta 22 aberta para o mundo num servidor', right: 'Security group', explanation: 'Remover a regra fecha a porta.', concepts: ['net.choose'] },
          ],
        },
      ],
      debrief: { takeaways: ['Network Firewall filtra a borda da VPC, até por domínio.', 'Firewall Manager aplica as proteções em todas as contas.', 'Cada ameaça tem sua camada: WAF, Shield, Network Firewall, security group.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f09.boss',
      title: 'A peça certa',
      type: 'boss',
      summary: 'Doze requisitos de rede e segurança, uma peça para cada.',
      briefing: {
        company: 'Mercado Online Pechincha',
        role: 'Você revisa toda a rede do marketplace.',
        situation: 'O comitê de arquitetura listou doze requisitos, que vão de ataques ao formulário à ligação com dezenas de VPCs de vendedores.',
        objective: 'Escolher, para cada requisito, a peça mais simples que o atende.',
        successCriteria: ['Cada requisito na peça certa'],
      },
      intel: [{ conceptId: 'net.choose', body: ['Comece pelo **requisito que decide** e escolha a peça mais simples que o atende.'] }],
      activities: [
        {
          id: 'net.f09.boss.a1',
          kind: 'lab',
          lab: 'net-chooser',
          title: 'Doze requisitos',
          prompt: 'Posicione cada requisito na peça de rede que o atende com o menor esforço.',
          concepts: [{ id: 'net.choose' }, { id: 'edgesec.waf-managed' }, { id: 'edgesec.rate-based' }, { id: 'edgesec.shield-standard' }, { id: 'edgesec.shield-advanced' }, { id: 'edgesec.network-firewall' }, { id: 'edgesec.firewall-manager' }],
          xp: 220,
          difficulty: 3,
          hints: ['Proteção básica contra DDoS já vem sem custo.', 'Para duas ou poucas VPCs, peering; para dezenas, Transit Gateway.'],
          explanation: [
            'Injeção de SQL e robôs do login: WAF. Equipe de resposta e créditos: Shield Advanced. DDoS básico sem custo: Shield Standard. Domínios de pagamento: Network Firewall. Trinta contas: Firewall Manager.',
            'Porta 8080 do balanceador: security group. Faixa de IPs na sub-rede: network ACL. Fotos: CloudFront. API para transportadoras: PrivateLink. S3 sem NAT: endpoint de gateway. Quarenta VPCs e escritório: Transit Gateway.',
          ],
          config: PECHINCHA_CHOOSER,
        },
      ],
      debrief: { takeaways: ['Cada requisito tem uma peça que decide.', 'Entre as que atendem, a mais simples e barata.'] },
    },
  ],
}
