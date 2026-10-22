/**
 * Conceitos da Fase 8 — Segurança e backup.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * Reaproveita rds.automated-backups, rds.pitr, rds.snapshots e rds.subnet-group
 * desta trilha. KMS e Secrets Manager são aprofundados no plano de Segurança, e o
 * AWS Backup no plano de Arquivos e backup.
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F08_DB_CONCEPTS: ConceptDef[] = [
  {
    id: 'db.encryption-at-rest',
    title: 'Criptografia em repouso',
    officialName: 'Encrypting Amazon RDS resources',
    serviceIds: ['aws.rds', 'aws.kms'],
    summary: 'No RDS, a criptografia em repouso (AES-256, com chave do **KMS**) cobre o armazenamento, os **logs**, os **backups**, as **réplicas** e os **snapshots**. Ela **só é escolhida na criação**: para criptografar um banco existente, tire um snapshot, **copie com criptografia** e **restaure numa instância nova**. Depois de ligada, **não dá para desligar**.',
    facts: [
      'Réplica e origem precisam ter o mesmo estado de criptografia: não existe réplica criptografada de um banco sem criptografia.',
      'A chave KMS de uma instância criptografada não muda depois; para trocar, copie um snapshot com outra chave.',
      'Um Blue/Green Deployment também pode criar o ambiente novo já criptografado.',
      'No DynamoDB, toda tabela é criptografada em repouso; por padrão, com uma chave da AWS sem custo extra.',
    ],
    commonMistakes: ['Procurar a opção de ligar a criptografia numa instância que já existe'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.rdsEncryption, R.ddbEncryption],
    tags: ['seguranca'],
  },
  {
    id: 'db.tls',
    title: 'Criptografia em trânsito',
    officialName: 'SSL/TLS connections to Amazon RDS',
    serviceIds: ['aws.rds'],
    summary: 'Conexões com o RDS podem usar **TLS**. No PostgreSQL, o RDS usa e espera TLS por padrão, e o parâmetro **rds.force_ssl** **obriga** que toda conexão use TLS. Os dados replicados entre a origem e as réplicas trafegam criptografados.',
    commonMistakes: ['Achar que a criptografia em repouso também protege os dados que trafegam na rede'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.rdsSsl, R.rdsPgSsl],
    tags: ['seguranca'],
  },
  {
    id: 'db.iam-auth',
    title: 'Autenticação IAM no banco',
    officialName: 'IAM database authentication',
    serviceIds: ['aws.rds', 'aws.iam'],
    summary: 'No **MariaDB**, no **MySQL** e no **PostgreSQL** (no RDS e no Aurora), a aplicação pode entrar com um **token** gerado pelo IAM, válido por **15 minutos**, em vez de uma senha. O acesso é controlado por políticas IAM, e uma instância EC2 usa as credenciais da própria role.',
    facts: ['O tráfego dessas conexões é criptografado com TLS.', 'A autenticação IAM consome memória extra no banco.'],
    commonMistakes: ['Guardar a senha do banco num arquivo de configuração da instância EC2'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.rdsIamAuth],
    tags: ['seguranca'],
  },
  {
    id: 'db.secrets',
    title: 'Senha do banco no Secrets Manager',
    officialName: 'Amazon RDS integration with AWS Secrets Manager',
    serviceIds: ['aws.rds', 'aws.secrets-manager'],
    summary: 'O RDS pode **gerar a senha do usuário mestre**, guardá-la no **Secrets Manager** e **rodá-la** sozinho (a cada **7 dias** por padrão), sem mudar a aplicação. Ninguém vê a senha em texto claro, e o acesso ao segredo é controlado por IAM.',
    facts: ['A aplicação busca o segredo por uma chamada de API, em vez de ter a senha no código.', 'Apagar a instância apaga também o segredo gerenciado por ela.'],
    commonMistakes: ['Colocar a senha do banco no código ou em variáveis de ambiente versionadas'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.rdsSecrets, R.secretsWhat],
    tags: ['seguranca'],
  },
  {
    id: 'db.private-access',
    title: 'Acesso privado ao banco',
    officialName: 'Private access to databases',
    serviceIds: ['aws.rds', 'aws.dynamodb', 'aws.vpc'],
    summary: 'Banco relacional em **subnets privadas**, com **Public access desligado** e security group aceitando **só o security group da aplicação**. Para o **DynamoDB**, um **endpoint de gateway** leva o tráfego da VPC até o serviço **sem internet gateway nem NAT**, sem custo adicional. No DynamoDB, a condição **dynamodb:LeadingKeys** limita cada usuário aos itens da própria chave de partição.',
    commonMistakes: ['Liberar 0.0.0.0/0 na porta do banco para facilitar testes', 'Mandar o tráfego da aplicação para o DynamoDB pela internet, por um NAT'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.rdsVpc, R.gatewayEndpoints, R.ddbFineGrained],
    tags: ['seguranca'],
  },
  {
    id: 'bkp.deletion-protection',
    title: 'Proteção contra exclusão',
    officialName: 'Deletion protection',
    serviceIds: ['aws.rds'],
    summary: 'Com a **proteção contra exclusão** ligada, o banco **não pode ser apagado** até alguém desligá-la. Ela vem **ligada por padrão** em bancos criados pelo console. Ao apagar uma instância, você ainda escolhe se tira um **snapshot final** e se **guarda os backups automáticos**.',
    facts: ['Desligar a proteção não causa parada.', 'Sem reter os backups automáticos, eles são apagados junto com a instância; snapshots manuais continuam.'],
    commonMistakes: ['Apagar um banco sem snapshot final e sem reter os backups automáticos'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.rdsDelete],
    tags: ['recuperacao'],
  },
  {
    id: 'bkp.aws-backup',
    title: 'AWS Backup para bancos',
    officialName: 'AWS Backup',
    serviceIds: ['aws.backup'],
    summary: 'O **AWS Backup** centraliza os backups de vários serviços (RDS, Aurora, DynamoDB, EBS, EFS e outros) em **planos de backup** e **cofres**. O conteúdo de cada backup é **imutável**, e o **Vault Lock** aplica o modelo **WORM** (gravar uma vez, ler muitas). Ele também gerencia cópias **entre contas** da organização.',
    facts: ['No modo compliance, depois do período de carência, um cofre com backups não pode ser apagado.', 'No modo governance, quem tem permissão suficiente pode remover a trava.', 'O Vault Lock não tem custo adicional.', 'O serviço é aprofundado na trilha Arquivos e backup na AWS.'],
    commonMistakes: ['Configurar o backup de cada banco separadamente quando a empresa precisa de uma política única e auditável'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.backupWhat, R.backupVaultLock],
    tags: ['recuperacao'],
  },
]
