/**
 * Conceitos da Fase 6 — Escolher o armazenamento de arquivos e o caminho de
 * entrada (Transfer Family). File Gateway e DataSync vêm da S3 Expedition.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_FIL_CONCEPTS: ConceptDef[] = [
  {
    id: 'files.choose',
    title: 'Escolher o armazenamento de arquivos',
    officialName: 'Choosing among Amazon EFS, Amazon FSx, Amazon S3 and Amazon EBS',
    serviceIds: ['aws.efs', 'aws.fsx', 'aws.s3', 'aws.ebs'],
    summary: 'O **protocolo** costuma decidir: **NFS** para Linux, elástico e sem servidor para cuidar, é **EFS**; **SMB** com Active Directory é **FSx for Windows**; alto desempenho ligado ao S3 é **FSx for Lustre**; vários protocolos ou NetApp é **FSx for ONTAP**; ZFS é **FSx for OpenZFS**. Disco de uma instância é **EBS**, e objetos por API são **S3**.',
    recommendations: ['Comece pelo protocolo e pelo sistema operacional dos clientes; depois veja desempenho, disponibilidade e custo.'],
    commonMistakes: ['Escolher pelo preço por GB e descobrir depois que os clientes não falam o protocolo'],
    exam: { domains: ['d3', 'd4'], relevance: 'alta', notes: 'A tarefa 4.1 pede o serviço de armazenamento mais barato para cada carga.' },
    references: [R.efsWhat, R.winWhat, R.lustreWhat, R.ontapWhat, R.zfsWhat],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'xfer.transfer-family',
    title: 'AWS Transfer Family',
    officialName: 'AWS Transfer Family',
    serviceIds: ['aws.transfer-family', 'aws.s3', 'aws.efs'],
    summary: 'O **Transfer Family** é um servidor gerenciado de **SFTP, FTPS, FTP e AS2** (e uma página web para transferências) que grava e lê arquivos direto no **S3** ou no **EFS**. Parceiros e clientes **continuam usando os mesmos programas e credenciais**, e a empresa deixa de manter servidores de transferência.',
    facts: ['Escala sozinho, numa frota redundante em até 3 AZs.', 'Fluxos gerenciados processam cada arquivo recebido: copiar, marcar, verificar, descompactar ou descriptografar.', 'Cobra por hora cada protocolo ligado, mais os dados enviados e baixados.'],
    useCases: ['Parceiros que enviam arquivos por SFTP para um data lake no S3', 'Troca de documentos B2B por AS2'],
    commonMistakes: ['Manter um servidor SFTP numa instância EC2 só para receber arquivos de parceiros'],
    exam: { domains: ['d2', 'd3'], relevance: 'media', notes: 'As tarefas 2.1 e 4.1 citam o Transfer Family.' },
    references: [R.xferWhat],
    tags: ['hibrido', 'integracao'],
  },
  {
    id: 'xfer.endpoints',
    title: 'Endpoints do Transfer Family',
    officialName: 'Public and VPC hosted endpoints',
    serviceIds: ['aws.transfer-family', 'aws.vpc'],
    summary: 'O endpoint pode ser **público** ou **dentro da VPC**. Na VPC, ele é **interno** (só alcançado pela rede privada, Direct Connect ou VPN) ou **voltado para a internet**, com **IPs elásticos fixos** que os parceiros liberam no firewall e **security groups** que restringem quem conecta.',
    facts: ['O endpoint voltado para a internet aceita só SFTP e FTPS.', 'O FTP não é criptografado e só funciona com endpoint interno na VPC.', 'Cada endpoint na VPC usa até 3 AZs.'],
    commonMistakes: ['Expor FTP sem criptografia para parceiros na internet', 'Pedir aos parceiros para liberar no firewall um endereço que pode mudar'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.xferVpc, R.xferFtp],
    tags: ['seguranca'],
  },
  {
    id: 'xfer.identity',
    title: 'Quem pode entrar no Transfer Family',
    officialName: 'Transfer Family identity providers',
    serviceIds: ['aws.transfer-family', 'aws.directory-service', 'aws.lambda'],
    summary: 'Os usuários podem ser **gerenciados pelo próprio serviço** (com chaves SSH), vir do **AWS Managed Microsoft AD** ou de um **provedor personalizado**, ligado por uma função **Lambda** ou pelo **API Gateway** (por exemplo, Okta ou Cognito). Cada usuário recebe uma **role do IAM** e um diretório inicial que limita o que ele vê no bucket ou no sistema de arquivos.',
    facts: ['Com FTP, a console oferece só o AWS Managed Microsoft AD ou o provedor personalizado.'],
    commonMistakes: ['Dar a todos os parceiros a mesma role com acesso ao bucket inteiro'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.xferFtp, R.xferVpc],
    tags: ['seguranca'],
  },
]
