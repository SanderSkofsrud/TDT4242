import { FREQUENCY_OPTIONS } from '../../utils/constants'

interface FrequencySelectorProps {
  value: string
  onChange: (value: string) => void
}

export function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <fieldset className="border border-slate-200 rounded-lg p-4">
      <legend className="label-field">Frequency</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
        {FREQUENCY_OPTIONS.map(({ value: optValue, label }) => (
          <label key={optValue} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="frequency"
              value={optValue}
              checked={value === optValue}
              onChange={() => onChange(optValue)}
              className="border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-slate-700">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
