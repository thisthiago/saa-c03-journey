/** Desafio final — A Revisão Well-Architected (empresa fictícia: EducaMais, plataforma de cursos on-line). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const EDUCAMAIS: ArchitectureLabConfig = {
  title: 'Relatório da Revisão Well-Architected da EducaMais',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços e as boas práticas foram conferidos na documentação da AWS em 22/10/2026.',
  steps: [
    {
      id: 'revisao',
      title: 'Revisão inicial e riscos prioritários',
      intro: 'A **EducaMais**, plataforma de cursos on-line, cresceu de mil para 400 mil alunos em dois anos, tudo numa única AZ. Não há plano de desastre, a conta da AWS triplicou, todos os desenvolvedores são administradores, e a secretaria acadêmica ainda roda em servidores no escritório. A diretoria pede por onde começar.',
      questions: [
        {
          id: 'comeco',
          prompt: 'Qual é o primeiro passo?',
          options: [
            { id: 'wa-review', label: 'Revisão na Well-Architected Tool, gravando um marco e atacando primeiro os riscos altos', scores: { requisitos: 1, resiliente: 1, seguro: 1 }, consequence: 'Os riscos ficam visíveis por pilar, e o progresso passa a ser medido em marcos.', concepts: ['wa.tool', 'wa.risks'] },
            { id: 'multi-regiao', label: 'Levar tudo para duas Regiões ativas de uma vez', scores: { requisitos: 0.3, resiliente: 0.7, seguro: 0.4 }, consequence: 'Dobra a conta antes de saber quais riscos importam, e os acessos amplos continuam.', whyNot: 'Começa pela solução, não pelos riscos.', concepts: ['wa.tradeoffs'] },
            { id: 'reescrever', label: 'Reescrever a plataforma em microsserviços antes de qualquer outra coisa', scores: { requisitos: 0.3, resiliente: 0.4, seguro: 0.4 }, consequence: 'Meses de trabalho enquanto a AZ única e os acessos amplos seguem como estão.', whyNot: 'Os riscos altos ficam para depois.', concepts: ['wa.risks'] },
          ],
        },
      ],
    },
    {
      id: 'ha',
      title: 'Alta disponibilidade',
      intro: 'A plataforma precisa de 6 instâncias atendendo nas provas e não pode cair com a queda de uma AZ. O banco PostgreSQL roda numa única instância, Single-AZ.',
      questions: [
        {
          id: 'zonas',
          prompt: 'Como organizar a aplicação e o banco?',
          options: [
            { id: 'multi-az', label: 'Grupo do Auto Scaling em 3 AZs com 9 instâncias atrás de um ALB, e RDS Multi-AZ', scores: { resiliente: 1, desempenho: 1, requisitos: 1, custo: 1 }, consequence: 'Perder uma AZ deixa 6 instâncias, e o standby do banco assume.', concepts: ['infra.static-stability', 'infra.rds-multi-az', 'res.horizontal-scaling'] },
            { id: 'maior', label: 'Uma instância bem maior e o banco Single-AZ', scores: { resiliente: 0.2, desempenho: 0.8, requisitos: 0.2, custo: 0.7 }, consequence: 'Continua tudo numa AZ, com dois pontos únicos de falha.', whyNot: 'Escalar na vertical não tira o ponto único.', concepts: ['res.horizontal-scaling', 'infra.spof'] },
            { id: 'sem-sobra', label: 'Grupo do Auto Scaling em 3 AZs com 6 instâncias, e RDS Multi-AZ', scores: { resiliente: 0.6, desempenho: 0.6, requisitos: 0.6, custo: 1 }, consequence: 'Sobrevive à queda, mas com 4 instâncias nas provas, até o Auto Scaling repor.', whyNot: 'Falta a sobra da estabilidade estática.', concepts: ['infra.static-stability'] },
          ],
        },
      ],
    },
    {
      id: 'dr',
      title: 'Recuperação de desastres',
      intro: 'Para a perda da Região, a diretoria aceita perder até 15 minutos de dados e ficar até 1 hora fora do ar. O orçamento é apertado.',
      questions: [
        {
          id: 'estrategia',
          prompt: 'Que estratégia usar?',
          options: [
            { id: 'pilot-light', label: 'Pilot light: réplica do banco em outra Região, backups copiados pelo AWS Backup e a aplicação recriada pelo CloudFormation', scores: { resiliente: 1, custo: 1, requisitos: 1 }, consequence: 'Cumpre 15 minutos e 1 hora com só o banco ligado na outra Região.', concepts: ['dr.pilot-light', 'dr.choose', 'bkp.copy'] },
            { id: 'backup-diario', label: 'Backups diários copiados para outra Região', scores: { resiliente: 0.4, custo: 1, requisitos: 0.3 }, consequence: 'Pode perder um dia de dados e levar horas para voltar.', whyNot: 'Não cumpre o RPO de 15 minutos.', concepts: ['dr.backup-restore'] },
            { id: 'ativo-ativo', label: 'Ativo-ativo em duas Regiões', scores: { resiliente: 1, custo: 0.3, requisitos: 0.7 }, consequence: 'Cumpre, mas paga a plataforma inteira duas vezes.', whyNot: 'Mais rígido e caro do que a meta pede.', concepts: ['dr.multi-site', 'dr.choose'] },
          ],
        },
      ],
    },
    {
      id: 'desempenho',
      title: 'Desempenho e cache',
      intro: 'As aulas em vídeo são assistidas no Brasil inteiro e em Portugal. A página de cada curso consulta o banco a cada visita, e o catálogo muda poucas vezes por dia.',
      questions: [
        {
          id: 'cache',
          prompt: 'Como acelerar vídeos e catálogo?',
          options: [
            { id: 'camadas', label: 'CloudFront na frente dos vídeos e ElastiCache na frente das consultas do catálogo', scores: { desempenho: 1, custo: 1, requisitos: 1 }, consequence: 'Os vídeos saem da borda, e o banco deixa de responder a mesma consulta milhares de vezes.', concepts: ['perf.cache-layers', 'edge.cloudfront'] },
            { id: 'banco-maior', label: 'Um banco maior e instâncias maiores', scores: { desempenho: 0.6, custo: 0.3, requisitos: 0.5 }, consequence: 'Paga mais para responder as mesmas consultas, e os vídeos continuam saindo da Região.', whyNot: 'O gargalo é distância e repetição, não tamanho.', concepts: ['perf.cache-layers'] },
            { id: 'so-replica', label: 'Uma réplica de leitura para o catálogo, sem CloudFront', scores: { desempenho: 0.6, custo: 0.7, requisitos: 0.6 }, consequence: 'Alivia o primário, mas os vídeos continuam longe de Portugal.', whyNot: 'Falta a borda para os vídeos.', concepts: ['perf.read-write-split'] },
          ],
        },
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança em camadas',
      intro: 'Todos os desenvolvedores são administradores na única conta, as instâncias usam chaves de acesso gravadas em arquivo e o banco aceita conexões de qualquer IP.',
      questions: [
        {
          id: 'camadas-seg',
          prompt: 'O que fazer?',
          options: [
            { id: 'base', label: 'Contas separadas por ambiente, IAM Identity Center com menor privilégio, roles nas instâncias, banco em sub-rede privada aceitando só a aplicação e WAF no ALB', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'Credenciais temporárias, acesso por função e uma camada de proteção em cada nível.', concepts: ['wa.sec-identity', 'sec.defense-in-depth', 'gov.account-structure'] },
            { id: 'senhas', label: 'Senhas fortes e MFA para os administradores, mantendo o resto', scores: { seguro: 0.4, requisitos: 0.4, resiliente: 0.8 }, consequence: 'As chaves no arquivo e o banco aberto continuam.', whyNot: 'Uma camada só, e as credenciais longas ficam.', concepts: ['wa.sec-identity'] },
            { id: 'cofre', label: 'Guardar as chaves das instâncias no Secrets Manager', scores: { seguro: 0.5, requisitos: 0.5, resiliente: 0.8 }, consequence: 'As chaves somem do arquivo, mas continuam longas, e o banco segue aberto.', whyNot: 'Role elimina a chave; o banco precisa sair da internet.', concepts: ['wa.sec-identity'] },
          ],
        },
      ],
    },
    {
      id: 'computacao',
      title: 'Custo de computação e armazenamento',
      intro: 'As instâncias usam, no pico de quatro semanas, 25% de CPU e 30% de memória. A transcodificação de vídeos roda à noite e pode recomeçar. A homologação é usada 45 horas por semana. Os vídeos antigos são vistos de forma imprevisível.',
      questions: [
        {
          id: 'compra',
          prompt: 'Como reduzir a conta?',
          options: [
            { id: 'mix', label: 'Um tamanho abaixo, Savings Plan para a base, Spot na transcodificação, homologação desligada fora do horário e S3 Intelligent-Tiering nos vídeos', scores: { custo: 1, desempenho: 1, requisitos: 1 }, consequence: 'Cada componente paga do jeito que combina com ele.', concepts: ['opt.rightsizing', 'opt.pricing-model', 'opt.schedule', 'sc.intelligent-tiering'] },
            { id: 'ri-tudo', label: 'Reserved Instances de 3 anos para todas as instâncias, inclusive a homologação', scores: { custo: 0.5, desempenho: 1, requisitos: 0.6 }, consequence: 'Paga 24 horas por dia uma homologação usada 45 horas por semana, e o tamanho continua errado.', whyNot: 'Compromisso sem dimensionar e sem olhar o uso.', concepts: ['opt.pricing-model'] },
            { id: 'metade', label: 'Reduzir todas as instâncias à metade da metade, sem olhar as métricas', scores: { custo: 0.8, desempenho: 0.3, requisitos: 0.3 }, consequence: 'Com 30% de memória no pico, dois tamanhos abaixo levam a 120%: a plataforma trava nas provas.', whyNot: 'O dimensionamento olha CPU e memória.', concepts: ['opt.rightsizing'] },
          ],
        },
      ],
    },
    {
      id: 'transferencia',
      title: 'Custo de transferência de dados',
      intro: 'As instâncias privadas mandam 10 TB de logs por mês para o S3 pelo NAT Gateway. Os alunos baixam 30 TB de material de apoio direto das instâncias.',
      questions: [
        {
          id: 'dados',
          prompt: 'Como cortar a transferência?',
          options: [
            { id: 'endpoints', label: 'Endpoint de gateway do S3 para os logs e CloudFront na frente do material de apoio', scores: { custo: 1, desempenho: 1, requisitos: 1, resiliente: 1 }, consequence: 'O processamento do NAT some dos logs, e o material sai da borda, mais barato e mais perto.', concepts: ['opt.transfer-reduce', 'pl.gateway-endpoint'] },
            { id: 'uma-az', label: 'Juntar tudo numa AZ para não pagar transferência entre zonas', scores: { custo: 0.7, desempenho: 0.8, requisitos: 0.3, resiliente: 0.2 }, consequence: 'Economiza pouco e desfaz a alta disponibilidade.', whyNot: 'O custo maior é o NAT e a saída para a internet.', concepts: ['opt.transfer-pricing'] },
            { id: 'nat-por-az', label: 'Um NAT Gateway por AZ', scores: { custo: 0.4, resiliente: 1, requisitos: 0.5, desempenho: 1 }, consequence: 'Melhora a disponibilidade do NAT, mas cada GB de log continua pagando processamento.', whyNot: 'Não muda o caminho dos dados.', concepts: ['pl.nat-vs-endpoint'] },
          ],
        },
      ],
    },
    {
      id: 'migracao',
      title: 'Migração do legado',
      intro: 'A secretaria acadêmica roda em quatro servidores Windows no escritório, que vai fechar em três meses. O fornecedor não altera o sistema, e a secretaria aceita parar só alguns minutos.',
      questions: [
        {
          id: 'legado',
          prompt: 'Como levar a secretaria?',
          options: [
            { id: 'mgn', label: 'Rehost com o AWS Transform MGN, testando as instâncias antes do corte', scores: { requisitos: 1, resiliente: 1, custo: 1 }, consequence: 'Os servidores vão como estão, com parada de minutos, e a modernização fica para depois.', concepts: ['mig.rehost', 'mig.mgn', 'mig.mgn-lifecycle'] },
            { id: 'refactor', label: 'Reescrever a secretaria em serviços antes de migrar', scores: { requisitos: 0.2, resiliente: 0.6, custo: 0.5 }, consequence: 'Três meses não bastam, e o fornecedor não altera o sistema.', whyNot: 'Refactor não cabe no prazo nem na restrição.', concepts: ['mig.refactor'] },
            { id: 'retain', label: 'Manter os servidores no escritório', scores: { requisitos: 0.1, resiliente: 0.3, custo: 0.6 }, consequence: 'O escritório fecha, e a secretaria fica sem casa.', whyNot: 'Retain não serve quando o local vai fechar.', concepts: ['mig.retain'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'uma-zona',
      when: [
        ['zonas', ['maior']],
        ['dados', ['uma-az']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Instância única e tudo numa AZ: a primeira falha de zona tira a plataforma do ar nas provas.',
      concepts: ['infra.spof', 'opt.transfer-pricing'],
    },
    {
      id: 'conta-dobrada',
      when: [
        ['estrategia', ['ativo-ativo']],
        ['compra', ['ri-tudo']],
      ],
      penalty: { custo: 0.3 },
      message: 'Duas Regiões ativas e compromissos de 3 anos para tudo: a conta cresce em vez de cair, que era o pedido da diretoria.',
      concepts: ['dr.choose', 'opt.pricing-model'],
    },
    {
      id: 'sem-revisao',
      when: [
        ['comeco', ['multi-regiao', 'reescrever']],
        ['camadas-seg', ['senhas', 'cofre']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Sem revisão dos riscos e com credenciais longas: o risco alto mais comum da empresa segue aberto.',
      concepts: ['wa.risks', 'wa.sec-identity'],
    },
  ],
}

export const FINAL_ARQ: PhaseDef = {
  ...META.final,
  concepts: [
    'wa.tool',
    'wa.risks',
    'wa.tradeoffs',
    'infra.static-stability',
    'infra.rds-multi-az',
    'res.horizontal-scaling',
    'infra.spof',
    'dr.pilot-light',
    'dr.choose',
    'dr.backup-restore',
    'dr.multi-site',
    'bkp.copy',
    'perf.cache-layers',
    'edge.cloudfront',
    'perf.read-write-split',
    'wa.sec-identity',
    'sec.defense-in-depth',
    'gov.account-structure',
    'opt.rightsizing',
    'opt.pricing-model',
    'opt.schedule',
    'sc.intelligent-tiering',
    'opt.transfer-reduce',
    'opt.transfer-pricing',
    'pl.gateway-endpoint',
    'pl.nat-vs-endpoint',
    'mig.rehost',
    'mig.mgn',
    'mig.mgn-lifecycle',
    'mig.refactor',
    'mig.retain',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa, os números e os sistemas são fictícios.'],
  missions: [
    {
      id: 'arq.final.revisao',
      title: 'A Revisão Well-Architected da EducaMais',
      type: 'final',
      summary: 'Oito etapas que cruzam todas as trilhas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'EducaMais',
        role: 'Você conduz a revisão de arquitetura de uma plataforma de cursos que cresceu rápido demais.',
        situation: 'Tudo roda numa AZ, não há plano de desastre, a conta triplicou, todos são administradores, os vídeos demoram fora de São Paulo e a secretaria acadêmica está num escritório que vai fechar.',
        objective: 'Escolher, etapa por etapa, decisões que funcionem juntas nos quatro domínios do exame.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'wa.tradeoffs', body: ['Cada decisão pesa nas outras: economizar juntando tudo numa AZ desfaz a disponibilidade; duas Regiões ativas com compromissos para tudo aumentam a conta. O relatório aponta esses conflitos.'] },
        { conceptId: 'wa.risks' },
      ],
      activities: [
        {
          id: 'arq.final.revisao.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'A Revisão Well-Architected',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'wa.risks' }, { id: 'infra.static-stability' }, { id: 'dr.choose' }, { id: 'perf.cache-layers' }, { id: 'wa.sec-identity' }, { id: 'opt.pricing-model' }, { id: 'opt.transfer-reduce' }, { id: 'mig.mgn' }],
          xp: 350,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada etapa tem um requisito no enunciado que elimina uma ou duas opções.', 'A opção certa atende à meta sem ir além dela.'],
          explanation: [
            'Projeto de referência: revisão na Well-Architected Tool; 9 instâncias em 3 AZs com RDS Multi-AZ; pilot light; CloudFront e ElastiCache; contas separadas, Identity Center, roles, banco privado e WAF.',
            'Um tamanho abaixo, Savings Plan, Spot, homologação desligada e Intelligent-Tiering; endpoint de gateway e CloudFront; rehost da secretaria com o MGN.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: EDUCAMAIS,
        },
      ],
      debrief: { takeaways: ['Comece pelos riscos, não pelas soluções.', 'A decisão certa atende ao requisito sem ir além dele.', 'Disponibilidade, recuperação, desempenho, segurança, custo e migração se cruzam.'] },
    },
  ],
}
