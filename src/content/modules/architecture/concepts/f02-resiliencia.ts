/**
 * Conceitos da Fase 2 — Arquiteturas resilientes. Reaproveita infra.spof,
 * infra.multi-az, infra.static-stability, infra.nat-zonal-regional,
 * infra.rds-multi-az e infra.alb-zones (Foundations), asg.group e
 * elb.health-checks (Computação), rds.proxy (Bancos de dados),
 * dns.health-checks (Redes), ops.service-quotas (Monitoramento e governança) e
 * int.sync-async e int.write-buffer (Integração).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F02_ARQ_CONCEPTS: ConceptDef[] = [
  {
    id: 'res.horizontal-scaling',
    title: 'Escalar na horizontal × na vertical',
    officialName: 'Scale horizontally to increase aggregate workload availability',
    serviceIds: ['aws.ec2', 'aws.elb'],
    summary: 'Escalar na **vertical** é trocar a instância por uma maior; na **horizontal**, é somar instâncias atrás de um balanceador. O pilar de confiabilidade recomenda **vários recursos pequenos** no lugar de um grande: uma falha derruba só uma parte, e a capacidade cresce sem parar a aplicação.',
    comparisons: [{ with: 'infra.static-stability', text: 'Com várias instâncias em várias AZs, a sobra de capacidade fica distribuída, e a perda de uma zona não esgota o que resta.' }],
    commonMistakes: ['Resolver a falta de capacidade com uma instância cada vez maior, que continua sendo um ponto único de falha', 'Escalar na horizontal uma aplicação que guarda a sessão na memória de cada servidor'],
    facts: ['O princípio do pilar de confiabilidade é distribuir as requisições entre recursos menores que não compartilhem um ponto de falha comum.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinal: "aumentar a disponibilidade e a capacidade sem parar a aplicação". A resposta é escalar na horizontal: várias instâncias em várias AZs, atrás de um balanceador, com a sessão fora dos servidores.',
    },
    references: [R.relPrinciples],
    tags: ['disponibilidade'],
  },
  {
    id: 'res.graceful-degradation',
    title: 'Degradação controlada',
    officialName: 'Graceful degradation (REL05-BP01)',
    serviceIds: [],
    summary: 'Quando uma dependência falha, o componente continua fazendo a **função principal**, talvez com dados um pouco antigos, alternativos ou sem um pedaço da página. A dependência **forte** vira **fraca**: a vitrine sem recomendações ainda vende.',
    facts: ['Não seguir a boa prática REL05-BP01 tem risco alto.', 'Exemplos da AWS: mostrar o resto da página quando um sistema de recomendações cai, usar parâmetros padrão quando o repositório de parâmetros não responde e enfileirar gravações quando o banco primário está fora.'],
    recommendations: ['Teste o caminho degradado; ele precisa ser bem mais simples que o caminho normal.'],
    commonMistakes: ['Mostrar uma página de erro inteira porque um único componente secundário não respondeu'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.rel05bp01],
    tags: ['disponibilidade'],
  },
  {
    id: 'res.legacy-reliability',
    title: 'Confiabilidade sem mexer no código',
    officialName: 'Improving the reliability of a legacy application',
    serviceIds: ['aws.elb', 'aws.ec2', 'aws.rds', 'aws.route53'],
    summary: 'Quando a aplicação não pode ser alterada, a confiabilidade vem **de fora dela**: **balanceador** com health checks em várias AZs, **Auto Scaling** repondo instâncias doentes, banco **RDS Multi-AZ**, **RDS Proxy** segurando conexões no failover e **health checks do Route 53** para trocar de destino.',
    recommendations: ['Comece pelo que é ponto único de falha: uma instância só, um banco Single-AZ, um IP fixo no código.'],
    commonMistakes: ['Reescrever a aplicação quando a meta de disponibilidade pode ser atingida só com infraestrutura'],
    exam: { domains: ['d2'], relevance: 'alta', notes: 'O enunciado costuma dizer "sem alterar o código da aplicação" ou "com o menor esforço de desenvolvimento".' },
    references: [R.rel10bp01, R.rel05bp01],
    tags: ['disponibilidade'],
  },
  {
    id: 'res.data-plane',
    title: 'Plano de dados na recuperação',
    officialName: 'Rely on the data plane and not the control plane during recovery',
    serviceIds: ['aws.route53'],
    summary: 'O **plano de controle** configura recursos (criar, alterar, escalar); o **plano de dados** entrega o serviço em tempo real. Os planos de dados têm metas de disponibilidade maiores, então a recuperação deve depender deles: capacidade **já provisionada** e failover por **health checks do Route 53**, em vez de criar recursos na hora.',
    facts: ['Criar recursos pelo Auto Scaling durante a recuperação é uma operação de plano de controle: é um trade-off entre custo e resiliência.', 'As cotas da Região de recuperação precisam permitir escalar até a capacidade de produção.'],
    comparisons: [{ with: 'infra.static-stability', text: 'A estabilidade estática é aplicar esse princípio: a sobra já está rodando, e nada precisa ser criado durante a falha.' }],
    commonMistakes: ['Planejar o failover em cima de uma alteração manual de pesos do DNS, que é operação de plano de controle'],
    exam: { domains: ['d2'], relevance: 'baixa' },
    references: [R.drOptions, R.rel13bp02],
    tags: ['disponibilidade', 'recuperacao'],
  },
]
