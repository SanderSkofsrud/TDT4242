import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { AI_CATEGORIES } from '../../utils/constants'

interface CategoryTrendChartProps {
  data: Array<{
    month: string
    byCategory: Record<string, number>
  }>
}

export function CategoryTrendChart({ data }: CategoryTrendChartProps) {
  if (data.length === 0) {
    return <p className="text-slate-600">No category trend data to display.</p>
  }

  const chartData = data.map((row) => {
    const next: Record<string, number | string> = { month: row.month }
    for (const category of AI_CATEGORIES) {
      next[category.value] = row.byCategory[category.value] ?? 0
    }
    return next
  })

  const colors = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981']

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 20px -2px rgba(79, 70, 229, 0.1)',
            }}
          />
          <Legend />
          {AI_CATEGORIES.map((category, index) => (
            <Line
              key={category.value}
              type="monotone"
              dataKey={category.value}
              name={category.label}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
