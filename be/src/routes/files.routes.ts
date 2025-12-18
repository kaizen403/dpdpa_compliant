import { Router, Response } from 'express';
import { PrismaClient, FileCategory, AuditAction } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../services/audit.service.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

const router = Router();

// Setup Prisma
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Allow common file types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/json',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit each IP to 10 file uploads per hour
    message: { error: 'Too many file uploads, please try again later.' }
});

// Upload file
router.post('/upload', authMiddleware, uploadLimiter, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { purpose, category } = req.body;

        if (!purpose) {
            // Delete uploaded file if purpose not provided
            fs.unlinkSync(req.file.path);
            res.status(400).json({ error: 'Purpose is required for DPDPA compliance' });
            return;
        }

        const fileCategory = (category as FileCategory) || 'OTHER';

        const secureFile = await prisma.secureFile.create({
            data: {
                userId: req.user!.id,
                fileName: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
                purpose,
                category: fileCategory,
                filePath: req.file.path,
            },
        });

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.FILE_UPLOAD,
            entityType: 'SecureFile',
            entityId: secureFile.id,
            details: { fileName: secureFile.originalName, category: fileCategory },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json(secureFile);
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get file stats - MUST BE BEFORE /:id route
router.get('/stats/summary', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const files = await prisma.secureFile.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
            },
        });

        const stats = {
            totalFiles: files.length,
            totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
            byCategory: {} as Record<string, number>,
        };

        files.forEach(file => {
            stats.byCategory[file.category] = (stats.byCategory[file.category] || 0) + 1;
        });

        res.json(stats);
    } catch (error) {
        console.error('Get file stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get all files for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category } = req.query;

        const files = await prisma.secureFile.findMany({
            where: {
                userId: req.user!.id,
                isActive: true,
                ...(category && { category: category as FileCategory }),
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Failed to get files' });
    }
});

// Get file details
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.secureFile.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.FILE_VIEW,
            entityType: 'SecureFile',
            entityId: file.id,
            details: { fileName: file.originalName },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json(file);
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});

// Download file
router.get('/:id/download', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.secureFile.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                isActive: true,
            },
        });

        if (!file || !file.filePath) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        if (!fs.existsSync(file.filePath)) {
            res.status(404).json({ error: 'File not found on disk' });
            return;
        }

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.FILE_DOWNLOAD,
            entityType: 'SecureFile',
            entityId: file.id,
            details: { fileName: file.originalName },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.download(file.filePath, file.originalName);
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Delete file
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await prisma.secureFile.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
            },
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Soft delete
        await prisma.secureFile.update({
            where: { id: file.id },
            data: { isActive: false },
        });

        // Optionally delete physical file
        if (file.filePath && fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.FILE_DELETE,
            entityType: 'SecureFile',
            entityId: file.id,
            details: { fileName: file.originalName },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
