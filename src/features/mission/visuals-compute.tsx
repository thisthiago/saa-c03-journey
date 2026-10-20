/** Visuais didáticos da trilha Computação na AWS, calculados pelos simuladores sempre que possível. */
import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { computePrices, instancePrice, usd } from '../../simulators/compute-prices'
import { VOLUME_SPECS, VOLUME_TYPES } from '../../simulators/ebs/model'
import { OPTIONS as PURCHASE, SPOT_DISCOUNT } from '../../simulators/purchase/model'
import { distribute } from '../../simulators/loadbalancer/model'
import { ACTION_LABEL, ASPECT_LABEL, OPTION_LABEL, parseInstanceType, stateEffects, type Aspect, type InstanceAction } from '../../simulators/instances/model'
import base from './visuals.module.css'
import s from './visuals-compute.module.css'

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className={base.frame} role="img" aria-label={label}>
      {children}
    </figure>
  )
}

const ACTIONS: InstanceAction[] = ['reboot', 'stop', 'hibernate', 'terminate']
const ASPECTS: Aspect[] = ['instance-store', 'ram', 'public-ip', 'elastic-ip', 'root-volume', 'data-volume']
/** Rótulos curtos, para a tabela caber numa carta estreita. */
const SHORT: Partial<Record<Aspect, string>> = { 'instance-store': 'Instance store', ram: 'RAM', 'public-ip': 'IPv4 público', 'elastic-ip': 'Elastic IP', 'root-volume': 'Volume raiz', 'data-volume': 'Volume de dados' }

