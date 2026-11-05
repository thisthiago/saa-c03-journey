/**
 * Questões da Revisão da Fase 6 de Arquivos e backup (escolha e caminho de
 * entrada), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). Os preços são
 * premissas do enunciado. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'fil.f06',
  questions: [
    {
      id: 'rv:fil.f06.objetos-por-api',
      kind: 'decision',
      title: 'Fotos que a aplicação lê por HTTP',
      prompt:
        'Um aplicativo de classificados recebe **milhões de fotos** dos usuários. As fotos nunca mudam depois do envio, são gravadas e lidas pela aplicação **por chamadas HTTP** e entregues pela CDN. Nenhum servidor precisa montar uma pasta. Qual armazenamento atende com o **menor custo**?',
      concepts: [{ id: 'files.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um sistema de arquivos EFS montado pelos servidores web.', correct: false, consequence: 'Paga um sistema de arquivos compartilhado que ninguém precisa montar.' },
        { id: 'b', text: 'Volumes EBS grandes anexados aos servidores web.', correct: false, consequence: 'Cada servidor teria a sua cópia, com capacidade provisionada e paga.' },
        { id: 'c', text: 'Um bucket do Amazon S3, gravado e lido pela API.', correct: true, consequence: 'Objetos por API, sem montar nada, no armazenamento mais barato por GB.' },
        { id: 'd', text: 'Um FSx for Lustre ligado à CDN para entregar as fotos.', correct: false, consequence: 'É para HPC em paralelo; caro e sem relação com entregar fotos.' },
      ],
      explanation: [
        'A escolha começa pelo **jeito de acessar**. Aqui ninguém monta uma pasta: a aplicação grava e lê **objetos por HTTP**. Isso é o **Amazon S3**, que cresce sem limite prático, é o mais barato por GB entre essas opções e serve de origem para a CDN.',
        'EFS e Lustre são sistemas de arquivos para clientes que montam pastas. O EBS é o disco de uma instância, com capacidade provisionada.',
        '**Regra prática:** objetos por API é S3; pasta compartilhada é EFS ou FSx, conforme o protocolo; disco de uma instância é EBS.',
      ],
    },
    {
      id: 'rv:fil.f06.m3.a1',
      kind: 'decision',
      title: 'As lojas que gravam por SMB',
      prompt:
        'Os servidores das lojas de uma rede gravam as notas por **SMB** numa pasta local e precisam de **acesso rápido às notas do mês**. A matriz quer **todas as notas no S3** para analisar. O time não quer mudar os sistemas das lojas e quer o **menor esforço**. O que instalar em cada loja?',
      concepts: [{ id: 'files.choose' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um servidor SFTP do AWS Transfer Family para cada loja.', correct: false, consequence: 'Os sistemas das lojas gravam por SMB, e teriam de mudar para SFTP.' },
        { id: 'b', text: 'Um S3 File Gateway, que oferece SMB e grava no bucket.', correct: true, consequence: 'SMB no local, cache das notas recentes e cada arquivo como objeto no S3.' },
        { id: 'c', text: 'Um agente do DataSync que copia a pasta local à noite.', correct: false, consequence: 'Mantém o servidor de arquivos da loja e só leva as notas uma vez por dia.' },
        { id: 'd', text: 'Um FSx for Windows File Server na Região, montado pelas lojas.', correct: false, consequence: 'Grava no FSx, não no S3, e as lojas perdem o acesso local rápido.' },
      ],
      explanation: [
        'Os requisitos são **SMB no local**, **cache** para as notas recentes e **arquivos no S3**. O **S3 File Gateway** oferece compartilhamentos NFS e SMB na loja, guarda os dados recentes em cache e grava cada arquivo como objeto no bucket, onde a matriz analisa.',
        'O Transfer Family exige SFTP ou FTPS. O DataSync copia de tempos em tempos e mantém o servidor da loja. O FSx for Windows guarda no próprio sistema de arquivos, não no S3.',
        '**Regra prática:** escritório que continua gravando por NFS ou SMB, com os arquivos indo para o S3, é S3 File Gateway; parceiro externo por SFTP é Transfer Family; cópia em massa é DataSync.',
      ],
    },
    {
      id: 'rv:fil.f06.m3.a3:p4',
      kind: 'decision',
      title: 'Relatórios do bucket para a pasta',
      prompt:
        'Todo dia, um sistema grava relatórios num **bucket S3**, e uma aplicação Linux precisa encontrá-los numa pasta do **Amazon EFS** que ela já monta. O time quer uma **cópia agendada e verificada**, sem servidores para manter. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'files.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma tarefa agendada do DataSync do S3 para o EFS, sem agente.', correct: true, consequence: 'Entre serviços da AWS, o DataSync copia e verifica sem agente.' },
        { id: 'b', text: 'Um agente do DataSync numa instância EC2 para fazer a cópia.', correct: false, consequence: 'Funciona, mas o agente é desnecessário entre serviços da AWS e vira algo a manter.' },
        { id: 'c', text: 'Um servidor do AWS Transfer Family lendo do bucket por SFTP todo dia.', correct: false, consequence: 'É para parceiros enviarem arquivos por SFTP, não para copiar entre serviços.' },
        { id: 'd', text: 'Uma instância EC2 com cron rodando aws s3 sync para a pasta.', correct: false, consequence: 'Funciona, mas é um servidor e um script para manter, sem verificação gerenciada.' },
      ],
      explanation: [
        'O **AWS DataSync** copia dados entre armazenamentos, de forma incremental e **verificada**, e pode ser **agendado**. Entre serviços da AWS, como do S3 para o EFS, ele **não precisa de agente**; o agente só é necessário para ler NFS ou SMB do data center.',
        'Um agente em EC2 ou um cron com sync acrescentam servidores. O Transfer Family atende parceiros que usam SFTP, FTPS, FTP ou AS2.',
        '**Regra prática:** copiar entre S3, EFS e FSx é DataSync sem agente; do NAS do data center para a AWS, DataSync com agente.',
      ],
    },
    {
      id: 'rv:fil.f06.m1.a1',
      kind: 'decision',
      title: 'Os arquivos chegam compactados e cifrados',
      prompt:
        'Os fornecedores de uma distribuidora já enviam arquivos por **SFTP** a um servidor do AWS Transfer Family que grava no S3. Cada arquivo chega **criptografado com PGP**, e o time precisa **descriptografar** e mover cada um para a pasta de processamento assim que chega, com o **menor esforço** e sem escrever código. Qual solução atende?',
      concepts: [{ id: 'xfer.transfer-family' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma função Lambda disparada pelo evento de objeto criado no S3.', correct: false, consequence: 'Funciona, mas exige escrever e manter o código da descriptografia.' },
        { id: 'b', text: 'Um script numa instância EC2 que varre o bucket a cada minuto.', correct: false, consequence: 'Volta a ter um servidor para manter, e o arquivo espera a próxima varredura.' },
        { id: 'c', text: 'Um fluxo gerenciado do Transfer Family ligado ao servidor.', correct: true, consequence: 'Cada arquivo recebido é descriptografado e copiado sem código.' },
        { id: 'd', text: 'Pedir aos fornecedores que parem de criptografar os arquivos.', correct: false, consequence: 'Muda os programas dos fornecedores e tira a proteção dos dados.' },
      ],
      explanation: [
        'O **Transfer Family** é um servidor gerenciado de SFTP, FTPS, FTP e AS2 que grava direto no S3 ou no EFS. Os **fluxos gerenciados** (managed workflows) processam cada arquivo recebido com passos prontos: **copiar, marcar, verificar, descompactar ou descriptografar**.',
        'Lambda e scripts em EC2 resolvem com código ou servidor para manter. Pedir aos fornecedores para mudar contraria o motivo de usar o Transfer Family.',
        '**Regra prática:** parceiros por SFTP sem servidor para manter é Transfer Family, e o processamento de cada arquivo recebido vai num fluxo gerenciado.',
      ],
    },
    {
      id: 'rv:fil.f06.m1.a2',
      kind: 'decision',
      title: 'Quanto custa o SFTP gerenciado',
      prompt:
        'Um servidor do AWS Transfer Family tem o protocolo **SFTP ligado o mês todo** (730 horas a **US$ 0,30 por hora**) e recebe **500 GB por mês** (US$ 0,04 por GB enviado). Nos fins de semana, quase nenhum arquivo chega. Quanto o servidor vai **custar por mês**?',
      concepts: [{ id: 'xfer.transfer-family' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 20, porque só os dados enviados são cobrados.', correct: false, consequence: 'Esquece a hora do protocolo, cobrada mesmo sem arquivos chegando.' },
        { id: 'b', text: 'Cerca de US$ 239, somando o protocolo e os dados.', correct: true, consequence: '730 × US$ 0,30 = US$ 219, e 500 × US$ 0,04 = US$ 20.' },
        { id: 'c', text: 'Cerca de US$ 175, sem cobrar as horas dos fins de semana.', correct: false, consequence: 'O protocolo ligado é cobrado por hora, com ou sem arquivos chegando.' },
        { id: 'd', text: 'Cerca de US$ 219, porque os dados enviados são gratuitos.', correct: false, consequence: 'Os dados enviados e baixados também são cobrados por GB.' },
      ],
      explanation: [
        'O Transfer Family cobra **por hora cada protocolo ligado**, mais os **dados enviados e baixados**. Protocolo: 730 × US$ 0,30 = **US$ 219**. Dados: 500 × US$ 0,04 = **US$ 20**. Total: **US$ 239 por mês**.',
        'A hora do protocolo é cobrada mesmo nos fins de semana sem arquivos, e os dados também entram na conta. Ligar mais protocolos (por exemplo, SFTP e FTPS) soma a hora de cada um.',
        '**Regra prática:** no Transfer Family, a maior parte da conta de um servidor pouco usado é a hora de cada protocolo ligado; desligue os protocolos que ninguém usa.',
      ],
    },
    {
      id: 'rv:fil.f06.m2.a2:ftp',
      kind: 'decision',
      title: 'O fornecedor que só fala FTP',
      prompt:
        'Um fornecedor antigo só consegue enviar arquivos por **FTP** e não vai trocar de programa. A regra de segurança da empresa proíbe que **dados sem criptografia passem pela internet**, e o fornecedor aceita configurar uma **VPN site a site**. Qual configuração do Transfer Family atende?',
      concepts: [{ id: 'xfer.endpoints' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Endpoint na VPC voltado para a internet, com FTP e IP elástico.', correct: false, consequence: 'O endpoint voltado para a internet aceita só SFTP e FTPS.' },
        { id: 'b', text: 'Endpoint interno na VPC com FTP, alcançado pela VPN.', correct: true, consequence: 'O FTP fica na rede privada, e a VPN cifra o caminho até o fornecedor.' },
        { id: 'c', text: 'Endpoint público do serviço com FTP e uma lista de IPs.', correct: false, consequence: 'O FTP só funciona com endpoint interno na VPC.' },
        { id: 'd', text: 'Endpoint voltado para a internet, exigindo FTPS do fornecedor.', correct: false, consequence: 'Atende à regra, mas o fornecedor teria de trocar o programa, o que ele recusa.' },
      ],
      explanation: [
        'O **FTP não é criptografado** e, no Transfer Family, **só funciona com endpoint interno na VPC**, alcançado pela rede privada, Direct Connect ou **VPN**. A VPN site a site cifra o tráfego entre o fornecedor e a VPC, então nenhum dado aberto passa pela internet.',
        'O endpoint voltado para a internet aceita só **SFTP e FTPS**, e o público não aceita FTP. Exigir FTPS seria o ideal, mas muda o programa do fornecedor.',
        '**Regra prática:** na internet, Transfer Family com SFTP ou FTPS; FTP só por endpoint interno na VPC, por VPN ou Direct Connect.',
      ],
    },
    {
      id: 'rv:fil.f06.m2.a3',
      kind: 'decision',
      title: 'Parceiros que já têm login',
      prompt:
        'Os usuários das transportadoras que enviam comprovantes por SFTP **já existem no Okta** da distribuidora. Cada transportadora só pode ver **a própria pasta** no bucket, e o time não quer **duplicar os usuários** no Transfer Family. Qual configuração atende?',
      concepts: [{ id: 'xfer.identity' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Usuários gerenciados pelo serviço, com uma role do bucket inteiro.', correct: false, consequence: 'Duplica os usuários, e uma transportadora lê os comprovantes das outras.' },
        { id: 'b', text: 'Um usuário do IAM com chaves de acesso para cada transportadora.', correct: false, consequence: 'Chaves de acesso do IAM não servem de login no Transfer Family.' },
        { id: 'c', text: 'Provedor personalizado por Lambda, com role e pasta por parceiro.', correct: true, consequence: 'O login continua no Okta, e cada transportadora só vê a própria pasta.' },
        { id: 'd', text: 'O AWS Managed Microsoft AD com os usuários copiados do Okta.', correct: false, consequence: 'Duplica os usuários num diretório novo, contra o requisito.' },
      ],
      explanation: [
        'No Transfer Family, os usuários vêm do **próprio serviço**, do **AWS Managed Microsoft AD** ou de um **provedor personalizado**, ligado por uma função **Lambda** ou pelo API Gateway, por exemplo ao Okta. Cada usuário recebe uma **role do IAM** e um **diretório inicial**, que limita o que ele vê no bucket.',
        'Usuários do serviço ou um AD novo duplicam as contas. Uma role para todos libera o bucket inteiro. Chaves do IAM não são uma forma de login.',
        '**Regra prática:** usuários que já estão num provedor externo entram no Transfer Family por um provedor personalizado; cada parceiro recebe a sua role e o seu diretório inicial.',
      ],
    },
  ],
}
