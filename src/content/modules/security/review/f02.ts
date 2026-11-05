/**
 * Questões da Revisão da Fase 2 de Segurança (KMS avançado e CloudHSM), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md); preços de referência da trilha. As
 * empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'sec.f02',
  questions: [
    {
      id: 'rv:sec.f02.m1.a1',
      kind: 'decision',
      title: 'As apólices cifradas antes da rotação',
      prompt:
        'Uma seguradora ligou em março a **rotação automática** da chave simétrica gerenciada pelo cliente que cifra as apólices. Em abril, o sistema precisa abrir uma apólice **cifrada em 2024** com a mesma chave. A equipe quer saber o que fazer **com o menor esforço**. Qual avaliação está correta?',
      concepts: [{ id: 'kms.rotation' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Nada: o KMS usa o material antigo para decifrar a apólice.', correct: true, consequence: 'A rotação é transparente para quem lê: o KMS guarda o material anterior e escolhe sozinho.' },
        { id: 'b', text: 'Cifrar de novo todas as apólices antigas com o material novo.', correct: false, consequence: 'A rotação não exige cifrar de novo os dados; os antigos continuam legíveis.' },
        { id: 'c', text: 'Trocar nas aplicações o ID da chave pelo da chave girada.', correct: false, consequence: 'O ID, o ARN e a key policy continuam os mesmos depois da rotação.' },
        { id: 'd', text: 'Desligar a rotação, ler a apólice e ligá-la de novo.', correct: false, consequence: 'Não é preciso: o material antigo continua disponível com a rotação ligada.' },
      ],
      explanation: [
        'Na **rotação**, o KMS gera material novo para a chave, mas **o ID, o ARN e a key policy não mudam**, e o **material anterior é guardado**. Ao decifrar, o KMS escolhe sozinho o material que cifrou aquele dado. A apólice de 2024 abre normalmente.',
        'A rotação não recifra os dados nem as chaves de dados já geradas, e não muda o ID.',
        '**Regra prática:** "girar a chave sem recifrar os dados" é a rotação do KMS; os dados antigos continuam legíveis.',
      ],
    },
    {
      id: 'rv:sec.f02.m1.a2',
      kind: 'decision',
      title: 'Uma chave de assinatura que também precisa girar',
      prompt:
        'Uma norma exige **girar todo ano** as chaves do KMS. A chave simétrica dos sinistros já tem rotação automática. Falta a chave **assimétrica** usada para **assinar** documentos, chamada pelas aplicações pelo alias alias/assinatura. Qual abordagem atende?',
      concepts: [{ id: 'kms.rotation' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar a rotação automática anual também na chave assimétrica.', correct: false, consequence: 'A rotação automática vale só para chaves simétricas gerenciadas pelo cliente.' },
        { id: 'b', text: 'Usar a rotação sob demanda na chave assimétrica todo ano.', correct: false, consequence: 'A rotação sob demanda também é só para chaves simétricas.' },
        { id: 'c', text: 'Uma chave nova por ano, com o alias apontado para ela.', correct: true, consequence: 'É a rotação manual: as aplicações seguem usando o alias, e a chave antiga continua para verificar assinaturas antigas.' },
        { id: 'd', text: 'Trocar a chave de assinatura por uma chave gerenciada pela AWS.', correct: false, consequence: 'Chaves gerenciadas pela AWS são simétricas e usadas pelos serviços; não assinam documentos.' },
      ],
      explanation: [
        'A **rotação automática** e a **sob demanda** valem para **chaves simétricas gerenciadas pelo cliente**. Chaves **assimétricas**, HMAC e de key stores personalizados **giram só manualmente**: cria-se uma chave nova e se troca a referência. Com as aplicações usando um **alias**, basta apontá-lo para a chave nova.',
        'Nenhuma das rotações do KMS se aplica à chave assimétrica, e chaves gerenciadas pela AWS não servem para assinar.',
        '**Regra prática:** chave simétrica do cliente, rotação automática; assimétrica, rotação manual com alias.',
      ],
    },
    {
      id: 'rv:sec.f02.m1.a3',
      kind: 'decision',
      title: 'A chave que parou numa segunda-feira',
      prompt:
        'Uma chave do KMS criada **com material importado** de um HSM próprio parou de funcionar, e **todas as leituras de dados cifrados falham**. O material foi importado há um ano, **com prazo de expiração de um ano**. A empresa quer **recuperar o acesso** aos dados. O que fazer?',
      concepts: [{ id: 'kms.imported-material' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Esperar a rotação automática gerar material novo.', correct: false, consequence: 'Chaves com material importado não têm rotação automática.' },
        { id: 'b', text: 'Abrir um chamado para a AWS restaurar a chave apagada.', correct: false, consequence: 'A chave não foi apagada; o material importado expirou.' },
        { id: 'c', text: 'Criar uma chave nova e decifrar os dados com ela.', correct: false, consequence: 'Uma chave com outro material não decifra o que foi cifrado com o material antigo.' },
        { id: 'd', text: 'Importar de novo o mesmo material de chave.', correct: true, consequence: 'Com o material de volta, a chave volta a funcionar e os dados ficam legíveis.' },
      ],
      explanation: [
        'Com **material importado**, quem importa cuida dele: pode apagá-lo ou definir **expiração**, e a chave **para de funcionar** assim que o material expira ou é apagado. Importar **o mesmo material** de novo devolve o acesso aos dados.',
        'Material importado não tem rotação automática. A chave não foi apagada. E outra chave, com outro material, não decifra os dados.',
        '**Regra prática:** com material importado, a disponibilidade da chave depende de você. Guarde o material com cuidado e acompanhe a expiração.',
      ],
    },
    {
      id: 'rv:sec.f02.m2.a1',
      kind: 'decision',
      title: 'Transformar a chave atual em multi-Região',
      prompt:
        'Uma aplicação cifra documentos no cliente com uma chave do KMS de **uma Região só**, em sa-east-1, e copia os arquivos para us-east-1. Para a recuperação de desastres, us-east-1 precisa **decifrar sem chamar sa-east-1**. A equipe propõe **converter a chave atual em multi-Região**. Qual caminho atende?',
      concepts: [{ id: 'kms.multi-region' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Converter a chave atual em multi-Região e criar a réplica em us-east-1.', correct: false, consequence: 'Uma chave de uma Região só não vira multi-Região depois de criada.' },
        { id: 'b', text: 'Criar uma chave nova em us-east-1 e decifrar os arquivos com ela.', correct: false, consequence: 'Chaves independentes têm material diferente: uma não decifra o que a outra cifrou.' },
        { id: 'c', text: 'Uma chave multi-Região nova, com réplica em us-east-1.', correct: true, consequence: 'A réplica tem o mesmo material e decifra em us-east-1 sem chamar sa-east-1.' },
        { id: 'd', text: 'Copiar a key policy da chave atual para us-east-1.', correct: false, consequence: 'A política não leva o material; sem ele, nada é decifrado.' },
      ],
      explanation: [
        'Uma **chave multi-Região** tem réplicas em outras Regiões com o **mesmo ID e o mesmo material**: o que foi cifrado numa Região é decifrado na outra sem chamar a primeira. Mas **uma chave de uma Região só não vira multi-Região** depois de criada. O caminho é criar uma chave multi-Região nova, replicá-la e passar a cifrar com ela (os dados antigos precisam ser cifrados de novo com a chave nova).',
        'Chaves independentes não decifram o que a outra cifrou, e copiar a política não copia o material.',
        '**Regra prática:** "decifrar na Região de recuperação sem depender da principal" é chave multi-Região, criada assim desde o início.',
      ],
    },
    {
      id: 'rv:sec.f02.m2.a2',
      kind: 'decision',
      title: 'O ex-fornecedor e a réplica',
      prompt:
        'A segurança removeu o acesso de um **ex-fornecedor** na key policy da chave multi-Região **principal**, em sa-east-1. A chave tem uma **réplica** em us-east-1, que o fornecedor também usava. A empresa quer garantir que ele **perca o acesso nas duas Regiões**. O que falta?',
      concepts: [{ id: 'kms.multi-region' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Nada: a réplica copia a key policy da chave principal.', correct: false, consequence: 'O que se compartilha é o material, o ID e a rotação, não a key policy.' },
        { id: 'b', text: 'Corrigir também a key policy da réplica em us-east-1.', correct: true, consequence: 'A key policy de cada réplica é independente; com as duas corrigidas, o acesso some.' },
        { id: 'c', text: 'Girar o material da chave, para invalidar o acesso.', correct: false, consequence: 'A rotação não muda quem pode usar a chave.' },
        { id: 'd', text: 'Desativar a chave principal, que leva a réplica junto.', correct: false, consequence: 'O estado ativado também é independente, e a medida pararia a empresa em sa-east-1.' },
      ],
      explanation: [
        'Nas chaves multi-Região, **material, ID e rotação são compartilhados**, mas **key policy, grants, alias, tags e estado ativado são independentes**. Mudar a política da principal não muda a da réplica: ela também precisa ser corrigida.',
        'A rotação não mexe em permissões, e desativar a principal não afeta a réplica e ainda para a operação.',
        '**Regra prática:** em chave multi-Região, revise permissões em cada réplica; só o material e a rotação andam juntos.',
      ],
    },
    {
      id: 'rv:sec.f02.cota-de-requisicoes',
      kind: 'decision',
      title: 'Uma aplicação que decifra a cada requisição',
      prompt:
        'Uma aplicação chama **Decrypt** do KMS a cada requisição de cliente e, com o crescimento, passou da **cota de operações criptográficas** da conta na Região: os picos geram **ThrottlingException**. Não há S3 envolvido. A empresa quer resolver **sem mudar de Região** e com o menor esforço. Qual ação atende?',
      concepts: [{ id: 'kms.quotas' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar as bucket keys do S3.', correct: false, consequence: 'As bucket keys reduzem chamadas do S3 ao KMS; aqui as chamadas são da aplicação.' },
        { id: 'b', text: 'Trocar a chave por uma chave multi-Região.', correct: false, consequence: 'A cota é da conta e da Região, não da chave; continua a mesma.' },
        { id: 'c', text: 'Pedir aumento da cota de requisições do KMS.', correct: true, consequence: 'As cotas de requisição do KMS podem ser aumentadas, e os picos deixam de esbarrar no limite.' },
        { id: 'd', text: 'Passar a chave para um key store do CloudHSM.', correct: false, consequence: 'Acrescenta HSMs para operar, e a cota desse key store não pode ser aumentada.' },
      ],
      explanation: [
        'As operações criptográficas com chaves simétricas dividem uma **cota por segundo, por conta e por Região**; acima dela, o KMS devolve **ThrottlingException**. Essas cotas **podem ser aumentadas** (exceto a do key store do CloudHSM). Sem S3 no caminho, pedir o aumento é a ação direta; reduzir as chamadas na aplicação também ajuda.',
        'Bucket keys valem para o S3. A cota não é por chave. E o key store do CloudHSM tem cota fixa e mais operação.',
        '**Regra prática:** ThrottlingException do KMS num bucket com SSE-KMS pede bucket keys; fora do S3, pede reduzir chamadas ou aumentar a cota.',
      ],
    },
    {
      id: 'rv:sec.f02.m3.a2',
      kind: 'decision',
      title: 'Uma aplicação legada de assinatura',
      prompt:
        'Um banco vai levar para a AWS uma aplicação legada de assinatura, escrita para falar com um HSM pela interface **PKCS #11**. Reescrever a aplicação para outra API levaria meses, e o banco quer migrar com **poucas mudanças no código**, mantendo as chaves num HSM na AWS. Qual serviço atende?',
      concepts: [{ id: 'hsm.cloudhsm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'AWS KMS, com uma chave gerenciada pelo cliente.', correct: false, consequence: 'O KMS tem API própria; a aplicação teria de ser reescrita para deixar o PKCS #11.' },
        { id: 'b', text: 'AWS CloudHSM, com o cluster do banco.', correct: true, consequence: 'O CloudHSM aceita PKCS #11, JCE e CNG, e a aplicação migra com poucas mudanças.' },
        { id: 'c', text: 'AWS Secrets Manager, guardando a chave de assinatura.', correct: false, consequence: 'Guarda segredos, mas não é um HSM nem assina documentos.' },
        { id: 'd', text: 'Chaves num arquivo cifrado com o KMS, num bucket privado.', correct: false, consequence: 'Não é um HSM, e a aplicação teria de mudar a forma de assinar.' },
      ],
      explanation: [
        'O **CloudHSM** entrega **HSMs dedicados a um só cliente**, e aplicações que usam **PKCS #11**, JCE ou CNG **migram com poucas mudanças**, porque continuam falando com um HSM pela mesma interface. O KMS, por outro lado, tem API própria e exigiria reescrever a aplicação.',
        'O KMS resolveria a criptografia, mas não pela interface que a aplicação usa. O Secrets Manager e arquivos cifrados não são HSMs nem assinam documentos.',
        '**Regra prática:** além de "HSM dedicado" e "FIPS 140 nível 3", interfaces como PKCS #11, JCE e CNG também apontam para o CloudHSM, quando reescrever a aplicação não é opção.',
      ],
    },
    {
      id: 'rv:sec.f02.cluster-em-zonas',
      kind: 'decision',
      title: 'Um HSM só para assinar tudo',
      prompt:
        'Um banco usa um cluster do CloudHSM com **um único HSM**, numa zona de disponibilidade, para assinar transações o dia inteiro. A diretoria exige que a assinatura **continue se uma zona falhar**. Qual mudança atende?',
      concepts: [{ id: 'hsm.cloudhsm' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'HSMs em outras zonas, no mesmo cluster.', correct: true, consequence: 'Com HSMs em mais de uma zona, a falha de uma não interrompe as assinaturas.' },
        { id: 'b', text: 'Trocar o HSM por um modelo maior, na mesma zona.', correct: false, consequence: 'Um HSM maior continua sendo um só, na zona que pode falhar.' },
        { id: 'c', text: 'Fazer backup diário do HSM e restaurar quando a zona cair.', correct: false, consequence: 'Recupera as chaves, mas a assinatura fica parada até a restauração.' },
        { id: 'd', text: 'Mover as chaves para o KMS só durante as falhas.', correct: false, consequence: 'Contraria a exigência de HSM dedicado e não é um caminho automático.' },
      ],
      explanation: [
        'O cluster do **CloudHSM** pode ter **HSMs em várias zonas de disponibilidade**. Com mais de um HSM, em zonas diferentes, a falha de uma zona não para as operações. Como cada HSM é cobrado por hora, a alta disponibilidade tem custo, que a exigência justifica.',
        'Um HSM maior não remove o ponto único de falha. Backup e restauração têm parada. E o KMS não atende à exigência de HSM dedicado.',
        '**Regra prática:** CloudHSM de produção tem pelo menos dois HSMs, em zonas diferentes.',
      ],
    },
    {
      id: 'rv:sec.f02.m3.a3',
      kind: 'decision',
      title: 'Cargas para o CloudHSM',
      prompt:
        'Depois de uma norma do regulador, um banco discute que cargas levar para o **CloudHSM**, que cobra cada HSM por hora e exige operar o cluster. O resto continua no KMS. Quais cargas **devem** ir para o CloudHSM? (Escolha DUAS.)',
      concepts: [{ id: 'hsm.kms-vs-cloudhsm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'As chaves de assinatura que a norma exige em HSM dedicado.', correct: true, consequence: 'É exatamente o que o KMS não atende: HSM dedicado ao banco.' },
        { id: 'b', text: 'A aplicação legada que só fala PKCS #11 com um HSM.', correct: true, consequence: 'A interface PKCS #11 é atendida pelo CloudHSM, com poucas mudanças.' },
        { id: 'c', text: 'O bucket de logs internos, sem nenhuma exigência especial.', correct: false, consequence: 'O KMS atende com menos custo e operação.' },
        { id: 'd', text: 'Os volumes EBS do ambiente de desenvolvimento.', correct: false, consequence: 'A criptografia padrão com o KMS atende; um HSM dedicado só aumentaria o custo.' },
        { id: 'e', text: 'Os snapshots do RDS compartilhados com a conta de backup.', correct: false, consequence: 'Uma chave gerenciada pelo cliente do KMS resolve o compartilhamento.' },
      ],
      explanation: [
        'O **KMS** é o padrão: gerenciado, integrado aos serviços da AWS e cobrado por chave e por uso. O **CloudHSM** entra quando a regra exige **HSM dedicado**, controle exclusivo das chaves ou **interfaces que o KMS não oferece**, como o PKCS #11. Fora disso, ele só acrescenta custo por hora e operação.',
        'Logs, volumes de desenvolvimento e snapshots compartilhados são atendidos pelo KMS.',
        '**Regra prática:** na dúvida, KMS. CloudHSM só onde o enunciado exige HSM dedicado ou interfaces específicas.',
      ],
    },
    {
      id: 'rv:sec.f02.m3.a4',
      kind: 'decision',
      title: 'Quanto custa o HSM dedicado',
      prompt:
        'Na tabela de preços usada pela empresa, cada HSM do CloudHSM custa **US$ 1,60 por hora** em us-east-1, e uma chave do KMS gerenciada pelo cliente, cerca de **US$ 1 por mês**, mais as requisições. Quanto custa por mês um cluster com **dois HSMs**, um em cada zona, ligados as **730 horas** do mês?',
      concepts: [{ id: 'hsm.kms-vs-cloudhsm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 1.168 por mês', correct: false, consequence: 'É o custo de um HSM só (1,60 × 730); o cluster tem dois.' },
        { id: 'b', text: 'Cerca de US$ 2', correct: false, consequence: 'Confunde o preço por hora do HSM com o preço mensal de chaves do KMS.' },
        { id: 'c', text: 'Cerca de US$ 38', correct: false, consequence: 'Conta só um dia de dois HSMs (2 × 1,60 × 12); o mês tem 730 horas.' },
        { id: 'd', text: 'Cerca de US$ 2.336', correct: true, consequence: '2 HSMs × US$ 1,60 × 730 horas, contra alguns dólares por mês para chaves do KMS.' },
      ],
      explanation: [
        'O CloudHSM **cobra cada HSM por hora**: 2 × US$ 1,60 × 730 horas ≈ **US$ 2.336 por mês**. Para comparar, dez chaves gerenciadas pelo cliente no KMS custam cerca de US$ 10 por mês, mais as requisições.',
        'Um HSM só custa a metade, e um cluster de produção precisa de pelo menos dois, em zonas diferentes. Os outros valores misturam o preço por hora com o mensal ou contam só um dia. A conta não inclui impostos nem outras faixas de preço.',
        '**Regra prática:** a diferença de custo é grande; por isso o CloudHSM fica só onde a regra exige HSM dedicado.',
      ],
    },
  ],
}
