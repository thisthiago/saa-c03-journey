/** Desenho vivo do plano de endereços: a VPC como uma faixa e cada sub-rede no seu trecho. */
import type { CSSProperties } from 'react'
import type { VpcPlannerLabConfig, VpcPlannerLabResponse } from './planner'
import { rulerModel } from './ruler'
import r from './vpcnet.module.css'

const PROBLEM_TEXT = { ok: 'ok', overlap: 'sobreposta a outra sub-rede', small: 'pequena demais para os recursos' } as const

export function AddressRuler({ config, value }: { config: VpcPlannerLabConfig; value: VpcPlannerLabResponse }) {
  const m = rulerModel(config, value)
  if (!m) {
    return <p className={r.rulerEmpty}>Escolha um bloco de VPC aceito para ver a régua de endereços.</p>
  }
  const summary = m.segments.length
    ? m.segments.map((s) => `${s.name} em ${s.cidr}, ${PROBLEM_TEXT[s.problem]}`).join('; ')
    : 'nenhuma sub-rede dentro do bloco ainda'
  return (
    <figure className={r.ruler} role="img" aria-label={`Régua do bloco ${m.vpc}: ${summary}.${m.outside.length ? ` Fora do bloco: ${m.outside.map((o) => o.name).join(', ')}.` : ''}`}>
      <figcaption className={r.rulerHead}>
        <strong>Régua da VPC {m.vpc}</strong>
        <span>
          {m.used.toLocaleString('pt-BR')} de {m.size.toLocaleString('pt-BR')} endereços em sub-redes
        </span>
      </figcaption>
      <div className={r.track} style={{ '--lanes': m.lanes } as CSSProperties}>
        {m.ticks.map((t) => (
          <span key={t.label} className={r.tick} style={{ left: `${t.left}%` }}>
            <span className={r.tickLabel}>{t.label}</span>
          </span>
        ))}
        {m.clashes.map((c, i) => (
          <span key={i} className={r.clash} style={{ left: `${c.left}%`, width: `${c.width}%` }} />
        ))}
        {m.segments.map((s) => (
          <span
            key={s.id}
            className={r.seg}
            data-problem={s.problem}
            style={{ left: `${s.left}%`, width: `max(${s.width}%, 4px)`, top: `calc(${s.lane} * var(--lane-h) + 4px)` }}
            title={`${s.name}: ${s.cidr}, ${s.usable} endereços utilizáveis para ${s.need} recursos`}
          >
            {s.width >= 9 && (
              <>
                <span className={r.segName}>{s.name}</span>
                <span className={r.segCidr}>/{s.cidr.split('/')[1]}</span>
              </>
            )}
          </span>
        ))}
      </div>
      <ul className={r.legend}>
        <li data-problem="ok">sub-rede ok</li>
        <li data-problem="overlap">sobreposta a outra</li>
        <li data-problem="small">pequena demais</li>
        <li data-problem="free">espaço livre</li>
      </ul>
      {m.outside.length > 0 && (
        <p className={r.outside}>
          Fora do bloco da VPC: {m.outside.map((o) => `${o.name} (${o.cidr})`).join(', ')}.
        </p>
      )}
    </figure>
  )
}
