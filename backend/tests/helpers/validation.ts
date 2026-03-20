import { validationResult, type ValidationChain } from 'express-validator'

export async function getValidationMessages(
  validators: ValidationChain[],
  body: Record<string, unknown>,
): Promise<string[]> {
  const req = { body }

  for (const validator of validators) {
    await validator.run(req as never)
  }

  return validationResult(req as never)
    .array()
    .map((error) => String(error.msg))
}
