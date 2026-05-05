import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import dotenv from 'dotenv';
import { User, Category, Product, Customer } from './models/index.js';

// Fix: Use Google DNS for Atlas SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config({ path: '../../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turboorder?replicaSet=rs0';

/**
 * Seed script — populates MongoDB with initial data for development.
 * Run: pnpm --filter @turboorder/api seed
 */
async function seed() {
  console.log('🌱 Seeding database...');

  await mongoose.connect(MONGODB_URI);

  // Clean existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
  ]);

  // ─── Create admin user ───
  const hashedPassword = await bcrypt.hash('admin123456', 12);
  await User.create({
    email: 'admin@turboorder.com',
    password: hashedPassword,
    name: 'Admin',
    locale: 'vi',
  });
  console.log('  ✅ Admin user created (admin@turboorder.com / admin123456)');

  // ─── Create categories ───
  const categories = await Category.create([
    { name: 'Áo', description: 'Tất cả loại áo' },
    { name: 'Quần', description: 'Tất cả loại quần' },
    { name: 'Giày dép', description: 'Giày, dép, sandal' },
    { name: 'Phụ kiện', description: 'Túi, mũ, kính, thắt lưng' },
  ]);
  console.log(`  ✅ ${categories.length} categories created`);

  // ─── Create products ───
  const products = await Product.create([
    { name: 'Áo thun nam basic', sku: 'SP-0001', category: categories[0]._id, costPrice: 80000, sellingPrice: 150000, stock: 50, unit: 'cái' },
    { name: 'Áo sơ mi trắng', sku: 'SP-0002', category: categories[0]._id, costPrice: 120000, sellingPrice: 250000, stock: 30, unit: 'cái' },
    { name: 'Áo khoác hoodie', sku: 'SP-0003', category: categories[0]._id, costPrice: 180000, sellingPrice: 350000, stock: 20, unit: 'cái' },
    { name: 'Quần jean slim fit', sku: 'SP-0004', category: categories[1]._id, costPrice: 200000, sellingPrice: 400000, stock: 25, unit: 'cái' },
    { name: 'Quần short kaki', sku: 'SP-0005', category: categories[1]._id, costPrice: 100000, sellingPrice: 200000, stock: 40, unit: 'cái' },
    { name: 'Giày sneaker trắng', sku: 'SP-0006', category: categories[2]._id, costPrice: 400000, sellingPrice: 890000, stock: 15, unit: 'đôi' },
    { name: 'Dép quai ngang', sku: 'SP-0007', category: categories[2]._id, costPrice: 50000, sellingPrice: 120000, stock: 60, unit: 'đôi' },
    { name: 'Nón snapback', sku: 'SP-0008', category: categories[3]._id, costPrice: 60000, sellingPrice: 150000, stock: 35, unit: 'cái' },
    { name: 'Túi tote canvas', sku: 'SP-0009', category: categories[3]._id, costPrice: 80000, sellingPrice: 180000, stock: 8, lowStockThreshold: 10, unit: 'cái' },
    { name: 'Kính mát unisex', sku: 'SP-0010', category: categories[3]._id, costPrice: 150000, sellingPrice: 320000, stock: 0, unit: 'cái' },
  ]);
  console.log(`  ✅ ${products.length} products created`);

  // ─── Create customers ───
  const customers = await Customer.create([
    { name: 'Nguyễn Văn An', phone: '0901234567', email: 'an@email.com', address: { street: '123 Nguyễn Huệ', district: 'Quận 1', city: 'TP.HCM' }, tier: 'vip', totalOrders: 15, totalSpent: 5200000 },
    { name: 'Trần Thị Bình', phone: '0987654321', email: 'binh@email.com', address: { district: 'Quận 3', city: 'TP.HCM' }, tier: 'regular', totalOrders: 5, totalSpent: 1500000 },
    { name: 'Lê Văn Cường', phone: '0912345678', tier: 'new', totalOrders: 1, totalSpent: 350000 },
    { name: 'Phạm Thị Dung', phone: '0923456789', email: 'dung@email.com', address: { street: '45 Lý Tự Trọng', district: 'Quận 1', city: 'TP.HCM' }, tier: 'regular', totalOrders: 4, totalSpent: 2100000 },
    { name: 'Hoàng Minh Đức', phone: '0934567890', tier: 'new', totalOrders: 0, totalSpent: 0 },
  ]);
  console.log(`  ✅ ${customers.length} customers created`);

  await mongoose.disconnect();
  console.log('🎉 Seed completed!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
