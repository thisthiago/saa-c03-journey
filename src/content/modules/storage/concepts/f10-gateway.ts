/**
 * Conceitos da Fase 10 — Armazenamento híbrido com AWS Storage Gateway.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const S3FILE = { title: 'What is Amazon S3 File Gateway?', url: 'https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html' }
const VGW = { title: 'What is Volume Gateway?', url: 'https://docs.aws.amazon.com/storagegateway/latest/vgw/WhatIsStorageGateway.html' }
const TGW = { title: 'What is Tape Gateway?', url: 'https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html' }
const FSXGW = { title: 'Document history for the Amazon FSx File Gateway User Guide', url: 'https://docs.aws.amazon.com/filegateway/latest/filefsxw/DocumentHistory.html' }

export const F10_CONCEPTS: ConceptDef[] = [
  {
    id: 'sgw.overview',
    title: 'AWS Storage Gateway',
    officialName: 'AWS Storage Gateway',
    serviceIds: ['aws.storage-gateway'],
    summary: 'Um appliance (máquina virtual, hardware ou instância EC2) que liga aplicações locais ao armazenamento da AWS usando protocolos que elas já conhecem: arquivos (NFS/SMB), blocos (iSCSI) ou fitas (VTL).',
    explanation: [
      'O Storage Gateway resolve um problema de transição: aplicações locais que só sabem usar NFS, SMB, iSCSI ou uma biblioteca de fitas e que precisam usar a nuvem sem serem reescritas. O appliance fica no ambiente local, apresenta o protocolo conhecido e guarda os dados na AWS, com cache local para o que é usado com frequência.',
      '**Regra prática:** escolha o tipo pelo protocolo que a aplicação já usa: arquivos (S3 File Gateway), blocos (Volume Gateway) ou fitas (Tape Gateway).',
    ],
    facts: ['Pode rodar como VM em VMware ESXi, KVM, Microsoft Hyper-V ou Nutanix AHV, como appliance de hardware ou como instância Amazon EC2.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "aplicações locais", "sem mudar a aplicação", "armazenamento híbrido" e "cache local". Identifique o protocolo citado: NFS ou SMB apontam para o S3 File Gateway; iSCSI, para o Volume Gateway; software de backup em fita, para o Tape Gateway.',
    },
    references: [VGW, S3FILE],
    tags: ['hibrido'],
    reviewItems: [
      {
        id: 'rv:sgw.overview:protocolo',
        kind: 'decision',
        title: 'Pelo protocolo',
        prompt: 'Um servidor local precisa de um **volume em bloco iSCSI** com dados guardados na AWS. Qual família de gateway?',
        concepts: [{ id: 'sgw.overview' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Disco em bloco (iSCSI) usa o Volume Gateway; arquivos (NFS/SMB), o S3 File Gateway; fitas virtuais (VTL), o Tape Gateway.'],
        options: [
          { id: 'a', text: 'Volume Gateway', correct: true, consequence: 'Cached ou stored, conforme latência e espaço local.' },
          { id: 'b', text: 'S3 File Gateway', correct: false, consequence: 'Ele oferece compartilhamentos NFS e SMB, não volumes em bloco.' },
          { id: 'c', text: 'Tape Gateway', correct: false, consequence: 'Ele emula uma biblioteca de fitas para software de backup.' },
        ],
      },
    ],
  },
  {
    id: 'sgw.s3-file',
    title: 'S3 File Gateway',
    officialName: 'Amazon S3 File Gateway',
    serviceIds: ['aws.storage-gateway', 'aws.s3'],
    summary: 'Compartilhamentos **NFS** (v3 e 4.1) e **SMB** (2 e 3) cujos arquivos viram **objetos no S3**, com cache local. Aplicações na AWS leem os mesmos dados direto no bucket, e as políticas do S3 (lifecycle, versionamento) se aplicam.',
    explanation: [
      'Cada arquivo gravado no compartilhamento vira um objeto no bucket, com o mesmo nome. Os servidores locais continuam usando uma pasta de rede, e a cópia principal fica no S3, onde aplicações na nuvem, regras de lifecycle e análises alcançam os mesmos dados.',
      'Exemplo: um laboratório grava os resultados dos equipamentos numa pasta SMB local, e a equipe de dados analisa esses arquivos com o Athena. Com o S3 File Gateway, a pasta continua igual para os equipamentos, e os arquivos chegam ao bucket para análise.',
    ],
    comparisons: [
      { with: 'storage.file', text: 'O EFS e o FSx são sistemas de arquivos na AWS, para instâncias na nuvem. O S3 File Gateway apresenta um bucket como pasta de rede para servidores locais.' },
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "servidores locais gravam por NFS ou SMB" e "os arquivos precisam estar no S3" para processamento, backup ou arquivamento. Se o requisito é um sistema de arquivos para instâncias na AWS, a resposta é o EFS ou o FSx, e não o gateway.',
    },
    references: [S3FILE],
    tags: ['hibrido'],
  },
  {
    id: 'sgw.fsx-file',
    title: 'FSx File Gateway',
    officialName: 'Amazon FSx File Gateway',
    serviceIds: ['aws.storage-gateway', 'aws.fsx'],
    summary: 'Acesso local, com cache, a compartilhamentos do Amazon FSx for Windows File Server. **Não está disponível para novos clientes desde 28/10/2024.**',
    availability: {
      kind: 'no-new-customers',
      since: '28/10/2024',
      note: 'Clientes existentes continuam usando normalmente. Para novos projetos, a AWS indica alternativas com capacidades semelhantes.',
      alternatives: ['Amazon FSx for Windows File Server acessado diretamente', 'Amazon S3 File Gateway (SMB), quando os dados podem ficar como objetos no S3'],
    },
    exam: { domains: ['d2'], relevance: 'baixa', notes: 'Questões antigas podem citar o FSx File Gateway como opção atual.' },
    references: [FSXGW],
    tags: ['hibrido'],
  },
  {
    id: 'sgw.volume-cached',
    title: 'Volume Gateway — cached volumes',
    officialName: 'Volume Gateway cached volumes',
    serviceIds: ['aws.storage-gateway', 'aws.ebs'],
    summary: 'Volumes **iSCSI** cujos dados primários ficam no **S3**; o local guarda só os dados mais acessados. Economiza armazenamento local.',
    comparisons: [
      { with: 'sgw.volume-stored', text: 'No cached, os dados primários ficam no S3 e o local guarda só o que é mais usado. No stored, o volume inteiro fica no local, e a AWS guarda os snapshots.' },
    ],
    facts: ['Snapshots dos volumes ficam na AWS como snapshots do Amazon EBS.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinal: "reduzir o armazenamento local" mantendo volumes iSCSI, com acesso rápido aos dados mais usados. Se a exigência é latência baixa para todo o conjunto de dados, a resposta é o stored.',
    },
    references: [VGW],
    tags: ['hibrido'],
  },
  {
    id: 'sgw.volume-stored',
    title: 'Volume Gateway — stored volumes',
    officialName: 'Volume Gateway stored volumes',
    serviceIds: ['aws.storage-gateway', 'aws.ebs'],
    summary: 'Volumes **iSCSI** com **todos os dados no local** e snapshots assíncronos enviados à AWS. Baixa latência para o conjunto inteiro e cópia externa barata, que pode ser restaurada no Amazon EC2.',
    comparisons: [
      { with: 'sgw.volume-cached', text: 'No stored, o volume inteiro fica no local, e a AWS guarda os snapshots. No cached, os dados ficam no S3, e o local guarda só os mais usados.' },
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinal: "acesso de baixa latência a todos os dados" com cópia de segurança na AWS. Os snapshots podem ser restaurados como volumes EBS para recuperar o ambiente no EC2.',
    },
    references: [VGW],
    tags: ['hibrido', 'recuperacao'],
  },
  {
    id: 'sgw.tape',
    title: 'Tape Gateway',
    officialName: 'Tape Gateway',
    serviceIds: ['aws.storage-gateway', 'aws.s3'],
    summary: 'Uma **biblioteca de fitas virtual (VTL)** para o software de backup existente. As fitas ficam no S3 e podem ser arquivadas em **S3 Glacier Flexible Retrieval** ou **Deep Archive**.',
    explanation: [
      'Exemplo: uma empresa troca a biblioteca de fitas física por um Tape Gateway. O software de backup continua gravando em fitas, que agora são virtuais e ficam no S3; as fitas antigas vão para o Deep Archive, sem transporte nem cofre físico.',
      '**Regra prática:** para modernizar backups em fita sem trocar o software de backup, use o Tape Gateway.',
    ],
    useCases: ['Substituir fitas físicas sem mudar o software de backup'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Sinais: "substituir fitas físicas", "manter o software de backup atual" e "arquivamento de longo prazo". A resposta é o Tape Gateway, com as fitas arquivadas no Glacier Flexible Retrieval ou no Deep Archive.',
    },
    references: [TGW],
    tags: ['hibrido'],
  },
]
