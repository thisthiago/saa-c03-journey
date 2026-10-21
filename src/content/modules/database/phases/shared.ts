/** Peças compartilhadas pelas fases da trilha Bancos de dados na AWS. */

/** Opções das previsões de perda de dados numa falha do RDS. */
export const LOSS_OPTIONS = [
  { id: 'none', text: 'Nenhum dado se perde', outcome: 'none' },
  { id: 'seconds', text: 'Perde os últimos segundos', outcome: 'seconds' },
  { id: 'minutes', text: 'Perde até 5 minutos', outcome: 'minutes' },
  { id: 'total', text: 'Não há cópia para recuperar', outcome: 'total' },
]

/** Opções das previsões de recuperação numa falha do RDS. */
export const RECOVERY_OPTIONS = [
  { id: 'automatic', text: 'Sozinho, sem ninguém fazer nada', outcome: 'automatic' },
  { id: 'manual', text: 'Só depois de uma ação da equipe', outcome: 'manual' },
  { id: 'none', text: 'Não volta enquanto a falha durar', outcome: 'none' },
]
