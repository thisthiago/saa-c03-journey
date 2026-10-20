/**
 * Árvore de uma organização (raiz, OUs e contas) com SCPs anexadas por nó.
 * Converte a árvore em contas com SCPs por nível, da raiz até a conta, para o
 * motor de políticas avaliar.
 *
 * Conferido em 19/10/2026:
 * - SCPs: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
 * - Avaliação de SCPs: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_evaluation.html
 *
 * Regras: para uma ação ser permitida numa conta, cada nível do caminho (raiz,
 * OUs e a própria conta) precisa ter uma SCP com Allow; um Deny em qualquer
 * nível vence. A conta de gerenciamento não é afetada por SCPs.
 */
import type { AccountDef, Policy } from '../policy/model'

export interface OrgNode {
  id: string
  name: string
  kind: 'root' | 'ou' | 'account'
  parent?: string
  /** Só para contas: o ID de 12 dígitos. */
  accountId?: string
  management?: boolean
}

export type Attachments = Record<string, string[]>

/** Caminho da raiz até o nó. */
export function pathTo(nodes: OrgNode[], id: string): OrgNode[] {
  const out: OrgNode[] = []
  let cur = nodes.find((n) => n.id === id)
  while (cur) {
    out.unshift(cur)
    cur = cur.parent ? nodes.find((n) => n.id === cur!.parent) : undefined
  }
  return out
}

export function nodeLabel(n: OrgNode): string {
  return n.kind === 'root' ? 'a raiz' : n.kind === 'ou' ? `a OU ${n.name}` : `a conta ${n.name}`
}

/** Contas com as SCPs de cada nível do caminho, prontas para o motor de políticas. */
export function orgAccounts(orgId: string, nodes: OrgNode[], library: Policy[], attached: Attachments): AccountDef[] {
  return nodes
    .filter((n) => n.kind === 'account')
    .map((acct) => ({
      id: acct.accountId!,
      name: acct.name,
      orgId,
      management: acct.management,
      scps: pathTo(nodes, acct.id).map((n) => ({
        id: n.id,
        name: nodeLabel(n),
        policies: (attached[n.id] ?? []).map((pid) => library.find((p) => p.id === pid)).filter((p): p is Policy => Boolean(p)),
      })),
    }))
}

/** Profundidade do nó (raiz = 0), para indentar a árvore. */
export function depth(nodes: OrgNode[], id: string): number {
  return pathTo(nodes, id).length - 1
}
