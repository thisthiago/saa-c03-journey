/**
 * Escolha da solução de rede: qual serviço ou recurso atende a cada requisito
 * com o menor esforço.
 *
 * Conferido em 21/10/2026:
 * - AWS WAF (regras gerenciadas contra injeção de SQL e cross-site scripting,
 *   regras por taxa) no CloudFront, ALB, API Gateway e outros:
 *   https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html
 * - Shield Standard sem custo extra, contra os ataques mais comuns de rede e de
 *   transporte; Shield Advanced com equipe de resposta (SRT, exige plano Business
 *   ou Enterprise) e créditos de custo: https://docs.aws.amazon.com/waf/latest/developerguide/ddos-overview.html
 * - Network Firewall: firewall com estado e IPS para a VPC, filtro por domínio:
 *   https://docs.aws.amazon.com/network-firewall/latest/developerguide/what-is-aws-network-firewall.html
 * - Firewall Manager: aplica proteções em todas as contas, inclusive nas novas:
 *   https://docs.aws.amazon.com/waf/latest/developerguide/fms-chapter.html
 * - Security groups, network ACLs, peering, Transit Gateway, endpoints, VPN, NAT
 *   Gateway, CloudFront e Global Accelerator: ver os modelos das fases anteriores.
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const NET_OPTIONS: ChoiceCatalog = {
  needLabel: {
    'block-sqli': 'bloquear injeção de SQL e cross-site scripting nas requisições web',
    'rate-limit': 'limitar quantas requisições cada IP faz por minuto',
    'ddos-basic': 'proteção contra os ataques DDoS de rede mais comuns, sem custo extra',
    'ddos-response': 'equipe de resposta da AWS durante um ataque e créditos para o custo gerado por ele',
    'inspect-vpc': 'inspecionar e filtrar o tráfego que entra e sai da VPC, inclusive por nome de domínio',
    'org-wide': 'aplicar as mesmas regras de proteção em todas as contas, inclusive nas novas',
    'instance-firewall': 'liberar numa instância só a porta que o balanceador usa',
    'deny-range': 'negar uma faixa de IP na sub-rede inteira',
    'cache-static': 'entregar arquivos estáticos perto do usuário, guardados em cache',
    'static-ips': 'dois IPs fixos globais, para TCP e UDP, com troca rápida de Região na falha',
    'share-service': 'oferecer um serviço a outra conta sem abrir a VPC, mesmo com blocos sobrepostos',
    'hub-many': 'ligar dezenas de VPCs e a rede da empresa num ponto central',
    'two-vpcs': 'ligar duas VPCs entre si',
    's3-private': 'chegar ao S3 a partir da VPC sem NAT e sem custo de processamento',
    'office-fast': 'ligar o escritório à VPC com criptografia ainda nesta semana',
    'outbound-only': 'deixar instâncias privadas baixarem atualizações sem receber conexões de fora',
  },
  options: {
    waf: { name: 'AWS WAF', summary: 'Regras sobre requisições HTTP(S), inclusive grupos gerenciados contra injeção de SQL e XSS e regras por taxa.', meets: ['block-sqli', 'rate-limit'], limits: ['Só vê requisições web, no CloudFront, no ALB, no API Gateway e em outros recursos associados.'], complexity: 2 },
    'shield-standard': { name: 'Shield Standard', summary: 'Proteção automática e sem custo extra contra os ataques DDoS de rede e de transporte mais comuns.', meets: ['ddos-basic'], limits: ['Não inclui a equipe de resposta nem créditos de custo.'], complexity: 1 },
    'shield-advanced': { name: 'Shield Advanced', summary: 'Assinatura com detecção ampliada, mitigação na camada de aplicação, equipe de resposta (SRT) e créditos de custo.', meets: ['ddos-basic', 'ddos-response'], limits: ['Tem mensalidade, e a SRT exige plano de suporte Business ou Enterprise.'], complexity: 4 },
    'network-firewall': { name: 'AWS Network Firewall', summary: 'Firewall gerenciado com estado e IPS na borda da VPC, com regras Suricata e filtro por domínio.', meets: ['inspect-vpc'], limits: ['Exige sub-redes do firewall e rotas que passem por ele.'], complexity: 3 },
    'firewall-manager': { name: 'AWS Firewall Manager', summary: 'Aplica regras de WAF, Shield Advanced, security groups e Network Firewall em toda a organização.', meets: ['org-wide'], limits: ['Exige o AWS Organizations e cobra pelos serviços que gerencia.'], complexity: 4 },
    'security-group': { name: 'Security group', summary: 'Firewall com estado de cada recurso, só com regras de permissão.', meets: ['instance-firewall'], limits: ['Não tem regra de negação.'], complexity: 1 },
    nacl: { name: 'Network ACL', summary: 'Regras sem estado na sub-rede, que permitem e negam, em ordem numérica.', meets: ['deny-range'], limits: ['Sem estado: a resposta precisa de regra própria.'], complexity: 1.5 },
    cloudfront: { name: 'Amazon CloudFront', summary: 'Rede de entrega de conteúdo com cache nos pontos de presença.', meets: ['cache-static'], limits: ['Trabalha com HTTP e HTTPS.'], complexity: 2 },
    'global-accelerator': { name: 'AWS Global Accelerator', summary: 'Dois IPs anycast fixos que levam TCP e UDP pela rede da AWS até o endpoint saudável.', meets: ['static-ips'], limits: ['Não guarda nada em cache.'], complexity: 2.5 },
    privatelink: { name: 'AWS PrivateLink (serviço de endpoint)', summary: 'O serviço fica atrás de um Network Load Balancer, e quem consome cria um endpoint de interface.', meets: ['share-service'], limits: ['A conexão é iniciada só por quem consome o serviço.'], complexity: 3 },
    'transit-gateway': { name: 'AWS Transit Gateway', summary: 'Roteador regional que liga VPCs, VPNs e o Direct Connect, com tabelas de rotas próprias.', meets: ['hub-many', 'two-vpcs'], limits: ['Cobra por hora de cada anexo e por GB processado.'], complexity: 3 },
    peering: { name: 'VPC peering', summary: 'Conexão direta entre duas VPCs, sem custo por hora.', meets: ['two-vpcs'], limits: ['Não é transitivo e não aceita blocos sobrepostos.'], complexity: 1.5 },
    'gateway-endpoint': { name: 'Endpoint de gateway', summary: 'Rota da VPC para o S3 ou o DynamoDB, sem custo extra.', meets: ['s3-private'], limits: ['Só para S3 e DynamoDB, e não atende a rede da empresa.'], complexity: 1 },
    'site-to-site-vpn': { name: 'Site-to-Site VPN', summary: 'Túneis IPsec criptografados pela internet, prontos em pouco tempo.', meets: ['office-fast'], limits: ['Passa pela internet, com latência variável.'], complexity: 2 },
    'nat-gateway': { name: 'NAT Gateway', summary: 'Deixa recursos privados iniciarem conexões para fora, sem aceitar conexões vindas de fora.', meets: ['outbound-only'], limits: ['Cobra por hora e por GB processado.'], complexity: 2 },
  },
}

export type NetChooserLabConfig = ChoiceLabConfig
export type NetChooserLabResponse = ChoiceLabResponse

export const netChooserSolution = (c: NetChooserLabConfig) => choiceSolution(NET_OPTIONS, c)
export const evaluateNetChooserLab = (c: NetChooserLabConfig, r: NetChooserLabResponse) => evaluateChoiceLab(NET_OPTIONS, c, r)
