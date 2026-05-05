import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { authMiddleware, errorHandler } from './middleware/index.js';
import { logger } from './lib/logger.js';

// Module routes
import { authRoutes } from './modules/auth/auth.routes.js';
import { productRoutes } from './modules/products/products.routes.js';
import { customerRoutes } from './modules/customers/customers.routes.js';
import { orderRoutes } from './modules/orders/orders.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { categoryRoutes } from './modules/categories/categories.routes.js';

const app = express();

// ─── Global Middleware ───
app.use(helmet());
app.use(cors({
  origin: config.webUrl,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('short', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// ─── Health Check (no auth) ───
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// ─── Public Routes ───
app.use('/api/v1/auth', authRoutes);

// ─── Protected Routes ───
app.use('/api/v1/products', authMiddleware, productRoutes);
app.use('/api/v1/customers', authMiddleware, customerRoutes);
app.use('/api/v1/orders', authMiddleware, orderRoutes);
app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/v1/categories', authMiddleware, categoryRoutes);

// ─── Static files (uploads) ───
app.use('/uploads', express.static(config.upload.dir));

// ─── Error Handler (must be last) ───
app.use(errorHandler);

// ─── Start Server ───
async function start() {
  await connectDatabase();

  app.listen(config.port, () => {
    logger.info(`⚡ TurboOrder API running at http://localhost:${config.port}`);
    logger.info(`📖 Health check: http://localhost:${config.port}/api/v1/health`);
    logger.info(`🌍 Environment: ${config.env}`);
  });
}

// ─── Graceful Shutdown ───
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
