// ─── Shared Constants ───
// Used by both frontend and backend for consistency.

/** Order status display configuration */
export const ORDER_STATUS = {
  new: { label: 'orders.status.new', color: '#1677FF' },
  confirmed: { label: 'orders.status.confirmed', color: '#722ED1' },
  shipping: { label: 'orders.status.shipping', color: '#FA8C16' },
  completed: { label: 'orders.status.completed', color: '#52C41A' },
  cancelled: { label: 'orders.status.cancelled', color: '#FF4D4F' },
} as const;

/** Valid order status transitions (state machine) */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Customer tier configuration */
export const CUSTOMER_TIER = {
  new: { label: 'customers.tier.new', color: '#1677FF', minOrders: 0 },
  regular: { label: 'customers.tier.regular', color: '#FA8C16', minOrders: 3 },
  vip: { label: 'customers.tier.vip', color: '#FAAD14', minOrders: 10 },
} as const;

/** Stock status thresholds */
export const STOCK_STATUS = {
  in_stock: { label: 'products.stock.in_stock', color: '#52C41A' },
  low_stock: { label: 'products.stock.low_stock', color: '#FAAD14' },
  out_of_stock: { label: 'products.stock.out_of_stock', color: '#FF4D4F' },
} as const;

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Default low stock threshold */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/** File upload limits */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGES_PER_PRODUCT = 5;

/** API versioning */
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

/** Supported locales */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export const DEFAULT_LOCALE = 'vi';
