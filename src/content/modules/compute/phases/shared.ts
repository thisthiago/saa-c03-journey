/** Peças compartilhadas pelas fases da trilha Computação na AWS. */

/** Opções das previsões do ciclo de vida da instância. */
export const KEPT_OPTIONS = [
  { id: 'kept', text: 'Sim, continua lá', outcome: 'kept' },
  { id: 'lost', text: 'Não, se perde', outcome: 'lost' },
]

/** Opções das previsões burstable × fixa. */
export const BURST_OPTIONS = [
  { id: 'burstable', text: 'A burstable sai mais barata', outcome: 'burstable' },
  { id: 'fixed', text: 'A fixa sai mais barata', outcome: 'fixed' },
]

/** Opções das previsões de volume EBS. */
export const EBS_OPTIONS = [
  { id: 'invalid', text: 'A AWS recusa a configuração', outcome: 'invalid' },
  { id: 'meets', text: 'Aceita e atende à carga', outcome: 'meets' },
  { id: 'short', text: 'Aceita, mas não atende à carga', outcome: 'short' },
]
