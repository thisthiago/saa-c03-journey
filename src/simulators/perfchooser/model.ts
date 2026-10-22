/**
 * Escolha do recurso de desempenho: qual serviço resolve cada gargalo com o
 * menor esforço.
 *
 * Conferido nas trilhas anteriores e em 22/10/2026
 * (https://docs.aws.amazon.com/wellarchitected/latest/framework/perf_networking_choose_workload_location_network_requirements.html
 * e https://docs.aws.amazon.com/wellarchitected/latest/framework/perf_data_use_purpose_built_data_store.html):
 * CloudFront guarda conteúdo estático e dinâmico perto dos usuários;
 * ElastiCache responde leituras repetidas em microssegundos na frente de um
 * banco; DAX acelera o DynamoDB sem mudar a API; réplicas de leitura tiram
 * consultas da primária; Aurora Global Database dá leituras locais em outras
 * Regiões; Global Accelerator leva TCP e UDP pela rede da AWS com IPs fixos,
 * sem cache; placement group cluster junta instâncias numa AZ para a menor
 * latência entre elas; io2 Block Express dá IOPS altas e consistentes a um
 * volume; S3 Transfer Acceleration acelera uploads de longe para um bucket.
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const PERF_OPTIONS: ChoiceCatalog = {
  needLabel: {
    'static-global': 'imagens e páginas iguais para usuários no mundo todo, sem buscar na origem a cada pedido',
    'repeat-reads': 'as mesmas consultas a um banco relacional, repetidas milhares de vezes por segundo, em microssegundos',
    'ddb-microseconds': 'leituras do DynamoDB em microssegundos sem mudar a API usada pela aplicação',
    'read-offload': 'relatórios pesados de leitura sem pesar nas gravações do banco relacional',
    'global-sql-reads': 'leituras de um banco relacional com baixa latência em outras Regiões',
    'udp-static-ip': 'tráfego UDP de um jogo com IPs fixos e o caminho pela rede da AWS até a Região',
    'node-latency': 'a menor latência possível entre as instâncias de um cálculo distribuído',
    'consistent-iops': 'um banco autogerenciado no EC2 com dezenas de milhares de IOPS consistentes',
    'far-uploads': 'uploads de arquivos grandes de outros continentes para um bucket S3 central',
  },
  options: {
    cloudfront: { name: 'Amazon CloudFront', summary: 'Rede de entrega que guarda o conteúdo nas edge locations, perto de quem pede.', meets: ['static-global'], limits: ['Não acelera tráfego UDP nem dá IPs fixos.'], complexity: 1 },
    elasticache: { name: 'Amazon ElastiCache', summary: 'Cache em memória (Valkey, Redis OSS ou Memcached) na frente do banco.', meets: ['repeat-reads'], limits: ['A aplicação precisa ler e invalidar o cache.'], complexity: 2 },
    dax: { name: 'DynamoDB Accelerator (DAX)', summary: 'Cache em memória compatível com a API do DynamoDB.', meets: ['ddb-microseconds'], limits: ['Só serve o DynamoDB e leituras eventualmente consistentes.'], complexity: 1 },
    'read-replica': { name: 'Réplica de leitura do RDS', summary: 'Cópia somente leitura, atualizada de forma assíncrona, que tira consultas da primária.', meets: ['read-offload'], limits: ['Responde em milissegundos, não em microssegundos, e pode estar um pouco atrasada.'], complexity: 1 },
    'aurora-global': { name: 'Aurora Global Database', summary: 'Clusters secundários em outras Regiões, atualizados em geral em menos de 1 segundo.', meets: ['global-sql-reads', 'read-offload'], limits: ['Exige o Aurora e paga um cluster em cada Região.'], complexity: 3 },
    'global-accelerator': { name: 'AWS Global Accelerator', summary: 'Dois IPs anycast fixos que levam TCP e UDP pela rede da AWS até o endpoint saudável.', meets: ['udp-static-ip'], limits: ['Não faz cache.'], complexity: 2 },
    'placement-cluster': { name: 'Placement group cluster', summary: 'Instâncias juntas numa AZ, para a menor latência entre elas.', meets: ['node-latency'], limits: ['Tudo numa AZ: uma falha da zona leva o grupo inteiro.'], complexity: 1 },
    io2: { name: 'EBS io2 Block Express', summary: 'Volume SSD com IOPS provisionadas, altas e consistentes.', meets: ['consistent-iops'], limits: ['Paga cada IOPS provisionada, use ou não.'], complexity: 2 },
    's3-acceleration': { name: 'S3 Transfer Acceleration', summary: 'Uploads e downloads de longa distância pelas edge locations do CloudFront.', meets: ['far-uploads'], limits: ['Cobra por GB acelerado.'], complexity: 1 },
  },
}

export type PerfChooserLabConfig = ChoiceLabConfig
export type PerfChooserLabResponse = ChoiceLabResponse

export const perfChooserSolution = (c: PerfChooserLabConfig) => choiceSolution(PERF_OPTIONS, c)
export const evaluatePerfChooserLab = (c: PerfChooserLabConfig, r: PerfChooserLabResponse) => evaluateChoiceLab(PERF_OPTIONS, c, r)
