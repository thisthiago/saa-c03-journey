/**
 * Questões da Revisão da Fase 1 de Arquivos e backup (EFS essencial), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'fil.f01',
  questions: [
    {
      id: 'rv:fil.f01.m1.a1',
      kind: 'decision',
      title: 'Contêineres e funções na mesma pasta',
      prompt:
        'Uma editora roda a correção de exercícios em **tarefas do ECS no Fargate** e gera miniaturas das capas com uma **função Lambda**. As duas cargas precisam ler e gravar a **mesma árvore de pastas**, que cresce sem previsão, e o time quer o **menor esforço de operação**, sem provisionar capacidade. Qual armazenamento atende?',
      concepts: [{ id: 'efs.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um volume EBS io2 com Multi-Attach ligado às tarefas e à função.', correct: false, consequence: 'O Multi-Attach liga só instâncias EC2 da mesma AZ; Fargate e Lambda não anexam volumes EBS.' },
        { id: 'b', text: 'Um sistema de arquivos Amazon EFS montado pelas tarefas e pela função.', correct: true, consequence: 'Fargate e Lambda montam o EFS, que cresce sozinho e é compartilhado por todos.' },
        { id: 'c', text: 'Um FSx for Windows File Server com um compartilhamento SMB para as duas cargas.', correct: false, consequence: 'É a resposta para clientes Windows por SMB; aqui as cargas usam NFS em Linux.' },
        { id: 'd', text: 'O armazenamento temporário de cada tarefa e de cada função, ampliado ao máximo.', correct: false, consequence: 'Cada tarefa e cada execução tem o seu espaço próprio, que some ao terminar e não é compartilhado.' },
      ],
      explanation: [
        'O requisito decisivo é um **sistema de arquivos compartilhado** por cargas diferentes, sem gerenciar capacidade. O **Amazon EFS** é NFS gerenciado e **elástico**: cresce e encolhe sozinho e pode ser montado ao mesmo tempo por EC2, ECS, EKS, **Fargate** e **Lambda**.',
        'O EBS, mesmo com Multi-Attach, só se liga a instâncias EC2 da mesma AZ. O FSx for Windows atende clientes Windows por SMB. O armazenamento temporário das tarefas e funções é privado de cada execução e se perde no fim dela.',
        '**Regra prática:** "várias cargas Linux, inclusive contêineres e funções, lendo e gravando os mesmos arquivos" e "cresce sem provisionar" apontam para o EFS.',
      ],
    },
    {
      id: 'rv:fil.f01.m1.a2:windows',
      kind: 'decision',
      title: 'Quem pode montar o sistema de arquivos',
      prompt:
        'Uma escola quer centralizar os materiais num único **Amazon EFS** e levantou cinco cargas que hoje guardam arquivos em discos próprios. Antes da migração, o arquiteto precisa saber **quais delas podem montar o EFS** sem trocar de plataforma. Quais cargas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'efs.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Servidores web Linux em instâncias EC2 atrás de um balanceador.', correct: true, consequence: 'Instâncias Linux montam o EFS por NFS, o caso mais comum do serviço.' },
        { id: 'b', text: 'Um servidor de arquivos do financeiro em instância EC2 com Windows.', correct: false, consequence: 'O EFS não é suportado em instâncias Windows; o caminho é o FSx for Windows File Server, por SMB.' },
        { id: 'c', text: 'Uma função Lambda que converte as provas enviadas em PDF.', correct: true, consequence: 'O Lambda monta o EFS e lê e grava os arquivos como numa pasta local.' },
        { id: 'd', text: 'O volume de boot das instâncias que rodam o sistema acadêmico.', correct: false, consequence: 'O EFS é montado depois que o sistema sobe; o volume raiz de uma instância é um EBS.' },
        { id: 'e', text: 'Um banco Amazon RDS for MySQL que guarda as notas dos alunos.', correct: false, consequence: 'O RDS usa o próprio armazenamento gerenciado, e não há como pôr os dados dele num EFS.' },
      ],
      explanation: [
        'O EFS é um sistema de arquivos **NFS** montado por clientes Linux: instâncias EC2, contêineres do ECS e do EKS, Fargate e **funções Lambda**. Os servidores web Linux e a função que converte as provas podem passar a usar o mesmo EFS sem trocar de plataforma.',
        'Instâncias **Windows** não usam o EFS; para elas, o serviço é o FSx for Windows File Server. O volume de boot de uma instância é sempre um EBS (ou armazenamento de instância), e o RDS guarda os dados no armazenamento que ele mesmo gerencia.',
        '**Regra prática:** EFS é para Linux e serviços que montam NFS (EC2, ECS, EKS, Fargate e Lambda); Windows com SMB pede FSx for Windows, e disco de boot é EBS.',
      ],
    },
    {
      id: 'rv:fil.f01.sg-do-mount-target',
      kind: 'decision',
      title: 'Uma sub-rede que não monta',
      prompt:
        'Um EFS Regional tem um mount target na sub-rede pública da AZ a. Os servidores de aplicação, numa **sub-rede privada da mesma AZ**, não conseguem montar: a conexão expira. O security group do mount target libera a **porta 2049 (NFS)** só para o security group dos servidores web. Qual mudança resolve com o **menor esforço**?',
      concepts: [{ id: 'efs.mount-targets' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar um segundo mount target do EFS na sub-rede privada da AZ a.', correct: false, consequence: 'Só cabe um mount target por AZ; a sub-rede privada usa o que já existe.' },
        { id: 'b', text: 'Liberar a porta 2049 do mount target para o security group da aplicação.', correct: true, consequence: 'O mount target passa a aceitar o NFS vindo dos servidores de aplicação.' },
        { id: 'c', text: 'Criar um VPC endpoint de gateway para o EFS na tabela de rotas da sub-rede privada.', correct: false, consequence: 'Endpoints de gateway existem para o S3 e o DynamoDB; o mount target já é um IP dentro da VPC.' },
        { id: 'd', text: 'Mover os servidores de aplicação para a sub-rede pública, ao lado do mount target.', correct: false, consequence: 'Expõe os servidores sem necessidade; o bloqueio está no security group, não na sub-rede.' },
      ],
      explanation: [
        'O mount target é um **endereço IP numa sub-rede da VPC**, protegido por um **security group**. Os servidores de qualquer sub-rede da mesma AZ alcançam esse IP pela rota local da VPC; o que decide quem entra é o security group, que precisa liberar a **porta 2049** para os clientes. A conexão que expira é o sinal de bloqueio na rede.',
        'Não dá para criar um segundo mount target na mesma AZ, mesmo em outra sub-rede. Endpoint de gateway não existe para o EFS e não seria preciso. Mudar os servidores para a sub-rede pública troca segurança por um problema que é só de regra.',
        '**Regra prática:** cliente que não monta o EFS, com o mount target na AZ dele, aponta para o security group do mount target sem a porta 2049 liberada para o cliente.',
      ],
    },
    {
      id: 'rv:fil.f01.m2.a2',
      kind: 'decision',
      title: 'Os arquivos com uma zona fora',
      prompt:
        'Uma aplicação de matrículas roda num grupo do Auto Scaling nas AZs a, b e c e lê e grava os comprovantes num sistema de arquivos compartilhado. O requisito é **continuar lendo e gravando os comprovantes se uma AZ inteira ficar fora**. Quais configurações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'efs.mount-targets' }, { id: 'efs.file-system-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Criar o sistema de arquivos como EFS Regional.', correct: true, consequence: 'Os dados ficam em várias AZs e seguem acessíveis com uma delas fora.' },
        { id: 'b', text: 'Criar um mount target em cada AZ onde o grupo tem instâncias.', correct: true, consequence: 'Cada instância monta pela própria AZ, e a queda de outra não corta o caminho.' },
        { id: 'c', text: 'Criar o sistema de arquivos como EFS One Zone, na AZ com mais instâncias.', correct: false, consequence: 'Com essa AZ fora, nenhuma instância alcança os arquivos, que podem até ser perdidos.' },
        { id: 'd', text: 'Montar o EFS em todas as instâncias pelo mount target da AZ a.', correct: false, consequence: 'Se a AZ a cair, as instâncias de b e c perdem o único caminho até os arquivos.' },
        { id: 'e', text: 'Usar um volume EBS io2 com Multi-Attach ligado às instâncias das três AZs.', correct: false, consequence: 'O Multi-Attach só liga instâncias da mesma AZ do volume.' },
      ],
      explanation: [
        'São dois requisitos juntos. O **EFS Regional** guarda os dados em várias AZs e continua disponível quando uma delas falha. E cada instância precisa de um **mount target na própria AZ**: o mount target é o caminho até os dados, e ele mora numa AZ só.',
        'O One Zone deixa tudo numa AZ. Montar todos pelo mount target da AZ a cria um ponto único de falha no caminho, mesmo com os dados replicados. O Multi-Attach do EBS não atravessa AZs.',
        '**Regra prática:** EFS que precisa sobreviver à queda de uma AZ é Regional, com um mount target em cada AZ que tem clientes.',
      ],
    },
    {
      id: 'rv:fil.f01.cobranca-entre-zonas',
      kind: 'decision',
      title: 'A conta de transferência do One Zone',
      prompt:
        'Um time de testes usa um **EFS One Zone** criado na AZ a, mas as instâncias que processam os arquivos rodam todas na **AZ b**. A conta mostra uma cobrança alta de **transferência entre AZs**. Os dados podem ser recriados, e o time quer **reduzir o custo** sem abrir mão do One Zone. Qual mudança atende?',
      concepts: [{ id: 'efs.file-system-types' }, { id: 'efs.mount-targets' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Criar um segundo mount target do EFS One Zone na AZ b.', correct: false, consequence: 'O One Zone tem um mount target só, na AZ do sistema de arquivos.' },
        { id: 'b', text: 'Trocar o sistema de arquivos para EFS Regional, com mount targets nas duas AZs.', correct: false, consequence: 'Acaba com o tráfego entre zonas, mas paga mais por GB pela redundância que o time dispensou.' },
        { id: 'c', text: 'Criar um access point do EFS para as instâncias da AZ b.', correct: false, consequence: 'O access point funciona sobre o mount target da AZ a; o tráfego continua cruzando zonas.' },
        { id: 'd', text: 'Rodar as instâncias de processamento na mesma AZ do sistema de arquivos.', correct: true, consequence: 'O acesso passa a ser dentro da AZ, sem cobrança de transferência entre zonas.' },
      ],
      explanation: [
        'O **One Zone** guarda os dados numa AZ e tem **um único mount target**, nessa mesma AZ. Clientes de outras AZs conseguem montar, mas **pagam o acesso entre zonas**. Pôr as instâncias na AZ do sistema de arquivos elimina essa cobrança e mantém o preço menor por GB.',
        'Um segundo mount target não é aceito no One Zone. O Regional resolveria o tráfego, mas cobra mais por GB, e o time não precisa de redundância para dados recriáveis. O access point não muda o caminho de rede.',
        '**Regra prática:** com EFS One Zone, os clientes ficam na mesma AZ do sistema de arquivos; cliente em outra AZ paga a transferência e cai junto com a AZ.',
      ],
    },
    {
      id: 'rv:fil.f01.m2.a4',
      kind: 'decision',
      title: 'O que cabe numa zona só',
      prompt:
        'Uma plataforma de cursos guarda vários conjuntos de arquivos em **EFS Regional** e quer **cortar o custo** movendo para o **EFS One Zone** o que puder, desde que nenhum dado sem outra cópia corra risco e o que precisa ficar no ar com uma AZ fora continue protegido. Quais conjuntos podem ir para o One Zone? (Escolha DUAS.)',
      concepts: [{ id: 'efs.file-system-types' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'As miniaturas dos vídeos, geradas de novo a partir dos originais.', correct: true, consequence: 'Se a AZ falhar, as miniaturas são recriadas, e o custo por GB cai.' },
        { id: 'b', text: 'Os trabalhos enviados pelos alunos, que só existem nesse sistema.', correct: false, consequence: 'Não há outra cópia: perder a AZ pode significar perder os trabalhos.' },
        { id: 'c', text: 'A cópia de testes dos materiais, recriada do repositório em minutos.', correct: true, consequence: 'Dados recriáveis num ambiente que pode parar com a AZ são o caso do One Zone.' },
        { id: 'd', text: 'Os arquivos da aplicação de provas, que precisa seguir no ar com uma AZ fora.', correct: false, consequence: 'O One Zone fica indisponível com a AZ; o requisito pede o Regional.' },
        { id: 'e', text: 'Os certificados emitidos, que a lei exige guardar por dez anos.', correct: false, consequence: 'Dado obrigatório e sem cópia não pode depender de uma AZ só.' },
      ],
      explanation: [
        'O **One Zone** custa menos por GB porque guarda os dados numa AZ só: se a AZ for perdida, os dados **podem ser perdidos**, e enquanto ela estiver fora ficam inacessíveis. Ele serve para **dados recriáveis** ou de **ambientes que podem parar**, como as miniaturas e a cópia de testes.',
        'Trabalhos dos alunos e certificados não têm outra cópia e não podem correr esse risco. A aplicação de provas precisa ficar no ar com uma AZ fora, o que só o Regional garante.',
        '**Regra prática:** One Zone para o que se recria ou pode esperar; Regional para dados únicos e para cargas que precisam sobreviver à queda de uma AZ.',
      ],
    },
    {
      id: 'rv:fil.f01.m3.a1',
      kind: 'decision',
      title: 'A pasta que não pode ser contornada',
      prompt:
        'A aplicação de relatórios usa um access point do EFS com o diretório raiz **/relatorios**. A auditoria mostrou que, montando o sistema de arquivos **sem o access point**, a role da aplicação ainda enxerga a raiz inteira. O requisito é que essa role **só consiga montar pelo access point**. Qual mudança atende?',
      concepts: [{ id: 'efs.access-points' }, { id: 'efs.iam-authorization' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mudar o diretório raiz do access point para /relatorios/privado.', correct: false, consequence: 'Só muda o que se vê pelo access point; a montagem direta continua liberada.' },
        { id: 'b', text: 'Ajustar as permissões POSIX da raiz do EFS para que só o usuário root a leia.', correct: false, consequence: 'Se a montagem direta tiver acesso de root, a permissão POSIX não segura.' },
        { id: 'c', text: 'Na política do EFS, liberar a role só com a condição AccessPointArn.', correct: true, consequence: 'A role só monta se usar aquele access point, e a raiz deixa de ficar ao alcance.' },
        { id: 'd', text: 'Criar um security group só para a aplicação e associá-lo ao access point.', correct: false, consequence: 'Security groups ficam no mount target; o access point não tem security group.' },
      ],
      explanation: [
        'O **access point** impõe um diretório raiz e um usuário POSIX a quem monta **por ele**, mas não impede que alguém monte o sistema de arquivos diretamente. Para fechar esse caminho, a **política do sistema de arquivos** libera a role só com a condição **elasticfilesystem:AccessPointArn** apontando para o access point dela.',
        'Trocar a pasta do access point não fecha a montagem direta. Permissões POSIX dependem do usuário que monta e não substituem a autorização pelo IAM. O security group fica no mount target e controla a rede, não a pasta.',
        '**Regra prática:** access point define a pasta e o usuário; a política do EFS com AccessPointArn obriga cada aplicação a usar o seu.',
      ],
    },
    {
      id: 'rv:fil.f01.m3.a2:p1',
      kind: 'decision',
      title: 'Leitura garantida pelo servidor',
      prompt:
        'Os servidores de relatório, que assumem a role **Relatorios**, montam o mesmo EFS da aplicação de matrículas. A segurança quer que eles **só leiam** os arquivos, com a regra imposta **pelo EFS**, e não pela configuração de cada servidor. Hoje o sistema de arquivos **não tem política**. Qual mudança atende?',
      concepts: [{ id: 'efs.iam-authorization' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Montar o EFS com a opção ro (somente leitura) no fstab dos servidores.', correct: false, consequence: 'Fica na configuração do servidor, e qualquer administrador pode montar de novo com gravação.' },
        { id: 'b', text: 'Criar uma regra de saída no security group dos servidores só para leitura.', correct: false, consequence: 'O security group libera ou bloqueia a porta; não distingue leitura de gravação.' },
        { id: 'c', text: 'Uma política no EFS com aws:SecureTransport obrigatória para a role Relatorios.', correct: false, consequence: 'Exige TLS, mas, sem limitar as ações, a role continua gravando.' },
        { id: 'd', text: 'Uma política no EFS que dá à role Relatorios ClientMount, sem ClientWrite.', correct: true, consequence: 'O EFS passa a recusar as gravações da role, seja qual for a montagem.' },
      ],
      explanation: [
        'Sem política, o EFS dá **acesso total** a qualquer cliente que alcance um mount target. Com a **política do sistema de arquivos** e a autorização pelo IAM, cada role recebe só as ações liberadas: **ClientMount** dá leitura, **ClientWrite** dá gravação e **ClientRootAccess** dá o usuário root.',
        'A opção ro é do cliente e pode ser desfeita no próprio servidor. Security groups não enxergam operações de arquivo. A condição aws:SecureTransport obriga o TLS, mas não tira a gravação.',
        '**Regra prática:** "acesso só de leitura imposto pelo EFS" é uma política do sistema de arquivos com ClientMount e sem ClientWrite.',
      ],
    },
    {
      id: 'rv:fil.f01.exigir-criptografia',
      kind: 'decision',
      title: 'Nenhum sistema de arquivos sem cifra',
      prompt:
        'Uma empresa com dezenas de contas no AWS Organizations descobriu sistemas EFS **criados pela CLI sem criptografia em repouso**. A regra nova é **impedir**, em todas as contas, que qualquer EFS seja criado sem criptografia, com o **menor esforço** de manutenção. Qual solução atende?',
      concepts: [{ id: 'efs.encryption' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar a criptografia padrão do EBS em todas as Regiões de cada conta.', correct: false, consequence: 'Vale para volumes EBS novos; não muda a criação de sistemas de arquivos EFS.' },
        { id: 'b', text: 'Uma SCP que nega criar EFS quando elasticfilesystem:Encrypted é false.', correct: true, consequence: 'Nenhuma conta consegue criar um EFS sem criptografia, seja pelo console, CLI ou API.' },
        { id: 'c', text: 'Exigir aws:SecureTransport na política de cada sistema de arquivos.', correct: false, consequence: 'Obriga o TLS em trânsito, não a criptografia dos dados guardados.' },
        { id: 'd', text: 'Ligar a criptografia em repouso depois, em cada EFS que for criado sem ela.', correct: false, consequence: 'A criptografia em repouso só é escolhida na criação; depois não dá para ligar.' },
      ],
      explanation: [
        'A criptografia em repouso do EFS usa o **KMS** e é escolhida **na criação**: no console ela vem ligada, mas pela CLI e pela API precisa ser pedida. Para **impedir** a criação sem criptografia em todas as contas, uma **SCP** nega `CreateFileSystem` quando a condição **elasticfilesystem:Encrypted** é false.',
        'A criptografia padrão do EBS não vale para o EFS. aws:SecureTransport trata do tráfego, não dos dados guardados. E um EFS que nasceu sem criptografia não pode ser cifrado depois: é preciso replicar os dados para um novo.',
        '**Regra prática:** "exigir que todo EFS nasça criptografado" é a condição elasticfilesystem:Encrypted numa SCP ou política do IAM; para um EFS que já existe sem cifra, replicar para um novo.',
      ],
    },
  ],
}
