const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'coverage')
const outputPath = path.join(outputDir, 'index.html')

const projects = [
  {
    id: 'backend',
    label: 'Backend',
    summaryPath: path.join(rootDir, 'backend', 'coverage', 'coverage-summary.json'),
    detailReportPath: '../backend/coverage/index.html',
  },
  {
    id: 'frontend',
    label: 'Frontend',
    summaryPath: path.join(rootDir, 'frontend', 'coverage', 'coverage-summary.json'),
    detailReportPath: '../frontend/coverage/index.html',
  },
]

const metrics = ['lines', 'statements', 'functions', 'branches']

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPercent(value) {
  return `${Number(value).toFixed(2)}%`
}

function formatCount(metric) {
  return `${metric.covered}/${metric.total}`
}

function getCoverageClass(percent) {
  if (percent >= 90) {
    return 'good'
  }

  if (percent >= 75) {
    return 'warn'
  }

  return 'bad'
}

function loadProjectCoverage(project) {
  if (!fs.existsSync(project.summaryPath)) {
    throw new Error(`Coverage summary not found for ${project.id}: ${project.summaryPath}`)
  }

  const summary = JSON.parse(fs.readFileSync(project.summaryPath, 'utf8'))
  const total = summary.total
  const files = Object.entries(summary)
    .filter(([filePath]) => filePath !== 'total')
    .map(([filePath, fileMetrics]) => ({
      absolutePath: filePath,
      displayPath: path.relative(rootDir, filePath).replace(/\\/g, '/'),
      metrics: fileMetrics,
    }))
    .sort((left, right) => {
      const pctDelta = left.metrics.lines.pct - right.metrics.lines.pct
      if (pctDelta !== 0) {
        return pctDelta
      }

      return left.displayPath.localeCompare(right.displayPath)
    })

  return {
    ...project,
    total,
    files,
  }
}

function buildCombinedTotal(projectReports) {
  const totals = {}

  for (const metricName of metrics) {
    const metricTotal = projectReports.reduce(
      (accumulator, projectReport) => {
        const metric = projectReport.total[metricName]

        accumulator.total += metric.total
        accumulator.covered += metric.covered
        accumulator.skipped += metric.skipped
        return accumulator
      },
      { total: 0, covered: 0, skipped: 0 },
    )

    totals[metricName] = {
      ...metricTotal,
      pct: metricTotal.total === 0 ? 100 : (metricTotal.covered / metricTotal.total) * 100,
    }
  }

  return totals
}

function renderMetricCells(source) {
  return metrics
    .map((metricName) => {
      const metric = source[metricName]
      return `<td class="${getCoverageClass(metric.pct)}" data-label="${escapeHtml(
        metricName[0].toUpperCase() + metricName.slice(1),
      )}">${formatPercent(metric.pct)}</td>`
    })
    .join('')
}

function renderSummaryCards(source) {
  return metrics
    .map((metricName) => {
      const metric = source[metricName]
      return `
        <article class="card">
          <h3>${escapeHtml(metricName)}</h3>
          <p class="percent ${getCoverageClass(metric.pct)}">${formatPercent(metric.pct)}</p>
          <p class="meta">${formatCount(metric)}</p>
        </article>
      `
    })
    .join('')
}

function renderProjectSection(projectReport) {
  const rows = projectReport.files
    .map(
      (fileReport) => `
        <tr>
          <td class="file" data-label="File">${escapeHtml(fileReport.displayPath)}</td>
          ${renderMetricCells(fileReport.metrics)}
        </tr>
      `,
    )
    .join('')

  return `
    <section class="project">
      <div class="section-header">
        <div>
          <h2>${escapeHtml(projectReport.label)}</h2>
          <p>${projectReport.files.length} files in coverage summary</p>
        </div>
        <a href="${escapeHtml(projectReport.detailReportPath)}">Open package HTML report</a>
      </div>
      <div class="cards">
        ${renderSummaryCards(projectReport.total)}
      </div>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Lines</th>
            <th>Statements</th>
            <th>Functions</th>
            <th>Branches</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `
}

