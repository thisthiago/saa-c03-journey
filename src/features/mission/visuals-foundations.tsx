/** Visuais didáticos da trilha AWS Foundations. Os dados vêm dos mesmos catálogos usados pelos simuladores. */
import { ArrowRight, Building2, Database, Factory, Globe, HardDrive, MapPin, RadioTower, Server, User, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { REGION_FACTS, REGIONS_VERIFIED_AT, type RegionFact } from '../../simulators/regions/catalog'
import { LAYER_LABEL, OWNER_LABEL, SERVICE_INFO, SRM_MATRIX, type SrmLayer, type SrmService } from '../../simulators/responsibility/model'
import { formatMinutes, PLAN_ORDER, PLANS } from '../../simulators/support/model'
import base from './visuals.module.css'
import s from './visuals-foundations.module.css'

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className={base.frame} role="img" aria-label={label}>
      {children}
    </figure>
  )
}

export function GlobalHierarchy() {
  return (
    <Frame label="Hierarquia da infraestrutura: uma Região contém três ou mais Zonas de Disponibilidade, cada uma com um ou mais data centers. Local Zones, Wavelength Zones e Outposts são extensões da Região. A borda (POPs e Regional Edge Caches) fica à parte e não executa a aplicação inteira.">
      <div className={s.hier}>
        <div className={s.region}>
          <span className={s.tag}>Região</span>
          <div className={s.azRow}>
            {['a', 'b', 'c'].map((az) => (
              <div key={az} className={s.az}>
                <strong>AZ {az}</strong>
                <span className={s.dcs}>
                  <Building2 size={14} aria-hidden="true" />
                  <Building2 size={14} aria-hidden="true" />
                </span>
                <small>1+ data centers</small>
              </div>
            ))}
          </div>
        </div>
        <div className={s.exts}>
          <div className={s.ext}>
            <MapPin size={16} aria-hidden="true" /> <strong>Local Zone</strong>
            <small>perto de uma metrópole</small>
          </div>
          <div className={s.ext}>
            <RadioTower size={16} aria-hidden="true" /> <strong>Wavelength Zone</strong>
            <small>na rede 5G da operadora</small>
          </div>
          <div className={s.ext}>
            <Factory size={16} aria-hidden="true" /> <strong>Outposts</strong>
            <small>no local do cliente</small>
          </div>
          <span className={s.extNote}>extensões da Região: são gerenciadas a partir dela</span>
        </div>
        <div className={s.edge}>
          <Globe size={16} aria-hidden="true" /> <strong>Borda: POPs (edge locations) e Regional Edge Caches</strong>
          <small>CloudFront, Route 53 e Global Accelerator — entregam e encaminham; não são Região nem AZ</small>
        </div>
      </div>
    </Frame>
  )
}

