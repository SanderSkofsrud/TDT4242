import { Router } from 'express'

import {
  getStudentAssignments,
  getInstructorAssignmentsForCourse,
} from '../controllers/assignmentsController.js'
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

router.get(
  '/api/instructor/:courseId/assignments',
  authenticate,
  requireCapability(CAPABILITIES['assignment:read:course']),
  getInstructorAssignmentsForCourse,
)

export default router
