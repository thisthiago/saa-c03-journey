/**
 * Fase 7 — AWS Backup. Planos e cofres, frio e contínuo, cópias entre
 * Regiões e contas, Vault Lock, cofre isolado e teste de restauração.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { BackupLabConfig } from '../../../../../simulators/backup/lab'
import type { BackupPlan } from '../../../../../simulators/backup/model'
import { META } from '../meta'

export const AURORA_BACKUP: BackupLabConfig = {
  needs: [
    { id: 'prontuarios', label: 'Prontuários digitalizados', resource: 'efs', rpoHours: 24, retentionDays: 1825, mustSurvive: ['region-outage', 'account-compromised'], lockRule: 'legal', storedGB: 3000, concepts: ['bkp.cold-storage', 'bkp.copy', 'bkp.vault-lock'] },
    { id: 'agenda', label: 'Agenda de consultas', resource: 'rds', rpoHours: 0.25, retentionDays: 35, mustSurvive: ['account-compromised'], lockRule: 'none', concepts: ['bkp.continuous', 'bkp.copy'] },
    { id: 'laudos', label: 'Laudos dos médicos', resource: 'fsx-windows', rpoHours: 12, retentionDays: 90, mustSurvive: ['region-outage'], lockRule: 'adjustable', concepts: ['bkp.plan', 'bkp.copy', 'bkp.vault-lock'] },
    { id: 'servidores', label: 'Discos dos servidores de aplicação', resource: 'ebs', rpoHours: 168, retentionDays: 365, mustSurvive: [], lockRule: 'none', concepts: ['bkp.plan', 'bkp.cold-storage'] },
    { id: 'fiscal', label: 'Arquivo fiscal', resource: 'ebs', rpoHours: 720, retentionDays: 3650, mustSurvive: ['region-outage'], lockRule: 'legal', concepts: ['bkp.cold-storage', 'bkp.vault-lock'] },
  ],
}

const plan = (x: Partial<BackupPlan>): BackupPlan => ({ resource: 'efs', frequency: 'daily', retentionDays: 365, copy: 'none', lock: 'none', ...x })

export const F07_FIL: PhaseDef = {
  ...META.f07,
  concepts: ['bkp.aws-backup', 'bkp.plan', 'bkp.vault', 'backup.independent-copy', 'gov.org-policies', 'dr.rpo-rto', 'bkp.cold-storage', 'bkp.continuous', 'ebs.snapshots', 'bkp.copy', 'bkp.vault-lock', 'bkp.air-gapped', 'bkp.restore-testing'],
  availability: 'available',
  simplifications: ['O hospital, os sistemas e os prazos são fictícios.', 'Cada recurso tem uma regra de backup; na prática, um plano pode ter várias.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fil.f07.m1',
      title: 'Cada time com seu script',
      type: 'mission',
      summary: 'AWS Backup, planos, regras, cofres e o RPO.',
      briefing: {
        company: 'Hospital Santa Aurora',
        role: 'Você assume a proteção de dados de um hospital.',
        situation: 'Cada time faz backup do seu jeito: scripts de snapshot do EBS, exportações do banco e cópias manuais do EFS. Na última auditoria, ninguém soube dizer o que estava protegido, e um servidor criado no mês passado não tinha backup nenhum.',
        objective: 'Centralizar os backups com regras claras que pegam também os recursos novos.',
        successCriteria: ['Centralizar no AWS Backup', 'Escolher a frequência pelo RPO', 'Proteger os backups de quem apaga a origem'],
      },
      intel: [
        { conceptId: 'bkp.aws-backup' },
        { conceptId: 'bkp.plan', body: ['Um **plano** tem **regras**: frequência (de hora em hora a mensal), janela, **retenção** (de 1 dia a 100 anos), cofre, cópias e frio. Os recursos entram por **tags**. A frequência define o **RPO**.'] },
        { conceptId: 'bkp.vault', body: ['O **cofre** guarda os backups **separados da origem**, com chave do KMS e política de acesso. Apagar o volume não apaga o backup.'] },
      ],
      activities: [
        {
          id: 'fil.f07.m1.a1',
          kind: 'decision',
          title: 'Um lugar para todos os backups',
          prompt: 'Como garantir que todo recurso, inclusive os criados amanhã, entre no backup com regras auditáveis?',
          concepts: [{ id: 'bkp.plan' }, { id: 'bkp.aws-backup', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Um plano do AWS Backup que seleciona os recursos por tag pega também o que for criado depois, desde que tenha a tag; os relatórios mostram o que está protegido.'],
          options: [
            { id: 'a', text: 'Um plano do AWS Backup que seleciona os recursos pela tag backup, exigida na criação', correct: true, consequence: 'Recurso novo com a tag entra no plano sozinho.' },
            { id: 'b', text: 'Manter os scripts e pedir aos times que avisem quando criarem recursos', correct: false, consequence: 'Foi assim que o servidor do mês passado ficou sem backup.' },
            { id: 'c', text: 'Ligar o versionamento em todos os buckets', correct: false, consequence: 'Não protege EBS, EFS nem bancos.' },
          ],
        },
        {
          id: 'fil.f07.m1.a2',
          kind: 'predict',
          title: 'O RPO do backup diário',
          prompt: 'O sistema de arquivos dos prontuários tem backup diário. No pior caso, quantas horas de alterações se perdem numa restauração?',
          concepts: [{ id: 'bkp.plan' }, { id: 'dr.rpo-rto' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Com um backup a cada 24 horas, o que mudou desde o último backup se perde: até 24 horas.'],
          spec: { sim: 'backup', plan: plan({ frequency: 'daily' }), query: { type: 'rpo' } },
          options: [
            { id: 'a', text: '24 horas', outcome: '24' },
            { id: 'b', text: '12 horas', outcome: '12' },
            { id: 'c', text: '1 hora', outcome: '1' },
          ],
        },
        {
          id: 'fil.f07.m1.a3',
          kind: 'predict',
          title: 'O volume apagado',
          prompt: 'Um técnico apaga por engano um volume EBS que tinha backup no cofre. O backup sobrevive?',
          concepts: [{ id: 'bkp.vault' }, { id: 'backup.independent-copy', weight: 0.5 }, { id: 'ebs.snapshots', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['O cofre guarda os pontos de recuperação separados da origem, e eles seguem a própria retenção.'],
          spec: { sim: 'backup', plan: plan({ resource: 'ebs' }), query: { type: 'survives', disaster: 'source-deleted' } },
          options: [
            { id: 'a', text: 'Sim', outcome: 'yes' },
            { id: 'b', text: 'Não', outcome: 'no' },
          ],
        },
        {
          id: 'fil.f07.m1.a4',
          kind: 'decision',
          title: 'As 60 contas do grupo',
          prompt: 'O hospital faz parte de um grupo com 60 contas no AWS Organizations, e a diretoria quer o mesmo plano de backup em todas, sem depender de cada time. O que usar?',
          concepts: [{ id: 'gov.org-policies' }, { id: 'bkp.plan', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Uma política de backup do Organizations aplica o plano do AWS Backup às contas escolhidas, pelos recursos com as tags definidas.'],
          options: [
            { id: 'a', text: 'Uma política de backup do AWS Organizations aplicada às contas', correct: true, consequence: 'O mesmo plano chega a todas as contas, inclusive às novas.' },
            { id: 'b', text: 'Uma SCP que exige backup', correct: false, consequence: 'SCP limita permissões; não cria planos de backup.' },
            { id: 'c', text: 'Criar o plano à mão em cada conta', correct: false, consequence: 'Funciona hoje e diverge amanhã.' },
          ],
        },
      ],
      debrief: { takeaways: ['AWS Backup: planos com regras e seleção por tags.', 'A frequência define o RPO.', 'O cofre guarda os backups separados da origem.', 'Várias contas: política de backup do Organizations.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f07.m2',
      title: 'Guardar por cinco anos',
      type: 'mission',
      summary: 'Armazenamento frio e backup contínuo.',
      briefing: {
        company: 'Hospital Santa Aurora',
        role: 'Você ajusta as regras para as exigências da lei e dos médicos.',
        situation: 'Os prontuários precisam ser guardados por cinco anos, e a conta dos backups subiu muito. A agenda de consultas, num banco RDS, não pode perder mais de 15 minutos de marcações.',
        objective: 'Reduzir o custo dos backups longos e cumprir o RPO da agenda.',
        successCriteria: ['Usar o frio sem o plano ser recusado', 'Escolher o contínuo onde ele existe'],
      },
      intel: [
        { conceptId: 'bkp.cold-storage', body: ['O **frio** custa bem menos, mas o backup fica nele **no mínimo 90 dias**: a retenção precisa ser **90 dias maior** que a transição. Existe para **EFS**, **EBS** (backups mensais) e DynamoDB com recursos avançados; não para RDS nem FSx.'] },
        { conceptId: 'bkp.continuous', body: ['O **contínuo** restaura **qualquer momento** dos últimos **1 a 35 dias**. Existe para **RDS, Aurora, S3** e SAP HANA.'] },
      ],
      activities: [
        {
          id: 'fil.f07.m2.a1',
          kind: 'predict',
          title: 'Frio com retenção curta',
          prompt: 'Uma regra de backup do EFS manda para o frio depois de 30 dias e apaga depois de 60. O AWS Backup aceita o plano?',
          concepts: [{ id: 'bkp.cold-storage' }],
          xp: 40,
          difficulty: 2,
          explanation: ['No frio, o backup fica no mínimo 90 dias: com transição em 30 dias, a retenção precisa ser de pelo menos 120.'],
          spec: { sim: 'backup', plan: plan({ coldAfterDays: 30, retentionDays: 60 }), query: { type: 'valid' } },
          options: [
            { id: 'a', text: 'Recusa o plano', outcome: 'rejected' },
            { id: 'b', text: 'Aceita o plano', outcome: 'accepted' },
          ],
        },
        {
          id: 'fil.f07.m2.a2',
          kind: 'predict',
          title: 'Frio para os prontuários',
          prompt: 'A regra dos prontuários (EFS) faz backup diário, manda para o frio depois de 30 dias e guarda por cinco anos (1.825 dias). O plano é aceito?',
          concepts: [{ id: 'bkp.cold-storage' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O EFS tem frio, e 1.825 dias passam com folga dos 30 + 90 exigidos.'],
          spec: { sim: 'backup', plan: plan({ coldAfterDays: 30, retentionDays: 1825 }), query: { type: 'valid' } },
          options: [
            { id: 'a', text: 'Aceita o plano', outcome: 'accepted' },
            { id: 'b', text: 'Recusa o plano', outcome: 'rejected' },
          ],
        },
        {
          id: 'fil.f07.m2.a3',
          kind: 'decision',
          title: 'Quinze minutos de marcações',
          prompt: 'A agenda de consultas roda num RDS e não pode perder mais de 15 minutos de marcações. Os backups ficam 14 dias. Qual regra usar?',
          concepts: [{ id: 'bkp.continuous' }, { id: 'dr.rpo-rto', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O backup contínuo do RDS permite restaurar qualquer momento dos últimos dias; nenhum snapshot periódico chega a 15 minutos.'],
          options: [
            { id: 'a', text: 'Backup contínuo com retenção de 14 dias', correct: true, consequence: 'Restaura o banco no minuto anterior ao problema.' },
            { id: 'b', text: 'Snapshot a cada hora', correct: false, consequence: 'Perde até uma hora de marcações.' },
            { id: 'c', text: 'Snapshot diário com cópia para outra Região', correct: false, consequence: 'Perde até um dia.' },
          ],
        },
        {
          id: 'fil.f07.m2.a4',
          kind: 'predict',
          title: 'Contínuo por 90 dias',
          prompt: 'Alguém configurou o backup contínuo do RDS com retenção de 90 dias. O plano é aceito?',
          concepts: [{ id: 'bkp.continuous' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O contínuo guarda de 1 a 35 dias. Para guardar mais, combina-se com snapshots periódicos de retenção longa.'],
          spec: { sim: 'backup', plan: plan({ resource: 'rds', frequency: 'continuous', retentionDays: 90 }), query: { type: 'valid' } },
          options: [
            { id: 'a', text: 'Recusa o plano', outcome: 'rejected' },
            { id: 'b', text: 'Aceita o plano', outcome: 'accepted' },
          ],
        },
      ],
      debrief: { takeaways: ['Frio: no mínimo 90 dias nele; retenção = transição + 90 ou mais.', 'Contínuo: qualquer momento dos últimos 35 dias, para RDS, Aurora e S3.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f07.m3',
      title: 'O ataque à conta',
      type: 'mission',
      summary: 'Cópias, Vault Lock, cofre isolado e teste de restauração.',
      briefing: {
        company: 'Hospital Santa Aurora',
        role: 'Você prepara o hospital para o pior dia.',
        situation: 'Um hospital vizinho teve a conta invadida: o atacante cifrou os servidores e apagou os backups. A lei exige que os prontuários não possam ser apagados antes de cinco anos, por ninguém. E a diretoria quer saber quanto tempo levaria para voltar.',
        objective: 'Fazer os backups sobreviverem a um invasor, à perda da Região e a um administrador mal-intencionado, e provar que a restauração cabe no prazo.',
        successCriteria: ['Prever o que sobrevive a cada desastre', 'Escolher a trava certa', 'Medir o tempo de restauração'],
      },
      intel: [
        { conceptId: 'bkp.copy', body: ['A cópia em **outra Região** protege contra a perda da Região; a cópia em **outra conta** da organização, contra quem domina a conta de origem.'] },
        { conceptId: 'bkp.vault-lock' },
        { conceptId: 'bkp.air-gapped', body: ['O **cofre logicamente isolado** já vem trancado em **conformidade** e pode ser **compartilhado** com outra conta, que restaura direto dele.'] },
        { conceptId: 'bkp.restore-testing', body: ['O **teste de restauração** restaura backups num agendamento, **mede o tempo** e apaga o que restaurou: prova o **RTO**.'] },
      ],
      activities: [
        {
          id: 'fil.f07.m3.a1',
          kind: 'predict',
          title: 'Governança contra o invasor',
          prompt: 'O cofre dos prontuários tem Vault Lock em governança, e não há cópias. Um invasor com acesso total à conta tenta apagar os backups. Eles sobrevivem?',
          concepts: [{ id: 'bkp.vault-lock' }, { id: 'bkp.copy', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['No modo governança, quem tem a permissão remove a trava; com acesso total, o invasor tem. Sem cópia em outra conta, nada sobra.'],
          spec: { sim: 'backup', plan: plan({ lock: 'governance' }), query: { type: 'survives', disaster: 'account-compromised' } },
          options: [
            { id: 'a', text: 'Não', outcome: 'no' },
            { id: 'b', text: 'Sim', outcome: 'yes' },
          ],
        },
        {
          id: 'fil.f07.m3.a2',
          kind: 'predict',
          title: 'Conformidade contra o administrador',
          prompt: 'Agora o cofre tem Vault Lock em conformidade, já passada a carência. Um administrador da conta tenta apagar os backups antes do fim da retenção. Eles sobrevivem?',
          concepts: [{ id: 'bkp.vault-lock' }],
          xp: 40,
          difficulty: 2,
          explanation: ['No modo conformidade, depois da carência, ninguém apaga os backups antes do fim da retenção, nem a conta raiz.'],
          spec: { sim: 'backup', plan: plan({ lock: 'compliance' }), query: { type: 'survives', disaster: 'admin-deletes-backups' } },
          options: [
            { id: 'a', text: 'Sim', outcome: 'yes' },
            { id: 'b', text: 'Não', outcome: 'no' },
          ],
        },
        {
          id: 'fil.f07.m3.a3',
          kind: 'predict',
          title: 'Cópia em outra conta e a Região fora',
          prompt: 'Os backups têm cópia num cofre de outra conta, na mesma Região. A Região inteira fica fora. Dá para restaurar?',
          concepts: [{ id: 'bkp.copy' }],
          xp: 50,
          difficulty: 3,
          explanation: ['A cópia em outra conta protege contra a invasão da conta, não contra a perda da Região: as duas cópias estão na Região que caiu.'],
          spec: { sim: 'backup', plan: plan({ copy: 'account' }), query: { type: 'survives', disaster: 'region-outage' } },
          options: [
            { id: 'a', text: 'Não', outcome: 'no' },
            { id: 'b', text: 'Sim', outcome: 'yes' },
          ],
        },
        {
          id: 'fil.f07.m3.a4',
          kind: 'decision',
          title: 'Voltar rápido depois da invasão',
          prompt: 'Se a conta de produção for invadida, o hospital quer restaurar os sistemas a partir de outra conta, sem depender de copiar os backups de volta. O que usar?',
          concepts: [{ id: 'bkp.air-gapped' }],
          xp: 50,
          difficulty: 3,
          explanation: ['O cofre logicamente isolado nasce trancado em conformidade e pode ser compartilhado com uma conta de recuperação, que restaura direto dele.'],
          options: [
            { id: 'a', text: 'Copiar os backups para um cofre logicamente isolado compartilhado com a conta de recuperação', correct: true, consequence: 'A conta de recuperação restaura direto do cofre, mesmo com a produção comprometida.' },
            { id: 'b', text: 'Ligar o Vault Lock em governança no cofre de produção', correct: false, consequence: 'O invasor com permissão remove a trava.' },
            { id: 'c', text: 'Aumentar a retenção para dez anos', correct: false, consequence: 'O invasor apaga do mesmo jeito.' },
          ],
        },
        {
          id: 'fil.f07.m3.a5',
          kind: 'decision',
          title: 'Quanto tempo para voltar',
          prompt: 'A diretoria quer provas, todo mês, de que os backups restauram e de que a restauração cabe nas 4 horas combinadas. O que configurar?',
          concepts: [{ id: 'bkp.restore-testing' }, { id: 'dr.rpo-rto', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O teste de restauração restaura backups num agendamento, mede o tempo de cada um e apaga os recursos restaurados.'],
          options: [
            { id: 'a', text: 'Um plano de teste de restauração mensal, com o resultado conferido contra as 4 horas', correct: true, consequence: 'Cada mês há prova de que o backup restaura e de quanto tempo leva.' },
            { id: 'b', text: 'Conferir se os trabalhos de backup terminaram com sucesso', correct: false, consequence: 'Backup concluído não prova que a restauração funciona nem quanto leva.' },
            { id: 'c', text: 'Fazer backups mais frequentes', correct: false, consequence: 'Melhora o RPO, não prova o RTO.' },
          ],
        },
      ],
      debrief: { takeaways: ['Outra Região contra a perda da Região; outra conta contra a invasão.', 'Conformidade: ninguém apaga antes do prazo; governança: quem tem permissão apaga.', 'Teste de restauração prova o RTO.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f07.boss',
      title: 'O plano de backup do hospital',
      type: 'boss',
      summary: 'Frequência, frio, cópia e trava de cinco recursos.',
      briefing: {
        company: 'Hospital Santa Aurora',
        role: 'Você entrega o plano de backup à auditoria.',
        situation: 'Cinco recursos, cada um com um RPO, uma retenção e as ameaças que os backups precisam aguentar. A lei proíbe apagar alguns antes do prazo; outros só precisam de proteção contra engano.',
        objective: 'Escolher, para cada recurso, a regra que cumpre tudo pelo menor custo.',
        successCriteria: ['Todo RPO cumprido', 'Todo desastre pedido coberto', 'Nada pago além do necessário'],
      },
      intel: [{ conceptId: 'bkp.plan', body: ['Leia cada exigência e pergunte: qual frequência mais espaçada cumpre o RPO? O frio é aceito para esse recurso e essa retenção? Que desastre pede cópia? A lei proíbe apagar?'] }],
      activities: [
        {
          id: 'fil.f07.boss.a1',
          kind: 'lab',
          lab: 'backup',
          title: 'Cinco regras de backup',
          prompt: 'Para cada recurso, escolha a frequência, o armazenamento frio, a cópia e a trava do cofre.',
          concepts: [{ id: 'bkp.plan' }, { id: 'bkp.cold-storage' }, { id: 'bkp.copy' }, { id: 'bkp.vault-lock' }, { id: 'bkp.continuous' }],
          xp: 260,
          difficulty: 3,
          hints: ['O RDS e o FSx não têm frio, e o EBS só tem com backups mensais.', 'Abaixo de uma hora de perda, só o contínuo atende.'],
          explanation: [
            'Prontuários: diário, frio, cópia em outra conta e outra Região, conformidade. Agenda: contínuo, quente, cópia em outra conta. Laudos: a cada 12 horas, quente, outra Região, governança.',
            'Discos dos servidores: semanal, quente, sem cópia nem trava. Arquivo fiscal: mensal, frio pelo EBS Snapshot Archive, outra Região, conformidade.',
          ],
          config: AURORA_BACKUP,
        },
      ],
      debrief: { takeaways: ['A frequência sai do RPO; o frio, da retenção e do recurso.', 'A cópia sai dos desastres; a trava, da lei.'] },
    },
  ],
}
