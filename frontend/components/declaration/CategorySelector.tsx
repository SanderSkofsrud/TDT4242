import { AI_CATEGORIES, CATEGORY_GLOSSARY } from '../../utils/constants'

interface CategorySelectorProps {
  value: string[]
  onChange: (values: string[]) => void
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const toggle = (categoryValue: string) => {
    if (value.includes(categoryValue)) {
      onChange(value.filter((v) => v !== categoryValue))
    } else {
      onChange([...value, categoryValue])
    }
  }

  return (
    <fieldset className="border border-slate-200 rounded-lg p-4">
      <legend className="label-field">Categories</legend>
      <div className="space-y-3 mt-2">
        {AI_CATEGORIES.map(({ value: catValue, label }) => (
          <label key={catValue} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(catValue)}
              onChange={() => toggle(catValue)}
              className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="font-semibold text-slate-900">{label}</span>
              <br />
              <span className="text-sm text-slate-500">{CATEGORY_GLOSSARY[catValue]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
