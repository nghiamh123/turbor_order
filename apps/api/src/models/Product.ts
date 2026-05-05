import mongoose, { Schema, type Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  description?: string;
  category?: mongoose.Types.ObjectId;
  costPrice: number;
  sellingPrice: number;
  images: string[];
  stock: number;
  lowStockThreshold: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    images: [{ type: String }],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    unit: {
      type: String,
      default: 'cái',
      trim: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for search and filtering
ProductSchema.index({ name: 'text', sku: 'text' });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1, stock: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
