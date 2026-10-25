/**
 * Conceitos da Fase 8 — Ameaças externas e resposta.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F08_SEC_CONCEPTS: ConceptDef[] = [
  {
    id: 'sec.web-threats',
    title: 'Ameaças vindas de fora',
    officialName: 'DDoS, SQL injection and cross-site scripting',
    serviceIds: ['aws.waf', 'aws.shield'],
    summary: '**DDoS** tenta derrubar o site com tráfego demais. **Injeção de SQL** coloca comandos de banco num campo do formulário. **Cross-site scripting** (XSS) coloca um script que roda no navegador de outros clientes. No WAF, o grupo gerenciado **SQL database** (`AWSManagedRulesSQLiRuleSet`) barra injeção de SQL, e o **Core rule set** (`AWSManagedRulesCommonRuleSet`) traz regras contra XSS.',
    comparisons: [{ with: 'edgesec.waf-managed', text: 'A trilha de Redes apresenta as regras gerenciadas do WAF; aqui elas aparecem ligadas a cada tipo de ataque.' }],
    facts: ['O Core rule set cobre vulnerabilidades comuns descritas no OWASP Top 10 e serve para qualquer uso do WAF.', 'O grupo SQL database é indicado para aplicações que falam com um banco SQL.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'A tarefa 1.2 do exame cita DDoS e injeção de SQL como ameaças vindas de fora. DDoS pede o Shield (e o WAF na camada de aplicação); injeção de SQL e XSS pedem o WAF com as regras gerenciadas.',
    },
    references: [R.wafBaseline, R.wafUseCase, R.examDomain1],
    tags: ['seguranca'],
  },
  {
    id: 'sec.defense-in-depth',
    title: 'Defesa em camadas',
    officialName: 'Defense in depth',
    serviceIds: ['aws.shield', 'aws.waf', 'aws.vpc', 'aws.guardduty'],
    summary: 'Nenhuma camada sozinha basta. Na **borda**, Shield e WAF barram volume e requisições maliciosas. Na **rede**, security groups e sub-redes privadas limitam quem chega à aplicação. Na **identidade**, roles com privilégio mínimo. Nos **dados**, criptografia. Por cima de tudo, **detecção** com o GuardDuty para o que passar.',
    commonMistakes: ['Ligar o WAF e deixar o banco numa sub-rede pública'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Quando várias alternativas resolvem parte do problema, a melhor costuma ser a que combina camadas: borda, rede, identidade, dados e detecção.',
    },
    references: [R.wafBaseline, R.gdWhat],
    tags: ['seguranca'],
  },
  {
    id: 'sec.auto-response',
    title: 'Resposta automática a achados',
    officialName: 'Automated response with Amazon EventBridge',
    serviceIds: ['aws.guardduty', 'aws.eventbridge', 'aws.lambda', 'aws.systems-manager'],
    summary: 'O GuardDuty publica cada achado no **EventBridge**. Uma **regra** filtra pelo tipo ou pela gravidade e aciona um **alvo**: uma função **Lambda** ou uma automação do **Systems Manager** que corrige, um tópico do **SNS** que avisa a equipe. A resposta começa em segundos, sem esperar alguém abrir o console.',
    facts: ['O evento do achado tem source "aws.guardduty" e detail-type "GuardDuty Finding".', 'O Security Hub CSPM também se integra ao EventBridge para respostas automáticas.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "responder automaticamente a achados de segurança em segundos". A resposta é uma regra do EventBridge que aciona uma Lambda ou uma automação do Systems Manager.',
    },
    references: [R.gdEventBridge, R.shubCspm],
    reviewItems: [
      {
        id: 'rv:sec.auto-response:1',
        kind: 'decision',
        title: 'Achado de madrugada',
        prompt: 'Como fazer um achado do GuardDuty de gravidade alta isolar a instância sozinho, a qualquer hora?',
        concepts: [{ id: 'sec.auto-response' }],
        xp: 5,
        difficulty: 1,
        explanation: ['O GuardDuty publica os achados no EventBridge; uma regra filtra a gravidade e aciona a função que isola a instância.'],
        options: [
          { id: 'a', text: 'Uma regra do EventBridge que filtra os achados e aciona uma função Lambda', correct: true, consequence: 'A resposta começa em segundos.' },
          { id: 'b', text: 'Uma pessoa de plantão olhando o console', correct: false, consequence: 'Depende de alguém ver a tempo.' },
        ],
      },
      {
        id: 'rv:sec.auto-response:2',
        kind: 'decision',
        title: 'O evento do achado',
        prompt: 'Que evento a regra do EventBridge deve esperar para reagir a um achado novo do GuardDuty?',
        concepts: [{ id: 'sec.auto-response' }],
        xp: 5,
        difficulty: 2,
        explanation: ['O evento tem source "aws.guardduty" e detail-type "GuardDuty Finding"; achados novos saem quase em tempo real.'],
        options: [
          { id: 'a', text: 'source aws.guardduty e detail-type GuardDuty Finding', correct: true, consequence: 'A regra recebe cada achado novo.' },
          { id: 'b', text: 'Um alarme do CloudWatch de CPU alta', correct: false, consequence: 'CPU alta não é o achado.' },
        ],
      },
    ],
    tags: ['seguranca'],
  },
  {
    id: 'sec.containment',
    title: 'Conter sem destruir as provas',
    officialName: 'Incident containment',
    serviceIds: ['aws.ec2', 'aws.iam', 'aws.ebs'],
    summary: 'Diante de uma instância comprometida, a primeira meta é **conter**: trocar os security groups por um **grupo restritivo**, que corta o tráfego novo, sem apagar a instância. Para uma credencial comprometida, anexar uma política que **nega tudo**. O **snapshot** dos volumes guarda o disco para a perícia. Apagar tudo de cara destrói as provas.',
    commonMistakes: ['Terminar a instância suspeita na hora e perder o disco e a memória para a investigação'],
    facts: [
      'Trocar o security group não derruba as conexões já rastreadas; só bloqueia o tráfego novo.',
      'O ciclo do incidente segue detecção e análise, contenção, erradicação e recuperação.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "isolar uma instância comprometida preservando as provas". A resposta troca o security group por um restritivo e tira snapshots, sem terminar a instância.',
    },
    references: [R.irContain],
    tags: ['seguranca'],
  },
]
