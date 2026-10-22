/**
 * Fase 5 — Detecção de ameaças. GuardDuty (fontes básicas, planos de
 * proteção e achados), Inspector, Detective, a diferença entre detectar,
 * avaliar e investigar, e a administração central na organização.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FindingsLabConfig } from '../../../../../simulators/findings/lab'
import { META } from '../meta'

export const ENTREGA_ACTIONS = [
  { id: 'isolar', label: 'Isolar a instância e investigar' },
  { id: 'chave', label: 'Desativar a chave de acesso e revisar o que ela fez' },
  { id: 'patch', label: 'Atualizar o pacote nas instâncias afetadas' },
  { id: 'sg', label: 'Fechar a porta no security group' },
  { id: 'segredo', label: 'Tirar a credencial do código e usar o Secrets Manager' },
]

export const ENTREGA_FINDINGS: FindingsLabConfig = {
  actions: ENTREGA_ACTIONS,
  findings: [
    { id: 'mine', type: 'CryptoCurrency:EC2/BitcoinTool.B!DNS', detail: 'A instância de relatórios consulta um domínio ligado a mineração de bitcoin.', action: 'isolar', why: 'A instância provavelmente foi comprometida: isolar e investigar antes de qualquer outra coisa.', concepts: ['gd.findings', 'gd.what'] },
    { id: 'ip', type: 'UnauthorizedAccess:IAMUser/MaliciousIPCaller', detail: 'A chave de acesso do usuário deploy chamou APIs de um IP que está numa lista de ameaças.', action: 'chave', why: 'Uma credencial usada de um IP malicioso deve ser desativada já, e o histórico dela revisado no CloudTrail.', concepts: ['gd.findings'] },
    { id: 'cve', type: 'Package vulnerability: CVE-2024-6387 no pacote openssh', detail: '14 instâncias da frota de rastreamento têm a versão vulnerável.', action: 'patch', why: 'Vulnerabilidade conhecida num pacote se corrige atualizando o pacote.', concepts: ['insp.what', 'insp.finding-types'] },
    { id: 'reach', type: 'Network reachability: porta 22 alcançável a partir do internet gateway', detail: 'A instância de manutenção aceita SSH de qualquer endereço da internet.', action: 'sg', why: 'Porta exposta sem necessidade se fecha no security group; o Session Manager dispensa a porta 22.', concepts: ['insp.finding-types'] },
    { id: 'probe', type: 'Recon:EC2/PortProbeUnprotectedPort', detail: 'Alguém de fora está sondando a porta 22 desprotegida da instância de manutenção.', action: 'sg', why: 'A sondagem só acha a porta porque ela está aberta: fechá-la tira o alvo.', concepts: ['gd.findings'] },
    { id: 'code', type: 'Code vulnerability: credencial escrita no código da função calcula-frete', detail: 'A função Lambda tem a senha de uma API de parceiro no código-fonte.', action: 'segredo', why: 'Credencial no código vaza com o código; o lugar dela é um serviço de segredos.', concepts: ['insp.finding-types'] },
  ],
}

export const F05_SEC: PhaseDef = {
  ...META.f05,
  concepts: ['gd.what', 'gd.protection-plans', 'gd.findings', 'insp.what', 'insp.finding-types', 'det.what', 'sec.detect-assess-investigate', 'sec.delegated-admin'],
  availability: 'available',
  simplifications: ['A empresa, as instâncias e os achados são fictícios; os tipos de achado seguem o formato de cada serviço.', 'Os achados reais trazem muito mais campos, como gravidade, conta, Região e horário.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f05.m1',
      title: 'Ligar o alarme da conta',
      type: 'mission',
      summary: 'O que o GuardDuty analisa, os planos de proteção e o formato dos achados.',
      briefing: {
        company: 'Entrega Certa',
        role: 'Você é a primeira pessoa de segurança de uma startup de logística.',
        situation: 'A startup tem 40 instâncias, um cluster EKS, buckets com comprovantes de entrega e um RDS. Ninguém sabe se alguém está usando credenciais roubadas ou minerando criptomoeda nas máquinas.',
        objective: 'Ligar a detecção de ameaças e entender o que ela olha.',
        successCriteria: ['Saber o que já vem ligado', 'Ligar cada plano ao recurso que ele protege', 'Ler um tipo de achado'],
      },
      intel: [
        { conceptId: 'gd.what', body: ['O **GuardDuty** analisa, assim que é ligado, os **eventos de gerenciamento do CloudTrail**, os **VPC Flow Logs** e os **logs de DNS**. Não é preciso ligar nada disso antes.'] },
        { conceptId: 'gd.protection-plans', body: ['Planos opcionais: **S3 Protection**, **EKS Protection**, **Runtime Monitoring**, **Malware Protection**, **RDS Protection**, **Lambda Protection** e **AI Protection**.'] },
        { conceptId: 'gd.findings', body: ['Formato **Propósito:Recurso/Família**, como `UnauthorizedAccess:EC2/SSHBruteForce`. Cada achado vai para o **EventBridge**.'] },
      ],
      activities: [
        {
          id: 'sec.f05.m1.a1',
          kind: 'decision',
          title: 'O que ligar antes',
          prompt: 'Antes de ligar o GuardDuty, alguém quer criar uma trilha do CloudTrail e ligar os VPC Flow Logs de todas as VPCs. Isso é necessário?',
          concepts: [{ id: 'gd.what' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O GuardDuty consome as fontes básicas sozinho, sem depender das suas trilhas e dos seus Flow Logs. Eles continuam úteis para outras coisas, como auditoria.'],
          options: [
            { id: 'a', text: 'Não: o GuardDuty já analisa CloudTrail, Flow Logs e DNS sem ligar nada antes', correct: true, consequence: 'A detecção começa no mesmo minuto.' },
            { id: 'b', text: 'Sim: sem a trilha e os Flow Logs, o GuardDuty não tem dados', correct: false, consequence: 'O GuardDuty não depende deles para as fontes básicas.' },
          ],
        },
        {
          id: 'sec.f05.m1.a2',
          kind: 'match',
          title: 'Cada plano no seu recurso',
          prompt: 'Associe cada preocupação ao plano de proteção do GuardDuty.',
          concepts: [{ id: 'gd.protection-plans' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada plano olha uma fonte a mais: eventos de dados do S3, logs de auditoria do EKS, logins no RDS, eventos do sistema operacional, arquivos com malware.'],
          leftLabel: 'Preocupação',
          rightLabel: 'Plano',
          pairs: [
            { id: 's3', left: 'Alguém baixando todos os comprovantes do bucket', right: 'S3 Protection', explanation: 'Olha os eventos de dados do S3.', concepts: ['gd.protection-plans'] },
            { id: 'rds', left: 'Tentativas suspeitas de login no RDS', right: 'RDS Protection', explanation: 'Analisa os logins no RDS e no Aurora.', concepts: ['gd.protection-plans'] },
            { id: 'eks', left: 'Chamadas estranhas à API do Kubernetes no cluster', right: 'EKS Protection', explanation: 'Analisa os logs de auditoria do EKS.', concepts: ['gd.protection-plans'] },
            { id: 'malware', left: 'Arquivo malicioso enviado ao bucket de uploads', right: 'Malware Protection for S3', explanation: 'Varre os objetos novos do bucket.', concepts: ['gd.protection-plans'] },
          ],
        },
        {
          id: 'sec.f05.m1.a3',
          kind: 'decision',
          title: 'Ler o achado',
          prompt: 'Chegou o achado `UnauthorizedAccess:EC2/SSHBruteForce`. O que ele diz?',
          concepts: [{ id: 'gd.findings' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Propósito: acesso não autorizado. Recurso: uma instância EC2. Família: força bruta no SSH.'],
          options: [
            { id: 'a', text: 'Alguém está tentando adivinhar a senha do SSH de uma instância EC2', correct: true, consequence: 'Fechar a porta 22 para a internet tira o alvo.' },
            { id: 'b', text: 'Um pacote do SSH tem uma vulnerabilidade conhecida', correct: false, consequence: 'Isso seria um achado do Inspector.' },
            { id: 'c', text: 'Um bucket ficou público', correct: false, consequence: 'O recurso do achado é uma instância EC2.' },
          ],
        },
      ],
      debrief: { takeaways: ['GuardDuty: fontes básicas sem ligar nada antes.', 'Planos de proteção para S3, EKS, RDS, malware e mais.', 'O tipo do achado diz o propósito, o recurso e a família.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f05.m2',
      title: 'O que está vulnerável',
      type: 'mission',
      summary: 'O Inspector, os tipos de achado dele e a diferença para o GuardDuty.',
      briefing: {
        company: 'Entrega Certa',
        role: 'Você monta o controle de vulnerabilidades.',
        situation: 'Saiu uma vulnerabilidade grave no OpenSSH. O time não sabe quais instâncias, imagens de contêiner e funções têm a versão afetada.',
        objective: 'Achar o que está vulnerável e separar isso de ameaças em curso.',
        successCriteria: ['Usar o Inspector', 'Classificar os tipos de achado', 'Separar detectar de avaliar'],
      },
      intel: [
        { conceptId: 'insp.what', body: ['O **Inspector** varre **continuamente** instâncias EC2, imagens do ECR e funções Lambda atrás de **vulnerabilidades de software** e **exposição de rede**.'] },
        { conceptId: 'insp.finding-types', body: ['**Package vulnerability** (EC2, ECR, Lambda), **Code vulnerability** (Lambda) e **Network reachability** (só EC2).'] },
        { conceptId: 'sec.detect-assess-investigate', body: ['**Ameaça agora?** GuardDuty. **O que está vulnerável?** Inspector. **De onde veio?** Detective.'] },
      ],
      activities: [
        {
          id: 'sec.f05.m2.a1',
          kind: 'decision',
          title: 'A frota afetada',
          prompt: 'É preciso saber, sem instalar ferramenta nova em cada máquina e sem agendar varreduras, quais instâncias, imagens e funções têm o OpenSSH vulnerável. O que usar?',
          concepts: [{ id: 'insp.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Inspector descobre os recursos e varre de novo quando sai uma CVE nova, sem agendamento.'],
          options: [
            { id: 'a', text: 'Amazon Inspector', correct: true, consequence: 'Os achados mostram cada recurso com a versão afetada.' },
            { id: 'b', text: 'Amazon GuardDuty', correct: false, consequence: 'O GuardDuty detecta comportamento suspeito, não pacotes vulneráveis.' },
            { id: 'c', text: 'Amazon Macie', correct: false, consequence: 'O Macie procura dados sensíveis no S3.' },
          ],
        },
        {
          id: 'sec.f05.m2.a2',
          kind: 'classify',
          title: 'Três tipos de achado',
          prompt: 'Classifique cada achado pelo tipo do Inspector.',
          concepts: [{ id: 'insp.finding-types' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Pacote com CVE, trecho de código explorável e porta alcançável de fora são os três tipos.'],
          bins: [
            { id: 'pkg', label: 'Package vulnerability' },
            { id: 'code', label: 'Code vulnerability' },
            { id: 'net', label: 'Network reachability' },
          ],
          items: [
            { id: 'openssl', text: 'A imagem de contêiner no ECR tem uma biblioteca com CVE conhecida', bin: 'pkg', explanation: 'Pacote vulnerável numa imagem.', concepts: ['insp.finding-types'] },
            { id: 'hardcoded', text: 'A função Lambda tem uma senha escrita no código', bin: 'code', explanation: 'Trecho de código explorável.', concepts: ['insp.finding-types'] },
            { id: 'port', text: 'A porta 3389 da instância é alcançável a partir do internet gateway', bin: 'net', explanation: 'Caminho de rede aberto até a instância.', concepts: ['insp.finding-types'] },
          ],
        },
        {
          id: 'sec.f05.m2.a3',
          kind: 'classify',
          title: 'Detectar, avaliar ou investigar',
          prompt: 'Classifique cada pergunta pelo serviço que a responde.',
          concepts: [{ id: 'sec.detect-assess-investigate' }],
          xp: 50,
          difficulty: 2,
          explanation: ['GuardDuty detecta ameaças em curso, o Inspector avalia vulnerabilidades e o Detective investiga a origem e o alcance.'],
          bins: [
            { id: 'gd', label: 'GuardDuty' },
            { id: 'insp', label: 'Inspector' },
            { id: 'det', label: 'Detective' },
          ],
          items: [
            { id: 'now', text: 'Há uma instância falando com um servidor de comando e controle agora?', bin: 'gd', explanation: 'Ameaça em curso.', concepts: ['sec.detect-assess-investigate'] },
            { id: 'cve', text: 'Quais imagens de contêiner têm a CVE publicada ontem?', bin: 'insp', explanation: 'Avaliação de vulnerabilidade.', concepts: ['sec.detect-assess-investigate'] },
            { id: 'how', text: 'Que outras APIs a role suspeita chamou nas últimas semanas?', bin: 'det', explanation: 'Investigação do alcance.', concepts: ['sec.detect-assess-investigate'] },
          ],
        },
      ],
      debrief: { takeaways: ['Inspector: vulnerabilidades e portas expostas, sem agendar varredura.', 'GuardDuty: comportamento suspeito.', 'Cada pergunta tem o seu serviço.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f05.m3',
      title: 'De onde veio e quem vê tudo',
      type: 'mission',
      summary: 'O Detective e a administração central na organização.',
      briefing: {
        company: 'Entrega Certa',
        role: 'Você organiza a detecção para várias contas.',
        situation: 'A startup cresceu para 12 contas na organização. Um achado do GuardDuty apontou uma role suspeita, e a diretoria quer saber o que mais essa role fez.',
        objective: 'Investigar a origem e ver os achados de todas as contas num lugar só.',
        successCriteria: ['Usar o Detective', 'Usar o administrador delegado'],
      },
      intel: [
        { conceptId: 'det.what', body: ['O **Detective** monta um **grafo de comportamento** com CloudTrail, Flow Logs e achados do GuardDuty, com até um ano de histórico, para investigar a causa.'] },
        { conceptId: 'sec.delegated-admin', body: ['Com o **AWS Organizations**, uma conta vira **administradora delegada**, liga o serviço nas contas-membro e vê todos os achados.'] },
      ],
      activities: [
        {
          id: 'sec.f05.m3.a1',
          kind: 'decision',
          title: 'O que mais a role fez',
          prompt: 'A diretoria quer saber, a partir do achado do GuardDuty, quais recursos a role suspeita tocou nas últimas semanas e se isso foge do normal dela. O que usar?',
          concepts: [{ id: 'det.what' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Detective liga o achado ao histórico de comportamento da role e mostra o que mudou, sem montar consultas à mão.'],
          options: [
            { id: 'a', text: 'Abrir o achado no Amazon Detective', correct: true, consequence: 'O grafo mostra as chamadas e os recursos ligados à role.' },
            { id: 'b', text: 'Ligar o Inspector', correct: false, consequence: 'O Inspector procura vulnerabilidades, não investiga o comportamento de uma role.' },
            { id: 'c', text: 'Esperar o GuardDuty gerar mais achados', correct: false, consequence: 'O GuardDuty detecta; quem investiga a origem é o Detective.' },
          ],
        },
        {
          id: 'sec.f05.m3.a2',
          kind: 'decision',
          title: 'Doze contas, um painel',
          prompt: 'Cada uma das 12 contas tem o próprio GuardDuty e o próprio Inspector, e ninguém olha todas. Contas novas entram todo mês. O que fazer?',
          concepts: [{ id: 'sec.delegated-admin' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com uma conta de segurança como administradora delegada no Organizations, os serviços ficam ligados em todas as contas, inclusive nas novas, e os achados se reúnem.'],
          options: [
            { id: 'a', text: 'Definir uma conta de segurança como administradora delegada no Organizations, com ativação automática nas contas novas', correct: true, consequence: 'Um painel para todas as contas, sem configurar uma por uma.' },
            { id: 'b', text: 'Pedir a cada time que confira o próprio console toda semana', correct: false, consequence: 'Nada garante que alguém olhe.' },
          ],
        },
      ],
      debrief: { takeaways: ['Detective: de onde veio e até onde foi.', 'Administrador delegado: todas as contas, inclusive as novas, num lugar só.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f05.boss',
      title: 'A fila de achados',
      type: 'boss',
      summary: 'Seis achados, a origem de cada um e o que fazer.',
      briefing: {
        company: 'Entrega Certa',
        role: 'Você faz a primeira triagem da fila de segurança.',
        situation: 'Na segunda-feira, a fila amanheceu com seis achados de serviços diferentes. Cada um pede uma ação diferente.',
        objective: 'Dizer quem gerou cada achado e qual é a ação certa.',
        successCriteria: ['A origem certa de cada achado', 'A ação certa de cada achado'],
      },
      intel: [
        { conceptId: 'gd.findings', body: ['Propósito:Recurso/Família é o formato do GuardDuty.'] },
        { conceptId: 'insp.finding-types', body: ['Package vulnerability, Code vulnerability e Network reachability são os tipos do Inspector.'] },
      ],
      activities: [
        {
          id: 'sec.f05.boss.a1',
          kind: 'lab',
          lab: 'findings',
          title: 'A triagem',
          prompt: 'Para cada achado, escolha quem o gerou e o que fazer.',
          concepts: [{ id: 'gd.findings' }, { id: 'insp.finding-types' }, { id: 'sec.detect-assess-investigate' }],
          xp: 200,
          difficulty: 3,
          hints: ['O formato do tipo entrega o serviço.', 'Ameaça em curso pede contenção; vulnerabilidade pede correção.'],
          explanation: [
            'GuardDuty: mineração (isolar), IP malicioso (desativar a chave) e sondagem de porta (fechar a porta).',
            'Inspector: CVE no OpenSSH (atualizar), porta 22 alcançável (fechar a porta) e credencial no código (Secrets Manager).',
          ],
          config: ENTREGA_FINDINGS,
        },
      ],
      debrief: { takeaways: ['O formato do tipo diz quem gerou o achado.', 'Ameaça: conter. Vulnerabilidade: corrigir.', 'Porta exposta e sondagem pedem a mesma ação.'] },
    },
  ],
}
