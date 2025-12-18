import { Router, Response } from 'express';
import { PrismaClient, DataCategory, AuditAction } from '../generated/prisma/client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all personal data
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { category, search } = req.query;

        const where: any = {
            userId: req.user!.id,
            isActive: true,
        };

        if (category && Object.values(DataCategory).includes(category as DataCategory)) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { fieldName: { contains: search as string, mode: 'insensitive' } },
                { fieldValue: { contains: search as string, mode: 'insensitive' } },
                { purpose: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const data = await prisma.personalData.findMany({
            where,
            include: {
                consents: {
                    where: { status: 'GRANTED' },
                    select: { id: true, status: true, purpose: true },
                },
            },
            orderBy: [
                { category: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.DATA_VIEW,
            entityType: 'PersonalData',
            details: { category: category || 'all', count: data.length },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json(data);
    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({ error: 'Failed to fetch personal data' });
    }
});

// Get data statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        const [totalData, byCategory, activeConsents, recentActivity] = await Promise.all([
            // Total data items
            prisma.personalData.count({
                where: { userId: req.user!.id, isActive: true },
            }),
            // Count by category
            prisma.personalData.groupBy({
                by: ['category'],
                where: { userId: req.user!.id, isActive: true },
                _count: true,
            }),
            // Active consents
            prisma.consent.count({
                where: { userId: req.user!.id, status: 'GRANTED' },
            }),
            // Recent audit entries
            prisma.auditLog.count({
                where: {
                    userId: req.user!.id,
                    timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);

        res.json({
            totalData,
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = item._count;
                return acc;
            }, {} as Record<string, number>),
            activeConsents,
            recentActivity,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get single data item
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { id } = req.params;

        const data = await prisma.personalData.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
            include: {
                consents: true,
            },
        });

        if (!data) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get data item error:', error);
        res.status(500).json({ error: 'Failed to fetch data item' });
    }
});

// Export all data (JSON or CSV)
router.get('/export/all', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const format = (req.query.format as string) || 'json';

        const data = await prisma.personalData.findMany({
            where: { userId: req.user!.id },
            include: {
                consents: {
                    select: { status: true, purpose: true, grantedAt: true },
                },
            },
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.DATA_EXPORT,
            entityType: 'PersonalData',
            details: { format, itemCount: data.length },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        if (format === 'csv') {
            const { Parser } = await import('json2csv');
            const fields = [
                'id',
                'category',
                'fieldName',
                'fieldValue',
                'purpose',
                'source',
                'dataController',
                'collectedAt',
                'retentionDays',
                'isActive',
            ];
            const parser = new Parser({ fields });
            const csv = parser.parse(data);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=datavault-export.csv');
            return res.send(csv);
        }

        // Default: JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=datavault-export.json');
        res.json({
            exportedAt: new Date().toISOString(),
            userId: req.user!.id,
            itemCount: data.length,
            data,
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Delete single data item (Right to Erasure)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { id } = req.params;

        const data = await prisma.personalData.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
        });

        if (!data) {
            return res.status(404).json({ error: 'Data not found' });
        }

        // Soft delete by marking inactive
        await prisma.personalData.update({
            where: { id },
            data: { isActive: false },
        });

        // Withdraw related consents
        await prisma.consent.updateMany({
            where: { personalDataId: id },
            data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.DATA_DELETE,
            entityType: 'PersonalData',
            entityId: id,
            details: { fieldName: data.fieldName, category: data.category },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'Data deleted successfully' });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

// Delete all data (Complete Right to Erasure)
router.delete('/delete-all/confirm', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        // Get count before deletion
        const count = await prisma.personalData.count({
            where: { userId: req.user!.id, isActive: true },
        });

        // Soft delete all data
        await prisma.personalData.updateMany({
            where: { userId: req.user!.id },
            data: { isActive: false },
        });

        // Withdraw all consents
        await prisma.consent.updateMany({
            where: { userId: req.user!.id },
            data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.DATA_DELETE,
            entityType: 'PersonalData',
            details: { type: 'complete_erasure', itemCount: count },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            message: 'All personal data deleted successfully',
            deletedCount: count,
        });
    } catch (error) {
        console.error('Delete all data error:', error);
        res.status(500).json({ error: 'Failed to delete all data' });
    }
});

export default router;
