/**
 * Fase 3 — Segredos da aplicação. Onde guardar credenciais, a rotação do
 * Secrets Manager passo a passo, as estratégias de usuário, a rotação
 * gerenciada, réplicas, cache e a escolha entre Secrets Manager e Parameter
 * Store.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { SecretsLabConfig } from '../../../../../simulators/secrets/lab'
import { META } from '../meta'

export const APRENDE_ROTACAO: SecretsLabConfig = {
  checkpoints: [
    { id: 'u1', strategy: 'single', moment: 'createSecret', reader: 'fresh', concepts: ['secret.rotation'] },
    { id: 'u2', strategy: 'single', moment: 'setSecret', reader: 'fresh', concepts: ['secret.rotation', 'secret.strategies'] },
    { id: 'u3', strategy: 'single', moment: 'finishSecret', reader: 'fresh', concepts: ['secret.rotation'] },
    { id: 'u4', strategy: 'single', moment: 'finishSecret', reader: 'cached', concepts: ['secret.caching'] },
    { id: 'a1', strategy: 'alternating', moment: 'setSecret', reader: 'fresh', concepts: ['secret.strategies'] },
    { id: 'a2', strategy: 'alternating', moment: 'finishSecret', reader: 'cached', concepts: ['secret.strategies', 'secret.caching'] },
    { id: 'a3', strategy: 'alternating', moment: 'secondRotation', reader: 'cached', concepts: ['secret.caching'] },
    { id: 'a4', strategy: 'alternating', moment: 'secondRotation', reader: 'fresh', concepts: ['secret.rotation'] },
  ],
}

export const F03_SEC: PhaseDef = {
  ...META.f03,
  concepts: ['secret.where', 'iam.instance-profile', 'secret.rotation', 'secret.strategies', 'secret.managed-rotation', 'secret.replication', 'secret.caching', 'secret.vs-parameter-store', 'ssm.parameter-store', 'db.secrets'],
  availability: 'available',
  simplifications: ['A plataforma, os bancos e as senhas são fictícios.', 'A aplicação com cache guardou a senha antes da rotação e ainda não renovou a cópia no momento perguntado.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f03.m1',
      title: 'A senha no repositório',
      type: 'mission',
      summary: 'Onde guardar credenciais e quando nem é preciso guardar.',
      briefing: {
        company: 'Plataforma de Cursos Aprende Já',
        role: 'Você revisa a segurança de uma plataforma de cursos on-line.',
        situation: 'Um repositório público de um ex-estagiário trazia a senha do banco de dados escrita no código. A aplicação também tem uma chave de acesso fixa para ler vídeos no S3.',
        objective: 'Tirar os segredos do código e escolher onde cada um fica.',
        successCriteria: ['Classificar cada credencial', 'Trocar a chave fixa por uma role', 'Escolher entre Secrets Manager e Parameter Store'],
      },
      intel: [
        { conceptId: 'secret.where', body: ['No **código** ou em **variável de ambiente**, o segredo vaza e não gira. Num **serviço de segredos**, a aplicação busca o valor com a própria role, e o acesso fica registrado.'] },
        { conceptId: 'iam.instance-profile', body: ['Para chamar serviços da AWS a partir da instância, a **role** do instance profile entrega credenciais temporárias. Nenhuma chave fixa é necessária.'] },
        { conceptId: 'secret.vs-parameter-store', body: ['**Secrets Manager**: segredos com rotação automática, cobrado por segredo. **Parameter Store**: configurações e SecureString; o nível padrão não tem custo extra e **não gira** segredos.'] },
      ],
      activities: [
        {
          id: 'sec.f03.m1.a1',
          kind: 'classify',
          title: 'Cada coisa no seu lugar',
          prompt: 'Classifique cada item pelo lugar certo.',
          concepts: [{ id: 'secret.vs-parameter-store' }, { id: 'secret.where', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Senha que precisa girar vai para o Secrets Manager. Configuração, mesmo cifrada, cabe no Parameter Store. Acesso a serviços da AWS vem da role, sem segredo nenhum.'],
          bins: [
            { id: 'sm', label: 'Secrets Manager' },
            { id: 'ps', label: 'Parameter Store' },
            { id: 'role', label: 'Role da instância ou da task' },
          ],
          items: [
            { id: 'dbpass', text: 'Senha do banco, que precisa girar a cada 30 dias', bin: 'sm', explanation: 'Rotação automática é do Secrets Manager.', concepts: ['secret.vs-parameter-store'] },
            { id: 'flag', text: 'Endereço da API de pagamentos e o tempo limite das chamadas', bin: 'ps', explanation: 'Configuração simples, sem custo extra no nível padrão.', concepts: ['secret.vs-parameter-store'] },
            { id: 's3', text: 'Permissão para a aplicação ler os vídeos do S3', bin: 'role', explanation: 'A role entrega credenciais temporárias.', concepts: ['secret.where', 'iam.instance-profile'] },
            { id: 'bucket', text: 'Nome do bucket de vídeos que a aplicação usa em cada ambiente', bin: 'ps', explanation: 'Configuração por ambiente, sem nada a girar.', concepts: ['secret.vs-parameter-store'] },
          ],
        },
        {
          id: 'sec.f03.m1.a2',
          kind: 'decision',
          title: 'A chave fixa da aplicação',
          prompt: 'A aplicação, numa instância EC2, lê vídeos do S3 com uma chave de acesso fixa gravada num arquivo de configuração. O que fazer?',
          concepts: [{ id: 'iam.instance-profile' }, { id: 'secret.where', weight: 0.5 }],
          xp: 50,
          difficulty: 1,
          explanation: ['Com a role no instance profile, o SDK pega credenciais temporárias sozinho. A chave fixa deve ser desativada e apagada.'],
          options: [
            { id: 'a', text: 'Anexar uma role à instância com acesso ao bucket e apagar a chave fixa', correct: true, consequence: 'Não sobra nenhuma credencial fixa para vazar.' },
            { id: 'b', text: 'Mover a chave fixa para o Secrets Manager', correct: false, consequence: 'Melhor que no arquivo, mas a role dispensa a chave.' },
            { id: 'c', text: 'Girar a chave fixa a cada 90 dias', correct: false, consequence: 'Continua existindo uma chave fixa para vazar.' },
          ],
        },
        {
          id: 'sec.f03.m1.a3',
          kind: 'decision',
          title: 'Pagar por um parâmetro?',
          prompt: 'O time quer guardar 40 parâmetros de configuração no Secrets Manager "por segurança". Nenhum é senha e nenhum gira. O que sugerir?',
          concepts: [{ id: 'secret.vs-parameter-store' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O Secrets Manager cobra cada segredo por mês. Sem rotação, o Parameter Store padrão guarda configurações sem custo extra, com SecureString quando o valor é sensível.'],
          options: [
            { id: 'a', text: 'Usar o Parameter Store, com SecureString nos valores sensíveis', correct: true, consequence: 'Mesma proteção do KMS, sem pagar 40 segredos por mês.' },
            { id: 'b', text: 'Manter no Secrets Manager', correct: false, consequence: 'Paga recursos de rotação que ninguém vai usar.' },
          ],
        },
      ],
      debrief: { takeaways: ['Nada de segredo no código.', 'Serviço da AWS: role, não chave fixa.', 'Senha que gira: Secrets Manager. Configuração: Parameter Store.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f03.m2',
      title: 'Uma rotação por dentro',
      type: 'mission',
      summary: 'As quatro etapas, os rótulos de versão e as estratégias de usuário.',
      briefing: {
        company: 'Plataforma de Cursos Aprende Já',
        role: 'Você liga a rotação da senha do banco.',
        situation: 'Na primeira rotação de teste, algumas requisições falharam por alguns segundos. O time quer entender o que aconteceu antes de ligar a rotação em produção.',
        objective: 'Acompanhar a rotação etapa por etapa e escolher a estratégia.',
        successCriteria: ['Ordenar as etapas', 'Prever o login em cada estratégia'],
      },
      intel: [
        { conceptId: 'secret.rotation', body: ['`createSecret` cria a versão nova (**AWSPENDING**); `setSecret` troca a senha no banco; `testSecret` testa; `finishSecret` move **AWSCURRENT** para a nova, e a antiga fica com **AWSPREVIOUS**.'] },
        { conceptId: 'secret.strategies', body: ['**Usuário único**: um curto intervalo em que o banco pode recusar a senha antiga. **Usuários alternados**: dois usuários, e as duas senhas valem depois da rotação.'] },
      ],
      activities: [
        {
          id: 'sec.f03.m2.a1',
          kind: 'order',
          title: 'As quatro etapas',
          prompt: 'Ponha na ordem as etapas da função de rotação.',
          concepts: [{ id: 'secret.rotation' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cria a versão nova, troca no banco, testa e só então move o rótulo AWSCURRENT.'],
          steps: [
            { id: 'create', text: 'createSecret: gera a senha nova com o rótulo AWSPENDING', explanation: 'A versão nova existe, mas ninguém a usa ainda.' },
            { id: 'set', text: 'setSecret: troca a senha no banco pela de AWSPENDING', explanation: 'O banco passa a aceitar a senha nova.' },
            { id: 'test', text: 'testSecret: conecta no banco com a senha nova', explanation: 'Confere que a troca funcionou.' },
            { id: 'finish', text: 'finishSecret: move AWSCURRENT para a versão nova; a anterior fica com AWSPREVIOUS', explanation: 'A partir daqui, a aplicação recebe a senha nova.' },
          ],
        },
        {
          id: 'sec.f03.m2.a2',
          kind: 'predict',
          title: 'Os segundos de falha',
          prompt: 'O Secrets Manager gira a senha do banco com a estratégia de **usuário único**: a mesma conta de banco tem a senha trocada. A rotação acabou de executar a etapa setSecret e ainda não chegou ao finishSecret. Nesse momento, a aplicação lê o segredo e conecta no banco. O que acontece?',
          concepts: [{ id: 'secret.strategies' }, { id: 'secret.rotation', weight: 0.5 }],
          xp: 50,
          difficulty: 3,
          explanation: ['O banco já trocou a senha, mas AWSCURRENT ainda aponta para a versão antiga até o finishSecret. É o intervalo curto que a documentação descreve.'],
          spec: { sim: 'secrets', strategy: 'single', moment: 'setSecret', reader: 'fresh' },
          options: [
            { id: 'a', text: 'O banco recusa o login', outcome: 'fail' },
            { id: 'b', text: 'Entra com a versão 1', outcome: 'ok-v1' },
            { id: 'c', text: 'Entra com a versão 2', outcome: 'ok-v2' },
          ],
        },
        {
          id: 'sec.f03.m2.a3',
          kind: 'predict',
          title: 'Com dois usuários',
          prompt: 'O Secrets Manager gira a senha do banco com a estratégia de **usuários alternados**: a rotação troca a senha de um segundo usuário (o clone) e aponta o segredo para ele. A rotação terminou (finishSecret). Uma aplicação que guardou em cache a versão 1 do segredo, com o usuário original, conecta no banco. O que acontece?',
          concepts: [{ id: 'secret.strategies' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A rotação trocou a senha do clone; a do usuário original, da versão 1, continua valendo até a rotação seguinte.'],
          spec: { sim: 'secrets', strategy: 'alternating', moment: 'finishSecret', reader: 'cached' },
          options: [
            { id: 'a', text: 'Entra com a versão 1', outcome: 'ok-v1' },
            { id: 'b', text: 'O banco recusa o login', outcome: 'fail' },
          ],
        },
      ],
      debrief: { takeaways: ['AWSCURRENT só muda no finishSecret.', 'Usuário único: um intervalo curto de recusa; tenha nova tentativa.', 'Usuários alternados: as duas senhas valem depois da rotação.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f03.m3',
      title: 'Bancos, Regiões e cache',
      type: 'mission',
      summary: 'Rotação gerenciada, réplica em outra Região e o cache da aplicação.',
      briefing: {
        company: 'Plataforma de Cursos Aprende Já',
        role: 'Você prepara os segredos para a expansão.',
        situation: 'O banco principal é um RDS. A plataforma vai ter uma cópia de recuperação em outra Região. E a aplicação chama o Secrets Manager milhões de vezes por dia.',
        objective: 'Usar o que o serviço já faz pelos bancos, levar o segredo para outra Região e reduzir as chamadas.',
        successCriteria: ['Usar a rotação gerenciada', 'Replicar o segredo', 'Usar o cache com cuidado'],
      },
      intel: [
        { conceptId: 'secret.managed-rotation', body: ['RDS, Aurora, DocumentDB e Redshift fazem a **rotação gerenciada** da senha principal, **sem Lambda**.'] },
        { conceptId: 'secret.replication', body: ['A **réplica** leva o segredo para outras Regiões, e a rotação da principal chega às réplicas sozinha.'] },
        { conceptId: 'secret.caching', body: ['O **cache** reduz chamadas e atualiza a cada hora por padrão. Um cache mais antigo que a rotação ainda tem a senha velha.'] },
      ],
      activities: [
        {
          id: 'sec.f03.m3.a1',
          kind: 'decision',
          title: 'A senha principal do RDS',
          prompt: 'O time ia escrever uma função Lambda para girar a senha do usuário principal do RDS. O que sugerir?',
          concepts: [{ id: 'secret.managed-rotation' }, { id: 'db.secrets', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O RDS oferece a rotação gerenciada da senha principal com o Secrets Manager, sem função Lambda para manter.'],
          options: [
            { id: 'a', text: 'Deixar o RDS gerenciar a senha principal no Secrets Manager, com rotação gerenciada', correct: true, consequence: 'Nenhum código de rotação para manter.' },
            { id: 'b', text: 'Escrever e manter a função Lambda de rotação', correct: false, consequence: 'Funciona, mas o serviço já faz isso.' },
          ],
        },
        {
          id: 'sec.f03.m3.a2',
          kind: 'decision',
          title: 'O segredo na outra Região',
          prompt: 'Na Região de recuperação, a aplicação precisa ler o segredo mesmo que a Região principal esteja fora do ar. A senha gira toda semana. O que fazer?',
          concepts: [{ id: 'secret.replication' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A réplica fica na outra Região e recebe sozinha o valor novo de cada rotação.'],
          options: [
            { id: 'a', text: 'Replicar o segredo para a Região de recuperação', correct: true, consequence: 'A réplica responde mesmo com a principal fora do ar, sempre com a senha atual.' },
            { id: 'b', text: 'Criar um segredo separado na outra Região e copiar a senha à mão a cada rotação', correct: false, consequence: 'Na primeira semana em que alguém esquecer, a recuperação falha.' },
            { id: 'c', text: 'Fazer a aplicação da outra Região chamar o Secrets Manager da Região principal', correct: false, consequence: 'Funciona até a Região principal cair, que é justamente o caso.' },
          ],
        },
        {
          id: 'sec.f03.m3.a3',
          kind: 'decision',
          title: 'Cache de um dia',
          prompt: 'Para economizar, alguém configurou o cache do segredo para durar 24 horas. A senha gira com usuário único. O que esperar?',
          concepts: [{ id: 'secret.caching' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Depois da rotação, a cópia em cache ainda tem a senha velha, que o banco já não aceita. A aplicação precisa renovar o segredo ao receber erro de login, ou o cache precisa ser curto.'],
          options: [
            { id: 'a', text: 'Logins falham por até um dia depois de cada rotação, a menos que a aplicação busque o segredo de novo ao receber erro', correct: true, consequence: 'A economia de chamadas vira indisponibilidade.' },
            { id: 'b', text: 'Nada: o Secrets Manager avisa a aplicação a cada rotação', correct: false, consequence: 'O cache só renova no prazo dele.' },
          ],
        },
      ],
      debrief: { takeaways: ['Senha principal de RDS e Aurora: rotação gerenciada.', 'Réplica: o segredo e as rotações chegam às outras Regiões.', 'Cache curto ou nova busca ao receber erro de login.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f03.boss',
      title: 'A rotação passo a passo',
      type: 'boss',
      summary: 'Oito momentos, duas estratégias e o que acontece com o login em cada um.',
      briefing: {
        company: 'Plataforma de Cursos Aprende Já',
        role: 'Você explica a rotação ao time antes de ligá-la em produção.',
        situation: 'O time quer saber, para cada estratégia, o que acontece com uma aplicação que lê o segredo a cada conexão e com outra que guardou o segredo em cache antes da rotação.',
        objective: 'Prever o login em cada momento.',
        successCriteria: ['Os oito momentos certos'],
      },
      intel: [
        { conceptId: 'secret.rotation', body: ['A aplicação recebe sempre a versão com AWSCURRENT, que só muda no finishSecret.'] },
        { conceptId: 'secret.strategies', body: ['No usuário único, o banco aceita uma senha por vez. Nos usuários alternados, aceita a do usuário e a do clone.'] },
      ],
      activities: [
        {
          id: 'sec.f03.boss.a1',
          kind: 'lab',
          lab: 'secrets',
          title: 'O login em cada momento',
          prompt: 'Para cada momento, escolha o que acontece com o login.',
          concepts: [{ id: 'secret.rotation' }, { id: 'secret.strategies' }, { id: 'secret.caching' }],
          xp: 200,
          difficulty: 3,
          hints: ['No usuário único, entre o setSecret e o finishSecret, o banco já não aceita a versão que AWSCURRENT aponta.', 'Na rotação seguinte dos usuários alternados, a senha da versão 1 é que muda.'],
          explanation: [
            'Usuário único: entra com a versão 1 até o createSecret; falha entre o setSecret e o finishSecret; depois, entra com a versão 2. O cache com a versão 1 falha.',
            'Usuários alternados: a versão 1 vale até a rotação seguinte; depois dela, só as versões 2 e 3 valem.',
          ],
          config: APRENDE_ROTACAO,
        },
      ],
      debrief: { takeaways: ['A aplicação segue AWSCURRENT.', 'Usuário único tem um intervalo de recusa; alternados não.', 'Cache mais velho que a rotação quebra o login.'] },
    },
  ],
}
