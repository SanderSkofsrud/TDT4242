const MAX_LENGTH = 500

interface FreeTextContextProps {
  value: string
  onChange: (value: string) => void
}

export function FreeTextContext({ value, onChange }: FreeTextContextProps) {
  const remaining = MAX_LENGTH - value.length

  return (
    <div>
      <label htmlFor="declaration-context" className="label-field">
        Optional context (e.g. used AI to understand a concept)
      </label>
      <textarea
        id="declaration-context"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        className="input-field mt-1"
      />
      <span className="text-sm text-slate-500 mt-1 block">
        {remaining} characters remaining
      </span>
    </div>
  )
}
