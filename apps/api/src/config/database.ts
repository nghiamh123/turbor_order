import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './index.js';
import { logger } from '../lib/logger.js';

// Fix: Use Google/Cloudflare DNS for SRV lookups (local router DNS often doesn't support SRV)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * Connect to MongoDB with Mongoose.
 * Supports both local MongoDB and MongoDB Atlas (SRV) connections.
 */
export async function connectDatabase(): Promise<void> {
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      logger.info(`🔌 Connecting to MongoDB... (attempt ${retries + 1}/${MAX_RETRIES})`);
      logger.debug(`URI: ${config.mongodb.uri.replace(/\/\/.*@/, '//<credentials>@')}`);

      await mongoose.connect(config.mongodb.uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });

      logger.info('✅ MongoDB connected successfully');
      return;
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) {
        logger.error('❌ MongoDB connection failed after all retries:', error);
        logger.error('💡 Check: 1) MONGODB_URI in .env  2) Network/VPN  3) Atlas IP whitelist (0.0.0.0/0 for dev)');
        process.exit(1);
      }
      logger.warn(`⚠️ Connection attempt ${retries} failed, retrying in 3s...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}

