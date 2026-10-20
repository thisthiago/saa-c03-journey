/**
 * Catálogo de Regiões AWS (fatos verificados).
 *
 * Conferido em 18/10/2026:
 * - Regiões, AZs, país e opt-in: https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html
 *   (Regiões lançadas depois de 20/03/2019 precisam ser habilitadas — opt-in.)
 * - S3 Express One Zone por Região: https://docs.aws.amazon.com/AmazonS3/latest/userguide/endpoint-directory-buckets-AZ.html
 *
 * Esses dados mudam: a AWS abre Regiões e expande recursos. A data acima vale para tudo.
 */

export interface RegionFact {
  code: string
  name: string
  country: string
  /** Agrupamento geográfico usado no mapa esquemático. */
  area: 'Américas' | 'Europa' | 'Ásia-Pacífico' | 'Oriente Médio e África'
  azs: number
  optIn: boolean
  s3ExpressOneZone: boolean
}

export const REGIONS_VERIFIED_AT = '18/10/2026'
export const REGIONS_SOURCE = 'https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html'

const r = (code: string, name: string, country: string, area: RegionFact['area'], azs: number, optIn: boolean, s3ExpressOneZone: boolean): RegionFact => ({ code, name, country, area, azs, optIn, s3ExpressOneZone })

export const REGION_FACTS: RegionFact[] = [
  r('us-east-1', 'US East (N. Virginia)', 'Estados Unidos', 'Américas', 6, false, true),
  r('us-east-2', 'US East (Ohio)', 'Estados Unidos', 'Américas', 3, false, true),
  r('us-west-1', 'US West (N. California)', 'Estados Unidos', 'Américas', 3, false, true),
  r('us-west-2', 'US West (Oregon)', 'Estados Unidos', 'Américas', 4, false, true),
  r('ca-central-1', 'Canada (Central)', 'Canadá', 'Américas', 3, false, true),
  r('ca-west-1', 'Canada West (Calgary)', 'Canadá', 'Américas', 3, true, false),
  r('mx-central-1', 'Mexico (Central)', 'México', 'Américas', 3, true, false),
  r('sa-east-1', 'South America (São Paulo)', 'Brasil', 'Américas', 3, false, true),
  r('eu-central-1', 'Europe (Frankfurt)', 'Alemanha', 'Europa', 3, false, true),
  r('eu-central-2', 'Europe (Zurich)', 'Suíça', 'Europa', 3, true, false),
  r('eu-west-1', 'Europe (Ireland)', 'Irlanda', 'Europa', 3, false, true),
  r('eu-west-2', 'Europe (London)', 'Reino Unido', 'Europa', 3, false, true),
  r('eu-west-3', 'Europe (Paris)', 'França', 'Europa', 3, false, true),
  r('eu-south-1', 'Europe (Milan)', 'Itália', 'Europa', 3, true, false),
  r('eu-south-2', 'Europe (Spain)', 'Espanha', 'Europa', 3, true, false),
  r('eu-north-1', 'Europe (Stockholm)', 'Suécia', 'Europa', 3, false, true),
  r('ap-east-1', 'Asia Pacific (Hong Kong)', 'Hong Kong', 'Ásia-Pacífico', 3, true, true),
  r('ap-east-2', 'Asia Pacific (Taipei)', 'Taiwan', 'Ásia-Pacífico', 3, true, false),
  r('ap-south-1', 'Asia Pacific (Mumbai)', 'Índia', 'Ásia-Pacífico', 3, false, true),
  r('ap-south-2', 'Asia Pacific (Hyderabad)', 'Índia', 'Ásia-Pacífico', 3, true, false),
  r('ap-southeast-1', 'Asia Pacific (Singapore)', 'Singapura', 'Ásia-Pacífico', 3, false, true),
  r('ap-southeast-2', 'Asia Pacific (Sydney)', 'Austrália', 'Ásia-Pacífico', 3, false, true),
  r('ap-southeast-3', 'Asia Pacific (Jakarta)', 'Indonésia', 'Ásia-Pacífico', 3, true, true),
  r('ap-southeast-4', 'Asia Pacific (Melbourne)', 'Austrália', 'Ásia-Pacífico', 3, true, false),
  r('ap-southeast-5', 'Asia Pacific (Malaysia)', 'Malásia', 'Ásia-Pacífico', 3, true, false),
  r('ap-southeast-6', 'Asia Pacific (New Zealand)', 'Nova Zelândia', 'Ásia-Pacífico', 3, true, false),
  r('ap-southeast-7', 'Asia Pacific (Thailand)', 'Tailândia', 'Ásia-Pacífico', 3, true, false),
  r('ap-northeast-1', 'Asia Pacific (Tokyo)', 'Japão', 'Ásia-Pacífico', 4, false, true),
  r('ap-northeast-2', 'Asia Pacific (Seoul)', 'Coreia do Sul', 'Ásia-Pacífico', 4, false, true),
  r('ap-northeast-3', 'Asia Pacific (Osaka)', 'Japão', 'Ásia-Pacífico', 3, false, false),
  r('af-south-1', 'Africa (Cape Town)', 'África do Sul', 'Oriente Médio e África', 3, true, true),
  r('il-central-1', 'Israel (Tel Aviv)', 'Israel', 'Oriente Médio e África', 3, true, false),
  r('me-south-1', 'Middle East (Bahrain)', 'Bahrein', 'Oriente Médio e África', 3, true, false),
  r('me-central-1', 'Middle East (UAE)', 'Emirados Árabes Unidos', 'Oriente Médio e África', 3, true, false),
]

export const REGION_BY_CODE = new Map(REGION_FACTS.map((f) => [f.code, f]))

export function regionFact(code: string): RegionFact {
  const f = REGION_BY_CODE.get(code)
  if (!f) throw new Error(`Região fora do catálogo: ${code}`)
  return f
}
