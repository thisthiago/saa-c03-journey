/**
 * Conceitos da Fase 6 — Roles na prática.
 * Fatos conferidos em 19/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_IAM_CONCEPTS: ConceptDef[] = [
  {
    id: 'iam.service-role',
    title: 'Service role',
    officialName: 'Service role',
    serviceIds: ['aws.iam'],
    summary: 'Role que um **serviço da AWS** assume para agir em seu nome (por exemplo, a role de execução de uma função Lambda). A trust policy cita o principal de serviço, como `lambda.amazonaws.com`, e **o administrador cria e edita** as permissões.',
    explanation: [
      'Quando um serviço da AWS precisa agir na sua conta (uma função Lambda gravando numa tabela, um build publicando artefatos), ele não usa chaves: assume uma role que confia nele. Você controla o que o serviço pode fazer pelas permissões dessa role.',
      'Exemplo: a role de execução de uma função Lambda confia em `lambda.amazonaws.com` e permite gravar logs no CloudWatch e fazer `dynamodb:PutItem` numa tabela. A função recebe credenciais temporárias dessa role, sem nenhuma chave no código.',
    ],
    comparisons: [
      { with: 'iam.service-linked-role', text: 'A service role é criada e editada por você. A service-linked role é definida pelo serviço, que fixa as permissões.' },
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "a função Lambda (ou outro serviço) precisa acessar um recurso". A resposta é dar a permissão à role de execução ou à service role do serviço, com menor privilégio, e não criar chaves de acesso.',
    },
    references: [R.roles],
    tags: ['seguranca'],
  },
  {
    id: 'iam.service-linked-role',
    title: 'Service-linked role',
    officialName: 'Service-linked role',
    serviceIds: ['aws.iam', 'aws.organizations'],
    summary: 'Role **ligada a um serviço** e definida por ele, com as permissões de que o serviço precisa. Você pode **visualizar**, mas não editar as permissões; em geral o serviço a cria quando você usa o recurso.',
    facts: ['SCPs e RCPs não limitam service-linked roles.', 'Service-linked roles não aceitam permissions boundary.', 'Especificar uma service-linked role explicitamente numa chamada também exige iam:PassRole.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.roles, R.serviceLinked, R.scps],
    tags: ['seguranca'],
  },
  {
    id: 'iam.instance-profile',
    title: 'Instance profile e credenciais no EC2',
    officialName: 'Instance profiles',
    serviceIds: ['aws.iam', 'aws.ec2'],
    summary: 'O **instance profile** leva a role para dentro da instância EC2 e contém **uma única role**. A aplicação obtém **credenciais temporárias** pelos metadados da instância (`iam/security-credentials/<role>`), e elas são **renovadas automaticamente** antes de expirar.',
    explanation: [
      'A instância não recebe a role diretamente: recebe o instance profile, um recipiente com uma role. O SDK da aplicação procura credenciais numa ordem definida e, numa instância com instance profile, encontra as credenciais temporárias no serviço de metadados, já renovadas.',
    ],
    commonMistakes: ['Guardar chaves de acesso num arquivo da instância em vez de usar o instance profile'],
    facts: [
      'O limite de uma role por instance profile não pode ser aumentado.',
      'No console, o instance profile é criado junto com a role; pela CLI ou API, ele é criado à parte.',
      'Uma role pode ser anexada a uma instância que já está rodando.',
      'Se a aplicação guarda as credenciais em cache, deve pedir novas a cada hora ou ao menos 15 minutos antes de expirarem.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "uma aplicação no EC2 precisa acessar o S3, o DynamoDB ou outro serviço". A resposta é uma role anexada à instância por um instance profile. Guardar chaves de acesso na instância, em arquivo ou variável de ambiente, é distrator.',
    },
    references: [R.ec2Roles, R.instanceProfiles],
    tags: ['seguranca'],
  },
  {
    id: 'iam.pass-role',
    title: 'iam:PassRole',
    officialName: 'iam:PassRole',
    serviceIds: ['aws.iam'],
    summary: 'Para entregar uma role a um serviço (lançar uma instância com instance profile, criar uma função Lambda), quem configura precisa da **permissão** `iam:PassRole` para aquela role. Restrinja pelo **ARN da role** e, se quiser, pelo serviço com `iam:PassedToService`.',
    explanation: [
      'O PassRole fecha uma brecha de escalada de privilégio. Quem cria uma instância, uma função Lambda ou uma stack escolhe qual role o recurso vai usar; sem controle, bastaria escolher uma role poderosa para ganhar as permissões dela. Com `iam:PassRole` restrito, cada pessoa só entrega aos serviços as roles autorizadas para ela.',
      'Exemplo: um desenvolvedor pode criar funções Lambda, mas o `iam:PassRole` dele só vale para roles com o prefixo `lambda-app-`. Ele não consegue criar uma função com a role de administração da conta.',
    ],
    consequences: ['Sem limitar PassRole, alguém que só pode lançar instâncias consegue lançar uma com uma role poderosa e usar as permissões dela.'],
    facts: [
      'PassRole é uma permissão, não uma chamada de API: não gera evento próprio no CloudTrail; o registro aparece na ação que criou o recurso.',
      'Só se passa role da mesma conta.',
      'A AWS não recomenda controlar PassRole por tags da role (aws:ResourceTag): o resultado não é confiável.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se o enunciado pede impedir que alguém ganhe mais permissões ao lançar instâncias ou criar funções com uma role privilegiada, a resposta é restringir iam:PassRole pelo ARN das roles permitidas.',
    },
    references: [R.passRole, R.ec2Roles],
    tags: ['seguranca'],
  },
  {
    id: 'iam.roles-anywhere',
    title: 'IAM Roles Anywhere',
    officialName: 'AWS Identity and Access Management Roles Anywhere',
    serviceIds: ['aws.iam-roles-anywhere'],
    summary: 'Servidores, contêineres e aplicações **fora da AWS** trocam um **certificado X.509** por **credenciais temporárias** de uma role. A CA é registrada como **trust anchor** (AWS Private CA ou CA externa) e um **profile** define as roles e a session policy.',
    explanation: [
      'Sem o Roles Anywhere, um servidor no data center que precisa chamar a AWS costuma usar as chaves de acesso de um usuário IAM. Com ele, o servidor prova a identidade com um certificado que a empresa já emite e recebe credenciais temporárias, como uma instância EC2 faria com uma role.',
    ],
    facts: ['A role precisa confiar no principal de serviço do Roles Anywhere; a trust policy amarra o trust anchor com aws:SourceArn.', 'Os recursos do Roles Anywhere são regionais.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "servidores fora da AWS precisam de credenciais para chamar APIs da AWS" sem chaves de longo prazo. Se a empresa tem uma infraestrutura de certificados (PKI), a resposta é o IAM Roles Anywhere.',
    },
    references: [R.rolesAnywhere, R.bestPractices],
    tags: ['seguranca', 'hibrido'],
  },
  {
    id: 'iam.cross-account-role',
    title: 'Entre contas: role ou política de recurso?',
    officialName: 'Cross-account access using roles or resource-based policies',
    serviceIds: ['aws.iam', 'aws.sts'],
    summary: 'Com uma **role entre contas**, quem assume **abre mão** das próprias permissões enquanto usa a role, e o acesso vale para qualquer serviço que a role permita. Com uma **política de recurso**, o principal **continua** com as permissões da conta dele: útil para copiar dados entre as duas contas.',
    explanation: [
      'Exemplo: uma conta de dados precisa copiar objetos de um bucket da conta de produção para um bucket próprio. Assumindo uma role na conta de produção, a sessão perderia o acesso ao bucket de destino. Com a bucket policy da produção liberando a leitura, a role da conta de dados lê de um lado e grava do outro.',
      '**Regra prática:** se o principal precisa usar recursos das duas contas ao mesmo tempo, prefira a política de recurso; se o serviço não tem política de recurso, use uma role.',
    ],
    facts: ['Use role quando o serviço não aceita política de recurso.', 'Roles e políticas de recurso só delegam acesso dentro de uma mesma partição (por exemplo, aws e aws-cn não se misturam).'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Questões entre contas costumam testar essa diferença: com a role entre contas, o principal troca as permissões dele pelas da role; com a política de recurso, ele mantém as dele.',
    },
    references: [R.crossAccountResource],
    tags: ['seguranca'],
  },
  {
    id: 'iam.confused-deputy',
    title: 'Assistente confuso e External ID',
    officialName: 'The confused deputy problem',
    serviceIds: ['aws.iam', 'aws.sts'],
    summary: 'Um terceiro com acesso a várias contas pode ser enganado para agir na conta errada. Entre contas, o terceiro gera um **External ID único** por cliente e a trust policy exige `sts:ExternalId`. Entre serviços, a política de recurso confere `aws:SourceArn` ou `aws:SourceAccount`.',
    explanation: [
      'Exemplo: uma empresa de monitoramento atende vários clientes e assume uma role na conta de cada um. Se um cliente mal-intencionado cadastrasse o ARN da role de outro cliente, a empresa poderia acabar acessando a conta errada em nome dele. O External ID, único por cliente e exigido na trust policy, impede essa troca.',
      '**Regra prática:** role para terceiros exige `sts:ExternalId` na trust policy; política de recurso que atende a serviços confere `aws:SourceArn` ou `aws:SourceAccount`.',
    ],
    facts: ['O External ID não é um segredo: ele impede que um cliente use o ARN da role de outro cliente.', 'aws:SourceArn e aws:SourceAccount só existem quando um principal de serviço chama em nome de um recurso.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "um fornecedor terceirizado precisa acessar a conta". A resposta é uma role entre contas com o ExternalId exigido na trust policy, e não um usuário IAM com chaves para o fornecedor.',
    },
    references: [R.confusedDeputy, R.conditionKeys],
    tags: ['seguranca'],
  },
  {
    id: 'ram.sharing',
    title: 'AWS RAM',
    officialName: 'AWS Resource Access Manager',
    serviceIds: ['aws.ram'],
    summary: 'Compartilha recursos (como subnets de uma VPC) com outras contas, com a organização ou com OUs, **sem duplicá-los**. Dentro da organização, o compartilhamento não precisa de convite.',
    explanation: [
      'Exemplo: a conta de rede cria a VPC e compartilha as sub-redes com as contas das aplicações, que lançam recursos nelas sem administrar a rede. A VPC continua única, com um só conjunto de rotas e conexões.',
    ],
    facts: ['Quem recebe o recurso continua sujeito às próprias políticas IAM e SCPs.', 'Não há cobrança adicional pelo RAM em si.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "compartilhar sub-redes, Transit Gateways ou outros recursos entre contas da organização sem duplicá-los". A resposta é o AWS RAM.',
    },
    references: [R.ram],
    tags: ['seguranca'],
  },
]
