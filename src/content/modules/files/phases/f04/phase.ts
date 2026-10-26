/**
 * Fase 4 — FSx for Lustre. Alto desempenho, ligação com o S3 e a escolha
 * entre scratch e persistente.
 */
import type { PhaseDef } from '../../../../../engine/types'
import { META } from '../meta'

export const F04_FIL: PhaseDef = {
  ...META.f04,
  concepts: ['lustre.what', 'lustre.s3-link', 'lustre.deployment'],
  availability: 'available',
  simplifications: ['O laboratório de pesquisa, os volumes e os prazos são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fil.f04.m1',
      title: 'O treinamento que esperava o download',
      type: 'mission',
      summary: 'Quando usar Lustre e como ligá-lo ao S3.',
      briefing: {
        company: 'Laboratório Genoma Sul',
        role: 'Você cuida da plataforma de pesquisa de um laboratório de genômica.',
        situation: 'As sequências ficam num bucket S3 de 200 TB. Antes de cada análise, 300 servidores copiam os dados do bucket para os próprios discos, e metade do tempo do trabalho é gasto nessa cópia.',
        objective: 'Dar aos servidores acesso rápido aos dados do bucket, sem a cópia.',
        successCriteria: ['Escolher o sistema de arquivos', 'Ligar o sistema de arquivos ao bucket'],
      },
      intel: [
        { conceptId: 'lustre.what', body: ['O **FSx for Lustre** é um sistema de arquivos paralelo para **HPC, aprendizado de máquina e vídeo**: latência abaixo de 1 ms, até vários TB/s e milhões de IOPS, para clientes Linux.'] },
        { conceptId: 'lustre.s3-link', body: ['Uma **associação com repositório de dados** faz os objetos de um bucket aparecerem como arquivos, carregados na primeira leitura, e pode **exportar** os resultados de volta ao S3.'] },
      ],
      activities: [
        {
          id: 'fil.f04.m1.a1',
          kind: 'decision',
          title: 'Os 300 servidores',
          prompt: 'Os 300 servidores Linux precisam ler em paralelo os dados do bucket com a maior vazão possível, e os resultados têm de voltar ao S3. O que usar?',
          concepts: [{ id: 'lustre.what' }, { id: 'lustre.s3-link' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O FSx for Lustre ligado ao bucket apresenta os objetos como arquivos, entrega a vazão de que o HPC precisa e exporta os resultados ao S3.'],
          options: [
            { id: 'a', text: 'FSx for Lustre com associação ao bucket S3, importando e exportando os dados', correct: true, consequence: 'A análise começa sem a cópia, e os resultados voltam ao bucket.' },
            { id: 'b', text: 'Amazon EFS, copiando o bucket para ele antes de cada análise', correct: false, consequence: 'A cópia continua, e o EFS não foi feito para essa vazão em paralelo.' },
            { id: 'c', text: 'Um volume EBS maior em cada servidor', correct: false, consequence: 'Os 300 servidores continuam copiando 200 TB cada vez.' },
          ],
        },
        {
          id: 'fil.f04.m1.a2',
          kind: 'classify',
          title: 'Lustre ou EFS',
          prompt: 'Indique o sistema de arquivos que combina com cada carga do laboratório.',
          concepts: [{ id: 'lustre.what' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Lustre para muitos servidores processando grandes volumes em paralelo; EFS para arquivos compartilhados de uso geral.'],
          bins: [
            { id: 'lustre', label: 'FSx for Lustre' },
            { id: 'efs', label: 'Amazon EFS' },
          ],
          items: [
            { id: 'genoma', text: 'Alinhamento de sequências em 300 servidores ao mesmo tempo', bin: 'lustre', explanation: 'HPC com leitura paralela em grande volume.', concepts: ['lustre.what'] },
            { id: 'ml', text: 'Treinamento de um modelo de aprendizado de máquina com 50 TB de imagens', bin: 'lustre', explanation: 'O Lustre acelera o treinamento lendo direto do S3.', concepts: ['lustre.what'] },
            { id: 'home', text: 'Diretórios pessoais dos pesquisadores no servidor de login', bin: 'efs', explanation: 'Uso geral, elástico e compartilhado.', concepts: ['lustre.what'] },
            { id: 'wiki', text: 'Arquivos da wiki do laboratório', bin: 'efs', explanation: 'Poucos acessos, nada de alto desempenho.', concepts: ['lustre.what'] },
          ],
        },
      ],
      debrief: { takeaways: ['Lustre: HPC, ML e vídeo, com centenas de clientes em paralelo.', 'Ligado ao S3, os objetos aparecem como arquivos e os resultados voltam ao bucket.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f04.m2',
      title: 'Scratch ou persistente',
      type: 'mission',
      summary: 'O que se perde quando um servidor falha.',
      briefing: {
        company: 'Laboratório Genoma Sul',
        role: 'Você escolhe o tipo de implantação de cada sistema de arquivos.',
        situation: 'A análise semanal dura 6 horas e lê dados que estão no S3. Já o projeto de pesquisa clínica grava, durante meses, resultados intermediários que só existem no sistema de arquivos.',
        objective: 'Escolher entre scratch e persistente sabendo o que cada um perde numa falha.',
        successCriteria: ['Prever o efeito da falha de um servidor', 'Escolher a implantação de cada carga'],
      },
      intel: [{ conceptId: 'lustre.deployment', body: ['**Scratch**: temporário e barato; os dados **não são replicados**, e os arquivos de um servidor que falha se perdem. **Persistente**: dados **replicados na AZ** e servidor trocado em minutos. O Intelligent-Tiering é elástico e indicado para a maioria das cargas.'] }],
      activities: [
        {
          id: 'fil.f04.m2.a1',
          kind: 'predict',
          title: 'Falha no scratch',
          prompt: 'Num **FSx for Lustre** com implantação **scratch**, um dos servidores de arquivos falha no meio da análise. O que acontece com os arquivos guardados nele?',
          concepts: [{ id: 'lustre.deployment' }],
          xp: 40,
          difficulty: 1,
          explanation: ['No scratch, os dados não são replicados e o servidor não é trocado: quem lê esses arquivos recebe erro, e eles não voltam.'],
          spec: { sim: 'fsx-failure', deployment: 'lustre-scratch', event: 'server-failure' },
          options: [
            { id: 'a', text: 'Os arquivos daquele servidor se perdem', outcome: 'lost' },
            { id: 'b', text: 'Ficam fora até a AWS trocar o servidor, e depois voltam', outcome: 'recovers' },
            { id: 'c', text: 'Um servidor em espera assume em segundos', outcome: 'failover' },
          ],
        },
        {
          id: 'fil.f04.m2.a2',
          kind: 'predict',
          title: 'Falha no persistente',
          prompt: 'Num **FSx for Lustre** com implantação **persistente**, usado por um projeto de pesquisa por meses, um servidor de arquivos falha. O que acontece?',
          concepts: [{ id: 'lustre.deployment' }],
          xp: 40,
          difficulty: 1,
          explanation: ['No persistente, os dados ficam replicados na AZ, e o servidor é trocado em minutos; as requisições dos clientes repetem até dar certo.'],
          spec: { sim: 'fsx-failure', deployment: 'lustre-persistent', event: 'server-failure' },
          options: [
            { id: 'a', text: 'Ficam fora até a AWS trocar o servidor, e depois voltam', outcome: 'recovers' },
            { id: 'b', text: 'Os arquivos daquele servidor se perdem', outcome: 'lost' },
            { id: 'c', text: 'Um servidor em espera em outra AZ assume em segundos', outcome: 'failover' },
          ],
        },
        {
          id: 'fil.f04.m2.a3',
          kind: 'decision',
          title: 'A análise semanal',
          prompt: 'A análise semanal dura 6 horas, lê dados que estão no S3 e pode ser refeita se algo falhar. Os resultados são exportados ao S3 no fim. Qual implantação usar?',
          concepts: [{ id: 'lustre.deployment' }, { id: 'lustre.s3-link', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Trabalho curto, dados de origem no S3 e resultado exportado: o scratch é o mais barato e a perda de um servidor só obriga a refazer a análise.'],
          options: [
            { id: 'a', text: 'Scratch, criado para a análise e apagado depois da exportação', correct: true, consequence: 'Paga só as horas da análise, e nada se perde de vez.' },
            { id: 'b', text: 'Persistente ligado o ano inteiro', correct: false, consequence: 'Funciona, mas paga um sistema de arquivos parado seis dias e meio por semana.' },
            { id: 'c', text: 'Scratch, guardando os resultados nele por meses', correct: false, consequence: 'Uma falha de servidor apaga resultados que não estão em lugar nenhum.' },
          ],
        },
      ],
      debrief: { takeaways: ['Scratch: temporário, barato e sem replicação.', 'Persistente: replicado na AZ e servidor trocado em minutos.', 'Resultado que só existe no Lustre pede persistente ou exportação ao S3.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f04.boss',
      title: 'A semana do laboratório',
      type: 'boss',
      summary: 'Implantação certa para cada carga de alto desempenho.',
      briefing: {
        company: 'Laboratório Genoma Sul',
        role: 'Você apresenta o desenho de armazenamento de pesquisa.',
        situation: 'Cinco cargas disputam o orçamento. Algumas leem tudo do S3 e terminam em horas; outras guardam resultados por meses; outras nem precisam de alto desempenho.',
        objective: 'Escolher a implantação de cada carga e garantir que nenhum resultado se perca.',
        successCriteria: ['Cada carga com a implantação certa', 'Nenhum resultado guardado só num scratch'],
      },
      intel: [{ conceptId: 'lustre.deployment', body: ['Pergunte: os dados de origem estão no S3? O trabalho pode ser refeito? Quanto tempo o sistema de arquivos fica de pé?'] }],
      activities: [
        {
          id: 'fil.f04.boss.a1',
          kind: 'classify',
          title: 'Cinco cargas',
          prompt: 'Indique a implantação certa para cada carga.',
          concepts: [{ id: 'lustre.deployment' }, { id: 'lustre.what' }],
          xp: 120,
          difficulty: 3,
          explanation: ['Scratch para trabalhos curtos que podem ser refeitos a partir do S3; persistente para dados que ficam meses e só existem no sistema de arquivos; EFS quando não há necessidade de alto desempenho.'],
          bins: [
            { id: 'scratch', label: 'Lustre scratch' },
            { id: 'persistent', label: 'Lustre persistente' },
            { id: 'efs', label: 'Não é caso de Lustre (EFS)' },
          ],
          items: [
            { id: 'semanal', text: 'Análise semanal de 6 horas, com origem e resultados no S3', bin: 'scratch', explanation: 'Curto e refazível.', concepts: ['lustre.deployment'] },
            { id: 'clinico', text: 'Projeto clínico que grava resultados intermediários por seis meses', bin: 'persistent', explanation: 'Os dados só existem ali e ficam meses.', concepts: ['lustre.deployment'] },
            { id: 'treino', text: 'Treinamento de modelo de três dias, relendo 50 TB do S3, com checkpoints exportados ao bucket a cada hora', bin: 'scratch', explanation: 'Os checkpoints vão para o S3; uma falha só repete a última hora.', concepts: ['lustre.deployment', 'lustre.s3-link'] },
            { id: 'simulacao', text: 'Simulação contínua o ano inteiro, sensível a interrupções', bin: 'persistent', explanation: 'Carga longa e sensível a paradas.', concepts: ['lustre.deployment'] },
            { id: 'docs', text: 'Protocolos e manuais do laboratório, abertos algumas vezes por dia', bin: 'efs', explanation: 'Sem necessidade de alto desempenho.', concepts: ['lustre.what'] },
          ],
        },
        {
          id: 'fil.f04.boss.a2',
          kind: 'predict',
          title: 'A AZ do persistente',
          prompt: 'O sistema de arquivos persistente do projeto clínico usa a classe SSD. A AZ dele inteira fica fora. O que acontece?',
          concepts: [{ id: 'lustre.deployment' }],
          xp: 60,
          difficulty: 3,
          explanation: ['O persistente com SSD replica os dados dentro da mesma AZ: com a AZ fora, o sistema de arquivos fica fora até ela voltar.'],
          spec: { sim: 'fsx-failure', deployment: 'lustre-persistent', event: 'az-outage' },
          options: [
            { id: 'a', text: 'Fica fora enquanto a AZ estiver fora', outcome: 'down' },
            { id: 'b', text: 'Um servidor em espera em outra AZ assume', outcome: 'failover' },
            { id: 'c', text: 'Os arquivos se perdem', outcome: 'lost' },
          ],
        },
      ],
      debrief: { takeaways: ['Scratch para o que pode ser refeito a partir do S3.', 'Persistente para o que fica meses ou é sensível a paradas.', 'Persistente com SSD fica numa AZ só.'] },
    },
  ],
}
