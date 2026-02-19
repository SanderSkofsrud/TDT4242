import { Router } from 'express'
import type { Request } from 'express'
import multer from 'multer'

import { authenticate } from '../middleware/authenticate.js'
import { requireCapability } from '../middleware/rbac.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { CAPABILITIES } from '../config/capabilities.js'
import { policyValidator } from '../validators/policyValidator.js'
import { uploadPolicy } from '../controllers/policyController.js'

const router = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dest = process.env.POLICY_PDF_STORAGE_PATH ?? './uploads/policies'
    cb(null, dest)
  },
  filename: (_req, _file, cb) => {
    cb(null, `policy-upload-${Date.now()}.pdf`)
  },
})

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype !== 'application/pdf') {
    cb(new Error('Only PDF files are accepted'))
    return
  }
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
})

router.post(
  '/api/policy/upload',
  authenticate,
  requireCapability(CAPABILITIES['policy:write']),
  upload.single('file'),
  ...policyValidator,
  validateRequest,
  uploadPolicy,
)

export default router
