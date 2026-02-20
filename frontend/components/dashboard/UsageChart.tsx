import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface UsageChartProps {
  byCategory: Record<string, number>
}

export function UsageChart({ byCategory }: UsageChartProps) {
  const data = Object.entries(byCategory).map(([name, count]) => ({
    name,
    count,
  }))

  if (data.length === 0) {
    return <p>No usage data to display.</p>
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#333" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
