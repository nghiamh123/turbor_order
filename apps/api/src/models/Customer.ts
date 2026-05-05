import mongoose, { Schema, type Document } from 'mongoose';
import type { CustomerTier } from '@turboorder/shared';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: {
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
  tier: CustomerTier;
  note?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      ward: { type: String, trim: true },
      district: { type: String, trim: true },
      city: { type: String, trim: true },
      location: {
        city: String,
        cityCode: String,
        district: String,
        districtCode: String,
        ward: String,
        wardCode: String,
      },
    },
    tier: {
      type: String,
      enum: ['new', 'regular', 'vip'],
      default: 'new',
    },
    note: { type: String, trim: true },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
CustomerSchema.index({ name: 'text', phone: 'text' });
CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ tier: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
