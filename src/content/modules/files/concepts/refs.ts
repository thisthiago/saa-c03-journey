/** Referências oficiais da trilha Arquivos e backup na AWS (conferidas em 22/10/2026). */
const efs = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/efs/latest/ug/${page}` })
const win = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/fsx/latest/WindowsGuide/${page}` })
const lus = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/fsx/latest/LustreGuide/${page}` })
const ontap = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/${page}` })
const zfs = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/${page}` })
const xfer = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/transfer/latest/userguide/${page}` })
const bkp = (title: string, page: string) => ({ title, url: `https://docs.aws.amazon.com/aws-backup/latest/devguide/${page}` })

export const R = {
  efsWhat: efs('What is Amazon Elastic File System?', 'whatisefs.html'),
  efsFeatures: efs('Features of Amazon EFS', 'features.html'),
  efsMountTargets: efs('Managing mount targets', 'manage-fs-access.html'),
  efsAccessPoints: efs('Working with access points', 'efs-access-points.html'),
  efsIam: efs('Using IAM to control access to file systems', 'iam-access-control-nfs-efs.html'),
  efsEncryptionAtRest: efs('Encrypting data at rest', 'encryption-at-rest.html'),
  efsEncryption: efs('Data encryption in Amazon EFS', 'encryption.html'),
  efsPerformance: efs('Amazon EFS performance specifications', 'performance.html'),
  efsLifecycle: efs('Managing storage lifecycle', 'lifecycle-management-efs.html'),
  efsReplication: efs('Replicating EFS file systems', 'efs-replication.html'),
  winWhat: win('What is FSx for Windows File Server?', 'what-is.html'),
  winAd: win('Working with Microsoft Active Directory', 'aws-ad-integration-fsxW.html'),
  winAz: win('Availability and durability: Single-AZ and Multi-AZ file systems', 'high-availability-multiAZ.html'),
  winStorage: win('Managing storage on FSx for Windows File Server', 'managing-storage-configuration.html'),
  winShadow: win('Protecting your data with shadow copies', 'shadow-copies-fsxW.html'),
  lustreWhat: lus('What is Amazon FSx for Lustre?', 'what-is.html'),
  lustreDeploy: lus('Deployment and storage class options for FSx for Lustre file systems', 'using-fsx-lustre.html'),
  lustreS3: lus('Linking your file system to an Amazon S3 bucket', 'create-dra-linked-data-repo.html'),
  ontapWhat: ontap('What is Amazon FSx for NetApp ONTAP?', 'what-is-fsx-ontap.html'),
  ontapStorage: ontap('Managing storage capacity', 'managing-storage-capacity.html'),
  zfsWhat: zfs('What is Amazon FSx for OpenZFS?', 'what-is-fsx.html'),
  xferWhat: xfer('What is AWS Transfer Family?', 'what-is-aws-transfer-family.html'),
  xferVpc: xfer('Create a server in a virtual private cloud', 'create-server-in-vpc.html'),
  xferFtp: xfer('Create an FTP-enabled server', 'create-server-ftp.html'),
  datasyncLocations: { title: 'Where can I transfer my data with AWS DataSync?', url: 'https://docs.aws.amazon.com/datasync/latest/userguide/working-with-locations.html' },
  bkpWhat: bkp('What is AWS Backup?', 'whatisbackup.html'),
  bkpPlan: bkp('Backup plan options and configuration', 'plan-options-and-configuration.html'),
  bkpFeatures: bkp('AWS Backup feature availability', 'backup-feature-availability.html'),
  bkpVaultLock: bkp('AWS Backup Vault Lock', 'vault-lock.html'),
  bkpAirGapped: bkp('Logically air-gapped vault', 'logicallyairgappedvault.html'),
  bkpRestoreTesting: bkp('Restore testing', 'restore-testing.html'),
}
