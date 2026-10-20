/**
 * Modelo de Responsabilidade Compartilhada por serviço e camada.
 *
 * Conferido em 18/10/2026:
 * - Modelo geral (security OF/IN the cloud; EC2 × serviços abstratos; controles
 *   compartilhados e herdados): https://aws.amazon.com/compliance/shared-responsibility-model/
 * - Lambda: runtimes gerenciados recebem atualizações automáticas no modo Auto;
 *   em imagens de contêiner, o cliente reconstrói a imagem:
 *   https://docs.aws.amazon.com/lambda/latest/dg/runtimes-update.html
 * - RDS: atualizações de SO opcionais não são aplicadas automaticamente; as
 *   obrigatórias são aplicadas após a data, na janela de manutenção escolhida
 *   pelo cliente: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html
 *
 * Simplificações: Lambda considerada com pacote .zip e runtime gerenciado no
 * modo Auto; "compartilhado" significa que a AWS executa uma parte e o cliente
 * decide ou executa outra.
 */

export type SrmService = 'ec2' | 'rds' | 'lambda' | 's3'
export type SrmLayer = 'physical' | 'hardware' | 'os' | 'platform' | 'network' | 'iam' | 'data'
export type Owner = 'aws' | 'customer' | 'shared'

export const SERVICE_INFO: Record<SrmService, { name: string; model: string }> = {
  ec2: { name: 'Amazon EC2', model: 'Infraestrutura (IaaS)' },
  rds: { name: 'Amazon RDS', model: 'Serviço gerenciado' },
  lambda: { name: 'AWS Lambda', model: 'Serverless (.zip, runtime gerenciado)' },
  s3: { name: 'Amazon S3', model: 'Serviço abstrato' },
}

export const LAYER_LABEL: Record<SrmLayer, string> = {
  physical: 'Segurança física dos data centers',
  hardware: 'Hardware, rede física e virtualização',
  os: 'Patches do sistema operacional',
  platform: 'Patches do runtime ou do motor do banco',
  network: 'Regras de acesso de rede (security groups, acesso público)',
  iam: 'Permissões IAM do recurso e de quem o usa',
  data: 'Dados: classificação, retenção e escolha da criptografia',
}

export const OWNER_LABEL: Record<Owner, string> = { aws: 'AWS', customer: 'Cliente', shared: 'Compartilhado' }

type Cell = { owner: Owner; why: string }
const aws = (why: string): Cell => ({ owner: 'aws', why })
const cust = (why: string): Cell => ({ owner: 'customer', why })
const shared = (why: string): Cell => ({ owner: 'shared', why })

export const SRM_MATRIX: Record<SrmLayer, Record<SrmService, Cell>> = {
  physical: {
    ec2: aws('Segurança "da" nuvem: controle físico e ambiental é herdado da AWS.'),
    rds: aws('Segurança "da" nuvem: controle físico é da AWS em qualquer serviço.'),
    lambda: aws('Segurança "da" nuvem: controle físico é da AWS.'),
    s3: aws('Segurança "da" nuvem: controle físico é da AWS.'),
  },
  hardware: {
    ec2: aws('A AWS protege a infraestrutura que executa os serviços: hardware, rede física e hypervisor.'),
    rds: aws('A AWS opera o hardware e a rede por trás das instâncias de banco.'),
    lambda: aws('A AWS opera a frota que executa as funções.'),
    s3: aws('A AWS opera toda a infraestrutura de armazenamento.'),
  },
  os: {
    ec2: cust('No EC2, o sistema operacional convidado é do cliente: atualizações e patches de segurança são dele.'),
    rds: shared('A AWS executa as atualizações de SO; as opcionais não são aplicadas sozinhas e o cliente decide quando aplicar, e escolhe a janela de manutenção das obrigatórias.'),
    lambda: aws('Não há SO do cliente: com runtime gerenciado no modo Auto, a AWS aplica as atualizações.'),
    s3: aws('Num serviço abstrato, a AWS opera o sistema operacional e a plataforma.'),
  },
  platform: {
    ec2: cust('Servidor web, runtime ou banco instalado numa instância é software do cliente: ele atualiza.'),
    rds: shared('A AWS fornece e aplica as versões do motor; o cliente escolhe a versão, a janela e se aceita upgrades automáticos de versão menor.'),
    lambda: aws('Runtime gerenciado no modo Auto: a AWS assume a aplicação dos patches. (Em imagem de contêiner, o cliente reconstrói a imagem.)'),
    s3: aws('Não há runtime do cliente: a plataforma é da AWS.'),
  },
  network: {
    ec2: cust('Security groups e regras de rede são configuração do cliente.'),
    rds: cust('O security group do banco é configurado pelo cliente.'),
    lambda: cust('Quem pode invocar a função e se ela acessa a VPC é configuração do cliente.'),
    s3: cust('Block Public Access e bucket policies são configuração do cliente.'),
  },
  iam: {
    ec2: cust('Perfis de instância e permissões de quem administra são do cliente.'),
    rds: cust('Políticas IAM de quem gerencia o banco e usuários do banco são do cliente.'),
    lambda: cust('A função de execução (execution role) e suas permissões são do cliente.'),
    s3: cust('Políticas IAM e de bucket que dão acesso aos objetos são do cliente.'),
  },
  data: {
    ec2: cust('Os dados são sempre do cliente, inclusive decidir o que criptografar.'),
    rds: cust('O cliente decide criptografia, retenção de backups e quem acessa os dados.'),
    lambda: cust('Dados processados e variáveis de ambiente sensíveis são responsabilidade do cliente.'),
    s3: cust('O cliente gerencia seus dados e escolhe as opções de criptografia (a AWS oferece SSE-S3 por padrão).'),
  },
}

export function cellKey(layer: SrmLayer, service: SrmService): string {
  return `${layer}:${service}`
}
