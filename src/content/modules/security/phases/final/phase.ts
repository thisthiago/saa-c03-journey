/** Desafio final — Auditoria de Segurança (empresa fictícia: Clínica Bem Viver). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const BEM_VIVER: ArchitectureLabConfig = {
  title: 'Relatório da Auditoria de Segurança',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 22/10/2026.',
  steps: [
    {
      id: 'chaves',
      title: 'Chaves e criptografia em repouso',
      intro: 'A **Clínica Bem Viver** guarda exames e prontuários no S3 e num banco relacional. A auditoria quer saber quem controla as chaves e se a equipe de plataforma, que tem AdministratorAccess, consegue ler os prontuários.',
      questions: [
        {
          id: 'chave',
          prompt: 'Como proteger os dados em repouso?',
          options: [
            { id: 'cmk', label: 'Chave do KMS gerenciada pelo cliente, com rotação automática e key policy separando administradores de usuários, sem o statement da conta', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'Só a aplicação lê os dados; a plataforma administra a infraestrutura sem acesso aos prontuários.', concepts: ['kms.admin-vs-user', 'kms.rotation', 'kms.key-types'] },
            { id: 'cmk-conta', label: 'Chave do KMS do cliente com o statement padrão da conta e nada mais', scores: { seguro: 0.4, requisitos: 0.6, custo: 1 }, consequence: 'Qualquer identidade com AdministratorAccess decifra os prontuários.', whyNot: 'O statement da conta entrega a chave ao IAM.', concepts: ['kms.admin-vs-user'] },
            { id: 'hsm', label: 'CloudHSM para tudo, sem exigência de HSM dedicado', scores: { seguro: 1, requisitos: 0.8, custo: 0.2 }, consequence: 'Protege, mas paga HSMs por hora e opera um cluster sem necessidade.', whyNot: 'Sem exigência de HSM dedicado, o KMS atende.', concepts: ['hsm.kms-vs-cloudhsm'] },
          ],
        },
      ],
    },
    {
      id: 'segredos',
      title: 'Segredos da aplicação e do banco',
      intro: 'A aplicação conecta ao banco com uma senha que hoje está num arquivo de configuração. A norma pede girar a senha a cada 30 dias, e a aplicação não pode cair durante a troca.',
      questions: [
        {
          id: 'senha',
          prompt: 'Onde fica a senha do banco?',
          options: [
            { id: 'sm-alt', label: 'Secrets Manager com rotação a cada 30 dias, estratégia de usuários alternados e a aplicação lendo o segredo pela própria role', scores: { seguro: 1, resiliente: 1, requisitos: 1 }, consequence: 'A senha gira sem derrubar logins, e nada fica no código.', concepts: ['secret.strategies', 'secret.rotation', 'secret.where'] },
            { id: 'sm-unico', label: 'Secrets Manager com rotação a cada 30 dias e usuário único, sem nova tentativa na aplicação', scores: { seguro: 1, resiliente: 0.5, requisitos: 0.7 }, consequence: 'A cada rotação, alguns logins falham por um instante.', whyNot: 'Usuário único tem um intervalo curto de recusa.', concepts: ['secret.strategies'] },
            { id: 'ps', label: 'Parameter Store com SecureString, trocado à mão quando alguém lembrar', scores: { seguro: 0.5, resiliente: 0.7, requisitos: 0.3, custo: 1 }, consequence: 'Sai do código, mas não gira sozinho.', whyNot: 'O Parameter Store não tem rotação automática.', concepts: ['secret.vs-parameter-store'] },
          ],
        },
      ],
    },
    {
      id: 'transito',
      title: 'Certificados e criptografia em trânsito',
      intro: 'O portal dos pacientes roda atrás de um ALB em sa-east-1, com o CloudFront na frente. A norma pede os dados cifrados até o servidor.',
      questions: [
        {
          id: 'cert',
          prompt: 'Como cifrar o caminho?',
          options: [
            { id: 'acm-full', label: 'Certificado do ACM em us-east-1 no CloudFront, outro em sa-east-1 no ALB, ambos validados por DNS, e HTTPS do ALB até as instâncias', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'Cifrado de ponta a ponta, com renovação automática.', concepts: ['acm.cloudfront-region', 'acm.tls-termination', 'acm.renewal'] },
            { id: 'acm-alb', label: 'Certificado do ACM só no ALB, com HTTP até as instâncias', scores: { seguro: 0.5, requisitos: 0.4, custo: 1 }, consequence: 'O trecho interno viaja sem criptografia, contra a norma.', whyNot: 'O TLS termina no ALB.', concepts: ['acm.tls-termination'] },
            { id: 'importado', label: 'Certificado comprado de outra autoridade, importado, renovado à mão', scores: { seguro: 0.8, resiliente: 0.4, requisitos: 0.7, custo: 0.6 }, consequence: 'Funciona até alguém esquecer o vencimento.', whyNot: 'O ACM não renova certificados importados.', concepts: ['acm.public-vs-imported'] },
          ],
        },
      ],
    },
    {
      id: 'deteccao',
      title: 'Detecção de ameaças',
      intro: 'Ninguém sabe hoje se há credenciais roubadas em uso ou instâncias com pacotes vulneráveis nas 6 contas da clínica.',
      questions: [
        {
          id: 'detectar',
          prompt: 'O que ligar?',
          options: [
            { id: 'gd-insp', label: 'GuardDuty e Inspector em todas as contas, por uma conta administradora delegada', scores: { seguro: 1, requisitos: 1 }, consequence: 'Ameaças e vulnerabilidades à vista em todas as contas, inclusive nas novas.', concepts: ['gd.what', 'insp.what', 'sec.delegated-admin'] },
            { id: 'so-gd', label: 'Só o GuardDuty, na conta principal', scores: { seguro: 0.4, requisitos: 0.4 }, consequence: 'As outras contas e as vulnerabilidades ficam sem olhar.', whyNot: 'O GuardDuty não procura vulnerabilidades, e as outras contas ficam de fora.', concepts: ['sec.detect-assess-investigate'] },
            { id: 'trail', label: 'Só uma trilha do CloudTrail, lida uma vez por semana', scores: { seguro: 0.3, requisitos: 0.3, custo: 1 }, consequence: 'Registra, mas ninguém é avisado de nada.', whyNot: 'O CloudTrail registra; não detecta ameaças sozinho.', concepts: ['sec.choose'] },
          ],
        },
      ],
    },
    {
      id: 'dados',
      title: 'Classificação e retenção dos dados',
      intro: 'Há buckets antigos de várias equipes, e ninguém sabe onde estão os dados de pacientes. A lei manda guardar prontuários por 20 anos sem possibilidade de exclusão.',
      questions: [
        {
          id: 'reter',
          prompt: 'Como achar e guardar os dados?',
          options: [
            { id: 'macie-lock', label: 'Descoberta automática do Macie e Object Lock em modo conformidade com 20 anos nos prontuários', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'A clínica sabe onde estão os dados, e ninguém apaga os prontuários antes do prazo.', concepts: ['macie.discovery', 's3.object-lock', 'sec.retention'] },
            { id: 'governanca', label: 'Descoberta automática do Macie e Object Lock em modo governança', scores: { seguro: 0.6, requisitos: 0.5, resiliente: 0.8 }, consequence: 'Quem tem a permissão especial ainda consegue apagar.', whyNot: 'A lei pede que ninguém apague.', concepts: ['s3.object-lock'] },
            { id: 'politica', label: 'Uma política de bucket que nega a exclusão, sem procurar os dados', scores: { seguro: 0.3, requisitos: 0.2 }, consequence: 'Um administrador muda a política, e os dados espalhados continuam desconhecidos.', whyNot: 'Permissão não é imutabilidade.', concepts: ['sec.retention', 'sec.data-classification'] },
          ],
        },
      ],
    },
    {
      id: 'postura',
      title: 'Postura e provas de conformidade',
      intro: 'A auditoria quer os controles do padrão de boas práticas conferidos o tempo todo nas 6 contas e o relatório SOC da AWS.',
      questions: [
        {
          id: 'provas',
          prompt: 'Como montar as provas?',
          options: [
            { id: 'hub-artifact', label: 'Security Hub CSPM com o padrão FSBP e o AWS Config gravando, mais o relatório SOC baixado do Artifact', scores: { seguro: 1, requisitos: 1 }, consequence: 'A parte da clínica e a parte da AWS provadas.', concepts: ['shub.cspm', 'artifact.what', 'sec.compliance-evidence'] },
            { id: 'sem-config', label: 'Security Hub CSPM sem o AWS Config, mais o Artifact', scores: { seguro: 0.5, requisitos: 0.4 }, consequence: 'A maioria dos controles fica sem resultado.', whyNot: 'Os controles dependem do Config.', concepts: ['shub.cspm'] },
            { id: 'so-artifact', label: 'Só os relatórios do Artifact', scores: { seguro: 0.3, requisitos: 0.2 }, consequence: 'Prova a parte da AWS; a da clínica fica sem prova.', whyNot: 'O Artifact não prova a configuração da clínica.', concepts: ['sec.compliance-evidence'] },
          ],
        },
      ],
    },
    {
      id: 'borda',
      title: 'Proteção contra ataques externos',
      intro: 'O portal recebe tentativas de injeção de SQL no formulário de agendamento e scripts nos campos de mensagem.',
      questions: [
        {
          id: 'waf',
          prompt: 'Como proteger o portal?',
          options: [
            { id: 'waf-grupos', label: 'WAF no CloudFront com os grupos gerenciados SQL database e Core rule set, e o banco numa sub-rede privada', scores: { seguro: 1, requisitos: 1, desempenho: 1 }, consequence: 'Os ataques param na borda, e o banco não fica exposto.', concepts: ['sec.web-threats', 'sec.defense-in-depth'] },
            { id: 'sg', label: 'Só security groups mais restritos', scores: { seguro: 0.4, requisitos: 0.3 }, consequence: 'O security group não lê o conteúdo das requisições.', whyNot: 'Injeção de SQL e XSS se barram na camada HTTP.', concepts: ['sec.web-threats'] },
            { id: 'waf-publico', label: 'WAF com os grupos gerenciados, e o banco numa sub-rede pública para facilitar o acesso', scores: { seguro: 0.4, requisitos: 0.6 }, consequence: 'O banco pode ser atacado sem passar pelo WAF.', whyNot: 'Uma camada não basta.', concepts: ['sec.defense-in-depth'] },
          ],
        },
      ],
    },
    {
      id: 'resposta',
      title: 'Resposta automática ao incidente',
      intro: 'Na semana da auditoria, o GuardDuty apontou uma instância do portal falando com um servidor de comando e controle às 3h.',
      questions: [
        {
          id: 'responder',
          prompt: 'Como responder?',
          options: [
            { id: 'auto', label: 'Regra do EventBridge que aciona uma função para isolar a instância com um security group restritivo, tirar snapshot e avisar a equipe', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'Contida em segundos, com as provas preservadas.', concepts: ['sec.auto-response', 'sec.containment'] },
            { id: 'terminar', label: 'Regra que termina a instância assim que o achado chega', scores: { seguro: 0.6, requisitos: 0.5, resiliente: 0.7 }, consequence: 'Para o ataque, mas apaga as provas de como ele começou.', whyNot: 'Conter sem destruir as provas.', concepts: ['sec.containment'] },
            { id: 'manual', label: 'Esperar a equipe ver o achado no console pela manhã', scores: { seguro: 0.2, requisitos: 0.3 }, consequence: 'O atacante tem horas para agir.', whyNot: 'O achado já vai para o EventBridge quase em tempo real.', concepts: ['sec.auto-response'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'conta-e-sem-deteccao',
      when: [
        ['chave', ['cmk-conta']],
        ['detectar', ['so-gd', 'trail']],
      ],
      penalty: { seguro: 0.3 },
      message: 'A chave dos prontuários aberta a qualquer AdministratorAccess, e quase nenhuma detecção: um administrador comprometido lê tudo sem ninguém saber.',
      concepts: ['kms.admin-vs-user', 'sec.detect-assess-investigate'],
    },
    {
      id: 'sem-config-sem-lock',
      when: [
        ['provas', ['sem-config', 'so-artifact']],
        ['reter', ['politica', 'governanca']],
      ],
      penalty: { requisitos: 0.3 },
      message: 'Sem os controles do Config e sem retenção imutável, a clínica não consegue provar ao auditor que os prontuários estão protegidos.',
      concepts: ['shub.cspm', 'sec.retention'],
    },
    {
      id: 'terminar-sem-borda',
      when: [
        ['waf', ['sg', 'waf-publico']],
        ['responder', ['terminar', 'manual']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Portal sem proteção na borda e resposta que perde as provas ou chega tarde: o mesmo ataque tende a se repetir.',
      concepts: ['sec.defense-in-depth', 'sec.containment'],
    },
  ],
}

export const FINAL_SEC: PhaseDef = {
  ...META.final,
  concepts: [
    'kms.admin-vs-user',
    'kms.rotation',
    'kms.key-types',
    'hsm.kms-vs-cloudhsm',
    'secret.strategies',
    'secret.rotation',
    'secret.where',
    'secret.vs-parameter-store',
    'acm.cloudfront-region',
    'acm.tls-termination',
    'acm.renewal',
    'acm.public-vs-imported',
    'gd.what',
    'insp.what',
    'sec.delegated-admin',
    'sec.detect-assess-investigate',
    'sec.choose',
    'macie.discovery',
    's3.object-lock',
    'sec.retention',
    'sec.data-classification',
    'shub.cspm',
    'artifact.what',
    'sec.compliance-evidence',
    'sec.web-threats',
    'sec.defense-in-depth',
    'sec.auto-response',
    'sec.containment',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A clínica, os dados e os números são fictícios.'],
  missions: [
    {
      id: 'sec.final.auditoria',
      title: 'Auditoria de Segurança da Clínica Bem Viver',
      type: 'final',
      summary: 'Oito etapas de decisões de segurança, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Clínica Bem Viver',
        role: 'Você responde pela segurança de uma clínica com dados de pacientes.',
        situation: 'Prontuários e exames no S3 e num banco, um portal exposto à internet, uma auditoria de conformidade marcada para a semana que vem e um alerta de acesso suspeito numa instância.',
        objective: 'Escolher chaves, segredos, certificados, detecção, retenção, provas, proteção da borda e resposta que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'sec.defense-in-depth', body: ['Cada decisão pesa nas outras: uma chave aberta ao IAM sem detecção, ou um portal sem borda com uma resposta que apaga as provas. O relatório aponta esses conflitos.'] },
        { conceptId: 'sec.compliance-evidence' },
      ],
      activities: [
        {
          id: 'sec.final.auditoria.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Auditoria de Segurança',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'kms.admin-vs-user' }, { id: 'secret.strategies' }, { id: 'acm.tls-termination' }, { id: 'gd.what' }, { id: 'sec.retention' }, { id: 'shub.cspm' }, { id: 'sec.web-threats' }, { id: 'sec.auto-response' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar uma ou duas opções.', 'Quando duas opções protegem, a com menos operação costuma ser a melhor.'],
          explanation: [
            'Projeto de referência: chave do cliente com administradores e usuários separados e rotação; Secrets Manager com usuários alternados; ACM no CloudFront (us-east-1) e no ALB, com HTTPS até as instâncias.',
            'GuardDuty e Inspector em todas as contas; Macie e Object Lock em conformidade; Security Hub CSPM com o Config e o Artifact; WAF com os grupos gerenciados e banco privado; resposta automática que isola e preserva as provas.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: BEM_VIVER,
        },
      ],
      debrief: { takeaways: ['A chave dos dados sensíveis não fica aberta ao IAM inteiro.', 'Segredos giram sem derrubar a aplicação; certificados renovam sozinhos.', 'Detectar, provar, barrar na borda e conter sem destruir as provas.'] },
    },
  ],
}