export function RegionMap() {
  const areas: RegionFact['area'][] = ['Américas', 'Europa', 'Ásia-Pacífico', 'Oriente Médio e África']
  return (
    <Frame label={`Mapa esquemático das ${REGION_FACTS.length} Regiões AWS em ${REGIONS_VERIFIED_AT}, agrupadas por área, com número de AZs e indicação de Regiões opt-in.`}>
      <div className={s.mapGrid}>
        {areas.map((a) => (
          <div key={a} className={s.area}>
            <strong>{a}</strong>
            <ul>
              {REGION_FACTS.filter((r) => r.area === a).map((r) => (
                <li key={r.code} data-optin={r.optIn} title={r.name}>
                  <code>{r.code}</code>
                  <span>{r.azs} AZs</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <small className={base.caption}>
        {REGION_FACTS.length} Regiões em {REGIONS_VERIFIED_AT}. Tracejado = opt-in (precisa ser habilitada). Fonte: lista de Regiões da AWS.
      </small>
    </Frame>
  )
}

export function AzIsolation() {
  return (
    <Frame label="Três AZs com energia e rede próprias, ligadas por fibra redundante de baixa latência. Quando a AZ b falha, as AZs a e c continuam operando.">
      <div className={s.azRow}>
        {['a', 'b', 'c'].map((az) => (
          <div key={az} className={s.az} data-failed={az === 'b'}>
            <strong>AZ {az}</strong>
            <span className={s.dcs}>
              <Zap size={14} aria-hidden="true" /> energia própria
            </span>
            <span className={s.dcs}>
              <Server size={14} aria-hidden="true" /> rede própria
            </span>
            <small>{az === 'b' ? 'falhou' : 'continua'}</small>
          </div>
        ))}
      </div>
      <small className={base.caption}>Até ~100 km entre AZs; perto o bastante para replicação síncrona com latência de um dígito em ms.</small>
    </Frame>
  )
}

export function EdgeFlow() {
  const steps: [ReactNode, string, string][] = [
    [<User key="u" size={18} aria-hidden="true" />, 'Usuário', 'o DNS indica o POP mais rápido para ele'],
    [<Globe key="g" size={18} aria-hidden="true" />, 'POP (edge location)', 'se já tem uma cópia, responde na hora'],
    [<HardDrive key="h" size={18} aria-hidden="true" />, 'Regional Edge Cache', 'consultado quando o POP não tem a cópia'],
    [<Database key="d" size={18} aria-hidden="true" />, 'Origem (ex.: S3)', 'só é acionada se nenhum cache tem a cópia; a resposta fica guardada nos dois'],
  ]
  return (
    <Frame label="Fluxo do CloudFront: o usuário chega ao POP; se o objeto não estiver lá, o POP pergunta ao Regional Edge Cache; se também não estiver, o pedido vai à origem e a resposta é guardada no REC e no POP.">
      <ol className={s.flow}>
        {steps.map(([icon, title, note], i) => (
          <li key={title}>
            <span className={s.node}>
              {icon}
              <strong>{title}</strong>
              <small>{note}</small>
            </span>
            {i < steps.length - 1 && <ArrowRight className={s.arrow} size={16} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <small className={base.caption}>POST, PUT, DELETE e conteúdo dinâmico vão do POP direto à origem.</small>
    </Frame>
  )
}

export function SrmStack() {
  const services: SrmService[] = ['ec2', 'rds', 'lambda', 's3']
  const layers = Object.keys(SRM_MATRIX) as SrmLayer[]
  return (
    <Frame label="Pilha de responsabilidades por serviço: as camadas físicas são da AWS em todos; dados, IAM e rede do cliente são do cliente em todos; sistema operacional e plataforma são do cliente no EC2, compartilhados no RDS e da AWS no Lambda e no S3.">
      <div className={s.srm} style={{ ['--cols' as string]: services.length }}>
        <span />
        {services.map((sv) => (
          <strong key={sv} className={s.srmHead}>
            {SERVICE_INFO[sv].name.replace('Amazon ', '').replace('AWS ', '')}
          </strong>
        ))}
        {layers.map((l) => (
          <div key={l} className={s.srmRow}>
            <span className={s.srmLayer}>{LAYER_LABEL[l]}</span>
            {services.map((sv) => (
              <span key={sv} className={s.srmCell} data-owner={SRM_MATRIX[l][sv].owner}>
                {OWNER_LABEL[SRM_MATRIX[l][sv].owner]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function SupportLadder() {
  return (
    <Frame label="Os quatro planos vigentes do AWS Support em 18/10/2026, do Basic ao Unified Operations, com casos técnicos, resposta para sistema crítico e TAM.">
      <ol className={s.ladder}>
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id]
          return (
            <li key={id}>
              <strong>{p.name}</strong>
              <small>{p.technicalCases ? 'casos técnicos 24/7' : 'sem casos técnicos'}</small>
              <small>sistema crítico: {formatMinutes(p.response.critical)}</small>
              <small>{p.tam === 'designated' ? 'TAM designado' : 'sem TAM'}</small>
              <small>{p.pricing ? `a partir de US$ ${p.pricing.minimum.toLocaleString('pt-BR')}/mês` : 'incluído'}</small>
            </li>
          )
        })}
      </ol>
      <small className={base.caption}>Planos e preços conferidos em 18/10/2026. Developer, Business e Enterprise On-Ramp estão sendo descontinuados.</small>
    </Frame>
  )
}
