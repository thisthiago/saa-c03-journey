/**
 * Questões da Revisão da Fase 7 de Arquivos e backup (AWS Backup), no formato
 * do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'fil.f07',
  questions: [
    {
      id: 'rv:fil.f07.m1.a2',
      kind: 'decision',
      title: 'Os laudos da clínica',
      prompt:
        'O sistema de arquivos EFS dos laudos de uma clínica pode perder **no máximo 12 horas** de alterações numa restauração. Hoje um script faz backup **a cada hora**, e a conta de backups cresceu. A clínica quer passar para um plano do AWS Backup com o **menor custo** que ainda cumpra o RPO. Qual frequência usar na regra?',
      concepts: [{ id: 'bkp.plan' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma vez por dia, na janela padrão de 0h30.', correct: false, consequence: 'Perde até 24 horas de alterações, o dobro do RPO.' },
        { id: 'b', text: 'A cada hora, mantendo o que o script já fazia.', correct: false, consequence: 'Cumpre o RPO com folga, mas paga pontos de recuperação que ninguém vai usar.' },
        { id: 'c', text: 'Backup contínuo do EFS, com retenção de 35 dias.', correct: false, consequence: 'O backup contínuo não existe para o EFS no AWS Backup.' },
        { id: 'd', text: 'A cada 12 horas, com a retenção pedida.', correct: true, consequence: 'No pior caso, perde 12 horas, exatamente o que o RPO aceita.' },
      ],
      explanation: [
        'Com backups periódicos, o pior caso é perder tudo o que mudou **desde o último backup**: o intervalo entre backups é o RPO. Um plano do AWS Backup aceita regras a cada hora, 12 horas, dia, semana ou mês, ou uma expressão cron, e a regra **a cada 12 horas** cumpre o requisito com o menor número de pontos.',
        'O backup diário estoura o RPO. O de hora em hora paga mais do que o necessário. O backup contínuo existe para RDS, Aurora, S3 e SAP HANA em EC2, não para o EFS.',
        '**Regra prática:** a frequência do backup é o RPO; mais frequente do que ele pede só aumenta a conta.',
      ],
    },
    {
      id: 'rv:fil.f07.m1.a1',
      kind: 'decision',
      title: 'O banco novo sem backup',
      prompt:
        'Uma empresa criou um plano do AWS Backup e escolheu os recursos **pelos ARNs** de cada volume EBS, sistema de arquivos EFS e banco RDS. No mês seguinte, um banco novo **ficou sem backup**. A regra é que **todo recurso marcado** pelos times entre no plano sozinho. Qual mudança atende com o **menor esforço**?',
      concepts: [{ id: 'bkp.plan' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Revisar a lista de ARNs do plano toda semana.', correct: false, consequence: 'Continua manual, e o recurso criado entre as revisões fica sem backup.' },
        { id: 'b', text: 'Ligar os backups automáticos de cada serviço.', correct: false, consequence: 'Espalha as regras por serviço e não cobre tudo com retenção única.' },
        { id: 'c', text: 'Selecionar os recursos do plano por uma tag.', correct: true, consequence: 'Todo recurso criado com a tag entra no plano sem mexer nele.' },
        { id: 'd', text: 'Criar um plano novo para cada recurso criado.', correct: false, consequence: 'Multiplica os planos e depende de alguém lembrar de cada um.' },
      ],
      explanation: [
        'Os recursos entram num plano do AWS Backup **por tags** ou **pela lista de recursos**. A lista de ARNs só pega o que existia quando foi montada. Com a seleção **por tag**, tudo o que for criado depois com a tag entra no plano automaticamente.',
        'Revisões e planos por recurso dependem de trabalho manual. Os backups próprios de cada serviço espalham regras e retenções e perdem a visão central.',
        '**Regra prática:** backup centralizado de vários serviços, incluindo recursos futuros, é um plano do AWS Backup com seleção por tag.',
      ],
    },
    {
      id: 'rv:fil.f07.m1.a3',
      kind: 'decision',
      title: 'Erros de quem administra',
      prompt:
        'A equipe de infraestrutura de um hospital administra as instâncias e os volumes e às vezes **apaga recursos por engano**. A segurança quer que essa equipe continue administrando, mas **nunca consiga apagar os pontos de recuperação** guardados no cofre do AWS Backup. Qual configuração atende?',
      concepts: [{ id: 'bkp.vault' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar a chave do KMS do cofre por uma chave do cliente.', correct: false, consequence: 'A chave cifra os backups; não decide quem pode apagá-los.' },
        { id: 'b', text: 'Política do cofre que nega à equipe apagar pontos.', correct: true, consequence: 'A equipe segue administrando os recursos e não apaga os backups.' },
        { id: 'c', text: 'Aumentar a retenção dos backups para dez anos.', correct: false, consequence: 'Quem tem a permissão continua apagando antes do fim da retenção.' },
        { id: 'd', text: 'Proteção contra encerramento nas instâncias EC2.', correct: false, consequence: 'Protege as instâncias, não os pontos de recuperação no cofre.' },
      ],
      explanation: [
        'O **cofre** guarda os pontos de recuperação separados da origem: apagar a instância ou o volume não apaga o backup. Cada cofre tem uma **chave do KMS**, que cifra o conteúdo, e uma **política de acesso**, que diz quem pode fazer o quê. Negar a ação de apagar pontos de recuperação para a equipe protege os backups sem tirar a administração.',
        'A chave do KMS não controla exclusão. Retenção longa não impede quem tem permissão. A proteção contra encerramento vale só para a instância.',
        '**Regra prática:** quem administra os servidores não deve poder apagar os backups; isso se resolve na política de acesso do cofre.',
      ],
    },
    {
      id: 'rv:fil.f07.m2.a1',
      kind: 'decision',
      title: 'O plano recusado',
      prompt:
        'Os backups mensais do EFS de uma escola ficam **100 dias** guardados. Para cortar custo, o time tentou passar os backups para o **armazenamento frio depois de 30 dias**, e o AWS Backup **recusou a regra**. O time quer **manter os 100 dias** e usar o frio. Qual transição a regra aceita?',
      concepts: [{ id: 'bkp.cold-storage' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Frio depois de 60 dias, perto do fim da retenção.', correct: false, consequence: '60 + 90 = 150 dias, acima dos 100 de retenção: também é recusada.' },
        { id: 'b', text: 'Frio depois de 10 dias, com a retenção de 100.', correct: true, consequence: '10 + 90 = 100: o backup cumpre os 90 dias mínimos no frio.' },
        { id: 'c', text: 'Frio depois de 30 dias, mudando a origem para RDS.', correct: false, consequence: 'O RDS não tem armazenamento frio no AWS Backup.' },
        { id: 'd', text: 'Frio depois de 30 dias, em cofre logicamente isolado.', correct: false, consequence: 'Trocar o cofre não muda a regra dos 90 dias mínimos no frio.' },
      ],
      explanation: [
        'No armazenamento frio, o backup fica **no mínimo 90 dias**: a **retenção precisa ser 90 dias maior** que o prazo da transição. Com 100 dias de retenção, a transição pode ser em até 10 dias. Frio em 30 dias exigiria pelo menos 120 dias de retenção.',
        'Transições mais tardias estouram a retenção. O RDS não tem frio. O tipo de cofre não muda a regra. Vale lembrar que a AWS recomenda pelo menos 8 dias no quente antes de esfriar backups incrementais, o que os 10 dias cumprem.',
        '**Regra prática:** frio no AWS Backup exige retenção de pelo menos transição + 90 dias.',
      ],
    },
    {
      id: 'rv:fil.f07.m2.a2',
      kind: 'decision',
      title: 'Backups que podem esfriar',
      prompt:
        'Uma empresa guarda backups por **sete anos** e quer **reduzir o custo** passando para o armazenamento frio do AWS Backup tudo o que for possível. O arquiteto levantou os backups de vários recursos. Quais podem ir para o armazenamento frio? (Escolha DUAS.)',
      concepts: [{ id: 'bkp.cold-storage' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Os backups diários de um sistema de arquivos EFS.', correct: true, consequence: 'O EFS tem armazenamento frio no AWS Backup.' },
        { id: 'b', text: 'Os snapshots diários de um banco Amazon RDS.', correct: false, consequence: 'O RDS não tem armazenamento frio no AWS Backup.' },
        { id: 'c', text: 'Os backups mensais de volumes EBS.', correct: true, consequence: 'Backups mensais do EBS esfriam pelo EBS Snapshot Archive.' },
        { id: 'd', text: 'Os backups diários de um FSx for Windows File Server.', correct: false, consequence: 'O FSx não tem armazenamento frio no AWS Backup.' },
        { id: 'e', text: 'Os pontos do backup contínuo de um bucket S3.', correct: false, consequence: 'O contínuo guarda no máximo 35 dias; não há o que esfriar por anos.' },
      ],
      explanation: [
        'O armazenamento frio existe só para alguns recursos, como **EFS**, **EBS** (pelo EBS Snapshot Archive, com backups **mensais ou menos frequentes**) e DynamoDB com recursos avançados. Para backups guardados por anos, é onde está a maior economia.',
        '**RDS e FSx** não têm frio no AWS Backup. O backup contínuo fica de 1 a 35 dias; retenção longa se faz com snapshots periódicos.',
        '**Regra prática:** "reduzir o custo de backups guardados por anos" é o armazenamento frio, nos recursos que o suportam e respeitando os 90 dias mínimos.',
      ],
    },
    {
      id: 'rv:fil.f07.m2.a4',
      kind: 'decision',
      title: 'Qualquer minuto e meses de histórico',
      prompt:
        'O banco RDS de pedidos de uma loja precisa poder voltar a **qualquer minuto dos últimos 30 dias**, e a auditoria exige um ponto de recuperação **por dia durante 90 dias**. Alguém configurou o **backup contínuo com 90 dias**, e o AWS Backup recusou. Qual configuração atende?',
      concepts: [{ id: 'bkp.continuous' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Só snapshots diários do banco, guardados por 90 dias.', correct: false, consequence: 'Atende à auditoria, mas não volta a qualquer minuto.' },
        { id: 'b', text: 'Contínuo com 30 dias e snapshots diários por 90 dias.', correct: true, consequence: 'O contínuo cobre qualquer minuto de 30 dias, e os diários cobrem os 90.' },
        { id: 'c', text: 'Contínuo com 30 dias, copiado para outra Região por 90.', correct: false, consequence: 'A cópia de um contínuo vira snapshot único, sem pontos diários.' },
        { id: 'd', text: 'Snapshots a cada hora, guardados por 90 dias.', correct: false, consequence: 'Paga 24 pontos por dia e ainda perde até uma hora; não volta a qualquer minuto.' },
      ],
      explanation: [
        'O **backup contínuo** registra as mudanças o tempo todo e permite restaurar **qualquer momento** dentro da retenção, que vai de **1 a 35 dias**. Para guardar por mais tempo, ele se **combina com snapshots periódicos** de retenção longa: contínuo de 30 dias mais backups diários por 90.',
        'Só snapshots não dão restauração a qualquer minuto. A cópia de um backup contínuo para outra Região vira um snapshot comum. Snapshots de hora em hora custam mais e continuam perdendo até uma hora.',
        '**Regra prática:** "qualquer minuto dos últimos dias" é backup contínuo (até 35 dias); retenção maior vem de snapshots periódicos na mesma regra ou noutra.',
      ],
    },
    {
      id: 'rv:fil.f07.m3.a3',
      kind: 'decision',
      title: 'Uma ameaça a mais',
      prompt:
        'Os backups de produção já são **copiados para um cofre numa conta de backup**, na **mesma Região**, para resistir a uma invasão da conta. A nova exigência é que os backups **sobrevivam também à perda da Região**. Qual mudança atende com o **menor esforço**?',
      concepts: [{ id: 'bkp.copy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar o Vault Lock em conformidade no cofre da conta de backup.', correct: false, consequence: 'Protege contra exclusão; o cofre continua na Região que pode cair.' },
        { id: 'b', text: 'Aumentar a retenção das cópias na conta de backup.', correct: false, consequence: 'Mais tempo guardado, mas tudo continua na mesma Região.' },
        { id: 'c', text: 'Acrescentar à regra uma cópia para um cofre em outra Região.', correct: true, consequence: 'Uma cópia fica fora da Região, e a da conta de backup continua valendo.' },
        { id: 'd', text: 'Trocar os backups periódicos por backup contínuo.', correct: false, consequence: 'Muda o RPO, não o lugar onde os backups ficam.' },
      ],
      explanation: [
        'Cada regra pode copiar o backup para um cofre **em outra Região**, **em outra conta da organização** ou nas duas. A cópia em outra conta protege contra quem domina a conta de origem; só a cópia **em outra Região** protege contra a **perda da Região**. Acrescentar essa cópia à regra atende ao requisito novo sem desfazer o que já existe.',
        'Vault Lock e retenção protegem contra exclusão, não contra a queda da Região. O backup contínuo muda o RPO.',
        '**Regra prática:** contra a perda da Região, cópia em outra Região; contra a invasão da conta, cópia em outra conta; contra os dois, as duas.',
      ],
    },
    {
      id: 'rv:fil.f07.copia-entre-contas',
      kind: 'decision',
      title: 'A cópia que não chega à outra conta',
      prompt:
        'Uma empresa criou uma **conta de backup** separada e configurou uma regra que copia os backups para um cofre nela. As cópias **falham**: a conta de backup foi criada **fora do AWS Organizations** em que estão as contas de produção. Qual ajuste faz as cópias funcionarem?',
      concepts: [{ id: 'bkp.copy' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Usar a mesma chave do KMS nos cofres das duas contas.', correct: false, consequence: 'Chaves não atravessam contas assim, e o bloqueio é a organização.' },
        { id: 'b', text: 'Trocar a cópia entre contas por uma cópia para outra Região.', correct: false, consequence: 'Protege da perda da Região, mas não da invasão da conta de produção.' },
        { id: 'c', text: 'Pôr a conta de backup na mesma organização das contas.', correct: true, consequence: 'A cópia entre contas exige o mesmo AWS Organizations.' },
        { id: 'd', text: 'Dar à conta de backup uma role de administrador na produção.', correct: false, consequence: 'Abre a produção para a conta de backup e não habilita a cópia.' },
      ],
      explanation: [
        'A **cópia entre contas** do AWS Backup exige que as contas estejam no **mesmo AWS Organizations**. Com a conta de backup na organização, a regra copia os pontos para o cofre dela, e quem domina a conta de produção não alcança essas cópias.',
        'A chave do KMS e uma role de administrador não habilitam o recurso, e a role ainda amplia o acesso. A cópia para outra Região resolve outro risco.',
        '**Regra prática:** conta de backup isolada para resistir a invasões, sempre dentro da mesma organização das contas de origem.',
      ],
    },
    {
      id: 'rv:fil.f07.m3.a4',
      kind: 'decision',
      title: 'Voltar rápido depois da invasão',
      prompt:
        'Se a conta de produção de um hospital for invadida, o plano é **restaurar os sistemas a partir de uma conta de recuperação**, direto dos backups, sem precisar copiá-los de volta antes. Os backups não podem ser apagados por ninguém antes do fim da retenção. Qual solução atende?',
      concepts: [{ id: 'bkp.air-gapped' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar o Vault Lock em modo governança no cofre de produção.', correct: false, consequence: 'Quem tem a permissão remove a trava, e o cofre fica na conta invadida.' },
        { id: 'b', text: 'Aumentar a retenção do cofre de produção para dez anos.', correct: false, consequence: 'O invasor com permissão apaga do mesmo jeito.' },
        { id: 'c', text: 'Copiar os backups para outra Região na mesma conta.', correct: false, consequence: 'Continua na conta invadida, e a recuperação depende dela.' },
        { id: 'd', text: 'Cofre logicamente isolado compartilhado com a recuperação.', correct: true, consequence: 'A conta de recuperação restaura direto do cofre, que nasce trancado.' },
      ],
      explanation: [
        'O **cofre logicamente isolado** vem com o **Vault Lock em conformidade**, e ninguém apaga os backups antes do fim da retenção. Ele pode ser **compartilhado** com outras contas (pelo AWS RAM ou por aprovação de várias pessoas), que **restauram direto dele**, mesmo com a conta dona comprometida.',
        'O modo governança pode ser removido por quem tem permissão. Retenção longa e cópia na mesma conta deixam tudo ao alcance do invasor.',
        '**Regra prática:** voltar rápido de um ransomware a partir de outra conta é o cofre logicamente isolado compartilhado com a conta de recuperação.',
      ],
    },
    {
      id: 'rv:fil.f07.m3.a5',
      kind: 'decision',
      title: 'A prova de que o backup volta',
      prompt:
        'O RTO combinado de um sistema é de **4 horas**. Os relatórios mostram todos os trabalhos de backup concluídos, mas ninguém sabe **quanto tempo uma restauração leva**. A diretoria quer essa medição **todo mês**, sem trabalho manual e **sem afetar a produção**. Qual solução atende?',
      concepts: [{ id: 'bkp.restore-testing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Conferir no console se os trabalhos de backup terminaram.', correct: false, consequence: 'Backup concluído não prova que a restauração funciona nem quanto leva.' },
        { id: 'b', text: 'Um técnico restaura um backup por mês e anota o tempo.', correct: false, consequence: 'Funciona, mas é trabalho manual, que a diretoria quer evitar.' },
        { id: 'c', text: 'Teste de restauração mensal, numa conta separada.', correct: true, consequence: 'Restaura, mede o tempo e apaga o restaurado, longe da produção.' },
        { id: 'd', text: 'Aumentar a frequência dos backups para a cada hora.', correct: false, consequence: 'Melhora o RPO, mas não mede o tempo de restauração.' },
      ],
      explanation: [
        'O **teste de restauração** do AWS Backup restaura, num agendamento, backups escolhidos (o mais recente ou um aleatório), **mede o tempo** de cada restauração e **apaga o que foi restaurado** ao fim. A AWS recomenda rodá-lo numa **conta separada**, e o Audit Manager pode conferir se o tempo ficou dentro da meta.',
        'Trabalhos concluídos não provam a restauração. A restauração manual cumpre o objetivo com o esforço que se quer evitar. Mais backups mexem no RPO, não no RTO.',
        '**Regra prática:** "comprovar periodicamente que os backups restauram dentro do RTO" é o teste de restauração do AWS Backup.',
      ],
    },
  ],
}
