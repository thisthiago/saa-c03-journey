/** Desafio final — Arquitetura de Dados (empresa fictícia: Empório Brasa). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const BRASA: ArchitectureLabConfig = {
  title: 'Relatório da Arquitetura de Dados',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  groups: [{ id: 'sobra', title: 'Capacidade ou cópia além do que o requisito pede' }],
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 21/10/2026.',
  steps: [
    {
      id: 'pedidos',
      title: 'Banco dos pedidos',
      intro: 'O **Empório Brasa** vende em 300 lojas e pelo site. Os pedidos ficam em PostgreSQL, com junções entre clientes, itens e pagamentos, carga alta o dia inteiro e seis sistemas que leem pedidos. A E/S responde por cerca de 40% do gasto previsto com o banco.',
      questions: [
        {
          id: 'motor',
          prompt: 'Onde ficam os pedidos?',
          options: [
            { id: 'aurora', label: 'Aurora PostgreSQL provisionado', scores: { desempenho: 1, resiliente: 1, requisitos: 1 }, consequence: 'Volume em três AZs e réplicas que leem e assumem a escrita em segundos, mantendo o PostgreSQL.', concepts: ['aur.vs-rds', 'aur.cluster-volume'] },
            { id: 'rds', label: 'RDS for PostgreSQL Single-AZ, com réplicas de leitura', scores: { desempenho: 0.8, resiliente: 0.4, requisitos: 0.8 }, consequence: 'As leituras vão para as réplicas, mas uma falha da AZ exige promoção manual.', whyNot: 'Carga crítica com muitas leitoras e failover rápido pede Aurora com réplicas.', concepts: ['rds.read-replica', 'aur.vs-rds'] },
            { id: 'ddb', label: 'DynamoDB', scores: { desempenho: 0.6, resiliente: 1, requisitos: 0.2 }, consequence: 'As junções entre clientes, itens e pagamentos precisariam ser refeitas na aplicação.', whyNot: 'Pedidos com junções e transações SQL pedem um banco relacional.', concepts: ['ddb.what'] },
          ],
        },
        {
          id: 'io',
          prompt: 'Que configuração de armazenamento do Aurora usar?',
          options: [
            { id: 'iopt', label: 'Aurora I/O-Optimized', scores: { custo: 1 }, consequence: 'Com a E/S acima de 25% do gasto, deixar de pagar cada requisição compensa o preço maior da instância e do armazenamento.', concepts: ['aur.io-optimized'] },
            { id: 'std', label: 'Aurora Standard', scores: { custo: 0.5 }, consequence: 'Paga cada milhão de requisições de E/S, que aqui pesa quase metade da conta.', whyNot: 'A AWS indica o I/O-Optimized quando a E/S passa de 25% do gasto.', concepts: ['aur.io-optimized'] },
          ],
        },
      ],
    },
    {
      id: 'disponibilidade',
      title: 'Disponibilidade e réplicas',
      intro: 'O contrato com as lojas pede que um pedido confirmado nunca se perca e que a escrita volte em menos de um minuto se uma AZ falhar. As leituras dos seis sistemas dobram na Black Friday.',
      questions: [
        {
          id: 'replicas',
          prompt: 'Como montar as instâncias do Aurora?',
          group: 'sobra',
          options: [
            { id: 'two', label: 'Escritora e duas réplicas em outras AZs, com Aurora Auto Scaling para as leitoras', scores: { resiliente: 1, desempenho: 1, custo: 1 }, consequence: 'Uma réplica assume a escrita em geral em menos de 60 s, e as leitoras acompanham o pico.', concepts: ['aur.replicas'] },
            { id: 'one', label: 'Uma única instância: o volume já tem seis cópias em três AZs', scores: { resiliente: 0.4, desempenho: 0.5, custo: 1 }, consequence: 'Os dados ficam a salvo, mas a escritora precisa ser recriada, o que leva em geral até 10 minutos.', whyNot: 'Failover em menos de um minuto exige réplicas em outras AZs.', concepts: ['aur.replicas', 'aur.cluster-volume'] },
            { id: 'many', label: 'Dez réplicas fixas o ano inteiro', scores: { resiliente: 1, desempenho: 1, custo: 0.3 }, consequence: 'Atende ao pico pagando dez instâncias nos dias comuns.', whyNot: 'O Auto Scaling do Aurora acrescenta leitoras só quando a carga pede.', concepts: ['aur.replicas'] },
          ],
        },
        {
          id: 'endpoints',
          prompt: 'Como os sistemas se conectam ao Aurora?',
          options: [
            { id: 'cluster', label: 'Escrita pelo endpoint do cluster e leitura pelo endpoint de leitura', scores: { resiliente: 1, desempenho: 1 }, consequence: 'Os dois acompanham o failover e distribuem as leituras.', concepts: ['aur.endpoints'] },
            { id: 'instance', label: 'Cada sistema com o endpoint de uma instância escolhida', scores: { resiliente: 0.3, desempenho: 0.6 }, consequence: 'Numa falha, o sistema continua apontando para a instância que caiu.', whyNot: 'Endpoints de instância não acompanham o failover.', concepts: ['aur.endpoints'] },
          ],
        },
      ],
    },
    {
      id: 'nosql',
      title: 'Carrinho em NoSQL',
      intro: 'O carrinho de compras é lido e gravado pelo id do cliente, com milhões de clientes e picos imprevisíveis. Carrinhos abandonados perdem a validade em 7 dias.',
      questions: [
        {
          id: 'carrinho',
          prompt: 'Onde guardar o carrinho?',
          group: 'sobra',
          options: [
            { id: 'ondemand', label: 'DynamoDB sob demanda, com TTL para os carrinhos vencidos', scores: { desempenho: 1, custo: 1, requisitos: 1 }, consequence: 'Acesso por chave em milissegundos, cobrança por requisição e exclusão dos vencidos sem gastar escrita.', concepts: ['ddb.capacity-modes', 'ddb.ttl'] },
            { id: 'prov', label: 'DynamoDB provisionado para o pico da Black Friday o ano inteiro', scores: { desempenho: 1, custo: 0.3, requisitos: 1 }, consequence: 'Atende, pagando a capacidade do pico o ano inteiro.', whyNot: 'Com picos imprevisíveis e média baixa, o sob demanda sai mais barato.', concepts: ['ddb.capacity-modes'] },
            { id: 'aurora', label: 'Uma tabela de carrinhos no Aurora dos pedidos', scores: { desempenho: 0.6, custo: 0.6, requisitos: 0.8 }, consequence: 'Os picos do carrinho disputam o banco com os pedidos.', whyNot: 'Acesso por chave em escala combina com o DynamoDB.', concepts: ['ddb.what'] },
          ],
        },
        {
          id: 'chave',
          prompt: 'Qual a chave de partição do carrinho?',
          options: [
            { id: 'client', label: 'clienteId', scores: { desempenho: 1 }, consequence: 'Milhões de valores, tráfego espalhado.', concepts: ['ddb.hot-partition', 'ddb.primary-key'] },
            { id: 'day', label: 'Data do dia', scores: { desempenho: 0 }, consequence: 'Todas as gravações do dia caem no mesmo valor e estouram a partição.', whyNot: 'Chave com um valor por dia concentra o tráfego.', concepts: ['ddb.hot-partition'] },
          ],
        },
      ],
    },
    {
      id: 'cache',
      title: 'Cache',
      intro: 'A vitrine lê os preços 50 mil vezes por segundo. Um preço pode aparecer desatualizado por até 5 minutos. O cache não pode sumir se um nó falhar.',
      questions: [
        {
          id: 'estrategia',
          prompt: 'Como montar o cache de preços?',
          options: [
            { id: 'ttl', label: 'ElastiCache for Valkey com réplica, leitura sob demanda e TTL de 5 minutos', scores: { desempenho: 1, custo: 1, requisitos: 1, resiliente: 1 }, consequence: 'Quase todas as leituras saem do cache, nenhum preço fica velho por mais de 5 minutos e a réplica assume se o nó cair.', concepts: ['cache.strategies', 'cache.engines'] },
            { id: 'nottl', label: 'ElastiCache com leitura sob demanda, sem TTL', scores: { desempenho: 1, custo: 1, requisitos: 0.3, resiliente: 0.5 }, consequence: 'Um preço alterado pode ficar no cache por horas.', whyNot: 'Sem TTL e sem escrita direta, nada limita o tempo de um preço velho.', concepts: ['cache.strategies'] },
            { id: 'bigger', label: 'Sem cache: dobrar a classe do Aurora', scores: { desempenho: 0.6, custo: 0.3, requisitos: 1, resiliente: 1 }, consequence: 'Paga o dobro para responder as mesmas consultas.', whyNot: 'Leituras repetidas pedem cache.', concepts: ['cache.why'] },
          ],
        },
      ],
    },
    {
      id: 'analise',
      title: 'Análise e relatórios',
      intro: 'Os analistas consultam cinco anos de vendas o dia todo. O estoque do Aurora precisa chegar à análise pouco depois de cada mudança. Dez anos de histórico antigo estão em arquivos no S3.',
      questions: [
        {
          id: 'warehouse',
          prompt: 'Onde rodam as análises?',
          options: [
            { id: 'zeroetl', label: 'Redshift alimentado por integração zero-ETL a partir do Aurora', scores: { desempenho: 1, requisitos: 1, resiliente: 1 }, consequence: 'Análise em colunas, longe dos pedidos, sem pipeline para manter.', concepts: ['rs.what', 'rs.integrations'] },
            { id: 'replica', label: 'Relatórios numa réplica do Aurora', scores: { desempenho: 0.4, requisitos: 0.6, resiliente: 1 }, consequence: 'Cinco anos de vendas num banco em linhas: relatórios lentos.', whyNot: 'Bilhões de linhas pedem um data warehouse em colunas.', concepts: ['rs.oltp-olap'] },
            { id: 'script', label: 'Redshift com um script noturno de cópia', scores: { desempenho: 1, requisitos: 0.5, resiliente: 0.6 }, consequence: 'O estoque chega com um dia de atraso, quando o script não falha.', whyNot: 'A integração zero-ETL dispensa o pipeline.', concepts: ['rs.integrations'] },
          ],
        },
        {
          id: 'historico',
          prompt: 'O que fazer com os dez anos de histórico no S3?',
          group: 'sobra',
          options: [
            { id: 'spectrum', label: 'Consultar com o Redshift Spectrum, sem carregar', scores: { custo: 1, requisitos: 1 }, consequence: 'O histórico continua no S3 e entra nas consultas quando for preciso.', concepts: ['rs.spectrum'] },
            { id: 'load', label: 'Carregar tudo em tabelas do Redshift', scores: { custo: 0.4, requisitos: 1 }, consequence: 'Paga armazenamento e carga para dados raramente consultados.', whyNot: 'O Spectrum lê direto do S3.', concepts: ['rs.spectrum'] },
          ],
        },
      ],
    },
    {
      id: 'seguranca',
      title: 'Segurança do acesso',
      intro: 'O auditor do Empório Brasa exige: nada exposto à internet, nenhuma senha no código, tudo criptografado em repouso e em trânsito, e o tráfego para o DynamoDB fora da internet.',
      questions: [
        {
          id: 'rede',
          prompt: 'Como fica a rede dos bancos?',
          options: [
            { id: 'private', label: 'Subnets privadas, security group só da aplicação e endpoint de gateway para o DynamoDB', scores: { seguro: 1, custo: 1 }, consequence: 'Nada exposto, e o tráfego para o DynamoDB não passa pelo NAT.', concepts: ['db.private-access'] },
            { id: 'nat', label: 'Subnets privadas, com o DynamoDB acessado por um NAT gateway', scores: { seguro: 0.7, custo: 0.5 }, consequence: 'Funciona, mas o tráfego sai pela internet e o NAT cobra por GB.', whyNot: 'O endpoint de gateway leva ao DynamoDB sem NAT e sem custo adicional.', concepts: ['db.private-access'] },
            { id: 'public', label: 'Public access ligado para a equipe acessar de casa', scores: { seguro: 0, custo: 1 }, consequence: 'O banco de pedidos fica alcançável pela internet.', whyNot: 'A equipe deve entrar por um caminho privado.', concepts: ['db.private-access'] },
          ],
        },
        {
          id: 'credenciais',
          prompt: 'Como os sistemas se autenticam e como o tráfego é protegido?',
          options: [
            { id: 'managed', label: 'Senha gerenciada no Secrets Manager (ou autenticação IAM) e TLS obrigatório', scores: { seguro: 1 }, consequence: 'Nenhuma senha fixa no código, rotação automática e conexões criptografadas.', concepts: ['db.secrets', 'db.iam-auth', 'db.tls'] },
            { id: 'code', label: 'Senha no código e TLS opcional', scores: { seguro: 0 }, consequence: 'A senha vaza com o repositório, e conexões sem TLS continuam aceitas.', whyNot: 'O auditor proibiu senhas no código.', concepts: ['db.secrets', 'db.tls'] },
          ],
        },
        {
          id: 'cripto',
          prompt: 'Como garantir a criptografia em repouso?',
          options: [
            { id: 'create', label: 'Criar os bancos já criptografados com uma chave do KMS', scores: { seguro: 1, requisitos: 1 }, consequence: 'Dados, logs, backups, réplicas e snapshots nascem criptografados.', concepts: ['db.encryption-at-rest'] },
            { id: 'later', label: 'Criar sem criptografia e ligar depois do lançamento', scores: { seguro: 0.3, requisitos: 0.5 }, consequence: 'Depois, só criando uma instância nova a partir de um snapshot copiado com criptografia.', whyNot: 'A criptografia em repouso do RDS e do Aurora é escolhida na criação.', concepts: ['db.encryption-at-rest'] },
          ],
        },
      ],
    },
    {
      id: 'recuperacao',
      title: 'Backup e recuperação de desastre',
      intro: 'O Empório Brasa precisa desfazer erros de até 14 dias, impedir que um banco seja apagado por engano e voltar a vender em outra Região em menos de uma hora se a Região principal cair.',
      questions: [
        {
          id: 'backup',
          prompt: 'Qual política de backup?',
          group: 'sobra',
          options: [
            { id: 'pitr14', label: 'Backup automático com 14 dias, PITR no DynamoDB e proteção contra exclusão', scores: { resiliente: 1, custo: 1 }, consequence: 'Qualquer segundo dos últimos 14 dias pode ser restaurado, e ninguém apaga um banco por engano.', concepts: ['rds.pitr', 'ddb.backup', 'bkp.deletion-protection'] },
            { id: 'none', label: 'Sem backup automático: as réplicas já protegem', scores: { resiliente: 0, custo: 1 }, consequence: 'Réplicas copiam o apagamento junto: não há como voltar no tempo.', whyNot: 'Só o backup desfaz erros lógicos.', concepts: ['rds.pitr'] },
            { id: 'max', label: '35 dias de retenção e snapshots manuais a cada hora', scores: { resiliente: 1, custo: 0.5 }, consequence: 'Atende, guardando muito mais cópias do que o requisito pede.', whyNot: 'Com o PITR, snapshots de hora em hora não acrescentam ponto de restauração.', concepts: ['rds.snapshots'] },
          ],
        },
        {
          id: 'dr',
          prompt: 'Como sobreviver à perda da Região?',
          options: [
            { id: 'global', label: 'Aurora Global Database com um secundário em outra Região, e tabela global do DynamoDB para o carrinho', scores: { resiliente: 1, requisitos: 1 }, consequence: 'Pedidos e carrinho voltam na outra Região em minutos, com perda mínima.', concepts: ['aur.global-database', 'ddb.global-tables'] },
            { id: 'maz', label: 'Só as réplicas em várias AZs', scores: { resiliente: 0.3, requisitos: 0.3 }, consequence: 'Todas as AZs ficam na mesma Região.', whyNot: 'Contra a perda da Região, é preciso uma cópia fora dela.', concepts: ['infra.ha-vs-dr'] },
            { id: 'weekly', label: 'Snapshots copiados uma vez por semana para outra Região', scores: { resiliente: 0.4, requisitos: 0.3 }, consequence: 'Pode perder até uma semana de pedidos, e restaurar leva horas.', whyNot: 'Menos de uma hora e perda mínima pedem replicação contínua.', concepts: ['rds.snapshots'] },
          ],
        },
      ],
    },
    {
      id: 'migracao',
      title: 'Migração do legado e custo',
      intro: 'O programa de fidelidade roda num Oracle de 1 TB no escritório, com muitas procedures, e não pode ficar mais de 30 minutos sem gravar. O time de testes quer um banco que só usa em horário comercial.',
      questions: [
        {
          id: 'legado',
          prompt: 'Como migrar o programa de fidelidade para o Aurora PostgreSQL?',
          options: [
            { id: 'dms', label: 'Converter o esquema, DMS com carga completa e CDC, validação e virada rápida', scores: { requisitos: 1, resiliente: 1 }, consequence: 'O Oracle continua vendendo durante a cópia, e a virada leva minutos.', concepts: ['dms.schema-conversion', 'dms.task-types', 'dms.validation'] },
            { id: 'fullonly', label: 'DMS só com carga completa, sem conversão de esquema', scores: { requisitos: 0.2, resiliente: 0.5 }, consequence: 'As procedures não existem no destino, e a carga de 1 TB passa muito da janela.', whyNot: 'Motor diferente pede conversão de esquema; janela curta pede CDC.', concepts: ['dms.schema-conversion', 'dms.task-types'] },
          ],
        },
        {
          id: 'testes',
          prompt: 'Que banco usar para os testes?',
          group: 'sobra',
          options: [
            { id: 'serverless', label: 'Aurora serverless com capacidade mínima baixa, criado a partir de um clone', scores: { custo: 1, seguro: 1 }, consequence: 'Paga pouco fora do horário, e o clone traz dados reais sem copiar tudo.', concepts: ['aur.serverless', 'aur.backtrack-clone'] },
            { id: 'copy', label: 'Uma cópia exata da produção, com réplicas, ligada 24 horas', scores: { custo: 0.3, seguro: 1 }, consequence: 'Paga o preço da produção para algumas horas de testes por dia.', whyNot: 'Ambiente de testes com uso intermitente pede capacidade que acompanha o uso.', concepts: ['aur.serverless'] },
            { id: 'prod', label: 'Rodar os testes no banco de produção', scores: { custo: 1, seguro: 0.2 }, consequence: 'Um teste errado altera pedidos reais.', whyNot: 'Testes ficam isolados da produção.', concepts: ['aur.backtrack-clone'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'sem-volta',
      when: [
        ['backup', ['none']],
        ['dr', ['global']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Global Database e tabelas globais replicam qualquer gravação, inclusive um apagamento por engano. Sem backup automático, o erro chega a todas as Regiões e não há para onde voltar.',
      concepts: ['rds.pitr', 'aur.global-database'],
    },
    {
      id: 'porta-aberta',
      when: [
        ['rede', ['public']],
        ['credenciais', ['code']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Banco alcançável pela internet e senha no código: um vazamento do repositório basta para abrir os pedidos.',
      concepts: ['db.private-access', 'db.secrets'],
    },
    {
      id: 'carrinho-quente',
      when: [
        ['carrinho', ['ondemand', 'prov']],
        ['chave', ['day']],
      ],
      penalty: { desempenho: 0.3 },
      message: 'Com a data do dia como chave, todas as gravações de carrinho caem no mesmo valor: o modo de capacidade não salva a partição quente.',
      concepts: ['ddb.hot-partition'],
    },
  ],
}

export const FINAL_DB: PhaseDef = {
  ...META.final,
  concepts: [
    'aur.vs-rds',
    'aur.cluster-volume',
    'aur.io-optimized',
    'aur.replicas',
    'aur.endpoints',
    'aur.global-database',
    'aur.serverless',
    'aur.backtrack-clone',
    'rds.read-replica',
    'rds.pitr',
    'rds.snapshots',
    'infra.ha-vs-dr',
    'ddb.what',
    'ddb.capacity-modes',
    'ddb.ttl',
    'ddb.hot-partition',
    'ddb.primary-key',
    'ddb.backup',
    'ddb.global-tables',
    'cache.why',
    'cache.strategies',
    'cache.engines',
    'rs.what',
    'rs.oltp-olap',
    'rs.integrations',
    'rs.spectrum',
    'db.private-access',
    'db.secrets',
    'db.iam-auth',
    'db.tls',
    'db.encryption-at-rest',
    'bkp.deletion-protection',
    'dms.schema-conversion',
    'dms.task-types',
    'dms.validation',
    'db.choosing',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa, as cargas e os números são fictícios.'],
  missions: [
    {
      id: 'db.final.varejo',
      title: 'Projeto Empório Brasa',
      type: 'final',
      summary: 'Oito etapas de decisões de dados, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Empório Brasa',
        role: 'Você é a pessoa responsável pela arquitetura de dados do varejista.',
        situation: 'Pedidos com junções, um carrinho com milhões de clientes, preços lidos sem parar, analistas o dia todo, um auditor exigente, um plano de desastre e um Oracle legado no escritório.',
        objective: 'Escolher bancos, réplicas, cache, análise, segurança, backup e migração que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'db.choosing', body: ['Cada dado tem o seu banco: pedidos relacionais no Aurora, carrinho por chave no DynamoDB, preços repetidos no cache, análise no Redshift. As decisões se cruzam, e o relatório aponta os conflitos.'] },
        { conceptId: 'infra.ha-vs-dr' },
      ],
      activities: [
        {
          id: 'db.final.varejo.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Arquitetura de Dados',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'aur.vs-rds' }, { id: 'aur.replicas' }, { id: 'ddb.capacity-modes' }, { id: 'cache.strategies' }, { id: 'rs.integrations' }, { id: 'db.private-access' }, { id: 'rds.pitr' }, { id: 'dms.task-types' }, { id: 'db.choosing' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar duas opções.', 'Réplicas copiam também os erros: só o backup volta no tempo.'],
          explanation: [
            'Projeto de referência: Aurora PostgreSQL I/O-Optimized com duas réplicas em outras AZs e Auto Scaling de leitoras, conectado pelos endpoints do cluster e de leitura; carrinho no DynamoDB sob demanda com TTL e chave clienteId; ElastiCache for Valkey com réplica, leitura sob demanda e TTL de 5 minutos; Redshift com zero-ETL e Spectrum para o histórico; subnets privadas, endpoint de gateway, Secrets Manager e TLS, bancos criados já criptografados; backup de 14 dias com PITR e proteção contra exclusão, Global Database e tabela global; DMS com conversão de esquema, CDC e validação; testes em Aurora serverless a partir de um clone.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: BRASA,
        },
      ],
      debrief: { takeaways: ['Cada dado no banco feito para ele.', 'Alta disponibilidade, recuperação de desastre e backup resolvem riscos diferentes.', 'Segurança desde a criação: rede privada, criptografia e nenhuma senha fixa.', 'Decisões se cruzam: réplica sem backup espalha o erro por todas as Regiões.'] },
    },
  ],
}
