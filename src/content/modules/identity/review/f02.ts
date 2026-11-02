/**
 * Questões da Revisão da Fase 2 da IAM e Access Management (MFA), no formato
 * do exame SAA-C03. Fatos conferidos na documentação da AWS (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'iax.f02',
  questions: [
    {
      id: 'rv:iax.f02.mfa-por-usuario',
      kind: 'decision',
      title: 'A senha roubada de um usuário IAM',
      prompt:
        'Uma empresa registrou MFA no usuário raiz e considerou a conta protegida. Semanas depois, a senha de um dos **20 usuários IAM** que usam o console foi roubada, e o invasor entrou sem pedir nenhum código. A empresa quer **impedir o acesso com senhas roubadas**. Qual medida faltou?',
      concepts: [{ id: 'iam.mfa' }, { id: 'iam.mfa-root' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Registrar mais dispositivos MFA no usuário raiz, até o limite de oito.', correct: false, consequence: 'Os dispositivos do root valem só para o root.' },
        { id: 'b', text: 'Registrar MFA em cada usuário IAM que entra no console.', correct: true, consequence: 'Com o segundo fator, a senha roubada sozinha não abre o console.' },
        { id: 'c', text: 'Rotacionar as chaves de acesso de todos os usuários IAM.', correct: false, consequence: 'O invasor usou a senha do console, não uma chave de acesso.' },
        { id: 'd', text: 'Trocar o MFA do root por um token de hardware TOTP.', correct: false, consequence: 'Muda o fator do root e não protege nenhum usuário IAM.' },
      ],
      explanation: [
        'O **MFA do usuário raiz vale só para o root**. Cada usuário IAM tem a própria configuração de MFA, e quem não registrou entra só com a senha. Para que uma senha roubada não baste, cada usuário IAM do console precisa do segundo fator.',
        'Mais dispositivos ou outro tipo de token no root não alcançam os usuários IAM. E rotacionar chaves de acesso não protege o login no console.',
        'O root, por sua vez, tem MFA obrigatório em todos os tipos de conta: a AWS exige o registro em até 35 dias após a primeira tentativa de login.',
        '**Regra prática:** "impedir o acesso com credenciais roubadas" pede MFA em cada identidade com senha, não só no root.',
      ],
    },
    {
      id: 'rv:iax.f02.m1.a4',
      kind: 'decision',
      title: 'Sessenta dispositivos para guardar',
      prompt:
        'Uma organização tem **60 contas-membro**, e a AWS exige MFA no usuário raiz de cada uma. A equipe de segurança não quer administrar 60 dispositivos MFA e quer cumprir a exigência com o **menor esforço operacional**, mantendo a possibilidade de executar tarefas de root quando preciso. Qual solução atende?',
      concepts: [{ id: 'iam.mfa-root' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Registrar MFA só no root da conta de gerenciamento, que é a única exigida.', correct: false, consequence: 'A exigência vale para contas avulsas, de gerenciamento e membro.' },
        { id: 'b', text: 'Aplicar uma SCP que dispense o MFA do root em todas as contas-membro.', correct: false, consequence: 'SCPs limitam permissões; não dispensam a exigência de MFA.' },
        { id: 'c', text: 'Ativar o acesso root centralizado e remover as credenciais root das contas-membro.', correct: true, consequence: 'Sem credenciais de root, não há MFA de root a administrar nessas contas.' },
        { id: 'd', text: 'Criar chaves de acesso para os roots das contas-membro, que dispensam MFA.', correct: false, consequence: 'Chaves do root são credenciais de longo prazo com acesso total.' },
      ],
      explanation: [
        'A AWS exige MFA no usuário raiz de **todas as contas**: avulsas, de gerenciamento e membro. Com o **acesso root centralizado** do Organizations, as credenciais root das contas-membro são removidas, e elas aparecem como "não aplicável" nas verificações de MFA do root. As tarefas que exigem root passam a ser feitas a partir da conta de gerenciamento ou de um administrador delegado.',
        'A exigência não vale só para a conta de gerenciamento. Uma SCP limita ações, não dispensa o MFA. E chaves do root ampliam o risco.',
        '**Regra prática:** muitas contas-membro com root para proteger pedem o acesso root centralizado. Sem credencial de root, não há senha nem MFA para guardar.',
      ],
    },
    {
      id: 'rv:iax.f02.m2.a2',
      kind: 'decision',
      title: 'O script que escapou da exigência de MFA',
      prompt:
        'Para exigir MFA antes de encerrar instâncias, a segurança anexou a política abaixo ao grupo dos operadores. Dias depois, descobriu que um script que usa a **chave de acesso** de um operador, sem MFA, **continua encerrando instâncias**. A política deve negar também esse caso. O que corrigir?',
      exhibits: [
        {
          title: 'Statement com Deny (anexado ao grupo Operadores)',
          code: '{\n  "Effect": "Deny",\n  "Action": "ec2:TerminateInstances",\n  "Resource": "*",\n  "Condition": {\n    "Bool": { "aws:MultiFactorAuthPresent": "false" }\n  }\n}',
        },
      ],
      concepts: [{ id: 'iam.mfa-condition' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar o operador Bool por BoolIfExists, mantendo o valor false.', correct: true, consequence: 'A ausência da chave passa a contar como falso, e o script é negado.' },
        { id: 'b', text: 'Trocar o valor false por true, mantendo o operador Bool.', correct: false, consequence: 'O Deny passaria a negar justamente quem usou MFA.' },
        { id: 'c', text: 'Registrar um dispositivo MFA no usuário dono da chave do script.', correct: false, consequence: 'Chamadas com a chave de longo prazo continuam sem informação de MFA.' },
        { id: 'd', text: 'Mover o Deny para uma política inline do usuário em vez do grupo.', correct: false, consequence: 'Onde a política está não muda como a condição é avaliada.' },
      ],
      explanation: [
        'A chave **aws:MultiFactorAuthPresent** só existe em requisições feitas com credenciais temporárias. Com uma chave de acesso de longo prazo, ela **não aparece**, e uma condição Bool sobre uma chave ausente não casa: o Deny não se aplica. Com **BoolIfExists** e o valor false, a ausência também conta como falso, e o script passa a ser negado.',
        'Trocar o valor para true negaria quem tem MFA. Registrar MFA não muda o que a chave de longo prazo envia. E mover a política não altera a avaliação.',
        '**Regra prática:** para exigir MFA num Deny, use BoolIfExists com false. O Bool sozinho deixa passar quem usa chave de acesso.',
      ],
    },
    {
      id: 'rv:iax.f02.boss.a2',
      kind: 'decision',
      multiple: true,
      title: 'Quem ainda consegue encerrar instâncias',
      prompt:
        'Uma conta tem a política abaixo anexada ao grupo dos operadores, que também têm permissão para encerrar instâncias. Considere as requisições de **ec2:TerminateInstances** feitas pelos operadores. Quais delas são **permitidas**? (Escolha DUAS.)',
      exhibits: [
        {
          title: 'Statement com Deny (anexado ao grupo Operadores)',
          code: '{\n  "Effect": "Deny",\n  "Action": "ec2:TerminateInstances",\n  "Resource": "*",\n  "Condition": {\n    "BoolIfExists": { "aws:MultiFactorAuthPresent": "false" }\n  }\n}',
        },
      ],
      concepts: [{ id: 'iam.mfa-condition' }, { id: 'sts.get-session-token' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Pelo console, de um operador que entrou com senha e MFA.', correct: true, consequence: 'A sessão do console carrega MFA verdadeiro, e o Deny não se aplica.' },
        { id: 'b', text: 'Pela CLI, com a chave de acesso de longo prazo do operador.', correct: false, consequence: 'A chave de MFA não existe, e o BoolIfExists trata a ausência como falso.' },
        { id: 'c', text: 'Pela CLI, com credenciais do GetSessionToken obtidas com código MFA.', correct: true, consequence: 'As credenciais temporárias carregam a informação de que houve MFA.' },
        { id: 'd', text: 'Pela CLI, com credenciais do GetSessionToken obtidas sem código MFA.', correct: false, consequence: 'A chave existe com valor false, e o Deny se aplica.' },
        { id: 'e', text: 'Pelo console, de um operador que ainda não registrou nenhum MFA.', correct: false, consequence: 'Sem MFA no login, a sessão tem o valor false e é negada.' },
      ],
      explanation: [
        'Com **BoolIfExists** e o valor false, o Deny atinge quem entrou sem MFA e também quem não tem a chave de MFA na requisição. Passam só as requisições com MFA verdadeiro: o login no console com MFA e as credenciais temporárias do **GetSessionToken** pedidas com o número do dispositivo e o código.',
        'A chave de acesso de longo prazo não carrega a chave de MFA, então a ausência conta como falso. O GetSessionToken sem código devolve credenciais com MFA falso. E o console sem MFA também é negado.',
        '**Regra prática:** para usar a CLI sob uma política que exige MFA, troque a chave e o código MFA por credenciais temporárias com o GetSessionToken.',
      ],
    },
    {
      id: 'rv:iax.f02.m2.a4',
      kind: 'decision',
      title: 'As credenciais que pararam no fim do dia',
      prompt:
        'Um desenvolvedor chama **sts get-session-token** com o código MFA às 8h, sem informar duração, e usa as credenciais devolvidas na CLI. Às 20h, todos os comandos passam a falhar. Ele quer que uma única chamada **cubra um turno de 24 horas**. O que explica a falha e o que fazer?',
      concepts: [{ id: 'sts.get-session-token' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O código MFA vale por 12 horas; registrar um segundo dispositivo resolve.', correct: false, consequence: 'O código MFA vale só no momento da chamada, não ao longo da sessão.' },
        { id: 'b', text: 'O padrão é 12 horas; pedir 86.400 segundos com --duration-seconds.', correct: true, consequence: 'Para usuários IAM, o GetSessionToken aceita até 36 horas.' },
        { id: 'c', text: 'O máximo é 1 hora; ele precisa chamar o GetSessionToken de hora em hora.', correct: false, consequence: 'O limite de 1 hora vale só para o usuário raiz.' },
        { id: 'd', text: 'A política de MFA expira a sessão em 12 horas; trocar Bool por BoolIfExists.', correct: false, consequence: 'O operador da condição não muda a duração das credenciais.' },
      ],
      explanation: [
        'O **GetSessionToken** devolve credenciais temporárias de **15 minutos a 36 horas**, com padrão de **12 horas** quando a duração não é informada. Por isso as credenciais pedidas às 8h pararam às 20h. Pedir 86.400 segundos cobre o turno inteiro.',
        'O código MFA só é conferido na chamada. O limite de 1 hora vale para credenciais pedidas pelo usuário raiz. E a condição de MFA não define duração.',
        'Outros limites do GetSessionToken: ele não aceita session policy, e credenciais pedidas sem MFA não conseguem chamar as APIs do IAM.',
        '**Regra prática:** GetSessionToken troca chave mais código MFA por credenciais temporárias. Padrão de 12 horas, máximo de 36 horas e, para o root, 1 hora.',
      ],
    },
    {
      id: 'rv:iax.f02.m1.a1:token',
      kind: 'decision',
      title: 'O dispositivo que serve à CLI',
      prompt:
        'Uma equipe vai exigir MFA também na CLI, com os desenvolvedores chamando **sts get-session-token** e informando o número do dispositivo e o **código MFA**. Hoje, parte da equipe usa passkeys e chaves de segurança FIDO. Que tipo de dispositivo MFA permite **enviar o código nessa chamada**?',
      concepts: [{ id: 'iam.mfa-types' }, { id: 'sts.get-session-token' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma chave de segurança FIDO, que é a mais resistente a phishing.', correct: false, consequence: 'O código de uma chave FIDO não pode ser enviado às APIs do STS.' },
        { id: 'b', text: 'Uma passkey sincronizada no celular do desenvolvedor.', correct: false, consequence: 'Passkeys também não enviam código às APIs do STS.' },
        { id: 'c', text: 'Um código recebido por SMS no telefone cadastrado.', correct: false, consequence: 'A AWS não aceita mais registrar MFA por SMS.' },
        { id: 'd', text: 'Um aplicativo autenticador, que gera códigos TOTP de seis dígitos.', correct: true, consequence: 'O código TOTP vai no parâmetro TokenCode do GetSessionToken.' },
      ],
      explanation: [
        'O GetSessionToken recebe o **número do dispositivo** e um **código** (TokenCode). Dispositivos **TOTP**, como o aplicativo autenticador ou o token de hardware, geram esse código de seis dígitos.',
        '**Passkeys e chaves de segurança** usam criptografia de chave pública e resistem a phishing, mas o código delas não pode ser enviado às APIs do STS; com elas, a CLI usa o comando aws login. E o MFA por SMS não pode mais ser registrado.',
        '**Regra prática:** "resistente a phishing" pede passkey ou chave de segurança. "Código MFA na chamada do STS" pede um dispositivo TOTP.',
      ],
    },
    {
      id: 'rv:iax.f02.m1.a3',
      kind: 'decision',
      multiple: true,
      title: 'Sem o único segundo fator',
      prompt:
        'O celular de uma usuária IAM foi roubado. Ele tinha o aplicativo autenticador, **único dispositivo MFA** registrado por ela. Ela precisa **voltar a trabalhar** e a empresa quer **fechar a brecha** deixada pelo roubo. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'iam.mfa-recovery' }, { id: 'iam.mfa' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um administrador desativa o dispositivo perdido, e ela registra um novo.', correct: true, consequence: 'Ela volta a entrar com MFA num dispositivo que só ela tem.' },
        { id: 'b', text: 'Ela mesma recupera o MFA pelo e-mail e telefone da conta.', correct: false, consequence: 'A recuperação por e-mail e telefone é do root; o usuário IAM não recupera sozinho.' },
        { id: 'c', text: 'Trocar a senha dela, que pode estar com quem pegou o celular.', correct: true, consequence: 'Senha e dispositivo juntos nas mãos do ladrão abririam a conta.' },
        { id: 'd', text: 'Abrir um caso no AWS Support para desativar o dispositivo dela.', correct: false, consequence: 'Um administrador da própria conta resolve; não é preciso o suporte.' },
        { id: 'e', text: 'Esperar o código do aplicativo expirar, o que invalida o dispositivo.', correct: false, consequence: 'Os códigos se renovam: o aplicativo roubado continua gerando códigos válidos.' },
      ],
      explanation: [
        'Um usuário IAM **não recupera o MFA sozinho**: sem outro dispositivo registrado, um **administrador** desativa o perdido, e a usuária registra um novo. Depois de um roubo, também é preciso **trocar a senha**, porque quem pegou o celular pode ter acesso a ela.',
        'A recuperação por e-mail e telefone da conta é do usuário raiz. O suporte não é necessário. E o aplicativo roubado continua gerando códigos.',
        '**Regra prática:** registrar mais de um dispositivo evita o bloqueio. Sem reserva, o usuário IAM depende de um administrador, e o root depende do e-mail e do telefone da conta.',
      ],
    },
    {
      id: 'rv:iax.f02.m1.a2:r1',
      kind: 'decision',
      title: 'A chave de segurança que sumiu do cofre',
      prompt:
        'O usuário raiz de uma conta tem **dois dispositivos MFA** registrados: uma chave de segurança guardada num cofre e um aplicativo autenticador num celular da empresa. A chave sumiu do cofre. A empresa quer **voltar ao normal com o menor esforço**. O que fazer?',
      concepts: [{ id: 'iam.mfa-recovery' }, { id: 'iam.mfa' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Iniciar a recuperação da conta, confirmando o e-mail e o telefone do root.', correct: false, consequence: 'A recuperação é para quem não tem outro dispositivo; aqui ainda há um.' },
        { id: 'b', text: 'Entrar com o aplicativo autenticador e desativar a chave perdida.', correct: true, consequence: 'Basta um dispositivo para entrar, e o perdido deixa de valer.' },
        { id: 'c', text: 'Abrir um caso no AWS Support para remover a chave de segurança.', correct: false, consequence: 'O próprio root resolve entrando com o outro dispositivo.' },
        { id: 'd', text: 'Esperar 35 dias, quando a AWS pede um novo registro de MFA.', correct: false, consequence: 'O prazo de 35 dias é para o primeiro registro, não para dispositivos perdidos.' },
      ],
      explanation: [
        'O root e cada usuário IAM podem registrar **até oito dispositivos MFA**, e **basta um para entrar**. Com o aplicativo autenticador ainda disponível, o root entra e desativa a chave perdida, sem procedimento de recuperação.',
        'A recuperação por e-mail e telefone é para quando não sobra nenhum dispositivo. O suporte não é necessário. E o prazo de 35 dias se refere ao primeiro registro de MFA no root.',
        '**Regra prática:** ter um segundo dispositivo MFA transforma uma perda num ajuste rápido. Depois, vale também trocar a senha.',
      ],
    },
  ],
}
