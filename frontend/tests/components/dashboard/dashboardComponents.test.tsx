import type { ReactNode } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

function serializeChartProps(props: Record<string, unknown>) {
  const { children: _children, ...rest } = props
  return JSON.stringify(rest)
}

function createChartStub(testId: string) {
  return function ChartStub(props: { children?: ReactNode } & Record<string, unknown>) {
    return (
      <div data-testid={testId} data-props={serializeChartProps(props)}>
        {props.children}
      </div>
    )
  }
}

vi.mock('recharts', () => ({
  ResponsiveContainer: createChartStub('responsive-container'),
  LineChart: createChartStub('line-chart'),
  BarChart: createChartStub('bar-chart'),
  CartesianGrid: createChartStub('cartesian-grid'),
  XAxis: createChartStub('x-axis'),
  YAxis: createChartStub('y-axis'),
  Tooltip: createChartStub('tooltip'),
  Legend: createChartStub('legend'),
  Line: ({ dataKey, name }: { dataKey: string; name?: string }) => (
    <div data-testid="line" data-key={dataKey} data-name={name ?? ''} />
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="bar" data-key={dataKey} />
  ),
}))

import { AggregateTable } from '../../../components/dashboard/AggregateTable.tsx'
import { AssignmentBreakdownTable } from '../../../components/dashboard/AssignmentBreakdownTable.tsx'
import { CategoryBreakdown } from '../../../components/dashboard/CategoryBreakdown.tsx'
import { CategoryTrendChart } from '../../../components/dashboard/CategoryTrendChart.tsx'
import { MonthlyBreakdownTable } from '../../../components/dashboard/MonthlyBreakdownTable.tsx'
import { MonthlyTrendChart } from '../../../components/dashboard/MonthlyTrendChart.tsx'
import { SuppressedNotice } from '../../../components/dashboard/SuppressedNotice.tsx'
import { UsageChart } from '../../../components/dashboard/UsageChart.tsx'

afterEach(() => {
  cleanup()
})

describe('dashboard components', () => {
  it('renders AggregateTable rows for instructor and faculty aggregates', () => {
    const { rerender } = render(
      <AggregateTable
        data={[
          {
            assignmentId: 'Essay 1',
            courseId: 'TDT4242',
            category: 'suppressed',
            frequency: 'suppressed',
            declarationCount: 5,
          },
        ]}
      />,
    )

    expect(screen.getByText('Essay 1')).toBeTruthy()
    expect(screen.getByText('Suppressed bucket')).toBeTruthy()
    expect(screen.getByText('Suppressed')).toBeTruthy()

    rerender(
      <AggregateTable
        data={[
          {
            courseId: 'TDT4242',
            facultyId: 'faculty-1',
            courseCode: 'TDT4242',
            courseName: 'Software Engineering',
            category: 'structure',
            frequency: 'all',
            declarationCount: 8,
          },
        ]}
      />,
    )

    expect(screen.getByText('TDT4242')).toBeTruthy()
    expect(screen.getByText('structure')).toBeTruthy()
    expect(screen.getByText('All')).toBeTruthy()
  })

  it('renders AssignmentBreakdownTable empty and populated states', () => {
    const { rerender } = render(<AssignmentBreakdownTable rows={[]} />)

    expect(screen.getByText('No assignment-level usage data yet.')).toBeTruthy()

    rerender(
      <AssignmentBreakdownTable
        rows={[
          {
            assignmentId: 'assignment-1',
            title: 'Essay 1',
            totalDeclarations: 4,
            byCategory: { explanation: 3 },
            byFrequency: {},
          },
        ]}
      />,
    )

    expect(screen.getByText('Essay 1')).toBeTruthy()
    expect(screen.getByText('explanation: 3')).toBeTruthy()
    expect(screen.getByText('No frequency data')).toBeTruthy()
  })

  it('renders CategoryBreakdown category and frequency tables', () => {
    render(
      <CategoryBreakdown
        byCategory={{ explanation: 2, structure: 1 }}
        byFrequency={{ light: 1, moderate: 2 }}
      />,
    )

    expect(screen.getByText('By category')).toBeTruthy()
    expect(screen.getByText('By frequency')).toBeTruthy()
    expect(screen.getByText('explanation')).toBeTruthy()
    expect(screen.getByText('moderate')).toBeTruthy()
  })

  it('renders CategoryTrendChart empty and populated states', () => {
    const { rerender } = render(<CategoryTrendChart data={[]} />)

    expect(screen.getByText('No category trend data to display.')).toBeTruthy()

    rerender(
      <CategoryTrendChart
        data={[
          {
            month: '2026-01',
            byCategory: { explanation: 2, structure: 1 },
          },
        ]}
      />,
    )

    const lineChartProps = JSON.parse(
      screen.getByTestId('line-chart').getAttribute('data-props') ?? '{}',
    ) as {
      data: Array<Record<string, string | number>>
    }

    expect(lineChartProps.data[0]).toEqual({
      month: '2026-01',
      explanation: 2,
      structure: 1,
      rephrasing: 0,
      code_assistance: 0,
    })
    expect(screen.getAllByTestId('line').length).toBe(4)
  })

  it('renders MonthlyBreakdownTable empty and populated states', () => {
    const { rerender } = render(<MonthlyBreakdownTable rows={[]} />)

    expect(screen.getByText('No monthly data available.')).toBeTruthy()

    rerender(
      <MonthlyBreakdownTable
        rows={[
          {
            month: '2026-01',
            totalDeclarations: 3,
            byCategory: {},
            byFrequency: { light: 2 },
          },
        ]}
      />,
    )

    expect(screen.getByText('2026-01')).toBeTruthy()
    expect(screen.getByText('No category data')).toBeTruthy()
    expect(screen.getByText('light: 2')).toBeTruthy()
  })

  it('renders MonthlyTrendChart empty and populated states', () => {
    const { rerender } = render(<MonthlyTrendChart data={[]} />)

    expect(screen.getByText('No monthly data to display.')).toBeTruthy()

    rerender(
      <MonthlyTrendChart
        data={[
          {
            month: '2026-01',
            totalDeclarations: 3,
          },
        ]}
      />,
    )

    const lineChartProps = JSON.parse(
      screen.getByTestId('line-chart').getAttribute('data-props') ?? '{}',
    ) as {
      data: Array<Record<string, string | number>>
    }

    expect(lineChartProps.data[0]).toEqual({
      month: '2026-01',
      totalDeclarations: 3,
    })
    expect(screen.getByTestId('line').getAttribute('data-key')).toBe(
      'totalDeclarations',
    )
  })

  it('renders the SuppressedNotice text', () => {
    render(<SuppressedNotice />)

    expect(
      screen.getByText(/Aggregate data is not available for this group/i),
    ).toBeTruthy()
  })

  it('renders UsageChart empty and populated states', () => {
    const { rerender } = render(<UsageChart byCategory={{}} />)

    expect(screen.getByText('No usage data to display.')).toBeTruthy()

    rerender(<UsageChart byCategory={{ explanation: 4, structure: 1 }} />)

    const barChartProps = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-props') ?? '{}',
    ) as {
      data: Array<Record<string, string | number>>
    }

    expect(barChartProps.data).toEqual([
      { name: 'explanation', count: 4 },
      { name: 'structure', count: 1 },
    ])
    expect(screen.getByTestId('bar').getAttribute('data-key')).toBe('count')
  })
})
