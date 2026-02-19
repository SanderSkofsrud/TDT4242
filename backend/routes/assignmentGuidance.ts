import { Router } from 'express'

import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { CAPABILITIES } from '../config/capabilities.js'
import { guidanceValidator } from '../validators/guidanceValidator.js'
import {
  getGuidance,
  createGuidance,
  updateGuidance,
} from '../controllers/assignmentGuidanceController.js'

const router = Router()

router.get(
  '/api/assignments/:assignmentId/guidance',
  authenticate,
  requireCapability(CAPABILITIES['guidance:read']),
  getGuidance,
)

router.post(
  '/api/assignments/:assignmentId/guidance',
  authenticate,
  requireCapability(CAPABILITIES['guidance:write']),
  ...guidanceValidator,
  validateRequest,
  createGuidance,
)

router.put(
  '/api/assignments/:assignmentId/guidance',
  authenticate,
  requireCapability(CAPABILITIES['guidance:write']),
  ...guidanceValidator,
  validateRequest,
  updateGuidance,
)

export default router
