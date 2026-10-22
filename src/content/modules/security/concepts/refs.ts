/** Referências oficiais da trilha Segurança e proteção de dados na AWS (conferidas em 22/10/2026). */
const kms = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/kms/latest/developerguide/${page}` })
const sm = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/secretsmanager/latest/userguide/${page}` })
const acm = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/acm/latest/userguide/${page}` })
const gd = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/guardduty/latest/ug/${page}` })
const macie = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/macie/latest/user/${page}` })
const shub = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/securityhub/latest/userguide/${page}` })
const waf = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/waf/latest/developerguide/${page}` })

export const R = {
  kmsKeys: kms('AWS KMS keys', 'concepts.html'),
  kmsDefaultPolicy: kms('Default key policy', 'key-policy-default.html'),
  kmsGrants: kms('Grants in AWS KMS', 'grants.html'),
  kmsRotation: kms('Rotate AWS KMS keys', 'rotate-keys.html'),
  kmsMultiRegion: kms('Multi-Region keys in AWS KMS', 'multi-region-keys-overview.html'),
  kmsQuotas: kms('Request quotas', 'requests-per-second.html'),
  kmsEncrypt: { title: 'Encrypt', url: 'https://docs.aws.amazon.com/kms/latest/APIReference/API_Encrypt.html' },
  cloudhsm: { title: 'What is AWS CloudHSM?', url: 'https://docs.aws.amazon.com/cloudhsm/latest/userguide/introduction.html' },
  smRotating: sm('Rotate AWS Secrets Manager secrets', 'rotating-secrets.html'),
  smLambda: sm('Lambda rotation functions', 'rotate-secrets_lambda-functions.html'),
  smStrategy: sm('Lambda function rotation strategies', 'rotation-strategy.html'),
  smSchedule: sm('Rotation schedules', 'rotate-secrets_schedule.html'),
  smManaged: sm('Managed rotation for AWS Secrets Manager secrets', 'rotate-secrets_managed.html'),
  smReplicate: sm('Replicate AWS Secrets Manager secrets across Regions', 'create-manage-multi-region-secrets.html'),
  smCache: sm('Get a Secrets Manager secret value using Python with client-side caching', 'retrieving-secrets_cache-python.html'),
  paramTiers: { title: 'Choosing parameter tiers in Parameter Store', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html' },
  acmWhat: acm('What is AWS Certificate Manager?', 'acm-overview.html'),
  acmServices: acm('Managed automation with integrated services', 'acm-services.html'),
  acmRenewal: acm('Managed certificate renewal in AWS Certificate Manager', 'managed-renewal.html'),
  acmDnsRenewal: acm('Renewal for domains validated by DNS', 'dns-renewal-validation.html'),
  acmValidation: acm('Validate domain ownership for AWS Certificate Manager public certificates', 'domain-ownership-validation.html'),
  acmImport: acm('Import certificates into AWS Certificate Manager', 'import-certificate.html'),
  acmCharacteristics: acm('AWS Certificate Manager public certificate characteristics and limitations', 'acm-certificate-characteristics.html'),
  acmExportable: acm('AWS Certificate Manager exportable public certificates', 'acm-exportable-certificates.html'),
  acmEvents: acm('Amazon EventBridge support for ACM', 'supported-events.html'),
  gdWhat: gd('What is Amazon GuardDuty?', 'what-is-guardduty.html'),
  gdFormat: gd('GuardDuty finding format', 'guardduty_finding-format.html'),
  gdEc2: gd('GuardDuty EC2 finding types', 'guardduty_finding-types-ec2.html'),
  gdIam: gd('GuardDuty IAM finding types', 'guardduty_finding-types-iam.html'),
  gdEventBridge: gd('Processing GuardDuty findings with Amazon EventBridge', 'guardduty_findings_cloudwatch.html'),
  inspector: { title: 'What is Amazon Inspector?', url: 'https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html' },
  inspectorTypes: { title: 'Amazon Inspector finding types', url: 'https://docs.aws.amazon.com/inspector/latest/user/findings-types.html' },
  detective: { title: 'What is Amazon Detective?', url: 'https://docs.aws.amazon.com/detective/latest/userguide/what-is-detective.html' },
  macieAuto: macie('Performing automated sensitive data discovery', 'discovery-asdd.html'),
  macieJobs: macie('Running sensitive data discovery jobs', 'discovery-jobs.html'),
  macieTypes: macie('Types of Macie findings', 'findings-types.html'),
  vaultLock: { title: 'AWS Backup Vault Lock', url: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html' },
  shubBoth: shub('What are Security Hub and Security Hub CSPM?', 'what-are-securityhub-services.html'),
  shubCspm: shub('Introduction to AWS Security Hub CSPM', 'what-is-securityhub.html'),
  shubStandards: shub('Understanding security standards in Security Hub CSPM', 'standards-view-manage.html'),
  shubS3: shub('Security Hub CSPM controls for Amazon S3', 's3-controls.html'),
  artifact: { title: 'What is AWS Artifact?', url: 'https://docs.aws.amazon.com/artifact/latest/ug/what-is-aws-artifact.html' },
  wafBaseline: waf('Baseline rule groups', 'aws-managed-rule-groups-baseline.html'),
  wafUseCase: waf('Use-case specific rule groups', 'aws-managed-rule-groups-use-case.html'),
  irContain: { title: 'Contain - AWS Security Incident Response User Guide', url: 'https://docs.aws.amazon.com/security-ir/latest/userguide/contain.html' },
  examScope: { title: 'In-Scope AWS Services - AWS Certified Solutions Architect - Associate', url: 'https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html' },
  examDomain1: { title: 'Content Domain 1: Design Secure Architectures', url: 'https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain1.html' },
}
