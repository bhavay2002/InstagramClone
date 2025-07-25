import { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export const validate = <T>(schema: ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Validation failed", errors: result.error.errors });
  req.body = result.data;
  next();
};