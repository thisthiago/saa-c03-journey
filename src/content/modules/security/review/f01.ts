/**
 * Questões da Revisão da Fase 1 de Segurança (criptografia e KMS), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F01: ReviewSet = {
  phaseId: 'sec.f01',
  questions: [
    {
      id: 'rv:sec.f01.m1.a1:snapshot',
      kind: 'decision',
      title: 'Extratos guardados e baixados',
      prompt:
        'Um banco guarda os extratos dos clientes num bucket do S3 e os entrega por um site atrás de um Application Load Balancer. A auditoria exige que os extratos sejam **cifrados enquanto ficam guardados** e **enquanto viajam** até o navegador do cliente. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'sec.at-rest-in-transit' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Criptografia SSE-KMS no bucket dos extratos.', correct: true, consequence: 'Os extratos ficam cifrados em repouso, com a chave do KMS.' },
        { id: 'b', text: 'HTTPS no balanceador, com um certificado do ACM.', correct: true, consequence: 'O extrato viaja cifrado por TLS até o navegador do cliente.' },
        { id: 'c', text: 'Só a SSE-KMS no bucket, que também protege o download.', correct: false, consequence: 'Cifrar o objeto guardado não protege os dados enquanto eles viajam pela rede.' },
        { id: 'd', text: 'Só o HTTPS no balanceador, que também cifra o bucket.', correct: false, consequence: 'O TLS protege o trânsito; os objetos no bucket continuariam sem a criptografia pedida.' },
        { id: 'e', text: 'O versionamento do bucket dos extratos.', correct: false, consequence: 'Guarda versões dos objetos; não cifra nada.' },
      ],
      explanation: [
        'Dado **em repouso** é o que está gravado, e se protege com chaves como as do **KMS**, pela criptografia do serviço (aqui, SSE-KMS no bucket). Dado **em trânsito** é o que viaja pela rede, e se protege com **TLS**, usando certificados como os do **ACM**. O requisito pede os dois.',
        'Uma medida para um tipo não cobre o outro. E o versionamento não é criptografia.',
        '**Regra prática:** leia se o requisito pede repouso, trânsito ou os dois. Repouso é KMS e a criptografia dos serviços; trânsito é TLS com certificados do ACM.',
      ],
    },
    {
      id: 'rv:sec.f01.disco-cifrado-rede-aberta',
      kind: 'decision',
      title: 'Volumes cifrados e uma conexão aberta',
      prompt:
        'Os volumes EBS de um servidor de aplicação e o armazenamento do banco no RDS já são **cifrados com o KMS**. A auditoria encontrou dados pessoais passando **sem criptografia na conexão** entre a aplicação e o banco, dentro da VPC. O que corrige o achado?',
      concepts: [{ id: 'sec.at-rest-in-transit' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Cifrar de novo os volumes, com uma chave gerenciada pelo cliente.', correct: false, consequence: 'Muda a chave do repouso; a conexão continua sem criptografia.' },
        { id: 'b', text: 'Ligar a rotação automática da chave do KMS.', correct: false, consequence: 'A rotação troca o material da chave do repouso; não toca na conexão.' },
        { id: 'c', text: 'Restringir o security group do banco à aplicação.', correct: false, consequence: 'Filtra quem conecta, mas o tráfego permitido continua sem criptografia.' },
        { id: 'd', text: 'Exigir conexões TLS entre a aplicação e o banco.', correct: true, consequence: 'Os dados passam a viajar cifrados pela rede.' },
      ],
      explanation: [
        'O achado é de **trânsito**: os dados viajam abertos pela rede. Cifrar o disco protege o que está gravado, não o que passa pela conexão. A correção é exigir **TLS** entre a aplicação e o banco.',
        'Trocar a chave ou ligar a rotação mexe no repouso. E um security group filtra, mas não cifra.',
        '**Regra prática:** "cifrado em repouso" não implica "cifrado em trânsito". Um requisito que exige os dois pede KMS no armazenamento e TLS nas conexões.',
      ],
    },
    {
      id: 'rv:sec.f01.m1.a4',
      kind: 'decision',
      title: 'Quem decifrou os extratos',
      prompt:
        'A auditoria quer saber **quem decifrou extratos** com uma chave gerenciada pelo cliente do KMS na semana passada, com o horário e a role de cada pedido. Onde a equipe encontra essa informação?',
      concepts: [{ id: 'kms.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Nos registros do CloudTrail com as operações do KMS.', correct: true, consequence: 'Cada Decrypt aparece com a role, o horário e a chave usada.' },
        { id: 'b', text: 'Nos metadados dos próprios arquivos cifrados.', correct: false, consequence: 'O arquivo cifrado não guarda quem o leu nem quando.' },
        { id: 'c', text: 'Nos logs de acesso do servidor do bucket.', correct: false, consequence: 'Mostram pedidos ao S3, não as operações de decifrar no KMS.' },
        { id: 'd', text: 'Em lugar nenhum: o KMS não registra o uso das chaves.', correct: false, consequence: 'O uso das chaves gerenciadas pelo cliente e pela AWS fica registrado no CloudTrail.' },
      ],
      explanation: [
        'O **KMS** registra cada uso das chaves no **CloudTrail**: quem pediu, qual operação, qual chave e quando. É isso que permite auditar quem decifrou dados com uma chave gerenciada pelo cliente.',
        'Os arquivos não guardam quem os leu, e os logs do bucket não mostram as operações do KMS.',
        '**Regra prática:** "auditar o uso das chaves" é CloudTrail sobre o KMS; é uma das razões para usar o KMS em vez de chaves guardadas pela aplicação.',
      ],
    },
    {
      id: 'rv:sec.f01.chaves-na-aplicacao',
      kind: 'decision',
      title: 'Uma chave no arquivo de configuração',
      prompt:
        'Uma aplicação cifra dados com uma **chave guardada no próprio arquivo de configuração**. A segurança quer que a chave **nunca saia sem proteção**, que **cada uso seja auditável** e que seja possível **controlar quem decifra**. Não há exigência de HSM dedicado. Qual solução atende com o menor esforço?',
      concepts: [{ id: 'kms.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mover a chave para uma variável de ambiente das instâncias.', correct: false, consequence: 'A chave continua exposta na instância, sem auditoria de uso.' },
        { id: 'b', text: 'Um cluster do CloudHSM, com a chave dentro dele.', correct: false, consequence: 'Atende, mas é um HSM dedicado para operar, sem que o requisito peça isso.' },
        { id: 'c', text: 'Uma chave gerenciada pelo cliente no KMS, com key policy.', correct: true, consequence: 'O material da chave não sai do KMS, o uso aparece no CloudTrail e a key policy decide quem decifra.' },
        { id: 'd', text: 'Guardar a chave num bucket do S3 privado.', correct: false, consequence: 'A chave continua sendo baixada pela aplicação, sem controle de uso.' },
      ],
      explanation: [
        'O **KMS** cria e guarda chaves cujo material é gerado e usado em HSMs e **não sai sem proteção**. Cada uso aparece no **CloudTrail**, e a **key policy** decide quem pode usar e administrar a chave. Uma chave gerenciada pelo cliente atende aos três requisitos.',
        'Variável de ambiente e bucket continuam entregando a chave à aplicação. O CloudHSM só entra quando o requisito exige HSM dedicado.',
        '**Regra prática:** "criptografia gerenciada, uso auditável, controle de quem decifra" é KMS; CloudHSM só com exigência de HSM dedicado.',
      ],
    },
    {
      id: 'rv:sec.f01.m1.a3',
      kind: 'decision',
      title: 'Rotação a cada 90 dias',
      prompt:
        'Uma norma interna exige que a chave que cifra os dados de cartões tenha **rotação automática a cada 90 dias** e que a empresa **controle a key policy**. Hoje os dados usam a chave gerenciada pela AWS do serviço. Qual mudança atende?',
      concepts: [{ id: 'kms.key-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter a chave gerenciada pela AWS e mudar o período de rotação dela.', correct: false, consequence: 'A chave gerenciada pela AWS gira todo ano, e o cliente não muda esse prazo nem a política.' },
        { id: 'b', text: 'Passar para uma chave da AWS (AWS owned), que gira com mais frequência.', correct: false, consequence: 'A chave da AWS nem aparece na conta: não há key policy nem rotação para controlar.' },
        { id: 'c', text: 'Uma chave gerenciada pelo cliente, com rotação automática de 90 dias.', correct: true, consequence: 'A empresa escreve a key policy e define o período de rotação.' },
        { id: 'd', text: 'Criar uma chave nova à mão a cada 90 dias e recifrar tudo.', correct: false, consequence: 'Funciona, mas dá muito mais trabalho que a rotação automática da chave do cliente.' },
      ],
      explanation: [
        'Há três tipos de chave. A **gerenciada pelo cliente** é criada pela empresa, que controla a **key policy**, a **rotação** e a exclusão. A **gerenciada pela AWS** gira todo ano, sem que o cliente mude o prazo. A **da AWS** fica numa conta do serviço e não aparece para o cliente.',
        'Só a chave do cliente deixa definir o período de rotação e a política. Criar chaves à mão resolve com esforço desnecessário.',
        '**Regra prática:** controlar a key policy, compartilhar com outra conta ou definir a rotação exige chave gerenciada pelo cliente.',
      ],
    },
    {
      id: 'rv:sec.f01.so-cifrar',
      kind: 'decision',
      title: 'Duzentas chaves só para cifrar',
      prompt:
        'Uma empresa criou **200 chaves gerenciadas pelo cliente**, uma por bucket, e paga um valor mensal por cada uma. Os buckets não são compartilhados com outras contas, ninguém pede controle da key policy nem da rotação, e o único requisito é **cifrar em repouso**. A empresa quer o **menor custo e esforço**. Qual mudança atende?',
      concepts: [{ id: 'kms.key-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Criptografia padrão do S3, sem chaves do cliente.', correct: true, consequence: 'Os objetos continuam cifrados em repouso, sem o custo mensal de 200 chaves.' },
        { id: 'b', text: 'Juntar as 200 chaves em 100, uma para cada dois buckets.', correct: false, consequence: 'Reduz pela metade, mas ainda paga 100 chaves que o requisito não pede.' },
        { id: 'c', text: 'Desligar a criptografia dos buckets.', correct: false, consequence: 'Elimina o custo, mas viola o requisito de cifrar em repouso.' },
        { id: 'd', text: 'Mover as chaves para um cluster do CloudHSM.', correct: false, consequence: 'Aumenta o custo e a operação, sem nenhum requisito que peça HSM.' },
      ],
      explanation: [
        'A chave **gerenciada pelo cliente tem custo mensal** e só se justifica quando há requisitos como controlar a key policy, compartilhar com outra conta ou definir a rotação. Quando o requisito é **só cifrar**, com o menor custo e esforço, as chaves geridas pela AWS para o serviço atendem; no S3, a criptografia padrão já cifra os objetos em repouso.',
        'Reduzir o número de chaves do cliente ainda paga o que não precisa. Desligar a criptografia viola o requisito. E o CloudHSM é mais caro.',
        '**Regra prática:** só cifrar, ao menor custo, é chave da AWS; controle e compartilhamento pedem chave do cliente.',
      ],
    },
    {
      id: 'rv:sec.f01.m2.a2',
      kind: 'decision',
      title: 'Um parceiro fora da AWS que cifra arquivos',
      prompt:
        'Um parceiro, **fora da AWS**, precisa cifrar arquivos que **só o banco vai conseguir abrir**. O banco não quer entregar ao parceiro nenhum segredo que permita decifrar. A chave deve ficar no KMS. Que tipo de chave atende?',
      concepts: [{ id: 'kms.symmetric-asymmetric' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma chave simétrica, exportada e enviada ao parceiro.', correct: false, consequence: 'O material da chave simétrica não sai do KMS, e quem a tivesse também poderia decifrar.' },
        { id: 'b', text: 'Um par assimétrico, com a chave pública baixada pelo parceiro.', correct: true, consequence: 'O parceiro cifra com a pública, e só a privada, dentro do KMS, decifra.' },
        { id: 'c', text: 'Uma chave simétrica, com o parceiro chamando o Encrypt por uma conta própria.', correct: false, consequence: 'Exige dar ao parceiro acesso ao KMS do banco, o que o enunciado quer evitar.' },
        { id: 'd', text: 'Uma chave gerenciada pela AWS, compartilhada com o parceiro.', correct: false, consequence: 'Chaves gerenciadas pela AWS não são compartilhadas, e o parceiro nem está na AWS.' },
      ],
      explanation: [
        'Na chave **assimétrica**, o par tem uma **chave pública**, que pode ser **baixada e usada fora da AWS**, e uma **privada**, que fica no KMS e é a única que decifra. O parceiro cifra com a pública sem receber nenhum segredo. A chave simétrica, padrão dos serviços da AWS, usa o mesmo segredo para cifrar e decifrar, e esse segredo não sai do KMS.',
        'Exportar uma chave simétrica não é possível nem seguro. Dar ao parceiro acesso ao KMS do banco foge do pedido. E chaves gerenciadas pela AWS não se compartilham.',
        '**Regra prática:** cifrar fora da AWS para só você decifrar é chave assimétrica, com a pública distribuída; dentro dos serviços da AWS, o padrão é a simétrica.',
      ],
    },
    {
      id: 'rv:kms.envelope:2',
      kind: 'decision',
      title: 'Arquivos de 20 MB e o limite do Encrypt',
      prompt:
        'Uma aplicação precisa cifrar **arquivos de 20 MB** com uma chave simétrica do KMS, antes de guardá-los. O Encrypt do KMS aceita no máximo 4.096 bytes. Quais ações compõem a solução correta? (Escolha DUAS.)',
      concepts: [{ id: 'kms.envelope' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Pedir uma chave de dados com GenerateDataKey e cifrar o arquivo com a cópia aberta dela.', correct: true, consequence: 'O arquivo é cifrado localmente; o KMS só protege a chave de dados.' },
        { id: 'b', text: 'Guardar junto do arquivo só a cópia cifrada da chave de dados.', correct: true, consequence: 'Sem acesso ao KMS para decifrá-la, ninguém abre o arquivo.' },
        { id: 'c', text: 'Mandar o arquivo inteiro ao Encrypt, em uma chamada.', correct: false, consequence: 'O Encrypt recusa entradas com mais de 4.096 bytes.' },
        { id: 'd', text: 'Guardar junto do arquivo a cópia aberta da chave de dados.', correct: false, consequence: 'Quem pegar o arquivo leva a chave junto e abre tudo.' },
        { id: 'e', text: 'Guardar o arquivo dentro do KMS, que cuida da criptografia.', correct: false, consequence: 'O KMS não guarda dados: só cifra e decifra chaves.' },
      ],
      explanation: [
        'Na **criptografia em envelope**, a aplicação pede ao KMS uma **chave de dados** (GenerateDataKey), recebe uma cópia aberta e uma cifrada, **cifra o arquivo com a cópia aberta**, descarta essa cópia e **guarda só a cifrada** junto do arquivo. Para ler, pede ao KMS que decifre a chave de dados.',
        'O Encrypt não aceita 20 MB. Guardar a chave aberta anula a proteção. E o KMS não guarda arquivos.',
        '**Regra prática:** "cifrar arquivos grandes com o KMS" é criptografia em envelope com GenerateDataKey.',
      ],
    },
    {
      id: 'rv:sec.f01.m2.a3',
      kind: 'decision',
      title: 'O ID da chave escrito no código',
      prompt:
        'Doze aplicações cifram dados com uma chave do KMS, cada uma com o **ID da chave** escrito no código. A empresa vai passar a usar uma **chave nova** e quer que, nas próximas trocas, **nenhum código precise mudar**. Qual prática atende?',
      concepts: [{ id: 'kms.alias' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Atualizar o ID da chave nova no código de cada aplicação a cada troca.', correct: false, consequence: 'É exatamente a mudança de código que se quer evitar.' },
        { id: 'b', text: 'Apagar a chave antiga assim que a nova for criada.', correct: false, consequence: 'Os dados cifrados com ela deixariam de poder ser decifrados.' },
        { id: 'c', text: 'Usar a mesma chave para sempre, sem nunca trocar.', correct: false, consequence: 'Contraria a necessidade de trocar a chave.' },
        { id: 'd', text: 'Um alias, como alias/extratos, apontado para a chave da vez.', correct: true, consequence: 'Na troca, só o alias passa a apontar para a chave nova; o código não muda.' },
      ],
      explanation: [
        'O **alias** é um nome amigável que **aponta para uma chave** e pode passar a apontar para outra. Com as aplicações usando o alias, trocar de chave é só mudar para onde ele aponta. As chaves antigas continuam existindo para decifrar o que foi cifrado com elas.',
        'Editar o ID em cada aplicação é o trabalho a evitar. Apagar a chave antiga perde dados. E nunca trocar não atende ao pedido.',
        '**Regra prática:** aplicações devem citar chaves pelo alias. O prefixo alias/aws/ é reservado às chaves gerenciadas pela AWS.',
      ],
    },
    {
      id: 'rv:sec.f01.m3.a1',
      kind: 'decision',
      title: 'Administrador da conta sem acesso à chave',
      prompt:
        'A key policy da chave dos extratos tem **um único statement**, que dá à role seguranca-chaves as ações de administração da chave. **Não há** o statement da conta (:root). A role admin-plataforma, da mesma conta e com **AdministratorAccess** no IAM, pede kms:Decrypt nessa chave. Qual é o resultado e por quê?',
      concepts: [{ id: 'kms.admin-vs-user' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Permitido: o AdministratorAccess libera todas as ações da conta.', correct: false, consequence: 'Sem o statement da conta, as políticas do IAM que permitem usar a chave não têm efeito.' },
        { id: 'b', text: 'Negado: a key policy não cita a role nem habilita o IAM.', correct: true, consequence: 'Só a key policy decide, e ela não dá Decrypt a essa role.' },
        { id: 'c', text: 'Permitido: quem é da mesma conta da chave sempre pode decifrar.', correct: false, consequence: 'Estar na mesma conta não dá acesso; a key policy é que decide.' },
        { id: 'd', text: 'Negado: o AdministratorAccess exclui de propósito as ações do KMS.', correct: false, consequence: 'O AdministratorAccess inclui o KMS; o que falta é a key policy habilitar o IAM.' },
      ],
      explanation: [
        'Toda chave do KMS tem uma **key policy**, e é ela que decide o acesso. O statement com o principal da conta (**:root**) não dá acesso a ninguém sozinho: ele **habilita as políticas do IAM** para a chave. Sem esse statement, permissões do IAM, mesmo o AdministratorAccess, não têm efeito, e a role admin-plataforma, não citada na key policy, é negada.',
        'Estar na mesma conta ou ter AdministratorAccess não basta. E o AdministratorAccess não exclui o KMS.',
        '**Regra prática:** no KMS, pergunte primeiro o que a key policy diz. Sem o statement da conta, só os principais citados nela usam a chave.',
      ],
    },
    {
      id: 'rv:sec.f01.m3.a3',
      kind: 'decision',
      title: 'Quem administra não lê',
      prompt:
        'A segurança de um banco exige **separação de funções** na chave dos extratos: a equipe de **segurança administra** a chave (política, rotação, exclusão), mas **não pode decifrar** os extratos; só a **role da aplicação** cifra e decifra. Qual key policy atende?',
      concepts: [{ id: 'kms.admin-vs-user' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'kms:* para a equipe de segurança e para a role da aplicação.', correct: false, consequence: 'Com kms:*, a equipe de segurança também decifra os extratos.' },
        { id: 'b', text: 'Administração para a segurança; uso da chave para a aplicação.', correct: true, consequence: 'Cada grupo faz só a sua parte, e a segurança não decifra os extratos.' },
        { id: 'c', text: 'Nenhuma permissão na key policy; tudo pelas políticas do IAM.', correct: false, consequence: 'Sem a key policy liberar, as políticas do IAM não têm efeito.' },
        { id: 'd', text: 'A mesma role para a segurança e a aplicação, com um aviso de uso correto.', correct: false, consequence: 'Junta as funções que a exigência quer separar.' },
      ],
      explanation: [
        'A key policy separa dois papéis. **Administradores** gerenciam a chave (política, rotação, exclusão) e, sem ações de uso, não cifram nem decifram. **Usuários** fazem Encrypt, Decrypt, ReEncrypt, GenerateDataKey e DescribeKey. Dar a cada grupo só as suas ações cumpre a separação de funções.',
        'kms:* para a segurança desfaz a separação. A key policy precisa existir e liberar alguém. E uma role compartilhada junta as funções.',
        '**Regra prática:** "quem administra a chave não lê os dados" é uma key policy com administradores e usuários separados. Lembre que administradores podem mudar a política e criar grants, então essa separação deve ser monitorada.',
      ],
    },
    {
      id: 'rv:sec.f01.grant-token',
      kind: 'decision',
      title: 'Negado logo depois de criar o grant',
      prompt:
        'Um processo noturno cria um **grant** do KMS para uma role temporária e, **logo em seguida**, tenta decifrar dados com ele. Às vezes, nos primeiros segundos, o pedido é **negado**, e alguns minutos depois funciona. A empresa quer que o processo use o grant **na hora**, sem editar a key policy. Qual mudança atende?',
      concepts: [{ id: 'kms.grants' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Usar o token do grant nos primeiros pedidos.', correct: true, consequence: 'Com o token, o grant vale imediatamente, sem esperar a propagação.' },
        { id: 'b', text: 'Pôr a role temporária na key policy da chave.', correct: false, consequence: 'Resolve, mas edita a key policy toda noite, o que o processo quer evitar.' },
        { id: 'c', text: 'Criar dois grants iguais para a mesma role.', correct: false, consequence: 'O segundo grant tem a mesma espera do primeiro.' },
        { id: 'd', text: 'Trocar o grant por uma negação explícita no IAM.', correct: false, consequence: 'Uma negação só tira acesso; não libera nada.' },
      ],
      explanation: [
        'O **grant** dá a um principal algumas operações sobre uma chave **sem mexer na key policy**, e é apagado quando o trabalho termina. Logo depois de criado, ele **pode levar alguns segundos para valer**; o **token do grant** permite usá-lo **na hora**.',
        'Editar a key policy é o que o grant evita. Grants repetidos não aceleram nada. E negações não liberam acesso.',
        '**Regra prática:** acesso temporário a uma chave, sem mexer na key policy, é grant; para usá-lo logo após criar, passe o token do grant.',
      ],
    },
  ],
}
