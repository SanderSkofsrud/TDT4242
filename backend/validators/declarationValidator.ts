import { body } from 'express-validator'

export const declarationValidator = [
  body('assignmentId')
    .exists({ checkFalsy: true })
    .withMessage('assignmentId is required')
    .bail()
    .isUUID()
    .withMessage('assignmentId must be a valid UUID'),

  body('toolsUsed')
    .exists({ checkFalsy: true })
    .withMessage('toolsUsed is required')
    .bail()
    .isArray({ min: 1, max: 20 })
    .withMessage('toolsUsed must be a non-empty array with at most 20 items')
    .bail()
    .custom((value: unknown[]) => value.every(
      (item) => typeof item === 'string' && item.trim().length > 0,
    ))
    .withMessage('Each toolsUsed item must be a non-empty string'),

  body('categories')
    .exists({ checkFalsy: true })
    .withMessage('categories is required')
    .bail()
    .isArray({ min: 1 })
    .withMessage('categories must be a non-empty array')
    .bail()
    .custom((value: unknown[]) => {
      const allowed = [
        'explanation',
        'structure',
        'rephrasing',
        'code_assistance',
      ]
      return value.every(
        (item) => typeof item === 'string' && allowed.includes(item),
      )
    })
    .withMessage(
      'categories must contain only explanation, structure, rephrasing, or code_assistance',
    ),

  body('frequency')
    .exists({ checkFalsy: true })
    .withMessage('frequency is required')
    .bail()
    .isIn(['none', 'light', 'moderate', 'extensive'])
    .withMessage(
      'frequency must be one of none, light, moderate, extensive',
    ),

  body('contextText')
    .optional()
    .isString()
    .withMessage('contextText must be a string')
    .bail()
    .isLength({ max: 500 })
    .withMessage('contextText must be at most 500 characters'),
]
