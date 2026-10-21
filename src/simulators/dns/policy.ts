/**
 * Laboratório "A política certa": qual política de roteamento do Route 53
 * atende a cada requisito. Fatos em ./model.ts (conferidos em 21/10/2026);
 * a geoproximidade e a baseada em IP vêm da mesma página das políticas.
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const DNS_POLICIES: ChoiceCatalog = {
  needLabel: {
    single: 'um único recurso responde pelo nome',
    'split-percent': 'dividir o tráfego em proporções definidas',
    'lowest-latency': 'mandar cada usuário à Região com menor latência',
    'active-passive': 'usar o site de reserva só quando o principal ficar sem saúde',
    'by-country': 'responder conforme o país ou o continente do usuário',
    'by-resource-location': 'rotear pela distância até os recursos, podendo deslocar tráfego de um local para outro',
    'many-healthy': 'devolver vários endereços, só os saudáveis, sem balanceador de carga',
    'by-client-ip': 'rotear pela faixa de IP de onde vem a consulta',
  },
  options: {
    simple: { name: 'Simples', summary: 'Um registro para um recurso; não usa verificação de saúde.', meets: ['single'], limits: ['Não divide tráfego nem desvia de recursos sem saúde.'], complexity: 1 },
    weighted: { name: 'Ponderada', summary: 'Cada registro recebe o peso dividido pela soma dos pesos.', meets: ['split-percent', 'active-passive'], limits: ['Para ativo-passivo, só entra o peso zero quando todos os outros estão sem saúde.'], complexity: 2.5 },
    latency: { name: 'Latência', summary: 'Vence a Região com menor latência para o usuário.', meets: ['lowest-latency'], limits: ['Latência medida não é o mesmo que proximidade geográfica.'], complexity: 2 },
    failover: { name: 'Failover', summary: 'Primário e secundário: o secundário só responde quando o primário fica sem saúde.', meets: ['active-passive'], limits: ['Exige verificação de saúde no primário.'], complexity: 2 },
    geolocation: { name: 'Geolocalização', summary: 'Responde pelo local do usuário: país, continente ou registro padrão.', meets: ['by-country'], limits: ['Sem registro padrão, locais sem registro ficam sem resposta.'], complexity: 2 },
    geoproximity: { name: 'Geoproximidade', summary: 'Responde pela localização dos recursos e permite deslocar tráfego entre eles.', meets: ['by-resource-location'], limits: ['Mais trabalhosa de configurar que a geolocalização.'], complexity: 3 },
    multivalue: { name: 'Múltiplas respostas', summary: 'Devolve até oito registros saudáveis escolhidos ao acaso.', meets: ['many-healthy'], limits: ['Não substitui um balanceador de carga.'], complexity: 2 },
    'ip-based': { name: 'Baseada em IP', summary: 'Responde pela faixa de IP de origem da consulta, informada por você.', meets: ['by-client-ip'], limits: ['Exige conhecer e manter as faixas de IP dos usuários.'], complexity: 3 },
  },
}

export type DnsPolicyLabConfig = ChoiceLabConfig
export type DnsPolicyLabResponse = ChoiceLabResponse

export const dnsPolicySolution = (c: DnsPolicyLabConfig) => choiceSolution(DNS_POLICIES, c)
export const evaluateDnsPolicyLab = (c: DnsPolicyLabConfig, r: DnsPolicyLabResponse) => evaluateChoiceLab(DNS_POLICIES, c, r)
