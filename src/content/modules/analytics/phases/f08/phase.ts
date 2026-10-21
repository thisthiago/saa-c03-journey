/**
 * Fase 8 — Serviços prontos de IA, mídia e front-end. Comprehend, Translate,
 * Lex, Polly, Transcribe, Rekognition, Textract, SageMaker AI, Kinesis Video
 * Streams, Elastic Transcoder e MediaConvert, Amplify e Device Farm.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { AiChooserLabConfig } from '../../../../../simulators/aichooser/model'
import { META } from '../meta'

export const SABER_MAIS_AI: AiChooserLabConfig = {
  itemsLabel: 'Necessidades da escola',
  options: ['comprehend', 'lex', 'polly', 'rekognition', 'textract', 'transcribe', 'translate', 'sagemaker', 'kvs', 'mediaconvert', 'elastic-transcoder', 'amplify', 'device-farm'],
  items: [
    { id: 'avaliacoes', text: 'Saber se os comentários dos alunos sobre cada curso são positivos ou negativos', dominant: 'sentiment', needs: ['sentiment'], concepts: ['ai.text', 'ai.ready-vs-custom'] },
    { id: 'matricula', text: 'Ler os campos das fichas de matrícula escaneadas', dominant: 'doc-fields', needs: ['doc-fields'], concepts: ['ai.vision'] },
    { id: 'legendas', text: 'Gerar legendas para as videoaulas', dominant: 'speech-text', needs: ['speech-text'], concepts: ['ai.voice'] },
    { id: 'audiolivro', text: 'Transformar as apostilas em áudio para alunos com deficiência visual', dominant: 'tts', needs: ['tts'], concepts: ['ai.voice'] },
    { id: 'atendimento', text: 'Um assistente que responde, por texto e voz, dúvidas sobre matrícula', dominant: 'chatbot', needs: ['chatbot'], concepts: ['ai.voice'] },
    { id: 'fotos', text: 'Barrar fotos impróprias enviadas para o perfil dos alunos', dominant: 'image-objects', needs: ['image-objects'], concepts: ['ai.vision'] },
    { id: 'evasao', text: 'Prever quais alunos vão abandonar o curso, com os dados históricos da escola', dominant: 'custom-model', needs: ['custom-model'], concepts: ['ai.ready-vs-custom'] },
    { id: 'videos', text: 'Converter as aulas gravadas para formatos de celular e de TV', dominant: 'transcode', needs: ['transcode'], concepts: ['media.transcoder'] },
    { id: 'app', text: 'Testar o aplicativo da escola em dezenas de celulares reais', dominant: 'real-devices', needs: ['real-devices'], concepts: ['front.amplify-devicefarm'] },
  ],
}

export const F08_ANA: PhaseDef = {
  ...META.f08,
  concepts: ['ai.ready-vs-custom', 'ai.text', 'ai.voice', 'ai.vision', 'media.kvs', 'media.transcoder', 'front.amplify-devicefarm'],
  availability: 'available',
  simplifications: ['As atividades tratam do que cada serviço faz; preços, limites e idiomas de cada um ficam de fora, salvo quando citados.', 'Escola, alunos e necessidades são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f08.m1',
      title: 'Texto e voz',
      type: 'mission',
      summary: 'Comprehend, Translate, Lex, Polly e Transcribe.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você leva serviços de IA para uma escola online.',
        situation: 'A escola recebe milhares de comentários de alunos, grava videoaulas sem legenda, quer apostilas em áudio e um assistente de atendimento. A equipe não tem especialistas em aprendizado de máquina.',
        objective: 'Ligar cada necessidade de texto e voz ao serviço pronto certo.',
        successCriteria: ['Diferenciar Polly e Transcribe', 'Saber o que o Comprehend faz e um limite dele'],
      },
      intel: [
        { conceptId: 'ai.text', body: ['**Comprehend**: sentimento, entidades, frases-chave, idioma e dados pessoais em textos. **Translate**: tradução.'] },
        { conceptId: 'ai.voice', body: ['**Lex**: chatbots de texto e voz. **Polly**: texto em fala. **Transcribe**: fala em texto, com legendas.'] },
      ],
      activities: [
        {
          id: 'ana.f08.m1.a1',
          kind: 'match',
          title: 'Cada necessidade, um serviço',
          prompt: 'Associe cada necessidade ao serviço pronto que a atende.',
          concepts: [{ id: 'ai.text' }, { id: 'ai.voice' }],
          xp: 60,
          difficulty: 1,
          explanation: ['Sentimento é Comprehend; tradução é Translate; chatbot é Lex; texto em fala é Polly; fala em texto é Transcribe.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Serviço',
          pairs: [
            { id: 'sent', left: 'Saber se um comentário é positivo ou negativo', right: 'Amazon Comprehend', explanation: 'Análise de sentimento de textos.', concepts: ['ai.text'] },
            { id: 'trad', left: 'Oferecer os cursos em espanhol', right: 'Amazon Translate', explanation: 'Tradução de textos.', concepts: ['ai.text'] },
            { id: 'bot', left: 'Um assistente de atendimento por texto e voz', right: 'Amazon Lex', explanation: 'Chatbots que entendem a intenção.', concepts: ['ai.voice'] },
            { id: 'tts', left: 'Ler as apostilas em voz alta', right: 'Amazon Polly', explanation: 'Texto em fala.', concepts: ['ai.voice'] },
            { id: 'stt', left: 'Legendar as videoaulas', right: 'Amazon Transcribe', explanation: 'Fala em texto, com legendas.', concepts: ['ai.voice'] },
          ],
        },
        {
          id: 'ana.f08.m1.a2',
          kind: 'decision',
          title: 'Polly ou Transcribe',
          prompt: 'Um aluno com deficiência auditiva precisa ler o que o professor fala nas aulas gravadas. Qual serviço?',
          concepts: [{ id: 'ai.voice' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Transcribe transforma fala em texto e gera legendas. O Polly faz o caminho contrário, de texto para voz.'],
          options: [
            { id: 'a', text: 'Amazon Transcribe', correct: true, consequence: 'As aulas ganham legendas em WebVTT ou SubRip.' },
            { id: 'b', text: 'Amazon Polly', correct: false, consequence: 'O Polly transforma texto em fala, não fala em texto.' },
            { id: 'c', text: 'Amazon Lex', correct: false, consequence: 'O Lex conduz conversas; não legenda vídeos.' },
          ],
        },
        {
          id: 'ana.f08.m1.a3',
          kind: 'decision',
          title: 'CPF nos comentários',
          prompt: 'A escola quer achar e mascarar dados pessoais (CPF, telefone) nos comentários, que estão em português. A detecção de dados pessoais do Comprehend atende diretamente?',
          concepts: [{ id: 'ai.text' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Segundo a documentação conferida, a detecção de dados pessoais do Comprehend funciona em textos em inglês e em espanhol. Para português, é preciso outra abordagem, como um modelo personalizado ou regras próprias.'],
          options: [
            { id: 'a', text: 'Não diretamente: a detecção de dados pessoais do Comprehend atende inglês e espanhol', correct: true, consequence: 'A escola precisa de outra abordagem para os textos em português.' },
            { id: 'b', text: 'Sim, em qualquer idioma', correct: false, consequence: 'A documentação lista só inglês e espanhol para esse recurso.' },
          ],
        },
      ],
      debrief: { takeaways: ['Comprehend: sentimento, entidades e dados pessoais (em inglês e espanhol).', 'Polly: texto em fala; Transcribe: fala em texto; Lex: chatbots.', 'Translate: tradução.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f08.m2',
      title: 'Imagem, documento e vídeo',
      type: 'mission',
      summary: 'Rekognition, Textract, Kinesis Video Streams e a conversão de vídeo.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você trata as imagens, os documentos e os vídeos da escola.',
        situation: 'Alunos enviam fotos de perfil e fichas de matrícula escaneadas. As aulas presenciais do polo de Recife são transmitidas por câmeras. Um tutorial antigo da equipe manda converter os vídeos com o Elastic Transcoder.',
        objective: 'Escolher o serviço de cada caso, inclusive o substituto de um serviço encerrado.',
        successCriteria: ['Diferenciar Rekognition e Textract', 'Saber que o Elastic Transcoder foi encerrado'],
      },
      intel: [
        { conceptId: 'ai.vision', body: ['**Rekognition**: objetos, textos, conteúdo impróprio e rostos em imagens e vídeos. **Textract**: texto, formulários e tabelas de documentos.'] },
        { conceptId: 'media.transcoder', body: ['O **Elastic Transcoder** foi **encerrado em 13/11/2025**. Para converter arquivos de vídeo, use o **AWS Elemental MediaConvert**.'] },
        { conceptId: 'media.kvs', body: ['O **Kinesis Video Streams** recebe vídeo ao vivo de câmeras e aparelhos.'] },
      ],
      activities: [
        {
          id: 'ana.f08.m2.a1',
          kind: 'decision',
          title: 'A ficha escaneada',
          prompt: 'As fichas de matrícula chegam escaneadas, com campos como nome, curso e data de nascimento numa tabela. Qual serviço extrai esses campos?',
          concepts: [{ id: 'ai.vision' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Textract extrai texto, formulários e tabelas de documentos. O Rekognition detecta textos soltos em imagens, mas não entende a estrutura de um formulário.'],
          options: [
            { id: 'a', text: 'Amazon Textract', correct: true, consequence: 'Os campos chegam estruturados, prontos para o cadastro.' },
            { id: 'b', text: 'Amazon Rekognition', correct: false, consequence: 'Acha textos na imagem, mas não os pares campo e valor do formulário.' },
            { id: 'c', text: 'Amazon Comprehend', correct: false, consequence: 'Analisa texto já extraído; não lê imagens.' },
          ],
        },
        {
          id: 'ana.f08.m2.a2',
          kind: 'decision',
          title: 'O tutorial antigo',
          prompt: 'O tutorial da equipe manda converter as aulas com o Amazon Elastic Transcoder. O que fazer hoje?',
          concepts: [{ id: 'media.transcoder' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Elastic Transcoder foi encerrado em 13/11/2025 e não pode mais ser usado. O serviço atual para converter arquivos de vídeo é o AWS Elemental MediaConvert.'],
          options: [
            { id: 'a', text: 'Usar o AWS Elemental MediaConvert', correct: true, consequence: 'A conversão roda no serviço atual.' },
            { id: 'b', text: 'Seguir o tutorial com o Elastic Transcoder', correct: false, consequence: 'O serviço foi encerrado em 13/11/2025.' },
            { id: 'c', text: 'Usar o Kinesis Video Streams', correct: false, consequence: 'Ele recebe vídeo ao vivo; não converte arquivos.' },
          ],
        },
        {
          id: 'ana.f08.m2.a3',
          kind: 'decision',
          title: 'As câmeras do polo',
          prompt: 'O polo de Recife quer enviar o vídeo ao vivo das câmeras das salas para a AWS, guardar e assistir de outros lugares. O que usar?',
          concepts: [{ id: 'media.kvs' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Kinesis Video Streams recebe, guarda e permite assistir vídeo ao vivo de câmeras e outros aparelhos.'],
          options: [
            { id: 'a', text: 'Amazon Kinesis Video Streams', correct: true, consequence: 'As câmeras transmitem para a AWS, e as aulas podem ser vistas e gravadas.' },
            { id: 'b', text: 'Amazon Kinesis Data Streams', correct: false, consequence: 'Feito para registros de dados, não para vídeo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Rekognition: imagens e vídeos; Textract: documentos e formulários.', 'Elastic Transcoder encerrado em 13/11/2025; use o MediaConvert.', 'Vídeo ao vivo de câmeras: Kinesis Video Streams.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f08.m3',
      title: 'Pronto ou próprio, e o aplicativo',
      type: 'mission',
      summary: 'Quando treinar um modelo no SageMaker AI, e o Amplify e o Device Farm para o aplicativo.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você decide quando a escola precisa de um modelo próprio e cuida do aplicativo.',
        situation: 'A coordenação quer prever quais alunos vão abandonar o curso. Um cientista de dados quer treinar um modelo próprio também para o sentimento dos comentários. O site novo é em React, e o aplicativo precisa ser testado em celulares reais antes de cada versão.',
        objective: 'Usar modelo próprio só quando ele é necessário, e publicar e testar o aplicativo.',
        successCriteria: ['Diferenciar serviço pronto e SageMaker AI', 'Escolher Amplify e Device Farm'],
      },
      intel: [
        { conceptId: 'ai.ready-vs-custom', body: ['Serviços prontos resolvem tarefas comuns por API. O **SageMaker AI** serve para construir, treinar e hospedar **modelos próprios**, quando o problema é do negócio.'] },
        { conceptId: 'front.amplify-devicefarm', body: ['**Amplify Hosting**: publica o site a cada push no Git. **Device Farm**: testes em celulares e tablets reais, na Região us-west-2.'] },
      ],
      activities: [
        {
          id: 'ana.f08.m3.a1',
          kind: 'decision',
          title: 'Quem vai abandonar',
          prompt: 'A coordenação quer prever a evasão com o histórico de notas, frequência e pagamentos dos alunos. Que serviço usar?',
          concepts: [{ id: 'ai.ready-vs-custom' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Prever a evasão com os dados próprios da escola é um problema específico, sem serviço pronto. O SageMaker AI serve para treinar e hospedar esse modelo.'],
          options: [
            { id: 'a', text: 'Amazon SageMaker AI, treinando um modelo com o histórico da escola', correct: true, consequence: 'O modelo aprende com os dados da própria escola.' },
            { id: 'b', text: 'Amazon Comprehend', correct: false, consequence: 'Analisa textos; não prevê evasão a partir de notas e pagamentos.' },
          ],
        },
        {
          id: 'ana.f08.m3.a2',
          kind: 'decision',
          title: 'Um modelo próprio de sentimento',
          prompt: 'O cientista de dados quer treinar no SageMaker AI um modelo de sentimento para os comentários. O que você recomenda primeiro?',
          concepts: [{ id: 'ai.ready-vs-custom' }, { id: 'ai.text', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Comprehend já faz análise de sentimento por API. Treinar um modelo próprio custa tempo e equipe, e só compensa se o serviço pronto não atender.'],
          options: [
            { id: 'a', text: 'Testar antes o Comprehend, que já analisa sentimento', correct: true, consequence: 'Se atender, a escola economiza o treino e a hospedagem de um modelo.' },
            { id: 'b', text: 'Treinar o modelo no SageMaker AI desde já', correct: false, consequence: 'Funciona, mas com muito mais trabalho que o necessário.' },
          ],
        },
        {
          id: 'ana.f08.m3.a3',
          kind: 'classify',
          title: 'Amplify ou Device Farm',
          prompt: 'Classifique cada tarefa pelo serviço.',
          concepts: [{ id: 'front.amplify-devicefarm' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Amplify Hosting publica o site com deploy pelo Git e CDN. O Device Farm testa em aparelhos reais.'],
          bins: [
            { id: 'amplify', label: 'Amplify' },
            { id: 'df', label: 'Device Farm' },
          ],
          items: [
            { id: 'deploy', text: 'Publicar o site em React a cada push na branch principal', bin: 'amplify', explanation: 'Deploy contínuo pelo Git.', concepts: ['front.amplify-devicefarm'] },
            { id: 'staging', text: 'Ter um ambiente de testes por branch', bin: 'amplify', explanation: 'O Amplify cria ambientes por branch.', concepts: ['front.amplify-devicefarm'] },
            { id: 'phones', text: 'Rodar os testes do aplicativo em 30 modelos de celular', bin: 'df', explanation: 'Aparelhos reais hospedados pela AWS.', concepts: ['front.amplify-devicefarm'] },
          ],
        },
      ],
      debrief: { takeaways: ['Serviço pronto primeiro; SageMaker AI quando o problema é do negócio.', 'Amplify: publica o front-end pelo Git.', 'Device Farm: testes em aparelhos reais.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f08.boss',
      title: 'Nove pedidos da escola',
      type: 'boss',
      summary: 'Cada necessidade da escola pelo serviço pronto certo, ou por um modelo próprio quando preciso.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você entrega o plano de serviços da escola.',
        situation: 'A coordenação juntou nove pedidos: de comentários a vídeos, de fichas escaneadas ao aplicativo.',
        objective: 'Escolher o serviço de cada pedido, preferindo o pronto quando ele resolve.',
        successCriteria: ['Todos os pedidos atendidos', 'Nenhum serviço encerrado', 'Modelo próprio só onde é necessário'],
      },
      intel: [
        { conceptId: 'ai.ready-vs-custom', body: ['O SageMaker AI atende quase tudo, mas vale menos quando um serviço pronto resolve.'] },
        { conceptId: 'media.transcoder', body: ['Para converter vídeos, o serviço atual é o MediaConvert.'] },
      ],
      activities: [
        {
          id: 'ana.f08.boss.a1',
          kind: 'lab',
          lab: 'ai-chooser',
          title: 'O plano de serviços',
          prompt: 'Para cada pedido, escolha o serviço. Depois da verificação, cada cartão mostra o que a escolha atende ou não.',
          concepts: [{ id: 'ai.text' }, { id: 'ai.voice' }, { id: 'ai.vision' }, { id: 'ai.ready-vs-custom' }, { id: 'media.transcoder' }, { id: 'front.amplify-devicefarm' }],
          xp: 200,
          difficulty: 3,
          hints: ['Um dos serviços da lista foi encerrado.', 'Só um pedido não tem serviço pronto.'],
          explanation: [
            'Comentários: Comprehend. Fichas: Textract. Legendas: Transcribe. Apostilas em áudio: Polly. Assistente: Lex. Fotos impróprias: Rekognition.',
            'Evasão: SageMaker AI. Conversão dos vídeos: MediaConvert, porque o Elastic Transcoder foi encerrado. Aplicativo em celulares reais: Device Farm.',
          ],
          config: SABER_MAIS_AI,
        },
      ],
      debrief: { takeaways: ['Cada serviço pronto resolve uma família de tarefas.', 'Modelo próprio só quando o problema é do negócio.', 'Serviço encerrado sai do plano: confira a situação antes de usar.'] },
    },
  ],
}
