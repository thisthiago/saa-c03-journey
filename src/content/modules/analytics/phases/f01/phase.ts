/**
 * Fase 1 — Data lake no S3. O que é um data lake, as camadas, os formatos em
 * linha e em coluna, a compressão, as partições e os arquivos pequenos.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { LakeLabConfig } from '../../../../../simulators/datalake/lab'
import type { LakeTable } from '../../../../../simulators/datalake/model'
import { META } from '../meta'

/** Eventos de rastreio da transportadora: 10 GB por dia em CSV, um ano guardado. */
export const ENTREGAS: LakeTable = {
  id: 'entregas',
  name: 'Eventos de entrega',
  description: 'Cada leitura de etiqueta gera um evento. O painel de atrasos consulta **a última semana** várias vezes por dia; o relatório do mês lê **os últimos 30 dias**.',
  csvGB: 3650,
  days: 365,
  stores: 40,
  unit: { one: 'centro', many: 'centros' },
  columns: [
    { id: 'data', label: 'data e hora', share: 0.1 },
    { id: 'pedido', label: 'pedido', share: 0.15 },
    { id: 'centro', label: 'centro de distribuição', share: 0.05 },
    { id: 'status', label: 'status', share: 0.1 },
    { id: 'endereco', label: 'endereço', share: 0.4 },
    { id: 'obs', label: 'observação do motorista', share: 0.2 },
  ],
  queries: [
    { id: 'atrasos', label: 'Atrasos da última semana por centro', perMonth: 600, columns: ['data', 'centro', 'status'], days: 7 },
    { id: 'mensal', label: 'Relatório mensal de entregas', perMonth: 4, columns: ['data', 'pedido', 'centro', 'status'], days: 30 },
  ],
  concepts: ['lake.columnar', 'lake.compression', 'lake.partitioning'],
}

const SENSORES: LakeTable = {
  id: 'sensores',
  name: 'Leituras dos sensores dos caminhões',
  description: 'O time de ciência de dados estuda **o ano inteiro** de uma vez, sempre com as mesmas três colunas, para prever falhas de motor.',
  csvGB: 200,
  days: 365,
  stores: 40,
  unit: { one: 'centro', many: 'centros' },
  columns: [
    { id: 'data', label: 'data e hora', share: 0.15 },
    { id: 'caminhao', label: 'caminhão', share: 0.1 },
    { id: 'temp', label: 'temperatura do motor', share: 0.1 },
    { id: 'gps', label: 'posição', share: 0.35 },
    { id: 'bruto', label: 'leitura completa', share: 0.3 },
  ],
  queries: [{ id: 'modelo', label: 'Base do modelo de falhas', perMonth: 20, columns: ['caminhao', 'temp', 'data'] }],
  concepts: ['lake.columnar', 'lake.small-files'],
}

const MOVIMENTACAO: LakeTable = {
  id: 'movimentacao',
  name: 'Movimentação nos centros',
  description: 'Cada volume que entra ou sai de um centro de distribuição gera um registro. Cada gerente consulta **só o próprio centro**, nos **últimos 30 dias**.',
  csvGB: 4000,
  days: 365,
  stores: 40,
  unit: { one: 'centro', many: 'centros' },
  columns: [
    { id: 'data', label: 'data e hora', share: 0.1 },
    { id: 'centro', label: 'centro de distribuição', share: 0.05 },
    { id: 'doca', label: 'doca', share: 0.05 },
    { id: 'volume', label: 'volume', share: 0.2 },
    { id: 'leitura', label: 'leitura completa da esteira', share: 0.6 },
  ],
  queries: [{ id: 'gerente', label: 'Movimentação do mês de um centro', perMonth: 1200, columns: ['data', 'centro', 'doca'], days: 30, oneStore: true }],
  concepts: ['lake.partitioning', 'lake.small-files'],
}

export const ROTA_SUL_LAKE: LakeLabConfig = { tables: [ENTREGAS, SENSORES, MOVIMENTACAO] }

