import type { Request, Response, NextFunction } from 'express'
import { rename } from 'fs/promises'
import { resolve } from 'path'

import { uploadPolicyDocument, getCurrentPolicy } from '../models/policyDocument.js'
import { logAccess } from '../models/accessLog.js'
import { CAPABILITIES } from '../config/capabilities.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function uploadPolicy(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const versionRaw = req.body?.version
    const version = Number.parseInt(String(versionRaw), 10)

    if (!Number.isInteger(version) || version <= 0) {
      res.status(400).json({ error: 'Invalid policy version' })
      return
    }

    const currentPolicy = await getCurrentPolicy()
    if (currentPolicy && version <= currentPolicy.version) {
      res.status(409).json({
        error: 'Policy version must be greater than the current version',
      })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No PDF file was uploaded' })
      return
    }

    const basePath =
      process.env.POLICY_PDF_STORAGE_PATH ?? './uploads/policies'

    const finalFilePath = resolve(
      basePath,
      `policy-v${version}-${Date.now()}.pdf`,
    )

    // Move the file from the temporary multer name to the final name.
    await rename(req.file.path, finalFilePath)

    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const policy = await uploadPolicyDocument(finalFilePath, version, userId)

    res.status(201).json({
      version: policy.version,
      filePath: policy.file_path,
    })

    void logAccess(
      userId,
      CAPABILITIES['policy:write'],
      policy.id,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('uploadPolicy error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

