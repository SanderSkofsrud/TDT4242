import { useState, useEffect } from 'react'
import type { AssignmentGuidance } from '../../types/models'

interface GuidanceFormProps {
  initialValues?: AssignmentGuidance | null
  onSave: (data: {
    permittedText: string
    prohibitedText: string
    examples?: AssignmentGuidance['examples']
  }) => Promise<void>
  isSaving: boolean
}

export function GuidanceForm({
  initialValues,
  onSave,
  isSaving,
}: GuidanceFormProps) {
  const [permittedText, setPermittedText] = useState(initialValues?.permittedText ?? '')
  const [prohibitedText, setProhibitedText] = useState(initialValues?.prohibitedText ?? '')
  const [permittedExamples, setPermittedExamples] = useState<string[]>(
    initialValues?.examples?.permitted ?? [],
  )
  const [prohibitedExamples, setProhibitedExamples] = useState<string[]>(
    initialValues?.examples?.prohibited ?? [],
  )

  useEffect(() => {
    if (initialValues) {
      setPermittedText(initialValues.permittedText)
      setProhibitedText(initialValues.prohibitedText)
      setPermittedExamples(initialValues.examples?.permitted ?? [])
      setProhibitedExamples(initialValues.examples?.prohibited ?? [])
    }
  }, [initialValues])

  const addPermitted = () => setPermittedExamples([...permittedExamples, ''])
  const removePermitted = (i: number) =>
    setPermittedExamples(permittedExamples.filter((_, idx) => idx !== i))
  const setPermittedAt = (i: number, v: string) => {
    const next = [...permittedExamples]
    next[i] = v
    setPermittedExamples(next)
  }

  const addProhibited = () => setProhibitedExamples([...prohibitedExamples, ''])
  const removeProhibited = (i: number) =>
    setProhibitedExamples(prohibitedExamples.filter((_, idx) => idx !== i))
  const setProhibitedAt = (i: number, v: string) => {
    const next = [...prohibitedExamples]
    next[i] = v
    setProhibitedExamples(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      permittedText,
      prohibitedText,
      examples: {
        permitted: permittedExamples.filter(Boolean),
        prohibited: prohibitedExamples.filter(Boolean),
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="guidance-permitted">Permitted use</label>
        <textarea
          id="guidance-permitted"
          value={permittedText}
          onChange={(e) => setPermittedText(e.target.value)}
          rows={4}
          style={{ width: '100%', display: 'block', marginTop: '0.25rem' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="guidance-prohibited">Prohibited use</label>
        <textarea
          id="guidance-prohibited"
          value={prohibitedText}
          onChange={(e) => setProhibitedText(e.target.value)}
          rows={4}
          style={{ width: '100%', display: 'block', marginTop: '0.25rem' }}
        />
      </div>

      <fieldset style={{ marginBottom: '1rem' }}>
        <legend>Permitted examples</legend>
        {permittedExamples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              value={ex}
              onChange={(e) => setPermittedAt(i, e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => removePermitted(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addPermitted}>
          Add example
        </button>
      </fieldset>

      <fieldset style={{ marginBottom: '1rem' }}>
        <legend>Prohibited examples</legend>
        {prohibitedExamples.map((ex, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              value={ex}
              onChange={(e) => setProhibitedAt(i, e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => removeProhibited(i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addProhibited}>
          Add example
        </button>
      </fieldset>

      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save guidance'}
      </button>
    </form>
  )
}
