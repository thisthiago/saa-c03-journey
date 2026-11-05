/**
 * Questões da Revisão da Fase 9 de Segurança (escolhendo a proteção), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'sec.f09',
  questions: [
    {
      id: 'rv:sec.f09.m1.a2',
      kind: 'decision',
      title: 'Buckets sem criptografia no último ano',
      prompt:
        'O auditor quer a lista dos buckets que **estiveram sem criptografia padrão em algum momento** do último ano, com as datas de início e fim de cada período. A equipe quer o serviço que responde **direto**, sem montar a resposta a partir de chamadas de API. Qual serviço atende?',
      concepts: [{ id: 'sec.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'AWS CloudTrail.', correct: false, consequence: 'Mostra quem chamou as APIs, não o estado de cada bucket ao longo do tempo.' },
        { id: 'b', text: 'Amazon Macie.', correct: false, consequence: 'Procura dados sensíveis nos objetos, não o histórico de configuração.' },
        { id: 'c', text: 'AWS Config.', correct: true, consequence: 'O histórico mostra a configuração de cada bucket em cada momento.' },
        { id: 'd', text: 'Amazon GuardDuty.', correct: false, consequence: 'Detecta ameaças; não guarda a configuração dos buckets.' },
      ],
      explanation: [
        'O **AWS Config** guarda o **histórico de configuração** de cada recurso e avalia regras sobre ele: responde direto "como o recurso estava, e desde quando". O **CloudTrail** mostra as **chamadas de API** que mudaram a configuração, mas não a situação de cada bucket ao longo do tempo.',
        'O Macie procura dados sensíveis, e o GuardDuty detecta ameaças.',
        '**Regra prática:** "quem fez o quê" é CloudTrail; "como o recurso está e estava" é Config. Não confunda os dois.',
      ],
    },
    {
      id: 'rv:sec.f09.m1.a1:macie',
      kind: 'decision',
      title: 'Cada pergunta com o seu serviço',
      prompt:
        'Depois de um incidente, a equipe de segurança listou perguntas e o serviço que pretende usar para responder a cada uma. Quais associações estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'sec.choose' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Há dados pessoais de alunos nesse bucket? Amazon Macie.', correct: true, consequence: 'O Macie procura dados sensíveis, como dados pessoais, no S3.' },
        { id: 'b', text: 'Alguém está usando credenciais roubadas agora? Amazon GuardDuty.', correct: true, consequence: 'O GuardDuty detecta ameaças em andamento.' },
        { id: 'c', text: 'Quem desligou o versionamento do bucket? AWS Config.', correct: false, consequence: 'Quem fez a chamada de API está no CloudTrail; o Config mostra o estado.' },
        { id: 'd', text: 'Como as contas estão diante do CIS? Amazon Detective.', correct: false, consequence: 'Postura diante de padrões é do Security Hub CSPM.' },
        { id: 'e', text: 'Quais instâncias têm pacotes vulneráveis? Amazon Macie.', correct: false, consequence: 'Vulnerabilidades de software são do Inspector.' },
      ],
      explanation: [
        'Cada serviço responde uma pergunta. **Quem fez o quê?** CloudTrail. **Como o recurso está configurado e estava antes?** Config. **Há ameaça agora?** GuardDuty. **O que está vulnerável?** Inspector. **Onde estão os dados pessoais?** Macie. **Como chegou aqui?** Detective. **Como estou diante dos padrões?** Security Hub CSPM.',
        'Os erros trocam Config e CloudTrail, Detective e Security Hub CSPM, Macie e Inspector.',
        '**Regra prática:** identifique a pergunta antes do serviço; cada um dos sete responde uma só.',
      ],
    },
    {
      id: 'rv:sec.f09.investigar-e-comparar',
      kind: 'decision',
      title: 'Como o atacante entrou e como estão as contas',
      prompt:
        'Depois de um achado do GuardDuty, a diretoria quer duas respostas: **como o atacante chegou** à instância e o que mais ele tocou; e, em seguida, **como as contas estão diante do CIS AWS Foundations Benchmark**, de forma contínua. O AWS Config já grava os recursos. Qual combinação atende?',
      concepts: [{ id: 'sec.choose' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Inspector para a investigação e Macie para o CIS.', correct: false, consequence: 'O Inspector aponta vulnerabilidades, e o Macie procura dados sensíveis.' },
        { id: 'b', text: 'CloudTrail lido à mão para os dois casos.', correct: false, consequence: 'Dá trabalho para investigar e não confere as contas contra o CIS.' },
        { id: 'c', text: 'GuardDuty de novo para a investigação e Config sozinho para o CIS.', correct: false, consequence: 'O GuardDuty detecta, não investiga; o Config grava, mas os controles do CIS vêm do Security Hub CSPM.' },
        { id: 'd', text: 'Detective para a investigação e Security Hub CSPM com o CIS.', correct: true, consequence: 'O Detective mostra o caminho e o alcance; o Security Hub CSPM confere as contas contra o CIS.' },
      ],
      explanation: [
        '**Como chegou aqui e até onde foi** é a pergunta do **Detective**, que parte do achado e monta o grafo de comportamento. **Como estou diante dos padrões** é a pergunta do **Security Hub CSPM**, que, com o Config gravando, confere as contas contra o CIS e gera um achado por controle que falha.',
        'Inspector e Macie respondem outras perguntas. Ler o CloudTrail à mão não escala. E o GuardDuty não investiga.',
        '**Regra prática:** investigação, Detective; postura diante de padrões, Security Hub CSPM com o Config.',
      ],
    },
    {
      id: 'rv:sec.f09.m2.a1:kms',
      kind: 'decision',
      title: 'Ferramentas trocadas de lugar',
      prompt:
        'Numa revisão, a segurança encontrou: a **senha do banco**, que precisa girar todo mês, guardada como texto cifrado pelo **KMS** num arquivo; e o **certificado TLS** do portal guardado no **Secrets Manager**, instalado à mão no balanceador. A empresa quer cada item na ferramenta certa, com o **menor esforço** de operação. Qual reorganização atende?',
      concepts: [{ id: 'sec.which-protection' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Secrets Manager para a senha; ACM para o certificado.', correct: true, consequence: 'A senha gira sozinha, e o certificado é renovado pelo ACM no serviço que termina o TLS.' },
        { id: 'b', text: 'Senha e certificado no Parameter Store, como SecureString.', correct: false, consequence: 'O Parameter Store não gira a senha nem renova o certificado.' },
        { id: 'c', text: 'Senha e certificado no KMS, cifrados com a mesma chave.', correct: false, consequence: 'O KMS cifra dados; não gira senhas nem entrega certificados aos serviços.' },
        { id: 'd', text: 'Senha e certificado num cluster do CloudHSM.', correct: false, consequence: 'É um HSM dedicado para chaves, sem rotação de senha nem certificados nos balanceadores.' },
      ],
      explanation: [
        'Cada ferramenta protege uma coisa. **Dados em repouso**: KMS (e CloudHSM só se a regra pedir HSM dedicado). **Senhas que precisam girar**: Secrets Manager. **Configuração**, mesmo cifrada: Parameter Store. **Dados em trânsito**: certificado do **ACM** no serviço que termina o TLS.',
        'Guardar senhas no KMS ou certificados no Secrets Manager mistura as ferramentas e deixa a rotação e a renovação com a equipe. Parameter Store e CloudHSM também não fazem isso.',
        '**Regra prática:** chave, KMS; senha que gira, Secrets Manager; configuração, Parameter Store; HTTPS, ACM.',
      ],
    },
    {
      id: 'rv:sec.f09.m2.a1:ps',
      kind: 'decision',
      title: 'Endereços por ambiente e HTTPS no portal',
      prompt:
        'Uma empresa precisa guardar o **endereço do servidor de e-mail** de cada ambiente, sem rotação, e ter **HTTPS no load balancer** do portal, com renovação automática, tudo com o **menor custo e esforço**. Quais escolhas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'sec.which-protection' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'O endereço no Parameter Store padrão.', correct: true, consequence: 'É configuração sem rotação, guardada sem custo extra.' },
        { id: 'b', text: 'Um certificado público do ACM no load balancer.', correct: true, consequence: 'Sem custo pelo certificado e com renovação gerenciada.' },
        { id: 'c', text: 'O endereço no Secrets Manager, com rotação desligada.', correct: false, consequence: 'Paga um segredo por mês para um valor de configuração.' },
        { id: 'd', text: 'Um certificado guardado no Secrets Manager e instalado à mão.', correct: false, consequence: 'A renovação e a instalação ficam com a equipe.' },
        { id: 'e', text: 'O endereço num cluster do CloudHSM.', correct: false, consequence: 'Paga HSMs por hora para guardar uma configuração.' },
      ],
      explanation: [
        '**Configuração** sem rotação vai para o **Parameter Store**, sem custo extra no nível padrão. **HTTPS** num balanceador é um **certificado público do ACM**, sem custo e renovado automaticamente quando validado por DNS e em uso.',
        'Secrets Manager e CloudHSM cobram por algo que o caso não usa. E um certificado guardado à mão perde a renovação gerenciada.',
        '**Regra prática:** escolha a ferramenta pelo que ela faz por você: rotação, renovação ou só guarda; pague só pelo que usar.',
      ],
    },
  ],
}
