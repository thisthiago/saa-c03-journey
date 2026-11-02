/**
 * Questões da Revisão da Fase 6 da S3 Expedition (lifecycle e automação), no
 * formato do exame SAA-C03. Fatos conferidos em 16/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 's3x.f06',
  questions: [
    {
      id: 'rv:lc.rules:filtro',
      kind: 'decision',
      title: 'Uma regra com dois filtros',
      prompt:
        'Uma equipe quer expirar, depois de 30 dias, **tanto** os objetos do prefixo `logs/` **quanto** os objetos marcados com a tag `tipo=temporario`, estejam onde estiverem. Ela criou **uma única regra** de ciclo de vida com os dois filtros. Um mês depois, muitos objetos que deviam ter sumido continuam no bucket. Qual é a explicação e a correção?',
      concepts: [{ id: 'lc.rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Os filtros de uma regra se combinam com AND: criar duas regras, uma por filtro.', correct: true, consequence: 'Com duas regras, cada objeto que atende a um dos critérios expira, como a equipe queria.' },
        { id: 'b', text: 'Filtros por tag só valem para objetos criados depois da regra: recriar os objetos.', correct: false, consequence: 'As regras alcançam também os objetos que já estavam no bucket, com ou sem tag.' },
        { id: 'c', text: 'Uma regra só aceita um filtro: o S3 ignorou o de tag e aplicou só o prefixo.', correct: false, consequence: 'Uma regra aceita prefixo, tags e tamanho juntos; o S3 combina todos.' },
        { id: 'd', text: 'A expiração precisa de versionamento: habilitá-lo no bucket.', correct: false, consequence: 'Num bucket sem versionamento, a expiração exclui o objeto de vez; versionamento não é pré-requisito.' },
      ],
      explanation: [
        'Numa regra de ciclo de vida, os filtros por prefixo, tags e tamanho se combinam com **AND**: a regra só alcança objetos em `logs/` **e** com a tag `tipo=temporario`. Para expirar quem atende a **um ou outro** critério, são precisas **duas regras**, uma por filtro.',
        'As regras valem também para objetos que já existiam. Uma regra aceita vários filtros. E a expiração funciona sem versionamento, excluindo o objeto de vez.',
        '**Regra prática:** filtros dentro de uma regra são AND; para um OU, crie regras separadas. Um filtro vazio vale para o bucket inteiro.',
      ],
    },
    {
      id: 'rv:s3x.f06.expiracao-retroativa',
      kind: 'decision',
      title: 'A regra nova num bucket de cinco anos',
      prompt:
        'Um bucket guarda notas fiscais dos últimos 5 anos. Para reduzir custo, alguém cria uma regra de ciclo de vida que **expira objetos com mais de 365 dias**, achando que ela só valerá para as notas que chegarem daqui em diante. A lei, porém, exige guardar as notas por 5 anos. Qual avaliação está correta?',
      concepts: [{ id: 'lc.rules' }, { id: 'lc.expiration' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Sem risco: a regra só conta os dias a partir da data em que foi criada.', correct: false, consequence: 'Os dias contam a partir da criação de cada objeto, não da regra.' },
        { id: 'b', text: 'Sem risco: a regra vale só para objetos gravados depois dela.', correct: false, consequence: 'As regras alcançam os objetos que já estão no bucket.' },
        { id: 'c', text: 'Sem risco: a bucket policy que nega exclusões impede a regra de apagar.', correct: false, consequence: 'Em buckets de uso geral, a bucket policy não impede as exclusões feitas pelo ciclo de vida.' },
        { id: 'd', text: 'Risco alto: as notas com mais de um ano seriam apagadas.', correct: true, consequence: 'Quatro anos de notas exigidas por lei seriam excluídos logo depois da regra entrar em vigor.' },
      ],
      explanation: [
        'Uma regra de ciclo de vida vale para **todos os objetos** do filtro, inclusive os que já estavam no bucket, e conta os dias **a partir da criação de cada objeto**. Uma expiração de 365 dias apagaria, de uma vez, as notas de mais de um ano, contra a exigência legal.',
        'A regra não conta a partir da própria criação nem vale só para objetos novos. E, em buckets de uso geral, uma bucket policy não barra as exclusões do ciclo de vida.',
        '**Regra prática:** antes de criar uma expiração, calcule quais objetos existentes ela alcança. O prazo da regra precisa respeitar a retenção exigida.',
      ],
    },
    {
      id: 'rv:s3x.f06.planos-de-transicao',
      kind: 'decision',
      multiple: true,
      title: 'Planos de transição para os relatórios',
      prompt:
        'Uma empresa está revisando cinco propostas de regra de ciclo de vida para relatórios que começam no S3 Standard. Quais propostas o S3 **aceita como transições válidas**? (Escolha DUAS.)',
      concepts: [{ id: 'lc.waterfall' }, { id: 'lc.rules' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Standard-IA aos 30 dias e Glacier Flexible Retrieval aos 120.', correct: true, consequence: 'As duas transições descem na cascata e respeitam a duração mínima de 30 dias do Standard-IA.' },
        { id: 'b', text: 'Glacier Flexible Retrieval aos 30 dias e Standard-IA aos 90.', correct: false, consequence: 'Não há transição de volta: do Glacier Flexible só se vai para o Deep Archive.' },
        { id: 'c', text: 'One Zone-IA aos 30 dias e Standard-IA aos 60.', correct: false, consequence: 'Transição lateral: o One Zone-IA só transiciona para o Glacier Flexible ou o Deep Archive.' },
        { id: 'd', text: 'Glacier Instant Retrieval aos 30 dias e Deep Archive aos 120.', correct: true, consequence: 'Desce na cascata e respeita os 90 dias mínimos do Glacier Instant Retrieval.' },
        { id: 'e', text: 'Deep Archive aos 30 dias e Glacier Flexible Retrieval aos 90.', correct: false, consequence: 'O Deep Archive é o fim da cascata: não transiciona para nenhuma classe.' },
      ],
      explanation: [
        'As transições só **descem na cascata**, de classes mais quentes para mais frias. Standard-IA e depois Glacier Flexible, ou Glacier Instant Retrieval e depois Deep Archive, descem e respeitam a duração mínima de cada classe dentro da regra.',
        'Do Glacier Flexible não se volta ao Standard-IA. Do One Zone-IA não se vai ao Standard-IA. E o Deep Archive não transiciona para nenhuma classe. Para tirar um objeto de uma classe arquivada, é preciso restaurar e copiar.',
        '**Regra prática:** alternativas com uma regra que move objetos de uma classe fria para uma mais quente, ou entre classes do mesmo nível, são inválidas.',
      ],
    },
    {
      id: 'rv:s3x.f06.m1.a3',
      kind: 'decision',
      title: 'Glacier Instant Retrieval e depois Deep Archive',
      prompt:
        'Uma regra de ciclo de vida move imagens médicas para o **Glacier Instant Retrieval aos 4 dias** de vida. A equipe quer, **na mesma regra**, levá-las para o Deep Archive o mais cedo possível. Qual é o **primeiro dia** aceito para essa segunda transição?',
      concepts: [{ id: 'lc.min-duration-rule' }, { id: 'lc.waterfall' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Dia 34: 30 dias depois da primeira transição.', correct: false, consequence: 'Trinta dias é a duração mínima do Standard-IA; a do Glacier Instant Retrieval é de 90.' },
        { id: 'b', text: 'Dia 94: 90 dias depois da primeira transição.', correct: true, consequence: 'A regra respeita os 90 dias mínimos do Glacier Instant Retrieval.' },
        { id: 'c', text: 'Dia 184: 180 dias depois da primeira transição.', correct: false, consequence: 'Cento e oitenta dias é a duração mínima do Deep Archive, a classe de destino, não a de origem.' },
        { id: 'd', text: 'Dia 5: as transições da cascata não têm intervalo mínimo.', correct: false, consequence: 'Dentro de uma regra, o objeto não sai de uma classe antes da duração mínima dela.' },
      ],
      explanation: [
        'Uma mesma regra **não tira o objeto de uma classe antes da duração mínima dela**. O Glacier Instant Retrieval tem duração mínima de 90 dias: se a imagem chega lá no dia 4, só pode ir para o Deep Archive **a partir do dia 94**. É o exemplo da própria documentação.',
        'Trinta dias é o mínimo do Standard-IA, e 180, o do Deep Archive, que é o destino. Não existe transição sem intervalo dentro da mesma regra.',
        '**Regra prática:** some a duração mínima da classe de origem ao dia da primeira transição. Com duas regras separadas é possível ir antes, mas paga-se o restante da duração mínima.',
      ],
    },
    {
      id: 'rv:s3x.f06.m2.a2',
      kind: 'decision',
      title: 'Os logs que não saíram do lugar',
      prompt:
        'Há três meses, uma empresa criou uma regra que move para o Glacier Flexible Retrieval todos os objetos do bucket com mais de 30 dias. Os arquivos de vídeo, de vários MB, já foram movidos, mas os **milhões de logs de 20 KB** continuam no S3 Standard. A regra não tem filtro de tamanho. Qual é a explicação?',
      concepts: [{ id: 'lc.small-objects' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'A regra só vale para objetos criados depois dela, e os logs são antigos.', correct: false, consequence: 'As regras alcançam os objetos existentes; os vídeos antigos foram movidos.' },
        { id: 'b', text: 'Por padrão, objetos menores que 128 KB não transicionam.', correct: true, consequence: 'É o comportamento padrão desde setembro de 2024; um filtro de tamanho explícito muda isso.' },
        { id: 'c', text: 'Logs precisam de uma tag para entrar em regras de transição.', correct: false, consequence: 'Sem filtro, a regra vale para o bucket inteiro; tags não são obrigatórias.' },
        { id: 'd', text: 'O Glacier Flexible Retrieval não aceita arquivos de texto como os logs.', correct: false, consequence: 'O S3 não distingue tipo de arquivo nas transições: o que conta é o tamanho.' },
      ],
      explanation: [
        'Desde setembro de 2024, **objetos menores que 128 KB não transicionam por padrão**. O motivo é custo: cada transição é cobrada por objeto, e, com objetos pequenos, a conta não fecha. Um filtro de tamanho explícito (ObjectSizeGreaterThan ou ObjectSizeLessThan) permite a transição, se ela compensar.',
        'A regra alcança objetos antigos, não exige tag e não distingue tipo de arquivo.',
        '**Regra prática:** milhões de objetos de poucos KB raramente compensam transição um a um. Antes de arquivar, avalie agrupá-los em arquivos maiores.',
      ],
    },
    {
      id: 'rv:s3x.f06.ultimas-versoes',
      kind: 'decision',
      title: 'Guardar só as versões mais recentes',
      prompt:
        'Num bucket versionado, cada arquivo de configuração é regravado várias vezes por semana. A equipe quer manter **a versão atual e as 2 versões anteriores mais recentes**, e apagar as demais de forma automática, sem mexer no versionamento. Qual configuração atende?',
      concepts: [{ id: 'lc.noncurrent' }, { id: 'lc.expiration' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Expiration da versão atual com 1 dia, para as anteriores saírem junto.', correct: false, consequence: 'Num bucket versionado, expirar a versão atual só cria um delete marker; as anteriores continuam guardadas.' },
        { id: 'b', text: 'Suspender o versionamento, para cada gravação substituir a anterior.', correct: false, consequence: 'Mexe no versionamento, não apaga as versões existentes e deixaria só uma versão por arquivo.' },
        { id: 'c', text: 'NoncurrentVersionTransition para o Glacier, guardando as antigas mais barato.', correct: false, consequence: 'Reduz o preço por GB, mas não apaga nada: as versões continuam se acumulando.' },
        { id: 'd', text: 'NoncurrentVersionExpiration com NewerNoncurrentVersions igual a 2.', correct: true, consequence: 'O S3 mantém as 2 versões não atuais mais recentes e apaga as mais antigas.' },
      ],
      explanation: [
        'As ações para **versões não atuais** existem para isso. **NoncurrentVersionExpiration** apaga versões não atuais, e **NewerNoncurrentVersions** diz quantas das mais recentes manter (de 1 a 100; a regra precisa de um elemento Filter). Com o valor 2, ficam a atual e as duas anteriores.',
        'A **Expiration** age só na versão atual e, num bucket versionado, cria um delete marker. Suspender o versionamento mexe na proteção e não apaga nada. Transicionar para o Glacier só muda o preço.',
        '**Regra prática:** "manter só as últimas N versões" num bucket versionado pede NoncurrentVersionExpiration com NewerNoncurrentVersions.',
      ],
    },
    {
      id: 'rv:s3x.f06.m3.a1',
      kind: 'decision',
      title: 'Quando a versão antiga transiciona',
      prompt:
        'Num bucket versionado, uma regra tem **NoncurrentVersionTransition** para o Standard-IA com **30 dias**. Um contrato foi criado há 100 dias e, **hoje**, foi substituído por uma versão nova. Quando a versão antiga do contrato vai para o Standard-IA?',
      concepts: [{ id: 'lc.noncurrent' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Hoje, porque ela já tem mais de 30 dias de vida.', correct: false, consequence: 'Para versões não atuais, conta o tempo desde que deixaram de ser atuais, não a idade.' },
        { id: 'b', text: 'Cerca de 30 dias depois de hoje.', correct: true, consequence: 'A contagem começa quando a versão deixou de ser a atual, ou seja, hoje.' },
        { id: 'c', text: 'Nunca, porque a regra só vale para versões que nasceram não atuais.', correct: false, consequence: 'Toda versão substituída vira não atual e passa a ser alcançada pela regra.' },
        { id: 'd', text: 'Quando a versão nova também completar 30 dias de vida.', correct: false, consequence: 'A versão nova é a atual: a idade dela não conta para a regra das não atuais.' },
      ],
      explanation: [
        'As ações para versões não atuais contam os dias **a partir de quando cada versão deixou de ser atual**, e não da criação do objeto. A versão antiga virou não atual hoje; ela transiciona cerca de 30 dias depois.',
        'A idade total da versão não importa para essa ação. Toda versão substituída entra na regra. E a idade da versão atual não muda nada.',
        '**Regra prática:** Transition e Expiration contam a partir da criação do objeto; NoncurrentVersionTransition e NoncurrentVersionExpiration, a partir do momento em que a versão deixou de ser atual.',
      ],
    },
    {
      id: 'rv:lc.expired-delete-markers:o-que',
      kind: 'decision',
      title: 'Limpeza recusada pelo S3',
      prompt:
        'Para limpar um bucket versionado, a equipe criou uma regra de ciclo de vida com **filtro pela tag** `limpeza=sim` e duas ações: **AbortIncompleteMultipartUpload** após 7 dias e **ExpiredObjectDeleteMarker**. O S3 recusou a configuração. Qual mudança faz a limpeza funcionar?',
      concepts: [{ id: 'lc.mpu-cleanup' }, { id: 'lc.expired-delete-markers' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Usar filtro de prefixo, ou nenhum filtro, em vez da tag.', correct: true, consequence: 'As duas ações aceitam filtro de prefixo ou nenhum filtro, e a regra passa a ser aceita.' },
        { id: 'b', text: 'Acrescentar Days à ação ExpiredObjectDeleteMarker, junto com a tag.', correct: false, consequence: 'Days e ExpiredObjectDeleteMarker não podem estar na mesma ação Expiration, e a tag continuaria sendo o problema.' },
        { id: 'c', text: 'Suspender o versionamento antes de aplicar a regra.', correct: false, consequence: 'O versionamento não tem relação com a recusa: o problema é o filtro por tag.' },
        { id: 'd', text: 'Trocar AbortIncompleteMultipartUpload por Expiration, mantendo a tag.', correct: false, consequence: 'A Expiration não remove uploads multipart incompletos, e a tag continuaria barrando a outra ação.' },
      ],
      explanation: [
        '**AbortIncompleteMultipartUpload** e **ExpiredObjectDeleteMarker** não podem ser usadas em regras com **filtro por tag**. Com filtro de prefixo, ou sem filtro, a regra passa a ser aceita: a primeira interrompe uploads incompletos, cujas partes são cobradas sem aparecer na listagem, e a segunda remove delete markers sem nenhuma versão por baixo.',
        'Days e ExpiredObjectDeleteMarker não convivem na mesma ação Expiration. O versionamento não muda a recusa. E a Expiration não remove uploads incompletos.',
        '**Regra prática:** limpezas de uploads incompletos e de delete markers expirados ficam em regras por prefixo ou para o bucket inteiro, nunca filtradas por tag.',
      ],
    },
    {
      id: 'rv:s3x.f06.m1.a4',
      kind: 'decision',
      title: 'Duas regras para o mesmo objeto',
      prompt:
        'Um bucket tem duas regras de ciclo de vida. A regra A move os objetos do prefixo `docs/` para o Glacier Flexible Retrieval aos 60 dias. A regra B **expira** os objetos com a tag `rascunho=sim` aos 60 dias. Um objeto em `docs/` com a tag `rascunho=sim` completa 60 dias. O que o S3 faz?',
      concepts: [{ id: 'lc.conflicts' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Move o objeto para o Glacier Flexible Retrieval e o expira depois.', correct: false, consequence: 'Quando as regras se sobrepõem, o S3 não encadeia as duas: escolhe uma ação.' },
        { id: 'b', text: 'Recusa as duas regras, porque elas se sobrepõem.', correct: false, consequence: 'O S3 aceita regras sobrepostas e resolve o conflito sozinho.' },
        { id: 'c', text: 'Expira o objeto, porque a expiração vence a transição.', correct: true, consequence: 'O S3 escolhe o caminho mais barato: excluir em vez de pagar por guardar.' },
        { id: 'd', text: 'Aplica a regra criada primeiro, ignorando a outra.', correct: false, consequence: 'A ordem de criação não importa; vale a precedência entre as ações.' },
      ],
      explanation: [
        'Quando regras se sobrepõem, o S3 escolhe o **caminho mais barato**: a **expiração vence a transição**, a expiração mais curta vence e, entre Glacier Flexible e Standard-IA no mesmo dia, vence o Glacier Flexible.',
        'O S3 não encadeia as ações das duas regras, aceita regras sobrepostas e não usa a ordem de criação.',
        '**Regra prática:** em conflito de ciclo de vida, pense no que custa menos: excluir vence guardar, e a classe mais barata vence a mais cara.',
      ],
    },
  ],
}
