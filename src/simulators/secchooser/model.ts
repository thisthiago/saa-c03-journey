/**
 * Escolha do serviço de segurança: qual serviço responde a cada requisito
 * com o menor esforço.
 *
 * Conferido em 22/10/2026 (ver os modelos e conceitos das fases anteriores):
 * KMS (chaves gerenciadas, rotação, key policy), CloudHSM (HSM dedicado a um
 * cliente, FIPS 140-2 ou 140-3 nível 3 no modo FIPS), Secrets Manager
 * (rotação automática de segredos), Parameter Store (configuração e
 * SecureString, sem rotação), ACM (certificados TLS com renovação
 * gerenciada), GuardDuty (ameaças a partir de CloudTrail, VPC Flow Logs e
 * DNS), Inspector (vulnerabilidades de software e exposição de rede), Macie
 * (dados sensíveis no S3), Detective (investigação da causa), Security Hub
 * CSPM (padrões e controles), AWS Config (configuração e conformidade de
 * recursos), CloudTrail (registro de chamadas de API), Artifact (relatórios
 * de conformidade da AWS) e WAF (injeção de SQL e cross-site scripting).
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const SEC_OPTIONS: ChoiceCatalog = {
  needLabel: {
    'managed-keys': 'chaves de criptografia gerenciadas, com rotação e auditoria',
    'dedicated-hsm': 'chaves num HSM dedicado só à empresa, sob controle exclusivo dela',
    'rotate-secret': 'girar a senha do banco automaticamente',
    'config-param': 'guardar configurações e parâmetros da aplicação sem custo extra',
    'tls-cert': 'certificado TLS que se renova sozinho no load balancer',
    'threat-detect': 'alertar sobre chamadas de API vindas de um IP malicioso',
    'vuln-scan': 'achar pacotes com vulnerabilidades conhecidas nas instâncias e imagens',
    'pii-s3': 'descobrir dados pessoais em buckets do S3',
    'investigate': 'investigar a origem e o alcance de um achado',
    'posture': 'conferir as contas contra padrões como AWS Foundational Security Best Practices e CIS',
    'resource-config': 'histórico de configuração de um recurso e regra própria de conformidade',
    'api-audit': 'saber quem chamou qual API e quando',
    'aws-reports': 'baixar o relatório SOC ou PCI da própria AWS para o auditor',
    'web-attacks': 'bloquear injeção de SQL e cross-site scripting no site',
  },
  options: {
    kms: { name: 'AWS KMS', summary: 'Chaves gerenciadas, com key policy, rotação e registro de uso no CloudTrail.', meets: ['managed-keys'], limits: ['As chaves ficam em HSMs compartilhados e gerenciados pela AWS.'], complexity: 1 },
    cloudhsm: { name: 'AWS CloudHSM', summary: 'HSMs dedicados a um só cliente, em cluster, com as chaves sob controle exclusivo dele.', meets: ['dedicated-hsm', 'managed-keys'], limits: ['Exige operar o cluster e cobra cada HSM por hora.'], complexity: 4 },
    'secrets-manager': { name: 'AWS Secrets Manager', summary: 'Segredos com rotação automática, integração com RDS e réplica em outras Regiões.', meets: ['rotate-secret', 'config-param'], limits: ['Cobra cada segredo por mês e as chamadas de API.'], complexity: 2 },
    'parameter-store': { name: 'Parameter Store', summary: 'Parâmetros e SecureString do Systems Manager; o nível padrão não tem custo extra.', meets: ['config-param'], limits: ['Não tem rotação automática de segredos.'], complexity: 1 },
    acm: { name: 'AWS Certificate Manager', summary: 'Certificados TLS públicos com renovação gerenciada nos serviços integrados.', meets: ['tls-cert'], limits: ['Certificados importados não são renovados pelo ACM.'], complexity: 1 },
    guardduty: { name: 'Amazon GuardDuty', summary: 'Detecção contínua de ameaças a partir de CloudTrail, VPC Flow Logs e DNS.', meets: ['threat-detect'], limits: ['Detecta ameaças; não procura vulnerabilidades de software.'], complexity: 1 },
    inspector: { name: 'Amazon Inspector', summary: 'Varredura contínua de vulnerabilidades em EC2, imagens do ECR e Lambda.', meets: ['vuln-scan'], limits: ['Procura vulnerabilidades; não detecta comportamento suspeito.'], complexity: 1 },
    macie: { name: 'Amazon Macie', summary: 'Descoberta de dados sensíveis e de riscos de segurança nos buckets do S3.', meets: ['pii-s3'], limits: ['Analisa o S3; não olha bancos de dados nem discos.'], complexity: 1 },
    detective: { name: 'Amazon Detective', summary: 'Grafo de comportamento para investigar a causa de um achado.', meets: ['investigate'], limits: ['Investiga; não gera os achados.'], complexity: 2 },
    'security-hub': { name: 'Security Hub CSPM', summary: 'Controles de padrões de segurança e achados de vários serviços num só lugar.', meets: ['posture'], limits: ['Depende do AWS Config para a maioria dos controles.'], complexity: 2 },
    config: { name: 'AWS Config', summary: 'Histórico de configuração dos recursos e regras de conformidade, inclusive próprias.', meets: ['resource-config', 'posture'], limits: ['Montar os padrões regra a regra dá mais trabalho que ligar um padrão pronto.'], complexity: 3 },
    cloudtrail: { name: 'AWS CloudTrail', summary: 'Registro das chamadas de API: quem, o quê, quando e de onde.', meets: ['api-audit'], limits: ['Registra; não aponta sozinho o que é ameaça.'], complexity: 1 },
    artifact: { name: 'AWS Artifact', summary: 'Download gratuito dos relatórios de conformidade da AWS e gestão de acordos.', meets: ['aws-reports'], limits: ['Prova a parte da AWS; a da empresa ela mesma documenta.'], complexity: 1 },
    waf: { name: 'AWS WAF', summary: 'Regras sobre as requisições HTTP, com grupos gerenciados contra injeção de SQL e cross-site scripting.', meets: ['web-attacks'], limits: ['Protege a camada HTTP; não detecta ameaças dentro da conta.'], complexity: 2 },
  },
}

export type SecChooserLabConfig = ChoiceLabConfig
export type SecChooserLabResponse = ChoiceLabResponse

export const secChooserSolution = (c: SecChooserLabConfig) => choiceSolution(SEC_OPTIONS, c)
export const evaluateSecChooserLab = (c: SecChooserLabConfig, r: SecChooserLabResponse) => evaluateChoiceLab(SEC_OPTIONS, c, r)
