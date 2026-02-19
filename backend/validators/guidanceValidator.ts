import { body } from 'express-validator'

export const guidanceValidator = [
  body('permittedText')
    .exists({ checkFalsy: true })
    .withMessage('permittedText is required')
    .bail()
    .isString()
    .withMessage('permittedText must be a string')
    .bail()
    .isLength({ max: 2000 })
    .withMessage('permittedText must be at most 2000 characters'),

  body('prohibitedText')
    .exists({ checkFalsy: true })
    .withMessage('prohibitedText is required')
    .bail()
    .isString()
    .withMessage('prohibitedText must be a string')
    .bail()
    .isLength({ max: 2000 })
    .withMessage('prohibitedText must be at most 2000 characters'),

  body('examples')
    .optional()
    .isObject()
    .withMessage('examples must be an object'),

  body('examples.permitted')
    .optional()
    .isArray({ max: 10 })
    .withMessage(
      'examples.permitted must be an array with at most 10 items',
    )
    .bail()
    .custom((value: unknown[]) =>
      value.every(
        (item) => typeof item === 'string' && item.length <= 500,
      ),
    )
    .withMessage(
      'Each examples.permitted item must be a string of at most 500 characters',
    ),

  body('examples.prohibited')
    .optional()
    .isArray({ max: 10 })
    .withMessage(
      'examples.prohibited must be an array with at most 10 items',
    )
    .bail()
    .custom((value: unknown[]) =>
      value.every(
        (item) => typeof item === 'string' && item.length <= 500,
      ),
    )
    .withMessage(
      'Each examples.prohibited item must be a string of at most 500 characters',
    ),
]
