/**
 * Questões da Revisão da Fase 5 de Arquivos e backup (FSx for NetApp ONTAP e
 * OpenZFS), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são
 * fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'fil.f05',
  questions: [
    {
      id: 'rv:fil.f05.m1.a1',
      kind: 'decision',
      title: 'Bloco e arquivo no mesmo storage',
      prompt:
        'Uma seguradora quer um único armazenamento **gerenciado** para duas cargas: um SQL Server em EC2 com Windows, que usa **volumes de bloco por iSCSI**, e servidores Linux que montam compartilhamentos por **NFS**. O time quer administrar tudo **num só serviço**. Qual serviço atende?',
      concepts: [{ id: 'ontap.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon FSx for OpenZFS, com um volume por carga.', correct: false, consequence: 'O OpenZFS só oferece NFS; não entrega volumes de bloco por iSCSI.' },
        { id: 'b', text: 'Amazon FSx for Windows File Server em SSD Multi-AZ.', correct: false, consequence: 'Serve SMB; não entrega iSCSI ao SQL Server nem NFS aos servidores Linux.' },
        { id: 'c', text: 'Amazon FSx for NetApp ONTAP, com LUN e NFS.', correct: true, consequence: 'O ONTAP entrega bloco por iSCSI e arquivos por NFS no mesmo serviço.' },
        { id: 'd', text: 'Volumes EBS para o SQL Server e Amazon EFS para o Linux.', correct: false, consequence: 'Atende às duas cargas, mas com dois serviços para administrar.' },
      ],
      explanation: [
        'O **FSx for NetApp ONTAP** atende ao mesmo tempo por **NFS, SMB, iSCSI e NVMe**, para Linux, Windows e macOS. Ele entrega um volume de bloco (LUN) por iSCSI ao SQL Server e compartilhamentos NFS aos servidores Linux, num só serviço gerenciado.',
        'O OpenZFS é só NFS, e o FSx for Windows é SMB. EBS com EFS resolve as duas cargas, mas em dois serviços, contra o requisito.',
        '**Regra prática:** "iSCSI", "o mesmo storage por NFS e SMB" ou "migrar NetApp" apontam para o FSx for NetApp ONTAP.',
      ],
    },
    {
      id: 'rv:fil.f05.quando-ontap',
      kind: 'decision',
      title: 'Os sinais do ONTAP',
      prompt:
        'Uma indústria vai substituir o storage do data center e está entre o **FSx for Windows File Server** e o **FSx for NetApp ONTAP**. O arquiteto levantou os requisitos para ver quais deles **só o ONTAP atende**. Quais requisitos decidem pelo ONTAP? (Escolha DUAS.)',
      concepts: [{ id: 'ontap.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Os mesmos arquivos abertos por NFS no Linux e por SMB no Windows.', correct: true, consequence: 'O ONTAP serve o mesmo volume pelos dois protocolos.' },
        { id: 'b', text: 'Pastas compartilhadas por SMB com as permissões do Active Directory.', correct: false, consequence: 'O FSx for Windows também atende; não decide entre os dois.' },
        { id: 'c', text: 'Manter os scripts e as ferramentas de administração da NetApp.', correct: true, consequence: 'O ONTAP é o NetApp gerenciado, com as mesmas ferramentas e API.' },
        { id: 'd', text: 'Um servidor em espera em outra AZ para aguentar a queda de uma zona.', correct: false, consequence: 'Os dois oferecem implantação Multi-AZ, então o requisito não decide.' },
        { id: 'e', text: 'Criptografia em repouso com chaves do KMS.', correct: false, consequence: 'Todos os FSx criptografam em repouso com o KMS.' },
      ],
      explanation: [
        'O **ONTAP** é o NetApp gerenciado pela AWS: serve os **mesmos dados por NFS, SMB, iSCSI e NVMe** e mantém as **ferramentas e a API da NetApp**. Esses dois requisitos o FSx for Windows não atende, porque ele é SMB e Windows.',
        'Compartilhamentos SMB com AD, Multi-AZ e criptografia com o KMS existem nos dois serviços e não ajudam a escolher.',
        '**Regra prática:** procure o requisito que só um serviço atende; vários protocolos no mesmo volume ou ferramentas da NetApp decidem pelo ONTAP.',
      ],
    },
    {
      id: 'rv:fil.f05.m1.a2',
      kind: 'decision',
      title: 'Gravações lentas na madrugada',
      prompt:
        'Um FSx for NetApp ONTAP tem tiering ligado para o capacity pool, e só a parte ativa fica na camada SSD. A camada SSD chegou a **92% de uso**, e as **gravações grandes da madrugada** ficaram lentas. O time quer seguir a **recomendação da AWS** para a camada SSD. Qual ajuste atende?',
      concepts: [{ id: 'ontap.tiering' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar o capacity pool para receber as gravações.', correct: false, consequence: 'O capacity pool é elástico e não se provisiona; as gravações passam pela SSD.' },
        { id: 'b', text: 'Desligar a compressão para as gravações irem mais rápido.', correct: false, consequence: 'Os dados passam a ocupar mais espaço, inclusive na SSD já cheia.' },
        { id: 'c', text: 'Aumentar a camada SSD até o uso ficar abaixo de 80%.', correct: true, consequence: 'As gravações voltam a ter espaço na SSD, onde todo dado entra primeiro.' },
        { id: 'd', text: 'Mandar as gravações da madrugada direto para o capacity pool.', correct: false, consequence: 'Todo dado gravado passa primeiro pela SSD; não há gravação direta no pool.' },
      ],
      explanation: [
        'No ONTAP, **todo dado gravado passa primeiro pela camada SSD**, e a política de tiering desce o que esfria para o **capacity pool**, elástico e mais barato. A AWS recomenda **não passar de 80% de uso da SSD**: acima disso, as gravações ficam sem folga.',
        'O capacity pool cresce sozinho e não recebe gravações diretas. Desligar a compressão aumenta o espaço usado.',
        '**Regra prática:** no ONTAP, SSD dimensionada para a parte ativa com folga (até 80%), e o que é frio no capacity pool pela política de tiering.',
      ],
    },
    {
      id: 'rv:fil.f05.m1.a3',
      kind: 'decision',
      title: 'Dados reais toda semana',
      prompt:
        'Toda semana, o time de sistemas de uma seguradora precisa de uma **cópia gravável de 20 TB** de um volume do FSx for NetApp ONTAP para testar uma versão nova. Hoje a cópia leva um dia e ocupa 20 TB a mais. O time quer o ambiente **em minutos** e com o **menor custo de armazenamento**. Qual recurso atende?',
      concepts: [{ id: 'ontap.data-protection' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Copiar o volume com o DataSync para um volume novo.', correct: false, consequence: 'Leva horas e ocupa mais 20 TB a cada semana, o que o time quer evitar.' },
        { id: 'b', text: 'Replicar o volume com o SnapMirror para outra Região.', correct: false, consequence: 'O SnapMirror é para proteção e DR; a réplica não é a cópia barata para teste.' },
        { id: 'c', text: 'Testar direto no volume de produção, fora do horário.', correct: false, consequence: 'Um erro do teste estraga os dados reais.' },
        { id: 'd', text: 'Criar um clone (FlexClone) do volume a cada teste.', correct: true, consequence: 'O clone sai na hora, é gravável e só ocupa o que os testes mudarem.' },
      ],
      explanation: [
        'Um **clone (FlexClone)** cria **na hora** uma cópia gravável de um volume, e ela só ocupa o espaço do que for alterado. É a forma de dar a cada teste dados reais sem copiar terabytes.',
        'O DataSync copia tudo, com tempo e espaço. O SnapMirror replica volumes para proteção, inclusive entre Regiões e com o NetApp do data center. Testar em produção arrisca os dados.',
        '**Regra prática:** cópia gravável instantânea para teste é clone; versões do volume são snapshots; réplica para outro lugar é SnapMirror.',
      ],
    },
    {
      id: 'rv:fil.f05.m2.a1',
      kind: 'decision',
      title: 'Três aplicações e um limite para cada',
      prompt:
        'Uma empresa migrou três servidores **NFS** do Linux, com snapshots do ZFS, para um único **FSx for OpenZFS**. Cada aplicação precisa da **própria área**, com um **limite de espaço** que impeça uma delas de ocupar tudo, e o time quer o **menor custo**. Qual configuração atende?',
      concepts: [{ id: 'zfs.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Criar três sistemas FSx for OpenZFS, um por aplicação.', correct: false, consequence: 'Separa as áreas, mas paga três sistemas de arquivos e três capacidades.' },
        { id: 'b', text: 'Criar um access point por aplicação, como no Amazon EFS.', correct: false, consequence: 'Access points são do EFS; no OpenZFS, a divisão é por volumes.' },
        { id: 'c', text: 'Criar um volume por aplicação, cada um com sua cota.', correct: true, consequence: 'Cada aplicação tem a própria área e o próprio limite no mesmo sistema.' },
        { id: 'd', text: 'Criar compartilhamentos SMB com cotas para cada aplicação.', correct: false, consequence: 'O OpenZFS não oferece SMB: o acesso é só por NFS.' },
      ],
      explanation: [
        'O **FSx for OpenZFS** é o OpenZFS gerenciado, acessado por **NFS** a partir de Linux, Windows e macOS, com snapshots, clones e compressão. Um sistema de arquivos pode ser dividido em **volumes com cotas** (inclusive por usuário e grupo), o que dá a cada aplicação a própria área e um limite, sem pagar vários sistemas.',
        'Três sistemas de arquivos custam mais. Access points são um recurso do EFS. E o OpenZFS não tem SMB.',
        '**Regra prática:** migrar ZFS ou NFS do Linux é FSx for OpenZFS, e várias aplicações no mesmo sistema se separam por volumes com cotas.',
      ],
    },
    {
      id: 'rv:fil.f05.m2.a2',
      kind: 'decision',
      title: 'O par na mesma zona',
      prompt:
        'Um estúdio usa um FSx for OpenZFS na implantação **Single-AZ (HA)**, escolhida para economizar. Depois de uma falha regional parcial, a diretoria definiu que o sistema de arquivos precisa **continuar disponível com uma AZ inteira fora**. Qual implantação atende?',
      concepts: [{ id: 'zfs.deployment' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter o Single-AZ (HA), que já tem servidor em espera.', correct: false, consequence: 'O par fica na mesma AZ: protege da falha de um servidor, não da AZ.' },
        { id: 'b', text: 'Trocar para o Single-AZ (non-HA), com backups a cada hora.', correct: false, consequence: 'Fica fora com a AZ e se recupera em cerca de 30 minutos só da falha de servidor.' },
        { id: 'c', text: 'Ligar backups diários copiados para outra Região.', correct: false, consequence: 'Permite restaurar depois, mas o sistema de arquivos fica fora durante a queda.' },
        { id: 'd', text: 'Usar a implantação Multi-AZ (HA) do OpenZFS.', correct: true, consequence: 'Há uma cópia em cada AZ, e o failover leva cerca de 60 segundos.' },
      ],
      explanation: [
        'O OpenZFS tem três níveis. O **Multi-AZ (HA)** guarda uma cópia em cada AZ e faz failover em cerca de 60 segundos: é o único que **continua disponível com uma AZ fora**. O **Single-AZ (HA)** tem um par primário e em espera **na mesma AZ**, com failover de cerca de 60 segundos só para falha de servidor.',
        'O **Single-AZ (non-HA)** se recupera sozinho em cerca de 30 minutos, e backups servem para restaurar depois, não para manter o serviço no ar.',
        '**Regra prática:** "HA" no Single-AZ protege contra falha de servidor; sobreviver à perda de uma AZ exige o Multi-AZ.',
      ],
    },
  ],
}
