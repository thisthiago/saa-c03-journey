/**
 * Questões da Revisão da Fase 6 de Segurança (classificação e retenção), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'sec.f06',
  questions: [
    {
      id: 'rv:sec.f06.m1.a1:laudos',
      kind: 'decision',
      title: 'O mesmo controle para todos os buckets',
      prompt:
        'Um hospital aplica **o mesmo controle** a todos os seus 600 buckets: chave do KMS gerenciada pelo cliente, acesso restrito e retenção de 20 anos, dos logs de teste aos laudos dos pacientes. O custo cresce, e ninguém sabe ao certo onde estão os dados pessoais. Qual abordagem a empresa deve adotar **primeiro**?',
      concepts: [{ id: 'sec.data-classification' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter o controle máximo em todos, por segurança.', correct: false, consequence: 'Paga proteção e retenção de laudos para logs de teste, sem saber onde estão os dados pessoais.' },
        { id: 'b', text: 'Tirar os controles de todos os buckets que não sejam de produção.', correct: false, consequence: 'O ambiente não diz a sensibilidade: há dados pessoais copiados fora da produção.' },
        { id: 'c', text: 'Classificar os dados e ajustar os controles a cada classe.', correct: true, consequence: 'Dados sensíveis ficam com chave própria e retenção longa; os outros, com o necessário.' },
        { id: 'd', text: 'Apagar os buckets mais antigos para reduzir o custo.', correct: false, consequence: 'Pode apagar dados que a lei manda guardar.' },
      ],
      explanation: [
        'Antes de escolher controles, a empresa **classifica os dados pela sensibilidade**: públicos, internos, confidenciais, pessoais. A classificação diz quais dados exigem chave própria, quem pode ler, **por quanto tempo guardar** e quando apagar. Para encontrar dados pessoais no S3, o **Macie** ajuda a fazer esse mapa.',
        'O controle máximo para tudo custa caro sem proteger melhor. Separar por ambiente ignora cópias de dados sensíveis. E apagar às cegas viola prazos legais.',
        '**Regra prática:** classifique antes de proteger; sem saber onde estão os dados pessoais, não há como protegê-los nem reter na medida certa.',
      ],
    },
    {
      id: 'rv:sec.f06.m1.a2',
      kind: 'decision',
      title: 'Seiscentos buckets e um bucket suspeito',
      prompt:
        'Um hospital quer duas coisas no Macie: uma **visão sempre atualizada** de onde pode haver dados sensíveis nos **600 buckets**, sem escolher bucket por bucket e com custo controlado; e uma **análise completa, todo mês**, do bucket de exportações, que a auditoria acompanha. Quais configurações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'macie.discovery' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'A descoberta automática de dados sensíveis, para os 600 buckets.', correct: true, consequence: 'Avalia o inventário todo dia, por amostragem, e mostra o mapa de sensibilidade.' },
        { id: 'b', text: 'Um trabalho de descoberta recorrente, mensal, só no bucket de exportações.', correct: true, consequence: 'Analisa a fundo cada objeto do bucket, todo mês.' },
        { id: 'c', text: 'Um trabalho de descoberta mensal sobre todos os objetos dos 600 buckets.', correct: false, consequence: 'Analisa tudo a fundo antes de saber onde olhar, com custo bem maior.' },
        { id: 'd', text: 'Confiar só na amostragem da descoberta automática no bucket de exportações.', correct: false, consequence: 'A amostra mostra onde olhar; a auditoria quer cada objeto analisado.' },
        { id: 'e', text: 'O Amazon Inspector sobre os 600 buckets.', correct: false, consequence: 'O Inspector procura vulnerabilidades de software, não dados sensíveis.' },
      ],
      explanation: [
        'O Macie tem duas formas de procurar dados sensíveis. A **descoberta automática** avalia o inventário de buckets **todo dia** e analisa **amostras** representativas, dando uma visão ampla com custo controlado. O **trabalho de descoberta** analisa **a fundo** os buckets escolhidos, uma vez ou de forma **recorrente**, e pode filtrar objetos por tag, prefixo e data.',
        'Um trabalho sobre os 600 buckets custa muito. A amostra não atende à análise completa. E o Inspector não procura dados.',
        '**Regra prática:** a amostra mostra onde olhar; o trabalho olha tudo ali.',
      ],
    },
    {
      id: 'rv:sec.f06.m2.a1',
      kind: 'decision',
      title: 'CPFs de teste que viram achados',
      prompt:
        'Os arquivos de exemplo de um sistema usam o **CPF fictício 000.000.000-00**, e o Macie gera centenas de achados de dados pessoais por causa dele, escondendo os casos reais. A empresa quer que o Macie **ignore esse valor** sem deixar de detectar CPFs verdadeiros. O que fazer?',
      concepts: [{ id: 'macie.identifiers' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Desligar o identificador gerenciado de CPF.', correct: false, consequence: 'O Macie deixaria de apontar também os CPFs verdadeiros.' },
        { id: 'b', text: 'Uma lista de permissão com o valor fictício.', correct: true, consequence: 'O Macie ignora o valor da lista e continua apontando os CPFs reais.' },
        { id: 'c', text: 'Um identificador personalizado com a expressão do CPF.', correct: false, consequence: 'Acrescentaria outro detector do mesmo dado, sem ignorar o fictício.' },
        { id: 'd', text: 'Apagar os arquivos de exemplo dos buckets.', correct: false, consequence: 'Resolve os achados apagando arquivos que o sistema usa.' },
      ],
      explanation: [
        'O Macie reconhece dados sensíveis com **identificadores gerenciados**, mantidos pela AWS, e **identificadores personalizados**, criados com uma expressão regular e palavras próximas. As **listas de permissão** dizem **o que ignorar**: com o valor fictício na lista, os achados falsos somem e os CPFs reais continuam aparecendo.',
        'Desligar o identificador perde os casos reais. Um identificador a mais não ignora nada. E apagar arquivos usados é desproporcional.',
        '**Regra prática:** formato próprio da empresa, identificador personalizado; valor conhecido que não é sensível, lista de permissão.',
      ],
    },
    {
      id: 'rv:sec.f06.m2.a2:bpa',
      kind: 'decision',
      title: 'Achados de política e de dados',
      prompt:
        'Uma equipe vai priorizar os achados do Macie que indicam que **a configuração de um bucket ficou menos segura**, deixando para depois os que apontam conteúdo sensível em objetos. Quais opções são achados **de política**? (Escolha DUAS.)',
      concepts: [{ id: 'macie.findings' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Policy:IAMUser/S3BlockPublicAccessDisabled no bucket de exportações.', correct: true, consequence: 'O bloqueio de acesso público foi desligado: é a configuração do bucket.' },
        { id: 'b', text: 'Policy:IAMUser/S3BucketSharedExternally no bucket de laudos.', correct: true, consequence: 'O bucket foi compartilhado com uma conta de fora: é a configuração do bucket.' },
        { id: 'c', text: 'SensitiveData:S3Object/Personal num CSV de altas.', correct: false, consequence: 'É achado de dados sensíveis: o objeto tem dados pessoais.' },
        { id: 'd', text: 'SensitiveData:S3Object/Credentials num arquivo de configuração.', correct: false, consequence: 'É achado de dados sensíveis: o objeto tem chaves ou senhas.' },
        { id: 'e', text: 'SensitiveData:S3Object/Financial numa planilha de faturas.', correct: false, consequence: 'É achado de dados sensíveis: o objeto tem dados financeiros.' },
      ],
      explanation: [
        'O Macie gera dois tipos de achado. Os **de política** avisam que a **configuração de um bucket ficou menos segura**, como o bloqueio de acesso público desligado ou o compartilhamento externo. Os **de dados sensíveis** apontam **objetos** com dados pessoais, financeiros ou credenciais.',
        'Os três SensitiveData falam do conteúdo dos objetos, não da configuração do bucket.',
        '**Regra prática:** Policy é configuração do bucket; SensitiveData é conteúdo do objeto. O Macie guarda os achados por 90 dias.',
      ],
    },
    {
      id: 'rv:sec.f06.publico-antes-do-macie',
      kind: 'decision',
      title: 'Um bucket público sem achado',
      prompt:
        'Uma empresa ligou o Macie na semana passada. Um bucket **público há meses**, cuja configuração **não mudou desde então**, **não gerou nenhum achado de política**. A equipe acha que o Macie falhou. Qual avaliação está correta?',
      concepts: [{ id: 'macie.findings' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O Macie falhou e deve ser desligado e ligado de novo.', correct: false, consequence: 'Religar não gera achados de política para mudanças antigas.' },
        { id: 'b', text: 'Os achados de política só aparecem para buckets com dados sensíveis.', correct: false, consequence: 'Os achados de política tratam da configuração, com ou sem dados sensíveis.' },
        { id: 'c', text: 'O Macie só gera achados de política no primeiro mês de uso.', correct: false, consequence: 'Não há essa janela; o que importa é quando a configuração mudou.' },
        { id: 'd', text: 'Achados de política só cobrem mudanças posteriores.', correct: true, consequence: 'O bucket ficou público antes; a configuração deve ser revisada por outros meios.' },
      ],
      explanation: [
        'Os **achados de política** do Macie só aparecem para **mudanças feitas depois** que o Macie foi ligado. Um bucket que ficou público antes, e não mudou desde então, não gera esse achado. A situação atual precisa ser revisada por outros meios, como o inventário de buckets do próprio Macie ou as verificações de postura.',
        'Religar o Macie não muda isso. Achados de política não dependem de dados sensíveis. E não há janela de um mês.',
        '**Regra prática:** ao ligar o Macie, revise a configuração atual dos buckets; os achados de política cobrem as mudanças daqui em diante.',
      ],
    },
    {
      id: 'rv:sec.f06.m3.a1',
      kind: 'decision',
      title: 'Prontuários que ninguém pode apagar',
      prompt:
        'Os prontuários de um hospital ficam no S3 e, por lei, **não podem ser apagados nem alterados por ninguém**, nem pelos administradores, durante **20 anos**. Qual configuração atende?',
      concepts: [{ id: 'sec.retention' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma política de bucket que nega a exclusão dos objetos.', correct: false, consequence: 'Um administrador pode mudar a política e depois apagar.' },
        { id: 'b', text: 'Object Lock em modo governança, com retenção de 20 anos.', correct: false, consequence: 'Quem tem a permissão especial ainda consegue apagar ou encurtar a retenção.' },
        { id: 'c', text: 'Object Lock em conformidade, por 20 anos.', correct: true, consequence: 'Ninguém apaga nem encurta a retenção até o fim do prazo.' },
        { id: 'd', text: 'Versionamento do bucket, com MFA na exclusão.', correct: false, consequence: 'Dificulta a exclusão, mas quem tem o MFA e a permissão ainda apaga.' },
      ],
      explanation: [
        'Quando a lei manda guardar por um prazo **sem deixar apagar**, o dado precisa ser **imutável (WORM)**. No S3, isso é o **Object Lock** no **modo conformidade**: ninguém, nem a conta raiz, apaga ou encurta a retenção antes do fim.',
        'Permissões e políticas podem ser mudadas por um administrador. O modo governança tem exceção para quem tem a permissão. E MFA na exclusão não torna o dado imutável.',
        '**Regra prática:** "guardar por N anos sem possibilidade de exclusão" é Object Lock em conformidade; no AWS Backup, Vault Lock em conformidade.',
      ],
    },
    {
      id: 'rv:sec.f06.m3.a3',
      kind: 'decision',
      title: 'Depois dos 20 anos',
      prompt:
        'Os prontuários ficam no S3 com Object Lock em conformidade por **20 anos**. A norma também manda **descartá-los depois do prazo**, e a empresa não quer pagar o armazenamento um dia além do necessário nem depender de alguém lembrar. O que configurar?',
      concepts: [{ id: 'sec.retention' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma pessoa apaga os arquivos vencidos uma vez por ano.', correct: false, consequence: 'Depende de alguém lembrar por 20 anos, e paga até a próxima limpeza.' },
        { id: 'b', text: 'Aumentar a retenção do Object Lock para 30 anos, por segurança.', correct: false, consequence: 'Paga dez anos a mais e viola a norma de descarte.' },
        { id: 'c', text: 'Mover os prontuários para o Glacier depois de 20 anos.', correct: false, consequence: 'Fica mais barato, mas não descarta, como a norma exige.' },
        { id: 'd', text: 'Ciclo de vida expirando os objetos aos 20 anos.', correct: true, consequence: 'O descarte acontece sozinho no fim do prazo; antes disso, o Object Lock impede a exclusão.' },
      ],
      explanation: [
        'No fim do prazo de retenção, o **ciclo de vida** apaga o que não precisa mais ficar. Uma regra que **expira os objetos depois de 20 anos** faz o descarte sozinho; enquanto a retenção do Object Lock valer, a exclusão não acontece.',
        'Limpeza manual depende de memória. Retenção maior viola o descarte e custa mais. E mudar de classe não descarta.',
        '**Regra prática:** imutabilidade durante o prazo e ciclo de vida para apagar depois: as duas metades da retenção.',
      ],
    },
    {
      id: 'rv:sec.f06.m3.a2',
      kind: 'decision',
      title: 'Um erro no dia seguinte ao Vault Lock',
      prompt:
        'Ontem, a equipe aplicou o **Vault Lock em modo conformidade** num cofre do AWS Backup, com uma **retenção máxima errada**. Hoje percebeu o erro, ainda dentro da **carência de 72 horas** configurada. A empresa quer corrigir a trava antes que ela fique definitiva. O que é possível?',
      concepts: [{ id: 'bkp.vault-lock' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Nada: o modo conformidade é imutável desde o primeiro minuto.', correct: false, consequence: 'A imutabilidade começa depois da carência, não antes.' },
        { id: 'b', text: 'Pedir à AWS que remova a trava depois da carência.', correct: false, consequence: 'Depois da carência, nem a AWS remove a trava do modo conformidade.' },
        { id: 'c', text: 'Remover ou alterar a trava ainda durante a carência.', correct: true, consequence: 'Durante a carência, a trava pode ser removida ou alterada; depois, fica imutável.' },
        { id: 'd', text: 'Trocar o cofre para o modo governança a qualquer momento.', correct: false, consequence: 'Depois da carência, o modo conformidade não pode ser trocado.' },
      ],
      explanation: [
        'O **Vault Lock** tranca um cofre do AWS Backup. No **modo conformidade**, depois de uma **carência de no mínimo 72 horas**, a trava e o cofre ficam **imutáveis**: ninguém, nem a conta raiz nem a AWS, apaga os backups antes do fim da retenção. **Durante a carência**, a trava ainda pode ser **removida ou alterada**, justamente para corrigir erros.',
        'A imutabilidade não começa no primeiro minuto. Depois da carência, nem a AWS ajuda. E o modo não pode ser trocado depois.',
        '**Regra prática:** use a carência do modo conformidade para testar e conferir a configuração; depois dela, não há volta.',
      ],
    },
    {
      id: 'rv:sec.f06.retencao-para-sempre',
      kind: 'decision',
      title: 'Backups guardados para sempre',
      prompt:
        'Uma norma exige guardar os backups do banco por **sete anos**, sem que ninguém possa apagá-los antes. A equipe propõe o Vault Lock em conformidade **sem retenção máxima**, "para nunca perder nada". A empresa quer cumprir a norma com o **menor custo** de armazenamento. Qual configuração atende?',
      concepts: [{ id: 'bkp.vault-lock' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Conformidade, mínimo de sete anos e máximo definido.', correct: true, consequence: 'Os backups ficam imutáveis pelo prazo da norma e não são guardados além do planejado.' },
        { id: 'b', text: 'Conformidade, sem retenção máxima, como proposto.', correct: false, consequence: 'Os backups podem ficar para sempre, e o armazenamento é cobrado para sempre.' },
        { id: 'c', text: 'Governança, com retenção de sete anos.', correct: false, consequence: 'Quem tem a permissão do IAM tira a trava: não atende ao "ninguém pode apagar".' },
        { id: 'd', text: 'Sem Vault Lock, com uma política do IAM negando a exclusão.', correct: false, consequence: 'Um administrador pode mudar a política e apagar os backups.' },
      ],
      explanation: [
        'O **Vault Lock** não tem custo adicional, mas o **armazenamento dos backups é cobrado normalmente**. As retenções **mínima e máxima** do cofre fazem falhar os backups fora da faixa. Com a mínima de sete anos e uma máxima definida, a norma é cumprida sem guardar backups além do necessário.',
        'Sem máxima, os backups podem ficar para sempre. O modo governança e as políticas do IAM não impedem um administrador.',
        '**Regra prática:** em retenção imutável, defina o prazo mínimo da norma e um máximo; "para sempre" no modo conformidade é custo para sempre.',
      ],
    },
  ],
}
