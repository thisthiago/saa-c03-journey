/* eslint-disable react/only-export-components -- arquivo de rotas, não é módulo de componente */
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createHashRouter } from 'react-router'
import { HomePage } from '../features/home/HomePage'
import { NotFound } from '../features/NotFound'
import { Layout } from './Layout'

// Telas secundárias carregadas sob demanda: o pacote inicial fica menor conforme o conteúdo cresce.
const MapPage = lazy(() => import('../features/map/MapPage').then((m) => ({ default: m.MapPage })))
const TrackMapPage = lazy(() => import('../features/map/TrackMapPage').then((m) => ({ default: m.TrackMapPage })))
const PhasePage = lazy(() => import('../features/phase/PhasePage').then((m) => ({ default: m.PhasePage })))
const MissionPage = lazy(() => import('../features/mission/MissionPage').then((m) => ({ default: m.MissionPage })))
const ReviewPage = lazy(() => import('../features/review/ReviewPage').then((m) => ({ default: m.ReviewPage })))
const QuestionBankPage = lazy(() => import('../features/review/QuestionBankPage').then((m) => ({ default: m.QuestionBankPage })))
const CodexPage = lazy(() => import('../features/codex/CodexPage').then((m) => ({ default: m.CodexPage })))
const ConceptPage = lazy(() => import('../features/codex/ConceptPage').then((m) => ({ default: m.ConceptPage })))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AboutPage = lazy(() => import('../features/about/AboutPage').then((m) => ({ default: m.AboutPage })))

function page(C: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<div className="page muted" aria-busy="true">Carregando…</div>}>
      <C />
    </Suspense>
  )
}

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'mapa', element: page(MapPage) },
      { path: 'trilha/:trackId', element: page(TrackMapPage) },
      { path: 'fase/:phaseId', element: page(PhasePage) },
      { path: 'missao/:missionId', element: page(MissionPage) },
      { path: 'revisao', element: page(ReviewPage) },
      { path: 'revisao/questoes', element: page(QuestionBankPage) },
      { path: 'codex', element: page(CodexPage) },
      { path: 'codex/:conceptId', element: page(ConceptPage) },
      { path: 'dossie', element: page(ProfilePage) },
      { path: 'sobre', element: page(AboutPage) },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export function createAppRouter() {
  return createHashRouter(routes)
}
