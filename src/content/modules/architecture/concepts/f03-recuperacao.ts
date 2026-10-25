/**
 * Conceitos da Fase 3 — Recuperação de desastres. Reaproveita dr.rpo-rto (S3
 * Expedition), infra.ha-vs-dr (Foundations), bkp.aws-backup (Bancos de dados),
 * bkp.copy (Arquivos e backup), dns.failover (Redes), aur.global-database,
 * ddb.global-tables e rds.cross-region-replica (Bancos de dados) e cfn.what
 * (Monitoramento e governança).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F03_ARQ_CONCEPTS: ConceptDef[] = [
  {
    id: 'dr.backup-restore',
    title: 'Backup e restauração',
    officialName: 'Backup and restore',
    serviceIds: ['aws.backup', 'aws.cloudformation'],
    summary: 'Os dados são copiados para a Região de recuperação, e nada mais roda lá. No desastre, a infraestrutura é **recriada pela infraestrutura como código**, o código é implantado e os dados são **restaurados**. É a estratégia mais barata e simples: **RPO em horas e RTO de até 24 horas**.',
    commonMistakes: ['Copiar os backups para outra Região e esquecer as AMIs e os templates para recriar os servidores'],
    facts: ['Com backups contínuos e restauração a um momento anterior, o RPO pode cair para cerca de 5 minutos em alguns casos.', 'Sem infraestrutura como código, recriar tudo na outra Região pode estourar o RTO.', 'Além dos dados, entram no backup o código, a configuração e as AMIs.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Sinais: "menor custo" e "RPO e RTO de horas". A resposta é backup e restauração, com cópias em outra Região e a infraestrutura descrita como código.',
    },
    references: [R.rel13bp02, R.drOptions],
    tags: ['recuperacao', 'custos'],
  },
  {
    id: 'dr.pilot-light',
    title: 'Pilot light',
    officialName: 'Pilot light',
    serviceIds: ['aws.rds', 'aws.s3'],
    summary: 'O **núcleo** fica ligado na Região de recuperação: bancos e armazenamento **replicando** o tempo todo. Os servidores de aplicação **não estão implantados** e são criados na hora, com a configuração pronta. **RPO em minutos e RTO em dezenas de minutos.**',
    comparisons: [{ with: 'dr.warm-standby', text: 'No pilot light, a aplicação ainda precisa ser implantada; no warm standby, ela já está rodando reduzida e só precisa crescer.' }],
    facts: ['O pilot light não atende nenhuma requisição antes de uma ação: é preciso ligar os servidores e escalar.', 'A AWS recomenda uma conta separada por Região, para isolar recursos e credenciais.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "RPO de minutos", "RTO de dezenas de minutos" e "custo baixo". A resposta é o pilot light: dados replicados e servidores criados no desastre.',
    },
    references: [R.rel13bp02, R.drOptions],
    tags: ['recuperacao'],
  },
  {
    id: 'dr.warm-standby',
    title: 'Warm standby',
    officialName: 'Warm standby',
    serviceIds: ['aws.ec2', 'aws.rds'],
    summary: 'Uma **cópia reduzida, mas funcional**, da produção roda o tempo todo na Região de recuperação, com os dados replicados. No desastre, ela **só escala**. **RPO em segundos e RTO em minutos.** Com a capacidade inteira, vira o **hot standby**.',
    facts: ['O warm standby já atende tráfego, em capacidade reduzida, sem ação prévia.', 'Quanto maior a cópia mantida, menor o RTO e a dependência do plano de controle para escalar.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "RTO de minutos" e "a Região de recuperação já deve atender tráfego". A resposta é o warm standby, que só precisa escalar.',
    },
    references: [R.rel13bp02, R.drOptions],
    tags: ['recuperacao'],
  },
  {
    id: 'dr.multi-site',
    title: 'Ativo-ativo em várias Regiões',
    officialName: 'Multi-site active/active',
    serviceIds: ['aws.route53', 'aws.dynamodb', 'aws.aurora'],
    summary: 'A carga roda e **atende tráfego em várias Regiões** ao mesmo tempo, com os dados sincronizados entre elas. É a estratégia mais **cara e complexa**, com **RPO perto de zero e RTO potencialmente zero**. Na falha, a Região é esvaziada e as outras seguem.',
    commonMistakes: ['Escolher ativo-ativo para uma carga que aceita minutos fora do ar'],
    facts: ['Gravações no mesmo registro em duas Regiões podem conflitar e precisam ser evitadas ou tratadas.', 'Estratégias de gravação: tudo numa Região (write global, como no Aurora Global Database), na Região mais próxima (write local, como nas tabelas globais do DynamoDB) ou por chave de partição.'],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "RPO e RTO perto de zero" e "atender usuários em várias Regiões ao mesmo tempo". A resposta é o ativo-ativo, com dados globais (tabelas globais do DynamoDB ou Aurora Global Database) e o Route 53 ou o Global Accelerator distribuindo o tráfego.',
    },
    references: [R.rel13bp02, R.drOptions],
    tags: ['recuperacao', 'disponibilidade'],
  },
  {
    id: 'dr.choose',
    title: 'Escolher a estratégia pela meta',
    officialName: 'Choosing a DR strategy',
    serviceIds: [],
    summary: 'As quatro estratégias estão em ordem **crescente de custo e complexidade** e **decrescente de RPO e RTO**. Escolhe-se a **mais barata que cumpre** as metas: uma estratégia mais rígida que o necessário só aumenta a conta. Qualquer que seja, ela precisa ser **testada**.',
    explanation: [
      'Exemplo: um sistema de pedidos tem RPO de 5 minutos e RTO de 30 minutos. Backup e restauração não cumpre (o RTO é de horas); o ativo-ativo cumpre com sobra, mas caro; o pilot light ou um warm standby pequeno é a escolha mais barata que cumpre as duas metas.',
    ],
    comparisons: [{ with: 'infra.ha-vs-dr', text: 'Alta disponibilidade cobre falhas do dia a dia com várias AZs; a recuperação de desastres cobre eventos maiores, como a perda da Região.' }],
    commonMistakes: ['Decidir a estratégia antes de ter o RPO e o RTO aprovados pelo negócio'],
    facts: ['Não ter uma estratégia definida, implementada e testada (REL13-BP02) é risco alto.', 'Para desastres de uma AZ, várias AZs numa Região resolvem; várias Regiões entram quando o desastre considerado é regional ou a regulação exige.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Questões de recuperação dão o RPO e o RTO e pedem a estratégia mais barata que cumpre os dois. Ordene as quatro estratégias e escolha a primeira que atende.',
    },
    references: [R.rel13bp02],
    tags: ['recuperacao', 'custos'],
  },
  {
    id: 'dr.replication-not-backup',
    title: 'Replicação não substitui backup',
    officialName: 'Continuous replication vs point-in-time backups',
    serviceIds: ['aws.backup', 'aws.s3'],
    summary: 'A replicação contínua copia **também o erro**: um dado corrompido ou apagado chega à outra Região em segundos. Toda estratégia precisa, além da réplica, de **backups com restauração a um momento anterior** e de versionamento quando houver.',
    commonMistakes: ['Achar que o ativo-ativo dispensa backups'],
    facts: ['Na replicação do S3, por padrão, uma exclusão no bucket de origem cria o marcador de exclusão só na origem, protegendo a cópia de exclusões maliciosas.', 'Num desastre de dados (corrupção ou exclusão), o RTO é sempre maior que zero e o RPO fica num momento anterior à descoberta.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Sinal: "proteger contra corrupção ou exclusão acidental" numa arquitetura com réplicas. A resposta acrescenta backups com restauração para um ponto anterior.',
    },
    references: [R.drOptions, R.rel13bp02],
    tags: ['recuperacao', 'durabilidade'],
  },
]
