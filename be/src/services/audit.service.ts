import { PrismaClient, AuditAction } from '../generated/prisma/client.js';

interface AuditLogData {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export async function createAuditLog(
    prisma: PrismaClient,
    data: AuditLogData
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                details: data.details,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging shouldn't break main operations
        console.error('Failed to create audit log:', error);
    }
}

export function getActionDescription(action: AuditAction): string {
    const descriptions: Record<AuditAction, string> = {
        DATA_VIEW: 'Viewed personal data',
        DATA_CREATE: 'Created personal data',
        DATA_UPDATE: 'Updated personal data',
        DATA_DELETE: 'Deleted personal data',
        DATA_EXPORT: 'Exported personal data',
        CONSENT_GRANT: 'Granted consent',
        CONSENT_WITHDRAW: 'Withdrew consent',
        LOGIN: 'Logged in',
        LOGOUT: 'Logged out',
        PROFILE_UPDATE: 'Updated profile',
        FILE_UPLOAD: 'Uploaded file',
        FILE_VIEW: 'Viewed file',
        FILE_DOWNLOAD: 'Downloaded file',
        FILE_DELETE: 'Deleted file',
        PASSWORD_CREATE: 'Created password entry',
        PASSWORD_VIEW: 'Viewed password entry',
        PASSWORD_UPDATE: 'Updated password entry',
        PASSWORD_DELETE: 'Deleted password entry',
        NOTE_CREATE: 'Created secure note',
        NOTE_VIEW: 'Viewed secure note',
        NOTE_UPDATE: 'Updated secure note',
        NOTE_DELETE: 'Deleted secure note',
    };

    return descriptions[action] || action;
}