export const F01_ANA: PhaseDef = {
  ...META.f01,
  concepts: ['lake.what', 'lake.layers', 'lc.rules', 'lake.columnar', 'lake.compression', 'lake.partitioning', 'lake.small-files'],
  availability: 'available',
  simplifications: [
    'As taxas de compressão e o tamanho do JSON em relação ao CSV são premissas do cenário; na prática, dependem dos dados.',
    'O custo considera o S3 Standard e o dado lido pelo Athena; requisições ao S3 ficam fora.',
    'Transportadora, tabelas e volumes são fictícios.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f01.m1',
      title: 'Um lugar para todos os dados',
      type: 'mission',
      summary: 'O que é um data lake, como ele se diferencia do data warehouse e as camadas no S3.',
      briefing: {
        company: 'Transportadora Rota Sul',
        role: 'Você foi contratado para organizar os dados de uma transportadora.',
        situation: 'Os eventos de entrega ficam no banco do sistema de rastreio, as leituras dos sensores dos caminhões em arquivos num servidor e as reclamações de clientes numa planilha. Cada área monta os próprios relatórios, e os números não batem.',
        objective: 'Decidir onde reunir os dados e como separar o que chega do que está pronto para uso.',
        successCriteria: ['Diferenciar data lake e data warehouse', 'Separar as camadas do data lake'],
      },
      intel: [
        { conceptId: 'lake.what', body: ['O **data lake** guarda todos os dados, estruturados ou não, **no formato original**, num lugar só. Na AWS, esse lugar é o **S3**. A estrutura das tabelas é definida na hora de ler, e cada ferramenta consulta os arquivos ali mesmo.'] },
        { conceptId: 'lake.layers', body: ['Use pelo menos três camadas, cada uma num bucket: a **bruta**, com os dados como chegaram; a **tratada**, com os dados validados e convertidos; e a **de consumo**, com os dados prontos para cada uso.'] },
      ],
      activities: [
        {
          id: 'ana.f01.m1.a1',
          kind: 'decision',
          title: 'Lago ou armazém',
          prompt: 'A diretoria quer guardar tudo, inclusive os textos das reclamações e as leituras brutas dos sensores, mesmo sem saber ainda que perguntas fará. Onde guardar?',
          concepts: [{ id: 'lake.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O data lake aceita dados de qualquer forma, sem definir a estrutura antes. O data warehouse exige o esquema na gravação e serve melhor a relatórios SQL sobre dados já limpos.'],
          options: [
            { id: 'a', text: 'Num data lake no S3, no formato em que os dados chegam', correct: true, consequence: 'Tudo fica guardado, e cada pergunta nova escolhe a ferramenta certa para ler.' },
            { id: 'b', text: 'Num data warehouse, definindo hoje as tabelas de todas as perguntas futuras', correct: false, consequence: 'O esquema precisa existir antes de gravar; o texto livre e as leituras brutas não cabem bem nele.' },
            { id: 'c', text: 'Cada área continua guardando do seu jeito', correct: false, consequence: 'Os números continuam sem bater.' },
          ],
        },
        {
          id: 'ana.f01.m1.a2',
          kind: 'classify',
          title: 'Em que camada fica',
          prompt: 'Classifique cada conjunto de dados pela camada do data lake.',
          concepts: [{ id: 'lake.layers' }],
          xp: 50,
          difficulty: 1,
          explanation: ['A camada bruta guarda o que chegou, sem mudanças. A tratada guarda os dados validados e convertidos. A de consumo guarda os dados agregados para um uso específico.'],
          bins: [
            { id: 'raw', label: 'Bruta' },
            { id: 'stage', label: 'Tratada' },
            { id: 'analytics', label: 'De consumo' },
          ],
          items: [
            { id: 'csv', text: 'O CSV exportado do rastreio, do jeito que chegou', bin: 'raw', explanation: 'É o dado original, guardado para poder reprocessar.', concepts: ['lake.layers'] },
            { id: 'json', text: 'O JSON enviado pelos sensores dos caminhões', bin: 'raw', explanation: 'Chegou assim e fica assim na camada bruta.', concepts: ['lake.layers'] },
            { id: 'parquet', text: 'Os eventos validados e convertidos para Parquet, por dia', bin: 'stage', explanation: 'Dado limpo e convertido, ainda no nível de cada evento.', concepts: ['lake.layers'] },
            { id: 'atrasos', text: 'O total de atrasos por centro e por semana, para o painel', bin: 'analytics', explanation: 'Dado agregado para um uso específico.', concepts: ['lake.layers'] },
          ],
        },
        {
          id: 'ana.f01.m1.a3',
          kind: 'decision',
          title: 'Apagar o original?',
          prompt: 'Depois que os eventos viram Parquet, alguém sugere apagar os CSV originais para economizar. O que fazer?',
          concepts: [{ id: 'lake.layers' }, { id: 'lc.rules', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A camada bruta existe para reprocessar quando a regra de transformação muda ou tem erro. Para economizar, a AWS sugere uma regra de ciclo de vida: depois de um ano, Standard-IA; depois, Glacier.'],
          options: [
            { id: 'a', text: 'Manter os originais na camada bruta e movê-los para classes mais baratas com uma regra de ciclo de vida', correct: true, consequence: 'O custo cai com o tempo, e o reprocessamento continua possível.' },
            { id: 'b', text: 'Apagar os CSV, porque o Parquet tem tudo', correct: false, consequence: 'Se a conversão tiver um erro, os dados originais se perdem.' },
            { id: 'c', text: 'Guardar os CSV no mesmo bucket e na mesma pasta do Parquet', correct: false, consequence: 'Misturar as camadas confunde as consultas e as permissões; a recomendação é um bucket por camada.' },
          ],
        },
      ],
      debrief: { takeaways: ['Data lake: tudo no S3, no formato original, com a estrutura definida na leitura.', 'Data warehouse: esquema antes, dados limpos, SQL rápido. As empresas costumam ter os dois.', 'Camadas bruta, tratada e de consumo, cada uma num bucket.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f01.m2',
      title: 'Ler menos para pagar menos',
      type: 'mission',
      summary: 'Formatos em linha e em coluna, e o efeito da compressão no que a consulta lê.',
      briefing: {
        company: 'Transportadora Rota Sul',
        role: 'Você decide o formato das tabelas do data lake.',
        situation: 'O painel de atrasos consulta os eventos de entrega 600 vezes por mês, sempre com três das seis colunas. Os eventos estão em CSV sem compressão, e a fatura do Athena cresce a cada semana.',
        objective: 'Entender por que o formato e a compressão mudam o que cada consulta lê.',
        successCriteria: ['Prever o efeito do formato colunar', 'Escolher uma compressão adequada'],
      },
      intel: [
        { conceptId: 'lake.columnar', body: ['CSV e JSON guardam um registro depois do outro: para ler uma coluna, a consulta lê tudo. **Parquet** e **ORC** guardam coluna por coluna: a consulta lê **só as colunas que usa**.'] },
        { conceptId: 'lake.compression', body: ['O Athena cobra os bytes lidos **antes de descomprimir**. No exemplo da AWS, 3 TB em texto custam US$ 15 por consulta; com GZIP 3:1, US$ 5; em formato colunar, lendo uma de quatro colunas, US$ 1,25.'] },
      ],
      activities: [
        {
          id: 'ana.f01.m2.a1',
          kind: 'predict',
          title: 'CSV ou Parquet',
          prompt: 'O painel de atrasos lê data, centro e status da última semana. Sem partição e sem compressão, qual formato faz essa consulta ler menos?',
          concepts: [{ id: 'lake.columnar' }],
          xp: 40,
          difficulty: 1,
          explanation: ['No CSV, a consulta lê o registro inteiro, inclusive endereço e observação. No Parquet, lê só as três colunas, cerca de 25% de cada registro.'],
          spec: { sim: 'datalake', table: ENTREGAS, query: 'atrasos', layouts: { csv: { format: 'csv', compression: 'none', partition: 'none' }, parquet: { format: 'parquet', compression: 'none', partition: 'none' } } },
          options: [
            { id: 'a', text: 'O Parquet', outcome: 'parquet' },
            { id: 'b', text: 'O CSV, que é mais simples', outcome: 'csv' },
            { id: 'c', text: 'Os dois leem o mesmo volume', outcome: 'same' },
          ],
        },
        {
          id: 'ana.f01.m2.a2',
          kind: 'predict',
          title: 'Comprimir o CSV',
          prompt: 'Sem mudar o formato, a equipe comprime o CSV com GZIP. A mesma consulta lê menos?',
          concepts: [{ id: 'lake.compression' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O Athena cobra os bytes lidos antes de descomprimir. Com GZIP 3:1, o arquivo fica três vezes menor, e a consulta lê três vezes menos, mesmo lendo o registro inteiro.'],
          spec: { sim: 'datalake', table: ENTREGAS, query: 'atrasos', layouts: { plain: { format: 'csv', compression: 'none', partition: 'none' }, gzip: { format: 'csv', compression: 'gzip', partition: 'none' } } },
          options: [
            { id: 'a', text: 'Sim: o CSV com GZIP lê menos', outcome: 'gzip' },
            { id: 'b', text: 'Não: o Athena descomprime e lê o mesmo volume', outcome: 'same' },
            { id: 'c', text: 'Não: o CSV sem compressão lê menos, porque não precisa descomprimir', outcome: 'plain' },
          ],
        },
        {
          id: 'ana.f01.m2.a3',
          kind: 'classify',
          title: 'Linha ou coluna',
          prompt: 'Classifique cada característica pelo tipo de formato.',
          concepts: [{ id: 'lake.columnar' }],
          xp: 50,
          difficulty: 1,
          explanation: ['Formatos em linha leem o registro inteiro e são fáceis de gerar e de ler por pessoas. Formatos em coluna leem só as colunas da consulta, comprimem melhor e pulam blocos pelas estatísticas guardadas.'],
          bins: [
            { id: 'row', label: 'Em linha (CSV, JSON)' },
            { id: 'col', label: 'Em coluna (Parquet, ORC)' },
          ],
          items: [
            { id: 'all', text: 'Para ler uma coluna, a consulta lê o registro inteiro', bin: 'row', explanation: 'Os campos de um registro ficam juntos no arquivo.', concepts: ['lake.columnar'] },
            { id: 'some', text: 'A consulta lê só as colunas que usa', bin: 'col', explanation: 'Os valores de cada coluna ficam juntos.', concepts: ['lake.columnar'] },
            { id: 'stats', text: 'Guarda o mínimo e o máximo de cada bloco para pular o que não interessa', bin: 'col', explanation: 'As estatísticas permitem pular blocos inteiros.', concepts: ['lake.columnar'] },
            { id: 'human', text: 'Pode ser aberto e lido num editor de texto', bin: 'row', explanation: 'CSV e JSON são texto.', concepts: ['lake.columnar'] },
          ],
        },
        {
          id: 'ana.f01.m2.a4',
          kind: 'decision',
          title: 'Um arquivo gigante',
          prompt: 'Para facilitar, o sistema de rastreio passou a gravar o dia inteiro num único CSV com GZIP de 4 GB. As consultas ficaram lentas. Por quê?',
          concepts: [{ id: 'lake.compression' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Texto comprimido, em geral, não pode ser dividido entre vários leitores: um arquivo de 4 GB com GZIP é lido por um só. Arquivos de tamanho médio, ou um formato colunar, permitem ler em paralelo.'],
          options: [
            { id: 'a', text: 'O CSV com GZIP não pode ser dividido: um leitor só lê os 4 GB', correct: true, consequence: 'Dividir em arquivos menores, ou converter para Parquet, devolve o paralelismo.' },
            { id: 'b', text: 'O Athena não lê arquivos com GZIP', correct: false, consequence: 'O Athena lê GZIP; quem ele não lê é o .zip.' },
            { id: 'c', text: 'O GZIP aumenta o volume lido', correct: false, consequence: 'O volume lido diminui; o problema é a falta de paralelismo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Parquet e ORC leem só as colunas da consulta.', 'O Athena cobra antes de descomprimir: arquivo menor, consulta mais barata.', 'Texto comprimido não se divide entre leitores: evite arquivos gigantes.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f01.m3',
      title: 'Pastas que filtram',
      type: 'mission',
      summary: 'Partições que acompanham o filtro das consultas, e o risco de particionar demais.',
      briefing: {
        company: 'Transportadora Rota Sul',
        role: 'Você organiza as pastas das tabelas no S3.',
        situation: 'Mesmo em Parquet, o painel de atrasos lê o ano inteiro para mostrar a última semana. Um colega quer particionar tudo por dia e por centro de distribuição, até a tabela de sensores, que o time de ciência de dados lê inteira.',
        objective: 'Escolher partições que reduzam a leitura sem fragmentar as tabelas.',
        successCriteria: ['Prever quando a partição reduz a leitura', 'Evitar arquivos pequenos demais'],
      },
      intel: [
        { conceptId: 'lake.partitioning', body: ['A partição separa a tabela em pastas como `dia=2026-10-21/`. Quando a consulta **filtra pela chave no WHERE**, o Athena abre só essas pastas. Se a consulta não filtra pela chave, lê tudo.'] },
        { conceptId: 'lake.small-files', body: ['Partição demais gera **arquivos pequenos demais**. Cada arquivo tem um custo fixo para listar e abrir, e a consulta fica lenta.'] },
      ],
      activities: [
        {
          id: 'ana.f01.m3.a1',
          kind: 'predict',
          title: 'A última semana',
          prompt: 'Os eventos estão em Parquet com GZIP. O painel lê a última semana. Qual organização faz a consulta ler menos: sem partição, por mês ou por dia?',
          concepts: [{ id: 'lake.partitioning' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Por dia, a consulta abre 7 das 365 pastas. Por mês, abre o mês inteiro, 30 dias. Sem partição, lê o ano inteiro.'],
          spec: {
            sim: 'datalake',
            table: ENTREGAS,
            query: 'atrasos',
            layouts: { none: { format: 'parquet', compression: 'gzip', partition: 'none' }, month: { format: 'parquet', compression: 'gzip', partition: 'month' }, day: { format: 'parquet', compression: 'gzip', partition: 'day' } },
          },
          options: [
            { id: 'a', text: 'Por dia', outcome: 'day' },
            { id: 'b', text: 'Por mês', outcome: 'month' },
            { id: 'c', text: 'Sem partição', outcome: 'none' },
            { id: 'd', text: 'As três leem o mesmo volume', outcome: 'same' },
          ],
        },
        {
          id: 'ana.f01.m3.a2',
          kind: 'predict',
          title: 'Partição que ninguém usa',
          prompt: 'A tabela de sensores, em Parquet, passa a ser particionada por dia. A consulta do time de ciência de dados lê o ano inteiro, sem filtro de data. Ela passa a ler menos?',
          concepts: [{ id: 'lake.partitioning' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A partição só reduz a leitura quando a consulta filtra pela chave. Sem filtro de data, a consulta abre as 365 pastas e lê o mesmo volume.'],
          spec: { sim: 'datalake', table: SENSORES, query: 'modelo', layouts: { none: { format: 'parquet', compression: 'gzip', partition: 'none' }, day: { format: 'parquet', compression: 'gzip', partition: 'day' } } },
          options: [
            { id: 'a', text: 'Não: lê o mesmo volume', outcome: 'same' },
            { id: 'b', text: 'Sim: a tabela particionada lê menos', outcome: 'day' },
          ],
        },
        {
          id: 'ana.f01.m3.a3',
          kind: 'decision',
          title: 'Por dia e por centro',
          prompt: 'Os sensores geram cerca de 67 GB por ano em Parquet com GZIP. O colega quer particionar por dia e pelos 40 centros. O que acontece?',
          concepts: [{ id: 'lake.small-files' }, { id: 'lake.partitioning', weight: 0.5 }],
          xp: 50,
          difficulty: 3,
          explanation: ['São 14.600 pastas para 67 GB: menos de 5 MB por pasta. A consulta passa a listar e abrir milhares de arquivos pequenos, e fica mais lenta, sem ler menos, porque não filtra por dia nem por centro.'],
          options: [
            { id: 'a', text: 'A tabela vira milhares de arquivos pequenos, e a consulta fica mais lenta sem ler menos', correct: true, consequence: 'Para essa tabela, sem partição ou por mês é suficiente.' },
            { id: 'b', text: 'A consulta fica mais barata, porque cada arquivo é pequeno', correct: false, consequence: 'O custo segue o volume lido, que não muda sem filtro.' },
            { id: 'c', text: 'Nada muda: o Athena junta as pastas sozinho', correct: false, consequence: 'O Athena lista e abre cada arquivo; arquivos pequenos aumentam esse trabalho.' },
          ],
        },
      ],
      debrief: { takeaways: ['Partição pela chave que as consultas usam no filtro, em geral a data.', 'Partição sem filtro não reduz nada.', 'Partição demais gera arquivos pequenos e consultas lentas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f01.boss',
      title: 'O lago da Rota Sul',
      type: 'boss',
      summary: 'Três tabelas, três padrões de consulta, um custo mensal para baixar.',
      briefing: {
        company: 'Transportadora Rota Sul',
        role: 'Você fecha o desenho da camada tratada do data lake.',
        situation: 'Três tabelas estão em CSV sem compressão e sem partição: eventos de entrega, leituras dos sensores e movimentação nos centros. Cada uma é consultada de um jeito.',
        objective: 'Escolher formato, compressão e partição de cada tabela pelo menor custo mensal, sem arquivos pequenos demais.',
        successCriteria: ['Menor custo em cada tabela', 'Nenhuma tabela com arquivos pequenos demais'],
      },
      intel: [
        { conceptId: 'lake.partitioning', body: ['Olhe o filtro de cada consulta: últimos dias, o ano inteiro, um centro só. A partição precisa acompanhar o filtro.'] },
        { conceptId: 'lake.columnar', body: ['Todas as consultas leem poucas colunas. O formato decide se elas leem o resto.'] },
      ],
      activities: [
        {
          id: 'ana.f01.boss.a1',
          kind: 'lab',
          lab: 'datalake',
          title: 'Três tabelas',
          prompt: 'Para cada tabela, escolha formato, compressão e partição. O quadro mostra, ao vivo, quanto cada consulta lê e o custo do mês no S3 e no Athena.',
          concepts: [{ id: 'lake.columnar' }, { id: 'lake.compression' }, { id: 'lake.partitioning' }, { id: 'lake.small-files' }],
          xp: 200,
          difficulty: 3,
          hints: ['Nenhuma consulta lê todas as colunas.', 'A tabela de sensores é lida inteira; a de movimentação é filtrada pelos últimos 30 dias e por um centro.'],
          explanation: [
            'Eventos de entrega: formato colunar com GZIP ou ZSTD, particionado por dia, porque o painel lê só a última semana.',
            'Sensores: formato colunar comprimido, sem partição por dia e centro, que geraria arquivos pequenos demais; a consulta lê o ano inteiro de qualquer forma.',
            'Movimentação: formato colunar comprimido, particionado por dia e por centro, porque cada gerente lê um centro só.',
          ],
          config: ROTA_SUL_LAKE,
        },
      ],
      debrief: { takeaways: ['Formato colunar e compressão quase sempre compensam nas tabelas consultadas.', 'A partição acompanha o filtro das consultas.', 'Particionar demais gera arquivos pequenos.'] },
    },
  ],
}
