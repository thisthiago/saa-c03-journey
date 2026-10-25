/**
 * Conceitos da Fase 4 — Certificados e TLS.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F04_SEC_CONCEPTS: ConceptDef[] = [
  {
    id: 'acm.what',
    title: 'AWS Certificate Manager',
    officialName: 'AWS Certificate Manager (ACM)',
    serviceIds: ['aws.acm'],
    summary: 'O **ACM** emite, importa, guarda e renova certificados TLS para os **serviços integrados**: load balancers, CloudFront, API Gateway, Amplify, Cognito e outros. Os certificados públicos do ACM **não têm custo**; os exportáveis são cobrados. Certificados do ACM são **regionais**.',
    facts: ['Para usar o mesmo domínio em load balancers de duas Regiões, é preciso um certificado em cada Região.', 'Um certificado não pode ser copiado entre Regiões.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "HTTPS no load balancer ou no CloudFront, com renovação automática e sem custo pelo certificado". A resposta é um certificado público do ACM.',
    },
    references: [R.acmWhat, R.acmServices],
    tags: ['seguranca'],
  },
  {
    id: 'acm.public-vs-imported',
    title: 'Certificado do ACM ou importado',
    officialName: 'ACM-issued and imported certificates',
    serviceIds: ['aws.acm'],
    summary: 'O certificado **emitido pelo ACM** vem da autoridade da Amazon e tem renovação gerenciada. O **importado** veio de outra autoridade: funciona nos mesmos serviços, mas o **ACM não o renova**. Quem importou acompanha o vencimento, obtém um novo e **reimporta**, o que mantém o ARN e as associações.',
    commonMistakes: ['Importar o certificado comprado de outra autoridade e esquecer da data de vencimento'],
    facts: ['O ACM envia eventos diários ao EventBridge a partir de 45 dias do vencimento para certificados importados e privados, e de 30 dias para os públicos.'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se o enunciado traz um certificado comprado de outra autoridade, ele pode ser importado no ACM, mas a renovação continua com a empresa; os eventos de vencimento no EventBridge ajudam a não esquecer.',
    },
    references: [R.acmImport, R.acmEvents],
    tags: ['seguranca'],
  },
  {
    id: 'acm.validation',
    title: 'Validação por DNS ou por e-mail',
    officialName: 'DNS validation and email validation',
    serviceIds: ['aws.acm', 'aws.route53'],
    summary: 'Antes de emitir um certificado público, o ACM confere que você controla o domínio. Na **validação por DNS**, você cria um registro CNAME; enquanto ele existir, a renovação é automática. Na **validação por e-mail**, alguém aprova um link enviado aos endereços administrativos do domínio, **inclusive a cada renovação**. A AWS recomenda DNS.',
    commonMistakes: ['Apagar o CNAME de validação achando que ele só servia na emissão'],
    facts: ['Com o Route 53, o ACM pode criar o registro de validação direto.', 'Um certificado validado por e-mail não passa a ser validado por DNS: é preciso pedir outro.', 'Para certificados usados com o CloudFront, há também a validação por HTTP.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "renovação totalmente automática". A resposta é a validação por DNS, com o CNAME mantido no DNS.',
    },
    references: [R.acmValidation],
    tags: ['seguranca'],
  },
  {
    id: 'acm.renewal',
    title: 'Renovação gerenciada',
    officialName: 'ACM managed renewal',
    serviceIds: ['aws.acm'],
    summary: 'Certificados públicos do ACM valem **198 dias**. A **45 dias** do vencimento, o ACM renova o certificado validado por DNS se ele está **em uso** num serviço integrado e o **CNAME** continua no DNS, mantendo o mesmo ARN. Importados, certificados sem uso e não exportados, e os validados por e-mail sem aprovação **não renovam sozinhos**.',
    commonMistakes: ['Emitir um certificado, não associá-lo a nada e esperar que ele renove'],
    facts: [
      'Se não consegue validar o domínio, o ACM envia eventos ao AWS Health e ao EventBridge a 30, 15, 7, 3 e 1 dia do vencimento.',
      'Certificados antigos de 395 dias renovam 60 dias antes e passam a valer 198 dias.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'A tarefa 1.3 do exame cita a renovação de certificados. Para renovar sozinho, o certificado precisa ser emitido pelo ACM, validado por DNS e estar em uso num serviço integrado.',
    },
    references: [R.acmRenewal, R.acmDnsRenewal, R.acmCharacteristics],
    tags: ['seguranca', 'disponibilidade'],
  },
  {
    id: 'acm.cloudfront-region',
    title: 'Certificado do CloudFront em us-east-1',
    officialName: 'ACM certificates for Amazon CloudFront',
    serviceIds: ['aws.acm', 'aws.cloudfront'],
    summary: 'Para usar um certificado do ACM numa distribuição do **CloudFront**, ele precisa ser pedido ou importado na Região **US East (N. Virginia)**, `us-east-1`, não importa onde fique a origem. A partir dali, ele é distribuído a todos os pontos de presença da distribuição.',
    commonMistakes: ['Pedir o certificado em sa-east-1, onde está o site, e não encontrá-lo no CloudFront'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se o certificado não aparece na distribuição do CloudFront, ele está na Região errada: precisa estar em us-east-1.',
    },
    references: [R.acmWhat, R.acmServices],
    tags: ['seguranca'],
  },
  {
    id: 'acm.tls-termination',
    title: 'Onde o TLS termina',
    officialName: 'TLS termination and end-to-end encryption',
    serviceIds: ['aws.acm', 'aws.elb', 'aws.cloudfront'],
    summary: 'O certificado do ACM fica no serviço que **termina o TLS**: o load balancer, o CloudFront ou o API Gateway. Dali até o destino, o tráfego vai como a configuração mandar: se a regra exige **criptografia de ponta a ponta**, o trecho entre o load balancer e as instâncias também precisa de TLS, com um certificado no servidor.',
    commonMistakes: ['Achar que o certificado no load balancer cifra também o tráfego até as instâncias'],
    facts: ['Para servir conteúdo por TLS, o load balancer precisa do certificado nele ou na instância de trás.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "criptografia de ponta a ponta até as instâncias". A resposta mantém o TLS também entre o load balancer e os alvos, com certificado nos servidores, ou usa um NLB com TLS passthrough.',
    },
    references: [R.acmServices],
    tags: ['seguranca'],
  },
  {
    id: 'acm.exportable',
    title: 'Certificado exportável e servidores próprios',
    officialName: 'ACM exportable public certificates',
    serviceIds: ['aws.acm', 'aws.ec2'],
    summary: 'Um certificado gerenciado do ACM **não é instalado direto** num servidor da instância EC2 (só com Nitro Enclaves). Para EC2, contêineres e servidores próprios, o ACM oferece **certificados públicos exportáveis**, que você baixa com a chave privada e instala; o ACM renova, mas a instalação da versão nova é com você.',
    facts: ['Certificados exportáveis valem 198 dias, renovam 45 dias antes e têm custo.', 'Para automatizar certificados públicos direto em instâncias EC2, a AWS indica o protocolo ACME.'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.acmExportable, R.acmServices],
    tags: ['seguranca'],
  },
]
