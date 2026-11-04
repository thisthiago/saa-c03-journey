/**
 * Questões da Revisão da Fase 3 de Computação (EBS e instance store), no
 * formato do exame SAA-C03. Fatos conferidos em 20/10/2026 e 03/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'cmp.f03',
  questions: [
    {
      id: 'rv:cmp.f03.instancia-perdida',
      kind: 'decision',
      title: 'A instância se foi, os dados ficaram',
      prompt:
        'A instância de um sistema de estoque, na zona us-east-1a, falhou e foi encerrada. Os dados ficavam num **segundo volume EBS**, configurado para não ser apagado no encerramento, e ele continua disponível. A empresa precisa do sistema de volta **o quanto antes**, **sem perder dados** gravados até a falha. Qual caminho atende?',
      concepts: [{ id: 'ebs.volume' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Lançar uma instância nova na us-east-1b e anexar o volume a ela.', correct: false, consequence: 'O volume EBS fica na zona onde foi criado e só pode ser anexado a instâncias da mesma zona.' },
        { id: 'b', text: 'Restaurar o volume a partir do backup diário que a AWS faz dos volumes EBS.', correct: false, consequence: 'A AWS não faz backup automático dos volumes; e um backup diário perderia os dados do dia.' },
        { id: 'c', text: 'Lançar uma instância nova na us-east-1a e anexar o volume a ela.', correct: true, consequence: 'O volume existe independente da instância: anexado a outra na mesma zona, traz todos os dados gravados até a falha.' },
        { id: 'd', text: 'Lançar uma instância nova e copiar os dados do instance store da instância antiga.', correct: false, consequence: 'O instance store se apaga com o encerramento, e os dados nem estavam lá.' },
      ],
      explanation: [
        'Um volume EBS **existe independente da instância**: quando ela é encerrada, um volume configurado para não ser apagado continua com todos os dados. Basta anexá-lo a uma instância nova, desde que ela esteja **na mesma zona** do volume, porque o EBS é zonal.',
        'Anexar a uma instância de outra zona não é possível. A AWS não faz backup dos volumes por conta própria; os snapshots são responsabilidade do cliente, e um backup diário perderia o que foi gravado depois dele. O instance store da instância encerrada já foi apagado.',
        '**Regra prática:** EBS é persistente e zonal. Para reaproveitar um volume, anexe-o na mesma zona; para levar os dados a outra zona, passe por um snapshot.',
      ],
    },
    {
      id: 'rv:cmp.f03.disco-cheio',
      kind: 'decision',
      title: 'Volume com 95% ocupado em produção',
      prompt:
        'O volume gp3 de 500 GiB de um servidor de arquivos interno chegou a **95% de ocupação**. A instância é de geração atual, e a empresa quer mais espaço **sem parar a instância nem desanexar o volume**, com o **menor esforço**. Qual caminho atende?',
      concepts: [{ id: 'ebs.volume' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar o tamanho do volume com Elastic Volumes e estender o sistema de arquivos.', correct: true, consequence: 'O volume cresce em uso, e a extensão do sistema de arquivos libera o espaço novo para o servidor.' },
        { id: 'b', text: 'Criar um snapshot, restaurar um volume maior e trocar o disco da instância.', correct: false, consequence: 'Funciona, mas exige desanexar o volume antigo e anexar o novo, com parada do serviço.' },
        { id: 'c', text: 'Aumentar o tamanho do volume com Elastic Volumes e não fazer mais nada.', correct: false, consequence: 'O volume cresce, mas o sistema de arquivos continua do tamanho antigo até ser estendido.' },
        { id: 'd', text: 'Trocar o tipo do volume para io2, que aceita volumes de capacidade maior.', correct: false, consequence: 'O tipo define desempenho e durabilidade; o espaço vem do tamanho, e o io2 custaria bem mais.' },
      ],
      explanation: [
        'Com **Elastic Volumes**, o tamanho, o tipo, os IOPS e o throughput de um volume mudam com ele em uso, sem desanexar nem reiniciar uma instância de geração atual. Depois de aumentar o tamanho, é preciso **estender a partição e o sistema de arquivos** no sistema operacional para usar o espaço novo.',
        'Snapshot e volume novo é o caminho antigo, com troca de disco e parada. Aumentar o volume sem estender o sistema de arquivos deixa o espaço novo invisível. E o tipo do volume não aumenta a capacidade.',
        '**Regra prática:** mudar tamanho, tipo ou desempenho de um volume EBS em uso é Elastic Volumes. Ao aumentar o tamanho, lembre de estender o sistema de arquivos.',
      ],
    },
    {
      id: 'rv:cmp.f03.iops-sem-crescer',
      kind: 'decision',
      title: 'Banco pequeno que precisa de mais IOPS',
      prompt:
        'Um banco de dados ocupa **100 GiB** e precisa de **6.000 IOPS** constantes, com latência de poucos milissegundos. Não há exigência especial de durabilidade. A empresa quer a configuração de **menor custo**. Qual volume atende?',
      concepts: [{ id: 'ebs.gp3' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um gp2 de 2.000 GiB, que entrega 6.000 IOPS pelo tamanho.', correct: false, consequence: 'Atinge os IOPS, mas paga 20 vezes o espaço necessário, a um preço por GiB maior que o do gp3.' },
        { id: 'b', text: 'Um io2 Block Express de 100 GiB com 6.000 IOPS provisionados.', correct: false, consequence: 'Atende, mas o io2 é para latência abaixo de 1 ms e durabilidade maior, requisitos que não existem aqui.' },
        { id: 'c', text: 'Um st1 de 500 GiB, o maior throughput entre os HDDs.', correct: false, consequence: 'O st1 vai a 500 IOPS: é feito para leitura sequencial, não para as operações pequenas de um banco.' },
        { id: 'd', text: 'Um gp3 de 100 GiB com 6.000 IOPS provisionados.', correct: true, consequence: 'O gp3 deixa provisionar IOPS sem crescer o disco, até 500 por GiB, ao preço do SSD mais barato.' },
      ],
      explanation: [
        'O **gp3** entrega 3.000 IOPS inclusos em qualquer tamanho e deixa **provisionar IOPS à parte**, até 500 por GiB e 80.000 no total, sem aumentar o disco. Um gp3 de 100 GiB aceita até 50.000 IOPS, então 6.000 cabem com folga, ao menor preço entre os SSDs.',
        'No gp2, os IOPS crescem com o tamanho (3 por GiB): pagar 2.000 GiB para usar 100 é o erro clássico. O io2 atende, mas cobra por latência e durabilidade que ninguém pediu. E o st1 é HDD, com poucos IOPS.',
        '**Regra prática:** o gp3 é o ponto de partida do EBS. Precisa de mais IOPS ou throughput? Provisione no próprio gp3, sem crescer o disco; o io2 entra quando aparecem latência abaixo de 1 ms, durabilidade maior ou mais de 80.000 IOPS.',
      ],
    },
    {
      id: 'rv:cmp.f03.m1.a2',
      kind: 'decision',
      title: 'Configuração recusada para o índice de busca',
      prompt:
        'Um fornecedor pediu um volume **gp3 de 20 GiB com 12.000 IOPS** para um índice de busca, e a AWS recusou a configuração. O índice ocupa só 15 GiB e precisa mesmo dos 12.000 IOPS. Qual ajuste atende com o **menor custo**?',
      concepts: [{ id: 'ebs.gp3' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter os 20 GiB e trocar o tipo para io2 Block Express com 12.000 IOPS.', correct: false, consequence: 'O io2 aceita 1.000 IOPS por GiB, então a configuração passa, mas a um custo bem maior que o gp3.' },
        { id: 'b', text: 'Aumentar o gp3 para 24 GiB e manter os 12.000 IOPS.', correct: true, consequence: 'O gp3 aceita até 500 IOPS por GiB: com 24 GiB, os 12.000 IOPS ficam dentro do limite.' },
        { id: 'c', text: 'Manter os 20 GiB e provisionar 10.000 IOPS, o máximo aceito nesse tamanho.', correct: false, consequence: 'A configuração passa, mas não entrega os 12.000 IOPS de que o índice precisa.' },
        { id: 'd', text: 'Trocar por um gp2 de 4.000 GiB, que chega aos 12.000 IOPS pelo tamanho.', correct: false, consequence: 'Atende, mas paga 4.000 GiB para guardar 15 GiB.' },
      ],
      explanation: [
        'O gp3 aceita **no máximo 500 IOPS por GiB**. Com 20 GiB, o teto é 10.000 IOPS; para 12.000, o volume precisa de pelo menos **24 GiB**. Aumentar 4 GiB custa pouco e mantém o tipo mais barato.',
        'O io2 aceita a configuração em 20 GiB, mas cobra caro por IOPS. Ficar nos 10.000 IOPS não atende à carga. E o gp2 de 4.000 GiB resolve pelo tamanho, pagando por um espaço que ninguém usa.',
        '**Regra prática:** ao provisionar IOPS no gp3, confira a proporção de 500 por GiB. Num volume pequeno com muitos IOPS, aumentar um pouco o tamanho costuma sair mais barato do que trocar de tipo.',
      ],
    },
    {
      id: 'rv:cmp.f03.throughput-no-boot',
      kind: 'decision',
      title: 'Leitura sequencial no volume de boot',
      prompt:
        'Um servidor de relatórios lê arquivos grandes do começo ao fim e precisa de **500 MiB/s**, mas faz poucas operações por segundo. Os arquivos ficam no próprio **volume de boot**, um gp3 de 200 GiB com a configuração padrão (3.000 IOPS e 125 MiB/s). Qual mudança atende com o **menor custo**?',
      concepts: [{ id: 'ebs.performance' }, { id: 'ebs.gp3' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Provisionar 16.000 IOPS no gp3, mantendo o throughput padrão.', correct: false, consequence: 'O gargalo é throughput, não IOPS: com 125 MiB/s, a leitura continua limitada.' },
        { id: 'b', text: 'Trocar o volume por um st1, feito para leitura sequencial.', correct: false, consequence: 'O st1 seria natural para leitura sequencial, mas nenhum HDD pode ser volume de boot.' },
        { id: 'c', text: 'Provisionar 500 MiB/s de throughput no próprio gp3.', correct: true, consequence: 'O gp3 aceita throughput provisionado à parte; os 3.000 IOPS inclusos já sustentam 500 MiB/s, na proporção de 0,25 MiB/s por IOPS.' },
        { id: 'd', text: 'Trocar o volume por um io2 Block Express com 64.000 IOPS.', correct: false, consequence: 'Paga caro por IOPS de que a carga não precisa; o requisito é de throughput.' },
      ],
      explanation: [
        '**IOPS** mede operações por segundo; **throughput** mede dados por segundo. Uma leitura sequencial de arquivos grandes é limitada por throughput. No gp3, o throughput é provisionado separado dos IOPS, até 2.000 MiB/s, na proporção máxima de 0,25 MiB/s por IOPS: com 3.000 IOPS, cabem até 750 MiB/s. Provisionar 500 MiB/s resolve sem trocar o volume.',
        'Mais IOPS não aumenta o throughput provisionado. O st1 seria natural para leitura sequencial, mas HDD não serve de boot. E o io2 resolve o problema errado, a um custo alto.',
        '**Regra prática:** identifique a métrica que limita a carga. Muitas operações pequenas, IOPS; fluxos longos e sequenciais, throughput. No gp3, os dois são ajustados separadamente.',
      ],
    },
    {
      id: 'rv:cmp.f03.120-mil-iops',
      kind: 'decision',
      title: '120.000 IOPS num único volume',
      prompt:
        'Um banco de dados transacional crítico precisa de **120.000 IOPS num único volume**, com latência abaixo de 1 ms. Hoje ele roda numa instância de geração anterior, que não é Nitro. Quais escolhas são necessárias para atender? (Escolha DUAS.)',
      concepts: [{ id: 'ebs.io2' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Um volume gp3 com 120.000 IOPS provisionados.', correct: false, consequence: 'O gp3 vai a no máximo 80.000 IOPS por volume.' },
        { id: 'b', text: 'Um volume io2 Block Express com 120.000 IOPS provisionados.', correct: true, consequence: 'O io2 Block Express vai a 256.000 IOPS, com latência média abaixo de 500 µs.' },
        { id: 'c', text: 'Um volume io1 com 120.000 IOPS provisionados.', correct: false, consequence: 'O io1 vai a no máximo 64.000 IOPS por volume.' },
        { id: 'd', text: 'Migrar o banco para uma instância Nitro.', correct: true, consequence: 'Os IOPS acima de 32.000 do io2 Block Express exigem instâncias Nitro.' },
        { id: 'e', text: 'Manter a instância atual e usar um volume maior para ganhar IOPS.', correct: false, consequence: 'Fora do Nitro, o limite prático do io2 é 32.000 IOPS, qualquer que seja o tamanho do volume.' },
      ],
      explanation: [
        'Acima de 80.000 IOPS num volume, só o **io2 Block Express** atende: ele vai a 256.000 IOPS, 4.000 MiB/s e latência média abaixo de 500 µs. Mas esse desempenho exige **instâncias Nitro**; nas outras, o limite prático é 32.000 IOPS. Por isso, o banco precisa do volume certo e da instância certa.',
        'O gp3 para em 80.000 IOPS e o io1 em 64.000. Aumentar o volume numa instância antiga não passa do limite da instância.',
        '**Regra prática:** "mais de 80.000 IOPS", "latência abaixo de 1 ms" ou "durabilidade de 99,999%" levam ao io2 Block Express. Confira também a instância: o desempenho máximo do volume depende do Nitro.',
      ],
    },
    {
      id: 'rv:cmp.f03.io2-sem-necessidade',
      kind: 'decision',
      title: 'Proposta de io2 para um banco comum',
      prompt:
        'Para um banco de dados novo, um analista propôs io2 Block Express. Os requisitos são **20.000 IOPS**, latência de poucos milissegundos e 400 GiB de dados, **sem exigência de durabilidade acima do padrão** do EBS. A empresa quer o **menor custo** que atenda. Qual volume escolher?',
      concepts: [{ id: 'ebs.io2' }, { id: 'ebs.gp3' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O io2 Block Express proposto, com 20.000 IOPS.', correct: false, consequence: 'Atende, mas paga por latência abaixo de 1 ms e durabilidade de 99,999%, que não foram pedidas.' },
        { id: 'b', text: 'Um gp2 de 6.700 GiB, para chegar a 20.000 IOPS pelo tamanho.', correct: false, consequence: 'O gp2 para em 16.000 IOPS, qualquer que seja o tamanho.' },
        { id: 'c', text: 'Um gp3 de 400 GiB com 20.000 IOPS provisionados.', correct: true, consequence: 'O gp3 entrega até 80.000 IOPS sem crescer o disco, e os 20.000 cabem em 400 GiB.' },
        { id: 'd', text: 'Um io1 de 400 GiB com 20.000 IOPS provisionados.', correct: false, consequence: 'O io1 também é de IOPS provisionado, mais caro que o gp3 e sem nenhum requisito que o justifique.' },
      ],
      explanation: [
        'Os requisitos cabem no **gp3**: 20.000 IOPS estão abaixo do teto de 80.000 e da proporção de 500 por GiB, e a latência de poucos milissegundos é a do SSD de uso geral. O io2 Block Express só se justifica com latência abaixo de 1 ms, durabilidade de 99,999% ou mais de 80.000 IOPS.',
        'O io2 e o io1 atendem pagando por recursos que ninguém pediu. O gp2 nem chega aos 20.000 IOPS, porque para em 16.000.',
        '**Regra prática:** antes de escolher io2, procure no enunciado o requisito que o justifica. Sem latência abaixo de 1 ms, durabilidade maior ou mais de 80.000 IOPS, a resposta é gp3.',
      ],
    },
    {
      id: 'rv:cmp.f03.arquivo-frio',
      kind: 'decision',
      title: 'Exames antigos num disco anexado',
      prompt:
        'Um hospital guarda **8 TiB de exames antigos** que um software legado lê **uma ou duas vezes por ano**, sempre em leituras sequenciais de arquivos grandes. O software só lê de um disco anexado à instância, então os dados precisam ficar num volume EBS. O hospital quer o **menor custo** de armazenamento. Qual tipo de volume atende?',
      concepts: [{ id: 'ebs.hdd' }, { id: 'ebs.performance' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'gp3, o SSD mais barato do EBS.', correct: false, consequence: 'É o SSD mais barato, mas SSD custa mais por GiB que HDD, e a carga não precisa de IOPS.' },
        { id: 'b', text: 'st1, o HDD otimizado para throughput.', correct: false, consequence: 'Serve a leitura sequencial frequente, como logs e big data; para dados quase nunca lidos, custa mais que o necessário.' },
        { id: 'c', text: 'sc1, o HDD para dados pouco acessados.', correct: true, consequence: 'É o volume mais barato do EBS, feito para dados frios lidos em sequência.' },
        { id: 'd', text: 'io2 Block Express, pela durabilidade de 99,999%.', correct: false, consequence: 'É o tipo mais caro, pensado para bancos críticos com muitos IOPS.' },
      ],
      explanation: [
        'A carga é **sequencial** e **rara**, e o requisito é o **menor custo**. Leitura sequencial de arquivos grandes depende de throughput, não de IOPS, e é onde os HDDs se encaixam. Entre eles, o **sc1** é o mais barato, para dados pouco acessados.',
        'O st1 também é HDD, mas é pensado para leitura sequencial frequente e custa mais. O gp3 e o io2 são SSDs, que cobram por um desempenho em operações pequenas que a carga não usa.',
        '**Regra prática:** dados frios, sequenciais e num volume EBS, sc1; sequenciais e frequentes, st1. Nenhum HDD serve de boot nem para muitos IOPS.',
      ],
    },
    {
      id: 'rv:cmp.f03.copia-para-outra-regiao',
      kind: 'decision',
      title: 'Plano de recuperação com cópia diária',
      prompt:
        'Uma empresa quer recuperar seus servidores em outra Região se a Região principal ficar indisponível. Os dados estão em volumes EBS. O plano exige uma cópia diária de cada volume **na Região de recuperação**, guardada por 30 dias, com o **menor esforço operacional**. Qual solução atende?',
      concepts: [{ id: 'ebs.snapshots' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Confiar nos snapshots diários, que a AWS já replica entre as zonas da Região.', correct: false, consequence: 'A replicação entre zonas fica dentro da Região: se a Região cair, os snapshots ficam inacessíveis junto com ela.' },
        { id: 'b', text: 'Uma política do Data Lifecycle Manager que cria os snapshots e os copia para a outra Região.', correct: true, consequence: 'A política cria os snapshots diários e os copia para a Região de recuperação, cada cópia com retenção própria.' },
        { id: 'c', text: 'Um script num servidor que cria e copia os snapshots todo dia e apaga os antigos.', correct: false, consequence: 'Funciona, mas o script e o servidor viram mais uma coisa para manter, o oposto de menor esforço.' },
        { id: 'd', text: 'Restaurar os snapshots da Região principal direto na Região de recuperação quando precisar.', correct: false, consequence: 'O snapshot restaura volumes só na Região onde está; sem a cópia prévia, não há o que restaurar na outra.' },
      ],
      explanation: [
        'Os snapshots ficam no S3 da **própria Região**, replicados entre as zonas dela, e restauram volumes em qualquer zona daquela Região. Para recuperação em outra Região, eles precisam ser **copiados para lá**. O **Data Lifecycle Manager** automatiza a criação, a cópia entre Regiões e a retenção, sem código para manter.',
        'A replicação entre zonas não protege contra a perda da Região. O script funciona, mas transfere a automação para a equipe. E restaurar direto na outra Região só é possível a partir de uma cópia que já esteja lá.',
        '**Regra prática:** snapshot protege dentro da Região; recuperação em outra Região pede cópia do snapshot. Para automatizar criação, cópia e retenção, use o Data Lifecycle Manager ou o AWS Backup.',
      ],
    },
    {
      id: 'rv:cmp.f03.m3.a2:del',
      kind: 'decision',
      title: 'Snapshot apagado, conta quase igual',
      prompt:
        'Para reduzir custo, a equipe apagou o **snapshot mais antigo** de um volume que tem snapshots diários há um ano. Esse primeiro snapshot tinha o tamanho do volume inteiro, mas a conta de armazenamento de snapshots **quase não caiu**. Qual explicação é a correta?',
      concepts: [{ id: 'ebs.snapshots' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Os snapshots mais novos ainda usam os blocos do mais antigo.', correct: true, consequence: 'Os snapshots são incrementais: os blocos que não mudaram continuam referenciados pelos snapshots mais novos.' },
        { id: 'b', text: 'A exclusão de um snapshot leva 30 dias para refletir na conta.', correct: false, consequence: 'Não existe esse prazo: o que continua cobrado são os blocos ainda usados por outros snapshots.' },
        { id: 'c', text: 'Cada snapshot é cobrado pelo tamanho total do volume, e havia outros 364.', correct: false, consequence: 'Se fosse assim, a conta seria enorme; os snapshots guardam só os blocos que mudaram desde o anterior.' },
        { id: 'd', text: 'O snapshot mais antigo era cobrado pelo preço do Standard-IA, mais barato.', correct: false, consequence: 'O preço por classe não explica: o espaço não foi liberado porque os blocos continuam em uso.' },
      ],
      explanation: [
        'Os snapshots do EBS são **incrementais**: cada um grava só os blocos que mudaram desde o anterior, e os mais novos referenciam os blocos antigos que não mudaram. Ao apagar o primeiro snapshot, os blocos ainda usados pelos seguintes **continuam guardados**, e só os blocos que nenhum outro usa são liberados.',
        'Não há prazo de 30 dias para a exclusão refletir. A cobrança não é pelo tamanho total do volume em cada snapshot, e o preço de uma classe do S3 não explica por que o espaço continua ocupado.',
        '**Regra prática:** apagar um snapshot antigo pode não reduzir o custo, porque seus blocos podem estar em uso pelos mais novos. Para controlar custo, defina retenção desde o início, com o Data Lifecycle Manager ou o AWS Backup.',
      ],
    },
    {
      id: 'rv:cmp.f03.todas-as-regioes',
      kind: 'decision',
      title: 'Volumes novos sem criptografia na auditoria',
      prompt:
        'Uma empresa ligou a **criptografia por padrão do EBS** na us-east-1, onde ficam quase todos os servidores. Meses depois, uma auditoria achou **volumes novos sem criptografia** na sa-east-1, criados por outra equipe. A empresa quer garantir que todo volume novo seja cifrado **nas Regiões que usa**. Qual ação atende?',
      concepts: [{ id: 'ebs.encryption' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar a criptografia por padrão também na sa-east-1 e em cada Região usada.', correct: true, consequence: 'A configuração é por Região: ligada em cada uma, todo volume novo nelas sai cifrado.' },
        { id: 'b', text: 'Nada a mudar: a configuração da us-east-1 vale para a conta inteira.', correct: false, consequence: 'A criptografia por padrão é ligada Região a Região; a da us-east-1 não vale na sa-east-1.' },
        { id: 'c', text: 'Ligar de novo a criptografia por padrão na us-east-1, agora com uma chave própria do KMS.', correct: false, consequence: 'Troca a chave usada na us-east-1, mas a sa-east-1 continua sem a configuração.' },
        { id: 'd', text: 'Cifrar os snapshots dos volumes da sa-east-1 sempre que forem criados.', correct: false, consequence: 'Os volumes continuam sem cifra; e nada garante os próximos volumes criados.' },
      ],
      explanation: [
        'A **criptografia por padrão do EBS** é uma configuração **por Região** da conta. Ligada numa Região, todo volume novo e toda cópia de snapshot saem cifrados ali; nas outras, nada muda. Por isso, ela precisa ser ligada em cada Região usada.',
        'A configuração da us-east-1 não se estende às outras Regiões, e trocar a chave dela não muda nada na sa-east-1. Cifrar só os snapshots deixa os volumes como estão e não garante os próximos.',
        '**Regra prática:** "garantir que todos os volumes novos sejam criptografados" é a criptografia por padrão do EBS, em cada Região. Ela não cifra o que já existe: para isso, snapshot, cópia cifrada e volume novo.',
      ],
    },
    {
      id: 'rv:cmp.f03.chave-do-cliente',
      kind: 'decision',
      title: 'Trocar a chave de todos os volumes',
      prompt:
        'Os volumes EBS de uma empresa são cifrados com a **chave padrão gerenciada pela AWS** (aws/ebs). Uma nova norma interna exige que **todos os volumes**, os atuais e os que forem criados, usem uma **chave do KMS gerenciada pelo cliente**, cuja política a empresa controla. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'ebs.encryption' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Trocar a chave de cada volume atual com Elastic Volumes, sem parar as instâncias.', correct: false, consequence: 'Elastic Volumes muda tamanho, tipo e desempenho; a chave de um volume cifrado não pode ser trocada.' },
        { id: 'b', text: 'Para cada volume atual, criar um snapshot, copiá-lo com a chave do cliente e criar um volume novo da cópia.', correct: true, consequence: 'A chave só muda ao copiar o snapshot; o volume novo, criado da cópia, usa a chave do cliente.' },
        { id: 'c', text: 'Mudar a chave padrão da criptografia por padrão do EBS para a chave do cliente, em cada Região.', correct: true, consequence: 'Os volumes novos passam a sair cifrados com a chave do cliente, sem depender de quem os cria.' },
        { id: 'd', text: 'Editar a política da chave aws/ebs para que a empresa passe a controlá-la.', correct: false, consequence: 'A política de uma chave gerenciada pela AWS não pode ser alterada pelo cliente.' },
        { id: 'e', text: 'Desligar e religar a criptografia por padrão, para que ela cifre de novo os volumes atuais.', correct: false, consequence: 'A criptografia por padrão não muda volumes que já existem, ligada ou religada.' },
      ],
      explanation: [
        'São dois problemas. Para os **volumes atuais**, a chave de um volume cifrado não muda no lugar: o caminho é snapshot, **cópia do snapshot com a chave do cliente** e volume novo a partir da cópia. Para os **volumes novos**, a criptografia por padrão do EBS aceita uma chave padrão escolhida pela empresa; trocando-a pela chave do cliente em cada Região, todo volume novo já nasce com ela.',
        'Elastic Volumes não mexe em criptografia. A política da chave aws/ebs é da AWS e não pode ser editada. E a criptografia por padrão vale só para o que for criado depois de ligada.',
        '**Regra prática:** trocar a chave de dados que já existem no EBS sempre passa pela cópia do snapshot. Para o que ainda vai ser criado, ajuste a chave da criptografia por padrão em cada Região.',
      ],
    },
    {
      id: 'rv:cmp.f03.plano-multi-attach',
      kind: 'decision',
      title: 'Revisando um plano de disco compartilhado',
      prompt:
        'Um fornecedor entregou este plano para um software em cluster: **um volume io2 com Multi-Attach**, anexado a **três instâncias Nitro espalhadas por duas zonas**, usado como **volume de boot** das três e formatado com **XFS** comum. Quais itens do plano precisam mudar? (Escolha TRÊS.)',
      concepts: [{ id: 'ebs.multi-attach' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'As instâncias espalhadas por duas zonas.', correct: true, consequence: 'O Multi-Attach só anexa o volume a instâncias da mesma zona do volume.' },
        { id: 'b', text: 'O uso como volume de boot.', correct: true, consequence: 'Volumes com Multi-Attach não podem ser volume de boot.' },
        { id: 'c', text: 'O sistema de arquivos XFS comum.', correct: true, consequence: 'XFS e EXT4 comuns não coordenam escritas de várias instâncias; é preciso um sistema de arquivos de cluster.' },
        { id: 'd', text: 'O tipo io2, que não aceita Multi-Attach.', correct: false, consequence: 'O io2 aceita Multi-Attach, assim como o io1.' },
        { id: 'e', text: 'O número de instâncias, porque o limite é de duas.', correct: false, consequence: 'O limite é de 16 instâncias Nitro por volume.' },
        { id: 'f', text: 'A falta de orçamento para a taxa do Multi-Attach.', correct: false, consequence: 'Não há cobrança extra pelo Multi-Attach.' },
      ],
      explanation: [
        'O **Multi-Attach** anexa um volume io1 ou io2 a até 16 instâncias Nitro, todas lendo e gravando. Mas há três restrições que o plano ignora: as instâncias precisam estar **na mesma zona** do volume, o volume **não pode ser de boot**, e a aplicação precisa de um **sistema de arquivos de cluster** para coordenar as escritas, o que XFS e EXT4 comuns não fazem.',
        'O io2 aceita Multi-Attach, três instâncias estão dentro do limite de 16 e o recurso não tem cobrança extra.',
        '**Regra prática:** Multi-Attach é para aplicações em cluster que coordenam escritas num disco de blocos, na mesma zona. Para compartilhar arquivos entre servidores comuns, a resposta é um sistema de arquivos compartilhado, não o Multi-Attach.',
      ],
    },
    {
      id: 'rv:cmp.f03.gp2-grande',
      kind: 'decision',
      title: 'Dois gp2, só um fica lento',
      prompt:
        'Uma empresa tem dois bancos parecidos, cada um num volume gp2: um de **300 GiB** e outro de **2 TiB**. Nos dias de carga alta, os dois passam horas pedindo cerca de 3.000 IOPS. Só o de 300 GiB fica lento depois de um tempo, e a métrica **BurstBalance** dele chega a zero. Qual explicação é a correta?',
      concepts: [{ id: 'ebs.gp2' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Volumes maiores ganham um saldo inicial de créditos maior, que demora mais a acabar.', correct: false, consequence: 'Todo volume começa com o mesmo saldo de 5,4 milhões de créditos; o que muda com o tamanho é a baseline.' },
        { id: 'b', text: 'O de 2 TiB tem baseline de 6.000 IOPS e não depende de créditos.', correct: true, consequence: 'No gp2, a baseline é de 3 IOPS por GiB: a partir de 1 TiB, ela já passa dos 3.000 IOPS do burst.' },
        { id: 'c', text: 'O de 300 GiB está numa instância com menos largura de banda para o EBS.', correct: false, consequence: 'Os dois bancos são parecidos, e o BurstBalance em zero aponta para os créditos do volume, não para a instância.' },
        { id: 'd', text: 'O gp2 de 2 TiB foi convertido sozinho para gp3 pela AWS.', correct: false, consequence: 'A AWS não troca o tipo dos volumes; a troca é feita pelo cliente, com Elastic Volumes.' },
      ],
      explanation: [
        'No gp2, o desempenho cresce com o tamanho: **3 IOPS por GiB**. O volume de 300 GiB tem baseline de 900 IOPS e só chega a 3.000 gastando **créditos de I/O**; quando eles acabam, cai para a baseline, e o BurstBalance mostra isso. O volume de 2 TiB tem baseline de 6.000 IOPS, acima do nível de burst, e não depende de créditos.',
        'Todos os volumes começam com o mesmo saldo de créditos. A instância não explica um BurstBalance em zero. E a AWS não converte volumes por conta própria.',
        '**Regra prática:** gp2 abaixo de 1 TiB depende de créditos para passar da baseline. A correção econômica para um gp2 que fica lento é migrar para gp3 com os IOPS necessários, não aumentar o disco.',
      ],
    },
  ],
}
