import { Router } from 'express'

import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { CAPABILITIES } from '../config/capabilities.js'
import { declarationValidator } from '../validators/declarationValidator.js'
import {
  submitDeclaration,
  getMyDeclarations,
  getDeclaration,
} from '../controllers/declarationController.js'

const router = Router()

router.post(
  '/api/declarations',
  authenticate,
  requireCapability(CAPABILITIES['declaration:write']),
  ...declarationValidator,
  validateRequest,
  submitDeclaration,
)

router.get(
  '/api/declarations',
  authenticate,
  requireCapability(CAPABILITIES['declaration:read:own']),
  getMyDeclarations,
)

router.get(
  '/api/declarations/:declarationId',
  authenticate,
  requireCapability(CAPABILITIES['declaration:read:own']),
  getDeclaration,
)

export default router
