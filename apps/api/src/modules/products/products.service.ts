import { Product } from '../../models/index.js';
import { AppError } from '../../middleware/index.js';
import type { CreateProductRequest, UpdateProductRequest, ProductQueryParams } from '@turboorder/shared';
import type { FilterQuery } from 'mongoose';
import type { IProduct } from '../../models/Product.js';

/**
 * Product service — handles product business logic.
 */
export const productService = {
  /** List products with filters, search, pagination */
  async list(query: ProductQueryParams) {
    const { page = 1, limit = 20, search, category, stockStatus, isActive = true, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IProduct> = { isActive };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (stockStatus === 'out_of_stock') {
      filter.stock = 0;
    } else if (stockStatus === 'low_stock') {
      filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
    } else if (stockStatus === 'in_stock') {
      filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] };
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Product.find(filter).populate('category', 'name').sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /** Get single product by ID */
  async getById(id: string) {
    const product = await Product.findById(id).populate('category', 'name').lean();
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'errors.products.not_found');
    }
    return product;
  },

  /** Create new product, auto-generate SKU if not provided */
  async create(data: CreateProductRequest) {
    if (!data.sku) {
      data.sku = await this.generateSku();
    }

    const product = await Product.create(data);
    return product.toObject();
  },

  /** Update existing product */
  async update(id: string, data: UpdateProductRequest) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('category', 'name')
      .lean();

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'errors.products.not_found');
    }
    return product;
  },

  /** Toggle active status (soft delete) */
  async toggleStatus(id: string) {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'errors.products.not_found');
    }

    product.isActive = !product.isActive;
    await product.save();
    return product.toObject();
  },

  /** Generate next SKU: SP-0001, SP-0002, ... */
  async generateSku(): Promise<string> {
    const lastProduct = await Product.findOne({}, { sku: 1 }).sort({ sku: -1 }).lean();
    if (!lastProduct?.sku?.startsWith('SP-')) {
      return 'SP-0001';
    }
    const lastNum = parseInt(lastProduct.sku.replace('SP-', ''), 10);
    return `SP-${String(lastNum + 1).padStart(4, '0')}`;
  },

  /** Bulk delete products (hard delete) */
  async bulkDelete(ids: string[]) {
    const result = await Product.deleteMany({ _id: { $in: ids } });
    return { deleted: result.deletedCount };
  },
};
