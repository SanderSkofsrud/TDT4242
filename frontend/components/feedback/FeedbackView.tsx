import type { FeedbackResponse } from '../../types/models'
import { PolicyReference } from './PolicyReference'

interface FeedbackViewProps {
  feedback: FeedbackResponse
}

export function FeedbackView({ feedback }: FeedbackViewProps) {
  const {
    categories,
    frequency,
    guidance,
    mismatches,
    feedbackTemplates,
    policyVersion,
    policyFilePath,
  } = feedback

  return (
    <div className="container-app py-12 sm:py-16">
      <section className="card-elevated mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Your declaration</h2>
        <p className="text-slate-700"><strong>Categories:</strong> {categories.join(', ')}</p>
        <p className="text-slate-700"><strong>Frequency:</strong> {frequency}</p>
      </section>

      {guidance && (
        <>
          <section className="card-elevated mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Permitted use</h2>
            <p className="text-slate-600">{guidance.permittedText}</p>
          </section>
          <section className="card-elevated mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Prohibited use</h2>
            <p className="text-slate-600">{guidance.prohibitedText}</p>
          </section>
        </>
      )}

      {feedbackTemplates && feedbackTemplates.length > 0 && (
        <section className="card-elevated mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Things to consider</h2>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            {feedbackTemplates.map((t, i) => (
              <li key={i}>{t.templateText}</li>
            ))}
          </ul>
        </section>
      )}

      {mismatches && mismatches.length > 0 && (
        <section className="card-elevated mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Potential mismatches</h2>
          <p className="text-slate-600 mb-3">
            These observations are provided for reflection and do not represent any penalties.
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            {mismatches.map((item, i) => (
              <li key={`${item.category}-${i}`}>{item.message}</li>
            ))}
          </ul>
        </section>
      )}

      <p>
        <PolicyReference version={policyVersion} filePath={policyFilePath} />
      </p>
    </div>
  )
}
