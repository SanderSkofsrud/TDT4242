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
    return <p className="text-slate-600">No usage data to display.</p>
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 20px -2px rgba(79, 70, 229, 0.1)',
            }}
          />
          <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
