/**
 * Fase 2 — KMS avançado e CloudHSM. Rotação automática e sob demanda,
 * material importado, chaves multi-Região, grants, cota de requisições e a
 * escolha entre KMS e CloudHSM.
 */
import type { PhaseDef } from '../../../../../engine/types'
import { KMS_ACCOUNT, type KmsWorld } from '../../../../../simulators/kms/model'
import { SEC_PRICE_DATE, securityPrices } from '../../../../../simulators/security-prices'
import type { Principal } from '../../../../../simulators/policy/model'
import { META } from '../meta'

const KEY_SINISTROS = `arn:aws:kms:sa-east-1:${KMS_ACCOUNT}:key/5678efgh-56ef-78ab-90cd-5678efgh90ab`
const PRICES = securityPrices('us-east-1')
/** Dois HSMs (um por zona) ligados o mês inteiro, e dez chaves do KMS no mesmo mês. */
const HSM_MONTH = Math.round(2 * PRICES.cloudHsm.hsmHour * 730)
const KMS_MONTH = Math.round(10 * PRICES.kms.keyMonth)
const usd = (v: number) => `US$ ${v.toLocaleString('pt-BR')}`

const backup: Principal = { id: 'backup', name: 'copia-noturna', description: 'processo de cópia que roda por uma hora', kind: 'role-session', account: KMS_ACCOUNT, roleName: 'copia-noturna', sessionName: 'noite', identityPolicies: [] }
const GRANT_WORLD: KmsWorld = {
  principals: [backup],
  key: { arn: KEY_SINISTROS, label: 'chave sinistros', statements: [] },
  grants: [{ id: 'grant-copia', granteeId: 'backup', operations: ['Decrypt', 'GenerateDataKey'] }],
}

