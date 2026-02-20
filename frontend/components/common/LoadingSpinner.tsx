export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="spinner" aria-hidden />
      {message && <p style={{ marginTop: '0.5rem' }}>{message}</p>}
    </div>
  )
}
