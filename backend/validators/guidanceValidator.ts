import { body } from 'express-validator'

const ALLOWED_CATEGORIES = [
  'explanation',
  'structure',
  'rephrasing',
  'code_assistance',
] as const

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

  body('permittedCategories')
    .optional()
    .isArray({ max: 4 })
    .withMessage('permittedCategories must be an array with at most 4 items')
    .bail()
    .custom((value: unknown[]) =>
      value.every((item) => typeof item === 'string' && ALLOWED_CATEGORIES.includes(
        item as (typeof ALLOWED_CATEGORIES)[number],
      )),
    )
    .withMessage(
      'permittedCategories must contain only explanation, structure, rephrasing, or code_assistance',
    ),

  body('prohibitedCategories')
    .optional()
    .isArray({ max: 4 })
    .withMessage('prohibitedCategories must be an array with at most 4 items')
    .bail()
    .custom((value: unknown[]) =>
      value.every((item) => typeof item === 'string' && ALLOWED_CATEGORIES.includes(
        item as (typeof ALLOWED_CATEGORIES)[number],
      )),
    )
    .withMessage(
      'prohibitedCategories must contain only explanation, structure, rephrasing, or code_assistance',
    )
    .bail()
    .custom((value: unknown[], { req }) => {
      const permitted = (req.body?.permittedCategories ?? []) as string[]
      if (!Array.isArray(permitted)) return true
      const overlap = value.filter((item) => permitted.includes(item as string))
      if (overlap.length > 0) {
        throw new Error('Categories cannot be both permitted and prohibited')
      }
      return true
    }),

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
