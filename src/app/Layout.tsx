import { BookOpen, Compass, House, RotateCcw, UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useGame } from '../store/gameStore'
import { Callout, ProgressRing } from '../ui/kit'
import { Celebrations } from './Celebrations'
import { useDueCount, usePlayer, useThemeSettings } from './hooks'
import s from './layout.module.css'

const NAV = [
  { to: '/', label: 'Base', icon: House, end: true },
  { to: '/mapa', label: 'Mapa', icon: Compass },
  { to: '/revisao', label: 'Revisão', icon: RotateCcw, badge: true },
  { to: '/codex', label: 'Codex', icon: BookOpen },
  { to: '/dossie', label: 'Dossiê', icon: UserRound },
]

function Logo() {
  return (
    <NavLink to="/" className={s.logo} aria-label="AWS Quest — Base de Operações">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--mastery)" />
          </linearGradient>
        </defs>
        <path d="M16 2 28 9v14l-12 7-12-7V9z" fill="none" stroke="url(#lg)" strokeWidth="2.5" />
        <path d="M10 13.5c0-1.4 2.7-2.5 6-2.5s6 1.1 6 2.5l-1.3 7.6c-.2 1.1-2.2 1.9-4.7 1.9s-4.5-.8-4.7-1.9z" fill="url(#lg)" opacity=".9" />
      </svg>
      <span>
        AWS <b>Quest</b>
      </span>
    </NavLink>
  )
}

function Hud() {
  const p = usePlayer()
  const ref = useRef<HTMLDivElement>(null)
  const prevXp = useRef(p.xp)
  useEffect(() => {
    if (p.xp > prevXp.current && ref.current) {
      ref.current.classList.remove(s.hudPulse)
      void ref.current.offsetWidth
      ref.current.classList.add(s.hudPulse)
    }
    prevXp.current = p.xp
  }, [p.xp])
  return (
    <NavLink to="/dossie" className={s.hud} aria-label={`Nível ${p.level}, ${p.title}, ${p.xp} XP`}>
      <div ref={ref} className={s.hudRing}>
        <ProgressRing value={p.ratio} size={40} stroke={4} color="var(--xp)">
          {p.level}
        </ProgressRing>
      </div>
      <div className={s.hudText}>
        <span className={s.hudTitle}>{p.title}</span>
        <span className={s.hudXp}>
          {p.xp.toLocaleString('pt-BR')} XP · faltam {(p.next - p.xp).toLocaleString('pt-BR')}
        </span>
      </div>
    </NavLink>
  )
}

export function Layout() {
  useThemeSettings()
  const due = useDueCount()
  const notice = useGame((st) => st.notice)
  const dismissNotice = useGame((st) => st.dismissNotice)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const inMission = location.pathname.startsWith('/missao/')

  useEffect(() => {
    window.scrollTo({ top: 0 })
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className={s.shell}>
      <a href="#conteudo" className={s.skip}>
        Pular para o conteúdo
      </a>
      <header className={s.topbar}>
        <div className={s.topInner}>
          <Logo />
          <nav className={s.nav} aria-label="Principal">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `${s.navLink} ${isActive ? s.active : ''}`}>
                <n.icon size={18} aria-hidden="true" />
                <span>{n.label}</span>
                {n.badge && due > 0 && (
                  <span className={s.navBadge} aria-label={`${due} conceitos para revisar`}>
                    {due}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <Hud />
        </div>
      </header>
      {notice === 'corrupted' && (
        <div className={s.notice}>
          <Callout kind="warning" title="Não foi possível ler o progresso salvo">
            <p>
              Os dados estavam corrompidos ou num formato incompatível. Uma cópia foi guardada no navegador e um novo progresso foi iniciado.{' '}
              <button type="button" className={s.noticeBtn} onClick={dismissNotice}>
                Entendi
              </button>
            </p>
          </Callout>
        </div>
      )}
      <main id="conteudo" ref={mainRef} tabIndex={-1} className={s.main}>
        <Outlet />
      </main>
      {!inMission && (
        <footer className={s.footer}>
          <p>
            AWS Quest é um projeto educacional independente, sem afiliação com a Amazon Web Services. AWS e os nomes dos serviços são marcas da Amazon.com, Inc. ou de suas afiliadas. As simulações simplificam o
            comportamento real dos serviços e não garantem aprovação em certificações. <NavLink to="/sobre">Sobre e simplificações</NavLink>
          </p>
        </footer>
      )}
      <nav className={s.bottomNav} aria-label="Principal (celular)">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `${s.bottomLink} ${isActive ? s.active : ''}`}>
            <span className={s.bottomIcon}>
              <n.icon size={20} aria-hidden="true" />
              {n.badge && due > 0 && <span className={s.dot} aria-label={`${due} para revisar`} />}
            </span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <Celebrations />
    </div>
  )
}
