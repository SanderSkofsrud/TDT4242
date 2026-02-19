import express from 'express'
import noTelemetry from './middleware/noTelemetry.js'
import userRoutes from './routes/user.js'
import assignmentGuidanceRoutes from './routes/assignmentGuidance.js'
import declarationRoutes from './routes/declarations.js'
import feedbackRoutes from './routes/feedback.js'
import dashboardRoutes from './routes/dashboard.js'
import sharingRoutes from './routes/sharing.js'
import policyRoutes from './routes/policy.js'
import { scheduleRetentionCleanup } from './jobs/retentionCleanup.js'

const app = express()

// Core middleware
app.use(express.json())
app.use(noTelemetry)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(userRoutes)
app.use(assignmentGuidanceRoutes)
app.use(declarationRoutes)
app.use(feedbackRoutes)
app.use(dashboardRoutes)
app.use(sharingRoutes)
app.use(policyRoutes)

scheduleRetentionCleanup()

export { app }

const port = process.env.PORT ? Number(process.env.PORT) : 3000

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`)
  })
}
