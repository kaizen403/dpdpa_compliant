import { Router, Response } from 'express';
import { PrismaClient, ConsentStatus, AuditAction } from '../generated/prisma/client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../services/audit.service.js';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all consents
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { status } = req.query;

        const where: any = {
            userId: req.user!.id,
        };

        if (status && Object.values(ConsentStatus).includes(status as ConsentStatus)) {
            where.status = status;
        }

        const consents = await prisma.consent.findMany({
            where,
            include: {
                personalData: {
                    select: {
                        id: true,
                        fieldName: true,
                        category: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(consents);
    } catch (error) {
        console.error('Get consents error:', error);
        res.status(500).json({ error: 'Failed to fetch consents' });
    }
});

// Get consent statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        const stats = await prisma.consent.groupBy({
            by: ['status'],
            where: { userId: req.user!.id },
            _count: true,
        });

        const result = {
            GRANTED: 0,
            WITHDRAWN: 0,
            EXPIRED: 0,
            PENDING: 0,
        };

        stats.forEach((item) => {
            result[item.status] = item._count;
        });

        res.json(result);
    } catch (error) {
        console.error('Get consent stats error:', error);
        res.status(500).json({ error: 'Failed to fetch consent statistics' });
    }
});

// Get single consent
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { id } = req.params;

        const consent = await prisma.consent.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
            include: {
                personalData: true,
            },
        });

        if (!consent) {
            return res.status(404).json({ error: 'Consent not found' });
        }

        res.json(consent);
    } catch (error) {
        console.error('Get consent error:', error);
        res.status(500).json({ error: 'Failed to fetch consent' });
    }
});

// Withdraw consent
router.post('/:id/withdraw', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { id } = req.params;

        const consent = await prisma.consent.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
            include: {
                personalData: true,
            },
        });

        if (!consent) {
            return res.status(404).json({ error: 'Consent not found' });
        }

        if (consent.status === 'WITHDRAWN') {
            return res.status(400).json({ error: 'Consent already withdrawn' });
        }

        const updated = await prisma.consent.update({
            where: { id },
            data: {
                status: 'WITHDRAWN',
                withdrawnAt: new Date(),
            },
            include: {
                personalData: true,
            },
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.CONSENT_WITHDRAW,
            entityType: 'Consent',
            entityId: id,
            details: {
                purpose: consent.purpose,
                personalDataId: consent.personalDataId,
                fieldName: consent.personalData?.fieldName,
            },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            message: 'Consent withdrawn successfully',
            consent: updated,
        });
    } catch (error) {
        console.error('Withdraw consent error:', error);
        res.status(500).json({ error: 'Failed to withdraw consent' });
    }
});

// Grant consent
router.post('/:id/grant', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;
        const { id } = req.params;

        const consent = await prisma.consent.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
            include: {
                personalData: true,
            },
        });

        if (!consent) {
            return res.status(404).json({ error: 'Consent not found' });
        }

        if (consent.status === 'GRANTED') {
            return res.status(400).json({ error: 'Consent already granted' });
        }

        // Check if associated data is still active
        if (consent.personalData && !consent.personalData.isActive) {
            return res.status(400).json({
                error: 'Cannot grant consent for deleted data'
            });
        }

        const updated = await prisma.consent.update({
            where: { id },
            data: {
                status: 'GRANTED',
                grantedAt: new Date(),
                withdrawnAt: null,
            },
            include: {
                personalData: true,
            },
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.CONSENT_GRANT,
            entityType: 'Consent',
            entityId: id,
            details: {
                purpose: consent.purpose,
                personalDataId: consent.personalDataId,
                fieldName: consent.personalData?.fieldName,
            },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            message: 'Consent granted successfully',
            consent: updated,
        });
    } catch (error) {
        console.error('Grant consent error:', error);
        res.status(500).json({ error: 'Failed to grant consent' });
    }
});

// Withdraw all consents
router.post('/withdraw-all/confirm', async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        const result = await prisma.consent.updateMany({
            where: {
                userId: req.user!.id,
                status: 'GRANTED',
            },
            data: {
                status: 'WITHDRAWN',
                withdrawnAt: new Date(),
            },
        });

        // Audit log
        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.CONSENT_WITHDRAW,
            entityType: 'Consent',
            details: { type: 'withdraw_all', count: result.count },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            message: 'All consents withdrawn successfully',
            count: result.count,
        });
    } catch (error) {
        console.error('Withdraw all consents error:', error);
        res.status(500).json({ error: 'Failed to withdraw all consents' });
    }
});

export default router;