export function InstanceLifecycle() {
  const rows = ASPECTS.map((a) => ({ a, cells: ACTIONS.map((act) => stateEffects(act)[a].kept) }))
  const label = rows.map((r) => `${ASPECT_LABEL[r.a]}: ${ACTIONS.map((act, i) => `${ACTION_LABEL[act]} ${r.cells[i] ? 'preserva' : 'perde'}`).join(', ')}`).join('. ')
  return (
    <Frame label={`O que sobrevive a cada ação. ${label}.`}>
      <div className={s.scroll}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th scope="col" className={s.sr}>Item</th>
              {ACTIONS.map((a) => (
                <th key={a} scope="col">
                  {ACTION_LABEL[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.a}>
                <th scope="row">{SHORT[r.a] ?? ASPECT_LABEL[r.a]}</th>
                {r.cells.map((kept, i) => (
                  <td key={ACTIONS[i]} className={kept ? s.kept : s.lost}>
                    {kept ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small className={base.caption}>Volume raiz e volumes de dados com a configuração padrão (DeleteOnTermination só no raiz). O Elastic IP desassociado no terminate continua alocado e cobrado.</small>
    </Frame>
  )
}

export function InstanceName() {
  const p = parseInstanceType('c7gn.xlarge')
  return (
    <Frame label="Leitura do nome c7gn.xlarge: c é a série, otimizada para computação; 7 é a geração; g e n são as opções, processador Graviton e rede otimizada; xlarge é o tamanho.">
      <div className={s.name}>
        <div className={s.part}>
          <code>{p.series}</code>
          <span>série</span>
          <small>{p.seriesLabel.toLowerCase()}</small>
        </div>
        <div className={s.part} data-tone="info">
          <code>{p.generation}</code>
          <span>geração</span>
          <small>quanto maior, mais nova</small>
        </div>
        <div className={s.part} data-tone="success">
          <code>{p.options.join('')}</code>
          <span>opções</span>
          <small>{p.options.map((o) => OPTION_LABEL[o]).join(' e ')}</small>
        </div>
        <div className={s.part} data-tone="mastery">
          <code>.{p.size}</code>
          <span>tamanho</span>
          <small>nano, micro… large, xlarge, 2xlarge… metal</small>
        </div>
      </div>
    </Frame>
  )
}

export function EbsTypes() {
  const p = computePrices().ebs
  const price: Record<string, number> = { gp3: p.gp3.gbMonth, gp2: p.gp2.gbMonth, io2: p.io2.gbMonth, io1: p.io1.gbMonth, st1: p.st1.gbMonth, sc1: p.sc1.gbMonth }
  const tone: Record<string, string> = { gp3: 'success', gp2: 'info', io2: 'mastery', io1: 'mastery', st1: 'accent', sc1: 'accent' }
  return (
    <Frame label={`Tipos de volume EBS: ${VOLUME_TYPES.map((t) => `${t}, ${VOLUME_SPECS[t].family}, até ${VOLUME_SPECS[t].maxIops} IOPS e ${VOLUME_SPECS[t].maxThroughput} MiB/s, ${VOLUME_SPECS[t].boot ? 'serve de boot' : 'não serve de boot'}`).join('; ')}.`}>
      <div className={s.boxes}>
        {VOLUME_TYPES.map((t) => {
          const v = VOLUME_SPECS[t]
          return (
            <div key={t} className={s.box} data-tone={tone[t]}>
              <strong>
                {t} · {v.family}
              </strong>
              <span>
                até {v.maxIops.toLocaleString('pt-BR')} IOPS · {v.maxThroughput.toLocaleString('pt-BR')} MiB/s
              </span>
              <small>
                {usd(price[t])} por GiB-mês{v.boot ? '' : ' · não serve de boot'}
                {v.multiAttach ? ' · Multi-Attach' : ''}
              </small>
            </div>
          )
        })}
      </div>
      <small className={base.caption}>SSD (gp3, gp2, io2, io1) para muitas operações pequenas; HDD (st1, sc1) para leitura sequencial de blocos grandes. Preços de us-east-1 na tabela da trilha.</small>
    </Frame>
  )
}

export function PurchaseOptions() {
  const p = instancePrice('m7g.large')
  const rows: [string, number, string][] = [
    [PURCHASE['on-demand'].short, p.onDemandHour, 'sem compromisso'],
    [PURCHASE['compute-sp-1yr'].short, p.savingsPlanHour['compute-1yr'], 'qualquer família, Região, Fargate e Lambda'],
    [PURCHASE['compute-sp-3yr'].short, p.savingsPlanHour['compute-3yr'], 'idem, por 3 anos'],
    [PURCHASE['ec2-sp-3yr'].short, p.savingsPlanHour['ec2instance-3yr'], 'presa à família m7g na Região'],
    [PURCHASE.spot.short, p.onDemandHour * (1 - SPOT_DISCOUNT), 'pode ser interrompida · desconto de premissa'],
  ]
  return (
    <Frame label={`Preço por hora de uma m7g.large em us-east-1: ${rows.map(([n, v, w]) => `${n} ${usd(v)} (${w})`).join('; ')}.`}>
      <div className={s.boxes}>
        {rows.map(([n, v, w], i) => (
          <div key={n} className={s.box} data-tone={i === 0 ? 'info' : i === rows.length - 1 ? 'danger' : 'success'}>
            <strong>{n}</strong>
            <span>
              {usd(v)}/h · {Math.round((1 - v / p.onDemandHour) * 100)}% abaixo do On-Demand
            </span>
            <small>{w}</small>
          </div>
        ))}
      </div>
      <small className={base.caption}>m7g.large, Linux, us-east-1, sem pagamento antecipado (tabela da trilha). Compromissos são cobrados todas as horas do prazo.</small>
    </Frame>
  )
}

const pctBr = (v: number) => `${(Math.round(v * 10000) / 100).toLocaleString('pt-BR')}%`

export function ElbCrossZone() {
  const on = distribute({ a: 2, b: 8 }, true)
  const off = distribute({ a: 2, b: 8 }, false)
  return (
    <Frame label={`Exemplo da documentação: 2 alvos na AZ a e 8 na AZ b. Com cross-zone, cada alvo recebe ${pctBr(on.a)}. Sem cross-zone, cada alvo da AZ a recebe ${pctBr(off.a)} e cada alvo da AZ b recebe ${pctBr(off.b)}.`}>
      <div className={s.boxes}>
        {(['a', 'b'] as const).map((az) => (
          <div key={az} className={s.box} data-tone={az === 'a' ? 'info' : 'mastery'}>
            <strong>
              AZ {az} · {az === 'a' ? 2 : 8} alvos · nó com 50% do tráfego
            </strong>
            <span>com cross-zone: {pctBr(on[az])} por alvo</span>
            <span>sem cross-zone: {pctBr(off[az])} por alvo</span>
          </div>
        ))}
      </div>
      <small className={base.caption}>Cross-zone: sempre ligado no ALB, desligado por padrão no NLB e no GWLB.</small>
    </Frame>
  )
}

const RULES: [string, string, string][] = [
  ['10', 'host admin.loja.com e IP do escritório', 'painel'],
  ['20', 'host admin.loja.com', 'responder 403'],
  ['30', 'caminho /api/*', 'API'],
  ['padrão', 'nenhuma regra casou', 'site'],
]

export function AlbRules() {
  return (
    <Frame label={`Regras de um listener do ALB, avaliadas da menor prioridade para a maior: ${RULES.map(([p, c, a]) => `prioridade ${p}, ${c}, ${a}`).join('; ')}. A primeira que casa decide.`}>
      <ol className={s.rules}>
        {RULES.map(([p, cond, act]) => (
          <li key={p}>
            <code>{p}</code>
            <span>{cond}</span>
            <strong>{act}</strong>
          </li>
        ))}
      </ol>
      <small className={base.caption}>A primeira regra que casa decide. Todas as condições de uma regra precisam casar; a regra padrão vem por último.</small>
    </Frame>
  )
}

const LOOP = [
  ['Métrica', 'o CloudWatch agrega a métrica de todas as instâncias do grupo'],
  ['Política', 'target tracking, step ou simple calcula a capacidade desejada'],
  ['Limites', 'o resultado fica entre o min e o max do grupo'],
  ['Ação', 'o grupo lança instâncias pelo launch template ou encerra as que sobram'],
  ['Saúde', 'instâncias doentes (EC2 ou ELB) são substituídas'],
]

export function AsgLoop() {
  return (
    <Frame label={`Ciclo do Auto Scaling: ${LOOP.map(([t, d]) => `${t}: ${d}`).join('; ')}.`}>
      <ol className={s.rules}>
        {LOOP.map(([t, d], i) => (
          <li key={t}>
            <code>{i + 1}</code>
            <strong>{t}</strong>
            <span>{d}</span>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

export function LambdaConcurrency() {
  const rows: [string, string, string][] = [
    ['Reservada', 'garantia e teto da função', 'gratuita'],
    ['Provisionada', 'ambientes já inicializados: sem cold start', 'cobrada o mês inteiro'],
    ['Sem reserva', 'divide o resto da conta com as outras funções', 'pode sofrer throttling'],
  ]
  return (
    <Frame label={`Concorrência é requisições por segundo vezes a duração; a conta tem 1.000 por padrão. ${rows.map(([a, b, c]) => `${a}: ${b}, ${c}`).join('. ')}.`}>
      <p className={s.formula}>
        concorrência = requisições por segundo × duração · <strong>1.000</strong> por Região, para todas as funções
      </p>
      <div className={s.boxes}>
        {rows.map(([name, what, cost], i) => (
          <div key={name} className={s.box} data-tone={['success', 'mastery', 'info'][i]}>
            <strong>{name}</strong>
            <span>{what}</span>
            <small>{cost}</small>
          </div>
        ))}
      </div>
      <small className={base.caption}>Até 900 podem ser reservados: 100 ficam sempre para as funções sem reserva. A provisionada não passa da reservada.</small>
    </Frame>
  )
}

export function EcsRoles() {
  return (
    <Frame label="As duas roles de uma task do ECS. A execution role é usada pelo agente do ECS e do Fargate para puxar a imagem do ECR, enviar logs e ler segredos. A task role é usada pelo código da aplicação para chamar serviços como S3 e DynamoDB.">
      <div className={s.boxes}>
        <div className={s.box} data-tone="info">
          <strong>Execution role</strong>
          <span>usada pelo agente do ECS ou do Fargate</span>
          <small>puxar a imagem do ECR · enviar logs · ler segredos da task definition</small>
        </div>
        <div className={s.box} data-tone="success">
          <strong>Task role</strong>
          <span>usada pelo código dentro do contêiner</span>
          <small>ler o bucket · gravar na tabela · qualquer chamada da aplicação</small>
        </div>
      </div>
      <small className={base.caption}>As duas confiam em ecs-tasks.amazonaws.com. As credenciais da execution role não chegam ao código.</small>
    </Frame>
  )
}

const SPECTRUM_COLS = ['EC2', 'ECS em EC2', 'Fargate', 'Lambda']
const SPECTRUM_ROWS: { label: string; cells: [string, string, string, string] }[] = [
  { label: 'Hardware e virtualização', cells: ['AWS', 'AWS', 'AWS', 'AWS'] },
  { label: 'Sistema operacional e patches', cells: ['Você', 'Você', 'AWS', 'AWS'] },
  { label: 'Servidores para escalar', cells: ['Você', 'Você', 'nenhum', 'nenhum'] },
  { label: 'Aplicação e código', cells: ['Você', 'Você', 'Você', 'Você'] },
  { label: 'Duração máxima', cells: ['sem limite', 'sem limite', 'sem limite', '15 min'] },
]

export function ComputeSpectrum() {
  const label = SPECTRUM_ROWS.map((r) => `${r.label}: ${SPECTRUM_COLS.map((c, i) => `${c}, ${r.cells[i]}`).join('; ')}`).join('. ')
  return (
    <Frame label={`Do servidor à função: quem cuida de cada parte. ${label}.`}>
      <div className={s.scroll}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th scope="col" className={s.sr}>Parte</th>
              {SPECTRUM_COLS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPECTRUM_ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.cells.map((v, i) => (
                  <td key={SPECTRUM_COLS[i]} className={v === 'Você' ? s.you : undefined}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small className={base.caption}>Da esquerda para a direita, você administra menos e aceita mais limites. Escolha o ponto mais à direita que ainda atende aos requisitos.</small>
    </Frame>
  )
}
