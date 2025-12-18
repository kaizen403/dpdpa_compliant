import { Router, Response } from 'express';
import { PrismaClient, AuditAction } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// Setup Prisma
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Simple encoding for demo (in production, use proper encryption)
const encodePassword = (password: string): string => {
    return Buffer.from(password).toString('base64');
};

const decodePassword = (encoded: string): string => {
    return Buffer.from(encoded, 'base64').toString('utf-8');
};

// Create password entry
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { websiteName, websiteUrl, username, password, notes, category } = req.body;

        if (!websiteName || !username || !password) {
            res.status(400).json({ error: 'Website name, username, and password are required' });
            return;
        }

        const passwordEntry = await prisma.passwordEntry.create({
            data: {
                userId: req.user!.id,
                websiteName,
                websiteUrl: websiteUrl || null,
                username,
                encryptedPassword: encodePassword(password),
                notes: notes || null,
                category: category || null,
            },
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.PASSWORD_CREATE,
            entityType: 'PasswordEntry',
            entityId: passwordEntry.id,
            details: { websiteName },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        // Return without the actual password
        res.status(201).json({
            ...passwordEntry,
            encryptedPassword: '********',
        });
    } catch (error) {
        console.error('Create password error:', error);
        res.status(500).json({ error: 'Failed to create password entry' });
    }
});

// Get all passwords (masked)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category } = req.query;

        const passwords = await prisma.passwordEntry.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
                ...(category && { category: category as string }),
            },
            orderBy: { createdAt: 'desc' },
        });

        // Mask passwords
        const maskedPasswords = passwords.map(p => ({
            ...p,
            encryptedPassword: '********',
        }));

        res.json(maskedPasswords);
    } catch (error) {
        console.error('Get passwords error:', error);
        res.status(500).json({ error: 'Failed to get passwords' });
    }
});

// Get password categories - MUST BE BEFORE /:id route
router.get('/categories/list', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const passwords = await prisma.passwordEntry.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
            },
            select: { category: true },
        });

        const categories = [...new Set(passwords.map(p => p.category).filter(Boolean))];
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get password stats - MUST BE BEFORE /:id route
router.get('/stats/summary', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const passwords = await prisma.passwordEntry.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
            },
        });

        const stats = {
            totalPasswords: passwords.length,
            byCategory: {} as Record<string, number>,
            recentlyUsed: passwords.filter(p => {
                if (!p.lastUsed) return false;
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return p.lastUsed > dayAgo;
            }).length,
        };

        passwords.forEach(p => {
            const cat = p.category || 'Uncategorized';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        });

        res.json(stats);
    } catch (error) {
        console.error('Get password stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get password details (decrypted) - requires explicit request
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { decrypt } = req.query;

        const password = await prisma.passwordEntry.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!password) {
            res.status(404).json({ error: 'Password entry not found' });
            return;
        }

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.PASSWORD_VIEW,
            entityType: 'PasswordEntry',
            entityId: password.id,
            details: { websiteName: password.websiteName, decrypted: !!decrypt },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        // Update last used
        await prisma.passwordEntry.update({
            where: { id: password.id },
            data: { lastUsed: new Date() },
        });

        if (decrypt === 'true') {
            res.json({
                ...password,
                password: decodePassword(password.encryptedPassword),
                encryptedPassword: undefined,
            });
        } else {
            res.json({
                ...password,
                encryptedPassword: '********',
            });
        }
    } catch (error) {
        console.error('Get password error:', error);
        res.status(500).json({ error: 'Failed to get password' });
    }
});

// Update password entry
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { websiteName, websiteUrl, username, password, notes, category } = req.body;

        const existing = await prisma.passwordEntry.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!existing) {
            res.status(404).json({ error: 'Password entry not found' });
            return;
        }

        const updateData: Record<string, unknown> = {};
        if (websiteName) updateData.websiteName = websiteName;
        if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
        if (username) updateData.username = username;
        if (password) updateData.encryptedPassword = encodePassword(password);
        if (notes !== undefined) updateData.notes = notes;
        if (category !== undefined) updateData.category = category;

        const updated = await prisma.passwordEntry.update({
            where: { id: existing.id },
            data: updateData,
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.PASSWORD_UPDATE,
            entityType: 'PasswordEntry',
            entityId: updated.id,
            details: { websiteName: updated.websiteName },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            ...updated,
            encryptedPassword: '********',
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Delete password entry
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const password = await prisma.passwordEntry.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
            },
        });

        if (!password) {
            res.status(404).json({ error: 'Password entry not found' });
            return;
        }

        // Soft delete
        await prisma.passwordEntry.update({
            where: { id: password.id },
            data: { isActive: false },
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.PASSWORD_DELETE,
            entityType: 'PasswordEntry',
            entityId: password.id,
            details: { websiteName: password.websiteName },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'Password entry deleted successfully' });
    } catch (error) {
        console.error('Delete password error:', error);
        res.status(500).json({ error: 'Failed to delete password' });
    }
});

export default router;
