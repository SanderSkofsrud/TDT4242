import { Router } from 'express'

import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { CAPABILITIES } from '../config/capabilities.js'
import {
  getStudentDashboard,
  getInstructorCourses,
  getInstructorDashboard,
  getFacultyDashboard,
} from '../controllers/dashboardController.js'

const router = Router()

router.get(
  '/api/dashboard/student',
  authenticate,
  requireCapability(CAPABILITIES['dashboard:read:own']),
  getStudentDashboard,
)

router.get(
  '/api/dashboard/instructor-courses',
  authenticate,
  requireCapability(CAPABILITIES['dashboard:read:course_aggregate']),
  getInstructorCourses,
)

router.get(
  '/api/dashboard/instructor/:courseId',
  authenticate,
  requireCapability(CAPABILITIES['dashboard:read:course_aggregate']),
  getInstructorDashboard,
)

router.get(
  '/api/dashboard/faculty',
  authenticate,
  requireCapability(CAPABILITIES['dashboard:read:faculty_aggregate']),
  getFacultyDashboard,
)

export default router
