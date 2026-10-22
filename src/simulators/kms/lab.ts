/** Laboratório "Quem usa a chave": montar a key policy e os grants para que cada pedido tenha o resultado certo. */
import type { ItemFeedback } from '../../engine/types'
import type { PolicyStatement, Principal } from '../policy/model'
import { ACTION_LABEL, kmsDecide, type KmsGrant, type KmsKey, type KmsWorld } from './model'

export interface KmsPaletteItem {
  id: string
  /** Descrição curta (RichText). */
  label: string
  statement?: PolicyStatement
  grant?: KmsGrant
}

export interface KmsLabRequest {
  id: string
  principalId: string
  action: string
  expect: 'allow' | 'deny'
  /** Por que o pedido deve ter esse resultado (RichText). */
  why: string
  concepts?: string[]
}

export interface KmsLabConfig {
  principals: Principal[]
  key: Omit<KmsKey, 'statements'> & { statements?: PolicyStatement[] }
  palette: KmsPaletteItem[]
  requests: KmsLabRequest[]
}

export interface KmsLabResponse {
  picked: string[]
}

export const kmsInitial = (): KmsLabResponse => ({ picked: [] })

export function kmsWorld(c: KmsLabConfig, picked: string[] = []): KmsWorld {
  const items = c.palette.filter((p) => picked.includes(p.id))
  return {
    principals: c.principals,
    key: { arn: c.key.arn, label: c.key.label, statements: [...(c.key.statements ?? []), ...items.flatMap((p) => (p.statement ? [p.statement] : []))] },
    grants: items.flatMap((p) => (p.grant ? [p.grant] : [])),
  }
}

export const principalName = (c: KmsLabConfig, id: string) => c.principals.find((p) => p.id === id)?.name ?? id

export function judgeRequest(c: KmsLabConfig, req: KmsLabRequest, picked: string[] = []): { score: number; fb: ItemFeedback } {
  const d = kmsDecide(kmsWorld(c, picked), { principalId: req.principalId, action: req.action })
  const got = d.allowed ? 'allow' : 'deny'
  const label = `${principalName(c, req.principalId)}: ${ACTION_LABEL[req.action] ?? req.action}`
  const result = d.allowed ? `permitido${d.via === 'grant' ? ' por um grant' : ''}` : 'negado'
  if (got === req.expect) return { score: 1, fb: { id: req.id, label, status: 'correct', message: `Resultado: ${result}, como deve ser. ${req.why}` } }
  return { score: 0, fb: { id: req.id, label, status: 'wrong', message: `Resultado: ${result}, mas deveria ser ${req.expect === 'allow' ? 'permitido' : 'negado'}. ${req.why}` } }
}

export function evaluateKmsLab(c: KmsLabConfig, r: KmsLabResponse) {
  const items = c.requests.map((req) => ({ concepts: req.concepts, ...judgeRequest(c, req, r?.picked) }))
  return { score: items.reduce((s, x) => s + x.score, 0) / Math.max(1, items.length), items }
}

/** A menor combinação da paleta que acerta todos os pedidos (busca exaustiva). */
export function kmsSolution(c: KmsLabConfig): KmsLabResponse {
  const ids = c.palette.map((p) => p.id)
  let best: string[] | undefined
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const pick = ids.filter((_, i) => mask & (1 << i))
    if (best && pick.length >= best.length) continue
    if (evaluateKmsLab(c, { picked: pick }).score === 1) best = pick
  }
  if (!best) throw new Error('Laboratório do KMS sem solução')
  return { picked: best }
}
