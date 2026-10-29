# Inventário

## Arquivos relevantes encontrados

| Arquivo | Papel |
|---|---|
| `src/features/map/MapPage.tsx` | Página `/mapa` (H1 "Trilhas"): faixa "Continuar" e ordem sugerida das trilhas. Recebe as abas. |
| `src/features/map/TrackMapPage.tsx` | Mapa de uma trilha e `PhasePanel` (modelo para o painel lateral). |
| `src/features/map/status.ts` | Rótulos e tons de estado (`PHASE_STATUS`, `MISSION_STATUS`, `TRACK_STATUS`). |
| `src/features/map/map.module.css` | Estilos do mapa; `.conceptChip` com `data-tier` é reaproveitado. |
| `src/content/catalog/services.ts` | 118 serviços (`ServiceDef`). |
| `src/content/catalog/catalog.ts` | 10 territórios, 4 domínios do exame. |
| `src/engine/registry.ts` | Registro: `services`, `concepts`, `phases`, `missions`, `questions`, `conceptPhase`. |
| `src/engine/selectors.ts` | `phaseStatus`, `missionStatus`, `phaseProgress`, `unmetRequirements`. |
| `src/engine/mastery.ts` | `masteryTier` e `TIER_LABEL`. |
| `src/engine/track-order.ts` | `recommendedTrackOrder`. |
| `src/store/gameStore.ts` | Zustand: `useGame((st) => st.progress)`; grava em `localStorage` (`aws-quest/progress`). |
| `src/styles/tokens.css` | Tokens de cor nos três escopos de tema. |
| `src/ui/kit.tsx`, `ui/DomainTag.tsx`, `ui/Glyph.tsx` | Card, Badge, ButtonLink, Callout, ProgressBar, IconTile, DomainTag, Glyph. |
| `src/app/format.ts` | `phaseMention`, `phaseRef`, `plural`. |
| `src/app/hooks.ts` | `useDocumentTitle`, `useMediaQuery`. |

## Estruturas de dados usadas

- `ServiceDef.territory` (um por serviço), `ConceptDef.serviceIds`, `PhaseDef.concepts`, `registry.conceptPhase`.
- `ExamQuestion.concept`, `related`, `domain`.
- `ProgressState.discovered` (o que o Codex revela) e `ProgressState.concepts` (domínio).

## Funções e seletores de progresso

`phaseStatus`, `missionStatus`, `phaseProgress`, `unmetRequirements`, `masteryTier`. Nenhum estado novo é gravado.

## Dependências

Antes: nenhuma de visualização. Adicionadas: `d3-force` e `@types/d3-force` (dev).

## Pontos de integração

- `MapPage.tsx`: aba `?vista=servicos`, com carregamento sob demanda de `ServiceMap.tsx`.
- `vite.config.ts`: pacote `vendor-grafo` para o d3.
- `tests/e2e/smoke.spec.ts` e `screens.spec.ts`.
