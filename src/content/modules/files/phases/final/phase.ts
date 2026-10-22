/** Desafio final — A Mudança do Escritório (empresa fictícia: Estúdio Traço Livre). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const TRACO_LIVRE: ArchitectureLabConfig = {
  title: 'Relatório da Mudança do Escritório',
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
      id: 'linux',
      title: 'Arquivos dos servidores Linux',
      intro: 'O **Estúdio Traço Livre**, de arquitetura, vai fechar o data center. O portal de projetos roda em servidores Linux em duas AZs, que leem e gravam as mesmas pranchas e não podem parar se uma AZ cair.',
      questions: [
        {
          id: 'compartilhado',
          prompt: 'Onde ficam os arquivos do portal?',
          options: [
            { id: 'efs-regional', label: 'EFS Regional com um mount target em cada AZ com servidores', scores: { resiliente: 1, requisitos: 1, custo: 1, desempenho: 1 }, consequence: 'Os servidores das duas AZs veem os mesmos arquivos, e uma AZ fora não derruba o portal.', concepts: ['efs.file-system-types', 'efs.mount-targets'] },
            { id: 'efs-onezone', label: 'EFS One Zone na primeira AZ', scores: { resiliente: 0.3, requisitos: 0.5, custo: 1, desempenho: 0.8 }, consequence: 'Com a AZ do sistema de arquivos fora, o portal inteiro para, e os dados podem se perder.', whyNot: 'One Zone é para o que pode parar e ser recriado.', concepts: ['efs.file-system-types'] },
            { id: 'ebs', label: 'Um volume EBS em cada servidor, sincronizados à noite', scores: { resiliente: 0.5, requisitos: 0.3, custo: 0.8 }, consequence: 'Durante o dia, cada servidor mostra uma versão diferente das pranchas.', whyNot: 'EBS é disco de uma instância, não arquivo compartilhado.', concepts: ['efs.what', 'files.choose'] },
          ],
        },
      ],
    },
    {
      id: 'classes',
      title: 'Desempenho e classes do EFS',
      intro: 'Setenta por cento das pranchas são de obras entregues e quase nunca são abertas. O acesso tem picos fortes na semana de entrega de cada projeto e fica baixo no resto do mês.',
      questions: [
        {
          id: 'vazao',
          prompt: 'Que vazão e que ciclo de vida usar?',
          options: [
            { id: 'elastic-ciclo', label: 'Vazão Elastic, com ciclo de vida para o Infrequent Access em 30 dias e para o Archive em 90', scores: { custo: 1, desempenho: 1, requisitos: 1 }, consequence: 'Os picos são atendidos sem provisionar, e as obras entregues custam centavos por GB.', concepts: ['efs.throughput-modes', 'efs.lifecycle', 'efs.storage-classes'] },
            { id: 'provisioned', label: 'Vazão Provisioned no valor do pico, tudo na Standard', scores: { custo: 0.3, desempenho: 1, requisitos: 0.8 }, consequence: 'Paga o pico o mês inteiro e Standard por pranchas que ninguém abre.', whyNot: 'Carga com picos e dados frios pede Elastic com ciclo de vida.', concepts: ['efs.throughput-modes', 'efs.storage-classes'] },
            { id: 'bursting-ciclo', label: 'Vazão Bursting, com ciclo de vida para o Infrequent Access', scores: { custo: 0.8, desempenho: 0.4, requisitos: 0.6 }, consequence: 'Com 70% dos dados fora da Standard, a base do Bursting cai, e os picos de entrega esgotam os créditos.', whyNot: 'A base do Bursting conta só a Standard.', concepts: ['efs.throughput-modes', 'efs.lifecycle'] },
          ],
        },
      ],
    },
    {
      id: 'windows',
      title: 'Compartilhamentos Windows',
      intro: 'Sessenta arquitetos usam Windows e abrem as pastas por SMB, com permissões por equipe no Active Directory do estúdio. O compartilhamento não pode parar, e pedidos de "apaguei sem querer" são comuns.',
      questions: [
        {
          id: 'smb',
          prompt: 'Como levar os compartilhamentos?',
          options: [
            { id: 'fsxw-multi', label: 'FSx for Windows File Server Multi-AZ, ligado ao AD do estúdio, com cópias de sombra', scores: { seguro: 1, resiliente: 1, requisitos: 1, desempenho: 1 }, consequence: 'As permissões migram como estão, o failover leva segundos e o usuário recupera as próprias versões.', concepts: ['fsxw.what', 'fsxw.deployment', 'fsxw.shadow-copies'] },
            { id: 'fsxw-single', label: 'FSx for Windows File Server Single-AZ, ligado ao AD do estúdio', scores: { seguro: 1, resiliente: 0.4, requisitos: 0.6, custo: 1 }, consequence: 'Mais barato, mas fica fora junto com a AZ e para cerca de 30 minutos a cada falha.', whyNot: 'O compartilhamento não pode parar.', concepts: ['fsxw.deployment'] },
            { id: 'efs-samba', label: 'EFS com um servidor Samba numa instância EC2', scores: { seguro: 0.5, resiliente: 0.4, requisitos: 0.4 }, consequence: 'Um servidor para manter, sem integração gerenciada com o AD nem failover.', whyNot: 'SMB com AD gerenciado é o FSx for Windows.', concepts: ['efs.what', 'files.choose'] },
          ],
        },
      ],
    },
    {
      id: 'render',
      title: 'Armazenamento da renderização',
      intro: 'Toda sexta, 200 instâncias Spot renderizam as cenas da semana por oito horas, lendo os modelos guardados no S3. As imagens prontas voltam para o S3, e a renderização pode ser refeita se algo falhar.',
      questions: [
        {
          id: 'hpc',
          prompt: 'Que sistema de arquivos usar na renderização?',
          options: [
            { id: 'lustre-scratch', label: 'FSx for Lustre scratch ligado ao bucket, exportando as imagens e apagado depois', scores: { desempenho: 1, custo: 1, requisitos: 1 }, consequence: 'Vazão para as 200 instâncias, pago só nas horas de uso, e nada se perde porque origem e resultado estão no S3.', concepts: ['lustre.what', 'lustre.deployment', 'lustre.s3-link'] },
            { id: 'lustre-persistente', label: 'FSx for Lustre persistente, ligado o mês inteiro', scores: { desempenho: 1, custo: 0.4, requisitos: 0.9, resiliente: 1 }, consequence: 'Funciona, mas paga um sistema de arquivos parado seis dias por semana.', whyNot: 'Trabalho curto e refazível pede scratch.', concepts: ['lustre.deployment'] },
            { id: 'efs-render', label: 'O mesmo EFS do portal', scores: { desempenho: 0.4, custo: 0.6, requisitos: 0.6 }, consequence: 'As 200 instâncias disputam o EFS do portal, e a vazão cobrada dispara na sexta.', whyNot: 'Centenas de servidores em paralelo lendo do S3 é caso de Lustre.', concepts: ['lustre.what', 'files.choose'] },
          ],
        },
      ],
    },
    {
      id: 'migracao',
      title: 'Migração dos arquivos existentes',
      intro: 'O NAS do estúdio tem 40 TB: pastas SMB que vão para o FSx e diretórios NFS que vão para o EFS. Há um link de 1 Gbps, e o estúdio quer verificação de cada arquivo copiado.',
      questions: [
        {
          id: 'copia',
          prompt: 'Como copiar os 40 TB?',
          options: [
            { id: 'datasync', label: 'AWS DataSync, com um agente no escritório, para o FSx e para o EFS', scores: { requisitos: 1, resiliente: 1, desempenho: 1, custo: 1 }, consequence: 'Cópia incremental, verificada e retomável, direto para os destinos.', concepts: ['mig.datasync'] },
            { id: 'fsx-gateway', label: 'Instalar o FSx File Gateway e copiar por ele', scores: { requisitos: 0.2, resiliente: 0.5 }, consequence: 'O FSx File Gateway não aceita novos clientes desde 28/10/2024.', whyNot: 'Serviço indisponível para novos clientes.', concepts: ['sgw.fsx-file'] },
            { id: 'manual', label: 'Copiar com scripts num computador do escritório', scores: { requisitos: 0.5, resiliente: 0.5, custo: 1 }, consequence: 'Sem verificação nem retomada gerenciada, e alguém precisa acompanhar semanas de cópia.', whyNot: 'Falta a verificação pedida.', concepts: ['mig.datasync'] },
          ],
        },
      ],
    },
    {
      id: 'parceiros',
      title: 'Entrada de arquivos dos parceiros',
      intro: 'Escritórios de engenharia parceiros enviam plantas por SFTP. Alguns só liberam conexões para IPs fixos, e o estúdio quer aceitar conexões só dos IPs dos parceiros.',
      questions: [
        {
          id: 'sftp',
          prompt: 'Como receber os arquivos dos parceiros?',
          options: [
            { id: 'xfer-vpc', label: 'Transfer Family com SFTP, endpoint na VPC voltado para a internet com IPs elásticos e security group, gravando no S3', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'Os parceiros mantêm os programas, liberam IPs fixos, e só eles conectam.', concepts: ['xfer.transfer-family', 'xfer.endpoints'] },
            { id: 'xfer-ftp', label: 'Transfer Family com FTP, para os parceiros que preferirem', scores: { seguro: 0.2, requisitos: 0.4 }, consequence: 'O FTP não é criptografado e só funciona com endpoint interno: os parceiros na internet não alcançam.', whyNot: 'Na internet, só SFTP e FTPS.', concepts: ['xfer.endpoints'] },
            { id: 'ec2-sftp', label: 'Um servidor SFTP numa instância EC2 com IP elástico', scores: { seguro: 0.6, resiliente: 0.4, requisitos: 0.8, custo: 0.7 }, consequence: 'Funciona, mas é mais um servidor para corrigir e uma AZ só.', whyNot: 'O Transfer Family é gerenciado e usa até três AZs.', concepts: ['xfer.transfer-family'] },
          ],
        },
      ],
    },
    {
      id: 'backup',
      title: 'Plano de backup e retenção',
      intro: 'O contrato com os clientes exige guardar os projetos por cinco anos, sem que ninguém, nem os administradores, possa apagá-los antes. O estúdio aceita perder no máximo um dia de trabalho e quer sobreviver à perda da Região.',
      questions: [
        {
          id: 'plano',
          prompt: 'Como proteger os dados?',
          options: [
            { id: 'bkp-conformidade', label: 'AWS Backup diário para EFS e FSx, com frio no EFS depois de 30 dias, cópia em outra conta e outra Região e Vault Lock em conformidade', scores: { seguro: 1, resiliente: 1, requisitos: 1, custo: 1 }, consequence: 'Ninguém apaga antes de cinco anos, e a perda da Região ou da conta não leva os backups.', concepts: ['bkp.plan', 'bkp.cold-storage', 'bkp.copy', 'bkp.vault-lock'] },
            { id: 'bkp-governanca', label: 'AWS Backup diário com Vault Lock em governança, na mesma conta e Região', scores: { seguro: 0.4, resiliente: 0.4, requisitos: 0.4, custo: 1 }, consequence: 'Quem tem permissão remove a trava, e a perda da Região leva tudo.', whyNot: 'A lei pede conformidade, e a Região pede cópia.', concepts: ['bkp.vault-lock', 'bkp.copy'] },
            { id: 'replicacao', label: 'Só a replicação do EFS para outra Região', scores: { resiliente: 0.6, requisitos: 0.2, custo: 0.8 }, consequence: 'Uma exclusão também é replicada, e nada impede apagar antes de cinco anos.', whyNot: 'Replicação não é backup.', concepts: ['efs.replication', 'bkp.plan'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'uma-zona',
      when: [
        ['compartilhado', ['efs-onezone']],
        ['smb', ['fsxw-single']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Portal e compartilhamentos numa AZ só: uma falha de zona para o estúdio inteiro.',
      concepts: ['efs.file-system-types', 'fsxw.deployment'],
    },
    {
      id: 'sem-trava',
      when: [
        ['plano', ['bkp-governanca', 'replicacao']],
        ['sftp', ['xfer-ftp', 'ec2-sftp']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Backups que podem ser apagados e uma entrada de arquivos mais exposta: um invasor que entra pelos parceiros apaga também a proteção.',
      concepts: ['bkp.vault-lock', 'xfer.endpoints'],
    },
    {
      id: 'custo-fixo',
      when: [
        ['vazao', ['provisioned']],
        ['hpc', ['lustre-persistente']],
      ],
      penalty: { custo: 0.3 },
      message: 'Vazão e sistemas de arquivos pagos o mês inteiro para cargas que só têm picos: a conta não acompanha o uso.',
      concepts: ['efs.throughput-modes', 'lustre.deployment'],
    },
  ],
}

export const FINAL_FIL: PhaseDef = {
  ...META.final,
  concepts: [
    'efs.what',
    'efs.file-system-types',
    'efs.mount-targets',
    'files.choose',
    'efs.throughput-modes',
    'efs.lifecycle',
    'efs.storage-classes',
    'fsxw.what',
    'fsxw.deployment',
    'fsxw.shadow-copies',
    'lustre.what',
    'lustre.deployment',
    'lustre.s3-link',
    'mig.datasync',
    'sgw.fsx-file',
    'xfer.transfer-family',
    'xfer.endpoints',
    'bkp.plan',
    'bkp.cold-storage',
    'bkp.copy',
    'bkp.vault-lock',
    'efs.replication',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'O estúdio, os volumes e os parceiros são fictícios.'],
  missions: [
    {
      id: 'fil.final.mudanca',
      title: 'A Mudança do Escritório do Estúdio Traço Livre',
      type: 'final',
      summary: 'Sete etapas de decisões de arquivos e backup, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Estúdio Traço Livre',
        role: 'Você conduz a mudança de um estúdio de arquitetura para a AWS.',
        situation: 'Compartilhamentos Windows com permissões do Active Directory, diretórios Linux usados por vários servidores, renderização pesada toda semana, parceiros que enviam plantas por SFTP e um contrato que exige guardar os projetos por cinco anos sem que ninguém possa apagá-los.',
        objective: 'Escolher armazenamento, migração, entrada de arquivos e backup que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'files.choose', body: ['Cada decisão pesa nas outras: tudo numa AZ só, backups que podem ser apagados ou sistemas de arquivos pagos o mês inteiro para picos. O relatório aponta esses conflitos.'] },
        { conceptId: 'bkp.vault-lock' },
      ],
      activities: [
        {
          id: 'fil.final.mudanca.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'A Mudança do Escritório',
          prompt: 'Percorra as sete etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'efs.file-system-types' }, { id: 'efs.throughput-modes' }, { id: 'fsxw.deployment' }, { id: 'lustre.deployment' }, { id: 'mig.datasync' }, { id: 'xfer.endpoints' }, { id: 'bkp.vault-lock' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar uma ou duas opções.', 'Quando duas opções funcionam, a que paga só pelo uso costuma ser a melhor.'],
          explanation: [
            'Projeto de referência: EFS Regional com um mount target por AZ; Elastic com IA e Archive; FSx for Windows Multi-AZ com o AD e cópias de sombra; Lustre scratch ligado ao S3.',
            'DataSync com agente para a migração; Transfer Family com SFTP em endpoint na VPC voltado para a internet; AWS Backup diário com frio, cópia em outra conta e Região e Vault Lock em conformidade.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: TRACO_LIVRE,
        },
      ],
      debrief: { takeaways: ['Protocolo e disponibilidade escolhem o sistema de arquivos.', 'Picos pedem pagar pelo uso; dados frios pedem ciclo de vida.', 'Backup que ninguém apaga: Vault Lock em conformidade e cópia fora da conta e da Região.'] },
    },
  ],
}
