import { Link } from 'react-router'

interface EmptyStateProps {
  eyebrow?: string
  title: string
  description: string
  to?: string
  action?: string
}

export function EmptyState({ eyebrow, title, description, to = '/productos', action = 'Explorar productos' }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <span className="empty-mark" aria-hidden="true">↗</span>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className="button" to={to}>{action}<span aria-hidden="true"> ↗</span></Link>
    </section>
  )
}
