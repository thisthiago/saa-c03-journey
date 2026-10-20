/**
 * Conquistas de aprendizagem que valem para todas as trilhas (revisão,
 * recuperação depois de erros, nível). Os IDs são estáveis: o progresso salvo
 * continua válido.
 */
import type { AchievementDef } from '../../engine/types'

export const LEARNING_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach.aprender-com-o-erro',
    title: 'Aprender com o erro',
    description: 'Seja aprovado em 3 atividades depois de ter errado na primeira tentativa.',
    category: 'aprendizagem',
    glyph: 'cycle',
    xp: 40,
    condition: { type: 'comeback', count: 3 },
  },
  {
    id: 'ach.mira-certeira',
    title: 'Mira certeira',
    description: 'Acerte 10 atividades com 100% na primeira tentativa, sem dicas.',
    category: 'aprendizagem',
    glyph: 'eye',
    xp: 50,
    condition: { type: 'perfect-first-try-count', count: 10 },
  },
  {
    id: 'ach.memoria-ativa',
    title: 'Memória ativa',
    description: 'Conclua sua primeira sessão de revisão.',
    category: 'aprendizagem',
    glyph: 'history',
    xp: 25,
    condition: { type: 'reviews-completed', count: 1 },
  },
  {
    id: 'ach.habito-de-revisao',
    title: 'Hábito de revisão',
    description: 'Conclua 5 sessões de revisão.',
    category: 'aprendizagem',
    glyph: 'history',
    xp: 60,
    condition: { type: 'reviews-completed', count: 5 },
  },
  {
    id: 'ach.fundamentos-dominados',
    title: 'Fundamentos dominados',
    description: 'Alcance o nível "Dominado" em 5 conceitos de fundamentos (exige acertos em dias diferentes).',
    category: 'aprendizagem',
    glyph: 'flag',
    xp: 60,
    condition: { type: 'concepts-mastered', tag: 'fundamentos', count: 5 },
  },
  {
    id: 'ach.nivel-5',
    title: 'Sentinela de Acesso',
    description: 'Alcance o nível 5.',
    category: 'aprendizagem',
    glyph: 'shield',
    xp: 0,
    condition: { type: 'level-reached', level: 5 },
  },
]
