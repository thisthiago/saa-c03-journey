import { describe, expect, it } from 'vitest'
import { acceptedAnswers, bucketLabSolution, isTaskCorrect, type BucketLabConfig } from './lab'
import { findObjects, listObjects, objectArn, validateBucketName, virtualHostedUrl, type BucketData } from './model'

const obj = (key: string, extra: Partial<BucketData['objects'][number]> = {}) => ({
  key,
  sizeBytes: 1000,
  contentType: 'application/pdf',
  lastModified: '2026-01-01T00:00:00Z',
  etag: '"x"',
  storageClass: 'STANDARD' as const,
  ...extra,
})

const bucket: BucketData = {
  name: 'acervo-docs',
  region: 'sa-east-1',
  accountId: '111122223333',
  objects: [
    obj('contratos/2025/a.pdf'),
    obj('contratos/2026/b.pdf', { userMetadata: { cliente: 'aurora' }, sizeBytes: 5000 }),
    obj('contratos/indice.csv', { contentType: 'text/csv' }),
    obj('logo.png', { contentType: 'image/png' }),
  ],
}

describe('listagem com delimitador', () => {
  it('agrupa keys em CommonPrefixes', () => {
    const root = listObjects(bucket, '', '/')
    expect(root.commonPrefixes).toEqual(['contratos/'])
    expect(root.contents.map((o) => o.key)).toEqual(['logo.png'])
    const sub = listObjects(bucket, 'contratos/', '/')
    expect(sub.commonPrefixes).toEqual(['contratos/2025/', 'contratos/2026/'])
    expect(sub.contents.map((o) => o.key)).toEqual(['contratos/indice.csv'])
  })
  it('sem delimitador, lista tudo sob o prefixo (namespace plano)', () => {
    expect(listObjects(bucket, 'contratos/').contents).toHaveLength(3)
  })
})

describe('endereços', () => {
  it('monta ARN e URL virtual-hosted', () => {
    expect(objectArn('acervo-docs', 'a/b.pdf')).toBe('arn:aws:s3:::acervo-docs/a/b.pdf')
    expect(virtualHostedUrl('acervo-docs', 'sa-east-1', 'relatório final.pdf')).toBe(
      'https://acervo-docs.s3.sa-east-1.amazonaws.com/relat%C3%B3rio%20final.pdf',
    )
  })
})

describe('regras de nome de bucket', () => {
  it.each([
    ['meu-bucket-123', true],
    ['ab', false],
    ['Meu-Bucket', false],
    ['meu_bucket', false],
    ['meu..bucket', false],
    ['192.168.5.4', false],
    ['-comeca-com-hifen', false],
    ['xn--bucket', false],
    ['dados--x-s3', false],
    ['www.example.com', true],
  ])('%s → válido=%s', (name, valid) => {
    expect(validateBucketName(name).valid).toBe(valid)
  })
})

describe('laboratório do bucket', () => {
  const config: BucketLabConfig = {
    bucket,
    tasks: [
      { id: 't1', type: 'select-object', prompt: '', explanation: '', match: { userMetadata: { cliente: 'aurora' } } },
      { id: 't2', type: 'count', prompt: '', explanation: '', prefix: 'contratos/', mode: 'recursive' },
      { id: 't3', type: 'count', prompt: '', explanation: '', prefix: 'contratos/', mode: 'common-prefixes' },
      { id: 't4', type: 'text', prompt: '', explanation: '', expect: 'arn', key: 'logo.png' },
    ],
  }
  it('calcula as respostas a partir do modelo', () => {
    expect(acceptedAnswers(config, config.tasks[0])).toEqual(['contratos/2026/b.pdf'])
    expect(acceptedAnswers(config, config.tasks[1])).toEqual(['3'])
    expect(acceptedAnswers(config, config.tasks[2])).toEqual(['2'])
    expect(isTaskCorrect(config, config.tasks[1], ' 3 ')).toBe(true)
    expect(isTaskCorrect(config, config.tasks[3], 'arn:aws:s3:::acervo-docs/logo.png')).toBe(true)
  })
  it('a solução de referência acerta todas as tarefas', () => {
    const sol = bucketLabSolution(config)
    expect(config.tasks.every((t) => isTaskCorrect(config, t, sol.answers[t.id]))).toBe(true)
  })
  it('encontra o maior objeto', () => {
    expect(findObjects(bucket, { keyPrefix: 'contratos/', largest: true }).map((o) => o.key)).toEqual(['contratos/2026/b.pdf'])
  })
})
