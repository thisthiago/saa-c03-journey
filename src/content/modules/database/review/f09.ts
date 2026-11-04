/**
 * Questões da Revisão da Fase 9 de Bancos de dados (Migração e escolha), no
 * formato do exame SAA-C03. Fatos conferidos em 21/10/2026 e 03/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'db.f09',
  questions: [
    {
      id: 'rv:db.f09.m1.a3',
      kind: 'decision',
      title: 'Uma migração sem servidor de replicação para cuidar',
      prompt:
        'Uma equipe pequena vai migrar vários bancos com o **AWS DMS** ao longo do ano. Ela não sabe estimar o tamanho de uma instância de replicação e **não quer criar, dimensionar nem atualizar** esse servidor. A equipe quer o **menor esforço operacional**. Qual opção atende?',
      concepts: [{ id: 'dms.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma instância de replicação grande, para não faltar capacidade.', correct: false, consequence: 'Continua sendo um servidor para criar e atualizar, e paga capacidade sobrando.' },
        { id: 'b', text: 'Copiar os arquivos de dados dos bancos para o S3 e restaurar.', correct: false, consequence: 'Arquivos de banco no S3 não viram um banco gerenciado sozinhos.' },
        { id: 'c', text: 'Uma instância de replicação em Multi-AZ, com failover automático.', correct: false, consequence: 'Aumenta a disponibilidade, mas a equipe continua dimensionando e atualizando o servidor.' },
        { id: 'd', text: 'O DMS Serverless, que cuida da capacidade de replicação.', correct: true, consequence: 'A equipe define a migração, e o serviço cuida do servidor de replicação.' },
      ],
      explanation: [
        'O **DMS Serverless** dispensa estimar, criar, dimensionar e atualizar a instância de replicação. A equipe só define origem, destino e tarefa.',
        'Uma instância grande paga capacidade sobrando e continua com a equipe. Uma instância em Multi-AZ ganha failover automático para uma reserva, mas a equipe ainda dimensiona e atualiza o servidor. Copiar arquivos para o S3 não migra um banco.',
        '**Regra prática:** DMS sem servidor de replicação para gerenciar é o DMS Serverless.',
      ],
    },
    {
      id: 'rv:db.f09.indices-que-faltaram',
      kind: 'decision',
      title: 'Consultas lentas logo depois da migração',
      prompt:
        'Uma empresa migrou um PostgreSQL para o Aurora PostgreSQL com o DMS, deixando o **DMS criar as tabelas** no destino. Os dados chegaram completos e a validação passou, mas as **consultas por cliente e por data** ficaram muito mais lentas que na origem. A equipe quer **resolver a causa**. O que fazer?',
      concepts: [{ id: 'dms.what' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar a classe das instâncias do Aurora PostgreSQL.', correct: false, consequence: 'Paga mais para compensar consultas que varrem tabelas sem os índices certos.' },
        { id: 'b', text: 'Criar no destino os índices secundários que existiam na origem.', correct: true, consequence: 'As consultas voltam a usar índices, como faziam na origem.' },
        { id: 'c', text: 'Rodar a tarefa do DMS de novo, agora com carga completa e CDC.', correct: false, consequence: 'Recarrega os mesmos dados sem índices, e o problema continua.' },
        { id: 'd', text: 'Colocar um RDS Proxy entre a aplicação e o Aurora.', correct: false, consequence: 'O proxy cuida de conexões, não do plano das consultas.' },
      ],
      explanation: [
        'O DMS faz uma migração de esquema básica: cria **tabelas e chaves primárias**, mas **não cria índices secundários**, chaves estrangeiras nem usuários. Sem os índices, as consultas por cliente e por data varrem as tabelas. A correção é **criar os índices no destino**, de preferência depois da carga completa.',
        'Uma classe maior paga pela falta de índice. Recarregar não cria índices. O RDS Proxy não muda consultas.',
        '**Regra prática:** o DMS move dados; o esquema completo (índices, chaves estrangeiras, procedures) vem do próprio banco, numa migração homogênea, ou da conversão de esquema.',
      ],
    },
    {
      id: 'rv:db.f09.m1.a2',
      kind: 'decision',
      title: 'Quanto do código Oracle vai precisar de ajuste',
      prompt:
        'Uma indústria estuda levar seu ERP do **Oracle para o Aurora PostgreSQL**, para economizar licenças. O banco tem centenas de procedures e funções, e a diretoria só aprova o projeto depois de saber **quanto do código vai precisar de ajuste manual**. Qual é o primeiro passo?',
      concepts: [{ id: 'dms.schema-conversion' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Rodar uma tarefa de carga completa do DMS e ver o que falha.', correct: false, consequence: 'A tarefa move dados e não converte procedures; não diz quanto do código precisa de ajuste.' },
        { id: 'b', text: 'Criar o Aurora PostgreSQL e testar as procedures uma a uma.', correct: false, consequence: 'As procedures em PL/SQL não rodam no PostgreSQL; seria reescrever às cegas.' },
        { id: 'c', text: 'Gerar a avaliação de migração no DMS Schema Conversion.', correct: true, consequence: 'O relatório mostra o que converte sozinho e o que precisa de ajuste manual.' },
        { id: 'd', text: 'Usar uma migração homogênea do DMS, com as ferramentas nativas.', correct: false, consequence: 'A migração homogênea vale para o mesmo motor; Oracle para PostgreSQL é heterogênea.' },
      ],
      explanation: [
        'Numa migração entre **motores diferentes**, o esquema precisa ser convertido. O **DMS Schema Conversion** (ou o AWS SCT, instalado no computador) **avalia a complexidade** e aponta o que precisa de ajuste manual, antes de converter tabelas, views, procedures e funções. Depois, o DMS move os dados.',
        'Uma tarefa do DMS não converte código. Testar no Aurora sem converter é reescrever às cegas. E a migração homogênea é para o mesmo motor.',
        '**Regra prática:** "migrar de Oracle ou SQL Server para Aurora PostgreSQL" combina conversão de esquema (com sua avaliação) e DMS para os dados.',
      ],
    },
    {
      id: 'rv:db.f09.inventario-do-data-center',
      kind: 'decision',
      title: 'Duzentos bancos que ninguém mapeou',
      prompt:
        'Uma rede de hospitais vai fechar o data center e tem cerca de **200 bancos** em servidores diferentes, sem uma lista confiável de motores, versões e tamanhos. Antes de planejar as migrações, a equipe precisa de um **inventário desses bancos**, com o **menor trabalho manual**. Qual recurso usar?',
      concepts: [{ id: 'dms.schema-conversion' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O DMS Fleet Advisor, para descobrir e inventariar os bancos.', correct: true, consequence: 'O inventário sai dos próprios servidores e serve de base para o plano.' },
        { id: 'b', text: 'Uma tarefa de carga completa do DMS para cada banco que aparecer.', correct: false, consequence: 'Migra dados antes de existir um plano, e os bancos desconhecidos ficam de fora.' },
        { id: 'c', text: 'Um questionário enviado aos donos de cada sistema do hospital.', correct: false, consequence: 'É o trabalho manual que se quer evitar, e a lista volta incompleta.' },
        { id: 'd', text: 'O DMS Serverless, que lista os bancos da rede ao ser criado.', correct: false, consequence: 'O Serverless cuida da capacidade de replicação; não faz inventário.' },
      ],
      explanation: [
        'O **DMS Fleet Advisor** faz o **inventário dos bancos** do data center, com motores, versões e tamanhos, para planejar a migração. Depois, a conversão de esquema avalia cada banco que muda de motor.',
        'Tarefas de migração movem dados de bancos já conhecidos, e o DMS Serverless cuida da capacidade de replicação; nenhum dos dois descobre bancos. Um questionário depende de cada dono lembrar o que tem e volta incompleto.',
        '**Regra prática:** inventário de bancos para planejar uma migração em massa é o DMS Fleet Advisor.',
      ],
    },
    {
      id: 'rv:db.f09.m2.a2',
      kind: 'decision',
      title: 'Uma tarefa com CDC que não consegue começar',
      prompt:
        'Uma equipe criou uma tarefa do DMS com **carga completa e captura de mudanças (CDC)** para levar um **MySQL do data center** ao Aurora MySQL. A carga completa funciona, mas a **captura de mudanças falha ao começar**. Na origem, o **log binário está desligado**. O que fazer para a tarefa funcionar?',
      concepts: [{ id: 'dms.task-types' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar a tarefa por uma de só carga completa, repetida toda noite.', correct: false, consequence: 'Cada carga leva horas e não acompanha as gravações; a virada exigiria parar o banco.' },
        { id: 'b', text: 'Ligar a validação de dados na tarefa do DMS.', correct: false, consequence: 'A validação compara origem e destino; não dá à CDC as mudanças que ela precisa ler.' },
        { id: 'c', text: 'Ligar o log binário no MySQL de origem, no formato ROW.', correct: true, consequence: 'A CDC passa a ler as mudanças no log de transações da origem.' },
        { id: 'd', text: 'Ligar o log binário no Aurora MySQL de destino.', correct: false, consequence: 'A CDC lê as mudanças na origem, não no destino.' },
      ],
      explanation: [
        'A **CDC lê o log de transações da origem** e aplica as mudanças no destino em transações inteiras. Num MySQL próprio, isso exige o **log binário ligado**, com o formato **ROW**. Sem ele, não há de onde ler as mudanças.',
        'Repetir cargas completas não acompanha as gravações. A validação não captura mudanças. E o log do destino não tem as mudanças da origem.',
        '**Regra prática:** carga completa com CDC para não parar o banco, e a CDC depende do log de transações da origem.',
      ],
    },
    {
      id: 'rv:db.f09.hora-da-virada',
      kind: 'decision',
      title: 'Quando apontar a aplicação para o banco novo',
      prompt:
        'Uma tarefa do DMS com **carga completa e CDC** leva um SQL Server para o RDS. A carga completa terminou há duas horas, e a CDC segue aplicando as gravações da origem, ainda **alguns minutos atrás**. A empresa aceita **no máximo 10 minutos sem gravar** e **nenhuma gravação perdida**. Como fazer a virada?',
      concepts: [{ id: 'dms.task-types' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Apontar a aplicação para o RDS agora, com a CDC ainda atrás.', correct: false, consequence: 'As gravações que a CDC ainda não aplicou ficam fora do banco novo.' },
        { id: 'b', text: 'Parar a tarefa e rodar uma nova carga completa antes de virar.', correct: false, consequence: 'Recarregar tudo leva horas, e o banco ficaria parado bem mais que 10 minutos.' },
        { id: 'c', text: 'Esperar a carga completa terminar e virar, sem considerar a CDC.', correct: false, consequence: 'A carga já terminou; o que falta são as mudanças que a CDC ainda está aplicando.' },
        { id: 'd', text: 'Parar as gravações, esperar a CDC zerar o atraso e então virar.', correct: true, consequence: 'O destino alcança a origem em minutos, e nenhuma gravação fica para trás.' },
      ],
      explanation: [
        'Com **carga completa e CDC**, origem e destino ficam sincronizados enquanto a origem continua recebendo gravações. Na virada, a aplicação **para de gravar na origem**, a CDC aplica o que falta e, com o atraso zerado, a aplicação passa a usar o banco novo. A parada leva poucos minutos.',
        'Virar com a CDC atrás perde gravações. Uma nova carga completa demora horas. E o fim da carga não é o momento da virada.',
        '**Regra prática:** a virada acontece quando o destino alcança a origem, depois de parar as gravações na origem.',
      ],
    },
    {
      id: 'rv:db.f09.m1.a4',
      kind: 'decision',
      title: 'Uma etapa a mais por segurança',
      prompt:
        'O site de uma transportadora vai sair de um **MySQL num servidor próprio** para o **RDS for MySQL**. Alguém sugeriu rodar a **conversão de esquema** antes, "por segurança". A empresa quer o caminho **com menos etapas**, sem perder procedures nem funções. O que responder?',
      concepts: [{ id: 'dms.homogeneous' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Não é necessária: com o mesmo motor, o esquema vai como está.', correct: true, consequence: 'A migração homogênea do DMS usa as ferramentas nativas do MySQL e leva também procedures e funções.' },
        { id: 'b', text: 'É necessária: toda migração para a AWS exige converter o esquema.', correct: false, consequence: 'A conversão é para trocar de motor; aqui o motor continua MySQL.' },
        { id: 'c', text: 'É necessária: o RDS for MySQL usa outra linguagem de procedures.', correct: false, consequence: 'O RDS for MySQL é MySQL; as procedures continuam iguais.' },
        { id: 'd', text: 'É necessária, porque o DMS só move tabelas e chaves primárias.', correct: false, consequence: 'Isso vale para a tarefa comum; a migração homogênea do DMS leva também funções e procedures.' },
      ],
      explanation: [
        'Na **migração homogênea**, origem e destino usam o **mesmo motor**: o esquema vai como está. As migrações homogêneas do DMS usam as **ferramentas nativas** do próprio banco e levam dados, partições, tipos, funções e procedures. Elas não têm validação embutida, então a conferência dos dados é feita à parte.',
        'A conversão de esquema existe para trocar de motor. O RDS for MySQL não muda a linguagem de procedures.',
        '**Regra prática:** mesmo motor, migração homogênea; motor diferente, conversão de esquema antes do DMS.',
      ],
    },
    {
      id: 'rv:dms.validation.proof',
      kind: 'decision',
      title: 'Comprovar para a auditoria que nada mudou na migração',
      prompt:
        'Um banco de pagamentos foi migrado com uma tarefa do DMS de **carga completa e CDC**, e a virada será na próxima semana. A auditoria exige **comprovar que origem e destino têm os mesmos dados**, inclusive nas mudanças replicadas até a virada. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'dms.validation' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Comparar a contagem de linhas de cada tabela, à mão.', correct: false, consequence: 'As contagens podem bater com valores diferentes, e as mudanças da CDC ficam de fora.' },
        { id: 'b', text: 'Ligar a validação de dados na tarefa do DMS.', correct: true, consequence: 'O DMS compara origem e destino e continua comparando as mudanças replicadas, apontando o que não bate.' },
        { id: 'c', text: 'Confiar que a tarefa terminou a carga completa sem erros.', correct: false, consequence: 'Terminar sem erro não comprova que os valores chegaram iguais.' },
        { id: 'd', text: 'Tirar um snapshot do destino e guardar como prova.', correct: false, consequence: 'O snapshot guarda o destino; não compara nada com a origem.' },
      ],
      explanation: [
        'Com a **validação de dados** ligada, o DMS compara origem e destino depois da carga e **continua comparando as mudanças replicadas** numa tarefa com CDC, registrando o que não bate. É a comprovação que a auditoria pede, sem scripts.',
        'Contar linhas não compara valores. Uma tarefa sem erro não prova igualdade. Um snapshot do destino não compara nada.',
        '**Regra prática:** antes de virar a chave para o banco novo, comprove com a validação do DMS que os dados chegaram iguais.',
      ],
    },
    {
      id: 'rv:db.f09.boss.a2',
      kind: 'decision',
      title: 'O mapa de bancos de um marketplace',
      prompt:
        'Um marketplace tem quatro necessidades: **pedidos** com transações e junções; **recomendações** "quem comprou isto também comprou aquilo", percorrendo ligações em vários níveis; **sessões** lidas a cada clique em microssegundos; e **relatórios** sobre bilhões de vendas. Um diretor quer pôr tudo num Aurora. Qual mapa atende **cada padrão de acesso**?',
      concepts: [{ id: 'db.choosing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aurora, Aurora com réplicas, ElastiCache e Redshift, nessa ordem.', correct: false, consequence: 'Recomendações em vários níveis viram junções sucessivas no Aurora; elas pedem um banco de grafos.' },
        { id: 'b', text: 'Aurora, Neptune, ElastiCache e Redshift, nessa ordem.', correct: true, consequence: 'Cada padrão de acesso fica no banco feito para ele.' },
        { id: 'c', text: 'DynamoDB, Neptune, ElastiCache e Redshift, nessa ordem.', correct: false, consequence: 'Os pedidos precisam de junções, que o DynamoDB não faz.' },
        { id: 'd', text: 'Aurora, Neptune, DynamoDB com DAX e Aurora, nessa ordem.', correct: false, consequence: 'Relatórios sobre bilhões de linhas no Aurora voltam a pesar no banco de pedidos.' },
      ],
      explanation: [
        'A escolha começa pelo **padrão de acesso**: transações e junções vão para o **Aurora**; relações em vários níveis, para o **Neptune**; leituras em microssegundos, para o **ElastiCache**; e análise de bilhões de linhas, para o **Redshift**.',
        'Pôr recomendações ou relatórios no Aurora força um banco relacional a fazer o que outro faz melhor. O DynamoDB não faz junções para os pedidos.',
        '**Regra prática:** um banco para cada padrão de acesso; usar o mesmo banco para tudo costuma sair mais caro ou mais lento.',
      ],
    },
    {
      id: 'rv:db.f09.perfis-em-qualquer-escala',
      kind: 'decision',
      title: 'Perfis de 50 milhões de usuários',
      prompt:
        'Um aplicativo de transporte guarda o **perfil de cada usuário**, sempre lido e gravado **pelo id do usuário**, sem junções. São **50 milhões de usuários**, com picos imprevisíveis, e a resposta precisa ficar em **milissegundos em qualquer escala**. A empresa **não quer administrar servidores**. Qual banco atende melhor?',
      concepts: [{ id: 'db.choosing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Neptune, com cada usuário como um nó do grafo.', correct: false, consequence: 'Não há relações para percorrer: o acesso é sempre pelo id.' },
        { id: 'b', text: 'Amazon Redshift Serverless, com uma tabela de perfis.', correct: false, consequence: 'O Redshift é para análise, não para ler e gravar um perfil por vez.' },
        { id: 'c', text: 'Amazon RDS for MySQL Multi-AZ, com uma tabela de perfis.', correct: false, consequence: 'Atende, mas exige escolher e escalar instâncias para picos imprevisíveis.' },
        { id: 'd', text: 'Amazon DynamoDB sob demanda, com o id como chave de partição.', correct: true, consequence: 'Acesso por chave em milissegundos, em qualquer escala, sem servidores e acompanhando os picos.' },
      ],
      explanation: [
        'Acesso **por chave**, **sem junções**, em **qualquer escala** e **sem servidores** é o perfil do **DynamoDB**. Com o modo sob demanda, a tabela acompanha os picos sem planejamento.',
        'O Neptune é para relações em vários níveis. O Redshift é para análise. O RDS funciona, mas pede escolher e escalar instâncias.',
        '**Regra prática:** "chave-valor em qualquer escala" e "sem servidor" apontam para o DynamoDB; junções e transações complexas, para RDS ou Aurora.',
      ],
    },
  ],
}
