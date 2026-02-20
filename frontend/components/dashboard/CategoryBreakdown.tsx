interface CategoryBreakdownProps {
  byCategory: Record<string, number>
  byFrequency: Record<string, number>
}

export function CategoryBreakdown({ byCategory, byFrequency }: CategoryBreakdownProps) {
  const categoryRows = Object.entries(byCategory)
  const frequencyRows = Object.entries(byFrequency)

  return (
    <div className="flex flex-wrap gap-8">
      <div className="card-elevated flex-1 min-w-[200px]">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">By category</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                Category
              </th>
              <th className="text-right py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryRows.map(([name, count]) => (
              <tr key={name} className="border-b border-slate-100">
                <td className="py-2 px-3 text-slate-700">{name}</td>
                <td className="py-2 px-3 text-right text-slate-700">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-elevated flex-1 min-w-[200px]">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">By frequency</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                Frequency
              </th>
              <th className="text-right py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {frequencyRows.map(([name, count]) => (
              <tr key={name} className="border-b border-slate-100">
                <td className="py-2 px-3 text-slate-700">{name}</td>
                <td className="py-2 px-3 text-right text-slate-700">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
