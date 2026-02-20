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
    <fieldset className="border border-slate-200 rounded-lg p-4">
      <legend className="label-field">Tools used</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
        {AVAILABLE_TOOLS.map((tool) => (
          <label key={tool} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(tool)}
              onChange={() => toggle(tool)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-slate-700">{tool}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
