/** Desafio final — Projeto Atlas (empresa fictícia: Atlas Engenharia). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'

export const ATLAS: ArchitectureLabConfig = {
  title: 'Relatório do Projeto Atlas',
  dimensions: [
    { id: 'seguranca', label: 'Segurança', examDomain: 'd1' },
    { id: 'custo', label: 'Custo', examDomain: 'd4' },
    { id: 'durabilidade', label: 'Durabilidade', examDomain: 'd2' },
    { id: 'disponibilidade', label: 'Disponibilidade', examDomain: 'd2' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
    { id: 'qualidade', label: 'Qualidade arquitetural', examDomain: 'd3' },
  ],
  minDimension: 0.5,
  steps: [
    {
      id: 'servicos',
      title: 'Serviços e recursos',
      intro: 'A Atlas Engenharia guarda **documentos de projetos** (contratos, plantas) e **arquivos de processamento** (resultados de simulações). Tudo hoje está num servidor de arquivos local que está no limite.',
      questions: [
        {
          id: 'onde',
          prompt: 'Onde guardar documentos e resultados?',
          options: [
            { id: 's3', label: 'Amazon S3', scores: { requisitos: 1, custo: 1, durabilidade: 1 }, consequence: 'Escala sem provisionar capacidade, 11 noves de durabilidade e acesso por API para as integrações.', concepts: ['storage.object'] },
            { id: 'ebs', label: 'Volumes Amazon EBS num servidor de arquivos em EC2', scores: { requisitos: 0.4, custo: 0.3, durabilidade: 0.4 }, consequence: 'Capacidade provisionada e paga mesmo sem uso, presa a uma AZ e a uma instância que você administra.', concepts: ['storage.block'] },
            { id: 'efs', label: 'Amazon EFS para tudo', scores: { requisitos: 0.6, custo: 0.4, durabilidade: 0.9 }, consequence: 'Funciona como sistema de arquivos compartilhado, mas é mais caro para anos de arquivo e não oferece as classes de arquivamento e os recursos de objeto do S3.', concepts: ['storage.file'] },
          ],
        },
        {
          id: 'buckets',
          prompt: 'Como organizar os buckets?',
          options: [
            { id: 'por-finalidade', label: 'Um bucket para documentos e outro para processamento', scores: { qualidade: 1, seguranca: 1 }, consequence: 'Políticas, criptografia, replicação e lifecycle diferentes para dados com exigências diferentes.' },
            { id: 'um-so', label: 'Um único bucket, separando por prefixos', scores: { qualidade: 0.6, seguranca: 0.7 }, consequence: 'Funciona, mas todas as configurações do bucket valem para os dois tipos de dado; políticas por prefixo ficam mais complexas.' },
            { id: 'por-usuario', label: 'Um bucket por funcionário', scores: { qualidade: 0.2, seguranca: 0.5 }, consequence: 'Centenas de buckets para administrar, sem ganho real de isolamento — e problemas quando alguém sai da empresa.' },
          ],
        },
      ],
    },
    {
      id: 'classes',
      title: 'Classes de armazenamento',
      intro: 'Três padrões de acesso: documentos de projetos ativos (abertos todos os dias), resultados de simulação (recriáveis, lidos poucas vezes) e projetos encerrados (retidos 10 anos, prazo de 48 h para consulta).',
      questions: [
        {
          id: 'ativos',
          prompt: 'Documentos de projetos ativos:',
          options: [
            { id: 'standard', label: 'S3 Standard', scores: { custo: 1, disponibilidade: 1 }, consequence: 'Sem taxa de recuperação para um dado muito acessado.', concepts: ['sc.standard'] },
            { id: 'ia', label: 'S3 Standard-IA', scores: { custo: 0.4, disponibilidade: 0.9 }, consequence: 'Com leitura diária, a taxa por GB recuperado supera a economia no armazenamento.', concepts: ['sc.standard-ia'] },
            { id: 'onezone', label: 'S3 One Zone-IA', scores: { custo: 0.4, durabilidade: 0.3 }, consequence: 'Contratos não são recriáveis: perder a AZ significaria perder documentos.', concepts: ['sc.onezone-ia'] },
          ],
        },
        {
          id: 'resultados',
          prompt: 'Resultados de simulação (recriáveis, lidos poucas vezes, precisam abrir na hora):',
          options: [
            { id: 'onezone', label: 'S3 One Zone-IA', scores: { custo: 1, durabilidade: 1 }, consequence: 'Barato e com leitura imediata; como os dados são recriáveis, perder a AZ só exigiria reprocessar.', concepts: ['sc.onezone-ia'] },
            { id: 'standard', label: 'S3 Standard', scores: { custo: 0.5, durabilidade: 1 }, consequence: 'Funciona, mas paga caro por dados recriáveis e pouco lidos.', concepts: ['sc.standard'] },
            { id: 'deep', label: 'S3 Glacier Deep Archive', scores: { custo: 0.8, requisitos: 0.2 }, consequence: 'Ler exigiria restaurar por até 12 horas: não atende "abrir na hora".', concepts: ['sc.deep-archive'] },
          ],
        },
        {
          id: 'encerrados',
          prompt: 'Projetos encerrados (10 anos, consulta em até 48 h):',
          options: [
            { id: 'deep', label: 'S3 Glacier Deep Archive', scores: { custo: 1, requisitos: 1 }, consequence: 'O menor preço; restauração Bulk em até 48 h atende ao prazo.', concepts: ['sc.deep-archive'] },
            { id: 'gir', label: 'S3 Glacier Instant Retrieval', scores: { custo: 0.6, requisitos: 1 }, consequence: 'Leitura imediata que ninguém pediu, a um preço por GB bem maior.', concepts: ['sc.glacier-ir'] },
            { id: 'standard', label: 'S3 Standard', scores: { custo: 0.1, requisitos: 1 }, consequence: 'Dez anos pagando a classe mais cara por dados quase nunca lidos.', concepts: ['sc.standard'] },
          ],
        },
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      intro: 'Contratos são **confidenciais**. Clientes (sem conta AWS) precisam baixar **entregáveis** específicos. A aplicação interna lê e grava documentos.',
      questions: [
        {
          id: 'publico',
          prompt: 'Proteção contra exposição pública:',
          options: [
            { id: 'bpa', label: 'Block Public Access na conta e nos buckets, ACLs desativadas', scores: { seguranca: 1 }, consequence: 'Nenhuma configuração pública passa por engano.', concepts: ['s3.block-public-access'] },
            { id: 'off', label: 'Desligar o Block Public Access para os clientes conseguirem baixar', scores: { seguranca: 0 }, consequence: 'Um erro numa política expõe contratos confidenciais.', concepts: ['s3.block-public-access'] },
          ],
        },
        {
          id: 'terceiros',
          prompt: 'Como entregar arquivos aos clientes?',
          options: [
            { id: 'presigned', label: 'URLs pré-assinadas com expiração curta', scores: { seguranca: 1, requisitos: 1 }, consequence: 'Cada cliente baixa só o seu arquivo, por tempo limitado; o bucket continua privado.', concepts: ['s3.presigned-url'] },
            { id: 'prefixo-publico', label: 'Uma bucket policy pública para o prefixo entregaveis/', scores: { seguranca: 0.2, requisitos: 0.7 }, consequence: 'Qualquer pessoa que descobrir a key baixa o entregável de qualquer cliente.', concepts: ['s3.public-policy'] },
            { id: 'iam-users', label: 'Um usuário IAM com chaves de acesso para cada cliente', scores: { seguranca: 0.4, qualidade: 0.3, requisitos: 0.6 }, consequence: 'Credenciais de longo prazo espalhadas fora da empresa para baixar arquivos.', concepts: ['iam.identities'] },
          ],
          context: [{ when: ['publico', ['bpa']], text: 'Você ligou o Block Public Access na etapa anterior: políticas públicas seriam rejeitadas.' }],
        },
        {
          id: 'app',
          prompt: 'Permissões da aplicação interna:',
          options: [
            { id: 'least', label: 'Role com ações e prefixos específicos', scores: { seguranca: 1, qualidade: 1 }, consequence: 'Menor privilégio: uma falha na aplicação não vira acesso a tudo.', concepts: ['iam.least-privilege'] },
            { id: 'all', label: 's3:* em * para evitar erros', scores: { seguranca: 0.1, qualidade: 0.3 }, consequence: 'Qualquer falha ou credencial vazada alcança todos os buckets da conta.', concepts: ['iam.least-privilege'] },
          ],
        },
      ],
    },
    {
      id: 'criptografia',
      title: 'Criptografia',
      intro: 'A auditoria exige saber **quem descriptografa** contratos. A aplicação faz milhões de leituras por mês.',
      questions: [
        {
          id: 'repouso',
          prompt: 'Criptografia dos contratos:',
          options: [
            { id: 'kms-bk', label: 'SSE-KMS com chave do cliente e S3 Bucket Key', scores: { seguranca: 1, custo: 1, requisitos: 1 }, consequence: 'Uso da chave auditável no CloudTrail, com até 99% menos requisições ao KMS.', concepts: ['s3.sse-kms', 's3.bucket-keys'] },
            { id: 'kms', label: 'SSE-KMS com chave do cliente, sem Bucket Key', scores: { seguranca: 1, custo: 0.4, requisitos: 1 }, consequence: 'Atende à auditoria, mas cada leitura chama o KMS: a conta do KMS acompanha os milhões de GETs.', concepts: ['s3.bucket-keys'] },
            { id: 'sse-s3', label: 'SSE-S3 (padrão)', scores: { seguranca: 0.6, custo: 1, requisitos: 0.3 }, consequence: 'Os dados ficam cifrados, mas não há chave própria nem registro de quem descriptografou.', concepts: ['s3.sse-s3'] },
          ],
        },
        {
          id: 'transito',
          prompt: 'Criptografia em trânsito:',
          options: [
            { id: 'deny', label: 'Bucket policy com Deny quando aws:SecureTransport = false', scores: { seguranca: 1 }, consequence: 'Nenhuma requisição sem TLS é aceita.', concepts: ['s3.tls-enforcement'] },
            { id: 'allow', label: 'Allow para a própria conta quando aws:SecureTransport = true', scores: { seguranca: 0.3 }, consequence: 'Não bloqueia nada: quem tem permissão por IAM continua usando HTTP.', concepts: ['s3.tls-enforcement'] },
            { id: 'nada', label: 'Nada: a criptografia em repouso já basta', scores: { seguranca: 0 }, consequence: 'Repouso e trânsito são camadas diferentes; os dados poderiam trafegar sem TLS.', concepts: ['crypto.at-rest-in-transit'] },
          ],
        },
      ],
    },
    {
      id: 'versionamento',
      title: 'Versionamento e lifecycle',
      intro: 'Exclusões e sobrescritas acidentais precisam ser recuperáveis por **30 dias**, sem a conta crescer para sempre.',
      questions: [
        {
          id: 'recuperacao',
          prompt: 'Recuperação de exclusões acidentais:',
          options: [
            { id: 'v-lc', label: 'Versionamento + expiração de versões não atuais após 30 dias', scores: { durabilidade: 1, custo: 1, requisitos: 1 }, consequence: 'Tudo recuperável por 30 dias; depois, as versões antigas deixam de pesar na conta.', concepts: ['s3.versioning', 'lc.noncurrent'] },
            { id: 'v', label: 'Versionamento sem lifecycle', scores: { durabilidade: 1, custo: 0.4, requisitos: 1 }, consequence: 'Recupera tudo, mas cada regravação acumula uma cópia inteira para sempre.', concepts: ['s3.versioning-cost'] },
            { id: 'mfa-lc', label: 'Versionamento + MFA delete + expiração de versões após 30 dias', scores: { durabilidade: 0.8, qualidade: 0.2, requisitos: 0.6 }, consequence: 'O MFA delete não pode ser usado com configurações de lifecycle: a combinação não funciona.', concepts: ['s3.mfa-delete'] },
            { id: 'nenhum', label: 'Sem versionamento; backup semanal com script', scores: { durabilidade: 0.3, requisitos: 0.2 }, consequence: 'Até uma semana de trabalho perdida a cada exclusão acidental.', concepts: ['s3.versioning'] },
          ],
        },
        {
          id: 'limpeza',
          prompt: 'Uploads grandes de resultados às vezes caem no meio. O que fazer?',
          options: [
            { id: 'abort', label: 'AbortIncompleteMultipartUpload após 7 dias', scores: { custo: 1 }, consequence: 'Partes de uploads abandonados deixam de ser cobradas.', concepts: ['lc.mpu-cleanup'] },
            { id: 'expira', label: 'Expiration de 7 dias no prefixo de uploads', scores: { custo: 0.3 }, consequence: 'Expiration não remove uploads multipart incompletos.', concepts: ['lc.mpu-cleanup'] },
            { id: 'nada', label: 'Nada: partes incompletas não são cobradas', scores: { custo: 0.1 }, consequence: 'São cobradas — e não aparecem na listagem.', concepts: ['lc.mpu-cleanup'] },
          ],
        },
      ],
    },
    {
      id: 'replicacao',
      title: 'Replicação',
      intro: 'Os documentos precisam de **cópia em outra Região**, numa conta separada, com RPO previsível de 15 minutos.',
      questions: [
        {
          id: 'dr',
          prompt: 'Cópia em outra Região:',
          options: [
            { id: 'crr-full', label: 'CRR para outra conta, com RTC e opt-in de SSE-KMS (chave na Região de destino)', scores: { durabilidade: 1, disponibilidade: 1, requisitos: 1 }, consequence: 'Todos os documentos novos chegam ao destino, com SLA de 15 minutos para 99,9% deles.', concepts: ['repl.rtc', 'repl.kms'] },
            { id: 'crr-basic', label: 'CRR para outra conta, com RTC, sem opções extras', scores: { durabilidade: 0.7, disponibilidade: 0.9, requisitos: 0.6 }, consequence: 'Funciona para objetos SSE-S3; objetos SSE-KMS só são replicados com opt-in e uma chave na Região de destino.', concepts: ['repl.kms'] },
            { id: 'srr', label: 'SRR para outro bucket na mesma Região', scores: { durabilidade: 0.6, disponibilidade: 0.3, requisitos: 0.2 }, consequence: 'Uma indisponibilidade regional afetaria as duas cópias.', concepts: ['repl.crr-srr'] },
            { id: 'nenhuma', label: 'Sem replicação: o versionamento já protege', scores: { durabilidade: 0.4, disponibilidade: 0, requisitos: 0 }, consequence: 'Versionamento não protege contra a perda da Região nem da conta.', concepts: ['backup.independent-copy'] },
          ],
          context: [
            { when: ['repouso', ['kms-bk', 'kms']], text: 'Na etapa 4 você escolheu **SSE-KMS** para os contratos.' },
            { when: ['recuperacao', ['nenhum']], text: 'Na etapa 5 você decidiu **não** habilitar o versionamento.' },
          ],
        },
        {
          id: 'marcadores',
          prompt: 'Exclusões feitas na origem:',
          options: [
            { id: 'nao', label: 'Não replicar delete markers', scores: { durabilidade: 1 }, consequence: 'Uma exclusão acidental na origem não esconde o documento na cópia de DR.', concepts: ['repl.delete-markers'] },
            { id: 'sim', label: 'Replicar delete markers para manter tudo igual', scores: { durabilidade: 0.5 }, consequence: 'Exclusões acidentais se propagam para a cópia de DR.', concepts: ['repl.delete-markers'] },
          ],
        },
      ],
    },
    {
      id: 'integracoes',
      title: 'Integrações',
      intro: 'Todo resultado novo em `entrada/` precisa gerar um PDF de resumo (gravado em `resumos/`, no mesmo bucket) e avisar três sistemas: CRM, faturamento e painel.',
      questions: [
        {
          id: 'processamento',
          prompt: 'Como disparar o processamento?',
          options: [
            { id: 'sqs-prefix', label: 'Notificação de entrada/ para uma fila SQS consumida por uma Lambda que grava em resumos/', scores: { qualidade: 1, disponibilidade: 1 }, consequence: 'A fila absorve picos e novas tentativas; a saída fica fora do gatilho.', concepts: ['ev.notifications', 'ev.recursion'] },
            { id: 'lambda-all', label: 'Notificação de todo o bucket direto para a Lambda', scores: { qualidade: 0.1, disponibilidade: 0.5 }, consequence: 'Cada resumo gravado no bucket dispara a função de novo: loop recursivo.', concepts: ['ev.recursion'] },
            { id: 'cron', label: 'Um script que lista o bucket a cada hora', scores: { qualidade: 0.4, disponibilidade: 0.7 }, consequence: 'Atraso de até uma hora e listagens cada vez maiores.', concepts: ['ev.notifications'] },
          ],
        },
        {
          id: 'avisos',
          prompt: 'Como avisar os três sistemas?',
          options: [
            { id: 'sns', label: 'Fan-out: um tópico SNS com uma fila para cada sistema', scores: { qualidade: 1, disponibilidade: 1 }, consequence: 'Cada sistema consome no próprio ritmo; a falha de um não afeta os outros.', concepts: ['ev.fanout'] },
            { id: 'tres', label: 'Três notificações com o mesmo prefixo', scores: { qualidade: 0.2, disponibilidade: 0.3 }, consequence: 'Filtros sobrepostos para os mesmos eventos: o S3 recusa a configuração.', concepts: ['ev.filter-overlap'] },
          ],
        },
      ],
    },
    {
      id: 'custos',
      title: 'Custo e limitações',
      intro: 'Clientes **sem conta AWS** baixam cerca de 5 TB de entregáveis por mês. A diretoria quer saber o que ainda pesa na conta — e o que o projeto não cobre.',
      questions: [
        {
          id: 'downloads',
          prompt: 'O custo dos downloads dos clientes:',
          options: [
            { id: 'aceitar', label: 'Manter as URLs pré-assinadas e prever o custo de transferência (avaliando CloudFront mais adiante)', scores: { custo: 1, requisitos: 1 }, consequence: 'O custo fica previsto e os clientes continuam baixando sem conta AWS.', concepts: ['s3.data-transfer'] },
            { id: 'rp', label: 'Ligar Requester Pays no bucket de entregáveis', scores: { custo: 0.6, requisitos: 0 }, consequence: 'Clientes sem conta AWS (anônimos para o S3) seriam negados.', concepts: ['rp.limits'] },
          ],
        },
        {
          id: 'limitacao',
          prompt: 'Que limitação comunicar à diretoria?',
          options: [
            { id: 'batch', label: 'Documentos anteriores à replicação não vão sozinhos para a outra Região: é preciso um job de S3 Batch Replication.', scores: { qualidade: 1, durabilidade: 1 }, consequence: 'O RPO real fica claro e o passado também ganha cópia.', concepts: ['repl.batch'] },
            { id: 'nenhuma', label: 'Nenhuma: a arquitetura cobre tudo automaticamente.', scores: { qualidade: 0.2, durabilidade: 0.5 }, consequence: 'Os documentos antigos ficariam sem cópia de DR, e ninguém saberia.', concepts: ['repl.what-not'] },
          ],
        },
      ],
    },
  ],
  rules: [
    { id: 'repl-sem-versao', when: [['recuperacao', ['nenhum']], ['dr', ['crr-full', 'crr-basic', 'srr']]], penalty: { requisitos: 0.25, durabilidade: 0.2 }, message: 'Você escolheu replicação (etapa 6) sem versionamento (etapa 5): a replicação exige versionamento na origem e no destino, e a configuração seria rejeitada.', concepts: ['repl.requirements'] },
    { id: 'kms-sem-optin', when: [['repouso', ['kms-bk', 'kms']], ['dr', ['crr-basic']]], penalty: { durabilidade: 0.25, requisitos: 0.2 }, message: 'Contratos em SSE-KMS (etapa 4) com replicação sem opt-in (etapa 6): os contratos — os dados mais críticos — não chegariam à outra Região.', concepts: ['repl.kms'] },
    { id: 'bpa-x-publico', when: [['publico', ['bpa']], ['terceiros', ['prefixo-publico']]], penalty: { requisitos: 0.2 }, message: 'Block Public Access ligado (etapa 3) e entrega por política pública: o S3 rejeitaria a política e os clientes ficariam sem acesso.', concepts: ['s3.block-public-access'] },
    { id: 'bpa-off-publico', when: [['publico', ['off']], ['terceiros', ['prefixo-publico']]], penalty: { seguranca: 0.2 }, message: 'Sem Block Public Access e com um prefixo público, qualquer erro de key ou de política expõe documentos de outros clientes.', concepts: ['s3.public-policy'] },
    { id: 'kms-sem-bk-loop', when: [['repouso', ['kms']], ['processamento', ['lambda-all']]], penalty: { custo: 0.2 }, message: 'Um loop recursivo (etapa 7) sobre objetos SSE-KMS sem Bucket Key (etapa 4) multiplica também as chamadas ao KMS.', concepts: ['ev.recursion', 's3.bucket-keys'] },
  ],
}

export const FINAL: PhaseDef = {
  id: 's3x.final',
  order: 12,
  title: 'Desafio final: Projeto Atlas',
  subtitle: 'Arquitetura completa de armazenamento',
  summary: 'Um cenário empresarial completo, avaliado em segurança, custo, durabilidade, disponibilidade e qualidade das decisões.',
  glyph: 'trophy',
  color: '#ffe08a',
  requires: ['s3x.f01', 's3x.f02', 's3x.f03', 's3x.f04', 's3x.f05', 's3x.f06', 's3x.f07', 's3x.f08', 's3x.f09'],
  recommends: ['s3x.f10', 's3x.f11'],
  concepts: [
    'storage.object',
    'storage.block',
    'storage.file',
    'sc.standard',
    'sc.standard-ia',
    'sc.onezone-ia',
    'sc.deep-archive',
    'sc.glacier-ir',
    's3.block-public-access',
    's3.presigned-url',
    's3.public-policy',
    'iam.identities',
    'iam.least-privilege',
    's3.sse-kms',
    's3.bucket-keys',
    's3.sse-s3',
    's3.tls-enforcement',
    'crypto.at-rest-in-transit',
    's3.versioning',
    'lc.noncurrent',
    's3.versioning-cost',
    's3.mfa-delete',
    'lc.mpu-cleanup',
    'repl.rtc',
    'repl.kms',
    'repl.crr-srr',
    'backup.independent-copy',
    'repl.delete-markers',
    'repl.requirements',
    'ev.notifications',
    'ev.recursion',
    'ev.fanout',
    'ev.filter-overlap',
    's3.data-transfer',
    'rp.limits',
    'repl.batch',
    'repl.what-not',
  ],
  availability: 'available',
  estimatedMinutes: 60,
  map: { x: 820, y: 400 },
  simplifications: [
    'A rubrica é uma avaliação pedagógica das decisões, com pesos definidos por este projeto — não é uma métrica da AWS.',
    'As regras entre etapas cobrem os conflitos mais importantes; uma arquitetura real exige outras verificações.',
  ],
  missions: [
    {
      id: 's3x.final.atlas',
      title: 'Projeto Atlas',
      type: 'final',
      passThreshold: 0.7,
      summary: 'Desenhar, em oito etapas, a arquitetura de armazenamento da Atlas Engenharia — e receber o relatório.',
      briefing: {
        company: 'Atlas Engenharia',
        role: 'Você é a pessoa arquiteta de soluções responsável pelo projeto.',
        situation:
          'A Atlas vai levar todos os dados para a AWS. Requisitos: guardar documentos e arquivos de processamento; proteger dados confidenciais; disponibilizar alguns objetos a clientes sem conta AWS; reduzir custos; recuperar exclusões acidentais por 30 dias; manter cópia em outra Região com RPO de 15 minutos; processar arquivos ao chegar.',
        objective: 'Tomar as decisões de cada etapa considerando as anteriores.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão: segurança, custo, durabilidade, disponibilidade, atendimento aos requisitos e qualidade arquitetural'],
      },
      intel: [],
      activities: [
        {
          id: 's3x.final.atlas.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'A arquitetura da Atlas',
          prompt: 'Percorra as oito etapas. O painel "Decisões até aqui" mostra o projeto se formando; lembretes aparecem quando uma decisão anterior importa. Ao verificar, você recebe o relatório.',
          concepts: [{ id: 's3.versioning' }, { id: 'repl.kms' }, { id: 's3.sse-kms' }, { id: 's3.block-public-access' }, { id: 'ev.recursion' }, { id: 'sc.deep-archive' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Volte às etapas anteriores sempre que um lembrete aparecer.', 'Contratos SSE-KMS e replicação: veja a etapa 6 com cuidado.'],
          explanation: [
            'Uma arquitetura que atende a todos os requisitos: S3 com buckets por finalidade; Standard para documentos ativos, One Zone-IA para resultados recriáveis e Deep Archive para projetos encerrados; Block Public Access, URLs pré-assinadas e menor privilégio; SSE-KMS com Bucket Key e Deny sem TLS; versionamento com expiração de versões não atuais e limpeza de uploads; CRR com RTC e opt-in de SSE-KMS, sem replicar delete markers; fila entre o evento e a Lambda, fan-out por SNS; transferência prevista e Batch Replication para o passado.',
          ],
          config: ATLAS,
        },
      ],
      debrief: {
        takeaways: [
          'Decisões de uma etapa mudam o que é correto nas outras: versionamento, criptografia e replicação andam juntos.',
          'Os conceitos que ficaram abaixo do esperado já estão na sua fila de revisão.',
          'Este desafio não reproduz questões oficiais e não garante aprovação no exame.',
        ],
      },
    },
  ],
}
