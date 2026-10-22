/** Cargas do chefe da Fase 2 (premissas do cenário), usadas também nos testes do simulador. */
import type { EfsWorkload } from '../../../../../simulators/filesystem/lab'

export const CUSTO_CARGAS: EfsWorkload[] = [
  {
    id: 'portal',
    label: 'Portal de contratos',
    detail: 'Contratos assinados raramente são abertos de novo, mas os picos de upload no fim do mês são grandes.',
    usage: { storageGB: 2000, idle30Share: 0.7, idle90Share: 0.5, coldReadGB: 20, archiveReadGB: 2, readGB: 300, writeGB: 50, avgMiBps: 0.5, peakMiBps: 200 },
    concepts: ['efs.throughput-modes', 'efs.lifecycle', 'efs.storage-classes'],
  },
  {
    id: 'render',
    label: 'Fila de renderização',
    detail: 'Os quadros são lidos e regravados o dia inteiro, num ritmo constante, e projetos antigos são reabertos para comparação.',
    usage: { storageGB: 500, idle30Share: 0.2, idle90Share: 0, coldReadGB: 300, archiveReadGB: 0, readGB: 60000, writeGB: 20000, avgMiBps: 30, peakMiBps: 40 },
    concepts: ['efs.throughput-modes', 'efs.lifecycle'],
  },
  {
    id: 'wiki',
    label: 'Wiki interna',
    detail: 'Páginas lidas ao longo do dia por pouca gente; quase tudo foi consultado no último mês.',
    usage: { storageGB: 1500, idle30Share: 0.1, idle90Share: 0.05, coldReadGB: 40, archiveReadGB: 5, readGB: 2000, writeGB: 300, avgMiBps: 3, peakMiBps: 50 },
    concepts: ['efs.throughput-modes', 'efs.lifecycle'],
  },
  {
    id: 'build',
    label: 'Cache de compilação',
    detail: 'Artefatos pequenos, relidos a cada compilação; os picos chegam com as compilações paralelas.',
    usage: { storageGB: 100, idle30Share: 0.1, idle90Share: 0, coldReadGB: 400, archiveReadGB: 0, readGB: 100, writeGB: 20, avgMiBps: 0.2, peakMiBps: 150 },
    concepts: ['efs.throughput-modes', 'efs.storage-classes'],
  },
]
