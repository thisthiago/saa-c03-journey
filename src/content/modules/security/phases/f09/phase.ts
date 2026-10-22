/**
 * Fase 9 — Escolhendo a proteção. O quadro "qual serviço responde" e a
 * escolha entre chave, segredo e certificado.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { SecChooserLabConfig } from '../../../../../simulators/secchooser/model'
import { META } from '../meta'

export const SABER_PEDIDOS: SecChooserLabConfig = {
  itemsLabel: 'Pedidos das áreas',
  options: ['kms', 'cloudhsm', 'secrets-manager', 'parameter-store', 'acm', 'guardduty', 'inspector', 'macie', 'detective', 'security-hub', 'config', 'cloudtrail', 'artifact', 'waf'],
  items: [
    { id: 'cpf', text: 'Descobrir CPFs de alunos espalhados nos buckets', dominant: 'pii-s3', needs: ['pii-s3'], concepts: ['sec.choose'] },
    { id: 'ip', text: 'Alertar quando uma chave de acesso for usada de um IP malicioso', dominant: 'threat-detect', needs: ['threat-detect'], concepts: ['sec.choose'] },
    { id: 'cve', text: 'Saber quais imagens de contêiner têm bibliotecas vulneráveis', dominant: 'vuln-scan', needs: ['vuln-scan'], concepts: ['sec.choose'] },
    { id: 'alcance', text: 'Descobrir até onde foi uma role comprometida', dominant: 'investigate', needs: ['investigate'], concepts: ['sec.choose'] },
    { id: 'cis', text: 'Conferir as 20 contas contra o CIS AWS Foundations Benchmark', dominant: 'posture', needs: ['posture'], concepts: ['sec.choose'] },
    { id: 'sg', text: 'Ver como o security group estava na semana passada e criar uma regra própria de conformidade', dominant: 'resource-config', needs: ['resource-config'], concepts: ['sec.choose'] },
    { id: 'quem', text: 'Saber quem apagou a tabela de notas ontem', dominant: 'api-audit', needs: ['api-audit'], concepts: ['sec.choose'] },
    { id: 'soc', text: 'Entregar ao auditor o relatório SOC da AWS', dominant: 'aws-reports', needs: ['aws-reports'], concepts: ['sec.choose'] },
    { id: 'diploma', text: 'Assinar os diplomas digitais com chaves num HSM dedicado, como exige o regulador', dominant: 'dedicated-hsm', needs: ['dedicated-hsm'], concepts: ['sec.which-protection'] },
    { id: 'senha', text: 'Girar a senha do banco de notas a cada 30 dias', dominant: 'rotate-secret', needs: ['rotate-secret'], concepts: ['sec.which-protection'] },
    { id: 'portal', text: 'Certificado do portal do aluno no ALB, sem se preocupar com a renovação', dominant: 'tls-cert', needs: ['tls-cert'], concepts: ['sec.which-protection'] },
    { id: 'sqli', text: 'Barrar injeção de SQL no portal do aluno', dominant: 'web-attacks', needs: ['web-attacks'], concepts: ['sec.choose'] },
  ],
}

export const F09_SEC: PhaseDef = {
  ...META.f09,
  concepts: ['sec.choose', 'sec.which-protection'],
  availability: 'available',
  simplifications: ['Cada pedido tem um requisito que decide; na prática, a segurança combina vários serviços.', 'O grupo educacional e os pedidos são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f09.m1',
      title: 'Cada pergunta, um serviço',
      type: 'mission',
      summary: 'O quadro "qual serviço responde".',
      briefing: {
        company: 'Grupo Educacional Saber',
        role: 'Você monta o mapa de serviços de segurança de um grupo educacional.',
        situation: 'Cada área do grupo pediu "uma ferramenta de segurança". Antes de comprar qualquer coisa, a diretoria quer saber que pergunta cada serviço da AWS responde.',
        objective: 'Ligar cada pergunta ao serviço que a responde.',
        successCriteria: ['Separar CloudTrail de Config', 'Separar GuardDuty, Inspector, Macie e Detective'],
      },
      intel: [{ conceptId: 'sec.choose', body: ['**Quem fez o quê?** CloudTrail. **Como estava configurado?** Config. **Ameaça agora?** GuardDuty. **Vulnerável?** Inspector. **Dados pessoais?** Macie. **Como chegou aqui?** Detective. **Diante dos padrões?** Security Hub CSPM.'] }],
      activities: [
        {
          id: 'sec.f09.m1.a1',
          kind: 'match',
          title: 'A pergunta e o serviço',
          prompt: 'Associe cada pergunta ao serviço que a responde.',
          concepts: [{ id: 'sec.choose' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada serviço guarda ou analisa uma coisa diferente: chamadas de API, configuração, comportamento, software, conteúdo do S3, histórico de investigação.'],
          leftLabel: 'Pergunta',
          rightLabel: 'Serviço',
          pairs: [
            { id: 'trail', left: 'Quem desligou o versionamento do bucket?', right: 'AWS CloudTrail', explanation: 'A chamada de API registrada.', concepts: ['sec.choose'] },
            { id: 'config', left: 'Desde quando o versionamento está desligado?', right: 'AWS Config', explanation: 'O histórico de configuração do recurso.', concepts: ['sec.choose'] },
            { id: 'gd', left: 'Alguém está usando credenciais roubadas agora?', right: 'Amazon GuardDuty', explanation: 'Detecção de ameaças.', concepts: ['sec.choose'] },
            { id: 'macie', left: 'Há dados de alunos nesse bucket?', right: 'Amazon Macie', explanation: 'Dados sensíveis no S3.', concepts: ['sec.choose'] },
          ],
        },
        {
          id: 'sec.f09.m1.a2',
          kind: 'decision',
          title: 'Config ou CloudTrail',
          prompt: 'O auditor quer a lista de buckets que estiveram sem criptografia padrão em algum momento do último ano. Qual serviço responde direto?',
          concepts: [{ id: 'sec.choose' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O AWS Config guarda o histórico de configuração de cada recurso e avalia regras sobre ele. O CloudTrail mostra as chamadas que mudaram a configuração, mas não a situação de cada recurso ao longo do tempo.'],
          options: [
            { id: 'a', text: 'AWS Config', correct: true, consequence: 'O histórico mostra a configuração de cada bucket em cada momento.' },
            { id: 'b', text: 'AWS CloudTrail', correct: false, consequence: 'Mostra quem chamou as APIs, não o estado de cada bucket ao longo do tempo.' },
          ],
        },
      ],
      debrief: { takeaways: ['CloudTrail: chamadas. Config: configuração ao longo do tempo.', 'Cada serviço de segurança responde uma pergunta.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f09.m2',
      title: 'Chave, segredo ou certificado',
      type: 'mission',
      summary: 'KMS, CloudHSM, Secrets Manager, Parameter Store e ACM.',
      briefing: {
        company: 'Grupo Educacional Saber',
        role: 'Você define onde ficam as chaves, os segredos e os certificados.',
        situation: 'A área de tecnologia misturou tudo: certificados guardados no Secrets Manager, senhas no Parameter Store sem rotação e chaves de cifrar arquivos num bucket.',
        objective: 'Pôr cada coisa no serviço certo.',
        successCriteria: ['Associar cada necessidade ao serviço'],
      },
      intel: [{ conceptId: 'sec.which-protection', body: ['Repouso: **KMS** (CloudHSM se a regra pedir HSM dedicado). Senha que gira: **Secrets Manager**. Configuração: **Parameter Store**. Trânsito: **ACM**.'] }],
      activities: [
        {
          id: 'sec.f09.m2.a1',
          kind: 'match',
          title: 'Cada coisa no seu lugar',
          prompt: 'Associe cada necessidade ao serviço.',
          concepts: [{ id: 'sec.which-protection' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Chave para dados em repouso: KMS. Senha que gira: Secrets Manager. Configuração: Parameter Store. Certificado TLS: ACM.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Serviço',
          pairs: [
            { id: 'kms', left: 'Cifrar os boletos guardados no S3', right: 'AWS KMS', explanation: 'Criptografia em repouso.', concepts: ['sec.which-protection'] },
            { id: 'sm', left: 'Senha do banco que gira todo mês', right: 'AWS Secrets Manager', explanation: 'Rotação automática.', concepts: ['sec.which-protection'] },
            { id: 'ps', left: 'Endereço do servidor de e-mail de cada ambiente', right: 'Parameter Store', explanation: 'Configuração.', concepts: ['sec.which-protection'] },
            { id: 'acm', left: 'HTTPS no load balancer do portal', right: 'AWS Certificate Manager', explanation: 'Certificado TLS.', concepts: ['sec.which-protection'] },
          ],
        },
      ],
      debrief: { takeaways: ['KMS para repouso, ACM para trânsito.', 'Secrets Manager para o que gira, Parameter Store para configuração.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f09.boss',
      title: 'Doze pedidos, doze serviços',
      type: 'boss',
      summary: 'Cada pedido das áreas pelo serviço de segurança certo.',
      briefing: {
        company: 'Grupo Educacional Saber',
        role: 'Você fecha o mapa de serviços de segurança.',
        situation: 'Doze pedidos chegaram de secretaria, tecnologia, auditoria, jurídico e diretoria.',
        objective: 'Escolher o serviço de cada pedido, com o mínimo de operação.',
        successCriteria: ['Todos os pedidos atendidos', 'A opção mais simples em cada caso'],
      },
      intel: [{ conceptId: 'sec.choose', body: ['Olhe a pergunta que cada pedido faz e o serviço que a responde.'] }],
      activities: [
        {
          id: 'sec.f09.boss.a1',
          kind: 'lab',
          lab: 'sec-chooser',
          title: 'O mapa da segurança',
          prompt: 'Para cada pedido, escolha o serviço. Depois da verificação, cada cartão mostra o que a escolha atende ou não.',
          concepts: [{ id: 'sec.choose' }, { id: 'sec.which-protection' }],
          xp: 200,
          difficulty: 3,
          hints: ['O Config também confere conformidade, mas montar o CIS regra a regra dá mais trabalho que ligar o padrão pronto.', 'Sem exigência de HSM dedicado, o KMS basta.'],
          explanation: [
            'Macie para CPFs; GuardDuty para o IP malicioso; Inspector para as imagens; Detective para o alcance da role; Security Hub CSPM para o CIS; Config para o histórico do security group.',
            'CloudTrail para quem apagou a tabela; Artifact para o SOC; CloudHSM para os diplomas; Secrets Manager para a senha; ACM para o portal; WAF para a injeção de SQL.',
          ],
          config: SABER_PEDIDOS,
        },
      ],
      debrief: { takeaways: ['A pergunta aponta o serviço.', 'Quando duas opções atendem, a com menos operação vale mais.'] },
    },
  ],
}
