interface CategoryBreakdownProps {
  byCategory: Record<string, number>
  byFrequency: Record<string, number>
}

export function CategoryBreakdown({ byCategory, byFrequency }: CategoryBreakdownProps) {
  const categoryRows = Object.entries(byCategory)
  const frequencyRows = Object.entries(byFrequency)

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div className="card" style={{ flex: '1 1 200px' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>By category</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Category
              </th>
              <th style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {categoryRows.map(([name, count]) => (
              <tr key={name}>
                <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>{name}</td>
                <td style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                  {count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ flex: '1 1 200px' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>By frequency</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Frequency
              </th>
              <th style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #ddd' }}>
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {frequencyRows.map(([name, count]) => (
              <tr key={name}>
                <td style={{ padding: '0.25rem', borderBottom: '1px solid #eee' }}>{name}</td>
                <td style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #eee' }}>
                  {count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
