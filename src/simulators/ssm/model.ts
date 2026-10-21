/**
 * Systems Manager: o que torna uma instância um nó gerenciado e quais formas de
 * acesso exigem porta de entrada aberta.
 *
 * Fatos conferidos em 21/10/2026:
 * - Nó gerenciado: o SSM Agent está instalado e consegue falar com o serviço: https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html
 * - Permissões da instância: política AmazonSSMManagedInstanceCore numa role (perfil de instância) ou a Default Host Management Configuration (exige IMDSv2 e SSM Agent 3.2.582.0 ou mais novo): https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-instance-permissions.html
 * - O agente fala com os endpoints ssmmessages (e, em Regiões lançadas antes de 2024, ec2messages): https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html ; endpoints de interface ssm, ssmmessages e ec2messages para instâncias sem internet: https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html
 * - Session Manager: acesso sem portas de entrada, sem bastion e sem chaves SSH: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html
 *
 * Simplificação: em Regiões lançadas antes de 2024 o agente também usa o
 * ec2messages; o simulador trata os três endpoints como um conjunto.
 */

export type AccessMethod = 'ssh' | 'rdp' | 'bastion' | 'session-manager' | 'run-command'

export const METHOD_LABEL: Record<AccessMethod, string> = {
  ssh: 'SSH direto na instância',
  rdp: 'RDP direto na instância',
  bastion: 'Servidor bastion (jump box) com SSH',
  'session-manager': 'Session Manager',
  'run-command': 'Run Command',
}

/** O acesso exige uma porta de entrada aberta na instância ou num servidor intermediário. */
export const NEEDS_INBOUND_PORT: Record<AccessMethod, boolean> = { ssh: true, rdp: true, bastion: true, 'session-manager': false, 'run-command': false }

export type Permissions = 'instance-profile' | 'default-host-management' | 'none'
export type Route = 'internet' | 'vpc-endpoints' | 'vpc-endpoints-partial' | 'none'

export interface NodeState {
  /** O SSM Agent está instalado e rodando. */
  agent: boolean
  permissions: Permissions
  /** Com a Default Host Management Configuration: a instância usa IMDSv2 e o agente é 3.2.582.0 ou mais novo. */
  imdsv2AndNewAgent?: boolean
  /** Como o agente chega ao serviço. */
  route: Route
}

export function notManagedReasons(n: NodeState): string[] {
  const out: string[] = []
  if (!n.agent) out.push('o SSM Agent não está instalado ou não está rodando')
  if (n.permissions === 'none') out.push('a instância não tem permissões do Systems Manager (política AmazonSSMManagedInstanceCore ou Default Host Management Configuration)')
  if (n.permissions === 'default-host-management' && !n.imdsv2AndNewAgent) out.push('a Default Host Management Configuration exige IMDSv2 e o SSM Agent 3.2.582.0 ou mais novo')
  if (n.route === 'none') out.push('o agente não chega ao serviço: falta saída para a internet ou endpoints de VPC')
  if (n.route === 'vpc-endpoints-partial') out.push('faltam endpoints de VPC: são necessários ssm, ssmmessages e ec2messages')
  return out
}

export const isManaged = (n: NodeState): boolean => notManagedReasons(n).length === 0