export const F02_SEC: PhaseDef = {
  ...META.f02,
  concepts: ['kms.rotation', 'kms.imported-material', 'kms.multi-region', 'kms.grants', 'kms.quotas', 's3.bucket-keys', 'hsm.cloudhsm', 'hsm.kms-vs-cloudhsm'],
  availability: 'available',
  simplifications: ['A seguradora, as chaves e os volumes são fictícios.', 'Os grants são avaliados sem restrições de contexto de criptografia nem tokens.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'sec.f02.m1',
      title: 'Girar sem perder nada',
      type: 'mission',
      summary: 'Rotação automática e sob demanda, e o cuidado com material importado.',
      briefing: {
        company: 'Seguradora Horizonte',
        role: 'Você cuida das chaves de uma seguradora.',
        situation: 'Um contrato com um banco parceiro exige girar as chaves todo ano. Um gerente teme que, depois da rotação, as apólices antigas fiquem ilegíveis. Uma das chaves usa material gerado no HSM próprio da seguradora.',
        objective: 'Ligar a rotação sem quebrar nada e cuidar da chave com material importado.',
        successCriteria: ['Saber o que muda na rotação', 'Saber o que acontece quando o material importado expira'],
      },
      intel: [
        { conceptId: 'kms.rotation', body: ['A rotação automática gera material novo a cada **365 dias** por padrão; a **sob demanda** gira na hora. ID, ARN e key policy não mudam, e o KMS **guarda o material antigo** para decifrar o que foi cifrado antes.'] },
        { conceptId: 'kms.imported-material', body: ['Com **material importado**, você pode definir uma expiração. Quando ela chega, a chave **para de funcionar** até o material voltar. Não há rotação automática, só sob demanda.'] },
      ],
      activities: [
        {
          id: 'sec.f02.m1.a1',
          kind: 'decision',
          title: 'As apólices de 2024',
          prompt: 'A rotação automática foi ligada em março. Em abril, o sistema tenta abrir uma apólice cifrada em 2024 com a mesma chave. O que acontece?',
          concepts: [{ id: 'kms.rotation' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O KMS guarda todo o material anterior e escolhe sozinho o material que cifrou aquele dado. A aplicação não muda nada.'],
          options: [
            { id: 'a', text: 'A apólice abre normalmente: o KMS usa o material antigo para decifrá-la', correct: true, consequence: 'A rotação é transparente para quem lê.' },
            { id: 'b', text: 'A apólice só abre depois de ser cifrada de novo com o material novo', correct: false, consequence: 'A rotação não exige cifrar de novo os dados.' },
            { id: 'c', text: 'É preciso trocar o ID da chave nas aplicações', correct: false, consequence: 'O ID e o ARN continuam os mesmos.' },
          ],
        },
        {
          id: 'sec.f02.m1.a2',
          kind: 'decision',
          title: 'Girar a cada 90 dias',
          prompt: 'O contrato novo pede girar as chaves dos sinistros a cada 90 dias, sempre no mesmo ritmo. O que fazer?',
          concepts: [{ id: 'kms.rotation' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O período da rotação automática pode ser definido. A rotação sob demanda serve a casos não planejados; a AWS recomenda a automática com período próprio sempre que possível.'],
          options: [
            { id: 'a', text: 'Ligar a rotação automática com período de 90 dias', correct: true, consequence: 'O KMS gira sozinho no prazo do contrato.' },
            { id: 'b', text: 'Criar uma chave nova a cada 90 dias e trocar o ID em todas as aplicações', correct: false, consequence: 'Funciona, mas dá muito mais trabalho que a rotação automática.' },
            { id: 'c', text: 'Agendar alguém para clicar na rotação sob demanda a cada 90 dias', correct: false, consequence: 'A sob demanda é para casos não planejados.' },
          ],
        },
        {
          id: 'sec.f02.m1.a3',
          kind: 'decision',
          title: 'A chave que parou',
          prompt: 'A chave com material importado do HSM próprio parou de funcionar numa segunda-feira, e todas as leituras falham. O material foi importado com expiração de um ano. O que aconteceu?',
          concepts: [{ id: 'kms.imported-material' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A chave fica inutilizável assim que o material expira ou é apagado. Importar o mesmo material de novo volta a liberar os dados.'],
          options: [
            { id: 'a', text: 'O material importado expirou; é preciso importá-lo de novo', correct: true, consequence: 'Com o material de volta, as leituras voltam a funcionar.' },
            { id: 'b', text: 'A rotação automática trocou o material', correct: false, consequence: 'Chaves com material importado não têm rotação automática.' },
            { id: 'c', text: 'A AWS apagou a chave por falta de uso', correct: false, consequence: 'O KMS não apaga chaves sozinho.' },
          ],
        },
      ],
      debrief: { takeaways: ['Rotação: material novo, mesmo ID, dados antigos legíveis.', 'Período próprio na rotação automática.', 'Material importado com expiração precisa de acompanhamento.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f02.m2',
      title: 'Duas Regiões, uma chave emprestada',
      type: 'mission',
      summary: 'Chaves multi-Região e grants.',
      briefing: {
        company: 'Seguradora Horizonte',
        role: 'Você prepara a recuperação de desastres dos dados cifrados.',
        situation: 'A aplicação cliente cifra documentos em São Paulo e precisa lê-los na Virgínia se São Paulo parar. Um processo de cópia noturna precisa usar a chave por uma hora sem que alguém edite a key policy toda noite.',
        objective: 'Decifrar na outra Região sem chamar a primeira e dar acesso temporário à chave.',
        successCriteria: ['Usar chave multi-Região', 'Saber o que é independente em cada réplica', 'Prever o efeito de um grant'],
      },
      intel: [
        { conceptId: 'kms.multi-region', body: ['Réplicas com o **mesmo ID e material**: cifra numa Região, decifra na outra. **Key policy, grants e alias** são de cada réplica.'] },
        { conceptId: 'kms.grants', body: ['O **grant** dá a um principal algumas operações de uma chave, sem mudar a key policy, e é apagado ao fim do trabalho.'] },
      ],
      activities: [
        {
          id: 'sec.f02.m2.a1',
          kind: 'decision',
          title: 'Ler na Virgínia',
          prompt: 'A aplicação cifra no cliente, com o SDK, documentos guardados em São Paulo e copiados para a Virgínia. Se São Paulo parar, a Virgínia precisa decifrá-los sem chamar São Paulo. O que usar?',
          concepts: [{ id: 'kms.multi-region' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A chave multi-Região tem o mesmo material nas duas Regiões: o que foi cifrado em São Paulo é decifrado na Virgínia pela réplica.'],
          options: [
            { id: 'a', text: 'Uma chave multi-Região com réplica na Virgínia', correct: true, consequence: 'A réplica decifra sozinha, mesmo com São Paulo fora do ar.' },
            { id: 'b', text: 'Uma chave em cada Região, criadas separadamente', correct: false, consequence: 'Chaves independentes têm materiais diferentes: uma não decifra o que a outra cifrou.' },
            { id: 'c', text: 'Converter a chave atual em multi-Região', correct: false, consequence: 'Uma chave de uma Região não vira multi-Região depois de criada.' },
          ],
        },
        {
          id: 'sec.f02.m2.a2',
          kind: 'decision',
          title: 'A key policy da réplica',
          prompt: 'A segurança tirou o acesso de um ex-fornecedor na key policy da chave principal, em São Paulo. A réplica da Virgínia também foi corrigida?',
          concepts: [{ id: 'kms.multi-region' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A key policy é propriedade independente de cada chave multi-Região. É preciso corrigir a réplica também.'],
          options: [
            { id: 'a', text: 'Não: a key policy de cada réplica é independente e precisa ser mudada também', correct: true, consequence: 'O ex-fornecedor perde o acesso nas duas Regiões.' },
            { id: 'b', text: 'Sim: a réplica copia a key policy da principal', correct: false, consequence: 'O que se compartilha é o material, o ID e a rotação.' },
          ],
        },
        {
          id: 'sec.f02.m2.a3',
          kind: 'predict',
          title: 'O grant da cópia noturna',
          prompt: 'A key policy da chave dos sinistros não cita a role copia-noturna. Há um grant para ela com Decrypt e GenerateDataKey. Ela pede Decrypt.',
          concepts: [{ id: 'kms.grants' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O grant permite as operações dele, sem precisar da key policy. Quando a cópia termina, o grant é apagado.'],
          spec: { sim: 'kms', world: GRANT_WORLD, request: { principalId: 'backup', action: 'kms:Decrypt' } },
          options: [
            { id: 'a', text: 'Permitido, pelo grant', outcome: 'allow' },
            { id: 'b', text: 'Negado, porque a key policy não cita a role', outcome: 'deny' },
          ],
        },
      ],
      debrief: { takeaways: ['Multi-Região: mesmo material, decifra na outra Região.', 'Key policy, grants e alias são de cada réplica.', 'Grant: acesso pontual sem mudar a key policy.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f02.m3',
      title: 'Limites e HSM dedicado',
      type: 'mission',
      summary: 'A cota de requisições, as bucket keys e o CloudHSM.',
      briefing: {
        company: 'Seguradora Horizonte',
        role: 'Você revisa a arquitetura de criptografia.',
        situation: 'Um bucket de fotos de sinistros com SSE-KMS recebe milhares de leituras por segundo e começou a receber erros de limite. Uma norma nova de um cliente corporativo exige que as chaves fiquem num HSM dedicado só à seguradora.',
        objective: 'Resolver o limite de requisições e decidir onde ficam as chaves exigidas pela norma.',
        successCriteria: ['Reduzir as chamadas ao KMS', 'Escolher entre KMS e CloudHSM'],
      },
      intel: [
        { conceptId: 'kms.quotas', body: ['As operações simétricas dividem uma **cota por segundo** por conta e Região. Cada leitura com SSE-KMS conta. As **bucket keys** reduzem as chamadas do S3 ao KMS.'] },
        { conceptId: 'hsm.cloudhsm', body: ['**CloudHSM**: HSMs **dedicados** a um cliente, em cluster, com a AWS sem acesso às chaves. Validação **FIPS 140-2 ou 140-3 nível 3** no modo FIPS.'] },
        { conceptId: 'hsm.kms-vs-cloudhsm', body: ['O KMS é o padrão. O CloudHSM entra quando a regra pede **HSM dedicado** ou controle exclusivo.'] },
      ],
      activities: [
        {
          id: 'sec.f02.m3.a1',
          kind: 'decision',
          title: 'ThrottlingException nas fotos',
          prompt: 'As leituras das fotos falham com ThrottlingException do KMS nos horários de pico. Qual a primeira medida?',
          concepts: [{ id: 'kms.quotas' }, { id: 's3.bucket-keys', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada leitura com SSE-KMS chama o KMS e conta na cota. A bucket key do S3 reduz muito essas chamadas. Pedir aumento da cota também é possível, mas não resolve a causa.'],
          options: [
            { id: 'a', text: 'Ligar a bucket key no bucket', correct: true, consequence: 'O S3 passa a chamar bem menos o KMS.' },
            { id: 'b', text: 'Trocar a chave por uma multi-Região', correct: false, consequence: 'A cota é da conta e da Região, não da chave.' },
            { id: 'c', text: 'Desligar a criptografia do bucket', correct: false, consequence: 'Resolve o limite expondo as fotos.' },
          ],
        },
        {
          id: 'sec.f02.m3.a2',
          kind: 'decision',
          title: 'A norma do HSM dedicado',
          prompt: 'O cliente exige chaves num HSM dedicado só à seguradora, com a AWS sem acesso a elas. O que usar?',
          concepts: [{ id: 'hsm.kms-vs-cloudhsm' }, { id: 'hsm.cloudhsm', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O CloudHSM entrega HSMs de um só cliente, que gerencia os próprios usuários. O KMS usa HSMs gerenciados pela AWS.'],
          options: [
            { id: 'a', text: 'AWS CloudHSM, com HSMs em mais de uma zona de disponibilidade', correct: true, consequence: 'Atende à norma, com o cluster resistindo à perda de uma zona.' },
            { id: 'b', text: 'KMS com chave gerenciada pelo cliente', correct: false, consequence: 'É o padrão para quase tudo, mas os HSMs são gerenciados pela AWS.' },
            { id: 'c', text: 'Guardar as chaves num arquivo cifrado no S3', correct: false, consequence: 'Não é um HSM.' },
          ],
        },
        {
          id: 'sec.f02.m3.a3',
          kind: 'decision',
          title: 'CloudHSM para o bucket de logs?',
          prompt: 'Depois da norma, alguém sugere mover também o bucket de logs internos, sem nenhuma exigência especial, para chaves no CloudHSM. O que responder?',
          concepts: [{ id: 'hsm.kms-vs-cloudhsm' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O CloudHSM cobra cada HSM por hora e exige operar o cluster. Sem exigência de HSM dedicado, o KMS atende com menos custo e trabalho.'],
          options: [
            { id: 'a', text: 'Manter o KMS para os logs; o CloudHSM fica só onde a norma exige', correct: true, consequence: 'Custo e operação só onde há exigência.' },
            { id: 'b', text: 'Mover tudo para o CloudHSM, por padronização', correct: false, consequence: 'Paga HSMs dedicados sem necessidade.' },
          ],
        },
        {
          id: 'sec.f02.m3.a4',
          kind: 'estimate',
          title: 'Quanto custa o HSM dedicado',
          prompt: `Com a tabela de preços da trilha (us-east-1, ${SEC_PRICE_DATE}), quanto custa por mês um cluster do CloudHSM com **dois HSMs**, um em cada zona, ligados as 730 horas do mês?`,
          concepts: [{ id: 'hsm.kms-vs-cloudhsm' }],
          xp: 50,
          difficulty: 2,
          explanation: [
            `Cada HSM custa ${usd(PRICES.cloudHsm.hsmHour)} por hora: 2 × ${usd(PRICES.cloudHsm.hsmHour)} × 730 horas ≈ ${usd(HSM_MONTH)} por mês.`,
            `Para comparar: dez chaves do KMS gerenciadas pelo cliente custam cerca de ${usd(KMS_MONTH)} por mês, mais as requisições. Por isso o CloudHSM fica só onde a regra exige.`,
            'Estimativa pela primeira faixa de preço, sem impostos.',
          ],
          unit: 'US$ por mês',
          min: 100,
          max: 10000,
          step: 10,
          scale: 'log',
          answer: HSM_MONTH,
          tolerance: 0.15,
        },
      ],
      debrief: { takeaways: ['Cota por conta e Região; bucket keys reduzem as chamadas do S3.', 'CloudHSM só quando a regra pede HSM dedicado.', 'KMS como padrão.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'sec.f02.boss',
      title: 'A noite em que nada abria',
      type: 'boss',
      summary: 'Uma falha geral de leitura e a causa escondida no registro do KMS.',
      briefing: {
        company: 'Seguradora Horizonte',
        role: 'Você investiga uma falha geral de leitura das apólices.',
        situation: 'Às 00h01 de domingo, todas as leituras de apólices começaram a falhar. Ninguém mexeu na key policy. O registro do CloudTrail e o estado da chave estão abaixo.',
        objective: 'Achar a causa e corrigir sem perder dados.',
        successCriteria: ['Marcar as linhas que explicam a falha', 'Escolher a causa e as correções'],
      },
      intel: [
        { conceptId: 'kms.imported-material', body: ['Quando o material importado expira, a chave fica inutilizável até o material ser importado de novo.'] },
        { conceptId: 'kms.rotation', body: ['A rotação nunca torna dados antigos ilegíveis.'] },
      ],
      activities: [
        {
          id: 'sec.f02.boss.a1',
          kind: 'investigate',
          title: 'O registro da madrugada',
          prompt: 'Leia o registro, marque as linhas que explicam a falha e escolha a causa e as correções.',
          concepts: [{ id: 'kms.imported-material' }, { id: 'kms.rotation', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          explanation: ['A chave das apólices usa material importado com expiração. À meia-noite, o material expirou e a chave ficou inutilizável. A rotação da outra chave e a cópia noturna não têm relação com a falha.'],
          scenario: ['Formato simplificado: horário, origem e mensagem.'],
          artifacts: [
            {
              id: 'log',
              title: 'CloudTrail e estado das chaves',
              format: 'log',
              lines: [
                { id: 'l1', text: '23:10  kms  RotateKey  chave sinistros (rotação automática)', isIssue: false, explanation: 'A rotação da outra chave não torna dados ilegíveis.' },
                { id: 'l2', text: '23:30  kms  Decrypt  copia-noturna  via grant  OK', isIssue: false, explanation: 'A cópia usou o grant normalmente.' },
                { id: 'l3', text: '00:00  kms  chave apolices  Origin=EXTERNAL  ValidTo=domingo 00:00', isIssue: true, explanation: 'O material importado tinha data para expirar.' },
                { id: 'l4', text: '00:00  kms  chave apolices  KeyState=PendingImport', isIssue: true, explanation: 'Sem material, a chave aguarda uma nova importação.' },
                { id: 'l5', text: '00:01  kms  Decrypt  app-apolices  KMSInvalidStateException', isIssue: true, explanation: 'O sintoma: a chave não está em estado de uso.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'a', text: 'O material importado da chave das apólices expirou à meia-noite', correct: true, feedback: 'A chave ficou sem material e parou de decifrar.' },
              { id: 'b', text: 'A rotação automática tornou as apólices antigas ilegíveis', correct: false, feedback: 'A rotação foi em outra chave, e a rotação guarda o material antigo.' },
              { id: 'c', text: 'O grant da cópia noturna bloqueou a chave', correct: false, feedback: 'Um grant só permite; ele não bloqueia nada.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções fazem sentido?',
            options: [
              { id: 'a', text: 'Importar de novo o mesmo material no HSM próprio para a chave voltar a funcionar', correct: true, feedback: 'Os dados voltam a abrir sem nenhuma perda.' },
              { id: 'b', text: 'Criar um alarme para a data de expiração do material importado', correct: true, feedback: 'A próxima expiração não pega ninguém de surpresa.' },
              { id: 'c', text: 'Apagar a chave e criar outra com o mesmo nome', correct: false, feedback: 'Uma chave nova tem outro material e não decifra as apólices antigas.' },
            ],
          },
        },
      ],
      debrief: { takeaways: ['Material importado com expiração para a chave inteira.', 'Rotação não quebra a leitura de dados antigos.', 'Uma chave nova não decifra o que a antiga cifrou.'] },
    },
  ],
}
