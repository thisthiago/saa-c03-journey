/**
 * Conceitos da Fase 9 — Como o exame pergunta. Os enunciados da trilha são do
 * AWS Quest, nunca questões reais do exame.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F09_ARQ_CONCEPTS: ConceptDef[] = [
  {
    id: 'exam.format',
    title: 'O formato do exame',
    officialName: 'SAA-C03 exam content and response types',
    serviceIds: [],
    summary: 'O SAA-C03 tem **50 questões que contam** e **15 que não contam**, sem identificação. Há questões de **múltipla escolha** (uma certa e três distratores) e de **resposta múltipla** (duas ou mais certas entre cinco ou mais). Questão em branco conta como errada, e **chutar não tira ponto**.',
    facts: ['A nota vai de 100 a 1.000, e a mínima para passar é 720.', 'O modelo é compensatório: não é preciso passar em cada domínio, só no exame inteiro.', 'Pesos: Seguro 30%, Resiliente 26%, Alto desempenho 24% e Custo 20%.'],
    recommendations: ['Responda a todas as questões, mesmo as que ficarem em dúvida.'],
    exam: { domains: ['d1', 'd2', 'd3', 'd4'], relevance: 'alta' },
    references: [R.examGuide],
    tags: ['fundamentos'],
  },
  {
    id: 'exam.decisive',
    title: 'O requisito que decide',
    officialName: 'The deciding requirement',
    serviceIds: [],
    summary: 'Quase sempre, **mais de uma alternativa funciona**. O que escolhe a certa é o requisito que o enunciado põe em destaque: **menor custo**, **menos esforço operacional**, **maior disponibilidade**, **menor latência**, **mais seguro**. Ache-o antes de ler as alternativas.',
    explanation: [
      'Exemplo: três alternativas resolvem a falta de espaço de um banco RDS, e o enunciado pede "menor esforço operacional". A que liga o autoscaling de armazenamento vence a que cria scripts de monitoramento para aumentar o disco, mesmo que as duas funcionem.',
    ],
    commonMistakes: ['Escolher a primeira alternativa que funciona, sem comparar no requisito decisivo'],
    facts: ['O guia do exame descreve os distratores como respostas plausíveis, escolhidas por quem tem conhecimento incompleto.'],
    recommendations: ['"Menos esforço operacional" costuma apontar para o serviço gerenciado ou serverless; "menor custo", para a opção que atende sem sobra.'],
    exam: { domains: ['d1', 'd2', 'd3', 'd4'], relevance: 'alta' },
    references: [R.examGuide],
    tags: ['fundamentos'],
  },
  {
    id: 'exam.constraints',
    title: 'As restrições escondidas',
    officialName: 'Constraints in the question stem',
    serviceIds: [],
    summary: 'O enunciado traz **restrições** que toda resposta precisa cumprir, muitas vezes no meio do texto: "sem alterar o código", "os dados não podem sair do país", "o tráfego não pode passar pela internet", "a solução precisa aguentar a perda de uma AZ". Uma alternativa que quebra uma restrição está errada, por melhor que seja no resto.',
    recommendations: ['Sublinhe as restrições antes de ler as alternativas.'],
    exam: { domains: ['d1', 'd2', 'd3', 'd4'], relevance: 'alta' },
    references: [R.examGuide],
    tags: ['fundamentos'],
  },
  {
    id: 'exam.eliminate',
    title: 'Eliminar alternativas',
    officialName: 'Eliminating distractors',
    serviceIds: [],
    summary: 'Elimine primeiro as alternativas que **não funcionam** (serviço que não faz aquilo) e as que **quebram uma restrição**. Entre as que sobram, compare só no **requisito decisivo**. Em geral restam duas, e a diferença está nesse requisito.',
    commonMistakes: ['Escolher a alternativa com mais serviços por parecer mais completa'],
    exam: { domains: ['d1', 'd2', 'd3', 'd4'], relevance: 'alta' },
    references: [R.examGuide],
    tags: ['fundamentos'],
  },
  {
    id: 'exam.multiple-response',
    title: 'Questões de resposta múltipla',
    officialName: 'Multiple-response questions',
    serviceIds: [],
    summary: 'A questão diz **quantas** escolher ("escolha duas"). Cada alternativa certa costuma ser **uma parte** da solução, e as duas juntas atendem ao requisito. Avalie cada alternativa sozinha, como certa ou errada.',
    commonMistakes: ['Escolher duas alternativas que fazem a mesma coisa'],
    exam: { domains: ['d1', 'd2', 'd3', 'd4'], relevance: 'media' },
    references: [R.examGuide],
    tags: ['fundamentos'],
  },
]
