import type { FeedbackResponse } from '../../types/models'
import { PolicyReference } from './PolicyReference'

interface FeedbackViewProps {
  feedback: FeedbackResponse
}

export function FeedbackView({ feedback }: FeedbackViewProps) {
  const { categories, frequency, guidance, feedbackTemplates, policyVersion, policyFilePath } =
    feedback

  return (
    <div className="container">
      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2>Your declaration</h2>
        <p><strong>Categories:</strong> {categories.join(', ')}</p>
        <p><strong>Frequency:</strong> {frequency}</p>
      </section>

      {guidance && (
        <>
          <section className="card" style={{ marginBottom: '1rem' }}>
            <h2>Permitted use</h2>
            <p>{guidance.permittedText}</p>
          </section>
          <section className="card" style={{ marginBottom: '1rem' }}>
            <h2>Prohibited use</h2>
            <p>{guidance.prohibitedText}</p>
          </section>
        </>
      )}

      {feedbackTemplates && feedbackTemplates.length > 0 && (
        <section className="card" style={{ marginBottom: '1rem' }}>
          <h2>Things to consider</h2>
          <ul style={{ marginLeft: '1.5rem' }}>
            {feedbackTemplates.map((t, i) => (
              <li key={i}>{t.templateText}</li>
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
