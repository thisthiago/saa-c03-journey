/**
 * Questões da Revisão da Fase 9 de Arquitetura e otimização (como o exame
 * pergunta), no formato do exame SAA-C03. Fatos conferidos em
 * docs.aws.amazon.com e no guia do exame (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'arq.f09',
  questions: [
    {
      id: 'rv:arq.f09.m1.a2:i2',
      kind: 'decision',
      title: 'Fraco num domínio',
      prompt:
        'Um colega acerta bem as questões de segurança, resiliência e desempenho nos simulados, mas vai mal nas de **custo**. Ele acha que vai **reprovar de qualquer jeito** por causa desse domínio. Pelo guia do SAA-C03, qual afirmação está correta?',
      concepts: [{ id: 'exam.format' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'É preciso atingir a nota mínima em cada domínio separadamente.', correct: false, consequence: 'O exame não tem nota mínima por domínio.' },
        { id: 'b', text: 'O modelo é compensatório: conta a nota do exame inteiro.', correct: true, consequence: 'Ir bem nos outros domínios compensa o de custo, se a nota passar de 720.' },
        { id: 'c', text: 'Custo é o domínio que mais pesa, então reprova sozinho.', correct: false, consequence: 'Custo pesa 20%, o menor peso entre os quatro.' },
        { id: 'd', text: 'A nota mínima é 700 em 1.000, contando só os acertos de custo.', correct: false, consequence: 'A nota mínima é 720, sobre o exame inteiro.' },
      ],
      explanation: [
        'O SAA-C03 usa um **modelo compensatório**: não é preciso passar em cada domínio, só no **exame inteiro**. A nota vai de **100 a 1.000**, e a mínima para passar é **720**. Os pesos são Seguro 30%, Resiliente 26%, Alto desempenho 24% e Custo 20%.',
        'Não há corte por domínio, e custo é o domínio de menor peso. Ainda assim, vale estudá-lo: 20% das questões pesam na nota.',
        '**Regra prática:** o exame aprova pela nota total; estude onde está fraco, mas sem achar que um domínio reprova sozinho.',
      ],
    },
    {
      id: 'rv:arq.f09.m1.a1',
      kind: 'decision',
      title: 'Pular as que não contam',
      prompt:
        'Um colega sabe que o exame tem **15 questões que não contam** para a nota. A estratégia dele é **deixar em branco** as mais difíceis, achando que são essas que não valem ponto. Pelo guia do SAA-C03, o que ele deveria fazer?',
      concepts: [{ id: 'exam.format' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Manter a estratégia: as questões difíceis são as que não contam.', correct: false, consequence: 'As que não contam não são identificadas; podem ser fáceis ou difíceis.' },
        { id: 'b', text: 'Deixar em branco só as de resposta múltipla, que valem menos.', correct: false, consequence: 'Em branco conta como errada em qualquer tipo de questão.' },
        { id: 'c', text: 'Responder todas, porque chutar não tira ponto.', correct: true, consequence: 'Cada resposta tem chance de acerto, e nenhuma é penalizada.' },
        { id: 'd', text: 'Responder só as que tiver certeza, para não perder pontos.', correct: false, consequence: 'O exame não tem penalidade por erro; em branco é sempre errada.' },
      ],
      explanation: [
        'O SAA-C03 tem **50 questões que contam e 15 que não contam**, **sem identificação**: não dá para saber quais são. Questão **em branco conta como errada**, e **chutar não tira ponto**.',
        'Deixar em branco qualquer questão, difícil ou de resposta múltipla, só reduz a chance de acerto. E como as questões que não contam se misturam às outras, pular as difíceis pode descartar justamente questões que valem ponto.',
        '**Regra prática:** responda todas as questões; na dúvida, elimine o que puder e escolha entre as que sobram.',
      ],
    },
    {
      id: 'rv:arq.f09.m2.a2:p2',
      kind: 'decision',
      title: 'Lidos uma vez por trimestre',
      prompt:
        'Um laboratório guarda **exames de imagem** no S3. Depois do primeiro mês, cada exame é aberto **cerca de uma vez por trimestre**, mas, quando um médico pede, ele precisa abrir **em milissegundos**. A empresa quer a solução **mais econômica** para guardar esses exames. Qual classe de armazenamento atende?',
      concepts: [{ id: 'exam.decisive' }, { id: 'exam.constraints' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'S3 Standard-IA, para dados de acesso pouco frequente.', correct: false, consequence: 'Funciona, mas custa mais por GB que a Glacier Instant Retrieval para esse acesso.' },
        { id: 'b', text: 'S3 Glacier Flexible Retrieval, com restauração padrão.', correct: false, consequence: 'A restauração leva horas, e a leitura precisa ser em milissegundos.' },
        { id: 'c', text: 'S3 Standard, para manter a leitura rápida sempre.', correct: false, consequence: 'Funciona, mas paga o preço de dados acessados com frequência.' },
        { id: 'd', text: 'S3 Glacier Instant Retrieval, com leitura imediata.', correct: true, consequence: 'Leitura em milissegundos e o menor custo para acesso trimestral.' },
      ],
      explanation: [
        'Primeiro, a **restrição**: a leitura precisa ser **em milissegundos**, o que elimina a Glacier Flexible Retrieval. Entre as que sobram, o **requisito decisivo** é o **menor custo**: para dados abertos cerca de uma vez por trimestre, a **Glacier Instant Retrieval** custa menos por GB que a Standard-IA e a Standard, com a mesma leitura imediata.',
        'Standard e Standard-IA funcionam, mas pagam mais. Esse é o padrão do exame: várias alternativas funcionam, e o requisito destacado escolhe uma.',
        '**Regra prática:** elimine o que quebra a restrição; entre o que sobra, compare só no requisito decisivo.',
      ],
    },
    {
      id: 'rv:arq.f09.m2.a2:p1',
      kind: 'decision',
      title: 'Contêineres sem cuidar de máquinas',
      prompt:
        'Uma empresa vai rodar uma aplicação em **contêineres**, com picos durante o dia. Todas as alternativas abaixo executam os contêineres e escalam. A empresa quer a solução com o **MENOR esforço operacional**. Qual escolher?',
      concepts: [{ id: 'exam.decisive' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Amazon ECS em instâncias EC2 de um grupo do Auto Scaling.', correct: false, consequence: 'Funciona, mas o time cuida das instâncias, das correções e da capacidade.' },
        { id: 'b', text: 'Amazon EKS com nós EC2 gerenciados pelo time.', correct: false, consequence: 'Funciona, mas soma o Kubernetes e os nós à operação.' },
        { id: 'c', text: 'Amazon ECS com o AWS Fargate.', correct: true, consequence: 'Não há servidores para gerenciar: o Fargate cuida da capacidade.' },
        { id: 'd', text: 'Docker instalado à mão em instâncias EC2 com scripts.', correct: false, consequence: 'É a opção com mais trabalho de operação.' },
      ],
      explanation: [
        'Quando o enunciado diz que **todas funcionam**, a resposta vem do **requisito decisivo**. "Menor esforço operacional" aponta para **serviço gerenciado ou serverless**: o **ECS com Fargate** executa os contêineres sem instâncias para corrigir, escalar ou dimensionar.',
        'ECS e EKS em EC2 e Docker à mão funcionam, mas exigem cuidar de servidores. Menor custo, maior disponibilidade e menor latência apontariam para outras direções.',
        '**Regra prática:** menos esforço, gerenciado ou serverless; menor custo, o que atende sem sobra; maior disponibilidade, várias AZs; menor latência, borda e dados perto do usuário.',
      ],
    },
    {
      id: 'rv:arq.f09.m2.a1:i3',
      kind: 'decision',
      title: 'Os dados não podem sair daqui',
      prompt:
        'Um banco de dados de uma operadora de saúde roda num RDS em **sa-east-1**. Por regulação, **os dados não podem sair da Região**. O sistema precisa **continuar funcionando se uma AZ falhar**, e a empresa quer o **menor custo** que cumpra tudo. Qual solução atende?',
      concepts: [{ id: 'exam.constraints' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'RDS Multi-AZ, com os backups automáticos na própria Região.', correct: true, consequence: 'Aguenta a falha de uma AZ, e nenhum dado sai de sa-east-1.' },
        { id: 'b', text: 'Uma réplica de leitura do RDS em us-east-1, promovida na falha.', correct: false, consequence: 'Leva os dados para outra Região, o que a regulação proíbe.' },
        { id: 'c', text: 'Aurora Global Database com uma Região secundária.', correct: false, consequence: 'Replica os dados para outra Região, quebrando a restrição.' },
        { id: 'd', text: 'RDS Single-AZ com snapshots diários copiados entre Regiões.', correct: false, consequence: 'Não aguenta a falha da AZ e ainda tira os dados da Região.' },
      ],
      explanation: [
        'O enunciado tem duas **restrições** que toda resposta precisa cumprir: os dados **não saem da Região** e o sistema **aguenta a falha de uma AZ**. Só depois entra o requisito decisivo, o **menor custo**. O **RDS Multi-AZ**, com os backups na própria Região, cumpre as duas restrições.',
        'Réplica em outra Região, Aurora Global e cópias entre Regiões quebram a regulação, por melhores que sejam para desastres. Single-AZ não aguenta a falha de uma AZ.',
        '**Regra prática:** uma alternativa que quebra uma restrição está errada, por melhor que seja no resto; procure as restrições no meio do texto.',
      ],
    },
    {
      id: 'rv:arq.f09.m2.a1:i1',
      kind: 'decision',
      title: 'Anexos que precisam aparecer em todas',
      prompt:
        'Uma aplicação Linux grava os anexos dos clientes numa **pasta local** do servidor. Ela vai passar a rodar em **quatro instâncias** atrás de um balanceador, e todas precisam ver os mesmos anexos. A restrição é **não alterar o código da aplicação**. Qual solução atende?',
      concepts: [{ id: 'exam.constraints' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Gravar os anexos no S3 pelo SDK, em vez da pasta local.', correct: false, consequence: 'Exige mudar o código para usar a API do S3.' },
        { id: 'b', text: 'Montar um EFS nas instâncias, no caminho da pasta.', correct: true, consequence: 'A aplicação continua gravando na mesma pasta, agora compartilhada.' },
        { id: 'c', text: 'Um volume EBS gp3 maior em cada instância.', correct: false, consequence: 'Cada instância continua com os próprios anexos, sem compartilhar.' },
        { id: 'd', text: 'Guardar os anexos numa tabela do DynamoDB.', correct: false, consequence: 'Exige reescrever o acesso aos anexos, contra a restrição.' },
      ],
      explanation: [
        '"**Sem alterar o código**" é uma restrição: elimina tudo o que muda a forma como a aplicação grava. Um **EFS** montado no **mesmo caminho** da pasta local, nas quatro instâncias, faz a aplicação continuar gravando como antes, agora num sistema de arquivos compartilhado.',
        'S3 pelo SDK e DynamoDB exigem mudar o código. EBS por instância não compartilha os arquivos.',
        '**Regra prática:** com "sem alterar o código", procure a solução que a aplicação usa do jeito que já usa: pasta, endereço ou protocolo iguais.',
      ],
    },
    {
      id: 'rv:arq.f09.mais-servicos',
      kind: 'decision',
      title: 'A resposta com mais serviços',
      prompt:
        'Uma escola quer publicar um **site estático** de divulgação, com poucas visitas por dia, e quer a solução **mais econômica** e com **pouco esforço**. Um colega escolheu a alternativa com mais serviços "por parecer mais completa". Qual alternativa atende ao requisito?',
      concepts: [{ id: 'exam.eliminate' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'EC2 em Auto Scaling em três AZs, com ALB e RDS Multi-AZ.', correct: false, consequence: 'Funciona, mas paga servidores e banco para um site estático.' },
        { id: 'b', text: 'Contêineres no EKS, com CloudFront e Aurora.', correct: false, consequence: 'Complexo e caro para páginas que não mudam.' },
        { id: 'c', text: 'Um bucket S3 com o CloudFront na frente.', correct: true, consequence: 'Entrega as páginas sem servidores, pagando pelo uso.' },
        { id: 'd', text: 'Duas instâncias EC2 grandes em Regiões diferentes.', correct: false, consequence: 'Paga duas máquinas ligadas o tempo todo para poucas visitas.' },
      ],
      explanation: [
        'Elimine primeiro o que não atende ao requisito decisivo: aqui, **menor custo e pouco esforço** para conteúdo **estático**. Um **bucket S3** com o **CloudFront** entrega as páginas sem servidores, pagando pelo uso.',
        'As alternativas com servidores, bancos e várias Regiões funcionam, mas pagam e operam muito mais do que o site precisa. Mais serviços não significa resposta melhor.',
        '**Regra prática:** desconfie da alternativa mais completa; a certa atende ao requisito sem sobra.',
      ],
    },
    {
      id: 'rv:arq.f09.m3.a2',
      kind: 'decision',
      title: 'Os pedidos que se perdem no pico',
      prompt:
        'Uma aplicação grava pedidos direto num banco RDS que fica **sobrecarregado nos picos**, e parte dos pedidos **se perde**. A confirmação pode chegar por e-mail alguns minutos depois. A empresa quer **não perder nenhum pedido** e aliviar o banco, com o **menor esforço**. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'exam.multiple-response' }, { id: 'exam.eliminate' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Enviar cada pedido para uma fila do Amazon SQS.', correct: true, consequence: 'Nenhum pedido se perde no pico: ele espera na fila.' },
        { id: 'b', text: 'Criar uma réplica de leitura do RDS.', correct: false, consequence: 'Alivia leituras; os pedidos são gravações.' },
        { id: 'c', text: 'Consumidores que gravam a partir da fila no ritmo do banco.', correct: true, consequence: 'O banco deixa de receber o pico de uma vez.' },
        { id: 'd', text: 'Ligar o Multi-AZ do RDS.', correct: false, consequence: 'Melhora a disponibilidade, não a carga de gravação.' },
        { id: 'e', text: 'Instalar o banco em EC2, administrado pelo time.', correct: false, consequence: 'Aumenta o esforço de operação e não resolve o pico de gravações.' },
      ],
      explanation: [
        'Na resposta múltipla, **cada certa costuma ser uma parte da solução**: a **fila do SQS** guarda os pedidos no pico, e os **consumidores** gravam no ritmo que o banco aguenta. As duas juntas atendem ao requisito.',
        'Avalie cada alternativa sozinha: réplica de leitura e Multi-AZ resolvem outra coisa, e o banco em EC2 aumenta o esforço.',
        '**Regra prática:** em "escolha duas", procure as duas partes que se completam; duas alternativas que fazem a mesma coisa raramente são o par certo.',
      ],
    },
    {
      id: 'rv:arq.f09.m1.a2:i4',
      kind: 'decision',
      title: 'Duas partes de um requisito',
      prompt:
        'Um bucket S3 de contratos precisa ter os objetos **criptografados em repouso com uma chave gerenciada pelo cliente**, com o **uso da chave auditável**, e **recusar qualquer acesso sem TLS**. Quais configurações atendem juntas? (Escolha DUAS.)',
      concepts: [{ id: 'exam.multiple-response' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'SSE-KMS com uma chave gerenciada pelo cliente.', correct: true, consequence: 'Cifra em repouso com a chave da empresa, e cada uso fica no CloudTrail.' },
        { id: 'b', text: 'Criptografia padrão do bucket com SSE-S3.', correct: false, consequence: 'Cifra em repouso, mas com chave da AWS, sem a chave do cliente.' },
        { id: 'c', text: 'Política do bucket negando aws:SecureTransport igual a false.', correct: true, consequence: 'Toda requisição feita sem TLS passa a ser recusada pelo bucket.' },
        { id: 'd', text: 'Ligar o versionamento do bucket.', correct: false, consequence: 'Guarda versões, mas não cifra nem exige TLS.' },
        { id: 'e', text: 'Ligar o Block Public Access do bucket.', correct: false, consequence: 'Bloqueia o acesso público, mas não exige TLS nem a chave do cliente.' },
      ],
      explanation: [
        'O requisito tem **duas partes**: dados em repouso com **chave do cliente auditável** e acesso **só com TLS**. A **SSE-KMS** com uma chave gerenciada pelo cliente cobre a primeira, com o uso registrado no CloudTrail; a **política do bucket** que nega `aws:SecureTransport` igual a false cobre a segunda.',
        'A SSE-S3 também cifra em repouso, mas com chave da AWS: escolher SSE-S3 e SSE-KMS juntas seria marcar **duas alternativas que fazem a mesma coisa**. Versionamento e Block Public Access protegem outros riscos.',
        '**Regra prática:** em resposta múltipla, avalie cada alternativa sozinha e confira se o par cobre todas as partes do requisito.',
      ],
    },
  ],
}
