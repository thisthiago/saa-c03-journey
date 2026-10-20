import { useEffect, useMemo } from 'react'
import { registry } from '../content'
import { levelProgress, levelTitle } from '../engine/levels'
import { dueCount } from '../engine/review'
import { clock, useGame } from '../store/gameStore'

export function usePlayer() {
  const xp = useGame((s) => s.progress.xp)
  return useMemo(() => {
    const lp = levelProgress(xp)
    return { xp, ...lp, title: levelTitle(lp.level, registry.levelTitles) }
  }, [xp])
}

export function useDueCount() {
  const progress = useGame((s) => s.progress)
  return useMemo(() => dueCount(progress, registry, clock.now()), [progress])
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · AWS Quest` : 'AWS Quest'
  }, [title])
}

/** Aplica tema e preferência de movimento no elemento raiz. */
export function useThemeSettings() {
  const settings = useGame((s) => s.progress.settings)
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
    if (settings.reducedMotion) root.setAttribute('data-motion', 'reduced')
    else root.removeAttribute('data-motion')
  }, [settings.theme, settings.reducedMotion])
}
