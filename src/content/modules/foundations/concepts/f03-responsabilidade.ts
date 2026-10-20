/**
 * Conceitos da Fase 3 — Shared Responsibility Model.
 * Fatos conferidos em 18/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const SRM = { title: 'Shared Responsibility Model', url: 'https://aws.amazon.com/compliance/shared-responsibility-model/' }
const LAMBDA_SEC = { title: 'Security in AWS Lambda', url: 'https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html' }
const LAMBDA_RT = { title: 'Understanding how Lambda manages runtime version updates', url: 'https://docs.aws.amazon.com/lambda/latest/dg/runtimes-update.html' }
const RDS_SEC = { title: 'Security in Amazon RDS', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html' }
const RDS_MAINT = { title: 'Maintaining a DB instance', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html' }
const OP_SEC = { title: 'Security in AWS Outposts', url: 'https://docs.aws.amazon.com/outposts/latest/userguide/security.html' }
const OP_FAQ = { title: 'AWS Outposts rack FAQs', url: 'https://aws.amazon.com/outposts/rack/faqs/' }

export const F03_FOUNDATIONS_CONCEPTS: ConceptDef[] = [
  {
    id: 'srm.model',
    title: 'Modelo de Responsabilidade Compartilhada',
    officialName: 'AWS Shared Responsibility Model',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'A segurança é dividida: a AWS cuida da **segurança DA nuvem** (a infraestrutura que executa os serviços: hardware, software, rede e instalações); o cliente cuida da **segurança NA nuvem**, e o tamanho dessa parte depende dos serviços que escolhe.',
    facts: ['A responsabilidade do cliente é determinada pelos serviços que ele seleciona, além da sensibilidade dos dados, dos requisitos da empresa e das leis aplicáveis.'],
    exam: { domains: ['d1'], relevance: 'alta', notes: 'O guia do SAA-C03 cita "The AWS shared responsibility model" na tarefa 1.1.' },
    references: [SRM, LAMBDA_SEC],
    tags: ['seguranca', 'fundamentos'],
  },
  {
    id: 'srm.aws-scope',
    title: 'Segurança DA nuvem',
    officialName: 'Security of the cloud',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'A AWS protege a infraestrutura que executa todos os serviços: **instalações físicas**, **hardware**, **rede física** e o software das camadas que ela gerencia. Controles físicos e ambientais são **herdados** pelo cliente.',
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca', 'fundamentos'],
  },
  {
    id: 'srm.customer-scope',
    title: 'Segurança NA nuvem',
    officialName: 'Security in the cloud',
    serviceIds: ['aws.global-infrastructure', 'aws.iam'],
    summary: 'O cliente responde pelo que está sob o seu controle: **dados** (classificação, criptografia escolhida), **identidades e permissões**, **configuração dos recursos** e **regras de rede**. Em nenhum serviço isso passa para a AWS.',
    commonMistakes: ['Achar que, num serviço gerenciado, a AWS também decide quem pode acessar os dados.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca', 'fundamentos'],
  },
  {
    id: 'srm.by-service',
    title: 'A divisão muda com o serviço',
    officialName: 'Shared responsibility by service type',
    serviceIds: ['aws.ec2', 'aws.rds', 'aws.lambda', 'aws.s3'],
    summary: 'Em **infraestrutura** (EC2), o cliente gerencia o SO convidado, os patches e o firewall. Em **serviços gerenciados** (RDS), a AWS opera SO e motor, mas o cliente decide janelas e versões. Em **serverless** e serviços abstratos (Lambda, S3), a AWS opera SO e plataforma; o cliente cuida de código, dados e permissões.',
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM, LAMBDA_RT, RDS_MAINT],
    tags: ['seguranca'],
  },
  {
    id: 'srm.shared-controls',
    title: 'Controles compartilhados',
    officialName: 'Shared controls',
    serviceIds: ['aws.global-infrastructure'],
    summary: 'Controles que valem nas duas camadas, cada parte no seu contexto: **gestão de patches** (AWS na infraestrutura; cliente no SO convidado e nas aplicações), **gestão de configuração** e **conscientização e treinamento** (cada um treina seus funcionários).',
    exam: { domains: ['d1'], relevance: 'media' },
    references: [SRM],
    tags: ['seguranca'],
  },
  {
    id: 'srm.ec2',
    title: 'Responsabilidades no EC2',
    officialName: 'Amazon EC2 — customer responsibilities',
    serviceIds: ['aws.ec2'],
    summary: 'No EC2, o cliente faz toda a configuração de segurança: **atualizações e patches do SO convidado**, software instalado, **security groups**, perfis de instância e dados.',
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca'],
  },
  {
    id: 'srm.rds',
    title: 'Responsabilidades no RDS',
    officialName: 'Amazon RDS — shared responsibilities',
    serviceIds: ['aws.rds'],
    summary: 'A AWS opera o hardware e executa as atualizações de SO e do motor. Mas **atualizações opcionais de SO não são aplicadas automaticamente**, e o cliente escolhe a **janela de manutenção**; ele também cuida de security groups, usuários do banco, IAM e criptografia.',
    facts: ['Atualizações de SO obrigatórias têm data e são aplicadas depois dela, numa janela de manutenção.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [RDS_SEC, RDS_MAINT],
    tags: ['seguranca'],
  },
  {
    id: 'srm.lambda',
    title: 'Responsabilidades no Lambda',
    officialName: 'AWS Lambda — shared responsibilities',
    serviceIds: ['aws.lambda'],
    summary: 'Com runtime gerenciado no modo Auto, a AWS aplica as atualizações do runtime. O cliente cuida do **código**, das **dependências**, da **função de execução (IAM)** e dos dados. Em funções com **imagem de contêiner**, reconstruir a imagem com os patches é tarefa do cliente.',
    exam: { domains: ['d1'], relevance: 'media' },
    references: [LAMBDA_SEC, LAMBDA_RT],
    tags: ['seguranca'],
  },
  {
    id: 'srm.s3',
    title: 'Responsabilidades no S3',
    officialName: 'Amazon S3 — customer responsibilities',
    serviceIds: ['aws.s3'],
    summary: 'A AWS opera infraestrutura, SO e plataforma. O cliente gerencia os **dados** (inclusive as opções de criptografia) e **quem acessa**: políticas IAM, bucket policies e Block Public Access.',
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [SRM],
    tags: ['seguranca'],
  },
  {
    id: 'srm.outposts',
    title: 'Responsabilidades no Outposts',
    officialName: 'AWS Outposts — physical security',
    serviceIds: ['aws.outposts'],
    summary: 'No Outposts, a regra de "segurança física é da AWS" muda: o equipamento fica no local do cliente, e o **cliente responde pela segurança física e pelo controle de acesso** em volta dele, além de energia e rede do local.',
    facts: ['Antes da devolução do hardware, a AWS remove a Nitro Security Key, o que torna os dados criptograficamente irrecuperáveis.'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [OP_SEC, OP_FAQ],
    tags: ['seguranca', 'hibrido'],
  },
  {
    id: 'srm.incident',
    title: 'Incidente: de quem é a causa?',
    officialName: 'Shared responsibility in incident analysis',
    serviceIds: ['aws.global-infrastructure', 'aws.health'],
    summary: 'Num incidente, cada causa cai num lado: patch não aplicado no EC2, bucket público ou permissão excessiva são do cliente; falha de hardware sob um serviço gerenciado é da AWS. Mas **a resiliência a falhas da AWS é responsabilidade do cliente**: Multi-AZ, backups e arquitetura.',
    recommendations: ['Para cada causa, pergunte "quem controla esta camada neste serviço?" antes de atribuir culpa.'],
    exam: { domains: ['d1', 'd2'], relevance: 'media' },
    references: [SRM],
    tags: ['seguranca', 'disponibilidade'],
  },
]
