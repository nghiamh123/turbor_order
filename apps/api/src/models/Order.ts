import mongoose, { Schema, type Document } from 'mongoose';
import type { OrderStatus, DiscountType } from '@turboorder/shared';

// ─── Sub-document interfaces ───
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IStatusHistory {
  from: string | null;
  to: string;
  changedAt: Date;
  note: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: {
    _id: mongoose.Types.ObjectId;
    name: string;
    phone: string;
  };
  shippingAddress?: {
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
  };
  items: IOrderItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  statusHistory: IStatusHistory[];
  note?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ───
const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main Order schema ───
const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    customer: {
      _id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      street: String,
      ward: String,
      district: String,
      city: String,
      location: {
        city: String,
        cityCode: String,
        district: String,
        districtCode: String,
        ward: String,
        wardCode: String,
      },
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    subtotal: { type: Number, required: true },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', null],
      default: null,
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['new', 'confirmed', 'shipping', 'completed', 'cancelled'],
      default: 'new',
    },
    statusHistory: [StatusHistorySchema],
    note: { type: String, trim: true },
    trackingNumber: { type: String },
    shippingCarrier: { type: String },
    shippingFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for querying and sorting
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'customer._id': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({
  orderNumber: 'text',
  'customer.name': 'text',
  'customer.phone': 'text',
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
