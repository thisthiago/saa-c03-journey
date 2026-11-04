/**
 * Questões da Revisão da Fase 7 de Monitoramento e governança (Governança
 * multiconta), no formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'gov.f07',
  questions: [
    {
      id: 'rv:gov.f07.custo-por-produto',
      kind: 'decision',
      title: 'Quanto custa cada produto da empresa',
      prompt:
        'Uma software house roda **cinco produtos numa única conta AWS**. O financeiro quer saber **exatamente quanto cada produto custa**, mas as tags são aplicadas de forma irregular e recursos compartilhados confundem a conta. A empresa também quer **limitar o impacto** de um incidente num produto sobre os outros. Qual solução atende?',
      concepts: [{ id: 'gov.account-structure' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Exigir tags em todos os recursos da conta única.', correct: false, consequence: 'Ajuda a alocar custos, mas não isola os produtos nem cobre o que fica sem tag.' },
        { id: 'b', text: 'Criar uma VPC por produto na mesma conta.', correct: false, consequence: 'Separa a rede, mas a cobrança e as permissões continuam misturadas na conta.' },
        { id: 'c', text: 'Uma conta por produto, agrupadas em OUs.', correct: true, consequence: 'Cada conta tem a própria cobrança e limita o impacto de um incidente ao seu produto.' },
        { id: 'd', text: 'Um grupo do IAM por produto, com políticas separadas.', correct: false, consequence: 'Separa permissões das pessoas, mas não a cobrança nem os recursos.' },
      ],
      explanation: [
        'Uma organização **separa as contas por função**: cargas de trabalho em contas próprias, uma por produto ou ambiente, agrupadas em **OUs**. A conta é a fronteira natural de **cobrança** e de **isolamento**: um incidente numa conta não alcança os recursos das outras.',
        'Tags, VPCs e grupos do IAM ajudam, mas não separam a cobrança nem isolam os recursos como contas separadas.',
        '**Regra prática:** "isolar ambientes", "limitar o impacto de um incidente" e "separar a cobrança por time" apontam para várias contas em OUs.',
      ],
    },
    {
      id: 'rv:gov.f07.m1.a1',
      kind: 'decision',
      title: 'Registros de auditoria longe dos administradores',
      prompt:
        'Numa organização, os registros do CloudTrail e do Config de todas as contas são guardados na **mesma conta da loja virtual**, cujos administradores têm acesso total a ela. A auditoria exige que **quem administra as cargas de trabalho não consiga alterar nem apagar esses registros**. Qual estrutura atende?',
      concepts: [{ id: 'gov.account-structure' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Guardar os registros na conta de gerenciamento da organização.', correct: false, consequence: 'A AWS recomenda usar a conta de gerenciamento só para o que precisa ser feito nela.' },
        { id: 'b', text: 'Uma conta dedicada de registros, numa OU de segurança.', correct: true, consequence: 'Os administradores das cargas de trabalho não têm acesso à conta dos registros.' },
        { id: 'c', text: 'Um bucket separado na mesma conta da loja, com outro nome.', correct: false, consequence: 'Os administradores da conta continuam com acesso ao bucket.' },
        { id: 'd', text: 'Uma Região separada na mesma conta da loja.', correct: false, consequence: 'A Região não muda quem tem acesso à conta.' },
      ],
      explanation: [
        'Na estrutura recomendada, há **contas de segurança e registros** separadas das **contas de cargas de trabalho**. Guardar os registros numa conta própria, numa OU de segurança, tira o acesso de quem administra a loja.',
        'A conta de gerenciamento deve ficar reservada à administração. Outro bucket ou outra Região na mesma conta não mudam quem tem acesso.',
        '**Regra prática:** a conta é a fronteira de acesso; registros de auditoria ficam numa conta que os administradores das cargas não controlam.',
      ],
    },
    {
      id: 'rv:gov.f07.m2.a2:template',
      kind: 'decision',
      title: 'Barrar recursos fora do padrão antes de existirem',
      prompt:
        'Uma empresa usa o **AWS Control Tower** e implanta tudo com o **CloudFormation**. A segurança quer que um template que crie um **volume EBS sem criptografia** seja **barrado antes de o recurso existir**, sem alterar as permissões das contas. Qual tipo de controle atende?',
      concepts: [{ id: 'gov.controls' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um controle detectivo, com uma regra do AWS Config.', correct: false, consequence: 'Avisa depois que o volume já foi criado.' },
        { id: 'b', text: 'Um controle proativo, com hooks do CloudFormation.', correct: true, consequence: 'O recurso é conferido antes da criação, e o que não está em conformidade não é criado.' },
        { id: 'c', text: 'Um controle preventivo, com uma SCP que nega o EC2.', correct: false, consequence: 'Negar o EC2 nas contas mudaria as permissões e barraria muito mais que o volume.' },
        { id: 'd', text: 'Um painel do CloudWatch com os volumes criados.', correct: false, consequence: 'Mostra os volumes depois de criados e não barra nada.' },
      ],
      explanation: [
        'Os controles do Control Tower são **preventivos** (impedem a ação, com SCPs, RCPs e políticas declarativas), **detectivos** (avisam depois, com regras do Config) e **proativos** (conferem o recurso **antes de criá-lo**, com **hooks do CloudFormation**). Os proativos valem para recursos que o CloudFormation vai criar; os fora do padrão não são criados.',
        'O detectivo avisa depois. Uma SCP que nega o EC2 vai além do pedido. Um painel não controla nada.',
        '**Regra prática:** impedir a ação é preventivo; avisar depois é detectivo; conferir antes de criar é proativo.',
      ],
    },
    {
      id: 'rv:gov.f07.m2.a1:detective',
      kind: 'decision',
      title: 'Um controle ligado e buckets públicos mesmo assim',
      prompt:
        'A segurança habilitou no Control Tower um controle **detectivo** sobre buckets com leitura pública. Uma semana depois, um time criou um bucket público, e o controle o mostrou **em violação**. A diretoria acha que o controle **falhou** e quer que **buckets públicos nem possam ser criados**. Qual é a avaliação correta?',
      concepts: [{ id: 'gov.controls' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O controle falhou e precisa ser recriado na OU.', correct: false, consequence: 'Mostrar o bucket em violação é exatamente o que um controle detectivo faz.' },
        { id: 'b', text: 'Funcionou; para impedir, é preciso um controle preventivo.', correct: true, consequence: 'O detectivo avisa; um preventivo impede a ação que deixaria o bucket público.' },
        { id: 'c', text: 'O controle funcionou; basta mudar a orientação dele para obrigatório.', correct: false, consequence: 'A orientação classifica o controle; não o transforma em preventivo.' },
        { id: 'd', text: 'O controle só vale na conta de gerenciamento.', correct: false, consequence: 'Controles valem para as OUs; a conta de gerenciamento é justamente a exceção dos preventivos.' },
      ],
      explanation: [
        'Um **controle detectivo** avisa quando algo viola a regra, por meio de regras do AWS Config; ele **não impede** a criação. Para impedir, a resposta é um **controle preventivo**, que trava a ação.',
        'O controle não falhou. A orientação (obrigatório, fortemente recomendado ou eletivo) não muda o tipo. E os controles valem para as OUs.',
        '**Regra prática:** não espere que um controle detectivo impeça algo; ele só avisa depois.',
      ],
    },
    {
      id: 'rv:gov.f07.m2.a5',
      kind: 'decision',
      title: 'Uma role apagada e o painel cheio de problemas',
      prompt:
        'Um administrador apagou, no console do IAM de uma conta membro, uma **role criada pelo Control Tower**, achando que ela não era usada. Depois disso, o painel do Control Tower passou a mostrar problemas na landing zone. A empresa quer **voltar a um estado conhecido** sem recriar a organização. O que fazer?',
      concepts: [{ id: 'gov.landing-zone' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Recriar a role à mão no IAM, com o mesmo nome.', correct: false, consequence: 'Uma cópia manual também é uma mudança fora dos métodos aceitos e não garante o estado esperado.' },
        { id: 'b', text: 'Remover a conta da organização e criar outra.', correct: false, consequence: 'É drástico, e os recursos da conta teriam de ser refeitos.' },
        { id: 'c', text: 'Ignorar os avisos, porque a role não era usada.', correct: false, consequence: 'A landing zone fica num estado desconhecido, e as próximas operações podem falhar.' },
        { id: 'd', text: 'Resolver o desvio pelos métodos do Control Tower.', correct: true, consequence: 'O Control Tower recria o que gerencia e volta a landing zone a um estado conhecido.' },
      ],
      explanation: [
        'Apagar ou alterar recursos criados e gerenciados pelo Control Tower **fora dos métodos aceitos** leva a landing zone a um **estado desconhecido**. **Identificar e resolver o desvio** pelo próprio Control Tower é uma tarefa regular dos administradores.',
        'Consertos manuais, recriar a conta ou ignorar os avisos não devolvem um estado conhecido.',
        '**Regra prática:** o que o Control Tower criou, só o Control Tower altera; mudanças manuais viram desvio a resolver.',
      ],
    },
    {
      id: 'rv:gov.f07.contas-novas-padrao',
      kind: 'decision',
      title: 'Contas novas que nascem fora do padrão',
      prompt:
        'Numa empresa com o **Control Tower**, os times pedem contas novas toda semana. Hoje, alguém as cria direto no Organizations e configura cada uma à mão, e algumas ficam **sem os controles** da landing zone. A empresa quer que **toda conta nova já nasça padronizada**, com os controles da OU. Qual solução atende?',
      concepts: [{ id: 'gov.account-factory' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar as contas pelo Account Factory do Control Tower.', correct: true, consequence: 'Cada conta nasce com o modelo aprovado e recebe os controles da OU.' },
        { id: 'b', text: 'Um roteiro com os passos para configurar cada conta criada.', correct: false, consequence: 'Continua manual, e os esquecimentos voltam.' },
        { id: 'c', text: 'Criar as contas no Organizations e rodar um script semanal.', correct: false, consequence: 'As contas passam dias sem os controles, e o script é mais uma peça para manter.' },
        { id: 'd', text: 'Um agregador do Config para encontrar as contas fora do padrão.', correct: false, consequence: 'Mostra o problema, mas não cria contas padronizadas.' },
      ],
      explanation: [
        'O **Account Factory** é um modelo de conta configurável que **padroniza a criação** de contas com configurações aprovadas. Por baixo, o Service Catalog chama o Control Tower, que pede ao Organizations a criação da conta e aplica os baselines e os controles da OU.',
        'Roteiros e scripts deixam brechas. O agregador só mostra.',
        '**Regra prática:** "padronizar e automatizar a criação de contas novas, já com os controles" é o Account Factory.',
      ],
    },
    {
      id: 'rv:gov.f07.m2.a6',
      kind: 'decision',
      title: 'Uma conta antiga que precisa entrar no padrão',
      prompt:
        'Uma conta criada há anos direto no Organizations, antes do Control Tower, precisa **passar a receber os baselines e os controles** da landing zone, sem ser recriada. A equipe quer seguir o **caminho aceito pelo Control Tower**. O que é necessário?',
      concepts: [{ id: 'gov.account-factory' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Mover a conta para a OU raiz da organização.', correct: false, consequence: 'Mover de OU não matricula a conta no Control Tower.' },
        { id: 'b', text: 'Criar a role AWSControlTowerExecution e matricular a conta.', correct: true, consequence: 'Matriculada, a conta passa a receber os baselines e os controles da OU.' },
        { id: 'c', text: 'Aplicar à conta uma SCP com todas as regras dos controles.', correct: false, consequence: 'Copiar regras à mão não traz os baselines e vira desvio a manter.' },
        { id: 'd', text: 'Pedir uma conta nova no Account Factory e copiar os recursos.', correct: false, consequence: 'Funciona, mas recria a conta, o que a equipe quer evitar.' },
      ],
      explanation: [
        'Uma conta existente pode ser **matriculada** no Control Tower. Para isso, ela precisa ter a role **AWSControlTowerExecution** e ser matriculada numa **OU registrada**, com o baseline do Control Tower habilitado. Daí em diante, recebe os baselines e os controles da OU.',
        'Mudar de OU não matricula. SCPs copiadas não trazem os baselines. Recriar a conta foge do pedido.',
        '**Regra prática:** conta nova pelo Account Factory; conta existente pela matrícula, com a role AWSControlTowerExecution.',
      ],
    },
    {
      id: 'rv:gov.f07.m3.a3',
      kind: 'decision',
      title: 'O mesmo plano de backup em todas as contas',
      prompt:
        'A área de continuidade quer que **todos os recursos marcados com a tag `critico`**, em **todas as 40 contas** da organização, tenham o mesmo plano de backup: mesma frequência, mesma janela e mesmo cofre. A empresa não quer **configurar conta por conta**. Qual solução atende?',
      concepts: [{ id: 'gov.org-policies' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma SCP que exige backup nos recursos com a tag critico.', correct: false, consequence: 'A SCP limita permissões; ela não cria planos de backup.' },
        { id: 'b', text: 'Uma política de tags que padroniza a tag critico.', correct: false, consequence: 'Padroniza a escrita da tag, mas não faz backup de nada.' },
        { id: 'c', text: 'Uma política de backup do Organizations para a tag critico.', correct: true, consequence: 'O plano do AWS Backup é aplicado aos recursos com a tag em todas as contas.' },
        { id: 'd', text: 'Um plano do AWS Backup criado à mão em cada conta.', correct: false, consequence: 'Funciona, mas é a configuração conta por conta que a empresa quer evitar.' },
      ],
      explanation: [
        'Além das SCPs e RCPs, o Organizations tem **políticas de backup**, que aplicam um **plano do AWS Backup** (frequência, janela, Região e cofre) a grupos de recursos identificados por **tags**, em todas as contas onde a política vale.',
        'SCPs limitam permissões. Políticas de tags padronizam a escrita. Planos à mão não escalam.',
        '**Regra prática:** escolha o tipo de política pela necessidade: limitar permissões (SCP ou RCP), padronizar tags, garantir backups ou impor configurações (declarativa).',
      ],
    },
    {
      id: 'rv:gov.f07.m3.a5',
      kind: 'decision',
      title: 'Uma regra de rede que vale também para o que vier',
      prompt:
        'A segurança quer garantir que **nenhuma conta da organização libere acesso público à internet a recursos da VPC**, e que essa configuração **continue valendo quando a AWS lançar recursos ou APIs novos** no serviço, sem reescrever a regra. Qual tipo de política do Organizations atende?',
      concepts: [{ id: 'gov.org-policies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma SCP que nega cada ação da API que abre acesso à internet.', correct: false, consequence: 'Cada API nova exigiria atualizar a lista de ações negadas.' },
        { id: 'b', text: 'Uma RCP sobre os recursos da VPC.', correct: false, consequence: 'A RCP limita quem acessa recursos; não impõe a configuração do serviço.' },
        { id: 'c', text: 'Uma política de tags para as VPCs.', correct: false, consequence: 'Padroniza tags, não a configuração de rede.' },
        { id: 'd', text: 'Uma política declarativa para a VPC.', correct: true, consequence: 'A configuração desejada é mantida mesmo quando o serviço ganha recursos e APIs novos.' },
      ],
      explanation: [
        'As **políticas declarativas** impõem a **configuração desejada** de um serviço e a mantêm mesmo quando ele ganha **recursos ou APIs novos**. Um exemplo é bloquear o acesso público à internet a recursos da VPC.',
        'Uma SCP depende de listar ações e precisa acompanhar cada novidade. RCPs e políticas de tags fazem outro trabalho.',
        '**Regra prática:** "impor uma configuração de serviço que continue valendo com novidades" é política declarativa.',
      ],
    },
    {
      id: 'rv:gov.f07.m3.a2',
      kind: 'decision',
      title: 'A grafia da tag certa nas instâncias e errada nos buckets',
      prompt:
        'O financeiro criou uma **política de tags** para a tag `CostCenter`, com os valores permitidos, e ligou a **imposição para instâncias EC2**. As instâncias passaram a seguir o padrão, mas **buckets do S3** continuam recebendo `costcenter` e valores fora da lista, e o custo deles aparece como não alocado. O que mudar?',
      concepts: [{ id: 'gov.tag-policies' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar a política de tags por uma SCP que nega todo bucket novo.', correct: false, consequence: 'Impede criar buckets, o que é bem mais do que padronizar a tag.' },
        { id: 'b', text: 'Incluir os buckets do S3 nos tipos com imposição na política.', correct: true, consequence: 'A marcação fora do padrão passa a ser impedida também nos buckets.' },
        { id: 'c', text: 'Ligar a regra required-tags do Config para os buckets.', correct: false, consequence: 'Ela confere se a tag existe; não impede a grafia ou o valor errado.' },
        { id: 'd', text: 'Nada: as chaves de tag não diferenciam maiúsculas e minúsculas.', correct: false, consequence: 'Chaves e valores de tag diferenciam maiúsculas de minúsculas.' },
      ],
      explanation: [
        'A **política de tags** define como as tags devem ser escritas. A **imposição vale só para os tipos de recurso indicados**. Incluir os buckets do S3 faz a grafia e os valores errados serem impedidos também neles. Chaves e valores diferenciam maiúsculas de minúsculas.',
        'Uma SCP que nega buckets vai além. A required-tags exige a existência, não a grafia.',
        '**Regra prática:** política de tags padroniza a escrita; para exigir que a tag exista, combine com uma SCP ou com a regra required-tags.',
      ],
    },
    {
      id: 'rv:gov.f07.m1.a2',
      kind: 'decision',
      title: 'Uma equipe usando a conta mais sensível',
      prompt:
        'A equipe de segurança cria e edita **SCPs e políticas de tags** da organização usando credenciais da **conta de gerenciamento**, e a auditoria apontou o risco. A empresa quer que a equipe **continue gerenciando as políticas** sem entrar na conta de gerenciamento. Qual solução atende?',
      concepts: [{ id: 'gov.delegated-admin' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar na conta de gerenciamento um usuário IAM por pessoa da segurança.', correct: false, consequence: 'Mais acessos à conta de gerenciamento, o oposto do que a auditoria pede.' },
        { id: 'b', text: 'Delegar a gestão das políticas à conta de segurança.', correct: true, consequence: 'A equipe gerencia as políticas da própria conta, e a de gerenciamento fica quase sem uso.' },
        { id: 'c', text: 'Mover a equipe de segurança para dentro da OU raiz.', correct: false, consequence: 'Pessoas não ficam em OUs, e isso não dá permissão de gerenciar políticas.' },
        { id: 'd', text: 'Aplicar uma SCP na conta de gerenciamento para limitar a equipe.', correct: false, consequence: 'As SCPs não restringem usuários e roles da conta de gerenciamento.' },
      ],
      explanation: [
        'Pela **política de delegação** do Organizations, a conta de gerenciamento pode delegar a contas membro ações de políticas que, por padrão, só ela tem. A equipe trabalha na **conta de segurança**, como **administrador delegado**, e a conta de gerenciamento fica protegida.',
        'Mais usuários na conta de gerenciamento aumentam o risco. SCPs não a restringem. OUs agrupam contas, não pessoas.',
        '**Regra prática:** deixe a conta de gerenciamento quase sem uso e delegue cada serviço a uma conta membro.',
      ],
    },
    {
      id: 'rv:gov.f07.m3.a4',
      kind: 'decision',
      title: 'Uma multa na auditoria do fornecedor',
      prompt:
        'O contrato de um banco de dados comercial permite **64 núcleos** no total. Os times lançam instâncias com esse software em **várias contas e Regiões** da organização, e a empresa já foi multada numa auditoria do fornecedor. Ela quer **impedir o uso além do contrato antes que aconteça**. Qual solução atende?',
      concepts: [{ id: 'gov.license-manager' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma planilha atualizada pelos times a cada lançamento.', correct: false, consequence: 'Depende das pessoas e só mostra o excesso depois.' },
        { id: 'b', text: 'Um alarme do CloudWatch sobre o número de instâncias.', correct: false, consequence: 'Avisa depois do lançamento e não conta núcleos licenciados.' },
        { id: 'c', text: 'AWS License Manager com um limite rígido de 64 núcleos.', correct: true, consequence: 'Lançamentos que passariam do limite são impedidos, em todas as contas.' },
        { id: 'd', text: 'Uma política de tags para marcar as instâncias com o software.', correct: false, consequence: 'Padroniza tags, mas não conta nem limita núcleos.' },
      ],
      explanation: [
        'O **License Manager** controla o uso de licenças por vCPUs, núcleos físicos, soquetes ou máquinas, em várias Regiões e contas. Com **limites rígidos**, ele **impede o uso fora do contrato antes de acontecer** e apoia auditorias de fornecedores.',
        'Planilhas e alarmes chegam tarde. Políticas de tags não contam licenças.',
        '**Regra prática:** "controlar o uso de licenças de software e evitar passar do contrato" é o License Manager.',
      ],
    },
  ],
}
