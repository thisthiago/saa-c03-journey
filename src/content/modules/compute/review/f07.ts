/**
 * Questões da Revisão da Fase 7 de Computação (Lambda), no formato do exame
 * SAA-C03. Fatos conferidos em 20/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'cmp.f07',
  questions: [
    {
      id: 'rv:cmp.f07.onde-cabe-funcao',
      kind: 'decision',
      title: 'Cinco cargas e uma proposta sem servidores',
      prompt:
        'Uma cafeteria com lojas em várias cidades quer levar para o Lambda tudo o que puder, para **não gerenciar servidores e pagar só pelo uso**. A equipe listou cinco cargas. Quais são boas candidatas a funções Lambda? (Escolha DUAS.)',
      concepts: [{ id: 'lambda.function' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Gerar a miniatura de cada foto de produto enviada ao S3, em poucos segundos.', correct: true, consequence: 'Tarefa curta, disparada por evento e sem estado: o caso típico do Lambda.' },
        { id: 'b', text: 'Um servidor de chat que mantém as conversas abertas na memória o dia todo.', correct: false, consequence: 'Precisa de estado local e roda sem parar; funções são curtas e não guardam estado entre invocações.' },
        { id: 'c', text: 'Receber o webhook do meio de pagamento, chamado algumas centenas de vezes por dia.', correct: true, consequence: 'Carga intermitente e curta: paga só pelas chamadas, sem servidor ocioso esperando.' },
        { id: 'd', text: 'O fechamento contábil mensal, que leva 40 minutos de uma vez.', correct: false, consequence: 'Passa do limite de 15 minutos por invocação.' },
        { id: 'e', text: 'Um cálculo de rotas com CPU alta e constante, 24 horas por dia.', correct: false, consequence: 'Carga constante e pesada pode sair mais barata em instâncias ou contêineres com compromisso de uso.' },
      ],
      explanation: [
        'O Lambda roda código **quando um evento chega**, sem servidor para gerenciar, e cobra pelas requisições e pelo tempo de execução. Ele brilha em tarefas **curtas, sem estado e intermitentes**, como gerar miniaturas a partir de eventos do S3 e atender um webhook de baixo volume.',
        'O chat precisa de estado na memória e roda o tempo todo. O fechamento passa dos 15 minutos de uma invocação. E o cálculo de rotas constante paga GB-segundo o dia inteiro, quando uma instância com compromisso de uso costuma sair mais barata.',
        '**Regra prática:** "acionado por eventos", "intermitente", "sem gerenciar servidores" e "pagar só pelo uso" apontam para Lambda. Mais de 15 minutos, estado local ou carga constante e pesada o tiram da disputa.',
      ],
    },
    {
      id: 'rv:cmp.f07.contador-errado',
      kind: 'decision',
      title: 'Senhas repetidas no pico',
      prompt:
        'Uma função Lambda distribui **senhas de atendimento** guardando o último número numa variável global do código. Com pouco movimento, funciona; no pico, clientes diferentes recebem **a mesma senha**. A empresa quer senhas únicas **sem limitar a escala** da função. Qual mudança atende?',
      concepts: [{ id: 'lambda.function' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar a memória da função, para a variável global caber.', correct: false, consequence: 'A memória não é o problema: cada ambiente de execução tem a própria cópia da variável.' },
        { id: 'b', text: 'Configurar concorrência reservada de 1, para haver um único ambiente.', correct: false, consequence: 'Acaba com as repetições, mas limita a função a uma requisição por vez, o oposto do requisito.' },
        { id: 'c', text: 'Guardar o contador num banco externo, como o DynamoDB.', correct: true, consequence: 'Todos os ambientes passam a usar o mesmo contador, e a função continua escalando.' },
        { id: 'd', text: 'Gravar o contador no /tmp da função, que é compartilhado.', correct: false, consequence: 'O /tmp é de cada ambiente de execução, não é compartilhado entre eles.' },
      ],
      explanation: [
        'Cada requisição em andamento usa um **ambiente de execução** próprio, que o Lambda cria, reaproveita e descarta sozinho. No pico, há vários ambientes ao mesmo tempo, cada um com sua cópia da variável global e do /tmp, e todos começam do mesmo número. O Lambda foi feito para tarefas que **não guardam estado** entre invocações: o estado compartilhado precisa ficar fora, num banco com incremento atômico.',
        'Mais memória não junta as cópias. A concorrência de 1 resolve sacrificando a escala. E o /tmp é local de cada ambiente.',
        '**Regra prática:** em funções Lambda, estado que precisa sobreviver entre invocações ou ser compartilhado vai para fora da função: banco, cache ou fila.',
      ],
    },
    {
      id: 'rv:cmp.f07.video-pela-api',
      kind: 'decision',
      title: 'Vídeos de 2 GB que não chegam',
      prompt:
        'Um aplicativo envia vídeos de até **2 GB** no corpo de uma chamada à API Gateway, que invoca uma função Lambda **de forma síncrona** para processá-los. Os envios grandes falham. A empresa quer continuar processando cada vídeo com Lambda, com o **menor esforço**. Qual solução atende?',
      concepts: [{ id: 'lambda.limits' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar a memória da função para 10.240 MB, o máximo permitido.', correct: false, consequence: 'O limite que falha é o do payload da chamada síncrona, de 6 MB, que não depende da memória.' },
        { id: 'b', text: 'Trocar para invocação assíncrona, para o aplicativo não esperar.', correct: false, consequence: 'O payload assíncrono é ainda menor, de 1 MB.' },
        { id: 'c', text: 'Aumentar o timeout da função para 15 minutos, o máximo permitido.', correct: false, consequence: 'O envio falha antes de a função rodar: o problema é o tamanho, não o tempo.' },
        { id: 'd', text: 'Enviar o vídeo ao S3 por URL pré-assinada e acionar a função pelo evento.', correct: true, consequence: 'O vídeo não passa pelo payload: a função recebe só a referência ao objeto e o lê do S3.' },
      ],
      explanation: [
        'Uma chamada **síncrona** ao Lambda aceita payload de no máximo **6 MB**; a assíncrona, 1 MB. Um vídeo de 2 GB nunca vai caber no corpo da chamada. O padrão é o aplicativo enviar o arquivo direto ao **S3**, com uma URL pré-assinada, e o evento de objeto criado acionar a função com a referência ao objeto.',
        'Memória e timeout não mudam o limite de payload. A invocação assíncrona tem um limite ainda menor.',
        '**Regra prática:** arquivos grandes não passam pelo payload do Lambda. Grave no S3 e passe a referência; os limites de 6 MB (síncrono) e 1 MB (assíncrono) são os que mais pesam nas decisões.',
      ],
    },
    {
      id: 'rv:cmp.f07.espaco-temporario',
      kind: 'decision',
      title: 'Arquivo descompactado que não cabe',
      prompt:
        'Uma função Lambda recebe a referência de um arquivo .zip no S3, **descompacta cerca de 6 GB** de planilhas para validá-las e termina em 4 minutos. Ela falha por falta de espaço em disco, com o **/tmp no tamanho padrão**. Qual ajuste resolve com o **menor esforço**?',
      concepts: [{ id: 'lambda.limits' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aumentar o armazenamento temporário (/tmp) da função para 8 GB.', correct: true, consequence: 'O /tmp é configurável de 512 MB até 10.240 MB, e 8 GB dão folga para os 6 GB descompactados.' },
        { id: 'b', text: 'Aumentar a memória da função para 10.240 MB.', correct: false, consequence: 'Memória e /tmp são configurações separadas: o disco continua no tamanho padrão.' },
        { id: 'c', text: 'Colocar as planilhas numa camada (layer) da função.', correct: false, consequence: 'Camadas levam código e dependências fixas, no limite do pacote; não servem para dados que chegam a cada invocação.' },
        { id: 'd', text: 'Migrar a validação para uma instância EC2, porque o Lambda não passa de 512 MB de disco.', correct: false, consequence: 'O /tmp padrão é de 512 MB, mas pode ser aumentado até 10.240 MB: não é preciso sair do Lambda.' },
      ],
      explanation: [
        'O **/tmp** da função vem com 512 MB, mas é configurável **até 10.240 MB**. Como a tarefa leva 4 minutos, dentro do limite de 15, e o problema é só espaço, aumentar o armazenamento temporário resolve sem mudar a arquitetura.',
        'A memória não aumenta o disco. Camadas são para código e bibliotecas, com até 5 por função, e não para dados de cada execução. E sair do Lambda seria esforço desnecessário.',
        '**Regra prática:** conheça os limites ajustáveis do Lambda: memória de 128 MB a 10.240 MB e /tmp de 512 MB a 10.240 MB. Os que não se ajustam são os 15 minutos e o tamanho do payload.',
      ],
    },
    {
      id: 'rv:cmp.f07.m1.a2',
      kind: 'decision',
      title: 'Função de redimensionar fotos no limite da CPU',
      prompt:
        'Uma função que redimensiona fotos tem **512 MB** de memória, usa **100% da CPU** o tempo todo e leva 8 segundos por foto. A equipe quer que ela fique **mais rápida**, sem aumentar muito o custo. Qual mudança atende?',
      concepts: [{ id: 'lambda.memory-cpu' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Escolher uma CPU maior na configuração da função.', correct: false, consequence: 'O Lambda não tem configuração de CPU: ela vem em proporção à memória.' },
        { id: 'b', text: 'Aumentar o timeout da função para 15 minutos.', correct: false, consequence: 'Deixa a função rodar por mais tempo, mas não mais rápido.' },
        { id: 'c', text: 'Aumentar a memória da função.', correct: true, consequence: 'Mais memória traz mais CPU; se o tempo cai na mesma proporção, o custo em GB-segundo fica parecido.' },
        { id: 'd', text: 'Configurar concorrência provisionada para a função.', correct: false, consequence: 'A provisionada elimina o cold start, não acelera uma execução que já está rodando.' },
      ],
      explanation: [
        'No Lambda, você não escolhe a CPU: ela vem **em proporção à memória**, e com 1.769 MB a função tem o equivalente a 1 vCPU. Uma função limitada por CPU fica mais rápida com mais memória. Como o preço é por GB-segundo, dobrar a memória e cortar o tempo pela metade mantém o custo parecido, e às vezes o reduz.',
        'Não há ajuste de CPU separado. O timeout é só o tempo máximo. A provisionada trata da inicialização, não do processamento.',
        '**Regra prática:** função lenta por CPU no Lambda pede mais memória. Meça o tempo e o custo depois da mudança: muitas vezes os dois melhoram.',
      ],
    },
    {
      id: 'rv:cmp.f07.m1.a4',
      kind: 'decision',
      title: 'Função rápida que mesmo assim recusa chamadas',
      prompt:
        'Uma função de **50 ms** recebe **20.000 requisições por segundo** no pico. A conta tem a concorrência padrão de **1.000** e nenhuma outra função relevante. Mesmo assim, cerca de metade das requisições sofre **throttling**. Qual mudança resolve?',
      concepts: [{ id: 'lambda.concurrency' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Configurar concorrência reservada de 1.000 na função.', correct: false, consequence: 'Só 900 podem ser reservados por padrão, e reservar não aumenta o limite de requisições por segundo.' },
        { id: 'b', text: 'Configurar concorrência provisionada de 1.000 na função.', correct: false, consequence: 'A provisionada elimina o cold start; não aumenta os limites da conta.' },
        { id: 'c', text: 'Pedir o aumento da cota de concorrência da conta.', correct: true, consequence: 'O limite de requisições por segundo é 10 vezes a concorrência: com uma cota maior, ele passa dos 20.000.' },
        { id: 'd', text: 'Otimizar a função para 25 ms, reduzindo a concorrência necessária.', correct: false, consequence: 'A concorrência cai, mas o limite de 10.000 requisições por segundo continua o mesmo.' },
      ],
      explanation: [
        'A concorrência necessária é 20.000 × 0,05 = **1.000**, dentro da cota. Mas há outro limite: as requisições por segundo podem ser no máximo **10 vezes a concorrência**, ou seja, 10.000. Metade das 20.000 passa disso. A saída é **pedir aumento da cota** da conta, que eleva também esse limite.',
        'A reservada tem teto de 900 por padrão e não cria capacidade nova. A provisionada trata de cold start. E encurtar a função não muda o limite de 10.000 por segundo.',
        '**Regra prática:** throttling no Lambda pode vir da concorrência (requisições por segundo × duração) ou do limite de requisições por segundo (10 vezes a concorrência). Funções muito rápidas esbarram no segundo.',
      ],
    },
    {
      id: 'rv:cmp.f07.m1.a3',
      kind: 'decision',
      title: 'Lançamento de uma API com muito tráfego',
      prompt:
        'Uma nova API no Lambda deve receber **3.000 requisições por segundo** no lançamento, e cada uma leva **400 ms**. A conta usa a concorrência padrão de **1.000** e já tem outras funções com uso baixo. O que a equipe precisa saber **antes do lançamento**?',
      concepts: [{ id: 'lambda.concurrency' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Serão necessárias 1.200 execuções simultâneas: é preciso pedir aumento da cota.', correct: true, consequence: '3.000 × 0,4 = 1.200, acima da cota padrão de 1.000 da conta inteira: sem aumento, haverá throttling.' },
        { id: 'b', text: 'Serão necessárias 3.000 execuções simultâneas, uma por requisição do segundo.', correct: false, consequence: 'Concorrência é requisições por segundo vezes a duração: cada execução dura 0,4 s, não 1 s.' },
        { id: 'c', text: 'Serão necessárias 400 execuções simultâneas, dentro da cota.', correct: false, consequence: 'Esse número vem da duração em milissegundos, não da conta da concorrência.' },
        { id: 'd', text: 'Nada muda: o limite de 10.000 requisições por segundo cobre as 3.000.', correct: false, consequence: 'O limite de requisições por segundo passa, mas o de concorrência não: 1.200 execuções ao mesmo tempo superam 1.000.' },
      ],
      explanation: [
        '**Concorrência** é o número de requisições em andamento ao mesmo tempo: **requisições por segundo × duração média**. Aqui, 3.000 × 0,4 = 1.200, acima da cota padrão de 1.000, que ainda é dividida com as outras funções da conta. Sem pedir aumento, parte das requisições sofre throttling.',
        'Contar uma execução por requisição ignora a duração. O 400 é a duração, não a concorrência. E o limite de requisições por segundo é só um dos dois limites: os dois precisam caber.',
        '**Regra prática:** antes de lançar uma função com muito tráfego, calcule requisições por segundo × duração e compare com a cota da conta, que é compartilhada por todas as funções da Região.',
      ],
    },
    {
      id: 'rv:cmp.f07.m2.a3',
      kind: 'decision',
      title: 'Banco pequeno afogado em conexões',
      prompt:
        'Uma função Lambda, acionada por eventos do S3, grava num banco de dados que aceita no máximo **50 conexões**. Nos picos de upload, a função escala para centenas de execuções simultâneas e o banco começa a recusar conexões. A empresa quer **limitar a função a 50 execuções**, sem custo adicional e sem trocar o banco. Qual configuração atende?',
      concepts: [{ id: 'lambda.reserved' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Concorrência provisionada de 50 na função.', correct: false, consequence: 'A provisionada é cobrada e não é teto: acima de 50, a função continua escalando com ambientes comuns.' },
        { id: 'b', text: 'Concorrência reservada de 50 na função.', correct: true, consequence: 'A reservada é também teto: a função nunca passa de 50 execuções, e o excedente assíncrono volta para a fila do Lambda.' },
        { id: 'c', text: 'Reduzir a memória da função, para ela rodar menos execuções ao mesmo tempo.', correct: false, consequence: 'A memória não limita quantas execuções rodam juntas.' },
        { id: 'd', text: 'Reduzir o timeout da função para 3 segundos.', correct: false, consequence: 'Encurta as execuções que demoram, mas não limita quantas rodam ao mesmo tempo.' },
      ],
      explanation: [
        'A **concorrência reservada** separa uma parte da concorrência da conta só para a função e, ao mesmo tempo, funciona como **teto**: ela não passa desse valor, mesmo com concorrência livre na conta. É gratuita. Com 50, o banco recebe no máximo 50 conexões da função; os eventos assíncronos que sobrarem esperam na fila do Lambda.',
        'A provisionada é cobrada e não limita a escala. Memória e timeout não controlam quantas execuções rodam ao mesmo tempo.',
        '**Regra prática:** "limitar quantas conexões a função abre no banco" ou "garantir capacidade para uma função crítica" é concorrência reservada: garantia e teto ao mesmo tempo.',
      ],
    },
    {
      id: 'rv:cmp.f07.parar-a-funcao',
      kind: 'decision',
      title: 'Desligar uma função com defeito agora',
      prompt:
        'Uma versão com defeito de uma função assíncrona começou a gravar dados errados. A equipe precisa **parar todas as invocações imediatamente**, sem apagar a função nem perder a configuração, e quer que os eventos que chegarem nesse meio-tempo vão para o **destino de falha** já configurado. Qual ação atende?',
      concepts: [{ id: 'lambda.reserved' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Configurar concorrência provisionada zero.', correct: false, consequence: 'A provisionada zero só remove os ambientes pré-inicializados; a função continua sendo invocada.' },
        { id: 'b', text: 'Apagar a função e recriá-la depois da correção.', correct: false, consequence: 'Para as invocações, mas perde a configuração e os gatilhos, que a equipe quer manter.' },
        { id: 'c', text: 'Reduzir o timeout da função para 1 segundo.', correct: false, consequence: 'A função continua rodando e pode gravar dados errados nesse segundo.' },
        { id: 'd', text: 'Configurar concorrência reservada zero.', correct: true, consequence: 'Com reservada zero, a função para de ser invocada; os eventos assíncronos vão para a DLQ ou o destino de falha.' },
      ],
      explanation: [
        'Com **concorrência reservada zero**, a função **para de ser invocada**, sem ser apagada. Os eventos assíncronos que chegarem vão para a DLQ ou o destino de falha configurado, de onde podem ser reprocessados depois da correção. Para voltar, basta remover ou aumentar a reserva.',
        'A provisionada zero não impede invocações. Apagar a função perde configuração e gatilhos. E um timeout curto não impede a gravação.',
        '**Regra prática:** reservada zero é o "desligar" de uma função Lambda: para as invocações sem perder nada, e os eventos assíncronos seguem o tratamento de falha.',
      ],
    },
    {
      id: 'rv:cmp.f07.snapstart',
      kind: 'decision',
      title: 'API em Java lenta nas primeiras chamadas',
      prompt:
        'Uma API em **Java** no Lambda leva cerca de **6 segundos** para responder às primeiras requisições depois de períodos sem uso, por causa da inicialização dos ambientes. A empresa quer reduzir esse tempo **sem pagar a mais** pela função. Qual opção atende?',
      concepts: [{ id: 'lambda.provisioned' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ligar o SnapStart na função.', correct: true, consequence: 'O SnapStart reduz a inicialização de funções Java retomando um ambiente já inicializado, sem custo extra.' },
        { id: 'b', text: 'Configurar concorrência provisionada para o pico.', correct: false, consequence: 'Elimina o cold start, mas é cobrada, e o requisito é não pagar a mais.' },
        { id: 'c', text: 'Configurar concorrência reservada para a função.', correct: false, consequence: 'A reservada garante e limita a concorrência; não resolve o cold start.' },
        { id: 'd', text: 'Aumentar o timeout da função para 30 segundos.', correct: false, consequence: 'Evita que a requisição seja cortada, mas a demora continua lá.' },
      ],
      explanation: [
        'O **cold start** é o tempo de inicializar um ambiente novo. A concorrência provisionada mantém ambientes prontos, mas é **cobrada**. Em **Java**, o **SnapStart** é a alternativa **sem custo extra**: ele retoma ambientes a partir de um estado já inicializado e corta boa parte da demora.',
        'A provisionada resolve, pagando. A reservada não tem relação com cold start. E o timeout só impede o corte da requisição.',
        '**Regra prática:** "eliminar o cold start" é concorrência provisionada; em Java e sem custo extra, SnapStart. Os dois não podem ser usados na mesma versão da função.',
      ],
    },
    {
      id: 'rv:cmp.f07.falhas-por-origem',
      kind: 'decision',
      title: 'Três funções, três origens, um padrão de falhas',
      prompt:
        'Uma empresa tem três funções: a **A** é acionada por eventos do **S3**; a **B** lê mensagens de uma fila **SQS**; a **C** lê um stream do **Kinesis**. Em todas, o que falhar de vez precisa ser guardado para análise. Quais configurações estão corretas? (Escolha DUAS.)',
      concepts: [{ id: 'lambda.invocation' }, { id: 'lambda.async-errors' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Na função A, um destino de falha (on-failure) configurado na própria função.', correct: true, consequence: 'O S3 invoca de forma assíncrona: o tratamento de falha fica na função, com destino ou DLQ.' },
        { id: 'b', text: 'Na função B, uma DLQ configurada na própria função.', correct: false, consequence: 'Com SQS como origem, a função é acionada por event source mapping, e a DLQ fica na fila de origem.' },
        { id: 'c', text: 'Na função B, uma DLQ configurada na fila SQS de origem.', correct: true, consequence: 'As mensagens que falham repetidamente vão da fila de origem para a DLQ dela.' },
        { id: 'd', text: 'Na função C, uma DLQ configurada no bucket do S3.', correct: false, consequence: 'O bucket não tem relação com o stream; com Kinesis, novas tentativas e destino de falha ficam no event source mapping.' },
        { id: 'e', text: 'Na função C, nada a configurar: registros com falha são descartados depois de 2 tentativas.', correct: false, consequence: 'As 2 novas tentativas são da invocação assíncrona; no stream, isso é configurado no event source mapping.' },
      ],
      explanation: [
        'O tratamento de erro depende do **tipo de invocação**. O S3 invoca de forma **assíncrona**: o destino de falha ou a DLQ ficam na **função**. SQS e Kinesis são lidos por **event source mapping**: com SQS, a DLQ fica na **própria fila**; com streams, as novas tentativas e o destino de falha ficam no **event source mapping**.',
        'DLQ na função não vale para mensagens lidas da SQS. O bucket do S3 nada tem a ver com o stream. E as 2 novas tentativas automáticas são da invocação assíncrona, não do stream.',
        '**Regra prática:** primeiro descubra como a origem invoca a função (síncrona, assíncrona ou event source mapping); depois, onde mora o tratamento de falha: na função, na fila ou no mapeamento.',
      ],
    },
    {
      id: 'rv:cmp.f07.erro-para-quem-chama',
      kind: 'decision',
      title: 'Ferramenta interna que nunca vê o erro',
      prompt:
        'Uma ferramenta interna invoca uma função Lambda de forma **assíncrona** para emitir notas fiscais. Quando a função falha, o Lambda tenta de novo sozinho, e a ferramenta mostra "enviado" sem saber de nada. A equipe quer que a **ferramenta receba o erro na hora** e decida o que fazer. Qual mudança atende?',
      concepts: [{ id: 'lambda.invocation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter a invocação assíncrona e zerar as novas tentativas da função.', correct: false, consequence: 'Acaba com as repetições, mas a ferramenta continua sem esperar a resposta e sem ver o erro.' },
        { id: 'b', text: 'Configurar um destino de falha numa fila SQS.', correct: false, consequence: 'Guarda os eventos que falharam para análise depois, mas a ferramenta continua sem receber o erro na hora.' },
        { id: 'c', text: 'Passar a invocar a função de forma síncrona.', correct: true, consequence: 'Na invocação síncrona, quem chama espera a resposta e recebe o erro da função para tratar.' },
        { id: 'd', text: 'Colocar uma fila SQS entre a ferramenta e a função.', correct: false, consequence: 'A fila desacopla ainda mais: a ferramenta entrega a mensagem e segue, sem ver o resultado.' },
      ],
      explanation: [
        'Na invocação **assíncrona**, o evento entra numa fila do Lambda e quem chamou não espera; as falhas são tratadas pelo próprio Lambda, com novas tentativas e destinos. Na **síncrona**, quem chama **espera a resposta** e recebe o erro, como acontece com a API Gateway e o ALB. Para a ferramenta decidir na hora, a chamada precisa ser síncrona.',
        'Zerar as novas tentativas e configurar um destino de falha melhoram o tratamento assíncrono, mas não devolvem o erro a quem chamou. Uma fila no meio só aumenta o desacoplamento.',
        '**Regra prática:** quem precisa do resultado ou do erro para seguir chama de forma síncrona. Quem só entrega o trabalho e segue chama de forma assíncrona e deixa o tratamento de falha com o Lambda.',
      ],
    },
    {
      id: 'rv:cmp.f07.m3.a3',
      kind: 'decision',
      title: 'Saber o motivo de cada falha e contar os sucessos',
      prompt:
        'Uma função de miniaturas é acionada por eventos do S3. A equipe quer guardar cada evento que **falhar de vez, junto com o erro** devolvido pela função, e também publicar um evento para cada miniatura **gerada com sucesso** num barramento de eventos. Qual configuração atende?',
      concepts: [{ id: 'lambda.async-errors' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma DLQ numa fila SQS padrão, configurada na função.', correct: false, consequence: 'A DLQ guarda só o conteúdo do evento, sem o erro, e não registra sucessos.' },
        { id: 'b', text: 'Um destino de falha numa fila SQS padrão e um destino de sucesso no EventBridge.', correct: true, consequence: 'O destino de falha guarda o evento com o motivo do erro, e o de sucesso publica cada miniatura gerada.' },
        { id: 'c', text: 'Um destino de falha numa fila SQS FIFO e um destino de sucesso no EventBridge.', correct: false, consequence: 'Filas FIFO não servem como destino nem como DLQ do Lambda.' },
        { id: 'd', text: 'Aumentar as novas tentativas automáticas da função para 10.', correct: false, consequence: 'O máximo são 2 novas tentativas, e repetir uma foto corrompida não resolve nem registra nada.' },
      ],
      explanation: [
        'Na invocação assíncrona, o Lambda tenta mais **2 vezes**; o que falhar de vez vai para um **destino de falha** ou uma DLQ. Os **destinos** trazem também o motivo da falha e podem registrar os **sucessos**; a DLQ recebe só o conteúdo do evento. Por isso, destino de falha numa fila padrão e destino de sucesso no EventBridge.',
        'A DLQ perde o erro e os sucessos. Filas FIFO não são aceitas como destino nem como DLQ. E as novas tentativas param em 2.',
        '**Regra prática:** precisa do motivo do erro ou de registrar sucessos, use destinos; só guardar o evento que falhou, DLQ também serve. Em nenhum dos dois casos, fila FIFO.',
      ],
    },
    {
      id: 'rv:cmp.f07.vpc-sem-permissao',
      kind: 'decision',
      title: 'Configuração de VPC recusada',
      prompt:
        'Ao ligar uma função Lambda a subnets privadas de uma VPC, para ela acessar um banco RDS, a equipe recebeu um erro: a **role de execução** da função não tem permissão para **criar interfaces de rede**. Qual mudança resolve com o **menor privilégio**?',
      concepts: [{ id: 'lambda.vpc' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Anexar à role a política AWSLambdaVPCAccessExecutionRole.', correct: true, consequence: 'A política dá as permissões de interfaces de rede de que a função precisa na VPC, e só elas.' },
        { id: 'b', text: 'Anexar à role de execução a política AdministratorAccess.', correct: false, consequence: 'Resolve o erro, mas dá à função acesso a tudo na conta.' },
        { id: 'c', text: 'Ligar a função a subnets públicas, que não exigem interfaces de rede.', correct: false, consequence: 'Toda função ligada a uma VPC usa interfaces de rede; e numa subnet pública ela nem ganha IP público.' },
        { id: 'd', text: 'Criar um NAT gateway nas subnets da função.', correct: false, consequence: 'O NAT gateway dá saída para a internet; não dá à role a permissão que falta.' },
      ],
      explanation: [
        'Uma função ligada a uma VPC precisa de **interfaces de rede** nas subnets escolhidas, e quem as cria é a **role de execução**. A AWS oferece a política gerenciada **AWSLambdaVPCAccessExecutionRole** com essas permissões. Funções na mesma combinação de subnets e security groups compartilham as interfaces.',
        'AdministratorAccess resolve com privilégio demais. Subnets públicas também exigem interfaces e não dão IP público à função. O NAT gateway resolve outro problema: a saída para a internet.',
        '**Regra prática:** Lambda numa VPC precisa da permissão de interfaces de rede na role e, para sair à internet, de um NAT gateway. Fora da VPC, a função acessa a internet, mas não alcança recursos privados.',
      ],
    },
    {
      id: 'rv:cmp.f07.arm-mais-barato',
      kind: 'decision',
      title: 'Cortar o custo de funções intermitentes',
      prompt:
        'Uma empresa tem dezenas de funções Lambda em **Python puro**, sem bibliotecas compiladas para x86, com carga intermitente ao longo do dia. Ela quer **reduzir o custo** das funções **sem mudar a carga nem o código**. Qual mudança atende?',
      concepts: [{ id: 'lambda.pricing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Configurar concorrência provisionada nas funções mais usadas.', correct: false, consequence: 'A provisionada é cobrada à parte: aumenta o custo em vez de reduzir.' },
        { id: 'b', text: 'Comprar um EC2 Instance Savings Plan para cobrir as funções.', correct: false, consequence: 'O EC2 Instance SP só cobre instâncias EC2; no Lambda, quem dá desconto é o Compute Savings Plan.' },
        { id: 'c', text: 'Configurar concorrência reservada em todas as funções.', correct: false, consequence: 'A reservada é gratuita, mas não dá desconto: só garante e limita a concorrência.' },
        { id: 'd', text: 'Mudar a arquitetura das funções para Arm (Graviton).', correct: true, consequence: 'Funções em Arm custam menos por GB-segundo, e código Python puro roda sem mudança.' },
      ],
      explanation: [
        'O Lambda cobra por **requisição** e por **GB-segundo**, mais a concorrência provisionada, se houver. Funções em **Arm (Graviton)** custam menos por GB-segundo. Como o código é Python puro, sem dependências presas ao x86, a troca de arquitetura reduz o custo sem mexer na carga.',
        'A provisionada acrescenta cobrança. O EC2 Instance Savings Plan não cobre o Lambda; o Compute Savings Plan cobre. A reservada não muda o preço.',
        '**Regra prática:** para reduzir o custo do Lambda, olhe a arquitetura (Arm é mais barato), a memória certa e o Compute Savings Plan para uso constante. Carga constante e pesada pode sair mais barata em instâncias ou no Fargate.',
      ],
    },
  ],
}
