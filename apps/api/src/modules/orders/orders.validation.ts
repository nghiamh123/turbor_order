import { z } from 'zod';

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1, 'Order must have at least one item'),
  discountType: z.enum(['percentage', 'fixed']).nullable().optional().default(null),
  discountValue: z.number().min(0).optional().default(0),
  note: z.string().max(1000).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'shipping', 'completed', 'cancelled']),
  note: z.string().max(500).optional().default(''),
  trackingNumber: z.string().max(100).optional(),
  shippingCarrier: z.string().max(100).optional(),
  shippingFee: z.number().min(0).optional(),
});

export const updateOrderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1, 'Order must have at least one item'),
  discountType: z.enum(['percentage', 'fixed']).nullable().optional().default(null),
  discountValue: z.number().min(0).optional().default(0),
  note: z.string().max(1000).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  from: z.string().optional(),
  to: z.string().optional(),
});
