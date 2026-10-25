/**
 * Conceitos da Fase 3 — FSx for Windows File Server.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F03_FIL_CONCEPTS: ConceptDef[] = [
  {
    id: 'fsx.family',
    title: 'A família Amazon FSx',
    officialName: 'Amazon FSx',
    serviceIds: ['aws.fsx'],
    summary: 'O **Amazon FSx** oferece quatro sistemas de arquivos conhecidos, gerenciados pela AWS: **Windows File Server** (SMB e Active Directory), **Lustre** (alto desempenho), **NetApp ONTAP** (vários protocolos e recursos da NetApp) e **OpenZFS** (NFS com snapshots e clones). A AWS cuida dos servidores, das correções, das falhas de hardware e dos backups.',
    comparisons: [{ with: 'efs.what', text: 'O EFS é um serviço próprio da AWS, elástico e só NFS; o FSx traz sistemas de arquivos de terceiros, com os recursos e protocolos de cada um.' }],
    commonMistakes: ['Achar que o FSx é um tipo só: cada um dos quatro resolve um problema diferente'],
    facts: ['Todos criptografam os dados em repouso com chaves do KMS.', 'Todos fazem backups automáticos diários, além dos que você pedir.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'A tarefa 4.1 do exame cita o FSx. Escolha pelo sistema: Windows e SMB (Windows File Server), HPC e ML (Lustre), recursos da NetApp e vários protocolos (ONTAP), NFS com snapshots e clones (OpenZFS).',
    },
    references: [R.winWhat, R.lustreWhat, R.ontapWhat, R.zfsWhat],
    tags: ['desempenho'],
  },
  {
    id: 'fsxw.what',
    title: 'FSx for Windows File Server',
    officialName: 'Amazon FSx for Windows File Server',
    serviceIds: ['aws.fsx', 'aws.directory-service'],
    summary: 'Servidores de arquivos **Windows** gerenciados, acessados por **SMB** (versões 2.0 a 3.1.1) a partir de Windows e Linux. O sistema de arquivos entra num **Active Directory** na criação: o **AWS Managed Microsoft AD** ou um **AD próprio** (no local ou em EC2). Os usuários entram com as contas do AD, e as **ACLs do Windows** controlam pastas e arquivos.',
    useCases: ['Compartilhamentos departamentais e diretórios pessoais do Windows', 'Aplicações Windows que exigem SMB, como SQL Server e SharePoint'],
    commonMistakes: ['Usar EFS para servidores Windows', 'Planejar o FSx com AD Connector'],
    facts: ['O FSx não funciona com AD Connector nem com Simple AD.', 'Depois da criação, o domínio do AD não muda; para trocar, restaura-se um backup num novo sistema de arquivos.', 'Pastas e arquivos migram com as ACLs, sem alteração.', 'Acesso do local por Direct Connect ou VPN; não aceita acesso pela internet.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "servidores Windows", "SMB", "Active Directory" e "ACLs do Windows". A resposta é o FSx for Windows File Server.',
    },
    references: [R.winWhat, R.winAd],
    tags: ['hibrido'],
  },
  {
    id: 'fsxw.deployment',
    title: 'Single-AZ e Multi-AZ no FSx for Windows',
    officialName: 'Single-AZ and Multi-AZ file systems',
    serviceIds: ['aws.fsx'],
    summary: 'No **Single-AZ**, um servidor de arquivos e seus discos ficam numa AZ; a AWS troca o que falha, com **cerca de 30 minutos** de parada, e a AZ fora derruba o compartilhamento. No **Multi-AZ**, um servidor em espera em outra AZ recebe os dados de forma síncrona e assume em **menos de 30 segundos**, com o mesmo nome DNS. A AWS recomenda Multi-AZ para a maioria das cargas de produção.',
    commonMistakes: ['Pôr o compartilhamento principal da empresa num Single-AZ para economizar'],
    facts: ['O Multi-AZ faz failover também durante a manutenção planejada e volta sozinho para o servidor preferido.', 'Clientes Linux não acompanham o failover pelo DNS: voltam a funcionar quando o servidor preferido retorna.', 'Single-AZ serve a testes, a aplicações que já replicam os dados e a cargas que aceitam ficar fora e perder o que mudou desde o último backup.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinal: "compartilhamento Windows que precisa sobreviver à falha de uma AZ". A resposta é o FSx for Windows Multi-AZ.',
    },
    references: [R.winAz],
    tags: ['disponibilidade'],
  },
  {
    id: 'fsxw.storage',
    title: 'SSD, HDD e vazão no FSx for Windows',
    officialName: 'Storage type and throughput capacity',
    serviceIds: ['aws.fsx'],
    summary: '**SSD** serve a cargas sensíveis à latência (bancos, mídia, análise) e a quem usa cópias de sombra. **HDD** custa menos e serve a diretórios pessoais e compartilhamentos com pouca leitura e gravação. A **capacidade de vazão** (MBps) é escolhida à parte e define o desempenho do servidor de arquivos.',
    facts: ['Dá para trocar HDD por SSD, mas não o contrário: para voltar a HDD, restaura-se um backup num novo sistema de arquivos.', 'A capacidade de armazenamento só aumenta; não diminui.', 'O HDD não existe no Single-AZ 1.'],
    commonMistakes: ['Escolher HDD para um compartilhamento com milhares de usuários e muitos arquivos pequenos'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.winStorage],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'fsxw.shadow-copies',
    title: 'Cópias de sombra',
    officialName: 'Windows shadow copies',
    serviceIds: ['aws.fsx'],
    summary: 'As **cópias de sombra** são instantâneos do Windows que permitem ao **próprio usuário** recuperar uma versão anterior de um arquivo ou pasta, pelo **Explorador de Arquivos** ("Restaurar versões anteriores"). Elas **não vêm ligadas**: é preciso ativar e agendar.',
    comparisons: [{ with: 'bkp.aws-backup', text: 'A cópia de sombra resolve o "apaguei sem querer" do usuário em minutos; o backup protege contra a perda do sistema de arquivos.' }],
    commonMistakes: ['Abrir um chamado de restauração de backup para cada arquivo apagado por engano'],
    facts: ['Ocupam espaço do próprio sistema de arquivos, só com o que mudou; o limite padrão é 10% do armazenamento.', 'A AWS recomenda manter menos de 64 cópias e usar SSD.', 'Não substituem os backups.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "permitir que os próprios usuários recuperem versões anteriores de arquivos". A resposta são as cópias de sombra do Windows no FSx.',
    },
    references: [R.winShadow],
    tags: ['recuperacao'],
  },
  {
    id: 'fsxw.dedup',
    title: 'Desduplicação de dados',
    officialName: 'Data Deduplication',
    serviceIds: ['aws.fsx'],
    summary: 'A **desduplicação** do Windows guarda uma vez só os trechos repetidos dos arquivos e comprime o resultado. A economia típica é de **50% a 60%** em compartilhamentos de uso geral, de 30% a 50% em documentos de usuários e de 70% a 80% em dados de desenvolvimento de software.',
    commonMistakes: ['Aumentar o armazenamento antes de ligar a desduplicação num compartilhamento cheio de cópias'],
    facts: ['Roda em segundo plano e é transparente para os usuários.', 'Consome memória do servidor de arquivos: a vazão escolhida precisa dar conta.'],
    exam: {
      domains: ['d4'],
      relevance: 'baixa',
      notes: 'Sinal: "reduzir o armazenamento de um compartilhamento Windows com muitos arquivos repetidos". A resposta é a desduplicação de dados.',
    },
    references: [R.winStorage],
    tags: ['custos'],
  },
]