function renderHtml(projectReports) {
  const combinedTotal = buildCombinedTotal(projectReports)
  const generatedAt = new Date().toISOString()
  const projectSections = projectReports.map(renderProjectSection).join('')
  const summaryTableRows = projectReports
    .map(
      (projectReport) => `
        <tr>
          <td data-label="Project">${escapeHtml(projectReport.label)}</td>
          ${renderMetricCells(projectReport.total)}
        </tr>
      `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Combined Test Coverage</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f1e8;
        --panel: #fffdf8;
        --ink: #1f2430;
        --muted: #655f56;
        --line: #d7cfc0;
        --good: #1d6b4f;
        --warn: #915f08;
        --bad: #a63f3f;
        --accent: #0f4c5c;
        --shadow: 0 18px 45px rgba(31, 36, 48, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(15, 76, 92, 0.14), transparent 24rem),
          linear-gradient(180deg, #f8f4ea 0%, var(--bg) 100%);
        color: var(--ink);
      }

      main {
        width: min(1200px, calc(100vw - 3rem));
        margin: 0 auto;
        padding: 3rem 0 4rem;
      }

      header {
        margin-bottom: 2rem;
      }

      h1,
      h2,
      h3 {
        margin: 0;
        font-weight: 700;
      }

      h1 {
        font-size: clamp(2rem, 4vw, 3.2rem);
        letter-spacing: -0.04em;
      }

      h2 {
        font-size: 1.5rem;
      }

      p {
        margin: 0;
        color: var(--muted);
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .card,
      .project,
      .summary-table {
        background: var(--panel);
        border: 1px solid rgba(215, 207, 192, 0.9);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }

      .card {
        padding: 1.25rem;
      }

      .card h3 {
        font-size: 0.95rem;
        text-transform: capitalize;
      }

      .percent {
        margin-top: 0.45rem;
        font-size: 2rem;
        font-weight: 700;
      }

      .meta {
        margin-top: 0.35rem;
        font-size: 0.95rem;
      }

      .summary-table,
      .project {
        padding: 1.5rem;
        margin-top: 1.5rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      a {
        color: var(--accent);
        text-decoration: none;
        font-weight: 600;
      }

      a:hover {
        text-decoration: underline;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.25rem;
        font-size: 0.95rem;
      }

      th,
      td {
        padding: 0.8rem 0.75rem;
        border-bottom: 1px solid var(--line);
        text-align: right;
        vertical-align: top;
      }

      th:first-child,
      td:first-child {
        text-align: left;
      }

      tbody tr:last-child td {
        border-bottom: 0;
      }

      .file {
        font-family: "Cascadia Code", Consolas, monospace;
        font-size: 0.9rem;
      }

      .good {
        color: var(--good);
      }

      .warn {
        color: var(--warn);
      }

      .bad {
        color: var(--bad);
      }

      @media (max-width: 860px) {
        main {
          width: min(100vw - 1.25rem, 1200px);
          padding-top: 1.5rem;
        }

        .summary-table,
        .project {
          padding: 1rem;
        }

        .section-header {
          flex-direction: column;
        }

        table,
        thead,
        tbody,
        th,
        td,
        tr {
          display: block;
        }

        thead {
          display: none;
        }

        tr {
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--line);
        }

        tbody tr:last-child {
          border-bottom: 0;
        }

        td {
          border-bottom: 0;
          padding: 0.2rem 0;
          text-align: left;
        }

        td::before {
          content: attr(data-label);
          display: inline-block;
          min-width: 6.5rem;
          color: var(--muted);
          font-weight: 600;
        }

        td.file::before {
          content: "File";
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p>Generated ${escapeHtml(generatedAt)}</p>
        <h1>Combined Test Coverage</h1>
        <p>Frontend and backend coverage summaries in one HTML document.</p>
      </header>

      <section class="summary-table">
        <h2>Combined Summary</h2>
        <div class="cards">
          ${renderSummaryCards(combinedTotal)}
        </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Lines</th>
              <th>Statements</th>
              <th>Functions</th>
              <th>Branches</th>
            </tr>
          </thead>
          <tbody>
            ${summaryTableRows}
          </tbody>
        </table>
      </section>

      ${projectSections}
    </main>
  </body>
</html>`
}

function generateCoverageReport() {
  const projectReports = projects.map(loadProjectCoverage)
  const html = renderHtml(projectReports)

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputPath, html, 'utf8')

  return outputPath
}

if (require.main === module) {
  const reportPath = generateCoverageReport()
  console.log(`[coverage] Combined HTML report written to ${reportPath}`)
}

module.exports = {
  generateCoverageReport,
}
