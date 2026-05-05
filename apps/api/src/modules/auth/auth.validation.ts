import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('errors.validation.email_invalid'),
  password: z.string().min(8, 'errors.validation.password_min'),
});
