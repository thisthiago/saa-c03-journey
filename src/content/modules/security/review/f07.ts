/**
 * Questões da Revisão da Fase 7 de Segurança (postura e conformidade), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'sec.f07',
  questions: [
    {
      id: 'rv:sec.f07.m1.a2',
      kind: 'decision',
      title: 'Controles ligados e sem resultado',
      prompt:
        'Uma empresa ligou o **Security Hub CSPM** com o padrão FSBP, mas **quase nenhum controle mostra resultado** depois de dias. O GuardDuty e o Inspector já estão ligados e mandam achados normalmente. O que falta para os controles serem avaliados?',
      concepts: [{ id: 'shub.cspm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar o Amazon Detective nas contas.', correct: false, consequence: 'O Detective investiga achados; não avalia controles de configuração.' },
        { id: 'b', text: 'Esperar o fim do teste gratuito de 30 dias.', correct: false, consequence: 'O teste gratuito não muda o que é avaliado.' },
        { id: 'c', text: 'Ligar o AWS Config, gravando os recursos.', correct: true, consequence: 'As regras do Config passam a checar os recursos, e os controles ganham resultado.' },
        { id: 'd', text: 'Ligar um segundo padrão, como o CIS.', correct: false, consequence: 'O segundo padrão também depende do Config para avaliar os controles.' },
      ],
      explanation: [
        'O **Security Hub CSPM** confere as contas contra padrões e gera um achado para cada controle que falha. **Para a maioria dos controles, o AWS Config precisa estar ligado e gravando**, porque é uma regra do Config que checa cada recurso. Sem ele, os controles ficam sem resultado, mesmo com o GuardDuty e o Inspector mandando achados.',
        'O Detective, o fim do teste e outro padrão não resolvem a falta do Config.',
        '**Regra prática:** Security Hub CSPM de postura pede o AWS Config gravando nas contas e Regiões avaliadas.',
      ],
    },
    {
      id: 'rv:sec.f07.m1.a3',
      kind: 'decision',
      title: 'O painel que não mostra o mês passado',
      prompt:
        'O Security Hub CSPM foi ligado **hoje em sa-east-1**. A consultoria esperava ver no mesmo painel os **achados do GuardDuty do mês passado** e também os de **us-east-1**, onde o serviço não foi ligado. O que esperar, e o que fazer para cobrir as duas Regiões?',
      concepts: [{ id: 'shub.cspm' }, { id: 'shub.aggregation' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Tudo aparece, de todas as Regiões e desde sempre, depois de algumas horas.', correct: false, consequence: 'O serviço não busca achados anteriores nem de Regiões onde não foi ligado.' },
        { id: 'b', text: 'Só os novos de sa-east-1; ligar em us-east-1 e agregar.', correct: true, consequence: 'Daqui em diante, o painel reúne as duas Regiões.' },
        { id: 'c', text: 'Os achados antigos aparecem se o GuardDuty for desligado e ligado de novo.', correct: false, consequence: 'Religar o GuardDuty não reenvia achados antigos ao Security Hub CSPM.' },
        { id: 'd', text: 'Só os achados de us-east-1, porque é a Região principal da AWS.', correct: false, consequence: 'Não há Região principal; o serviço vale onde foi ligado.' },
      ],
      explanation: [
        'O Security Hub CSPM **só reúne achados gerados depois de ser ligado**, e **só na Região em que foi ligado**. Para ver outras Regiões num painel, é preciso **ligá-lo nelas** e definir uma **Região de agregação**; numa organização, uma conta administradora reúne também as contas-membro.',
        'Achados antigos e de Regiões não ligadas não aparecem. Religar o GuardDuty não muda isso.',
        '**Regra prática:** ligue o Security Hub CSPM em todas as Regiões usadas e agregue numa só; o painel vale daqui para a frente.',
      ],
    },
    {
      id: 'rv:sec.f07.m1.a1',
      kind: 'decision',
      title: 'Boas práticas sem norma externa',
      prompt:
        'Uma startup **não precisa cumprir nenhuma norma externa**, mas quer conferir continuamente as contas contra **as boas práticas de segurança definidas pela própria AWS**, com cada falha virando um achado com a correção recomendada. O Config já está gravando. Qual padrão ligar no Security Hub CSPM?',
      concepts: [{ id: 'shub.standards' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O FSBP, da AWS.', correct: true, consequence: 'É o padrão criado pela AWS com as boas práticas dela.' },
        { id: 'b', text: 'O PCI DSS, de cartões.', correct: false, consequence: 'É o padrão de quem processa cartões; a startup não tem essa exigência.' },
        { id: 'c', text: 'O NIST, por ser o mais completo.', correct: false, consequence: 'É um padrão externo; o pedido é o das boas práticas da AWS.' },
        { id: 'd', text: 'Nenhum: os controles rodam sem padrão ligado.', correct: false, consequence: 'Ao ligar um padrão é que os controles dele passam a rodar.' },
      ],
      explanation: [
        'Um **padrão** é um conjunto de controles, cada um uma boa prática checada sozinha. O Security Hub CSPM oferece o **AWS Foundational Security Best Practices (FSBP)**, criado pela AWS, e padrões externos como **CIS**, **PCI DSS** e **NIST**. Ao ligar um padrão, **todos os controles dele passam a rodar**.',
        'PCI DSS e NIST servem a exigências externas. E sem padrão ligado, os controles não rodam.',
        '**Regra prática:** boas práticas da AWS, FSBP; norma externa, o padrão correspondente (CIS, PCI DSS, NIST).',
      ],
    },
    {
      id: 'rv:sec.f07.controle-que-nao-se-aplica',
      kind: 'decision',
      title: 'Um bucket público de propósito',
      prompt:
        'Um bucket **público de propósito**, que hospeda um site estático aprovado pela segurança, faz falhar sempre o controle do FSBP que exige bloquear o acesso público. A empresa quer que esse achado **pare de baixar a nota**, mantendo **todos os outros controles** do padrão ativos. Qual ação atende?',
      concepts: [{ id: 'shub.standards' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Desligar o padrão FSBP inteiro.', correct: false, consequence: 'Para de avaliar todos os outros controles, o oposto do pedido.' },
        { id: 'b', text: 'Desligar o AWS Config na conta do site.', correct: false, consequence: 'Para a avaliação da maioria dos controles na conta inteira.' },
        { id: 'c', text: 'Bloquear o acesso público do bucket, mesmo quebrando o site.', correct: false, consequence: 'Derruba um site aprovado para agradar um controle.' },
        { id: 'd', text: 'Tratar esse achado como exceção para o bucket aprovado.', correct: true, consequence: 'Esse achado sai da conta da nota, e os controles continuam avaliando os outros recursos.' },
      ],
      explanation: [
        'Cada controle traz a regra do AWS Config usada, a gravidade e a correção recomendada, e os **controles podem ser desligados um a um**; achados de recursos aprovados também podem ser tratados como exceção. Assim, um caso aprovado não pesa na nota, e o resto do padrão continua avaliando.',
        'Desligar o padrão ou o Config tira a avaliação de tudo. Bloquear o acesso quebra o site.',
        '**Regra prática:** exceção aprovada se trata no controle ou no achado específico, nunca desligando o padrão inteiro.',
      ],
    },
    {
      id: 'rv:sec.f07.m2.a1',
      kind: 'decision',
      title: 'Vulnerável e exposta ao mesmo tempo',
      prompt:
        'A segurança quer que o painel aponte **primeiro as combinações perigosas**, como uma instância com **CVE crítica** que também está **exposta à internet** e tem uma role com permissões amplas. O Security Hub CSPM já está ligado. O que **acrescentar**?',
      concepts: [{ id: 'shub.security-hub' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O Security Hub, com Inspector e GuardDuty.', correct: true, consequence: 'O Security Hub correlaciona os achados e aponta as exposições mais críticas primeiro.' },
        { id: 'b', text: 'Só o Security Hub, desligando o Security Hub CSPM.', correct: false, consequence: 'Sem o CSPM, o Security Hub não usa os achados de postura para apontar riscos.' },
        { id: 'c', text: 'Mais padrões no Security Hub CSPM, como o NIST.', correct: false, consequence: 'Mais controles de postura, sem correlacionar com vulnerabilidades e ameaças.' },
        { id: 'd', text: 'O Amazon Detective, para ordenar os achados por gravidade.', correct: false, consequence: 'O Detective investiga achados; não prioriza exposições combinadas.' },
      ],
      explanation: [
        'Hoje são dois serviços que se completam. O **Security Hub CSPM** faz as checagens de postura. O **Security Hub** recebe esses achados e os **correlaciona** com os do **Inspector**, do **GuardDuty** e do Macie para apontar as **exposições mais críticas**, com fluxos de resposta. A AWS recomenda ligar os dois.',
        'Sem o CSPM, faltam os achados de postura. Mais padrões não correlacionam nada. E o Detective investiga.',
        '**Regra prática:** postura é Security Hub CSPM; priorizar exposições combinando postura, vulnerabilidades e ameaças é o Security Hub.',
      ],
    },
    {
      id: 'rv:sec.f07.cis-em-todas-as-regioes',
      kind: 'decision',
      title: 'Controles do CIS que não fecham',
      prompt:
        'Uma empresa usa recursos em **três Regiões**, mas ligou o Security Hub CSPM com o padrão CIS **só na Região principal**. Alguns controles do CIS continuam falhando, e a auditoria quer o **padrão cumprido por inteiro**. Qual mudança atende?',
      concepts: [{ id: 'shub.aggregation' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Desligar os controles do CIS que falham.', correct: false, consequence: 'Esconde a falha em vez de cumprir o padrão.' },
        { id: 'b', text: 'Ligar o serviço nas três Regiões, agregando.', correct: true, consequence: 'Os controles que exigem cobertura em todas as Regiões passam a ser atendidos.' },
        { id: 'c', text: 'Trocar o CIS pelo FSBP, que dispensa as outras Regiões.', correct: false, consequence: 'Troca de padrão não cumpre o CIS que a auditoria pede.' },
        { id: 'd', text: 'Mover todos os recursos para a Região principal.', correct: false, consequence: 'Uma mudança de arquitetura enorme para um ajuste de configuração.' },
      ],
      explanation: [
        'Para cumprir todos os controles do **CIS**, o Security Hub CSPM precisa estar **ligado em todas as Regiões usadas**. Com uma **Região de agregação** e uma conta administradora, a empresa vê tudo num painel só e configura os padrões de forma central.',
        'Desligar controles ou trocar de padrão não cumpre o CIS. E mover os recursos é desproporcional.',
        '**Regra prática:** postura de segurança vale por Região; ligue o serviço em cada Região usada e agregue a visão.',
      ],
    },
    {
      id: 'rv:sec.f07.m3.a2',
      kind: 'decision',
      title: 'Só os relatórios da AWS para o auditor',
      prompt:
        'Para uma auditoria, um gerente sugere entregar **só os relatórios de conformidade baixados do AWS Artifact**, "porque a AWS já é certificada". O auditor também quer provas de que os **buckets da empresa estão cifrados** e de **quem mudou as permissões** no último ano. Qual avaliação está correta?',
      concepts: [{ id: 'sec.compliance-evidence' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Basta o Artifact: a certificação da AWS cobre os recursos dos clientes.', correct: false, consequence: 'A configuração dos recursos é responsabilidade da empresa e precisa das provas dela.' },
        { id: 'b', text: 'Não basta: o Artifact só prova a parte da AWS.', correct: true, consequence: 'O auditor recebe a parte da AWS e a da empresa.' },
        { id: 'c', text: 'Não basta: a empresa precisa pedir à AWS um relatório sobre os buckets dela.', correct: false, consequence: 'A AWS não audita a configuração do cliente; a empresa prova a própria parte.' },
        { id: 'd', text: 'Basta o Artifact, se a empresa também entregar a fatura da AWS.', correct: false, consequence: 'A fatura não prova criptografia nem mudanças de permissão.' },
      ],
      explanation: [
        'Na auditoria, a conformidade se divide como a **responsabilidade compartilhada**. A **parte da AWS** (data centers, hardware, serviços) se prova com os relatórios do **Artifact**. A **parte da empresa** se prova com o que ela configurou: controles do **Security Hub CSPM**, histórico e regras do **AWS Config**, trilhas do **CloudTrail**.',
        'A certificação da AWS não cobre a configuração do cliente, e a AWS não emite relatórios sobre ela. A fatura não é prova de segurança.',
        '**Regra prática:** Artifact para a parte da AWS; Config, CloudTrail e Security Hub CSPM para a parte da empresa.',
      ],
    },
    {
      id: 'rv:sec.f07.m3.a1:who',
      kind: 'decision',
      title: 'De onde vem cada prova',
      prompt:
        'Um auditor pediu várias provas para uma certificação. A equipe anotou a fonte que pretende usar em cada uma. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sec.compliance-evidence' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'O relatório SOC dos data centers da AWS: AWS Artifact.', correct: true, consequence: 'É um documento da AWS sobre a parte dela.' },
        { id: 'b', text: 'Quem mudou a política do bucket de recibos no mês passado: CloudTrail.', correct: true, consequence: 'A chamada de API que mudou a política fica registrada no CloudTrail.' },
        { id: 'c', text: 'A situação do controle que exige TLS nos buckets: AWS Artifact.', correct: false, consequence: 'É a configuração da empresa, provada pelo Security Hub CSPM.' },
        { id: 'd', text: 'O relatório PCI DSS da AWS: CloudTrail.', correct: false, consequence: 'O relatório da AWS se baixa no Artifact.' },
        { id: 'e', text: 'A prova de que os buckets da empresa estão cifrados: AWS Artifact.', correct: false, consequence: 'O Artifact não traz a configuração da empresa; o Config e o Security Hub CSPM trazem.' },
      ],
      explanation: [
        'Cada pedido tem a sua fonte. **Documentos da AWS** sobre a parte dela (SOC, PCI, ISO) vêm do **Artifact**. **Quem fez o quê** nas contas vem do **CloudTrail**. A **situação dos controles** da empresa vem do **Security Hub CSPM**, com o histórico do **Config**.',
        'O Artifact não prova a configuração da empresa, e o CloudTrail não guarda relatórios da AWS.',
        '**Regra prática:** documento da AWS, Artifact; ação nas contas, CloudTrail; estado da configuração, Config e Security Hub CSPM.',
      ],
    },
    {
      id: 'rv:sec.f07.m3.a1:pci',
      kind: 'decision',
      title: 'Os documentos de conformidade da AWS',
      prompt:
        'O jurídico de uma empresa precisa **baixar o relatório ISO 27001 da AWS** e **revisar e aceitar um acordo** com a AWS exigido para tratar certos dados, sem custo e sem abrir chamado. Onde a equipe encontra os dois?',
      concepts: [{ id: 'artifact.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'No AWS Security Hub CSPM.', correct: false, consequence: 'Ele confere as contas da empresa; não guarda relatórios nem acordos da AWS.' },
        { id: 'b', text: 'No AWS Config.', correct: false, consequence: 'Ele registra a configuração dos recursos da empresa.' },
        { id: 'c', text: 'No AWS Artifact.', correct: true, consequence: 'Ali ficam, sem custo, os relatórios de conformidade da AWS e os acordos com ela.' },
        { id: 'd', text: 'No AWS CloudTrail.', correct: false, consequence: 'Registra chamadas de API, não documentos de conformidade.' },
      ],
      explanation: [
        'O **Artifact** é onde se baixam, **sem custo**, os **relatórios de conformidade da própria AWS** (SOC, PCI, ISO e certificações) e onde ficam os **acordos com a AWS**. Ele também traz documentos de fornecedores do AWS Marketplace.',
        'Security Hub CSPM, Config e CloudTrail tratam da configuração e das ações da empresa nas contas dela: são as provas da parte do cliente, não documentos da AWS. Nenhum deles guarda acordos jurídicos.',
        '**Regra prática:** "relatórios de conformidade da AWS" e "acordos com a AWS" são o AWS Artifact.',
      ],
    },
  ],
}
