/** Conjuntos de dados fictícios da RotaLog Transportes (Fase 6). */
import type { Dataset } from '../../../../../simulators/lifecycle/model'

const MB = 1024
const req = { instantAccess: false, azResilient: true }

export const TELEMETRIA: Dataset = {
  id: 'telemetria',
  name: 'Telemetria dos caminhões',
  kind: 'current',
  key: 'telemetria/2026/10/frota-0912.parquet',
  tags: { tipo: 'telemetria' },
  profile: { id: 'telemetria', name: 'Telemetria', description: 'Arquivos Parquet de GPS e sensores, lidos pelos painéis no primeiro mês.', objectCount: 200_000, avgObjectKB: 64 * MB, putsPerMonth: 0, getsPerMonth: 5_000, retrievedGBPerMonth: 50, requirements: req },
}

export const NOTAS: Dataset = {
  id: 'notas',
  name: 'Notas fiscais',
  kind: 'current',
  key: 'notas-fiscais/2026/10/nf-55123.pdf',
  tags: { tipo: 'fiscal' },
  profile: { id: 'notas', name: 'Notas fiscais', description: 'PDFs de notas fiscais, guardados por exigência legal.', objectCount: 3_000_000, avgObjectKB: 300, putsPerMonth: 0, getsPerMonth: 2_000, retrievedGBPerMonth: 1, requirements: req },
}

export const LOGS: Dataset = {
  id: 'logs',
  name: 'Logs da aplicação',
  kind: 'current',
  key: 'logs/app/2026-10-15.json.gz',
  tags: { tipo: 'log' },
  profile: { id: 'logs', name: 'Logs', description: 'Milhões de arquivos de log pequenos, usados só para depuração nos primeiros dias.', objectCount: 40_000_000, avgObjectKB: 20, putsPerMonth: 0, getsPerMonth: 1_000, retrievedGBPerMonth: 0, requirements: req },
}

export const RELATORIOS: Dataset = {
  id: 'relatorios',
  name: 'Relatórios (versão atual)',
  kind: 'current',
  key: 'relatorios/frota/2026-q3.xlsx',
  versioned: true,
  profile: { id: 'relatorios', name: 'Relatórios', description: 'Planilhas de relatórios, regravadas várias vezes por semana.', objectCount: 50_000, avgObjectKB: 2 * MB, putsPerMonth: 0, getsPerMonth: 30_000, retrievedGBPerMonth: 60, requirements: { instantAccess: true, azResilient: true } },
}

export const VERSOES_ANTIGAS: Dataset = {
  id: 'versoes',
  name: 'Versões não atuais dos relatórios',
  kind: 'noncurrent',
  key: 'relatorios/frota/2026-q3.xlsx',
  profile: { id: 'versoes', name: 'Versões não atuais', description: 'Cópias antigas acumuladas a cada regravação.', objectCount: 1_000_000, avgObjectKB: 2 * MB, putsPerMonth: 0, getsPerMonth: 0, retrievedGBPerMonth: 0, requirements: req },
}

export const UPLOADS: Dataset = {
  id: 'uploads',
  name: 'Uploads multipart incompletos',
  kind: 'mpu',
  key: 'telemetria/brutos/upload-interrompido.bin',
  profile: { id: 'uploads', name: 'Uploads incompletos', description: 'Partes de uploads de vídeo de câmeras que caíram no meio.', objectCount: 20_000, avgObjectKB: 40 * MB, putsPerMonth: 0, getsPerMonth: 0, retrievedGBPerMonth: 0, requirements: req },
}

export const MARCADORES: Dataset = {
  id: 'marcadores',
  name: 'Delete markers sem versões',
  kind: 'delete-markers',
  key: 'relatorios/temporarios/rascunho.xlsx',
  profile: { id: 'marcadores', name: 'Delete markers', description: 'Marcadores que sobraram depois que as versões foram removidas.', objectCount: 300_000, avgObjectKB: 0.1, putsPerMonth: 0, getsPerMonth: 0, retrievedGBPerMonth: 0, requirements: req },
}
