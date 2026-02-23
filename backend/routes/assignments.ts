import { Router } from 'express'

import {
  getStudentAssignments,
  getInstructorAssignmentsForCourse,
  createAssignmentForCourse,
} from '../controllers/assignmentsController.js'
import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { CAPABILITIES } from '../config/capabilities.js'
import { createAssignmentValidator } from '../validators/assignmentValidator.js'

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

router.post(
  '/api/instructor/:courseId/assignments',
  authenticate,
  requireCapability(CAPABILITIES['assignment:write:course']),
  ...createAssignmentValidator,
  validateRequest,
  createAssignmentForCourse,
)

export default router
