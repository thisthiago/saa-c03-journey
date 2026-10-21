/**
 * Ponto único de registro do conteúdo. Para adicionar uma trilha ou serviço,
 * crie um módulo em src/content/modules/<id>/ e inclua-o em MODULES.
 */
import { createRegistry, type Registry } from '../engine/registry'
import type { ContentModule } from '../engine/types'
import { EXAM_DOMAINS, LEVEL_TITLES, TERRITORIES } from './catalog/catalog'
import { catalogModule } from './catalog/services'
import { foundationsModule } from './modules/foundations'
import { storageModule } from './modules/storage'
import { identityModule } from './modules/identity'
import { computeModule } from './modules/compute'
import { databaseModule } from './modules/database'
import { governanceModule } from './modules/governance'

/** A ordem define a ordem das trilhas na Base e a primeira missão sugerida a quem começa. */
export const MODULES: ContentModule[] = [catalogModule, foundationsModule, storageModule, identityModule, computeModule, databaseModule, governanceModule]

export const registry: Registry = createRegistry({
  modules: MODULES,
  territories: TERRITORIES,
  examDomains: EXAM_DOMAINS,
  levelTitles: LEVEL_TITLES,
})

/** Versão do conteúdo (exibida em "Sobre"). */
export const CONTENT_VERSION = '2026.10.6'
