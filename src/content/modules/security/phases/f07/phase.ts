/**
 * Fase 7 — Postura de segurança e conformidade. Security Hub CSPM, padrões e
 * controles, a dependência do AWS Config, o Security Hub, a visão de várias
 * contas, o AWS Artifact e quem prova o quê na auditoria.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FindingsLabConfig } from '../../../../../simulators/findings/lab'
import { META } from '../meta'

export const PAGFACIL_FINDINGS: FindingsLabConfig = {
  actions: [
    { id: 'bpa', label: 'Religar o bloqueio de acesso público do bucket' },
    { id: 'tls', label: 'Negar na política do bucket as requisições sem TLS' },
    { id: 'versao', label: 'Ligar o versionamento do bucket' },
    { id: 'isolar', label: 'Isolar a instância e investigar' },
    { id: 'patch', label: 'Atualizar o pacote nas instâncias afetadas' },
  ],
  findings: [
    { id: 's38', type: '[S3.8] S3 general purpose buckets should block public access', detail: 'Bucket recibos-clientes, controle do padrão PCI DSS.', action: 'bpa', why: 'O controle falha porque o bloqueio de acesso público está desligado no bucket.', concepts: ['shub.cspm', 'shub.standards'] },
    { id: 's35', type: '[S3.5] S3 general purpose buckets should require requests to use TLS', detail: 'Bucket transacoes-diarias.', action: 'tls', why: 'O controle pede um Deny para aws:SecureTransport igual a false na política do bucket.', concepts: ['shub.cspm'] },
    { id: 'cfg', type: 's3-bucket-versioning-enabled: NON_COMPLIANT', detail: 'Bucket copias-conciliacao, avaliado por uma regra do AWS Config.', action: 'versao', why: 'A regra avalia se o versionamento está ligado.', concepts: ['shub.cspm'] },
    { id: 'macie', type: 'Policy:IAMUser/S3BlockPublicAccessDisabled', detail: 'Bucket recibos-clientes, o mesmo do controle S3.8.', action: 'bpa', why: 'O mesmo problema visto pelo Macie: a configuração do bucket ficou menos segura.', concepts: ['shub.cspm'] },
    { id: 'cc', type: 'Backdoor:EC2/C&CActivity.B', detail: 'Uma instância da conciliação fala com um servidor de comando e controle conhecido.', action: 'isolar', why: 'Instância falando com comando e controle está comprometida: isolar e investigar.', concepts: ['shub.cspm'] },
    { id: 'pkg', type: 'Package vulnerability: CVE-2021-44228 no pacote log4j', detail: 'Três imagens de contêiner no ECR.', action: 'patch', why: 'Vulnerabilidade conhecida se corrige atualizando a biblioteca e reconstruindo a imagem.', concepts: ['shub.cspm'] },
  ],
}

export const F07_SEC: PhaseDef = {
  ...META.f07,
  concepts: ['shub.cspm', 'shub.security-hub', 'shub.standards', 'shub.aggregation', 'cfg.what', 'artifact.what', 'sec.compliance-evidence', 'srm.model'],
  availability: 'available',
  simplifications: ['O gateway de pagamentos, as contas e os achados são fictícios.', 'No Security Hub CSPM, os achados de todos os serviços chegam num formato único; aqui cada um aparece com o formato do serviço de origem.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f07.m1',
      title: 'Conferir contra o padrão',
      type: 'mission',
      summary: 'Security Hub CSPM, padrões, controles e o AWS Config.',
      briefing: {
        company: 'PagFácil',
        role: 'Você prepara um gateway de pagamentos para a certificação PCI DSS.',
        situation: 'A empresa tem 8 contas e nenhuma visão de quais configurações fogem das boas práticas. A consultoria pediu os controles do PCI DSS conferidos sem parar.',
        objective: 'Ligar a checagem de postura e entender do que ela depende.',
        successCriteria: ['Ligar o Security Hub CSPM com o padrão certo', 'Ligar o que ele precisa para checar os controles'],
      },
      intel: [
        { conceptId: 'shub.cspm', body: ['O **Security Hub CSPM** confere as contas contra **padrões** e gera um achado por **controle** que falha. Também reúne achados do GuardDuty, do Inspector e do Macie. Para a maioria dos controles, o **AWS Config** precisa estar gravando.'] },
        { conceptId: 'shub.standards', body: ['Padrões: **AWS Foundational Security Best Practices**, **CIS**, **PCI DSS**, **NIST** e outros. Ligar um padrão liga todos os controles dele.'] },
        { conceptId: 'cfg.what', body: ['O **AWS Config** grava a configuração dos recursos e avalia regras sobre ela.'] },
      ],
      activities: [
        {
          id: 'sec.f07.m1.a1',
          kind: 'decision',
          title: 'O padrão da certificação',
          prompt: 'A consultoria quer ver os controles do PCI DSS conferidos o tempo todo nas 8 contas. O que ligar?',
          concepts: [{ id: 'shub.standards' }, { id: 'shub.cspm', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Security Hub CSPM tem o padrão PCI DSS pronto, com os controles e a nota de segurança.'],
          options: [
            { id: 'a', text: 'O Security Hub CSPM com o padrão PCI DSS', correct: true, consequence: 'Cada controle que falha vira um achado, com a correção recomendada.' },
            { id: 'b', text: 'O GuardDuty', correct: false, consequence: 'O GuardDuty detecta ameaças, não confere configurações contra um padrão.' },
            { id: 'c', text: 'Uma planilha revisada todo trimestre', correct: false, consequence: 'O controle precisa ser conferido sem parar.' },
          ],
        },
        {
          id: 'sec.f07.m1.a2',
          kind: 'decision',
          title: 'Controles sem resultado',
          prompt: 'O Security Hub CSPM foi ligado, mas quase nenhum controle mostra resultado. O GuardDuty e o Inspector já estão ligados. O que falta?',
          concepts: [{ id: 'shub.cspm' }, { id: 'cfg.what', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A maioria dos controles é checada por regras do AWS Config, que precisa estar ligado e gravando os recursos.'],
          options: [
            { id: 'a', text: 'Ligar o AWS Config com a gravação dos recursos', correct: true, consequence: 'Os controles passam a ser avaliados.' },
            { id: 'b', text: 'Ligar o Detective', correct: false, consequence: 'O Detective investiga achados; não avalia controles.' },
            { id: 'c', text: 'Esperar 30 dias, até o fim do teste gratuito', correct: false, consequence: 'O teste gratuito não muda o que é avaliado.' },
          ],
        },
        {
          id: 'sec.f07.m1.a3',
          kind: 'decision',
          title: 'Achados antigos',
          prompt: 'O Security Hub CSPM foi ligado hoje em sa-east-1. A consultoria quer ver os achados do GuardDuty do mês passado e os de us-east-1 no mesmo painel. O que esperar?',
          concepts: [{ id: 'shub.cspm' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O Security Hub CSPM só reúne achados gerados depois de ser ligado, e só na Região em que foi ligado. Para ver outras Regiões num painel, é preciso ligá-lo nelas e usar uma Região de agregação.'],
          options: [
            { id: 'a', text: 'Só os achados novos de sa-east-1 aparecem; é preciso ligá-lo em us-east-1 e agregar as Regiões', correct: true, consequence: 'O painel passa a cobrir as duas Regiões daqui para a frente.' },
            { id: 'b', text: 'Aparece tudo, de todas as Regiões e desde sempre', correct: false, consequence: 'Ele não busca achados anteriores nem de outras Regiões sozinho.' },
          ],
        },
      ],
      debrief: { takeaways: ['Security Hub CSPM: padrões, controles e nota.', 'Sem o AWS Config, a maioria dos controles não roda.', 'Só achados novos e da Região ligada.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f07.m2',
      title: 'Um painel para tudo',
      type: 'mission',
      summary: 'Security Hub e Security Hub CSPM, e a visão de várias contas e Regiões.',
      briefing: {
        company: 'PagFácil',
        role: 'Você organiza a visão de segurança da empresa.',
        situation: 'Os achados vêm de vários serviços e contas, e o time não sabe quais riscos são mais graves quando combinados, como uma instância vulnerável e exposta à internet.',
        objective: 'Correlacionar os achados e ver todas as contas e Regiões juntas.',
        successCriteria: ['Entender Security Hub e Security Hub CSPM', 'Montar a agregação'],
      },
      intel: [
        { conceptId: 'shub.security-hub', body: ['O **Security Hub CSPM** checa a postura. O **Security Hub** correlaciona esses achados com os do Inspector, do GuardDuty e do Macie para apontar **exposições**. A AWS recomenda os dois.'] },
        { conceptId: 'shub.aggregation', body: ['**Conta administradora** e **Região de agregação**: achados de todas as contas e Regiões num painel.'] },
      ],
      activities: [
        {
          id: 'sec.f07.m2.a1',
          kind: 'decision',
          title: 'Vulnerável e exposta',
          prompt: 'O time quer que o painel aponte primeiro as combinações perigosas, como uma instância com CVE crítica que também está exposta à internet. O que ligar além do Security Hub CSPM?',
          concepts: [{ id: 'shub.security-hub' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Security Hub correlaciona os achados de postura com os do Inspector, do GuardDuty e do Macie e aponta as exposições mais críticas.'],
          options: [
            { id: 'a', text: 'O Security Hub, junto com o Security Hub CSPM, o Inspector e o GuardDuty', correct: true, consequence: 'As exposições aparecem priorizadas.' },
            { id: 'b', text: 'Só o Security Hub, desligando o CSPM', correct: false, consequence: 'Sem o CSPM, o Security Hub não usa os achados de postura para apontar riscos.' },
          ],
        },
        {
          id: 'sec.f07.m2.a2',
          kind: 'decision',
          title: 'Oito contas, três Regiões',
          prompt: 'A segurança quer um único painel com as 8 contas e as 3 Regiões usadas. O que configurar?',
          concepts: [{ id: 'shub.aggregation' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Uma conta administradora na organização vê as contas-membro; a Região de agregação junta os achados das Regiões ligadas.'],
          options: [
            { id: 'a', text: 'Uma conta administradora delegada e uma Região de agregação, com o serviço ligado nas 3 Regiões', correct: true, consequence: 'Um painel com tudo.' },
            { id: 'b', text: 'Abrir o console de cada conta em cada Região', correct: false, consequence: 'São 24 consoles para olhar.' },
          ],
        },
      ],
      debrief: { takeaways: ['CSPM checa; Security Hub correlaciona e prioriza.', 'Administradora e Região de agregação: um painel só.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f07.m3',
      title: 'As provas da auditoria',
      type: 'mission',
      summary: 'O AWS Artifact e quem prova cada parte da conformidade.',
      briefing: {
        company: 'PagFácil',
        role: 'Você reúne as provas para o auditor do PCI DSS.',
        situation: 'O auditor pediu o relatório PCI da própria AWS, a prova de que os buckets de transações exigem TLS e o registro de quem mudou a política de um bucket no mês passado.',
        objective: 'Saber de onde vem cada prova.',
        successCriteria: ['Usar o Artifact para a parte da AWS', 'Usar os próprios registros para a parte da empresa'],
      },
      intel: [
        { conceptId: 'artifact.what', body: ['O **Artifact** entrega, sem custo, os relatórios de conformidade **da própria AWS** (SOC, PCI, ISO) e guarda os acordos com a AWS.'] },
        { conceptId: 'sec.compliance-evidence', body: ['**Parte da AWS**: Artifact. **Parte da empresa**: controles do Security Hub CSPM, histórico e regras do AWS Config, trilhas do CloudTrail.'] },
        { conceptId: 'srm.model', body: ['O **modelo de responsabilidade compartilhada** separa a segurança **da** nuvem, da AWS, da segurança **na** nuvem, do cliente.'] },
      ],
      activities: [
        {
          id: 'sec.f07.m3.a1',
          kind: 'classify',
          title: 'De onde vem cada prova',
          prompt: 'Classifique cada pedido do auditor pela fonte da prova.',
          concepts: [{ id: 'sec.compliance-evidence' }, { id: 'artifact.what', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O que a AWS controla se prova com o Artifact. O que a empresa configura se prova com os registros dela: Security Hub CSPM, AWS Config e CloudTrail.'],
          bins: [
            { id: 'artifact', label: 'AWS Artifact' },
            { id: 'shub', label: 'Security Hub CSPM' },
            { id: 'trail', label: 'CloudTrail' },
          ],
          items: [
            { id: 'pci', text: 'O relatório de conformidade PCI DSS da AWS', bin: 'artifact', explanation: 'Documento da AWS sobre a parte dela.', concepts: ['artifact.what'] },
            { id: 'soc', text: 'O relatório SOC dos data centers da AWS', bin: 'artifact', explanation: 'Também da parte da AWS.', concepts: ['artifact.what'] },
            { id: 'tls', text: 'A situação do controle que exige TLS nos buckets de transações', bin: 'shub', explanation: 'Controle de configuração da empresa.', concepts: ['sec.compliance-evidence'] },
            { id: 'who', text: 'Quem mudou a política do bucket de recibos no mês passado', bin: 'trail', explanation: 'Chamada de API registrada pelo CloudTrail.', concepts: ['sec.compliance-evidence'] },
          ],
        },
        {
          id: 'sec.f07.m3.a2',
          kind: 'decision',
          title: 'O Artifact prova tudo?',
          prompt: 'Um gerente sugere entregar ao auditor só os relatórios do Artifact, "porque a AWS já é certificada". O que responder?',
          concepts: [{ id: 'sec.compliance-evidence' }, { id: 'srm.model', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Artifact prova a parte da AWS. A configuração dos buckets, das contas e dos acessos é responsabilidade da empresa e precisa das provas dela.'],
          options: [
            { id: 'a', text: 'Não basta: o Artifact prova a parte da AWS; a configuração da empresa se prova com os registros dela', correct: true, consequence: 'O auditor recebe as duas partes.' },
            { id: 'b', text: 'Basta: a certificação da AWS cobre os recursos dos clientes', correct: false, consequence: 'A segurança na nuvem é do cliente.' },
          ],
        },
      ],
      debrief: { takeaways: ['Artifact: relatórios da AWS, sem custo.', 'A parte da empresa se prova com Security Hub CSPM, Config e CloudTrail.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f07.boss',
      title: 'O painel da véspera',
      type: 'boss',
      summary: 'Seis achados de quatro origens na véspera da auditoria.',
      briefing: {
        company: 'PagFácil',
        role: 'Você limpa o painel antes da auditoria.',
        situation: 'Na véspera da auditoria, o painel tem seis achados vindos de controles do Security Hub CSPM, de uma regra do AWS Config, do Macie, do GuardDuty e do Inspector.',
        objective: 'Dizer a origem de cada achado e a ação certa.',
        successCriteria: ['A origem certa', 'A ação certa'],
      },
      intel: [
        { conceptId: 'shub.cspm', body: ['Controle do Security Hub CSPM: ID entre colchetes, como [S3.8]. Regra do AWS Config: nome em minúsculas com hífens e o resultado.'] },
        { conceptId: 'shub.standards', body: ['O mesmo problema pode aparecer em dois serviços: o controle e o Macie podem apontar o mesmo bucket.'] },
      ],
      activities: [
        {
          id: 'sec.f07.boss.a1',
          kind: 'lab',
          lab: 'findings',
          title: 'Limpar o painel',
          prompt: 'Para cada achado, escolha a origem e a ação.',
          concepts: [{ id: 'shub.cspm' }, { id: 'shub.standards' }],
          xp: 200,
          difficulty: 3,
          hints: ['Colchetes com um ID como [S3.5] são controles do Security Hub CSPM.', 'Policy:IAMUser/S3… é do Macie; Backdoor:EC2/… é do GuardDuty.'],
          explanation: [
            'Security Hub CSPM: [S3.8] (bloqueio de acesso público) e [S3.5] (TLS). AWS Config: versionamento. Macie: bloqueio de acesso público desligado, o mesmo bucket do S3.8.',
            'GuardDuty: comando e controle (isolar). Inspector: log4j nas imagens (atualizar).',
          ],
          config: PAGFACIL_FINDINGS,
        },
      ],
      debrief: { takeaways: ['Cada origem tem o próprio formato.', 'Dois achados podem apontar o mesmo problema.', 'Controle que falha mostra a correção.'] },
    },
  ],
}
