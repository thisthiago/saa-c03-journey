/**
 * Conectividade híbrida: qual conexão entre a empresa e a AWS atende a cada
 * requisito com o menor esforço e custo.
 *
 * Conferido em 21/10/2026:
 * - Site-to-Site VPN: IPsec pela internet, dois túneis por conexão, até 1,25 Gbps
 *   por túnel padrão (5 Gbps nos túneis de grande largura de banda, só no Transit
 *   Gateway ou no Cloud WAN); ECMP no Transit Gateway soma túneis com roteamento
 *   dinâmico: https://docs.aws.amazon.com/vpn/latest/s2svpn/vpn-limits.html
 * - Direct Connect: conexão física dedicada (1, 10, 100 e 400 Gbps) ou hospedada
 *   por parceiro (de 50 Mbps a 25 Gbps); interfaces virtuais privada, pública e de
 *   trânsito: https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html
 * - MACsec só em conexões dedicadas de 10, 100 e 400 Gbps, e não em hospedadas:
 *   https://docs.aws.amazon.com/directconnect/latest/UserGuide/MACsec.html
 * - Modelos de resiliência (máxima, alta, desenvolvimento e teste):
 *   https://docs.aws.amazon.com/directconnect/latest/UserGuide/resilency_toolkit.html
 * - Client VPN: VPN gerenciada para usuários, com cliente baseado em OpenVPN:
 *   https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/what-is.html
 *
 * Premissa do cenário: o circuito físico do Direct Connect, que depende do
 * parceiro e da conexão no local, não fica pronto em poucos dias. A VPN fica.
 */
import { bestChoice, choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export type HybridNeed = 'encrypted' | 'fast-setup' | 'bw-1' | 'bw-5' | 'bw-10' | 'private-path' | 'survive-link' | 'survive-location' | 'remote-users'

export type HybridOption = 'vpn' | 'vpn-ecmp' | 'dx-hosted' | 'dx-dedicated' | 'dx-vpn-backup' | 'dx-high' | 'vpn-over-dx' | 'dx-macsec' | 'client-vpn'

export const HYBRID: ChoiceCatalog = {
  needLabel: {
    encrypted: 'o tráfego precisa ir criptografado',
    'fast-setup': 'a conexão precisa funcionar em poucos dias',
    'bw-1': 'banda de até 1 Gbps',
    'bw-5': 'banda de alguns Gbps (até cerca de 5 Gbps)',
    'bw-10': 'banda de 10 Gbps ou mais',
    'private-path': 'latência estável, por um caminho que não passa pela internet',
    'survive-link': 'continuar funcionando se um link ou um equipamento falhar',
    'survive-location': 'continuar funcionando se um local de conexão inteiro cair',
    'remote-users': 'acesso de pessoas que trabalham fora do escritório, cada uma no seu computador',
  },
  options: {
    vpn: { name: 'Site-to-Site VPN', summary: 'Túneis IPsec criptografados pela internet, prontos em pouco tempo; cada conexão tem dois túneis.', meets: ['encrypted', 'fast-setup', 'bw-1', 'survive-link'], limits: ['Passa pela internet e cada túnel padrão vai até 1,25 Gbps.'], complexity: 1 },
    'vpn-ecmp': { name: 'Várias VPNs no Transit Gateway com ECMP', summary: 'Soma a banda de vários túneis com roteamento dinâmico (BGP) no Transit Gateway.', meets: ['encrypted', 'fast-setup', 'bw-1', 'bw-5', 'survive-link'], limits: ['Continua passando pela internet, com latência variável.'], complexity: 3 },
    'dx-hosted': { name: 'Direct Connect hospedado', summary: 'Conexão privada entregue por um parceiro, de 50 Mbps a 25 Gbps.', meets: ['private-path', 'bw-1', 'bw-5'], limits: ['Não é criptografada por padrão e não aceita MACsec.'], complexity: 2 },
    'dx-dedicated': { name: 'Direct Connect dedicado', summary: 'Porta física só da empresa, de 1, 10, 100 ou 400 Gbps, num local do Direct Connect.', meets: ['private-path', 'bw-1', 'bw-5', 'bw-10'], limits: ['Uma conexão só é um ponto único de falha e não é criptografada por padrão.'], complexity: 3 },
    'dx-vpn-backup': { name: 'Direct Connect com VPN de reserva', summary: 'O Direct Connect leva o tráfego, e uma VPN assume se ele cair, com menos banda.', meets: ['private-path', 'bw-1', 'bw-5', 'bw-10', 'survive-link'], limits: ['Na falha, o tráfego volta para a internet e a banda cai.'], complexity: 4 },
    'dx-high': { name: 'Direct Connect em dois locais', summary: 'Conexões em locais diferentes do Direct Connect, que resistem à queda de um local inteiro.', meets: ['private-path', 'bw-1', 'bw-5', 'bw-10', 'survive-link', 'survive-location'], limits: ['É a opção mais cara e demorada de montar.'], complexity: 5 },
    'vpn-over-dx': { name: 'VPN sobre o Direct Connect', summary: 'Túneis IPsec por dentro da conexão privada: caminho estável e criptografado.', meets: ['encrypted', 'private-path', 'bw-1'], limits: ['A banda fica limitada à dos túneis da VPN.'], complexity: 3.5 },
    'dx-macsec': { name: 'Direct Connect dedicado com MACsec', summary: 'Criptografia na camada 2 entre o roteador da empresa e o equipamento da AWS, em portas de 10, 100 ou 400 Gbps.', meets: ['encrypted', 'private-path', 'bw-1', 'bw-5', 'bw-10'], limits: ['Exige porta dedicada compatível e equipamento com MACsec.'], complexity: 4 },
    'client-vpn': { name: 'Client VPN', summary: 'VPN gerenciada em que cada pessoa se conecta com um cliente OpenVPN.', meets: ['remote-users', 'encrypted', 'fast-setup'], limits: ['Serve a pessoas, e não para ligar um escritório inteiro.'], complexity: 2 },
  },
}

export type HybridLabConfig = ChoiceLabConfig
export type HybridLabResponse = ChoiceLabResponse

export const hybridSolution = (c: HybridLabConfig) => choiceSolution(HYBRID, c)
export const evaluateHybridLab = (c: HybridLabConfig, r: HybridLabResponse) => evaluateChoiceLab(HYBRID, c, r)
export const bestHybrid = (needs: HybridNeed[], options: HybridOption[]) => bestChoice(HYBRID, { id: 'x', text: 'x', dominant: needs[0], needs }, options)
