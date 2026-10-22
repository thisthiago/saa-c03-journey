/**
 * Escolha do armazenamento de arquivos e do caminho de entrada: qual serviço
 * atende a cada requisito com o menor esforço.
 *
 * Conferido em 22/10/2026 (ver os modelos e conceitos das fases anteriores):
 * EFS (NFS para Linux, elástico, montado por EC2, ECS, EKS, Fargate e Lambda;
 * não funciona com instâncias Windows), FSx for Windows File Server (SMB com
 * Active Directory, ACLs do Windows), FSx for Lustre (alto desempenho, ligado
 * a um bucket S3), FSx for NetApp ONTAP (NFS, SMB, iSCSI e NVMe no mesmo
 * dado, para migrar NetApp sem mudar a aplicação), FSx for OpenZFS (NFS,
 * snapshots e clones, para migrar servidores ZFS ou Linux), EBS (bloco para
 * uma instância), S3 (objetos por API), S3 File Gateway (NFS e SMB no local
 * com os arquivos virando objetos no S3), DataSync (cópia pela rede para EFS,
 * FSx e S3) e Transfer Family (SFTP, FTPS, FTP e AS2 gravando no S3 ou no
 * EFS).
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const FS_OPTIONS: ChoiceCatalog = {
  needLabel: {
    'nfs-linux': 'um diretório NFS compartilhado por servidores Linux, que cresce e encolhe sozinho',
    serverless: 'arquivos compartilhados por funções Lambda e contêineres no Fargate',
    'smb-ad': 'compartilhamentos SMB com as permissões do Active Directory',
    'hpc-s3': 'processamento de alto desempenho lendo e gravando os dados de um bucket S3',
    'multi-protocol': 'o mesmo volume acessado por NFS, SMB e iSCSI',
    'netapp-migrate': 'migrar um storage NetApp sem mudar a aplicação nem as ferramentas',
    'zfs-migrate': 'migrar um servidor ZFS com snapshots e clones instantâneos, acessado por NFS',
    'block-one': 'um disco de baixa latência para um banco numa única instância',
    'object-api': 'objetos acessados por API HTTP, com classes de armazenamento e ciclo de vida',
    'onprem-s3': 'servidores do escritório gravando por SMB, com cache local e os arquivos virando objetos no S3',
    'bulk-copy': 'copiar uma vez pela rede um NAS inteiro para a AWS, com verificação dos dados',
    'partner-sftp': 'parceiros enviando arquivos por SFTP sem mudar o cliente que já usam',
  },
  options: {
    efs: { name: 'Amazon EFS', summary: 'Sistema de arquivos NFS elástico, montado por EC2, ECS, EKS, Fargate e Lambda.', meets: ['nfs-linux', 'serverless'], limits: ['Não funciona com instâncias Windows.'], complexity: 1 },
    'fsx-windows': { name: 'FSx for Windows File Server', summary: 'Servidores de arquivos Windows gerenciados, com SMB, Active Directory e ACLs.', meets: ['smb-ad'], limits: ['Capacidade e vazão são provisionadas.'], complexity: 2 },
    'fsx-lustre': { name: 'FSx for Lustre', summary: 'Sistema de arquivos de alto desempenho para HPC e ML, ligado a um bucket S3.', meets: ['hpc-s3'], limits: ['Clientes Linux com o cliente Lustre.'], complexity: 3 },
    'fsx-ontap': { name: 'FSx for NetApp ONTAP', summary: 'ONTAP gerenciado: NFS, SMB, iSCSI e NVMe no mesmo dado, snapshots, clones e SnapMirror.', meets: ['multi-protocol', 'netapp-migrate', 'smb-ad'], limits: ['Mais conceitos para operar que o EFS ou o FSx for Windows.'], complexity: 4 },
    'fsx-openzfs': { name: 'FSx for OpenZFS', summary: 'OpenZFS gerenciado por NFS, com snapshots, clones e latência de centenas de microssegundos.', meets: ['zfs-migrate'], limits: ['Só NFS; não tem SMB.'], complexity: 3 },
    ebs: { name: 'Amazon EBS', summary: 'Volume de bloco anexado a uma instância EC2.', meets: ['block-one'], limits: ['Não é um sistema de arquivos compartilhado.'], complexity: 1 },
    s3: { name: 'Amazon S3', summary: 'Armazenamento de objetos por API, com classes e ciclo de vida.', meets: ['object-api'], limits: ['Não é montado como sistema de arquivos pelas aplicações.'], complexity: 1 },
    'file-gateway': { name: 'S3 File Gateway', summary: 'Compartilhamento NFS ou SMB no local, com cache, gravando cada arquivo como objeto no S3.', meets: ['onprem-s3'], limits: ['Precisa de uma máquina virtual ou appliance no local.'], complexity: 2 },
    datasync: { name: 'AWS DataSync', summary: 'Cópia pela rede, com verificação, de NFS, SMB e outros para S3, EFS e FSx.', meets: ['bulk-copy'], limits: ['Fontes NFS e SMB no local precisam de um agente.'], complexity: 2 },
    'transfer-family': { name: 'AWS Transfer Family', summary: 'Servidor gerenciado de SFTP, FTPS, FTP e AS2 que grava no S3 ou no EFS.', meets: ['partner-sftp'], limits: ['Cobra por hora cada protocolo ligado, mesmo sem uso.'], complexity: 2 },
  },
}

export type FsChooserLabConfig = ChoiceLabConfig
export type FsChooserLabResponse = ChoiceLabResponse

export const fsChooserSolution = (c: FsChooserLabConfig) => choiceSolution(FS_OPTIONS, c)
export const evaluateFsChooserLab = (c: FsChooserLabConfig, r: FsChooserLabResponse) => evaluateChoiceLab(FS_OPTIONS, c, r)
