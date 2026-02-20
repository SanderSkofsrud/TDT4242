import { FREQUENCY_OPTIONS } from '../../utils/constants'

interface FrequencySelectorProps {
  value: string
  onChange: (value: string) => void
}

export function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <fieldset>
      <legend>Frequency</legend>
      {FREQUENCY_OPTIONS.map(({ value: optValue, label }) => (
        <div key={optValue} style={{ marginBottom: '0.25rem' }}>
          <label>
            <input
              type="radio"
              name="frequency"
              value={optValue}
              checked={value === optValue}
              onChange={() => onChange(optValue)}
            />
            {label}
          </label>
        </div>
      ))}
    </fieldset>
  )
}
