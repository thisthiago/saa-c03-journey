/**
 * Tarefas do laboratório "Explorador de bucket". As respostas corretas são
 * sempre calculadas a partir do modelo — nunca escritas à mão no conteúdo.
 */
import {
  countObjectsUnder,
  findObjects,
  listObjects,
  objectArn,
  s3Uri,
  virtualHostedUrl,
  type BucketData,
  type ObjectMatch,
} from './model'

interface TaskBase {
  id: string
  prompt: string
  explanation: string
  concepts?: string[]
}

export type BucketTask =
  | (TaskBase & { type: 'select-object'; match: ObjectMatch })
  | (TaskBase & { type: 'count'; prefix: string; mode: 'recursive' | 'common-prefixes' | 'direct-objects' })
  | (TaskBase & { type: 'text'; expect: 'arn' | 's3-uri' | 'url' | 'key' | 'region'; key?: string; placeholder?: string })

export interface BucketLabConfig {
  bucket: BucketData
  tasks: BucketTask[]
}

export interface BucketLabResponse {
  answers: Record<string, string>
}

/** Respostas aceitas para a tarefa, já normalizadas. */
export function acceptedAnswers(config: BucketLabConfig, task: BucketTask): string[] {
  const { bucket } = config
  switch (task.type) {
    case 'select-object':
      return findObjects(bucket, task.match).map((o) => o.key)
    case 'count': {
      if (task.mode === 'recursive') return [String(countObjectsUnder(bucket, task.prefix))]
      const listed = listObjects(bucket, task.prefix, '/')
      return [String(task.mode === 'common-prefixes' ? listed.commonPrefixes.length : listed.contents.length)]
    }
    case 'text': {
      const key = task.key ?? ''
      switch (task.expect) {
        case 'arn':
          return [objectArn(bucket.name, key)]
        case 's3-uri':
          return [s3Uri(bucket.name, key)]
        case 'url':
          return [virtualHostedUrl(bucket.name, bucket.region, key)]
        case 'key':
          return [key]
        case 'region':
          return [bucket.region]
      }
    }
  }
}

export function normalizeAnswer(task: BucketTask, value: string): string {
  const trimmed = value.trim()
  if (task.type === 'count') return String(Number.parseInt(trimmed, 10))
  if (task.type === 'text' && task.expect === 'region') return trimmed.toLowerCase()
  return trimmed
}

export function isTaskCorrect(config: BucketLabConfig, task: BucketTask, value: string | undefined): boolean {
  if (value === undefined || value.trim() === '') return false
  return acceptedAnswers(config, task).includes(normalizeAnswer(task, value))
}

export function bucketLabSolution(config: BucketLabConfig): BucketLabResponse {
  const answers: Record<string, string> = {}
  for (const t of config.tasks) answers[t.id] = acceptedAnswers(config, t)[0] ?? ''
  return { answers }
}
