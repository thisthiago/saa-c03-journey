/**
 * Escolha do serviço pronto de IA, de mídia ou de front-end para cada
 * necessidade.
 *
 * Conferido em 21/10/2026, nas páginas "What is" de cada serviço:
 * - Comprehend: entidades, frases-chave, idioma e sentimento; dados pessoais
 *   (PII) em inglês e espanhol.
 * - Lex: chatbots de texto e voz.
 * - Polly: texto em fala.
 * - Rekognition: objetos, textos, conteúdo impróprio e rostos em imagens e
 *   vídeos.
 * - Textract: texto, formulários e tabelas de documentos, inclusive notas e
 *   recibos.
 * - Transcribe: fala em texto, em tempo real ou em lote, com legendas WebVTT
 *   e SubRip.
 * - Translate: tradução de textos.
 * - SageMaker AI: construir, treinar e hospedar modelos próprios.
 * - Kinesis Video Streams: vídeo ao vivo de câmeras e aparelhos para a AWS.
 * - Elastic Transcoder: encerrado em 13/11/2025; a alternativa é o AWS
 *   Elemental MediaConvert, que converte arquivos de vídeo.
 * - Amplify Hosting: hospedagem de aplicações web com deploy pelo Git.
 * - Device Farm: testes em celulares e tablets reais; só em us-west-2.
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const AI_OPTIONS: ChoiceCatalog = {
  needLabel: {
    sentiment: 'saber se cada avaliação de texto é positiva ou negativa',
    entities: 'achar nomes de produtos e lugares em textos livres',
    chatbot: 'conversar com clientes por texto e voz, entendendo a intenção',
    tts: 'transformar textos em áudio com voz natural',
    'image-objects': 'identificar objetos e conteúdo impróprio em fotos e vídeos',
    faces: 'comparar o rosto de uma selfie com a foto do documento',
    'doc-fields': 'extrair campos e tabelas de notas fiscais escaneadas',
    'speech-text': 'transformar a fala dos vídeos em texto e gerar legendas',
    translate: 'traduzir descrições de produtos para outros idiomas',
    'custom-model': 'treinar um modelo próprio de previsão de demanda com dados da empresa',
    'camera-live': 'receber o vídeo ao vivo de centenas de câmeras',
    transcode: 'converter vídeos para os formatos de celular e de TV',
    'web-hosting': 'publicar o site em React a cada push no Git, com HTTPS e CDN',
    'real-devices': 'testar o aplicativo em celulares e tablets reais',
  },
  options: {
    comprehend: { name: 'Amazon Comprehend', summary: 'Entende textos: sentimento, entidades, frases-chave, idioma e dados pessoais.', meets: ['sentiment', 'entities'], limits: ['Trabalha com texto; não lê imagens nem áudio.'], complexity: 1 },
    lex: { name: 'Amazon Lex', summary: 'Chatbots de texto e voz que reconhecem a intenção e conduzem a conversa.', meets: ['chatbot'], limits: ['Conduz conversas; não analisa documentos.'], complexity: 1 },
    polly: { name: 'Amazon Polly', summary: 'Transforma texto em fala com vozes naturais.', meets: ['tts'], limits: ['Faz o caminho texto para voz, não o contrário.'], complexity: 1 },
    rekognition: { name: 'Amazon Rekognition', summary: 'Analisa imagens e vídeos: objetos, textos, conteúdo impróprio e rostos.', meets: ['image-objects', 'faces'], limits: ['Não extrai campos estruturados de documentos.'], complexity: 1 },
    textract: { name: 'Amazon Textract', summary: 'Extrai texto, formulários e tabelas de documentos escaneados, inclusive notas e recibos.', meets: ['doc-fields'], limits: ['Lê documentos; não entende o sentimento do texto.'], complexity: 1 },
    transcribe: { name: 'Amazon Transcribe', summary: 'Transforma fala em texto, em tempo real ou em lote, e gera legendas.', meets: ['speech-text'], limits: ['Faz o caminho voz para texto, não o contrário.'], complexity: 1 },
    translate: { name: 'Amazon Translate', summary: 'Tradução automática de textos.', meets: ['translate'], limits: ['Só traduz; não analisa o conteúdo.'], complexity: 1 },
    sagemaker: { name: 'Amazon SageMaker AI', summary: 'Plataforma para preparar dados, treinar, ajustar e hospedar modelos próprios.', meets: ['custom-model', 'sentiment', 'entities', 'image-objects', 'doc-fields', 'translate'], limits: ['Treinar um modelo próprio para algo que um serviço pronto já faz custa tempo e equipe.'], complexity: 4 },
    kvs: { name: 'Amazon Kinesis Video Streams', summary: 'Recebe, guarda e reproduz vídeo ao vivo de câmeras e aparelhos.', meets: ['camera-live'], limits: ['Recebe vídeo; a análise fica com outro serviço.'], complexity: 2 },
    mediaconvert: { name: 'AWS Elemental MediaConvert', summary: 'Converte arquivos de vídeo para vários formatos e telas.', meets: ['transcode'], limits: ['Trabalha com arquivos, não com vídeo ao vivo.'], complexity: 2 },
    'elastic-transcoder': { name: 'Amazon Elastic Transcoder', summary: 'Convertia arquivos de vídeo; foi encerrado em 13/11/2025.', meets: [], limits: ['O serviço foi encerrado em 13/11/2025; a alternativa é o MediaConvert.'], complexity: 2 },
    amplify: { name: 'AWS Amplify', summary: 'Hospedagem de aplicações web com deploy a cada push no Git, HTTPS e CDN.', meets: ['web-hosting'], limits: ['Hospeda o front-end; não testa em aparelhos.'], complexity: 1 },
    'device-farm': { name: 'AWS Device Farm', summary: 'Testes em celulares e tablets reais hospedados pela AWS, na Região us-west-2.', meets: ['real-devices'], limits: ['Testa o aplicativo; não o hospeda.'], complexity: 1 },
  },
}

export type AiChooserLabConfig = ChoiceLabConfig
export type AiChooserLabResponse = ChoiceLabResponse

export const aiChooserSolution = (c: AiChooserLabConfig) => choiceSolution(AI_OPTIONS, c)
export const evaluateAiChooserLab = (c: AiChooserLabConfig, r: AiChooserLabResponse) => evaluateChoiceLab(AI_OPTIONS, c, r)
