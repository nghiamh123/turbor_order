// ─── Shared Type Definitions ───
// Used by both frontend (React) and backend (Express) for type-safe API contracts.

// ─── Auth ───
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  locale: 'vi' | 'en';
}

// ─── Products ───
export interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  category?: Category;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  sellingPrice: number;
  images: string[];
  stock: number;
  lowStockThreshold: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  costPrice?: number;
  retailPrice: number;
  wholesalePrice: number;
  sellingPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  unit?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

// ─── Categories ───
export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

// ─── Customers ───
export interface CustomerAddress {
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  location?: {
    city?: string;
    cityCode?: string;
    district?: string;
    districtCode?: string;
    ward?: string;
    wardCode?: string;
  };
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: CustomerAddress;
  tier: CustomerTier;
  note?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: CustomerAddress;
  note?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

// ─── Orders ───
export interface OrderItem {
  product: string;
  productName: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
}

export interface StatusHistoryEntry {
  from: string | null;
  to: OrderStatus;
  changedAt: string;
  note: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name: string;
    phone: string;
  };
  shippingAddress?: CustomerAddress;
  items: OrderItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  note?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingFee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  discountType?: DiscountType;
  discountValue?: number;
  note?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingFee?: number;
}

// ─── Dashboard ───
export interface KpiMetric {
  current: number;
  previous: number;
  changePercent: number;
}

export interface DashboardOverviewParams {
  period?: DashboardPeriod | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface DashboardOverview {
  revenue: KpiMetric;
  profit: KpiMetric;
  shippingFee: KpiMetric;
  newOrders: KpiMetric;
  itemsSold: KpiMetric;
  newCustomers: KpiMetric;
}

// ... (existing DashboardPeriod type is at the bottom, I'll update it there too)

// ─── API Response ───
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Query Params ───
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderQueryParams extends PaginationParams {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface ProductQueryParams extends PaginationParams {
  search?: string;
  category?: string;
  stockStatus?: StockStatus;
  isActive?: boolean;
}

export interface CustomerQueryParams extends PaginationParams {
  search?: string;
  tier?: CustomerTier;
}

// ─── Enums as Types ───
export type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
export type DiscountType = 'percentage' | 'fixed' | null;
export type CustomerTier = 'new' | 'regular' | 'vip';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type DashboardPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';
export type Locale = 'vi' | 'en';
