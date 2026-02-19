import { Router } from 'express'

import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { CAPABILITIES } from '../config/capabilities.js'
import {
  getSharingStatus,
  revokeSharing,
  reinstateSharing,
} from '../controllers/sharingController.js'

const router = Router()

router.get(
  '/api/sharing/status',
  authenticate,
  requireCapability(CAPABILITIES['sharing:manage']),
  getSharingStatus,
)

router.post(
  '/api/sharing/revoke/:courseId',
  authenticate,
  requireCapability(CAPABILITIES['sharing:manage']),
  revokeSharing,
)

router.post(
  '/api/sharing/reinstate/:courseId',
  authenticate,
  requireCapability(CAPABILITIES['sharing:manage']),
  reinstateSharing,
)

export default router
