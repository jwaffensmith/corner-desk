import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

// Generic in P so Express keeps inferring route params from the path literal.
export function validate<T>(schema: ZodType<T>) {
  return <P>(req: Request<P>, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fields[issue.path.join(".") || "_"] = issue.message;
      }
      res.status(400).json({ error: { message: "Validation failed", fields } });
      return;
    }
    req.body = result.data;
    next();
  };
}
