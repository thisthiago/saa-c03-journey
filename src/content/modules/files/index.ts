/**
 * Módulo "Arquivos": trilha Arquivos e backup na AWS. EFS, os quatro FSx,
 * Transfer Family e AWS Backup. Reaproveita conceitos de outras trilhas
 * (storage.file, sgw.*, mig.datasync, backup.independent-copy, ebs.snapshots,
 * dr.rpo-rto, fed.directory-service, bkp.aws-backup, bkp.vault-lock e
 * gov.org-policies): os IDs são globais no registro.
 */
import type { ContentModule, TrackDef } from '../../../engine/types'
import { FILES_ACHIEVEMENTS } from './achievements'
import { F01_FIL_CONCEPTS } from './concepts/f01-efs'
import { F02_FIL_CONCEPTS } from './concepts/f02-efs-custo'
import { F03_FIL_CONCEPTS } from './concepts/f03-windows'
import { F04_FIL_CONCEPTS } from './concepts/f04-lustre'
import { F05_FIL_CONCEPTS } from './concepts/f05-ontap-zfs'
import { F06_FIL_CONCEPTS } from './concepts/f06-escolha'
import { F07_FIL_CONCEPTS } from './concepts/f07-backup'
import { F01_FIL } from './phases/f01/phase'
import { F02_FIL } from './phases/f02/phase'
import { F03_FIL } from './phases/f03/phase'
import { F04_FIL } from './phases/f04/phase'
import { F05_FIL } from './phases/f05/phase'
import { F06_FIL } from './phases/f06/phase'
import { F07_FIL } from './phases/f07/phase'
import { FINAL_FIL } from './phases/final/phase'
import { FILES_QUESTIONS } from './questions'

export const AWS_FILES: TrackDef = {
  id: 'files.aws-files',
  moduleId: 'files',
  territory: 'armazenamento',
  title: 'Arquivos e backup na AWS',
  subtitle: 'EFS, FSx, transferência de arquivos e AWS Backup',
  summary:
    'Amazon EFS, os quatro Amazon FSx (Windows File Server, Lustre, NetApp ONTAP e OpenZFS), AWS Transfer Family e AWS Backup: como compartilhar arquivos entre servidores, escolher o sistema de arquivos pelo protocolo, pagar só pelo uso, receber arquivos de parceiros e montar backups que ninguém consegue apagar.',
  glyph: 'file',
  recommends: ['foundations.aws-foundations', 'storage.s3-expedition'],
  serviceIds: ['aws.efs', 'aws.fsx', 'aws.transfer-family', 'aws.backup', 'aws.datasync', 'aws.storage-gateway'],
  phases: [F01_FIL, F02_FIL, F03_FIL, F04_FIL, F05_FIL, F06_FIL, F07_FIL],
  final: FINAL_FIL,
}

export const filesModule: ContentModule = {
  id: 'files',
  title: 'Arquivos',
  services: [],
  concepts: [...F01_FIL_CONCEPTS, ...F02_FIL_CONCEPTS, ...F03_FIL_CONCEPTS, ...F04_FIL_CONCEPTS, ...F05_FIL_CONCEPTS, ...F06_FIL_CONCEPTS, ...F07_FIL_CONCEPTS],
  tracks: [AWS_FILES],
  achievements: FILES_ACHIEVEMENTS,
  questions: FILES_QUESTIONS,
}
