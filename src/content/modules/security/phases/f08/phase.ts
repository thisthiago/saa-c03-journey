/**
 * Fase 8 — Ameaças externas e resposta. DDoS, injeção de SQL e XSS, defesa
 * em camadas, resposta automática a achados com o EventBridge e contenção de
 * uma instância comprometida.
 */
import type { PhaseDef } from '../../../../../engine/types'
import { META } from '../meta'

export const F08_SEC: PhaseDef = {
  ...META.f08,
  concepts: ['sec.web-threats', 'edgesec.waf-managed', 'edgesec.shield-standard', 'sec.defense-in-depth', 'sec.auto-response', 'gd.findings', 'sec.containment'],
  availability: 'available',
  simplifications: ['A loja, as instâncias e os ataques são fictícios.', 'A resposta automática aparece em passos; na prática, a função ou a automação tem as permissões mínimas para cada ação.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f08.m1',
      title: 'Ataques que vêm de fora',
      type: 'mission',
      summary: 'DDoS, injeção de SQL, cross-site scripting e as regras do WAF.',
      briefing: {
        company: 'Loja Virtual Casa & Cia',
        role: 'Você protege uma loja virtual de móveis.',
        situation: 'Os logs mostram tentativas de colocar comandos SQL no campo de busca e scripts nos comentários dos produtos. Na Black Friday do ano passado, um pico de tráfego falso derrubou o site por meia hora.',
        objective: 'Ligar cada ataque à proteção certa.',
        successCriteria: ['Reconhecer os três ataques', 'Escolher o grupo de regras do WAF'],
      },
      intel: [
        { conceptId: 'sec.web-threats', body: ['**DDoS**: tráfego para derrubar. **Injeção de SQL**: comandos de banco num campo. **XSS**: script que roda no navegador de outros clientes.'] },
        { conceptId: 'edgesec.waf-managed', body: ['Grupos gerenciados do WAF: **SQL database** (`AWSManagedRulesSQLiRuleSet`) contra injeção de SQL e **Core rule set** (`AWSManagedRulesCommonRuleSet`), com regras contra XSS.'] },
        { conceptId: 'edgesec.shield-standard', body: ['O **Shield Standard** protege contra os ataques DDoS mais comuns de rede e transporte, sem custo extra.'] },
      ],
      activities: [
        {
          id: 'sec.f08.m1.a1',
          kind: 'classify',
          title: 'Que ataque é este',
          prompt: 'Classifique cada linha do log pelo tipo de ataque.',
          concepts: [{ id: 'sec.web-threats' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Comando SQL num parâmetro é injeção de SQL; script num campo que outros veem é XSS; milhões de requisições para derrubar é DDoS.'],
          bins: [
            { id: 'sqli', label: 'Injeção de SQL' },
            { id: 'xss', label: 'Cross-site scripting' },
            { id: 'ddos', label: 'DDoS' },
          ],
          items: [
            { id: 'busca', text: "busca=sofá' OR '1'='1", bin: 'sqli', explanation: 'Tenta mudar a consulta ao banco.', concepts: ['sec.web-threats'] },
            { id: 'comentario', text: 'comentario=<script>document.location=...</script>', bin: 'xss', explanation: 'Um script que rodaria no navegador de quem abrir o produto.', concepts: ['sec.web-threats'] },
            { id: 'pico', text: '2 milhões de conexões por minuto vindas de milhares de endereços', bin: 'ddos', explanation: 'Volume para esgotar o site.', concepts: ['sec.web-threats'] },
          ],
        },
        {
          id: 'sec.f08.m1.a2',
          kind: 'decision',
          title: 'O campo de busca',
          prompt: 'A loja usa um banco SQL e quer barrar, na borda, as tentativas de injeção de SQL no campo de busca. O que ligar no WAF do ALB?',
          concepts: [{ id: 'sec.web-threats' }, { id: 'edgesec.waf-managed', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O grupo gerenciado SQL database barra padrões de injeção de SQL e é indicado para aplicações que falam com um banco SQL.'],
          options: [
            { id: 'a', text: 'O grupo gerenciado SQL database (AWSManagedRulesSQLiRuleSet)', correct: true, consequence: 'As tentativas são barradas antes de chegar à aplicação.' },
            { id: 'b', text: 'O Shield Advanced', correct: false, consequence: 'O Shield trata de DDoS, não de injeção de SQL.' },
            { id: 'c', text: 'Um security group mais restrito', correct: false, consequence: 'O security group não lê o conteúdo das requisições HTTP.' },
          ],
        },
      ],
      debrief: { takeaways: ['Injeção de SQL e XSS: regras do WAF.', 'DDoS: Shield, com o Standard sem custo extra.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f08.m2',
      title: 'Uma camada não basta',
      type: 'mission',
      summary: 'Defesa em camadas, da borda aos dados.',
      briefing: {
        company: 'Loja Virtual Casa & Cia',
        role: 'Você revisa a arquitetura de segurança da loja.',
        situation: 'Depois de ligar o WAF, alguém sugeriu deixar o banco numa sub-rede pública "porque o WAF já protege". A diretoria quer entender por que mais camadas são necessárias.',
        objective: 'Pôr cada controle na camada certa.',
        successCriteria: ['Classificar os controles por camada', 'Recusar a proteção de uma camada só'],
      },
      intel: [{ conceptId: 'sec.defense-in-depth', body: ['**Borda**: Shield e WAF. **Rede**: security groups e sub-redes privadas. **Identidade**: privilégio mínimo. **Dados**: criptografia. Por cima: **detecção**.'] }],
      activities: [
        {
          id: 'sec.f08.m2.a1',
          kind: 'classify',
          title: 'Cada controle na sua camada',
          prompt: 'Classifique cada controle pela camada.',
          concepts: [{ id: 'sec.defense-in-depth' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada camada barra um tipo de problema; quando uma falha, a seguinte ainda protege.'],
          bins: [
            { id: 'edge', label: 'Borda' },
            { id: 'net', label: 'Rede' },
            { id: 'data', label: 'Dados' },
          ],
          items: [
            { id: 'waf', text: 'Regras do WAF no ALB', bin: 'edge', explanation: 'Filtra as requisições na entrada.', concepts: ['sec.defense-in-depth'] },
            { id: 'sg', text: 'O banco aceita conexões só do security group da aplicação', bin: 'net', explanation: 'Limita quem chega ao banco.', concepts: ['sec.defense-in-depth'] },
            { id: 'private', text: 'O banco numa sub-rede privada, sem rota para a internet', bin: 'net', explanation: 'Ninguém de fora alcança o banco direto.', concepts: ['sec.defense-in-depth'] },
            { id: 'kms', text: 'O banco cifrado com uma chave do KMS', bin: 'data', explanation: 'Protege os dados gravados.', concepts: ['sec.defense-in-depth'] },
          ],
        },
        {
          id: 'sec.f08.m2.a2',
          kind: 'decision',
          title: 'O banco na sub-rede pública',
          prompt: 'O WAF está ligado no ALB. Faz sentido pôr o banco numa sub-rede pública para facilitar o acesso do time?',
          concepts: [{ id: 'sec.defense-in-depth' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O WAF protege o tráfego que passa pelo ALB. Um banco com endereço público pode ser atacado direto, sem passar pelo WAF. O time acessa por caminhos privados, como o Session Manager.'],
          options: [
            { id: 'a', text: 'Não: o banco fica na sub-rede privada; o WAF só protege o que passa pelo ALB', correct: true, consequence: 'Cada camada continua cumprindo o papel dela.' },
            { id: 'b', text: 'Sim: o WAF protege tudo da conta', correct: false, consequence: 'O WAF só vê o que passa pelos recursos associados a ele.' },
          ],
        },
      ],
      debrief: { takeaways: ['Cada camada barra um tipo de problema.', 'O WAF não protege o que não passa por ele.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f08.m3',
      title: 'Responder em segundos',
      type: 'mission',
      summary: 'GuardDuty, EventBridge e a contenção de uma instância comprometida.',
      briefing: {
        company: 'Loja Virtual Casa & Cia',
        role: 'Você automatiza a resposta a incidentes.',
        situation: 'Na madrugada, o GuardDuty achou uma instância falando com um servidor de comando e controle, mas ninguém viu o achado até as 9h.',
        objective: 'Responder ao achado sozinho e conter sem destruir as provas.',
        successCriteria: ['Ordenar a resposta automática', 'Conter a instância do jeito certo'],
      },
      intel: [
        { conceptId: 'sec.auto-response', body: ['O GuardDuty publica cada achado no **EventBridge**. Uma **regra** filtra pelo tipo ou pela gravidade e aciona **Lambda**, uma automação do **Systems Manager** ou o **SNS**.'] },
        { conceptId: 'sec.containment', body: ['**Conter** primeiro: trocar os security groups por um grupo restritivo, sem apagar a instância. **Snapshot** dos volumes para a perícia. Trocar o security group não derruba as conexões já abertas.'] },
        { conceptId: 'gd.findings', body: ['Achado novo sai para o EventBridge quase em tempo real.'] },
      ],
      activities: [
        {
          id: 'sec.f08.m3.a1',
          kind: 'order',
          title: 'Do achado à contenção',
          prompt: 'Ponha na ordem a resposta automática a um achado de gravidade alta.',
          concepts: [{ id: 'sec.auto-response' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O achado vira evento, a regra filtra, a função contém e a equipe é avisada para investigar.'],
          steps: [
            { id: 'finding', text: 'O GuardDuty gera o achado Backdoor:EC2/C&CActivity.B', explanation: 'A detecção acontece sozinha.' },
            { id: 'event', text: 'O achado chega ao EventBridge como evento "GuardDuty Finding"', explanation: 'Quase em tempo real, para achados novos.' },
            { id: 'rule', text: 'A regra filtra os achados de gravidade alta e aciona a função', explanation: 'Só os achados que pedem ação automática.' },
            { id: 'contain', text: 'A função troca o security group da instância por um grupo de isolamento e tira um snapshot', explanation: 'Contém sem apagar as provas.' },
            { id: 'notify', text: 'A equipe recebe o aviso pelo SNS e começa a investigação', explanation: 'A investigação parte de uma instância já contida.' },
          ],
        },
        {
          id: 'sec.f08.m3.a2',
          kind: 'decision',
          title: 'Terminar ou isolar',
          prompt: 'A instância suspeita ainda está rodando. Um colega quer terminá-la na hora "para acabar com o problema". O que fazer?',
          concepts: [{ id: 'sec.containment' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Terminar apaga o disco e a memória, que são as provas. Isolar com um security group restritivo corta o tráfego novo e preserva a instância para a perícia.'],
          options: [
            { id: 'a', text: 'Isolar com um security group restritivo e tirar snapshot dos volumes antes de qualquer outra coisa', correct: true, consequence: 'O ataque para de se espalhar, e as provas ficam.' },
            { id: 'b', text: 'Terminar a instância imediatamente', correct: false, consequence: 'O problema some junto com as provas de como ele começou.' },
            { id: 'c', text: 'Reiniciar a instância', correct: false, consequence: 'Perde a memória e não corta o acesso do atacante.' },
          ],
        },
        {
          id: 'sec.f08.m3.a3',
          kind: 'decision',
          title: 'A conexão que continua',
          prompt: 'Depois de trocar o security group da instância, o time ainda vê uma conexão aberta com o servidor do atacante. Como isso é possível?',
          concepts: [{ id: 'sec.containment' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Trocar o security group bloqueia o tráfego novo, mas não derruba as conexões já rastreadas. Para cortar a sessão já aberta, é preciso outra medida de contenção.'],
          options: [
            { id: 'a', text: 'Trocar o security group não derruba as conexões já rastreadas; só bloqueia as novas', correct: true, consequence: 'O time decide como cortar a sessão aberta.' },
            { id: 'b', text: 'O security group novo não foi aplicado', correct: false, consequence: 'Ele foi aplicado: as conexões novas já estão bloqueadas.' },
          ],
        },
      ],
      debrief: { takeaways: ['GuardDuty, EventBridge e Lambda respondem em segundos.', 'Conter sem destruir as provas.', 'Security group novo não derruba conexões já abertas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f08.boss',
      title: 'A noite do ataque',
      type: 'boss',
      summary: 'Ataques na borda e uma instância comprometida na mesma noite.',
      briefing: {
        company: 'Loja Virtual Casa & Cia',
        role: 'Você coordena a resposta a um incidente.',
        situation: 'Numa mesma noite, o site recebeu um pico de tráfego falso, tentativas de injeção de SQL e scripts nos comentários, e o GuardDuty apontou uma instância de pagamentos falando com um servidor de comando e controle.',
        objective: 'Pôr cada ataque na camada que o barra e conduzir a resposta na ordem certa.',
        successCriteria: ['Cada ataque na proteção certa', 'A resposta na ordem certa'],
      },
      intel: [
        { conceptId: 'sec.defense-in-depth', body: ['Ataques de borda param na borda; o que passa é tarefa da detecção e da resposta.'] },
        { conceptId: 'sec.containment', body: ['Detectar, conter, erradicar, recuperar.'] },
      ],
      activities: [
        {
          id: 'sec.f08.boss.a1',
          kind: 'classify',
          title: 'Quem barra cada ataque',
          prompt: 'Classifique cada ataque pela proteção que o barra ou o descobre.',
          concepts: [{ id: 'sec.web-threats' }, { id: 'sec.defense-in-depth' }],
          xp: 80,
          difficulty: 3,
          explanation: ['Volume de tráfego: Shield. Injeção de SQL: grupo SQL database do WAF. XSS: Core rule set do WAF. Instância falando com comando e controle: GuardDuty, que detecta o que passou.'],
          bins: [
            { id: 'shield', label: 'Shield' },
            { id: 'sqli', label: 'WAF: SQL database' },
            { id: 'crs', label: 'WAF: Core rule set' },
            { id: 'gd', label: 'GuardDuty' },
          ],
          items: [
            { id: 'flood', text: 'Pico de tráfego falso para derrubar o site', bin: 'shield', explanation: 'Ataque de volume.', concepts: ['sec.web-threats'] },
            { id: 'sqli', text: "busca=mesa' UNION SELECT cartao FROM pagamentos--", bin: 'sqli', explanation: 'Injeção de SQL.', concepts: ['sec.web-threats'] },
            { id: 'xss', text: 'Comentário com <script> que rouba a sessão de quem abre o produto', bin: 'crs', explanation: 'Cross-site scripting.', concepts: ['sec.web-threats'] },
            { id: 'cc', text: 'A instância de pagamentos fala com um servidor de comando e controle', bin: 'gd', explanation: 'Algo passou pelas camadas; a detecção aponta.', concepts: ['sec.defense-in-depth'] },
          ],
        },
        {
          id: 'sec.f08.boss.a2',
          kind: 'order',
          title: 'A resposta ao incidente',
          prompt: 'Ponha na ordem a resposta à instância de pagamentos comprometida.',
          concepts: [{ id: 'sec.containment' }, { id: 'sec.auto-response', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          explanation: ['Primeiro detectar e analisar, depois conter e preservar as provas, então erradicar a causa e, por fim, recuperar com uma instância limpa.'],
          steps: [
            { id: 'detect', text: 'Confirmar o achado do GuardDuty e o alcance com o Detective', explanation: 'Detecção e análise.' },
            { id: 'contain', text: 'Trocar o security group por um grupo de isolamento e tirar snapshot dos volumes', explanation: 'Contenção sem perder as provas.' },
            { id: 'creds', text: 'Negar tudo à role da instância e girar os segredos que ela lia', explanation: 'Corta o que o atacante pode ter levado.' },
            { id: 'eradicate', text: 'Corrigir a vulnerabilidade que permitiu a invasão na imagem da aplicação', explanation: 'Erradicação da causa.' },
            { id: 'recover', text: 'Subir instâncias novas a partir da imagem corrigida', explanation: 'Recuperação.' },
          ],
        },
      ],
      debrief: { takeaways: ['Borda para volume e requisições maliciosas; detecção para o que passa.', 'Detectar, conter, erradicar, recuperar.'] },
    },
  ],
}
