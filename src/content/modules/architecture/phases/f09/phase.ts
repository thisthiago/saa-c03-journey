/** Fase 9 — Como o exame pergunta (enunciados próprios do AWS Quest, nunca questões reais). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ExamReaderLabConfig } from '../../../../../simulators/examreader/lab'
import { META } from '../meta'

export const LEITURA_LEGADO: ExamReaderLabConfig = {
  stem: [
    'Uma empresa roda uma aplicação web numa única instância EC2, com o MySQL instalado na mesma instância. O código da aplicação não pode ser alterado; só a configuração de conexão com o banco pode mudar.',
    'A empresa precisa que a aplicação continue disponível se uma Zona de Disponibilidade falhar.',
  ],
  question: 'Qual solução atende a esses requisitos com o MENOR esforço operacional?',
  constraints: [
    { id: 'az', label: 'continuar disponível se uma AZ falhar' },
    { id: 'code', label: 'não alterar o código da aplicação' },
  ],
  decisive: { id: 'ops', label: 'menor esforço operacional' },
  alternatives: [
    { id: 'A', text: 'Migrar o banco para o Amazon RDS for MySQL Multi-AZ e pôr a aplicação num grupo do Auto Scaling em duas AZs, atrás de um ALB.', meets: ['az', 'code'], rank: 1 },
    { id: 'B', text: 'Reescrever a aplicação em funções Lambda com o Amazon DynamoDB.', meets: ['az'], rank: 1 },
    { id: 'C', text: 'Agendar snapshots do EBS a cada hora e recriar a instância em outra AZ quando houver falha.', meets: ['code'], rank: 1 },
    { id: 'D', text: 'Instalar o MySQL em instâncias EC2 em duas AZs, com replicação configurada pela equipe, e pôr a aplicação num grupo do Auto Scaling atrás de um ALB.', meets: ['az', 'code'], rank: 2 },
  ],
  concepts: ['exam.eliminate', 'exam.constraints'],
}

export const LEITURA_IMAGENS: ExamReaderLabConfig = {
  stem: [
    'Uma clínica guarda 500 TB de imagens de exames na classe S3 Standard. As imagens são abertas com frequência nos primeiros 30 dias; depois, raramente, mas, quando são, precisam abrir em milissegundos.',
    'A regulação exige guardar cada imagem por 10 anos.',
  ],
  question: 'Qual solução atende a esses requisitos com o MENOR custo?',
  constraints: [
    { id: 'ms', label: 'abrir em milissegundos depois de 30 dias' },
    { id: 'keep', label: 'guardar por 10 anos' },
  ],
  decisive: { id: 'cost', label: 'menor custo' },
  alternatives: [
    { id: 'A', text: 'Uma regra de ciclo de vida que move as imagens para a S3 Glacier Instant Retrieval depois de 30 dias e as expira depois de 10 anos.', meets: ['ms', 'keep'], rank: 1 },
    { id: 'B', text: 'Uma regra de ciclo de vida que move as imagens para a S3 Glacier Deep Archive depois de 30 dias.', meets: ['keep'], rank: 1 },
    { id: 'C', text: 'Manter tudo na S3 Standard, com expiração depois de 10 anos.', meets: ['ms', 'keep'], rank: 3 },
    { id: 'D', text: 'Uma regra de ciclo de vida que move as imagens para a S3 Standard-IA depois de 30 dias e as expira depois de 10 anos.', meets: ['ms', 'keep'], rank: 2 },
  ],
  concepts: ['exam.decisive', 'exam.eliminate'],
}

export const LEITURA_REDE: ExamReaderLabConfig = {
  stem: [
    'Instâncias EC2 em sub-redes privadas precisam ler e gravar objetos num bucket S3 da mesma Região. A política de segurança proíbe qualquer rota das instâncias para um internet gateway ou um NAT gateway.',
  ],
  question: 'Qual solução atende a esses requisitos de forma MAIS econômica?',
  constraints: [{ id: 'private', label: 'nenhuma rota para internet gateway ou NAT gateway' }],
  decisive: { id: 'cost', label: 'menor custo' },
  alternatives: [
    { id: 'A', text: 'Um NAT gateway numa sub-rede pública, com rota das sub-redes privadas para ele.', meets: [], rank: 1 },
    { id: 'B', text: 'Um endpoint de gateway do S3, com a rota nas tabelas das sub-redes privadas.', meets: ['private'], rank: 1 },
    { id: 'C', text: 'Um endpoint de interface do S3 em cada AZ.', meets: ['private'], rank: 2 },
    { id: 'D', text: 'Mover as instâncias para sub-redes públicas, com IPs públicos.', meets: [], rank: 1 },
  ],
  concepts: ['exam.decisive', 'exam.constraints'],
}

export const F09_ARQ: PhaseDef = {
  ...META.f09,
  concepts: ['exam.format', 'exam.decisive', 'exam.constraints', 'exam.eliminate', 'exam.multiple-response', 'res.legacy-reliability', 'sc.glacier-ir', 'pl.gateway-endpoint'],
  availability: 'available',
  simplifications: ['Todos os enunciados são do AWS Quest; nenhum é questão real do exame.', 'O formato, a pontuação e os pesos vêm do guia do exame, conferido em 22/10/2026.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'arq.f09.m1',
      title: 'O exame por dentro',
      type: 'mission',
      summary: 'Formato das questões, pontuação e pesos dos domínios.',
      briefing: {
        company: 'Grupo de estudos AWS Quest',
        role: 'Você ajuda colegas a se prepararem para o SAA-C03.',
        situation: 'Um colega deixa em branco as questões em que tem dúvida, "para não perder ponto". Outra acha que precisa passar em cada domínio separadamente.',
        objective: 'Entender como o exame é montado e pontuado.',
        successCriteria: ['Conhecer os dois tipos de questão', 'Saber como a nota é calculada'],
      },
      intel: [{ conceptId: 'exam.format' }],
      activities: [
        {
          id: 'arq.f09.m1.a1',
          kind: 'decision',
          title: 'Deixar em branco?',
          prompt: 'O colega deixa em branco as questões em que tem dúvida, para não perder ponto. O que dizer?',
          concepts: [{ id: 'exam.format' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Questão em branco conta como errada, e não há penalidade por chutar. Responder sempre só pode ajudar.'],
          options: [
            { id: 'a', text: 'Responder todas: em branco conta como errada, e chutar não tira ponto', correct: true, consequence: 'Cada chute tem chance de acerto e nenhum custo.' },
            { id: 'b', text: 'Está certo: errar tira ponto', correct: false, consequence: 'O exame não tem penalidade por chute.' },
            { id: 'c', text: 'Deixar em branco só as de resposta múltipla', correct: false, consequence: 'Em branco também conta como errada nessas.' },
          ],
        },
        {
          id: 'arq.f09.m1.a2',
          kind: 'classify',
          title: 'Verdade ou mito sobre o exame',
          prompt: 'Classifique cada frase sobre o SAA-C03.',
          concepts: [{ id: 'exam.format' }],
          xp: 50,
          difficulty: 2,
          explanation: ['São 50 questões que contam e 15 que não contam, sem identificação; nota mínima de 720 numa escala de 100 a 1.000; modelo compensatório; resposta múltipla com duas ou mais certas entre cinco ou mais.'],
          bins: [
            { id: 'true', label: 'Verdade' },
            { id: 'myth', label: 'Mito' },
          ],
          items: [
            { id: 'i1', text: 'Algumas questões não contam para a nota, e não dá para saber quais', bin: 'true', explanation: 'São 15 questões sem pontuação, sem identificação.', concepts: ['exam.format'] },
            { id: 'i2', text: 'É preciso passar em cada domínio separadamente', bin: 'myth', explanation: 'O modelo é compensatório: conta o exame inteiro.', concepts: ['exam.format'] },
            { id: 'i3', text: 'A nota mínima é 720, numa escala de 100 a 1.000', bin: 'true', explanation: 'É a nota de corte do guia.', concepts: ['exam.format'] },
            { id: 'i4', text: 'Questão de resposta múltipla tem sempre exatamente duas certas', bin: 'myth', explanation: 'Tem duas ou mais certas, entre cinco ou mais alternativas.', concepts: ['exam.multiple-response'] },
            { id: 'i5', text: 'O domínio de segurança é o que mais pesa', bin: 'true', explanation: 'Seguro pesa 30%; resiliente, 26%; desempenho, 24%; custo, 20%.', concepts: ['exam.format'] },
          ],
        },
      ],
      debrief: { takeaways: ['50 questões contam e 15 não; em branco é erro, chute não penaliza.', 'Modelo compensatório; segurança é o domínio que mais pesa.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'arq.f09.m2',
      title: 'O que decide',
      type: 'mission',
      summary: 'Separar as restrições do requisito decisivo.',
      briefing: {
        company: 'Grupo de estudos AWS Quest',
        role: 'Você mostra como ler o enunciado antes das alternativas.',
        situation: 'Os colegas acertam o serviço, mas erram a questão: escolhem uma alternativa que funciona, mas não é a melhor no que o enunciado pede.',
        objective: 'Achar as restrições e o requisito que decide em cada enunciado.',
        successCriteria: ['Separar restrição de requisito decisivo', 'Saber para onde cada requisito costuma apontar'],
      },
      intel: [{ conceptId: 'exam.decisive' }, { conceptId: 'exam.constraints' }],
      activities: [
        {
          id: 'arq.f09.m2.a1',
          kind: 'classify',
          title: 'Restrição ou requisito decisivo?',
          prompt: 'Classifique cada trecho de enunciado.',
          concepts: [{ id: 'exam.constraints' }, { id: 'exam.decisive' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A restrição elimina quem não cumpre; o requisito decisivo escolhe entre as que cumprem.'],
          bins: [
            { id: 'c', label: 'Restrição: toda resposta precisa cumprir' },
            { id: 'd', label: 'Requisito decisivo: escolhe entre as que funcionam' },
          ],
          items: [
            { id: 'i1', text: '"…sem alterar o código da aplicação"', bin: 'c', explanation: 'Quem reescreve a aplicação está eliminado.', concepts: ['exam.constraints'] },
            { id: 'i2', text: '"…com o MENOR esforço operacional?"', bin: 'd', explanation: 'Compara as que funcionam pelo trabalho de operar.', concepts: ['exam.decisive'] },
            { id: 'i3', text: '"…os dados não podem sair da Região"', bin: 'c', explanation: 'Elimina cópias e serviços em outra Região.', concepts: ['exam.constraints'] },
            { id: 'i4', text: '"Qual é a solução MAIS econômica?"', bin: 'd', explanation: 'Compara as que funcionam pelo custo.', concepts: ['exam.decisive'] },
            { id: 'i5', text: '"…precisa continuar funcionando se uma AZ falhar"', bin: 'c', explanation: 'Elimina o que fica numa AZ só.', concepts: ['exam.constraints'] },
          ],
        },
        {
          id: 'arq.f09.m2.a2',
          kind: 'match',
          title: 'Para onde cada requisito aponta',
          prompt: 'Ligue cada requisito decisivo à direção que a resposta costuma tomar.',
          concepts: [{ id: 'exam.decisive' }],
          xp: 50,
          difficulty: 2,
          explanation: ['São tendências, não regras: confira sempre as restrições.'],
          leftLabel: 'Requisito',
          rightLabel: 'Direção',
          pairs: [
            { id: 'p1', left: 'Menos esforço operacional', right: 'Serviço gerenciado ou serverless', explanation: 'Menos coisas para a equipe manter.', concepts: ['exam.decisive'] },
            { id: 'p2', left: 'Menor custo', right: 'A opção que atende sem sobra, pagando pelo uso', explanation: 'Nada além do que o requisito pede.', concepts: ['exam.decisive'] },
            { id: 'p3', left: 'Maior disponibilidade', right: 'Várias AZs e nenhum ponto único de falha', explanation: 'Redundância em toda a cadeia.', concepts: ['exam.decisive'] },
            { id: 'p4', left: 'Menor latência para usuários no mundo todo', right: 'Borda da AWS e dados perto dos usuários', explanation: 'CloudFront, Global Accelerator, réplicas regionais.', concepts: ['exam.decisive'] },
          ],
        },
      ],
      debrief: { takeaways: ['Restrições eliminam; o requisito decisivo escolhe.', 'Leia o enunciado antes das alternativas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'arq.f09.m3',
      title: 'Eliminar até sobrar uma',
      type: 'mission',
      summary: 'Eliminar alternativas e responder questões de resposta múltipla.',
      briefing: {
        company: 'Grupo de estudos AWS Quest',
        role: 'Você resolve enunciados com o grupo, em voz alta.',
        situation: 'O grupo quer treinar o método: restrições primeiro, depois o requisito decisivo, depois as questões de "escolha duas".',
        objective: 'Aplicar a eliminação a um enunciado inteiro e a uma resposta múltipla.',
        successCriteria: ['Cada alternativa com veredito e motivo', 'As duas partes de uma resposta múltipla'],
      },
      intel: [{ conceptId: 'exam.eliminate' }, { conceptId: 'exam.multiple-response' }],
      activities: [
        {
          id: 'arq.f09.m3.a1',
          kind: 'lab',
          lab: 'exam-reader',
          title: 'O legado numa instância só',
          prompt: 'Dê o veredito e o motivo de cada alternativa.',
          concepts: [{ id: 'exam.eliminate' }, { id: 'exam.constraints' }, { id: 'res.legacy-reliability', weight: 0.5 }],
          xp: 120,
          difficulty: 2,
          hints: ['Reescrever em Lambda quebra uma restrição; snapshots de hora em hora quebram a outra.'],
          explanation: ['B altera o código; C não continua disponível durante a falha. A e D funcionam, mas A usa serviços gerenciados e vence em esforço operacional.'],
          config: LEITURA_LEGADO,
        },
        {
          id: 'arq.f09.m3.a2',
          kind: 'decision',
          title: 'Escolha duas',
          prompt: 'Uma aplicação grava pedidos num banco RDS que fica sobrecarregado nos picos, e os pedidos se perdem. A empresa quer não perder nenhum pedido e aliviar o banco com o menor esforço. Quais **duas** ações tomar?',
          concepts: [{ id: 'exam.multiple-response' }, { id: 'exam.eliminate', weight: 0.5 }],
          xp: 60,
          difficulty: 3,
          multiple: true,
          explanation: ['Cada certa é uma parte da solução: a fila guarda os pedidos no pico, e os consumidores gravam no ritmo do banco. As outras resolvem outra coisa ou dão mais trabalho.'],
          options: [
            { id: 'a', text: 'Enviar cada pedido para uma fila do Amazon SQS', correct: true, consequence: 'Nenhum pedido se perde no pico.' },
            { id: 'b', text: 'Gravar no banco a partir de consumidores que leem a fila no ritmo que o banco aguenta', correct: true, consequence: 'O banco deixa de receber o pico de uma vez.' },
            { id: 'c', text: 'Criar uma réplica de leitura', correct: false, consequence: 'Alivia leituras; os pedidos são gravações.' },
            { id: 'd', text: 'Migrar o banco para instâncias EC2 com o banco instalado pela equipe', correct: false, consequence: 'Aumenta o esforço e não resolve o pico.' },
            { id: 'e', text: 'Ligar o Multi-AZ do RDS', correct: false, consequence: 'Melhora a disponibilidade, não a carga de gravação.' },
          ],
        },
      ],
      debrief: { takeaways: ['Elimine quem não funciona e quem quebra restrição; compare o resto no requisito decisivo.', 'Na resposta múltipla, cada certa é uma parte da solução.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'arq.f09.boss',
      title: 'O simulado comentado',
      type: 'boss',
      summary: 'Dois enunciados inteiros, alternativa por alternativa.',
      briefing: {
        company: 'Grupo de estudos AWS Quest',
        role: 'Você corrige o simulado do grupo e explica cada alternativa.',
        situation: 'Dois enunciados derrubaram quase todo mundo: um de custo de armazenamento e outro de rede privada.',
        objective: 'Dar veredito e motivo para cada alternativa dos dois enunciados.',
        successCriteria: ['Eliminar quem quebra restrição', 'Escolher pelo requisito decisivo'],
      },
      intel: [{ conceptId: 'exam.eliminate', body: ['Restrições primeiro. Depois, entre as que sobram, só o **requisito decisivo** importa.'] }],
      activities: [
        {
          id: 'arq.f09.boss.a1',
          kind: 'lab',
          lab: 'exam-reader',
          title: 'As imagens dos exames',
          prompt: 'Dê o veredito e o motivo de cada alternativa.',
          concepts: [{ id: 'exam.decisive' }, { id: 'exam.eliminate' }, { id: 'sc.glacier-ir', weight: 0.5 }],
          xp: 150,
          difficulty: 3,
          hints: ['Glacier Deep Archive leva horas para abrir um objeto.', 'Entre as que abrem em milissegundos, compare o preço por GB.'],
          explanation: ['B não abre em milissegundos. A, C e D cumprem as restrições; a Glacier Instant Retrieval é a mais barata das três.'],
          config: LEITURA_IMAGENS,
        },
        {
          id: 'arq.f09.boss.a2',
          kind: 'lab',
          lab: 'exam-reader',
          title: 'O bucket sem rota para fora',
          prompt: 'Dê o veredito e o motivo de cada alternativa.',
          concepts: [{ id: 'exam.decisive' }, { id: 'exam.constraints' }, { id: 'pl.gateway-endpoint', weight: 0.5 }],
          xp: 150,
          difficulty: 3,
          hints: ['NAT gateway e sub-rede pública dependem de rotas que a política proíbe.'],
          explanation: ['A e D dependem de rotas para NAT gateway ou internet gateway. B e C chegam ao S3 por endpoints da VPC; o endpoint de gateway não tem custo, e o de interface cobra por hora e por GB.'],
          config: LEITURA_REDE,
        },
      ],
      debrief: { takeaways: ['A alternativa certa cumpre todas as restrições e vence no requisito decisivo.', 'As erradas mais perigosas funcionam, mas perdem no que o enunciado pede.'] },
    },
  ],
}
