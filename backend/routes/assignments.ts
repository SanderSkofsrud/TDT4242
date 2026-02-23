import { Router } from 'express'

import { getStudentAssignments } from '../controllers/assignmentsController.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { CAPABILITIES } from '../config/capabilities.js'

const router = Router()

router.get(
  '/api/assignments',
  authenticate,
  requireCapability(CAPABILITIES['assignment:read:own']),
  getStudentAssignments,
)

export default router
