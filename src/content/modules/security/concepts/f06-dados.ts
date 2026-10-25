/**
 * Conceitos da Fase 6 — Classificação e retenção de dados.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_SEC_CONCEPTS: ConceptDef[] = [
  {
    id: 'sec.data-classification',
    title: 'Classificar os dados',
    officialName: 'Data classification',
    serviceIds: ['aws.macie', 'aws.s3'],
    summary: 'Antes de escolher controles, a empresa **classifica** os dados pela sensibilidade: públicos, internos, confidenciais, pessoais. A classificação diz quais dados exigem chave própria, quem pode ler, por quanto tempo guardar e quando apagar. Sem saber onde os dados pessoais estão, não há como protegê-los.',
    commonMistakes: ['Aplicar o mesmo controle a todos os buckets, dos logs de teste aos prontuários'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'A tarefa 1.3 do exame cita a retenção e a classificação de dados. Para encontrar automaticamente dados pessoais no S3, a resposta é o Macie.',
    },
    references: [R.examDomain1, R.macieAuto],
    tags: ['seguranca'],
  },
  {
    id: 'macie.discovery',
    title: 'Descoberta automática e trabalhos do Macie',
    officialName: 'Automated sensitive data discovery and sensitive data discovery jobs',
    serviceIds: ['aws.macie', 'aws.s3'],
    summary: 'A **descoberta automática** avalia o inventário de buckets todo dia e analisa **amostras representativas** dos objetos, para dar uma visão ampla de onde há dados sensíveis. O **trabalho de descoberta** analisa a fundo os buckets escolhidos, **uma vez ou de forma recorrente**. A amostra mostra onde olhar; o trabalho olha tudo ali.',
    facts: ['A descoberta automática mostra um mapa de sensibilidade dos buckets.', 'Os trabalhos podem filtrar objetos por tag, prefixo e data de modificação.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "saber em quais buckets da organização há dados sensíveis, com custo controlado". A resposta é a descoberta automática do Macie; para analisar a fundo buckets específicos, um trabalho de descoberta.',
    },
    references: [R.macieAuto, R.macieJobs],
    tags: ['seguranca'],
  },
  {
    id: 'macie.identifiers',
    title: 'Identificadores de dados do Macie',
    officialName: 'Managed data identifiers, custom data identifiers and allow lists',
    serviceIds: ['aws.macie'],
    summary: 'O Macie reconhece dados sensíveis com **identificadores gerenciados**, que a AWS mantém (números de documento, de cartão, chaves de acesso), e com **identificadores personalizados**, que você cria com uma expressão regular e palavras próximas, como o número de matrícula da empresa. As **listas de permissão** dizem o que ignorar.',
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.macieJobs, R.macieAuto],
    tags: ['seguranca'],
  },
  {
    id: 'macie.findings',
    title: 'Achados do Macie',
    officialName: 'Macie policy findings and sensitive data findings',
    serviceIds: ['aws.macie'],
    summary: 'O Macie gera dois tipos de achado. Os **de política** avisam que a configuração de um bucket ficou menos segura, como `Policy:IAMUser/S3BlockPublicAccessDisabled` ou `S3BucketPublic`. Os **de dados sensíveis** apontam objetos com dados pessoais, financeiros ou credenciais, como `SensitiveData:S3Object/Personal`.',
    facts: ['O Macie guarda os achados por 90 dias.', 'Achados de política só aparecem para mudanças feitas depois que o Macie foi ligado.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.macieTypes],
    tags: ['seguranca'],
  },
  {
    id: 'sec.retention',
    title: 'Retenção e imutabilidade',
    officialName: 'Data retention and immutability',
    serviceIds: ['aws.s3', 'aws.backup'],
    summary: 'Quando a lei manda **guardar por um prazo sem deixar apagar**, o dado precisa ser **imutável** (WORM: grava uma vez, lê muitas). No S3, isso é o **Object Lock**; nos backups, o **Vault Lock** do AWS Backup. No fim do prazo, o **ciclo de vida** apaga o que não precisa mais ficar.',
    comparisons: [{ with: 's3.object-lock', text: 'O Object Lock protege objetos do S3; o Vault Lock protege os pontos de recuperação de um cofre do AWS Backup.' }],
    commonMistakes: ['Confiar só em permissões para impedir a exclusão: um administrador pode mudar as permissões'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinais: "guardar por N anos sem possibilidade de exclusão" e "WORM". A resposta é o Object Lock (no S3) ou o Vault Lock (no AWS Backup), no modo de conformidade, com lifecycle para apagar depois do prazo.',
    },
    references: [R.vaultLock, R.examDomain1],
    tags: ['seguranca', 'durabilidade'],
  },
  {
    id: 'bkp.vault-lock',
    title: 'Vault Lock do AWS Backup',
    officialName: 'AWS Backup Vault Lock',
    serviceIds: ['aws.backup'],
    summary: 'O **Vault Lock** tranca um cofre do AWS Backup. No modo **governança**, quem tem a permissão do IAM pode tirar a trava. No modo **conformidade**, depois de uma **carência de no mínimo 3 dias (72 horas)**, a trava e o cofre ficam **imutáveis**: ninguém, nem a conta raiz nem a AWS, apaga os backups antes do fim da retenção.',
    commonMistakes: ['Ligar o modo conformidade com retenção "para sempre" e pagar o armazenamento para sempre'],
    facts: ['O Vault Lock não tem custo adicional; o armazenamento dos backups é cobrado normalmente.', 'Durante a carência, a trava ainda pode ser removida ou alterada.', 'Retenção mínima e máxima do cofre fazem falhar os backups fora da faixa.'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinal: "impedir que alguém, inclusive o administrador, apague os backups". A resposta é o Vault Lock no modo de conformidade.',
    },
    references: [R.vaultLock],
    tags: ['seguranca', 'recuperacao'],
  },
]
