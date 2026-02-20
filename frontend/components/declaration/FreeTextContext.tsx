const MAX_LENGTH = 500

interface FreeTextContextProps {
  value: string
  onChange: (value: string) => void
}

export function FreeTextContext({ value, onChange }: FreeTextContextProps) {
  const remaining = MAX_LENGTH - value.length

  return (
    <div>
      <label htmlFor="declaration-context">
        Optional context (e.g. used AI to understand a concept)
      </label>
      <textarea
        id="declaration-context"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        style={{ width: '100%', display: 'block', marginTop: '0.25rem' }}
      />
      <span style={{ fontSize: '0.875rem', color: '#666' }}>
        {remaining} characters remaining
      </span>
    </div>
  )
}
