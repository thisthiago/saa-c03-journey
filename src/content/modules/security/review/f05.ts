/**
 * Questões da Revisão da Fase 5 de Segurança (detecção de ameaças), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'sec.f05',
  questions: [
    {
      id: 'rv:sec.f05.m1.a1',
      kind: 'decision',
      title: 'O que ligar antes do GuardDuty',
      prompt:
        'Uma empresa vai ligar o **GuardDuty** pela primeira vez. Um analista propõe, antes, **criar uma trilha do CloudTrail** e **ligar os VPC Flow Logs** de todas as VPCs, "para o GuardDuty ter dados". A empresa quer **começar a detectar o quanto antes**, com o menor esforço. Qual avaliação está correta?',
      concepts: [{ id: 'gd.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Correta: sem a trilha e os Flow Logs, o GuardDuty fica sem dados.', correct: false, consequence: 'O GuardDuty não depende das suas trilhas nem dos seus Flow Logs para as fontes básicas.' },
        { id: 'b', text: 'Correta, mas basta a trilha do CloudTrail, sem os Flow Logs.', correct: false, consequence: 'Nenhum dos dois é pré-requisito para as fontes básicas.' },
        { id: 'c', text: 'Desnecessária: ele já lê essas fontes ao ser ligado.', correct: true, consequence: 'A detecção começa sem nenhuma configuração prévia de logs.' },
        { id: 'd', text: 'Desnecessária, porque o GuardDuty só analisa os logs de DNS.', correct: false, consequence: 'Ele analisa CloudTrail, Flow Logs e DNS, sem depender da sua configuração.' },
      ],
      explanation: [
        'Ao ser ligado, o **GuardDuty** já analisa as **fontes básicas** da conta: eventos de gerenciamento do **CloudTrail**, **VPC Flow Logs** das instâncias e **logs de DNS**, por conta própria. **Não é preciso ligar nada disso antes**: a detecção começa logo.',
        'Trilhas e Flow Logs continuam úteis para auditoria e investigação, mas não são pré-requisitos do GuardDuty.',
        '**Regra prática:** "detectar atividade maliciosa sem configurar fontes" é GuardDuty, ligado e pronto.',
      ],
    },
    {
      id: 'rv:sec.f05.achados-por-um-ano',
      kind: 'decision',
      title: 'Achados guardados por um ano',
      prompt:
        'A auditoria exige que **os achados do GuardDuty** fiquem disponíveis por **pelo menos um ano** para consulta. A equipe percebeu que achados antigos somem do console depois de alguns meses. Qual solução atende?',
      concepts: [{ id: 'gd.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Aumentar a retenção dos achados nas configurações do GuardDuty.', correct: false, consequence: 'O GuardDuty guarda os achados por 90 dias; a retenção dele não chega a um ano.' },
        { id: 'b', text: 'Exportar os achados para um bucket do S3.', correct: true, consequence: 'O bucket guarda os achados pelo tempo que a empresa definir.' },
        { id: 'c', text: 'Arquivar os achados antigos com regras de supressão.', correct: false, consequence: 'Arquivar não estende a retenção e ainda tira os achados do EventBridge.' },
        { id: 'd', text: 'Tirar prints do console toda semana.', correct: false, consequence: 'Manual, incompleto e sem como consultar.' },
      ],
      explanation: [
        'O **GuardDuty guarda os achados por 90 dias**. Para guardar por mais tempo, a recomendação é **exportar os achados para o S3**, onde a retenção é definida pela empresa, com ciclo de vida se for o caso.',
        'Não há retenção de um ano no próprio GuardDuty: depois de 90 dias, o achado sai do serviço. Regras de supressão arquivam achados e ainda os tiram do EventBridge, sem guardar nada por mais tempo. E prints do console não são registros consultáveis para uma auditoria.',
        '**Regra prática:** retenção longa de achados do GuardDuty é exportação para o S3.',
      ],
    },
    {
      id: 'rv:sec.f05.m1.a2:s3',
      kind: 'decision',
      title: 'Dois riscos e os planos do GuardDuty',
      prompt:
        'Uma empresa já tem o GuardDuty ligado com as fontes básicas e quer cobrir dois riscos: **alguém baixando em massa os comprovantes** de um bucket do S3 e **tentativas suspeitas de login** no Aurora. Quais opções de proteção atendem? (Escolha DUAS.)',
      concepts: [{ id: 'gd.protection-plans' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'S3 Protection, para os downloads em massa.', correct: true, consequence: 'Analisa os eventos de dados do S3, como as leituras de objetos.' },
        { id: 'b', text: 'RDS Protection, para os logins no Aurora.', correct: true, consequence: 'Analisa as tentativas de login no RDS e no Aurora.' },
        { id: 'c', text: 'EKS Protection, para os downloads em massa.', correct: false, consequence: 'O EKS Protection analisa os logs de auditoria do Kubernetes.' },
        { id: 'd', text: 'Malware Protection for S3, para os logins no Aurora.', correct: false, consequence: 'Varre objetos enviados ao bucket; não olha logins de banco.' },
        { id: 'e', text: 'Runtime Monitoring, para os downloads em massa.', correct: false, consequence: 'Olha eventos do sistema operacional no EC2, EKS e ECS, não os eventos de dados do S3.' },
      ],
      explanation: [
        'Além das fontes básicas, o GuardDuty tem **planos de proteção** opcionais. O **S3 Protection** analisa os **eventos de dados do S3**, como leituras em massa. O **RDS Protection** analisa os **logins no RDS e no Aurora**.',
        'EKS Protection, Malware Protection for S3 e Runtime Monitoring cobrem outros recursos e outros sinais.',
        '**Regra prática:** escolha o plano pelo recurso e pelo sinal: dados do S3, logins de banco, Kubernetes, malware ou sistema operacional.',
      ],
    },
    {
      id: 'rv:sec.f05.m1.a3',
      kind: 'decision',
      title: 'UnauthorizedAccess numa instância',
      prompt:
        'O GuardDuty gerou o achado **UnauthorizedAccess:EC2/SSHBruteForce** para uma instância de administração. A equipe precisa entender o achado antes de agir. O que ele indica e qual primeira medida faz sentido?',
      concepts: [{ id: 'gd.findings' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Força bruta no SSH; fechar a porta 22 para a internet.', correct: true, consequence: 'Sem a porta aberta ao mundo, a instância deixa de ser alvo da força bruta.' },
        { id: 'b', text: 'Um pacote do SSH com CVE conhecida; atualizar o pacote.', correct: false, consequence: 'Pacote vulnerável é achado do Inspector, não do GuardDuty.' },
        { id: 'c', text: 'Um bucket público acessado por SSH; bloquear o acesso público.', correct: false, consequence: 'O recurso do achado é uma instância EC2, não um bucket.' },
        { id: 'd', text: 'Mineração de criptomoeda na instância; apagar a instância.', correct: false, consequence: 'Mineração tem o propósito CryptoCurrency, não UnauthorizedAccess.' },
      ],
      explanation: [
        'O tipo do achado segue o formato **Propósito:Recurso/Família**. Aqui: propósito **UnauthorizedAccess** (acesso não autorizado), recurso **EC2**, família **SSHBruteForce** (força bruta no SSH). Fechar a porta 22 para a internet tira o alvo.',
        'CVE é assunto do Inspector. O recurso não é um bucket. E mineração tem outro propósito.',
        '**Regra prática:** leia o achado pelo formato Propósito:Recurso/Família para saber o que aconteceu e onde.',
      ],
    },
    {
      id: 'rv:sec.f05.ocorrencias-a-cada-6h',
      kind: 'decision',
      title: 'Alertas repetidos que chegam tarde',
      prompt:
        'Uma regra do EventBridge aciona uma automação a cada achado do GuardDuty. O primeiro aviso de um ataque chega na hora, mas as **ocorrências seguintes do mesmo achado** só chegam horas depois, e a equipe quer acompanhá-las **em até 15 minutos**, em todas as contas da organização. Qual mudança atende?',
      concepts: [{ id: 'gd.findings' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mudar a frequência de envio para 15 minutos.', correct: true, consequence: 'As ocorrências seguintes passam a ir ao EventBridge a cada 15 minutos, nas contas-membro também.' },
        { id: 'b', text: 'Criar uma segunda regra do EventBridge para as ocorrências seguintes.', correct: false, consequence: 'O atraso está no envio do GuardDuty, não nas regras do EventBridge.' },
        { id: 'c', text: 'Mudar a frequência em cada conta-membro, uma por uma.', correct: false, consequence: 'A frequência é definida pela conta administradora e vale para as contas-membro.' },
        { id: 'd', text: 'Arquivar os achados repetidos com regras de supressão.', correct: false, consequence: 'Achados arquivados por supressão nem vão para o EventBridge.' },
      ],
      explanation: [
        'O GuardDuty publica cada achado no **EventBridge**: o **achado novo sai quase em tempo real**, e as **ocorrências seguintes** do mesmo achado são agrupadas a **cada 6 horas por padrão**, o que pode mudar para **15 minutos** ou 1 hora. Numa organização, essa frequência é definida pela **conta administradora** e vale para as contas-membro.',
        'Outra regra não acelera o envio. A mudança conta a conta não é como funciona. E a supressão tira os achados do EventBridge.',
        '**Regra prática:** resposta automática a achados do GuardDuty é regra do EventBridge; para acompanhar repetições mais rápido, reduza a frequência de envio.',
      ],
    },
    {
      id: 'rv:sec.f05.m2.a1',
      kind: 'decision',
      title: 'Onde está o OpenSSH vulnerável',
      prompt:
        'Saiu uma CVE grave do **OpenSSH**. A empresa precisa saber, **sem instalar ferramentas novas** nem **agendar varreduras**, quais instâncias EC2, imagens no ECR e funções Lambda têm a versão afetada, e quer ser avisada quando a correção for aplicada. Qual serviço atende?',
      concepts: [{ id: 'insp.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Amazon GuardDuty.', correct: false, consequence: 'Detecta comportamento suspeito, não pacotes vulneráveis.' },
        { id: 'b', text: 'Amazon Detective.', correct: false, consequence: 'Investiga a causa de achados; não varre pacotes nem imagens.' },
        { id: 'c', text: 'Amazon Macie no S3.', correct: false, consequence: 'Procura dados sensíveis no S3, não vulnerabilidades.' },
        { id: 'd', text: 'O Inspector.', correct: true, consequence: 'Varre de novo ao sair a CVE, lista os recursos afetados e fecha o achado quando a correção aparece.' },
      ],
      explanation: [
        'O **Inspector** descobre sozinho as **instâncias EC2, as imagens no ECR e as funções Lambda** e as varre **continuamente**. Ele varre de novo quando sai uma **CVE nova** ou quando um pacote é instalado, e **fecha o achado** quando a correção aparece.',
        'GuardDuty e Detective tratam de ameaças e investigação. O Macie procura dados sensíveis.',
        '**Regra prática:** "vulnerabilidades de software em instâncias, imagens ou funções, com varredura contínua" é Inspector.',
      ],
    },
    {
      id: 'rv:sec.f05.nota-de-risco',
      kind: 'decision',
      title: 'A mesma CVE com notas diferentes',
      prompt:
        'Duas instâncias EC2 têm o **mesmo pacote com a mesma CVE**. No Inspector, uma tem nota de risco **alta**; a outra, numa sub-rede sem nenhum caminho de rede aberto para a internet, tem nota **mais baixa**. A equipe quer entender a diferença antes de priorizar. Qual explicação está correta?',
      concepts: [{ id: 'insp.what' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'É um erro: a mesma CVE sempre tem a mesma nota.', correct: false, consequence: 'A nota do Inspector considera o ambiente, não só a CVE.' },
        { id: 'b', text: 'A nota do Inspector considera a exposição à internet.', correct: true, consequence: 'Sem caminho de rede aberto, a exploração é mais difícil, e a nota cai.' },
        { id: 'c', text: 'A segunda instância ainda não foi varrida por completo.', correct: false, consequence: 'As duas têm o achado; a diferença está na nota, ajustada ao contexto.' },
        { id: 'd', text: 'A nota depende do tipo de instância, maior ou menor.', correct: false, consequence: 'O tamanho da instância não muda o risco da vulnerabilidade.' },
      ],
      explanation: [
        'A **nota de risco do Inspector** parte da nota CVSS da vulnerabilidade e a **ajusta ao ambiente**: ela cai, por exemplo, se a instância **não tem caminho de rede aberto para a internet**. Isso ajuda a priorizar o que corrigir primeiro.',
        'A mesma CVE pode ter notas diferentes conforme a exposição. O tipo da instância não entra nessa conta.',
        '**Regra prática:** use a nota do Inspector, e não só o CVSS, para priorizar correções.',
      ],
    },
    {
      id: 'rv:sec.f05.m2.a2:hardcoded',
      kind: 'decision',
      title: 'Uma senha no código de uma função',
      prompt:
        'O Inspector gerou três achados numa conta: uma **biblioteca com CVE** numa imagem do ECR, uma **senha escrita no código** de uma função Lambda e a **porta 3389** de uma instância alcançável a partir do internet gateway. A equipe quer tratar primeiro o achado da senha. Qual é o **tipo** desse achado?',
      concepts: [{ id: 'insp.finding-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Package vulnerability.', correct: false, consequence: 'É o tipo do achado da biblioteca com CVE na imagem.' },
        { id: 'b', text: 'Network reachability.', correct: false, consequence: 'É o tipo do achado da porta 3389 alcançável.' },
        { id: 'c', text: 'Code vulnerability.', correct: true, consequence: 'Aponta trechos de código explorável em funções Lambda, como credenciais escritas no código.' },
        { id: 'd', text: 'Backdoor:EC2/C&CActivity.', correct: false, consequence: 'É um tipo de achado do GuardDuty, não do Inspector.' },
      ],
      explanation: [
        'O Inspector gera três tipos de achado. **Package vulnerability**: pacote com CVE conhecida, em EC2, imagens do ECR e Lambda. **Code vulnerability**: trechos de código explorável em funções Lambda, como **credencial escrita no código**. **Network reachability**: portas alcançáveis a partir da borda da VPC, só em EC2.',
        'Os outros dois achados da lista são dos outros tipos, e Backdoor é um propósito do GuardDuty.',
        '**Regra prática:** pacote vulnerável, código explorável ou porta alcançável: os três tipos de achado do Inspector.',
      ],
    },
    {
      id: 'rv:sec.f05.m2.a3:now',
      kind: 'decision',
      title: 'Três perguntas de segurança',
      prompt:
        'A equipe de segurança listou perguntas e o serviço que pretende usar para responder a cada uma. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sec.detect-assess-investigate' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Há uma instância falando com um servidor de comando e controle agora? GuardDuty.', correct: true, consequence: 'É uma ameaça em andamento, que o GuardDuty detecta.' },
        { id: 'b', text: 'Quais imagens de contêiner têm a CVE publicada ontem? Inspector.', correct: true, consequence: 'É avaliação de vulnerabilidades, papel do Inspector.' },
        { id: 'c', text: 'Que outras APIs a role suspeita chamou nas últimas semanas? Inspector.', correct: false, consequence: 'Investigar o alcance de um achado é papel do Detective.' },
        { id: 'd', text: 'Quais imagens de contêiner têm a CVE publicada ontem? Detective.', correct: false, consequence: 'O Detective investiga achados; não procura vulnerabilidades.' },
        { id: 'e', text: 'Há uma instância falando com um servidor de comando e controle agora? Detective.', correct: false, consequence: 'O Detective não gera alertas; ele parte dos achados do GuardDuty.' },
      ],
      explanation: [
        'Cada serviço responde uma pergunta. **Está acontecendo algo suspeito agora?** GuardDuty. **O que tenho de vulnerável?** Inspector. **De onde veio e até onde foi?** Detective. Juntos, cobrem antes, durante e depois de um incidente.',
        'O Inspector não investiga comportamento, e o Detective nem gera alertas nem procura CVEs.',
        '**Regra prática:** ameaça em andamento, GuardDuty; vulnerabilidade a corrigir, Inspector; investigação depois do alerta, Detective.',
      ],
    },
    {
      id: 'rv:sec.f05.chave-de-ip-malicioso',
      kind: 'decision',
      title: 'O alerta que o Inspector não deu',
      prompt:
        'Uma chave de acesso de um usuário IAM foi **usada a partir de um IP conhecido por atividade maliciosa**, e ninguém foi avisado. A conta tem só o **Inspector** ligado, que não gerou achado. A empresa quer ser avisada de casos assim daqui em diante. Qual serviço atende?',
      concepts: [{ id: 'sec.detect-assess-investigate' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Amazon GuardDuty.', correct: true, consequence: 'Detecta credenciais usadas de IPs maliciosos a partir dos eventos do CloudTrail.' },
        { id: 'b', text: 'Uma varredura mais frequente do Inspector.', correct: false, consequence: 'O Inspector procura vulnerabilidades; ele não olha o uso de credenciais.' },
        { id: 'c', text: 'Amazon Detective sozinho.', correct: false, consequence: 'O Detective investiga achados; não gera alertas.' },
        { id: 'd', text: 'Amazon Macie no bucket de logs.', correct: false, consequence: 'O Macie procura dados sensíveis, não uso suspeito de credenciais.' },
      ],
      explanation: [
        'Uso de credencial a partir de um **IP malicioso** é uma **ameaça em andamento**, detectada pelo **GuardDuty**, que usa listas de IPs e domínios maliciosos e modelos de aprendizado de máquina sobre os eventos do CloudTrail. O **Inspector** avalia vulnerabilidades de software e não olha o uso de credenciais.',
        'O Detective só investiga a partir de achados. O Macie é para dados sensíveis.',
        '**Regra prática:** não espere do Inspector alertas sobre comportamento; quem detecta ameaças é o GuardDuty.',
      ],
    },
    {
      id: 'rv:sec.f05.m3.a1',
      kind: 'decision',
      title: 'Um Detective sem nenhum alerta',
      prompt:
        'Uma empresa ligou **só o Amazon Detective**, esperando ser **avisada de ameaças**, e passou um mês sem nenhum alerta, apesar de um incidente. Ela quer **detectar ameaças** e, a partir de cada alerta, **investigar a causa e o alcance**. Qual combinação atende?',
      concepts: [{ id: 'det.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter só o Detective e esperar o histórico crescer.', correct: false, consequence: 'O Detective não gera achados de ameaça, com ou sem histórico.' },
        { id: 'b', text: 'GuardDuty para detectar, Detective para investigar.', correct: true, consequence: 'O GuardDuty gera os alertas, e o Detective parte deles para mostrar causa e alcance.' },
        { id: 'c', text: 'O Inspector para detectar, e o Detective para investigar.', correct: false, consequence: 'O Inspector aponta vulnerabilidades, não ameaças em andamento.' },
        { id: 'd', text: 'Trocar o Detective pelo CloudTrail, lendo os eventos à mão.', correct: false, consequence: 'Sem detecção automática nem investigação guiada.' },
      ],
      explanation: [
        'O **Detective** ajuda a **investigar a causa** de um achado: extrai eventos do CloudTrail e dos VPC Flow Logs, recebe os achados do GuardDuty e monta um grafo com até um ano de histórico. Mas ele **não gera os achados de ameaça**: parte deles. A detecção vem do **GuardDuty**.',
        'Esperar não faz o Detective alertar. O Inspector avalia vulnerabilidades. E ler o CloudTrail à mão não escala.',
        '**Regra prática:** GuardDuty detecta, Detective investiga; um não substitui o outro.',
      ],
    },
    {
      id: 'rv:sec.f05.m3.a2',
      kind: 'decision',
      title: 'Doze contas e ninguém olhando',
      prompt:
        'Cada uma das **12 contas** de uma organização tem o próprio GuardDuty e o próprio Inspector, e ninguém olha todas. **Contas novas entram todo mês**. A segurança quer os serviços ligados em **todas as contas, inclusive nas novas**, com os achados **num lugar só**. Qual solução atende?',
      concepts: [{ id: 'sec.delegated-admin' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Pedir a cada time que confira o próprio console toda semana.', correct: false, consequence: 'Nada garante que alguém olhe, e as contas novas dependem de alguém ligar os serviços.' },
        { id: 'b', text: 'Ligar os serviços à mão em cada conta nova, conforme forem criadas.', correct: false, consequence: 'Mantém o trabalho manual e os achados espalhados.' },
        { id: 'c', text: 'Uma administradora delegada, com ativação automática.', correct: true, consequence: 'Os serviços ficam ligados em todas as contas, inclusive nas novas, e os achados se reúnem.' },
        { id: 'd', text: 'Exportar os achados de cada conta para um bucket diferente.', correct: false, consequence: 'Guarda os achados, mas não liga os serviços nas contas novas nem dá uma visão central.' },
      ],
      explanation: [
        'Os serviços de segurança se integram ao **AWS Organizations**: uma conta vira **administradora delegada**, **liga o serviço nas contas-membro**, inclusive nas que entrarem depois, e **vê os achados de todas** num lugar só. O Inspector, por exemplo, pode ser ativado para a organização inteira de uma vez.',
        'Conferências por time, ativação manual e buckets separados não dão cobertura automática nem visão central.',
        '**Regra prática:** "ligar o serviço de segurança em todas as contas, inclusive nas novas, com visão central" é administrador delegado pelo Organizations.',
      ],
    },
  ],
}
