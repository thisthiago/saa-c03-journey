/**
 * Questões da Revisão da Fase 5 de Arquitetura e otimização (segurança na
 * arquitetura), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'arq.f05',
  questions: [
    {
      id: 'rv:arq.f05.m1.a2',
      kind: 'decision',
      title: 'Quarenta logins em três contas',
      prompt:
        'Os 40 funcionários de uma cooperativa têm **usuários do IAM próprios em três contas**, com chaves de acesso que ninguém lembra de desativar quando alguém sai. A empresa já usa um **provedor de identidade corporativo**. Qual mudança segue a base de identidade forte com o **menor esforço** de manutenção?',
      concepts: [{ id: 'wa.sec-identity' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter os usuários do IAM e exigir MFA em todos eles.', correct: false, consequence: 'O MFA ajuda, mas as identidades seguem espalhadas e com chaves longas.' },
        { id: 'b', text: 'IAM Identity Center federado ao provedor corporativo.', correct: true, consequence: 'Login único com credenciais temporárias; quem sai perde tudo de uma vez.' },
        { id: 'c', text: 'Um usuário do IAM compartilhado por equipe em cada conta.', correct: false, consequence: 'Ninguém sabe quem fez o quê, e a senha circula entre pessoas.' },
        { id: 'd', text: 'Um script mensal que desativa as chaves de quem saiu.', correct: false, consequence: 'Continua com identidades e chaves longas espalhadas por três contas.' },
      ],
      explanation: [
        'A **base de identidade forte** pede identidades **centralizadas**, menor privilégio e o fim das **credenciais longas**: pessoas entram por **federação**, e máquinas usam roles. O **IAM Identity Center** ligado ao provedor corporativo dá login único em todas as contas, com permission sets por função e credenciais temporárias em cada sessão.',
        'MFA e scripts melhoram o cenário atual sem resolvê-lo. Usuários compartilhados acabam com a rastreabilidade.',
        '**Regra prática:** funcionários em várias contas entram pelo IAM Identity Center com federação; usuários do IAM com chaves longas são antipadrão.',
      ],
    },
    {
      id: 'rv:arq.f05.chaves-no-aplicativo',
      kind: 'decision',
      title: 'Uma chave dentro do celular',
      prompt:
        'Um aplicativo móvel envia fotos direto para um bucket S3 usando a **chave de acesso de um usuário do IAM embutida no aplicativo**. Uma auditoria pediu para **eliminar essa chave**, sem criar um backend só para os uploads. Cada usuário só pode gravar na própria pasta. Qual solução atende?',
      concepts: [{ id: 'wa.sec-identity' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ofuscar a chave no código e girá-la a cada nova versão.', correct: false, consequence: 'A chave continua longa e pode ser extraída do aplicativo.' },
        { id: 'b', text: 'Criar um usuário do IAM com chave própria para cada cliente.', correct: false, consequence: 'Multiplica as chaves longas, e não escala para milhares de usuários.' },
        { id: 'c', text: 'Guardar a chave no Secrets Manager e baixá-la ao abrir o app.', correct: false, consequence: 'O app ainda recebe uma chave longa, agora por outro caminho.' },
        { id: 'd', text: 'Um identity pool do Cognito com role limitada à pasta.', correct: true, consequence: 'Cada usuário recebe credenciais temporárias, só para a própria pasta.' },
      ],
      explanation: [
        'Chaves de acesso longas **em aplicativos móveis** são um antipadrão citado pela AWS, e não usar **credenciais temporárias** (SEC02-BP02) tem risco alto. Um **identity pool do Cognito** troca o login do usuário por credenciais temporárias de uma role, cuja política limita cada identidade à **própria pasta** no bucket.',
        'Ofuscar, multiplicar ou entregar a chave por outro caminho mantém uma credencial longa no aparelho.',
        '**Regra prática:** nenhum código distribuído leva chave de acesso; apps móveis recebem credenciais temporárias pelo Cognito.',
      ],
    },
    {
      id: 'rv:arq.f05.m3.a2',
      kind: 'decision',
      title: 'A planilha semanal dos analistas',
      prompt:
        'Toda segunda-feira, dois analistas de marketing abrem o PostgreSQL com um usuário de leitura, montam a consulta da semana e exportam **todos os clientes** para uma planilha, da qual usam só **três colunas** para a campanha. A diretoria quer reduzir o contato humano com os dados de produção. Qual mudança atende?',
      concepts: [{ id: 'wa.sec-keep-away' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Exigir MFA no login dos analistas no banco de produção.', correct: false, consequence: 'Protege o login, mas as pessoas continuam lendo todos os dados à mão.' },
        { id: 'b', text: 'Gravar as consultas dos analistas num log de auditoria.', correct: false, consequence: 'Registra o acesso, mas as pessoas continuam lendo tudo à mão.' },
        { id: 'c', text: 'Um relatório automático só com as três colunas.', correct: true, consequence: 'Ninguém acessa o banco, e só o necessário chega aos analistas.' },
        { id: 'd', text: 'Criptografar a planilha antes de enviá-la por e-mail.', correct: false, consequence: 'Protege o arquivo, mas a exportação manual de tudo continua.' },
      ],
      explanation: [
        '**Manter as pessoas longe dos dados** é reduzir ou eliminar o **acesso direto e o processamento manual**: cada acesso humano é uma chance de erro, vazamento ou alteração indevida. Automatizar a tarefa e entregar **só o necessário** resolve a causa.',
        'MFA, log e criptografia da planilha são controles úteis, mas mantêm pessoas lendo dados de todos os clientes à mão.',
        '**Regra prática:** tarefa manual recorrente sobre dados de produção vira automação que entrega só o necessário, com o acesso registrado.',
      ],
    },
    {
      id: 'rv:arq.f05.m3.a4:p1',
      kind: 'decision',
      title: 'Doze contas e uma configuração',
      prompt:
        'Uma empresa tem **12 contas** numa organização e configura a rede e os controles de segurança **pelo console**, conta por conta. Uma auditoria achou duas contas diferentes das outras. A meta é ter **a mesma configuração em todas**, inclusive nas contas novas, e saber quando algo sair do padrão. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'wa.sec-automate' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Definir os controles em templates aplicados por StackSets.', correct: true, consequence: 'A mesma configuração chega a todas as contas, inclusive às novas.' },
        { id: 'b', text: 'Escrever um manual com as telas do console para cada conta.', correct: false, consequence: 'Continua manual, e as contas voltam a divergir.' },
        { id: 'c', text: 'Regras do AWS Config que verificam a conformidade.', correct: true, consequence: 'Mostram e alertam quando uma conta sai do padrão.' },
        { id: 'd', text: 'Revisar as contas à mão uma vez por ano.', correct: false, consequence: 'A divergência pode ficar meses sem ser vista.' },
        { id: 'e', text: 'Dar acesso de administrador a um só funcionário para todas as contas.', correct: false, consequence: 'Concentra poder sem garantir configuração igual.' },
      ],
      explanation: [
        '**Automatizar as boas práticas de segurança** é definir os controles **como código**, em templates versionados, aplicados igual em todo ambiente: o **CloudFormation StackSets** leva o mesmo template a todas as contas da organização. A **rastreabilidade** completa o ciclo, e o **AWS Config** verifica a conformidade e alerta quando algo muda.',
        'Manuais, revisões anuais e um administrador único dependem de pessoas e não impedem a divergência.',
        '**Regra prática:** mesma segurança em muitas contas é infraestrutura como código (StackSets) mais verificação contínua (Config).',
      ],
    },
    {
      id: 'rv:arq.f05.m3.a4:p3',
      kind: 'decision',
      title: 'Volumes que dependem de lembrar',
      prompt:
        'Numa conta, os volumes EBS só nascem criptografados quando quem cria **lembra de marcar a opção**, e uma auditoria achou volumes sem criptografia. A empresa quer que **todo volume novo** nasça criptografado nas Regiões que usa, **sem depender de cada pessoa**. Qual configuração atende com o **menor esforço**?',
      concepts: [{ id: 'wa.sec-automate' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criptografia padrão do EBS ligada em cada Região.', correct: true, consequence: 'Todo volume novo nasce criptografado, sem ninguém marcar nada.' },
        { id: 'b', text: 'Uma regra do Config que aponta os volumes sem criptografia.', correct: false, consequence: 'Mostra o problema depois que ele existe, sem impedir.' },
        { id: 'c', text: 'Ligar a rotação automática da chave do KMS da conta.', correct: false, consequence: 'Gira a chave, mas não faz os volumes nascerem criptografados.' },
        { id: 'd', text: 'Treinar os times para marcar a opção em toda criação.', correct: false, consequence: 'Continua dependendo de cada pessoa lembrar.' },
      ],
      explanation: [
        'A criptografia em repouso deve ser ligada **por padrão** (SEC08-BP02, de risco alto). A **criptografia padrão do EBS**, configurada em cada Região da conta, faz todo volume novo nascer criptografado, sem depender de quem cria.',
        'O Config detecta, mas não impede. A rotação de chaves é outro controle. Treinamento mantém a dependência das pessoas.',
        '**Regra prática:** o que deve valer sempre vira padrão automático; detecção complementa, mas não substitui.',
      ],
    },
  ],
}
