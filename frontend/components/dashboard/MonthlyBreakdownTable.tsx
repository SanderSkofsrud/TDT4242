interface MonthlyBreakdownRow {
  month: string
  totalDeclarations: number
  byCategory: Record<string, number>
  byFrequency: Record<string, number>
}

interface MonthlyBreakdownTableProps {
  rows: MonthlyBreakdownRow[]
}

export function MonthlyBreakdownTable({ rows }: MonthlyBreakdownTableProps) {
  if (rows.length === 0) {
    return <p className="text-slate-600">No monthly data available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
              Month
            </th>
            <th className="text-right py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
              Total
            </th>
            <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
              By category
            </th>
            <th className="text-left py-2 px-3 border-b border-slate-200 font-semibold text-slate-700">
              By frequency
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const categoryText = Object.entries(row.byCategory)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            const frequencyText = Object.entries(row.byFrequency)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            return (
              <tr key={row.month} className="border-b border-slate-100">
                <td className="py-3 px-3 text-slate-700">{row.month}</td>
                <td className="py-3 px-3 text-right text-slate-700">
                  {row.totalDeclarations}
                </td>
                <td className="py-3 px-3 text-slate-700">
                  {categoryText || 'No category data'}
                </td>
                <td className="py-3 px-3 text-slate-700">
                  {frequencyText || 'No frequency data'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
