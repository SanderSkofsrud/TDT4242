import { Link } from 'react-router-dom'

export function PrivacyBadge() {
  return (
    <div className="badge-privacy">
      Your AI usage data is private by default. You control who can see it.{' '}
      <Link to="/privacy">Sharing settings</Link>
    </div>
  )
}
