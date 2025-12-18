import { Router, Response } from 'express';
import { PrismaClient, AuditAction } from '../generated/prisma/client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get audit logs
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const {
            action,
            page = '1',
            limit = '20',
            startDate,
            endDate,
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 100);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            userId: req.user!.id,
        };

        if (action && Object.values(AuditAction).includes(action as AuditAction)) {
            where.action = action;
        }

        if (startDate) {
            where.timestamp = {
                ...where.timestamp,
                gte: new Date(startDate as string),
            };
        }

        if (endDate) {
            where.timestamp = {
                ...where.timestamp,
                lte: new Date(endDate as string),
            };
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Get audit log statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        const [byAction, recentCount, totalCount] = await Promise.all([
            // Count by action type
            prisma.auditLog.groupBy({
                by: ['action'],
                where: { userId: req.user!.id },
                _count: true,
            }),
            // Last 7 days count
            prisma.auditLog.count({
                where: {
                    userId: req.user!.id,
                    timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            // Total count
            prisma.auditLog.count({
                where: { userId: req.user!.id },
            }),
        ]);

        res.json({
            byAction: byAction.reduce((acc, item) => {
                acc[item.action] = item._count;
                return acc;
            }, {} as Record<string, number>),
            recentCount,
            totalCount,
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({ error: 'Failed to fetch audit statistics' });
    }
});

// Export audit logs
router.get('/export', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const format = (req.query.format as string) || 'json';

        const logs = await prisma.auditLog.findMany({
            where: { userId: req.user!.id },
            orderBy: { timestamp: 'desc' },
        });

        if (format === 'csv') {
            const { Parser } = await import('json2csv');
            const fields = [
                'id',
                'action',
                'entityType',
                'entityId',
                'ipAddress',
                'userAgent',
                'timestamp',
            ];
            const parser = new Parser({ fields });
            const csv = parser.parse(logs);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
            return res.send(csv);
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
        res.json({
            exportedAt: new Date().toISOString(),
            userId: req.user!.id,
            totalLogs: logs.length,
            logs,
        });
    } catch (error) {
        console.error('Export audit logs error:', error);
        res.status(500).json({ error: 'Failed to export audit logs' });
    }
});

// Get action types (for filtering)
router.get('/actions', async (req: AuthRequest, res: Response) => {
    res.json(Object.values(AuditAction));
});

export default router;
