import { body } from 'express-validator'

export const createAssignmentValidator = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('title is required')
    .bail()
    .isString()
    .withMessage('title must be a string')
    .bail()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('title must be between 1 and 255 characters'),

  body('dueDate')
    .exists({ checkFalsy: true })
    .withMessage('dueDate is required')
    .bail()
    .isISO8601({ strict: true })
    .withMessage('dueDate must be a valid ISO 8601 date (YYYY-MM-DD)'),
]
