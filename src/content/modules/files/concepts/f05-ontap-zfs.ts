/**
 * Conceitos da Fase 5 — FSx for NetApp ONTAP e FSx for OpenZFS.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F05_FIL_CONCEPTS: ConceptDef[] = [
  {
    id: 'ontap.what',
    title: 'FSx for NetApp ONTAP',
    officialName: 'Amazon FSx for NetApp ONTAP',
    serviceIds: ['aws.fsx'],
    summary: 'O **ONTAP** da NetApp, gerenciado pela AWS: os mesmos dados acessados por **NFS, SMB, iSCSI e NVMe**, de Linux, Windows e macOS. Para quem já usa NetApp no local, é a forma de **migrar sem mudar a aplicação** nem o jeito de administrar, com as ferramentas e a API da NetApp.',
    useCases: ['Migrar storage NetApp do data center', 'Um mesmo volume lido por servidores Linux (NFS) e Windows (SMB)'],
    commonMistakes: ['Montar dois sistemas de arquivos e sincronizar os dois quando as aplicações Linux e Windows precisam dos mesmos arquivos'],
    facts: ['Tem implantação Single-AZ e Multi-AZ.', 'Autentica pelo Active Directory e audita o acesso aos arquivos.', 'Também atende como volume de bloco por iSCSI.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "migrar storage NetApp", "o mesmo volume acessado por NFS e por SMB" e "iSCSI". A resposta é o FSx for NetApp ONTAP.',
    },
    references: [R.ontapWhat],
    tags: ['hibrido', 'migracao'],
  },
  {
    id: 'ontap.tiering',
    title: 'Camadas e eficiência no ONTAP',
    officialName: 'SSD tier, capacity pool tier and storage efficiency',
    serviceIds: ['aws.fsx'],
    summary: 'O ONTAP tem duas camadas: a **SSD**, provisionada, para a parte ativa dos dados, e o **capacity pool**, **elástico** e mais barato, para o que é pouco acessado. Uma **política de tiering** por volume decide quando os dados descem. **Compressão, desduplicação e compactação** economizam até 65% em compartilhamentos de uso geral.',
    facts: ['Todo dado gravado passa primeiro pela SSD.', 'A AWS recomenda não passar de 80% de uso da camada SSD.', 'As economias de compressão e desduplicação continuam quando o dado desce para o capacity pool.'],
    commonMistakes: ['Provisionar SSD para os dados inteiros quando a maior parte é fria'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [R.ontapStorage],
    tags: ['custos'],
  },
  {
    id: 'ontap.data-protection',
    title: 'Snapshots, clones e SnapMirror',
    officialName: 'Snapshots, FlexClone and SnapMirror',
    serviceIds: ['aws.fsx'],
    summary: 'No ONTAP, **snapshots** guardam versões do volume, **clones** (FlexClone) criam na hora uma cópia gravável que só ocupa o que mudar, e o **SnapMirror** replica volumes, inclusive entre Regiões e com o NetApp do data center. O **SnapLock** grava em modo WORM.',
    facts: ['O FSx também faz backups automáticos diários do ONTAP.'],
    useCases: ['Ambientes de teste com cópia dos dados de produção em segundos', 'Recuperação de desastre em outra Região com SnapMirror'],
    commonMistakes: ['Copiar terabytes para montar cada ambiente de teste'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.ontapWhat],
    tags: ['recuperacao'],
  },
  {
    id: 'zfs.what',
    title: 'FSx for OpenZFS',
    officialName: 'Amazon FSx for OpenZFS',
    serviceIds: ['aws.fsx'],
    summary: 'O **OpenZFS** gerenciado, acessado por **NFS** (v3 a v4.2) a partir de Linux, Windows e macOS. Feito para **migrar servidores ZFS ou Linux** sem mudar a aplicação, com **snapshots** e **clones** instantâneos, compressão e latência de **centenas de microssegundos**, até 2 milhões de IOPS.',
    comparisons: [{ with: 'ontap.what', text: 'O ONTAP serve a vários protocolos e a quem vem da NetApp; o OpenZFS, a quem vem do ZFS e precisa só de NFS, com latência muito baixa.' }],
    commonMistakes: ['Escolher OpenZFS para compartilhamentos que os usuários Windows abrem por SMB'],
    facts: ['Não oferece SMB: o acesso é só por NFS.', 'Tem classes SSD e Intelligent-Tiering, que é elástica.', 'Volumes com cotas por usuário e grupo dividem um sistema de arquivos entre aplicações.'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinal: "migrar servidores ZFS ou NFS do Linux, com snapshots e clones instantâneos". A resposta é o FSx for OpenZFS.',
    },
    references: [R.zfsWhat],
    tags: ['desempenho', 'migracao'],
  },
  {
    id: 'zfs.deployment',
    title: 'Implantações do FSx for OpenZFS',
    officialName: 'Multi-AZ (HA), Single-AZ (HA) and Single-AZ (non-HA)',
    serviceIds: ['aws.fsx'],
    summary: 'O OpenZFS tem três níveis: **Multi-AZ (HA)**, com uma cópia dos dados em cada AZ e failover em cerca de **60 segundos**; **Single-AZ (HA)**, com um par primário e em espera na mesma AZ, também com failover em cerca de 60 segundos; e **Single-AZ (non-HA)**, que se recupera sozinho em cerca de **30 minutos**.',
    facts: ['Só o Multi-AZ continua disponível com uma AZ fora.'],
    comparisons: [{ with: 'fsxw.deployment', text: 'O FSx for Windows tem Single-AZ e Multi-AZ; o OpenZFS acrescenta o Single-AZ com par em espera.' }],
    commonMistakes: ['Contar com o Single-AZ (HA) para aguentar a perda de uma AZ'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.zfsWhat],
    tags: ['disponibilidade'],
  },
]
