import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const list = errors.array().map((err) => ({
    field: err.path, // express-validator v7 uses `path` (the old code read `param`, which is undefined)
    message: err.msg,
  }));
  return res.status(400).json({
    success: false,
    message: list[0]?.message || 'Invalid input',
    errors: list,
  });
};
