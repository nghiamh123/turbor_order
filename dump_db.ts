import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turboorder?replicaSet=rs0';

async function run() {
  console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
  await mongoose.connect(MONGODB_URI);
  
  const db = mongoose.connection.db;
  
  const customers = await db.collection('customers').find({}).toArray();
  const products = await db.collection('products').find({}).toArray();
  
  console.log('\n--- CUSTOMERS IN DB ---');
  console.log(JSON.stringify(customers.map(c => ({ name: c.name, phone: c.phone, tier: c.tier })), null, 2));
  
  console.log('\n--- PRODUCTS IN DB ---');
  console.log(JSON.stringify(products.map(p => ({ name: p.name, sku: p.sku, retailPrice: p.retailPrice })), null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
