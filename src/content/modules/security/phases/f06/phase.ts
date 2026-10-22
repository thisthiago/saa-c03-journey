/**
 * Fase 6 — Classificação e retenção de dados. Classificar por sensibilidade,
 * descoberta automática e trabalhos do Macie, identificadores e achados,
 * retenção imutável com Object Lock e Vault Lock.
 */
import type { PhaseDef } from '../../../../../engine/types'
import { META } from '../meta'

export const F06_SEC: PhaseDef = {
  ...META.f06,
  concepts: ['sec.data-classification', 'macie.sensitive-data', 'macie.discovery', 'macie.identifiers', 'macie.findings', 'sec.retention', 's3.object-lock', 'bkp.vault-lock'],
  availability: 'available',
  simplifications: ['O hospital, os buckets e os pacientes são fictícios.', 'Os achados do Macie aparecem resumidos, só com o tipo e o recurso.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f06.m1',
      title: 'Onde estão os dados pessoais',
      type: 'mission',
      summary: 'Classificar os dados e escolher entre a descoberta automática e o trabalho do Macie.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você responde pela proteção de dados de um hospital.',
        situation: 'O hospital tem 600 buckets, criados por equipes diferentes ao longo de oito anos. Ninguém sabe em quais há dados de pacientes.',
        objective: 'Descobrir onde há dados sensíveis sem abrir bucket por bucket.',
        successCriteria: ['Classificar os dados', 'Escolher a forma de descoberta do Macie'],
      },
      intel: [
        { conceptId: 'sec.data-classification', body: ['Primeiro se **classifica** pela sensibilidade; depois se escolhem os controles de cada classe.'] },
        { conceptId: 'macie.sensitive-data', body: ['O **Macie** procura dados sensíveis nos buckets do S3 e avisa sobre riscos de segurança deles.'] },
        { conceptId: 'macie.discovery', body: ['**Descoberta automática**: todo dia, amostras de todos os buckets, para saber onde olhar. **Trabalho**: análise completa dos buckets escolhidos, uma vez ou de forma recorrente.'] },
      ],
      activities: [
        {
          id: 'sec.f06.m1.a1',
          kind: 'classify',
          title: 'Qual a sensibilidade',
          prompt: 'Classifique cada conjunto de dados do hospital.',
          concepts: [{ id: 'sec.data-classification' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Dados de pacientes são os mais sensíveis; documentos internos ficam no meio; o que já é publicado no site é público.'],
          bins: [
            { id: 'public', label: 'Público' },
            { id: 'internal', label: 'Interno' },
            { id: 'sensitive', label: 'Sensível' },
          ],
          items: [
            { id: 'site', text: 'Horários de visita publicados no site', bin: 'public', explanation: 'Já é público.', concepts: ['sec.data-classification'] },
            { id: 'escala', text: 'Escala de plantão das equipes', bin: 'internal', explanation: 'Uso interno, sem dados de pacientes.', concepts: ['sec.data-classification'] },
            { id: 'laudos', text: 'Laudos de exames com nome e CPF dos pacientes', bin: 'sensitive', explanation: 'Dado pessoal de saúde.', concepts: ['sec.data-classification'] },
            { id: 'faturas', text: 'Faturas com número do cartão de crédito', bin: 'sensitive', explanation: 'Dado financeiro.', concepts: ['sec.data-classification'] },
          ],
        },
        {
          id: 'sec.f06.m1.a2',
          kind: 'decision',
          title: 'Seiscentos buckets',
          prompt: 'O hospital quer, primeiro, uma visão de onde pode haver dados sensíveis nos 600 buckets, sempre atualizada, sem escolher bucket por bucket. O que usar?',
          concepts: [{ id: 'macie.discovery' }, { id: 'macie.sensitive-data', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A descoberta automática do Macie avalia o inventário inteiro todo dia, por amostragem, e mostra onde vale olhar mais a fundo.'],
          options: [
            { id: 'a', text: 'A descoberta automática do Macie', correct: true, consequence: 'O mapa de sensibilidade aponta os buckets que pedem atenção.' },
            { id: 'b', text: 'Um trabalho do Macie que analisa todos os objetos dos 600 buckets', correct: false, consequence: 'Funciona, mas analisa tudo a fundo antes de saber onde olhar, e custa mais.' },
            { id: 'c', text: 'Amazon Inspector', correct: false, consequence: 'O Inspector procura vulnerabilidades de software.' },
          ],
        },
        {
          id: 'sec.f06.m1.a3',
          kind: 'decision',
          title: 'O bucket da auditoria',
          prompt: 'A descoberta automática apontou o bucket de exportações como provável lugar de CPFs. A auditoria quer uma análise completa dele todo mês. O que usar?',
          concepts: [{ id: 'macie.discovery' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O trabalho de descoberta analisa a fundo os buckets escolhidos e pode rodar de forma recorrente.'],
          options: [
            { id: 'a', text: 'Um trabalho do Macie recorrente, mensal, só nesse bucket', correct: true, consequence: 'Cada objeto é analisado, todo mês.' },
            { id: 'b', text: 'Confiar só na amostragem da descoberta automática', correct: false, consequence: 'A amostra mostra onde olhar; a auditoria quer tudo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Classificar antes de proteger.', 'Descoberta automática: onde olhar. Trabalho: olhar tudo ali.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f06.m2',
      title: 'O número do prontuário',
      type: 'mission',
      summary: 'Identificadores gerenciados e personalizados, e os dois tipos de achado do Macie.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você ajusta o Macie à realidade do hospital.',
        situation: 'O hospital identifica pacientes por um número de prontuário próprio, no formato VP-0000000. O Macie não reconhece esse número. E alguém desligou o bloqueio de acesso público de um bucket.',
        objective: 'Ensinar o Macie a achar o prontuário e ler os achados.',
        successCriteria: ['Criar um identificador personalizado', 'Separar achado de política de achado de dados'],
      },
      intel: [
        { conceptId: 'macie.identifiers', body: ['**Identificadores gerenciados**: mantidos pela AWS. **Personalizados**: uma expressão regular com palavras próximas, para dados próprios da empresa.'] },
        { conceptId: 'macie.findings', body: ['**De política**: a configuração do bucket ficou menos segura (`Policy:IAMUser/S3…`). **De dados sensíveis**: o objeto tem dados pessoais, financeiros ou credenciais (`SensitiveData:S3Object/…`).'] },
      ],
      activities: [
        {
          id: 'sec.f06.m2.a1',
          kind: 'decision',
          title: 'Ensinar o formato VP-0000000',
          prompt: 'Como fazer o Macie reconhecer o número de prontuário do hospital?',
          concepts: [{ id: 'macie.identifiers' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O identificador personalizado usa uma expressão regular e palavras próximas, como "prontuário".'],
          options: [
            { id: 'a', text: 'Criar um identificador personalizado com a expressão VP-[0-9]{7} e a palavra próxima "prontuário"', correct: true, consequence: 'Os achados passam a apontar os arquivos com prontuários.' },
            { id: 'b', text: 'Esperar que um identificador gerenciado reconheça o formato', correct: false, consequence: 'O formato é próprio do hospital; a AWS não o conhece.' },
          ],
        },
        {
          id: 'sec.f06.m2.a2',
          kind: 'classify',
          title: 'Política ou dados',
          prompt: 'Classifique cada achado do Macie pelo tipo.',
          concepts: [{ id: 'macie.findings' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Achados Policy:IAMUser/S3… falam da configuração do bucket; SensitiveData:S3Object/… falam do conteúdo de um objeto.'],
          bins: [
            { id: 'policy', label: 'Achado de política' },
            { id: 'data', label: 'Achado de dados sensíveis' },
          ],
          items: [
            { id: 'bpa', text: 'Policy:IAMUser/S3BlockPublicAccessDisabled no bucket de exportações', bin: 'policy', explanation: 'O bloqueio de acesso público foi desligado.', concepts: ['macie.findings'] },
            { id: 'personal', text: 'SensitiveData:S3Object/Personal num CSV de altas', bin: 'data', explanation: 'O arquivo tem dados pessoais.', concepts: ['macie.findings'] },
            { id: 'shared', text: 'Policy:IAMUser/S3BucketSharedExternally no bucket de laudos', bin: 'policy', explanation: 'O bucket foi compartilhado com uma conta de fora da organização.', concepts: ['macie.findings'] },
            { id: 'creds', text: 'SensitiveData:S3Object/Credentials num arquivo de configuração antigo', bin: 'data', explanation: 'O arquivo tem chaves ou senhas.', concepts: ['macie.findings'] },
          ],
        },
      ],
      debrief: { takeaways: ['Dado próprio da empresa: identificador personalizado.', 'Policy: a configuração do bucket. SensitiveData: o conteúdo do objeto.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f06.m3',
      title: 'Vinte anos sem apagar',
      type: 'mission',
      summary: 'Retenção imutável no S3 e nos backups, e o descarte no fim do prazo.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você cuida da retenção dos registros médicos.',
        situation: 'A norma manda guardar prontuários por 20 anos sem possibilidade de exclusão, nem por administradores. Os backups do banco também não podem ser apagados antes do prazo. Depois dos 20 anos, os dados devem ser descartados.',
        objective: 'Garantir a retenção imutável e o descarte no fim.',
        successCriteria: ['Usar o Object Lock no modo certo', 'Escolher o modo do Vault Lock', 'Descartar no fim do prazo'],
      },
      intel: [
        { conceptId: 'sec.retention', body: ['Retenção exigida por lei pede dados **imutáveis**: **Object Lock** no S3, **Vault Lock** nos backups. No fim do prazo, o **ciclo de vida** apaga.'] },
        { conceptId: 's3.object-lock', body: ['No **modo conformidade** do Object Lock, ninguém apaga nem encurta a retenção, nem a conta raiz.'] },
        { conceptId: 'bkp.vault-lock', body: ['**Governança**: quem tem a permissão tira a trava. **Conformidade**: depois da carência de no mínimo **3 dias**, o cofre fica imutável, nem a AWS muda.'] },
      ],
      activities: [
        {
          id: 'sec.f06.m3.a1',
          kind: 'decision',
          title: 'Os prontuários no S3',
          prompt: 'Os prontuários ficam no S3 e não podem ser apagados por ninguém durante 20 anos. O que configurar?',
          concepts: [{ id: 's3.object-lock' }, { id: 'sec.retention', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Object Lock em modo conformidade impede a exclusão até o fim da retenção, para qualquer usuário.'],
          options: [
            { id: 'a', text: 'Object Lock em modo conformidade, com retenção de 20 anos', correct: true, consequence: 'Ninguém apaga nem encurta a retenção.' },
            { id: 'b', text: 'Uma política de bucket que nega a exclusão', correct: false, consequence: 'Um administrador pode mudar a política.' },
            { id: 'c', text: 'Object Lock em modo governança', correct: false, consequence: 'Quem tem a permissão especial ainda consegue apagar.' },
          ],
        },
        {
          id: 'sec.f06.m3.a2',
          kind: 'decision',
          title: 'Os backups do banco',
          prompt: 'Os backups do banco ficam num cofre do AWS Backup e também não podem ser apagados por ninguém antes do prazo. Qual modo do Vault Lock?',
          concepts: [{ id: 'bkp.vault-lock' }],
          xp: 50,
          difficulty: 2,
          explanation: ['No modo conformidade, depois da carência, nem a conta raiz nem a AWS apagam os backups antes do fim da retenção. No governança, quem tem a permissão do IAM tira a trava.'],
          options: [
            { id: 'a', text: 'Modo conformidade, com carência de alguns dias para conferir a configuração', correct: true, consequence: 'Depois da carência, o cofre fica imutável.' },
            { id: 'b', text: 'Modo governança', correct: false, consequence: 'Um administrador com a permissão consegue tirar a trava.' },
          ],
        },
        {
          id: 'sec.f06.m3.a3',
          kind: 'decision',
          title: 'Depois dos 20 anos',
          prompt: 'A norma também manda descartar os prontuários depois dos 20 anos. O que configurar no bucket?',
          concepts: [{ id: 'sec.retention' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Uma regra de ciclo de vida apaga os objetos depois do prazo. Enquanto a retenção do Object Lock vale, a exclusão não acontece.'],
          options: [
            { id: 'a', text: 'Uma regra de ciclo de vida que expira os objetos depois de 20 anos', correct: true, consequence: 'O descarte acontece sozinho, no fim do prazo.' },
            { id: 'b', text: 'Uma pessoa que apaga os arquivos antigos uma vez por ano', correct: false, consequence: 'Depende de alguém lembrar, por 20 anos.' },
          ],
        },
      ],
      debrief: { takeaways: ['Retenção por lei: imutabilidade, não só permissão.', 'Modo conformidade no Object Lock e no Vault Lock.', 'Ciclo de vida para descartar no fim do prazo.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f06.boss',
      title: 'O CSV das altas',
      type: 'boss',
      summary: 'Achados do Macie, um bucket exposto e o caminho até a correção.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você investiga um alerta do Macie.',
        situation: 'O Macie gerou vários achados no mesmo dia. Uma equipe de relatórios exportou dados de altas para um bucket que um parceiro acessa.',
        objective: 'Descobrir o risco real e corrigir.',
        successCriteria: ['Marcar as linhas que importam', 'Escolher a causa e as correções'],
      },
      intel: [
        { conceptId: 'macie.findings', body: ['Achado de política e achado de dados no mesmo bucket juntos formam o risco: dado sensível num bucket aberto.'] },
        { conceptId: 'sec.data-classification', body: ['Dado sensível não vai para um bucket compartilhado sem controle.'] },
      ],
      activities: [
        {
          id: 'sec.f06.boss.a1',
          kind: 'investigate',
          title: 'Os achados do dia',
          prompt: 'Leia os achados, marque os que formam o risco e escolha a causa e as correções.',
          concepts: [{ id: 'macie.findings' }, { id: 'sec.data-classification', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          explanation: ['O bucket de exportações teve o bloqueio de acesso público desligado e foi compartilhado com uma conta de fora da organização. No mesmo bucket, o Macie achou CPFs nos CSVs de altas. Os outros achados são de buckets sem relação.'],
          scenario: ['Formato simplificado: tipo do achado e recurso.'],
          artifacts: [
            {
              id: 'macie',
              title: 'Achados do Macie no dia',
              format: 'log',
              lines: [
                { id: 'l1', text: 'Policy:IAMUser/S3BlockPublicAccessDisabled      bucket exportacoes-relatorios', isIssue: true, explanation: 'O bucket perdeu o bloqueio de acesso público.' },
                { id: 'l2', text: 'Policy:IAMUser/S3BucketSharedExternally          bucket exportacoes-relatorios', isIssue: true, explanation: 'O bucket foi aberto a uma conta de fora.' },
                { id: 'l3', text: 'SensitiveData:S3Object/Personal                  exportacoes-relatorios/altas-out.csv', isIssue: true, explanation: 'Os CSVs têm dados pessoais.' },
                { id: 'l4', text: 'SensitiveData:S3Object/Personal                  laudos-2019/laudo-8812.pdf', isIssue: false, explanation: 'Laudo num bucket privado, onde ele deve estar.' },
                { id: 'l5', text: 'Policy:IAMUser/S3BucketSharedWithCloudFront      site-institucional', isIssue: false, explanation: 'O site é servido pelo CloudFront, como esperado.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é o risco?',
            options: [
              { id: 'a', text: 'CSVs com dados pessoais num bucket aberto a uma conta de fora e sem bloqueio de acesso público', correct: true, feedback: 'É a combinação dos três achados do mesmo bucket.' },
              { id: 'b', text: 'Laudos no bucket de 2019', correct: false, feedback: 'Laudos num bucket privado estão no lugar certo.' },
              { id: 'c', text: 'O site servido pelo CloudFront', correct: false, feedback: 'Compartilhar o bucket do site com o CloudFront é o esperado.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções fazem sentido?',
            options: [
              { id: 'a', text: 'Religar o bloqueio de acesso público e tirar o acesso da conta de fora', correct: true, feedback: 'Fecha a exposição.' },
              { id: 'b', text: 'Entregar ao parceiro só os dados de que ele precisa, sem CPF, por um caminho controlado', correct: true, feedback: 'O parceiro continua atendido, sem receber dados pessoais.' },
              { id: 'c', text: 'Desligar o Macie para parar os alertas', correct: false, feedback: 'Os alertas são o que mostrou o problema.' },
            ],
          },
        },
      ],
      debrief: { takeaways: ['Achado de política mais achado de dados no mesmo bucket: risco real.', 'Corrigir a exposição e entregar só o necessário.'] },
    },
  ],
}
