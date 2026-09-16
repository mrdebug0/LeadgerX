import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

/**
 * Express middleware that validates req.body against a Zod schema.
 * Sanitizes input and rejects invalid payloads before processing in the DAL.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const error = result.error as ZodError;
        const formattedErrors = error.issues.map(issue => ({
          field: issue.path.join('.') || 'body',
          message: issue.message
        }));

        const errorMessage = formattedErrors
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');

        return res.status(400).json({
          success: false,
          error: `Validation error: ${errorMessage}`,
          details: formattedErrors
        });
      }

      // Assign sanitized and coerced data to req.body
      req.body = result.data;
      next();
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: `Invalid request payload: ${err.message || 'Malformed body'}`
      });
    }
  };
}
