import { Router } from 'express'

import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { CAPABILITIES } from '../config/capabilities.js'
import {
  getFeedback,
  getCurrentPolicyDocument,
} from '../controllers/feedbackController.js'

const router = Router()

router.get(
  '/api/declarations/:declarationId/feedback',
  authenticate,
  requireCapability(CAPABILITIES['declaration:read:own']),
  getFeedback,
)

router.get(
  '/api/policy/current',
  authenticate,
  getCurrentPolicyDocument,
)

export default router
