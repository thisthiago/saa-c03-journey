/**
 * Questões da Revisão da Fase 9 da S3 Expedition (Requester Pays e cenários
 * especiais), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md); preços de us-east-1 da AWS Price
 * List de 16/10/2026. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 's3x.f09',
  questions: [
    {
      id: 'rv:s3x.f09.boss.a2',
      kind: 'decision',
      title: 'O site que parou depois da economia',
      prompt:
        'Um museu serve o próprio site, aberto ao público, a partir de um bucket S3. Para cortar a conta de transferência, alguém ligou o **Requester Pays** no bucket, e desde então **todos os visitantes recebem erro 403**. O museu quer o site de volta e **reduzir o custo de transferência**. O que fazer?',
      concepts: [{ id: 'rp.limits' }, { id: 'rp.header' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Incluir o cabeçalho `x-amz-request-payer` nos links das páginas do site.', correct: false, consequence: 'Visitantes anônimos não têm conta para pagar: o bucket recusa qualquer requisição anônima.' },
        { id: 'b', text: 'Manter o Requester Pays e liberar leitura pública na bucket policy.', correct: false, consequence: 'A permissão pública não resolve: o Requester Pays continua recusando requisições anônimas.' },
        { id: 'c', text: 'Desligar o Requester Pays e servir o site pelo CloudFront, com cache.', correct: true, consequence: 'O site volta, e o cache nos POPs reduz as idas ao bucket e o custo de transferência.' },
        { id: 'd', text: 'Esperar a mudança se propagar, o que leva até 24 horas.', correct: false, consequence: 'Não há propagação: o Requester Pays recusa visitantes anônimos imediatamente e para sempre.' },
      ],
      explanation: [
        'Num bucket **Requester Pays**, quem faz a requisição paga, e precisa ser identificado e aceitar a cobrança com o cabeçalho `x-amz-request-payer`. **Requisições anônimas não são aceitas**: um site público não funciona assim. A forma de reduzir a transferência de um site é o **CloudFront**, com cache nos POPs.',
        'Cabeçalhos nos links ou permissão pública não mudam o fato de que visitantes anônimos não têm como pagar. E não há propagação a esperar.',
        '**Regra prática:** Requester Pays é para requisitantes com conta AWS. Para público anônimo, o caminho para cortar transferência é o cache na borda.',
      ],
    },
    {
      id: 'rv:s3x.f09.m1.a2',
      kind: 'decision',
      title: 'Downloads que não mudaram de fatura',
      prompt:
        'Um instituto ligou o Requester Pays num bucket de dados climáticos para que as universidades paguem os próprios downloads. Para dar acesso, criou na **conta do instituto** uma role que as universidades assumem antes de baixar. No fim do mês, os downloads continuam **na fatura do instituto**. Qual é a causa?',
      concepts: [{ id: 'rp.assumed-role' }, { id: 'rp.basics' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O Requester Pays só vale para downloads acima de 1 GB.', correct: false, consequence: 'Não há limite de tamanho: todo download de um requisitante identificado é cobrado dele.' },
        { id: 'b', text: 'Com um papel assumido, paga a conta dona do papel: aqui, o próprio instituto.', correct: true, consequence: 'As universidades devem acessar com identidades das próprias contas, liberadas na bucket policy.' },
        { id: 'c', text: 'As universidades esqueceram o cabeçalho, e o S3 cobrou o dono.', correct: false, consequence: 'Sem o cabeçalho, a requisição é recusada, não cobrada do dono.' },
        { id: 'd', text: 'O dono do bucket sempre paga a transferência; o Requester Pays só repassa as requisições.', correct: false, consequence: 'O dono paga sempre o armazenamento; requisições e downloads vão para quem requisita.' },
      ],
      explanation: [
        'Quando o requisitante **assume uma role** antes da requisição, quem paga é a **conta dona da role**, não a conta de quem a assumiu. Como a role é do instituto, a cobrança volta para ele. As universidades devem usar identidades das **próprias contas**, liberadas na bucket policy.',
        'Não há limite de tamanho. Sem o cabeçalho, a requisição é recusada. E, no Requester Pays, o dono paga só o armazenamento.',
        '**Regra prática:** no Requester Pays, paga a conta da identidade que faz a requisição. Roles na conta do dono trazem a conta de volta para ele.',
      ],
    },
    {
      id: 'rv:s3x.f09.restauracao-requester-pays',
      kind: 'decision',
      title: 'Quem paga a restauração do arquivo',
      prompt:
        'Num bucket Requester Pays de um instituto, parte do acervo fica no S3 Glacier Flexible Retrieval. Uma universidade, com a própria conta e o cabeçalho de aceite, pede a **restauração** de um arquivo com RestoreObject e depois o baixa. Como a cobrança da restauração se divide?',
      concepts: [{ id: 'rp.403' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'A universidade paga a requisição de restauração e a recuperação dos dados.', correct: false, consequence: 'No RestoreObject, a recuperação dos dados fica com o dono do bucket.' },
        { id: 'b', text: 'O instituto paga tudo, porque restauração não é coberta pelo Requester Pays.', correct: false, consequence: 'A requisição de restauração é cobrada da universidade, que a fez.' },
        { id: 'c', text: 'A universidade paga a requisição; o instituto paga a recuperação dos dados.', correct: true, consequence: 'É a divisão documentada para RestoreObject em buckets Requester Pays.' },
        { id: 'd', text: 'Cada um paga metade da requisição e metade da recuperação.', correct: false, consequence: 'Não há divisão pela metade: cada parcela tem um pagador.' },
      ],
      explanation: [
        'Em buckets Requester Pays, o **RestoreObject** tem uma divisão própria: o **requisitante paga a requisição**, e o **dono paga a recuperação** dos dados arquivados. O download depois da restauração segue a regra normal e é cobrado da universidade.',
        'Outro detalhe da mesma família: um erro 403 iniciado dentro da conta ou da organização do dono é cobrado do dono.',
        '**Regra prática:** no Requester Pays, o dono paga sempre o armazenamento e, no RestoreObject, também a recuperação. Requisições e downloads vão para quem requisita.',
      ],
    },
    {
      id: 'rv:s3x.f09.m2.a1',
      kind: 'decision',
      title: 'A parcela que pesa na conta do dataset',
      prompt:
        'Uma agência pública guarda **20.000 GB** de imagens de satélite no S3 Standard, e o público baixa cerca de **200.000 GB por mês** pela internet. A diretoria pediu para **reduzir a conta** e um analista sugeriu trocar a classe de armazenamento. Com os preços de referência abaixo, qual avaliação está correta?',
      exhibits: [
        {
          title: 'Preços de referência (us-east-1, primeira faixa)',
          code: 'S3 Standard: armazenamento           US$ 0,023 por GB-mês\nTransferência do S3 para a internet   US$ 0,09 por GB\n\nPara simplificar, todo o volume usa a primeira faixa.',
        },
      ],
      concepts: [{ id: 's3.data-transfer' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O armazenamento domina: trocar de classe corta a maior parte da conta.', correct: false, consequence: 'O armazenamento é cerca de US$ 460; a transferência, cerca de US$ 18.000.' },
        { id: 'b', text: 'A transferência é gratuita no S3, então só o armazenamento conta.', correct: false, consequence: 'Só a entrada de dados é gratuita; a saída para a internet é cobrada por GB.' },
        { id: 'c', text: 'Mover para o Standard-IA corta a conta quase pela metade.', correct: false, consequence: 'Mexe na parcela pequena e ainda soma a taxa de recuperação sobre 200.000 GB lidos.' },
        { id: 'd', text: 'A transferência domina; trocar de classe quase não muda a conta.', correct: true, consequence: 'A diretoria passa a olhar para cache na borda ou Requester Pays, onde está o dinheiro.' },
      ],
      explanation: [
        'Pelas premissas, o armazenamento custa 20.000 GB × US$ 0,023 = **US$ 460** por mês, e a transferência, 200.000 GB × US$ 0,09 = **US$ 18.000**. A transferência é quase 98% da conta: mexer na classe de armazenamento ataca a parcela pequena.',
        'A saída para a internet é cobrada por GB. E o Standard-IA ainda acrescentaria a taxa de recuperação sobre os 200.000 GB lidos.',
        '**Regra prática:** em datasets muito baixados, olhe primeiro a transferência. As saídas costumam ser cache na borda com o CloudFront ou passar o custo ao requisitante com o Requester Pays.',
      ],
    },
    {
      id: 'rv:s3x.f09.m2.a3',
      kind: 'decision',
      multiple: true,
      title: 'Dois públicos para o mesmo acervo',
      prompt:
        'Um instituto de pesquisa publica um acervo de 400 TB para dois públicos: **universidades com conta AWS**, que baixam o acervo inteiro com frequência, e o **público em geral**, sem conta, que consulta arquivos populares pelo site. O instituto quer **reduzir o custo dos downloads** dos dois públicos e continuar pagando o armazenamento. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'rp.basics' }, { id: 's3.data-transfer' }, { id: 'rp.limits' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um bucket Requester Pays para as universidades, com permissão às contas delas.', correct: true, consequence: 'As universidades pagam os próprios downloads, e o instituto continua pagando o armazenamento.' },
        { id: 'b', text: 'Ligar o Requester Pays também no bucket que serve o público em geral.', correct: false, consequence: 'O Requester Pays recusa requisições anônimas: o público ficaria sem acesso.' },
        { id: 'c', text: 'CloudFront com cache na frente do bucket que serve o público em geral.', correct: true, consequence: 'Os arquivos populares saem do cache nos POPs, reduzindo as idas ao bucket.' },
        { id: 'd', text: 'Mover o acervo para o Standard-IA, que cobra menos pelos downloads.', correct: false, consequence: 'O Standard-IA reduz o armazenamento e ainda cobra recuperação por GB lido: os downloads ficam mais caros.' },
        { id: 'e', text: 'Tornar o bucket das universidades público, para não exigir permissões.', correct: false, consequence: 'O instituto passaria a pagar todos os downloads, de qualquer pessoa.' },
      ],
      explanation: [
        'Cada público pede uma ferramenta. As universidades têm conta AWS: com o **Requester Pays** e permissão às contas delas, elas pagam requisições e downloads. O público em geral é anônimo, então o Requester Pays não serve; o **CloudFront**, com cache, reduz as idas ao bucket para os arquivos populares.',
        'Requester Pays para o público anônimo bloqueia o acesso. O Standard-IA encarece os downloads. E um bucket público joga toda a transferência na conta do instituto.',
        '**Regra prática:** "compartilhar um grande dataset com outras contas AWS sem pagar pelos downloads delas" pede Requester Pays. Público sem conta pede cache na borda.',
      ],
    },
  ],
}
