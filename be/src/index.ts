import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

import authRoutes from './routes/auth.routes.js';
import dataRoutes from './routes/data.routes.js';
import consentRoutes from './routes/consent.routes.js';
import auditRoutes from './routes/audit.routes.js';
import filesRoutes from './routes/files.routes.js';
import passwordsRoutes from './routes/passwords.routes.js';
import notesRoutes from './routes/notes.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

// Create PostgreSQL connection using Prisma adapter
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 4000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for proxied frontend
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', globalLimiter);

app.use(express.json());

// Make prisma available in routes
app.locals.prisma = prisma;

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/audit', auditRoutes);

// Vault routes
app.use('/api/files', filesRoutes);
app.use('/api/passwords', passwordsRoutes);
app.use('/api/notes', notesRoutes);

// Error handling for API routes
app.use('/api', errorHandler);

// Proxy all non-API requests to Next.js frontend (for single-service deployment)
if (process.env.NODE_ENV === 'production') {
    app.use('/', createProxyMiddleware({
        target: `http://localhost:${FRONTEND_PORT}`,
        changeOrigin: true,
        ws: true,
    }));
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🔐 DataVault API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
