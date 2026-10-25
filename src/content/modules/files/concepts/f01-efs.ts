/**
 * Conceitos da Fase 1 — EFS essencial.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F01_FIL_CONCEPTS: ConceptDef[] = [
  {
    id: 'efs.what',
    title: 'Amazon EFS',
    officialName: 'Amazon Elastic File System',
    serviceIds: ['aws.efs'],
    summary: 'O **EFS** é um sistema de arquivos **NFS** (versões 4.0 e 4.1) gerenciado e **elástico**: cresce e encolhe sozinho conforme os arquivos entram e saem, sem provisionar capacidade. Pode ser montado ao mesmo tempo por **EC2, ECS, EKS, Fargate e Lambda**.',
    explanation: [
      'Exemplo: dez instâncias de um site WordPress, em três AZs, montam o mesmo EFS para os arquivos enviados pelos autores. Uma instância nova, criada pelo Auto Scaling, já enxerga todos os arquivos.',
    ],
    useCases: ['Diretórios compartilhados por vários servidores web', 'Arquivos usados por funções Lambda e contêineres', 'Diretórios pessoais e sistemas de gestão de conteúdo'],
    commonMistakes: ['Escolher EFS para servidores Windows, que precisam de SMB', 'Usar um volume EBS para arquivos que vários servidores precisam ler e gravar ao mesmo tempo'],
    facts: ['O EFS não é suportado em instâncias EC2 com Windows.', 'Escala até petabytes, com consistência de leitura e travas de arquivo do NFS.', 'Para a maioria das cargas, a AWS recomenda os padrões: modo de desempenho General Purpose e vazão Elastic.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'As tarefas 3.1 e 4.1 do exame citam o EFS. Sinais: "sistema de arquivos compartilhado por várias instâncias Linux", "NFS", "cresce sozinho" e "acesso a partir de várias AZs". A resposta é o EFS; para Windows e SMB, o FSx for Windows File Server.',
    },
    references: [R.efsWhat],
    tags: ['desempenho'],
  },
  {
    id: 'efs.file-system-types',
    title: 'EFS Regional e One Zone',
    officialName: 'EFS file system types: Regional and One Zone',
    serviceIds: ['aws.efs'],
    summary: 'O **Regional** (recomendado) guarda os dados em **várias AZs** e continua acessível mesmo com uma AZ fora. O **One Zone** guarda tudo em **uma AZ**, custa menos, mas os dados podem ser **perdidos** se a AZ for perdida. Os dois são projetados para 11 noves de durabilidade contra falhas de disco, servidor e rack.',
    comparisons: [{ with: 'infra.multi-az', text: 'O Regional já é Multi-AZ por dentro; o One Zone é como uma instância numa AZ só.' }],
    commonMistakes: ['Pôr dados de produção que não podem ser recriados num One Zone para economizar'],
    facts: ['O One Zone só existe em algumas AZs de cada Região.', 'A AWS faz backup automático dos sistemas de arquivos One Zone com o AWS Backup.', 'O One Zone sempre usa o modo de desempenho General Purpose.'],
    recommendations: ['Use One Zone para ambientes de desenvolvimento e dados que podem ser recriados; Regional para produção.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Sinal: "reduzir o custo de um sistema de arquivos de desenvolvimento ou de dados recriáveis". A resposta é o EFS One Zone; para produção que precisa sobreviver à falha de uma AZ, o Regional.',
    },
    references: [R.efsFeatures],
    tags: ['disponibilidade', 'custos'],
  },
  {
    id: 'efs.mount-targets',
    title: 'Mount targets',
    officialName: 'EFS mount targets',
    serviceIds: ['aws.efs', 'aws.vpc'],
    summary: 'Os servidores alcançam o EFS por um **mount target**, um endereço IP numa sub-rede da VPC, protegido por **security group**. No Regional, cria-se **um por AZ**, e todos os servidores daquela AZ o compartilham. No One Zone, existe **um só**, na AZ do sistema de arquivos; servidores de outras AZs pagam o **acesso entre zonas**.',
    commonMistakes: ['Criar um mount target só na primeira AZ e montar por ele em todas as outras'],
    facts: ['Só cabe um mount target por AZ, mesmo que a AZ tenha várias sub-redes.', 'O endereço IP de um mount target não muda; para trocar, apaga-se e cria-se outro.', 'O security group do mount target decide quais clientes chegam ao sistema de arquivos.'],
    recommendations: ['Crie um mount target em cada AZ onde há servidores: se a AZ do único mount target cair, os servidores das outras AZs perdem o acesso.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Se os servidores de uma AZ perdem o acesso ao EFS quando outra AZ cai, falta um mount target na AZ deles.',
    },
    references: [R.efsMountTargets],
    tags: ['disponibilidade'],
  },
  {
    id: 'efs.access-points',
    title: 'Access points',
    officialName: 'EFS access points',
    serviceIds: ['aws.efs'],
    summary: 'Um **access point** é uma entrada própria de cada aplicação no sistema de arquivos. Ele pode **impor um usuário POSIX** (e os grupos) em todas as requisições e **impor um diretório raiz**, de modo que a aplicação só enxergue a própria pasta. Com políticas do IAM, cada aplicação é obrigada a usar o seu access point.',
    useCases: ['Várias aplicações ou clientes no mesmo sistema de arquivos, cada um preso à própria pasta', 'Funções Lambda e contêineres que precisam de um usuário fixo'],
    commonMistakes: ['Criar um sistema de arquivos por aplicação só para separar as pastas'],
    facts: ['Os access points funcionam sobre os mount targets: precisa existir pelo menos um.', 'Os security groups ficam no mount target, não no access point.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "várias aplicações no mesmo sistema de arquivos, cada uma restrita à própria pasta e a um usuário". A resposta são os access points do EFS.',
    },
    references: [R.efsAccessPoints],
    tags: ['seguranca'],
  },
  {
    id: 'efs.iam-authorization',
    title: 'Autorização pelo IAM no EFS',
    officialName: 'IAM authorization for NFS clients',
    serviceIds: ['aws.efs', 'aws.iam'],
    summary: 'Sem política, o EFS dá **acesso total** a qualquer cliente que alcance um mount target. Com a **política do sistema de arquivos** (uma política de recurso), os clientes se identificam por uma role e recebem só o que foi liberado: **ClientMount** (leitura), **ClientWrite** (gravação) e **ClientRootAccess** (usuário root).',
    commonMistakes: ['Confiar só no security group quando um time precisa de acesso apenas de leitura'],
    facts: ['Basta um Allow na política de identidade ou na política do sistema de arquivos.', 'A condição aws:SecureTransport obriga o cliente a usar TLS.', 'A autorização pelo IAM exige montar com o EFS mount helper.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "dar acesso só de leitura a uma aplicação no EFS" ou "exigir TLS". A resposta é uma política do sistema de arquivos com as ações do IAM (ClientMount sem ClientWrite) e a condição aws:SecureTransport.',
    },
    references: [R.efsIam],
    tags: ['seguranca'],
  },
  {
    id: 'efs.encryption',
    title: 'Criptografia no EFS',
    officialName: 'Encryption at rest and in transit',
    serviceIds: ['aws.efs', 'aws.kms'],
    summary: 'A criptografia **em repouso** usa o KMS e é escolhida **na criação**: depois, não dá para ligar nem desligar. No console ela vem ligada; pela CLI ou API, precisa ser pedida. A criptografia **em trânsito** (TLS) é ligada **ao montar**, com o mount helper.',
    commonMistakes: ['Planejar ligar a criptografia em repouso depois, num sistema de arquivos já em uso'],
    facts: ['Para criptografar um sistema de arquivos que nasceu sem criptografia, replique os dados para um novo, criptografado.', 'A condição elasticfilesystem:Encrypted numa política do IAM ou numa SCP impede criar sistemas de arquivos sem criptografia.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "exigir que todo sistema de arquivos EFS seja criado com criptografia". A resposta é uma SCP ou política do IAM com a condição elasticfilesystem:Encrypted. Para cifrar um que já existe, replique para um novo.',
    },
    references: [R.efsEncryptionAtRest, R.efsEncryption],
    tags: ['seguranca'],
  },
]
