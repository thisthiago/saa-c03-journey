/**
 * Marcação mínima e segura para textos de conteúdo (sem HTML):
 *   **negrito**  ·  `código`  ·  [[conceito.id|rótulo]] (link para o Codex)
 */
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]|]+(?:\|[^\]]+)?\]\])/g

export function renderInline(text: string): ReactNode[] {
  const parts = text.split(TOKEN)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const [id, label] = part.slice(2, -2).split('|')
      return (
        <Link key={i} to={`/codex/${encodeURIComponent(id)}`}>
          {label ?? id}
        </Link>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

