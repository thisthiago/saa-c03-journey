/**
 * Questões da Revisão da Fase 7 da S3 Expedition (replicação e recuperação de
 * desastres), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 's3x.f07',
  questions: [
    {
      id: 'rv:s3x.f07.logs-centralizados',
      kind: 'decision',
      title: 'Logs de doze contas num só lugar',
      prompt:
        'Uma empresa tem 12 contas AWS, todas em us-east-1, e quer reunir os logs gravados nos buckets de cada uma num bucket central da conta de segurança, **também em us-east-1**. Os logs novos devem chegar sozinhos, com o **menor custo e esforço**. O que atende?',
      concepts: [{ id: 'repl.crr-srr' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Same-Region Replication de cada bucket para o bucket central.', correct: true, consequence: 'Copia os logs novos sozinha, entre contas, sem cobrança de transferência entre Regiões.' },
        { id: 'b', text: 'Cross-Region Replication de cada bucket para um bucket central em us-west-2.', correct: false, consequence: 'Funciona, mas paga transferência entre Regiões sem nenhum requisito que peça outra Região.' },
        { id: 'c', text: 'Um script agendado em cada conta que copia os logs novos toda hora.', correct: false, consequence: 'Funciona, mas cria doze scripts para manter, monitorar e corrigir.' },
        { id: 'd', text: 'Tornar públicos os buckets de logs para a conta de segurança lê-los.', correct: false, consequence: 'Expõe os logs à internet e não junta nada num lugar só.' },
      ],
      explanation: [
        'A replicação copia objetos novos, de forma assíncrona, para outro bucket, inclusive de **outra conta**. Como origem e destino ficam na **mesma Região**, a **SRR** atende sem a cobrança de transferência entre Regiões que a CRR tem.',
        'A CRR paga por uma Região que ninguém pediu. Scripts dão trabalho de operação. E tornar os buckets públicos é um risco grave sem resolver o requisito.',
        '**Regra prática:** "centralizar logs de várias contas" ou "cópia em outra conta na mesma Região" pede SRR; "cópia em outra Região para desastres", CRR.',
      ],
    },
    {
      id: 'rv:repl.requirements:conta',
      kind: 'decision',
      title: 'Réplicas com status FAILED',
      prompt:
        'Uma regra replica um bucket da conta A para um bucket da conta B, usado como cópia de recuperação. Os dois buckets têm versionamento, e o papel IAM de replicação, na conta A, tem as permissões necessárias. Mesmo assim, as réplicas ficam com status **FAILED**. O que falta?',
      concepts: [{ id: 'repl.requirements' }, { id: 'repl.crr-srr' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Configurar o bucket de destino da conta B como Requester Pays.', correct: false, consequence: 'Em replicação entre contas, o destino não pode ser Requester Pays.' },
        { id: 'b', text: 'Desabilitar o versionamento no bucket de destino.', correct: false, consequence: 'O versionamento no destino é obrigatório: sem ele, a replicação falha.' },
        { id: 'c', text: 'Uma bucket policy no destino liberando o papel da conta A.', correct: true, consequence: 'Com a autorização do lado do destino, as réplicas passam a ser gravadas.' },
        { id: 'd', text: 'Ligar o S3 Replication Time Control na regra de replicação.', correct: false, consequence: 'O RTC define tempo e métricas; não concede permissão na outra conta.' },
      ],
      explanation: [
        'Os pré-requisitos da replicação são: **versionamento na origem e no destino**, um **papel IAM** que o S3 assume para replicar e, **entre contas**, uma **bucket policy no destino** autorizando a conta de origem. Só falta o último.',
        'Requester Pays não é aceito no destino entre contas. Desabilitar o versionamento quebraria a replicação. E o RTC não muda permissões.',
        '**Regra prática:** replicação que não funciona costuma ter um pré-requisito faltando. Entre contas, confira primeiro a bucket policy do destino; com SSE-KMS, as permissões da chave.',
      ],
    },
    {
      id: 'rv:s3x.f07.m3.a2',
      kind: 'decision',
      title: 'Apagar uma versão na origem',
      prompt:
        'Um bucket em sa-east-1 replica para um bucket em us-east-1, usado para recuperação de desastres. Um administrador apaga uma versão específica de um contrato na origem, **informando o versionId**. A diretoria quer saber o que acontece com a **cópia em us-east-1**. Qual resposta está correta?',
      concepts: [{ id: 'repl.what-not' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A mesma versão também é apagada no destino, para manter os dois iguais.', correct: false, consequence: 'Exclusões com versionId não são replicadas: o destino não é alterado.' },
        { id: 'b', text: 'Um delete marker é criado no destino, escondendo a versão.', correct: false, consequence: 'Delete markers vêm de DELETEs sem versionId; um DELETE com versionId não chega ao destino.' },
        { id: 'c', text: 'A versão é apagada no destino depois de 24 horas, se ninguém cancelar.', correct: false, consequence: 'Não existe exclusão adiada na replicação: o DELETE com versionId não é replicado.' },
        { id: 'd', text: 'A versão continua guardada em us-east-1.', correct: true, consequence: 'A cópia de recuperação é preservada contra exclusões feitas na origem.' },
      ],
      explanation: [
        'Uma exclusão **com versionId** apaga a versão **só na origem**: ela não é replicada, e a réplica em us-east-1 continua guardada. Isso protege a cópia de recuperação contra exclusões feitas na origem.',
        'O destino não recebe a exclusão, nem como delete marker nem de forma adiada. Delete markers vêm de DELETEs sem versionId, e mesmo eles só são replicados se a regra pedir.',
        '**Regra prática:** a replicação copia o que chega, não o que é apagado por versão. Mesmo assim, ela não substitui um backup: para comprometimento da conta, a cópia precisa estar em outra conta.',
      ],
    },
    {
      id: 'rv:s3x.f07.m3.a3',
      kind: 'decision',
      multiple: true,
      title: 'O que falta no bucket de recuperação',
      prompt:
        'Uma seguradora configurou a replicação do bucket de apólices para outra Região há um mês, com as opções padrão. Uma auditoria encontrou objetos da origem que **não estão no destino**, sem nenhuma falha registrada. Quais objetos, por padrão, **não são replicados**? (Escolha DUAS.)',
      concepts: [{ id: 'repl.what-not' }, { id: 'repl.batch' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Os objetos gravados antes de a regra de replicação existir.', correct: true, consequence: 'A replicação só copia objetos novos; os anteriores pedem a S3 Batch Replication.' },
        { id: 'b', text: 'Os objetos criptografados com SSE-S3, a criptografia padrão.', correct: false, consequence: 'Objetos SSE-S3 são replicados sem nenhuma configuração extra.' },
        { id: 'c', text: 'Os objetos guardados no Glacier Flexible Retrieval ou no Deep Archive.', correct: true, consequence: 'Objetos nessas classes não são replicados por padrão.' },
        { id: 'd', text: 'Os objetos enviados por multipart upload, por serem grandes.', correct: false, consequence: 'O método de envio não importa: o objeto concluído é replicado.' },
        { id: 'e', text: 'Os objetos cujas keys começam com letra maiúscula.', correct: false, consequence: 'O formato da key não afeta a replicação.' },
      ],
      explanation: [
        'Por padrão, a replicação **não copia**: objetos anteriores à configuração, objetos no **Glacier Flexible Retrieval ou no Deep Archive**, réplicas vindas de outra regra, ações do ciclo de vida e exclusões de versão específica. Os objetos antigos podem ser copiados com a **S3 Batch Replication**.',
        'Objetos SSE-S3, enviados por multipart upload ou com qualquer formato de key são replicados normalmente.',
        '**Regra prática:** depois de configurar a replicação num bucket que já tem dados, rode a Batch Replication para os objetos existentes; ela também reprocessa os que falharam.',
      ],
    },
    {
      id: 'rv:s3x.f07.espelhar-exclusoes',
      kind: 'decision',
      title: 'Arquivos apagados que continuam no destino',
      prompt:
        'Uma empresa replica um bucket para outro, com uma regra que filtra por prefixo. Quando um usuário apaga um arquivo na origem (DELETE sem versionId), ele **continua aparecendo na listagem do destino**. A empresa quer que o destino **espelhe essas exclusões**. O que fazer?',
      concepts: [{ id: 'repl.delete-markers' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Esperar: delete markers chegam ao destino com algumas horas de atraso.', correct: false, consequence: 'Na configuração atual, delete markers não são replicados por padrão: não há atraso, eles não chegam.' },
        { id: 'b', text: 'Habilitar o DeleteMarkerReplication na regra de replicação.', correct: true, consequence: 'Os delete markers passam a ser replicados, e o arquivo some da listagem do destino.' },
        { id: 'c', text: 'Criar no destino uma regra de ciclo de vida que apague tudo o que sumiu da origem.', correct: false, consequence: 'O ciclo de vida age por idade e filtros; ele não sabe o que foi apagado na origem.' },
        { id: 'd', text: 'Desabilitar o versionamento no destino, para as exclusões valerem direto.', correct: false, consequence: 'Sem versionamento no destino, a replicação inteira falha.' },
      ],
      explanation: [
        'Com a configuração atual de replicação (com Filter), **delete markers não são replicados por padrão**. Para o destino espelhar as exclusões feitas sem versionId, habilite o **DeleteMarkerReplication** na regra. Ele não está disponível em regras com filtro por tag; aqui o filtro é por prefixo.',
        'Esperar não resolve. O ciclo de vida não conhece as exclusões da origem. E desabilitar o versionamento no destino quebra a replicação.',
        '**Regra prática:** delete markers só vão para o destino quando a regra pede. Exclusões com versionId nunca vão, o que protege as réplicas.',
      ],
    },
    {
      id: 'rv:s3x.f07.m3.a5',
      kind: 'decision',
      title: 'Os laudos criptografados que não chegam',
      prompt:
        'Uma regra replica laudos de sa-east-1 para us-east-1, na mesma conta. Os laudos com SSE-S3 chegam normalmente, mas os criptografados com **SSE-KMS**, usando uma chave gerenciada pelo cliente em sa-east-1, **não são replicados**. O que precisa ser configurado?',
      concepts: [{ id: 'repl.kms' }, { id: 'repl.requirements' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar a criptografia padrão do destino para SSE-KMS com a chave de sa-east-1.', correct: false, consequence: 'Chaves do KMS são regionais: a chave de sa-east-1 não é usada em us-east-1, e falta o opt-in na regra.' },
        { id: 'b', text: 'Ligar o S3 Replication Time Control, que inclui objetos SSE-KMS.', correct: false, consequence: 'O RTC trata de tempo e métricas; ele não habilita a replicação de objetos SSE-KMS.' },
        { id: 'c', text: 'Dar ao papel de replicação só `kms:Decrypt` na chave de origem.', correct: false, consequence: 'Falta o opt-in na regra, a chave de destino e o `kms:Encrypt` nela.' },
        { id: 'd', text: 'Opt-in na regra, chave em us-east-1, `kms:Decrypt` e `kms:Encrypt`.', correct: true, consequence: 'Com as três peças, o S3 descriptografa na origem e cifra as réplicas no destino.' },
      ],
      explanation: [
        'Objetos **SSE-KMS** exigem três coisas na replicação: o **opt-in** na regra (SseKmsEncryptedObjects), uma **chave para as réplicas na Região de destino** e, no papel de replicação, **`kms:Decrypt`** na chave de origem e **`kms:Encrypt`** na chave das réplicas.',
        'A chave de sa-east-1 não é usada em us-east-1. O RTC não habilita objetos SSE-KMS. E só `kms:Decrypt` deixa de fora o opt-in e a chave de destino.',
        '**Regra prática:** replicação que copia tudo menos os objetos SSE-KMS pede o opt-in na regra, uma chave no destino e as duas permissões do KMS no papel.',
      ],
    },
    {
      id: 'rv:s3x.f07.boss.a4',
      kind: 'decision',
      title: 'Atalho na cifra das réplicas',
      prompt:
        'Para recuperação de desastres, uma empresa vai replicar objetos SSE-KMS da conta A para um bucket da conta B, em outra Região. Para simplificar, a equipe quer cifrar as réplicas com a chave gerenciada pela AWS **`aws/s3`** da conta B. Qual avaliação está correta?',
      concepts: [{ id: 'repl.kms' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Funciona, desde que a key policy da `aws/s3` de B libere a conta A.', correct: false, consequence: 'A key policy da `aws/s3` não pode ser alterada.' },
        { id: 'b', text: 'Funciona sem ajuste, porque a `aws/s3` existe em toda conta e Região.', correct: false, consequence: 'Ela existe, mas não permite uso por outras contas, e o papel de replicação é da conta A.' },
        { id: 'c', text: 'Não funciona: entre contas, a chave precisa ser do cliente.', correct: true, consequence: 'Com uma chave gerenciada pelo cliente em B, liberada para o papel da conta A, a replicação funciona.' },
        { id: 'd', text: 'Não funciona: objetos SSE-KMS não podem ser replicados entre contas.', correct: false, consequence: 'Podem, com o opt-in e uma chave gerenciada pelo cliente no destino.' },
      ],
      explanation: [
        'O papel de replicação, da conta A, precisa usar a chave das réplicas, da conta B. Chaves gerenciadas pela AWS, como a **`aws/s3`**, **não permitem uso por outras contas**, e a key policy delas não pode ser alterada. Por isso, **entre contas, a chave das réplicas precisa ser gerenciada pelo cliente**.',
        'Não há como liberar a `aws/s3` para outra conta. E a replicação de objetos SSE-KMS entre contas é possível, com a chave certa.',
        '**Regra prática:** dados cifrados com KMS que cruzam contas pedem chaves gerenciadas pelo cliente, em qualquer serviço.',
      ],
    },
    {
      id: 'rv:s3x.f07.m1.a2',
      kind: 'decision',
      title: 'A replicação resolve o plano de desastre?',
      prompt:
        'O plano de recuperação de desastres de um sistema de documentos exige **RPO de 1 hora e RTO de 4 horas**. A equipe configurou a CRR do bucket para outra Região e declarou: "com a replicação, as duas metas estão cumpridas". A aplicação, porém, lê o bucket da Região principal, com o nome dele fixo na configuração. Qual avaliação está correta?',
      concepts: [{ id: 'dr.rpo-rto' }, { id: 'repl.crr-srr' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Está certa: num desastre, o S3 passa a servir o bucket de destino sozinho.', correct: false, consequence: 'A replicação não redireciona nada: a aplicação continua apontando para o bucket da origem.' },
        { id: 'b', text: 'Ajuda no RPO; o RTO depende da troca do bucket na aplicação.', correct: true, consequence: 'A equipe planeja e testa a troca do bucket na aplicação para caber nas 4 horas.' },
        { id: 'c', text: 'A replicação ajuda no RTO; o RPO depende de backups diários do bucket.', correct: false, consequence: 'Inverte os conceitos: a cópia contínua é o que reduz o RPO.' },
        { id: 'd', text: 'Só o Replication Time Control faz a replicação atender ao RTO.', correct: false, consequence: 'O RTC torna previsível o tempo de cópia, que é RPO; o RTO depende da troca na aplicação.' },
      ],
      explanation: [
        '**RPO** é quanto dado se aceita perder; **RTO**, em quanto tempo o serviço precisa voltar. A replicação mantém uma cópia recente em outra Região, e isso **reduz o RPO**. O **RTO depende de como a aplicação passa a usar o destino**: com o nome do bucket fixo, alguém precisa trocar a configuração e publicar a aplicação no prazo.',
        'O S3 não redireciona a aplicação sozinho. A cópia contínua é o que atende ao RPO, não ao RTO. E o RTC melhora a previsibilidade da cópia, que também é RPO.',
        '**Regra prática:** ao avaliar um plano de desastre, separe a cópia dos dados (RPO) da troca do serviço (RTO). A segunda precisa ser planejada e testada.',
      ],
    },
    {
      id: 'rv:s3x.f07.rtc-acima-da-cota',
      kind: 'decision',
      title: 'Quinze minutos prometidos num bucket muito movimentado',
      prompt:
        'Uma empresa usa CRR com **S3 Replication Time Control** e prometeu aos clientes um RPO de 15 minutos para os arquivos em outra Região. Nos fechamentos de mês, o bucket recebe cerca de **3 Gbps** de dados novos, de forma contínua, com a cota padrão da conta. Qual avaliação está correta?',
      concepts: [{ id: 'repl.rtc' }, { id: 'dr.rpo-rto' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'O SLA não vale acima da cota de 1 Gbps: pedir aumento.', correct: true, consequence: 'Com a cota ajustada ao volume, o SLA do RTC volta a se aplicar nos picos.' },
        { id: 'b', text: 'O RTC garante 15 minutos para todos os objetos, em qualquer volume de dados.', correct: false, consequence: 'O SLA cobre 99,9% dos objetos e não se aplica acima da cota padrão de 1 Gbps.' },
        { id: 'c', text: 'Trocar a CRR por SRR resolve, porque a mesma Região replica sem limite de banda.', correct: false, consequence: 'A cópia ficaria na mesma Região, o que não atende ao plano de desastre.' },
        { id: 'd', text: 'Basta ligar a S3 Batch Replication nos fechamentos de mês.', correct: false, consequence: 'A Batch Replication é sob demanda e não tem o SLA de 15 minutos do RTC.' },
      ],
      explanation: [
        'O **Replication Time Control** replica 99,9% dos objetos em até 15 minutos, com métricas e eventos. Mas o **SLA não se aplica quando a transferência excede a cota padrão de 1 Gbps** ou as diretrizes de requisições por segundo. Com 3 Gbps, a empresa precisa pedir o aumento da cota.',
        'O RTC não cobre qualquer volume. A SRR deixaria a cópia na mesma Região. E a Batch Replication não tem SLA de tempo.',
        '**Regra prática:** "RPO de 15 minutos para o S3 em outra Região" aponta para CRR com RTC. Em volumes altos, confira a cota antes de prometer o SLA.',
      ],
    },
  ],
}
