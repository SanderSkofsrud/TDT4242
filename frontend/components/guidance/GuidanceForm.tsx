import { useState, useEffect } from 'react'
import type { AssignmentGuidance } from '../../types/models'
import { AI_CATEGORIES } from '../../utils/constants'

interface GuidanceFormProps {
  initialValues?: AssignmentGuidance | null
  onSave: (data: {
    permittedText: string
    prohibitedText: string
    permittedCategories?: AssignmentGuidance['permittedCategories']
    prohibitedCategories?: AssignmentGuidance['prohibitedCategories']
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
  const [permittedCategories, setPermittedCategories] = useState<string[]>(
    initialValues?.permittedCategories ?? [],
  )
  const [prohibitedCategories, setProhibitedCategories] = useState<string[]>(
    initialValues?.prohibitedCategories ?? [],
  )
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
      setPermittedCategories(initialValues.permittedCategories ?? [])
      setProhibitedCategories(initialValues.prohibitedCategories ?? [])
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
      permittedCategories,
      prohibitedCategories,
      examples: {
        permitted: permittedExamples.filter(Boolean),
        prohibited: prohibitedExamples.filter(Boolean),
      },
    })
  }

  const toggleCategory = (
    categoryValue: string,
    values: string[],
    setValues: (next: string[]) => void,
  ) => {
    if (values.includes(categoryValue)) {
      setValues(values.filter((v) => v !== categoryValue))
    } else {
      setValues([...values, categoryValue])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="guidance-permitted" className="label-field">
          Permitted use
        </label>
        <textarea
          id="guidance-permitted"
          value={permittedText}
          onChange={(e) => setPermittedText(e.target.value)}
          rows={4}
          className="input-field mt-1"
        />
      </div>
      <div>
        <label htmlFor="guidance-prohibited" className="label-field">
          Prohibited use
        </label>
        <textarea
          id="guidance-prohibited"
          value={prohibitedText}
          onChange={(e) => setProhibitedText(e.target.value)}
          rows={4}
          className="input-field mt-1"
        />
      </div>

      <fieldset className="border border-slate-200 rounded-lg p-4">
        <legend className="label-field">Permitted categories</legend>
        <p className="text-sm text-slate-500 mt-1">
          Select the AI usage categories that are explicitly permitted for this assignment.
        </p>
        <div className="grid gap-2 mt-3 sm:grid-cols-2">
          {AI_CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permittedCategories.includes(value)}
                onChange={() =>
                  toggleCategory(value, permittedCategories, setPermittedCategories)
                }
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-slate-200 rounded-lg p-4">
        <legend className="label-field">Prohibited categories</legend>
        <p className="text-sm text-slate-500 mt-1">
          Select the AI usage categories that are explicitly prohibited for this assignment.
        </p>
        <div className="grid gap-2 mt-3 sm:grid-cols-2">
          {AI_CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prohibitedCategories.includes(value)}
                onChange={() =>
                  toggleCategory(value, prohibitedCategories, setProhibitedCategories)
                }
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-slate-200 rounded-lg p-4">
        <legend className="label-field">Permitted examples</legend>
        <div className="space-y-2 mt-2">
          {permittedExamples.map((ex, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={ex}
                onChange={(e) => setPermittedAt(i, e.target.value)}
                className="input-field flex-1"
              />
              <button type="button" onClick={() => removePermitted(i)} className="btn-secondary">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPermitted} className="btn-secondary mt-2">
          Add example
        </button>
      </fieldset>

      <fieldset className="border border-slate-200 rounded-lg p-4">
        <legend className="label-field">Prohibited examples</legend>
        <div className="space-y-2 mt-2">
          {prohibitedExamples.map((ex, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={ex}
                onChange={(e) => setProhibitedAt(i, e.target.value)}
                className="input-field flex-1"
              />
              <button type="button" onClick={() => removeProhibited(i)} className="btn-secondary">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addProhibited} className="btn-secondary mt-2">
          Add example
        </button>
      </fieldset>

      <button type="submit" disabled={isSaving} className="btn-primary">
        {isSaving ? 'Saving…' : 'Save guidance'}
      </button>
    </form>
  )
}
