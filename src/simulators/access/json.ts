/** Converte declarações do simulador para o formato JSON de políticas da AWS. */
import type { Condition, PrincipalSpec, Statement } from './model'

function principal(ps: PrincipalSpec[]) {
  if (ps.some((p) => p === '*')) return '*'
  const aws = ps.flatMap((p) => (typeof p === 'object' && 'account' in p ? [`arn:aws:iam::${p.account}:root`] : typeof p === 'object' && 'arn' in p ? [p.arn] : []))
  const service = ps.flatMap((p) => (typeof p === 'object' && 'service' in p ? [p.service] : []))
  const out: Record<string, string | string[]> = {}
  if (aws.length) out.AWS = aws.length === 1 ? aws[0] : aws
  if (service.length) out.Service = service.length === 1 ? service[0] : service
  return out
}

function conditions(cs: Condition[]) {
  const out: Record<string, Record<string, unknown>> = {}
  const add = (op: string, key: string, value: unknown) => {
    out[op] ??= {}
    out[op][key] = value
  }
  for (const c of cs) {
    switch (c.key) {
      case 'aws:SecureTransport':
        add('Bool', c.key, String(c.value))
        break
      case 'aws:SourceIp':
        add(c.negate ? 'NotIpAddress' : 'IpAddress', c.key, c.cidr)
        break
      case 's3:x-amz-server-side-encryption':
        add(c.negate ? 'StringNotEquals' : 'StringEquals', c.key, c.value)
        break
      case 'aws:PrincipalOrgID':
        add('StringEquals', c.key, c.value)
        break
    }
  }
  return out
}

export function statementObject(st: Statement) {
  return {
    Sid: st.sid,
    Effect: st.effect,
    ...(st.principals ? { Principal: principal(st.principals) } : {}),
    Action: st.actions.length === 1 ? st.actions[0] : st.actions,
    Resource: st.resources.length === 1 ? st.resources[0] : st.resources,
    ...(st.conditions?.length ? { Condition: conditions(st.conditions) } : {}),
  }
}

/** JSON formatado. Com `bare`, mostra só a declaração (sem o envelope Version/Statement). */
export function policyJson(statements: Statement[], bare = false): string {
  if (bare && statements.length === 1) return JSON.stringify(statementObject(statements[0]), null, 2)
  return JSON.stringify({ Version: '2012-10-17', Statement: statements.map(statementObject) }, null, 2)
}
