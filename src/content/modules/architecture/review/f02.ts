/**
 * Questões da Revisão da Fase 2 de Arquitetura e otimização (arquiteturas
 * resilientes), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'arq.f02',
  questions: [
    {
      id: 'rv:arq.f02.m2.a1',
      kind: 'decision',
      title: 'Uma máquina para o festival',
      prompt:
        'Uma bilheteria precisa aguentar o pico de vendas de um festival. O time propõe trocar a frota de instâncias pequenas por **uma única instância grande** o bastante para o pico. O requisito é **aumentar a capacidade** e **continuar vendendo se uma AZ falhar**. Qual arquitetura atende?',
      concepts: [{ id: 'res.horizontal-scaling' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A instância grande proposta, com snapshots a cada hora.', correct: false, consequence: 'Continua sendo um ponto único de falha; o snapshot só ajuda a restaurar.' },
        { id: 'b', text: 'Várias instâncias em várias AZs, com Auto Scaling e ALB.', correct: true, consequence: 'A capacidade cresce somando instâncias, e uma AZ fora leva só uma parte.' },
        { id: 'c', text: 'Duas instâncias grandes na mesma AZ, para ter uma reserva.', correct: false, consequence: 'A queda daquela AZ leva as duas instâncias de uma vez, e a venda para.' },
        { id: 'd', text: 'A instância grande com um Elastic IP para trocar de máquina.', correct: false, consequence: 'A troca é manual e não resolve a queda da AZ nem a capacidade.' },
      ],
      explanation: [
        'Escalar na **vertical** é trocar por uma instância maior; na **horizontal**, é somar instâncias atrás de um balanceador. O pilar de confiabilidade recomenda **vários recursos pequenos** sem ponto de falha comum: uma falha derruba só uma parte, e a capacidade cresce sem parar a aplicação.',
        'Uma instância grande, mesmo com snapshots ou Elastic IP, é ponto único de falha. Duas na mesma AZ caem juntas.',
        '**Regra prática:** "mais capacidade e mais disponibilidade sem parar" é escalar na horizontal, em várias AZs, atrás de um balanceador.',
      ],
    },
    {
      id: 'rv:arq.f02.sessao-fora-do-servidor',
      kind: 'decision',
      title: 'Clientes deslogados no meio da compra',
      prompt:
        'Uma loja passou a escalar na horizontal num grupo do Auto Scaling atrás de um ALB. Agora os clientes **perdem o carrinho** quando uma instância é substituída ou quando o grupo encolhe, porque a aplicação guarda a **sessão na memória** de cada servidor. Qual mudança resolve sem perder a escala horizontal?',
      concepts: [{ id: 'res.horizontal-scaling' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar a afinidade de sessão (sticky sessions) no ALB.', correct: false, consequence: 'O cliente volta à mesma instância, mas perde a sessão quando ela sai do grupo.' },
        { id: 'b', text: 'Fixar o tamanho do grupo para que nenhuma instância saia.', correct: false, consequence: 'Perde a elasticidade, e uma instância com falha ainda leva as sessões.' },
        { id: 'c', text: 'Guardar as sessões no ElastiCache ou no DynamoDB.', correct: true, consequence: 'Qualquer instância atende o cliente, e a saída de uma não apaga nada.' },
        { id: 'd', text: 'Voltar para uma instância única e maior com a sessão em memória.', correct: false, consequence: 'Volta ao ponto único de falha que a escala horizontal resolveu.' },
      ],
      explanation: [
        'Escalar na horizontal exige que as instâncias sejam **intercambiáveis**: qualquer uma atende qualquer cliente. Para isso, o estado da sessão sai da memória do servidor e vai para um armazenamento compartilhado, como o **ElastiCache** ou o **DynamoDB**.',
        'A afinidade de sessão só prende o cliente a uma instância, e ele perde tudo quando ela sai. Fixar o grupo ou voltar a uma instância grande abre mão da elasticidade e da disponibilidade.',
        '**Regra prática:** aplicação que escala na horizontal guarda a sessão fora dos servidores; sticky session não substitui isso.',
      ],
    },
    {
      id: 'rv:arq.f02.m3.a1',
      kind: 'decision',
      title: 'Uma dependência que derruba o checkout',
      prompt:
        'A cada pedido, o checkout de uma loja lê **limites de frete e textos da página** num repositório interno de parâmetros. Numa manutenção desse repositório, todos os pedidos deram erro por **meia hora**. A diretoria exige que um problema nele **não pare as vendas** de novo. Qual mudança atende?',
      concepts: [{ id: 'res.graceful-degradation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Tentar de novo sem limite até o serviço de configurações voltar.', correct: false, consequence: 'O cliente espera, e as tentativas sobrecarregam um serviço já com problema.' },
        { id: 'b', text: 'Usar os últimos valores lidos, ou os padrão, se ele não responder.', correct: true, consequence: 'O checkout segue vendendo, com configurações um pouco antigas.' },
        { id: 'c', text: 'Mostrar uma página de manutenção até o serviço se recuperar.', correct: false, consequence: 'Para as vendas por causa de um componente secundário.' },
        { id: 'd', text: 'Dobrar o número de instâncias do serviço de configurações.', correct: false, consequence: 'Ajuda na carga, mas o checkout continua dependendo dele para funcionar.' },
      ],
      explanation: [
        'A **degradação controlada** (REL05-BP01, de risco alto) mantém a **função principal** quando uma dependência falha, talvez com dados um pouco antigos ou alternativos. Um dos exemplos da AWS é usar **parâmetros padrão** quando o repositório de parâmetros não responde: a dependência forte vira fraca.',
        'Repetir sem limite piora a falha. A página de manutenção para as vendas. Mais instâncias reduzem a chance de falha, mas mantêm a dependência forte.',
        '**Regra prática:** componente secundário que falha não pode derrubar a função principal; use valores em cache, padrão ou a página sem aquele pedaço.',
      ],
    },
    {
      id: 'rv:arq.f02.m3.a3',
      kind: 'decision',
      title: 'Um plano de recuperação que não cria nada',
      prompt:
        'Uma API crítica roda em três AZs atrás de um ALB. O plano atual diz: "se uma AZ cair, o Auto Scaling lança instâncias nas outras". A diretoria quer que a recuperação de uma AZ **dependa só do plano de dados**, sem criar nem alterar recursos durante a falha. Qual plano atende?',
      concepts: [{ id: 'res.data-plane' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter o plano, com o Auto Scaling lançando instâncias.', correct: false, consequence: 'Lançar instâncias é plano de controle, e a recuperação depende dele.' },
        { id: 'b', text: 'Um operador mudar os pesos do registro DNS para as AZs que restarem.', correct: false, consequence: 'Mudar registros é operação de plano de controle, e ainda é manual.' },
        { id: 'c', text: 'Recriar as instâncias perdidas a partir da AMI mais recente.', correct: false, consequence: 'Criar recursos durante a falha é exatamente o que se quer evitar.' },
        { id: 'd', text: 'Capacidade já rodando nas outras AZs e health checks do ALB.', correct: true, consequence: 'O ALB para de mandar tráfego à AZ fora, e a capacidade já está lá.' },
      ],
      explanation: [
        'O **plano de controle** cria e altera recursos; o **plano de dados** entrega o serviço em tempo real e tem metas de disponibilidade maiores. A recuperação mais segura depende só do plano de dados: **capacidade já provisionada** nas outras AZs (estabilidade estática) e health checks que tiram a AZ com falha do caminho.',
        'Lançar instâncias pelo Auto Scaling ou recriá-las é plano de controle, um trade-off entre custo e resiliência. Mudar pesos do DNS à mão também é.',
        '**Regra prática:** para recuperar sem depender de nada novo, tenha a capacidade rodando antes e use health checks para o failover.',
      ],
    },
    {
      id: 'rv:arq.f02.m3.a4',
      kind: 'decision',
      title: 'O ensaio que parou no meio',
      prompt:
        'No ensaio de recuperação em outra Região, o grupo do Auto Scaling **não passou de 20 instâncias**, embora o máximo configurado fosse 60 e a AMI e o template estivessem prontos. A empresa quer que a Região de recuperação **chegue à capacidade de produção** num desastre real. O que deve ser feito antes?',
      concepts: [{ id: 'res.data-plane' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Copiar a AMI de novo para a Região de recuperação.', correct: false, consequence: 'Sem a AMI nenhuma instância subiria, e 20 subiram.' },
        { id: 'b', text: 'Aumentar o máximo do grupo do Auto Scaling para 100.', correct: false, consequence: 'O grupo não chegou nem aos 60; o limite está fora dele.' },
        { id: 'c', text: 'Pedir o aumento das cotas nessa Região.', correct: true, consequence: 'Com a cota ajustada, o grupo escala até a capacidade de produção.' },
        { id: 'd', text: 'Trocar o tipo de instância por um maior nessa Região.', correct: false, consequence: 'As cotas também valem para tipos maiores; o limite continua.' },
      ],
      explanation: [
        'As **cotas de serviço são por Região**. A Região de recuperação precisa ter cotas que permitam **escalar até a capacidade de produção**, e o aumento deve ser pedido **antes** do desastre, porque pedir cota durante a falha depende de uma ação no plano de controle.',
        'A AMI estava lá, já que 20 instâncias subiram. O máximo do grupo não foi atingido. Instâncias maiores continuam limitadas pela cota.',
        '**Regra prática:** confira as cotas da Região de recuperação no plano de DR; um ensaio que para antes do máximo costuma ser cota.',
      ],
    },
    {
      id: 'rv:arq.f02.m4.a3',
      kind: 'decision',
      title: 'O legado que não reconecta',
      prompt:
        'Um sistema legado abre uma **conexão nova a cada pedido** com um RDS Multi-AZ e **não sabe reconectar** quando o banco troca de primário: depois de cada failover, fica minutos com erros. O código não pode mudar, **só o endereço** no arquivo de configuração. Qual mudança atende?',
      concepts: [{ id: 'res.legacy-reliability' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Apontar a aplicação para uma réplica de leitura do banco de dados.', correct: false, consequence: 'A réplica não aceita gravações e não segura conexões no failover.' },
        { id: 'b', text: 'Aumentar o parâmetro max_connections do banco para aguentar os picos.', correct: false, consequence: 'Adia o problema dos picos e não ajuda a reconectar no failover.' },
        { id: 'c', text: 'Reescrever a camada de acesso ao banco para reconectar sozinha.', correct: false, consequence: 'Resolveria, mas exige mudar o código, o que não é possível.' },
        { id: 'd', text: 'Pôr o RDS Proxy na frente do banco, apontando a aplicação para ele.', correct: true, consequence: 'O proxy segura as conexões no failover e reaproveita as existentes.' },
      ],
      explanation: [
        'Quando o código não pode mudar, a confiabilidade vem **de fora da aplicação**. O **RDS Proxy** mantém um pool de conexões com o banco, absorve a abertura de conexões a cada pedido e **segura as conexões dos clientes durante o failover**, o que deixa a troca de primário transparente. Basta trocar o endereço na configuração.',
        'A réplica de leitura não serve para gravar. Mais conexões não resolvem o failover. Reescrever o acesso é mudança de código.',
        '**Regra prática:** "sem alterar o código" pede soluções de infraestrutura: balanceador, Auto Scaling, Multi-AZ, RDS Proxy e health checks do Route 53.',
      ],
    },
    {
      id: 'rv:arq.f02.m4.a1',
      kind: 'decision',
      title: 'Um legado que só roda uma cópia',
      prompt:
        'Um sistema legado roda numa instância EC2 e grava arquivos em disco local. Ele **não funciona com duas cópias ao mesmo tempo**, e o código não pode mudar. Hoje, se a instância ou a AZ falha, ele fica fora até alguém agir. A empresa quer que ele **volte sozinho**, inclusive com **uma AZ fora**. Qual solução atende?',
      concepts: [{ id: 'res.legacy-reliability' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Duas instâncias atrás de um ALB, uma em cada AZ, dividindo os pedidos.', correct: false, consequence: 'O legado não funciona com duas cópias rodando juntas.' },
        { id: 'b', text: 'Auto Scaling de tamanho 1 em duas AZs, com os arquivos no EFS.', correct: true, consequence: 'Se a instância ou a AZ cai, outra sobe em outra AZ com os mesmos arquivos.' },
        { id: 'c', text: 'Uma instância maior, com recuperação automática do EC2.', correct: false, consequence: 'A recuperação mantém a instância na mesma AZ; não resiste à queda dela.' },
        { id: 'd', text: 'Snapshots do volume a cada hora, restaurados à mão quando ela cair.', correct: false, consequence: 'A volta continua manual, e pode perder até uma hora.' },
      ],
      explanation: [
        'Sem mexer no código, a confiabilidade vem da infraestrutura. Um **grupo do Auto Scaling com mínimo e máximo 1**, em sub-redes de **duas AZs**, repõe a instância sozinho, inclusive em outra AZ. Com os arquivos num **EFS Regional**, a nova instância encontra os mesmos dados.',
        'Duas instâncias ativas quebram o legado. A recuperação automática do EC2 não sai da AZ. Snapshots restaurados à mão mantêm a volta manual.',
        '**Regra prática:** legado que só roda uma cópia ganha recuperação automática com Auto Scaling de tamanho 1 em várias AZs e o estado fora da instância.',
      ],
    },
  ],
}
