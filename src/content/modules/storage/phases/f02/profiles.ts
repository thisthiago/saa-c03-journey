/** Perfis de dados fictícios da VitaImagem Diagnósticos (Fase 2). */
import type { DataProfile } from '../../../../../simulators/cost/model'

const MB = 1024

export const EXAMES_RECENTES: DataProfile = {
  id: 'recentes',
  name: 'Exames do mês',
  description: 'Imagens de exames dos últimos 30 dias, abertas todos os dias por médicos e pacientes no portal.',
  objectCount: 500_000,
  avgObjectKB: 8 * MB,
  putsPerMonth: 500_000,
  getsPerMonth: 3_000_000,
  retrievedGBPerMonth: 6000,
  intelligentTieringShare: { frequent: 1, infrequent: 0, archiveInstant: 0 },
  requirements: { instantAccess: true, azResilient: true },
}

export const EXAMES_ANTIGOS: DataProfile = {
  id: 'antigos',
  name: 'Exames de 1 a 12 meses',
  description: 'Exames anteriores, abertos poucas vezes por trimestre quando o paciente volta — mas, quando abertos, precisam aparecer na hora.',
  objectCount: 6_000_000,
  avgObjectKB: 8 * MB,
  putsPerMonth: 0,
  getsPerMonth: 20_000,
  retrievedGBPerMonth: 150,
  intelligentTieringShare: { frequent: 0.05, infrequent: 0.15, archiveInstant: 0.8 },
  requirements: { instantAccess: true, azResilient: true },
}

export const ARQUIVO_LEGAL: DataProfile = {
  id: 'legal',
  name: 'Arquivo legal (até 20 anos)',
  description: 'Exames antigos guardados por exigência legal. Só são consultados por ordem judicial, com prazo de dois dias para entrega.',
  objectCount: 30_000_000,
  avgObjectKB: 8 * MB,
  putsPerMonth: 0,
  getsPerMonth: 6_000,
  retrievedGBPerMonth: 50,
  restoresPerMonth: 6_000,
  restoreTier: 'bulk',
  intelligentTieringShare: { frequent: 0, infrequent: 0, archiveInstant: 1 },
  requirements: { instantAccess: false, azResilient: true, maxRestoreHours: 48 },
}

export const PREVIAS: DataProfile = {
  id: 'previas',
  name: 'Prévias em miniatura',
  description: 'Miniaturas de 24 KB geradas automaticamente a partir dos exames (podem ser recriadas) e exibidas a cada listagem do portal.',
  objectCount: 40_000_000,
  avgObjectKB: 24,
  putsPerMonth: 500_000,
  getsPerMonth: 20_000_000,
  retrievedGBPerMonth: (20_000_000 * 24) / (1024 * 1024),
  intelligentTieringShare: { frequent: 1, infrequent: 0, archiveInstant: 0 },
  requirements: { instantAccess: true, azResilient: false },
}

/** Dados de pesquisa com acesso imprevisível (chefe da fase). */
export const PESQUISA: DataProfile = {
  id: 'pesquisa',
  name: 'Banco de imagens para pesquisa',
  description: 'Conjunto usado por parceiros acadêmicos. Alguns estudos acessam tudo durante semanas; outros ficam meses parados. Ninguém sabe prever quais.',
  objectCount: 2_000_000,
  avgObjectKB: 6 * MB,
  putsPerMonth: 50_000,
  getsPerMonth: 400_000,
  retrievedGBPerMonth: 2500,
  intelligentTieringShare: { frequent: 0.3, infrequent: 0.3, archiveInstant: 0.4 },
  requirements: { instantAccess: true, azResilient: true },
}

/** Logs de auditoria pequenos que alguém quer arquivar (armadilha do overhead por objeto). */
export const LOGS_PEQUENOS: DataProfile = {
  id: 'logs',
  name: 'Registros de acesso (16 KB cada)',
  description: '50 milhões de pequenos arquivos de log, raramente lidos.',
  objectCount: 50_000_000,
  avgObjectKB: 16,
  putsPerMonth: 0,
  getsPerMonth: 1000,
  retrievedGBPerMonth: 0,
  requirements: { instantAccess: false, azResilient: true },
}
