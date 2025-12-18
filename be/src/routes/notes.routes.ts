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
const encodeContent = (content: string): string => {
    return Buffer.from(content).toString('base64');
};

const decodeContent = (encoded: string): string => {
    return Buffer.from(encoded, 'base64').toString('utf-8');
};

// Create secure note
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, content, category, isPinned } = req.body;

        if (!title || !content) {
            res.status(400).json({ error: 'Title and content are required' });
            return;
        }

        const note = await prisma.secureNote.create({
            data: {
                userId: req.user!.id,
                title,
                encryptedContent: encodeContent(content),
                category: category || null,
                isPinned: isPinned || false,
            },
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.NOTE_CREATE,
            entityType: 'SecureNote',
            entityId: note.id,
            details: { title },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json({
            ...note,
            content: content,
            encryptedContent: undefined,
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Get all notes
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, pinned } = req.query;

        const notes = await prisma.secureNote.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
                ...(category && { category: category as string }),
                ...(pinned === 'true' && { isPinned: true }),
            },
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' },
            ],
        });

        // Decode content for response
        const decodedNotes = notes.map(note => ({
            ...note,
            content: decodeContent(note.encryptedContent),
            encryptedContent: undefined,
            // Truncate content for list view
            contentPreview: decodeContent(note.encryptedContent).substring(0, 100),
        }));

        res.json(decodedNotes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to get notes' });
    }
});

// Get note categories - MUST BE BEFORE /:id route
router.get('/categories/list', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notes = await prisma.secureNote.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
            },
            select: { category: true },
        });

        const categories = [...new Set(notes.map(n => n.category).filter(Boolean))];
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get note stats - MUST BE BEFORE /:id route
router.get('/stats/summary', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notes = await prisma.secureNote.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
            },
        });

        const stats = {
            totalNotes: notes.length,
            pinnedNotes: notes.filter(n => n.isPinned).length,
            byCategory: {} as Record<string, number>,
        };

        notes.forEach(n => {
            const cat = n.category || 'Uncategorized';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        });

        res.json(stats);
    } catch (error) {
        console.error('Get note stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get note details
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const note = await prisma.secureNote.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.NOTE_VIEW,
            entityType: 'SecureNote',
            entityId: note.id,
            details: { title: note.title },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            ...note,
            content: decodeContent(note.encryptedContent),
            encryptedContent: undefined,
        });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: 'Failed to get note' });
    }
});

// Update note
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, content, category, isPinned } = req.body;

        const existing = await prisma.secureNote.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!existing) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        const updateData: Record<string, unknown> = {};
        if (title) updateData.title = title;
        if (content) updateData.encryptedContent = encodeContent(content);
        if (category !== undefined) updateData.category = category;
        if (isPinned !== undefined) updateData.isPinned = isPinned;

        const updated = await prisma.secureNote.update({
            where: { id: existing.id },
            data: updateData,
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.NOTE_UPDATE,
            entityType: 'SecureNote',
            entityId: updated.id,
            details: { title: updated.title },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            ...updated,
            content: decodeContent(updated.encryptedContent),
            encryptedContent: undefined,
        });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Toggle pin
router.patch('/:id/pin', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const note = await prisma.secureNote.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        const updated = await prisma.secureNote.update({
            where: { id: note.id },
            data: { isPinned: !note.isPinned },
        });

        res.json({
            ...updated,
            content: decodeContent(updated.encryptedContent),
            encryptedContent: undefined,
        });
    } catch (error) {
        console.error('Toggle pin error:', error);
        res.status(500).json({ error: 'Failed to toggle pin' });
    }
});

// Delete note
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const note = await prisma.secureNote.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
            },
        });

        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        // Soft delete
        await prisma.secureNote.update({
            where: { id: note.id },
            data: { isActive: false },
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.NOTE_DELETE,
            entityType: 'SecureNote',
            entityId: note.id,
            details: { title: note.title },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;
