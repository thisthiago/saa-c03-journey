/**
 * O que acontece com um sistema de arquivos FSx quando o servidor de arquivos
 * falha ou quando a AZ inteira fica fora, conforme o tipo de implantação.
 *
 * Conferido em 22/10/2026:
 * - FSx for Windows File Server: Single-AZ se recupera sozinho, com cerca de
 *   30 minutos de parada; Multi-AZ faz failover para o servidor em espera em
 *   menos de 30 s, inclusive quando a AZ fica fora
 *   (https://docs.aws.amazon.com/fsx/latest/WindowsGuide/high-availability-multiAZ.html).
 * - FSx for Lustre: no scratch, os dados não são replicados e não persistem se
 *   um servidor falha (I/O error para os arquivos dele); no persistente, os
 *   dados são replicados na mesma AZ e o servidor é trocado em minutos
 *   (https://docs.aws.amazon.com/fsx/latest/LustreGuide/using-fsx-lustre.html).
 * - FSx for OpenZFS: Multi-AZ (HA) e Single-AZ (HA) fazem failover em cerca de
 *   60 s; Single-AZ (non-HA) se recupera em cerca de 30 minutos
 *   (https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/what-is-fsx.html).
 *
 * Simplificação: um sistema de arquivos de uma AZ só fica fora enquanto a AZ
 * estiver fora (a recuperação a partir de backup em outra AZ é outra ação).
 */

export type FsxDeployment =
  | 'windows-single-az'
  | 'windows-multi-az'
  | 'lustre-scratch'
  | 'lustre-persistent'
  | 'zfs-single-az'
  | 'zfs-single-az-ha'
  | 'zfs-multi-az'

export type FsxEvent = 'server-failure' | 'az-outage'

export type FsxOutcome = 'failover' | 'recovers' | 'down' | 'lost'

export const FSX_DEPLOYMENT_LABEL: Record<FsxDeployment, string> = {
  'windows-single-az': 'FSx for Windows File Server, Single-AZ',
  'windows-multi-az': 'FSx for Windows File Server, Multi-AZ',
  'lustre-scratch': 'FSx for Lustre, scratch',
  'lustre-persistent': 'FSx for Lustre, persistente',
  'zfs-single-az': 'FSx for OpenZFS, Single-AZ (non-HA)',
  'zfs-single-az-ha': 'FSx for OpenZFS, Single-AZ (HA)',
  'zfs-multi-az': 'FSx for OpenZFS, Multi-AZ (HA)',
}

export const FSX_OUTCOME_LABEL: Record<FsxOutcome, string> = {
  failover: 'o servidor em espera assume em segundos',
  recovers: 'fica fora até a AWS trocar o componente, e os dados continuam lá',
  down: 'fica fora enquanto a AZ estiver fora',
  lost: 'os arquivos daquele servidor se perdem',
}

export function fsxFailure(d: FsxDeployment, e: FsxEvent): { outcome: FsxOutcome; why: string } {
  switch (d) {
    case 'windows-multi-az':
      return { outcome: 'failover', why: 'O Multi-AZ tem um servidor em espera em outra AZ e faz failover em menos de 30 s, com o mesmo nome DNS.' }
    case 'zfs-multi-az':
      return { outcome: 'failover', why: 'O Multi-AZ (HA) guarda uma cópia dos dados em cada AZ e faz failover em cerca de 60 s.' }
    case 'zfs-single-az-ha':
      return e === 'server-failure'
        ? { outcome: 'failover', why: 'O Single-AZ (HA) tem um par primário e em espera na mesma AZ: failover em cerca de 60 s.' }
        : { outcome: 'down', why: 'O par primário e em espera fica na mesma AZ: com a AZ fora, os dois ficam fora.' }
    case 'windows-single-az':
      return e === 'server-failure'
        ? { outcome: 'recovers', why: 'O Single-AZ troca o componente com falha sozinho, com cerca de 30 minutos de parada.' }
        : { outcome: 'down', why: 'Servidor e volumes ficam numa AZ só: com ela fora, o compartilhamento fica fora.' }
    case 'zfs-single-az':
      return e === 'server-failure'
        ? { outcome: 'recovers', why: 'O Single-AZ (non-HA) se recupera sozinho, em cerca de 30 minutos.' }
        : { outcome: 'down', why: 'Tudo fica numa AZ só: com ela fora, o sistema de arquivos fica fora.' }
    case 'lustre-persistent':
      return e === 'server-failure'
        ? { outcome: 'recovers', why: 'No persistente, os dados são replicados na AZ e o servidor é trocado em minutos; os clientes repetem as chamadas até lá.' }
        : { outcome: 'down', why: 'O persistente replica os dados dentro da mesma AZ: com ela fora, o sistema de arquivos fica fora.' }
    case 'lustre-scratch':
      return e === 'server-failure'
        ? { outcome: 'lost', why: 'No scratch, os dados não são replicados e o servidor não é trocado: os arquivos dele dão erro e não voltam.' }
        : { outcome: 'lost', why: 'No scratch, os dados não são replicados nem persistem quando os servidores falham: com a AZ fora, eles se perdem.' }
  }
}
