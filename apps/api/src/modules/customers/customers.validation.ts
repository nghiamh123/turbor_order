import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^0\d{9}$/, 'errors.validation.phone_invalid'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    ward: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    location: z.object({
      city: z.string().optional(),
      cityCode: z.coerce.string().optional(),
      district: z.string().optional(),
      districtCode: z.coerce.string().optional(),
      ward: z.string().optional(),
      wardCode: z.coerce.string().optional(),
    }).optional(),
  }).optional(),
  note: z.string().max(500).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  tier: z.enum(['new', 'regular', 'vip']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
