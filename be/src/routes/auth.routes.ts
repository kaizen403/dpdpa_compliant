import { Router, Response } from 'express';
import { PrismaClient, AuditAction } from '../generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
];

// Register
router.post('/register', registerValidation, async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const prisma = req.app.locals.prisma as PrismaClient;
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Create default personal data entries
        await createDefaultPersonalData(prisma, user.id, email, name);

        // Audit log
        await createAuditLog(prisma, {
            userId: user.id,
            action: AuditAction.LOGIN,
            entityType: 'User',
            entityId: user.id,
            details: { method: 'registration' },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', loginValidation, async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const prisma = req.app.locals.prisma as PrismaClient;
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Update last login activity data
        await updateLoginActivity(prisma, user.id, req);

        // Audit log
        await createAuditLog(prisma, {
            userId: user.id,
            action: AuditAction.LOGIN,
            entityType: 'User',
            entityId: user.id,
            details: { method: 'password' },
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        personalData: true,
                        consents: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Logout (client-side token removal, but we log it)
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const prisma = req.app.locals.prisma as PrismaClient;

        await createAuditLog(prisma, {
            userId: req.user!.id,
            action: AuditAction.LOGOUT,
            entityType: 'User',
            entityId: req.user!.id,
            ipAddress: req.ip || undefined,
            userAgent: req.headers['user-agent'],
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Helper: Create default personal data for new user
async function createDefaultPersonalData(
    prisma: PrismaClient,
    userId: string,
    email: string,
    name: string
) {
    const defaultData = [
        {
            category: 'IDENTITY' as const,
            fieldName: 'Full Name',
            fieldValue: name,
            purpose: 'Account identification and personalization',
            source: 'User Registration',
            dataController: 'DataVault Inc.',
            retentionDays: 365,
        },
        {
            category: 'CONTACT' as const,
            fieldName: 'Email Address',
            fieldValue: email,
            purpose: 'Account login and communication',
            source: 'User Registration',
            dataController: 'DataVault Inc.',
            retentionDays: 365,
        },
    ];

    for (const item of defaultData) {
        const personalData = await prisma.personalData.create({
            data: {
                ...item,
                userId,
            },
        });

        await prisma.consent.create({
            data: {
                userId,
                personalDataId: personalData.id,
                purpose: item.purpose,
                status: 'GRANTED',
                grantedAt: new Date(),
                expiresAt: new Date(Date.now() + item.retentionDays * 24 * 60 * 60 * 1000),
            },
        });
    }
}

// Helper: Update login activity
async function updateLoginActivity(
    prisma: PrismaClient,
    userId: string,
    req: AuthRequest
) {
    // Update or create last login entry
    const existingLogin = await prisma.personalData.findFirst({
        where: {
            userId,
            category: 'ACTIVITY',
            fieldName: 'Last Login',
        },
    });

    if (existingLogin) {
        await prisma.personalData.update({
            where: { id: existingLogin.id },
            data: { fieldValue: new Date().toISOString() },
        });
    } else {
        await prisma.personalData.create({
            data: {
                userId,
                category: 'ACTIVITY',
                fieldName: 'Last Login',
                fieldValue: new Date().toISOString(),
                purpose: 'Security monitoring and session management',
                source: 'System Generated',
                dataController: 'DataVault Inc.',
                retentionDays: 30,
            },
        });
    }

    // Update IP address
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    const existingIP = await prisma.personalData.findFirst({
        where: {
            userId,
            category: 'ACTIVITY',
            fieldName: 'IP Address',
        },
    });

    if (existingIP) {
        await prisma.personalData.update({
            where: { id: existingIP.id },
            data: { fieldValue: String(ip) },
        });
    }
}

export default router;
