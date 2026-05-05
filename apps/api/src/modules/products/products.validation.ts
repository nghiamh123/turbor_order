import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().optional(),
  description: z.string().max(2000).optional(),
  category: z.string().optional(),
  costPrice: z.number().min(0).optional().default(0),
  sellingPrice: z.number().min(0),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional().default(10),
  unit: z.string().optional().default('cái'),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  isActive: z.coerce.boolean().optional().default(true),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
