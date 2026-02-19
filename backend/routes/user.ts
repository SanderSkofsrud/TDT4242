import { Router } from 'express'

import { authenticate } from '../middleware/authenticate.js'
import { CAPABILITIES } from '../config/capabilities.js'
import {
  register,
  login,
  acknowledgePrivacyNotice,
} from '../controllers/userController.js'
import { exportMyData } from '../controllers/exportController.js'
import { requireCapability } from '../middleware/rbac.js'

const router = Router()

router.post('/api/auth/register', register)

router.post('/api/auth/login', login)

router.post(
  '/api/auth/privacy-ack',
  authenticate,
  acknowledgePrivacyNotice,
)

router.get(
  '/api/user/export',
  authenticate,
  requireCapability(CAPABILITIES['data:export:own']),
  exportMyData,
)

export default router
