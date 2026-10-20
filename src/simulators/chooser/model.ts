/**
 * Escolha da computação: qual serviço atende aos requisitos de cada carga,
 * do servidor que você administra à função sem servidor.
 *
 * Fatos conferidos em 20/10/2026:
 * - Lambda (timeout de 900 s): https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
 * - EC2 Auto Scaling: https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html
 * - ECS e Fargate: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html
 * - EKS: https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html
 * - Batch (jobs, filas e ambientes de computação): https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html
 * - Elastic Beanstalk: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html
 * - Outposts: https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html
 * - Wavelength: https://docs.aws.amazon.com/wavelength/latest/developerguide/what-is-wavelength.html
 * - ECS Anywhere (launch type EXTERNAL, sem balanceador de carga): https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-anywhere.html
 * - EKS Anywhere (você opera os clusters; roda em ambientes isolados): https://docs.aws.amazon.com/eks/latest/userguide/eks-deployment-options.html
 * - Amazon EVS (VMware Cloud Foundation em bare metal do EC2 na sua VPC): https://docs.aws.amazon.com/evs/latest/userguide/what-is-evs.html
 *
 * A "complexidade relativa" é julgamento de arquitetura do AWS Quest, usada só
 * para desempatar opções que atendem aos mesmos requisitos.
 */

export type ComputeOption =
  | 'ec2'
  | 'ec2-asg'
  | 'lambda'
  | 'ecs-fargate'
  | 'ecs-ec2'
  | 'eks'
  | 'batch'
  | 'beanstalk'
  | 'outposts'
  | 'wavelength'
  | 'ecs-anywhere'
  | 'eks-anywhere'
  | 'evs'

export type ComputeNeed =
  | 'long-running'
  | 'always-on'
  | 'os-control'
  | 'containers'
  | 'kubernetes'
  | 'no-servers'
  | 'event-driven'
  | 'elastic'
  | 'job-queue'
  | 'paas'
  | 'on-premises'
  | 'own-servers'
  | 'mobile-5g'
  | 'vmware'

export const NEED_LABEL: Record<ComputeNeed, string> = {
  'long-running': 'processamento que passa de 15 minutos',
  'always-on': 'um serviço sempre no ar atendendo requisições',
  'os-control': 'controle do sistema operacional (agentes, drivers, configuração do kernel)',
  containers: 'rodar a aplicação em contêineres',
  kubernetes: 'usar a API e as ferramentas do Kubernetes',
  'no-servers': 'nenhum servidor ou cluster de máquinas para administrar',
  'event-driven': 'reagir a eventos curtos e esporádicos, pagando só pelo uso',
  elastic: 'crescer e encolher sozinho com a demanda',
  'job-queue': 'filas de jobs em lote, com prioridade e dependências',
  paas: 'só enviar o código e deixar a plataforma montar e operar o ambiente',
  'on-premises': 'rodar serviços da AWS dentro do próprio data center, com hardware da AWS',
  'own-servers': 'aproveitar servidores que a empresa já tem, fora da AWS',
  'mobile-5g': 'latência ultrabaixa para celulares na rede 5G de uma operadora',
  vmware: 'levar o ambiente VMware sem trocar endereços IP nem refazer os procedimentos',
}

export interface ComputeOptionInfo {
  name: string
  summary: string
  meets: ComputeNeed[]
  limits: string[]
  /** 1 (mais simples) a 6. Julgamento de arquitetura, só para desempate. */
  complexity: number
}

