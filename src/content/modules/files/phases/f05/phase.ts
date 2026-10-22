/**
 * Fase 5 — FSx for NetApp ONTAP e FSx for OpenZFS. Vários protocolos,
 * camadas, snapshots, clones e as implantações do OpenZFS; o chefe escolhe
 * entre os quatro FSx e o EFS.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FsChooserLabConfig } from '../../../../../simulators/fschooser/model'
import { META } from '../meta'

export const HORIZONTE_FSX: FsChooserLabConfig = {
  itemsLabel: 'Cargas',
  options: ['efs', 'fsx-windows', 'fsx-lustre', 'fsx-ontap', 'fsx-openzfs'],
  items: [
    { id: 'rh', text: 'Pastas do RH abertas no Windows, com permissões do Active Directory', dominant: 'smb-ad', needs: ['smb-ad'], concepts: ['fsxw.what', 'fsx.family'] },
    { id: 'misto', text: 'Volume de sinistros gravado por servidores Linux (NFS) e lido pelos analistas no Windows (SMB)', dominant: 'multi-protocol', needs: ['multi-protocol'], concepts: ['ontap.what'] },
    { id: 'netapp', text: 'Storage NetApp do data center, administrado com as ferramentas da NetApp', dominant: 'netapp-migrate', needs: ['netapp-migrate'], concepts: ['ontap.what'] },
    { id: 'zfs', text: 'Servidor ZFS de compilação, com clones instantâneos para cada versão, acessado por NFS', dominant: 'zfs-migrate', needs: ['zfs-migrate'], concepts: ['zfs.what'] },
    { id: 'risco', text: 'Cálculo de risco em 500 servidores lendo e gravando os dados de um bucket S3', dominant: 'hpc-s3', needs: ['hpc-s3'], concepts: ['lustre.what', 'fsx.family'] },
    { id: 'lambda', text: 'Modelos de apólice lidos por funções Lambda', dominant: 'serverless', needs: ['serverless'], concepts: ['efs.what'] },
  ],
}

export const F05_FIL: PhaseDef = {
  ...META.f05,
  concepts: ['ontap.what', 'ontap.tiering', 'ontap.data-protection', 'zfs.what', 'zfs.deployment', 'fsx.family', 'fsxw.what', 'lustre.what', 'efs.what'],
  availability: 'available',
  simplifications: ['A seguradora, o estúdio e os volumes são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fil.f05.m1',
      title: 'O NetApp do data center',
      type: 'mission',
      summary: 'FSx for NetApp ONTAP: protocolos, camadas e clones.',
      briefing: {
        company: 'Seguradora Horizonte',
        role: 'Você planeja a saída de um storage NetApp do data center.',
        situation: 'O NetApp guarda 300 TB. Servidores Linux gravam os sinistros por NFS, os analistas abrem os mesmos arquivos no Windows por SMB, e o time de storage tem anos de scripts na ferramenta da NetApp. Só 20% dos dados são usados no dia a dia.',
        objective: 'Migrar sem mudar as aplicações e sem pagar SSD pelos dados frios.',
        successCriteria: ['Escolher o serviço', 'Usar as camadas de armazenamento', 'Criar ambientes de teste rápido'],
      },
      intel: [
        { conceptId: 'ontap.what', body: ['O **FSx for NetApp ONTAP** oferece **NFS, SMB, iSCSI e NVMe** sobre os mesmos dados, com as ferramentas e a API da NetApp: a forma de migrar o NetApp sem mudar as aplicações.'] },
        { conceptId: 'ontap.tiering', body: ['A camada **SSD** é provisionada para os dados ativos; o **capacity pool**, elástico e mais barato, recebe o que esfria. Compressão e desduplicação economizam até **65%** em compartilhamentos gerais.'] },
        { conceptId: 'ontap.data-protection', body: ['**Snapshots** guardam versões; **clones** criam na hora uma cópia gravável que só ocupa o que mudar; o **SnapMirror** replica volumes.'] },
      ],
      activities: [
        {
          id: 'fil.f05.m1.a1',
          kind: 'decision',
          title: 'Para onde vai o NetApp',
          prompt: 'Linux por NFS e Windows por SMB nos mesmos arquivos, e um time que administra tudo com ferramentas da NetApp. Qual serviço usar?',
          concepts: [{ id: 'ontap.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Só o FSx for NetApp ONTAP serve os mesmos dados por NFS e SMB e mantém as ferramentas da NetApp.'],
          options: [
            { id: 'a', text: 'FSx for NetApp ONTAP', correct: true, consequence: 'Os mesmos volumes, protocolos e ferramentas, sem mudar as aplicações.' },
            { id: 'b', text: 'EFS para o Linux e FSx for Windows para os analistas, sincronizados à noite', correct: false, consequence: 'Dois sistemas de arquivos e dados de ontem para os analistas.' },
            { id: 'c', text: 'FSx for OpenZFS', correct: false, consequence: 'O OpenZFS só oferece NFS, e os scripts da NetApp deixam de funcionar.' },
          ],
        },
        {
          id: 'fil.f05.m1.a2',
          kind: 'decision',
          title: 'Os 240 TB que ninguém abre',
          prompt: 'Só 20% dos 300 TB são usados no dia a dia. Como guardar o resto sem pagar SSD por tudo?',
          concepts: [{ id: 'ontap.tiering' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com uma política de tiering, os dados frios descem para o capacity pool, elástico e mais barato, e a SSD fica com a parte ativa. Compressão e desduplicação reduzem ainda mais o espaço.'],
          options: [
            { id: 'a', text: 'SSD para a parte ativa, política de tiering para o capacity pool e compressão com desduplicação ligadas', correct: true, consequence: 'A SSD fica pequena, e o frio paga o preço do capacity pool.' },
            { id: 'b', text: 'Provisionar 300 TB de SSD', correct: false, consequence: 'Paga SSD por 240 TB que quase ninguém lê.' },
            { id: 'c', text: 'Mover os dados frios para o S3 Glacier e apagar do sistema de arquivos', correct: false, consequence: 'Os analistas deixam de abrir os arquivos antigos pelo mesmo caminho.' },
          ],
        },
        {
          id: 'fil.f05.m1.a3',
          kind: 'decision',
          title: 'Testes com dados de verdade',
          prompt: 'Toda semana, o time de sistemas precisa de uma cópia de 20 TB dos sinistros para testar uma versão nova, e copiar leva um dia. O que fazer?',
          concepts: [{ id: 'ontap.data-protection' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Um clone do volume fica pronto na hora, é gravável e só ocupa o que os testes mudarem.'],
          options: [
            { id: 'a', text: 'Criar um clone do volume a cada teste', correct: true, consequence: 'O ambiente sai em minutos e ocupa só as alterações.' },
            { id: 'b', text: 'Copiar os 20 TB com DataSync toda semana', correct: false, consequence: 'Funciona, mas leva horas e ocupa 20 TB a cada cópia.' },
            { id: 'c', text: 'Testar direto no volume de produção', correct: false, consequence: 'Um erro do teste estraga os sinistros reais.' },
          ],
        },
      ],
      debrief: { takeaways: ['ONTAP: NFS, SMB e iSCSI no mesmo dado, para quem vem da NetApp.', 'SSD para o ativo, capacity pool para o frio.', 'Clones para ambientes de teste em minutos.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f05.m2',
      title: 'O servidor ZFS',
      type: 'mission',
      summary: 'FSx for OpenZFS e suas implantações.',
      briefing: {
        company: 'Estúdio Pixel',
        role: 'Você cuida da infraestrutura de um estúdio de jogos.',
        situation: 'Os servidores de compilação leem os assets de um servidor ZFS por NFS, criam um clone por versão do jogo e precisam de latência muito baixa. O servidor ZFS está no fim da vida útil.',
        objective: 'Migrar sem mudar os scripts e escolher quanta disponibilidade pagar.',
        successCriteria: ['Escolher o serviço', 'Escolher a implantação'],
      },
      intel: [
        { conceptId: 'zfs.what', body: ['O **FSx for OpenZFS** é o ZFS gerenciado, acessado por **NFS**, com **snapshots e clones** instantâneos e latência de **centenas de microssegundos**. Não oferece SMB.'] },
        { conceptId: 'zfs.deployment', body: ['**Multi-AZ (HA)**: uma cópia em cada AZ, failover em cerca de 60 s. **Single-AZ (HA)**: par na mesma AZ, failover em cerca de 60 s. **Single-AZ (non-HA)**: recuperação em cerca de 30 minutos.'] },
      ],
      activities: [
        {
          id: 'fil.f05.m2.a1',
          kind: 'decision',
          title: 'O sucessor do servidor ZFS',
          prompt: 'Os scripts usam comandos de snapshot e clone do ZFS, o acesso é por NFS e a latência precisa ser muito baixa. Qual serviço usar?',
          concepts: [{ id: 'zfs.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O FSx for OpenZFS mantém os snapshots, os clones e o NFS do ZFS, com latência de centenas de microssegundos.'],
          options: [
            { id: 'a', text: 'FSx for OpenZFS', correct: true, consequence: 'Os scripts continuam funcionando, sem servidor para cuidar.' },
            { id: 'b', text: 'Amazon EFS', correct: false, consequence: 'O EFS não tem clones instantâneos do ZFS.' },
            { id: 'c', text: 'FSx for Windows File Server', correct: false, consequence: 'É SMB, e os servidores de compilação usam NFS.' },
          ],
        },
        {
          id: 'fil.f05.m2.a2',
          kind: 'predict',
          title: 'O par na mesma AZ',
          prompt: 'O estúdio escolheu Single-AZ (HA) para economizar. A AZ inteira fica fora. O que acontece?',
          concepts: [{ id: 'zfs.deployment' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O par primário e em espera fica na mesma AZ: protege contra falha de servidor, não contra a perda da AZ.'],
          spec: { sim: 'fsx-failure', deployment: 'zfs-single-az-ha', event: 'az-outage' },
          options: [
            { id: 'a', text: 'O sistema de arquivos fica fora enquanto a AZ estiver fora', outcome: 'down' },
            { id: 'b', text: 'O servidor em espera assume em cerca de 60 s', outcome: 'failover' },
            { id: 'c', text: 'Uma parada de cerca de 30 minutos, até a AWS trocar o servidor', outcome: 'recovers' },
          ],
        },
        {
          id: 'fil.f05.m2.a3',
          kind: 'predict',
          title: 'O par e o servidor com defeito',
          prompt: 'No mesmo Single-AZ (HA), o servidor primário tem uma falha de hardware, e a AZ continua de pé. O que acontece?',
          concepts: [{ id: 'zfs.deployment' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O servidor em espera, na mesma AZ, assume em cerca de 60 segundos.'],
          spec: { sim: 'fsx-failure', deployment: 'zfs-single-az-ha', event: 'server-failure' },
          options: [
            { id: 'a', text: 'O servidor em espera assume em cerca de 60 s', outcome: 'failover' },
            { id: 'b', text: 'Uma parada de cerca de 30 minutos, até a AWS trocar o servidor', outcome: 'recovers' },
            { id: 'c', text: 'O sistema de arquivos fica fora até a AZ voltar', outcome: 'down' },
          ],
        },
      ],
      debrief: { takeaways: ['OpenZFS: NFS, snapshots, clones e latência muito baixa.', 'Só o Multi-AZ aguenta a perda de uma AZ.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f05.boss',
      title: 'Os quatro FSx',
      type: 'boss',
      summary: 'O sistema de arquivos certo para seis cargas.',
      briefing: {
        company: 'Seguradora Horizonte',
        role: 'Você fecha o mapa de armazenamento de arquivos da seguradora.',
        situation: 'Seis cargas, cada uma com um requisito que decide: protocolo, Active Directory, ferramentas da NetApp, clones do ZFS, alto desempenho com S3 ou funções Lambda.',
        objective: 'Escolher o serviço de cada carga.',
        successCriteria: ['Cada carga no serviço que atende ao requisito com menos esforço'],
      },
      intel: [{ conceptId: 'fsx.family', body: ['Ache o requisito que só um serviço atende bem: SMB com AD, vários protocolos, NetApp, ZFS, HPC com S3 ou funções Lambda.'] }],
      activities: [
        {
          id: 'fil.f05.boss.a1',
          kind: 'lab',
          lab: 'fs-chooser',
          title: 'Seis cargas, cinco serviços',
          prompt: 'Posicione cada carga no serviço que atende ao requisito com menos esforço.',
          concepts: [{ id: 'fsx.family' }, { id: 'ontap.what' }, { id: 'zfs.what' }],
          xp: 220,
          difficulty: 3,
          hints: ['O ONTAP também atende SMB com AD, mas para pastas só de Windows o FSx for Windows é mais simples.', 'Funções Lambda montam o EFS.'],
          explanation: ['RH: FSx for Windows. Sinistros em NFS e SMB e o NetApp: ONTAP. Servidor ZFS: OpenZFS. Cálculo de risco: Lustre. Modelos lidos pelo Lambda: EFS.'],
          config: HORIZONTE_FSX,
        },
      ],
      debrief: { takeaways: ['Cada FSx tem um requisito que o decide.', 'Quando dois atendem, vale o mais simples.'] },
    },
  ],
}
