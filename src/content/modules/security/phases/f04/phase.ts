/**
 * Fase 4 — Certificados e TLS. O ACM, certificados emitidos e importados,
 * validação por DNS e por e-mail, renovação gerenciada, a Região do
 * CloudFront, onde o TLS termina e os certificados exportáveis.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { CertsLabConfig } from '../../../../../simulators/certs/lab'
import type { Certificate } from '../../../../../simulators/certs/model'
import { META } from '../meta'

const site: Certificate = { id: 'site', domain: 'loja.cuidar.com.br', source: 'acm', validation: 'dns', cnamePresent: true, region: 'sa-east-1', attachedTo: 'alb' }

export const CUIDAR_CERTS: CertsLabConfig = {
  certificates: [
    { ...site, concepts: ['acm.renewal', 'acm.validation'] },
    { id: 'www', domain: 'www.cuidar.com.br', source: 'acm', validation: 'dns', cnamePresent: true, region: 'sa-east-1', attachedTo: 'cloudfront', concepts: ['acm.cloudfront-region', 'acm.renewal'] },
    { id: 'api', domain: 'api.cuidar.com.br', source: 'acm', validation: 'dns', cnamePresent: false, region: 'sa-east-1', attachedTo: 'alb', concepts: ['acm.validation', 'acm.renewal'] },
    { id: 'intranet', domain: 'intranet.cuidar.com.br', source: 'imported', region: 'sa-east-1', attachedTo: 'alb', concepts: ['acm.public-vs-imported'] },
    { id: 'receitas', domain: 'receitas.cuidar.com.br', source: 'acm', validation: 'email', region: 'sa-east-1', attachedTo: 'alb', concepts: ['acm.validation'] },
    { id: 'legado', domain: 'legado.cuidar.com.br', source: 'acm', validation: 'dns', cnamePresent: true, region: 'sa-east-1', attachedTo: 'ec2', concepts: ['acm.exportable', 'acm.renewal'] },
    { id: 'static', domain: 'static.cuidar.com.br', source: 'acm', validation: 'dns', cnamePresent: true, region: 'us-east-1', attachedTo: 'cloudfront', concepts: ['acm.cloudfront-region'] },
  ],
}

export const F04_SEC: PhaseDef = {
  ...META.f04,
  concepts: ['acm.what', 'acm.tls-termination', 'db.tls', 'acm.public-vs-imported', 'acm.validation', 'acm.renewal', 'acm.cloudfront-region', 'acm.exportable'],
  availability: 'available',
  simplifications: ['A rede de farmácias, os domínios e os certificados são fictícios.', 'Todos os certificados do laboratório estão a menos de 45 dias do vencimento.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f04.m1',
      title: 'O cadeado do site',
      type: 'mission',
      summary: 'O ACM, onde o certificado fica e onde o TLS termina.',
      briefing: {
        company: 'Rede de Farmácias Cuidar',
        role: 'Você cuida da segurança da loja on-line de uma rede de farmácias.',
        situation: 'A loja roda em instâncias atrás de um Application Load Balancer, e o navegador mostra "não seguro". Uma norma de saúde pede que os dados de receitas viajem cifrados até o servidor.',
        objective: 'Colocar o certificado no lugar certo e cifrar o caminho inteiro.',
        successCriteria: ['Usar o ACM no load balancer', 'Cifrar também o trecho até as instâncias'],
      },
      intel: [
        { conceptId: 'acm.what', body: ['O **ACM** emite certificados públicos **sem custo** para os serviços integrados: load balancers, CloudFront, API Gateway e outros. Cada certificado é de uma Região.'] },
        { conceptId: 'acm.tls-termination', body: ['O certificado fica onde o TLS **termina**. Se a regra pede criptografia **de ponta a ponta**, o trecho entre o load balancer e as instâncias também precisa de TLS.'] },
      ],
      activities: [
        {
          id: 'sec.f04.m1.a1',
          kind: 'decision',
          title: 'Um certificado para a loja',
          prompt: 'O ALB da loja precisa de HTTPS com um certificado público que não dê trabalho para renovar. O que fazer?',
          concepts: [{ id: 'acm.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O ACM emite o certificado público sem custo e, validado por DNS e em uso no ALB, renova sozinho.'],
          options: [
            { id: 'a', text: 'Pedir um certificado público no ACM, validado por DNS, e associá-lo ao listener HTTPS do ALB', correct: true, consequence: 'O cadeado aparece, e a renovação fica com o ACM.' },
            { id: 'b', text: 'Comprar um certificado de outra autoridade e instalá-lo em cada instância', correct: false, consequence: 'Funciona, mas a renovação e a instalação ficam com o time.' },
            { id: 'c', text: 'Ligar a criptografia do EBS das instâncias', correct: false, consequence: 'Protege os discos, não o tráfego do navegador.' },
          ],
        },
        {
          id: 'sec.f04.m1.a2',
          kind: 'decision',
          title: 'Cifrado até o servidor',
          prompt: 'A norma pede que as receitas viajem cifradas até o servidor da aplicação. O ALB termina o TLS e fala com as instâncias por HTTP. O que falta?',
          concepts: [{ id: 'acm.tls-termination' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O certificado no ALB cifra só o trecho do navegador até o ALB. Para cifrar até a instância, o ALB precisa falar HTTPS com as instâncias, que precisam de um certificado no servidor.'],
          options: [
            { id: 'a', text: 'Configurar o target group em HTTPS, com um certificado nos servidores das instâncias', correct: true, consequence: 'O trecho interno também passa a ser cifrado.' },
            { id: 'b', text: 'Nada: o certificado do ALB já cifra até as instâncias', correct: false, consequence: 'O TLS termina no ALB.' },
          ],
        },
        {
          id: 'sec.f04.m1.a3',
          kind: 'decision',
          title: 'E o banco de dados?',
          prompt: 'A aplicação também envia as receitas ao banco RDS. Como cifrar esse trecho?',
          concepts: [{ id: 'db.tls' }, { id: 'acm.tls-termination', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['A conexão com o banco usa TLS, e o banco pode exigir conexões cifradas. A criptografia do armazenamento protege os dados gravados, não a conexão.'],
          options: [
            { id: 'a', text: 'Conectar ao banco com TLS e exigir conexões cifradas no banco', correct: true, consequence: 'O trecho até o banco fica cifrado.' },
            { id: 'b', text: 'Ligar a criptografia do armazenamento do RDS', correct: false, consequence: 'É criptografia em repouso, não em trânsito.' },
          ],
        },
      ],
      debrief: { takeaways: ['ACM: certificado público sem custo nos serviços integrados.', 'O certificado fica onde o TLS termina.', 'Ponta a ponta: cada trecho com o próprio TLS.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f04.m2',
      title: 'Quem renova o quê',
      type: 'mission',
      summary: 'Validação por DNS e por e-mail, renovação gerenciada e certificados importados.',
      briefing: {
        company: 'Rede de Farmácias Cuidar',
        role: 'Você faz o inventário dos certificados.',
        situation: 'No ano passado, um certificado venceu num sábado e a loja ficou fora do ar. Hoje há certificados emitidos pelo ACM, um importado de outra autoridade e um validado por e-mail.',
        objective: 'Saber quais certificados se renovam sozinhos.',
        successCriteria: ['Prever a renovação de cada certificado', 'Cuidar do certificado importado'],
      },
      intel: [
        { conceptId: 'acm.validation', body: ['**DNS**: um registro CNAME que, enquanto existir, permite a renovação automática. **E-mail**: alguém aprova um link a cada renovação. A AWS recomenda DNS.'] },
        { conceptId: 'acm.renewal', body: ['A **45 dias** do vencimento, o ACM renova o certificado validado por DNS, **em uso** e com o **CNAME** no lugar. Certificados públicos do ACM valem **198 dias**.'] },
        { conceptId: 'acm.public-vs-imported', body: ['O ACM **não renova** certificados **importados**: é preciso obter outro e reimportar, o que mantém o ARN.'] },
      ],
      activities: [
        {
          id: 'sec.f04.m2.a1',
          kind: 'predict',
          title: 'O certificado da loja',
          prompt: 'loja.cuidar.com.br: emitido pelo ACM, validado por DNS, com o CNAME no DNS e associado ao ALB. O que acontece perto do vencimento?',
          concepts: [{ id: 'acm.renewal' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Validado por DNS, em uso e com o CNAME: renovação automática, sem ninguém agir.'],
          spec: { sim: 'certs', cert: site, measure: 'renewal' },
          options: [
            { id: 'a', text: 'Renova sozinho', outcome: 'auto' },
            { id: 'b', text: 'Só renova se alguém agir', outcome: 'action' },
            { id: 'c', text: 'Vence sem renovar', outcome: 'expires' },
          ],
        },
        {
          id: 'sec.f04.m2.a2',
          kind: 'predict',
          title: 'O CNAME apagado',
          prompt: 'Numa arrumação do DNS, alguém apagou o CNAME de validação de api.cuidar.com.br, que está em uso no ALB. O que acontece perto do vencimento?',
          concepts: [{ id: 'acm.validation' }, { id: 'acm.renewal', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Sem o CNAME, o ACM não consegue revalidar o domínio e avisa pelo AWS Health e pelo EventBridge. Recolocar o registro resolve.'],
          spec: { sim: 'certs', cert: { ...site, id: 'api', domain: 'api.cuidar.com.br', cnamePresent: false }, measure: 'renewal' },
          options: [
            { id: 'a', text: 'Só renova se alguém agir', outcome: 'action' },
            { id: 'b', text: 'Renova sozinho', outcome: 'auto' },
            { id: 'c', text: 'Vence sem renovar', outcome: 'expires' },
          ],
        },
        {
          id: 'sec.f04.m2.a3',
          kind: 'decision',
          title: 'O certificado importado',
          prompt: 'O certificado da intranet foi comprado de outra autoridade e importado no ACM. Ele vence em 40 dias. O que fazer?',
          concepts: [{ id: 'acm.public-vs-imported' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O ACM não renova importados. Reimportar o certificado novo mantém o ARN e as associações. Os eventos de vencimento do ACM ajudam a não esquecer.'],
          options: [
            { id: 'a', text: 'Obter o certificado novo com a autoridade e reimportá-lo, com uma regra do EventBridge avisando os próximos vencimentos', correct: true, consequence: 'O ALB continua apontando para o mesmo ARN, agora com o certificado novo.' },
            { id: 'b', text: 'Esperar o ACM renovar', correct: false, consequence: 'O ACM não renova certificados importados.' },
            { id: 'c', text: 'Trocar por um certificado do ACM só depois que ele vencer', correct: false, consequence: 'A intranet fica fora do ar até a troca.' },
          ],
        },
      ],
      debrief: { takeaways: ['DNS, em uso e com CNAME: renova sozinho.', 'E-mail ou CNAME apagado: precisa de ação.', 'Importado: reimportar antes do vencimento.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f04.m3',
      title: 'CloudFront e servidores próprios',
      type: 'mission',
      summary: 'A Região do certificado do CloudFront, certificados regionais e os exportáveis.',
      briefing: {
        company: 'Rede de Farmácias Cuidar',
        role: 'Você leva a loja para o CloudFront e cuida de um servidor antigo.',
        situation: 'A loja passa a usar o CloudFront, com a origem em São Paulo. Uma aplicação antiga roda direto numa instância EC2, sem load balancer, e também precisa de HTTPS.',
        objective: 'Pôr cada certificado onde ele pode ser usado.',
        successCriteria: ['Pedir o certificado na Região certa', 'Atender o servidor da instância'],
      },
      intel: [
        { conceptId: 'acm.cloudfront-region', body: ['O CloudFront só usa certificados do ACM da Região **us-east-1**, onde quer que esteja a origem.'] },
        { conceptId: 'acm.exportable', body: ['Um certificado gerenciado do ACM não é instalado direto numa instância EC2. Para EC2 e servidores próprios, há os certificados **exportáveis**, com custo.'] },
      ],
      activities: [
        {
          id: 'sec.f04.m3.a1',
          kind: 'predict',
          title: 'O certificado que não aparece',
          prompt: 'O time pediu o certificado de www.cuidar.com.br em sa-east-1, onde está a origem, e tentou usá-lo no CloudFront. Ele pode ser usado ali?',
          concepts: [{ id: 'acm.cloudfront-region' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O CloudFront exige o certificado em us-east-1. É preciso pedir outro certificado lá.'],
          spec: { sim: 'certs', cert: { ...site, id: 'www', domain: 'www.cuidar.com.br', attachedTo: 'cloudfront' }, measure: 'placement' },
          options: [
            { id: 'a', text: 'Não: está na Região errada', outcome: 'wrong-region' },
            { id: 'b', text: 'Sim', outcome: 'ok' },
            { id: 'c', text: 'Não: o ACM não instala certificados ali', outcome: 'cannot-attach' },
          ],
        },
        {
          id: 'sec.f04.m3.a2',
          kind: 'decision',
          title: 'Dois load balancers, duas Regiões',
          prompt: 'A loja ganhou um ALB também em us-east-1 para o mesmo domínio. O certificado de sa-east-1 pode ser copiado para lá?',
          concepts: [{ id: 'acm.what' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Certificados do ACM são regionais e não podem ser copiados entre Regiões. É preciso pedir outro em us-east-1, validando o domínio de novo.'],
          options: [
            { id: 'a', text: 'Não: é preciso pedir outro certificado em us-east-1', correct: true, consequence: 'Cada Região com o próprio certificado.' },
            { id: 'b', text: 'Sim: basta copiar o ARN', correct: false, consequence: 'O certificado só existe na Região em que foi pedido.' },
          ],
        },
        {
          id: 'sec.f04.m3.a3',
          kind: 'decision',
          title: 'O servidor antigo',
          prompt: 'A aplicação antiga roda num servidor web dentro de uma instância EC2, sem load balancer, e precisa de HTTPS com um certificado público. O que usar?',
          concepts: [{ id: 'acm.exportable' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O certificado gerenciado comum do ACM não vai direto para a instância. O exportável pode ser baixado e instalado no servidor; o ACM renova, e a instalação da versão nova fica com o time. Pôr um ALB na frente também resolveria.'],
          options: [
            { id: 'a', text: 'Um certificado público exportável do ACM, instalado no servidor da instância', correct: true, consequence: 'O servidor ganha HTTPS, e o time cuida de instalar cada renovação.' },
            { id: 'b', text: 'O mesmo certificado gerenciado do ALB, associado à instância', correct: false, consequence: 'O certificado gerenciado não é instalado direto numa instância.' },
          ],
        },
      ],
      debrief: { takeaways: ['CloudFront: certificado em us-east-1.', 'Certificado do ACM é regional e não se copia.', 'Servidor na instância: certificado exportável ou um load balancer na frente.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f04.boss',
      title: 'Os certificados da rede',
      type: 'boss',
      summary: 'Sete certificados, onde cada um pode ser usado e o que acontece no vencimento.',
      briefing: {
        company: 'Rede de Farmácias Cuidar',
        role: 'Você entrega o inventário de certificados à diretoria.',
        situation: 'Sete certificados vencem nos próximos 45 dias. A diretoria quer saber quais estão no lugar certo, quais se renovam sozinhos e quais precisam de alguém.',
        objective: 'Responder as duas perguntas de cada certificado.',
        successCriteria: ['Os sete certificados certos'],
      },
      intel: [
        { conceptId: 'acm.renewal', body: ['Renovação automática: validado por DNS, em uso e com o CNAME. Certificado fora de uso e não exportado não é elegível.'] },
        { conceptId: 'acm.cloudfront-region', body: ['CloudFront: us-east-1. Instância EC2: só certificado exportável.'] },
      ],
      activities: [
        {
          id: 'sec.f04.boss.a1',
          kind: 'lab',
          lab: 'certs',
          title: 'O inventário',
          prompt: 'Para cada certificado, diga se ele pode ser usado onde está e o que acontece perto do vencimento.',
          concepts: [{ id: 'acm.renewal' }, { id: 'acm.validation' }, { id: 'acm.cloudfront-region' }, { id: 'acm.public-vs-imported' }],
          xp: 200,
          difficulty: 3,
          hints: ['Um certificado que não pode ser usado onde está também não está em uso.', 'Importado nunca renova pelo ACM.'],
          explanation: [
            'Renovam sozinhos: loja e static. Precisam de ação: api (CNAME apagado) e receitas (e-mail).',
            'Vencem: intranet (importado), www (Região errada, sem uso) e legado (o ACM não instala na instância).',
          ],
          config: CUIDAR_CERTS,
        },
      ],
      debrief: { takeaways: ['DNS, em uso e com CNAME: renova sozinho.', 'Região certa e serviço integrado contam como uso.', 'Importado e e-mail pedem alguém de olho.'] },
    },
  ],
}
