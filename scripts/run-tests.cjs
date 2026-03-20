const { spawnSync } = require('node:child_process')
const path = require('node:path')
const { generateCoverageReport } = require('./generate-coverage-report.cjs')

const rootDir = path.resolve(__dirname, '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const forwardedArgs = process.argv.slice(2)
const packages = ['backend', 'frontend']
const shouldGenerateCoverageReport = forwardedArgs.includes('--coverage')

function quoteWindowsArg(arg) {
  if (!/[\s"]/u.test(arg)) {
    return arg
  }

  return `"${arg.replace(/"/g, '\\"')}"`
}

function runNpm(args, cwd) {
  if (process.platform === 'win32') {
    const commandLine = [npmCommand, ...args]
      .map(quoteWindowsArg)
      .join(' ')

    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], {
      cwd,
      stdio: 'inherit',
    })
  }

  return spawnSync(npmCommand, args, {
    cwd,
    stdio: 'inherit',
  })
}

for (const pkg of packages) {
  const childArgs = ['run', 'test']
  if (forwardedArgs.length > 0) {
    childArgs.push('--', ...forwardedArgs)
  }

  const displayCommand =
    forwardedArgs.length > 0
      ? `npm run test -- ${forwardedArgs.join(' ')}`
      : 'npm run test'

  // Keep the root command simple and let each package own its test details.
  console.log(`[test] Running ${displayCommand} in ${pkg}`)

  const result = runNpm(childArgs, path.join(rootDir, pkg))

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }

  if (result.signal) {
    process.exit(1)
  }
}

if (shouldGenerateCoverageReport) {
  const reportPath = generateCoverageReport()
  console.log(`[coverage] Combined HTML report written to ${reportPath}`)
}
