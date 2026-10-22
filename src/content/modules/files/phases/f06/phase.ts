/**
 * Fase 6 — Escolher o armazenamento de arquivos e o caminho de entrada.
 * Transfer Family (protocolos, endpoints e identidade) e, das outras
 * trilhas, File Gateway e DataSync.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FsChooserLabConfig } from '../../../../../simulators/fschooser/model'
import { META } from '../meta'

export const ROTA_SUL_ESCOLHA: FsChooserLabConfig = {
  itemsLabel: 'Necessidades',
  options: ['efs', 'fsx-windows', 'fsx-lustre', 'fsx-ontap', 'fsx-openzfs', 'ebs', 's3', 'file-gateway', 'datasync', 'transfer-family'],
  items: [
    { id: 'sftp', text: 'Transportadoras enviam os comprovantes de entrega por SFTP, com os programas que já usam', dominant: 'partner-sftp', needs: ['partner-sftp'], concepts: ['xfer.transfer-family', 'files.choose'] },
    { id: 'lojas', text: 'Os servidores das 40 lojas gravam notas por SMB, com cache local, e a matriz analisa tudo no S3', dominant: 'onprem-s3', needs: ['onprem-s3'], concepts: ['sgw.s3-file', 'files.choose'] },
    { id: 'nas', text: 'Levar uma vez, pela rede, os 80 TB do NAS do centro de distribuição para a AWS, com verificação', dominant: 'bulk-copy', needs: ['bulk-copy'], concepts: ['mig.datasync', 'files.choose'] },
    { id: 'web', text: 'Imagens dos produtos gravadas e lidas por servidores web Linux em três AZs', dominant: 'nfs-linux', needs: ['nfs-linux'], concepts: ['efs.what', 'files.choose'] },
    { id: 'financeiro', text: 'Pastas do financeiro no Windows, com as permissões do Active Directory', dominant: 'smb-ad', needs: ['smb-ad'], concepts: ['fsxw.what', 'files.choose'] },
    { id: 'banco', text: 'Disco do banco de dados de estoque, numa única instância', dominant: 'block-one', needs: ['block-one'], concepts: ['files.choose'] },
    { id: 'catalogo', text: 'Fotos do catálogo servidas pelo app por URL, com ciclo de vida para as antigas', dominant: 'object-api', needs: ['object-api'], concepts: ['files.choose'] },
    { id: 'rotas', text: 'Otimização de rotas em 200 servidores lendo o histórico guardado no S3', dominant: 'hpc-s3', needs: ['hpc-s3'], concepts: ['lustre.what', 'files.choose'] },
    { id: 'legado', text: 'O NetApp do ERP, com volumes por NFS e iSCSI', dominant: 'multi-protocol', needs: ['multi-protocol'], concepts: ['ontap.what', 'files.choose'] },
  ],
}

export const F06_FIL: PhaseDef = {
  ...META.f06,
  concepts: ['files.choose', 'xfer.transfer-family', 'xfer.endpoints', 'xfer.identity', 'sgw.s3-file', 'sgw.fsx-file', 'mig.datasync', 'efs.what', 'fsxw.what', 'lustre.what', 'ontap.what'],
  availability: 'available',
  simplifications: ['A distribuidora, os parceiros e os volumes são fictícios.', 'Os custos usam a tabela da AWS Price List em us-east-1, com 730 horas por mês.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fil.f06.m1',
      title: 'Os comprovantes por SFTP',
      type: 'mission',
      summary: 'AWS Transfer Family gravando no S3.',
      briefing: {
        company: 'Distribuidora Rota Sul',
        role: 'Você moderniza as integrações de arquivos de uma distribuidora.',
        situation: 'Trinta transportadoras enviam os comprovantes de entrega por SFTP para um servidor Linux antigo no data center. De lá, um script copia os arquivos para o S3 toda noite. O servidor cai uma vez por mês, e ninguém sabe atualizá-lo.',
        objective: 'Receber os arquivos direto no S3 sem que as transportadoras mudem nada.',
        successCriteria: ['Escolher o serviço', 'Estimar o custo mensal'],
      },
      intel: [{ conceptId: 'xfer.transfer-family', body: ['O **Transfer Family** é um servidor gerenciado de **SFTP, FTPS, FTP e AS2** que grava direto no **S3** ou no **EFS**. Os parceiros mantêm os mesmos programas; a cobrança é por **hora de protocolo ligado** e por GB transferido.'] }],
      activities: [
        {
          id: 'fil.f06.m1.a1',
          kind: 'decision',
          title: 'O fim do servidor SFTP',
          prompt: 'As transportadoras não vão mudar os programas que usam. O que colocar no lugar do servidor SFTP?',
          concepts: [{ id: 'xfer.transfer-family' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Transfer Family recebe o SFTP como antes e grava cada arquivo direto no bucket, sem servidor para cuidar.'],
          options: [
            { id: 'a', text: 'Um servidor SFTP do AWS Transfer Family gravando no bucket S3', correct: true, consequence: 'As transportadoras só trocam o endereço, e os arquivos chegam direto ao S3.' },
            { id: 'b', text: 'Pedir às transportadoras para enviar pela API do S3', correct: false, consequence: 'Exige que trinta parceiros mudem os sistemas.' },
            { id: 'c', text: 'Uma instância EC2 com servidor SFTP e um script para o S3', correct: false, consequence: 'Funciona, mas troca um servidor para cuidar por outro.' },
          ],
        },
        {
          id: 'fil.f06.m1.a2',
          kind: 'estimate',
          title: 'Quanto custa o SFTP gerenciado',
          prompt: 'Um servidor com o protocolo SFTP ligado o mês todo (730 horas a US$ 0,30 por hora) recebe 500 GB por mês (US$ 0,04 por GB enviado). Quanto custa por mês, em dólares?',
          concepts: [{ id: 'xfer.transfer-family' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Protocolo: 730 × 0,30 = US$ 219. Dados: 500 × 0,04 = US$ 20. Total: US$ 239. A hora do protocolo é cobrada mesmo sem arquivos chegando.'],
          scenario: ['Preços de us-east-1 na tabela da AWS Price List de 22/10/2026.'],
          unit: 'US$ por mês',
          min: 0,
          max: 600,
          step: 1,
          answer: 239,
          tolerance: 0.05,
        },
      ],
      debrief: { takeaways: ['Parceiro com SFTP: Transfer Family gravando no S3 ou no EFS.', 'Cada protocolo ligado é cobrado por hora.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f06.m2',
      title: 'O firewall da transportadora',
      type: 'mission',
      summary: 'Endpoints e identidade no Transfer Family.',
      briefing: {
        company: 'Distribuidora Rota Sul',
        role: 'Você configura o acesso das transportadoras.',
        situation: 'Uma transportadora só libera conexões de saída para endereços IP fixos. A distribuidora quer aceitar conexões só dos IPs das transportadoras. Um parceiro antigo pede para continuar usando FTP pela internet.',
        objective: 'Escolher o endpoint, os protocolos e quem pode entrar.',
        successCriteria: ['IPs fixos e filtro por origem', 'Nenhum protocolo sem criptografia na internet', 'Cada parceiro na sua pasta'],
      },
      intel: [
        { conceptId: 'xfer.endpoints', body: ['O endpoint **na VPC voltado para a internet** recebe **IPs elásticos fixos** e é protegido por **security groups**. Ele aceita só **SFTP e FTPS**. O **FTP**, sem criptografia, só funciona com endpoint **interno**.'] },
        { conceptId: 'xfer.identity', body: ['Os usuários podem ser do **próprio serviço** (chaves SSH), do **AWS Managed Microsoft AD** ou de um **provedor personalizado** por Lambda ou API Gateway. Cada um tem uma **role** e um diretório inicial.'] },
      ],
      activities: [
        {
          id: 'fil.f06.m2.a1',
          kind: 'decision',
          title: 'IPs fixos e filtro de origem',
          prompt: 'A transportadora precisa de IPs fixos para liberar no firewall, e a distribuidora quer aceitar só os IPs dos parceiros. Que endpoint usar?',
          concepts: [{ id: 'xfer.endpoints' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O endpoint na VPC voltado para a internet recebe um IP elástico por AZ, que o parceiro libera, e o security group aceita só os IPs dos parceiros.'],
          options: [
            { id: 'a', text: 'Endpoint na VPC, voltado para a internet, com IPs elásticos e security group com os IPs dos parceiros', correct: true, consequence: 'Endereços fixos para o firewall do parceiro e filtro de origem do lado da distribuidora.' },
            { id: 'b', text: 'Endpoint na VPC, interno', correct: false, consequence: 'Só é alcançado pela rede privada; as transportadoras estão na internet.' },
            { id: 'c', text: 'Endpoint público, pedindo ao parceiro para liberar o nome DNS', correct: false, consequence: 'O firewall do parceiro só aceita IPs fixos.' },
          ],
        },
        {
          id: 'fil.f06.m2.a2',
          kind: 'classify',
          title: 'O que passa pela internet',
          prompt: 'Num endpoint voltado para a internet, quais protocolos o Transfer Family aceita?',
          concepts: [{ id: 'xfer.endpoints' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O endpoint voltado para a internet aceita SFTP e FTPS. O FTP, sem criptografia, só funciona com endpoint interno na VPC.'],
          bins: [
            { id: 'yes', label: 'Aceito na internet' },
            { id: 'no', label: 'Só na rede interna' },
          ],
          items: [
            { id: 'sftp', text: 'SFTP', bin: 'yes', explanation: 'Criptografado pelo SSH.', concepts: ['xfer.endpoints'] },
            { id: 'ftps', text: 'FTPS', bin: 'yes', explanation: 'FTP com TLS.', concepts: ['xfer.endpoints'] },
            { id: 'ftp', text: 'FTP', bin: 'no', explanation: 'Texto aberto: só com endpoint interno.', concepts: ['xfer.endpoints'] },
          ],
        },
        {
          id: 'fil.f06.m2.a3',
          kind: 'decision',
          title: 'Cada transportadora na sua pasta',
          prompt: 'Os usuários das transportadoras já existem no provedor de identidade da distribuidora (Okta), e cada uma só pode ver a própria pasta no bucket. O que configurar?',
          concepts: [{ id: 'xfer.identity' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Um provedor de identidade personalizado, por Lambda, autentica no Okta e devolve a role e o diretório inicial de cada transportadora.'],
          options: [
            { id: 'a', text: 'Provedor de identidade personalizado por Lambda ligado ao Okta, com role e diretório inicial por transportadora', correct: true, consequence: 'Os usuários continuam no Okta, e cada parceiro só vê a sua pasta.' },
            { id: 'b', text: 'Uma única role com acesso ao bucket inteiro para todas as transportadoras', correct: false, consequence: 'Uma transportadora lê os comprovantes das outras.' },
            { id: 'c', text: 'Criar usuários IAM com chaves de acesso para cada transportadora', correct: false, consequence: 'Os usuários do Transfer Family vêm do próprio serviço, do AD ou de um provedor personalizado; chaves de acesso do IAM não servem de login.' },
          ],
        },
      ],
      debrief: { takeaways: ['Internet com IP fixo: endpoint na VPC voltado para a internet, com IPs elásticos.', 'Na internet, só SFTP e FTPS.', 'Provedor personalizado para usar o diretório da empresa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f06.m3',
      title: 'Os arquivos das lojas',
      type: 'mission',
      summary: 'File Gateway, DataSync e o caminho de entrada de cada caso.',
      briefing: {
        company: 'Distribuidora Rota Sul',
        role: 'Você define como os arquivos chegam à AWS.',
        situation: 'As 40 lojas gravam notas fiscais por SMB num servidor local e precisam de acesso rápido às do mês. O centro de distribuição tem um NAS de 80 TB que será desligado. Um consultor sugeriu o FSx File Gateway para as lojas.',
        objective: 'Escolher o caminho de entrada de cada caso.',
        successCriteria: ['Lojas com cache local e dados no S3', 'Cópia única do NAS com verificação', 'Opção indisponível descartada'],
      },
      intel: [
        { conceptId: 'sgw.s3-file' },
        { conceptId: 'mig.datasync' },
        { conceptId: 'sgw.fsx-file' },
      ],
      activities: [
        {
          id: 'fil.f06.m3.a1',
          kind: 'decision',
          title: 'As notas das lojas',
          prompt: 'As lojas gravam por SMB, querem as notas do mês com acesso rápido no local, e a matriz analisa tudo no S3. O que instalar nas lojas?',
          concepts: [{ id: 'sgw.s3-file' }, { id: 'files.choose', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O S3 File Gateway oferece SMB no local, com cache, e grava cada arquivo como objeto no S3, onde a matriz analisa.'],
          options: [
            { id: 'a', text: 'S3 File Gateway em cada loja', correct: true, consequence: 'SMB no local, cache das notas recentes e tudo no bucket.' },
            { id: 'b', text: 'FSx File Gateway em cada loja', correct: false, consequence: 'Não aceita novos clientes desde 28/10/2024, e gravaria no FSx, não no S3.' },
            { id: 'c', text: 'AWS Transfer Family', correct: false, consequence: 'Os servidores das lojas gravam por SMB, não por SFTP.' },
          ],
        },
        {
          id: 'fil.f06.m3.a2',
          kind: 'decision',
          title: 'O NAS que será desligado',
          prompt: 'Os 80 TB do NAS do centro de distribuição vão para um FSx for Windows File Server, uma vez só, pelo link de 10 Gbps, com verificação dos dados. O que usar?',
          concepts: [{ id: 'mig.datasync' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O DataSync copia de SMB para o FSx pela rede, com verificação, de forma incremental, usando um agente no local.'],
          options: [
            { id: 'a', text: 'AWS DataSync, com um agente no centro de distribuição', correct: true, consequence: 'Cópia pela rede, incremental e verificada, direto para o FSx.' },
            { id: 'b', text: 'AWS Transfer Family', correct: false, consequence: 'É para parceiros enviarem arquivos, não para migrar um NAS.' },
            { id: 'c', text: 'Copiar com o Explorador de Arquivos de um computador do escritório', correct: false, consequence: 'Sem verificação nem retomada, e semanas de cópia manual.' },
          ],
        },
        {
          id: 'fil.f06.m3.a3',
          kind: 'match',
          title: 'Cada caminho no seu caso',
          prompt: 'Ligue cada situação ao caminho de entrada.',
          concepts: [{ id: 'files.choose' }, { id: 'xfer.transfer-family', weight: 0.5 }, { id: 'mig.datasync', weight: 0.5 }, { id: 'sgw.s3-file', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Parceiro externo com protocolo próprio: Transfer Family. Escritório que continua gravando no local: File Gateway. Migração ou sincronização em massa: DataSync.'],
          leftLabel: 'Situação',
          rightLabel: 'Caminho',
          pairs: [
            { id: 'p1', left: 'Fornecedor envia planilhas por FTPS', right: 'AWS Transfer Family', explanation: 'Mantém o protocolo do fornecedor.', concepts: ['xfer.transfer-family'] },
            { id: 'p2', left: 'Escritório continua gravando por NFS, e os arquivos precisam estar no S3', right: 'S3 File Gateway', explanation: 'NFS local, objetos no S3.', concepts: ['sgw.s3-file'] },
            { id: 'p3', left: 'Copiar 30 TB de um servidor NFS para o EFS, uma vez', right: 'AWS DataSync', explanation: 'Cópia em massa, verificada.', concepts: ['mig.datasync'] },
            { id: 'p4', left: 'Copiar todo dia os relatórios de um bucket S3 para o EFS', right: 'AWS DataSync, sem agente', explanation: 'Entre serviços da AWS, o DataSync não precisa de agente.', concepts: ['mig.datasync'] },
          ],
        },
      ],
      debrief: { takeaways: ['Lojas que continuam gravando no local: S3 File Gateway.', 'Migração em massa pela rede: DataSync.', 'FSx File Gateway: sem novos clientes desde 28/10/2024.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f06.boss',
      title: 'O mapa de arquivos da distribuidora',
      type: 'boss',
      summary: 'Armazenamento e caminho de entrada de nove necessidades.',
      briefing: {
        company: 'Distribuidora Rota Sul',
        role: 'Você entrega o mapa de armazenamento de arquivos da distribuidora.',
        situation: 'Nove necessidades, de parceiros enviando por SFTP a um banco numa única instância.',
        objective: 'Escolher o serviço de cada necessidade, com o menor esforço.',
        successCriteria: ['Cada necessidade no serviço certo'],
      },
      intel: [{ conceptId: 'files.choose', body: ['Comece pelo protocolo e por quem grava: servidor da AWS, escritório no local, parceiro externo ou migração única.'] }],
      activities: [
        {
          id: 'fil.f06.boss.a1',
          kind: 'lab',
          lab: 'fs-chooser',
          title: 'Nove necessidades',
          prompt: 'Posicione cada necessidade no serviço que a atende com menos esforço.',
          concepts: [{ id: 'files.choose' }, { id: 'xfer.transfer-family' }, { id: 'sgw.s3-file', weight: 0.5 }, { id: 'mig.datasync', weight: 0.5 }],
          xp: 250,
          difficulty: 3,
          hints: ['Parceiro externo com protocolo próprio aponta para o Transfer Family.', 'Disco de uma instância só é bloco, não arquivo.'],
          explanation: ['SFTP: Transfer Family. Lojas: S3 File Gateway. NAS: DataSync. Imagens dos servidores web: EFS. Financeiro: FSx for Windows. Banco: EBS. Catálogo: S3. Rotas: Lustre. NetApp do ERP: ONTAP.'],
          config: ROTA_SUL_ESCOLHA,
        },
      ],
      debrief: { takeaways: ['O protocolo e quem grava decidem o serviço.', 'Transfer Family, File Gateway e DataSync são caminhos de entrada, não lugares de guardar.'] },
    },
  ],
}
