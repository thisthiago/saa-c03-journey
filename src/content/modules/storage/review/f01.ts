/**
 * Questões da Revisão da Fase 1 da S3 Expedition (fundamentos do S3), no
 * formato do exame SAA-C03. Fatos conferidos em 16/10/2026 e 18/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 's3x.f01',
  questions: [
    {
      id: 'rv:s3x.f01.m1.a2',
      kind: 'decision',
      title: 'A proposta de levar o banco para o bucket',
      prompt:
        'Um PostgreSQL roda numa instância EC2, com os arquivos de dados num volume EBS. Para economizar, alguém propõe guardar esses arquivos num bucket S3, que custa menos por GB. O banco faz muitas leituras e gravações pequenas e aleatórias e precisa de **baixa latência**. Onde os arquivos de dados devem ficar?',
      concepts: [{ id: 'storage.block' }, { id: 'storage.object' }, { id: 's3.service' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Num bucket S3 Standard, montado como disco na instância.', correct: false, consequence: 'O S3 guarda objetos por API: alterar um trecho exige regravar o objeto inteiro, e a latência é alta para I/O pequeno.' },
        { id: 'b', text: 'No volume EBS, que entrega à instância um disco de blocos.', correct: true, consequence: 'O banco lê e grava blocos com baixa latência, que é o que um banco transacional exige.' },
        { id: 'c', text: 'Num bucket S3 Glacier Instant Retrieval, que lê em milissegundos.', correct: false, consequence: 'Continua sendo armazenamento de objetos, feito para dados pouco acessados: o pior perfil para um banco ativo.' },
        { id: 'd', text: 'Num sistema de arquivos Amazon EFS, para outras instâncias lerem o banco.', correct: false, consequence: 'Ninguém pediu compartilhamento, e um banco transacional não roda bem sobre um sistema de arquivos em rede.' },
      ],
      explanation: [
        'Um banco transacional faz I/O pequeno e aleatório e precisa de **baixa latência**: é o caso típico de **armazenamento em blocos**, entregue à instância como um disco. Na AWS, isso é o EBS.',
        'O S3 é armazenamento de objetos: não edita trechos de um arquivo, e cada operação passa por uma API HTTP. A classe não muda isso. O EFS compartilha arquivos entre servidores, um requisito que o cenário não tem.',
        '**Regra prática:** disco de boot ou de banco instalado no EC2 pede bloco (EBS); pasta compartilhada entre servidores pede arquivo (EFS ou FSx); arquivos acessados por API, em qualquer volume, pedem objeto (S3).',
      ],
    },
    {
      id: 'rv:s3x.f01.boss.a1',
      kind: 'decision',
      multiple: true,
      title: 'O que pode ir para o bucket',
      prompt:
        'Uma empresa está esvaziando um servidor de arquivos antigo e quer levar para o Amazon S3 o que fizer sentido, pela durabilidade e pelo custo. Quais dados combinam com o **armazenamento de objetos** do S3? (Escolha DUAS.)',
      concepts: [{ id: 's3.service' }, { id: 'storage.object' }, { id: 'storage.file' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Os backups diários do banco, enviados uma vez por dia e raramente lidos.', correct: true, consequence: 'Arquivos gravados inteiros e lidos por API: o uso típico do S3, com 11 noves de durabilidade.' },
        { id: 'b', text: 'O volume de boot do servidor de aplicação.', correct: false, consequence: 'Boot exige um disco de blocos, como o EBS; o S3 não é um dispositivo de blocos.' },
        { id: 'c', text: 'A pasta que oito servidores Linux montam por NFS e editam ao mesmo tempo.', correct: false, consequence: 'Exige um sistema de arquivos compartilhado com bloqueio de arquivo, como o EFS.' },
        { id: 'd', text: 'As imagens dos produtos que o site da loja exibe.', correct: true, consequence: 'Objetos inteiros servidos por HTTPS, em qualquer volume: o S3 atende sem servidor para manter.' },
        { id: 'e', text: 'Os arquivos de dados do banco de pedidos, alterados a cada venda.', correct: false, consequence: 'Banco ativo faz I/O pequeno e aleatório: pede armazenamento em blocos.' },
      ],
      explanation: [
        'O S3 guarda **objetos inteiros acessados por API**, com volume ilimitado e 11 noves de durabilidade. Backups e imagens de um site se encaixam: são gravados de uma vez e lidos pela rede.',
        'O volume de boot e os arquivos de um banco ativo pedem um disco de blocos, como o EBS. A pasta montada por NFS e editada por vários servidores pede um sistema de arquivos compartilhado, como o EFS.',
        '**Regra prática:** pergunte como o dado é acessado. Por API e inteiro: objeto. Como disco de uma instância: bloco. Como pasta montada por vários servidores: arquivo.',
      ],
    },
    {
      id: 'rv:s3x.f01.pasta-windows',
      kind: 'decision',
      title: 'Planilhas editadas por quatro servidores',
      prompt:
        'Quatro servidores Windows rodam um sistema de contabilidade que lê e grava as mesmas planilhas numa pasta compartilhada, acessada por **SMB** e com bloqueio de arquivo para que duas pessoas não editem a mesma planilha ao mesmo tempo. A empresa quer um serviço gerenciado. Qual armazenamento atende?',
      concepts: [{ id: 'storage.file' }, { id: 'storage.block' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um bucket S3, acessado pelos quatro servidores pela API.', correct: false, consequence: 'O S3 não oferece SMB nem bloqueio de arquivo: o sistema espera uma pasta montada.' },
        { id: 'b', text: 'Um volume EBS anexado aos quatro servidores ao mesmo tempo.', correct: false, consequence: 'O EBS entrega um disco; mesmo com Multi-Attach, ele não é uma pasta compartilhada por SMB.' },
        { id: 'c', text: 'Um sistema de arquivos Amazon EFS, montado nos quatro servidores.', correct: false, consequence: 'O EFS usa NFS e atende instâncias Linux, não compartilhamentos SMB de Windows.' },
        { id: 'd', text: 'Um sistema de arquivos Amazon FSx for Windows File Server.', correct: true, consequence: 'Compartilhamento SMB gerenciado, com bloqueio de arquivo, montado pelos quatro servidores.' },
      ],
      explanation: [
        'A aplicação precisa de **armazenamento de arquivos**: uma pasta compartilhada, acessada por **SMB**, com bloqueio de arquivo. Para servidores Windows, o serviço gerenciado é o **FSx for Windows File Server**.',
        'O S3 é objeto, sem SMB nem bloqueio. O EBS é bloco, entregue como disco. O EFS é arquivo, mas por NFS e para Linux.',
        '**Regra prática:** "compartilhado entre servidores" pede armazenamento de arquivos. NFS ou Linux aponta para o EFS; SMB ou Windows, para o FSx for Windows File Server.',
      ],
    },
    {
      id: 'rv:s3x.f01.boss.a3',
      kind: 'decision',
      title: 'O bucket criado na Região errada',
      prompt:
        'A equipe criou o bucket dos contratos em us-east-1 por engano, mas um requisito legal exige que os contratos **fiquem no Brasil**. O bucket já tem alguns milhares de objetos. Qual caminho atende ao requisito?',
      concepts: [{ id: 's3.bucket' }, { id: 's3.region' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mudar a Região do bucket para sa-east-1 nas propriedades dele.', correct: false, consequence: 'A Região de um bucket não muda depois da criação.' },
        { id: 'b', text: 'Replicar o bucket para sa-east-1 e manter o original em us-east-1.', correct: false, consequence: 'Cria a cópia no Brasil, mas os contratos continuam também nos Estados Unidos.' },
        { id: 'c', text: 'Criar um bucket em sa-east-1, copiar os objetos e apagar o de us-east-1.', correct: true, consequence: 'Os contratos passam a existir só no Brasil, que é o que o requisito exige.' },
        { id: 'd', text: 'Renomear o bucket com o sufixo -sa-east-1, o que move os objetos.', correct: false, consequence: 'O nome de um bucket também não muda, e o nome não define onde os dados ficam.' },
      ],
      explanation: [
        'Cada bucket nasce numa Região, e **nem a Região nem o nome mudam depois**. Para cumprir a localização, é preciso um bucket novo em sa-east-1, copiar os objetos e apagar o original, para que os contratos deixem de existir em us-east-1.',
        'Replicar sem apagar deixa os dados nos dois países. Renomear não existe e não moveria nada. Um cuidado extra: o nome do bucket é único no mundo; quem apaga um bucket para reaproveitar o nome corre o risco de outra conta criá-lo antes.',
        '**Regra prática:** escolha a Região do bucket pelos requisitos antes de criá-lo. Depois, mudar de Região significa criar outro bucket e mover os dados.',
      ],
    },
    {
      id: 'rv:s3x.f01.nome-do-bucket',
      kind: 'decision',
      title: 'Nome para o bucket dos relatórios',
      prompt:
        'Uma empresa vai criar um bucket para os relatórios financeiros. O nome precisa ser **válido**, funcionar com o **S3 Transfer Acceleration**, que as filiais vão usar para enviar arquivos, e **não expor informação sensível**, já que aparece nas URLs. Qual nome atende?',
      concepts: [{ id: 's3.bucket-naming' }, { id: 's3.bucket' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: '`Financeiro_Relatorios-2026`', correct: false, consequence: 'Nomes de bucket não aceitam letras maiúsculas nem sublinhado.' },
        { id: 'b', text: '`relatorios.financeiro.empresa`', correct: false, consequence: 'É válido, mas buckets com ponto no nome não funcionam com o Transfer Acceleration.' },
        { id: 'c', text: '`empresa-relatorios-financeiros-2026`', correct: true, consequence: 'Só minúsculas, números e hífens, sem pontos e sem dado sensível.' },
        { id: 'd', text: '`empresa-cnpj-12345678000190-fin`', correct: false, consequence: 'É válido, mas expõe o CNPJ em todas as URLs do bucket.' },
      ],
      explanation: [
        'Nomes de bucket têm de 3 a 63 caracteres, só com minúsculas, números, pontos e hífens. Como o Transfer Acceleration não funciona com **pontos** no nome, e o nome aparece nas URLs, sobra o nome só com minúsculas, números e hífens, sem dado sensível.',
        'Maiúsculas e sublinhado são inválidos. O nome com pontos é válido, mas quebra o Transfer Acceleration e o acesso virtual-hosted por HTTPS sem validação própria de certificado. O CNPJ no nome fica exposto em cada URL.',
        '**Regra prática:** use nomes só com minúsculas, números e hífens, sem pontos, e nunca coloque informação sensível no nome de um bucket.',
      ],
    },
    {
      id: 'rv:s3x.f01.classe-por-disponibilidade',
      kind: 'decision',
      title: 'Fotos acessadas a qualquer hora',
      prompt:
        'Um aplicativo de imobiliária exibe as fotos dos imóveis a qualquer hora e define dois requisitos para o armazenamento: **disponibilidade projetada de 99,99%** e **nenhuma foto perdida mesmo que uma zona de disponibilidade seja destruída**. As fotos são lidas o tempo todo. Qual classe atende?',
      concepts: [{ id: 's3.availability' }, { id: 's3.durability' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'S3 Standard-IA, com a mesma durabilidade e menor custo de armazenamento.', correct: false, consequence: 'A disponibilidade projetada é de 99,9%, abaixo do exigido, e as leituras frequentes pagam recuperação.' },
        { id: 'b', text: 'S3 One Zone-IA, com 11 noves de durabilidade.', correct: false, consequence: 'Fica numa única zona: se ela for destruída, as fotos se perdem. E a disponibilidade é de 99,5%.' },
        { id: 'c', text: 'S3 Standard, com cópias em pelo menos três zonas.', correct: true, consequence: 'É a classe projetada para 99,99% de disponibilidade e resiste à perda de uma zona.' },
        { id: 'd', text: 'S3 Intelligent-Tiering, que move as fotos conforme o acesso.', correct: false, consequence: 'Resiste à perda de uma zona, mas a disponibilidade projetada é de 99,9%.' },
      ],
      explanation: [
        'Os dois requisitos são diferentes. **Disponibilidade** é poder acessar a qualquer momento: dos 99,99% exigidos, só o **S3 Standard** chega lá. **Resistir à destruição de uma zona** pede cópias em várias zonas, o que o Standard também faz.',
        'Standard-IA e Intelligent-Tiering são projetados para 99,9%. O One Zone-IA tem os mesmos 11 noves de durabilidade contra falhas de dispositivo, mas guarda tudo numa zona só.',
        '**Regra prática:** "não perder" é durabilidade; "acessar a qualquer momento" é disponibilidade. Leia os dois requisitos separadamente e confira o número de zonas de cada classe.',
      ],
    },
    {
      id: 'rv:s3x.f01.m3.a2',
      kind: 'decision',
      title: 'Os onze noves e o estagiário',
      prompt:
        'Um estagiário apagou, por engano, uma pasta inteira de relatórios num bucket. O gerente se espanta: "mas o S3 não tem **11 noves de durabilidade**?". Qual afirmação explica corretamente o que aconteceu?',
      concepts: [{ id: 's3.durability' }, { id: 's3.availability' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A durabilidade protege contra falhas de hardware, não contra um DELETE feito por alguém da conta.', correct: true, consequence: 'O gerente entende que exclusão acidental pede outras proteções, como versionamento ou backups.' },
        { id: 'b', text: 'Os 11 noves garantem que a AWS recupera qualquer objeto apagado nos últimos 30 dias.', correct: false, consequence: 'Não existe essa lixeira automática: um objeto apagado sem proteção configurada se perde.' },
        { id: 'c', text: 'Os 11 noves valem só para o S3 Standard, e o bucket usava outra classe.', correct: false, consequence: 'Todas as classes atuais são projetadas para 11 noves, e a classe não muda o efeito de um DELETE.' },
        { id: 'd', text: 'Os 11 noves medem o tempo em que o bucket fica acessível, não a proteção dos dados.', correct: false, consequence: 'Isso é disponibilidade, outra medida (99,99% no Standard). Durabilidade é não perder dados por falha.' },
      ],
      explanation: [
        'A **durabilidade** de 11 noves é a probabilidade de o S3 não perder um objeto por falha de dispositivos e da infraestrutura. Um **DELETE** feito por alguém autorizado não é falha: o S3 cumpre a ordem.',
        'Não existe recuperação automática de objetos apagados. Os 11 noves valem para todas as classes atuais. E o tempo em que os dados ficam acessíveis é a disponibilidade, uma medida diferente.',
        '**Regra prática:** se o requisito é se proteger de exclusão acidental ou de ransomware, a resposta não é durabilidade, e sim versionamento, Object Lock ou backups.',
      ],
    },
    {
      id: 'rv:s3x.f01.m3.a3',
      kind: 'decision',
      title: 'Uploads das filiais que recomeçam do zero',
      prompt:
        'As filiais de uma rede de clínicas enviam ao S3, todo fim de dia, arquivos de exames de cerca de 3 GB, numa conexão que oscila. Quando a conexão cai no meio, o envio recomeça do zero e às vezes não termina antes do expediente seguinte. A empresa quer que os envios **sejam retomados** a partir do que já foi enviado. O que atende?',
      concepts: [{ id: 's3.object' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Usar multipart upload, reenviando só as partes que falharem.', correct: true, consequence: 'O arquivo vai em partes independentes: uma queda só obriga a repetir a parte que estava em envio.' },
        { id: 'b', text: 'Manter o PUT único e aumentar o tempo limite das conexões.', correct: false, consequence: 'Ajuda a não desistir cedo, mas uma queda ainda faz o arquivo inteiro recomeçar.' },
        { id: 'c', text: 'Compactar os arquivos para caberem no limite de um PUT único.', correct: false, consequence: 'Os arquivos já cabem num PUT único (até 5 GB); o problema é recomeçar do zero a cada queda.' },
        { id: 'd', text: 'Gravar os exames num volume EBS e copiá-los para o S3 de madrugada.', correct: false, consequence: 'A cópia de madrugada continua sendo um envio inteiro, sujeito às mesmas quedas.' },
      ],
      explanation: [
        'O requisito é **retomar** o envio. O **multipart upload** divide o arquivo em partes enviadas de forma independente (e em paralelo, se a banda deixar). Se a conexão cai, só a parte interrompida é reenviada; no fim, o S3 junta as partes num único objeto.',
        'Um PUT único, com ou sem tempo limite maior, recomeça do zero a cada queda. Compactar não resolve, porque o tamanho não é o problema. E copiar a partir de um EBS só muda o horário do mesmo envio.',
        '**Regra prática:** o multipart upload é recomendado a partir de 100 MB e obrigatório acima de 5 GB. "Retomar uploads que falham no meio" ou "enviar arquivos grandes mais rápido" apontam para ele.',
      ],
    },
    {
      id: 'rv:s3x.f01.m2.a2',
      kind: 'decision',
      title: 'Renomear uma pasta com 2 milhões de arquivos',
      prompt:
        'Um bucket guarda 2 milhões de objetos com keys começando por `clientes/`. A equipe quer que todos passem a começar por `clientes-antigos/` e imagina que basta renomear a pasta. O que de fato é necessário para **mudar o prefixo** dos objetos?',
      concepts: [{ id: 's3.object-key' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma única operação de renomear a pasta, instantânea e sem custo.', correct: false, consequence: 'Não há pasta para renomear: cada objeto tem a própria key.' },
        { id: 'b', text: 'Renomear o bucket, já que as pastas fazem parte do nome dele.', correct: false, consequence: 'O nome do bucket não muda, e as keys não fazem parte dele.' },
        { id: 'c', text: 'Copiar cada objeto para a key nova e apagar o original.', correct: true, consequence: 'São 2 milhões de cópias e 2 milhões de exclusões, cobradas como requisições.' },
        { id: 'd', text: 'Criar um atalho de `clientes-antigos/` apontando para `clientes/`.', correct: false, consequence: 'O S3 não tem atalhos nem links entre prefixos.' },
      ],
      explanation: [
        'O S3 tem **estrutura plana**: a "pasta" `clientes/` é só o começo da **key** de cada objeto. Mudar o prefixo significa mudar a key de 2 milhões de objetos, e o S3 não renomeia objetos: é preciso copiar cada um para a key nova e apagar o original.',
        'Não há operação de renomear pasta, atalho entre prefixos ou mudança de nome do bucket. Os consoles mostram pastas só para facilitar a leitura.',
        '**Regra prática:** planeje os prefixos antes de gravar. Reorganizar "pastas" no S3 custa uma cópia e uma exclusão por objeto.',
      ],
    },
    {
      id: 'rv:s3.metadata:alterar',
      kind: 'decision',
      title: 'Dez mil objetos com o cliente errado',
      prompt:
        'Uma integração enviou 10 mil objetos com o metadado definido pelo usuário `x-amz-meta-cliente: aurora`, quando o certo era `boreal`. A aplicação lê esse cabeçalho, e as **keys não podem mudar**. Como corrigir?',
      concepts: [{ id: 's3.metadata' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Editar o cabeçalho dos objetos existentes pela API, sem regravá-los.', correct: false, consequence: 'Metadados definidos pelo usuário não podem ser editados depois do upload.' },
        { id: 'b', text: 'Copiar cada objeto sobre ele mesmo, definindo o metadado correto.', correct: true, consequence: 'A cópia grava o objeto com a mesma key e os metadados novos.' },
        { id: 'c', text: 'Adicionar uma tag `cliente=boreal` a cada objeto, que substitui o metadado.', correct: false, consequence: 'Tags podem mudar, mas são outro recurso: o cabeçalho que a aplicação lê continua errado.' },
        { id: 'd', text: 'Apagar os objetos e pedir à integração que os envie de novo com outras keys.', correct: false, consequence: 'As keys não podem mudar, e reenviar dá mais trabalho que copiar.' },
      ],
      explanation: [
        'Metadados definidos pelo usuário (`x-amz-meta-`) **não mudam depois do upload**. A correção é **copiar o objeto**, inclusive sobre ele mesmo, definindo os metadados novos. A key continua a mesma.',
        'Não existe edição de metadados no lugar. Tags são outro recurso, que pode ser alterado, mas a aplicação lê o cabeçalho. E reenviar com outras keys fere o requisito.',
        '**Regra prática:** metadados do usuário são fixos; tags podem mudar e servem para políticas, ciclo de vida e custos. Para trocar um metadado, copie o objeto.',
      ],
    },
    {
      id: 'rv:s3.metadata:tags',
      kind: 'decision',
      title: 'Marcar documentos confidenciais',
      prompt:
        'Um escritório de advocacia quer marcar parte dos documentos de um bucket como confidenciais. Uma bucket policy e uma regra de ciclo de vida precisam **selecionar esses documentos**, e as **keys não podem mudar**, porque outros sistemas apontam para elas. O que usar para marcá-los?',
      concepts: [{ id: 's3.metadata' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um metadado definido pelo usuário, `x-amz-meta-confidencial: sim`.', correct: false, consequence: 'Políticas e regras de ciclo de vida não filtram por metadados definidos pelo usuário.' },
        { id: 'b', text: 'Mover os documentos para um prefixo `confidencial/`.', correct: false, consequence: 'Políticas e ciclo de vida filtram por prefixo, mas mover muda as keys, o que o requisito proíbe.' },
        { id: 'c', text: 'Uma tag de objeto `classificacao=confidencial`.', correct: true, consequence: 'Tags de objeto podem ser usadas em políticas e em filtros de ciclo de vida, sem mudar a key.' },
        { id: 'd', text: 'O Content-Type dos documentos, trocado para um tipo próprio.', correct: false, consequence: 'É um metadado de sistema que diz o formato do arquivo; não serve de filtro para políticas nem ciclo de vida.' },
      ],
      explanation: [
        'Os dois consumidores da marca são uma **bucket policy** e uma **regra de ciclo de vida**, e os dois aceitam **tags de objeto** como critério. Cada objeto pode ter até 10 tags, e elas podem ser alteradas sem mudar a key.',
        'Metadados definidos pelo usuário não servem de filtro para políticas nem ciclo de vida. Um prefixo serviria, mas exigiria mudar as keys. O Content-Type descreve o formato do arquivo.',
        '**Regra prática:** para selecionar objetos em políticas, ciclo de vida ou relatórios de custo sem mexer nas keys, use tags de objeto.',
      ],
    },
    {
      id: 'rv:s3x.f01.m3.a4',
      kind: 'decision',
      title: 'Uma tabela só para saber o que já chegou',
      prompt:
        'Um pipeline grava arquivos num bucket e, logo depois, outro processo lista o prefixo para descobrir os arquivos novos. Por medo de a listagem vir desatualizada, um arquiteto propõe registrar cada arquivo também numa tabela do DynamoDB e consultar a tabela em vez de listar o bucket. A empresa quer o **menor esforço operacional**. Qual avaliação está correta?',
      concepts: [{ id: 's3.consistency' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Adotar a tabela: o S3 só mostra objetos novos na listagem depois de alguns segundos.', correct: false, consequence: 'Descreve a consistência eventual de materiais antigos; hoje a listagem já reflete o PUT concluído.' },
        { id: 'b', text: 'Dispensar a tabela: depois de um PUT bem-sucedido, a listagem já mostra o arquivo.', correct: true, consequence: 'O pipeline continua simples, sem uma tabela para manter em sincronia com o bucket.' },
        { id: 'c', text: 'Dispensar a tabela, mas esperar 5 segundos entre a gravação e a listagem.', correct: false, consequence: 'A espera também é desnecessária: a consistência forte vale imediatamente.' },
        { id: 'd', text: 'Adotar a tabela, porque a consistência forte do S3 é um recurso pago à parte.', correct: false, consequence: 'A consistência forte vem automaticamente, sem custo extra.' },
      ],
      explanation: [
        'O S3 oferece **consistência forte de leitura após escrita** para PUTs e DELETEs, **inclusive nas listagens**, automaticamente e sem custo extra. Depois que a gravação é concluída, a listagem seguinte já mostra o arquivo.',
        'A tabela auxiliar resolve um problema que não existe mais e ainda cria uma segunda fonte de verdade para manter. Esperas artificiais também são desnecessárias.',
        '**Regra prática:** materiais antigos falam em consistência eventual no S3. Alternativas que acrescentam filas, atrasos ou bancos auxiliares só para contornar isso estão erradas hoje.',
      ],
    },
  ],
}
