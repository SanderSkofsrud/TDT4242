import { body } from 'express-validator'

export const policyValidator = [
  body('version')
    .exists({ checkFalsy: true })
    .withMessage('version is required')
    .bail()
    .isInt({ gt: 0 })
    .withMessage('version must be an integer greater than 0'),
]
