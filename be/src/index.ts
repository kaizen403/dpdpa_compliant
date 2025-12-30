import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import dataRoutes from './routes/data.routes.js';
import consentRoutes from './routes/consent.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app: Express = express();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 10000;
const FRONTEND_PORT = 3000;

// Start Next.js frontend on internal port
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.resolve(process.cwd(), '../fe');
    const nextProcess = spawn('pnpm', ['start', '-p', String(FRONTEND_PORT)], {
        cwd: frontendPath,
        stdio: 'inherit',
        shell: true,
    });
    nextProcess.on('error', (err) => console.error('Frontend error:', err));
}

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());

// Make prisma available in routes
app.locals.prisma = prisma;

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/audit', auditRoutes);

// Error handling for API
app.use('/api', errorHandler);

// Proxy all other requests to Next.js frontend
if (process.env.NODE_ENV === 'production') {
    app.use('/', createProxyMiddleware({
        target: `http://localhost:${FRONTEND_PORT}`,
        changeOrigin: true,
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
