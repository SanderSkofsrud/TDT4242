import type { AssignmentGuidance } from '../../types/models'

interface GuidanceCardProps {
  guidance: AssignmentGuidance
}

export function GuidanceCard({ guidance }: GuidanceCardProps) {
  const { permittedText, prohibitedText, examples } = guidance

  return (
    <div className="card-elevated space-y-6">
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Permitted use</h2>
        <p className="text-slate-600">{permittedText}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Prohibited use</h2>
        <p className="text-slate-600">{prohibitedText}</p>
      </section>
      {examples && (
        <>
          {examples.permitted && examples.permitted.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Permitted examples</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {examples.permitted.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </section>
          )}
          {examples.prohibited && examples.prohibited.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Prohibited examples</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
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
