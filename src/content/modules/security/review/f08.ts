/**
 * Questões da Revisão da Fase 8 de Segurança (ameaças externas e resposta),
 * no formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'sec.f08',
  questions: [
    {
      id: 'rv:sec.f08.m1.a1:busca',
      kind: 'decision',
      title: 'Linhas estranhas no log da loja',
      prompt:
        'A equipe de uma loja virtual encontrou três padrões nos logs: **busca=sofá\' OR \'1\'=\'1** no campo de busca; **comentario=<script>document.location=...</script>** nos comentários de produtos; e **2 milhões de conexões por minuto** vindas de milhares de endereços. Quais classificações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sec.web-threats' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'O padrão do campo de busca é injeção de SQL.', correct: true, consequence: 'Tenta mudar a consulta ao banco com um comando no campo.' },
        { id: 'b', text: 'O padrão dos comentários é cross-site scripting (XSS).', correct: true, consequence: 'É um script que rodaria no navegador de quem abrir o produto.' },
        { id: 'c', text: 'As 2 milhões de conexões são injeção de SQL.', correct: false, consequence: 'Volume de tráfego para esgotar o site é DDoS, não injeção.' },
        { id: 'd', text: 'O padrão do campo de busca é DDoS.', correct: false, consequence: 'É uma única requisição com comando de banco, não um volume de tráfego.' },
        { id: 'e', text: 'O padrão dos comentários é injeção de SQL.', correct: false, consequence: 'O script mira o navegador de outros clientes, não o banco.' },
      ],
      explanation: [
        '**Injeção de SQL** coloca comandos de banco num campo do formulário, como o OR \'1\'=\'1. **Cross-site scripting (XSS)** coloca um script que roda no navegador de outros clientes. **DDoS** tenta derrubar o site com tráfego demais.',
        'Os erros trocam o alvo de cada ataque: banco, navegador ou disponibilidade.',
        '**Regra prática:** comando de banco num campo é SQLi; script para outros navegadores é XSS; volume para derrubar é DDoS.',
      ],
    },
    {
      id: 'rv:sec.f08.boss.a1:flood',
      kind: 'decision',
      title: 'Dois ataques ao mesmo tempo',
      prompt:
        'Uma loja atrás de um Application Load Balancer sofre, ao mesmo tempo, **inundações de conexões** para derrubar o site e **comentários com &lt;script&gt;** que roubam a sessão de quem abre o produto. A equipe quer barrar os dois tipos na borda, com **regras prontas**. Qual combinação atende?',
      concepts: [{ id: 'sec.web-threats' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Só o grupo gerenciado SQL database no WAF.', correct: false, consequence: 'Barra injeção de SQL; não trata o volume nem o XSS dos comentários.' },
        { id: 'b', text: 'Shield no volume, Core rule set do WAF no XSS.', correct: true, consequence: 'O volume fica com o Shield, e o Core rule set barra os scripts nos comentários.' },
        { id: 'c', text: 'O GuardDuty, que barra os dois ataques na borda.', correct: false, consequence: 'O GuardDuty detecta ameaças; não barra requisições na borda.' },
        { id: 'd', text: 'Security groups que neguem os endereços de origem.', correct: false, consequence: 'Security groups não negam, não leem o conteúdo HTTP e não acompanham milhares de origens.' },
      ],
      explanation: [
        '**DDoS** pede o **Shield** (e o WAF na camada de aplicação, com regras por taxa). **Injeção de SQL** e **XSS** pedem o **WAF** com as regras gerenciadas: o **Core rule set** (AWSManagedRulesCommonRuleSet) traz regras contra XSS, e o grupo **SQL database** barra injeção de SQL.',
        'O grupo de SQL não cobre XSS nem volume. O GuardDuty detecta, mas não barra. E security groups não leem requisições.',
        '**Regra prática:** volume é Shield; conteúdo malicioso nas requisições é WAF com o grupo gerenciado do ataque.',
      ],
    },
    {
      id: 'rv:sec.f08.m2.a2',
      kind: 'decision',
      title: 'O WAF ligado e o banco exposto',
      prompt:
        'Uma aplicação tem o **WAF com regras gerenciadas** no ALB. Para facilitar o acesso do time, o banco RDS foi colocado numa **sub-rede pública**, aceitando a porta 5432 de qualquer origem. Um gerente acha que "o WAF já protege tudo". Qual avaliação e ação estão corretas?',
      concepts: [{ id: 'sec.defense-in-depth' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Correta: o WAF protege todos os recursos da conta.', correct: false, consequence: 'O WAF só vê o que passa pelos recursos associados a ele, como o ALB.' },
        { id: 'b', text: 'Correta, desde que o banco tenha uma senha forte.', correct: false, consequence: 'O banco continua alcançável da internet, sem passar pelo WAF.' },
        { id: 'c', text: 'Incorreta: o banco vai para sub-redes privadas.', correct: true, consequence: 'Cada camada cumpre o seu papel: o WAF na borda, a rede limitando quem chega ao banco.' },
        { id: 'd', text: 'Incorreta: associar o WAF direto ao banco RDS.', correct: false, consequence: 'O WAF não se associa a um banco; ele protege requisições web.' },
      ],
      explanation: [
        '**Nenhuma camada sozinha basta.** O WAF filtra o tráfego que passa pelo ALB; um banco com endereço público pode ser atacado **direto**, sem passar por ele. Na **rede**, o banco fica em sub-redes privadas, aceitando só o security group da aplicação; o time acessa por caminhos privados.',
        'O WAF não protege a conta inteira, senha não tira o banco do alcance, e o WAF não se associa ao RDS.',
        '**Regra prática:** quando várias alternativas resolvem parte do problema, prefira a que combina camadas: borda, rede, identidade, dados e detecção.',
      ],
    },
    {
      id: 'rv:sec.f08.m2.a1:waf',
      kind: 'decision',
      title: 'Cada controle na sua camada',
      prompt:
        'Num desenho de defesa em camadas com **borda, rede, identidade, dados e detecção**, um arquiteto associou cada controle a uma camada. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sec.defense-in-depth' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Regras do WAF no ALB: borda.', correct: true, consequence: 'Filtram as requisições na entrada, antes da aplicação.' },
        { id: 'b', text: 'O banco cifrado com uma chave do KMS: dados.', correct: true, consequence: 'Protege os dados gravados, mesmo se o disco vazar.' },
        { id: 'c', text: 'O banco aceitando só o security group da aplicação: borda.', correct: false, consequence: 'É um controle de rede, que limita quem chega ao banco.' },
        { id: 'd', text: 'O banco numa sub-rede privada: dados.', correct: false, consequence: 'É um controle de rede: ninguém de fora alcança o banco direto.' },
        { id: 'e', text: 'O GuardDuty ligado nas contas: rede.', correct: false, consequence: 'É a camada de detecção, para o que passar pelas outras.' },
      ],
      explanation: [
        'Na **borda**, Shield e WAF barram volume e requisições maliciosas. Na **rede**, security groups e sub-redes privadas limitam quem chega. Na **identidade**, roles com privilégio mínimo. Nos **dados**, criptografia. Por cima de tudo, **detecção** com o GuardDuty para o que passar.',
        'Security groups e sub-redes privadas são rede, e o GuardDuty é detecção.',
        '**Regra prática:** em defesa em camadas, cada controle tem a sua camada; uma não substitui a outra.',
      ],
    },
    {
      id: 'rv:sec.f08.boss.a1:cc',
      kind: 'decision',
      title: 'O que passou por todas as camadas',
      prompt:
        'Uma empresa tem WAF e Shield na borda, sub-redes privadas e security groups restritos, roles com privilégio mínimo e dados cifrados. Mesmo assim, uma instância de pagamentos foi comprometida por uma biblioteca vulnerável e passou a **falar com um servidor de comando e controle**. Qual camada deve **perceber** isso?',
      concepts: [{ id: 'sec.defense-in-depth' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A borda, com mais regras do WAF no ALB.', correct: false, consequence: 'O tráfego sai da instância para fora; não passa pelo WAF do ALB.' },
        { id: 'b', text: 'A camada de dados, com outra chave do KMS.', correct: false, consequence: 'A criptografia protege os dados guardados; não percebe comportamento.' },
        { id: 'c', text: 'A identidade, com uma role ainda mais restrita.', correct: false, consequence: 'Ajuda a limitar o estrago, mas não percebe o contato com o servidor malicioso.' },
        { id: 'd', text: 'A detecção, com o GuardDuty ligado.', correct: true, consequence: 'O GuardDuty aponta a instância falando com um servidor de comando e controle.' },
      ],
      explanation: [
        'Nenhuma camada de prevenção é perfeita: por isso a defesa em camadas termina na **detecção**. O **GuardDuty** usa listas de IPs e domínios maliciosos e percebe uma instância **falando com um servidor de comando e controle**, mesmo depois de tudo o mais ter funcionado.',
        'WAF, KMS e roles previnem ou limitam, mas não percebem esse comportamento.',
        '**Regra prática:** prevenção nas camadas de borda, rede, identidade e dados; detecção para o que passar.',
      ],
    },
    {
      id: 'rv:sec.auto-response:1',
      kind: 'decision',
      title: 'Instâncias de teste isoladas à toa',
      prompt:
        'Uma regra do EventBridge aciona uma Lambda que **isola a instância** para **todo achado** do GuardDuty. Achados de **gravidade baixa** em instâncias de teste estão isolando máquinas sem necessidade. A empresa quer que **só os achados de gravidade alta** isolem, e que os outros continuem registrados e visíveis. Qual mudança atende?',
      concepts: [{ id: 'sec.auto-response' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Filtrar a gravidade no padrão de evento da regra.', correct: true, consequence: 'A Lambda só é acionada pelos achados graves; os outros seguem no GuardDuty.' },
        { id: 'b', text: 'Desligar o GuardDuty nas contas de teste.', correct: false, consequence: 'Acaba com a detecção nessas contas, não só com o isolamento.' },
        { id: 'c', text: 'Arquivar automaticamente os achados de gravidade baixa.', correct: false, consequence: 'Tira esses achados da vista da equipe, o que o pedido proíbe.' },
        { id: 'd', text: 'Trocar a Lambda por um aviso por e-mail para todos os achados.', correct: false, consequence: 'Para o isolamento também dos achados graves.' },
      ],
      explanation: [
        'O GuardDuty publica **cada achado no EventBridge**, e a **regra filtra pelo tipo ou pela gravidade** antes de acionar o alvo. Com o filtro de gravidade alta no padrão de evento, só esses achados acionam o isolamento; os demais continuam no GuardDuty, registrados e visíveis.',
        'Desligar a detecção ou arquivar os achados esconde informação. E trocar a Lambda por e-mail acaba com a resposta automática onde ela é necessária.',
        '**Regra prática:** resposta automática começa por um bom filtro na regra do EventBridge: tipo, gravidade ou recurso.',
      ],
    },
    {
      id: 'rv:sec.auto-response:2',
      kind: 'decision',
      title: 'O padrão de evento da regra',
      prompt:
        'Uma equipe está escrevendo a regra do EventBridge que deve reagir a **cada achado novo do GuardDuty**. A primeira versão, que esperava eventos do CloudTrail, **nunca disparou**. Qual padrão de evento a regra deve usar?',
      concepts: [{ id: 'sec.auto-response' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'source aws.cloudtrail, com o nome da API do GuardDuty.', correct: false, consequence: 'Os achados não chegam como chamadas de API registradas pelo CloudTrail.' },
        { id: 'b', text: 'source aws.guardduty e detail-type GuardDuty Finding.', correct: true, consequence: 'A regra recebe cada achado publicado pelo GuardDuty.' },
        { id: 'c', text: 'source aws.cloudwatch, com um alarme de gravidade.', correct: false, consequence: 'Os achados não viram alarmes do CloudWatch.' },
        { id: 'd', text: 'source aws.securityhub, sem filtro de tipo.', correct: false, consequence: 'Recebe eventos do Security Hub, não diretamente os do GuardDuty, e sem filtro.' },
      ],
      explanation: [
        'O evento de um achado do GuardDuty tem **source "aws.guardduty"** e **detail-type "GuardDuty Finding"**. A regra filtra por esses campos (e, se quiser, pela gravidade ou pelo tipo do achado). Achados novos saem quase em tempo real.',
        'CloudTrail e CloudWatch não são a origem desses eventos. O Security Hub CSPM também se integra ao EventBridge, mas com eventos próprios.',
        '**Regra prática:** a regra do EventBridge escuta a origem do evento; para achados do GuardDuty, aws.guardduty e GuardDuty Finding.',
      ],
    },
    {
      id: 'rv:sec.f08.m3.a2',
      kind: 'decision',
      title: 'Uma chave de acesso vazada',
      prompt:
        'O GuardDuty mostra que a **chave de acesso de um usuário IAM** está sendo usada a partir de um IP malicioso. A equipe precisa **parar o uso da credencial imediatamente**, mas quer **preservar o usuário e os registros** para a investigação. Qual é a primeira ação de contenção?',
      concepts: [{ id: 'sec.containment' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Apagar o usuário IAM e todos os recursos que ele criou.', correct: false, consequence: 'Corta o acesso, mas destrói o que a investigação precisa analisar.' },
        { id: 'b', text: 'Esperar a chave expirar sozinha.', correct: false, consequence: 'Chaves de acesso de usuários IAM não expiram sozinhas.' },
        { id: 'c', text: 'Anexar ao usuário uma política que nega tudo.', correct: true, consequence: 'O uso da credencial é bloqueado na hora, e o usuário e os registros ficam para a perícia.' },
        { id: 'd', text: 'Trocar a senha de console do usuário.', correct: false, consequence: 'A chave de acesso continua funcionando, porque é outra credencial.' },
      ],
      explanation: [
        'A primeira meta é **conter sem destruir as provas**. Para uma **credencial comprometida**, anexar uma **política que nega tudo** bloqueia o uso na hora (desativar a chave também ajuda), e o usuário, os recursos e os registros continuam disponíveis para a investigação.',
        'Apagar tudo destrói provas. Chaves de acesso não expiram sozinhas. E a senha de console é outra credencial.',
        '**Regra prática:** o ciclo do incidente segue detecção e análise, contenção, erradicação e recuperação; contenção primeiro, sem apagar.',
      ],
    },
    {
      id: 'rv:sec.f08.m3.a3',
      kind: 'decision',
      title: 'A conexão que continuou aberta',
      prompt:
        'Para isolar uma instância comprometida, a equipe **trocou o security group** dela por um grupo **sem nenhuma regra**. As conexões novas pararam, mas o time ainda vê **uma conexão aberta** com o servidor do atacante. A instância precisa ser preservada para a perícia. Qual explicação está correta?',
      concepts: [{ id: 'sec.containment' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O security group novo não foi aplicado à instância.', correct: false, consequence: 'Foi aplicado: as conexões novas já estão bloqueadas.' },
        { id: 'b', text: 'A troca não derruba conexões já rastreadas.', correct: true, consequence: 'O bloqueio vale para o tráfego novo; a sessão aberta exige outra medida de contenção.' },
        { id: 'c', text: 'Security groups só filtram a entrada, não a saída.', correct: false, consequence: 'O security group tem regras de entrada e de saída.' },
        { id: 'd', text: 'A conexão aberta é do GuardDuty monitorando a instância.', correct: false, consequence: 'O GuardDuty não abre conexões com a instância.' },
      ],
      explanation: [
        'O security group tem estado e acompanha as conexões. **Trocar o security group não derruba as conexões já rastreadas**; só **bloqueia o tráfego novo**. Para cortar a sessão aberta, é preciso outra medida de contenção, como uma regra de negação na network ACL da sub-rede, sem terminar a instância.',
        'O grupo foi aplicado, e ele filtra os dois sentidos. O GuardDuty não abre conexões.',
        '**Regra prática:** isolar com security group restritivo é o primeiro passo; confira as conexões já abertas e complete a contenção sem destruir provas.',
      ],
    },
  ],
}
