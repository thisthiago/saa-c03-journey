/**
 * Funções básicas compartilhadas pelos avaliadores de política (acesso ao S3 e
 * motor de políticas do IAM): curingas e faixas de IP.
 */

/** Compara um padrão com `*` (vários caracteres) e `?` (um caractere) com o valor inteiro. */
export function wildcardMatch(pattern: string, value: string, ignoreCase = false): boolean {
  const source = `^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`
  return new RegExp(source, ignoreCase ? 'i' : undefined).test(value)
}

/** O IPv4 está dentro do bloco CIDR? Sem prefixo, vale /32 (como no IAM). */
export function ipInCidr(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/')
  const bits = Number(bitsStr ?? 32)
  const toInt = (s: string) => s.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (toInt(ip) & mask) === (toInt(base) & mask)
}

/** Um valor ou uma lista no JSON da AWS: listas de um item viram o próprio item. */
export function oneOrMany<T>(values: T[]): T | T[] {
  return values.length === 1 ? values[0] : values
}
