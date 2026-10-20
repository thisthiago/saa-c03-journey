import { renderInline } from './inline'

export function RichText({ text, as: Tag = 'span' }: { text: string; as?: 'span' | 'p' | 'div' }) {
  return <Tag>{renderInline(text)}</Tag>
}

export function Paragraphs({ items, className }: { items: string[]; className?: string }) {
  return (
    <div className={className}>
      {items.map((t, i) => (
        <p key={i}>{renderInline(t)}</p>
      ))}
    </div>
  )
}
