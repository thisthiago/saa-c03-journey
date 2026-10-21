/**
 * Simulador de permissões do Lake Formation: o que cada analista enxerga de
 * uma tabela do Data Catalog, célula a célula.
 *
 * Conferido em 21/10/2026:
 * - Filtros de dados dão segurança por coluna, por linha e por célula (linha
 *   e coluna combinadas)
 *   (https://docs.aws.amazon.com/lake-formation/latest/dg/data-filtering.html).
 * - LF-Tags são pares chave-valor ligados a bancos, tabelas e colunas; o
 *   acesso vale quando o valor concedido coincide com o do recurso; não são
 *   tags do IAM
 *   (https://docs.aws.amazon.com/lake-formation/latest/dg/tag-based-access-control.html).
 * - Por padrão, o grupo IAMAllowedPrincipals tem Super em tudo, e o acesso
 *   fica só com as políticas do IAM
 *   (https://docs.aws.amazon.com/lake-formation/latest/dg/change-settings.html).
 *
 * Simplificação: as permissões se somam (um analista vê a união das células
 * que cada concessão libera) e todas são SELECT.
 */

export interface PermColumn {
  id: string
  label: string
  /** LF-Tags da coluna (chave para valor). */
  tags?: Record<string, string>
}

export interface PermTable {
  name: string
  columns: PermColumn[]
  /** Linhas de exemplo: valor de cada coluna. */
  rows: Record<string, string>[]
}

export interface RowFilter {
  column: string
  in: string[]
}

export type Grant =
  /** SELECT na tabela inteira. */
  | { kind: 'table' }
  /** SELECT só em algumas colunas (ou em todas menos algumas). */
  | { kind: 'columns'; include?: string[]; exclude?: string[] }
  /** Filtro de dados: linhas que atendem à condição, nas colunas escolhidas. */
  | { kind: 'filter'; where?: RowFilter; include?: string[]; exclude?: string[] }
  /** Concessão por LF-Tag: as colunas com a tag. */
  | { kind: 'tag'; key: string; value: string }
  /** Configuração padrão: IAMAllowedPrincipals com Super, acesso decidido só pelo IAM. */
  | { kind: 'iam-default' }

/** Uma célula: índice da linha e id da coluna. */
export type Cell = `${number}:${string}`

const cell = (row: number, col: string): Cell => `${row}:${col}`

function columnsOf(t: PermTable, include?: string[], exclude?: string[]): string[] {
  return t.columns.map((c) => c.id).filter((id) => (!include || include.includes(id)) && !exclude?.includes(id))
}

const rowMatches = (row: Record<string, string>, where?: RowFilter) => !where || where.in.includes(row[where.column])

/** Células que uma concessão libera. */
export function grantCells(t: PermTable, g: Grant): Set<Cell> {
  const out = new Set<Cell>()
  const add = (cols: string[], where?: RowFilter) => t.rows.forEach((r, i) => rowMatches(r, where) && cols.forEach((c) => out.add(cell(i, c))))
  switch (g.kind) {
    case 'table':
    case 'iam-default':
      add(columnsOf(t))
      break
    case 'columns':
      add(columnsOf(t, g.include, g.exclude))
      break
    case 'filter':
      add(columnsOf(t, g.include, g.exclude), g.where)
      break
    case 'tag':
      add(t.columns.filter((c) => c.tags?.[g.key] === g.value).map((c) => c.id))
      break
  }
  return out
}

/** Células que o analista enxerga com a soma das concessões. */
export function visibleCells(t: PermTable, grants: Grant[]): Set<Cell> {
  const out = new Set<Cell>()
  for (const g of grants) for (const c of grantCells(t, g)) out.add(c)
  return out
}

/** O que o analista precisa ver: colunas e, se houver, a condição das linhas. */
export interface CellSpec {
  columns: string[]
  where?: RowFilter
}

export const specCells = (t: PermTable, s: CellSpec) => grantCells(t, { kind: 'filter', include: s.columns, where: s.where })

export type AccessVerdict = 'exact' | 'extra' | 'partial' | 'none'

export interface AccessCheck {
  verdict: AccessVerdict
  /** Células vistas sem necessidade. */
  extra: Cell[]
  /** Células necessárias que ficaram de fora. */
  missing: Cell[]
}

export function checkAccess(t: PermTable, grants: Grant[], need: CellSpec): AccessCheck {
  const seen = visibleCells(t, grants)
  const want = specCells(t, need)
  const extra = [...seen].filter((c) => !want.has(c))
  const missing = [...want].filter((c) => !seen.has(c))
  const verdict: AccessVerdict = extra.length ? 'extra' : seen.size === 0 ? 'none' : missing.length ? 'partial' : 'exact'
  return { verdict, extra, missing }
}

/** Linhas com pelo menos uma célula visível. */
export const visibleRows = (t: PermTable, grants: Grant[]) => new Set([...visibleCells(t, grants)].map((c) => Number(c.split(':')[0]))).size

/** Colunas com pelo menos uma célula visível. */
export const visibleColumns = (t: PermTable, grants: Grant[]) => new Set([...visibleCells(t, grants)].map((c) => c.split(':').slice(1).join(':')))

/** Descrição curta de uma concessão, para a interface. */
export function describeGrant(t: PermTable, g: Grant): string {
  const names = (ids: string[]) => ids.map((id) => t.columns.find((c) => c.id === id)?.label ?? id).join(', ')
  const cols = (include?: string[], exclude?: string[]) => (include ? `colunas ${names(include)}` : exclude ? `todas as colunas menos ${names(exclude)}` : 'todas as colunas')
  switch (g.kind) {
    case 'table':
      return 'SELECT na tabela inteira'
    case 'iam-default':
      return 'Configuração padrão: IAMAllowedPrincipals com Super, acesso decidido só pelo IAM'
    case 'columns':
      return `SELECT em ${cols(g.include, g.exclude)}`
    case 'filter':
      return `Filtro de dados: ${g.where ? `linhas com ${names([g.where.column])} = ${g.where.in.join(' ou ')}` : 'todas as linhas'}, ${cols(g.include, g.exclude)}`
    case 'tag':
      return `LF-Tag ${g.key}=${g.value}`
  }
}
