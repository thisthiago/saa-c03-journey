/** Interface do "Otimizador de custos": escolha a classe de cada perfil e veja a conta mensal. */
import { Check, Clock, Database, Download, Layers, ShieldCheck, X } from 'lucide-react'
import type { Evaluation } from '../../engine/types'
import { Badge, ProgressBar } from '../../ui/kit'
import { STORAGE_CLASSES } from '../shared/storageClasses'
import { labClasses, type CostLabConfig, type CostLabResponse } from './lab'
import { compareClasses, dataGB, formatUSD, monthlyCost, type CostBreakdown } from './model'
import { PRICE_REGIONS, PRICE_TABLE, regionPrices } from './prices'
import s from './cost.module.css'

interface Props {
  config: CostLabConfig
  value: CostLabResponse
  onChange: (v: CostLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

const COMPONENTS: { key: keyof Pick<CostBreakdown, 'storage' | 'requests' | 'retrieval' | 'monitoring' | 'earlyDeletion' | 'transfer'>; label: string }[] = [
  { key: 'storage', label: 'Armazenamento' },
  { key: 'requests', label: 'Requisições' },
  { key: 'retrieval', label: 'Recuperação' },
  { key: 'monitoring', label: 'Monitoramento' },
  { key: 'earlyDeletion', label: 'Exclusão antecipada' },
  { key: 'transfer', label: 'Transferência' },
]

const fmtInt = (n: number) => n.toLocaleString('pt-BR')
function fmtGB(gb: number) {
  return gb >= 1024 ? `${(gb / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} TB` : `${gb.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`
}
function fmtSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${kb} KB`
}

export function Bars({ cost, max }: { cost: CostBreakdown; max: number }) {
  return (
    <div className={s.stack} role="img" aria-label={COMPONENTS.filter((c) => cost[c.key] > 0).map((c) => `${c.label} ${formatUSD(cost[c.key])}`).join(', ')}>
      {COMPONENTS.map((c) =>
        cost[c.key] > 0 ? <span key={c.key} data-part={c.key} style={{ width: `${(cost[c.key] / max) * 100}%` }} title={`${c.label}: ${formatUSD(cost[c.key])}`} /> : null,
      )}
    </div>
  )
}

export function CostLab({ config, value, onChange, disabled, evaluation }: Props) {
  const prices = regionPrices(config.region)
  const classes = labClasses(config)
  const status: Record<string, string> = {}
  for (const i of evaluation?.items ?? []) status[i.id] = i.status
  const total = config.profiles.reduce((sum, p) => sum + (value.choices[p.id] ? monthlyCost(p, value.choices[p.id], prices).total : 0), 0)
  const otherRegion = PRICE_REGIONS.find((r) => r !== config.region)
  const otherTotal = otherRegion ? config.profiles.reduce((sum, p) => sum + (value.choices[p.id] ? monthlyCost(p, value.choices[p.id], regionPrices(otherRegion)).total : 0), 0) : 0

  return (
    <div className={s.lab}>
      <div className={s.meta}>
        <Badge tone="info">Região: {config.region} · {prices.label}</Badge>
        <span className={s.small}>
          Preços da AWS Price List (oferta S3 de {new Date(prices.offers.AmazonS3).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}) · estimativa didática, não é uma cotação
        </span>
      </div>

      {config.profiles.map((p) => {
        const choice = value.choices[p.id]
        const cost = choice ? monthlyCost(p, choice, prices) : null
        const st = status[p.id]
        const all = evaluation ? compareClasses(p, prices, classes).sort((a, b) => a.total - b.total) : []
        const max = all.length ? Math.max(...all.map((c) => c.total)) : cost?.total || 1
        return (
          <section key={p.id} className={s.profile} data-status={st} aria-label={`Perfil ${p.name}`}>
            <header className={s.profileHead}>
              <div>
                <h3 className={s.profileName}>
                  {st === 'correct' && <Check size={18} className={s.ok} aria-label="ótimo" />}
                  {st === 'partial' && <Check size={18} className={s.partial} aria-label="atende, mas não é o mais econômico" />}
                  {(st === 'wrong' || st === 'missed') && <X size={18} className={s.bad} aria-label="incorreto" />}
                  {p.name}
                </h3>
                <p className={s.desc}>{p.description}</p>
              </div>
            </header>
            <ul className={s.facts}>
              <li>
                <Database size={14} aria-hidden="true" /> {fmtInt(p.objectCount)} objetos × {fmtSize(p.avgObjectKB)} = <b>{fmtGB(dataGB(p))}</b>
              </li>
              <li>
                <Download size={14} aria-hidden="true" /> {fmtInt(p.getsPerMonth)} GETs/mês · {fmtGB(p.retrievedGBPerMonth)} lidos/mês
                {p.restoresPerMonth ? ` · ${fmtInt(p.restoresPerMonth)} restaurações (${p.restoreTier ?? 'standard'})` : ''}
              </li>
              <li>
                <Layers size={14} aria-hidden="true" /> {fmtInt(p.putsPerMonth)} PUTs/mês{p.retentionDays ? ` · cada objeto fica ${p.retentionDays} dias` : ' · retenção indefinida'}
              </li>
            </ul>
            <div className={s.reqs}>
              <Badge tone={p.requirements.instantAccess ? 'accent' : 'neutral'} icon={<Clock size={12} aria-hidden="true" />}>
                {p.requirements.instantAccess ? 'Leitura imediata' : 'Pode esperar restauração'}
                {p.requirements.maxRestoreHours !== undefined && ` (até ${p.requirements.maxRestoreHours} h)`}
              </Badge>
              <Badge tone={p.requirements.azResilient ? 'accent' : 'neutral'} icon={<ShieldCheck size={12} aria-hidden="true" />}>
                {p.requirements.azResilient ? 'Não recriável: resistir à perda de uma AZ' : 'Recriável'}
              </Badge>
            </div>

            <div className={s.classes} role="radiogroup" aria-label={`Classe para ${p.name}`}>
              {classes.map((sc) => (
                <button key={sc} type="button" role="radio" aria-checked={choice === sc} className={`${s.classBtn} pick-card`} disabled={disabled} onClick={() => onChange({ choices: { ...value.choices, [p.id]: sc } })}>
                  <span className={s.className}>{STORAGE_CLASSES[sc].shortName}</span>
                  <span className={s.classInfo}>
                    {STORAGE_CLASSES[sc].access} · {STORAGE_CLASSES[sc].zones === '1' ? '1 AZ' : '≥3 AZs'}
                    {STORAGE_CLASSES[sc].minStorageDays > 0 && ` · mín. ${STORAGE_CLASSES[sc].minStorageDays} d`}
                  </span>
                </button>
              ))}
            </div>

            {cost && !evaluation && (
              <div className={s.bill} aria-live="polite">
                <div className={s.billHead}>
                  <span>Conta mensal estimada · {STORAGE_CLASSES[cost.storageClass].name}</span>
                  <b>{formatUSD(cost.total)}</b>
                </div>
                <Bars cost={cost} max={cost.total || 1} />
                <ul className={s.legend}>
                  {COMPONENTS.filter((c) => cost[c.key] > 0).map((c) => (
                    <li key={c.key} data-part={c.key}>
                      {c.label}: {formatUSD(cost[c.key])}
                    </li>
                  ))}
                </ul>
                {cost.notes.length > 0 && (
                  <ul className={s.notes}>
                    {cost.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {evaluation && (
              <div className={s.compare}>
                <p className={s.compareTitle}>Comparação de todas as classes para este perfil</p>
                <table className={s.table}>
                  <tbody>
                    {all.map((c) => (
                      <tr key={c.storageClass} data-chosen={c.storageClass === choice} data-invalid={c.violations.length > 0}>
                        <th scope="row">{STORAGE_CLASSES[c.storageClass].shortName}</th>
                        <td className={s.barCell}>
                          <Bars cost={c} max={max} />
                        </td>
                        <td className={s.num}>{formatUSD(c.total)}</td>
                        <td className={s.why}>{c.violations.length > 0 ? 'não atende' : c.storageClass === choice ? 'sua escolha' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}

      <div className={s.total}>
        <div className={s.totalHead}>
          <span>Total mensal das escolhas</span>
          <b>{formatUSD(total)}</b>
        </div>
        {config.budgetUSD !== undefined && (
          <>
            <ProgressBar value={Math.min(1, total / config.budgetUSD)} color={total > config.budgetUSD ? 'var(--danger)' : 'var(--success)'} label="Uso do orçamento" />
            <span className={s.small}>
              Orçamento: {formatUSD(config.budgetUSD)} {total > config.budgetUSD ? '— acima do limite' : ''}
            </span>
          </>
        )}
        {evaluation && otherRegion && (
          <span className={s.small}>
            As mesmas escolhas em {otherRegion} ({regionPrices(otherRegion).label}) custariam {formatUSD(otherTotal)}/mês: preços variam por Região.
          </span>
        )}
      </div>
      <details className={s.simplifications}>
        <summary>Simplificações deste simulador</summary>
        <ul>
          {PRICE_TABLE.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          <li>Todos os objetos de um perfil têm o mesmo tamanho médio e o volume armazenado é estável mês a mês.</li>
          <li>No Intelligent-Tiering, a distribuição entre tiers é estimada pelo padrão de acesso do perfil.</li>
          <li>Transferência para a internet usa a primeira faixa, sem o nível gratuito mensal.</li>
        </ul>
      </details>
    </div>
  )
}
