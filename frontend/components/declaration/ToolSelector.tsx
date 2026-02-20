const AVAILABLE_TOOLS = [
  'ChatGPT',
  'Claude',
  'GitHub Copilot',
  'Gemini',
  'Grammarly',
  'Other',
]

interface ToolSelectorProps {
  value: string[]
  onChange: (values: string[]) => void
}

export function ToolSelector({ value, onChange }: ToolSelectorProps) {
  const toggle = (tool: string) => {
    if (value.includes(tool)) {
      onChange(value.filter((v) => v !== tool))
    } else {
      onChange([...value, tool])
    }
  }

  return (
    <fieldset>
      <legend>Tools used</legend>
      {AVAILABLE_TOOLS.map((tool) => (
        <div key={tool} style={{ marginBottom: '0.25rem' }}>
          <label>
            <input
              type="checkbox"
              checked={value.includes(tool)}
              onChange={() => toggle(tool)}
            />
            {tool}
          </label>
        </div>
      ))}
    </fieldset>
  )
}
