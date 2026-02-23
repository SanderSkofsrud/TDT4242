import type { InstructorAggregateRow, FacultyAggregateRow } from '../../types/models'

type AggregateRow = InstructorAggregateRow | FacultyAggregateRow

function isInstructorRow(
  row: AggregateRow,
): row is InstructorAggregateRow {
  return 'assignmentId' in row
}

interface AggregateTableProps {
  data: InstructorAggregateRow[] | FacultyAggregateRow[]
}

export function AggregateTable({ data }: AggregateTableProps) {
  return (
    <div className="card-elevated overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 border-b border-slate-200 font-semibold text-slate-700">
              Assignment
            </th>
            <th className="text-left py-3 px-4 border-b border-slate-200 font-semibold text-slate-700">
              Category
            </th>
            <th className="text-left py-3 px-4 border-b border-slate-200 font-semibold text-slate-700">
              Frequency
            </th>
            <th className="text-right py-3 px-4 border-b border-slate-200 font-semibold text-slate-700">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-3 px-4 text-slate-700">
                {isInstructorRow(row) ? row.assignmentId : row.courseId}
              </td>
              <td className="py-3 px-4 text-slate-700">
                {row.category === 'suppressed'
                  ? 'Suppressed bucket'
                  : row.category.replace('_', ' ')}
              </td>
              <td className="py-3 px-4 text-slate-700">
                {row.frequency === 'all'
                  ? 'All'
                  : row.frequency === 'suppressed'
                    ? 'Suppressed'
                    : row.frequency}
              </td>
              <td className="py-3 px-4 text-right text-slate-700">
                {row.declarationCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
