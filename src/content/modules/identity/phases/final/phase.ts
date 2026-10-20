/** Desafio final — Arquitetura de Acesso (empresa fictícia: Ipê Pagamentos). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const IPE: ArchitectureLabConfig = {
  title: 'Relatório da Arquitetura de Acesso',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'menor', label: 'Menor privilégio', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente (acesso de emergência)', examDomain: 'd2' },
    { id: 'operacao', label: 'Operação em escala' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  groups: [{ id: 'credenciais', title: 'Credenciais de longo prazo onde havia alternativa' }],
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 19/10/2026.',
  steps: [
    {
      id: 'contas',
      title: 'Root e conta de gerenciamento',
      intro: 'A **Ipê Pagamentos** é uma fintech com 12 contas AWS numa organização: gerenciamento, segurança, produção, homologação e sandboxes. Os dados de clientes precisam ficar no Brasil.',
      questions: [
        {
          id: 'root-membros',
          prompt: 'O que fazer com o usuário raiz das 11 contas-membro?',
          options: [
            { id: 'central', label: 'Centralizar o acesso root e remover as credenciais root das contas-membro', scores: { seguro: 1, operacao: 1 }, consequence: 'Onze credenciais de acesso total deixam de existir; tarefas de root viram ações controladas da conta de gerenciamento.', concepts: ['org.root-access-central'] },
            { id: 'mfa', label: 'Registrar MFA em cada root e guardar as senhas num cofre', scores: { seguro: 0.7, operacao: 0.4 }, consequence: 'Protege, mas mantém onze credenciais de acesso total para administrar.', whyNot: 'Funciona, mas a centralização elimina o problema em vez de administrá-lo.', concepts: ['org.root-access-central', 'iam.mfa-root'] },
            { id: 'nada', label: 'Deixar como está, com senhas fortes', scores: { seguro: 0.1, operacao: 0.5 }, consequence: 'Root sem MFA viola a exigência da AWS e deixa onze portas de acesso total.', whyNot: 'A AWS exige MFA no root de todo tipo de conta.', concepts: ['iam.mfa-root', 'iam.root-best-practices'] },
          ],
        },
        {
          id: 'gestao',
          prompt: 'O que roda na conta de gerenciamento?',
          options: [
            { id: 'so-governanca', label: 'Só governança e faturamento; nenhuma aplicação', scores: { seguro: 1, menor: 1 }, consequence: 'Como SCPs não afetam a conta de gerenciamento, ela fica com o mínimo de cargas e de pessoas.', concepts: ['org.scp', 'org.organizations'] },
            { id: 'apps', label: 'Também o backoffice, para aproveitar a conta', scores: { seguro: 0.2, menor: 0.2 }, consequence: 'O backoffice fica numa conta que nenhuma SCP limita.', whyNot: 'SCPs não afetam a conta de gerenciamento: cargas ali ficam fora dos guardrails.', concepts: ['org.scp'] },
          ],
        },
      ],
    },
    {
      id: 'pessoas',
      title: 'Pessoas',
      intro: 'Os 300 funcionários já usam o **Okta** para tudo. Hoje, cada conta tem os próprios usuários IAM.',
      questions: [
        {
          id: 'funcionarios',
          prompt: 'Como os funcionários acessam as contas?',
          group: 'credenciais',
          options: [
            { id: 'idc', label: 'IAM Identity Center com o Okta como fonte de identidade e permission sets por função', scores: { seguro: 1, operacao: 1, requisitos: 1 }, consequence: 'Login único com MFA do Okta, credenciais temporárias e desligamento num lugar só.', concepts: ['fed.identity-center', 'fed.identity-source', 'fed.permission-sets'] },
            { id: 'usuarios', label: 'Usuários IAM em cada conta, com MFA', scores: { seguro: 0.4, operacao: 0.1, requisitos: 0.5 }, consequence: 'Credenciais de longo prazo espalhadas por 12 contas; desligar alguém vira uma caçada.', whyNot: 'Para pessoas, a AWS recomenda federação com credenciais temporárias.', concepts: ['fed.federation', 'iam.long-vs-temp'] },
            { id: 'compartilhado', label: 'Um usuário IAM por time, com senha compartilhada', scores: { seguro: 0, operacao: 0.3, requisitos: 0.2 }, consequence: 'Ninguém sabe quem fez o quê, e a senha circula.', whyNot: 'Credencial compartilhada elimina a rastreabilidade.', concepts: ['iam.users'] },
          ],
        },
        {
          id: 'emergencia',
          prompt: 'Como a equipe de plataforma entra se o Okta ficar fora do ar?',
          options: [
            { id: 'breakglass', label: 'Dois usuários IAM de emergência por conta crítica, com MFA, guardados e com alerta a cada uso', scores: { resiliente: 1, seguro: 1 }, consequence: 'A equipe entra durante a queda do IdP, e qualquer uso vira alerta.', concepts: ['iam.when-iam-user'] },
            { id: 'root', label: 'Pelo usuário raiz de cada conta', scores: { resiliente: 0.5, seguro: 0.1 }, consequence: 'Acesso total, e conflita com a remoção das credenciais root.', whyNot: 'O root fica para as tarefas que o exigem.', concepts: ['iam.root-best-practices'] },
            { id: 'nenhum', label: 'Esperar o Okta voltar', scores: { resiliente: 0, seguro: 1 }, consequence: 'Um incidente no IdP vira um incidente sem resposta na AWS.', whyNot: 'Acesso de emergência é uma das exceções previstas para usuários IAM.', concepts: ['iam.when-iam-user'] },
          ],
        },
      ],
    },
    {
      id: 'workloads',
      title: 'Workloads',
      intro: 'A API de pagamentos roda em instâncias **EC2**. Um servidor de compensação continua no **datacenter** da empresa e envia arquivos ao S3. Os desenvolvedores lançam instâncias.',
      questions: [
        {
          id: 'ec2',
          prompt: 'Como a API no EC2 obtém credenciais?',
          group: 'credenciais',
          options: [
            { id: 'profile', label: 'Role com instance profile', scores: { seguro: 1, menor: 1, operacao: 1 }, consequence: 'Credenciais temporárias renovadas automaticamente.', concepts: ['iam.instance-profile'] },
            { id: 'chave', label: 'Chave de acesso no arquivo de configuração da imagem (AMI)', scores: { seguro: 0, menor: 0.5, operacao: 0.3 }, consequence: 'Toda instância carrega uma credencial de longo prazo, e a imagem vira um vazamento esperando acontecer.', whyNot: 'No EC2, a role do instance profile dispensa qualquer chave.', concepts: ['iam.instance-profile', 'iam.access-keys'] },
          ],
        },
        {
          id: 'datacenter',
          prompt: 'E o servidor de compensação, fora da AWS?',
          group: 'credenciais',
          options: [
            { id: 'anywhere', label: 'IAM Roles Anywhere, com certificado da CA da empresa', scores: { seguro: 1, operacao: 1 }, consequence: 'O servidor troca o certificado por credenciais temporárias.', concepts: ['iam.roles-anywhere'] },
            { id: 'user', label: 'Usuário IAM com chave rotacionada a cada 90 dias', scores: { seguro: 0.5, operacao: 0.6 }, consequence: 'Funciona, com uma credencial de longo prazo para proteger.', whyNot: 'Existe alternativa com credenciais temporárias para servidores fora da AWS.', concepts: ['iam.roles-anywhere', 'iam.key-rotation'] },
          ],
        },
        {
          id: 'passrole',
          prompt: 'Que permissão os desenvolvedores recebem para associar roles às instâncias?',
          options: [
            { id: 'restrito', label: 'iam:PassRole só nas roles de aplicação, com iam:PassedToService = ec2.amazonaws.com', scores: { menor: 1, seguro: 1 }, consequence: 'Ninguém lança uma instância com uma role mais poderosa do que deveria.', concepts: ['iam.pass-role'] },
            { id: 'tudo', label: 'iam:PassRole em todas as roles', scores: { menor: 0.2, seguro: 0.4 }, consequence: 'Qualquer desenvolvedor pode lançar uma instância com a role de administração e usar as permissões dela.', whyNot: 'PassRole amplo é um caminho de escalada de privilégio.', concepts: ['iam.pass-role'] },
          ],
        },
      ],
    },
    {
      id: 'clientes',
      title: 'Clientes do aplicativo',
      intro: 'Os clientes se cadastram no app móvel (ou entram com Google) e enviam fotos de documentos direto para um bucket.',
      questions: [
        {
          id: 'app',
          prompt: 'Como identificar os clientes e dar acesso ao bucket?',
          options: [
            { id: 'pools', label: 'Cognito user pool para o login e identity pool para credenciais temporárias restritas', scores: { requisitos: 1, seguro: 1, operacao: 1 }, consequence: 'Cada cliente envia só para a própria pasta, com credenciais que expiram.', concepts: ['cognito.user-pool', 'cognito.identity-pool'] },
            { id: 'chave-app', label: 'Login próprio no backend e uma chave de acesso embutida no app para o upload', scores: { requisitos: 0.7, seguro: 0, operacao: 0.6 }, consequence: 'Qualquer um extrai a chave do app e usa fora dele.', whyNot: 'Credenciais nunca devem ir dentro de um app distribuído.', concepts: ['cognito.identity-pool'] },
            { id: 'iam-por-cliente', label: 'Um usuário IAM por cliente', scores: { requisitos: 0.3, seguro: 0.3, operacao: 0 }, consequence: 'Milhões de credenciais de longo prazo e cotas estouradas.', whyNot: 'Usuários IAM são para a conta, não para clientes de aplicativos.', concepts: ['cognito.user-pool'] },
          ],
        },
      ],
    },
    {
      id: 'parceiro',
      title: 'Parceiro de auditoria',
      intro: 'Uma empresa de auditoria, com conta AWS própria e outros clientes, precisa ler configurações das contas da Ipê.',
      questions: [
        {
          id: 'auditoria',
          prompt: 'Como dar acesso à auditoria?',
          group: 'credenciais',
          options: [
            { id: 'role-ext', label: 'Role somente leitura com trust para a conta da auditoria e sts:ExternalId', scores: { seguro: 1, menor: 1 }, consequence: 'Credenciais temporárias e proteção contra o assistente confuso.', concepts: ['iam.confused-deputy', 'iam.cross-account-role'] },
            { id: 'role-sem', label: 'Role somente leitura com trust para a conta da auditoria, sem External ID', scores: { seguro: 0.5, menor: 1 }, consequence: 'Outro cliente da auditoria poderia fazê-la acessar a Ipê.', whyNot: 'Fornecedores com vários clientes pedem External ID.', concepts: ['iam.confused-deputy'] },
            { id: 'usuario', label: 'Um usuário IAM com chave para a auditoria', scores: { seguro: 0.2, menor: 0.6 }, consequence: 'Uma credencial de longo prazo nas mãos de terceiros.', whyNot: 'Quem tem conta AWS deve usar role entre contas.', concepts: ['iam.cross-account-role'] },
          ],
        },
      ],
    },
    {
      id: 'guardrails',
      title: 'Guardrails',
      intro: 'A regulação exige dados no Brasil. A auditoria não pode ser desligada. Nenhum bucket pode ser acessado de fora da organização.',
      questions: [
        {
          id: 'regiao',
          prompt: 'Como garantir que produção só use sa-east-1?',
          options: [
            { id: 'scp', label: 'SCP na OU de produção negando ações fora de sa-east-1 (exceto serviços globais)', scores: { requisitos: 1, seguro: 1, operacao: 1 }, consequence: 'Vale para todos, inclusive o root das contas, sem depender de cada política.', concepts: ['org.scp', 'org.scp-inheritance'] },
            { id: 'iam', label: 'Condição aws:RequestedRegion em cada política IAM', scores: { requisitos: 0.5, seguro: 0.6, operacao: 0.2 }, consequence: 'Basta uma política esquecida para a regra falhar.', whyNot: 'Guardrail de conta pede SCP.', concepts: ['iam.condition-keys', 'org.scp'] },
          ],
        },
        {
          id: 'perimetro',
          prompt: 'Como impedir acesso aos buckets por quem é de fora da organização?',
          options: [
            { id: 'rcp', label: 'RCP na raiz negando S3 a principais sem o aws:PrincipalOrgID da organização', scores: { seguro: 1, requisitos: 1 }, consequence: 'Mesmo uma bucket policy errada não abre os dados para fora.', concepts: ['org.rcp'] },
            { id: 'scp-s3', label: 'SCP negando s3:* para principais de fora', scores: { seguro: 0.2, requisitos: 0.2 }, consequence: 'SCPs não afetam principais de fora da organização.', whyNot: 'Para recursos, venha de quem vier, o limite é a RCP.', concepts: ['org.scp', 'org.rcp'] },
          ],
        },
        {
          id: 'trilhas',
          prompt: 'Como proteger o CloudTrail?',
          options: [
            { id: 'scp-trail', label: 'SCP na raiz negando StopLogging e DeleteTrail', scores: { seguro: 1, operacao: 1 }, consequence: 'Nenhuma conta-membro desliga a auditoria.', concepts: ['org.scp'] },
            { id: 'confia', label: 'Confiar que os administradores não vão desligar', scores: { seguro: 0.2, operacao: 0.7 }, consequence: 'Um invasor com AdministratorAccess apaga o rastro.', whyNot: 'Guardrails existem para o que não pode depender de boa vontade.', concepts: ['org.scp'] },
          ],
        },
      ],
    },
    {
      id: 'delegacao',
      title: 'Delegação',
      intro: 'Os times querem criar roles para os próprios serviços sem esperar a equipe central.',
      questions: [
        {
          id: 'times',
          prompt: 'Como delegar a criação de roles?',
          options: [
            { id: 'boundary', label: 'Permitir criar roles só com o boundary dos times (condição iam:PermissionsBoundary) e proteger o boundary com Deny', scores: { menor: 1, operacao: 1, seguro: 1 }, consequence: 'Os times ganham autonomia sem conseguir criar algo mais poderoso que o limite.', concepts: ['iam.boundary-delegation', 'iam.permissions-boundary'] },
            { id: 'central', label: 'Manter tudo com a equipe central', scores: { menor: 0.9, operacao: 0.3, seguro: 1 }, consequence: 'Seguro, mas cada role nova leva dias.', whyNot: 'Boundaries resolvem a delegação sem perder o controle.', concepts: ['iam.boundary-delegation'] },
            { id: 'admin', label: 'Dar AdministratorAccess aos líderes técnicos', scores: { menor: 0.1, operacao: 1, seguro: 0.3 }, consequence: 'Rápido, e qualquer líder pode criar uma role com acesso total.', whyNot: 'Sem boundary, delegar é entregar o controle.', concepts: ['iam.permissions-boundary'] },
          ],
        },
      ],
    },
    {
      id: 'monitoramento',
      title: 'Monitoramento e menor privilégio',
      intro: 'A diretoria quer saber, continuamente, o que ficou acessível de fora e que permissões ninguém usa.',
      questions: [
        {
          id: 'analyzer',
          prompt: 'Que acompanhamento adotar?',
          options: [
            { id: 'aa', label: 'IAM Access Analyzer com a organização como zona de confiança, mais o analisador de acesso não usado', scores: { seguro: 1, menor: 1, operacao: 1 }, consequence: 'Acesso externo e permissões ociosas viram achados acompanhados.', concepts: ['iaa.external-access', 'iaa.unused-access'] },
            { id: 'anual', label: 'Uma revisão manual por ano', scores: { seguro: 0.4, menor: 0.4, operacao: 0.3 }, consequence: 'Um ano de exposição entre uma revisão e outra.', whyNot: 'Há análise contínua e automática disponível.', concepts: ['iaa.external-access'] },
          ],
        },
        {
          id: 'politicas',
          prompt: 'Como reduzir as políticas amplas herdadas?',
          options: [
            { id: 'gerar', label: 'Gerar políticas a partir do CloudTrail com o Access Analyzer, validar e aplicar', scores: { menor: 1, operacao: 1 }, consequence: 'Cada role fica com o que realmente usa.', concepts: ['iaa.policy-checks', 'iam.least-privilege'] },
            { id: 'manter', label: 'Manter as políticas amplas para não quebrar nada', scores: { menor: 0.1, operacao: 0.8 }, consequence: 'O excesso de permissão continua lá, à espera de um vazamento.', whyNot: 'Menor privilégio se constrói a partir do uso real.', concepts: ['iam.least-privilege'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'sem-root-sem-emergencia',
      when: [
        ['root-membros', ['central']],
        ['emergencia', ['root']],
      ],
      penalty: { resiliente: 0.5 },
      message: 'O plano de emergência depende do root das contas-membro, mas as credenciais root foram removidas: na queda do Okta, ninguém entra.',
      concepts: ['org.root-access-central', 'iam.when-iam-user'],
    },
    {
      id: 'app-na-gestao',
      when: [
        ['gestao', ['apps']],
        ['regiao', ['scp']],
      ],
      penalty: { requisitos: 0.3 },
      message: 'A SCP de Região não vale na conta de gerenciamento, onde ficou o backoffice: os dados dele podem sair do Brasil.',
      concepts: ['org.scp'],
    },
    {
      id: 'passrole-delegacao',
      when: [
        ['passrole', ['tudo']],
        ['times', ['admin', 'boundary']],
      ],
      penalty: { menor: 0.2 },
      message: 'Com iam:PassRole em todas as roles, quem cria instâncias pode usar qualquer role que os times criarem.',
      concepts: ['iam.pass-role'],
    },
  ],
}

export const FINAL_IAM: PhaseDef = {
  ...META.final,
  concepts: [
    'org.root-access-central',
    'iam.mfa-root',
    'iam.root-best-practices',
    'org.organizations',
    'org.scp',
    'org.scp-inheritance',
    'org.rcp',
    'fed.federation',
    'fed.identity-center',
    'fed.identity-source',
    'fed.permission-sets',
    'iam.long-vs-temp',
    'iam.users',
    'iam.when-iam-user',
    'iam.instance-profile',
    'iam.access-keys',
    'iam.roles-anywhere',
    'iam.key-rotation',
    'iam.pass-role',
    'cognito.user-pool',
    'cognito.identity-pool',
    'iam.confused-deputy',
    'iam.cross-account-role',
    'iam.condition-keys',
    'iam.boundary-delegation',
    'iam.permissions-boundary',
    'iaa.external-access',
    'iaa.unused-access',
    'iaa.policy-checks',
    'iam.least-privilege',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa e as contas são fictícias.'],
  missions: [
    {
      id: 'iax.final.ipe',
      title: 'Projeto Ipê Pagamentos',
      type: 'final',
      summary: 'Oito etapas de decisões de acesso, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Ipê Pagamentos',
        role: 'Você é a arquiteta responsável pelo desenho de acesso da fintech.',
        situation: 'Doze contas numa organização, funcionários no Okta, uma API no EC2, um servidor no datacenter, clientes num app móvel, um parceiro de auditoria e uma regulação que exige dados no Brasil.',
        objective: 'Decidir como cada um acessa a AWS e quais guardrails valem para todos, sem deixar a operação travada.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'fed.federation', body: ['Pessoas: federação. Workloads: roles. Clientes: Cognito. Parceiros: role entre contas. Guardrails: SCP e RCP. Decisões de uma etapa afetam as outras, e o relatório aponta os conflitos.'] },
        { conceptId: 'iam.least-privilege' },
      ],
      activities: [
        {
          id: 'iax.final.ipe.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Arquitetura de Acesso',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'fed.identity-center' }, { id: 'org.scp' }, { id: 'org.rcp' }, { id: 'iam.instance-profile' }, { id: 'cognito.identity-pool' }, { id: 'iam.confused-deputy' }, { id: 'iam.boundary-delegation' }, { id: 'iaa.external-access' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Credenciais de longo prazo só onde não há alternativa.', 'Lembre o que as SCPs não alcançam: a conta de gerenciamento e quem é de fora da organização.'],
          explanation: [
            'Projeto de referência: root centralizado; conta de gerenciamento só com governança; Identity Center com Okta; usuários de emergência com MFA; instance profile no EC2; Roles Anywhere no datacenter; PassRole restrito; Cognito com os dois pools; role com External ID para a auditoria; SCP de Região, RCP de perímetro e SCP do CloudTrail; delegação com boundary; Access Analyzer contínuo e políticas geradas pelo uso.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: IPE,
        },
      ],
      debrief: { takeaways: ['Cada tipo de quem acessa tem a sua solução de identidade.', 'Guardrails de organização valem para todos, mas não para a conta de gerenciamento.', 'Delegar com boundary dá autonomia sem perder o controle.', 'Menor privilégio é um processo contínuo, guiado pelo uso real.'] },
    },
  ],
}
