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
    <fieldset>
      <legend>Categories</legend>
      {AI_CATEGORIES.map(({ value: catValue, label }) => (
        <div key={catValue} style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={value.includes(catValue)}
              onChange={() => toggle(catValue)}
            />
            <span>
              <strong>{label}</strong>
              <br />
              <span style={{ fontSize: '0.875rem', color: '#555' }}>
                {CATEGORY_GLOSSARY[catValue]}
              </span>
            </span>
          </label>
        </div>
      ))}
    </fieldset>
  )
}
