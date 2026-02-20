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
    <div className="card">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
              Assignment
            </th>
            <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
              Category
            </th>
            <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
              Frequency
            </th>
            <th style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                {isInstructorRow(row) ? row.assignmentId : row.courseId}
              </td>
              <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                {row.category}
              </td>
              <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                {row.frequency}
              </td>
              <td style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                {row.declarationCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
