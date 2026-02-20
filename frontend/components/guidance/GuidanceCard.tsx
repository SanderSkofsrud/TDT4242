import type { AssignmentGuidance } from '../../types/models'

interface GuidanceCardProps {
  guidance: AssignmentGuidance
}

export function GuidanceCard({ guidance }: GuidanceCardProps) {
  const { permittedText, prohibitedText, examples } = guidance

  return (
    <div className="card">
      <section style={{ marginBottom: '1rem' }}>
        <h2>Permitted use</h2>
        <p>{permittedText}</p>
      </section>
      <section style={{ marginBottom: '1rem' }}>
        <h2>Prohibited use</h2>
        <p>{prohibitedText}</p>
      </section>
      {examples && (
        <>
          {examples.permitted && examples.permitted.length > 0 && (
            <section style={{ marginBottom: '1rem' }}>
              <h3>Permitted examples</h3>
              <ul style={{ marginLeft: '1.5rem' }}>
                {examples.permitted.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </section>
          )}
          {examples.prohibited && examples.prohibited.length > 0 && (
            <section>
              <h3>Prohibited examples</h3>
              <ul style={{ marginLeft: '1.5rem' }}>
                {examples.prohibited.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
