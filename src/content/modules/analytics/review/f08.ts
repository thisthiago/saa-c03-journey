/**
 * Questões da Revisão da Fase 8 de Análise de dados (serviços prontos de
 * IA, mídia e front-end), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'ana.f08',
  questions: [
    {
      id: 'rv:ana.f08.m3.a2',
      kind: 'decision',
      title: 'Uma proposta de modelo próprio',
      prompt:
        'Uma escola quer saber se os comentários dos alunos sobre os cursos são positivos ou negativos. Um cientista de dados propõe **treinar e hospedar no SageMaker AI** um modelo próprio de sentimento. A escola não tem equipe de aprendizado de máquina e quer o **menor esforço e custo**. O que fazer primeiro?',
      concepts: [{ id: 'ai.ready-vs-custom' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Treinar o modelo no SageMaker AI desde já, como proposto.', correct: false, consequence: 'Funciona, mas exige dados rotulados, treino, hospedagem e equipe para um problema que um serviço pronto já resolve.' },
        { id: 'b', text: 'Usar a análise de sentimento do Amazon Comprehend.', correct: true, consequence: 'O sentimento sai por uma API, sem treinar nem hospedar modelo.' },
        { id: 'c', text: 'Usar o Amazon Rekognition sobre prints dos comentários.', correct: false, consequence: 'O Rekognition analisa imagens; o sentimento de um texto é trabalho do Comprehend.' },
        { id: 'd', text: 'Contratar uma equipe para ler e classificar os comentários.', correct: false, consequence: 'Não escala e custa mais que uma chamada de API.' },
      ],
      explanation: [
        'Os **serviços prontos de IA** resolvem tarefas comuns por uma **API**, sem conhecimento de aprendizado de máquina. Análise de sentimento de textos é uma delas, no **Comprehend**. Treinar um modelo próprio no **SageMaker AI** só compensa quando o problema é específico do negócio e nenhum serviço pronto atende.',
        'O SageMaker AI traz treino, hospedagem e equipe. O Rekognition é para imagens. E a leitura manual não escala.',
        '**Regra prática:** "menor esforço, sem especialistas em aprendizado de máquina" pede um serviço pronto de IA; SageMaker AI para o que só existe no seu negócio.',
      ],
    },
    {
      id: 'rv:ana.f08.m3.a1',
      kind: 'decision',
      title: 'Prever quem vai abandonar o curso',
      prompt:
        'A coordenação de uma escola quer **prever quais alunos vão abandonar** o curso, a partir do **histórico próprio** de notas, frequência e pagamentos, guardado em tabelas. Nenhum serviço pronto de IA faz essa previsão. Qual serviço atende?',
      concepts: [{ id: 'ai.ready-vs-custom' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Comprehend, com análise de sentimento das notas.', correct: false, consequence: 'O Comprehend analisa textos; não prevê evasão a partir de números e pagamentos.' },
        { id: 'b', text: 'Amazon Lex, perguntando aos alunos se pretendem sair.', correct: false, consequence: 'Um chatbot conversa; não aprende com o histórico da escola para prever.' },
        { id: 'c', text: 'SageMaker AI, com um modelo treinado no histórico.', correct: true, consequence: 'O modelo aprende com os dados próprios da escola e pode ser hospedado para fazer as previsões.' },
        { id: 'd', text: 'Amazon Textract, lendo os boletins escaneados.', correct: false, consequence: 'O Textract extrai texto de documentos; os dados já estão em tabelas, e falta a previsão.' },
      ],
      explanation: [
        'Prever evasão com o **histórico próprio** da escola é um problema **específico do negócio**, sem serviço pronto. O **SageMaker AI** serve para **construir, treinar e hospedar modelos próprios** com esses dados.',
        'Comprehend, Lex e Textract resolvem tarefas comuns de texto, conversa e documentos, nenhuma delas uma previsão a partir de dados tabulares da escola.',
        '**Regra prática:** tarefa comum (texto, voz, imagem, documento) é serviço pronto; previsão a partir dos dados do seu negócio é SageMaker AI.',
      ],
    },
    {
      id: 'rv:ana.f08.m1.a1',
      kind: 'decision',
      title: 'Comentários em espanhol para uma equipe que lê português',
      prompt:
        'Uma escola recebe comentários de alunos **em espanhol** e quer que a equipe, que só lê português, **leia cada comentário traduzido** e saiba **se ele é positivo ou negativo**, sem treinar modelos. Quais opções atendem? (Escolha DUAS.)',
      concepts: [{ id: 'ai.text' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Amazon Translate, para traduzir os comentários.', correct: true, consequence: 'Traduz os textos entre idiomas por uma API.' },
        { id: 'b', text: 'Amazon Comprehend, para a análise de sentimento.', correct: true, consequence: 'Diz se cada texto é positivo, negativo, neutro ou misto.' },
        { id: 'c', text: 'Amazon Polly, para traduzir os comentários.', correct: false, consequence: 'O Polly transforma texto em fala; não traduz.' },
        { id: 'd', text: 'Amazon Lex, para a análise de sentimento.', correct: false, consequence: 'O Lex monta chatbots; o sentimento de textos é do Comprehend.' },
        { id: 'e', text: 'Amazon Transcribe, para traduzir os comentários.', correct: false, consequence: 'O Transcribe transforma fala em texto; os comentários já são texto.' },
      ],
      explanation: [
        'O **Translate** traduz textos entre idiomas, e o **Comprehend** entende textos: **sentimento**, entidades, frases-chave, idioma e dados pessoais. Juntos, entregam à equipe o comentário em português e o sentimento dele, por API.',
        'Polly e Transcribe trabalham com voz, em sentidos opostos. O Lex é para chatbots.',
        '**Regra prática:** "traduzir conteúdo" é Translate; "sentimento, entidades ou frases-chave de textos" é Comprehend.',
      ],
    },
    {
      id: 'rv:ana.f08.entidades',
      kind: 'decision',
      title: 'Produtos e cidades citados nos e-mails',
      prompt:
        'O atendimento de uma loja guarda no S3 **milhões de e-mails de clientes**, já em texto. A empresa quer extrair, **em lote**, os **produtos, marcas e cidades** citados em cada e-mail, para cruzar com as vendas, sem treinar modelos. Qual solução atende?',
      concepts: [{ id: 'ai.text' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Textract sobre os e-mails guardados no S3.', correct: false, consequence: 'O Textract lê documentos escaneados; os e-mails já estão em texto.' },
        { id: 'b', text: 'Amazon Rekognition sobre os e-mails guardados no S3.', correct: false, consequence: 'O Rekognition analisa imagens e vídeos, não texto.' },
        { id: 'c', text: 'Amazon Translate, traduzindo os e-mails para inglês.', correct: false, consequence: 'Traduzir não identifica quais produtos e cidades aparecem no texto.' },
        { id: 'd', text: 'Entidades do Comprehend, em jobs assíncronos.', correct: true, consequence: 'Os jobs processam os milhões de textos em lote e devolvem as entidades encontradas.' },
      ],
      explanation: [
        'O **Comprehend** extrai **entidades** de textos (pessoas, lugares, produtos, marcas) e trabalha em tempo real ou **em lotes grandes, por jobs assíncronos**, sobre os textos no S3. É o caso de milhões de e-mails.',
        'O Textract e o Rekognition leem imagens e documentos escaneados. O Translate traduz, sem extrair entidades.',
        '**Regra prática:** "extrair entidades ou frases-chave de muitos textos" é Comprehend, em jobs assíncronos quando o volume é grande.',
      ],
    },
    {
      id: 'rv:ana.f08.m1.a2',
      kind: 'decision',
      title: 'Aulas gravadas para quem não ouve',
      prompt:
        'Um aluno com deficiência auditiva precisa **ler o que o professor fala** nas aulas gravadas, e a escola quer gerar **legendas** em formato padrão para o player de vídeo, sem trabalho manual. Qual serviço atende?',
      concepts: [{ id: 'ai.voice' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Polly.', correct: false, consequence: 'O Polly transforma texto em fala, o caminho contrário do pedido.' },
        { id: 'b', text: 'Amazon Transcribe.', correct: true, consequence: 'Transforma a fala em texto e gera as legendas em WebVTT ou SubRip.' },
        { id: 'c', text: 'Amazon Lex com Lambda.', correct: false, consequence: 'O Lex conduz conversas com usuários; não legenda vídeos.' },
        { id: 'd', text: 'Amazon Comprehend.', correct: false, consequence: 'O Comprehend analisa texto já escrito; não ouve o áudio.' },
      ],
      explanation: [
        'O **Transcribe** transforma **fala em texto**, em tempo real ou em lote, e **gera legendas** nos formatos **WebVTT e SubRip**, prontos para players de vídeo.',
        'O Polly faz o caminho contrário, de texto para fala, útil para ler conteúdos em voz alta. O Lex monta chatbots, que conversam com o usuário. E o Comprehend analisa textos já escritos, sem ouvir áudio: poderia, no máximo, analisar as legendas depois de geradas.',
        '**Regra prática:** fala para texto e legendas, Transcribe; texto para fala, Polly. Não confunda os dois.',
      ],
    },
    {
      id: 'rv:ana.f08.m1.a1:bot',
      kind: 'decision',
      title: 'Onde está minha encomenda?',
      prompt:
        'Uma loja quer um **assistente de atendimento por texto e voz** que entenda pedidos como "onde está minha encomenda?" e **consulte o status no sistema de pedidos** durante a conversa, sem treinar modelos de linguagem. Qual solução atende?',
      concepts: [{ id: 'ai.voice' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Polly, lendo em voz alta as respostas de um FAQ.', correct: false, consequence: 'O Polly fala textos prontos; não entende a intenção nem consulta pedidos.' },
        { id: 'b', text: 'Amazon Comprehend, classificando cada mensagem recebida.', correct: false, consequence: 'Analisa textos, mas não conduz a conversa nem executa a consulta.' },
        { id: 'c', text: 'Amazon Lex, com uma função Lambda que consulta o pedido.', correct: true, consequence: 'O Lex entende a intenção e chama a Lambda para buscar o status durante a conversa.' },
        { id: 'd', text: 'Amazon Transcribe, transcrevendo as ligações para um atendente.', correct: false, consequence: 'Ajuda o atendente humano, mas não cria um assistente automático.' },
      ],
      explanation: [
        'O **Lex** monta **chatbots de texto e voz** que entendem a **intenção** do usuário. Ele se integra ao **Lambda** para executar ações durante a conversa, como consultar o status de um pedido.',
        'O Polly só transforma texto em fala, sem entender o que o cliente pede. O Comprehend analisa textos, mas não conduz a conversa nem executa ações. E o Transcribe transcreve as ligações, sem responder a ninguém: o atendimento continuaria humano.',
        '**Regra prática:** "chatbot" é Lex; a ação no meio da conversa vem de uma função Lambda.',
      ],
    },
    {
      id: 'rv:ana.f08.m2.a1',
      kind: 'decision',
      title: 'Fichas escaneadas, preenchidas à mão',
      prompt:
        'Uma escola recebe **fichas de matrícula escaneadas**, com campos **preenchidos à mão** (nome, curso, data de nascimento) e uma **tabela** de documentos entregues. Ela quer extrair os **pares campo e valor** e a tabela, estruturados, para o cadastro. Qual serviço atende?',
      concepts: [{ id: 'ai.vision' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Rekognition, com a detecção de texto em imagens.', correct: false, consequence: 'Acha palavras soltas na imagem, mas não entende os pares campo e valor nem a tabela.' },
        { id: 'b', text: 'Amazon Comprehend, com a detecção de entidades.', correct: false, consequence: 'Analisa texto que já foi extraído; não lê imagens escaneadas.' },
        { id: 'c', text: 'Amazon Transcribe, com legendas da ficha.', correct: false, consequence: 'O Transcribe trabalha com áudio, não com documentos.' },
        { id: 'd', text: 'Amazon Textract.', correct: true, consequence: 'Extrai texto impresso e manuscrito, formulários e tabelas, com a estrutura de cada campo.' },
      ],
      explanation: [
        'O **Textract** extrai **texto, formulários e tabelas** de documentos escaneados e lê **texto impresso e manuscrito**. Os campos da ficha chegam como pares campo e valor, e a tabela, com linhas e colunas, prontos para o cadastro.',
        'O Rekognition encontra textos soltos em imagens, sem a estrutura do formulário. O Comprehend não lê imagens. E o Transcribe é para fala.',
        '**Regra prática:** "extrair campos de formulários e tabelas de documentos" é Textract; "moderar imagens ou comparar rostos" é Rekognition.',
      ],
    },
    {
      id: 'rv:ana.f08.moderacao',
      kind: 'decision',
      title: 'Fotos impróprias enviadas por usuários',
      prompt:
        'Os usuários de um aplicativo de anúncios enviam fotos, guardadas no S3. A empresa precisa **barrar automaticamente imagens com conteúdo impróprio** antes da publicação, sem treinar modelos nem montar uma equipe de moderação para cada foto. Qual serviço atende?',
      concepts: [{ id: 'ai.vision' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Amazon Rekognition, com a moderação de conteúdo.', correct: true, consequence: 'Cada imagem recebe os rótulos de conteúdo impróprio, e o aplicativo barra as que passam do limite.' },
        { id: 'b', text: 'Amazon Textract, lendo o texto das fotos.', correct: false, consequence: 'Extrai texto de documentos; não identifica conteúdo impróprio em imagens.' },
        { id: 'c', text: 'Amazon Comprehend, analisando o nome dos arquivos.', correct: false, consequence: 'O nome do arquivo não diz o que está na imagem.' },
        { id: 'd', text: 'Amazon SageMaker AI, treinando um classificador próprio.', correct: false, consequence: 'Funciona, mas exige dados, treino e equipe para uma tarefa que um serviço pronto já faz.' },
      ],
      explanation: [
        'O **Rekognition** analisa imagens e vídeos guardados no S3: objetos, textos, **conteúdo impróprio** e rostos. A moderação de conteúdo devolve rótulos para cada imagem, e o aplicativo decide o que publicar.',
        'O Textract extrai texto de documentos e não avalia o conteúdo visual. O nome do arquivo não revela o que está na imagem. E um classificador próprio no SageMaker AI exige dados rotulados, treino e equipe para uma tarefa que o serviço pronto já cobre.',
        '**Regra prática:** moderar imagens, detectar objetos ou comparar rostos é Rekognition.',
      ],
    },
    {
      id: 'rv:ana.f08.m2.a2',
      kind: 'decision',
      title: 'Câmeras ao vivo e vídeos para celular',
      prompt:
        'Uma rede de escolas tem dois projetos de vídeo: enviar à AWS o **vídeo ao vivo das câmeras** das salas, para assistir e guardar; e **converter as aulas gravadas** em formatos para celular e TV. Um tutorial antigo recomenda o Elastic Transcoder para a conversão. Quais opções atendem hoje? (Escolha DUAS.)',
      concepts: [{ id: 'media.kvs' }, { id: 'media.transcoder' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Amazon Kinesis Video Streams, para as câmeras ao vivo.', correct: true, consequence: 'Recebe o vídeo ao vivo das câmeras, guarda e permite assistir em tempo real ou depois.' },
        { id: 'b', text: 'AWS Elemental MediaConvert, para converter as aulas gravadas.', correct: true, consequence: 'É o serviço atual de conversão de arquivos de vídeo para várias telas.' },
        { id: 'c', text: 'Amazon Elastic Transcoder, como no tutorial, para a conversão.', correct: false, consequence: 'O serviço foi encerrado em 13/11/2025 e não pode mais ser usado.' },
        { id: 'd', text: 'Amazon Kinesis Data Streams, para as câmeras ao vivo.', correct: false, consequence: 'É feito para registros de dados, não para vídeo.' },
        { id: 'e', text: 'Amazon Transcribe, para converter as aulas gravadas.', correct: false, consequence: 'O Transcribe gera texto a partir da fala; não converte o formato do vídeo.' },
      ],
      explanation: [
        'O **Kinesis Video Streams** recebe **vídeo ao vivo** de câmeras e outros aparelhos, guarda e permite assistir em tempo real ou processar depois. Para **converter arquivos** de vídeo em formatos para celular, TV e web, o serviço atual é o **AWS Elemental MediaConvert**, com legendas, DRM e empacotamento para várias telas.',
        'O Elastic Transcoder foi encerrado em 13/11/2025, embora ainda apareça na lista de serviços do exame. O Kinesis Data Streams não é para vídeo. E o Transcribe faz legendas, não conversão.',
        '**Regra prática:** vídeo ao vivo de aparelhos, Kinesis Video Streams; conversão de arquivos de vídeo, MediaConvert.',
      ],
    },
    {
      id: 'rv:ana.f08.m3.a3',
      kind: 'decision',
      title: 'Um site em React a cada push',
      prompt:
        'Um time front-end quer que o site em **React** seja **publicado a cada push** na branch principal do Git, com CDN, e que **cada branch de funcionalidade** tenha um ambiente próprio de testes, sem servidores para manter. Qual serviço atende?',
      concepts: [{ id: 'front.amplify-devicefarm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'AWS Device Farm.', correct: false, consequence: 'O Device Farm testa aplicativos em celulares e tablets reais; não publica sites.' },
        { id: 'b', text: 'Um bucket do S3, com upload manual a cada versão.', correct: false, consequence: 'Hospeda o site, mas sem publicação automática pelo Git nem ambiente por branch.' },
        { id: 'c', text: 'AWS Amplify Hosting.', correct: true, consequence: 'Publica a cada push, com CDN, e cria um ambiente para cada branch.' },
        { id: 'd', text: 'Instâncias EC2 com um servidor web e um script de deploy.', correct: false, consequence: 'Funciona, mas com servidores e scripts para manter.' },
      ],
      explanation: [
        'O **Amplify Hosting** publica aplicações web (React, Angular, Vue, Next.js e outras) **a cada push no Git**, com **CDN** e **ambientes por branch**, sem servidores para manter.',
        'O Device Farm é para testar aplicativos em aparelhos reais. Um bucket com upload manual e instâncias EC2 não entregam a publicação automática por branch sem trabalho extra.',
        '**Regra prática:** "publicar o front-end a cada push, com ambiente por branch" é Amplify Hosting; "testar o aplicativo em celulares reais" é Device Farm.',
      ],
    },
  ],
}