export const OPTIONS: Record<ComputeOption, ComputeOptionInfo> = {
  ec2: { name: 'Instância EC2', summary: 'Servidor virtual em que você escolhe a AMI, o tipo e administra o sistema operacional.', meets: ['long-running', 'always-on', 'os-control'], limits: ['Sozinha não cresce com a demanda nem se recupera de falhas.'], complexity: 2 },
  'ec2-asg': { name: 'EC2 com Auto Scaling', summary: 'Grupo de instâncias que cresce, encolhe e substitui as que falham.', meets: ['long-running', 'always-on', 'os-control', 'elastic'], limits: ['Você continua administrando o sistema operacional das instâncias.'], complexity: 3 },
  lambda: { name: 'AWS Lambda', summary: 'Função que roda quando chega um evento; cobrança por requisição e duração.', meets: ['no-servers', 'event-driven', 'elastic'], limits: ['Cada invocação dura no máximo 15 minutos.'], complexity: 1 },
  'ecs-fargate': { name: 'ECS no Fargate', summary: 'Contêineres orquestrados pelo ECS, sem instâncias para administrar.', meets: ['containers', 'no-servers', 'long-running', 'always-on', 'elastic'], limits: ['Não dá acesso ao sistema operacional do host.'], complexity: 2 },
  'ecs-ec2': { name: 'ECS em instâncias EC2', summary: 'Contêineres orquestrados pelo ECS em instâncias que você escolhe e administra.', meets: ['containers', 'long-running', 'always-on', 'os-control', 'elastic'], limits: ['Você cuida das instâncias do cluster.'], complexity: 4 },
  eks: { name: 'Amazon EKS', summary: 'Kubernetes com o plano de controle gerenciado pela AWS.', meets: ['kubernetes', 'containers', 'long-running', 'always-on', 'os-control', 'elastic'], limits: ['Exige conhecer Kubernetes; é mais do que um caso simples de contêiner pede.'], complexity: 5 },
  batch: { name: 'AWS Batch', summary: 'Filas de jobs em lote; o serviço escolhe e escala a computação (EC2, Spot ou Fargate) para cada job.', meets: ['job-queue', 'containers', 'long-running', 'elastic'], limits: ['É para jobs que terminam, não para serviços sempre no ar.'], complexity: 2 },
  beanstalk: { name: 'Elastic Beanstalk', summary: 'Você envia o código e o serviço cria instâncias, balanceador e Auto Scaling.', meets: ['paas', 'long-running', 'always-on', 'elastic'], limits: ['Menos controle fino do que montar as peças você mesmo.'], complexity: 2 },
  outposts: { name: 'AWS Outposts', summary: 'Hardware da AWS instalado no seu data center, rodando serviços da AWS localmente.', meets: ['on-premises', 'long-running', 'always-on', 'os-control'], limits: ['Exige espaço, energia e rede no local, e conexão com a Região.'], complexity: 4 },
  wavelength: { name: 'AWS Wavelength', summary: 'Computação dentro da rede 5G de operadoras parceiras.', meets: ['mobile-5g', 'long-running', 'always-on', 'os-control'], limits: ['Só existe nas cidades e operadoras parceiras.'], complexity: 3 },
  'ecs-anywhere': { name: 'ECS Anywhere', summary: 'Registra servidores e VMs da própria empresa num cluster ECS (launch type EXTERNAL).', meets: ['own-servers', 'containers', 'long-running', 'always-on'], limits: ['Não tem balanceador de carga do ELB: serve melhor para cargas que só geram tráfego de saída.'], complexity: 4 },
  'eks-anywhere': { name: 'EKS Anywhere', summary: 'Clusters Kubernetes baseados no EKS Distro na infraestrutura da empresa.', meets: ['own-servers', 'kubernetes', 'containers', 'long-running', 'always-on'], limits: ['Você opera o ciclo de vida dos clusters.'], complexity: 6 },
  evs: { name: 'Amazon EVS', summary: 'VMware Cloud Foundation em instâncias bare metal do EC2 dentro da sua VPC.', meets: ['vmware', 'long-running', 'always-on', 'os-control'], limits: ['Você (ou um parceiro) continua operando o ambiente VMware.'], complexity: 4 },
}

export interface ComputeItem {
  id: string
  text: string
  /** Requisito que decide o caso. */
  dominant: ComputeNeed
  /** Todos os requisitos rígidos (inclui o dominante). */
  needs: ComputeNeed[]
  concepts?: string[]
}

export function unmetNeeds(item: ComputeItem, opt: ComputeOption): ComputeNeed[] {
  return item.needs.filter((n) => !OPTIONS[opt].meets.includes(n))
}

/** Melhor opção: atende a todos os requisitos com a menor complexidade. Lança erro se não for única. */
export function bestComputeOption(item: ComputeItem, options: ComputeOption[]): ComputeOption {
  const ok = options.filter((o) => unmetNeeds(item, o).length === 0).sort((a, b) => OPTIONS[a].complexity - OPTIONS[b].complexity)
  if (ok.length === 0) throw new Error(`Item ${item.id}: nenhuma opção atende`)
  if (ok[1] && OPTIONS[ok[1]].complexity === OPTIONS[ok[0]].complexity) throw new Error(`Item ${item.id}: empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}

export interface ComputeVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  message: string
}

export function judgeCompute(item: ComputeItem, pick: ComputeOption | undefined, options: ComputeOption[]): ComputeVerdict {
  const best = bestComputeOption(item, options)
  const bestName = OPTIONS[best].name
  if (!pick) return { score: 0, status: 'missed', message: `Sem escolha. O requisito que decide é ${NEED_LABEL[item.dominant]}: ${bestName}.` }
  if (pick === best) return { score: 1, status: 'correct', message: `O requisito que decide é ${NEED_LABEL[item.dominant]}. ${OPTIONS[best].summary}` }
  const missing = unmetNeeds(item, pick)
  if (missing.length === 0) return { score: 0.5, status: 'partial', message: `Funciona, mas dá mais trabalho do que o caso pede. ${OPTIONS[pick].limits[0]} ${bestName} atende com menos esforço.` }
  return { score: 0, status: 'wrong', message: `${OPTIONS[pick].name} não atende: ${missing.map((n) => NEED_LABEL[n]).join('; ')}. ${OPTIONS[pick].limits[0]} A opção adequada é ${bestName}.` }
}
