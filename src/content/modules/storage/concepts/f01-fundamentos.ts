/**
 * Conceitos da Fase 1 — Fundamentos do Amazon S3.
 * Fatos conferidos na documentação oficial em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const S3_WELCOME = { title: 'What is Amazon S3?', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html' }
const OBJECTS = { title: 'Amazon S3 objects overview', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingObjects.html' }
const KEYS = { title: 'Naming Amazon S3 objects', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html' }
const METADATA = { title: 'Working with object metadata', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMetadata.html' }
const NAMING = { title: 'General purpose bucket naming rules', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html' }
const BUCKETS = { title: 'General purpose buckets overview', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingBucket.html' }
const DURABILITY = { title: 'Data protection in Amazon S3', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html' }
const CLASSES = { title: 'Understanding and managing Amazon S3 storage classes', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html' }
const FAQ = { title: 'Amazon S3 FAQs', url: 'https://aws.amazon.com/s3/faqs/' }
const CLOUD_STORAGE = { title: 'What is cloud storage?', url: 'https://aws.amazon.com/what-is/cloud-storage/' }
const EBS = { title: 'What is Amazon EBS?', url: 'https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html' }
const EFS = { title: 'What is Amazon EFS?', url: 'https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html' }
const MPU = { title: 'Uploading and copying objects using multipart upload', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html' }
const TAGGING = { title: 'Tagging your objects', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-tagging.html' }

export const F01_CONCEPTS: ConceptDef[] = [
  {
    id: 's3.service',
    title: 'Amazon S3',
    officialName: 'Amazon Simple Storage Service (Amazon S3)',
    serviceIds: ['aws.s3'],
    summary: 'Serviço de **armazenamento de objetos**: você guarda dados como objetos dentro de buckets e os acessa por API (HTTPS), de qualquer lugar autorizado.',
    explanation: [
      'O S3 não é um disco nem uma pasta de rede: é um repositório de objetos endereçados por nome (a object key). Aplicações gravam e leem objetos inteiros pela API.',
      'O volume total armazenado e o número de objetos são ilimitados; você paga pelo que usa (armazenamento, requisições, transferência e outros recursos).',
      'Exemplo: uma aplicação de fotos guarda as imagens no S3, grava só a key de cada uma no banco de dados e entrega as imagens pelo CloudFront. O banco continua pequeno, e o armazenamento das imagens cresce sem nenhum provisionamento.',
      '**Regra prática:** dado gravado e lido por inteiro, em volume que cresce sem previsão, vai para o S3; dado que exige leituras e gravações pequenas e frequentes, como o de um banco, vai para um disco em blocos.',
    ],
    useCases: [
      'Imagens, vídeos e documentos servidos por aplicações web',
      'Backups e arquivos de longo prazo',
      'Data lakes para analytics e machine learning',
      'Distribuição de conteúdo junto com o Amazon CloudFront',
    ],
    benefits: ['Escala sem provisionar capacidade', 'Durabilidade projetada de 11 noves', 'Integração com praticamente todos os serviços AWS'],
    limitations: [
      'Não é um dispositivo de blocos: não serve como disco de banco de dados transacional ou volume de boot',
      'Não oferece semântica completa de sistema de arquivos (bloqueio de arquivo, edição parcial in-place)',
    ],
    comparisons: [
      { with: 'storage.block', text: 'O Amazon EBS entrega blocos a uma instância EC2, como um disco; o S3 entrega objetos inteiros por API.' },
      { with: 'storage.file', text: 'O Amazon EFS oferece um sistema de arquivos NFS compartilhado; o S3 não monta como pasta nativamente.' },
    ],
    commonMistakes: ['Tratar o S3 como um sistema de arquivos e esperar renomear ou editar parte de um arquivo sem regravá-lo'],
    facts: [
      'O volume total de dados e o número de objetos armazenáveis são ilimitados.',
      'Recursos do S3 são privados por padrão; o acesso precisa ser concedido explicitamente.',
    ],
    recommendations: ['Use o S3 como destino padrão para dados não estruturados que a aplicação lê e grava por inteiro.'],
    exam: {
      domains: ['d2', 'd3', 'd4'],
      relevance: 'alta',
      notes: 'O S3 é a resposta padrão para guardar arquivos, mídia, backups e data lakes com durabilidade e custo baixo. Ele é distrator quando o enunciado pede um disco para o sistema operacional ou para um banco (EBS) ou um sistema de arquivos montado por vários servidores (EFS ou FSx).',
    },
    references: [S3_WELCOME, FAQ],
    tags: ['fundamentos'],
  },
  {
    id: 'storage.object',
    title: 'Armazenamento de objetos',
    officialName: 'Object storage',
    serviceIds: ['aws.s3'],
    summary: 'Cada dado é guardado como um **objeto** (conteúdo + metadados + identificador único) num espaço plano, acessado por API.',
    explanation: [
      'Pense num grande armazém de caixas etiquetadas: você pede a caixa pela etiqueta e recebe a caixa inteira. Não existe "abrir a caixa e trocar uma página" — para mudar o conteúdo, grava-se uma nova caixa.',
      '**Regra prática:** objeto se grava e se lê inteiro; para mudar um trecho, grava-se o objeto de novo.',
    ],
    useCases: ['Mídia e documentos', 'Backups', 'Data lakes', 'Artefatos de build e logs'],
    benefits: ['Escala horizontal enorme', 'Metadados ricos por objeto', 'Acesso via HTTP de qualquer lugar autorizado'],
    limitations: ['Atualizar um trecho exige regravar o objeto inteiro', 'Latência maior que a de um disco local para operações pequenas e frequentes'],
    comparisons: [
      { with: 'storage.block', text: 'Blocos permitem ler e escrever trechos pequenos com baixa latência — ideal para bancos de dados.' },
      { with: 'storage.file', text: 'Arquivos têm hierarquia real de diretórios, permissões POSIX/SMB e bloqueio — ideal para compartilhamento entre servidores.' },
    ],
    facts: ['No S3, alterar um objeto significa gravar um novo objeto (ou uma nova versão) com o mesmo nome.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Questões de armazenamento costumam pedir a escolha entre objeto (S3), bloco (EBS) e arquivo (EFS ou FSx) a partir do padrão de acesso. Acesso por API e escala sem limite apontam para objeto; disco de uma instância, para bloco; pasta compartilhada entre servidores, para arquivo.',
    },
    references: [CLOUD_STORAGE, S3_WELCOME],
    tags: ['fundamentos'],
  },
  {
    id: 'storage.block',
    title: 'Armazenamento em blocos',
    officialName: 'Block storage',
    serviceIds: ['aws.ebs'],
    summary: 'Os dados são divididos em **blocos** endereçáveis, entregues a um servidor como um disco. Na AWS, o exemplo típico é o **Amazon EBS**.',
    explanation: [
      'O sistema operacional formata o volume e decide como organizar arquivos sobre os blocos. Permite leituras e gravações pequenas com baixa latência.',
      'Exemplo: um PostgreSQL instalado numa instância EC2 guarda os arquivos de dados num volume EBS, porque o banco faz muitas leituras e gravações pequenas, em pontos diferentes do disco, a todo momento.',
      '**Regra prática:** se o software espera um disco, a resposta é armazenamento em blocos.',
    ],
    useCases: ['Volume de boot de instâncias EC2', 'Arquivos de dados de bancos relacionais autogerenciados', 'Aplicações que exigem I/O aleatório intenso'],
    benefits: ['Baixa latência', 'Atualização parcial eficiente'],
    limitations: ['Em geral ligado a uma instância por vez (o Multi-Attach existe só para casos específicos)', 'Capacidade provisionada: você paga pelo tamanho do volume'],
    comparisons: [{ with: 'storage.object', text: 'O S3 cobra pelo que está armazenado e escala sem provisionamento, mas não é um disco.' }],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais como "volume de boot", "banco de dados instalado no EC2", "baixa latência para I/O aleatório" ou "IOPS" apontam para o EBS. Se vários servidores precisam dos mesmos dados ao mesmo tempo, um volume EBS comum não serve: pense em armazenamento de arquivos (EFS ou FSx).',
    },
    references: [EBS, CLOUD_STORAGE],
    tags: ['fundamentos'],
  },
  {
    id: 'storage.file',
    title: 'Armazenamento de arquivos',
    officialName: 'File storage',
    serviceIds: ['aws.efs', 'aws.fsx'],
    summary: 'Dados organizados em **arquivos e diretórios hierárquicos**, compartilhados por protocolos como NFS ou SMB. Na AWS: **Amazon EFS** e **Amazon FSx**.',
    explanation: [
      'Vários servidores montam o mesmo sistema de arquivos e enxergam a mesma árvore de pastas, com permissões e bloqueio de arquivos.',
      'Exemplo: um gerenciador de conteúdo roda em várias instâncias atrás de um load balancer, e todas precisam ver os mesmos arquivos enviados pelos usuários. Um sistema de arquivos EFS montado em todas resolve sem mudar o código, que continua lendo um caminho de pasta.',
      '**Regra prática:** se vários servidores precisam montar a mesma pasta, a resposta é armazenamento de arquivos.',
    ],
    useCases: ['Pastas compartilhadas de equipes', 'Aplicações legadas que esperam um caminho de arquivo', 'Diretórios home e conteúdo web compartilhado entre servidores'],
    benefits: ['Compatibilidade com aplicações que usam caminhos de arquivo', 'Acesso simultâneo por vários clientes'],
    limitations: ['Custo por GB geralmente maior que o do S3', 'Acesso pela rede privada, não por API HTTP pública'],
    comparisons: [{ with: 'storage.object', text: 'No S3 as "pastas" são só prefixos de nomes; não há diretórios reais nem bloqueio de arquivo.' }],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "compartilhado entre várias instâncias", "NFS" ou "POSIX" apontam para o EFS (Linux); "SMB" ou "Windows", para o FSx for Windows File Server. O S3 é distrator quando a aplicação exige um caminho de arquivo montado e bloqueio de arquivo.',
    },
    references: [EFS, CLOUD_STORAGE],
    tags: ['fundamentos'],
  },
  {
    id: 's3.bucket',
    title: 'Bucket',
    officialName: 'General purpose bucket',
    serviceIds: ['aws.s3'],
    summary: 'Contêiner de objetos. Cada bucket é criado numa **Região** e seu nome é **único no namespace global** da partição AWS.',
    explanation: [
      'Depois de criado, o bucket não muda de nome nem de Região. Configurações como versionamento, criptografia padrão, políticas de acesso e regras de ciclo de vida são definidas por bucket.',
      'Além dos buckets de uso geral (foco desta trilha), existem tipos especializados — por exemplo, os directory buckets usados pela classe S3 Express One Zone.',
    ],
    useCases: ['Separar dados por aplicação, ambiente ou requisito de segurança'],
    limitations: ['Nome e Região não podem ser alterados após a criação'],
    commonMistakes: ['Colocar informação sensível no nome do bucket — ele aparece nas URLs', 'Excluir um bucket esperando reutilizar o nome: outra conta pode criá-lo antes'],
    facts: [
      'Buckets de uso geral existem num namespace global: o nome é único entre todas as contas de todas as Regiões da partição.',
      'Existe também o "account regional namespace", em que só a sua conta pode criar nomes com o sufixo da conta e da Região.',
    ],
    recommendations: ['Esvazie e mantenha buckets fora de uso em vez de excluí-los, para não perder o nome.'],
    exam: { domains: ['d1', 'd2'], relevance: 'alta' },
    references: [BUCKETS, NAMING],
    tags: ['fundamentos'],
  },
  {
    id: 's3.bucket-naming',
    title: 'Regras de nome de bucket',
    officialName: 'Bucket naming rules',
    serviceIds: ['aws.s3'],
    summary: 'Nomes de bucket têm **3 a 63 caracteres**, só **minúsculas, números, pontos e hífens**, começam e terminam com letra ou número e não podem parecer um endereço IP.',
    facts: [
      'Não pode haver dois pontos seguidos.',
      'Prefixos reservados: xn--, sthree-, amzn-s3-demo-. Sufixos reservados incluem -s3alias, --ol-s3, .mrap, --x-s3 e --table-s3.',
      'Buckets com ponto no nome não funcionam com virtual-hosted-style sobre HTTPS sem validação própria de certificado, nem com Transfer Acceleration.',
    ],
    recommendations: ['Evite pontos no nome, exceto para hospedagem de site estático.', 'Acrescente um identificador único para evitar colisões.'],
    commonMistakes: ['Usar letras maiúsculas ou sublinhado (_), herdados de convenções de outros sistemas'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [NAMING],
    tags: ['fundamentos'],
  },
  {
    id: 's3.object',
    title: 'Objeto',
    officialName: 'Object',
    serviceIds: ['aws.s3'],
    summary: 'Unidade armazenada no S3: **key** (nome), **valor** (os bytes), **metadados** e, com versionamento, um **version ID**. Pode ter de 0 bytes a **50 TB**.',
    explanation: [
      'Dentro de um bucket, a combinação key + version ID identifica um objeto de forma única.',
      'Para objetos grandes, o multipart upload divide o envio em partes, que podem ser enviadas em paralelo e reenviadas uma a uma se falharem. Acima de 5 GB ele é obrigatório; a partir de 100 MB, é o recomendado.',
    ],
    commonMistakes: ['Tentar enviar um arquivo de dezenas de GB num único PUT'],
    facts: [
      'Objetos podem ter de 0 bytes a 50 TB.',
      'Um único PUT envia até 5 GB; para objetos maiores é obrigatório o multipart upload, recomendado a partir de 100 MB.',
    ],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinais como "enviar arquivos de vários GB com mais velocidade" ou "retomar uploads que falham no meio" apontam para o multipart upload. Se o problema é a distância entre o cliente e a Região, ele pode ser combinado com o S3 Transfer Acceleration.',
    },
    references: [OBJECTS, MPU, FAQ],
    tags: ['fundamentos'],
  },
  {
    id: 's3.object-key',
    title: 'Object key e prefixos',
    officialName: 'Object key / prefix',
    serviceIds: ['aws.s3'],
    summary: 'A **object key** é o nome completo do objeto, incluindo os **prefixos**. O S3 tem estrutura **plana**: "pastas" são só prefixos separados por um delimitador (/).',
    explanation: [
      'Em `fotos/2026/praia.jpg`, a key inteira é `fotos/2026/praia.jpg`. O console e os SDKs usam o prefixo `fotos/2026/` e o delimitador `/` para exibir uma árvore de pastas.',
      'Com `Delimiter=/`, a listagem agrupa as keys em **CommonPrefixes** — é isso que o console mostra como pastas.',
    ],
    facts: [
      'A key tem até 1.024 bytes em UTF-8 e diferencia maiúsculas de minúsculas.',
      'Não há hierarquia de subbuckets ou subpastas no modelo de dados do S3.',
    ],
    consequences: ['"Renomear uma pasta" significa copiar cada objeto para uma nova key e excluir o original.'],
    commonMistakes: ['Achar que mover uma pasta é uma operação única e barata'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [KEYS],
    tags: ['fundamentos'],
  },
  {
    id: 's3.metadata',
    title: 'Metadados e tags',
    officialName: 'Object metadata / object tags',
    serviceIds: ['aws.s3'],
    summary: '**Metadados de sistema** (Content-Type, Content-Length, ETag, storage class…) são mantidos pelo S3; **metadados definidos pelo usuário** usam o prefixo `x-amz-meta-`; **tags** são pares chave-valor usados em políticas, ciclo de vida e custos.',
    facts: [
      'Metadados definidos pelo usuário não podem ser alterados após o upload; é preciso copiar o objeto definindo novos metadados.',
      'Metadados definidos pelo usuário somam no máximo 2 KB no cabeçalho do PUT.',
      'Cada objeto pode ter até 10 tags, que podem ser usadas em políticas IAM e de bucket, regras de lifecycle e relatórios de custo.',
    ],
    recommendations: ['Use tags (e não metadados) quando a informação precisar controlar acesso, ciclo de vida ou custos.'],
    exam: { domains: ['d1', 'd4'], relevance: 'media' },
    references: [METADATA, TAGGING],
    tags: ['fundamentos'],
    reviewItems: [
      {
        id: 'rv:s3.metadata:alterar',
        kind: 'decision',
        title: 'Corrigir um metadado',
        prompt: 'Um objeto foi enviado com `x-amz-meta-cliente: aurora`, mas o certo era `boreal`. Como corrigir?',
        concepts: [{ id: 's3.metadata' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Metadados definidos pelo usuário não mudam depois do upload: é preciso copiar o objeto (pode ser sobre ele mesmo) definindo os novos metadados.'],
        options: [
          { id: 'a', text: 'Copiar o objeto definindo os novos metadados.', correct: true, consequence: 'A cópia grava o objeto com os metadados corretos.' },
          { id: 'b', text: 'Editar só o cabeçalho do objeto existente, sem regravá-lo.', correct: false, consequence: 'Não há edição de metadados in-place no S3; a mudança exige uma cópia.' },
          { id: 'c', text: 'Não há como: será preciso excluir o bucket.', correct: false, consequence: 'Exagero: basta copiar o objeto com novos metadados.' },
        ],
      },
      {
        id: 'rv:s3.metadata:tags',
        kind: 'decision',
        title: 'Marcar documentos confidenciais',
        prompt: 'Uma política de acesso e uma regra de ciclo de vida precisam selecionar os documentos confidenciais. O que usar para marcá-los?',
        concepts: [{ id: 's3.metadata' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Tags de objeto podem ser usadas em políticas IAM e de bucket, regras de lifecycle e relatórios de custo.'],
        options: [
          { id: 'a', text: 'Tags de objeto, como confidencial=sim.', correct: true, consequence: 'Políticas e regras de lifecycle conseguem filtrar por tags.' },
          { id: 'b', text: 'Metadados definidos pelo usuário (x-amz-meta-).', correct: false, consequence: 'Metadados do usuário servem à aplicação, mas não são o mecanismo usado por políticas e lifecycle para selecionar objetos.' },
          { id: 'c', text: 'O Content-Type do objeto.', correct: false, consequence: 'O Content-Type descreve o formato do conteúdo, não sua classificação.' },
        ],
      },
    ],
  },
  {
    id: 's3.region',
    title: 'Regiões e localização dos dados',
    officialName: 'AWS Region',
    serviceIds: ['aws.s3'],
    summary: 'Cada bucket fica numa **Região** escolhida por você; os objetos não saem dela, a menos que você configure algo para isso (como replicação).',
    explanation: ['A escolha da Região afeta latência para os usuários, custos, requisitos de residência de dados e quais recursos estão disponíveis.'],
    facts: ['Classes como S3 Standard armazenam dados em pelo menos três zonas de disponibilidade da Região escolhida.'],
    recommendations: ['Escolha a Região mais próxima dos usuários e compatível com os requisitos de conformidade da organização.'],
    exam: { domains: ['d1', 'd2', 'd3'], relevance: 'media' },
    references: [BUCKETS, DURABILITY],
    tags: ['fundamentos'],
  },
  {
    id: 's3.durability',
    title: 'Durabilidade',
    officialName: 'Durability',
    serviceIds: ['aws.s3'],
    summary: 'Probabilidade de os dados **não serem perdidos**. O S3 é projetado para **99,999999999% (11 noves)** de durabilidade ao ano.',
    explanation: [
      'O S3 grava cópias redundantes em vários dispositivos (na maioria das classes, em pelo menos três zonas de disponibilidade), detecta falhas, repara redundância perdida e verifica a integridade com checksums.',
      'Exemplo: com 10 milhões de objetos no S3, 11 noves de durabilidade ao ano significam, em média, a perda de um único objeto a cada 10 mil anos.',
      '**Regra prática:** a durabilidade protege contra a perda de dados por falhas da infraestrutura; contra erros de quem usa, valem [[s3.versioning|versionamento]], [[s3.object-lock|Object Lock]] e backups.',
    ],
    comparisons: [
      { with: 's3.availability', text: 'A durabilidade mede a chance de não perder o dado; a disponibilidade mede a chance de conseguir acessá-lo agora. Um objeto pode estar preservado e temporariamente inacessível.' },
    ],
    commonMistakes: ['Confundir durabilidade com proteção contra exclusão acidental: a durabilidade protege contra falhas de hardware, não contra um DELETE feito por alguém'],
    consequences: ['Dados apagados por engano não são "recuperados pela durabilidade" — para isso existem versionamento, Object Lock e backups (Fase 5).'],
    facts: [
      'Todas as classes atuais são projetadas para 11 noves de durabilidade.',
      'S3 One Zone-IA e S3 Express One Zone guardam dados em uma única zona: são tão duráveis contra falhas de dispositivo, mas não resistem à perda física da zona.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Durabilidade e disponibilidade aparecem juntas para confundir. "Não perder dados" é durabilidade; "acessar a qualquer momento" é disponibilidade. Se o requisito é se proteger de exclusão acidental ou de ransomware, a resposta não é durabilidade, e sim versionamento, Object Lock ou backups.',
    },
    references: [DURABILITY, CLASSES],
    tags: ['durabilidade'],
  },
  {
    id: 's3.availability',
    title: 'Disponibilidade',
    officialName: 'Availability',
    serviceIds: ['aws.s3'],
    summary: 'Proporção do tempo em que os dados **podem ser acessados**. O S3 Standard é projetado para **99,99%**; outras classes têm valores menores (ex.: One Zone-IA, 99,5%).',
    explanation: [
      'Um objeto pode estar perfeitamente preservado (durável) e, ainda assim, momentaneamente inacessível (indisponível). São métricas diferentes.',
      'Exemplo: um relatório que pode ser recriado e é consultado raramente pode ir para o One Zone-IA, com 99,5% de disponibilidade projetada, para economizar. Um catálogo de produtos lido o tempo todo pela loja precisa da disponibilidade maior do S3 Standard.',
      '**Regra prática:** classes mais baratas costumam ter disponibilidade menor; aceite essa troca só quando o dado pode ficar inacessível de vez em quando ou pode ser recriado.',
    ],
    facts: [
      'Disponibilidade projetada: S3 Standard 99,99%; Intelligent-Tiering, Standard-IA e Glacier Instant Retrieval 99,9%; Express One Zone 99,95%; One Zone-IA 99,5%.',
      'O valor projetado de disponibilidade é diferente do SLA comercial do serviço.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Quando o enunciado diz que os dados "podem ser recriados" ou "são acessados raramente", classes de disponibilidade menor, como a One Zone-IA, ficam aceitáveis. Se os dados precisam sobreviver à perda de uma AZ, as classes One Zone ficam de fora.',
    },
    references: [CLASSES, DURABILITY],
    tags: ['disponibilidade'],
  },
  {
    id: 's3.consistency',
    title: 'Consistência forte',
    officialName: 'Strong read-after-write consistency',
    serviceIds: ['aws.s3'],
    summary: 'Depois que um PUT ou DELETE é concluído com sucesso, leituras e listagens seguintes já refletem a mudança — automaticamente e sem custo extra.',
    explanation: [
      'Na prática, uma aplicação que grava um objeto e o lê em seguida recebe a versão nova, e uma listagem logo depois da gravação já mostra o objeto. Não há configuração a fazer.',
    ],
    commonMistakes: ['Adicionar atrasos artificiais ("esperar o S3 propagar") depois de gravar um objeto'],
    facts: ['O S3 oferece consistência forte de leitura após escrita para PUTs e DELETEs, inclusive em listagens.'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Materiais antigos falam em consistência eventual no S3. Hoje, alternativas que acrescentam filas, atrasos ou um banco auxiliar só para contornar uma consistência fraca do S3 resolvem um problema que não existe mais.',
    },
    references: [S3_WELCOME, FAQ],
    tags: ['fundamentos'],
  },
]
